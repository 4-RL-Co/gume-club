import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertOwner, assertAuthenticated, assertCanRecommendTo, visibleTo, type Viewer, type Visibility } from "@/lib/authz";
import {
  activities, follows, users, works, authors, libraryEntries, editions, recommendations,
} from "@/lib/db/schema";

/** Server only. Follows, the feed, and person-to-person recommendation. */

export const VERBS = ["started", "finished", "shelved", "rated", "reviewed", "recommended", "created_list"] as const;
export type Verb = (typeof VERBS)[number];

/**
 * Writes one line into the feed.
 *
 * `visibility` mirrors the row the activity is about, always. A private shelf
 * entry writes a private activity. If this ever defaults to public for a private
 * row, the feed becomes the leak: the row stays hidden and the activity announces
 * it anyway. See lib/authz.sql.test.ts, which proves it does not.
 *
 * `workId` é nulo só para "created_list": criar uma estante não fala de um
 * livro, fala da estante (`extra.collectionId`). Ver a migration 0068.
 */
export async function record(
  actorId: string,
  verb: Verb,
  workId: string | null,
  extra: {
    visibility?: Visibility;
    rating?: number | null;
    reviewId?: string | null;
    collectionId?: string | null;
    targetUserId?: string | null;
    note?: string | null;
    /**
     * O degrau que este livro fez a pessoa subir, se ele fez.
     *
     * Ele PEGA CARONA na atividade do livro, em vez de virar uma linha própria: "o Rui
     * terminou Dom Casmurro · virou Prata" é uma linha; "o Rui subiu para Prata" é um
     * mural de parabéns sem nada em que clicar. Ver a migration 0044.
     */
    honra?: string | null;
  } = {},
): Promise<void> {
  const values = {
    actorId,
    verb,
    workId,
    collectionId: extra.collectionId ?? null,
    visibility: extra.visibility ?? "public",
    rating: extra.rating ?? null,
    reviewId: extra.reviewId ?? null,
    targetUserId: extra.targetUserId ?? null,
    note: extra.note ?? null,
    honra: extra.honra ?? null,
  };

  if (extra.reviewId) {
    // Uma resenha, uma linha de feed, sempre. `saveReview()` chama record() a cada
    // salvamento (inclusive corrigindo uma vírgula), e sem o UPSERT aqui cada edição
    // empilhava uma cópia idêntica no feed de quem te segue. O upsert atualiza a
    // visibilidade e a nota no lugar, e deixa o `id` (e por isso a posição no feed,
    // que ordena por id e não por created_at) parado: consertar a resenha não
    // carimba "resenhou de novo" no topo do feed de ninguém. A trava é
    // `activities_review_unique`, migration 0068.
    await db
      .insert(activities)
      .values(values)
      .onConflictDoUpdate({
        target: activities.reviewId,
        targetWhere: sql`review_id is not null`,
        set: { visibility: values.visibility, note: values.note },
      });
    return;
  }

  await db.insert(activities).values(values);
}

// ─────────────────────────────────────────────────────────────── follows

/** Following is unilateral. A public shelf does not ask permission to be read. */
export async function follow(actor: { id: string }, followeeId: string): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });
  if (actor.id === followeeId) return; // following yourself is a no-op, not an error

  await db
    .insert(follows)
    .values({ followerId: actor.id, followeeId, state: "accepted" })
    .onConflictDoNothing();
}

export async function unfollow(actor: { id: string }, followeeId: string): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, actor.id), eq(follows.followeeId, followeeId)));
}

export async function isFollowing(viewerId: string, followeeId: string): Promise<boolean> {
  const [row] = await db
    .select({ n: sql<number>`1` })
    .from(follows)
    .where(and(
      eq(follows.followerId, viewerId),
      eq(follows.followeeId, followeeId),
      eq(follows.state, "accepted"),
    ))
    .limit(1);
  return Boolean(row);
}

// ────────────────────────────────────────────────────────────────── feed

export type FeedItem = {
  id: string;
  verb: string;
  /** Quem fez. Usado para buscar as insígnias (PAPEL), e nunca uma contagem. */
  actorId: string;
  createdAt: Date;
  rating: number | null;
  /** O degrau que este livro fez a pessoa subir, se fez. Nulo em quase toda linha. */
  honra: string | null;
  note: string | null;
  actorHandle: string;
  actorName: string | null;
  actorImage: string | null;
  targetHandle: string | null;
  /**
   * Nulos só em "created_list": aquela linha fala de uma ESTANTE, não de um livro.
   * Ver `collectionId` abaixo e a migration 0068.
   */
  workSlug: string | null;
  workTitle: string | null;
  author: string | null;
  coverUrl: string | null;
  /** Só em "reviewed". Quem quer o corpo, o upvote e o "quem votou" busca por
   * este id em lote, com `getResenhasPorId()` (lib/explore.ts) — a mesma
   * visibilidade é conferida de novo lá, e não só confiada nesta linha. */
  reviewId: string | null;
  /** Só em "created_list". A estante inteira (capas, nome, descrição) vem em
   * lote de `getListasPorId()` (lib/listas.ts), pelo mesmo motivo. */
  collectionId: string | null;
};

const PAGE = 30;

export type LivroAberto = {
  slug: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
};

/** Uma pessoa, e os livros que ela tem abertos agora. Um card por gente, não por livro. */
export type AmigoLendo = {
  handle: string;
  name: string | null;
  image: string | null;
  livros: LivroAberto[];
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE OS SEUS AMIGOS ESTÃO LENDO AGORA. Uma tira no topo do feed.
 *
 *  O feed conta o que já ACONTECEU (fulano terminou, fulano avaliou). Esta tira conta o
 *  que está ACONTECENDO: os livros abertos na mão de quem você segue, neste momento. É a
 *  pergunta que mais aproxima duas pessoas que leem ("você tá lendo o quê?"), e o app não
 *  respondia em lugar nenhum.
 *
 *  A mesma lei do feed: só quem você SEGUE, e a visibilidade filtrada no SQL por
 *  `visibleTo()`. Uma estante privada nunca sai do banco. Não é ranking, não é sugestão:
 *  é o que os seus amigos abriram, e nada mais.
 * ════════════════════════════════════════════════════════════════════
 */
export async function getAmigosLendo(viewer: Viewer): Promise<AmigoLendo[]> {
  assertAuthenticated(viewer);

  const rows = await db
    .select({
      handle: users.handle,
      name: users.displayName,
      image: users.image,
      slug: works.slug,
      title: works.title,
      author: authors.name,
      coverUrl: sql<string | null>`coalesce(${editions.coverUrl}, (
        select e.cover_url from editions e
        where e.work_id = ${works.id} and e.cover_url is not null
        order by e.created_at asc limit 1))`,
    })
    .from(libraryEntries)
    .innerJoin(users, eq(users.id, libraryEntries.userId))
    .innerJoin(works, eq(works.id, libraryEntries.workId))
    .leftJoin(authors, eq(authors.id, works.authorId))
    .leftJoin(editions, eq(editions.id, libraryEntries.editionId))
    .where(and(
      eq(libraryEntries.status, "reading"),
      sql`exists (
        select 1 from follows f
        where f.follower_id = ${viewer.id}::uuid
          and f.followee_id = ${libraryEntries.userId}
          and f.state = 'accepted'
      )`,
      visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility),
      sql`${users.deletedAt} is null`,
    ))
    .orderBy(desc(libraryEntries.addedAt))
    .limit(60);

  // Um card por PESSOA, e não por livro. Quem está lendo três aparece uma vez, com os três
  // empilhados. A ordem das pessoas é a de quem abriu um livro mais recentemente (as linhas
  // já vêm por added_at desc, então a primeira vez que uma pessoa aparece é a mais recente).
  const porPessoa = new Map<string, AmigoLendo>();
  for (const r of rows) {
    let p = porPessoa.get(r.handle);
    if (!p) {
      p = { handle: r.handle, name: r.name, image: r.image, livros: [] };
      porPessoa.set(r.handle, p);
    }
    if (p.livros.length < 4) {
      p.livros.push({ slug: r.slug, title: r.title, author: r.author, coverUrl: r.coverUrl });
    }
  }

  return [...porPessoa.values()].slice(0, 9);
}

/**
 * The chronological feed of the people you follow. No algorithm, no ranking, no
 * counters, no likes.
 *
 * Paged by cursor on the id, which is a uuidv7 and therefore sorts by time. An
 * OFFSET would skip or repeat rows as new activity lands mid-scroll; a cursor
 * cannot. Ask for ids strictly less than the last one you saw.
 *
 * The visibility filter is visibleTo(), in SQL, on the activity's own actor and
 * visibility columns. A private row never leaves the database.
 */
export async function getFeed(
  viewer: Viewer,
  cursor?: string | null,
): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  assertAuthenticated(viewer);

  const actor = sql`${activities.actorId}`;

  const rows = await db
    .select({
      id: activities.id,
      verb: activities.verb,
      actorId: activities.actorId,
      createdAt: activities.createdAt,
      rating: activities.rating,
      note: activities.note,
      honra: activities.honra,
      actorHandle: users.handle,
      actorName: users.displayName,
      // The face. A feed of people with no faces on it is a changelog.
      actorImage: users.image,
      targetHandle: sql<string | null>`(
        select u2.handle from users u2 where u2.id = ${activities.targetUserId}
      )`,
      // work_id é nulo em "created_list" (migration 0068): a linha fala de uma
      // estante, não de um livro. LEFT JOIN, e não INNER, ou a linha some do feed
      // inteiro nesse verbo.
      workSlug: works.slug,
      workTitle: works.title,
      author: authors.name,
      coverUrl: sql<string | null>`(
        select e.cover_url from editions e
        where e.work_id = ${works.id} and e.cover_url is not null
        order by e.created_at asc limit 1
      )`,
      reviewId: activities.reviewId,
      collectionId: activities.collectionId,
    })
    .from(activities)
    .innerJoin(users, eq(users.id, activities.actorId))
    .leftJoin(works, eq(works.id, activities.workId))
    .leftJoin(authors, eq(authors.id, works.authorId))
    .where(and(
      // only the people you follow. not "everyone", not "suggested for you".
      sql`exists (
        select 1 from follows f
        where f.follower_id = ${viewer.id}::uuid
          and f.followee_id = ${actor}
          and f.state = 'accepted'
      )`,
      visibleTo(viewer, activities.actorId, activities.visibility),
      cursor ? lt(activities.id, cursor) : undefined,
      sql`${users.deletedAt} is null`,
    ))
    .orderBy(desc(activities.id))
    .limit(PAGE + 1);

  const items = rows.slice(0, PAGE) as FeedItem[];
  const nextCursor = rows.length > PAGE ? (items[items.length - 1]?.id ?? null) : null;
  return { items, nextCursor };
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A PRAÇA. O que está acontecendo no Gume, entre gente que você não conhece.
 *
 *  O feed de amigos só mostra quem você já segue — e quem chega não segue ninguém.
 *  A primeira tela do app, para um recém-chegado, era um vazio educado dizendo "siga
 *  alguém". Como? A partir de onde?
 *
 *  A praça é a resposta: quem leu o quê, hoje, no Gume inteiro. É assim que se
 *  descobre gente — vendo alguém largar um livro que você amou, ou adorar um que você
 *  tem esperando na estante há dois anos.
 *
 *  ═══ E ELA NÃO É UM ALGORITMO ═══
 *
 *  Cronológica, e nada mais. Sem "sugerido para você", sem "em alta", sem engajamento,
 *  sem ordenação por popularidade. Quem acabou de fazer aparece em cima, e ponto.
 *
 *  Um feed ordenado por popularidade é uma máquina de fazer gente ler o que já é lido,
 *  e o Gume existe para o contrário disso. Ver ai/DECISIONS.md.
 *
 *  ═══ SÓ O QUE É PÚBLICO, E SÓ DE QUEM VOCÊ NÃO SEGUE ═══
 *
 *  DUAS travas, e as duas no SQL:
 *
 *    · `visibleTo()` — a mesma porta de sempre, que também é o que faz um banido sumir
 *      de todo lugar de uma vez. Ver lib/authz.ts.
 *    · `visibility = 'public'` — e este é o que importa aqui. "Quem me segue" quer
 *      dizer QUEM ME SEGUE; uma praça que mostrasse isso para estranhos transformaria
 *      uma escolha de privacidade em pegadinha.
 *
 *  E quem você já segue não aparece: aquilo é o feed de amigos, e repetir a mesma
 *  linha em duas telas não é descoberta.
 * ════════════════════════════════════════════════════════════════════
 */
export async function getPraca(
  viewer: Viewer,
  cursor?: string | null,
): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  assertAuthenticated(viewer);

  const actor = sql`${activities.actorId}`;

  const rows = await db
    .select({
      id: activities.id,
      verb: activities.verb,
      actorId: activities.actorId,
      createdAt: activities.createdAt,
      rating: activities.rating,
      note: activities.note,
      honra: activities.honra,
      actorHandle: users.handle,
      actorName: users.displayName,
      actorImage: users.image,
      targetHandle: sql<string | null>`(
        select u2.handle from users u2 where u2.id = ${activities.targetUserId}
      )`,
      // work_id é nulo em "created_list" (migration 0068). LEFT JOIN, e não
      // INNER, ou a linha some da praça inteira nesse verbo.
      workSlug: works.slug,
      workTitle: works.title,
      author: authors.name,
      coverUrl: sql<string | null>`(
        select e.cover_url from editions e
        where e.work_id = ${works.id} and e.cover_url is not null
        order by e.created_at asc limit 1
      )`,
      reviewId: activities.reviewId,
      collectionId: activities.collectionId,
    })
    .from(activities)
    .innerJoin(users, eq(users.id, activities.actorId))
    .leftJoin(works, eq(works.id, activities.workId))
    .leftJoin(authors, eq(authors.id, works.authorId))
    .where(and(
      // A porta de sempre. Ela é o que faz um banido sumir daqui junto com o resto.
      visibleTo(viewer, activities.actorId, activities.visibility),

      // E ESTA é a trava da praça. Uma linha "quem me segue" nunca é de praça pública:
      // isso seria transformar a escolha de privacidade de alguém numa pegadinha.
      eq(activities.visibility, "public"),

      // Você não descobre a si mesmo.
      sql`${actor} <> ${viewer.id}::uuid`,

      // Nem quem você já segue: aquilo é o feed de amigos, e a mesma linha em duas
      // telas não é descoberta, é eco.
      sql`not exists (
        select 1 from follows f
        where f.follower_id = ${viewer.id}::uuid
          and f.followee_id = ${actor}
          and f.state = 'accepted'
      )`,

      cursor ? lt(activities.id, cursor) : undefined,
      sql`${users.deletedAt} is null`,
    ))
    .orderBy(desc(activities.id))
    .limit(PAGE + 1);

  const items = rows.slice(0, PAGE) as FeedItem[];
  const nextCursor = rows.length > PAGE ? (items[items.length - 1]?.id ?? null) : null;
  return { items, nextCursor };
}

// ─────────────────────────────────────────────────────── recommendation

/**
 * One book, one person, one line of why.
 *
 * This is the only place in the codebase that writes a row belonging to someone
 * else, and it goes through assertCanRecommendTo() in lib/authz.ts, which permits
 * exactly this and nothing more. ON CONFLICT DO NOTHING means a recommendation
 * can never overwrite a book they already have: a nudge, never a nag.
 */
export async function recommend(
  viewer: Viewer,
  toUserId: string,
  workId: string,
  note: string | null,
): Promise<void> {
  assertCanRecommendTo(viewer, toUserId);

  const clean = note?.trim().slice(0, 280) || null;

  await db.transaction(async (tx) => {
    await tx
      .insert(recommendations)
      .values({ fromUserId: viewer.id, toUserId, workId, note: clean })
      .onConflictDoNothing();

    // It lands on their shelf, marked as having come from a PERSON. It never
    // overwrites: if the book is already there, we leave their row alone.
    await tx
      .insert(libraryEntries)
      .values({
        userId: toUserId,
        workId,
        status: "want_to_read",
        recommendedBy: viewer.id,
      })
      .onConflictDoNothing();

    await tx.insert(activities).values({
      actorId: viewer.id,
      verb: "recommended",
      workId,
      targetUserId: toUserId,
      note: clean,
      visibility: "public",
    });
  });
}

/** The people you follow, for the "recommend to" picker. You cannot recommend into the void. */
export async function getFollowees(viewerId: string) {
  return db
    .select({ id: users.id, handle: users.handle, displayName: users.displayName })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followeeId))
    .where(and(
      eq(follows.followerId, viewerId),
      eq(follows.state, "accepted"),
      sql`${users.deletedAt} is null`,
    ))
    .orderBy(users.handle);
}

/** Who recommended this book to me, if anyone. Shown on the shelf and the book page. */
export async function getRecommender(userId: string, workId: string) {
  const [row] = await db
    .select({
      handle: users.handle,
      displayName: users.displayName,
      image: users.image,
      note: recommendations.note,
    })
    .from(libraryEntries)
    .innerJoin(users, eq(users.id, libraryEntries.recommendedBy))
    .leftJoin(recommendations, and(
      eq(recommendations.toUserId, userId),
      eq(recommendations.workId, workId),
      eq(recommendations.fromUserId, libraryEntries.recommendedBy),
    ))
    .where(and(eq(libraryEntries.userId, userId), eq(libraryEntries.workId, workId)))
    .limit(1);
  return row ?? null;
}

/** A public profile, by handle. Null when there is nobody, or they are deleted. */
/**
 * O perfil de alguém.
 *
 * BANIDO NÃO TEM PERFIL: a consulta devolve null, e a página devolve 404. Não é uma
 * tela de "esta conta foi suspensa" — essa tela é um troféu para quem foi banido, e
 * um convite para quem quer discutir a moderação numa caixa de comentários que não
 * existe. Banido simplesmente não está aqui.
 *
 * `emailVerified` vem junto porque ele decide se este perfil é INDEXÁVEL. Não é um
 * detalhe de auth: com cadastro aberto, /@handle indexável sem verificação é uma
 * fazenda de SEO à espera de acontecer, e é o que SEMPRE acontece.
 */
export async function getProfile(handle: string) {
  const [row] = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      bio: users.bio,
      image: users.image,
      createdAt: users.createdAt,
      emailVerified: users.emailVerified,
      socialLinks: users.socialLinks,
    })
    .from(users)
    .where(and(
      eq(users.handle, handle),
      sql`${users.deletedAt} is null`,
      sql`${users.bannedAt} is null`,
    ))
    .limit(1);
  return row ?? null;
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  ACHAR UMA PESSOA PELO NOME OU PELO @.
 *
 *  O "explorar" mostra estantes para DESCOBRIR gente que você não conhece. Mas quem já
 *  sabe o nome — a esposa que acabou de criar conta e te seguiu — não quer descobrir: quer
 *  ACHAR. Sem uma busca de gente, a única forma de chegar num perfil era saber o @ exato e
 *  digitar na barra de endereço, o que ninguém faz.
 *
 *  ═══ O QUE ISTO REVELA, E O QUE NÃO ═══
 *
 *  Devolve nome, @ e a moldura — as três coisas que já aparecem em toda cara pública do
 *  app. Não devolve nada da estante: quem é privado aparece na lista (você acha a pessoa e
 *  a segue), mas o que ela leu continua atrás da porta que o perfil guarda. Achar alguém
 *  pelo nome não é ler a estante dela.
 *
 *  Bane e apagado ficam de fora, e você não aparece para si mesmo.
 * ════════════════════════════════════════════════════════════════════
 */
export type PessoaAchada = {
  id: string;
  handle: string;
  name: string | null;
  image: string | null;
  isPrivate: boolean;
  following: boolean;
};

export async function buscarPessoas(viewer: Viewer, termo: string): Promise<PessoaAchada[]> {
  assertAuthenticated(viewer);

  // Os curingas do ILIKE (%, _, \) saem do que a pessoa digitou: um nome não os contém, e
  // deixá-los passar transformaria a busca num padrão em vez de num nome.
  const limpo = termo.trim().replace(/[\\%_]/g, "");
  if (limpo.length < 2) return []; // uma letra casa com meio mundo, e não é uma busca

  const contem = `%${limpo}%`;
  const comeca = `${limpo}%`;

  const rows = await db.execute<{
    id: string; handle: string; name: string | null; image: string | null;
    is_private: boolean; following: boolean;
  }>(sql`
    select u.id,
           u.handle,
           u.display_name as name,
           u.image,
           u.is_private,
           exists(
             select 1 from follows f
              where f.follower_id = ${viewer!.id}::uuid and f.followee_id = u.id
           ) as following
      from users u
     where u.deleted_at is null
       and u.banned_at is null
       and u.id <> ${viewer!.id}::uuid
       and (u.handle ilike ${contem} or u.display_name ilike ${contem})
     -- Quem começa com o que você digitou vem primeiro: "ana" acha a @ana antes da @joana.
     order by (u.handle ilike ${comeca}) desc,
              coalesce(u.display_name, u.handle) asc
     limit 20`);

  return rows.map((r) => ({
    id: r.id,
    handle: r.handle,
    name: r.name,
    image: r.image,
    isPrivate: r.is_private,
    following: r.following,
  }));
}

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { limparNomeDeAutor } from "@/lib/autores";
import { assertOwner, assertAuthenticated, Forbidden, type Viewer, type Visibility } from "@/lib/authz";
import { slugify } from "@/lib/slug";
import { freeAuthorSlug } from "@/lib/library";
import { porNaLista } from "@/lib/listas";
import {
  works, editions, authors, libraryEntries, ownedCopies, revisions,
  collections, collectionItems,
} from "@/lib/db/schema";

/** Server only. Taking a book off the shelf, fixing the catalogue, shelves you invented, tags. */

// ──────────────────────────────────────────────── take it off the shelf

/**
 * Remove a book from your shelf. Everything you attached to it goes with it: the
 * rating, the review, the readings, the copy you own. It is your shelf, and
 * leaving orphans behind would be worse than deleting.
 */
export async function removeFromShelf(actor: { id: string }, workId: string): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });

  await db.transaction(async (tx) => {
    await tx.delete(libraryEntries)
      .where(and(eq(libraryEntries.userId, actor.id), eq(libraryEntries.workId, workId)));
    await tx.delete(ownedCopies)
      .where(and(eq(ownedCopies.userId, actor.id), eq(ownedCopies.workId, workId)));
    // ratings, reviews, readings and activities cascade from the entry / the user.
    await tx.execute(sql`
      delete from ratings where user_id = ${actor.id}::uuid and work_id = ${workId}::uuid`);
    await tx.execute(sql`
      delete from reviews where user_id = ${actor.id}::uuid and work_id = ${workId}::uuid`);
    await tx.execute(sql`
      delete from activities where actor_id = ${actor.id}::uuid and work_id = ${workId}::uuid`);
  });
}

// ────────────────────────────────────────────────── fix the catalogue

export type BookEdit = {
  title?: string;
  author?: string;
  firstPublished?: number | null;
  publisher?: string | null;
  publishedYear?: number | null;
  pageCount?: number | null;
  format?: string;
  isbn13?: string | null;
  coverUrl?: string | null;
};

/**
 * Anyone may fix any book in the catalogue. A wrong publisher on a shared record
 * is everybody's problem, and gatekeeping the fix behind a role means the record
 * stays wrong.
 *
 * That only works because nothing is overwritten in silence: every edit writes a
 * revision with the actor, the patch, and the fields exactly as they were. A bad
 * edit is trivially revertable because `previous` is sitting right there, and the
 * history has a name on it.
 *
 * The slug is NOT touched, ever. It is the book's public address, and correcting
 * a typo in a title must not break a link somebody saved.
 */
export async function editBook(
  viewer: Viewer,
  workId: string,
  editionId: string | null,
  edit: BookEdit,
  reason: string | null,
): Promise<void> {
  assertAuthenticated(viewer);

  await db.transaction(async (tx) => {
    const [work] = await tx.select().from(works).where(eq(works.id, workId)).limit(1);
    if (!work) throw new Error("obra não encontrada");

    // ── the work
    const workPatch: Record<string, unknown> = {};
    const workBefore: Record<string, unknown> = {};

    const title = edit.title?.trim();
    if (title && title !== work.title) {
      workBefore.title = work.title;
      workPatch.title = title;
    }
    if (edit.firstPublished !== undefined && edit.firstPublished !== work.firstPublished) {
      workBefore.firstPublished = work.firstPublished;
      workPatch.firstPublished = edit.firstPublished;
    }

    // ── the author. A new name is a new (or existing) author row, never an
    //    in-place rename: renaming would silently rewrite every other book by them.
    //
    // E o nome passa pelo PORTÃO (lib/autores.ts). Esta é a mão do bibliotecário: sem
    // ele, uma correção bem-intencionada — "esse livro é anônimo, deixa 'Desconhecido'"
    // — criaria uma PESSOA chamada Desconhecido, com página de autor, com estante e com
    // uma linha na estatística de nacionalidade. Uma etiqueta é pior que um nulo.
    const authorName = limparNomeDeAutor(edit.author);
    if (authorName) {
      const [current] = work.authorId
        ? await tx.select({ name: authors.name }).from(authors).where(eq(authors.id, work.authorId)).limit(1)
        : [];
      if (current?.name !== authorName) {
        const [row] = await tx
          .insert(authors)
          .values({ name: authorName, slug: await freeAuthorSlug(authorName) })
          .onConflictDoUpdate({ target: authors.name, set: { name: authorName } })
          .returning({ id: authors.id });
        workBefore.authorId = work.authorId;
        workPatch.authorId = row!.id;
      }
    }

    if (Object.keys(workPatch).length) {
      await tx.update(works).set(workPatch).where(eq(works.id, workId));
      await tx.insert(revisions).values({
        userId: viewer.id,
        targetType: "work",
        targetId: workId,
        patch: workPatch,
        previous: workBefore,
        reason,
      });
    }

    // ── the edition
    if (!editionId) return;
    const [edition] = await tx.select().from(editions).where(eq(editions.id, editionId)).limit(1);
    if (!edition) return;

    const edPatch: Record<string, unknown> = {};
    const edBefore: Record<string, unknown> = {};
    const fields: [keyof BookEdit, keyof typeof edition][] = [
      ["publisher", "publisher"],
      ["publishedYear", "publishedYear"],
      ["pageCount", "pageCount"],
      ["format", "format"],
      ["isbn13", "isbn13"],
      ["coverUrl", "coverUrl"],
    ];

    for (const [from, to] of fields) {
      const next = edit[from];
      if (next === undefined) continue;
      if (next !== edition[to]) {
        edBefore[to] = edition[to];
        edPatch[to] = next;
      }
    }

    if (Object.keys(edPatch).length) {
      await tx.update(editions).set(edPatch).where(eq(editions.id, editionId));
      await tx.insert(revisions).values({
        userId: viewer.id,
        targetType: "edition",
        targetId: editionId,
        patch: edPatch,
        previous: edBefore,
        reason,
      });
    }
  });
}

/** The edit history of a book. Public, with names on it: that is what makes open editing safe. */
export async function getHistory(workId: string, editionIds: string[]) {
  const ids = [workId, ...editionIds];
  return db
    .select({
      id: revisions.id,
      targetType: revisions.targetType,
      patch: revisions.patch,
      previous: revisions.previous,
      reason: revisions.reason,
      createdAt: revisions.createdAt,
      handle: sql<string | null>`(select u.handle from users u where u.id = ${revisions.userId})`,
    })
    .from(revisions)
    .where(sql`${revisions.targetId} = any(${sql.param(ids)}::uuid[])`)
    .orderBy(sql`${revisions.createdAt} desc`)
    .limit(20);
}

// ─────────────────────────────────────────────── shelves you invented

export async function createCollection(
  actor: { id: string },
  name: string,
  visibility: Visibility = "public",
): Promise<string | null> {
  assertOwner(actor as Viewer, { userId: actor.id });
  const clean = name.trim().slice(0, 60);
  if (!clean) return null;

  const base = slugify(clean);
  for (let n = 1; n < 50; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const [row] = await db
      .insert(collections)
      .values({ userId: actor.id, slug, name: clean, visibility })
      .onConflictDoNothing()
      .returning({ id: collections.id });
    if (row) return row.id;
  }
  return null;
}

export async function renameCollection(actor: { id: string }, id: string, name: string): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });
  const clean = name.trim().slice(0, 60);
  if (!clean) return;
  await db
    .update(collections)
    .set({ name: clean })
    .where(and(eq(collections.id, id), eq(collections.userId, actor.id)));
}

export async function deleteCollection(actor: { id: string }, id: string): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });
  // Deleting the shelf deletes the shelf, never the books on it.
  await db.delete(collections).where(and(eq(collections.id, id), eq(collections.userId, actor.id)));
}

export async function setCollectionVisibility(
  actor: { id: string },
  id: string,
  visibility: Visibility,
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });
  await db
    .update(collections)
    .set({ visibility })
    .where(and(eq(collections.id, id), eq(collections.userId, actor.id)));
}

/** Put a book on a shelf you invented, or take it off. Only your own shelves. */
export async function toggleInCollection(
  actor: { id: string },
  collectionId: string,
  workId: string,
  on: boolean,
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });

  const [own] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, actor.id)))
    .limit(1);
  if (!own) return; // not yours: nothing happens, and nothing is said

  if (on) {
    /**
     * ═══ O INSERT SAIU DAQUI, E FOI PARA lib/listas.ts ═══
     *
     * Ele gravava sem `position`, e o padrão da coluna é ZERO. Como a estante é
     * lida em `position asc`, e quem ordena a mão fica com 1, 2, 3, o livro
     * guardado por esta porta entrava com zero e PULAVA PARA O PRIMEIRO LUGAR,
     * por cima da curadoria da pessoa, calado.
     *
     * A regra do "entra no fim" agora mora num lugar só (`porNaLista`), porque
     * duas portas com duas regras de posição dariam uma estante que se ordena de
     * um jeito quando o livro entra pela página dele e de outro quando entra pela
     * página da estante.
     */
    await porNaLista(actor, collectionId, workId);
  } else {
    await db
      .delete(collectionItems)
      .where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.workId, workId)));
  }
}

/** Your shelves, for the sidebar. Another reader's public ones, for their profile. */
export async function getCollections(viewer: Viewer, ownerId: string) {
  const mine = viewer?.id === ownerId;
  return db
    .select({
      id: collections.id,
      slug: collections.slug,
      name: collections.name,
      visibility: collections.visibility,
      n: sql<number>`(
        select count(*)::int from collection_items ci where ci.collection_id = ${collections.id}
      )`,
    })
    .from(collections)
    .where(and(
      eq(collections.userId, ownerId),
      mine ? undefined : eq(collections.visibility, "public"),
    ))
    .orderBy(collections.createdAt);
}

// ─────────────────────────────────────────── the fast input, kept

/**
 * Type "para reler, do meu pai" and be done.
 *
 * This is what the tag had that was worth keeping: no ceremony, no create-then-
 * assign, just words. It creates the shelves that do not exist yet, puts the book
 * on all of them, and takes it off the ones you removed. New shelves born this
 * way are PRIVATE, because that is what a tag always was; you make one public
 * from its own page when you decide it is worth showing.
 */
export async function setShelvesByName(
  actor: { id: string },
  workId: string,
  raw: string,
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });

  const names = [...new Set(
    raw.split(",").map((t) => t.trim().slice(0, 60)).filter(Boolean),
  )].slice(0, 20);

  const mine = await db
    .select({ id: collections.id, name: collections.name })
    .from(collections)
    .where(eq(collections.userId, actor.id));

  /**
   * ════════════════════════════════════════════════════════════════════
   *  DUAS ESTANTES COM O MESMO NOME NÃO PODEM NASCER. NEM COM ACENTO A MENOS.
   *
   *  A tela agora OFERECE as estantes que existem, em vez de pedir que a pessoa digite o
   *  nome delas — porque digitar o nome de uma coisa que já existe é uma máquina de fazer
   *  duplicata ("para reler" e "pra reler" viram duas).
   *
   *  Mas a tela é uma sugestão, e o servidor é a porta. Um POST direto, um app futuro, ou
   *  a importação de uma planilha continuam entrando por aqui.
   *
   *  Isto casava por `toLowerCase()`, o que resolve a CAIXA e não resolve o ACENTO: "do
   *  meu pai" e "do meu paí" nasciam como duas estantes diferentes, e ninguém entendia por
   *  que os livros tinham sumido.
   *
   *  Agora a comparação ignora caixa E acento — a mesma regra da tela. O nome GRAVADO
   *  continua sendo o que a pessoa escreveu, com acento e maiúscula: quem casa é a chave,
   *  e não o rótulo.
   * ════════════════════════════════════════════════════════════════════
   */
  const chave = (s: string) =>
    s.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  const byName = new Map(mine.map((c) => [chave(c.name), c.id]));

  const wanted: string[] = [];
  for (const name of names) {
    let id = byName.get(chave(name));
    if (!id) {
      id = (await createCollection(actor, name, "private")) ?? undefined;
      if (id) byName.set(chave(name), id);
    }
    if (id) wanted.push(id);
  }

  await db.transaction(async (tx) => {
    // off the ones no longer named
    const keep = wanted.length ? wanted : ["00000000-0000-0000-0000-000000000000"];
    await tx.execute(sql`
      delete from collection_items ci
      using collections c
      where ci.collection_id = c.id
        and c.user_id = ${actor.id}::uuid
        and ci.work_id = ${workId}::uuid
        and ci.collection_id <> all(${sql.param(keep)}::uuid[])`);

    /**
     * E entra no FIM de cada estante, uma posição por estante.
     *
     * Isto gravava sem `position`, e o padrão da coluna é ZERO: o livro digitado
     * aqui pulava para o primeiro lugar de toda estante nomeada, por cima da
     * ordem que a pessoa tinha montado a mão. Mesmo bug de `toggleInCollection`,
     * e a mesma regra conserta os dois. Ver `porNaLista`, em lib/listas.ts.
     *
     * Não dá para chamar `porNaLista` aqui: isto roda dentro de uma transação, e
     * a função abre a própria conexão. A regra é a mesma, escrita no SQL desta
     * transação, e o teste de lib/colecoes.test.ts exige que ela continue sendo.
     */
    if (wanted.length) {
      await tx.execute(sql`
        insert into collection_items (collection_id, work_id, position)
        select c.id,
               ${workId}::uuid,
               coalesce((select max(ci.position) from collection_items ci
                          where ci.collection_id = c.id), 0) + 1
          from collections c
         where c.id = any(${sql.param(wanted)}::uuid[])
           and c.user_id = ${actor.id}::uuid
        on conflict (collection_id, work_id) do nothing`);
    }
  });
}

/** Which of my shelves this book is on. Used to prefill the fast input. */
export async function getShelvesOf(userId: string, workId: string): Promise<string[]> {
  const rows = await db
    .select({ name: collections.name })
    .from(collectionItems)
    .innerJoin(collections, eq(collections.id, collectionItems.collectionId))
    .where(and(eq(collections.userId, userId), eq(collectionItems.workId, workId)))
    .orderBy(collections.name);
  return rows.map((r) => r.name);
}

/** WHICH copy am I reading. Page counts differ; the shelf cover depends on it. */
export async function setMyEdition(
  actor: { id: string },
  workId: string,
  editionId: string | null,
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });

  await db
    .update(libraryEntries)
    .set({ editionId })
    .where(and(eq(libraryEntries.userId, actor.id), eq(libraryEntries.workId, workId)));

  // if they own a copy, the copy they own is that edition too
  await db
    .update(ownedCopies)
    .set({ editionId })
    .where(and(eq(ownedCopies.userId, actor.id), eq(ownedCopies.workId, workId)));
}

/** Take several books off the shelf at once. One confirm, not twenty. */
export async function removeManyFromShelf(
  actor: { id: string },
  workIds: string[],
): Promise<number> {
  assertOwner(actor as Viewer, { userId: actor.id });
  if (workIds.length === 0) return 0;

  for (const workId of workIds.slice(0, 500)) {
    await removeFromShelf(actor, workId);
  }
  return Math.min(workIds.length, 500);
}

// ──────────────────────────────────────────────────────── desfazer

/**
 * O retrato de um livro na SUA estante, antes de ele sair dela.
 *
 * Tirar um livro apaga a linha da estante, a nota, a resenha e a procedência. Um
 * "desfazer" que devolvesse só a linha e perdesse a resenha seria um desfazer
 * mentiroso, e mentiroso é pior que inexistente: a pessoa confia, clica, e só
 * descobre a perda meses depois. Então a gente fotografa tudo antes de apagar.
 */
export type ShelfSnapshot = {
  workId: string;
  status: string;
  visibility: string;
  editionId: string | null;
  recommendedBy: string | null;
  rating: number | null;
  reviewBody: string | null;
  reviewVisibility: string | null;
  ownedEditionId: string | null;
  acquiredNote: string | null;
}[];

export async function snapshotShelf(
  actor: { id: string },
  workIds: string[],
): Promise<ShelfSnapshot> {
  assertOwner(actor as Viewer, { userId: actor.id });
  if (workIds.length === 0) return [];

  const rows = await db.execute<ShelfSnapshot[number]>(sql`
    select
      le.work_id            as "workId",
      le.status::text       as "status",
      le.visibility::text   as "visibility",
      le.edition_id         as "editionId",
      le.recommended_by     as "recommendedBy",
      r.value               as "rating",
      rv.body               as "reviewBody",
      rv.visibility::text   as "reviewVisibility",
      oc.edition_id         as "ownedEditionId",
      oc.acquired_note      as "acquiredNote"
    from library_entries le
    left join ratings r  on r.user_id = le.user_id and r.work_id = le.work_id
    left join reviews rv on rv.user_id = le.user_id and rv.work_id = le.work_id
                        and rv.deleted_at is null
    left join owned_copies oc on oc.user_id = le.user_id and oc.work_id = le.work_id
    where le.user_id = ${actor.id}::uuid
      and le.work_id = any(${sql.param(workIds)}::uuid[])`);

  return rows as ShelfSnapshot;
}

/** Devolve à estante exatamente o que saiu dela: prateleira, nota, resenha, procedência. */
export async function restoreShelf(
  actor: { id: string },
  snapshot: ShelfSnapshot,
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });
  if (snapshot.length === 0) return;

  await db.transaction(async (tx) => {
    for (const s of snapshot.slice(0, 500)) {
      await tx.execute(sql`
        insert into library_entries (user_id, work_id, status, visibility, edition_id, recommended_by)
        values (${actor.id}::uuid, ${s.workId}::uuid, ${s.status}::shelf_status,
                ${s.visibility}::visibility, ${s.editionId}, ${s.recommendedBy})
        on conflict (user_id, work_id) do nothing`);

      if (s.rating !== null) {
        await tx.execute(sql`
          insert into ratings (user_id, work_id, value)
          values (${actor.id}::uuid, ${s.workId}::uuid, ${s.rating})
          on conflict (user_id, work_id) do update set value = excluded.value`);
      }

      if (s.reviewBody) {
        await tx.execute(sql`
          insert into reviews (user_id, work_id, body, visibility)
          values (${actor.id}::uuid, ${s.workId}::uuid, ${s.reviewBody},
                  ${s.reviewVisibility ?? "private"}::visibility)`);
      }

      if (s.ownedEditionId || s.acquiredNote) {
        await tx.execute(sql`
          insert into owned_copies (user_id, work_id, edition_id, acquired_note)
          values (${actor.id}::uuid, ${s.workId}::uuid, ${s.ownedEditionId}, ${s.acquiredNote})
          on conflict do nothing`);
      }
    }
  });
}

/**
 * Prateleirar vários de uma vez. O "escolher vários" existia e não fazia nada
 * além de apagar: marcar quarenta livros como lidos, um a um, é a mesma punição
 * que apagá-los um a um.
 */
export async function setStatusMany(
  actor: { id: string },
  workIds: string[],
  status: string,
): Promise<number> {
  assertOwner(actor as Viewer, { userId: actor.id });
  if (workIds.length === 0) return 0;

  const ids = workIds.slice(0, 500);

  await db.execute(sql`
    update library_entries
       set status = ${status}::shelf_status, status_at = now()
     where user_id = ${actor.id}::uuid
       and work_id = any(${sql.param(ids)}::uuid[])`);

  /**
   * "Lido" sem data de término não conta em lugar nenhum: as estatísticas leem a
   * LEITURA, e não o status.
   *
   * E isto tem que ser atômico. O "insere onde não existe" parece atômico e não
   * é: duas requisições ao mesmo tempo (um duplo clique, uma aba repetida, o
   * navegador reenviando o POST) enxergam as duas que não existe leitura, e as
   * duas inserem. Um teste disparando vinte em paralelo criava SEIS leituras, e
   * o ano passava a dizer que você leu seis livros onde havia um.
   *
   * A trava é na linha da estante: `for update` faz a segunda requisição esperar
   * a primeira terminar e reavaliar o `not exists`, que aí já é falso.
   */
  if (status === "read") {
    await db.transaction(async (tx) => {
      await tx.execute(sql`
        select id from library_entries
         where user_id = ${actor.id}::uuid
           and work_id = any(${sql.param(ids)}::uuid[])
         for update`);

      await tx.execute(sql`
        insert into readings (entry_id, finished_on)
        select le.id, current_date
          from library_entries le
         where le.user_id = ${actor.id}::uuid
           and le.work_id = any(${sql.param(ids)}::uuid[])
           and not exists (
             select 1 from readings r
              where r.entry_id = le.id and r.finished_on is not null)`);
    });
  }

  return ids.length;
}

/** Jogar vários numa estante inventada de uma vez. */
export async function addManyToCollection(
  actor: { id: string },
  collectionId: string,
  workIds: string[],
): Promise<number> {
  assertOwner(actor as Viewer, { userId: actor.id });
  if (workIds.length === 0) return 0;

  // A estante tem que ser SUA. Sem isto, um id de estante alheia enfiaria livros
  // na coleção de outra pessoa: é o buraco clássico, e ele mora aqui.
  const [owned] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, actor.id)))
    .limit(1);
  if (!owned) throw new Forbidden("essa estante não é sua");

  const ids = workIds.slice(0, 500);

  /**
   * NO FIM DA ESTANTE, E NA ORDEM EM QUE VIERAM.
   *
   * O `with ordinality` numera as linhas do array (1, 2, 3...), e cada uma soma
   * esse número ao maior que já existe. Sem isto, os cinquenta livros de uma
   * importação entravam TODOS com posição zero, empilhados em cima da curadoria
   * de quem já tinha ordenado a estante, e a ordem entre eles virava sorteio.
   *
   * Livro repetido não entra e deixa um buraco na numeração. Buraco não faz mal:
   * a leitura é `order by position asc`, e ela não pede números seguidos.
   */
  await db.execute(sql`
    insert into collection_items (collection_id, work_id, position)
    select ${collectionId}::uuid,
           x.id,
           coalesce((select max(ci.position) from collection_items ci
                      where ci.collection_id = ${collectionId}::uuid), 0) + x.n
      from unnest(${sql.param(ids)}::uuid[]) with ordinality as x(id, n)
    on conflict do nothing`);

  return ids.length;
}

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Casamento } from "@/lib/import/tipos";
import { assertOwner, type Viewer } from "@/lib/authz";
import { dataDeLeitura, hoje as hojeNoCalendario } from "@/lib/datas";
import { limparNomeDeAutor } from "@/lib/autores";
import { slugify, authorSlug } from "@/lib/slug";
import type { Hit } from "@/lib/catalog";
import {
  authors, works, editions, identifiers, libraryEntries, ownedCopies,
} from "@/lib/db/schema";

/** Server only: this module mutates. Every write asserts ownership before it mutates. */

export const STATUSES = ["want_to_read", "reading", "read", "did_not_finish"] as const;
export type Status = (typeof STATUSES)[number];


export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

/** A free slug. The base, then the base plus a short suffix. Immutable once set. */
async function freeSlug(base: string): Promise<string> {
  const taken = await db
    .select({ slug: works.slug })
    .from(works)
    .where(sql`${works.slug} = ${base} or ${works.slug} like ${base + "-%"}`);

  const used = new Set(taken.map((t) => t.slug.toLowerCase()));
  if (!used.has(base.toLowerCase())) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}

async function findOrCreateAuthor(name: string | null): Promise<string | null> {
  /**
   * O PORTÃO. Toda escrita em `authors` passa por lib/autores.ts, e esta é a porta do
   * cadastro a mão, da busca ao vivo e do Google Books.
   *
   * Sem ele, um leitor que digitasse "desconhecido" no campo de autor criaria uma
   * PESSOA chamada Desconhecido, com página, com estante e com uma linha na estatística
   * de nacionalidade. E o Google Books devolve "[author not identified]" em livro
   * antigo, do mesmo jeito que a Open Library.
   *
   * Uma etiqueta é PIOR que um nulo: o nulo a gente conta, vê e conserta; a etiqueta
   * passa por autor de verdade em toda contagem, em toda busca e em toda poda.
   */
  const clean = limparNomeDeAutor(name);
  if (!clean) return null;

  const [row] = await db
    .insert(authors)
    .values({ name: clean, slug: await freeAuthorSlug(clean) })
    .onConflictDoUpdate({ target: authors.name, set: { name: clean } })
    .returning({ id: authors.id });

  if (!row) throw new Error("não deu para gravar o autor");
  return row.id;
}

/** Um slug livre para o autor. Homônimo ganha sufixo, e o endereço nunca colide. */
export async function freeAuthorSlug(name: string): Promise<string> {
  const base = authorSlug(name);

  const taken = await db
    .select({ slug: authors.slug })
    .from(authors)
    .where(sql`${authors.slug} = ${base} or ${authors.slug} like ${base + "-%"}`);

  const used = new Set(taken.map((t) => t.slug.toLowerCase()));
  if (!used.has(base.toLowerCase())) return base;
  for (let n = 2; ; n++) {
    const tentativa = `${base}-${n}`;
    if (!used.has(tentativa.toLowerCase())) return tentativa;
  }
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O CASAMENTO. É o jogo inteiro do importador.
 *
 *  O catálogo é um cache nosso: um livro achado na Open Library vira uma linha aqui no
 *  instante em que alguém o põe na estante, para o segundo leitor que o quiser não
 *  precisar sair do prédio. Ver ai/PRD.md.
 *
 *  ═══ A ORDEM, E POR QUE ELA É ESTA ═══
 *
 *      1. ISBN-13      um FATO. Encerra a conversa.
 *      2. ISBN-10      outro fato, e ele estava sendo IGNORADO. Ver abaixo.
 *      3. chave da Open Library
 *      4. título + autor, sem acento e sem caixa   ← um PALPITE, e ele se declara
 *      5. não achou → CRIA, com needs_review. Nunca descarta a linha.
 *
 *  **Nunca chute abaixo disso.** Um casamento errado é pior que nenhum casamento, porque
 *  ninguém percebe por dois anos: o livro está lá, com a capa errada, e a pessoa acha que
 *  o app é assim mesmo.
 *
 *  ═══ O ISBN-10 ESTAVA SENDO ESCRITO E NUNCA LIDO ═══
 *
 *  Ele era gravado em `identifiers` no cadastro, e a cascata de casamento só olhava o
 *  ISBN-13. O buraco:
 *
 *  **Livro brasileiro publicado antes de 2007 SÓ TEM ISBN-10.** O ISBN-13 nem existia. E o
 *  export do Goodreads traz as DUAS colunas, separadas.
 *
 *  Então metade da estante de quem compra em sebo — que é o leitor que este app existe
 *  para servir — não casava por identificador nenhum. Ela caía no palpite do título, ou
 *  virava obra nova, duplicada, com a ficha vazia.
 *
 *  ═══ E O CASAMENTO POR TÍTULO ERA IGUALDADE EXATA ═══
 *
 *  `lower(title) = lower(title)`. Sem `unaccent`. "Memórias Póstumas" e "Memorias
 *  Postumas" eram dois livros diferentes — e o acervo tem os dois jeitos, porque veio de
 *  um dump. O resto do app já casa com `immutable_unaccent` há muito tempo (a busca, o
 *  colar-uma-lista); só esta função não casava.
 *
 *  ═══ ELA DIZ COMO CASOU, E ISSO É PRODUTO ═══
 *
 *  `como` volta junto. A tela de conferência do importador usa isso para separar o que é
 *  FATO do que é PALPITE: casou por ISBN é uma coisa, casou por título é outra, e a pessoa
 *  precisa poder desmarcar a segunda sem ter que desconfiar da primeira.
 * ════════════════════════════════════════════════════════════════════
 */
// O tipo mora em lib/import/tipos.ts, que é PURO: a tela precisa dele, e a tela não pode
// importar um arquivo que tenha banco dentro.
export type { Casamento };
export async function findOrCreateWork(input: {
  title: string;
  author: string | null;
  isbn13?: string | null;
  isbn10?: string | null;
  publisher?: string | null;
  publishedYear?: number | null;
  firstPublished?: number | null;
  pageCount?: number | null;
  coverUrl?: string | null;
  openlibraryWorkKey?: string | null;
  needsReview?: boolean;
  /** Capa dura, brochura, e-book. Vem do "Binding" do Goodreads. */
  formato?: "hardcover" | "paperback" | "ebook" | "audiobook" | "other" | null;
}): Promise<{ workId: string; editionId: string | null; como: Casamento }> {
  const title = input.title.trim();

  // 1. o ISBN-13 é um FATO, e encerra a conversa.
  if (input.isbn13) {
    const [known] = await db
      .select({ workId: editions.workId, editionId: editions.id })
      .from(editions)
      .where(eq(editions.isbn13, input.isbn13))
      .limit(1);
    if (known) return { workId: known.workId, editionId: known.editionId, como: "isbn13" };
  }

  /**
   * 2. O ISBN-10, que estava sendo GRAVADO e nunca LIDO.
   *
   * Livro brasileiro de antes de 2007 só tem ISBN-10, e o Goodreads exporta as duas
   * colunas separadas. Sem este degrau, metade da estante de quem compra em sebo caía no
   * palpite do título — ou virava obra nova, duplicada, com a ficha vazia.
   */
  if (input.isbn10) {
    const [known] = await db.execute<{ work_id: string; edition_id: string }>(sql`
      select e.work_id, e.id as edition_id
        from identifiers i
        join editions e on e.id = i.edition_id
       where i.kind = 'isbn10' and i.value = ${input.isbn10}
       limit 1`);

    if (known) return { workId: known.work_id, editionId: known.edition_id, como: "isbn10" };
  }

  const authorId = await findOrCreateAuthor(input.author);

  // 3. a chave da Open Library, se a fonte trouxe uma.
  let workId: string | null = null;
  let como: Casamento = "novo";

  if (input.openlibraryWorkKey) {
    const [known] = await db
      .select({ id: works.id })
      .from(works)
      .where(eq(works.openlibraryKey, input.openlibraryWorkKey))
      .limit(1);
    if (known) {
      workId = known.id;
      como = "openlibrary";
    }
  }

  /**
   * 4. Título + autor. É o último casamento honesto, e é um PALPITE — ele se declara como
   * tal, e a tela de conferência mostra a diferença.
   *
   * SEM ACENTO e sem caixa: era `lower(title) = lower(title)`, e "Memórias Póstumas" não
   * casava com "Memorias Postumas". O acervo tem os dois jeitos, porque veio de um dump —
   * e o resto do app já casa com `immutable_unaccent` desde sempre. Só esta função não.
   */
  if (!workId) {
    const [known] = await db
      .select({ id: works.id })
      .from(works)
      .where(and(
        sql`immutable_unaccent(lower(${works.title})) = immutable_unaccent(lower(${title}))`,
        authorId ? eq(works.authorId, authorId) : sql`${works.authorId} is null`,
      ))
      .limit(1);

    if (known) {
      workId = known.id;
      como = "titulo";
    }
  }

  if (!workId) {
    const slug = await freeSlug(slugify(`${title}-${input.author ?? ""}`));
    const [created] = await db
      .insert(works)
      .values({
        slug,
        title,
        authorId,
        firstPublished: input.firstPublished ?? null,
        openlibraryKey: input.openlibraryWorkKey ?? null,
        needsReview: input.needsReview ?? false,
      })
      .returning({ id: works.id });
    if (!created) throw new Error("não deu para gravar a obra");
    workId = created.id;
  }

  const editionId = await findOrCreateEdition(workId, input);
  return { workId, editionId, como };
}

async function findOrCreateEdition(
  workId: string,
  input: {
    isbn13?: string | null;
    isbn10?: string | null;
    publisher?: string | null;
    publishedYear?: number | null;
    pageCount?: number | null;
    coverUrl?: string | null;
    formato?: "hardcover" | "paperback" | "ebook" | "audiobook" | "other" | null;
  },
): Promise<string | null> {
  /**
   * ════════════════════════════════════════════════════════════════════
   *  QUAL EDIÇÃO É ESTA. E o bug que a viagem de ida e volta revelou.
   *
   *  Isto casava SÓ pelo ISBN-13 — e um ISBN nulo casa com qualquer outro ISBN nulo. Ou
   *  seja: um livro sem ISBN pegava a PRIMEIRA edição sem ISBN daquela obra, fosse ela
   *  qual fosse.
   *
   *  O estrago, medido: uma CAPA DURA importada de um arquivo era pendurada numa edição
   *  BROCHURA que já existia no catálogo. A pessoa exportava 29 capas duras e reimportava
   *  29 brochuras — e não tinha como saber, porque o app nunca disse que trocou.
   *
   *  A regra desta casa já respondia isso, e ela estava escrita em outro arquivo: **capa
   *  diferente é EDIÇÃO diferente** (components/correction.tsx). Formato diferente também.
   *
   *  Então, sem ISBN, a edição é identificada pelo que a distingue de verdade: editora,
   *  ano e formato. Se não existir uma assim, nasce uma — porque inventar que a capa dura
   *  da pessoa é a brochura de outra é pior que ter duas linhas no banco.
   * ════════════════════════════════════════════════════════════════════
   */
  const [existing] = await db
    .select({ id: editions.id })
    .from(editions)
    .where(and(
      eq(editions.workId, workId),
      sql`${editions.isbn13} is not distinct from ${input.isbn13 ?? null}`,

      // Sem ISBN, o que distingue uma edição da outra é o objeto: editora, ano, formato.
      input.isbn13
        ? sql`true`
        : and(
            sql`${editions.publisher} is not distinct from ${input.publisher ?? null}`,
            sql`${editions.publishedYear} is not distinct from ${input.publishedYear ?? null}`,
            input.formato
              ? sql`${editions.format} = ${input.formato}`
              : sql`true`,
          ),
    ))
    .limit(1);

  if (existing) {
    if (input.coverUrl) {
      await db
        .update(editions)
        .set({ coverUrl: sql`coalesce(${editions.coverUrl}, ${input.coverUrl})` })
        .where(eq(editions.id, existing.id));
    }
    return existing.id;
  }

  const [created] = await db
    .insert(editions)
    .values({
      workId,
      isbn13: input.isbn13 ?? null,
      publisher: input.publisher ?? null,
      publishedYear: input.publishedYear ?? null,
      pageCount: input.pageCount ?? null,
      coverUrl: input.coverUrl ?? null,
      /**
       * O formato, quando a fonte o traz. Sem ele, o default do schema é "paperback" —
       * e um default é um chute sobre o objeto que está na mão da pessoa. Chutar
       * "brochura" numa capa dura é inventar um fato, e ela não tem como saber.
       */
      ...(input.formato ? { format: input.formato } : {}),
    })
    .returning({ id: editions.id });
  if (!created) throw new Error("não deu para gravar a edição");

  const ids: { editionId: string; kind: "isbn13" | "isbn10"; value: string }[] = [];
  if (input.isbn13) ids.push({ editionId: created.id, kind: "isbn13", value: input.isbn13 });
  if (input.isbn10) ids.push({ editionId: created.id, kind: "isbn10", value: input.isbn10 });
  if (ids.length) await db.insert(identifiers).values(ids).onConflictDoNothing();

  return created.id;
}

export function hitToWork(hit: Hit) {
  return {
    title: hit.title,
    author: hit.author,
    isbn13: hit.isbn13,
    isbn10: hit.isbn10,
    publisher: hit.publisher,
    publishedYear: hit.publishedYear,
    /**
     * O ano da OBRA vem do campo próprio, e não mais adivinhado pela fonte.
     *
     * Antes isto era `hit.source === "openlibrary" ? hit.publishedYear : null`, e
     * a consequência era silenciosa e grave: um livro posto na estante a partir do
     * NOSSO catálogo (fonte "gume", que é o caminho normal, porque a busca local
     * responde primeiro) entrava com o ano da obra NULO. A página de estatísticas
     * inteira gira em torno desse ano, e ela ia ficando vazia para cada leitor novo.
     */
    firstPublished: hit.firstPublished,
    pageCount: hit.pageCount,
    coverUrl: hit.coverUrl,
    openlibraryWorkKey: hit.openlibraryWorkKey,
  };
}

/** Puts a work on the actor's shelf. One row per (user, work): re-adding moves the status. */
export async function shelve(actor: { id: string }, workId: string, status: Status): Promise<void> {
  // The row we are about to write is the actor's own. Asserted, not assumed.
  assertOwner(actor as Viewer, { userId: actor.id });

  await db
    .insert(libraryEntries)
    .values({ userId: actor.id, workId, status })
    .onConflictDoUpdate({
      target: [libraryEntries.userId, libraryEntries.workId],
      set: { status, statusAt: new Date() },
    });
}

/**
 * Prateleirar E abrir ou fechar a leitura, ATOMICAMENTE, numa transação só.
 *
 * Mover o status é também um evento de leitura: começar abre uma leitura,
 * terminar ou abandonar fecha a que está aberta. Reler é de primeira classe, então
 * "lido" duas vezes abre uma segunda leitura em vez de editar a primeira.
 *
 * Por que uma transação com trava: ler a leitura aberta e depois inserir são dois
 * passos, e entre eles cabe outra requisição. Um duplo clique em "lido" criava
 * duas leituras terminadas, e o ano passava a contar dois livros onde havia um.
 * O `for update` na linha da estante faz a segunda esperar e reavaliar.
 *
 * Devolve a linha da estante, para quem chamou poder escrever a atividade com a
 * MESMA visibilidade dela.
 */
export async function shelveAndRead(
  actor: { id: string },
  workId: string,
  status: Status,
  /**
   * QUANDO. A data é do LEITOR, e não do relógio do servidor.
   *
   * Isto era `new Date()`, sempre. Quem terminou o livro em março de 2019 e o marcava
   * como lido hoje ficava registrado como tendo terminado hoje — e não havia tela para
   * corrigir. O Gume não sabia quando ninguém tinha lido nada, e a página de
   * estatísticas e a retrospectiva do ano são construídas inteiras em cima disto.
   *
   * Vazio continua valendo HOJE, e é o que faz o clique único continuar sendo um
   * clique único: quem aceita "hoje" não paga nada por isso.
   */
  quando?: string | null,
): Promise<{ entryId: string; visibility: string } | null> {
  assertOwner(actor as Viewer, { userId: actor.id });

  // A validação mora em lib/datas.ts, e ela levanta em data futura, em data anterior a
  // 1900 e em dia que não existe no calendário. Não dá para escrever aqui uma data que
  // não passe por ela.
  const hoje = dataDeLeitura(quando) ?? hojeNoCalendario();

  return db.transaction(async (tx) => {
    await tx
      .insert(libraryEntries)
      .values({ userId: actor.id, workId, status })
      .onConflictDoUpdate({
        target: [libraryEntries.userId, libraryEntries.workId],
        set: { status, statusAt: new Date() },
      });

    const [entry] = await tx.execute<{ id: string; visibility: string }>(sql`
      select id, visibility::text as visibility
        from library_entries
       where user_id = ${actor.id}::uuid and work_id = ${workId}::uuid
       for update`);

    if (!entry) return null;

    const [aberta] = await tx.execute<{ id: string }>(sql`
      select id from readings
       where entry_id = ${entry.id}::uuid
         and finished_on is null and abandoned_on is null
       order by created_at desc limit 1`);

    if (status === "reading" && !aberta) {
      await tx.execute(sql`
        insert into readings (entry_id, started_on) values (${entry.id}::uuid, ${hoje}::date)`);
    } else if (status === "read") {
      if (aberta) {
        await tx.execute(sql`
          update readings set finished_on = ${hoje}::date where id = ${aberta.id}::uuid`);
      } else {
        // Sem leitura aberta: só nasce uma nova se ainda não houver NENHUMA
        // terminada. É o que impede o duplo clique de virar duas leituras.
        await tx.execute(sql`
          insert into readings (entry_id, finished_on)
          select ${entry.id}::uuid, ${hoje}::date
           where not exists (
             select 1 from readings r
              where r.entry_id = ${entry.id}::uuid and r.finished_on is not null)`);
      }
    } else if (status === "did_not_finish" && aberta) {
      await tx.execute(sql`
        update readings set abandoned_on = ${hoje}::date where id = ${aberta.id}::uuid`);
    }

    return { entryId: entry.id, visibility: entry.visibility };
  });
}

/**
 * Where the book came from, in the reader's own words. Free text, never a
 * dropdown, never required: a reader who ignores the question still gets their
 * book. Owning is not reading, and provenance is the most interesting thing
 * about a book on a real shelf, which is exactly why it cannot be a form field.
 */
export async function setProvenance(
  actor: { id: string },
  workId: string,
  editionId: string | null,
  note: string | null,
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });
  const clean = note?.trim().slice(0, 140) || null;

  await db
    .insert(ownedCopies)
    .values({ userId: actor.id, workId, editionId, state: "owned", acquiredNote: clean })
    .onConflictDoUpdate({
      target: [ownedCopies.userId, ownedCopies.workId],
      set: { acquiredNote: clean, editionId },
    });
}

import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { visibleTo, type Viewer } from "@/lib/authz";
import { libraryEntries, works, authors, editions, ownedCopies, ratings } from "@/lib/db/schema";
import {
  FILTERS, type FilterKey, type SortKey, type Direcao, type ShelfBook,
} from "@/lib/shelf-view";

/** Server only: this module reaches the database. Components read lib/shelf-view.ts. */

/**
 * A ordem, COM DIREÇÃO.
 *
 * A direção era fixa no código, e a pessoa tinha que descobrir olhando a lista se
 * "título" era A a Z ou Z a A. Agora ela escolhe, e o padrão de cada critério é o
 * que faz sentido para ele (ver DIRECAO_PADRAO em lib/shelf-view.ts).
 *
 * O NULLS LAST não muda com a direção, e isso é deliberado: um livro sem ano ou sem
 * autor é um buraco na ficha, e buraco não é o começo da lista nem em A a Z nem em
 * Z a A. Ele fica no fim, onde ele pede para ser preenchido.
 */
function orderBy(sort: SortKey, dir: Direcao): SQL {
  const asc_ = dir === "asc";

  switch (sort) {
    case "titulo":
      return asc_ ? asc(works.title) : desc(works.title);
    case "autor":
      return asc_
        ? sql`${authors.name} asc nulls last, ${works.title} asc`
        : sql`${authors.name} desc nulls last, ${works.title} asc`;
    // O ano em que a OBRA foi escrita, e nunca o em que esta edição foi impressa.
    case "ano":
      return asc_
        ? sql`${works.firstPublished} asc nulls last, ${works.title} asc`
        : sql`${works.firstPublished} desc nulls last, ${works.title} asc`;
    default:
      return asc_ ? asc(libraryEntries.addedAt) : desc(libraryEntries.addedAt);
  }
}

/**
 * O ano em que a leitura ACONTECEU.
 *
 * Vale para lido (terminou) e para abandonado (largou). São dois fatos diferentes e
 * moram em colunas diferentes, então o filtro tem que olhar a coluna certa: filtrar
 * abandonados por `finished_on` devolveria a lista vazia, sempre, sem erro nenhum,
 * que é o pior tipo de bug.
 */
function noAno(filter: FilterKey, ano: number): SQL {
  const coluna = filter === "abandonados" ? sql`r.abandoned_on` : sql`r.finished_on`;
  return sql`exists (
    select 1 from readings r
     where r.entry_id = ${libraryEntries.id}
       and ${coluna} is not null
       and extract(year from ${coluna}) = ${ano})`;
}

/**
 * One reader's shelf. The visibility filter is `visibleTo()`, and it runs in
 * SQL: a private row is never fetched and then hidden in JavaScript, because
 * over-fetching and hiding is how data leaks. See SECURITY.md.
 *
 * A work can have many editions (the Open Library import brings several). We
 * show the copy the reader owns; failing that, the earliest edition on record,
 * so the shelf does not reshuffle between page loads.
 */
export async function getShelf(
  viewer: Viewer,
  ownerId: string,
  {
    filter = "tudo",
    sort = "adicionado",
    direcao = "desc",
    ano = null,
  }: {
    filter?: FilterKey;
    sort?: SortKey;
    direcao?: Direcao;
    /** Só faz sentido em "lidos" e "abandonados": um livro esperando não aconteceu num ano. */
    ano?: number | null;
  } = {},
): Promise<ShelfBook[]> {
  const status = FILTERS.find((f) => f.key === filter)?.status ?? null;
  const porAno =
    ano !== null && (filter === "lidos" || filter === "abandonados") ? noAno(filter, ano) : undefined;

  const rows = await db
    .select({
      workId: works.id,
      slug: works.slug,
      title: works.title,
      author: authors.name,
      nationality: authors.nationality,
      publisher: editions.publisher,
      format: editions.format,
      editionYear: editions.publishedYear,
      firstPublished: works.firstPublished,
      pageCount: editions.pageCount,
      // A capa é a ILUSTRAÇÃO da obra, e não um dado da sua edição: se a edição
      // que é a sua não tem capa, mas outra edição da mesma obra tem, a estante
      // mostra aquela. Uma lombada em branco ao lado de uma capa que EXISTE no
      // catálogo é pior do que emprestar a capa. Editora, páginas e ano continuam
      // sendo os da SUA edição, que é o que você escolheu.
      coverUrl: sql<string | null>`coalesce(${editions.coverUrl}, (
        select e3.cover_url from editions e3
         where e3.work_id = ${works.id} and e3.cover_url is not null
         order by e3.created_at asc limit 1))`,
      status: libraryEntries.status,
      rating: ratings.value,
      acquiredNote: ownedCopies.acquiredNote,
      addedAt: libraryEntries.addedAt,

      /**
       * ═══ O LIVRO QUE TE FEZ SUBIR DE HONRA ═══
       *
       * `activities.honra` guarda, desde sempre, a honra em que a pessoa ENTROU ao
       * terminar aquele livro. O dado estava gravado e não aparecia em lugar nenhum: a
       * estante não sabia que uma das capas dela era um marco.
       *
       * É uma MEMÓRIA, e não um placar: ela não ordena ninguém, não aparece na estante
       * dos outros como comparação, e não some se a pessoa parar de ler. Diz "foi este
       * aqui que te levou à Platina", que é a coisa que um app de leitura devia lembrar e
       * nenhum lembra.
       *
       * `order by id desc limit 1`: numa releitura, o marco é o da vez que subiu — e se
       * subiu duas vezes (o paragon sobe de novo), vale a mais alta, que é a mais recente.
       */
      honra: sql<string | null>`(
        select a.honra from activities a
         where a.actor_id = ${libraryEntries.userId}
           and a.work_id = ${works.id}
           and a.honra is not null
         order by a.id desc limit 1)`,
    })
    .from(libraryEntries)
    .innerJoin(works, eq(works.id, libraryEntries.workId))
    .leftJoin(authors, eq(authors.id, works.authorId))
    .leftJoin(ownedCopies, and(
      eq(ownedCopies.workId, libraryEntries.workId),
      eq(ownedCopies.userId, libraryEntries.userId),
    ))
    // The star on the shelf. The visibility test lives in the JOIN, not the
    // WHERE: in the WHERE it would drop the whole book from a stranger's view
    // just because its rating was private, which is a leak in reverse.
    .leftJoin(ratings, and(
      eq(ratings.workId, libraryEntries.workId),
      eq(ratings.userId, libraryEntries.userId),
      visibleTo(viewer, ratings.userId, ratings.visibility),
    ))
    // The edition YOU chose wins, then the copy you own, then the earliest on
    // record. Memórias Póstumas has 100 editions; picking one for you was never
    // good enough, and page counts and covers differ between them.
    .leftJoin(editions, sql`${editions.id} = coalesce(
      ${libraryEntries.editionId},
      ${ownedCopies.editionId},
      (select e2.id from editions e2 where e2.work_id = ${works.id}
       order by (e2.cover_url is null), e2.created_at asc, e2.id asc limit 1)
    )`)
    .where(and(
      eq(libraryEntries.userId, ownerId),
      visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility),
      status ? eq(libraryEntries.status, status) : undefined,
      porAno,
    ))
    .orderBy(orderBy(sort, direcao));

  return rows as ShelfBook[];
}

/**
 * Os anos em que esta pessoa terminou ou largou alguma coisa.
 *
 * Só os anos que EXISTEM são oferecidos. Uma lista de anos com buracos (2019, 2021)
 * é honesta; uma lista contínua (2019, 2020, 2021) com um ano vazio no meio é o app
 * inventando uma pergunta que não tem resposta.
 */
export async function getShelfYears(
  viewer: Viewer,
  ownerId: string,
  filter: FilterKey,
): Promise<number[]> {
  if (filter !== "lidos" && filter !== "abandonados") return [];

  const coluna = filter === "abandonados" ? sql`r.abandoned_on` : sql`r.finished_on`;

  const rows = await db.execute<{ ano: number }>(sql`
    select distinct extract(year from ${coluna})::int as ano
      from library_entries
      join readings r on r.entry_id = library_entries.id
     where library_entries.user_id = ${ownerId}::uuid
       and ${visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility)}
       and ${coluna} is not null
     order by ano desc`);

  return rows.map((r) => r.ano);
}

/** The counts on the filter chips. Same visibility rule, or the numbers would lie. */
export async function getShelfCounts(viewer: Viewer, ownerId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: libraryEntries.status, n: sql<number>`count(*)::int` })
    .from(libraryEntries)
    .where(and(
      eq(libraryEntries.userId, ownerId),
      visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility),
    ))
    .groupBy(libraryEntries.status);

  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r.n]));
  return {
    tudo: rows.reduce((sum, r) => sum + r.n, 0),
    lendo: byStatus.reading ?? 0,
    lidos: byStatus.read ?? 0,
    esperando: byStatus.want_to_read ?? 0,
    abandonados: byStatus.did_not_finish ?? 0,
  };
}

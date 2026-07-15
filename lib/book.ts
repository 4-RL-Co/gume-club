import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Viewer } from "@/lib/authz";
import {
  works, authors, editions, libraryEntries, ownedCopies,
  ratings, reviews,
} from "@/lib/db/schema";

/** Server only. The book page. */

export type BookEdition = {
  id: string;
  isbn13: string | null;
  publisher: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  format: string;
  coverUrl: string | null;
};

export type Book = {
  workId: string;
  slug: string;
  title: string;
  author: string | null;
  /**
   * O SLUG do autor. Sem ele, o nome na página do livro era texto morto: o leitor
   * clicava e não ia a lugar nenhum, e a página do autor — com o retrato, a biografia
   * e o resto da obra — existia sem porta de entrada.
   */
  authorSlug: string | null;
  /** O retrato. O painel do autor sabia mostrá-lo desde sempre; ninguém o passava. */
  authorImage: string | null;
  /**
   * Quem foi essa pessoa, em uma frase.
   *
   * "escritor brasileiro (1839–1908)". O painel do autor mostrava nome, retrato e
   * nacionalidade — três dados e nenhuma frase. Quem não conhece o autor não fica
   * sabendo nada sobre ele, e a página do livro perde a chance de apresentar.
   */
  authorBio: string | null;
  authorBioSource: string | null;
  nationality: string | null;
  firstPublished: number | null;
  /**
   * A SINOPSE. O que o livro é, em um parágrafo.
   *
   * Não é resenha: resenha é o que o LEITOR escreve, e é o produto deste app. A sinopse
   * é a apresentação da obra, e ela existe para quem ainda não decidiu se quer ler.
   *
   * Vem do dump da Open Library, cujo dado é CC0 — e por isso ela pode entrar no dataset
   * aberto que o Gume promete publicar. Sinopse de loja é texto autoral, com direito, e
   * fica de fora. Ver ai/PRD.md.
   */
  description: string | null;
  descriptionSource: string | null;
  genre: string | null;
  subject: string | null;
  needsReview: boolean;
  editions: BookEdition[];
  /** The reader's own rows. Null when nobody is logged in. */
  mine: {
    status: string | null;
    entryId: string | null;
    rating: number | null;
    review: { body: string; visibility: string } | null;

    acquiredNote: string | null;
    editionId: string | null;
  } | null;
};

export async function getBook(slug: string, viewer: Viewer, actorId: string | null): Promise<Book | null> {
  const [work] = await db
    .select({
      workId: works.id,
      slug: works.slug,
      title: works.title,
      description: works.description,
      descriptionSource: works.descriptionSource,
      author: authors.name,
      authorSlug: authors.slug,
      authorImage: authors.imageUrl,
      authorBio: authors.bio,
      authorBioSource: authors.bioSource,
      nationality: authors.nationality,
      firstPublished: works.firstPublished,
      genre: works.genre,
      subject: works.subject,
      needsReview: works.needsReview,
    })
    .from(works)
    .leftJoin(authors, eq(authors.id, works.authorId))
    .where(eq(works.slug, slug))
    .limit(1);

  if (!work) return null;

  const eds = await db
    .select({
      id: editions.id,
      isbn13: editions.isbn13,
      publisher: editions.publisher,
      publishedYear: editions.publishedYear,
      pageCount: editions.pageCount,
      format: editions.format,
      coverUrl: editions.coverUrl,
    })
    .from(editions)
    .where(eq(editions.workId, work.workId))
    .orderBy(editions.createdAt);

  // Only the actor's own rows are read below, and you can always see your own.
  // The day this page shows somebody else's rating or review, that query filters
  // through visibleTo() in SQL, like every other cross-user read. See SECURITY.md.
  const mine = actorId ? await getMine(work.workId, actorId) : null;

  return { ...work, editions: eds, mine };
}

/** Your own rows. You can always see your own, whatever their visibility. */
async function getMine(workId: string, actorId: string) {
  const [entry] = await db
    .select({ id: libraryEntries.id, status: libraryEntries.status, editionId: libraryEntries.editionId })
    .from(libraryEntries)
    .where(and(eq(libraryEntries.workId, workId), eq(libraryEntries.userId, actorId)))
    .limit(1);

  const [rating] = await db
    .select({ value: ratings.value })
    .from(ratings)
    .where(and(eq(ratings.workId, workId), eq(ratings.userId, actorId)))
    .limit(1);

  const [review] = await db
    .select({ body: reviews.body, visibility: reviews.visibility })
    .from(reviews)
    .where(and(
      eq(reviews.workId, workId),
      eq(reviews.userId, actorId),
      sql`${reviews.deletedAt} is null`,
    ))
    .limit(1);

  const [owned] = await db
    .select({
      acquiredNote: ownedCopies.acquiredNote,
      editionId: ownedCopies.editionId,
    })
    .from(ownedCopies)
    .where(and(eq(ownedCopies.workId, workId), eq(ownedCopies.userId, actorId)))
    .limit(1);



  return {
    status: entry?.status ?? null,
    entryId: entry?.id ?? null,
    rating: rating?.value ?? null,
    review: review ? { body: review.body, visibility: review.visibility } : null,
    acquiredNote: owned?.acquiredNote ?? null,
    editionId: entry?.editionId ?? owned?.editionId ?? null,
  };
}

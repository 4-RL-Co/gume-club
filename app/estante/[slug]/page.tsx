import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { visibleTo } from "@/lib/authz";
import { getViewer } from "@/lib/viewer";
import { collections, collectionItems, works, authors, editions, libraryEntries, ownedCopies, ratings } from "@/lib/db/schema";
import { getFriendRatings } from "@/lib/ratings";
import type { ShelfBook } from "@/lib/shelf-view";
import { Share } from "@/components/share";
import { ScreenHeader } from "@/components/screen-header";
import { CoverWall } from "@/components/cover-wall";
import { Empty } from "@/components/empty";
import { ShelfSettings } from "@/components/shelf-settings";

export const dynamic = "force-dynamic";

/**
 * A shelf the reader invented. Public or private, and the visibility rule is the
 * same one as everywhere else: visibleTo(), in SQL. A private shelf is a private
 * shelf, including the books on it.
 */
export default async function Estante({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();

  const [shelf] = await db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      visibility: collections.visibility,
      userId: collections.userId,
      handle: sql<string>`(select u.handle from users u where u.id = ${collections.userId})`,
    })
    .from(collections)
    .where(and(
      eq(collections.slug, slug),
      visibleTo(viewer, collections.userId, collections.visibility),
    ))
    .limit(1);

  if (!shelf) notFound();

  const mine = viewer?.id === shelf.userId;

  const books = await db
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
      coverUrl: editions.coverUrl,
      status: sql<string>`coalesce(${libraryEntries.status}::text, 'want_to_read')`,
      rating: ratings.value,
      acquiredNote: ownedCopies.acquiredNote,
      addedAt: collectionItems.addedAt,
    })
    .from(collectionItems)
    .innerJoin(works, eq(works.id, collectionItems.workId))
    .leftJoin(authors, eq(authors.id, works.authorId))
    .leftJoin(libraryEntries, and(
      eq(libraryEntries.workId, works.id),
      eq(libraryEntries.userId, shelf.userId),
    ))
    .leftJoin(ratings, and(
      eq(ratings.workId, works.id),
      eq(ratings.userId, shelf.userId),
      visibleTo(viewer, ratings.userId, ratings.visibility),
    ))
    .leftJoin(ownedCopies, and(
      eq(ownedCopies.workId, works.id),
      eq(ownedCopies.userId, shelf.userId),
    ))
    .leftJoin(editions, sql`${editions.id} = (
      select e2.id from editions e2 where e2.work_id = ${works.id}
      order by e2.created_at asc, e2.id asc limit 1)`)
    .where(eq(collectionItems.collectionId, shelf.id))
    .orderBy(collectionItems.position, collectionItems.addedAt);

  const opinions = await getFriendRatings(viewer, books.map((b) => b.workId));

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      <ScreenHeader
        title={shelf.name}
        meta={[
          `${books.length} ${books.length === 1 ? "livro" : "livros"}`,
          shelf.visibility === "private" ? "só sua" : `de @${shelf.handle}`,
        ]}
      >
        <span className="flex items-center gap-5">
          {/* Estante privada não ganha botão de compartilhar: o link não abriria
              para quem recebesse, e um botão que promete o que não cumpre é pior
              que nenhum botão. */}
          {shelf.visibility !== "private" && <Share titulo={shelf.name} />}
          {mine && (
            <ShelfSettings id={shelf.id} name={shelf.name} visibility={shelf.visibility} />
          )}
        </span>
      </ScreenHeader>

      {books.length === 0 ? (
        <Empty>
          Estante vazia. Abra um livro e coloque ele aqui.
        </Empty>
      ) : (
        <CoverWall books={books as ShelfBook[]} opinions={opinions} />
      )}
    </main>
  );
}

import { BookCard } from "@/components/book-card";
import type { ShelfBook } from "@/lib/shelf-view";
import type { Opinion } from "@/lib/ratings";

/**
 * The wall. Four columns on desktop, because the sidebar already took the width;
 * two on a phone. The gap between cards is 20px and the padding INSIDE them is
 * 24 to 28: air belongs around the content, not between the boxes. A 24px gutter
 * with a cramped card reads as a grid of tiles; the reverse reads as a shelf.
 */
export function CoverWall({
  books,
  opinions = {},
  de,
  numerada = false,
}: {
  books: ShelfBook[];
  opinions?: Record<string, Opinion>;
  /** O recorte de onde estes livros vieram, para o "voltar". Ver BookCard. */
  de?: string;
  /** Estante NUMERADA: cada card ganha a posição (1, 2, 3), na ordem recebida. */
  numerada?: boolean;
}) {
  return (
    <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {books.map((b, i) => (
        <BookCard
          key={b.workId}
          book={b}
          opinion={opinions[b.workId]}
          de={de}
          numero={numerada ? i + 1 : null}
        />
      ))}
    </ul>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lastBook, type LastBook } from "@/lib/last-book";

/**
 * "O último livro que você abriu." Uma linha, e só aparece se houver algo para voltar.
 *
 * Chamava-se "Onde você parou", e isso era uma pequena mentira: o app não sabe onde
 * você parou, e nem quer saber (não existe progresso aqui, e não é esquecimento).
 * O que ele sabe é qual foi a última FICHA que você abriu, que é outra coisa. Uma
 * linha que promete mais do que o app entrega ensina a pessoa a não confiar nas
 * outras.
 *
 * Lê do navegador, então precisa esperar a montagem: renderizar no servidor uma
 * coisa que só o navegador sabe é como o texto pisca e pula na sua cara.
 */
export function Resume({ hide }: { hide?: string }) {
  const [book, setBook] = useState<LastBook | null>(null);

  useEffect(() => {
    setBook(lastBook.read());
  }, []);

  if (!book || book.slug === hide) return null;

  return (
    <p className="mt-5 text-[14px] text-[var(--color-ink-faint)]">
      O último livro que você abriu:{" "}
      <Link
        href={`/livro/${book.slug}`}
        className="voice text-[16px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
      >
        {book.title}
      </Link>
    </p>
  );
}

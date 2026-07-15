"use client";

import { useEffect } from "react";
import { lastBook } from "@/lib/last-book";

/** Não desenha nada. Só lembra qual foi o último livro que você abriu. */
export function RememberBook({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    lastBook.write({ slug, title });
  }, [slug, title]);

  return null;
}

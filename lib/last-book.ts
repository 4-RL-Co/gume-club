"use client";

/**
 * Onde você parou.
 *
 * O app lembra o último livro que você abriu, e oferece a volta. É a coisa mais
 * barata que existe e é a que mais some: você fecha o navegador no meio de uma
 * anotação e, no dia seguinte, gasta uma busca inteira para achar de novo o livro
 * que estava na sua mão.
 *
 * Mora no navegador, e só. Não vale uma coluna no banco, e o Gume não precisa
 * guardar num servidor que livro você abriu por último para ser útil.
 */
const KEY = "gume.ultimo-livro";

export type LastBook = { slug: string; title: string };

export const lastBook = {
  write(book: LastBook): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(book));
    } catch {
      /* modo anônimo, cota cheia: esquecer é aceitável, quebrar não */
    }
  },

  read(): LastBook | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LastBook;
      return parsed?.slug && parsed?.title ? parsed : null;
    } catch {
      return null;
    }
  },
};

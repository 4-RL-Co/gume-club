/**
 * Slugs are the public address of a book. Once created, a slug is immutable:
 * correcting a title must not change it, or a link someone saved would break.
 * See ai/DECISIONS.md. The seed script mirrors slugify() in plain JS, and the
 * backfill migration mirrors it in SQL (unaccent + regexp_replace); keep the
 * three in sync.
 */

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Lowercase, accent-stripped, hyphenated. "A Arte da Guerra-Sun Tzu" -> "a-arte-da-guerra-sun-tzu". */
export function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(COMBINING_MARKS, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "obra"
  );
}

/** Given a base slug and the slugs already taken, return a free one with a short numeric suffix. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * O endereço público de um autor, gerado do nome.
 *
 * Imutável depois de gerado, como o do livro: corrigir um acento no nome não pode
 * quebrar um link que alguém guardou. Homônimo ganha sufixo no ponto de inserção,
 * onde dá para consultar o que já existe.
 */
export function authorSlug(name: string): string {
  return slugify(name) || "autor";
}

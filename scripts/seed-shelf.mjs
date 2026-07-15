#!/usr/bin/env node
/**
 * Seeds a real shelf from a spreadsheet, the way readers actually track books today.
 * Covers come from Open Library by ISBN. Missing covers stay null on purpose:
 * the UI draws a typographic cover instead of a gray box.
 *
 *   node scripts/seed-shelf.mjs seed/olegas-shelf.csv olegas
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { limparNomeDeAutor } from "../lib/autores.ts";

const [, , file = "seed/olegas-shelf.csv", handle = "olegas"] = process.argv;

const url = process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1];
if (!url) throw new Error("DATABASE_URL não encontrado");
const sql = postgres(url);

/** A CSV parser that survives quoted commas. */
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [header, ...body] = rows;
  return body.filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const FORMAT = {
  "Capa Dura": "hardcover", "Capa Dura Almofadada": "hardcover",
  "Brochura": "paperback", "Livro de bolso": "paperback",
};
/**
 * Onde o livro foi obtido, nas palavras de quem escreveu a planilha. É texto
 * livre: o enum de opções fixas morreu, porque ninguém adquiriu um livro
 * "subscription_box", a pessoa ganhou a caixa de janeiro do clube. Ver
 * ai/DECISIONS.md.
 */
const STATUS = { "Lido": "read", "Não lido": "want_to_read" };

/** Mirrors lib/slug.ts. A slug is the book's public address, immutable once set. */
function slugify(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "obra";
}

/** A free slug for a new work: base, then base-2, base-3 on collision. */
async function freeSlug(base) {
  let slug = base;
  for (let n = 2; (await sql`select 1 from works where slug = ${slug} limit 1`).length; n++) {
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Open Library returns 404 with default=false when it has no cover. */
async function findCover(isbn) {
  if (!isbn) return null;
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null;
  } catch { return null; }
}

const rows = parseCsv(readFileSync(file, "utf8"));
console.log(`→ ${rows.length} livros em ${file}`);

const [user] = await sql`
  insert into users (handle, email, display_name)
  values (${handle}, ${handle + "@gume.local"}, 'Olegas')
  on conflict (handle) do update set display_name = excluded.display_name
  returning id`;

let covers = 0;
for (const r of rows) {
  const title = r["Título"];
  if (!title) continue;

  /**
   * O PORTÃO (lib/autores.ts).
   *
   * Isto era `r["Autor"] || "Desconhecido"`, e criava um AUTOR CHAMADO DESCONHECIDO —
   * com página de autor, com estante, e contando como um autor lido na estatística de
   * nacionalidade. É o bug do campo de autor podre, escrito a mão.
   *
   * Um livro sem autor tem autor NULO. Ele não tem um autor chamado Desconhecido.
   */
  const nomeDoAutor = limparNomeDeAutor(r["Autor"]);

  /**
   * Sem autor de verdade, a obra entra com autor NULO — e não com um autor inventado.
   *
   * A antologia ("Vários autores") e o livro anônimo são casos legítimos, e o CSV do
   * seed tem os dois. O que não é legítimo é criar uma PESSOA chamada "Vários autores",
   * com página, com estante e com uma linha na estatística de nacionalidade.
   */
  const author = nomeDoAutor
    ? (await sql`
        insert into authors (name, nationality, slug)
        values (
          ${nomeDoAutor},
          ${r["Nacionalidade ou Etnia"] || null},
          -- o mesmo desenho de slug da migration 0016: um autor sem endereço público
          -- é um autor que não dá para linkar, e o link é o produto
          trim(both '-' from regexp_replace(lower(immutable_unaccent(${nomeDoAutor})), '[^a-z0-9]+', '-', 'g'))
        )
        on conflict (name) do update set nationality = coalesce(excluded.nationality, authors.nationality)
        returning id`)[0]
    : null;

  // Slug is only used when a new work is inserted; on conflict it stays put
  // (immutable). Compute a free one so a genuinely new book never collides.
  const slug = await freeSlug(slugify(`${title}-${nomeDoAutor ?? ""}`));

  const [work] = await sql`
    insert into works (slug, title, author_id, first_published, genre, subject)
    values (${slug}, ${title}, ${author?.id ?? null},
            ${parseInt(r["Ano em que a obra foi escrita"]) || null},
            ${r["Gênero literário"] || null}, ${r["Tema"] || null})
    on conflict on constraint works_title_author_volume do update
      set first_published = coalesce(excluded.first_published, works.first_published),
          genre           = coalesce(excluded.genre, works.genre),
          subject         = coalesce(excluded.subject, works.subject)
    returning id`;

  const isbn = (r["ISBN"] || "").replace(/\D/g, "") || null;
  const cover = await findCover(isbn);
  if (cover) covers++;

  // Fetch-or-insert: idempotent whether or not the book has an ISBN. A null
  // isbn13 does not collide under a plain unique, so we match it explicitly.
  let [edition] = await sql`
    select id from editions
    where work_id = ${work.id} and isbn13 is not distinct from ${isbn}
    limit 1`;
  if (edition) {
    if (cover) await sql`update editions set cover_url = coalesce(cover_url, ${cover}) where id = ${edition.id}`;
  } else {
    [edition] = await sql`
      insert into editions (work_id, isbn13, publisher, published_year, format, cover_url)
      values (${work.id}, ${isbn}, ${r["Editora"] || null},
              ${parseInt(r["Ano de publicação da edição"]) || null},
              ${FORMAT[r["Formato"]] || "other"}, ${cover})
      returning id`;
  }

  await sql`
    insert into library_entries (user_id, work_id, status)
    values (${user.id}, ${work.id}, ${STATUS[r["Lido"]] || "want_to_read"})
    on conflict (user_id, work_id) do nothing`;

  // owning is a separate fact, and where it came from is the story
  await sql`
    insert into owned_copies (user_id, work_id, edition_id, state, acquired_note)
    values (${user.id}, ${work.id}, ${edition.id}, 'owned',
            ${r["Obtenção (sebo, financiamento, amazon)"] || null})
    on conflict (user_id, work_id) do nothing`;

  process.stdout.write(cover ? "." : "·");
}

console.log(`\n✓ ${rows.length} livros, ${covers} capas encontradas na Open Library`);
console.log(`  ${rows.length - covers} sem capa: a UI desenha uma capa tipográfica.`);
await sql.end();

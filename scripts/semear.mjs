#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  A SEMEADURA. O acervo aprende o que se lê HOJE.
 *
 *    node --experimental-strip-types scripts/semear.mjs             MEDE. Não escreve nada.
 *    node --experimental-strip-types scripts/semear.mjs --executar  grava.
 *
 *  Sem `--executar` ele é um relatório, igual à poda. Um script que escreve no acervo por
 *  padrão é um script que um dia alguém roda sem querer.
 *
 *  ═══ DE ONDE VÊM OS LIVROS ═══
 *
 *  Da API do Google Books, e não de raspagem de loja. É uma API pública, com termos de uso,
 *  e ela devolve exatamente o que a gente precisa: título, autor, editora, ano, ISBN e o
 *  ENDEREÇO da capa.
 *
 *  A capa é REFERÊNCIA, e nunca cópia: a gente guarda a URL, e o navegador do leitor busca
 *  a imagem no servidor do Google. Nenhum arquivo de imagem é baixado, e nenhum é
 *  republicado. É a mesma regra que vale para as lojas.
 *
 *  ═══ SÓ ENTRA FICHA COMPLETA. SEM EXCEÇÃO ═══
 *
 *  Um livro só é gravado se tiver CAPA e ISBN. Não é preciosismo: a poda (scripts/poda.mjs)
 *  guarda o acervo pela capa, e semear ficha sem capa seria plantar exatamente o entulho que
 *  a poda acabou de arrancar. As duas metades têm que concordar, ou uma desfaz a outra.
 *
 *  ═══ E SÓ EM PORTUGUÊS ═══
 *
 *  `langRestrict=pt`. A edição americana de "It Ends With Us" não ajuda ninguém aqui: quem
 *  procura procura por "É Assim Que Acaba". Uma ficha em inglês do lado de uma em português
 *  é a mesma obra duas vezes, e a pessoa não sabe qual escolher.
 *
 *  ═══ IDEMPOTENTE ═══
 *
 *  Rodar duas vezes não duplica nada: o casamento é por ISBN-13, e todo insert termina em
 *  `on conflict do nothing`. Dá para rodar de novo daqui a seis meses e só o que é novo entra.
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { AGORA } from "../seed/booktok.ts";
import { limparNomeDeAutor } from "../lib/autores.ts";

const env = readFileSync(".env", "utf8");
const doEnv = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const url = process.env.DATABASE_URL ?? doEnv("DATABASE_URL");
if (!url) throw new Error("DATABASE_URL não encontrado");

/**
 * A chave vai no CABEÇALHO, e nunca na URL.
 *
 * `lib/catalog.ts` já dizia por quê, e eu escrevi `&key=` assim mesmo: na URL, a chave entra
 * na chave do cache de fetch e acaba escrita em disco, num lugar onde ninguém vai procurar
 * por um segredo. É servidor, não vaza para o navegador, e mesmo assim um segredo copiado
 * para onde ninguém espera é um segredo que um dia sai num log ou num backup.
 *
 * O nome da variável é o mesmo do app. Duas variáveis para a mesma chave é uma delas
 * vencida, e ninguém descobre qual.
 */
const CHAVE = process.env.GOOGLE_BOOKS_API_KEY ?? doEnv("GOOGLE_BOOKS_API_KEY");
const EXECUTAR = process.argv.includes("--executar");

const sql = postgres(url, { max: 1 });
const n = (v) => Number(v).toLocaleString("pt-BR");
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────── o google

/**
 * A capa do Google vem em `http` e com `zoom=1`, que é uma miniatura de 128px — ilegível
 * numa parede de capas. Trocar para `https` não é opcional: a nossa CSP não permite `http`,
 * e a imagem seria bloqueada em silêncio (foi o que aconteceu com o avatar, ver lib/imagens.ts).
 */
function capa(links) {
  const bruto = links?.thumbnail ?? links?.smallThumbnail;
  if (!bruto) return null;
  return bruto.replace(/^http:/, "https:").replace(/&zoom=\d/, "&zoom=2").replace(/&edge=curl/, "");
}

function isbns(ids = []) {
  const acha = (t) => ids.find((i) => i.type === t)?.identifier?.replace(/[^0-9Xx]/g, "") ?? null;
  return { isbn13: acha("ISBN_13"), isbn10: acha("ISBN_10") };
}

async function buscar(autor) {
  const q = `inauthor:"${autor}"`;
  const endereco =
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}` +
    `&langRestrict=pt&printType=books&maxResults=40&orderBy=relevance`;

  /**
   * O 503 do Google é transitório e frequente: ele aparece em um a cada cinco pedidos e some
   * sozinho. Sem repetição, um autor inteiro some da semeadura por um soluço de rede — e
   * some EM SILÊNCIO, porque a função devolveria uma lista vazia igual à de quem não tem
   * livro nenhum. Falha de comunicação não pode virar ausência de dado.
   */
  let res = null;
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    res = await fetch(endereco, { headers: CHAVE ? { "X-Goog-Api-Key": CHAVE } : {} });
    if (res.ok) break;
    if (tentativa === 4) {
      console.log(`   ! ${autor}: o Google respondeu ${res.status}, e desisti depois de 4 tentativas`);
      return [];
    }
    await dorme(1500 * tentativa);
  }
  const data = await res.json();
  const achados = [];

  for (const v of data.items ?? []) {
    const info = v.volumeInfo ?? {};
    const { isbn13, isbn10 } = isbns(info.industryIdentifiers);
    const url = capa(info.imageLinks);

    // A REGRA DURA: capa E ISBN. Ver o cabeçalho.
    if (!url || !isbn13) continue;

    /**
     * `pt-BR`, E NÃO `pt`. Esta linha era `info.language !== "pt"`, e ela descartava CEM
     * POR CENTO dos livros — o Google devolve `pt-BR` para a edição brasileira, que é
     * justamente a que a gente quer.
     *
     * O script rodou até o fim, imprimiu "0 livros" para os cinquenta e cinco autores, e não
     * levantou um erro sequer. Um filtro errado não falha: ele devolve uma lista vazia, com
     * cara de resposta. É a lei que este repositório mais repete, e ela pegou o script que
     * eu estava escrevendo para obedecê-la.
     */
    if (!String(info.language ?? "").toLowerCase().startsWith("pt")) continue;

    /**
     * O autor tem que ser ELE. `inauthor:` do Google é generoso: ele devolve o livro em que
     * a pessoa escreveu o PREFÁCIO, a coletânea em que ela tem um conto, e o livro SOBRE
     * ela. Semear "Análise da obra de Chico Buarque" como se fosse um livro do Chico é
     * poluir o acervo com o nome certo, que é a poluição mais difícil de achar depois.
     */
    const autores = info.authors ?? [];
    const primeiro = autores[0];
    if (!primeiro) continue;
    const igual = (a, b) =>
      a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f.]/g, "").trim() ===
      b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f.]/g, "").trim();
    if (!igual(primeiro, autor)) continue;

    achados.push({
      autor,
      titulo: (info.title ?? "").trim(),
      isbn13,
      isbn10,
      editora: info.publisher ?? null,
      ano: info.publishedDate ? Number(String(info.publishedDate).slice(0, 4)) || null : null,
      paginas: info.pageCount ?? null,
      capa: url,
      google: v.id,
    });
  }

  // O mesmo ISBN pode voltar duas vezes no mesmo lote.
  const porIsbn = new Map();
  for (const a of achados) if (!porIsbn.has(a.isbn13)) porIsbn.set(a.isbn13, a);
  return [...porIsbn.values()];
}

// ─────────────────────────────────────────────────────── a colheita

console.log(`\n  Semeando ${AGORA.length} autores do que se lê hoje.`);
console.log(`  ${CHAVE ? "Com chave do Google." : "SEM chave do Google: o limite é baixo, e pode falhar."}\n`);

const colheita = [];
for (const [i, a] of AGORA.entries()) {
  const livros = await buscar(a.nome);
  colheita.push(...livros);
  console.log(`   ${String(i + 1).padStart(2)}/${AGORA.length}  ${a.nome.padEnd(26)} ${String(livros.length).padStart(2)} livros`);
  // Uma requisição por segundo. É uma API pública e a gente não tem pressa nenhuma.
  await dorme(1000);
}

const porIsbn = new Map();
for (const l of colheita) if (!porIsbn.has(l.isbn13)) porIsbn.set(l.isbn13, l);
const livros = [...porIsbn.values()];

console.log(`\n  ─────────────────────────────────────────────────────────────`);
console.log(`  ${n(livros.length)} livros com capa E ISBN, em português.`);

// Quantos já temos? É a medida de o quanto o acervo estava de fato cego.
const jaTemos = livros.length
  ? (await sql`
      select count(*)::int as n from editions
       where isbn13 = any(${livros.map((l) => l.isbn13)})`)[0].n
  : 0;

console.log(`  ${n(jaTemos)} já estão no acervo.`);
console.log(`  ${n(livros.length - jaTemos)} são NOVOS.\n`);

const amostra = livros.filter((_, i) => i % Math.max(1, Math.floor(livros.length / 12)) === 0).slice(0, 12);
for (const l of amostra) {
  console.log(`   · ${l.titulo.slice(0, 42).padEnd(43)}${String(l.autor).slice(0, 20).padEnd(21)}${l.editora ?? "—"}`);
}

if (!EXECUTAR) {
  console.log(
    "\n  ─────────────────────────────────────────────────────────────\n" +
      "  NADA FOI GRAVADO. Isto foi só a medição.\n\n" +
      "  Para semear de verdade:  node --experimental-strip-types scripts/semear.mjs --executar\n",
  );
  await sql.end();
  process.exit(0);
}

// ─────────────────────────────────────────────────────── a gravação

console.log("\n  Gravando.\n");

await sql`
  create temp table stage_bt (
    edition_id uuid default gen_random_uuid(),
    author_name text, title text, isbn13 text, isbn10 text,
    publisher text, published_year int, page_count int, cover_url text, google text)`;

for (const l of livros) {
  // O PORTÃO (lib/autores.ts), o mesmo que o import da Open Library usa. A lista do
  // BookTok é curada, então o nome já vem limpo — mas o portão é a lei: nenhuma porta
  // escreve em `authors` por fora dele, e um nome que não passa (uma etiqueta, um vazio)
  // não vira autor nem arrasta o livro junto.
  const autor = limparNomeDeAutor(l.autor);
  if (!autor) continue;
  await sql`
    insert into stage_bt (author_name, title, isbn13, isbn10, publisher, published_year, page_count, cover_url, google)
    values (${autor}, ${l.titulo}, ${l.isbn13}, ${l.isbn10}, ${l.editora},
            ${l.ano}, ${l.paginas}, ${l.capa}, ${l.google})`;
}

const antes = (await sql`select count(*)::int as n from works`)[0].n;

// ── autores. O mesmo desenho de slug da migration 0016 e do import-openlibrary.
await sql`
  insert into authors (name, slug)
  select distinct on (author_name) author_name,
         trim(both '-' from regexp_replace(lower(immutable_unaccent(author_name)), '[^a-z0-9]+', '-', 'g'))
    from stage_bt
   order by author_name
  on conflict do nothing`;

/**
 * ── obras. Uma linha por (título, autor): as várias edições de "Verity" são a MESMA obra.
 *
 * O slug pode colidir com um que já existe (outro "Verity" de outro autor), e a colisão não
 * pode virar um contador — um contador renumera o endereço público de alguém a cada
 * importação. Ela vira o ISBN-13, que é único por construção e estável entre execuções.
 */
await sql`
  with obra as (
    select distinct on (lower(title), author_name)
           title, author_name,
           min(isbn13) over (partition by lower(title), author_name) as chave
      from stage_bt
     order by lower(title), author_name, title
  ),
  base as (
    select o.title, a.id as author_id, o.chave,
           coalesce(nullif(trim(both '-' from regexp_replace(
             lower(immutable_unaccent(o.title || '-' || o.author_name)), '[^a-z0-9]+', '-', 'g')), ''), 'obra') as slug
      from obra o join authors a on a.name = o.author_name
  )
  insert into works (slug, title, author_id)
  select case when not exists (select 1 from works w where w.slug = b.slug)
              then b.slug else b.slug || '-' || b.chave end,
         b.title, b.author_id
    from base b
  on conflict do nothing`;

// ── edições. Pula o ISBN que já existe: é isto que torna o script idempotente.
await sql`
  insert into editions (id, work_id, isbn13, publisher, published_year, language, page_count, cover_url)
  select s.edition_id, w.id, s.isbn13, s.publisher, s.published_year, 'por', s.page_count, s.cover_url
    from stage_bt s
    join authors a on a.name = s.author_name
    join works w on w.author_id = a.id and lower(w.title) = lower(s.title)
   where not exists (select 1 from editions e where e.isbn13 = s.isbn13)
  on conflict do nothing`;

// ── identificadores. O join contra `editions` garante que só a edição que de fato entrou
// ganha identificador: o id foi sorteado na staging, e nem toda linha da staging entrou.
for (const [kind, coluna] of [["isbn13", "isbn13"], ["isbn10", "isbn10"], ["google_books", "google"]]) {
  await sql`
    insert into identifiers (edition_id, kind, value)
    select e.id, ${kind}::identifier_kind, s.${sql(coluna)}
      from stage_bt s join editions e on e.id = s.edition_id
     where s.${sql(coluna)} is not null
    on conflict do nothing`;
}

const depois = (await sql`select count(*)::int as n from works`)[0].n;
const edicoes = (await sql`
  select count(*)::int as n from editions e
   join stage_bt s on s.edition_id = e.id`)[0].n;

await sql`drop table stage_bt`;
await sql`analyze works, editions, authors, identifiers`;

console.log(`  ✓ obras:   ${n(antes)} → ${n(depois)}  (${n(depois - antes)} novas)`);
console.log(`  ✓ edições: ${n(edicoes)} gravadas com capa e ISBN\n`);

await sql.end();

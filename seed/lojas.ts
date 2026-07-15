/**
 * ════════════════════════════════════════════════════════════════════
 *  O VOLUME BRASILEIRO, das obras que o Brasil lê.
 *
 *  Uma requisição a cada 2,5 segundos. A Panini recusou três páginas quando eu
 *  fui a uma por segundo — e uma recusa é ela pedindo calma. Ninguém está com
 *  pressa: as 49 páginas de Berserk levam dois minutos, e o catálogo inteiro leva
 *  horas. É o certo.
 *
 *  E o `LojaRecusou` LEVANTA em vez de fingir ausência. Se três páginas virassem
 *  "esses volumes não existem", a prateleira mostraria três buracos falsos — e o
 *  leitor iria comprar o que já tem. Ver AGENTS.md.
 *
 *  Uso:  node --experimental-strip-types seed/lojas.ts            (amostra)
 *        node --experimental-strip-types seed/lojas.ts --executar
 * ════════════════════════════════════════════════════════════════════
 */
import { Pool } from "pg";
import {
  PANINI, JBC, enderecosDoSitemap, volumeDaLoja, LojaRecusou, type VolumeBR,
} from "../lib/lojas.ts";

const EXECUTAR = process.argv.includes("--executar");

/**
 * AS OBRAS QUE O BRASIL LÊ. Escolha editorial assinada, como o cânone.
 *
 * Não é "todo o catálogo da Panini": é o que as pessoas procuram. O que não estiver
 * aqui e alguém procurar, a TORNEIRA pega — a fila de buscas sem resultado já existe, e
 * é ela que diz o que trazer em seguida.
 */
const POPULARES = [
  "berserk", "death-note", "vagabond", "fullmetal-alchemist", "vinland-saga",
  "evangelion", "chainsaw-man", "dandadan", "one-piece", "naruto", "bleach",
  "dragon-ball", "jujutsu-kaisen", "attack-on-titan", "ataque-dos-titas",
  "demon-slayer", "kimetsu", "hunter-x-hunter", "jojo", "monster", "20th-century",
  "slam-dunk", "tokyo-ghoul", "my-hero-academia", "boku-no-hero", "haikyu",
  "blue-lock", "spy-x-family", "oshi-no-ko", "tokyo-revengers", "sakamoto",
  "kagurabachi", "solo-leveling", "black-clover", "fairy-tail", "inuyasha",
  "sailor-moon", "cavaleiros-do-zodiaco", "saint-seiya", "yu-yu-hakusho",
  "hellsing", "gantz", "parasyte", "pluto", "astro-boy", "nana", "fruits-basket",
  "beastars", "kaiju-no-8", "to-your-eternity", "vagabond", "real",
];

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

const alvo = new RegExp(POPULARES.join("|"), "i");

console.log(`\n  Procurando ${POPULARES.length} obras populares nos sitemaps.\n`);

const paginas: string[] = [];
for (const loja of [PANINI, JBC]) {
  const urls = await enderecosDoSitemap(loja.sitemap, alvo);
  console.log(`  ${loja.nome.padEnd(8)} ${urls.length} páginas`);
  paginas.push(...urls);
}

console.log(`\n  ${paginas.length} páginas a ler, a uma cada 2,5s → ~${Math.round(paginas.length * 2.5 / 60)} min\n`);

const volumes: VolumeBR[] = [];
const recusadas: string[] = [];

for (const [i, u] of paginas.entries()) {
  try {
    const v = await volumeDaLoja(u);
    if (v && v.volume && v.isbn13) volumes.push(v);
  } catch (e) {
    // A loja recusou. NÃO é "este volume não existe". Ver AGENTS.md.
    if (e instanceof LojaRecusou) {
      recusadas.push(u);
      await espera(15_000);
    }
  }
  await espera(1500);

  if ((i + 1) % 25 === 0) {
    process.stdout.write(`\r  ${i + 1}/${paginas.length} · ${volumes.length} volumes · ${recusadas.length} recusadas`);
  }
}

console.log(`\n\n  ${volumes.length} volumes com número E ISBN.`);
if (recusadas.length) {
  console.log(`  ⚠ ${recusadas.length} páginas a loja recusou. NÃO é ausência: rode de novo.`);
}

/** Agrupa por (obra, edição). É isso que separa as duas coleções de Berserk. */
function obraDe(titulo: string): string {
  return titulo
    .replace(/\s*[-–—]\s*\d+\s*$/, "")
    .replace(/\b(vol\.?|volume|n[ºo°]\.?)\s*\d+.*$/i, "")
    .replace(/\s*[-–—]\s*edi[çc][ãa]o.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

const colecoes = new Map<string, { obra: string; edicao: string | null; vols: VolumeBR[] }>();
for (const v of volumes) {
  const obra = obraDe(v.titulo);
  const chave = `${obra.toLowerCase()}|${v.edicao ?? ""}`;
  if (!colecoes.has(chave)) colecoes.set(chave, { obra, edicao: v.edicao, vols: [] });
  colecoes.get(chave)!.vols.push(v);
}

console.log(`\n  ══ ${colecoes.size} COLEÇÕES ══\n`);
for (const c of [...colecoes.values()].sort((a, b) => b.vols.length - a.vols.length).slice(0, 30)) {
  const nums = c.vols.map((v) => v.volume!).sort((a, b) => a - b);
  const nome = c.edicao ? `${c.obra} — ${c.edicao}` : c.obra;
  console.log(`    ${nome.slice(0, 44).padEnd(46)}${String(c.vols.length).padStart(3)} vol   ${nums[0]}–${nums[nums.length - 1]}`);
}

if (!EXECUTAR) {
  console.log(`\n  NADA FOI GRAVADO. Isto foi a amostra.`);
  console.log(`  Para gravar:  node --experimental-strip-types seed/lojas.ts --executar\n`);
  process.exit(0);
}

console.log(`\n  gravando…\n`);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let gravadas = 0;
let gravados = 0;

for (const c of colecoes.values()) {
  // A SÉRIE já existe (veio da AniList). Casa pelo título ou pelos sinônimos.
  const { rows: s } = await pool.query<{ id: string }>(
    `select id from series
      where immutable_unaccent(lower(title)) = immutable_unaccent(lower($1))
         or immutable_unaccent(lower($1)) = any (
              select immutable_unaccent(lower(x)) from unnest(alt_titles) x)
      limit 1`,
    [c.obra],
  );
  if (!s[0]) continue; // a obra não está no acervo. Vira tarefa, não chute.

  const titulo = c.edicao ? `${c.obra} — ${c.edicao}` : c.obra;
  const slug = titulo.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);

  const { rows: col } = await pool.query<{ id: string }>(
    `insert into colecoes (series_id, slug, title, publisher, total_volumes, cover_url, loja_url)
     values ($1, $2::citext, $3, $4, $5, $6, $7)
     on conflict (series_id, title) do update
       set total_volumes = greatest(colecoes.total_volumes, excluded.total_volumes),
           cover_url = coalesce(colecoes.cover_url, excluded.cover_url)
     returning id`,
    [s[0].id, slug, titulo, "Panini", Math.max(...c.vols.map((v) => v.volume!)),
     c.vols[0]!.capaUrl, c.vols[0]!.ondeComprar],
  );
  gravadas++;

  const { rows: aut } = await pool.query<{ author_id: string }>(
    `select author_id from series where id = $1`, [s[0].id],
  );

  for (const v of c.vols) {
    const vslug = `${slug}-vol-${v.volume}`.slice(0, 80);

    const { rows: w } = await pool.query<{ id: string }>(
      `insert into works (slug, title, author_id, series_id, colecao_id, volume, needs_review, author_source)
       values ($1::citext, $2, $3, $4, $5, $6, true, 'work')
       on conflict on constraint works_title_author_volume do update set colecao_id = excluded.colecao_id
       returning id`,
      [vslug, v.titulo, aut[0]?.author_id ?? null, s[0].id, col[0]!.id, v.volume],
    );
    if (!w[0]) continue;

    // O ISBN e a CAPA moram na edição — é onde o ISBN sempre morou. E é o ISBN por
    // volume que faz o leitor de código de barras existir.
    await pool.query(
      `insert into editions (work_id, isbn13, publisher, cover_url, format)
       values ($1, $2, 'Panini', $3, 'paperback')
       on conflict (isbn13) do nothing`,
      [w[0].id, v.isbn13, v.capaUrl],
    );
    gravados++;
  }
}

console.log(`\n  ✓ ${gravadas} coleções · ${gravados} volumes brasileiros, com ISBN e capa.\n`);
await pool.end();

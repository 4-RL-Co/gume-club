#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  DOIS CONSERTOS NA FICHA DO AUTOR, E OS DOIS SÓ APARECERAM OLHANDO O DADO.
 *
 *  ═══ 1. O PAÍS ESTAVA ESCRITO DE QUATRO JEITOS ═══
 *
 *      Brasil (778)     ·  Brasileira (11)
 *      Reino Unido      ·  "Unido" (8)        ← estrago da minha própria regex
 *      Clarice Lispector:  "Socialista Soviética Ucraniana"   ← idem
 *
 *  A /estatisticas diz "você leu autores de sete países". Com o Brasil contado duas
 *  vezes, ela diria oito — e uma estatística que conta a mesma coisa duas vezes é uma
 *  estatística em que ninguém confia.
 *
 *  A regra mora em lib/paises.ts, com teste. Aqui ela só é aplicada ao que já está no
 *  banco.
 *
 *  ═══ 2. A BIOGRAFIA DO MACHADO ESTAVA EM INGLÊS ═══
 *
 *      Machado de Assis — "Machado de Assis was a pioneer Brazilian novelist..."
 *
 *  O backfill da Open Library escreveu primeiro, o do Wikidata veio depois com um
 *  `coalesce(bio, ...)` — e o coalesce, por definição, respeita o que já estava lá.
 *  Respeitou um texto que o leitor não entende.
 *
 *  A tela já esconde a bio em inglês (ver components/prosa.tsx e lib/idioma.ts), então
 *  hoje a página do Machado mostra **nada** — quando o Wikidata tem, em português:
 *
 *      "escritor brasileiro (1839–1908)"
 *
 *  Curto, mas é uma frase que a pessoa lê. Ela entra no lugar.
 *
 *  Uso:  node --experimental-strip-types scripts/arrumar-autor.mjs
 *        node --experimental-strip-types scripts/arrumar-autor.mjs --executar
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { paisDe } from "../lib/paises.ts";
import { ehIngles } from "../lib/idioma.ts";

const env = readFileSync(".env", "utf8");
const url = process.env.DATABASE_URL ?? env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const EXECUTAR = process.argv.includes("--executar");
const PAUSA_MS = 350;
const QUEM_SOMOS = "Gume/1.0 (registro de leitura aberto; gume.club; contato@gume.club)";

const sql = postgres(url, { max: 1 });
const n = (v) => Number(v).toLocaleString("pt-BR");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────── 1. o país

console.log("\n1. o país, escrito de um jeito só\n");

const paises = await sql`
  select id, name, nationality from authors where nationality is not null`;

const arrumar = [];
for (const a of paises) {
  const certo = paisDe(a.nationality);
  if (certo && certo !== a.nationality) arrumar.push({ id: a.id, de: a.nationality, para: certo });
}

const grupos = new Map();
for (const x of arrumar) {
  const k = `${x.de} → ${x.para}`;
  grupos.set(k, (grupos.get(k) ?? 0) + 1);
}

console.log(`  ${n(arrumar.length)} autores com o país escrito de outro jeito\n`);
for (const [k, q] of [...grupos.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`     ${String(q).padStart(4)}×  ${k}`);
}

// ─────────────────────────────────────────────────── 2. a bio em inglês

console.log("\n2. a biografia que o leitor não entende\n");

/**
 * Autor com bio em inglês E com QID do Wikidata. O QID é a ponte: sem ele, não há para
 * onde ir buscar a frase em português, e a bio inglesa fica onde está — escondida da
 * tela, mas no banco, porque é dado válido e vai para o dataset.
 */
const comBio = await sql`
  select id, name, bio, wikidata_id from authors
   where bio is not null and wikidata_id is not null`;

const inglesas = comBio.filter((a) => ehIngles(a.bio));
console.log(`  ${n(comBio.length)} autores com bio e com QID`);
console.log(`  ${n(inglesas.length)} dessas bios estão em INGLÊS, e hoje a tela mostra nada\n`);

if (!EXECUTAR) {
  console.log("  NADA FOI MUDADO. Isto foi a medição.");
  console.log("  Para executar:  node --experimental-strip-types scripts/arrumar-autor.mjs --executar\n");
  await sql.end();
  process.exit(0);
}

// ─────────────────────────────────────────────────── 3. executar

console.log("\n3. arrumando\n");

for (let i = 0; i < arrumar.length; i += 200) {
  await sql.begin(async (tx) => {
    for (const x of arrumar.slice(i, i + 200)) {
      await tx`update authors set nationality = ${x.para} where id = ${x.id}::uuid`;
    }
  });
}
console.log(`  ✓ ${n(arrumar.length)} países escritos de um jeito só`);

/**
 * A descrição em português, do Wikidata. Ela é CC0, e entra no dataset.
 *
 * O tempo esgotado LANÇA, e não devolve status — sem o try, a rede piscando derrubava
 * o script no meio e o resto das bios ficava em inglês na tela. Ver AGENTS.md.
 */
async function descricaoPt(qid, tentativas = 3) {
  for (let i = 0; i < tentativas; i++) {
    let res;
    try {
      res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, {
        headers: { "User-Agent": QUEM_SOMOS, Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      await espera(1500 * 2 ** i);
      continue;
    }

    if (res.status === 429 || res.status >= 500) {
      await espera(1500 * 2 ** i);
      continue;
    }
    if (!res.ok) return null;

    const j = await res.json();
    const e = j?.entities?.[qid];
    return e?.descriptions?.pt?.value ?? e?.descriptions?.["pt-br"]?.value ?? null;
  }

  // Não deu para perguntar. A bio inglesa fica onde está, escondida da tela — e não
  // é apagada nem substituída por nada. Ver AGENTS.md.
  return null;
}

let trocadas = 0;
for (const a of inglesas) {
  const pt = await descricaoPt(a.wikidata_id);
  await espera(PAUSA_MS);

  // Uma descrição que também está em inglês não serve. E o Wikidata não ter nada em
  // português é uma RESPOSTA — a bio inglesa fica onde está, escondida da tela.
  if (!pt || ehIngles(pt)) continue;

  await sql`
    update authors
       set bio = ${pt},
           bio_source = 'wikidata'
     where id = ${a.id}::uuid`;
  trocadas++;

  if (trocadas % 25 === 0) process.stdout.write(`\r  bios: ${n(trocadas)}`);
}

console.log(`\n  ✓ ${n(trocadas)} biografias em inglês trocadas pela frase em português do Wikidata`);

const [fim] = await sql`
  select count(distinct nationality)::int as paises,
         count(*) filter (where bio is not null)::int as com_bio,
         count(*) filter (where image_url is not null)::int as com_foto
    from authors`;

console.log(`\n  ✓ ${n(fim.paises)} países distintos no acervo`);
console.log(`  ✓ ${n(fim.com_bio)} autores com biografia · ${n(fim.com_foto)} com foto\n`);

await sql.end();

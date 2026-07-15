#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  A SINOPSE DA OBRA, E O ROSTO DO AUTOR.
 *
 *  O acervo tem 126.695 autores. ZERO com foto, ZERO com biografia. E nenhuma obra
 *  tem sinopse: a página de um livro mostra título, autor e capa, e mais nada. Quem
 *  não conhece o livro não tem como decidir se quer lê-lo.
 *
 *  ═══ DE ONDE VEM, E POR QUE NÃO PRECISA DE RASPAGEM ═══
 *
 *  Dos DUMPS que já estão no disco. Sem cota, sem esperar, sem pedir licença a
 *  ninguém — e, o que importa mais: **o dado da Open Library é CC0**.
 *
 *  Ou seja, ele é exatamente o que PODE entrar no dataset CC0 que o Gume promete
 *  publicar. A sinopse da loja da Panini, não: aquilo é texto autoral, com direito,
 *  e pôr texto protegido num dataset CC0 é relicenciar o que não é nosso.
 *
 *  A linha do ai/PRD.md não se moveu: fato pode vir de qualquer fonte; OBRA de
 *  terceiro, não. O que mudou é que a fonte certa estava aqui o tempo todo.
 *
 *  ═══ E O WIKIDATA COMPLETA O QUE FALTA ═══
 *
 *  A Open Library tem foto de 6 em 8 dos autores que testei, e biografia de 4 em 8:
 *  Clarice Lispector e Tolkien ficariam sem rosto.
 *
 *  O Wikidata tem foto (Wikimedia Commons) e descrição de praticamente todo autor
 *  conhecido, e também é **CC0**. A ponte já existe: a Open Library guarda o QID em
 *  `remote_ids.wikidata`.
 *
 *  ═══ POR REFERÊNCIA, NUNCA POR CÓPIA ═══
 *
 *  A foto de um autor é obra de um fotógrafo. A gente guarda o ENDEREÇO e mostra da
 *  origem. Mostrar não é republicar; baixar o arquivo é.
 *
 *  Uso:  node --experimental-strip-types scripts/backfill-sinopse.mjs
 *        node --experimental-strip-types scripts/backfill-sinopse.mjs --executar
 * ════════════════════════════════════════════════════════════════════
 */
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import path from "node:path";
import postgres from "postgres";

const env = readFileSync(".env", "utf8");
const doEnv = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const url = process.env.DATABASE_URL ?? doEnv("DATABASE_URL");
if (!url) throw new Error("DATABASE_URL não encontrado");

const DUMP = process.env.OPENLIBRARY_DUMP_DIR ?? doEnv("OPENLIBRARY_DUMP_DIR") ?? ".dump";
const EXECUTAR = process.argv.includes("--executar");

const sql = postgres(url, { max: 1 });
const n = (v) => Number(v).toLocaleString("pt-BR");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** Cada linha do dump é um TSV de cinco colunas, e a quinta é o JSON do registro. */
async function* registros(arquivo, rotulo) {
  const local = path.join(DUMP, arquivo);
  if (!existsSync(local)) throw new Error(`o dump não está no disco: ${local}`);

  console.log(`  lendo ${local} (${(statSync(local).size / 1e9).toFixed(1)} GB)`);

  const linhas = createInterface({
    input: createReadStream(local).pipe(createGunzip()),
    crlfDelay: Infinity,
  });

  let vistas = 0;
  const inicio = Date.now();
  for await (const linha of linhas) {
    if (++vistas % 5_000_000 === 0) {
      console.log(`  ${rotulo}: ${(vistas / 1e6).toFixed(0)}M linhas em ${((Date.now() - inicio) / 60000).toFixed(1)} min`);
    }
    const json = linha.split("\t")[4];
    if (!json) continue;
    try {
      yield JSON.parse(json);
    } catch {
      // uma linha corrompida não derruba uma leitura de horas
    }
  }
}

/**
 * O texto, de onde ele estiver.
 *
 * A Open Library guarda `description` e `bio` ora como string, ora como
 * `{ type, value }`. Ler só um dos dois formatos perderia metade do dado em silêncio —
 * e um dado que se perde em silêncio é o bug mais caro deste projeto.
 */
function texto(campo) {
  const t = typeof campo === "string" ? campo : campo?.value;
  if (typeof t !== "string") return null;

  const limpo = t
    // A Open Library cola a fonte no fim da descrição, entre colchetes ou depois de
    // "----------". Isso não é a sinopse: é rodapé, e ele não vai para a tela.
    .split(/\n-{4,}|\r?\n\s*\[?source\]?:/i)[0]
    .replace(/\(\[source\][^)]*\)/gi, "")
    .replace(/\r/g, "")
    .trim();

  // Curto demais não é uma sinopse: é um resto. Longo demais é o livro inteiro.
  if (limpo.length < 40 || limpo.length > 4000) return null;
  return limpo;
}

// ─────────────────────────────────────────────────── 1. o que precisa

console.log("\n1. o que está faltando\n");

const [antes] = await sql`
  select (select count(*) from works where description is null) as obras_sem_sinopse,
         (select count(*) from authors where bio is null) as autores_sem_bio,
         (select count(*) from authors where image_url is null) as autores_sem_foto`;

console.log(`  ${n(antes.obras_sem_sinopse)} obras sem sinopse`);
console.log(`  ${n(antes.autores_sem_bio)} autores sem biografia`);
console.log(`  ${n(antes.autores_sem_foto)} autores sem foto`);

const obras = await sql`
  select openlibrary_key as k, id from works
   where openlibrary_key is not null and description is null`;
const precisaObra = new Map(obras.map((r) => [r.k, r.id]));

const autores = await sql`
  select openlibrary_key as k, id from authors
   where openlibrary_key is not null and (bio is null or image_url is null)`;
const precisaAutor = new Map(autores.map((r) => [r.k, r.id]));

console.log(`\n  ${n(precisaObra.size)} obras e ${n(precisaAutor.size)} autores têm chave da Open Library.`);

// ─────────────────────────────────────────────────── 2. o dump de obras

console.log("\n2. o dump de OBRAS — a sinopse\n");

const sinopses = new Map();
for await (const rec of registros("ol_dump_works.txt.gz", "obras")) {
  const id = precisaObra.get(rec.key);
  if (!id) continue;

  const d = texto(rec.description);
  if (d) sinopses.set(id, d);
}
console.log(`\n  ${n(sinopses.size)} obras têm sinopse no dump.`);

// ─────────────────────────────────────────────────── 3. o dump de autores

console.log("\n3. o dump de AUTORES — a biografia, a foto e o QID do Wikidata\n");

const perfis = new Map();
for await (const rec of registros("ol_dump_authors.txt.gz", "autores")) {
  const id = precisaAutor.get(rec.key);
  if (!id) continue;

  const bio = texto(rec.bio);

  /**
   * `photos[0]`: a Open Library declara que a PRIMEIRA foto é a principal — é a que ela
   * mesma serve em `covers.openlibrary.org/a/id/...`. Aqui a ordem SIGNIFICA alguma
   * coisa, e a fonte diz isso. Ver AGENTS.md.
   */
  const foto = (rec.photos ?? []).find((p) => typeof p === "number" && p > 0);

  const qid = rec.remote_ids?.wikidata ?? null;

  if (bio || foto || qid) {
    perfis.set(id, {
      bio,
      foto: foto ? `https://covers.openlibrary.org/a/id/${foto}-L.jpg` : null,
      qid: typeof qid === "string" && /^Q\d+$/.test(qid) ? qid : null,
    });
  }
}

const comBio = [...perfis.values()].filter((p) => p.bio).length;
const comFoto = [...perfis.values()].filter((p) => p.foto).length;
const comQid = [...perfis.values()].filter((p) => p.qid).length;

console.log(`\n  ${n(comBio)} com biografia · ${n(comFoto)} com foto · ${n(comQid)} com QID do Wikidata`);

// ─────────────────────────────────────────────────── 4. a amostra

if (!EXECUTAR) {
  const [amostraObras] = await sql`
    select title, id from works where id = any(${[...sinopses.keys()].slice(0, 6)}::uuid[])`
    .then((r) => [r]);

  console.log("\n  ─────────────────────────────────────────────────────────────");
  console.log("  A AMOSTRA — é isto que seria gravado:\n");

  console.log("  SINOPSE:\n");
  for (const o of amostraObras.slice(0, 4)) {
    console.log(`    ${o.title}`);
    console.log(`      ${sinopses.get(o.id).slice(0, 100).replace(/\n/g, " ")}…\n`);
  }

  const nomes = await sql`
    select name, id from authors where id = any(${
      [...perfis.entries()].filter(([, p]) => p.bio && p.foto).slice(0, 6).map(([id]) => id)
    }::uuid[])`;

  console.log("  AUTOR (foto + biografia):\n");
  for (const a of nomes.slice(0, 4)) {
    const p = perfis.get(a.id);
    console.log(`    ${a.name}${p.qid ? `  [${p.qid}]` : ""}`);
    console.log(`      ${p.bio.slice(0, 90).replace(/\n/g, " ")}…\n`);
  }

  console.log("  NADA FOI GRAVADO. Isto foi a amostra.");
  console.log("  Para gravar:  node --experimental-strip-types scripts/backfill-sinopse.mjs --executar\n");
  await sql.end();
  process.exit(0);
}

// ─────────────────────────────────────────────────── 5. escrever

console.log("\n4. escrevendo\n");

let escritasObras = 0;
const listaObras = [...sinopses.entries()];
for (let i = 0; i < listaObras.length; i += 500) {
  await sql.begin(async (tx) => {
    for (const [id, d] of listaObras.slice(i, i + 500)) {
      await tx`
        update works
           set description = ${d},
               -- A PROCEDÊNCIA, gravada. O dataset CC0 do Gume só é uma promessa de
               -- verdade se der para AUDITAR de onde veio cada texto.
               description_source = 'openlibrary'
         where id = ${id}::uuid and description is null`;
      escritasObras++;
    }
  });
  process.stdout.write(`\r  sinopses: ${n(escritasObras)}/${n(listaObras.length)}`);
}

let escritosAutores = 0;
const listaAutores = [...perfis.entries()];
for (let i = 0; i < listaAutores.length; i += 500) {
  await sql.begin(async (tx) => {
    for (const [id, p] of listaAutores.slice(i, i + 500)) {
      await tx`
        update authors
           set bio          = coalesce(bio, ${p.bio}),
               bio_source   = case when bio is null and ${p.bio}::text is not null
                                   then 'openlibrary'::texto_fonte else bio_source end,
               -- A FOTO É O ENDEREÇO, nunca o arquivo. Ela mora na origem.
               image_url    = coalesce(image_url, ${p.foto}),
               image_source = case when image_url is null and ${p.foto}::text is not null
                                   then 'openlibrary'::texto_fonte else image_source end,
               wikidata_id  = coalesce(wikidata_id, ${p.qid})
         where id = ${id}::uuid`;
      escritosAutores++;
    }
  });
  process.stdout.write(`\r  autores: ${n(escritosAutores)}/${n(listaAutores.length)}`);
}

const [depois] = await sql`
  select (select count(*) from works where description is not null) as obras_com_sinopse,
         (select count(*) from authors where bio is not null) as com_bio,
         (select count(*) from authors where image_url is not null) as com_foto,
         (select count(*) from authors where wikidata_id is not null) as com_qid`;

console.log(`\n\n  ✓ ${n(depois.obras_com_sinopse)} obras com sinopse`);
console.log(`  ✓ ${n(depois.com_bio)} autores com biografia · ${n(depois.com_foto)} com foto`);
console.log(`  ✓ ${n(depois.com_qid)} autores com QID do Wikidata (a ponte para o país e para a foto que falta)\n`);

void espera;
await sql.end();

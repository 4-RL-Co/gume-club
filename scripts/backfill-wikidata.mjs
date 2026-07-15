#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  O ROSTO, A DESCRIÇÃO E O PAÍS DO AUTOR. Do Wikidata.
 *
 *  ═══ POR QUE NÃO A OPEN LIBRARY ═══
 *
 *  O dump dela tem biografia de 1.540 autores e foto de 2.618 — de 126.695. Um
 *  por cento. Clarice Lispector e Tolkien ficariam sem rosto.
 *
 *  O Wikidata tem os oito de oito que eu testei, com descrição EM PORTUGUÊS, foto
 *  e país:
 *
 *      Machado de Assis       escritor brasileiro (1839–1908)      foto · país
 *      Clarice Lispector      escritora, poeta e jornalista…       foto · país
 *      Itamar Vieira Junior   Escritor brasileiro                  foto · país
 *      Kentaro Miura          mangaká japonês (1966-2021)                 país
 *
 *  E ele é **CC0** — igual à Open Library, e igual ao dataset aberto que o Gume
 *  promete publicar. Sem cota, sem chave, sem raspagem.
 *
 *  ═══ A NACIONALIDADE, QUE ESTÁ NULA EM 100% DAS LINHAS ═══
 *
 *  A seção de países da /estatisticas — "você leu autores de sete países" — não tem
 *  dado nenhum por trás. É uma das melhores telas do app, e ela não pode funcionar.
 *
 *  O Wikidata sabe: é a propriedade P27 (cidadania). E a Open Library NÃO sabe:
 *  ela guarda nome, datas e bio, e nenhum campo de país. Testei.
 *
 *  ═══ A FOTO É POR REFERÊNCIA ═══
 *
 *  Ela vem do Wikimedia Commons, e a gente guarda o ENDEREÇO. A foto de um autor é
 *  obra de um fotógrafo: mostrar da origem não é republicar; baixar o arquivo é.
 *  Ver ai/PRD.md.
 *
 *  Uso:  node --experimental-strip-types scripts/backfill-wikidata.mjs
 *        node --experimental-strip-types scripts/backfill-wikidata.mjs --executar
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { paisDe } from "../lib/paises.ts";

const env = readFileSync(".env", "utf8");
const url = process.env.DATABASE_URL ?? env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const EXECUTAR = process.argv.includes("--executar");
const limIdx = process.argv.indexOf("--limite");
const LIMITE = limIdx > -1 ? Number(process.argv[limIdx + 1]) : 2000;

const sql = postgres(url, { max: 1 });
const n = (v) => Number(v).toLocaleString("pt-BR");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** O Wikidata é um bem comum, e ele não pede chave. Não se espreme quem não cobra. */
const PAUSA_MS = 350;
const QUEM_SOMOS = "Gume/1.0 (registro de leitura aberto; gume.club; contato@gume.club)";

export class WikidataRecusou extends Error {}

/**
 * Uma chamada, e ela NUNCA traduz recusa em ausência.
 *
 * Um 429 não quer dizer "esse autor não existe": quer dizer "não consegui perguntar". É
 * o bug mais caro deste projeto, e ele já apareceu cinco vezes. Ver AGENTS.md.
 */
async function pega(endereco, tentativas = 4) {
  for (let i = 0; i < tentativas; i++) {
    /**
     * O TEMPO ESGOTADO NÃO TEM CÓDIGO DE STATUS: ele LANÇA.
     *
     * Sem este try, a rede piscando derruba o script inteiro. Foi assim que o backfill
     * da Wikipédia morreu no autor 1.120 de 1.200. Rede caída é a mesma coisa que um
     * 503: volta para o laço, e nunca vira "não existe". Ver AGENTS.md.
     */
    let res;
    try {
      res = await fetch(endereco, {
        headers: { "User-Agent": QUEM_SOMOS, Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      await espera(1500 * 2 ** i);
      continue;
    }

    if (res.status === 404) return null; // uma RESPOSTA: não existe
    if (res.status === 429 || res.status >= 500) {
      await espera(1500 * 2 ** i);
      continue;
    }
    if (!res.ok) return null;
    return res.json();
  }
  throw new WikidataRecusou(`o Wikidata recusou até o fim: ${endereco}`);
}

/** O QID pelo NOME. É como a maioria dos nossos autores vai ser encontrada. */
async function qidPeloNome(nome) {
  const j = await pega(
    "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json" +
      `&language=pt&uselang=pt&type=item&limit=1&search=${encodeURIComponent(nome)}`,
  );
  return j?.search?.[0]?.id ?? null;
}

/** O país, pelo QID dele. Cacheado: "Brasil" é o mesmo Brasil para todo mundo. */
const paises = new Map();
async function pais(qid) {
  if (paises.has(qid)) return paises.get(qid);

  const j = await pega(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
  const e = j?.entities?.[qid];
  const bruto = e?.labels?.pt?.value ?? e?.labels?.["pt-br"]?.value ?? e?.labels?.en?.value ?? null;

  const nome = paisDe(bruto);
  paises.set(qid, nome);
  await espera(PAUSA_MS);
  return nome;
}

async function perfil(qid) {
  const j = await pega(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
  const e = j?.entities?.[qid];
  if (!e) return null;

  const descricao =
    e.descriptions?.pt?.value ?? e.descriptions?.["pt-br"]?.value ?? e.descriptions?.en?.value ?? null;

  /**
   * `P18[0]`: o Wikidata declara que a primeira imagem é a PRINCIPAL — quando há mais de
   * uma, elas vêm ordenadas por posto (`rank`), e a normal vem primeiro. Aqui a ordem
   * SIGNIFICA alguma coisa, e a fonte diz isso. Ver AGENTS.md.
   */
  const arquivo = e.claims?.P18?.[0]?.mainsnak?.datavalue?.value ?? null;

  /**
   * A FOTO POR REFERÊNCIA. `Special:FilePath` é o endereço estável do Commons — ele
   * redireciona para o arquivo, e é o jeito que a própria Wikimedia recomenda linkar.
   * A gente nunca baixa: a foto mora lá.
   */
  const foto = arquivo
    ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(arquivo)}?width=400`
    : null;

  const paisQid = e.claims?.P27?.[0]?.mainsnak?.datavalue?.value?.id ?? null;

  // É uma PESSOA? P31 (é uma instância de) = Q5 (ser humano). Sem isto, "Companhia das
  // Letras" casaria com a editora, e a foto do autor viraria a fachada de um prédio.
  const ehGente = (e.claims?.P31 ?? []).some(
    (c) => c.mainsnak?.datavalue?.value?.id === "Q5",
  );

  return { descricao, foto, paisQid, ehGente };
}

// ─────────────────────────────────────────────────────── quem precisa

console.log("\n  Os autores que APARECEM: os que têm obra, e os que têm mais obra primeiro.\n");

const alvo = await sql`
  select a.id, a.name, a.wikidata_id,
         (select count(*) from works w where w.author_id = a.id)::int as obras
    from authors a
   where exists (select 1 from works w where w.author_id = a.id)
     and (a.image_url is null or a.bio is null or a.nationality is null)
   order by obras desc
   limit ${LIMITE}`;

console.log(`  ${n(alvo.length)} autores a resolver.\n`);

const achados = [];
const recusou = [];

for (const [i, a] of alvo.entries()) {
  try {
    const qid = a.wikidata_id ?? (await qidPeloNome(a.name));
    await espera(PAUSA_MS);
    if (!qid) continue;

    const p = await perfil(qid);
    await espera(PAUSA_MS);
    if (!p) continue;

    // Não é gente? Então não é autor: é uma editora, uma instituição, um prêmio. O portão
    // de lib/autores.ts já barra a maioria; este é o segundo.
    if (!p.ehGente) continue;

    const nomeDoPais = p.paisQid ? await pais(p.paisQid) : null;

    if (p.descricao || p.foto || nomeDoPais) {
      achados.push({ id: a.id, nome: a.name, qid, ...p, pais: nomeDoPais });
    }
  } catch (e) {
    // O Wikidata recusou. NÃO é "esse autor não existe". Ver AGENTS.md.
    if (e instanceof WikidataRecusou) {
      recusou.push(a.name);
      await espera(10_000);
    }
  }

  if ((i + 1) % 25 === 0) {
    process.stdout.write(`\r  ${i + 1}/${alvo.length} · ${achados.length} achados · ${recusou.length} recusados`);
  }
}

const comFoto = achados.filter((a) => a.foto).length;
const comPais = achados.filter((a) => a.pais).length;
const comDesc = achados.filter((a) => a.descricao).length;

console.log(`\n\n  ${n(achados.length)} autores no Wikidata`);
console.log(`  ${n(comFoto)} com foto · ${n(comDesc)} com descrição · ${n(comPais)} com país\n`);

if (recusou.length) {
  console.log(`  ⚠ o Wikidata recusou ${recusou.length}. NÃO é ausência: rode de novo.\n`);
}

if (!EXECUTAR) {
  console.log("  A AMOSTRA — é isto que seria gravado:\n");
  for (const a of achados.slice(0, 15)) {
    console.log(
      `    ${a.nome.slice(0, 26).padEnd(28)}${(a.pais ?? "—").slice(0, 14).padEnd(16)}` +
        `${a.foto ? "foto" : "  — "}   ${(a.descricao ?? "").slice(0, 34)}`,
    );
  }
  console.log("\n  NADA FOI GRAVADO. Isto foi a amostra.");
  console.log("  Para gravar:  node --experimental-strip-types scripts/backfill-wikidata.mjs --executar\n");
  await sql.end();
  process.exit(0);
}

console.log("  escrevendo…\n");

let escritos = 0;
for (let i = 0; i < achados.length; i += 200) {
  await sql.begin(async (tx) => {
    for (const a of achados.slice(i, i + 200)) {
      await tx`
        update authors
           set wikidata_id  = coalesce(wikidata_id, ${a.qid}),
               -- A FOTO É O ENDEREÇO, nunca o arquivo. Ela mora no Commons.
               image_url    = coalesce(image_url, ${a.foto}),
               image_source = case when image_url is null and ${a.foto}::text is not null
                                   then 'wikidata'::texto_fonte else image_source end,
               bio          = coalesce(bio, ${a.descricao}),
               bio_source   = case when bio is null and ${a.descricao}::text is not null
                                   then 'wikidata'::texto_fonte else bio_source end,
               -- O PAÍS. Nulo em 100% das linhas até agora, e é o que sustenta a seção
               -- de países da /estatisticas.
               nationality  = coalesce(nationality, ${a.pais})
         where id = ${a.id}::uuid`;
      escritos++;
    }
  });
  process.stdout.write(`\r  ${n(escritos)}/${n(achados.length)}`);
}

const [fim] = await sql`
  select count(*) filter (where image_url is not null) as foto,
         count(*) filter (where bio is not null) as bio,
         count(*) filter (where nationality is not null) as pais
    from authors
   where exists (select 1 from works w where w.author_id = authors.id)`;

console.log(`\n\n  ✓ dos autores COM OBRA: ${n(fim.foto)} com foto · ${n(fim.bio)} com descrição · ${n(fim.pais)} com país\n`);
await sql.end();

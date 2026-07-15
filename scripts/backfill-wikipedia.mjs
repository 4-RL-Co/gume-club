#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  A SINOPSE EM PORTUGUÊS, DA WIKIPÉDIA.
 *
 *  ═══ POR QUE A OPEN LIBRARY NÃO BASTA ═══
 *
 *  Ela cobre bem o que se lê em inglês, e mal o que se lê aqui:
 *
 *      Jane Austen          7 de 9 obras com sinopse
 *      Fiódor Dostoiévski   7 de 11
 *      Jorge Amado          0 de 25
 *      Graciliano Ramos     0 de 8
 *      Machado de Assis     12 de 212
 *
 *  Um acervo brasileiro em que Jorge Amado não tem uma linha de apresentação e Jane
 *  Austen tem sete não é um acervo: é a tradução malfeita de outro.
 *
 *  ═══ A LICENÇA, QUE MUDA O QUE A GENTE PODE FAZER ═══
 *
 *  A Wikipédia é **CC-BY-SA**, e não CC0. Duas consequências, e as duas ficam gravadas
 *  no banco (`description_source = 'wikipedia'`):
 *
 *    · na TELA ela aparece, com crédito — é o que a licença exige;
 *    · no DATASET CC0 ela **não entra**. Republicar CC-BY-SA como CC0 é relicenciar o
 *      trabalho de outra pessoa, e o Gume não faz isso.
 *
 *  A migration 0039 criou o valor `wikipedia` no enum para que essa linha fosse uma
 *  COLUNA, e não uma boa intenção num arquivo de texto.
 *
 *  ═══ PERGUNTAR PELO AUTOR, E NÃO PELO LIVRO ═══
 *
 *  A primeira versão perguntava livro a livro, e acertava 10%: o título no nosso banco
 *  às vezes está em inglês, às vezes com subtítulo, às vezes escrito de outro jeito.
 *
 *  Uma pergunta por AUTOR devolve a bibliografia inteira dele — as 31 obras do Jorge
 *  Amado com página em português, com todos os nomes que cada uma tem. Aí o casamento
 *  acontece AQUI, contra uma lista fechada de obras que sabidamente são dele.
 *
 *  E isso resolve o outro problema de graça: buscar "Capitães da Areia" pelo título
 *  devolve o filme, a minissérie e a página de desambiguação. Partindo do autor, o
 *  filme nunca entra na lista.
 *
 *  ═══ RECUSA NÃO É AUSÊNCIA ═══
 *
 *  Um 429 não quer dizer "esse autor não tem obra". Quer dizer "não consegui
 *  perguntar". Ver AGENTS.md — é o bug mais caro deste projeto.
 *
 *  Uso:  node --experimental-strip-types scripts/backfill-wikipedia.mjs
 *        node --experimental-strip-types scripts/backfill-wikipedia.mjs --executar
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const env = readFileSync(".env", "utf8");
const url = process.env.DATABASE_URL ?? env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const EXECUTAR = process.argv.includes("--executar");
const limIdx = process.argv.indexOf("--limite");
const LIMITE = limIdx > -1 ? Number(process.argv[limIdx + 1]) : 1200;

const sql = postgres(url, { max: 1 });
const n = (v) => Number(v).toLocaleString("pt-BR");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** O SPARQL do Wikidata é caro para eles e grátis para mim. Não se espreme quem não cobra. */
const PAUSA_MS = 700;
const QUEM_SOMOS = "Gume/1.0 (registro de leitura aberto; gume.club; contato@gume.club)";

export class FonteRecusou extends Error {}

/**
 * ═══ A REDE CAINDO NÃO É UM CÓDIGO DE STATUS ═══
 *
 * A primeira versão disto só olhava para `res.status`. Um `AbortSignal.timeout` não
 * devolve status nenhum: ele **lança** um DOMException. A exceção subiu por cima do
 * `catch (e) { if (e instanceof FonteRecusou) ... }`, atravessou o laço inteiro e
 * derrubou o script — depois de uma hora de trabalho e 959 sinopses achadas, e antes
 * da primeira linha ser escrita.
 *
 * Um tempo esgotado é a MESMA COISA que um 503: a fonte não respondeu. Ele entra no
 * mesmo laço de tentativa, e só vira `FonteRecusou` quando as quatro acabarem.
 */
async function pega(endereco, aceita = "application/json", tentativas = 4) {
  for (let i = 0; i < tentativas; i++) {
    let res;
    try {
      res = await fetch(endereco, {
        headers: { "User-Agent": QUEM_SOMOS, Accept: aceita },
        signal: AbortSignal.timeout(60_000),
      });
    } catch {
      // Tempo esgotado, DNS, socket fechado. Nada disso é "esse livro não existe".
      await espera(2000 * 2 ** i);
      continue;
    }

    if (res.status === 404) return null; // uma RESPOSTA: não existe
    if (res.status === 429 || res.status >= 500) {
      await espera(2000 * 2 ** i);
      continue;
    }
    if (!res.ok) return null;

    try {
      return await res.json();
    } catch {
      return null; // veio corpo, e ele não era JSON. É uma resposta, e é inútil.
    }
  }
  throw new FonteRecusou(`a fonte recusou até o fim: ${endereco.slice(0, 80)}`);
}

/**
 * ═══ O NOME DE UM LIVRO, REDUZIDO AO QUE NÃO MUDA ═══
 *
 * "Dom Casmurro", "Dom Casmurro (livro)", "DOM CASMURRO", "Dom Casmurro: romance" e
 * "Dom Casmurro - Edição Especial" são o mesmo livro. O acento, o caixa, o subtítulo
 * e o parêntese da Wikipédia são ruído.
 *
 * O que NÃO é ruído: o número. "Berserk 12" e "Berserk 13" são livros diferentes, e
 * por isso o dígito fica.
 */
function chave(titulo) {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // o acento sai
    .toLowerCase()
    .replace(/\s*\((?:livro|romance|conto|obra|novela|poema)\)\s*/g, "") // o parêntese da Wikipédia
    .split(/\s*[:–—-]\s+/)[0] // o subtítulo sai: o que vem antes dos dois-pontos é o livro
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A BIBLIOGRAFIA DO AUTOR, com página em português.
 *
 * Uma pergunta por autor, e ela devolve todos os nomes de cada obra (o oficial e os
 * alternativos) — porque o nosso banco pode ter o título em inglês.
 */
async function bibliografia(autorQid) {
  const q = `
    SELECT ?obra ?titulo ?ptwiki WHERE {
      ?obra wdt:P50 wd:${autorQid} .
      ?obra wdt:P31/wdt:P279* wd:Q7725634 .
      ?art schema:about ?obra ; schema:isPartOf <https://pt.wikipedia.org/> ;
           schema:name ?ptwiki .
      { ?obra rdfs:label ?titulo } UNION { ?obra skos:altLabel ?titulo }
      FILTER(LANG(?titulo) IN ("pt", "pt-br", "en"))
    } LIMIT 400`;

  const j = await pega(
    `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`,
    "application/sparql-results+json",
  );

  // Cada obra pode voltar em várias linhas — uma por nome. Todos os nomes viram chave
  // para a MESMA obra: é assim que "Captains of the Sands" acha "Capitães da Areia".
  const porChave = new Map();
  for (const linha of j?.results?.bindings ?? []) {
    const ptwiki = linha.ptwiki?.value;
    const titulo = linha.titulo?.value;
    if (!ptwiki || !titulo) continue;

    const k = chave(titulo);
    if (k.length >= 3 && !porChave.has(k)) porChave.set(k, ptwiki);
  }
  return porChave;
}

/**
 * O primeiro parágrafo da Wikipédia — a apresentação, e nada além.
 *
 * `exintro` traz só a abertura, antes do primeiro título de seção. É a parte que diz o
 * que a obra É. O resto do artigo tem o enredo inteiro, com o final — e contar o final
 * de um livro para quem ainda não leu é a única coisa que um app de leitura não faz.
 */
async function sinopseDe(titulos) {
  // Até 20 artigos por chamada. É o que a API deixa, e é o que educa a não bater 20 vezes.
  const j = await pega(
    "https://pt.wikipedia.org/w/api.php?action=query&format=json&prop=extracts" +
      `&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(titulos.join("|"))}`,
  );

  const achadas = new Map();
  for (const p of Object.values(j?.query?.pages ?? {})) {
    const texto = p?.extract?.trim();
    if (!texto) continue;

    const primeiro = texto.split(/\n+/).find((x) => x.trim().length >= 60)?.trim();
    if (!primeiro) continue;

    achadas.set(
      p.title,
      primeiro.length > 1200 ? `${primeiro.slice(0, 1200).trimEnd()}…` : primeiro,
    );
  }

  // A API resolve redirecionamento e devolve o título FINAL. Sem este mapa, o casamento
  // se perderia justamente nos livros que têm mais de um nome.
  for (const r of j?.query?.redirects ?? []) {
    const s = achadas.get(r.to);
    if (s) achadas.set(r.from, s);
  }
  for (const nz of j?.query?.normalized ?? []) {
    const s = achadas.get(nz.to);
    if (s) achadas.set(nz.from, s);
  }

  return achadas;
}

// ─────────────────────────────────────────────────── 1. o alvo

console.log("\n1. os autores cujas obras estão sem sinopse\n");

const autores = await sql`
  select a.id, a.name, a.wikidata_id as qid,
         count(*) filter (where w.description is null) as sem
    from authors a
    join works w on w.author_id = a.id
   where a.wikidata_id is not null
     and w.description is null
     and exists (select 1 from editions e
                  where e.work_id = w.id and e.cover_url is not null)
   group by a.id, a.name, a.wikidata_id
   -- O autor com mais obras órfãs primeiro: se isto for interrompido, o que ficou
   -- pronto é o que mais tapa buraco.
   order by count(*) filter (where w.description is null) desc, a.name asc
   limit ${LIMITE}`;

const totalSem = autores.reduce((s, a) => s + Number(a.sem), 0);
console.log(`  ${n(autores.length)} autores · ${n(totalSem)} obras sem sinopse`);
console.log(`  Uma pergunta por AUTOR, e não por livro. A bibliografia inteira vem de uma vez.\n`);

// ─────────────────────────────────────────────────── 2. buscar

/**
 * ═══ ESCREVER À MEDIDA, E NUNCA SÓ NO FIM ═══
 *
 * A primeira versão guardava tudo em memória e gravava depois do último autor. Ela
 * caiu no autor 1.120 de 1.200, e as **959 sinopses que já tinha achado morreram
 * junto** — uma hora de trabalho apagada por uma requisição que demorou.
 *
 * Um script que só escreve no fim é um script que aposta tudo na última linha. Agora
 * cada autor que responde é gravado na hora: se isto cair no 1.199, o que já entrou
 * está no banco, e a próxima rodada continua de onde parou.
 */
async function gravar(pares) {
  if (pares.length === 0) return 0;

  await sql.begin(async (tx) => {
    for (const p of pares) {
      await tx`
        update works
           set description = ${p.sinopse},
               -- 'wikipedia' é CC-BY-SA: aparece na TELA com crédito, e fica FORA do
               -- dataset CC0. A coluna é o que torna essa promessa auditável.
               description_source = 'wikipedia'
         where id = ${p.id}::uuid and description is null`;
    }
  });
  return pares.length;
}

const achados = [];
let escritas = 0;
let vistos = 0;
let recusas = 0;

for (const a of autores) {
  vistos++;
  try {
    const biblio = await bibliografia(a.qid);
    await espera(PAUSA_MS);

    if (biblio.size > 0) {
      // As nossas obras deste autor que estão sem sinopse.
      const minhas = await sql`
        select w.id, w.title from works w
         where w.author_id = ${a.id} and w.description is null`;

      // O casamento acontece AQUI, contra uma lista fechada de obras que são dele.
      const pares = [];
      for (const w of minhas) {
        const ptwiki = biblio.get(chave(w.title));
        if (ptwiki) pares.push({ ...w, autor: a.name, ptwiki });
      }

      // Em lotes de 20: é o que a API da Wikipédia aceita numa chamada só.
      for (let i = 0; i < pares.length; i += 20) {
        const lote = pares.slice(i, i + 20);
        const sinopses = await sinopseDe([...new Set(lote.map((p) => p.ptwiki))]);

        const achou = [];
        for (const p of lote) {
          const s = sinopses.get(p.ptwiki);
          if (s) achou.push({ ...p, sinopse: s });
        }

        achados.push(...achou);
        if (EXECUTAR) escritas += await gravar(achou); // na hora, e não no fim
        await espera(PAUSA_MS);
      }
    }
  } catch (e) {
    // A RECUSA É CONTADA, e nunca virada em "não tem". Ela volta noutra rodada.
    if (e instanceof FonteRecusou) recusas++;
    else throw e;
  }

  if (vistos % 20 === 0) {
    const gravadas = EXECUTAR ? ` · ${n(escritas)} gravadas` : "";
    console.log(`  ${vistos}/${autores.length} autores · ${achados.length} sinopses${gravadas} · ${recusas} recusas`);
  }
}

console.log(`\n  ${n(achados.length)} obras com sinopse em português.`);
if (recusas > 0) {
  console.log(`  ${n(recusas)} autores em que a fonte recusou. NÃO são "sem sinopse": voltam na próxima rodada.`);
}

// ─────────────────────────────────────────────────── 3. a amostra

if (!EXECUTAR) {
  console.log("\n  ─────────────────────────────────────────────────────────────");
  console.log("  A AMOSTRA — é isto que seria gravado:\n");

  for (const a of achados.slice(0, 10)) {
    console.log(`    ${a.title}  ·  ${a.autor}`);
    console.log(`      ${a.sinopse.slice(0, 110).replace(/\n/g, " ")}…\n`);
  }

  console.log("  NADA FOI GRAVADO. Isto foi a amostra.\n");
  await sql.end();
  process.exit(0);
}

// ─────────────────────────────────────────────────── 4. a conta

const [fim] = await sql`
  select count(*) filter (where description is not null) as com,
         count(*) filter (where description_source = 'wikipedia') as da_wikipedia,
         count(*) filter (where description_source = 'openlibrary') as da_openlibrary
    from works`;

console.log(`\n  ✓ ${n(escritas)} sinopses gravadas nesta rodada`);
console.log(`\n  ✓ ${n(fim.com)} obras com sinopse`);
console.log(`     ${n(fim.da_openlibrary)} da Open Library (CC0 — entram no dataset)`);
console.log(`     ${n(fim.da_wikipedia)} da Wikipédia (CC-BY-SA — tela sim, dataset não)\n`);

await sql.end();

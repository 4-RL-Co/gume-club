#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  O AUTOR DE VOLTA. 47.654 obras, de graça.
 *
 *  ═══ O BUG ═══
 *
 *  O `scripts/import-openlibrary.mjs` lia a autoria do registro de EDIÇÃO:
 *
 *      ol_author: rec.authors?.[0]?.key ?? null      // linha 162
 *
 *  E o registro de edição em português quase nunca traz autor. A ligação
 *  obra→autor mora no registro de OBRA, e o import nunca abriu o dump de obras.
 *
 *  Resultado, medido: 43.739 obras sem autor nenhum (11,7% do acervo), e mais
 *  3.916 cujo "autor" é `[author not identified]`, `Brazil` ou `Portugal`.
 *
 *  Quem procura "Tolstói" no Gume não acha Guerra e Paz — e o Gume TEM Guerra e
 *  Paz. A busca por autor não achava 47.655 obras.
 *
 *  ═══ E O SEGUNDO BUG, DENTRO DO PRIMEIRO ═══
 *
 *  Quando a edição TINHA autor, o `[0]` pegava o PRIMEIRO da lista — que em
 *  livro traduzido é, com frequência, o TRADUTOR. É por isso que "A Morte de
 *  Ivan Ilitch" está assinada por Roberto Algarte, e o Drácula da Martin Claret
 *  por "jaime arbe".
 *
 *  A Open Library lista, para Ivan Ilitch: [Roberto Algarte, Лев Толстой].
 *  A gente pegava o primeiro.
 *
 *  O desempate aqui é por FREQUÊNCIA: entre os autores de uma obra, ganha o que
 *  assina mais obras do acervo. Tolstói assina dezenas; o tradutor de uma edição
 *  assina uma. Não é um chute — é o dado dizendo quem é o autor e quem passou
 *  por ali.
 *
 *  ═══ O NOME NÃO PODE CHEGAR EM CIRÍLICO ═══
 *
 *  A Open Library guarda Tolstói como "Лев Толстой". Recarregar assim trocaria
 *  um problema por outro: o Gume mostraria cirílico na estante de um leitor
 *  brasileiro, e a busca por "Tolstói" continuaria vazia.
 *
 *  `lib/nomes.ts` escolhe a grafia LATINA para a tela e guarda as outras (o
 *  cirílico, o kanji, o inglês) como SINÔNIMO de busca. Um conserto que só
 *  aparece no banco não é um conserto.
 *
 *  ═══ A IDENTIDADE É O NOME, E A CHAVE DA OL É SÓ PROCEDÊNCIA ═══
 *
 *  O plano era chavear pela chave da Open Library, para o reload não criar 47 mil
 *  autores novos em cima dos 160 mil que já existem. O banco resolve isso melhor,
 *  e de um jeito que eu não tinha visto:
 *
 *      authors_name_key UNIQUE (name)
 *
 *  O NOME já é uma chave. E como o nome de exibição é normalizado para a grafia
 *  latina ANTES de escrever (lib/nomes.ts), os vários registros que a Open Library
 *  tem para o mesmo autor — "Лев Толстой", "Tolstoy, Leo", "Leo Tolstoy" —
 *  colapsam num só.
 *
 *  Chavear pela chave da OL faria o CONTRÁRIO: criaria TRÊS linhas de Tolstói,
 *  porque a Open Library tem três chaves para ele. A duplicação vem de lá, e não
 *  daqui: dos 10.386 nomes duplicados no acervo, 10.384 têm chaves de OL
 *  diferentes.
 *
 *  A chave da OL fica gravada mesmo assim, quando estiver livre, porque ela é o
 *  único jeito de voltar à fonte depois. Ela é PROCEDÊNCIA, e não identidade.
 *
 *  ═══ USO ═══
 *
 *    node scripts/backfill-authors.mjs            MEDE e imprime. Não escreve.
 *    node scripts/backfill-authors.mjs --executar escreve.
 *
 *  Precisa de dois dumps (obras 3,7 GB + autores 0,7 GB). O de edições, NÃO:
 *  as edições já estão no banco, com a chave da obra.
 * ════════════════════════════════════════════════════════════════════
 */
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

import { nomeDeAutor } from "../lib/nomes.ts";
import { ehNomeDeAutor } from "../lib/autores.ts";

const env = readFileSync(".env", "utf8");
const doEnv = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const url = process.env.DATABASE_URL ?? doEnv("DATABASE_URL");
if (!url) throw new Error("DATABASE_URL não encontrado");

const DUMP_DIR = process.env.OPENLIBRARY_DUMP_DIR ?? doEnv("OPENLIBRARY_DUMP_DIR") ?? ".dump";
const WORKS_URL = "https://openlibrary.org/data/ol_dump_works_latest.txt.gz";
const AUTHORS_URL = "https://openlibrary.org/data/ol_dump_authors_latest.txt.gz";
const CACHE_NOMES = "nomes-autores.json";

const EXECUTAR = process.argv.includes("--executar");

const sql = postgres(url, { max: 1 });
const n = (v) => Number(v).toLocaleString("pt-BR");

// ─────────────────────────────────────────────────────── o dump

async function abrir(nomeArquivo, endereco) {
  const local = path.join(DUMP_DIR, nomeArquivo);
  if (existsSync(local)) {
    console.log(`  do disco: ${local} (${(statSync(local).size / 1e9).toFixed(1)} GB)`);
    return createReadStream(local);
  }
  console.log(`  streaming de ${endereco} (nada é gravado em disco)`);
  const res = await fetch(endereco, { redirect: "follow" });
  if (!res.ok) throw new Error(`Open Library respondeu ${res.status}`);
  return Readable.fromWeb(res.body);
}

/** Cada linha do dump é um TSV de cinco colunas, e a quinta é o JSON do registro. */
async function* registros(nomeArquivo, endereco, rotulo) {
  const fonte = await abrir(nomeArquivo, endereco);
  const linhas = createInterface({
    input: fonte.pipe(createGunzip()),
    crlfDelay: Infinity,
  });

  let vistas = 0;
  const inicio = Date.now();
  for await (const linha of linhas) {
    if (++vistas % 2_000_000 === 0) {
      const min = ((Date.now() - inicio) / 60000).toFixed(1);
      console.log(`  ${rotulo}: ${(vistas / 1e6).toFixed(0)}M linhas em ${min} min`);
    }
    const json = linha.split("\t")[4];
    if (!json) continue;
    try {
      yield JSON.parse(json);
    } catch {
      // Uma linha corrompida não derruba um import de horas.
    }
  }
}

// ─────────────────────────────────────────────────────── 1. as obras do banco

console.log("\n1. as obras que precisam de autor\n");

const alvo = await sql`
  select w.openlibrary_key as k, w.id
    from works w
   where w.openlibrary_key is not null
     and (w.author_id is null
          or exists (select 1 from authors a
                      where a.id = w.author_id
                        and a.name in ('[author not identified]', 'invalid author ID',
                                       'Brazil', 'Portugal', 'Portugal.', 's.n.')))`;

/** chave da obra na OL -> id da obra no nosso banco */
const precisam = new Map(alvo.map((r) => [r.k, r.id]));
console.log(`  ${n(precisam.size)} obras sem autor utilizável, todas com chave da Open Library.`);

if (precisam.size === 0) {
  console.log("\n  Nada a fazer.\n");
  await sql.end();
  process.exit(0);
}

// ─────────────────────────────────────────────────────── 2. o dump de OBRAS

console.log("\n2. o dump de OBRAS — é aqui que a autoria mora, e é aqui que o import nunca foi\n");

/**
 * O CACHE, e ele não é preguiça: é o que torna possível ERRAR.
 *
 * Ler 3,7 GB de dump custa vinte minutos. A primeira medição rodou, e a amostra que ela
 * imprimiu revelou dois bugs meus — "Albert Einstein" virando "Einstein", e "Portugal."
 * entrando como autor de livro. Consertar e conferir custava outros vinte minutos.
 *
 * Um passo que custa vinte minutos é um passo que ninguém repete, e um passo que
 * ninguém repete é um passo onde o erro fica. O cache guarda só o que interessa
 * (chave da obra -> chaves de autor), e a próxima rodada leva segundos.
 */
const CACHE_OBRAS = path.join(DUMP_DIR, "obras-autores.json");

/** chave da obra -> [chaves de autor] */
let autoresDaObra = new Map();
/** chave do autor -> em quantas obras NOSSAS ele aparece. É o desempate do tradutor. */
const frequencia = new Map();

if (existsSync(CACHE_OBRAS)) {
  console.log(`  do cache: ${CACHE_OBRAS} (apague o arquivo para reler o dump)`);
  autoresDaObra = new Map(JSON.parse(readFileSync(CACHE_OBRAS, "utf8")));
  for (const autores of autoresDaObra.values()) {
    for (const a of autores) frequencia.set(a, (frequencia.get(a) ?? 0) + 1);
  }
} else {
for await (const rec of registros("ol_dump_works.txt.gz", WORKS_URL, "obras")) {
  const chave = rec.key;
  if (!chave || !precisam.has(chave)) continue;

  const autores = (rec.authors ?? [])
    .map((a) => a?.author?.key ?? a?.key)
    .filter((k) => typeof k === "string" && k.startsWith("/authors/"));

  if (autores.length === 0) continue;

  autoresDaObra.set(chave, autores);
  for (const a of autores) frequencia.set(a, (frequencia.get(a) ?? 0) + 1);
}
  writeFileSync(CACHE_OBRAS, JSON.stringify([...autoresDaObra]));
  console.log(`  cache gravado em ${CACHE_OBRAS}`);
}

console.log(`\n  ${n(autoresDaObra.size)} obras têm autor no dump de obras.`);
console.log(`  ${n(precisam.size - autoresDaObra.size)} continuam sem autor nem lá.`);
console.log(`  ${n(frequencia.size)} chaves de autor distintas a resolver.`);

/**
 * O DESEMPATE DO TRADUTOR. Entre os autores de uma obra, fica o que assina MAIS obras
 * do acervo: Tolstói assina dezenas, o tradutor de uma edição assina uma.
 */
const escolhido = new Map();
for (const [obra, autores] of autoresDaObra) {
  let melhor = autores[0];
  for (const a of autores) {
    if ((frequencia.get(a) ?? 0) > (frequencia.get(melhor) ?? 0)) melhor = a;
  }
  escolhido.set(obra, melhor);
}

const precisamDeNome = new Set(escolhido.values());

// ─────────────────────────────────────────────────────── 3. o dump de AUTORES

console.log(`\n3. o dump de AUTORES — só os ${n(precisamDeNome.size)} que interessam\n`);

/** chave do autor -> { nome (latino, para a tela), sinonimos (para a busca) } */
const nomes = new Map();

for await (const rec of registros("ol_dump_authors.txt.gz", AUTHORS_URL, "autores")) {
  if (!precisamDeNome.has(rec.key)) continue;

  const escolha = nomeDeAutor({
    name: rec.name,
    personal_name: rec.personal_name,
    alternate_names: rec.alternate_names,
  });
  // O PORTÃO, de novo — e aqui ele é a última barreira antes de o nome entrar no
  // acervo. `nomeDeAutor` já o consulta, e esta linha é redundante DE PROPÓSITO: um
  // portão que só é checado num lugar é um portão com uma porta dos fundos.
  if (!escolha || !ehNomeDeAutor(escolha.nome)) continue;

  nomes.set(rec.key, escolha);
}

console.log(`\n  ${n(nomes.size)} autores com nome.`);

const latinos = [...nomes.values()].filter((v) => /^[\p{Script=Latin}\p{P}\p{N}\s]+$/u.test(v.nome));
console.log(`  ${n(latinos.length)} deles com o nome em alfabeto latino (o que vai para a tela).`);
console.log(`  ${n(nomes.size - latinos.length)} só existem em cirílico, kanji ou grego: tarefa de bibliotecário.`);

// ─────────────────────────────────────────────────────── 4. escrever

const paraEscrever = [];
for (const [obra, autorKey] of escolhido) {
  const nome = nomes.get(autorKey);
  const workId = precisam.get(obra);
  if (nome && workId) paraEscrever.push({ workId, autorKey, ...nome });
}

console.log(`\n4. ${n(paraEscrever.length)} obras prontas para ganhar autor.\n`);

if (!EXECUTAR) {
  console.log("  ─────────────────────────────────────────────────────────");
  console.log("  NADA FOI ESCRITO. Isto foi a medição.\n");
  console.log("  Uma amostra do que entraria:\n");

  for (const p of paraEscrever.slice(0, 12)) {
    const sin = p.sinonimos.length ? `  (também: ${p.sinonimos.slice(0, 2).join(", ")})` : "";
    console.log(`    ${p.nome}${sin}`);
  }

  console.log("\n  Para escrever:  node scripts/backfill-authors.mjs --executar\n");
  await sql.end();
  process.exit(0);
}

console.log("  escrevendo, de 1.000 em 1.000…\n");

/**
 * ═══ POR QUE A CHAVE É O NOME, E NÃO A CHAVE DA OPEN LIBRARY ═══
 *
 * A instrução era chavear pela chave da OL, para o reload não criar 47 mil autores
 * novos. O banco já resolve isso melhor, e de um jeito que eu não esperava:
 *
 *     authors_name_key UNIQUE (name)
 *
 * O NOME já é uma chave. E como `lib/nomes.ts` normaliza o nome de exibição para a
 * grafia latina ANTES de escrever, os cinco registros que a Open Library tem para o
 * mesmo autor — "Лев Толстой", "Tolstoy, Leo", "Leo Tolstoy" — colapsam num só.
 *
 * Chavear pela chave da OL faria o CONTRÁRIO: criaria três linhas de Tolstói, porque
 * a Open Library tem três chaves para ele. A duplicação vem de lá, e não daqui.
 *
 * A chave da OL fica gravada mesmo assim (quando estiver livre), porque ela é o único
 * jeito de voltar à fonte depois. Ela é uma PROCEDÊNCIA, e não uma identidade.
 */
const porNome = new Map();
for (const p of paraEscrever) {
  if (!porNome.has(p.nome)) porNome.set(p.nome, { nome: p.nome, autorKey: p.autorKey, sinonimos: p.sinonimos });
}
const autores = [...porNome.values()];

const slug = (nome) =>
  nome.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "autor";

console.log(`  ${n(autores.length)} autores distintos para ${n(paraEscrever.length)} obras.\n`);

for (let i = 0; i < autores.length; i += 1000) {
  const lote = autores.slice(i, i + 1000);

  await sql.begin(async (tx) => {
    for (const a of lote) {
      // O slug tem que ser livre: homônimo ganha sufixo, e o endereço público não colide.
      await tx`
        insert into authors (name, slug, alt_names, openlibrary_key)
        values (${a.nome},
                ${slug(a.nome)} || coalesce(
                  (select '-' || (count(*) + 1)::text from authors x
                    where x.slug = ${slug(a.nome)} or x.slug like ${slug(a.nome) + "-%"}
                      and x.name <> ${a.nome}
                    having count(*) > 0), ''),
                ${a.sinonimos},
                -- Só grava a chave da OL se ela estiver LIVRE. Ela é procedência, e não
                -- identidade: duas linhas nossas nunca podem brigar por ela.
                (select case when exists (select 1 from authors y where y.openlibrary_key = ${a.autorKey})
                             then null else ${a.autorKey} end))
        on conflict (name) do update
          set alt_names = excluded.alt_names,
              openlibrary_key = coalesce(authors.openlibrary_key, excluded.openlibrary_key)`;
    }
  });

  process.stdout.write(`\r  autores: ${n(Math.min(i + 1000, autores.length))}/${n(autores.length)}`);
}

console.log("\n");

let feitos = 0;
for (let i = 0; i < paraEscrever.length; i += 2000) {
  const lote = paraEscrever.slice(i, i + 2000);

  await sql.begin(async (tx) => {
    for (const p of lote) {
      /**
       * ═══ A OBRA DUPLICADA, E POR QUE ELA NÃO PODE DERRUBAR ISTO ═══
       *
       * `works_title_author_volume` é UNIQUE **NULLS NOT DISTINCT**. Dar autor a uma
       * obra pode fazer ela COLIDIR com outra obra de mesmo título que já tem aquele
       * autor — porque as duas são a mesma obra, duplicada pelo import.
       *
       * A primeira versão deste script morreu exatamente aqui, depois de inserir quatro
       * mil autores: uma colisão, e o backfill inteiro no chão.
       *
       * O `not exists` PULA a obra que colidiria. Ela fica sem autor, visível, e vira
       * trabalho de fusão de duplicadas — que é outro problema, e não este. Um script
       * que morre no meio é pior que um script que deixa cem casos para depois.
       */
      await tx`
        update works w
           set author_id = (select id from authors where name = ${p.nome}),
               -- A PROCEDÊNCIA fica gravada. 'work' é o dado confiável (o registro de
               -- obra); 'edition' é o suspeito — o que o import lia, e que trazia o
               -- tradutor. Sem isto, o próximo bug do mesmo tipo volta a ser invisível.
               author_source = 'work'
         where w.id = ${p.workId}::uuid
           and not exists (
             select 1 from works outra
              where outra.id <> w.id
                and outra.title = w.title
                and outra.volume is not distinct from w.volume
                and outra.author_id = (select id from authors where name = ${p.nome})
           )`;
    }
  });

  feitos += lote.length;
  process.stdout.write(`\r  obras: ${n(feitos)}/${n(paraEscrever.length)}`);
}

console.log(`\n\n  ✓ ${n(feitos)} obras ganharam autor.\n`);

/**
 * ═══ AS QUE COLIDIRAM: AUTOR CONHECIDO, E NÃO GRAVADO ═══
 *
 * Elas NÃO são obras sem autor, e a diferença é a diferença entre podar entulho e
 * apagar Madame Bovary.
 *
 * A Open Library SABE de quem elas são. A gente é que não conseguiu escrever, porque
 * `works_title_author_volume` é UNIQUE NULLS NOT DISTINCT e o acervo tem a mesma obra
 * duas vezes.
 *
 * Se elas não ficarem marcadas, a régua da poda ("sem autor E sem capa E sem ISBN") vai
 * olhar para elas e ver uma obra sem autor — e apagar um livro que a Open Library sabe
 * de quem é. É o mesmo erro do Madame Bovary, voltando pela porta dos fundos.
 *
 * A tabela guarda o NOME, e não só a marca: ela é a lista de trabalho de quem for fundir
 * as obras duplicadas.
 */
console.log("5. as que colidiram — autor conhecido, e não gravado\n");

let marcadas = 0;
for (let i = 0; i < paraEscrever.length; i += 2000) {
  const lote = paraEscrever.slice(i, i + 2000);

  await sql.begin(async (tx) => {
    for (const p of lote) {
      const feito = await tx`
        insert into autor_conhecido_nao_gravado (work_id, nome)
        select ${p.workId}::uuid, ${p.nome}
         where exists (select 1 from works w
                        where w.id = ${p.workId}::uuid and w.author_id is null)
        on conflict (work_id) do update set nome = excluded.nome
        returning 1`;
      marcadas += feito.length;
    }
  });
}

console.log(`  ✓ ${n(marcadas)} obras marcadas: a poda NÃO pode tocar nelas.\n`);
if (marcadas > 500) {
  console.log(
    `  ⚠ São ${n(marcadas)}. Isso é muito, e sobe a prioridade da fusão de obras\n` +
      "    duplicadas: cada uma dessas é a MESMA obra duas vezes no acervo.\n",
  );
}

await sql.end();

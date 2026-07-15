#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE ESTÁ EM INGLÊS SAI DO ACERVO.
 *
 *  "A galera ler livro em inglês é exceção, e não regra."
 *
 *  ═══ O QUE MEDIR ACHOU, E QUE MUDA O QUE ISTO É ═══
 *
 *  A base **não tem livros em inglês**: 302.453 das 302.508 edições estão marcadas
 *  como portuguesas, porque o import já filtrou por idioma da edição.
 *
 *  O que existe é outra coisa: 1.146 obras cujo TÍTULO está em inglês — e elas são
 *  ficha de catálogo acadêmico, não livro.
 *
 *      Portuguese and Brazilian books in the John Carter Brown Library
 *      Password: K dictionaries: English dictionary for speakers of Portuguese
 *      Political and administrative statute of the province of Macau
 *      Proceedings of the Ninth Congress of the Union européenne
 *
 *  Não é uma poda de tamanho — são 0,4% do acervo, e o ganho em disco é nenhum. É
 *  uma poda de QUALIDADE: essas fichas aparecem na busca, empurram o livro certo
 *  para baixo, e fazem o acervo parecer uma biblioteca universitária americana.
 *
 *  ═══ O QUE NÃO SAI, E POR QUÊ ═══
 *
 *  34.875 obras caem em "não sei", e nenhuma delas é tocada. É onde estão **Berserk**,
 *  Frankenstein, Iracema, Ubirajara, Hamlet — títulos sem palavra-esqueleto de língua
 *  nenhuma.
 *
 *  Um detector que chutasse chamaria os cinco de ingleses e apagaria José de Alencar
 *  do acervo. NÃO SABER É UMA RESPOSTA, e é a certa. Ver lib/idioma.ts e o AGENTS.md.
 *
 *  ═══ E NENHUM DADO DE PESSOA MORRE ═══
 *
 *  Uma obra que está na estante de alguém, que tem leitura registrada, resenha ou
 *  lugar numa prateleira **não sai**, aconteça o que acontecer. O acervo é nosso; a
 *  estante é da pessoa. Apagar o livro de alguém para arrumar o catálogo é o tipo de
 *  arrumação que não se desfaz.
 *
 *  Uso:  node --experimental-strip-types scripts/poda-ingles.mjs
 *        node --experimental-strip-types scripts/poda-ingles.mjs --executar
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { idiomaDe } from "../lib/idioma.ts";

const env = readFileSync(".env", "utf8");
const url = process.env.DATABASE_URL ?? env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const EXECUTAR = process.argv.includes("--executar");
const sql = postgres(url, { max: 1 });
const n = (v) => Number(v).toLocaleString("pt-BR");

// ─────────────────────────────────────────────────── 1. quem é inglês

console.log("\n1. lendo o título das obras\n");

const obras = await sql`select id, title from works`;

const alvo = [];
let pt = 0;
let naoSei = 0;
for (const o of obras) {
  const i = idiomaDe(o.title);
  if (i === "en") alvo.push(o.id);
  else if (i === "pt") pt++;
  else naoSei++;
}

console.log(`  ${n(obras.length)} obras`);
console.log(`     ${n(pt)} em português`);
console.log(`     ${n(alvo.length)} em inglês        ← estas`);
console.log(`     ${n(naoSei)} "não sei"        ← intocadas (Berserk, Frankenstein, Iracema)`);

// A lista vai para uma TABELA, e não para 1.146 parâmetros numa consulta. Um `in (...)`
// com mil itens é uma consulta que o Postgres não consegue planejar direito.
await sql`create temporary table alvo_ingles (work_id uuid primary key)`;
for (let i = 0; i < alvo.length; i += 500) {
  await sql`insert into alvo_ingles ${sql(alvo.slice(i, i + 500).map((id) => ({ work_id: id })))}`;
}

// ─────────────────────────────────────────────────── 2. a rede de segurança

console.log("\n2. o que é de alguma PESSOA, e por isso não sai\n");

/**
 * ═══ TRÊS COISAS SÃO INTOCÁVEIS ═══
 *
 * 1. A ESTANTE DE ALGUÉM. Se uma pessoa pôs "Pedagogy of the Oppressed" na estante e
 *    registrou que leu, aquilo é a história dela — e não uma ficha errada do nosso
 *    catálogo. Apagar o livro de alguém para arrumar o acervo não se desfaz.
 *
 * 2. A PRATELEIRA que alguém montou à mão.
 *
 * 3. O VOLUME DE UMA COLEÇÃO. Este é o que eu quase deixei passar: a amostra trouxe
 *    "Knights of the Zodiac, vol. 14". Se um volume sair do acervo, a prateleira da
 *    coleção abre um buraco — e o buraco é a coisa mais importante daquela tela.
 *
 *    A coleção passaria a dizer "falta o volume 14" quando o volume 14 existe e a
 *    pessoa até o tem. Uma poda que faz a tela MENTIR é pior do que não podar.
 */
const CONDICAO = sql`
     exists (select 1 from library_entries le
               join editions e on e.id = le.edition_id
              where e.work_id = t.work_id)
  or exists (select 1 from collection_items ci where ci.work_id = t.work_id)
  or exists (select 1 from works w where w.id = t.work_id and w.colecao_id is not null)`;

const [protegidas] = await sql`
  select count(distinct t.work_id)::int as n from alvo_ingles t where ${CONDICAO}`;

console.log(`  ${n(protegidas.n)} obras são de alguém, ou são volume de uma coleção. Elas FICAM.`);

await sql`delete from alvo_ingles t where ${CONDICAO}`;

const [restam] = await sql`select count(*)::int as n from alvo_ingles`;
console.log(`  ${n(restam.n)} obras sairiam.`);

// ─────────────────────────────────────────────────── 3. a amostra

const amostra = await sql`
  select w.title, coalesce(a.name, '—') as autor
    from alvo_ingles t
    join works w on w.id = t.work_id
    left join authors a on a.id = w.author_id
   order by random() limit 12`;

console.log("\n  ─── 12 ao acaso, do que sairia ───\n");
for (const o of amostra) {
  console.log(`     ${o.title.slice(0, 60).padEnd(62)} ${o.autor.slice(0, 24)}`);
}

if (!EXECUTAR) {
  console.log("\n  NADA FOI APAGADO. Isto foi a medição.");
  console.log("  Para apagar:  node --experimental-strip-types scripts/poda-ingles.mjs --executar\n");
  await sql.end();
  process.exit(0);
}

// ─────────────────────────────────────────────────── 4. apagar

console.log("\n3. apagando\n");

// Quem ASSINAVA as obras que vão sair. Anotado ANTES de apagar, porque depois de
// apagar a obra não há mais como saber de quem ela era.
await sql`
  create temporary table autores_da_poda as
  select distinct w.author_id
    from works w join alvo_ingles t on t.work_id = w.id
   where w.author_id is not null`;

await sql.begin(async (tx) => {
  // A ordem importa: a edição aponta para a obra, e a obra não sai enquanto a edição
  // apontar para ela. Tudo numa transação — ou sai inteiro, ou não sai nada.
  await tx`delete from editions where work_id in (select work_id from alvo_ingles)`;
  await tx`delete from works where id in (select work_id from alvo_ingles)`;
});

const [fim] = await sql`select count(*)::int as n from works`;
console.log(`  ✓ ${n(restam.n)} obras apagadas.`);
console.log(`  ✓ o acervo tem ${n(fim.n)} obras.\n`);

/**
 * O autor que ficou sem NENHUMA obra **por causa desta poda**.
 *
 * "C. R. Boxer" só existia no acervo por causa de um livro em inglês. Um nome que a
 * busca acha e que abre uma página vazia é pior do que um resultado a menos.
 *
 * ═══ E SÓ ELES ═══
 *
 * Um `delete from authors where not exists (obra)` sem mais nada varreria TODO autor
 * sem obra do banco — inclusive os que nunca tiveram uma por outros motivos, e os que
 * a gente cadastrou de propósito. Uma poda tem que apagar o que ELA causou, e nada
 * além. Por isso a lista é fechada: os autores das obras que acabaram de sair.
 */
const orfaos = await sql`
  delete from authors a
   where a.id in (select author_id from autores_da_poda)
     and not exists (select 1 from works w where w.author_id = a.id)
   returning a.id`;

console.log(`  ✓ ${n(orfaos.length)} autores ficaram sem obra nenhuma e saíram junto.\n`);

await sql.end();

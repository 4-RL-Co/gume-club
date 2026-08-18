#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  "MEMÓRIAS PÓSTUMAS DE BRÁS CUBAS · AUTOR DESCONHECIDO"
 *
 *  Na busca, o mesmo livro aparecia duas vezes: uma assinada por Machado de Assis, e
 *  outra por ninguém. **Isso não pode acontecer.**
 *
 *  A ficha órfã não é um livro diferente: é a MESMA obra, que entrou pelo dump sem o
 *  autor. (O import lia a autoria do registro de EDIÇÃO, e a edição em português quase
 *  nunca traz autor — ver o canário em lib/acervo.sql.test.ts.)
 *
 *  Ela é pior do que uma linha a mais: ela diz, na cara de quem procura um clássico,
 *  que o Gume não sabe quem escreveu o clássico.
 *
 *  ═══ A TRAVA: SÓ QUANDO O TÍTULO APONTA PARA UM AUTOR SÓ ═══
 *
 *  Casar por título é onde se apaga livro. "Contos", "Poesias", "Obra completa" e
 *  "Antologia" são títulos de dezenas de autores diferentes — e um casamento por
 *  título entregaria os contos de um para o outro.
 *
 *  Então a regra é dura: a ficha órfã só se funde quando, no acervo inteiro, **existe
 *  exatamente UM autor** com aquele título. Se dois autores assinam obras com o mesmo
 *  nome, a órfã fica de pé, órfã. Não saber é uma resposta. Ver AGENTS.md.
 *
 *  ═══ E O QUE É DE ALGUÉM NÃO SE FUNDE ═══
 *
 *  A mesma regra do scripts/fundir-duplicatas.mjs, e pelo mesmo motivo: as nove
 *  tabelas que apontam para uma obra têm ON DELETE CASCADE, e as de usuário são únicas
 *  por (pessoa, obra). O Gume não escolhe qual resenha de alguém morre para arrumar o
 *  próprio catálogo.
 *
 *  Uso:  node --experimental-strip-types scripts/autor-desconhecido.mjs
 *        node --experimental-strip-types scripts/autor-desconhecido.mjs --executar
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const env = readFileSync(".env", "utf8");
const url = process.env.DATABASE_URL ?? env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const EXECUTAR = process.argv.includes("--executar");
const sql = postgres(url, { max: 1 });
const n = (v) => Number(v).toLocaleString("pt-BR");

/** Sem acento, sem pontuação, sem caixa. O título INTEIRO — o subtítulo não se corta. */
const chave = (t) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();

console.log("\n1. lendo o acervo\n");

const obras = await sql`
  select w.id, w.title, w.author_id, w.volume,
         (w.description is not null) as tem_sinopse,
         (select count(*) from editions e where e.work_id = w.id)::int as edicoes,
         exists (select 1 from editions e
                  where e.work_id = w.id and e.cover_url is not null) as capa,
         -- DE UMA PESSOA: estante, nota, resenha, cópia, recomendação, prateleira.
         -- Isto não se apaga, e o script nem tenta.
         (exists (select 1 from library_entries x where x.work_id = w.id)
       or exists (select 1 from ratings x where x.work_id = w.id)
       or exists (select 1 from reviews x where x.work_id = w.id)
       or exists (select 1 from owned_copies x where x.work_id = w.id)
       or exists (select 1 from recommendations x where x.work_id = w.id)
       or exists (select 1 from collection_items x where x.work_id = w.id)
         ) as de_alguem
    from works w`;

const semAutor = obras.filter((o) => !o.author_id);
console.log(`  ${n(obras.length)} obras · ${n(semAutor.length)} sem autor`);

// ─────────────────────────────────────────────────── 2. quem assina cada título

/** título → os autores que assinam uma obra com esse título, e a melhor ficha de cada. */
const assinadas = new Map();
for (const o of obras) {
  if (!o.author_id) continue;
  const k = chave(o.title);
  if (!k) continue;

  if (!assinadas.has(k)) assinadas.set(k, { autores: new Set(), melhor: null });
  const g = assinadas.get(k);
  g.autores.add(o.author_id);

  // A melhor ficha assinada com esse título: a que tem sinopse, mais edições, capa.
  const m = g.melhor;
  const ganha =
    !m ||
    (o.tem_sinopse ? 1 : 0) - (m.tem_sinopse ? 1 : 0) > 0 ||
    ((o.tem_sinopse === m.tem_sinopse) && o.edicoes > m.edicoes) ||
    ((o.tem_sinopse === m.tem_sinopse) && o.edicoes === m.edicoes && o.capa && !m.capa);
  if (ganha) g.melhor = o;
}

// ─────────────────────────────────────────────────── 3. as órfãs recuperáveis

const fusoes = [];
let ambiguas = 0;
let deAlguem = 0;
let volumes = 0;
let semPar = 0;

for (const o of semAutor) {
  const g = assinadas.get(chave(o.title));
  if (!g) { semPar++; continue; }

  /**
   * ═══ A TRAVA ═══
   *
   * Dois autores com o mesmo título de obra, e a órfã fica de pé. "Contos" é de
   * Machado, de Tchekhov, de Poe e de mais trinta — e entregar os contos de um para o
   * outro é pior do que uma linha a mais na busca.
   */
  if (g.autores.size > 1) { ambiguas++; continue; }

  // O volume de série tem identidade de NÚMERO, não de título. Ver poda-ingles.mjs.
  if (o.volume !== null || g.melhor.volume !== null) { volumes++; continue; }

  /**
   * ═══ POR QUE NÃO DÁ PARA SÓ "ASSINAR" A ÓRFÃ ═══
   *
   * A primeira versão deste script tentava, para a ficha que é de alguém, escrever o
   * autor nela e deixá-la de pé. O banco recusou:
   *
   *     duplicate key value violates unique constraint "works_title_author_volume"
   *     Key (title, author_id, volume)=(Otelo, o Mouro de Veneza, ...) already exists
   *
   * E a recusa está CERTA. Uma obra é identificada por (título, autor, volume): assinar
   * a órfã a transformaria numa cópia exata da irmã que já existe. É a mesmíssima
   * colisão que criou a tabela `autor_conhecido_nao_gravado` — obras cujo autor a gente
   * sabe e nunca conseguiu escrever.
   *
   * A saída não é assinar: é FUNDIR. A obra assinada já está lá, e é ela.
   *
   * O que não se funde continua sendo o que é de uma PESSOA. Essa fica de pé, órfã, até
   * um bibliotecário resolver na mão — porque as tabelas de usuário são únicas por
   * (pessoa, obra), e fundir obrigaria a escolher qual resenha de alguém morre.
   */
  if (o.de_alguem) { deAlguem++; continue; }

  fusoes.push({ orfa: o, pai: g.melhor });
}

const fundem = fusoes.length;

console.log(`\n2. o que dá para consertar\n`);
console.log(`  ${n(fundem)} fichas órfãs se fundem na irmã assinada`);
if (deAlguem > 0) console.log(`  ${n(deAlguem)} são de uma PESSOA. Ficam de pé, órfãs. Ninguém perde nada.`);
console.log(`  ${n(ambiguas)} têm título ambíguo (dois autores ou mais). Ficam órfãs, de propósito.`);
if (volumes > 0) console.log(`  ${n(volumes)} são volume de série. Intocadas.`);
console.log(`  ${n(semPar)} não têm irmã assinada. O autor delas continua desconhecido.`);

console.log("\n  ─── 10 ao acaso ───\n");
for (const f of fusoes.slice(0, 10)) {
  console.log(`     ${f.orfa.title.slice(0, 50).padEnd(52)} → ${f.pai.title.slice(0, 34)}`);
}

if (!EXECUTAR) {
  console.log("\n  NADA FOI MUDADO. Isto foi a medição.");
  console.log("  Para executar:  node --experimental-strip-types scripts/autor-desconhecido.mjs --executar\n");
  await sql.end();
  process.exit(0);
}

// ─────────────────────────────────────────────────── 4. executar

console.log("\n3. consertando\n");

let feitas = 0;
for (let i = 0; i < fusoes.length; i += 100) {
  await sql.begin(async (tx) => {
    for (const f of fusoes.slice(i, i + 100)) {
      // A mesma edição dos dois lados: o ISBN é único, e mover estouraria o índice.
      // Apagar não é perda — a irmã idêntica já está na obra que fica.
      await tx`
        delete from editions e
         where e.work_id = ${f.orfa.id}::uuid and e.isbn13 is not null
           and exists (select 1 from editions k
                        where k.work_id = ${f.pai.id}::uuid and k.isbn13 = e.isbn13)`;

      await tx`update editions set work_id = ${f.pai.id}::uuid where work_id = ${f.orfa.id}::uuid`;
      await tx`update activities set work_id = ${f.pai.id}::uuid where work_id = ${f.orfa.id}::uuid`;
      await tx`delete from works where id = ${f.orfa.id}::uuid`;
      feitas++;
    }
  });
  process.stdout.write(`\r  ${n(feitas)}/${n(fusoes.length)}`);
}

const [fim] = await sql`
  select count(*)::int as obras,
         count(*) filter (where author_id is null)::int as sem_autor
    from works`;

console.log(`\n\n  ✓ ${n(fundem)} fichas órfãs fundidas na obra assinada`);
console.log(`  ✓ o acervo tem ${n(fim.obras)} obras, ${n(fim.sem_autor)} sem autor`);
console.log(`  ✓ ${(100 - (100 * fim.sem_autor) / fim.obras).toFixed(1)}% das obras estão assinadas\n`);

await sql.end();

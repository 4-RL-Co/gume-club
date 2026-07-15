#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  A PODA DOS DOCUMENTOS. Sermão, pastoral, alvará, relatório de banco.
 *
 *  "Esses livros em outros idiomas, livros de sermão, pregação, pastoral, documentos,
 *   tratados pode remover."
 *
 *  O dump da Open Library trouxe, junto com a literatura, o que uma biblioteca nacional
 *  guarda porque é uma biblioteca nacional: o alvará régio de 1748, o relatório anual do
 *  Banco do Brasil, a carta pastoral do bispo do Pará. São documentos. Ninguém vai pôr
 *  nenhum deles na estante, e cada um deles é uma linha entre a pessoa e o livro que ela
 *  procura.
 *
 *  ═══ E ELA QUASE APAGOU O PADRE ANTÓNIO VIEIRA ═══
 *
 *  A primeira versão desta regra pegava "sermão" e ponto. Ela casava **2.469 obras** —
 *  e **cinquenta delas eram os Sermões do Padre António Vieira**, que não são um
 *  documento: são o cânone da prosa portuguesa do século XVII. Junto vinham os
 *  *Discursos* de Rui Barbosa.
 *
 *  Uma regra por FORMATO ("é um sermão") não distingue literatura de papelada, porque a
 *  literatura também vem em formatos. O que distingue é **quem escreveu**.
 *
 *  Por isso esta poda nunca toca em obra de autor do cânone, e é a mesma lista que a
 *  `poda.mjs` usa (docs/cobertura.json). O repositório já tinha aprendido isto uma vez,
 *  e a nota lá diz, com todas as letras: "seria como a poda apaga Camões".
 *
 *  ═══ ELA NÃO APAGA SEM VOCÊ MANDAR ═══
 *
 *    node scripts/poda-documentos.mjs              MEDE e imprime. Não escreve nada.
 *    node scripts/poda-documentos.mjs --executar   apaga.
 *
 *  E ela ABORTA, sem apagar nada, se qualquer obra da lista estiver na estante de alguém,
 *  tiver nota, resenha, ou uma correção assinada. Apagar uma obra cascateia: levaria a
 *  estante de uma pessoa junto, e ela nunca saberia por quê.
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const env = readFileSync(".env", "utf8");
const url =
  process.env.DATABASE_URL ??
  env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^"|"$/g, "");

const sql = postgres(url);
const EXECUTAR = process.argv.includes("--executar");

/**
 * ═══ O PADRÃO. E o `\y` que não é `\b` ═══
 *
 * No Postgres, a fronteira de palavra é `\y`. **`\b` é o caractere de backspace**, e um
 * padrão com `\b` casa exatamente nada — a primeira versão desta medição devolveu "0
 * obras" e eu quase acreditei que o acervo estava limpo.
 *
 * O padrão é ANCORADO no começo do título, e é de propósito: "Tratado" no começo é um
 * tratado; "Tratado" no meio pode ser "Um breve tratado sobre a felicidade", que é um
 * romance.
 */
const PADRAO =
  "^(serm(a|ã)|sermoes|sermões|pastoral|carta pastoral|prega(c|ç)(a|ã)o|" +
  "ora(c|ç)(a|ã)o f(u|ú)nebre|breve compendio|breve compêndio|" +
  "constitui(c|ç)(o|õ)es|regimento|alvar(a|á)|provis(a|ã)o|edital|" +
  "relat(o|ó)rio|novena|triduo|tríduo|exequias|exéquias|elogio f(u|ú)nebre|" +
  // ── as palavras ambíguas. Ver a nota abaixo. ──
  "discurso|tratado|parecer|memorial|instru(c|ç)(o|õ)es|panegirico|panegírico|" +
  /**
   * ── a papelada acadêmica e administrativa ──
   *
   * ═══ O `\y` VAI SÓ NAS PALAVRAS CURTAS, E ISSO NÃO É DETALHE ═══
   *
   * O resto do padrão casa por PREFIXO de propósito: "serm(a|ã)" precisa pegar "sermam",
   * "sermão" e "sermao", que são a mesma palavra com trezentos anos de ortografia no meio.
   *
   * Mas "ata" e "tese", soltas, são o começo de OUTRAS palavras: **Atalanta**, **Teseu**.
   * Sem a fronteira, a poda apagaria um romance grego achando que era uma ata de reunião.
   *
   * Então a fronteira vai onde é necessária, e só ali.
   */
  "tese\\y|disserta(c|ç)(a|ã)o|monografia|anais\\y|atas?\\y|resumos|" +
  "cat(a|á)logo|invent(a|á)rio|bibliografia|boletim|anu(a|á)rio|" +
  "peri(o|ó)dico|decreto|legisla(c|ç)(a|ã)o|portaria|" +
  "censo\\y|recenseamento|estat(i|í)stica|lista telef(o|ô)nica)";

/**
 * ═══ "ALMANAQUE" SAIU DA LISTA, E ELA CUSTOU UMA AMOSTRA ALEATÓRIA ═══
 *
 * Ela estava aqui. E aí eu olhei trinta títulos sorteados do que ia ser apagado, e um
 * deles era "Almanaque 1964: fatos, histórias e curiosidades de um ano que...", da Ana
 * Maria Bahiana. Um livro. Publicado. De uma jornalista conhecida.
 *
 * Fui olhar os outros sessenta e um "almanaque" do acervo, e lá estava o **Almanaque
 * Armorial, do Ariano Suassuna**.
 *
 * "Almanaque" é o nome de uma papelada E de um GÊNERO EDITORIAL vivo — almanaque dos anos
 * 70, almanaque do Sporting, almanaque das Copas. É livro de banca, e é livro.
 *
 * ═══ A LIÇÃO, E ELA É O MÉTODO ═══
 *
 * Contar quantos saem não diz nada sobre o que sai. **Olhe uma amostra ALEATÓRIA do que
 * vai ser apagado, e procure um livro nela.** Foi assim que apareceram o Suassuna, o
 * "Inventário do inútil: romance" e o "Anais de Pena Ventosa: romance" — nenhum dos três
 * seria encontrado olhando os primeiros da lista, que vêm em ordem alfabética e são todos
 * atas de congresso.
 */

/**
 * ═══ A SEGUNDA TRAVA: A OBRA QUE SE DECLARA LITERATURA NÃO SAI ═══
 *
 * O padrão acima, sozinho, apagaria:
 *
 *     "Inventário do inútil: romance"
 *     "Inventário da tarde: poemas"
 *     "Inventário: poesia"
 *     "Anais de Pena Ventosa: romance"
 *
 * São livros. "Inventário" e "Anais" são palavras bonitas, e poeta usa palavra bonita.
 *
 * A proteção do cânone não os salvaria: são autores vivos, fora da lista. O que os salva é
 * o próprio título — eles DIZEM o que são, no subtítulo, e ninguém escreve ": romance"
 * embaixo de uma ata de congresso.
 *
 * É a trava mais barata que existe: o livro se defende sozinho, com as palavras dele.
 */
const LITERATURA =
  "\\y(romance|contos?|novela|poesias?|poemas?|teatro|cr(o|ô)nicas?|" +
  "fic(c|ç)(a|ã)o|antologia|trilogia)\\y";

/**
 * ═══ "DISCURSO" E "TRATADO" ESTÃO NA LISTA, E A DECISÃO É DELIBERADA ═══
 *
 * Elas ficaram de fora na primeira versão, e o motivo era bom: são o nome de um documento
 * E de um gênero literário. O *Discurso do Método* é do Descartes; o *Tratado da Natureza
 * Humana* é do Hume. Uma regra por FORMATO não distingue literatura de papelada, porque a
 * literatura também vem em formatos.
 *
 * O dono do Gume pediu para entrarem assim mesmo, e o argumento dele venceu:
 *
 *     "Prefiro ter alguns livros a menos e um catálogo sem lixo do que um catálogo
 *      caótico, porque sempre aparece na pesquisa e fica um caos."
 *
 * O contexto é o que decide. O Gume vai abrir com um punhado de amigos, e eles vão
 * PREENCHER o catálogo com as estantes deles. Um livro de filosofia que falta é um livro
 * que alguém cadastra em trinta segundos, e ele volta certo, com capa e ISBN. Um catálogo
 * poluído, não: ele afasta a pessoa na primeira busca, e ela não volta para reclamar.
 *
 * **Erro de omissão aqui é barato e reversível. Erro de ruído é caro e invisível.**
 *
 * ═══ E A PROTEÇÃO DO CÂNONE FICA, PORQUE ELA TRABALHA A FAVOR DISSO ═══
 *
 * Ela é exatamente o que mantém o *Discurso do Método* de pé — um dos livros que ele disse
 * que quer subir. Não faz sentido apagá-lo hoje para recadastrá-lo amanhã.
 *
 * O que sai são os discursos parlamentares, os pareceres técnicos, os memoriais
 * descritivos e os tratados de comércio. O que fica é a filosofia.
 */

/** As linhas de `authors` que são autores do cânone. É a mesma fonte da poda grande. */
function autoresDoCanone() {
  let medicao;
  try {
    medicao = JSON.parse(readFileSync("docs/cobertura.json", "utf8"));
  } catch {
    console.error("✗ docs/cobertura.json não existe. Rode primeiro:  pnpm cobertura");
    process.exit(1);
  }

  const ids = new Set();
  for (const l of medicao) for (const c of l.casamentos) ids.add(c.autorId);

  if (ids.size < 100) {
    console.error(`✗ só ${ids.size} autores casaram. Isso está errado, e a poda ia apagar Vieira.`);
    process.exit(1);
  }
  return [...ids];
}

const canone = autoresDoCanone();
console.log(`\n  Cânone protegido: ${canone.length} linhas de autor.\n`);

const [{ total }] = await sql`select count(*)::int as total from works`;

/** Tudo que casa o padrão, inclusive o que vai ser POUPADO. É preciso ver os dois. */
const todos = await sql`
  select w.id, w.title, w.author_id, a.name as autor,
         (immutable_unaccent(lower(w.title)) ~ ${LITERATURA}) as se_diz_literatura
    from works w left join authors a on a.id = w.author_id
   where immutable_unaccent(lower(w.title)) ~ ${PADRAO}`;

const doCanone = todos.filter((w) => w.author_id && canone.includes(w.author_id));
const literarias = todos.filter((w) => w.se_diz_literatura && !doCanone.includes(w));

const alvo = todos.filter(
  (w) => !(w.author_id && canone.includes(w.author_id)) && !w.se_diz_literatura,
);

console.log(`  Acervo:                 ${total.toLocaleString("pt-BR")} obras`);
console.log(`  Casam o padrão:         ${todos.length.toLocaleString("pt-BR")}`);
console.log(`  POUPADAS (cânone):      ${doCanone.length.toLocaleString("pt-BR")}`);
console.log(`  POUPADAS (se dizem literatura): ${literarias.length.toLocaleString("pt-BR")}`);
console.log(`  A podar:                ${alvo.length.toLocaleString("pt-BR")}\n`);

if (literarias.length > 0) {
  console.log("  O que a trava de literatura salvou (o livro se defendeu com o próprio título):");
  for (const w of literarias.slice(0, 8)) console.log(`     "${w.title.slice(0, 66)}"`);
  console.log();
}

if (doCanone.length > 0) {
  console.log("  O que a proteção do cânone salvou (as dez primeiras):");
  for (const w of doCanone.slice(0, 10)) {
    console.log(`     ${w.autor} — "${w.title.slice(0, 62)}"`);
  }
  console.log();
}

console.log("  Amostra do que sai:");
for (const w of alvo.slice(0, 12)) {
  console.log(`     ${(w.autor ?? "sem autor").slice(0, 28).padEnd(28)} "${w.title.slice(0, 56)}"`);
}

// ─────────────────────────────────────────────────────────── o portão

/**
 * ═══ O QUE ALGUÉM PÔS NA ESTANTE, FICA ═══
 *
 * Mesmo sendo um documento. Mesmo casando o padrão. Mesmo eu achando que não devia estar
 * ali.
 *
 * Apagar uma obra CASCATEIA no banco: `library_entries`, `ratings`, `reviews` e
 * `recommendations` apontam para ela. Podar uma obra que alguém tem levaria a estante
 * dessa pessoa junto — e ela nunca saberia por quê. Ela só abriria o app um dia e o livro
 * não estaria mais lá.
 *
 * Então a regra é: **a estante de uma pessoa manda mais que a nossa regra.** Se alguém
 * quis guardar o relatório do Banco do Brasil de 1977, o problema é nosso, e não dela.
 */
const tocadas = await sql`
  select distinct w.id from works w
   where w.id = any(${alvo.map((w) => w.id)}::uuid[])
     and (
       exists (select 1 from library_entries le where le.work_id = w.id)
    or exists (select 1 from ratings r          where r.work_id  = w.id)
    or exists (select 1 from reviews rv         where rv.work_id = w.id)
    or exists (select 1 from recommendations rc where rc.work_id = w.id)
     )`;

const intocaveis = new Set(tocadas.map((r) => r.id));
const ids = alvo.filter((w) => !intocaveis.has(w.id)).map((w) => w.id);

console.log(`\n  Poupadas por estarem na estante de alguém: ${intocaveis.size}`);
console.log(`  A apagar de verdade: ${ids.length.toLocaleString("pt-BR")}`);

if (!EXECUTAR) {
  console.log("\n  ─────────────────────────────────────────────────────────");
  console.log("  Isto foi um RELATÓRIO. Nada foi apagado.");
  console.log("  Para podar de verdade:  node scripts/poda-documentos.mjs --executar\n");
  await sql.end();
  process.exit(0);
}

// ─────────────────────────────────────────────────────────── a poda

console.log("\n  Podando...");

let apagadas = 0;
for (let i = 0; i < ids.length; i += 500) {
  const lote = ids.slice(i, i + 500);
  const r = await sql`delete from works where id = any(${lote}::uuid[])`;
  apagadas += r.count;
  process.stdout.write(`\r  ${apagadas}/${ids.length}`);
}

console.log(`\n\n  ✓ ${apagadas.toLocaleString("pt-BR")} documentos fora do acervo.`);
console.log(`  ✓ ${doCanone.length} obras do cânone continuam onde estavam.`);
console.log(`  ✓ ${intocaveis.size} continuam porque alguém as tem na estante.\n`);

/**
 * ════════════════════════════════════════════════════════════════════
 *  E OS AUTORES QUE FICARAM SEM NENHUMA OBRA.
 *
 *  Apagar os documentos deixou 621 autores pendurados: bispos, tribunais, câmaras
 *  legislativas, "World Conference against Racism", "Banco do Brasil S.A.". Nomes que
 *  nunca escreveram um livro, e que agora não assinam nem um.
 *
 *  A página deles abre vazia ("ainda não temos nenhuma obra deste autor"), e eles
 *  continuam aparecendo na BUSCA DE AUTORES — que é o lugar onde eles mais atrapalham,
 *  porque quem digita "coelho" para achar Coelho Neto recebe um bispo junto.
 *
 *  Um autor sem obra não é um autor: é um resto de importação.
 *
 *  ═══ E ELE NÃO ENCOSTA NO CÂNONE, NEM NO TRABALHO DE NINGUÉM ═══
 *
 *  Um autor do cânone sem obra é um buraco no ACERVO (a obra deveria estar lá), e não um
 *  autor para apagar: apagá-lo esconderia o buraco. E um autor cuja ficha alguém corrigiu
 *  carrega o nome de quem corrigiu, numa revisão assinada e pública. Os dois ficam.
 * ════════════════════════════════════════════════════════════════════
 */
if (EXECUTAR) {
  const vazios = await sql`
    select a.id from authors a
     where not exists (select 1 from works w where w.author_id = a.id)
       and not exists (select 1 from revisions r
                        where r.target_type = 'author' and r.target_id = a.id)
       and a.id <> all(${canone}::uuid[])`;

  if (vazios.length > 0) {
    const r = await sql`delete from authors where id = any(${vazios.map((a) => a.id)}::uuid[])`;
    console.log(`  ✓ ${r.count.toLocaleString("pt-BR")} autores sem nenhuma obra saíram junto.`);
    console.log("    (bispos, tribunais, câmaras legislativas. Um autor sem obra é um resto.)\n");
  }

  await sql.end();
}

#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  A PODA. O acervo do Gume deixa de ser um depósito e vira uma escolha.
 *
 *  Hoje: 373.435 obras vindas do dump da Open Library, 336 mil livros sem
 *  capa, e um catálogo TORTO — com Machado 355 vezes e sem Tolstói uma vez.
 *  Depois: só o que alguém quis. As obras dos autores do cânone
 *  (seed/canone.ts), e TUDO que qualquer pessoa tocou.
 *
 *  ═══ ELE NÃO APAGA SEM VOCÊ MANDAR ═══
 *
 *    node scripts/poda.mjs                  MEDE e imprime. Não escreve nada.
 *    node scripts/poda.mjs --executar       apaga, em lotes, e grava a conta.
 *    node scripts/poda.mjs --vacuum         devolve o disco (APP FORA DO AR).
 *
 *  Sem `--executar` ele é um relatório. É de propósito: um script que apaga
 *  98% do acervo por padrão é um script que um dia alguém roda sem querer.
 *
 *  ═══ O PORTÃO ═══
 *
 *  Antes de apagar qualquer coisa, ele conta quantas obras da lista de poda
 *  tocam dado de GENTE — estante, leitura, cópia, nota, resenha, indicação,
 *  proposta de capa, correção de bibliotecário.
 *
 *  Se esse número não for ZERO, ele ABORTA. Não avisa e continua: aborta.
 *
 *  Isso não é paranoia. Apagar uma obra CASCATEIA no banco: `library_entries`,
 *  `ratings`, `reviews`, `recommendations` e `collection_items` têm
 *  `on delete cascade` para `works`. Uma obra apagada por engano leva junto a
 *  estante de alguém, em silêncio, sem erro nenhum no terminal.
 *
 *  E `readings` aponta para EDIÇÃO, não para obra: apagar a obra apagaria a
 *  edição em cascata e deixaria a leitura da pessoa órfã, com `edition_id`
 *  nulo. O primeiro rascunho deste script tinha esse buraco.
 *
 *  ═══ EM LOTES, E NÃO NUMA TRANSAÇÃO SÓ ═══
 *
 *  365 mil obras que cascateiam para 402 mil edições e 657 mil identificadores,
 *  numa transação única, incham o WAL até o disco acabar. Vai de 5.000 em 5.000,
 *  cada lote na sua transação, e dá para parar no meio sem estragar nada.
 *
 *  ═══ O DESFAZER ═══
 *
 *  É `scripts/import-openlibrary.mjs`. O dump é público e re-importa. A gente
 *  não está queimando o dado: está tirando ele de cima da mesa.
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const env = readFileSync(".env", "utf8");
const doEnv = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const url = process.env.DATABASE_URL ?? doEnv("DATABASE_URL");
if (!url) throw new Error("DATABASE_URL não encontrado");

const EXECUTAR = process.argv.includes("--executar");
const VACUUM = process.argv.includes("--vacuum");
const LOTE = 5_000;

const sql = postgres(url, { max: 1 });

const n = (v) => Number(v).toLocaleString("pt-BR");
const mb = (bytes) => `${(Number(bytes) / 1024 / 1024).toFixed(0)} MB`;

// ─────────────────────────────────────────────────────── quem fica

/**
 * As linhas de `authors` que são autores do cânone.
 *
 * NÃO são 367 — são 539. O acervo guarda o mesmo autor sob vários nomes ("Jorge
 * Amado" e "Jorge Leal Amado de Faria" são duas linhas, com 25 e 111 obras), e é
 * seed/cobertura.ts que faz esse casamento com cuidado, em três degraus que se
 * declaram. Refazer isso aqui, com pressa, seria como a poda apaga Camões.
 */
function autoresDoCanone() {
  let medicao;
  try {
    medicao = JSON.parse(readFileSync("docs/cobertura.json", "utf8"));
  } catch {
    console.error(
      "✗ docs/cobertura.json não existe.\n" +
        "  Ele é a medição de quais linhas de `authors` são os autores do cânone.\n" +
        "  Rode primeiro:  pnpm cobertura",
    );
    process.exit(1);
  }

  const ids = new Set();
  for (const l of medicao) for (const c of l.casamentos) ids.add(c.autorId);

  if (ids.size < 100) {
    console.error(`✗ só ${ids.size} autores casaram. Isso está errado, e a poda ia apagar tudo.`);
    process.exit(1);
  }
  return [...ids];
}

/**
 * Monta as tabelas temporárias que definem o que FICA. Elas são temporárias de
 * propósito: a lista do que apagar não pode envelhecer. Se ela ficasse gravada e
 * alguém pusesse um livro na estante amanhã, a poda de depois de amanhã apagaria a
 * estante dessa pessoa usando uma lista de ontem.
 */
async function montarOQueFica(ids) {
  await sql`create temp table canone_autores (id uuid primary key)`;
  await sql`insert into canone_autores select unnest(${ids}::uuid[])`;

  // Edições intocáveis: alguém as tem, leu, propôs capa, ou corrigiu a ficha.
  // `revisions` é o livro-caixa das contribuições — é dele que sai a insígnia de
  // bibliotecário. Apagar uma edição revisada reduziria a contribuição de alguém
  // em silêncio, e isso também é dado de gente.
  await sql`
    create temp table edicoes_de_gente as
      select distinct e.id, e.work_id from editions e
       where exists (select 1 from library_entries le where le.edition_id = e.id)
          or exists (select 1 from owned_copies oc where oc.edition_id = e.id)
          or exists (select 1 from readings r where r.edition_id = e.id)
          or exists (select 1 from cover_proposals cp where cp.edition_id = e.id)
          or exists (select 1 from revisions rv
                      where rv.target_type = 'edition' and rv.target_id = e.id)`;
  await sql`create index on edicoes_de_gente (work_id)`;

  /**
   * ════════════════════════════════════════════════════════════════════
   *  A FICHA COMPLETA. A terceira classe do que fica, e ela mudou a poda inteira.
   *
   *  ═══ O CRITÉRIO QUE QUASE ENTROU, E QUE ERA A PODA AO CONTRÁRIO ═══
   *
   *  A ideia era manter "as 300 maiores editoras". Ela parece prudente e é venenosa:
   *  ordenar editora por número de obras mantém Vozes e Record, que são grandes porque são
   *  VELHAS, e apaga Antofágica, Todavia e Intrínseca, que são pequenas porque são NOVAS —
   *  e que são exatamente o que o leitor de hoje tem na estante.
   *
   *  Contagem, aqui, é um proxy de idade disfarçado de proxy de qualidade. Uma poda por
   *  contagem preservaria o acervo de 1970 e apagaria o de 2024.
   *
   *  ═══ O QUE FICA NO LUGAR ═══
   *
   *  A ficha completa: existe uma edição com CAPA e com ISBN. Não é uma medida de prestígio
   *  da editora — é uma medida de a obra ser ACHÁVEL e RECONHECÍVEL. Uma ficha com capa e
   *  ISBN é uma ficha que a pessoa encontra na busca e reconhece na tela.
   *
   *  E ela é neutra quanto a tamanho, idade e país da editora, que é o ponto.
   *
   *  ═══ CAPA **E** ISBN, E NÃO CAPA **OU** ISBN ═══
   *
   *  As duas exigências têm que valer na MESMA edição. Uma obra com uma edição que tem só
   *  capa e outra que tem só ISBN não é uma ficha completa: são duas fichas pela metade.
   *
   *  O ISBN vive em dois lugares (a coluna `isbn13` da edição e a tabela `identifiers`,
   *  onde mora o ISBN-10), e olhar só um deles derrubaria fichas boas em silêncio.
   * ════════════════════════════════════════════════════════════════════
   */
  await sql`
    create temp table tem_capa as
      select distinct work_id from editions where cover_url is not null`;
  await sql`create index on tem_capa (work_id)`;

  /**
   * ════════════════════════════════════════════════════════════════════
   *  O SALVO-CONDUTO BRASILEIRO. Ele não é um critério de qualidade: é um FREIO.
   *
   *  ═══ POR QUE UMA LISTA DE EDITORA, SE PODAR POR EDITORA É PROIBIDO ═══
   *
   *  Podar POR editora é proibido, e continua sendo: ordenar editora por número de obras
   *  mantém Vozes e Record, que são grandes porque são VELHAS, e apaga Antofágica e
   *  Todavia, que são pequenas porque são NOVAS. Contagem, ali, é idade disfarçada de
   *  qualidade, e o corte sairia ao contrário.
   *
   *  Isto aqui anda na direção OPOSTA. Nenhuma obra é apagada por causa da editora dela;
   *  algumas são SALVAS por causa dela. Uma lista errada, aqui, no pior caso guarda um
   *  livro a mais. Uma lista errada num critério de CORTE apaga um livro para sempre.
   *
   *  ═══ O QUE ELE COMPRA ═══
   *
   *  A medição achou 13.898 obras com editora brasileira reconhecível que sairiam só por
   *  não ter capa no dump — Record, Rocco, L&PM, Ática. São livros de verdade, publicados
   *  aqui, que a Open Library nunca fotografou. Sem capa eles não são bonitos; sem eles, a
   *  busca por um livro brasileiro de catálogo antigo não acha nada.
   *
   *  O preço é honesto e está declarado: a base fica com ~13.9 mil fichas sem capa, e elas
   *  vão aparecer no "o que falta" pedindo capa. Que é exatamente o trabalho que o Gume
   *  quer que exista.
   * ════════════════════════════════════════════════════════════════════
   */
  await sql`
    create temp table editora_conhecida as
      select distinct e.work_id from editions e
       where e.publisher is not null and e.publisher ~* ${EDITORAS_BR}`;
  await sql`create index on editora_conhecida (work_id)`;

  await sql`
    create temp table obras_que_ficam as
      select w.id from works w
       where exists (select 1 from canone_autores c where c.id = w.author_id)
          or exists (select 1 from edicoes_de_gente g where g.work_id = w.id)
          -- A CAPA. É o que o leitor VÊ: o que faz o livro ser reconhecível na busca e a
          -- estante ser bonita. Cortar por falta de ISBN um livro que TEM capa seria cortar
          -- por um dado que ninguém enxerga. ISBN sem capa continua saindo.
          or exists (select 1 from tem_capa tc where tc.work_id = w.id)
          or exists (select 1 from editora_conhecida ec where ec.work_id = w.id)
          -- Mangá: a série inteira fica, e os volumes com ela. Um volume solto de uma
          -- série cortada é pior do que nenhum: a lacuna vira um buraco na coleção.
          or w.series_id is not null
          or exists (select 1 from library_entries le where le.work_id = w.id)
          or exists (select 1 from owned_copies oc where oc.work_id = w.id)
          or exists (select 1 from ratings ra where ra.work_id = w.id)
          or exists (select 1 from reviews rv where rv.work_id = w.id)
          or exists (select 1 from collection_items ci where ci.work_id = w.id)
          or exists (select 1 from recommendations re where re.work_id = w.id)
          or exists (select 1 from activities ac where ac.work_id = w.id)`;
  await sql`create index on obras_que_ficam (id)`;
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O TESTE DO VIÉS. A pergunta que uma poda tem que se fazer sobre si mesma.
 *
 *  Toda poda parece boa para quem a escreveu: o critério é dele, a amostra é sorteada pelo
 *  critério dele, e o resultado confirma o que ele já achava. O jeito de sair desse laço é
 *  procurar, de propósito, a evidência de que a poda está errada.
 *
 *  A evidência, aqui, é o nome de uma editora brasileira do lado de uma obra que vai sair.
 *  Se o corte estiver certo, o que sai são fichas órfãs de digitalização — e ficha órfã não
 *  tem editora reconhecível, porque ninguém no Brasil a publicou.
 *
 *  Se este número for alto, o critério está errado, e não a lista.
 * ════════════════════════════════════════════════════════════════════
 */
const EDITORAS_BR =
  "\\y(companhia das letras|companhia de bolso|record|rocco|intrínseca|intrinseca|todavia|" +
  "antofágica|antofagica|objetiva|suma|arqueiro|sextante|galera|darkside|dark side|aleph|" +
  "zahar|jorge zahar|martins fontes|vozes|nova fronteira|ática|atica|scipione|melhoramentos|" +
  "panini|jbc|newpop|new pop|devir|l&pm|l & pm|autêntica|autentica|boitempo|ubu|fósforo|" +
  "fosforo|moderna|saraiva|ediouro|bertrand|josé olympio|jose olympio|civilização brasileira|" +
  "civilizacao brasileira|paz e terra|perspectiva|iluminuras|tordesilhas|seguinte|alfaguara|" +
  "harpercollins|harper collins|faro editorial|verus|valentina|morro branco|gutenberg|" +
  "principis|martin claret|landmark|planeta|globo livros|editora globo|unesp|edusp|" +
  "cosac|naify|editora 34|contexto|casa da palavra|leya|wmf|pallas|malê|dublinense|patuá)\\y";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O TESTE DO VIÉS. SÃO DUAS PERGUNTAS, E A PRIMEIRA NÃO PODE FALHAR.
 *
 *  ═══ A ARMADILHA QUE ESTE COMENTÁRIO EXISTE PARA EVITAR ═══
 *
 *  A primeira pergunta é "quantas obras com editora brasileira reconhecível saem?". Ela
 *  media alguma coisa enquanto a editora não salvava ninguém. Agora que existe o
 *  salvo-conduto, a resposta é ZERO POR CONSTRUÇÃO — o mesmo `~*` que salva é o que
 *  procura.
 *
 *  Deixá-la aí, sozinha, imprimindo "nenhuma, o corte está limpo", seria a pior linha
 *  deste repositório: um teste que não pode falhar, dando a impressão de ter passado. Ela
 *  fica, mas rebaixada ao que de fato é — a CONFERÊNCIA de que o salvo-conduto disparou.
 *  Se ela não for zero, é bug no `montarOQueFica`, e não notícia sobre o acervo.
 *
 *  ═══ A PERGUNTA QUE AINDA PODE MACHUCAR ═══
 *
 *  A segunda é independente da lista: quantas obras que saem têm QUALQUER editora e um ano
 *  a partir de 1990? Um livro com editora e ano recente é um livro que alguém publicou de
 *  verdade e que alguém pode querer — e ele não depende de eu ter lembrado do nome da
 *  editora. É aqui que o corte ainda pode estar errado, e é isto que você tem que olhar.
 * ════════════════════════════════════════════════════════════════════
 */
async function vies() {
  const [conferencia] = await sql`
    select count(*)::int as n from works w
     where not exists (select 1 from obras_que_ficam f where f.id = w.id)
       and exists (select 1 from editions e
                    where e.work_id = w.id
                      and e.publisher is not null
                      and e.publisher ~* ${EDITORAS_BR})`;

  console.log("\n  CONFERÊNCIA — o salvo-conduto brasileiro disparou?\n");
  if (conferencia.n === 0) {
    console.log("   ✓ zero obras com editora brasileira reconhecível saem.");
    console.log("     (isto é uma conferência, e não uma notícia: o salvo-conduto usa a");
    console.log("      mesma lista. Se não fosse zero, seria bug no que fica.)");
  } else {
    console.log(`   ✗ ${n(conferencia.n)} saem MESMO ASSIM. Isto é um bug no montarOQueFica().`);
  }

  const [r] = await sql`
    select count(*)::int as n from works w
     where not exists (select 1 from obras_que_ficam f where f.id = w.id)
       and exists (select 1 from editions e
                    where e.work_id = w.id
                      and e.publisher is not null
                      and e.published_year >= 1990)`;

  const exemplos = await sql`
    select w.title, e.publisher, e.published_year as ano from works w
      join editions e on e.work_id = w.id
     where not exists (select 1 from obras_que_ficam f where f.id = w.id)
       and e.publisher is not null and e.published_year >= 1990
     order by md5(w.id::text) limit 10`;

  console.log("\n  O TESTE DO VIÉS — obras que saem COM editora (qualquer uma) e ano ≥ 1990:\n");
  console.log(`   ${n(r.n)} obras. Estas são as que ainda podem doer: alguém as publicou.\n`);
  for (const l of exemplos) {
    console.log(
      `   · ${String(l.title).replace(/\s+/g, " ").slice(0, 44).padEnd(45)}` +
        `${String(l.publisher).slice(0, 24).padEnd(25)}${l.ano}`,
    );
  }
  return r.n;
}

// ─────────────────────────────────────────────────────── o portão

async function oPortao() {
  const [r] = await sql`
    select count(*)::int as n from works w
     where not exists (select 1 from obras_que_ficam f where f.id = w.id)
       and (exists (select 1 from library_entries le where le.work_id = w.id)
         or exists (select 1 from ratings ra where ra.work_id = w.id)
         or exists (select 1 from reviews rv where rv.work_id = w.id)
         or exists (select 1 from owned_copies oc where oc.work_id = w.id)
         or exists (select 1 from collection_items ci where ci.work_id = w.id)
         or exists (select 1 from recommendations re where re.work_id = w.id)
         or exists (select 1 from activities ac where ac.work_id = w.id)
         or exists (select 1 from edicoes_de_gente g where g.work_id = w.id))`;

  if (r.n !== 0) {
    console.error(
      `\n✗ ABORTADO. ${n(r.n)} obras da lista de poda estão na estante, na leitura ou\n` +
        "  na correção de alguém. Apagar uma obra CASCATEIA para a estante dessa pessoa,\n" +
        "  em silêncio. Nada foi apagado. Isto é um bug no que fica, e não um aviso.",
    );
    await sql.end();
    process.exit(1);
  }

  console.log("  ✓ o portão: nenhuma obra a apagar toca dado de gente.\n");
}

// ─────────────────────────────────────────────────────── a conta

async function contar() {
  const [c] = await sql`
    select (select count(*) from works)::int as obras,
           (select count(*) from obras_que_ficam)::int as obras_ficam,
           (select count(*) from editions)::int as edicoes,
           (select count(*) from editions e
              join obras_que_ficam f on f.id = e.work_id)::int as edicoes_ficam,
           (select count(*) from authors)::int as autores,
           (select count(*) from authors a where exists (
              select 1 from works w join obras_que_ficam f on f.id = w.id
               where w.author_id = a.id))::int as autores_ficam,
           pg_database_size(current_database()) as bytes`;
  return c;
}

function mostrar(c) {
  const linha = (t, hoje, ficam) =>
    console.log(
      `  ${t.padEnd(16)} ${n(hoje).padStart(9)} → ${n(ficam).padStart(7)}` +
        `   (saem ${n(hoje - ficam)}, ${Math.round((100 * (hoje - ficam)) / hoje)}%)`,
    );

  console.log("  ─────────────────────────────────────────────────────────────");
  linha("obras", c.obras, c.obras_ficam);
  linha("edições", c.edicoes, c.edicoes_ficam);
  linha("autores", c.autores, c.autores_ficam);
  console.log("  ─────────────────────────────────────────────────────────────");
  console.log(`  banco hoje ....... ${mb(c.bytes)}`);
}

/** Os títulos que sairiam. Sorteados, e não os primeiros: os primeiros mentem. */
async function amostra() {
  const linhas = await sql`
    select w.title, coalesce(a.name, '—') as autor,
           exists (select 1 from editions e
                    where e.work_id = w.id and e.cover_url is not null) as tem_capa
      from works w left join authors a on a.id = w.author_id
     where not exists (select 1 from obras_que_ficam f where f.id = w.id)
     order by md5(w.id::text)
     limit 30`;

  console.log("\n  TRINTA QUE SAIRIAM (sorteados — os primeiros da ordem alfabética mentem:");
  console.log("  o Unicode joga o lixo para a frente, e a amostra fica boa demais)\n");
  for (const l of linhas) {
    console.log(
      `   ${l.tem_capa ? "▣" : "▢"} ${String(l.title).replace(/\s+/g, " ").slice(0, 54).padEnd(55)}${String(l.autor).slice(0, 22)}`,
    );
  }
  console.log("\n   ▣ tem capa   ▢ não tem");
}

// ─────────────────────────────────────────────────────── a poda

async function podar(canoneTamanho, antes) {
  console.log("\n  Podando, de 5.000 em 5.000. Cada lote na sua transação.\n");

  let total = 0;
  for (;;) {
    // O DELETE cascateia para editions → identifiers, e para ratings, reviews,
    // library_entries, collection_items, recommendations, activities. Nenhuma dessas
    // linhas existe para as obras daqui: o portão já garantiu isso.
    const apagadas = await sql`
      with lote as (
        select w.id from works w
         where not exists (select 1 from obras_que_ficam f where f.id = w.id)
         limit ${LOTE}
      )
      delete from works where id in (select id from lote)
      returning 1`;

    if (apagadas.length === 0) break;
    total += apagadas.length;
    process.stdout.write(`\r  ${n(total)} obras apagadas…`);
  }

  console.log(`\r  ${n(total)} obras apagadas.        `);

  // Os autores que ficaram sem nenhuma obra. Vão por último, e não por cascata:
  // `works.author_id` é `on delete set null`, e não o contrário.
  const [{ count: autores }] = await sql`
    with orfaos as (
      select a.id from authors a
       where not exists (select 1 from works w where w.author_id = a.id)
    )
    delete from authors where id in (select id from orfaos)
    returning 1
  `.then((r) => [{ count: r.length }]);

  console.log(`  ${n(autores)} autores sem nenhuma obra, apagados.`);

  const depois = await contar();

  await sql`
    insert into poda_registro (
      canone_autores, obras_antes, obras_depois, edicoes_antes, edicoes_depois,
      autores_antes, autores_depois, bytes_antes, bytes_depois
    ) values (
      ${canoneTamanho}, ${antes.obras}, ${depois.obras}, ${antes.edicoes},
      ${depois.edicoes}, ${antes.autores}, ${depois.autores},
      ${antes.bytes}, ${depois.bytes}
    )`;

  console.log("\n  ✓ gravado em poda_registro (a contagem antes e depois).");
  console.log(
    `\n  O banco ainda diz ${mb(depois.bytes)}, e isso é ESPERADO: o DELETE não devolve\n` +
      "  disco. O espaço virou buraco reutilizável. Para a Neon cobrar menos:\n\n" +
      "      node scripts/poda.mjs --vacuum      (com o app FORA DO AR)\n",
  );
}

async function vacuum() {
  console.log(
    "\n  VACUUM FULL. Ele TRANCA as tabelas: o app precisa estar fora do ar, e\n" +
      "  ele precisa de espaço livre igual ao tamanho da tabela para trabalhar.\n",
  );

  const antes = (await sql`select pg_database_size(current_database()) as b`)[0].b;

  for (const tabela of ["works", "editions", "identifiers", "authors"]) {
    process.stdout.write(`  ${tabela}…`);
    await sql.unsafe(`vacuum full analyze ${tabela}`);
    console.log(" ok");
  }

  const depois = (await sql`select pg_database_size(current_database()) as b`)[0].b;
  console.log(`\n  ✓ ${mb(antes)} → ${mb(depois)}\n`);
}

// ─────────────────────────────────────────────────────── main

const ids = autoresDoCanone();
console.log(`\n  Cânone: ${n(ids.length)} linhas de autor (seed/canone.ts, casadas por pnpm cobertura).\n`);

await montarOQueFica(ids);
await oPortao();

const antes = await contar();
mostrar(antes);

if (VACUUM) {
  await vacuum();
} else if (EXECUTAR) {
  await podar(ids.length, antes);
} else {
  await amostra();
  await vies();
  console.log(
    "\n  ─────────────────────────────────────────────────────────────\n" +
      "  NADA FOI APAGADO. Isto foi só a medição.\n\n" +
      "  Para podar de verdade:   node scripts/poda.mjs --executar\n" +
      "  E depois, com o app fora do ar:  node scripts/poda.mjs --vacuum\n" +
      "\n  O desfazer é  pnpm db:import  — o dump da Open Library é público.\n",
  );
}

await sql.end();

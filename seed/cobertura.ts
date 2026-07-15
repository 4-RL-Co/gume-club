/**
 * ════════════════════════════════════════════════════════════════════
 *  A COBERTURA. Medir antes de tocar em nada.
 *
 *  Dos 300 do cânone: quantos existem no catálogo? com quantas obras? e
 *  quantas dessas obras têm CAPA?
 *
 *  ═══ O CASAMENTO É SUJO, E ELE SE DECLARA ═══
 *
 *  Casar "Eiichiro Oda" com o que a Open Library guardou é o problema
 *  inteiro. O dump traz o nome em qualquer ordem ("Oda, Eiichirō"), em
 *  qualquer romanização (Gotouge / Gotōge / Gotoge), às vezes em kanji, e
 *  quase sempre em inglês.
 *
 *  Então o casamento acontece em três degraus, do mais seguro ao menos, e
 *  CADA UM SE DECLARA no relatório:
 *
 *    1. EXATO — o nome, sem acento e sem pontuação, é igual. Não tem como
 *       errar.
 *
 *    2. INVERTIDO — os mesmos tokens, em outra ordem. "Oda Eiichiro" e
 *       "Eiichiro Oda" ordenados dão a mesma coisa. Isto resolve o nome
 *       japonês inteiro sem chutar nada: não é semelhança, é igualdade de
 *       conjunto.
 *
 *    3. PARECIDO — trigrama, acima de 0,75. É o único degrau que CHUTA, e
 *       por isso ele sai no relatório com o nome dos dois lados, para
 *       olho humano conferir. Um "parecido" nunca vira verdade em
 *       silêncio.
 *
 *  E o que NÃO casar em degrau nenhum sai listado, um a um. Um autor sem
 *  nada no catálogo não é uma exclusão: é uma TAREFA. O buraco medido é o
 *  trabalho, e não o veredito.
 *
 *  Nome curto demais ("ONE", "CLAMP", "Homero") só casa no degrau 1: por
 *  similaridade, "ONE" casaria com meio catálogo.
 *
 *  Uso:  node --experimental-strip-types seed/cobertura.ts
 * ════════════════════════════════════════════════════════════════════
 */

import { Pool } from "pg";
import { writeFileSync } from "node:fs";
import { CANONE, grafias, type AutorDoCanone } from "./canone.ts";

const PARECIDO_BASTA = 0.75;

type Grau = "exato" | "invertido" | "contido" | "parecido";

type Casamento = {
  autorId: string;
  nomeNoCatalogo: string;
  grau: Grau;
  /** Só para o grau "parecido": a nota do trigrama, para o olho humano julgar. */
  nota?: number;
};

type Linha = {
  autor: AutorDoCanone;
  casamentos: Casamento[];
  obras: number;
  obrasComCapa: number;
};

/** Sem acento, sem pontuação, minúsculo, espaço colapsado. Os dois lados passam por aqui. */
function canonico(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Os mesmos tokens em qualquer ordem. Resolve "Oda Eiichiro" contra "Eiichiro Oda". */
function ordenado(nome: string): string {
  return canonico(nome).split(" ").filter(Boolean).sort().join(" ");
}

function tokens(nome: string): string[] {
  return canonico(nome).split(" ").filter(Boolean);
}

/**
 * Os padrões de `LIKE` que exigem que TODAS as palavras do nome estejam no nome do
 * catálogo. É isto que acha o mangaká.
 *
 * O acervo guarda "三浦建太郎 (Kentaro Miura)" — o kanji E o nome romano, no mesmo campo.
 * Contra "Kentaro Miura", isso não é igual, não é o mesmo CONJUNTO de palavras (sobra o
 * kanji), e a nota do trigrama afunda por causa dele. Os três primeiros degraus não
 * pegavam, e o relatório declarou que o acervo não tinha Kentaro Miura — sendo que
 * Berserk está lá, em três volumes.
 *
 * De brinde, o mesmo degrau resolve o "Jorge Leal Amado de Faria": ele CONTÉM "jorge" e
 * "amado", que é o nome que a gente procura.
 */
function contem(nome: string): string[] {
  return tokens(nome).map((t) => `%${t}%`);
}

/**
 * Todas as palavras do nome procurado aparecem no nome do catálogo.
 *
 * ═══ ELE ERRA PARA O LADO DE GUARDAR, E ISSO É DE PROPÓSITO ═══
 *
 * Este degrau é GENEROSO, e o preço está à vista. Procurando "Jorge Amado", ele casa:
 *
 *     Jorge Leal Amado de Faria          ← é ele (o nome de registro)
 *     Paloma Jorge Amado                 ← é a FILHA dele, outra autora
 *     Fundação Casa de Jorge Amado       ← é uma instituição
 *     Colóquio Jorge Amado (2002 Paris)  ← são anais de congresso
 *
 * Três dos quatro estão errados, e mesmo assim o degrau fica.
 *
 * A razão é a assimetria do risco, e quem usa este casamento é a PODA. Guardar por
 * engano os livros da Paloma custa algumas centenas de fichas num acervo de nove mil.
 * Apagar por engano o "Luís de 1524?-1580 Camões" — que É Camões, com o nome escrito
 * torto pelo catalogador — custa Camões, e o desfazer é reimportar o dump inteiro.
 *
 * Num casamento que decide o que APAGAR, errar para o lado de guardar é a única
 * direção segura.
 *
 * O preço, e ele precisa estar escrito para ninguém acreditar no número depois: a
 * contagem de obras por autor deste relatório é um TETO, e não um número exato. "Jorge
 * Amado, 152 obras" quer dizer "até 152 obras que têm alguma coisa a ver com Jorge
 * Amado", e não "152 livros escritos por ele".
 */
function contido(procurado: string, noCatalogo: string): boolean {
  const alvo = tokens(procurado);
  // Uma palavra só é frouxo demais: "Homero" casaria com meio catálogo.
  if (alvo.length < 2) return false;

  const nele = new Set(tokens(noCatalogo));
  return alvo.every((t) => nele.has(t));
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log(`\n  Medindo ${CANONE.length} autores contra o catálogo…\n`);

  // O trigrama do Postgres, no MESMO limiar do resto do app (lib/catalog.ts). Frouxo
  // aqui é o que traz o candidato; quem julga é o JS abaixo, com os três degraus.
  await pool.query("set pg_trgm.similarity_threshold = 0.45");

  const linhas: Linha[] = [];

  for (const autor of CANONE) {
    const vistos = new Map<string, Casamento>();

    for (const g of grafias(autor)) {
      const alvo = canonico(g);
      if (!alvo) continue;

      const { rows } = await pool.query<{ id: string; name: string; nota: number }>(
        autor.exato
          ? // Nome curto demais para similaridade. Só igualdade.
            `select a.id, a.name, 1::float as nota
               from authors a
              where immutable_unaccent(lower(a.name)) = immutable_unaccent(lower($1))`
          : /**
             * O `order by` NÃO é enfeite, e ele já me enganou uma vez.
             *
             * Sem ele, um nome comum ("Mário de Andrade") traz dezenas de parecidos —
             * "Biblioteca Municipal Mário de Andrade", "Mário de Andrade Lira" — e o
             * LIMIT cortava fora justamente o casamento EXATO, que estava no meio do
             * monte. O relatório então dizia "não existe no catálogo" sobre um autor que
             * existia, com o nome escrito igualzinho.
             *
             * Um falso buraco é pior que buraco nenhum: ele vira tarefa que não existe, e
             * a poda apaga o que devia ficar. O exato vem primeiro, sempre.
             */
            `select a.id, a.name,
                    similarity(immutable_unaccent(lower(a.name)),
                               immutable_unaccent(lower($1))) as nota
               from authors a
              where immutable_unaccent(lower(a.name)) % immutable_unaccent(lower($1))
                 or immutable_unaccent(lower(a.name)) = immutable_unaccent(lower($1))
                 -- O acervo guarda o mangaká como "三浦建太郎 (Kentaro Miura)": o kanji E o
                 -- nome romano, no mesmo campo. Contra "Kentaro Miura" isso não é igual,
                 -- não é o mesmo conjunto de palavras, e a nota do trigrama afunda por
                 -- causa do kanji. Nenhum dos três degraus pegava, e o relatório dizia
                 -- "Kentaro Miura não existe no acervo" — sendo que Berserk está lá.
                 --
                 -- Aqui a gente pede o CONTINENTE: todo autor cujo nome CONTÉM todas as
                 -- palavras do nome procurado. Quem julga é o JS, no degrau "contido".
                 or (cardinality($2::text[]) > 1
                     and immutable_unaccent(lower(a.name)) like all($2::text[]))
              order by (immutable_unaccent(lower(a.name))
                        = immutable_unaccent(lower($1))) desc,
                       similarity(immutable_unaccent(lower(a.name)),
                                  immutable_unaccent(lower($1))) desc
              limit 60`,
        // A consulta do nome EXATO só tem $1. Mandar $2 para ela quebraria o bind.
        autor.exato ? [g] : [g, contem(g)],
      );

      for (const r of rows) {
        const doCatalogo = canonico(r.name);
        let grau: Grau | null = null;

        if (doCatalogo === alvo) grau = "exato";
        else if (autor.exato) grau = null; // curto demais: só o degrau 1 vale
        else if (ordenado(r.name) === ordenado(g)) grau = "invertido";
        else if (contido(g, r.name)) grau = "contido";
        else if (r.nota >= PARECIDO_BASTA) grau = "parecido";

        if (!grau) continue;

        // Um autor pode casar por várias grafias. Fica o degrau mais seguro.
        const anterior = vistos.get(r.id);
        const peso = { exato: 4, invertido: 3, contido: 2, parecido: 1 } as const;
        if (!anterior || peso[grau] > peso[anterior.grau]) {
          vistos.set(r.id, {
            autorId: r.id,
            nomeNoCatalogo: r.name,
            grau,
            ...(grau === "parecido" ? { nota: Number(r.nota.toFixed(2)) } : {}),
          });
        }
      }
    }

    const casamentos = [...vistos.values()];
    let obras = 0;
    let obrasComCapa = 0;

    if (casamentos.length > 0) {
      const ids = casamentos.map((c) => c.autorId);
      const { rows } = await pool.query<{ obras: string; com_capa: string }>(
        `select count(*)::text as obras,
                count(*) filter (
                  where exists (select 1 from editions e
                                 where e.work_id = w.id and e.cover_url is not null)
                )::text as com_capa
           from works w
          where w.author_id = any($1::uuid[])`,
        [ids],
      );
      obras = Number(rows[0]?.obras ?? 0);
      obrasComCapa = Number(rows[0]?.com_capa ?? 0);
    }

    linhas.push({ autor, casamentos, obras, obrasComCapa });
    process.stdout.write(
      casamentos.length === 0 ? "\x1b[31m·\x1b[0m" : obrasComCapa === 0 ? "\x1b[33m·\x1b[0m" : "\x1b[32m·\x1b[0m",
    );
  }

  console.log("\n");
  relatorio(linhas);
  await pool.end();
}

function relatorio(linhas: Linha[]) {
  const semNada = linhas.filter((l) => l.casamentos.length === 0);
  const semCapa = linhas.filter((l) => l.casamentos.length > 0 && l.obrasComCapa === 0);
  const ok = linhas.filter((l) => l.obrasComCapa > 0);
  const chutados = linhas.filter((l) => l.casamentos.some((c) => c.grau === "parecido"));

  const totalObras = linhas.reduce((s, l) => s + l.obras, 0);
  const totalComCapa = linhas.reduce((s, l) => s + l.obrasComCapa, 0);

  const bar = "─".repeat(66);
  console.log(bar);
  console.log("  A COBERTURA DOS 300");
  console.log(bar);
  console.log(`  no catálogo, com capa .......... ${ok.length}`);
  console.log(`  no catálogo, SEM NENHUMA capa .. ${semCapa.length}`);
  console.log(`  fora do catálogo (TAREFA) ...... ${semNada.length}`);
  console.log("");
  console.log(`  obras dos 300 .................. ${totalObras.toLocaleString("pt-BR")}`);
  console.log(`  delas, com capa ................ ${totalComCapa.toLocaleString("pt-BR")}` +
    ` (${totalObras ? Math.round((100 * totalComCapa) / totalObras) : 0}%)`);
  console.log(bar);

  // ── O MANGÁ. A aposta declarada, medida.
  const manga = new Set(MANGAKAS);
  const mangaLinhas = linhas.filter((l) => manga.has(l.autor.nome));
  const mangaSemNada = mangaLinhas.filter((l) => l.casamentos.length === 0);
  const mangaObras = mangaLinhas.reduce((s, l) => s + l.obras, 0);
  console.log("\n  O BURACO DO MANGÁ (o tamanho real do que o AniList preencheria)");
  console.log(`  mangakás no cânone ............. ${mangaLinhas.length}`);
  console.log(`  sem NADA no catálogo ........... ${mangaSemNada.length}`);
  console.log(`  obras somadas de todos eles .... ${mangaObras}`);

  console.log("\n" + bar);
  console.log("  OS QUE NÃO CASARAM COM NADA — cada um é uma TAREFA, não uma exclusão");
  console.log(bar);
  for (const l of semNada) {
    console.log(`  ✗ ${l.autor.nome.padEnd(34)} ${l.autor.origem}`);
  }

  console.log("\n" + bar);
  console.log("  OS QUE EU CHUTEI — o degrau que não é igualdade. Confira com o olho.");
  console.log(bar);
  for (const l of chutados) {
    for (const c of l.casamentos.filter((c) => c.grau === "parecido")) {
      console.log(`  ? ${l.autor.nome.padEnd(30)} ~ ${c.nomeNoCatalogo}  (${c.nota})`);
    }
  }

  const destino = "docs/cobertura.json";
  writeFileSync(
    destino,
    JSON.stringify(
      linhas.map((l) => ({
        nome: l.autor.nome,
        origem: l.autor.origem,
        obras: l.obras,
        obrasComCapa: l.obrasComCapa,
        casamentos: l.casamentos,
      })),
      null,
      2,
    ),
  );
  console.log(`\n  medição inteira gravada em ${destino}\n`);
}

/** Os 50 do bloco de mangá, para o relatório poder medir a aposta separadamente. */
const MANGAKAS = [
  "Akira Toriyama", "Eiichiro Oda", "Masashi Kishimoto", "Tite Kubo", "Masami Kurumada",
  "Kazuki Takahashi", "Yoshihiro Togashi", "Hirohiko Araki", "Kentaro Miura",
  "Takehiko Inoue", "Naoki Urasawa", "Osamu Tezuka", "Rumiko Takahashi", "CLAMP",
  "Naoko Takeuchi", "Hiromu Arakawa", "Tsugumi Ohba", "Takeshi Obata", "Hajime Isayama",
  "Koyoharu Gotouge", "Gege Akutami", "Tatsuki Fujimoto", "Kōhei Horikoshi", "Sui Ishida",
  "ONE", "Yusuke Murata", "Makoto Yukimura", "Junji Ito", "Inio Asano", "Haruichi Furudate",
  "Muneyuki Kaneshiro", "Yusuke Nomura", "Yukinobu Tatsu", "Naoya Matsumoto", "Tatsuya Endo",
  "Aka Akasaka", "Mengo Yokoyari", "Ken Wakui", "Nakaba Suzuki", "Hiro Mashima",
  "Yūki Tabata", "Kazue Kato", "Ai Yazawa", "Natsuki Takaya", "Paru Itagaki",
  "Kamome Shirahama", "Kanehito Yamada", "Tsukasa Abe", "Yoshitoki Ōima", "Sumiko Arai",
];

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

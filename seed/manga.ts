/**
 * ════════════════════════════════════════════════════════════════════
 *  SEMEAR O MANGÁ. E, antes de tudo, MOSTRAR o que vai ser gravado.
 *
 *  Três bugs foram pegos hoje olhando a amostra impressa antes da escrita, e
 *  nenhum deles por teste:
 *
 *    · o TRADUTOR gravado como autor de "A Morte de Ivan Ilitch"
 *    · "Portugal." entrando como se fosse uma pessoa
 *    · o padrão `ltr` casando com CULTRIX, e apagando Jung e Tao junto
 *
 *  Por isso este script IMPRIME por padrão, e só grava com `--executar`.
 *
 *  Uso:  node --experimental-strip-types seed/manga.ts
 *        node --experimental-strip-types seed/manga.ts --executar
 * ════════════════════════════════════════════════════════════════════
 */
import { seriesDeQualquerGrafia, autoriaDasSeries } from "../lib/anilist.ts";
import { grafias } from "./canone.ts";
import { limparNomeDeAutor } from "../lib/autores.ts";
import { CANONE } from "./canone.ts";



// Os 50 do bloco de mangá. O cânone não os marca com uma origem própria, então a
// lista vem daqui — e ela é a mesma de seed/cobertura.ts.
const OS_50 = [
  "Akira Toriyama", "Eiichiro Oda", "Masashi Kishimoto", "Tite Kubo", "Masami Kurumada",
  "Kazuki Takahashi", "Yoshihiro Togashi", "Hirohiko Araki", "Kentaro Miura",
  "Takehiko Inoue", "Naoki Urasawa", "Osamu Tezuka", "Rumiko Takahashi", "CLAMP",
  "Naoko Takeuchi", "Hiromu Arakawa", "Tsugumi Ohba", "Takeshi Obata", "Hajime Isayama",
  "Koyoharu Gotouge", "Gege Akutami", "Tatsuki Fujimoto", "Kohei Horikoshi", "Sui Ishida",
  "ONE", "Yusuke Murata", "Makoto Yukimura", "Junji Ito", "Inio Asano", "Haruichi Furudate",
  "Muneyuki Kaneshiro", "Yusuke Nomura", "Yukinobu Tatsu", "Naoya Matsumoto", "Tatsuya Endo",
  "Aka Akasaka", "Mengo Yokoyari", "Ken Wakui", "Nakaba Suzuki", "Hiro Mashima",
  "Yuki Tabata", "Kazue Kato", "Ai Yazawa", "Natsuki Takaya", "Paru Itagaki",
  "Kamome Shirahama", "Kanehito Yamada", "Tsukasa Abe", "Yoshitoki Oima", "Sumiko Arai",
];


const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

const EXECUTAR = process.argv.includes("--executar");

console.log(`\n  Consultando a AniList para ${OS_50.length} mangakás…\n`);

/**
 * UMA SÉRIE É UMA LINHA. Deduplicada pelo id da AniList.
 *
 * "Bakemonogatari" aparecia QUATRO vezes, porque casou com quatro mangakás diferentes
 * na busca. Uma série que entra quatro vezes no acervo é quatro páginas, quatro
 * coleções e quatro estantes para a mesma coisa.
 */
const porId = new Map<number, Awaited<ReturnType<typeof seriesDeQualquerGrafia>>[number]>();
const recusados: string[] = [];

for (const m of OS_50) {
  // As GRAFIAS, e não o nome: a AniList chama o Oda de "Eiichirou Oda".
  const doCanone = CANONE.find((a) => a.nome.normalize("NFD").replace(/\p{Diacritic}/gu, "") === m);
  const nomes = doCanone ? grafias(doCanone) : [m];

  // Um TETO por mangaká. A AniList devolve 23 "séries" do Toriyama, e vinte delas são
  // spin-off promocional. Oito é o bastante para a obra de verdade caber.
  let achadas;
  try {
    /**
     * SEM TETO. Corte por REGRA, e não por número.
     *
     * Um teto de "3 séries por mangaká" mataria Pluto e 20th Century Boys (Urasawa),
     * Black Jack e Fênix (Tezuka), Fire Punch (Fujimoto) — e deixaria entrar três
     * porcarias de um mangaká que só tem uma obra boa. Número mágico erra nos dois
     * sentidos.
     *
     * As regras moram em lib/anilist.ts: papel (Story & Art, nunca Original Creator),
     * formato (só MANGA) e título (fora databook, artbook, omake, guia). O que a regra
     * não pegar, a TORNEIRA pega.
     */
    achadas = await seriesDeQualquerGrafia(nomes);
  } catch (e) {
    // A AniList recusou. Isso NÃO é "o mangaká não existe" — e imprimir "nada" aqui
    // seria a quinta vez, nesta semana, que um erro de rede vira um veredito sobre o
    // acervo. Ver o cabeçalho de lib/anilist.ts.
    console.log(`  ! ${m.padEnd(22)} A ANILIST NÃO RESPONDEU (não é ausência)`);
    recusados.push(m);
    await espera(20_000);
    continue;
  }

  if (achadas.length === 0) {
    console.log(`  ✗ ${m.padEnd(22)} nada`);
  } else {
    let novas = 0;
    for (const s of achadas) {
      if (!porId.has(s.anilistId)) {
        porId.set(s.anilistId, s);
        novas++;
      }
    }
    console.log(`  ✓ ${m.padEnd(22)} ${achadas.length} série(s), ${novas} nova(s)`);
  }
  // A AniList é mantida por doação, e limita a 90 por minuto. Não se espreme um bem comum.
  await espera(1500);
}

/* ─────────────────────────────────────────────────────────────────────
 *  QUEM ESCREVEU E QUEM DESENHOU.
 *
 *  A busca por mangaká só sabe o papel DELE. "Sem autor" não era sem autor: era papel
 *  errado — o Obata é o ILUSTRADOR de Hikaru no Go, e a história é da Yumi Hotta.
 *
 *  Agora o staff COMPLETO manda. E uma série cujo autor não dá para determinar NÃO É
 *  GRAVADA: um livro sem autor hoje seria replantar o bug que este projeto passou o dia
 *  inteiro arrancando.
 * ───────────────────────────────────────────────────────────────────── */
console.log(`\n  Buscando quem escreveu e quem desenhou cada uma das ${porId.size} séries…\n`);

const autoria = await autoriaDasSeries([...porId.keys()]);

const boas: typeof todas = [];
const semAutorDeVerdade: string[] = [];
const todas = [...porId.values()];

for (const s of todas) {
  const a = autoria.get(s.anilistId);
  if (a) {
    s.autor = a.autor;
    s.ilustrador = a.ilustrador;
  }
  if (s.autor) boas.push(s);
  else semAutorDeVerdade.push(s.titulo);
}

const volumes = boas.reduce((n, s) => n + (s.volumes ?? 0), 0);

console.log(`\n  ─────────────────────────────────────────────────────────────`);
console.log(`  ${boas.length} séries · ${volumes} volumes`);
console.log(`  ${semAutorDeVerdade.length} recusadas: sem autor determinável (tarefa de bibliotecário)`);
console.log(`  ─────────────────────────────────────────────────────────────\n`);
console.log(`  A AMOSTRA — é isto que seria gravado:\n`);
console.log(
  `    ${"TÍTULO (tela)".padEnd(34)}${"VOL".padStart(3)}   ${"HISTÓRIA".padEnd(22)}ARTE`,
);
for (const s of boas) {
  const arte = s.ilustrador && s.ilustrador !== s.autor ? s.ilustrador : "(a mesma pessoa)";
  console.log(
    `    ${s.titulo.slice(0, 32).padEnd(34)}${String(s.volumes ?? "?").padStart(3)}   ` +
      `${(s.autor ?? "").slice(0, 20).padEnd(22)}${arte.slice(0, 22)}`,
  );
}

if (semAutorDeVerdade.length > 0) {
  console.log(`\n  RECUSADAS (sem autor determinável — NÃO entram no acervo):\n`);
  for (const t of semAutorDeVerdade.slice(0, 15)) console.log(`    ✗ ${t}`);
}
if (recusados.length > 0) {
  console.log(
    `\n  ⚠ A AniList recusou ${recusados.length} mangaká(s): ${recusados.join(", ")}.\n` +
      "    Isso NÃO é ausência. Rode de novo, mais devagar.\n",
  );
}

if (!EXECUTAR) {
  console.log(`\n  NADA FOI GRAVADO. Isto foi a amostra.`);
  console.log(`  Para gravar:  node --experimental-strip-types seed/manga.ts --executar\n`);
  process.exit(0);
}

/* ═════════════════════════════════════════════════════════════════════
 *  GRAVAR. Uma linha de série, e uma OBRA por volume.
 *
 *  Cada volume é um LIVRO — nota, resenha, estante e leitura moram nele, como em
 *  qualquer livro. A série é uma COLEÇÃO: uma prateleira que mostra quais volumes
 *  existem, quais você tem, e quais faltam. Ver ai/DECISIONS.md.
 *
 *  E o volume NÃO ganha edição nem capa própria: a AniList não sabe a capa do volume 12,
 *  nem o ISBN dele. Fingir que sabe criaria 42 fichas vazias por série — o entulho que a
 *  poda acabou de tirar do acervo. O volume é um NÚMERO pendurado numa série, e a capa
 *  que ele mostra é a da coleção, até alguém trazer a de verdade.
 * ═════════════════════════════════════════════════════════════════════ */

const { Pool } = await import("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** O autor, pelo portão de lib/autores.ts, e chaveado pelo NOME (que é unique). */
async function autorId(nome: string | null): Promise<string | null> {
  const limpo = limparNomeDeAutor(nome);
  if (!limpo) return null;

  const slug = limpo
    .normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "autor";

  // O slug é `citext`, e um `$2` cru dentro de um `case` confunde a dedução de tipo do
  // Postgres ("inconsistent types deduced for parameter"). Calcular aqui é mais claro
  // que ensinar o banco a adivinhar.
  const { rows: ocupado } = await pool.query<{ n: number }>(
    `select count(*)::int as n from authors where slug = $1::citext`,
    [slug],
  );
  const livre = ocupado[0]!.n > 0 ? `${slug}-${Math.abs(hash(limpo)) % 9999}` : slug;

  const { rows } = await pool.query<{ id: string }>(
    `insert into authors (name, slug)
     values ($1, $2::citext)
     on conflict (name) do update set name = excluded.name
     returning id`,
    [limpo, livre],
  );
  return rows[0]?.id ?? null;
}

/** Um sufixo estável para desempatar slug. Não precisa ser criptográfico: precisa ser o mesmo em toda rodada. */
function hash(texto: string): number {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
}

let gravadas = 0;
let volumesGravados = 0;

for (const s of boas) {
  const aId = await autorId(s.autor);
  if (!aId) continue; // já garantido acima, mas o portão manda mais que a intenção

  const iId = s.ilustrador ? await autorId(s.ilustrador) : null;

  const slugSerie = s.titulo
    .normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "serie";

  const { rows: usado } = await pool.query<{ n: number }>(
    `select count(*)::int as n from series where slug = $1::citext and anilist_id is distinct from $2`,
    [slugSerie, s.anilistId],
  );
  const slugLivre = usado[0]!.n > 0 ? `${slugSerie}-${s.anilistId}` : slugSerie;

  const { rows } = await pool.query<{ id: string }>(
    `insert into series (title, slug, kind, status, anilist_id, total_volumes,
                         cover_url, author_id, illustrator_id, first_published, alt_titles)
     values ($1, $2::citext, 'manga', $3, $4, $5, $6, $7, $8, $9, $10::text[])
     on conflict (anilist_id) do update
       set title = excluded.title, status = excluded.status,
           total_volumes = excluded.total_volumes, cover_url = excluded.cover_url,
           author_id = excluded.author_id, illustrator_id = excluded.illustrator_id,
           alt_titles = excluded.alt_titles
     returning id`,
    [s.titulo, slugLivre, s.status, s.anilistId, s.volumes, s.capa, aId, iId, s.ano, s.sinonimos],
  );

  const serieId = rows[0]!.id;
  gravadas++;

  /**
   * Os volumes. Série em publicação (volumes null) entra com UM volume: o acervo não
   * inventa um total que a fonte não sabe. Quando o leitor tiver o volume 43 de One
   * Piece, ele cadastra — e a torneira avisa que faltava.
   */
  const total = s.volumes ?? 1;

  for (let v = 1; v <= total; v++) {
    const titulo = total > 1 ? `${s.titulo}, vol. ${v}` : s.titulo;
    const slugVol = `${slugSerie}${total > 1 ? `-vol-${v}` : ""}`.slice(0, 80);

    const { rows: colide } = await pool.query<{ n: number }>(
      `select count(*)::int as n from works where slug = $1::citext`,
      [slugVol],
    );
    const slugFinal = colide[0]!.n > 0 ? `${slugVol}-${s.anilistId}` : slugVol;

    const r = await pool.query(
      `insert into works (slug, title, author_id, series_id, volume,
                          first_published, needs_review, author_source)
       values ($1::citext, $2, $3, $4, $5, $6, true, 'work')
       on conflict on constraint works_title_author_volume do nothing
       returning id`,
      [slugFinal, titulo, aId, serieId, v, s.ano],
    );
    volumesGravados += r.rowCount ?? 0;
  }

  if (gravadas % 25 === 0) {
    process.stdout.write(`\r  ${gravadas}/${boas.length} séries, ${volumesGravados} volumes`);
  }
}

console.log(`\n\n  ✓ ${gravadas} séries · ${volumesGravados} volumes gravados.\n`);
await pool.end();

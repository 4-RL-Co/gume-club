#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  CAPAS QUE FALTAM, EM MASSA.
 *
 *  O dump da Open Library traz milhares de edições sem capa. O dado é
 *  bom, só a foto falta, e a estante fica com lombada em branco.
 *
 *  A CADEIA, nesta ordem:
 *    1. a nossa base       (outra edição da mesma obra já tem capa)
 *    2. Open Library       por ISBN
 *    3. Google Books       por ISBN
 *    4. Google Books       por título + autor
 *    5. capa tipográfica   (não é derrota: é o desenho)
 *
 *    pnpm covers                 os livros que estão em alguma estante
 *    pnpm covers --canone        os 300 autores curados (ver seed/canone.ts)
 *    pnpm covers --tudo          o catálogo inteiro (leva horas)
 *    pnpm covers --limite 500    para experimentar
 *
 *  ═══ POR QUE EXISTE O --canone ═══
 *
 *  Não dá para consertar 336 mil capas. Dá para consertar as dos 300
 *  autores que alguém escolheu, e são 3 mil — uma hora de API em vez de
 *  uma semana. E são justamente as que aparecem: um catálogo onde Machado,
 *  Tolkien e Clarice têm capa PARECE completo, mesmo que a cauda longa
 *  ainda esteja em branco. Um onde eles não têm parece quebrado, mesmo com
 *  meio milhão de fichas atrás.
 *
 *  REGRAS:
 *   - Guarda o ENDEREÇO da capa, nunca o arquivo. A capa mora na fonte;
 *     a gente guarda a referência. Baixar a imagem seria copiar o acervo
 *     de outra pessoa para dentro do nosso. Ver ai/DECISIONS.md.
 *   - Nunca guarda um endereço sem conferir que ele responde. Uma URL
 *     quebrada é pior que capa nenhuma: a tipográfica é bonita, o ícone
 *     de imagem quebrada não é, e ninguém descobre até abrir.
 *   - Devagar, e insistindo. A Open Library é um bem comum mantido por
 *     doação. E o Google Books responde 503 em boa parte das chamadas,
 *     de forma intermitente: quem desiste na primeira conclui que não
 *     tem capa quando tem.
 *   - Retomável: rodar de novo não refaz o que já foi feito.
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

/** O .env, lido à mão: este script roda fora do Next, que carregaria sozinho. */
const env = readFileSync(".env", "utf8");
const doEnv = (chave) => env.match(new RegExp(`^${chave}=(.*)$`, "m"))?.[1]?.trim();

const url = process.env.DATABASE_URL ?? doEnv("DATABASE_URL");
if (!url) throw new Error("DATABASE_URL não encontrado");

/**
 * Sem chave, o Google responde 429 na primeira chamada: a cota anônima é
 * praticamente zero. Foi por isso que este fallback passou meses parecendo
 * "esse livro não tem capa em lugar nenhum".
 */
const GOOGLE = process.env.GOOGLE_BOOKS_API_KEY ?? doEnv("GOOGLE_BOOKS_API_KEY");
if (!GOOGLE) {
  console.error("✗ GOOGLE_BOOKS_API_KEY está vazia. Sem ela, só a Open Library responde.");
}

const sql = postgres(url);

const TUDO = process.argv.includes("--tudo");
const CANONE = process.argv.includes("--canone");
const limIdx = process.argv.indexOf("--limite");
const LIMITE =
  limIdx > -1 ? Number(process.argv[limIdx + 1]) : TUDO || CANONE ? 1_000_000 : 5_000;

/**
 * Os autores do cânone, como o CATÁLOGO os conhece.
 *
 * Não são os 300 nomes: são os ids das linhas de `authors` que casaram com eles em
 * seed/cobertura.ts — e são mais de 300, porque o dump guarda o mesmo autor várias
 * vezes ("Machado de Assis", "Machado Assis", "J. Machado de Assis"). Casar de novo
 * aqui seria refazer, com pressa, o trabalho que aquele arquivo faz com cuidado.
 */
function autoresDoCanone() {
  let medicao;
  try {
    medicao = JSON.parse(readFileSync("docs/cobertura.json", "utf8"));
  } catch {
    console.error(
      "✗ docs/cobertura.json não existe. Ele é a medição de quem, dos 300, existe no\n" +
        "  catálogo. Rode primeiro:  node --experimental-strip-types seed/cobertura.ts",
    );
    process.exit(1);
  }

  const ids = new Set();
  for (const linha of medicao) for (const c of linha.casamentos) ids.add(c.autorId);
  return [...ids];
}

const PAUSA_MS = 200;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────── as fontes

/**
 * A Open Library responde 302 para o archive.org quando TEM a capa. Quando não
 * tem, responde 200 com uma imagem de UM PIXEL (43 bytes), e não um 404: quem
 * não conferir o tamanho guarda um pixel transparente como se fosse capa, e a
 * estante enche de retângulos vazios que ninguém sabe explicar.
 */
async function naOpenLibrary(isbn) {
  const endereco = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  try {
    // COM PRAZO. Um fetch sem timeout é um fetch que pendura o processo para
    // sempre quando o socket morre calado — e um backfill de três mil livros que
    // trava no de número 80 é um backfill que ninguém percebe que travou.
    // O timeout LANÇA, e não devolve status. Sem o try, um socket morto no livro de
    // número 80 derruba um backfill de três mil. Ver AGENTS.md.
    let res;
    try {
      res = await fetch(endereco, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      return null; // não deu para perguntar. NÃO é "este livro não tem capa".
    }

    if (res.status === 301 || res.status === 302) return endereco;
    if (res.status === 200) {
      return Number(res.headers.get("content-length") ?? "0") > 1000 ? endereco : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Insiste em 429 e 503, que no Google Books são a resposta mais comum.
 *
 * E devolve TRÊS estados, não dois: achou, não tem, e NÃO DEU (o Google recusou
 * até o fim). Confundir "não tem capa" com "não consegui perguntar" é como um
 * script mente sem querer: ele marca o livro como sem capa, ninguém tenta de
 * novo, e a lombada fica branca para sempre por causa de um 503 de uma tarde.
 */
/**
 * ═══ A COTA DO DIA É UM MURO, E NÃO UM ENGARRAFAMENTO ═══
 *
 * O Google Books dá MIL consultas por dia no plano gratuito. Quando elas acabam, ele
 * responde 429 com "Quota exceeded ... Queries per day", e responde isso para todo
 * mundo até a meia-noite do Pacífico. Não adianta recuar e insistir.
 *
 * E insistir CUSTA: cada tentativa gasta uma consulta da cota do dia seguinte. A
 * primeira versão deste script tratava 429 e 503 como a mesma coisa e tentava cinco
 * vezes — ou seja, ela queimava a cota cinco vezes mais rápido para não conseguir
 * nada, e depois passava horas percorrendo três mil livros fingindo que tentava.
 *
 * 503 é engarrafamento: espera e passa. 429-de-cota é muro: pare hoje, volte amanhã.
 * Confundir os dois é a diferença entre um script lento e um script que mente.
 */
let cotaAcabou = false;

async function googleJson(q, tentativas = 5) {
  if (cotaAcabou) return { estado: "sem_cota" };

  for (let i = 0; i < tentativas; i++) {
    try {
      // A chave vai no CABEÇALHO, e não na URL: na URL ela é copiada para logs,
      // para o histórico do shell e para o cache de fetch. Segredo copiado para
      // um lugar onde ninguém espera achá-lo é segredo que um dia sai num backup.
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}` +
          `&maxResults=3&printType=books`,
        { headers: { "X-Goog-Api-Key": GOOGLE }, signal: AbortSignal.timeout(10_000) },
      );

      if (res.status === 429) {
        const corpo = await res.text();
        if (/quota/i.test(corpo)) {
          cotaAcabou = true;
          return { estado: "sem_cota" };
        }
        await espera(700 * 2 ** i);
        continue;
      }

      if (res.status === 503) {
        await espera(700 * 2 ** i);
        continue;
      }

      if (!res.ok) return { estado: "nao_tem" };
      return { estado: "ok", json: await res.json() };
    } catch {
      return { estado: "nao_deu" };
    }
  }
  return { estado: "nao_deu" };
}

function capaDo(json) {
  for (const item of json?.items ?? []) {
    const capa = item.volumeInfo?.imageLinks?.thumbnail;
    if (capa) return capa.replace(/^http:/, "https:").replace(/&edge=curl/, "");
  }
  return null;
}

async function noGoogle(isbn, titulo, autor) {
  if (!GOOGLE || cotaAcabou) return { capa: null, naoDeu: false };

  let naoDeu = false;

  if (isbn) {
    const r = await googleJson(`isbn:${isbn}`);
    if (r.estado === "sem_cota") return { capa: null, naoDeu: false };
    if (r.estado === "ok") {
      const capa = capaDo(r.json);
      if (capa) return { capa, naoDeu: false };
    } else if (r.estado === "nao_deu") {
      naoDeu = true;
    }
    await espera(PAUSA_MS);
  }

  const t = (titulo ?? "").trim().slice(0, 80);
  if (!t) return { capa: null, naoDeu };

  const q = autor ? `intitle:"${t}" inauthor:"${autor.trim().slice(0, 50)}"` : `intitle:"${t}"`;
  const r = await googleJson(q);

  if (r.estado === "sem_cota") return { capa: null, naoDeu: false };
  if (r.estado === "ok") return { capa: capaDo(r.json), naoDeu: false };
  return { capa: null, naoDeu: naoDeu || r.estado === "nao_deu" };
}

// ─────────────────────────────────────────────────────────────── o alvo

/**
 * Só edições sem capa cuja OBRA também não tem capa em nenhuma outra edição: se
 * outra edição já tem, a estante empresta aquela (ver lib/shelf.ts) e não há nada
 * a fazer aqui. Esse é o passo 1 da cadeia, e ele não custa uma requisição.
 */
const alvo = CANONE
  ? sql`
      select distinct on (w.id) e.id, e.isbn13 as isbn, w.title, a.name as author
        from editions e
        join works w on w.id = e.work_id
        left join authors a on a.id = w.author_id
       where e.cover_url is null
         and w.author_id = any(${autoresDoCanone()}::uuid[])
         and not exists (
           select 1 from editions e2 where e2.work_id = w.id and e2.cover_url is not null)
       order by w.id, (e.isbn13 is null)
       limit ${LIMITE}`
  : TUDO
  ? sql`
      select distinct on (w.id) e.id, e.isbn13 as isbn, w.title, a.name as author
        from editions e
        join works w on w.id = e.work_id
        left join authors a on a.id = w.author_id
       where e.cover_url is null
         and not exists (
           select 1 from editions e2 where e2.work_id = w.id and e2.cover_url is not null)
       order by w.id, (e.isbn13 is null)
       limit ${LIMITE}`
  : sql`
      select distinct on (w.id) e.id, e.isbn13 as isbn, w.title, a.name as author
        from editions e
        join works w on w.id = e.work_id
        join library_entries le on le.work_id = w.id
        left join authors a on a.id = w.author_id
       where e.cover_url is null
         and not exists (
           select 1 from editions e2 where e2.work_id = w.id and e2.cover_url is not null)
       order by w.id, (e.isbn13 is null)
       limit ${LIMITE}`;

const edicoes = await alvo;

console.log(
  CANONE
    ? `Cânone: ${edicoes.length} obras dos 300 autores, sem capa em nenhuma edição.`
    : TUDO
      ? `Catálogo: ${edicoes.length} obras sem capa em nenhuma edição.`
      : `Nas estantes: ${edicoes.length} obras sem capa em nenhuma edição.`,
);

let deOL = 0;
let deGoogle = 0;
let semCapa = 0;
let naoDeu = 0;
let feitos = 0;

/**
 * QUATRO DE CADA VEZ, e não um.
 *
 * Um livro por vez, em série, dava QUATRO POR MINUTO — e o catálogo do cânone são
 * três mil. Treze horas. O gargalo não é o nosso banco nem a nossa CPU: é a espera
 * pelo 503 do Google, que devolve erro em boa parte das chamadas e obriga a recuar e
 * insistir. Enquanto um livro espera três segundos por um 503, o processo inteiro
 * fica parado olhando.
 *
 * Quatro trabalham em paralelo, cada um com a sua pausa. Dá cerca de duas requisições
 * por segundo somadas — o suficiente para acabar em três horas, e pouco o bastante
 * para não maltratar dois serviços gratuitos. A Open Library é um bem comum mantido
 * por doação, e não um recurso a ser espremido.
 *
 * Mais que isso não vale: o 429 chega, todo mundo recua junto, e o paralelismo vira
 * uma fila mais lenta que a original.
 */
const TRABALHADORES = 4;

async function trabalhar(fila) {
  for (;;) {
    // O MURO. Sem cota, os três mil livros que faltam não vão virar capa hoje — e
    // percorrê-los mesmo assim só serviria para o script parecer que trabalhou.
    if (cotaAcabou) return;

    const e = fila.shift();
    if (!e) return;

    let endereco = e.isbn ? await naOpenLibrary(e.isbn) : null;
    if (endereco) deOL++;

    if (!endereco) {
      const r = await noGoogle(e.isbn, e.title, e.author);
      endereco = r.capa;
      if (endereco) deGoogle++;
      else if (r.naoDeu) naoDeu++;
    }

    if (endereco) {
      // O ENDEREÇO, e não o arquivo. Capa por referência, nunca por cópia.
      await sql`update editions set cover_url = ${endereco} where id = ${e.id}::uuid`;
    } else {
      semCapa++;
    }

    feitos++;
    if (feitos % 40 === 0 || feitos === edicoes.length) {
      console.log(
        `  ${feitos}/${edicoes.length}  ${deOL} Open Library, ${deGoogle} Google, ${semCapa} sem capa`,
      );
    }

    await espera(PAUSA_MS);
  }
}

const fila = [...edicoes];
await Promise.all(Array.from({ length: TRABALHADORES }, () => trabalhar(fila)));

console.log(`\n✓ ${deOL + deGoogle} capas novas (${deOL} Open Library, ${deGoogle} Google Books).`);
if (semCapa > 0) {
  console.log(`  ${semCapa - naoDeu} não têm capa em fonte nenhuma: aí vale a tipográfica, ou a sua, à mão.`);
}
if (naoDeu > 0) {
  console.log(`  ${naoDeu} o Google recusou até o fim (503). NÃO é "sem capa": rode de novo mais tarde.`);
}

if (cotaAcabou) {
  const faltam = edicoes.length - feitos;
  console.log(
    `\n  ✗ A COTA DO DIA ACABOU. O Google Books dá MIL consultas por dia no plano\n` +
      `    gratuito, e elas acabaram. Faltaram ${faltam} livros, e eles NÃO estão sem\n` +
      `    capa: eles estão sem resposta.\n\n` +
      `    A cota reseta à meia-noite do Pacífico (5h da manhã no horário de Brasília).\n` +
      `    Depois disso:  pnpm covers:canone   — ele retoma de onde parou.\n\n` +
      `    Para não depender disso, dá para pedir aumento de cota (de graça) no console\n` +
      `    do Google Cloud, em APIs e serviços → Books API → Cotas.\n`,
  );
}

await sql.end();

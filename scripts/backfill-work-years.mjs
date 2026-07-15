#!/usr/bin/env node
/**
 * O ANO DA OBRA, preenchido a partir da Open Library.
 *
 *   node scripts/backfill-work-years.mjs           # só as obras que estão em alguma estante
 *   node scripts/backfill-work-years.mjs --tudo    # o catálogo inteiro (lento: 373 mil obras)
 *
 * ────────────────────────────────────────────────────────────────────────
 * POR QUE ISTO EXISTE
 *
 * `works.first_published` é o ano em que a OBRA foi escrita, e ele está nulo em
 * praticamente todo o catálogo. O import trouxe o ano DA EDIÇÃO
 * (`editions.published_year`, quando aquela impressão saiu) e nunca o ano da obra:
 * são fatos diferentes, e o schema os separa de propósito.
 *
 * A página /estatisticas inteira gira em torno desse ano: a distância entre quando
 * a obra nasceu e hoje é o retrato do gosto do leitor. Sem ele, a tela fica muda.
 *
 * POR QUE SÓ AS OBRAS DAS ESTANTES, POR PADRÃO
 *
 * Porque é onde o dado é lido. São dezenas de obras, e não 373 mil: roda em
 * segundos, e a Open Library não leva um dilúvio de requisições por um dado que
 * ninguém vai olhar. O catálogo inteiro fica para o dia em que alguém quiser, e
 * aí o `--tudo` está aqui.
 *
 * POR QUE NÃO USAR min(editions.published_year) COMO ATALHO
 *
 * Seria de graça e sem rede: a edição mais antiga que a gente conhece de Dom
 * Casmurro é de 1899, que é o ano certo. Mas para um livro cuja ÚNICA edição no
 * catálogo é a reimpressão de 2016, o atalho grava "escrito em 2016", e isso é
 * uma MENTIRA no catálogo compartilhado, que é de todo mundo e onde o erro fica.
 * Chutar um fato é pior do que não ter o fato: um campo nulo a próxima pessoa
 * preenche, e um campo errado ninguém percebe. Ver docs/schema.md.
 * ────────────────────────────────────────────────────────────────────────
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const TUDO = process.argv.includes("--tudo");

const url = process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1];
if (!url) throw new Error("DATABASE_URL não encontrado");
const sql = postgres(url);

/** A OL responde bem, e a gente não abusa: uma requisição por vez, com respiro. */
const PAUSA_MS = 120;
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

/** Um ano de obra que faz sentido. 2427 anos atrás é Sun Tzu; 2300 d.C. é lixo. */
function anoValido(n) {
  return Number.isInteger(n) && n >= -3000 && n <= new Date().getFullYear();
}

/**
 * O ano da obra, na Open Library.
 *
 * Primeiro pela chave da obra (exata: é a mesma obra, sem dúvida). Depois pelo
 * ISBN de uma edição nossa (exato também). Nunca por título, e essa recusa é o
 * ponto: casar "A metamorfose" por título traz a adaptação, o estudo crítico e o
 * guia de leitura, e gravaria o ano DELES na obra do Kafka.
 */
async function anoDaObra({ ol_key, isbn }) {
  if (ol_key) {
    const r = await pegar(`https://openlibrary.org${ol_key}.json`);
    // "first_publish_date" vem como "1899", "May 1899", "1899-05-01"
    const bruto = r?.first_publish_date ?? null;
    const ano = Number(String(bruto ?? "").match(/(-?\d{1,4})/)?.[1]);
    if (anoValido(ano)) return ano;
  }

  if (isbn) {
    const r = await pegar(
      `https://openlibrary.org/search.json?isbn=${isbn}&limit=1&fields=first_publish_year`,
    );
    /**
     * `docs[0]` aqui é legítimo, e a razão é o `limit=1` da URL acima: a lista tem UM
     * item, e a posição não escolhe nada. Não é uma lista com PAPÉIS — é uma resposta
     * única. Ver AGENTS.md.
     */
    const ano = r?.docs?.[0]?.first_publish_year;
    if (anoValido(ano)) return ano;
  }

  return null;
}

async function pegar(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Gume (gume.club)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // fonte fora do ar não derruba o backfill: a obra fica para a próxima rodada
  }
}

const obras = await sql`
  select w.id, w.title, w.openlibrary_key as ol_key,
         (select e.isbn13 from editions e
           where e.work_id = w.id and e.isbn13 is not null
           order by e.created_at limit 1) as isbn
    from works w
   where w.first_published is null
     ${TUDO ? sql`` : sql`and exists (select 1 from library_entries le where le.work_id = w.id)`}
   order by w.created_at`;

console.log(
  `→ ${obras.length} obras sem o ano${TUDO ? " (catálogo inteiro)" : " nas estantes"}`,
);

let achou = 0;
for (const obra of obras) {
  const ano = await anoDaObra(obra);

  if (ano !== null) {
    await sql`update works set first_published = ${ano} where id = ${obra.id}`;
    achou++;
    process.stdout.write(".");
  } else {
    // Sem chute. Fica nulo, e "o que falta" continua sabendo que falta.
    process.stdout.write("·");
  }

  await pausa(PAUSA_MS);
}

console.log(`\n✓ ${achou} obras ganharam o ano. ${obras.length - achou} continuam sem.`);
console.log("  As que continuam sem: a Open Library não sabe, e a gente não chuta.");
await sql.end();

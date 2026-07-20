import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Server only. If this module is ever imported from a "use client" file,
 * the build must fail: see scripts/audit-security.mjs.
 *
 * The client is cached on globalThis, and that is not a micro-optimisation.
 * Next's dev server re-evaluates this module on every hot reload, so a plain
 * `postgres(url)` opens a fresh pool each time and never closes the old one.
 * After an afternoon of edits Postgres hits max_connections and every page
 * starts answering "sorry, too many clients already", including psql. It looks
 * like the database died; it was us, leaking a pool per keystroke.
 *
 * In production the module is evaluated once and the cache is simply a no-op.
 */
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const globalForDb = globalThis as unknown as {
  __gumeSql?: ReturnType<typeof postgres>;
};

/**
 * O limiar do trigrama, fixado NA CONEXÃO, uma vez, para todas.
 *
 * O padrão do Postgres é 0.3, e com 0.3 o índice de trigrama devolve 27 mil
 * candidatos para "machado" e descarta quase todos na recheca. Com 0.45 a mesma
 * busca custa um quarto do tempo e traz os mesmos livros no topo.
 *
 * Ele é um ajuste POR CONEXÃO, e é aí que mora a armadilha: rodar `set_limit()`
 * solto, antes da consulta, com um pool de dez conexões, é sorteio. A consulta
 * cai numa conexão que não recebeu o ajuste e volta com outro resultado. Deu para
 * ver na medição: a MESMA busca devolvia 20 livros numa chamada e 14 na seguinte.
 *
 * Envolver as duas instruções numa transação resolve, e cobra o preço de um BEGIN
 * e um COMMIT em toda tecla digitada. Aqui o ajuste viaja no handshake da conexão,
 * então TODA conexão do pool já nasce com ele, e a busca não paga nada.
 */
const client =
  globalForDb.__gumeSql ??
  postgres(url, {
    max: 10,
    connection: {
      options: [
        // o limiar da OBRA: 0.45 (ver acima)
        "-c pg_trgm.similarity_threshold=0.45",
        /**
         * E o limiar do AUTOR, que é outra métrica: `word_similarity` compara a
         * busca com a MELHOR PALAVRA do nome, e não com o nome inteiro. Quase
         * ninguém digita "Franz Kafka": as pessoas digitam "kafka". Contra o nome
         * inteiro isso dá 0.50 e some; contra a melhor palavra, dá 1.00.
         */
        "-c pg_trgm.word_similarity_threshold=0.55",
      ].join(" "),
    },
  });
if (process.env.NODE_ENV !== "production") globalForDb.__gumeSql = client;

export const db = drizzle(client, { schema });

/**
 * O cliente bruto do postgres.js. Quase ninguém precisa dele: a porta normal é `db`,
 * o drizzle. Ele existe para o UM caso que o drizzle não faz bem: transmitir uma tabela
 * inteira por CURSOR, sem carregá-la na memória de uma vez. É o que o backup do banco usa
 * (lib/backup.ts): a tabela de edições tem centenas de milhares de linhas, e um `json_agg`
 * dela num tiro só derruba a conexão. Não use para consulta comum.
 */
export const sqlBruto = client;

import { sql } from "drizzle-orm";
import { db, sqlBruto } from "@/lib/db";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O BACKUP COMPLETO DO BANCO. TUDO, e por isso a porta mais estreita.
 *
 *  Isto devolve o banco INTEIRO: toda linha de toda tabela, inclusive o
 *  e-mail de todo mundo e as estantes privadas. É o oposto do export de
 *  métricas (sem e-mail, pode ir por token). Um backup sem os dados pessoais
 *  não é backup, então ele os leva, e por isso é gated na SESSÃO do
 *  idealizador, NUNCA num token estático. Ver a rota.
 *
 *  ═══ POR STREAMING, E NÃO NA MEMÓRIA ═══
 *
 *  A tabela de edições tem centenas de milhares de linhas. Um `json_agg` dela
 *  num tiro só monta um array gigante na memória e DERRUBA a conexão (aconteceu).
 *  Então o dump sai por CURSOR: o Postgres manda de 500 em 500, cada linha vira
 *  uma linha de texto (NDJSON), e a memória fica baixa não importa o tamanho do
 *  banco. É a diferença entre um backup que funciona com um banco grande e um que
 *  só funcionava enquanto o banco era pequeno.
 * ════════════════════════════════════════════════════════════════════
 */

/** As tabelas base do schema público, lidas do próprio catálogo do Postgres. */
export async function tabelasDoBanco(): Promise<string[]> {
  const rows = await db.execute<{ table_name: string }>(sql`
    select table_name
      from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE'
     order by table_name
  `);
  return rows.map((r) => r.table_name);
}

/**
 * O banco inteiro em NDJSON, por streaming. Cada tabela abre com uma linha marcadora
 * `{"__tabela__":"nome"}` e depois cada linha da tabela vira uma linha de JSON.
 *
 * `sqlBruto(nome)` cita o identificador com segurança (API do postgres.js), e os nomes
 * vêm do catálogo do Postgres, nunca do usuário: não há injeção a temer.
 */
export async function* backupComoNdjson(): AsyncGenerator<string> {
  const nomes = await tabelasDoBanco();
  for (const nome of nomes) {
    yield JSON.stringify({ __tabela__: nome }) + "\n";
    for await (const lote of sqlBruto`select * from ${sqlBruto(nome)}`.cursor(500)) {
      for (const linha of lote) yield JSON.stringify(linha) + "\n";
    }
  }
}

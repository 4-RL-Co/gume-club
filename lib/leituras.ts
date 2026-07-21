import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertAuthenticated, assertOwner, Forbidden, visibleTo, type Viewer } from "@/lib/authz";
import { libraryEntries } from "@/lib/db/schema";
import { validarLeitura } from "@/lib/datas";

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS LEITURAS DE UM LIVRO. Com datas que dá para CORRIGIR.
 *
 *  Até aqui não existia nenhuma forma de mudar a data de uma leitura já
 *  registrada. Nenhuma. O app carimbava `new Date()` e pronto: se a data
 *  estava errada, ela ia ficar errada para sempre, e a única saída era apagar
 *  o livro da estante e pôr de novo (perdendo a nota e a resenha junto).
 *
 *  Isso trava a coisa mais banal do mundo: "ah, na verdade eu terminei esse em
 *  março". E trava o conserto dos registros errados que já existem.
 *
 *  ═══ CADA LEITURA TEM AS SUAS PRÓPRIAS DATAS ═══
 *
 *  Releitura é de primeira classe aqui (ver ai/DECISIONS.md): ler O Hobbit em
 *  2009 e de novo em 2024 são DUAS leituras, cada uma com o seu começo e o seu
 *  fim. Editar uma não toca na outra. Uma tabela que só guardasse "a última vez
 *  que você leu" apagaria a sua história, e a história é o produto.
 * ════════════════════════════════════════════════════════════════════
 */

export type Leitura = {
  id: string;
  comecou: string | null;
  terminou: string | null;
  abandonou: string | null;
};

/**
 * As leituras de uma pessoa num livro.
 *
 * Filtra `visibility` NO SQL, como toda leitura de dado de outra pessoa neste projeto
 * (ver SECURITY.md): uma leitura privada não é um resultado escondido, ela não é um
 * resultado. Quem olha o próprio livro vê as próprias leituras sempre.
 */
export async function getLeituras(
  viewer: Viewer,
  donoId: string,
  workId: string,
): Promise<Leitura[]> {
  const rows = await db.execute<{
    id: string; started_on: string | null; finished_on: string | null; abandoned_on: string | null;
  }>(sql`
    -- O FORMATO DIZ A PRECISÃO, aqui e na volta. Quem marcou só o ano recebe "2019", e
    -- não "2019-01-01": aquele 1º de janeiro é um lugar de pousar, não uma afirmação, e
    -- mostrá-lo ao leitor seria o app inventando um dia que ele nunca disse. A tela lê o
    -- formato para decidir como desenhar o campo, e devolve no mesmo formato, então a
    -- precisão volta inteira sem nada além da data precisar viajar. Ver lib/datas.ts.
    select r.id,
           case when r.started_precision = 'year' then to_char(r.started_on, 'YYYY')
                else to_char(r.started_on, 'YYYY-MM-DD') end as started_on,
           case when r.ended_precision = 'year' then to_char(r.finished_on, 'YYYY')
                else to_char(r.finished_on, 'YYYY-MM-DD') end as finished_on,
           case when r.ended_precision = 'year' then to_char(r.abandoned_on, 'YYYY')
                else to_char(r.abandoned_on, 'YYYY-MM-DD') end as abandoned_on
      from readings r
      -- SEM APELIDO na library_entries, e isso não é estilo: visibleTo() monta o
      -- filtro a partir das COLUNAS do Drizzle, e elas se escrevem com o nome real da
      -- tabela ("library_entries"."user_id"). Com um apelido (join ... le), esse nome
      -- deixa de existir para o Postgres, e a consulta inteira quebra.
      --
      -- Quebrar alto é a sorte aqui. O irmão SILENCIOSO desse erro já mordeu este
      -- projeto: numa consulta sem join, o Drizzle escreve a coluna sem qualificar, a
      -- comparação vira sempre-verdadeira, e o filtro de visibilidade some sem um
      -- único erro no terminal.
      join library_entries on library_entries.id = r.entry_id
     where library_entries.user_id = ${donoId}::uuid
       and library_entries.work_id = ${workId}::uuid
       and ${visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility)}
     order by coalesce(r.finished_on, r.abandoned_on, r.started_on) asc nulls last,
              r.created_at asc`);

  return rows.map((r) => ({
    id: r.id,
    comecou: r.started_on,
    terminou: r.finished_on,
    abandonou: r.abandoned_on,
  }));
}

/**
 * O DONO da leitura, conferido ANTES de mutar. Nunca depois, e nunca na tela.
 *
 * `readings` não tem `user_id`: ela pendura em `library_entries`, e é lá que mora o
 * dono. Sem este salto, qualquer pessoa com o id de uma leitura poderia reescrever a
 * história de leitura de outra — e a tela nem piscaria.
 */
async function assertDonoDaLeitura(viewer: Viewer, readingId: string): Promise<{ id: string }> {
  assertAuthenticated(viewer);

  const [dono] = await db.execute<{ user_id: string }>(sql`
    select le.user_id
      from readings r
      join library_entries le on le.id = r.entry_id
     where r.id = ${readingId}::uuid`);

  if (!dono) throw new Forbidden("essa leitura não existe");

  // A comparação de dono é UMA função, e ela mora em lib/authz.ts. Escrever
  // `dono.user_id !== viewer.id` aqui funcionaria igual — e seria a nona cópia da mesma
  // regra espalhada pelo código, cada uma capaz de apodrecer sozinha. O `pnpm
  // audit:security` quebra o build quando alguém tenta, e quebrou quando eu tentei.
  assertOwner(viewer, { userId: dono.user_id });

  return viewer;
}

/**
 * Mudar as datas de uma leitura já registrada.
 *
 * A validação (lib/datas.ts) recusa data no futuro, data anterior a 1900, dia que não
 * existe no calendário, fim antes do começo, e terminado E abandonado ao mesmo tempo.
 * Ela levanta: uma data errada não entra em silêncio para ser descoberta em dezembro,
 * quando a retrospectiva do ano ficar estranha e ninguém souber por quê.
 */
export async function editarLeitura(
  viewer: Viewer,
  readingId: string,
  datas: { comecou?: unknown; terminou?: unknown; abandonou?: unknown },
): Promise<void> {
  await assertDonoDaLeitura(viewer, readingId);

  const { comecou, terminou, abandonou, precisaoComeco, precisaoFim } = validarLeitura(datas);

  // A precisão viaja junto com a data, sempre: uma sem a outra é uma data que o app não
  // sabe mais como ler. Ver lib/datas.ts e a migration 0051.
  await db.execute(sql`
    update readings
       set started_on        = ${comecou}::date,
           finished_on       = ${terminou}::date,
           abandoned_on      = ${abandonou}::date,
           started_precision = ${precisaoComeco},
           ended_precision   = ${precisaoFim}
     where id = ${readingId}::uuid`);
}

/**
 * Apagar uma leitura.
 *
 * Existe porque o duplo clique de ontem virou uma leitura fantasma, e porque uma
 * releitura registrada por engano infla o ano de alguém. A linha da estante FICA: você
 * está apagando um capítulo da história, e não o livro.
 */
export async function apagarLeitura(viewer: Viewer, readingId: string): Promise<void> {
  await assertDonoDaLeitura(viewer, readingId);

  await db.execute(sql`delete from readings where id = ${readingId}::uuid`);
}

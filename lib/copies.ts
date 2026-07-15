import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ownedCopies } from "@/lib/db/schema";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O EXEMPLAR DE PAPEL. E ele NÃO está à venda, à troca, nem à disposição.
 *
 *  ═══ O QUE ESTE ARQUIVO ERA, E DEIXOU DE SER ═══
 *
 *  Ele guardava um pequeno mercado: doar, trocar, emprestar, com canal de contato e
 *  corrente de quem passou o livro para quem.
 *
 *  Saiu inteiro (migration 0046). O Gume é um registro de leitura, e aquilo o empurrava
 *  para ser um lugar de **transação entre pessoas** — com combinado, encontro e tudo o
 *  que vem junto quando estranhos precisam se acertar sobre um objeto. Isso traz um peso
 *  de moderação que nada no app estava pronto para carregar, e traz esse peso **mesmo
 *  quando dá certo**.
 *
 *  ═══ O QUE SOBROU, E POR QUE ELE VALE A PENA ═══
 *
 *  "Tenho este livro em papel, e ganhei da minha irmã em 2019."
 *
 *  Isso não é um anúncio: é a HISTÓRIA de um exemplar, e é uma das coisas mais bonitas
 *  que este app guarda. Ela nunca dependeu de o livro estar à disposição de ninguém.
 *
 *  Nada aqui é lido por outra pessoa. Não há visibilidade a filtrar porque não há nada
 *  que atravesse de uma estante para outra.
 * ════════════════════════════════════════════════════════════════════
 */

export type MinhaCopia = {
  state: string;
  acquiredNote: string | null;
  editionId: string | null;
};

/** O meu exemplar deste livro. Só o meu: não existe o exemplar de outra pessoa aqui. */
export async function getMinhaCopia(
  actor: { id: string } | null,
  workId: string,
): Promise<MinhaCopia | null> {
  if (!actor) return null;

  const [copia] = await db
    .select({
      state: ownedCopies.state,
      acquiredNote: ownedCopies.acquiredNote,
      editionId: ownedCopies.editionId,
    })
    .from(ownedCopies)
    .where(and(eq(ownedCopies.userId, actor.id), eq(ownedCopies.workId, workId)))
    .limit(1);

  return copia ?? null;
}

/**
 * "De onde veio esse livro?" — texto livre, e nunca uma lista.
 *
 * Ninguém ganhou um livro de "subscription_box": ganhou a caixa de janeiro do clube de
 * filosofia, ou a irmã deu. Nunca obrigatório, nunca cobrado.
 */
export async function guardarHistoria(
  actor: { id: string },
  workId: string,
  editionId: string | null,
  nota: string,
): Promise<void> {
  const limpo = nota.trim().slice(0, 140);

  await db.execute(sql`
    insert into owned_copies (user_id, work_id, edition_id, state, acquired_note)
    values (${actor.id}::uuid, ${workId}::uuid, ${editionId}::uuid, 'owned', ${limpo || null})
    on conflict (user_id, work_id)
      do update set acquired_note = excluded.acquired_note,
                    edition_id    = coalesce(excluded.edition_id, owned_copies.edition_id)`);
}

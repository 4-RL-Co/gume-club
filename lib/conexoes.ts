import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertOwner, type Viewer } from "@/lib/authz";

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS SUAS CONEXÕES. SÓ SUAS, E SEM NÚMERO.
 *
 *  ═══ POR QUE ISTO É PRIVADO ═══
 *
 *  A lista de quem alguém segue é um mapa social, e mapa social exposto é
 *  como se descobre quem conhece quem sem que nenhuma das duas pessoas
 *  tenha decidido contar. Seguir alguém é um gesto entre duas pessoas; a
 *  SOMA desses gestos é um retrato da vida de alguém, e esse retrato não
 *  é de ninguém publicar.
 *
 *  Então `/@fulano` não mostra quem o fulano segue nem quem o segue, e
 *  esta função recusa a lista de qualquer um que não seja quem pediu. A
 *  recusa é `assertOwner()`, a MESMA de toda mutação do app: a lista de
 *  conexões é tratada como uma linha que tem dono, porque é o que ela é.
 *
 *  ═══ POR QUE NÃO EXISTE CONTAGEM AQUI ═══
 *
 *  Estas funções devolvem PESSOAS, e nunca um total. Não é esquecimento e
 *  não é preguiça: "128 seguidores" é a linha que o README promete não
 *  cruzar, e ela não se cruza de uma vez. Ela se cruza no dia em que uma
 *  função devolve `{ pessoas, quantas }` porque uma tela achou o número
 *  conveniente, e no dia seguinte o número está do lado de um nome.
 *
 *  Se você precisa saber se a lista está vazia, olhe se ela está vazia.
 *  Não peça o tamanho dela, e não faça esta função devolver um.
 *
 *  O TETO existe para a página não crescer sem fim, e ele não é uma
 *  paginação com número de página (isso seria contar por outro caminho):
 *  é um teto, e a lista rola dentro dele.
 * ════════════════════════════════════════════════════════════════════
 */

export type Conexao = {
  handle: string;
  name: string | null;
  image: string | null;
};

/** O teto de uma lista. Alto o bastante para ninguém esbarrar nele tão cedo. */
const TETO = 500;

type Linha = { handle: string; name: string | null; image: string | null };

/**
 * Quem esta pessoa segue, e quem segue esta pessoa.
 *
 * `assertOwner()` PRIMEIRO, antes de qualquer consulta: uma leitura que recusa
 * depois de ler já leu. E o banido e o apagado somem das duas listas, pela mesma
 * razão que somem de todo o resto.
 */
export async function getConexoes(
  viewer: Viewer,
  donoId: string,
): Promise<{ seguindo: Conexao[]; seguidores: Conexao[] }> {
  assertOwner(viewer, { userId: donoId });

  const [seguindo, seguidores] = await Promise.all([
    db.execute<Linha>(sql`
      select u.handle, u.display_name as name, u.image
        from follows f
        join users u on u.id = f.followee_id
       where f.follower_id = ${donoId}::uuid
         and f.state = 'accepted'
         and u.deleted_at is null
         and u.banned_at is null
       order by coalesce(u.display_name, u.handle) asc
       limit ${TETO}`),

    db.execute<Linha>(sql`
      select u.handle, u.display_name as name, u.image
        from follows f
        join users u on u.id = f.follower_id
       where f.followee_id = ${donoId}::uuid
         and f.state = 'accepted'
         and u.deleted_at is null
         and u.banned_at is null
       order by coalesce(u.display_name, u.handle) asc
       limit ${TETO}`),
  ]);

  const limpar = (rows: Linha[]): Conexao[] =>
    rows.map((r) => ({ handle: r.handle, name: r.name, image: r.image }));

  return { seguindo: limpar(seguindo), seguidores: limpar(seguidores) };
}

/**
 * Quem entrou pelo seu link. Nomes, nunca um número.
 *
 * É a procedência da conexão: quem chegou porque VOCÊ chamou. E é tão privado quanto a
 * lista de conexões, pela mesma razão e pela mesma recusa: `assertOwner()` primeiro, e
 * só você vê a sua. A lista de quem alguém trouxe é um mapa social igual às outras duas.
 *
 * O que ela devolve NÃO É A INSÍGNIA e não é o placar dela. O Arauto é uma pergunta
 * binária respondida em lib/badges.ts (você trouxe leitores que ficaram, ou não), e ele
 * NÃO conta quantos: contar quantos é a linha que o README recusa. Esta função mostra os
 * ROSTOS de quem entrou, que é hospitalidade, e nunca o TOTAL, que seria um placar. Se um
 * dia ela devolver `{ pessoas, quantas }`, o número vai para o lado do nome, e acabou.
 *
 * Aparece mesmo quem ainda não pôs livro nenhum na estante: entrou pelo seu link é entrou
 * pelo seu link. A régua do Arauto (ficar, e ler) é outra pergunta, e ela mora em badges.
 */
export async function getConvidados(viewer: Viewer, donoId: string): Promise<Conexao[]> {
  assertOwner(viewer, { userId: donoId });

  const rows = await db.execute<Linha>(sql`
    select u.handle, u.display_name as name, u.image
      from users u
     where u.invited_by = ${donoId}::uuid
       and u.deleted_at is null
       and u.banned_at is null
     order by u.created_at asc
     limit ${TETO}`);

  return rows.map((r) => ({ handle: r.handle, name: r.name, image: r.image }));
}

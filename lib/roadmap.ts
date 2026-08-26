import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertAuthenticated, assertIdealizador, type Viewer } from "@/lib/authz";
import { FUSO } from "@/lib/datas";
import { LIMITS, clamp, clampRequired } from "@/lib/limits";
import {
  STATUS_ABERTOS, type RoadmapItem, type RoadmapStatus, type ChangelogItem,
} from "@/lib/roadmap-view";

export { STATUS_ABERTOS, STATUS_LABEL, type RoadmapItem, type RoadmapStatus, type ChangelogItem } from "@/lib/roadmap-view";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "O QUE VEM POR AÍ". Ver a migration 0067 pro porquê inteiro.
 *
 *  ═══ VOTOS INFORMAM. ELES NÃO DECIDEM (ai/PRD.md) ═══
 *
 *  A ORDEM de cada item dentro do status é `position`, escrita à mão pelo dono na aba
 *  de /painel — nunca por contagem de voto. `getRoadmapAberto()` mostra o número de
 *  votos ao lado de cada item (o sinal), mas o `order by` é sempre `position`. Um item
 *  não sobe sozinho na lista porque foi mais votado.
 *
 *  ═══ O ANO MORA NA CHAVE, E NÃO NUM JOB DE RESET ═══
 *
 *  Sem cron neste repo. O ano de "agora" é sempre calculado no FUSO de São Paulo
 *  (lib/datas.ts), a mesma régua de todo agrupamento por dia deste app — virar o ano
 *  às 21h de 31 de dezembro em UTC (mas já 1º de janeiro em São Paulo) não pode ser a
 *  diferença entre ter voto sobrando ou não.
 * ════════════════════════════════════════════════════════════════════
 */

/** O ano corrente, no fuso de São Paulo — embutido em toda consulta de voto. */
const ANO_ATUAL = sql`extract(year from (now() at time zone ${FUSO}))::smallint`;

// ─────────────────────────────────────────────────────────── o público

/** Os itens abertos (nunca "lancado"), agrupados por status, na ordem que o dono deu. */
export async function getRoadmapAberto(
  viewer: Viewer,
): Promise<Record<Exclude<RoadmapStatus, "lancado">, RoadmapItem[]>> {
  const rows = await db.execute<{
    id: string; title: string; description: string | null; status: RoadmapStatus;
    position: number; votos: number; viewer_votou: boolean;
  }>(sql`
    select ri.id, ri.title, ri.description, ri.status, ri.position,
           (select count(*)::int from roadmap_votes v where v.item_id = ri.id) as votos,
           exists (
             select 1 from roadmap_votes v
              where v.item_id = ri.id
                and v.user_id = ${viewer?.id ?? null}::uuid
                and v.ano = ${ANO_ATUAL}
           ) as viewer_votou
      from roadmap_items ri
     where ri.status <> 'lancado'
     order by ri.position asc, ri.created_at asc`);

  const porStatus = Object.fromEntries(STATUS_ABERTOS.map((s) => [s, [] as RoadmapItem[]])) as Record<
    Exclude<RoadmapStatus, "lancado">, RoadmapItem[]
  >;
  for (const r of rows) {
    if (r.status === "lancado") continue; // nunca acontece (o where já filtra), TS quer a guarda
    porStatus[r.status].push({
      id: r.id, title: r.title, description: r.description, status: r.status,
      position: r.position, votos: r.votos, viewerVotou: r.viewer_votou,
    });
  }
  return porStatus;
}

/** "O que chegou": os itens lançados, mais recente primeiro. */
export async function getChangelog(limite = 50): Promise<ChangelogItem[]> {
  const rows = await db.execute<{
    id: string; title: string; description: string | null; lancado_em: Date;
  }>(sql`
    select id, title, description, lancado_em
      from roadmap_items
     where status = 'lancado' and lancado_em is not null
     order by lancado_em desc
     limit ${limite}`);

  return rows.map((r) => ({
    id: r.id, title: r.title, description: r.description, lancadoEm: r.lancado_em,
  }));
}

/** Quantos dos 3 votos deste ano ainda não foram usados. */
export async function votosRestantes(viewer: Viewer): Promise<number> {
  if (!viewer) return 0;
  const [row] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from roadmap_votes
     where user_id = ${viewer.id}::uuid and ano = ${ANO_ATUAL}`);
  return Math.max(0, 3 - (row?.n ?? 0));
}

/**
 * Vota. Recusa (com a frase pronta pra tela) se: o teto de 3 deste ano já foi
 * atingido, ou o item não existe mais / já foi lançado. Votar de novo num item em que
 * você já votou este ano não é erro: idempotente, devolve sucesso.
 *
 * Mesma forma de favoritar() (lib/favoritos.ts): a checagem de "ainda cabe" é uma
 * consulta antes (a mesma que favoritar() faz pro teto de 5), e o insert de verdade
 * carrega a validação do item por dentro, sem intervalo em que ele poderia ter sido
 * apagado ou lançado entre as duas.
 */
export async function votar(
  actor: { id: string },
  itemId: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  assertAuthenticated(actor as Viewer);

  const [jaVotei] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from roadmap_votes
     where user_id = ${actor.id}::uuid and item_id = ${itemId}::uuid and ano = ${ANO_ATUAL}`);
  if ((jaVotei?.n ?? 0) > 0) return { ok: true };

  const [restam] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from roadmap_votes
     where user_id = ${actor.id}::uuid and ano = ${ANO_ATUAL}`);
  if ((restam?.n ?? 0) >= 3) {
    return {
      ok: false,
      erro: "Você já usou os 3 votos deste ano. Tire o voto de outro item pra abrir uma vaga.",
    };
  }

  const gravadas = await db.execute(sql`
    insert into roadmap_votes (user_id, item_id, ano)
    select ${actor.id}::uuid, ${itemId}::uuid, ${ANO_ATUAL}
     where exists (select 1 from roadmap_items where id = ${itemId}::uuid and status <> 'lancado')
    on conflict (user_id, item_id, ano) do nothing
    returning item_id`);

  if (gravadas.length === 0) {
    return { ok: false, erro: "Esse item não existe mais, ou já saiu do ar." };
  }
  return { ok: true };
}

/** Tira o seu voto deste ano, e devolve a vaga. */
export async function tirarVoto(actor: { id: string }, itemId: string): Promise<void> {
  assertAuthenticated(actor as Viewer);
  await db.execute(sql`
    delete from roadmap_votes
     where user_id = ${actor.id}::uuid and item_id = ${itemId}::uuid and ano = ${ANO_ATUAL}`);
}

// ─────────────────────────────────────────────────────── a administração

/** Todos os itens, de todo status (inclusive lançado), pra aba de /painel. Só idealizador. */
export async function getTodosOsItens(viewer: Viewer): Promise<RoadmapItem[]> {
  await assertIdealizador(viewer);

  const rows = await db.execute<{
    id: string; title: string; description: string | null; status: RoadmapStatus; position: number; votos: number;
  }>(sql`
    select ri.id, ri.title, ri.description, ri.status, ri.position,
           (select count(*)::int from roadmap_votes v where v.item_id = ri.id) as votos
      from roadmap_items ri
     order by ri.status, ri.position asc, ri.created_at asc`);

  return rows.map((r) => ({
    id: r.id, title: r.title, description: r.description, status: r.status,
    position: r.position, votos: r.votos, viewerVotou: false, // não faz sentido pro dono; sempre false
  }));
}

/** Cria um item novo, no fim da fila do status que ele nasce. Só idealizador. */
export async function criarItem(
  viewer: Viewer,
  dados: { title: string; description: string; status: RoadmapStatus },
): Promise<void> {
  await assertIdealizador(viewer);

  const title = clampRequired(dados.title, LIMITS.title);
  if (!title) throw new Error("todo item precisa de um título");
  const description = clamp(dados.description, LIMITS.description);

  await db.execute(sql`
    insert into roadmap_items (title, description, status, position, lancado_em)
    select ${title}, ${description}, ${dados.status},
           coalesce((select max(position) + 1 from roadmap_items where status = ${dados.status}), 0),
           ${dados.status === "lancado" ? sql`now()` : sql`null`}`);
}

/** Edita o texto de um item. Só idealizador. */
export async function editarItem(
  viewer: Viewer,
  itemId: string,
  dados: { title: string; description: string },
): Promise<void> {
  await assertIdealizador(viewer);

  const title = clampRequired(dados.title, LIMITS.title);
  if (!title) throw new Error("todo item precisa de um título");
  const description = clamp(dados.description, LIMITS.description);

  await db.execute(sql`
    update roadmap_items set title = ${title}, description = ${description}
     where id = ${itemId}::uuid`);
}

/**
 * Muda o status. Só a transição PARA "lancado" grava `lancado_em` — e só na primeira
 * vez: mudar outra coisa num item já lançado não reescreve a data em que ele saiu.
 * Sair de "lancado" para qualquer outro status limpa `lancado_em`: um item que voltou
 * pra trás não pode continuar aparecendo em "o que chegou".
 */
export async function mudarStatus(
  viewer: Viewer,
  itemId: string,
  status: RoadmapStatus,
): Promise<void> {
  await assertIdealizador(viewer);

  await db.execute(sql`
    update roadmap_items
       set status = ${status},
           position = coalesce((select max(position) + 1 from roadmap_items where status = ${status}), 0),
           lancado_em = case
             when ${status} = 'lancado' then coalesce(lancado_em, now())
             else null
           end
     where id = ${itemId}::uuid`);
}

/**
 * Recebe a ordem final de UM status, e grava a posição de cada item. Só idealizador, e
 * só mexe em itens que já são deste status (o where é a autorização, como sempre) —
 * mandar o id de um item de outro status não move ele pra cá por acidente.
 *
 * Um dono só, sem disputa concorrente: ao contrário de favoritar()/coroar(), não
 * precisa do offset negativo de duas fases — não há unique constraint em position
 * pra colidir com.
 */
export async function reordenarItens(
  viewer: Viewer,
  status: RoadmapStatus,
  ordemFinal: string[],
): Promise<void> {
  await assertIdealizador(viewer);

  for (const [i, id] of ordemFinal.entries()) {
    await db.execute(sql`
      update roadmap_items set position = ${i}
       where id = ${id}::uuid and status = ${status}`);
  }
}

/** Apaga um item. O dono não escreve um obituário público de ideia de leitor: apaga. */
export async function apagarItem(viewer: Viewer, itemId: string): Promise<void> {
  await assertIdealizador(viewer);
  await db.execute(sql`delete from roadmap_items where id = ${itemId}::uuid`);
}

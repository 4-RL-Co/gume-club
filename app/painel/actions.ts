"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import {
  criarItem, editarItem, mudarStatus, reordenarItens, apagarItem, type RoadmapStatus,
} from "@/lib/roadmap";

/**
 * As mutações da aba "roadmap" de /painel. Todas chamam lib/roadmap.ts, que checa
 * `assertIdealizador` por dentro — esta camada não é a defesa, é só a ponte entre o
 * formulário e ela. Ver o cabeçalho de lib/roadmap.ts.
 *
 * `revalidatePath` em duas rotas: /painel (pra a lista da aba atualizar) e /o-que-vem
 * (a tela pública que os mesmos dados alimentam) — mudar o status de um item também
 * pode tirar ou pôr ele em /o-que-chegou, então essa também é revalidada sempre.
 */
function revalidarTudo(): void {
  revalidatePath("/painel");
  revalidatePath("/o-que-vem");
  revalidatePath("/o-que-chegou");
}

export async function criarItemAction(title: string, description: string, status: RoadmapStatus): Promise<void> {
  const actor = await getActor();
  await criarItem(actor, { title, description, status });
  revalidarTudo();
}

export async function editarItemAction(itemId: string, title: string, description: string): Promise<void> {
  const actor = await getActor();
  await editarItem(actor, itemId, { title, description });
  revalidarTudo();
}

export async function mudarStatusAction(itemId: string, status: RoadmapStatus): Promise<void> {
  const actor = await getActor();
  await mudarStatus(actor, itemId, status);
  revalidarTudo();
}

export async function reordenarItensAction(status: RoadmapStatus, ordemFinal: string[]): Promise<void> {
  const actor = await getActor();
  await reordenarItens(actor, status, ordemFinal);
  revalidarTudo();
}

export async function apagarItemAction(itemId: string): Promise<void> {
  const actor = await getActor();
  await apagarItem(actor, itemId);
  revalidarTudo();
}

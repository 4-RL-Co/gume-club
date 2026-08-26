"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { votar, tirarVoto } from "@/lib/roadmap";

/**
 * Vota num item. `getActor()` conta a escrita por dentro (ver lib/escrita.ts) e recusa
 * sem sessão — mas a tela já esconde o botão pra quem não entrou, então este caminho
 * só é alcançado por quem burlou o formulário, o mesmo desenho de upvotarAction()
 * (app/livro/[slug]/actions.ts).
 */
export async function votarAction(itemId: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const actor = await getActor();
  const r = await votar(actor, itemId);
  revalidatePath("/o-que-vem");
  return r;
}

export async function tirarVotoAction(itemId: string): Promise<void> {
  const actor = await getActor();
  await tirarVoto(actor, itemId);
  revalidatePath("/o-que-vem");
}

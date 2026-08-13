"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { porEmblema } from "@/lib/conjuntos";

/**
 * Pôr (ou tirar) o emblema de um conjunto. É contribuição de CATÁLOGO, como ligar um
 * volume: vale para todo mundo que tem aquela coleção, vai para o log com nome, e é
 * reversível. Ver lib/conjuntos.ts.
 *
 * ═══ POR QUE ESTA AÇÃO NÃO EXISTIA ═══
 *
 * `porEmblema()` foi escrita em 2026-08-06 e nunca ganhou uma porta na tela — nem
 * botão, nem formulário. A função funcionava (depois do conserto da migration 0061),
 * e continuava impossível de usar: ninguém tinha como chegar nela. Um recurso sem UI
 * não é um recurso incompleto, é um recurso que não existe para quem lê a tela.
 */
export async function porEmblemaAction(conjuntoId: string, url: string): Promise<void> {
  const actor = await getActor();
  await porEmblema(actor, conjuntoId, url);
  revalidatePath("/colecao");
}

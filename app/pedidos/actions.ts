"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/viewer";
import { limitarEscrita } from "@/lib/escrita";
import { atender, reabrir } from "@/lib/torneira";

/**
 * Fechar e reabrir um pedido.
 *
 * A autorização mora em lib/torneira.ts, no servidor, e não aqui: estas funções são
 * um endereço público, e um endereço público que confia na tela é um endereço que
 * qualquer um chama com curl.
 */

export async function atenderPedido(id: string): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await atender(viewer, id);
  revalidatePath("/pedidos");
}

export async function reabrirPedido(id: string): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await reabrir(viewer, id);
  revalidatePath("/pedidos");
}

"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { marcarPosse, type Posse } from "@/lib/copies";

/**
 * Marcar que um livro é seu (ou que você quer que seja).
 *
 * `getActor()` e não `getViewer()`: isto é ESCRITA, e escrita sem teto de uso é um
 * formulário de spam. A trava está em lib/acoes.test.ts, e já pegou este erro uma vez
 * neste repo.
 */
export async function marcar(
  slug: string,
  workId: string,
  editionId: string | null,
  posse: Posse,
): Promise<void> {
  const actor = await getActor();
  await marcarPosse(actor, workId, editionId, posse);
  revalidatePath(`/livro/${slug}`);
  revalidatePath("/colecao");
}

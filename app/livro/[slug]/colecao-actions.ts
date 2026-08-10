"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { marcarPosse, guardarHistoria, type Posse } from "@/lib/copies";

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

/**
 * A história do exemplar. Ela ATUALIZA um exemplar que já é seu, e nunca cria um.
 *
 * Antes, escrever aqui punha o livro na coleção sozinho — era a única porta que
 * existia. Agora existe um botão, e a nota se agarra ao que ele criou.
 */
export async function guardarProcedencia(
  slug: string,
  workId: string,
  editionId: string | null,
  nota: string,
): Promise<void> {
  const actor = await getActor();
  await guardarHistoria(actor, workId, editionId, nota);
  revalidatePath(`/livro/${slug}`);
  revalidatePath("/colecao");
}

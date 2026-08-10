"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { marcarPosse, guardarHistoria, type Posse } from "@/lib/copies";
import { ligarAoConjunto, soltarDoConjunto, buscarConjuntos } from "@/lib/conjuntos";

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

/**
 * Ligar este volume a um conjunto de edição, criando o conjunto se preciso.
 *
 * É contribuição de CATÁLOGO, e não preferência: "Hellsing Deluxe tem 3 volumes" vale
 * para todo mundo. Por isso vai para o log de revisões, com nome e reversível — o
 * mesmo histórico público que protege a ficha do livro. Ver lib/conjuntos.ts.
 */
export async function ligarConjunto(
  slug: string,
  workId: string,
  escolha: { conjuntoId: string } | { titulo: string; total: number; publisher: string | null },
  volume: number,
): Promise<void> {
  const actor = await getActor();
  await ligarAoConjunto(actor, workId, escolha, volume);
  revalidatePath(`/livro/${slug}`);
  revalidatePath("/colecao");
}

/** Procurar um conjunto que já existe. Leitura, e por isso não conta escrita. */
export async function procurarConjuntos(termo: string) {
  await getActor();
  return buscarConjuntos(termo);
}

export async function soltarConjunto(slug: string, workId: string): Promise<void> {
  const actor = await getActor();
  await soltarDoConjunto(actor, workId);
  revalidatePath(`/livro/${slug}`);
  revalidatePath("/colecao");
}

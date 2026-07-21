"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import {
  moverNaLista, numerarLista, descreverLista, guardarLista, esquecerLista, escolherCapaDaLista,
} from "@/lib/listas";

/**
 * As ações da estante inventada. Toda ação resolve o ator primeiro (é a regra de
 * toda superfície: ver lib/surface.test.ts), e a autorização de verdade mora em
 * lib/listas.ts, no SQL, como em toda mutação deste projeto.
 */

export async function subirNaEstante(slug: string, collectionId: string, workId: string) {
  const actor = await getActor();
  await moverNaLista(actor, collectionId, workId, "subir");
  revalidatePath(`/estante/${slug}`);
}

export async function descerNaEstante(slug: string, collectionId: string, workId: string) {
  const actor = await getActor();
  await moverNaLista(actor, collectionId, workId, "descer");
  revalidatePath(`/estante/${slug}`);
}

export async function numerarEstante(slug: string, collectionId: string, numerada: boolean) {
  const actor = await getActor();
  await numerarLista(actor, collectionId, numerada);
  revalidatePath(`/estante/${slug}`);
}

export async function descreverEstante(slug: string, collectionId: string, descricao: string) {
  const actor = await getActor();
  await descreverLista(actor, collectionId, descricao);
  revalidatePath(`/estante/${slug}`);
}

export async function guardarEstante(slug: string, collectionId: string) {
  const actor = await getActor();
  await guardarLista(actor, collectionId);
  revalidatePath(`/estante/${slug}`);
}

export async function esquecerEstante(slug: string, collectionId: string) {
  const actor = await getActor();
  await esquecerLista(actor, collectionId);
  revalidatePath(`/estante/${slug}`);
}

export async function escolherCapaEstante(slug: string, collectionId: string, workId: string | null) {
  const actor = await getActor();
  await escolherCapaDaLista(actor, collectionId, workId);
  revalidatePath(`/estante/${slug}`);
}

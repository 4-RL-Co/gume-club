"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getActor } from "@/lib/actor";
import {
  moverNaLista, numerarLista, descreverLista, guardarLista, esquecerLista, escolherCapaDaLista, fotografarLista,
  porNaLista,
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

export async function fotografarEstante(slug: string, collectionId: string, url: string | null) {
  const actor = await getActor();
  await fotografarLista(actor, collectionId, url);
  revalidatePath(`/estante/${slug}`);
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  PÔR UM LIVRO NA ESTANTE, DE DENTRO DELA.
 *
 *  ═══ POR QUE ELA RECEBE O ENDEREÇO DO LIVRO, E NÃO O ID ═══
 *
 *  A busca devolve o endereço público do livro (o `slug`), que é o que a tela já
 *  tem na mão. Fazer o cliente mandar um id interno significaria vazar id interno
 *  para o navegador em mais uma tela, e id que trafega é id que alguém tenta
 *  adivinhar. O endereço já é público; a tradução para id acontece aqui dentro.
 *
 *  Quem autoriza continua sendo `porNaLista`, no SQL, contra o dono da estante.
 * ════════════════════════════════════════════════════════════════════
 */
export async function porLivroNaEstante(
  slug: string,
  collectionId: string,
  livroSlug: string,
): Promise<{ ok: true; novo: boolean } | { ok: false }> {
  const actor = await getActor();

  const [obra] = await db.execute<{ id: string }>(sql`
    select id from works where slug = ${livroSlug} limit 1
  `);
  if (!obra) return { ok: false };

  const novo = await porNaLista(actor, collectionId, obra.id);

  revalidatePath(`/estante/${slug}`);
  return { ok: true, novo };
}

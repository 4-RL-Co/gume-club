"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { follow, unfollow } from "@/lib/social";


/** Following is unilateral: a public shelf does not ask permission to be read. */
export async function toggleFollow(userId: string, handle: string, following: boolean): Promise<void> {
  const actor = await getActor();
  if (following) await unfollow(actor, userId);
  else await follow(actor, userId);

  revalidatePath(`/@${handle}`);
  revalidatePath("/feed");
}

/**
 * A CONCESSÃO MANUAL SAIU, e o arquivo guarda o porquê.
 *
 * Existia aqui uma ação para um bibliotecário conceder CAÇADOR e TRADUTOR à mão. As
 * duas insígnias deixaram de existir (2026-07-12), e o motivo é simples e bom: uma
 * insígnia que a pessoa consegue DESBLOQUEAR não pode depender de alguém lembrar de
 * dá-la. Um cargo distribuído à mão faz do dono um gargalo, e depois um porteiro.
 *
 * As sete que sobraram se ganham SOZINHAS. A única concedida é o IDEALIZADOR, e ela
 * é a exceção honesta: ninguém pode "conseguir" ter imaginado uma coisa.
 *
 * Ver ai/DECISIONS.md e lib/librarian.ts.
 */

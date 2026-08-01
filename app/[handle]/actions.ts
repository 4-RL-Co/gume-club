"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { follow, unfollow } from "@/lib/social";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";


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

/**
 * ════════════════════════════════════════════════════════════════════
 *  REENVIAR A CONFIRMAÇÃO DE E-MAIL. Só para si mesmo, nunca para outro.
 *
 *  O e-mail de confirmação sai UMA VEZ, no cadastro. Quem não o achou (spam, caixa
 *  cheia, endereço trocado no mesmo dia) ficava sem segunda chance: o app continuava
 *  funcionando, e a pessoa só não aparecia para ninguém — sem erro, sem aviso, sem
 *  saber. Em produção eram quatro pessoas assim, uma delas com 503 livros.
 *
 *  ═══ POR QUE NÃO ACEITA UM E-MAIL COMO PARÂMETRO ═══
 *
 *  Ele reenvia para o endereço DA SESSÃO, e mais nada. Uma ação que aceitasse um
 *  endereço seria um cano para mandar e-mail em nome do Gume para qualquer pessoa —
 *  o app viraria máquina de spam de graça, assinada por nós.
 * ════════════════════════════════════════════════════════════════════
 */
export async function reenviarConfirmacao(): Promise<void> {
  const actor = await getActor();

  const [eu] = await db
    .select({ email: users.email, verificado: users.emailVerified })
    .from(users)
    .where(eq(users.id, actor.id))
    .limit(1);

  // Já confirmado: não reenvia. Um "confirme seu e-mail" para quem já confirmou é
  // uma mentira, e ainda dá um jeito de disparar e-mail em looping.
  if (!eu || eu.verificado) return;

  await auth.api.sendVerificationEmail({ body: { email: eu.email } });
}

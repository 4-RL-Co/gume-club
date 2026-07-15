"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/viewer";
import { limitarEscrita } from "@/lib/escrita";
import {
  banir, desbanir, procurarPessoa, reservarHandle,
  promoverModerador, rebaixarModerador,
} from "@/lib/moderacao";
import { enviar, CAIXA_DA_MODERACAO } from "@/lib/email";
import { LIMITS, clamp } from "@/lib/limits";

/**
 * A moderação, e ela é pequena de propósito.
 *
 * A autorização NÃO mora aqui: mora em lib/moderacao.ts, que exige bibliotecário
 * antes de escrever qualquer coisa. Estas funções são só a porta.
 */
export async function banirPessoa(userId: string, motivo: string): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await banir(viewer, userId, motivo);
  revalidatePath("/moderacao");
}

export async function desbanirPessoa(userId: string): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await desbanir(viewer, userId);
  revalidatePath("/moderacao");
}

export async function procurar(q: string) {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  return procurarPessoa(viewer, q);
}

export async function reservar(handle: string, motivo: string): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await reservarHandle(viewer, handle, motivo);
  revalidatePath("/moderacao");
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  DENUNCIAR. Um botão, um e-mail, e mais nada.
 *
 *  Sem fila, sem painel, sem sistema de tíquete. UMA pessoa modera, e a
 *  caixa de entrada dela É o painel. Um sistema de moderação com fila e
 *  atribuição, tocado por uma pessoa, é um sistema que ninguém abre, e
 *  uma denúncia que ninguém lê é PIOR que uma denúncia que não existe:
 *  ela promete e não entrega.
 *
 *  A gente NÃO grava numa tabela. Uma tabela de denúncias pede uma tela
 *  para ela, a tela pede uma fila, e a fila pede um sistema. O e-mail é o
 *  painel, e é o painel de propósito.
 *
 *  Quem denuncia precisa estar logado: denúncia anônima é um formulário de
 *  spam com outro nome.
 * ════════════════════════════════════════════════════════════════════
 */
export async function denunciar(handle: string, motivo: string): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  if (!viewer) throw new Error("entre para denunciar");

  const porque = clamp(motivo, LIMITS.review);
  if (!porque) throw new Error("diga o que aconteceu");

  const [quem] = await db.execute<{ handle: string }>(sql`
    select handle from users where id = ${viewer.id}::uuid`);

  const caixa = CAIXA_DA_MODERACAO();
  if (!caixa) throw new Error("a moderação não tem caixa de entrada configurada");

  await enviar({
    para: caixa,
    assunto: `Denúncia: @${handle}`,
    texto:
      `@${quem?.handle ?? "alguém"} denunciou @${handle}.\n\n` +
      `${porque}\n\n` +
      `---\n` +
      `Perfil: /@${handle}\n` +
      `Moderação: /moderacao\n`,
  });
}

/**
 * Promover e rebaixar moderador. SÓ O IDEALIZADOR.
 *
 * A autorização não mora aqui: mora em lib/moderacao.ts, que exige o idealizador antes
 * de escrever qualquer coisa. Esta função é só a porta, e esconder o botão não protege
 * nada.
 */
export async function promover(userId: string): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await promoverModerador(viewer, userId);
  revalidatePath("/moderacao");
}

export async function rebaixar(userId: string): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await rebaixarModerador(viewer, userId);
  revalidatePath("/moderacao");
}

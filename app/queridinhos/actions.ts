"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { guardarCuradoria, esquecerCuradoria } from "@/lib/curadoria-guardada";

/**
 * Guardar e esquecer a curadoria da casa.
 *
 * ═══ `getActor()`, E NUNCA `getViewer()` ═══
 *
 * A primeira versão usava `getViewer()`, e `lib/acoes.test.ts` reprovou com a frase
 * certa: **uma escrita sem teto é um formulário de spam**. `getActor()` conta a escrita
 * por dentro; `getViewer()` só diz quem está olhando. Duas ações minhas entraram sem
 * limite nenhum, e foi a trava do repo que percebeu — não eu.
 *
 * ═══ A CHAVE VEM DA TELA, E POR ISSO É VALIDADA LÁ DENTRO ═══
 *
 * Uma ação de servidor recebe o que o cliente mandar, e não o que a tela desenhou.
 * `guardarCuradoria` recusa chave que o app não conhece. Ver lib/curadoria-guardada.ts.
 *
 * ═══ REVALIDA O PERFIL JUNTO ═══
 *
 * É lá que a coisa guardada aparece. Sem isto a pessoa guarda, vai ver, e não encontra:
 * o pior tipo de "não funcionou", porque funcionou e a tela mentiu.
 */
export async function guardar(chave: string): Promise<void> {
  const actor = await getActor();
  await guardarCuradoria(actor, chave);
  revalidatePath("/queridinhos");
  revalidatePath("/eu");
}

export async function esquecer(chave: string): Promise<void> {
  const actor = await getActor();
  await esquecerCuradoria(actor, chave);
  revalidatePath("/queridinhos");
  revalidatePath("/eu");
}

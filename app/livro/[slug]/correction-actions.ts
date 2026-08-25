"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/viewer";
import { limitarEscrita } from "@/lib/escrita";
import { corrigirEdicao, reverter, type Campo } from "@/lib/corrections";

/** Corrigir um dado desta edição. Qualquer leitor logado, e aplica na hora. */
export async function corrigir(
  slug: string,
  editionId: string,
  campo: string,
  valor: string,
  motivo: string,
): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await corrigirEdicao(viewer, editionId, campo as Campo, valor, motivo);
  revalidatePath(`/livro/${slug}`);
  revalidatePath("/estante");
}

/** Reverter. Só bibliotecário, e a reversão também entra no log. */
export async function reverterCorrecao(slug: string, revisionId: string): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await reverter(viewer, revisionId);
  revalidatePath(`/livro/${slug}`);
}

/**
 * ═══ "PROPOR UMA CAPA" E "JULGAR UMA CAPA" SAÍRAM DAQUI ═══
 *
 * Eram a ponte entre a tela e a fila de moderação (lib/corrections.ts: proporCapa,
 * getFilaDeCapas, julgarCapa) — e já estavam órfãs antes desta limpeza: a capa virou um
 * campo comum do formulário de correção (components/correction.tsx), aplicado na hora,
 * sem fila. `proporUmaCapa` não tinha uma única tela chamando ela.
 *
 * A ÚNICA tela que ainda mostrava a fila para um bibliotecário era /o-que-falta, que
 * saiu do app inteira ("tire a página inteira, e tudo que ela fazia" — o dono). Sem
 * fila para julgar, `julgarUmaCapa` também ficou sem chamador.
 *
 * O que NÃO saiu: lib/corrections.ts continua com proporCapa/getFilaDeCapas/julgarCapa
 * de pé, e o teste que os defende também. Isso é de propósito, e está em
 * ai/DECISIONS.md ("sem fila de moderação agora"): a fila é infraestrutura engatilhada
 * para o dia em que aparecer gente demais mexendo na mesma capa — só a PONTE entre ela
 * e uma tela é que não existe mais, porque a tela que a usava não existe mais.
 */

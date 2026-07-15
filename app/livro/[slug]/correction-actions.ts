"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/viewer";
import { limitarEscrita } from "@/lib/escrita";
import {
  corrigirEdicao, reverter, proporCapa, julgarCapa, type Campo,
} from "@/lib/corrections";
import { porQueNaoAceita } from "@/lib/imagens";

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

/** Propor uma capa. Entra numa fila: é o único campo com plateia. */
export async function proporUmaCapa(
  slug: string,
  editionId: string,
  url: string,
  nota: string,
): Promise<{ erro: string | null }> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);

  /**
   * A recusa VOLTA COMO VALOR, e não como exceção: o Next apaga a mensagem de um erro
   * lançado dentro de uma ação de servidor quando o app roda em produção, e esta
   * mensagem é uma instrução — a pessoa precisa dela para acertar na segunda tentativa.
   *
   * `proporCapa` confere a origem de novo do outro lado. É ela que fecha a porta; esta
   * checagem aqui existe para a frase chegar viva até a tela.
   */
  const naoAceita = porQueNaoAceita(url);
  if (naoAceita) return { erro: naoAceita };

  try {
    await proporCapa(viewer, editionId, url, nota);
  } catch {
    return { erro: "Não deu para enviar a sugestão agora. O problema é nosso." };
  }

  revalidatePath(`/livro/${slug}`);
  return { erro: null };
}

/** Aplicar ou recusar uma capa da fila. Só bibliotecário. */
export async function julgarUmaCapa(propostaId: string, aplicar: boolean): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await julgarCapa(viewer, propostaId, aplicar);
  revalidatePath("/o-que-falta");
}

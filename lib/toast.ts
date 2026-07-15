"use client";

/**
 * O aviso discreto, com desfazer.
 *
 * Toda ação destrutiva ganha cinco segundos de arrependimento. Isso não é um
 * detalhe de conforto: é o que faz a pessoa se sentir livre para experimentar.
 * Sem desfazer, "tirar 37 livros da estante" é uma decisão que dá medo, e uma
 * decisão que dá medo é uma que ninguém toma.
 *
 * Um pub/sub de três linhas, sem biblioteca e sem contexto: qualquer componente
 * cliente chama toast(), e o único ouvinte é o ToastHost, montado no layout.
 */
export type Toast = {
  id: number;
  message: string;
  /** Se existir, o aviso mostra "desfazer" e espera cinco segundos por você. */
  undo?: () => Promise<void>;
};

type Listener = (t: Toast) => void;

const listeners = new Set<Listener>();
let seq = 0;

export function toast(message: string, undo?: () => Promise<void>): void {
  const t: Toast = { id: ++seq, message, undo };
  for (const l of listeners) l(t);
}

export function onToast(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

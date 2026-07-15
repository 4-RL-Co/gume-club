"use client";

import { useState } from "react";
import { hoje } from "@/lib/datas";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "QUANDO VOCÊ LEU?" — A PERGUNTA APARECE NA HORA CERTA, E SÓ NELA.
 *
 *  Antes, a data de leitura era um campo perdido embaixo da página, e o app escrevia
 *  HOJE toda vez que alguém apertava "lido". Quem terminou o livro em março de 2019
 *  ficava com "13 de julho de 2026" na estante, e a estatística do ano era ficção.
 *
 *  ═══ POR QUE "LENDO" NÃO PERGUNTA NADA ═══
 *
 *  Porque a resposta não muda nada. O Gume **não calcula quanto tempo você levou** —
 *  não existe "você leu esse livro em 12 dias", e não vai existir: isso é velocidade,
 *  e velocidade vira ranking de velocidade.
 *
 *  Então "lendo" grava hoje e cala a boca. Um clique, e pronto.
 *
 *  ═══ E "LIDO" E "ABANDONADO" PERGUNTAM ═══
 *
 *  Porque aí a data É o dado. Ela é o que faz o "seu 2019" existir, o que faz a
 *  memória da coleção existir ("do volume 1, em março de 2022, ao volume 41, em agosto
 *  de 2025"), e nada disso funciona com uma data inventada.
 *
 *  O padrão continua sendo HOJE, e quem aceita hoje não paga nada: aperta "guardar" e
 *  acabou. Quem leu em 2019 troca a data e o Gume acredita.
 * ════════════════════════════════════════════════════════════════════
 */
export function Quando({
  status,
  onConfirmar,
  onCancelar,
  pending,
}: {
  /** "lido" ou "abandonado". É o que muda a frase, e nada mais. */
  status: "read" | "did_not_finish";
  onConfirmar: (quando: string) => void;
  onCancelar: () => void;
  pending: boolean;
}) {
  const [quando, setQuando] = useState(hoje());

  const frase = status === "read" ? "Quando você terminou?" : "Quando você largou?";

  return (
    <div className="surface-2 mt-3 p-4">
      <p className="text-[14px] text-[var(--color-ink)]">{frase}</p>

      <p className="mt-1 text-[12px] text-[var(--color-ink-faint)]">
        Já vem com a data de hoje. Se foi noutro dia, troque.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={quando}
          // Ninguém termina um livro amanhã. O servidor recusa de novo, e é lá que a
          // regra mora de verdade (lib/datas.ts) — isto aqui só evita o vaivém.
          max={hoje()}
          onChange={(e) => setQuando(e.target.value)}
          className="rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)]"
        />

        <button
          type="button"
          disabled={pending}
          onClick={() => onConfirmar(quando)}
          className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pending ? "Guardando" : "Guardar"}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={onCancelar}
          className="text-[12px] text-[var(--color-ink-faint)] underline underline-offset-4 hover:text-[var(--color-ink)]"
        >
          deixa pra lá
        </button>
      </div>
    </div>
  );
}

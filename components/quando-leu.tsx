"use client";

import { useState } from "react";

/**
 * "Quando você leu", em UMA linha discreta: o resumo em itálico na serifa da voz,
 * e um "ajustar" que abre o editor de datas ali mesmo.
 *
 * Já foi um cartão inteiro, depois uma gaveta com título. Mas a resposta cabe em
 * meia frase ("terminei em 2019"), e uma meia frase com moldura própria ocupa o
 * lugar de uma seção. Agora ela mora encostada no painel do livro, como uma nota
 * de margem: quem só olha, lê; quem precisa corrigir, abre.
 */
export function QuandoLeu({ resumo, children }: { resumo: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="px-2">
      <p className="flex flex-wrap items-baseline gap-x-3 text-[13px] text-[var(--color-ink-faint)]">
        <span className="voice italic text-[14px]">{resumo}</span>
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="underline decoration-[var(--color-rule)] underline-offset-4 transition-colors hover:text-[var(--color-ink)]"
        >
          {aberto ? "fechar" : "ajustar"}
        </button>
      </p>
      {aberto && <div className="paper mt-3 p-4">{children}</div>}
    </div>
  );
}

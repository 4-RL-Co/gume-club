"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

/**
 * O LÁPIS da ficha. "Arrumar este livro" era uma gaveta com título e resumo no
 * porão da página; virou um lápis discreto no canto do cartão de informações,
 * que é onde o erro aparece para quem o vê. Um toque abre o formulário de
 * correção e o histórico, ali mesmo.
 */
export function Arrumar({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-label="arrumar este livro"
        title="faltou capa, ou tem algum dado errado? você mesmo ajeita"
        className={[
          "absolute right-5 top-5 rounded-full p-2 transition-colors",
          aberto
            ? "text-[var(--color-ink)]"
            : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
        ].join(" ")}
      >
        <Pencil size={15} strokeWidth={1.5} aria-hidden />
      </button>
      {aberto && <div className="mt-8 border-t border-[var(--color-rule)] pt-6">{children}</div>}
    </>
  );
}

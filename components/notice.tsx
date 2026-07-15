"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Um aviso que a pessoa fecha e não vê mais.
 *
 * Existe por uma razão só: quando o app muda a forma de um dado que é DELA, ela
 * precisa saber. As notas em estrela viraram palavras, e quatro e quatro e meia
 * viraram a mesma frase. Perda de precisão declarada é honesta; perda silenciosa
 * não é, e é a diferença entre um app que respeita quem usa e um que não.
 *
 * O "já vi" mora no navegador. Não vale uma coluna no banco, e ninguém precisa
 * saber que você fechou um aviso.
 */
export function Notice({ id, children }: { id: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(localStorage.getItem(`gume.aviso.${id}`) !== "visto");
  }, [id]);

  if (!show) return null;

  return (
    <div className="surface mt-8 flex items-start gap-4 p-6">
      <p className="min-w-0 flex-1 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
        {children}
      </p>
      <button
        aria-label="fechar aviso"
        onClick={() => {
          localStorage.setItem(`gume.aviso.${id}`, "visto");
          setShow(false);
        }}
        className="shrink-0 text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

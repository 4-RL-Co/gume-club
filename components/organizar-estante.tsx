"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { subirNaEstante, descerNaEstante } from "@/app/estante/[slug]/actions";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ORGANIZAR A ORDEM DA ESTANTE. Setas, e não arrasto.
 *
 *  Arrastar capa é bonito no computador e uma luta no celular, e o celular é
 *  metade das pessoas. Duas setas por título funcionam nos dois, sem biblioteca
 *  nenhuma, e cada toque grava na hora: não existe "salvar a ordem" para
 *  esquecer de apertar.
 *
 *  A lista aqui é de TÍTULOS, compacta, e não a parede de capas: organizar é uma
 *  tarefa de dedo, e capas grandes espalham a tarefa por três telas de rolagem.
 * ════════════════════════════════════════════════════════════════════
 */
export function OrganizarEstante({
  slug, collectionId, itens,
}: {
  slug: string;
  collectionId: string;
  itens: { workId: string; title: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [ordem, setOrdem] = useState(itens);
  const [pending, start] = useTransition();

  if (itens.length < 2) return null;

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
      >
        organizar a ordem
      </button>
    );
  }

  const mover = (i: number, direcao: "subir" | "descer") => {
    const j = direcao === "subir" ? i - 1 : i + 1;
    if (j < 0 || j >= ordem.length) return;

    const proximo = [...ordem];
    [proximo[i], proximo[j]] = [proximo[j]!, proximo[i]!];
    setOrdem(proximo);

    const alvo = ordem[i]!;
    start(async () => {
      if (direcao === "subir") await subirNaEstante(slug, collectionId, alvo.workId);
      else await descerNaEstante(slug, collectionId, alvo.workId);
    });
  };

  return (
    <div className="paper mt-7 max-w-lg p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          a ordem
        </span>
        <button
          onClick={() => setAberto(false)}
          className="text-[12px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          fechar
        </button>
      </div>

      <ol className="mt-3 flex flex-col">
        {ordem.map((item, i) => (
          <li
            key={item.workId}
            className="flex items-center gap-3 border-t border-[var(--color-rule)] py-2 first:border-0"
          >
            <span className="tabular w-7 shrink-0 text-right text-[13px] text-[var(--color-ink-faint)]">
              {i + 1}º
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--color-ink)]">
              {item.title}
            </span>
            <span className="flex shrink-0 gap-1">
              <button
                aria-label={`subir ${item.title}`}
                disabled={pending || i === 0}
                onClick={() => mover(i, "subir")}
                className="rounded-[var(--radius-control)] border border-[var(--color-rule)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-30"
              >
                <ArrowUp size={13} strokeWidth={1.75} />
              </button>
              <button
                aria-label={`descer ${item.title}`}
                disabled={pending || i === ordem.length - 1}
                onClick={() => mover(i, "descer")}
                className="rounded-[var(--radius-control)] border border-[var(--color-rule)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-30"
              >
                <ArrowDown size={13} strokeWidth={1.75} />
              </button>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

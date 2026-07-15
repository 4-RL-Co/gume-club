"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { Avatar, AvatarStack } from "@/components/avatar";

type Leitor = { handle: string; name: string | null; image: string | null };

/**
 * ════════════════════════════════════════════════════════════════════
 *  UMA LINHA DE "QUEM LÊ O QUE VOCÊ LÊ", E O POPUP DE QUEM ESTÁ ALI.
 *
 *  ═══ POR QUE POPUP, E NÃO A LINHA ABRINDO NO LUGAR ═══
 *
 *  A primeira versão abria a lista DENTRO da linha (um <details>). Com cinco pessoas
 *  funcionava; com cem, a linha viraria uma coluna de um metro, empurrando o botão de
 *  abrir o livro para fora da tela e soterrando as outras afinidades embaixo.
 *
 *  O popup resolve os dois: a lista rola DENTRO dele (a página não cresce), e o botão do
 *  livro fica preso no rodapé do popup, sempre visível, por mais gente que tenha o livro.
 *
 *  Fecha no Esc, no clique fora, e no X. É o mesmo desenho de modal do Cmd+K.
 * ════════════════════════════════════════════════════════════════════
 */
export function AfinidadeLinha({
  slug,
  title,
  author,
  coverUrl,
  leitores,
}: {
  slug: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  leitores: Leitor[];
}) {
  const [open, setOpen] = useState(false);
  const n = leitores.length;
  const frase =
    n === 1
      ? "um leitor também tem este livro na estante"
      : `${extenso(n)} leitores também têm este livro na estante`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Trava a rolagem do fundo enquanto o popup está aberto.
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = antes;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="surface-2 flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span className="w-10 shrink-0">
          <Cover title={title} author={author} src={coverUrl} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="voice block truncate text-[16px]">{title}</span>
          <span className="mt-1 block text-[13px] text-[var(--color-ink-soft)]">{frase}</span>
        </span>

        <AvatarStack people={leitores} size={26} max={4} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-[8vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Quem tem ${title} na estante`}
            onClick={(e) => e.stopPropagation()}
            className="surface flex max-h-full w-full max-w-md flex-col overflow-hidden p-0"
          >
            <div className="flex items-center gap-3 border-b border-[var(--color-rule)] p-5">
              <span className="w-9 shrink-0">
                <Cover title={title} author={author} src={coverUrl} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="voice truncate text-[16px] leading-tight">{title}</p>
                <p className="mt-1 text-[12px] text-[var(--color-ink-faint)]">
                  quem tem na estante
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="fechar"
                className="shrink-0 rounded-[var(--radius-control)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-ink)]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {leitores.map((l) => (
                <li key={l.handle}>
                  <Link
                    href={`/@${l.handle}`}
                    className="flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 transition-colors hover:bg-white/[0.04]"
                  >
                    <Avatar src={l.image} name={l.name} handle={l.handle} size={34} />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] text-[var(--color-ink)]">
                        {l.name ?? l.handle}
                      </span>
                      <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                        @{l.handle}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t border-[var(--color-rule)] p-3">
              <Link
                href={`/livro/${slug}`}
                className="block rounded-[var(--radius-control)] px-3 py-2 text-[14px] text-[var(--color-ink-soft)] transition-colors hover:bg-white/[0.03] hover:text-[var(--color-ink)]"
              >
                abrir a página do livro
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** "Três leitores", e não "3 leitores": número solto no meio de frase é recibo. */
const NUMERO = ["nenhum", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
function extenso(n: number): string {
  return NUMERO[n] ?? String(n);
}

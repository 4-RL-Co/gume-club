"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { LIMITS } from "@/lib/limits";
import { novaEstanteComDescricao } from "@/app/livro/[slug]/curation-actions";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O DIÁLOGO DE CRIAR UMA COLEÇÃO. O primeiro que ANIMA, neste app.
 *
 *  Criar uma estante era um `<input>` que aparecia inline na barra lateral
 *  (só o nome, sem descrição) — não tinha diálogo nenhum. `components/
 *  command.tsx` e `components/afinidade-linha.tsx` já usam a mesma casca de
 *  modal (`role="dialog"`, `fixed inset-0 bg-black/60 backdrop-blur-sm`,
 *  cartão `.surface`), mas nenhum dos dois anima: `{open && (...)}` monta e
 *  desmonta na hora.
 *
 *  `docs/design.md` já documentava, sem nunca ter sido construída, a
 *  animação que falta: "Superfícies escalam a partir de 0.96 com leve
 *  overshoot; o conteúdo faz cross-fade. 180 a 260ms." Este diálogo é o
 *  primeiro a implementar essa régua — usando `--ease-spring`, que já existe
 *  e já é usado em hover, nunca em abrir/fechar.
 *
 *  ═══ POR QUE O CARTÃO FICA SEMPRE MONTADO ═══
 *
 *  Uma transição CSS não roda em algo que nasce já no estado final — por
 *  isso o cartão nunca desmonta (`{open && ...}` sumiria com ele antes da
 *  transição de saída terminar). A visibilidade é `opacity`+`scale`, e
 *  `pointer-events: none` fechado evita que ele roube clique invisível.
 * ════════════════════════════════════════════════════════════════════
 */
export function DialogoColecao({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const nomeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    // O foco espera a transição: focar antes dela terminar puxa a tela pro
    // campo antes de o diálogo terminar de aparecer.
    const t = setTimeout(() => nomeRef.current?.focus(), 200);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = antes;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setErro(null);
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      style={{
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "opacity 200ms var(--ease-spring)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="criar uma coleção"
        onClick={(e) => e.stopPropagation()}
        className="surface w-full max-w-md p-6"
        style={{
          transform: open ? "scale(1)" : "scale(0.96)",
          opacity: open ? 1 : 0,
          transition: "transform 200ms var(--ease-spring), opacity 200ms var(--ease-spring)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="voice text-[22px] leading-snug">criar uma coleção</h2>
          <button type="button" onClick={onClose} aria-label="fechar" className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form
          className="mt-5 flex flex-col gap-4"
          action={(data: FormData) =>
            start(async () => {
              const nome = String(data.get("nome") ?? "").trim();
              if (!nome) {
                setErro("dê um nome para a coleção");
                return;
              }
              const descricao = String(data.get("descricao") ?? "");
              await novaEstanteComDescricao(nome, descricao, "public");
              onClose();
            })
          }
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-[var(--color-ink-faint)]">nome</span>
            <input
              ref={nomeRef}
              name="nome"
              maxLength={LIMITS.shelfName}
              disabled={pending}
              placeholder="como 'para reler' ou 'livros do meu pai'"
              className="rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-[var(--color-ink-faint)]">descrição (opcional)</span>
            <textarea
              name="descricao"
              rows={3}
              maxLength={LIMITS.note}
              disabled={pending}
              placeholder="o que junta esses livros"
              className="resize-none rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
            />
          </label>

          {erro && <p className="text-[13px] text-[var(--color-perigo)]">{erro}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-canvas)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "criando…" : "criar"}
          </button>
        </form>
      </div>
    </div>
  );
}

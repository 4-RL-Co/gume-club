"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { DialogoLista } from "@/components/dialogo-lista";

export type Shelf = { id: string; slug: string; name: string; visibility: string; n: number };

/**
 * Shelves the reader invented, under the fixed ones. "Para reler", "do meu pai",
 * "livros que me dão medo". The app does not get to decide what those are.
 *
 * Era um `<input>` que aparecia inline aqui embaixo — só o nome, sem
 * descrição, sem animação nenhuma. Virou o diálogo de
 * components/dialogo-lista.tsx: o primeiro popup do app que anima ao
 * abrir/fechar.
 */
export function MyShelves({ shelves }: { shelves: Shelf[] }) {
  const path = usePathname();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <div className="mt-8 mb-2.5 flex items-center justify-between px-2">
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          minhas listas
        </h2>
        <button
          onClick={() => setAberto(true)}
          aria-label="criar lista"
          className="text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
      </div>

      <DialogoLista open={aberto} onClose={() => setAberto(false)} />

      <nav className="flex flex-col gap-0.5">
        {shelves.map((s) => {
          const active = path === `/estante/${s.slug}`;
          return (
            <Link
              key={s.id}
              href={`/estante/${s.slug}`}
              aria-current={active ? "page" : undefined}
              className={[
                "pill flex items-center justify-between gap-2 px-3 py-2 text-[14px] transition-colors duration-150",
                active
                  ? "afiado font-medium text-[var(--color-ink)]"
                  : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              <span className="truncate">{s.name}</span>
              <span className="tabular shrink-0 text-[12px] text-[var(--color-ink-faint)]">{s.n}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

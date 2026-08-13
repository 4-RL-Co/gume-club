"use client";

import { useState, useTransition } from "react";
import { LIMITS } from "@/lib/limits";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { novaEstante } from "@/app/livro/[slug]/curation-actions";

export type Shelf = { id: string; slug: string; name: string; visibility: string; n: number };

/**
 * Shelves the reader invented, under the fixed ones. "Para reler", "do meu pai",
 * "livros que me dão medo". The app does not get to decide what those are.
 */
export function MyShelves({ shelves }: { shelves: Shelf[] }) {
  const path = usePathname();
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <div className="mt-8 mb-2.5 flex items-center justify-between px-2">
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          minhas listas
        </h2>
        <button
          onClick={() => setAdding(!adding)}
          aria-label="criar estante"
          className="text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
      </div>

      {adding && (
        <form
          className="mb-2 px-2"
          action={(data: FormData) =>
            start(async () => {
              const name = String(data.get("nome") ?? "").trim();
              if (name) await novaEstante(name, "public");
              setAdding(false);
            })
          }
        >
          <input
            name="nome"
            autoFocus
            maxLength={LIMITS.shelfName}
            disabled={pending}
            placeholder="nome da estante"
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-2 py-1.5 text-[13px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
          />
        </form>
      )}

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

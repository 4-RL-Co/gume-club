"use client";

import { useState, useTransition } from "react";
import { LIMITS } from "@/lib/limits";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { addFromSearch, answerProvenance, type Added } from "@/app/buscar/actions";
import type { Hit } from "@/lib/catalog";

/** The shelves you can drop a book onto in one tap. */
const SHELVES = [
  { status: "want_to_read", label: "esperando" },
  { status: "reading", label: "lendo" },
  { status: "read", label: "lido" },
] as const;

/** The invitation. Ordered the way a Brazilian reader actually acquires books. */
export function SearchResults({ hits }: { hits: Hit[] }) {
  return (
    <ul className="mt-8 divide-y divide-[var(--color-rule)]">
      {hits.map((hit, i) => (
        <Result key={`${hit.isbn13 ?? hit.title}-${i}`} hit={hit} />
      ))}
    </ul>
  );
}

function Result({ hit }: { hit: Hit }) {
  const [added, setAdded] = useState<Added | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  // Declining the invitation records nothing. "depois" is not a value of
  // acquired_from, and writing 'other' because the reader shrugged would be a lie.
  const [asked, setAsked] = useState(false);
  const [pending, start] = useTransition();

  return (
    <li className="flex gap-4 py-4">
      <div className="w-14 shrink-0 sm:w-16">
        <Cover title={hit.title} author={hit.author} src={hit.coverUrl} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="voice text-[16px] leading-snug">{hit.title}</p>
        <p className="mt-0.5 text-[13px] text-[var(--color-ink-soft)]">{hit.author ?? "autor desconhecido"}</p>
        <p className="tabular mt-0.5 text-[12px] text-[var(--color-ink-faint)]">
          {[hit.publisher, hit.publishedYear, hit.isbn13].filter(Boolean).join(" · ")}
        </p>

        {!added ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {SHELVES.map((s) => (
              <button
                key={s.status}
                disabled={pending}
                onClick={() => start(async () => setAdded(await addFromSearch(hit, s.status)))}
                className="rounded-[var(--radius-control)] border border-[var(--color-rule)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : origin || asked ? (
          <p className="mt-2.5 text-[13px] text-[var(--color-ink-soft)]">
            Na estante{origin ? `, ${origin}` : ""}.{" "}
            <Link href="/" className="underline decoration-[var(--color-ink)] underline-offset-4">
              ver estante
            </Link>
          </p>
        ) : (
          /* The optional question. Ignore it and the book stays exactly where it is. */
          <form
            className="mt-2.5"
            action={(data: FormData) => {
              const nota = String(data.get("nota") ?? "").trim();
              start(async () => {
                if (nota) await answerProvenance(added.workId, added.editionId, nota);
                setOrigin(nota || null);
                setAsked(true);
              });
            }}
          >
            <p className="text-[13px] text-[var(--color-ink)]">Na estante. De onde veio esse livro?</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <input
                name="nota"
                maxLength={LIMITS.provenance}
                placeholder="presente da minha irmã, sebo da Praça XI..."
                className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-1.5 text-[13px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
              />
              <button
                type="submit"
                disabled={pending}
                className="shrink-0 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-2.5 py-1.5 text-[12px] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
              >
                guardar
              </button>
              <button
                type="button"
                onClick={() => setAsked(true)}
                className="text-[12px] text-[var(--color-ink-faint)] underline underline-offset-4 hover:text-[var(--color-ink)]"
              >
                depois
              </button>
            </div>
          </form>
        )}
      </div>
    </li>
  );
}

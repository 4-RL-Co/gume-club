"use client";

import { useState, useTransition } from "react";
import { LIMITS } from "@/lib/limits";
import { recommendTo } from "@/app/livro/[slug]/actions";

/**
 * Recommend a book to a friend. One book, one person, one line of why.
 *
 * It lands on their shelf marked as having come from a PERSON, not from an
 * algorithm. This is the mechanic no competitor has, and it is the reason someone
 * opens the app tomorrow. It is deliberately small: a name, a sentence, done.
 */
export function Recommend({
  workId,
  slug,
  friends,
}: {
  workId: string;
  slug: string;
  friends: { id: string; handle: string; displayName: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (friends.length === 0) {
    return (
      <p className="text-[13px] text-[var(--color-ink-faint)]">
        Siga alguém para poder recomendar um livro.
      </p>
    );
  }

  if (sent) {
    return (
      <p className="text-[13px] text-[var(--color-ink-soft)]">
        Recomendado para @{sent}. Já está na estante dela.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-[var(--radius-control)] border border-[var(--color-rule)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
      >
        Recomendar a um amigo
      </button>
    );
  }

  return (
    <form
      className="paper max-w-md p-5"
      action={(data: FormData) =>
        start(async () => {
          setError(null);
          const toUserId = String(data.get("para") ?? "");
          const handle = friends.find((f) => f.id === toUserId)?.handle ?? "";
          try {
            await recommendTo(slug, workId, toUserId, String(data.get("porque") ?? ""));
            setSent(handle);
          } catch {
            setError("Não deu para recomendar. Tente de novo.");
          }
        })
      }
    >
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          para quem
        </span>
        <select
          name="para"
          required
          className="mt-1.5 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px]"
        >
          {friends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.displayName ?? f.handle} (@{f.handle})
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          por quê
        </span>
        <input
          name="porque"
          maxLength={LIMITS.note}
          autoFocus
          placeholder="Uma linha. Só uma."
          className="mt-1.5 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
        />
      </label>

      {error && <p className="mt-3 text-[13px] text-[var(--color-perigo)]">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pending ? "Enviando" : "Recomendar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          cancelar
        </button>
      </div>
    </form>
  );
}

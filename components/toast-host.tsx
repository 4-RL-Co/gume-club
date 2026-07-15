"use client";

import { useEffect, useState } from "react";
import { onToast, type Toast } from "@/lib/toast";

/** Cinco segundos. Depois disso o aviso some sozinho, e ninguém teve que fechar nada. */
const LIFE = 5000;

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  const [undoing, setUndoing] = useState<number | null>(null);

  useEffect(() => {
    return onToast((t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), LIFE);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-8 sm:left-[254px] sm:right-0">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className="surface pointer-events-auto flex items-center gap-5 px-6 py-4"
        >
          <span className="text-[14px] text-[var(--color-ink-soft)]">{t.message}</span>

          {t.undo && (
            <button
              disabled={undoing === t.id}
              onClick={async () => {
                setUndoing(t.id);
                await t.undo!();
                setItems((prev) => prev.filter((x) => x.id !== t.id));
                setUndoing(null);
              }}
              className="shrink-0 text-[13px] font-medium text-[var(--color-accent)] underline underline-offset-4 disabled:opacity-40"
            >
              {undoing === t.id ? "desfazendo" : "desfazer"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { guardarEstante, esquecerEstante } from "@/app/estante/[slug]/actions";

/**
 * Guardar a estante de outra pessoa. Um gesto seu, e não um evento social: quem
 * montou não é notificado, e QUANTAS pessoas guardaram não existe em tela nenhuma.
 * O que existe é a estante aparecer no seu perfil, com o nome de quem fez, que é o
 * crédito de verdade. Ver lib/listas.ts.
 */
export function GuardarEstante({
  slug, collectionId, guardada,
}: {
  slug: string;
  collectionId: string;
  guardada: boolean;
}) {
  const [salva, setSalva] = useState(guardada);
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (salva) await esquecerEstante(slug, collectionId);
          else await guardarEstante(slug, collectionId);
          setSalva(!salva);
        })
      }
      className={[
        "inline-flex items-center gap-2 rounded-[var(--radius-control)] border px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-40",
        salva
          ? "border-[var(--color-ink)] text-[var(--color-ink)]"
          : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      <Bookmark size={15} strokeWidth={1.5} fill={salva ? "currentColor" : "none"} aria-hidden />
      {salva ? "guardada" : "guardar"}
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { guardar, esquecer } from "@/app/queridinhos/actions";

/**
 * Guardar a curadoria da casa. O MESMO gesto de guardar a estante de alguém, com o
 * mesmo desenho: se guardar parecesse duas coisas diferentes em duas telas, a pessoa
 * teria que aprender duas vezes.
 *
 * Não é um número: quantas pessoas guardaram não aparece em tela nenhuma, aqui como
 * lá. Guardar é um gesto seu, e nunca um placar da lista.
 */
export function GuardarCuradoria({ chave, guardada }: { chave: string; guardada: boolean }) {
  const [salva, setSalva] = useState(guardada);
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (salva) await esquecer(chave);
          else await guardar(chave);
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

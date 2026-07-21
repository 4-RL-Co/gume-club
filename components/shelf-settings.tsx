"use client";

import { useState, useTransition } from "react";
import { LIMITS } from "@/lib/limits";
import { renomearEstante, apagarEstante, visibilidadeEstante } from "@/app/livro/[slug]/curation-actions";
import { descreverEstante, numerarEstante } from "@/app/estante/[slug]/actions";
import type { Visibility } from "@/lib/authz";

/**
 * Rename it, describe it, number it, hide it, throw it away. Deleting the shelf
 * never deletes the books.
 *
 * A descrição e a numeração entraram junto com os cards de estante: uma coleção
 * montada com capricho tem um recorte para contar ("os dez que me formaram") e,
 * quando a ordem é o ponto, um 1º e um 2º. Numerar é escolha POR estante: obrigar
 * toda coleção a ter números faria de toda coleção um pódio. Ver lib/listas.ts.
 */
export function ShelfSettings({
  id, slug, name, visibility, description = null, numerada = false,
}: {
  id: string;
  slug: string;
  name: string;
  visibility: string;
  description?: string | null;
  numerada?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [vis, setVis] = useState(visibility);
  const [comNumeros, setComNumeros] = useState(numerada);
  const [descrito, setDescrito] = useState(false);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-7 text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
      >
        ajustar esta estante
      </button>
    );
  }

  return (
    <div className="paper mt-7 max-w-lg p-5">
      <form
        className="flex flex-wrap items-center gap-2"
        action={(data: FormData) =>
          start(async () => {
            await renomearEstante(id, String(data.get("nome") ?? ""));
            setOpen(false);
          })
        }
      >
        <input
          name="nome"
          defaultValue={name}
          maxLength={LIMITS.shelfName}
          className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          renomear
        </button>
      </form>

      {/* O QUE ESTA ESTANTE É, dito por quem montou. É o texto do card dela no perfil
          e no explorar: sem descrição a estante continua existindo, só conta menos. */}
      <form
        className="mt-4"
        action={(data: FormData) =>
          start(async () => {
            await descreverEstante(slug, id, String(data.get("descricao") ?? ""));
            setDescrito(true);
            setTimeout(() => setDescrito(false), 2000);
          })
        }
      >
        <textarea
          name="descricao"
          defaultValue={description ?? ""}
          maxLength={LIMITS.note}
          rows={2}
          placeholder="o que é esta estante, em uma ou duas frases"
          className="w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] leading-relaxed outline-none focus:border-[var(--color-ink)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-2 text-[12px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-40"
        >
          {descrito ? "guardado" : "guardar a descrição"}
        </button>
      </form>

      {/* NUMERADA: 1º, 2º, 3º. Uma escolha por estante, e não uma regra da casa. */}
      <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[13px] text-[var(--color-ink-soft)]">
        <input
          type="checkbox"
          checked={comNumeros}
          disabled={pending}
          onChange={(e) => {
            const querer = e.target.checked;
            setComNumeros(querer);
            start(() => numerarEstante(slug, id, querer));
          }}
          className="h-4 w-4 accent-[var(--color-ink)]"
        />
        com números: 1º, 2º, 3º
      </label>

      <div className="mt-4 flex rounded-[var(--radius-control)] border border-[var(--color-rule)] p-0.5">
        {([
          { v: "public", label: "pública" },
          { v: "private", label: "só minha" },
        ] as const).map((o) => (
          <button
            key={o.v}
            disabled={pending}
            onClick={() =>
              start(async () => {
                await visibilidadeEstante(id, o.v as Visibility);
                setVis(o.v);
              })
            }
            className={[
              "rounded-[10px] px-3 py-1 text-[12px] transition-colors",
              vis === o.v
                ? "bg-[color-mix(in_srgb,var(--color-ink)_9%,transparent)] text-[var(--color-ink)]"
                : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3 text-[13px]">
        {armed ? (
          <>
            <span className="text-[var(--color-ink-soft)]">apagar a estante? os livros ficam.</span>
            <button
              disabled={pending}
              onClick={() => start(() => apagarEstante(id))}
              className="font-medium text-[var(--color-perigo)] disabled:opacity-40"
            >
              sim, apagar
            </button>
            <button onClick={() => setArmed(false)} className="text-[var(--color-ink-faint)]">
              não
            </button>
          </>
        ) : (
          <button
            onClick={() => setArmed(true)}
            className="text-[var(--color-ink-faint)] hover:text-[var(--color-perigo)]"
          >
            apagar esta estante
          </button>
        )}
        <button onClick={() => setOpen(false)} className="ml-auto text-[var(--color-ink-faint)]">
          fechar
        </button>
      </div>
    </div>
  );
}

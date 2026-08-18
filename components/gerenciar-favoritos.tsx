"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Crown, X } from "lucide-react";
import { Cover } from "@/components/cover";
import { coroarAction, tirarFavoritoAction } from "@/app/perfil/actions";
import type { FavoritoBook } from "@/lib/favoritos";

/**
 * ════════════════════════════════════════════════════════════════════
 *  GERENCIAR OS FAVORITOS. Os cinco juntos, pra escolher entre eles.
 *
 *  Favoritar (marcar/desmarcar) acontece na ficha do livro, um de cada vez —
 *  é lá que você está lendo, e "marcar como favorito" é do tamanho de um
 *  botão. COROAR precisa ver os cinco lado a lado: é uma escolha ENTRE eles,
 *  e só faz sentido aqui. Ver lib/favoritos.ts.
 * ════════════════════════════════════════════════════════════════════
 */
export function GerenciarFavoritos({ favoritos }: { favoritos: FavoritoBook[] }) {
  const [lista, setLista] = useState(favoritos);
  const [pending, start] = useTransition();

  if (lista.length === 0) {
    return (
      <p className="text-[14px] text-[var(--color-ink-soft)]">
        Nenhum favorito ainda. Marque &quot;favorito&quot; na ficha de um livro que você já leu.
      </p>
    );
  }

  const coroar = (workId: string) => {
    setLista((prev) => {
      const alvo = prev.find((f) => f.workId === workId);
      if (!alvo) return prev;
      return [alvo, ...prev.filter((f) => f.workId !== workId)];
    });
    start(async () => {
      await coroarAction(workId);
    });
  };

  const tirar = (workId: string) => {
    setLista((prev) => prev.filter((f) => f.workId !== workId));
    start(async () => {
      await tirarFavoritoAction(workId);
    });
  };

  return (
    <div>
      <ul className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {lista.map((f, i) => (
          <li key={f.slug} className="flex flex-col items-center gap-2">
            <div className="relative w-full">
              {/* A posição 1 É a coroa — nunca um selo à parte que pudesse
                  discordar dela. Ver lib/favoritos.ts. */}
              {i === 0 && (
                <span
                  className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: "var(--color-accent)" }}
                  aria-label="o favorito"
                >
                  <Crown size={13} strokeWidth={2} className="text-[var(--color-on-accent)]" />
                </span>
              )}
              <Link href={`/livro/${f.slug}`} className="cover-lift block" title={f.title}>
                <Cover title={f.title} author={f.author} src={f.coverUrl} />
              </Link>
            </div>

            <span className="line-clamp-2 text-center text-[12px] leading-snug text-[var(--color-ink-soft)]">
              {f.title}
            </span>

            <div className="flex items-center gap-2">
              {i !== 0 && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => coroar(f.workId)}
                  className="text-[11px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-40"
                >
                  coroar
                </button>
              )}
              <button
                type="button"
                aria-label={`tirar ${f.title} dos favoritos`}
                disabled={pending}
                onClick={() => tirar(f.workId)}
                className="text-[var(--color-ink-faint)] hover:text-[var(--color-perigo)] disabled:opacity-40"
              >
                <X size={13} strokeWidth={1.75} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {lista.length < 5 && (
        <p className="mt-4 text-[13px] text-[var(--color-ink-faint)]">
          {5 - lista.length === 1 ? "Falta um lugar." : `Faltam ${5 - lista.length} lugares.`}{" "}
          Marque &quot;favorito&quot; na ficha de um livro que você já leu.
        </p>
      )}
    </div>
  );
}

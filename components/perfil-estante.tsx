"use client";

import { useState } from "react";
import { CoverWall } from "@/components/cover-wall";
import { STATUS_LABEL, type ShelfBook } from "@/lib/shelf-view";
import type { Opinion } from "@/lib/ratings";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A ESTANTE DO PERFIL: uma parede, quatro recortes.
 *
 *  O perfil empilhava um container para "lendo agora", outro para "esperando",
 *  outro para os lidos e outro para os largados, e a página virava um pergaminho.
 *  Quatro caixas para a MESMA pergunta ("o que tem na estante dela?") é layout
 *  contando o que um filtro conta melhor.
 *
 *  Agora é uma parede só, com os recortes em pílula, como a própria aba de
 *  estante já faz: a pessoa clica em "lendo" e a parede troca, sem recarregar.
 *  Abre nos LIDOS, que é o coração do perfil: livro que aconteceu, com o que a
 *  pessoa achou dele.
 *
 *  Os recortes vazios nem aparecem como opção: um botão que abre uma parede
 *  vazia é um convite para uma sala sem nada.
 * ════════════════════════════════════════════════════════════════════
 */

const RECORTES = [
  { key: "read", label: "lidos" },
  { key: "reading", label: "lendo" },
  { key: "want_to_read", label: "esperando" },
  { key: "did_not_finish", label: "largados" },
  { key: "tudo", label: "tudo" },
] as const;

type Recorte = (typeof RECORTES)[number]["key"];

export function PerfilEstante({
  books,
  opinions = {},
}: {
  books: ShelfBook[];
  opinions?: Record<string, Opinion>;
}) {
  // Os recortes que EXISTEM nesta estante. "tudo" só vale a pena com mais de um.
  const presentes = RECORTES.filter((r) =>
    r.key === "tudo"
      ? new Set(books.map((b) => b.status)).size > 1
      : books.some((b) => b.status === r.key),
  );

  const inicial: Recorte =
    presentes.find((r) => r.key === "read")?.key ?? presentes[0]?.key ?? "tudo";
  const [recorte, setRecorte] = useState<Recorte>(inicial);

  if (books.length === 0) return null;

  const filtrados = recorte === "tudo" ? books : books.filter((b) => b.status === recorte);

  return (
    <section className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        {presentes.map((r) => {
          const on = r.key === recorte;
          return (
            <button
              key={r.key}
              onClick={() => setRecorte(r.key)}
              aria-pressed={on}
              className={[
                "pill px-4 py-1.5 text-[13px] transition-colors",
                on
                  ? "afiado font-medium text-[var(--color-ink)]"
                  : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {filtrados.length === 0 ? (
        <p className="mt-6 text-[14px] text-[var(--color-ink-soft)]">
          {STATUS_LABEL[recorte] ? `nada em ${STATUS_LABEL[recorte]} por aqui.` : "nada por aqui."}
        </p>
      ) : (
        <CoverWall books={filtrados} opinions={opinions} />
      )}
    </section>
  );
}

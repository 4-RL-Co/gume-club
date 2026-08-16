"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { subirNaEstante, descerNaEstante, tirarDaEstante } from "@/app/estante/[slug]/actions";

/**
 * ════════════════════════════════════════════════════════════════════
 *  EDITAR A LISTA: ordem e remoção. Setas, e não arrasto.
 *
 *  Arrastar capa é bonito no computador e uma luta no celular, e o celular é
 *  metade das pessoas. Duas setas por título funcionam nos dois, sem biblioteca
 *  nenhuma, e cada toque grava na hora: não existe "salvar a ordem" para
 *  esquecer de apertar.
 *
 *  A lista aqui é de TÍTULOS, compacta, e não a parede de capas: organizar é uma
 *  tarefa de dedo, e capas grandes espalham a tarefa por três telas de rolagem.
 *
 *  ═══ "NÃO ACHEI COMO TIRAR UM LIVRO DA MINHA LISTA POR DENTRO DA PÁGINA DA
 *  LISTA" ═══
 *
 *  Só dava para desmarcar pela ficha do próprio livro. O remover mora aqui do
 *  lado do organizar, e não na parede de capas: as duas são tarefas de "mexer
 *  na lista inteira", e uma pessoa que já abriu isto para reordenar é a mesma
 *  que vai querer tirar um título. Remover pede confirmação (um clique a
 *  mais) porque, ao contrário de subir/descer, não tem como desfazer sozinho.
 * ════════════════════════════════════════════════════════════════════
 */
export function OrganizarEstante({
  slug, collectionId, itens,
}: {
  slug: string;
  collectionId: string;
  itens: { workId: string; title: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [ordem, setOrdem] = useState(itens);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (itens.length === 0) return null;

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
      >
        editar a lista
      </button>
    );
  }

  const mover = (i: number, direcao: "subir" | "descer") => {
    const j = direcao === "subir" ? i - 1 : i + 1;
    if (j < 0 || j >= ordem.length) return;

    const proximo = [...ordem];
    [proximo[i], proximo[j]] = [proximo[j]!, proximo[i]!];
    setOrdem(proximo);

    const alvo = ordem[i]!;
    start(async () => {
      if (direcao === "subir") await subirNaEstante(slug, collectionId, alvo.workId);
      else await descerNaEstante(slug, collectionId, alvo.workId);
    });
  };

  const tirar = (workId: string) => {
    setOrdem((prev) => prev.filter((item) => item.workId !== workId));
    setRemovendo(null);
    start(async () => {
      await tirarDaEstante(slug, collectionId, workId);
    });
  };

  return (
    <div className="paper mt-7 max-w-lg p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          a lista
        </span>
        <button
          onClick={() => setAberto(false)}
          className="text-[12px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          fechar
        </button>
      </div>

      {ordem.length === 0 ? (
        <p className="mt-3 text-[13px] text-[var(--color-ink-faint)]">
          Ficou vazia. Procure um livro aqui em cima para pôr de volta.
        </p>
      ) : (
        <ol className="mt-3 flex flex-col">
          {ordem.map((item, i) => (
            <li
              key={item.workId}
              className="flex items-center gap-3 border-t border-[var(--color-rule)] py-2 first:border-0"
            >
              <span className="tabular w-7 shrink-0 text-right text-[13px] text-[var(--color-ink-faint)]">
                {i + 1}º
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--color-ink)]">
                {item.title}
              </span>

              {removendo === item.workId ? (
                <span className="flex shrink-0 items-center gap-2 text-[12px]">
                  <span className="text-[var(--color-ink-faint)]">remover?</span>
                  <button
                    disabled={pending}
                    onClick={() => tirar(item.workId)}
                    className="font-medium text-[var(--color-perigo)] disabled:opacity-40"
                  >
                    sim
                  </button>
                  <button onClick={() => setRemovendo(null)} className="text-[var(--color-ink-faint)]">
                    não
                  </button>
                </span>
              ) : (
                <span className="flex shrink-0 gap-1">
                  {ordem.length > 1 && (
                    <>
                      <button
                        aria-label={`subir ${item.title}`}
                        disabled={pending || i === 0}
                        onClick={() => mover(i, "subir")}
                        className="rounded-[var(--radius-control)] border border-[var(--color-rule)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-30"
                      >
                        <ArrowUp size={13} strokeWidth={1.75} />
                      </button>
                      <button
                        aria-label={`descer ${item.title}`}
                        disabled={pending || i === ordem.length - 1}
                        onClick={() => mover(i, "descer")}
                        className="rounded-[var(--radius-control)] border border-[var(--color-rule)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-30"
                      >
                        <ArrowDown size={13} strokeWidth={1.75} />
                      </button>
                    </>
                  )}
                  <button
                    aria-label={`remover ${item.title} da lista`}
                    disabled={pending}
                    onClick={() => setRemovendo(item.workId)}
                    className="rounded-[var(--radius-control)] border border-[var(--color-rule)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-perigo)] hover:text-[var(--color-perigo)] disabled:opacity-30"
                  >
                    <Trash2 size={13} strokeWidth={1.75} />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

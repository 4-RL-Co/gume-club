"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { takeOffShelf, escolherEdicao } from "@/app/livro/[slug]/curation-actions";

const ICON = { size: 16, strokeWidth: 1.25 } as const;

export type Tool = {
  slug: string;
  workId: string;
  onShelf: boolean;
  editions: { id: string; publisher: string | null; year: number | null; pages: number | null; isbn: string | null }[];
  myEditionId: string | null;
};

/**
 * As duas coisas que sobraram nesta barra: dizer QUAL edição é a sua, e tirar o livro da
 * estante.
 *
 * ═══ "CORRIGIR OS DADOS" SAIU DAQUI ═══
 *
 * Havia um formulário de correção aqui e OUTRO na gaveta "correções", logo acima. Dois
 * caminhos para a mesma coisa, com regras diferentes para a capa: um contradizia o outro,
 * e ninguém sabia qual usar. Agora existe um lugar só para arrumar um livro, dentro da
 * gaveta "correções", e a capa é um campo como os outros. Ver components/correction.tsx.
 */
/**
 * ═══ "QUAL EDIÇÃO É A MINHA" SAIU DAQUI ═══
 *
 * Havia a gaveta "edições" (a lista) e, noutro cartão, o seletor "qual edição é a
 * minha". Duas moradas para o MESMO assunto: a pessoa abria a lista, via a dela
 * marcada, e não entendia onde se trocava. Agora o seletor mora DENTRO da gaveta
 * de edições (EscolherEdicao, usada pela página), e este cartão ficou com a única
 * coisa que restou: tirar o livro da estante.
 */
/**
 * E "tirar da estante" NÃO tem um cartão só para ele: um botão destrutivo raro
 * não é uma seção, é uma linha baixa no fim da coluna. Cartão inteiro para um
 * botão dava ao gesto mais raro da página o mesmo peso de uma seção de conteúdo.
 */
export function BookTools(t: { workId: string; onShelf: boolean }) {
  if (!t.onShelf) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-2">
      <Remove workId={t.workId} />
    </div>
  );
}

/** Removing is quiet: one confirm, no modal, no drama, no "are you sure?!". */
function Remove({ workId }: { workId: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  if (!armed) {
    return (
      <button
        onClick={() => setArmed(true)}
        className="ml-auto flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-perigo)]"
      >
        <Trash2 {...ICON} />
        tirar da estante
      </button>
    );
  }

  return (
    <span className="ml-auto flex items-center gap-3 text-[13px]">
      <span className="text-[var(--color-ink-soft)]">tirar da estante?</span>
      <button
        disabled={pending}
        onClick={() => start(() => takeOffShelf(workId))}
        className="font-medium text-[var(--color-perigo)] disabled:opacity-40"
      >
        {pending ? "tirando" : "sim, tirar"}
      </button>
      <button onClick={() => setArmed(false)} className="text-[var(--color-ink-faint)]">
        não
      </button>
    </span>
  );
}

/**
 * WHICH copy is yours.
 *
 * Memórias Póstumas has a hundred editions in the catalogue now, and until this
 * existed the app simply picked one for you. Page counts differ between editions
 * and so does the cover on your shelf, so guessing was never good enough.
 */
export function EscolherEdicao(t: Tool) {
  const [pending, start] = useTransition();
  const [mine, setMine] = useState(t.myEditionId);

  return (
    <ul className="paper mt-6 divide-y divide-[var(--color-rule)] p-2">
      {t.editions.map((e) => {
        const on = mine === e.id;
        return (
          <li key={e.id}>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const next = on ? null : e.id;
                  await escolherEdicao(t.slug, t.workId, next);
                  setMine(next);
                })
              }
              className={[
                "tabular flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-[13px] transition-colors disabled:opacity-40",
                on ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]",
              ].join(" ")}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: on ? "var(--color-accent)" : "var(--color-rule)" }}
              />
              <span className="flex-1 truncate">
                {e.publisher ?? "editora desconhecida"}
                {e.year ? `, ${e.year}` : ""}
              </span>
              {e.pages && <span className="shrink-0 text-[var(--color-ink-faint)]">{e.pages} p.</span>}
              {on && <span className="shrink-0 text-[11px] uppercase tracking-[0.12em]">a minha</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

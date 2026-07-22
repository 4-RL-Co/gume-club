"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A GAVETA. O que é raro não fica aberto.
 *
 *  A página de um livro tinha DOZE cartões empilhados, um embaixo do outro: a
 *  prateleira, a nota, de onde veio, a resenha, as suas leituras, as recomendações, o
 *  autor, a sua cópia, quem tem uma cópia, a linhagem, as correções, as edições e as
 *  ferramentas.
 *
 *  Cada um deles é útil. Juntos, eles são um formulário de cadastro — e ninguém entra
 *  num app de leitura com vontade de preencher um cadastro.
 *
 *  ═══ O QUE FICA ABERTO ═══
 *
 *  O que a pessoa faz TODA VEZ que abre um livro: prateleira, nota, resenha. Três
 *  coisas, uma acima da outra, e acabou.
 *
 *  O que ela faz uma vez na vida (a linhagem da cópia, o registro de correções, a lista
 *  das quarenta edições) mora numa gaveta. A gaveta não esconde: ela DIZ o que tem
 *  dentro, e abre com um toque.
 *
 *  ═══ E POR QUE NÃO UMA ABA ═══
 *
 *  Aba é navegação, e navegação obriga a escolher antes de ver. A gaveta deixa a
 *  página inteira rolar como uma página, e quem quiser abre. É a diferença entre um
 *  armário e um labirinto.
 * ════════════════════════════════════════════════════════════════════
 */
export function Gaveta({
  titulo,
  resumo,
  children,
  abertaPorPadrao = false,
}: {
  titulo: string;
  /**
   * O que tem lá dentro, em poucas palavras — "3 edições", "você tem uma cópia".
   *
   * Sem isto, a gaveta obriga a pessoa a abrir para descobrir se valia a pena abrir, e
   * abrir para descobrir é fazer ela pagar para ver.
   */
  resumo?: string | null;
  children: React.ReactNode;
  abertaPorPadrao?: boolean;
}) {
  const [aberta, setAberta] = useState(abertaPorPadrao);

  return (
    <section className="surface overflow-hidden">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_3%,transparent)] sm:px-7"
      >
        <span className="min-w-0">
          <span className="block text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {titulo}
          </span>
          {resumo && (
            <span className="mt-1 block truncate text-[14px] text-[var(--color-ink-soft)]">
              {resumo}
            </span>
          )}
        </span>

        <ChevronDown
          size={18}
          strokeWidth={1.5}
          aria-hidden
          className={[
            "shrink-0 text-[var(--color-ink-faint)] transition-transform duration-200",
            aberta ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {aberta && <div className="border-t border-[var(--color-rule)] p-6 sm:p-7">{children}</div>}
    </section>
  );
}

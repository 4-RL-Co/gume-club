"use client";

import Link from "next/link";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A PORTA DA HOME. Os dois botões da primeira dobra, e o alternador
 *  discreto pra quem já tem conta.
 *
 *  ═══ POR QUE ISTO SAIU DE app/page.tsx ═══
 *
 *  1.217 visitas de divulgação, 2 cadastros: o CTA da home dizia "Entrar",
 *  e um estranho sem conta batia num botão de LOGIN. "Entrar" em português
 *  lê como "fazer login", não como "começar" — e é a hipótese mais
 *  provável, e a mais barata de testar, para o 0,16%.
 *
 *  Isto é um componente cliente (e não só um trecho de app/page.tsx, que é
 *  Server Component) porque a próxima fatia liga eventos de medição aqui
 *  dentro (visita, clique) — e um clique que já navega embora não pode
 *  depender de network. Nesta fatia ainda não há nenhum evento: só a copy
 *  e o destino dos links mudaram.
 * ════════════════════════════════════════════════════════════════════
 */
export function PortaEntrada({ vitrine }: { vitrine: string | undefined }) {
  return (
    <>
      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/entrar?novo=1"
          className="w-full rounded-[var(--radius-control)] bg-[var(--color-ink)] px-7 py-3.5 text-[15px] font-medium text-[var(--color-canvas)] sm:w-auto"
        >
          Criar conta
        </Link>

        {vitrine && (
          <Link
            href={`/@${vitrine}`}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] px-7 py-3.5 text-[15px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] sm:w-auto"
          >
            Ver uma estante
          </Link>
        )}
      </div>

      {/* Quem já tem conta não devia precisar procurar: o link some no meio
          de duas frases, e é exatamente o oposto do que esta fatia resolve
          pro lado de quem chega pela primeira vez. */}
      <p className="mt-5 text-[14px] text-[var(--color-ink-faint)]">
        já tem conta?{" "}
        <Link
          href="/entrar"
          className="text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
        >
          entrar
        </Link>
      </p>
    </>
  );
}

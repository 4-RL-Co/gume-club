"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { registrarEvento, origemAtual, hrefComUtm } from "@/lib/funil-client";

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
 *  ═══ OS DOIS EVENTOS DESTA TELA ═══
 *
 *  `visita_home` no mount (uma vez, com a origem que o navegador enxerga) e
 *  `clique_criar` no clique do CTA principal, via `sendBeacon`: o clique já
 *  navega pra /entrar, e não pode esperar rede nenhuma terminar antes.
 *
 *  ═══ POR QUE OS HREFS COMEÇAM SEM utm_source, E MUDAM DEPOIS ═══
 *
 *  O servidor não sabe `window.location`, e a home é renderizada lá. Os links
 *  nascem com o destino simples (`/entrar?novo=1`, `/entrar`) e só GANHAM o
 *  `?utm_source=` depois de montar, no navegador — é um re-render comum, e
 *  não uma divergência de hidratação, porque o HTML do primeiro paint no
 *  cliente é idêntico ao do servidor; só o CLIQUE seguinte usa o link novo.
 * ════════════════════════════════════════════════════════════════════
 */
export function PortaEntrada({ vitrine }: { vitrine: string | undefined }) {
  const [hrefCriar, setHrefCriar] = useState("/entrar?novo=1");
  const [hrefEntrar, setHrefEntrar] = useState("/entrar");

  useEffect(() => {
    registrarEvento("visita_home", { origem: origemAtual() });
    setHrefCriar(hrefComUtm("/entrar?novo=1"));
    setHrefEntrar(hrefComUtm("/entrar"));
  }, []);

  return (
    <>
      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <Link
          href={hrefCriar}
          onClick={() => registrarEvento("clique_criar", { origem: origemAtual() })}
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
          href={hrefEntrar}
          className="text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
        >
          entrar
        </Link>
      </p>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ESCOLHER O TEMA.
 *
 *  ═══ POR QUE ELE EXISTE ═══
 *
 *  O Gume seguia o sistema, e mais nada. Um leitor chegou com o computador no claro,
 *  levou um app claro que ele não pediu e nem sabia que existia, e não tinha como sair.
 *  Seguir o sistema é um bom PADRÃO e uma péssima prisão.
 *
 *  São três estados, e não dois: "automático" é diferente de "claro". Um botão de duas
 *  posições obriga a pessoa a escolher para sempre uma coisa que ela talvez só quisesse
 *  para hoje, e tira dela o comportamento que a maioria quer (seguir o sistema).
 *
 *  ═══ ONDE A ESCOLHA MORA ═══
 *
 *  No navegador, e não no banco: tema é do APARELHO. A mesma pessoa quer escuro no
 *  celular à noite e claro no computador de dia, e uma preferência que viaja de conta
 *  atropelaria as duas. É a mesma razão do "já vi" do sino. Ver components/sino.tsx.
 * ════════════════════════════════════════════════════════════════════
 */
export const CHAVE_TEMA = "gume:tema";

type Tema = "auto" | "light" | "dark";

const OPCOES: { valor: Tema; label: string; Icon: typeof Sun }[] = [
  { valor: "auto", label: "automático", Icon: Monitor },
  { valor: "light", label: "claro", Icon: Sun },
  { valor: "dark", label: "escuro", Icon: Moon },
];

/**
 * O SCRIPT QUE RODA ANTES DE PINTAR.
 *
 * Sem ele, a página nasce com o tema do sistema e só troca quando o JavaScript acorda:
 * quem escolheu escuro num computador claro leva um flash branco na cara toda vez que
 * abre uma página. O flash é pior que o tema errado — ele parece um defeito.
 *
 * Por isso é uma string, e não um componente: ela vai inteira para dentro do `<head>`, e
 * roda antes do primeiro pixel. Ver app/layout.tsx.
 */
export const SCRIPT_DO_TEMA = `
try {
  var t = localStorage.getItem(${JSON.stringify(CHAVE_TEMA)});
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
`.trim();

export function Tema() {
  /**
   * `montado` existe para o servidor e o cliente desenharem a MESMA coisa no primeiro
   * quadro: o servidor não tem localStorage, então ele não sabe qual está escolhido. Sem
   * isto, o React acusa divergência de hidratação — o mesmo cuidado do sino.
   */
  const [montado, setMontado] = useState(false);
  const [tema, setTema] = useState<Tema>("auto");

  useEffect(() => {
    setMontado(true);
    const guardado = localStorage.getItem(CHAVE_TEMA);
    if (guardado === "light" || guardado === "dark") setTema(guardado);
  }, []);

  const escolher = (v: Tema) => {
    setTema(v);
    if (v === "auto") {
      localStorage.removeItem(CHAVE_TEMA);
      delete document.documentElement.dataset.theme;
    } else {
      localStorage.setItem(CHAVE_TEMA, v);
      document.documentElement.dataset.theme = v;
    }
  };

  return (
    <div className="mt-2 flex items-center gap-1 px-2" role="group" aria-label="tema">
      {OPCOES.map(({ valor, label, Icon }) => {
        const on = montado && tema === valor;
        return (
          <button
            key={valor}
            onClick={() => escolher(valor)}
            aria-pressed={on}
            aria-label={label}
            title={label}
            className={[
              "flex h-7 w-7 items-center justify-center rounded-[var(--radius-2)] transition-colors",
              on
                ? "bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] text-[var(--color-ink)]"
                : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            <Icon size={14} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}

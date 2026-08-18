import { GLIFO } from "@/components/veredito";
import { mine } from "@/lib/veredito";
import type { Slice } from "@/lib/stats";

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS GRÁFICOS DA LEITURA. Uma barra por linha, e nada mais.
 *
 *  Nasceram em app/estatisticas/page.tsx e vieram pra cá quando o perfil
 *  ganhou os mesmos cartões, em versão pequena (components/resumo-do-perfil.tsx)
 *  — inspirados no destaque do yourgamerprofile.com, traduzidos pelas regras
 *  de sempre. Um lugar só: duas telas com a MESMA barra, e não duas cópias
 *  que um dia divergem.
 *
 *  Sem pizza, sem donut, sem legenda: a barra é a única forma em que o olho
 *  compara tamanhos sem errar, e o rótulo fica do lado do dado, em vez de
 *  numa legenda que obriga a ir e voltar.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * A luz vem de `--barra-luz`, que o hover do item muda. É assim que o hover
 * funciona sem precisar ganhar do inline, o que ele nunca ganharia — o
 * conteúdo não pode depender de uma folha de estilo chegar.
 */
export function material(zero: boolean, cor: string): React.CSSProperties {
  return {
    // Valor zero: SÓ o filete, sem preenchimento. A barra existe, e é honesta:
    // sumir com a categoria que deu zero é a mentira mais fácil de um gráfico.
    background: zero
      ? "transparent"
      : `color-mix(in srgb, var(${cor}) var(--barra-luz, 30%), transparent)`,
    borderTop: `1px solid var(${cor})`,
    transition: "background 160ms ease",
  };
}

export function Barras({ dados, cor }: { dados: Slice[]; cor: string }) {
  const maior = Math.max(...dados.map((d) => d.n), 1);

  return (
    <ul className="flex flex-col gap-3.5">
      {dados.map((d) => (
        <li key={d.label} className="barra-item flex items-center gap-4">
          <span className="w-32 shrink-0 truncate text-[13px] text-[var(--color-ink-soft)]">
            {d.label}
          </span>

          <span className="flex min-w-0 flex-1 items-center">
            <span
              className="block h-2.5 shrink-0"
              style={{
                width: `${Math.max((d.n / maior) * 100, 1.5)}%`,
                ...material(d.n === 0, cor),
              }}
            />
          </span>

          <span className="tabular w-6 shrink-0 text-right text-[12px] text-[var(--color-ink-faint)]">
            {d.n}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * O QUE VOCÊ ACHOU: uma linha por palavra, do "adorei" ao "detestei", com o
 * glifo de cada uma. Os cinco degraus aparecem SEMPRE, com os zeros dentro:
 * sumir com a palavra que ninguém usou é a mentira mais fácil de um gráfico.
 *
 * E as cinco barras têm a MESMA cor de propósito: verde no "adorei" e vermelho
 * no "detestei" transformaria a palavra numa escala de semáforo, e escala vira
 * média, que é o que a nota-palavra existe para matar. Ver lib/veredito.ts.
 */
export function Vereditos({ dados }: { dados: { value: number; n: number }[] }) {
  const maior = Math.max(...dados.map((d) => d.n), 1);

  return (
    <ul className="flex flex-col gap-3.5">
      {dados.map((d) => {
        const Glifo = GLIFO[d.value as keyof typeof GLIFO];
        return (
          <li key={d.value} className="barra-item flex items-center gap-4">
            <span className="flex w-32 shrink-0 items-center gap-2.5">
              <Glifo
                size={15}
                strokeWidth={1.5}
                aria-hidden
                className="shrink-0 text-[var(--color-ink-faint)]"
              />
              <span className="truncate text-[13px] text-[var(--color-ink-soft)]">
                {mine(d.value)}
              </span>
            </span>

            <span className="flex min-w-0 flex-1 items-center">
              <span
                className="block h-2.5 shrink-0"
                style={{
                  width: `${Math.max((d.n / maior) * 100, 1.5)}%`,
                  ...material(d.n === 0, "--grafico-veredito"),
                }}
              />
            </span>

            <span className="tabular w-6 shrink-0 text-right text-[12px] text-[var(--color-ink-faint)]">
              {d.n}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

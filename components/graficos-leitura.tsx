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
 *
 *  ═══ "OS GRÁFICOS DO GUME SÃO RÚSTICOS DEMAIS" — O DONO ═══
 *
 *  A barra continua sendo a única forma (a razão acima não mudou: pizza e
 *  donut escondem a comparação honesta de tamanho atrás de ângulo, que o
 *  olho lê pior que comprimento). O que era rústico era a EXECUÇÃO: um
 *  filete fino de 30% de opacidade, achatado, com um número pequeno e
 *  cinza no fim. Print de referência: o Letterboxd, que também é tudo
 *  barra/medidor — só grossa, arredondada e com cor de verdade.
 *
 *  Três mudanças, na mesma barra: mais grossa e com as pontas arredondadas
 *  (`rounded-full`, em vez do retângulo de aresta viva), mais saturada
 *  (opacidade sobe de 30%/44% para 46%/62% — ainda é a MESMA cor por
 *  assunto, nunca cor por valor), e o número cresce e ganha peso, porque
 *  ele é dado, não rodapé.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * A luz vem de `--barra-luz`, que o hover do item muda. É assim que o hover
 * funciona sem precisar ganhar do inline, o que ele nunca ganharia — o
 * conteúdo não pode depender de uma folha de estilo chegar.
 */
export function material(zero: boolean, cor: string): React.CSSProperties {
  return {
    // Valor zero: SÓ o contorno, sem preenchimento. A barra existe, e é honesta:
    // sumir com a categoria que deu zero é a mentira mais fácil de um gráfico.
    background: zero
      ? "transparent"
      : `color-mix(in srgb, var(${cor}) var(--barra-luz, 46%), transparent)`,
    border: zero ? `1px solid var(${cor})` : `1px solid color-mix(in srgb, var(${cor}) 75%, transparent)`,
    borderRadius: 999,
    transition: "background 160ms ease",
  };
}

export function Barras({ dados, cor }: { dados: Slice[]; cor: string }) {
  const maior = Math.max(...dados.map((d) => d.n), 1);

  return (
    <ul className="flex flex-col gap-4">
      {dados.map((d) => (
        <li key={d.label} className="barra-item flex items-center gap-4">
          <span className="w-32 shrink-0 truncate text-[13px] text-[var(--color-ink-soft)]">
            {d.label}
          </span>

          <span className="flex min-w-0 flex-1 items-center">
            <span
              className="block h-3.5 shrink-0"
              style={{
                width: `${Math.max((d.n / maior) * 100, 3)}%`,
                ...material(d.n === 0, cor),
              }}
            />
          </span>

          <span className="tabular w-7 shrink-0 text-right text-[14px] font-medium text-[var(--color-ink)]">
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
    <ul className="flex flex-col gap-4">
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
                className="block h-3.5 shrink-0"
                style={{
                  width: `${Math.max((d.n / maior) * 100, 3)}%`,
                  ...material(d.n === 0, "--grafico-veredito"),
                }}
              />
            </span>

            <span className="tabular w-7 shrink-0 text-right text-[14px] font-medium text-[var(--color-ink)]">
              {d.n}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** A altura do gráfico de séculos é FIXA, e as colunas escalam dentro dela. */
const ALTURA = 132;

/**
 * OS SÉCULOS. O tempo é um eixo, então ele deita (coluna, não barra deitada —
 * ver o cabeçalho deste arquivo). Nasceu em /estatisticas e veio pra cá quando
 * o resumo do perfil também ganhou século/década.
 */
export function Seculos({ dados }: { dados: { century: number; label: string; n: number }[] }) {
  const cor = "--grafico-tempo";
  const maior = Math.max(...dados.map((d) => d.n), 1);

  return (
    <ul className="flex items-end gap-2 sm:gap-3">
      {dados.map((d) => (
        <li key={d.century} className="barra-item flex min-w-0 flex-1 flex-col items-center">
          {/* A área do gráfico: altura FIXA, e a coluna cresce de baixo para cima.
              A linha de base é a borda INFERIOR desta área, e não uma linha solta:
              assim ela nunca sai do lugar quando a coluna muda de altura. */}
          <span
            className="flex w-full flex-col justify-end border-b border-[var(--color-rule)]"
            style={{ height: ALTURA + 26 }}
          >
            {/* O número é REFERÊNCIA, e não manchete: pequeno e fraco. */}
            <span className="tabular mb-2 shrink-0 text-center text-[11px] text-[var(--color-ink-faint)]">
              {d.n}
            </span>

            {/* Largura ≈ 60% do passo: o respiro entre as colunas é o que faz o olho
                ler uma série, e não uma parede. `shrink-0` para o flex nunca comer a
                altura que a gente calculou. */}
            <span
              className="mx-auto block shrink-0"
              style={{
                // A largura também é inline, e pelo mesmo motivo do material: se a
                // classe não chegar, a coluna vira um bloco de largura inteira e o
                // respiro entre as colunas (que é o que faz o olho ler uma série)
                // desaparece.
                width: "60%",
                height: Math.round((d.n / maior) * ALTURA),
                ...material(d.n === 0, cor),
              }}
            />
          </span>

          <span className="mt-3 w-full truncate text-center text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {d.label.replace("século ", "")}
          </span>
        </li>
      ))}
    </ul>
  );
}

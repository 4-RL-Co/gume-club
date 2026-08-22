import type { CSSProperties } from "react";

/**
 * A GEOMETRIA DO LEQUE. Extraída de components/amigos-lendo.tsx, pra não
 * duplicar a mesma conta em dois lugares.
 *
 * Uma capa sozinha fica reta; várias se sobrepõem e giram um pouco, a do
 * meio por cima — o mesmo leque que já existia só em "os seus amigos estão
 * lendo" (/pessoas), agora também nos cards de "estantes para descobrir"
 * (components/explore.tsx), que antes eram uma fileira plana de capas lado
 * a lado. Ver ai/DECISIONS.md.
 *
 * Cada chamador decide como envolver a capa (link pro livro, quando tem
 * slug; ou só a imagem, quando não tem) — esta função só devolve o estilo.
 *
 * ═══ O GIRO VAI NUMA VARIÁVEL CSS, E NÃO EM `transform` ═══
 *
 * "quando coloca o mouse o leque abre um pouquinho igual nas listas" — o
 * dono. components/lista-card.tsx já tinha esse respiro no hover
 * (`.leque > *` em globals.css, animado só no `:hover` do card); aqui não
 * acontecia nada, porque o giro ESTÁTICO deste leque ia direto num
 * `transform` inline — e `style` sempre vence CSS externo, então a regra de
 * hover nunca tinha chance de aparecer. Com o giro numa custom property
 * (`--giro`), a regra base do CSS lê a variável em repouso, e a regra de
 * hover soma o giro extra por cima — os dois convivem no mesmo `transform`.
 */
export function estiloDoLeque(i: number, n: number): CSSProperties {
  const meio = (n - 1) / 2;
  const giro = n === 1 ? 0 : (i - meio) * 7;
  return {
    marginLeft: i === 0 ? 0 : -34,
    ["--giro" as string]: `${giro}deg`,
    zIndex: n - Math.abs(i - meio),
  } as CSSProperties;
}

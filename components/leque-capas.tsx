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
 */
export function estiloDoLeque(i: number, n: number): CSSProperties {
  const meio = (n - 1) / 2;
  const giro = n === 1 ? 0 : (i - meio) * 7;
  return {
    marginLeft: i === 0 ? 0 : -34,
    transform: `rotate(${giro}deg)`,
    zIndex: n - Math.abs(i - meio),
  };
}

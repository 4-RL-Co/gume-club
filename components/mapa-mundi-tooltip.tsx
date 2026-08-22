"use client";

import { useState, type ReactNode, type MouseEvent } from "react";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O TOOLTIP DO MAPA. "tem que ser possível colocar o mouse em cima do
 *  país e ver o número" — o dono. O `<title>` nativo do SVG (que já
 *  existia) técnicamente faz isso, mas o navegador demora quase um
 *  segundo pra mostrar, sem estilo nenhum — na prática, "não dá pra ver".
 *
 *  ═══ POR QUE ISTO É "use client" E O MAPA CONTINUA SENDO SERVIDOR ═══
 *
 *  components/mapa-mundi.tsx desenha os 175 países no SERVIDOR de
 *  propósito: são ~160KB de caminho SVG, e viraram HTML pronto — nunca um
 *  array que o navegador precisa BAIXAR E RODAR. Se este tooltip
 *  importasse os dados do mapa pra "saber" o que está sob o mouse, aquele
 *  cuidado todo iria pro lixo.
 *
 *  Em vez disso, este wrapper não sabe NADA sobre países. Ele escuta o
 *  mouse em cima do `<svg>` que o servidor já mandou pronto, olha os
 *  atributos `data-pais`/`data-n` do elemento embaixo do cursor (que
 *  também vieram do servidor, junto com o desenho) e só then desenha um
 *  balão. Delegação de evento: o dado mora no DOM, não no JavaScript.
 * ════════════════════════════════════════════════════════════════════
 */
export function MapaMundiTooltip({ children }: { children: ReactNode }) {
  const [dica, setDica] = useState<{ texto: string; x: number; y: number } | null>(null);

  const mover = (e: MouseEvent<HTMLDivElement>) => {
    const alvo = e.target as SVGElement;
    const pais = alvo.getAttribute?.("data-pais");
    if (!pais) {
      setDica(null);
      return;
    }
    const n = alvo.getAttribute("data-n");
    const rect = e.currentTarget.getBoundingClientRect();
    setDica({
      texto: n ? `${pais}: ${n}` : pais,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      className="relative"
      onMouseMove={mover}
      onMouseLeave={() => setDica(null)}
    >
      {children}

      {dica && (
        <span
          aria-hidden
          className="tabular pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-[var(--radius-control)] bg-[var(--color-ink)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--color-canvas)] shadow-lg"
          style={{ left: dica.x, top: dica.y }}
        >
          {dica.texto}
        </span>
      )}
    </div>
  );
}

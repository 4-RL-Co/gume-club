import Link from "next/link";
import { Trophy } from "lucide-react";
import { DOURADO } from "@/lib/dourado";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A MEDALHA DE COLEÇÃO COMPLETA. Vaza o card, não fica escrita ao lado.
 *
 *  Antes disto, "completa" era uma pill de texto: borda + palavra + ícone. O
 *  dono pediu uma medalha de verdade — "meio overflow com o container, não só
 *  escrito". Este componente reaproveita a TÉCNICA de verniz+bisel+glow de
 *  `components/badges.tsx` (`Placa`), replicada aqui à mão, NUNCA importada de
 *  lá: isto não é insígnia, não mora em `lib/badges-view.ts`, e não entra no
 *  sistema OKLCH travado por `lib/paleta.test.ts` (que já está matematicamente
 *  cheio — ver ai/DECISIONS.md). É o mesmo acabamento, um objeto diferente.
 *
 *  Duas diferenças deliberadas em relação a uma insígnia:
 *   - GIRA (6-10°). Uma insígnia nunca gira — fica alinhada ao grid, como um
 *     selo oficial. Esta medalha pende torta, como um objeto pendurado por um
 *     fio, porque ela avisa uma conquista pessoal, não confere uma honraria.
 *   - Tem sombra própria NÃO-inset (flutua sobre o que está atrás). Uma
 *     insígnia fica nivelada com a superfície que a contém; esta medalha paira
 *     sobre a borda do card, então precisa parecer que está na frente dele.
 *
 *  `href` decide a raiz: com endereço, é link (o card compacto, que leva à
 *  página da coleção); sem, é só `<span role="img">` decorativo (a própria
 *  página da coleção, onde a medalha já está no lugar que ela indicaria).
 * ════════════════════════════════════════════════════════════════════
 */

const VERNIZ_TOPO = 0.78;
const VERNIZ_BASE = 0.46;
const BISEL_LUZ = 0.45;
const BISEL_SOMBRA = 0.45;
const BORDA = 1.5;
const GLOW_RAIO = 18;
const GLOW_ALPHA = 0.32;

function mix(alpha: number) {
  return `color-mix(in srgb, ${DOURADO} ${Math.round(alpha * 100)}%, var(--surface-1))`;
}

export function SeloColecionador({
  href,
  tamanho = 32,
  girar = 8,
}: {
  href?: string;
  tamanho?: number;
  girar?: number;
}) {
  const conteudo = (
    <span
      className="group relative inline-flex shrink-0 items-center justify-center rounded-full align-middle"
      style={{
        width: tamanho,
        height: tamanho,
        transform: `rotate(${girar}deg)`,
        background: `linear-gradient(165deg, ${mix(VERNIZ_TOPO)}, ${mix(VERNIZ_BASE)})`,
        boxShadow: [
          `inset 0 1px 0 rgb(255 255 255 / ${BISEL_LUZ})`,
          `inset 0 -1px 0 rgb(0 0 0 / ${BISEL_SOMBRA})`,
          `inset 0 0 0 ${BORDA}px color-mix(in srgb, ${DOURADO} 55%, transparent)`,
          `0 2px 6px rgb(0 0 0 / 0.35)`,
          `0 0 ${GLOW_RAIO}px color-mix(in srgb, ${DOURADO} ${Math.round(GLOW_ALPHA * 100)}%, transparent)`,
        ].join(", "),
      }}
      role="img"
      aria-label="coleção completa"
    >
      <Trophy
        size={Math.round(tamanho * 0.44)}
        strokeWidth={1.75}
        style={{ color: "color-mix(in srgb, " + DOURADO + " 25%, white)" }}
        aria-hidden
      />

      {/* O rótulo mora só no balão do hover — igual à Placa de badges.tsx. */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max -translate-x-1/2 group-hover:block"
        style={{ transform: `translateX(-50%) rotate(${-girar}deg)` }}
      >
        <span
          className="surface block px-2.5 py-1.5 text-[11px] uppercase tracking-[0.1em]"
          style={{ color: DOURADO }}
        >
          coleção completa
        </span>
      </span>
    </span>
  );

  if (!href) return conteudo;

  return (
    <Link href={href} aria-label="coleção completa, ver a página desta coleção">
      {conteudo}
    </Link>
  );
}

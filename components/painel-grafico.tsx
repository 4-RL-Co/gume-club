"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import type { Ponto } from "@/lib/painel";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O GRÁFICO DE SÉRIE DO PAINEL, AGORA COM RECHARTS. A lib nunca aparece com
 *  a cara dela.
 *
 *  ═══ POR QUE UMA LIB AQUI, E SÓ AQUI ═══
 *
 *  `/painel` é 404 (não 403) pra quem não é o idealizador (`app/painel/page.tsx`),
 *  e o link da sidebar só existe pra ele. Ninguém mais baixa ou prefetcha esta rota
 *  — o peso do Recharts é pago só pela sessão do dono, nunca por um leitor real. E
 *  `/painel` já é a única exceção documentada à identidade austera do resto do app
 *  (ver o comentário no topo de components/painel.tsx, e a allowlist em
 *  lib/voice.test.ts). Fora daqui, Recharts não entra: `Distribuicao` e `Divisao`
 *  em components/painel.tsx são barras simples sem eixo real, e uma lib de gráfico
 *  não acrescentaria nada além de trocar CSS por SVG de terceiro pro mesmo resultado.
 *
 *  ═══ A REGRA: NUNCA A CARA DO RECHARTS ═══
 *
 *  Legenda, tooltip e eixo Y do Recharts têm uma cara própria — a mesma em
 *  qualquer app que o usa, e ela destoaria do resto do Gume na hora. Por isso:
 *  legenda desligada, `Tooltip` com `content` totalmente customizado (nunca o
 *  balão default da lib), eixo Y sem linha/traço próprio, grid sólido (nunca
 *  pontilhado, que é a cara padrão do Recharts).
 *
 *  O SVG `<text>` do Recharts NÃO herda `font-family` da página sozinho — por
 *  isso o `fontFamily` vai explícito no `tick` dos dois eixos.
 * ════════════════════════════════════════════════════════════════════
 */

const ACCENT = "var(--color-accent)";
const NF = new Intl.NumberFormat("pt-BR");

const TICK = {
  fontSize: 10,
  fill: "var(--color-ink-faint)",
  fontFamily: "var(--font-chrome)",
};

function Balao({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;
  const valor = payload[0]?.value;

  return (
    <div className="surface px-3 py-2">
      <div className="tabular text-[13px] font-semibold text-[var(--color-ink)]">
        {typeof valor === "number" ? NF.format(valor) : valor}
      </div>
      <div className="text-[12px] text-[var(--color-ink-faint)]">{label}</div>
    </div>
  );
}

export function GraficoSerie({ pontos }: { pontos: Ponto[] }) {
  if (pontos.length === 0) {
    return <div className="text-[13px] text-[var(--color-ink-faint)]">sem dados no período</div>;
  }

  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pontos} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.28} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid horizontal vertical={false} stroke="var(--color-rule)" />

          <XAxis dataKey="chave" tick={TICK} axisLine={{ stroke: "var(--color-rule)" }} tickLine={false} />

          {/* Sem linha/traço próprio: só os números, alinhados como a versão à mão
              fazia (0, metade, teto). */}
          <YAxis
            width={34}
            tick={TICK}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickCount={3}
            tickFormatter={(v: number) => NF.format(v)}
          />

          <Tooltip
            content={Balao}
            cursor={{ stroke: "var(--color-ink-faint)", strokeDasharray: "3 3" }}
          />

          <Area
            type="monotone"
            dataKey="n"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#areaFill)"
            dot={false}
            activeDot={{ r: 4, fill: ACCENT, stroke: "var(--surface-1)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

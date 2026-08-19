import { FORMAS_DO_MUNDO, LARGURA_DO_MAPA, ALTURA_DO_MAPA } from "@/lib/mapa-mundi-formas";
import { paisPorNome } from "@/lib/pais-iso";
import type { Slice } from "@/lib/stats";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O MAPA MÚNDI. "em países, pq não fazemos um mapa mundi com um heatmap?"
 *  — o dono.
 *
 *  As formas vêm PRONTAS de lib/mapa-mundi-formas.ts (gerado uma vez por
 *  scripts/gerar-mapa-mundi.mjs — ver o cabeçalho dele). Este componente só
 *  lê a lista e desenha; nenhum d3-geo, nenhum topojson-client entra no
 *  bundle, e nada é recalculado a cada visita.
 *
 *  ═══ POR QUE A INTENSIDADE DA COR AQUI NÃO QUEBRA "COR NUNCA É POR
 *      VALOR" ═══
 *
 *  A regra de components/graficos-leitura.tsx ("todas as barras de um
 *  gráfico têm a MESMA cor — quem compara é o comprimento") é sobre BARRA:
 *  ali, pintar cada barra de um jeito diferente transformaria a categoria
 *  num placar. Um mapa de calor é outra forma, com outra pergunta: não há
 *  "comprimento" a comparar, só geografia. A intensidade da MESMA cor
 *  (verde — o mesmo `--grafico-paises` da barra de nacionalidades) é a
 *  única linguagem que um heatmap tem, e ela mede quantos livros vieram
 *  daquele país — nunca a qualidade dos autores de lá.
 *
 *  ═══ O QUE NÃO BATE FICA CINZA, NUNCA SOME ═══
 *
 *  Uma nacionalidade que o Gume reconhece pelo NOME mas não tem no mapa
 *  (`lib/pais-iso.ts` não é o mundo inteiro) simplesmente não teria onde
 *  pintar — o resto do mundo continua desenhado, só sem cor. Ver
 *  paisPorNome(): ela nunca inventa um país que o texto não disse.
 * ════════════════════════════════════════════════════════════════════
 */
export function MapaMundi({ dados }: { dados: Slice[] }) {
  const porIso2 = new Map<string, number>();
  for (const d of dados) {
    const pais = paisPorNome(d.label);
    if (pais) porIso2.set(pais.iso2, (porIso2.get(pais.iso2) ?? 0) + d.n);
  }

  const maior = Math.max(...porIso2.values(), 1);

  return (
    <svg
      role="img"
      aria-label="mapa múndi, com os países de onde vêm os autores mais escuros"
      viewBox={`0 0 ${LARGURA_DO_MAPA} ${ALTURA_DO_MAPA}`}
      className="w-full"
    >
      {FORMAS_DO_MUNDO.map((f) => {
        const n = f.iso2 ? porIso2.get(f.iso2) : undefined;
        return (
          <path
            key={f.numerico ?? f.d.slice(0, 12)}
            d={f.d}
            stroke="var(--color-rule)"
            strokeWidth={0.5}
            fill={
              n
                ? `color-mix(in srgb, var(--grafico-paises) ${Math.round((n / maior) * 75) + 15}%, transparent)`
                : "transparent"
            }
          >
            {f.pt && <title>{n ? `${f.pt}: ${n}` : f.pt}</title>}
          </path>
        );
      })}
    </svg>
  );
}

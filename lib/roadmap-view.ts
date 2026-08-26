/**
 * O vocabulário de "o que vem por aí". SEM banco de dados dentro.
 *
 * Componente cliente (components/painel-roadmap.tsx) lê daqui — mesmo desenho de
 * lib/shelf-view.ts e lib/corrections-view.ts: importar lib/roadmap.ts (que fala com o
 * Postgres) de dentro de um "use client" arrasta o driver do banco para o navegador
 * inteiro, e o build quebra, que é o comportamento certo.
 */

export type RoadmapStatus = "ideia" | "planejado" | "em_andamento" | "lancado";

/**
 * Os rótulos, em português de leitor — a página pública (/o-que-vem) e a aba do painel
 * usam o MESMO texto, pra nunca divergir em como um status se chama.
 */
export const STATUS_LABEL: Record<RoadmapStatus, string> = {
  ideia: "Ideia",
  planejado: "Planejado",
  em_andamento: "Em andamento",
  lancado: "Lançado",
};

/**
 * A ordem em que os status aparecem em /o-que-vem: o mais concreto primeiro. "lancado"
 * nunca entra aqui, nem no tipo: ele mora em /o-que-chegou, e não nesta lista.
 */
export const STATUS_ABERTOS: readonly Exclude<RoadmapStatus, "lancado">[] = ["em_andamento", "planejado", "ideia"];

export type RoadmapItem = {
  id: string;
  title: string;
  description: string | null;
  status: RoadmapStatus;
  position: number;
  /** Quantos votos o item já recebeu, somando todos os anos — o sinal cumulativo. */
  votos: number;
  /** Este viewer já votou neste item, ESTE ano? Decide se o botão oferece votar ou tirar. */
  viewerVotou: boolean;
};

export type ChangelogItem = {
  id: string;
  title: string;
  description: string | null;
  lancadoEm: Date;
};

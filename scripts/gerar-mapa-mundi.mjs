// @ts-nocheck
/**
 * ════════════════════════════════════════════════════════════════════
 *  GERA O MAPA MÚNDI, UMA VEZ. Não roda em produção.
 *
 *  "em países, pq não fazemos um mapa mundi com um heatmap?" — o dono.
 *
 *  world-atlas (dados do Natural Earth, domínio público) + topojson-client +
 *  d3-geo fazem a projeção geográfica UMA VEZ aqui, offline, e o resultado —
 *  uma lista de países com o caminho SVG já calculado — é commitado em
 *  lib/mapa-mundi-formas.ts. Em produção, ninguém importa d3-geo nem
 *  topojson-client: o componente do mapa (components/mapa-mundi.tsx) só lê
 *  a lista pronta e desenha `<path d={...}>`. Nenhum desses dois pacotes
 *  vai pro bundle do cliente nem roda a cada visita — mesmo espírito dos
 *  scripts/backfill-*.mjs, que enriquecem o catálogo uma vez e vão embora.
 *
 *  Reexecutar: node scripts/gerar-mapa-mundi.mjs
 *  (só precisa rodar de novo se o Natural Earth atualizar as fronteiras).
 * ════════════════════════════════════════════════════════════════════
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as topojson from "topojson-client";
import { geoEqualEarth, geoPath } from "d3-geo";
import topo from "world-atlas/countries-110m.json" with { type: "json" };
import { PAIS_POR_NUMERICO } from "../lib/pais-iso.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Antártida e as terras austrais francesas comem espaço vertical e nenhum
// autor tem essas nacionalidades — fora do mapa, como todo mapa-múndi editorial faz.
const FORA = new Set(["010", "260"]);

const geo = topojson.feature(topo, topo.objects.countries);
const paises = geo.features.filter((f) => !FORA.has(f.id ?? ""));

const LARGURA = 960;
const ALTURA = 480;

const projecao = geoEqualEarth().fitSize([LARGURA, ALTURA], {
  type: "FeatureCollection",
  features: paises,
});
const caminho = geoPath(projecao);

const formas = paises.map((f) => {
  const numerico = f.id ?? null;
  const conhecido = numerico ? PAIS_POR_NUMERICO[numerico] : undefined;
  return {
    numerico,
    iso2: conhecido?.iso2 ?? null,
    pt: conhecido?.pt ?? null,
    // Países que o world-atlas não deu id (Kosovo, N. Chipre, Somalilândia):
    // o desenho entra, cinza pra sempre — não inventamos um código pra eles.
    nomeIngles: f.properties.name,
    d: caminho(f),
  };
});

const semCodigo = formas.filter((f) => !f.numerico || !f.iso2);
if (semCodigo.length) {
  console.log(`${semCodigo.length} território(s) sem código ISO (ficam cinza no mapa):`);
  for (const s of semCodigo) console.log(`  - ${s.nomeIngles}`);
}

const conteudo = `/**
 * GERADO por scripts/gerar-mapa-mundi.mjs — NÃO EDITE À MÃO.
 *
 * As fronteiras vêm do Natural Earth (domínio público), via world-atlas
 * (110m, o recorte mais leve — este é um mapa de calor, não um atlas).
 * Reexecute o script pra atualizar. Ver o cabeçalho dele pra saber por quê
 * isto existe como arquivo estático em vez de calculado a cada visita.
 */
export type FormaDoPais = {
  /** ISO 3166-1 numérico, ou \`null\` pros três territórios sem código (Kosovo, N. Chipre, Somalilândia). */
  numerico: string | null;
  iso2: string | null;
  /** O nome em português, na mesma grafia de lib/pais-iso.ts — \`null\` junto com o iso2. */
  pt: string | null;
  /** O caminho SVG, já projetado. */
  d: string;
};

export const LARGURA_DO_MAPA = ${LARGURA};
export const ALTURA_DO_MAPA = ${ALTURA};

export const FORMAS_DO_MUNDO: FormaDoPais[] = ${JSON.stringify(
  formas.map(({ numerico, iso2, pt, d }) => ({ numerico, iso2, pt, d })),
  null,
  2,
)};
`;

const destino = join(__dirname, "..", "lib", "mapa-mundi-formas.ts");
writeFileSync(destino, conteudo);
console.log(`\n${formas.length} países escritos em lib/mapa-mundi-formas.ts`);

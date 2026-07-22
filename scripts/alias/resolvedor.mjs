import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** A raiz do projeto: este arquivo mora em scripts/alias/, então dois níveis acima. */
const RAIZ = new URL("../../", import.meta.url);

const TERMINACOES = [".ts", ".tsx", "/index.ts", ".mjs", ".js", ""];

function tentar(base, caminho) {
  for (const fim of TERMINACOES) {
    const url = new URL(caminho + fim, base);
    if (existsSync(fileURLToPath(url))) return url.href;
  }
  return null;
}

/**
 * Dois costumes do TypeScript que o Node ESM não fala:
 *  1. o alias "@/lib/datas" do tsconfig;
 *  2. o import relativo sem extensão ("./schema"), que o Next resolve sozinho.
 * O app usa os dois, e reusar as funções do app num script exige traduzi-los.
 */
export async function resolve(especificador, contexto, seguinte) {
  if (especificador.startsWith("@/")) {
    const achado = tentar(RAIZ, especificador.slice(2));
    if (achado) return seguinte(achado, contexto);
  }

  if ((especificador.startsWith("./") || especificador.startsWith("../")) && contexto.parentURL) {
    const achado = tentar(contexto.parentURL, especificador);
    if (achado) return seguinte(achado, contexto);
  }

  return seguinte(especificador, contexto);
}

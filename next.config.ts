import type { NextConfig } from "next";
import { FONTES_DE_IMAGEM } from "./lib/imagens";

/**
 * ═══ OS PADRÕES DE IMAGEM VÊM DE lib/imagens.ts, E NÃO DAQUI ═══
 *
 * A mesma lista alimenta a CSP (img-src) e o otimizador: uma origem nova de capa
 * entra em UM lugar e vale nos dois. Quando as listas eram duas, elas divergiram
 * (o config conhecia seis hosts, a CSP onze), e a capa que passava numa porta
 * morria na outra.
 *
 * O "*." da lista vira "**." aqui porque o otimizador distingue um nível de
 * subdomínio (*) de qualquer profundidade (**), e o archive.org aninha
 * subdomínios (ia903102.us.archive.org).
 */
const config: NextConfig = {
  reactStrictMode: true,
  /**
   * /colecoes virou /listas (ver ai/DECISIONS.md): duas coisas com quase o mesmo
   * nome no mesmo perfil — a coleção (o que você TEM, em /colecao) e a coleção
   * montada à mão (estilo Letterboxd) — e só uma podia ficar com a palavra. Quem
   * ainda tem o endereço velho salvo, ou clica num link antigo, chega no lugar
   * certo em vez de num 404.
   */
  async redirects() {
    return [{ source: "/colecoes", destination: "/listas", permanent: true }];
  },
  images: {
    remotePatterns: FONTES_DE_IMAGEM.map((f) => ({
      protocol: "https" as const,
      hostname: f.host.startsWith("*.") ? `**.${f.host.slice(2)}` : f.host,
    })),
    /**
     * Capa de livro é imutável na prática: a MESMA URL nunca muda de imagem (capa
     * nova é edição nova, e é a regra do catálogo). Um mês de cache faz o primeiro
     * visitante pagar a Open Library e todos os seguintes receberem do nosso
     * servidor, pequeno e já no tamanho certo.
     */
    minimumCacheTTL: 2678400,
    formats: ["image/webp"],
  },
};

export default config;

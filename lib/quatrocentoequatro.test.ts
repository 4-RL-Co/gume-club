import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM ESQUELETO DE CARREGAMENTO NÃO PODE CUSTAR O 404.
 *
 *  ═══ O BUG ═══
 *
 *  Um endereço de livro que não existe — um link velho, um slug errado, um livro que
 *  saiu na poda — abria uma **página em branco**. Só a barra lateral, e nada no meio.
 *  Nem erro, nem aviso: o app parecia quebrado.
 *
 *  E ele devolvia **200**, dizendo ao Google "esta página existe, pode indexar" sobre
 *  um livro que não existe. Num catálogo de 267 mil obras, isso é um convite a encher
 *  a busca do Google de fantasmas.
 *
 *  ═══ A CAUSA ═══
 *
 *  `app/livro/[slug]/loading.tsx`.
 *
 *  Um `loading.tsx` cria uma fronteira de streaming: o Next manda o cabeçalho `200`
 *  pela rede **antes** de a página resolver. Depois disso, o `notFound()` não tem mais
 *  como mudar o status — os bytes já foram.
 *
 *  A página do autor, ao lado, não tinha `loading.tsx`, e sempre devolveu 404
 *  direitinho. Dois arquivos irmãos, dois comportamentos, e nenhum aviso.
 *
 *  ═══ POR QUE UM TESTE ═══
 *
 *  Porque a próxima pessoa que quiser um esqueleto bonito numa rota vai criar um
 *  `loading.tsx` sem saber de nada disto — e o 404 vai morrer em silêncio, de novo, sem
 *  ninguém perceber por meses.
 *
 *  É a regra deste repo: documento não defende código.
 * ════════════════════════════════════════════════════════════════════
 */

/** Toda pasta de rota que tem uma page.tsx. */
function rotas(raiz = "app"): string[] {
  const achadas: string[] = [];

  const andar = (pasta: string) => {
    for (const nome of readdirSync(pasta)) {
      const caminho = join(pasta, nome);
      if (!statSync(caminho).isDirectory()) continue;
      if (existsSync(join(caminho, "page.tsx"))) achadas.push(caminho);
      andar(caminho);
    }
  };

  if (existsSync(raiz)) andar(raiz);
  return achadas;
}

describe("o 404", () => {
  it("nenhuma rota que pode não existir tem loading.tsx", () => {
    const quebradas: string[] = [];

    for (const rota of rotas()) {
      const page = readFileSync(join(rota, "page.tsx"), "utf8");

      // A rota chama notFound()? Então ela PODE não existir, e o status importa.
      if (!/\bnotFound\(\)/.test(page)) continue;

      /**
       * ═══ O `loading.tsx` DO PAI TAMBÉM CONTA ═══
       *
       * A primeira versão deste teste só olhava a pasta da própria rota, e passou —
       * enquanto `/estante/algum-perfil-que-nao-existe` continuava devolvendo 200.
       *
       * O culpado era `app/estante/loading.tsx`, um segmento ACIMA. Um loading.tsx vale
       * para a rota dele **e para tudo abaixo dela**: a fronteira de streaming é
       * herdada, e o 200 vai pela rede do mesmo jeito.
       *
       * Um teste que só olha para a própria pasta é um teste que dá o verde errado.
       */
      for (let pasta = rota; pasta.startsWith("app"); ) {
        if (existsSync(join(pasta, "loading.tsx"))) {
          quebradas.push(
            `${rota} chama notFound(), e ${pasta}/loading.tsx abre uma fronteira de ` +
              "streaming acima dela: o 200 vai pela rede antes, e o 404 morre. " +
              "Ponha o esqueleto num <Suspense> dentro da página.",
          );
          break;
        }
        const acima = pasta.split("/").slice(0, -1).join("/");
        if (!acima || acima === pasta) break;
        pasta = acima;
      }
    }

    expect(quebradas).toEqual([]);
  });

  /**
   * ═══ E QUEM PODE NÃO EXISTIR TEM QUE DIZER ISSO EM PORTUGUÊS ═══
   *
   * Sem um `not-found.tsx`, o `notFound()` cai no padrão do Next — e o padrão do Next,
   * dentro do nosso layout, renderizava **nada**. Uma página em branco não é uma
   * resposta: é o app parecendo quebrado.
   *
   * A rota de perfil (`/@handle`) fica de fora: um handle que não existe é uma pessoa
   * que não existe, e essa página já trata isso por conta própria.
   */
  it("toda rota que chama notFound() tem uma página de 'não achamos'", () => {
    const mudas: string[] = [];

    for (const rota of rotas()) {
      const page = readFileSync(join(rota, "page.tsx"), "utf8");
      if (!/\bnotFound\(\)/.test(page)) continue;

      // Um not-found.tsx na rota, ou em qualquer pasta acima dela, serve.
      let pasta = rota;
      let tem = false;
      while (pasta.startsWith("app")) {
        if (existsSync(join(pasta, "not-found.tsx"))) {
          tem = true;
          break;
        }
        const acima = pasta.split("/").slice(0, -1).join("/");
        if (acima === pasta || !acima) break;
        pasta = acima;
      }

      if (!tem) mudas.push(rota);
    }

    expect(mudas).toEqual([]);
  });
});

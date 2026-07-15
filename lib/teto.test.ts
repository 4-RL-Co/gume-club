import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LIMITS } from "@/lib/limits";

/**
 * ════════════════════════════════════════════════════════════════════
 *  NENHUM CAMPO DE TEXTO CORTA CALADO.
 *
 *  ═══ O BUG ═══
 *
 *  "A descrição eu colo inteira e ela vai cortada. Se tem limitação de caracteres, tem
 *  que ser visível e travar quando bater, para a pessoa ajustar — e não colar tudo e se
 *  surpreender depois."
 *
 *  Era verdade em quatro lugares ao mesmo tempo:
 *
 *      a bio do autor      cortada em 280   sem uma palavra
 *      a RESENHA           cortada em 20 mil   sem uma palavra
 *      a denúncia          cortada em 280   sem uma palavra
 *      a lista colada      cortada em 100 linhas   sem uma palavra
 *
 *  O `clamp()` do servidor está certo e continua lá: ele é a defesa contra um POST que
 *  não passa por formulário nenhum, e sem ele um "colar" errado põe cinquenta megabytes
 *  no banco. O que estava errado é o formulário DEIXAR A PESSOA ACHAR QUE COUBE.
 *
 *  ═══ AS DUAS LEIS QUE ESTE TESTE SEGURA ═══
 *
 *  1. Todo campo de texto tem `maxLength`. Sem exceção não escrita.
 *  2. E o `maxLength` vem do `LIMITS`, e nunca de um número digitado na tela: um 280 na
 *     tela e um 280 no servidor são dois números que um dia discordam — e no dia em que
 *     discordarem, o texto volta a sumir sem avisar.
 * ════════════════════════════════════════════════════════════════════
 */

/** Todo componente e toda tela. */
function telas(): { caminho: string; texto: string }[] {
  const achados: { caminho: string; texto: string }[] = [];

  const andar = (pasta: string) => {
    for (const nome of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = join(pasta, nome.name);
      if (nome.isDirectory()) {
        andar(caminho);
        continue;
      }
      if (!nome.name.endsWith(".tsx") || nome.name.includes(".test.")) continue;
      achados.push({ caminho, texto: readFileSync(caminho, "utf8") });
    }
  };

  for (const raiz of ["app", "components"]) andar(raiz);
  return achados;
}

/**
 * O código, sem os comentários.
 *
 * Este repo já escreveu — mais de uma vez — um teste que leu um comentário como se fosse
 * código, acusou a própria explicação do conserto, e ficou verde para sempre olhando para
 * o nada. Os comentários saem antes de qualquer varredura.
 */
function semComentarios(texto: string): string {
  return texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("os campos de texto", () => {
  it("existem, e o teste está mesmo olhando para eles", () => {
    const comCampo = telas().filter((t) => /<textarea|<input/.test(semComentarios(t.texto)));
    expect(comCampo.length).toBeGreaterThanOrEqual(5);
  });

  /**
   * ═══ TODO `<textarea>` TEM TETO ═══
   *
   * O `<textarea>` é onde mora o texto longo, e é onde o corte silencioso dói: a pessoa
   * escreveu, e perdeu o que escreveu.
   *
   * `components/campo.tsx` é a exceção porque é ELE quem põe o `maxLength` — e ele o põe
   * a partir de um `teto` que quem o usa é obrigado a passar.
   */
  it("todo textarea trava num teto", () => {
    const soltos: string[] = [];

    for (const { caminho, texto } of telas()) {
      if (caminho.endsWith("components/campo.tsx")) continue;

      const codigo = semComentarios(texto);

      // Cada `<textarea` e o que vem até o fecho da tag.
      for (const m of codigo.matchAll(/<textarea\b[\s\S]*?\/?>/g)) {
        if (!m[0].includes("maxLength")) {
          soltos.push(
            `${caminho} → um <textarea> sem maxLength. O servidor vai cortar o texto, e a ` +
              "pessoa só vai descobrir depois de salvar. Use <Campo> (components/campo.tsx).",
          );
        }
      }
    }

    expect(soltos).toEqual([]);
  });

  /**
   * ═══ O TETO VEM DO `LIMITS` ═══
   *
   * Um número digitado na tela é uma cópia do número do servidor. Cópias divergem. E a
   * divergência aqui não dá erro nenhum: ela só faz o texto sumir.
   */
  it("nenhum teto é um número digitado à mão", () => {
    const naMao: string[] = [];

    for (const { caminho, texto } of telas()) {
      const codigo = semComentarios(texto);

      for (const m of codigo.matchAll(/maxLength=\{(\d+)\}/g)) {
        const numero = Number(m[1]);

        /**
         * A ÚNICA EXCEÇÃO, e ela precisa de um motivo: o código que chega por e-mail tem
         * seis dígitos porque o Better Auth o gera com seis dígitos. Não é um teto de
         * texto — é o tamanho exato de uma coisa que não é texto. Não existe `LIMITS`
         * para ele, e inventar um seria fingir que a tela manda no tamanho do código.
         */
        const ehOCodigo = numero === 6 && caminho.includes("codigo-email");
        if (ehOCodigo) continue;

        naMao.push(
          `${caminho} → maxLength={${numero}} escrito à mão. Use LIMITS: um número na tela e ` +
            "outro no servidor é um texto que some sem avisar no dia em que os dois discordarem.",
        );
      }
    }

    expect(naMao).toEqual([]);
  });

  /**
   * ═══ A BIO DO AUTOR NÃO É UM TWEET ═══
   *
   * A tela pede "quem foi essa pessoa, em um parágrafo", e o teto era de 280 caracteres —
   * o mesmo da linha de perfil. Quem escrevesse o parágrafo que a tela pediu tinha o
   * parágrafo decepado.
   *
   * Um pedido e um teto que se contradizem são um formulário mentindo.
   */
  it("o teto da bio do autor cabe um parágrafo, e não uma linha", () => {
    expect(LIMITS.authorBio).toBeGreaterThanOrEqual(1_000);
    expect(LIMITS.authorBio).toBeGreaterThan(LIMITS.bio);
  });
});

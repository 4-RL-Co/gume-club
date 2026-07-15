import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A LÂMINA NÃO É A COR DE PERIGO. E NUNCA MAIS VAI SER.
 *
 *  ═══ O ACIDENTE QUE FUNCIONOU POR ANOS ═══
 *
 *  O Gume tinha UM token de cor: `--color-accent`, um vermelho-tijolo.
 *
 *  E ele fazia duas coisas ao mesmo tempo sem ninguém notar: era a marca do app, e
 *  era o vermelho de perigo. Funcionava por ACIDENTE — vermelho passa por perigo, e
 *  ninguém percebeu que eram dois trabalhos num crachá só.
 *
 *  No dia em que o accent virou **verde-água** (#7DD3C0, a lâmina), o acidente virou
 *  bug, e um bug feio:
 *
 *      "apagar a estante? os livros ficam."   →  ficaria VERDE-MENTA
 *      "tirar 12 livros da estante?"          →  idem
 *      "banir"                                →  idem
 *
 *  Verde diz "pode ir, está tudo bem". Essas frases dizem o contrário — e **um botão
 *  que se lê ao contrário do que faz é o pior tipo de botão que existe.**
 *
 *  ═══ E O TEXTO BRANCO EM CIMA ═══
 *
 *  `bg-accent text-white` era legível com o vermelho-tijolo. Branco sobre verde-água
 *  não se lê. Não é acabamento: é a diferença entre um botão que a pessoa consegue ler
 *  e um que ela não consegue.
 *
 *  ═══ AS TRÊS COISAS SÃO TRÊS TOKENS ═══
 *
 *      --color-accent      a MARCA. link, selecionado, moldura. É o Gume falando.
 *      --color-perigo      a SEMÂNTICA. isto deu errado, ou isto não tem volta.
 *      --color-on-accent   o que se escreve EM CIMA do accent.
 * ════════════════════════════════════════════════════════════════════
 */

/** Toda tela e todo componente. */
function telas(): { caminho: string; texto: string }[] {
  const achados: { caminho: string; texto: string }[] = [];

  const andar = (pasta: string) => {
    for (const nome of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = join(pasta, nome.name);
      if (nome.isDirectory()) {
        andar(caminho);
      } else if (nome.name.endsWith(".tsx")) {
        achados.push({ caminho, texto: readFileSync(caminho, "utf8") });
      }
    }
  };

  for (const raiz of ["app", "components"]) andar(raiz);
  return achados;
}

/** As palavras que só aparecem quando alguma coisa apaga, tira, bane ou desfaz. */
const PERIGO = /\b(apagar|apague|banir|banido|excluir|remover|reverter|recusar|tirar|deletar|sair da conta|não tem volta|desfazer .*permanente)\b/i;

describe("a cor", () => {
  /**
   * ═══ NENHUM BOTÃO DE PERIGO USA O ACCENT ═══
   *
   * O teste procura a FORMA do erro: um elemento que usa `--color-accent` e que tem,
   * na mesma vizinhança, uma palavra de destruição.
   *
   * É uma heurística, e ela é de propósito FROUXA na direção segura: um falso positivo
   * custa cinco segundos de leitura; um falso negativo é um botão verde que apaga a
   * estante de alguém.
   */
  it("nenhum botão que apaga, tira ou bane usa a cor da marca", () => {
    const errados: string[] = [];

    for (const { caminho, texto } of telas()) {
      const linhas = texto.split("\n");

      for (let i = 0; i < linhas.length; i++) {
        if (!linhas[i]!.includes("--color-accent")) continue;

        // A vizinhança: o que essa coisa DIZ. Um rótulo de perigo perto de uma cor de
        // marca é um botão que se lê ao contrário do que faz.
        const volta = linhas.slice(Math.max(0, i - 8), i + 8).join("\n");
        if (PERIGO.test(volta)) {
          errados.push(`${caminho}:${i + 1} — cor da marca num botão de perigo`);
        }
      }
    }

    expect(errados).toEqual([]);
  });

  /**
   * ═══ E NADA BRANCO EM CIMA DO ACCENT ═══
   *
   * O accent é claro. `text-white` sobre ele não se lê. O que vai em cima do accent é
   * `--color-on-accent`, e é para isso que ele existe.
   */
  it("nada escreve em branco por cima do accent", () => {
    const ilegiveis: string[] = [];

    for (const { caminho, texto } of telas()) {
      for (const linha of texto.split("\n")) {
        const temFundo = /bg-\[var\(--color-accent\)\]|background:\s*["']?var\(--color-accent\)/.test(linha);
        const temBranco = /text-white|color:\s*["']?#fff|text-\[#fff/i.test(linha);
        if (temFundo && temBranco) ilegiveis.push(`${caminho} — ${linha.trim().slice(0, 70)}`);
      }
    }

    expect(ilegiveis).toEqual([]);
  });

  /**
   * ═══ OS TRÊS TOKENS EXISTEM, E NOS DOIS TEMAS ═══
   *
   * O tema escuro redefine o accent e o perigo (o mesmo verde-água sobre preto lê mais
   * apagado; o mesmo vermelho vira uma mancha marrom). Se alguém acrescentar um token
   * novo e esquecer o tema escuro, a cor vaza do tema claro — e ninguém percebe até
   * alguém abrir o app à noite.
   */
  it("os três tokens estão definidos, e o escuro redefine os dois que precisam", () => {
    const css = readFileSync("app/globals.css", "utf8");

    for (const token of ["--color-accent", "--color-perigo", "--color-on-accent"]) {
      expect(css, `${token} não existe`).toContain(`${token}:`);
    }

    // O bloco escuro tem que redefinir accent e perigo.
    const escuro = css.slice(css.indexOf("prefers-color-scheme: dark"));
    expect(escuro).toContain("--color-accent:");
    expect(escuro).toContain("--color-perigo:");
  });
});

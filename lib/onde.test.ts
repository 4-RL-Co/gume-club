import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { CODIGO, CONVERSA } from "@/lib/onde";

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS ENDEREÇOS DE FORA MORAM NUM LUGAR SÓ.
 *
 *  ═══ O QUE ACONTECEU ═══
 *
 *  O endereço da conversa estava copiado à mão em quatro telas. Um endereço copiado em
 *  quatro lugares é um endereço que muda em três — e o quarto vira um link morto.
 *
 *  E um link morto não gera reclamação: quem clica e cai numa página de erro vai embora,
 *  em silêncio. É a pior classe de bug deste app, e é a mesma de sempre: uma coisa dita em
 *  dois lugares, que um dia discorda de si mesma.
 * ════════════════════════════════════════════════════════════════════
 */

function telas(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const full = join(dir, nome);
    if (statSync(full).isDirectory()) telas(full, out);
    else if ([".tsx", ".ts"].includes(extname(nome)) && !nome.includes(".test.")) out.push(full);
  }
  return out;
}

describe("os endereços de fora", () => {
  const alvos = [...telas("app"), ...telas("components")];

  it("há telas para varrer", () => {
    expect(alvos.length).toBeGreaterThan(10);
  });

  it("nenhuma tela escreve o endereço à mão", () => {
    const naMao: string[] = [];

    for (const arquivo of alvos) {
      const texto = readFileSync(arquivo, "utf8");

      /**
       * Sem os comentários. Este repositório já escreveu meia dúzia de testes que leram um
       * comentário como se fosse código — inclusive um que acusou a própria nota que
       * documentava o conserto.
       */
      const codigo = texto
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");

      if (/github\.com\/4-RL-Co\/gume-club/.test(codigo)) {
        naMao.push(
          `${arquivo.replace(process.cwd() + "/", "")} escreve o endereço à mão. ` +
            "Use CODIGO ou CONVERSA, de lib/onde.ts: um endereço em quatro telas muda em " +
            "três, e a quarta vira um link morto que ninguém reclama, só abandona.",
        );
      }
    }

    expect(naMao).toEqual([]);
  });

  /**
   * ═══ E A CONVERSA TEM QUE SER ENCONTRÁVEL, E NÃO SÓ EXISTIR ═══
   *
   * Ela existia em três telas, e nas três era um link no fim de um parágrafo, no rodapé.
   * Estar no app e ser achável no app são coisas diferentes: o que está no fim de um texto
   * é lido por quem leu o texto todo, que é quase ninguém.
   *
   * É onde se decide o que o Gume vai ser. O lugar disso é a barra, junto do resto de
   * construir, visível de qualquer tela.
   */
  it("a conversa está na barra, e não só no rodapé de um texto", () => {
    const barra = readFileSync("components/sidebar.tsx", "utf8");

    expect(
      barra,
      "a conversa saiu da barra. Ela volta a existir só no fim de textos que quase " +
        "ninguém termina de ler, e é lá que se decide o que vem por aí.",
    ).toContain("CONVERSA");
  });

  it("os dois endereços apontam para o mesmo lugar, e a conversa é parte dele", () => {
    expect(CONVERSA.startsWith(CODIGO)).toBe(true);
    expect(CODIGO.startsWith("https://")).toBe(true);
  });
});

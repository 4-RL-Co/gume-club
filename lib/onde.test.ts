import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { CODIGO, INSTAGRAM, DISCORD } from "@/lib/onde";

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS ENDEREÇOS DE FORA MORAM NUM LUGAR SÓ.
 *
 *  ═══ O QUE ACONTECEU ═══
 *
 *  Um endereço já esteve copiado à mão em quatro telas (era o da conversa, no GitHub
 *  Discussions — ela saiu, e o Instagram tomou o lugar de canal de contato). Um endereço
 *  copiado em quatro lugares é um endereço que muda em três — e o quarto vira um link
 *  morto.
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

      /**
       * O github checa QUALQUER dono/repo (é o link morto que dói); o instagram checa só
       * o handle do Gume — `components/gerenciar-links.tsx` mostra "instagram.com/voce"
       * como PLACEHOLDER do link social de outra pessoa, e aquilo não é o mesmo bug: é
       * exemplo, nunca aponta para o Gume.
       *
       * E os dois vêm de INSTAGRAM/DISCORD, não escritos à mão de novo aqui: o handle do
       * Instagram coincide, por acaso, com o slug velho do GitHub (ver
       * lib/nome-do-repo.test.ts) — escrevê-lo solto de novo faria esse outro teste
       * confundir os dois.
       */
      const semProtocoloInstagram = INSTAGRAM.replace(/^https?:\/\//, "");
      const semProtocoloDiscord = DISCORD.replace(/^https?:\/\//, "");
      if (
        /github\.com\/[\w-]+\/gume-club/.test(codigo) ||
        codigo.includes(semProtocoloInstagram) ||
        codigo.includes(semProtocoloDiscord)
      ) {
        naMao.push(
          `${arquivo.replace(process.cwd() + "/", "")} escreve o endereço à mão. ` +
            "Use CODIGO, INSTAGRAM ou DISCORD, de lib/onde.ts: um endereço em quatro " +
            "telas muda em três, e a quarta vira um link morto que ninguém reclama, só " +
            "abandona.",
        );
      }
    }

    expect(naMao).toEqual([]);
  });

  /**
   * ═══ E O CANAL DE CONTATO TEM QUE SER ENCONTRÁVEL, E NÃO SÓ EXISTIR ═══
   *
   * A conversa (GitHub Discussions) morava numa tela e, antes dela sair, no fim de um
   * parágrafo no rodapé. Estar no app e ser achável no app são coisas diferentes: o que
   * está no fim de um texto é lido por quem leu o texto todo, que é quase ninguém.
   *
   * Instagram e Discord tomaram o lugar de canal de contato, e o lugar disso é a barra,
   * visível de qualquer tela — não só o rodapé de um texto. Cada um na sua própria
   * seção "comunidade", e não dentro de "construir": seguir e conversar não é
   * contribuir (ver a nota em components/sidebar.tsx).
   */
  it("o Instagram e o Discord estão na barra, e não só no rodapé de um texto", () => {
    const barra = readFileSync("components/sidebar.tsx", "utf8");

    expect(
      barra,
      "o canal de contato saiu da barra. Ele volta a existir só no fim de textos que " +
        "quase ninguém termina de ler.",
    ).toContain("INSTAGRAM");
    expect(barra, "o Discord saiu da barra.").toContain("DISCORD");
  });

  it("os endereços são URLs de verdade", () => {
    expect(CODIGO.startsWith("https://")).toBe(true);
    expect(INSTAGRAM.startsWith("https://")).toBe(true);
    expect(DISCORD.startsWith("https://")).toBe(true);
  });
});

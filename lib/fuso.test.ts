/**
 * ════════════════════════════════════════════════════════════════════
 *  O ANO NOVO ÀS 23H. O teste que o ai/DECISIONS.md não conseguiu fazer.
 *
 *  O DECISIONS.md proibia `timestamptz` para data de leitura, e explicava por
 *  quê: quem termina um livro às 22h de 31 de dezembro em Brasília terminou em
 *  31 de dezembro, e um timestamp joga esse livro para o ano seguinte.
 *
 *  A regra foi obedecida NO BANCO: a coluna é `date`.
 *
 *  E o MESMO bug voltou pela camada de JavaScript, por outra porta:
 *
 *      new Date().toISOString().slice(0, 10)
 *
 *  `toISOString()` devolve o dia em UTC. Às 23h de 31 de dezembro em São Paulo
 *  (UTC-3), ele devolve "2026-01-01". O livro terminado na virada, com o leitor
 *  ainda acordado no dia 31, entrava no banco como lido no ano seguinte — e a
 *  retrospectiva do ano contava errado.
 *
 *  ═══ DOCUMENTO NÃO DEFENDE CÓDIGO ═══
 *
 *  Uma regra que mora num arquivo de texto é uma regra que a próxima linha de
 *  código esquece. Este arquivo existe para que ela não dependa mais de ninguém
 *  lembrar: se alguém reintroduzir `toISOString()` para produzir uma data, o
 *  build cai aqui.
 * ════════════════════════════════════════════════════════════════════
 */

// ANTES de qualquer coisa importar `Date`: o Node lê o fuso na primeira vez que
// alguém pergunta as horas, e depois cacheia.
process.env.TZ = "America/Sao_Paulo";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { hoje, dataDeLeitura } from "@/lib/datas";

/**
 * 31 de dezembro de 2025, 23h, em São Paulo.
 *
 * Em UTC isso já é 1º de janeiro de 2026, às 02h. É exatamente a fresta onde o bug
 * mora: o leitor está no dia 31, e o relógio de Greenwich já virou o ano.
 */
const VIRADA_EM_UTC = new Date("2026-01-01T02:00:00Z");

describe("o leitor está em 31 de dezembro, e o Greenwich já virou o ano", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(VIRADA_EM_UTC);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("o fuso do teste é o de São Paulo, senão ele não prova nada", () => {
    // Um teste de fuso rodando em UTC passa sempre, e não vigia coisa nenhuma.
    expect(
      new Date().getHours(),
      "este teste precisa rodar em America/Sao_Paulo para significar alguma coisa",
    ).toBe(23);
    expect(new Date().getDate()).toBe(31);
  });

  it("hoje() devolve 31 de dezembro, e NÃO 1º de janeiro", () => {
    expect(
      hoje(),
      "o livro terminado na noite da virada foi parar no ano seguinte. É o mesmo bug " +
        "que o ai/DECISIONS.md proibiu no banco, voltando pela camada de JavaScript.",
    ).toBe("2025-12-31");
  });

  it("e o ano dele é 2025, que é o ano que a retrospectiva vai contar", () => {
    expect(Number(hoje().slice(0, 4))).toBe(2025);
  });

  it("aceitar o 'hoje' padrão não pode empurrar o livro para o ano que vem", () => {
    /**
     * Este é o caminho de quem NÃO mexe na data: marca como lido e pronto. É o caminho
     * mais usado do app, e era justamente o que estava quebrado — quem escolhia a data
     * a mão escapava do bug; quem confiava no padrão, não.
     */
    const quando = dataDeLeitura(undefined) ?? hoje();
    expect(quando).toBe("2025-12-31");
  });

  it("e o jeito ERRADO continua errado, para o teste não estar se enganando", () => {
    /**
     * A prova de que a fresta existe de verdade, e de que o teste está olhando para ela.
     * Se um dia esta linha passar a devolver "2025-12-31", o Node mudou de comportamento
     * e este arquivo inteiro precisa ser relido.
     */
    expect(new Date().toISOString().slice(0, 10)).toBe("2026-01-01");
  });
});

/* ─────────────────────────────────────────────────────────────────────
 *  E A PORTA FICA TRANCADA.
 * ───────────────────────────────────────────────────────────────────── */

function fontes(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const cheio = join(dir, nome);
    if (statSync(cheio).isDirectory()) fontes(cheio, out);
    else if ([".ts", ".tsx"].includes(extname(nome)) && !nome.includes(".test.")) {
      out.push(cheio);
    }
  }
  return out;
}

/**
 * O ÚNICO arquivo que pode encostar em `toISOString().slice(0, 10)`.
 *
 * E lá o uso é OUTRO, e a diferença é o assunto inteiro deste arquivo: `dataDeLeitura`
 * não produz "hoje" a partir do relógio — ela CONFERE, de ida e volta, uma data que o
 * leitor digitou e que foi parseada explicitamente em UTC (`${texto}T00:00:00Z`). Os
 * dois lados da comparação vivem em UTC, então não há fuso para atravessar. É o que pega
 * o 31 de fevereiro, que o `new Date` rolaria para 3 de março em silêncio.
 *
 * O bug é tirar o dia de AGORA do relógio de Greenwich. Conferir uma data que já é UTC
 * contra ela mesma não é isso.
 */
const PODE_CONFERIR_DATA = "lib/datas.ts";

describe("ninguém mais tira o dia de hoje do relógio de Greenwich", () => {
  const arquivos = [...fontes("lib"), ...fontes("app"), ...fontes("components")];

  it("ninguém pergunta as horas ao Greenwich para saber que dia é hoje", () => {
    /**
     * `new Date().toISOString()` é o bug escrito por extenso, e ele é o mais perigoso do
     * projeto porque PARECE INOCENTE: é como meio mundo escreve "a data de hoje". Ninguém
     * olha duas vezes para uma linha que todo mundo escreve, e foi assim que a regra do
     * ai/DECISIONS.md — obedecida no banco — voltou pela camada de JavaScript.
     *
     * Quem precisa do dia de hoje usa `hoje()`, de lib/datas.ts, que monta a data pelo
     * CALENDÁRIO de quem está lendo.
     */
    const doRelogio = /new Date\(\s*\)\s*\.\s*toISOString\s*\(/;
    const culpados = arquivos.filter((a) => doRelogio.test(readFileSync(a, "utf8")));

    expect(
      culpados,
      "estes arquivos perguntam a data de hoje ao relógio de Greenwich:\n" +
        culpados.map((c) => `  ${c}`).join("\n") +
        "\n\nÀs 23h de 31 de dezembro em São Paulo, isso devolve 1º de janeiro — e o " +
        "livro terminado na virada vai para o ano seguinte na retrospectiva. Use hoje(), " +
        "de lib/datas.ts.",
    ).toEqual([]);
  });

  /**
   * ═══ SEM OS COMENTÁRIOS. E ESTE TESTE JÁ ACUSOU O CONSERTO ═══
   *
   * Ele lia o arquivo CRU. Aí a exportação foi escrita, este teste a pegou com um
   * `toISOString().slice(0, 10)` de verdade (e estava certíssimo: era um bug), o conserto
   * foi feito — e a NOTA que explica o conserto ficou no arquivo, com a frase proibida
   * escrita dentro dela.
   *
   * O teste continuou vermelho, apontando para a própria explicação de por que ele estava
   * certo.
   *
   * É a armadilha mais frequente deste repositório: um teste que lê comentário como se
   * fosse código. Ela já custou meia dúzia de falsos positivos e um falso NEGATIVO — que é
   * pior, porque um teste que acusa o que não devia a gente conserta, e um que aprova o
   * que não devia fica verde para sempre.
   */
  it("e ninguém corta um dia de um toISOString(), fora do arquivo que sabe o que faz", () => {
    const corta = /toISOString\(\)\s*\.\s*slice\(\s*0\s*,\s*10\s*\)/;

    const semComentarios = (texto: string) =>
      texto
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");

    const culpados = arquivos
      .filter((a) => a !== PODE_CONFERIR_DATA)
      .filter((a) => corta.test(semComentarios(readFileSync(a, "utf8"))));

    expect(
      culpados,
      "estes arquivos cortam um dia de um toISOString(), que devolve o dia em UTC:\n" +
        culpados.map((c) => `  ${c}`).join("\n") +
        `\n\nO único que pode é ${PODE_CONFERIR_DATA}, e lá o uso é outro: ele confere uma ` +
        "data já parseada em UTC contra ela mesma, e não tira o dia de hoje do relógio.",
    ).toEqual([]);
  });
});

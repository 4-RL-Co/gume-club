import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CORTE_FUNDADOR,
  CORRECOES_PARA_ZELADOR,
  CORRECOES_PARA_BIBLIOTECARIO,
  AMIGOS_PARA_ARAUTO,
  LIVROS_DO_AMIGO,
} from "@/lib/regras";
import { INSIGNIAS } from "@/lib/badges-view";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O NÚMERO DA REGRA E O NÚMERO DO TEXTO SÃO O MESMO NÚMERO.
 *
 *  ═══ O BUG ═══
 *
 *  O código dizia que membro fundador são as **cinquenta** primeiras pessoas.
 *  A tela dizia "você está entre as **cem** primeiras".
 *
 *  Ninguém mentiu de propósito: o número mudou de um lado, e o texto ficou onde estava.
 *  Só que aqui a divergência mora dentro de uma PROMESSA — a insígnia prometia um clube
 *  de cem e entregava um de cinquenta. E não havia como perceber: as duas frases estão em
 *  arquivos diferentes, e nenhuma delas está errada sozinha.
 *
 *  É o mesmo bug do teto de caracteres, e o mesmo da lista de origens de imagem: uma
 *  coisa dita em dois lugares que um dia discorda de si mesma.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Os números que a tela escreve por extenso, porque texto de gente não tem algarismo.
 *
 * A comparação IGNORA A CAIXA: a frase pode começar com o número ("Cinco pessoas entraram
 * no Gume"), e a primeira versão deste teste acusou a insígnia de estar errada quando o
 * errado era ele. Um teste que inventa erro ensina a próxima pessoa a ignorá-lo.
 */
const POR_EXTENSO: Record<number, string> = {
  5: "cinco",
  10: "dez",
  50: "cinquenta",
  100: "cem",
};

describe("as regras das insígnias", () => {
  it("o texto do fundador diz o mesmo número que a regra", () => {
    const palavra = POR_EXTENSO[CORTE_FUNDADOR];

    expect(
      palavra,
      `CORTE_FUNDADOR virou ${CORTE_FUNDADOR}, e ninguém sabe como escrever isso por ` +
        "extenso. Acrescente em POR_EXTENSO e conserte o texto da insígnia.",
    ).toBeTruthy();

    expect(
      INSIGNIAS.fundador.como.toLowerCase(),
      `a regra diz ${CORTE_FUNDADOR} primeiras pessoas, e o texto da insígnia diz outra ` +
        "coisa. A insígnia está prometendo um clube de um tamanho e entregando outro.",
    ).toContain(palavra);
  });

  it("o texto do zelador diz o mesmo número que a regra", () => {
    expect(INSIGNIAS.zelador.como.toLowerCase()).toContain(POR_EXTENSO[CORRECOES_PARA_ZELADOR]);
  });

  it("o texto do bibliotecário diz o mesmo número que a regra", () => {
    expect(INSIGNIAS.bibliotecario.como.toLowerCase()).toContain(POR_EXTENSO[CORRECOES_PARA_BIBLIOTECARIO]);
  });

  it("o texto do arauto diz os dois números que a regra usa", () => {
    expect(INSIGNIAS.arauto.como.toLowerCase()).toContain(POR_EXTENSO[AMIGOS_PARA_ARAUTO]);
    expect(INSIGNIAS.arauto.como.toLowerCase()).toContain(POR_EXTENSO[LIVROS_DO_AMIGO]);
  });

  /**
   * ═══ ZELADOR E BIBLIOTECÁRIO SÃO A MESMA ESCADA ═══
   *
   * O primeiro degrau tem que ser mais barato que o segundo. Se um dia alguém inverter os
   * números, a insígnia "evoluiria" para baixo, e ninguém veria — as duas continuariam
   * aparecendo, e o teste de tela passaria.
   */
  it("zelador é o degrau mais barato, e bibliotecário o mais caro", () => {
    expect(CORRECOES_PARA_ZELADOR).toBeLessThan(CORRECOES_PARA_BIBLIOTECARIO);
  });

  /**
   * ═══ E A INSÍGNIA EVOLUI, EM VEZ DE ACUMULAR ═══
   *
   * As duas são o MESMO trabalho — consertar o catálogo — e apareciam lado a lado no
   * perfil, dizendo a mesma coisa duas vezes. Duas insígnias para um trabalho só não
   * reconhecem o dobro: elas enchem o perfil de quem mais trabalhou.
   *
   * Este teste lê a consulta e exige o `else`. Sem ele, quem chegar a bibliotecário volta
   * a carregar as duas, e ninguém vai perceber porque nada quebra.
   */
  it("quem vira bibliotecário deixa de ser zelador, e não acumula", () => {
    const badges = readFileSync("lib/badges.ts", "utf8");

    // Sem comentários: eles EXPLICAM a regra antiga, e um teste que lesse o arquivo cru
    // acusaria a própria nota que documenta o conserto.
    const codigo = badges
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");

    expect(
      /if \(r\.bibliotecario\) minhas\.push\("bibliotecario"\);\s*else if \(r\.zelador\)/.test(
        codigo,
      ),
      "zelador e bibliotecário voltaram a acumular. São o mesmo trabalho, e o perfil de " +
        "quem mais trabalha vira o mais poluído.",
    ).toBe(true);
  });
});

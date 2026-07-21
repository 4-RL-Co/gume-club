import { describe, it, expect } from "vitest";
import {
  dataDeLeitura, validarLeitura, DataInvalida, hoje, PRIMEIRO_ANO, dataOuAno, anoDeLeitura,
} from "@/lib/datas";

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS DATAS DE LEITURA. A mentira mais cara que o app já contou.
 *
 *  O código gravava `new Date()` como o dia em que a pessoa terminou o livro.
 *  Sempre hoje, sem exceção, e sem tela para corrigir. O Gume não sabia QUANDO
 *  ninguém tinha lido nada — e a página de estatísticas e a retrospectiva do ano
 *  são construídas inteiras em cima dessas três datas.
 *
 *  E era uma mentira SILENCIOSA: ninguém abre um chamado dizendo "a data do meu
 *  livro está errada", porque ninguém olha. O erro só aparece em dezembro.
 * ════════════════════════════════════════════════════════════════════
 */

describe("uma data de leitura é do leitor, e o leitor erra", () => {
  it("aceita uma data passada, que é o ponto de tudo isto", () => {
    expect(dataDeLeitura("2019-03-12")).toBe("2019-03-12");
  });

  it("vazio é uma resposta legítima, e não um erro", () => {
    // Um livro que você está lendo não tem data de fim. Uma leitura que você registrou
    // sem lembrar quando começou não tem data de início. Nulo é uma resposta.
    expect(dataDeLeitura("")).toBeNull();
    expect(dataDeLeitura("   ")).toBeNull();
    expect(dataDeLeitura(null)).toBeNull();
    expect(dataDeLeitura(undefined)).toBeNull();
  });

  it("recusa o futuro: ninguém terminou amanhã um livro", () => {
    const amanha = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    expect(() => dataDeLeitura(amanha)).toThrow(DataInvalida);
  });

  it("aceita hoje, que é o caso normal", () => {
    expect(dataDeLeitura(hoje())).toBe(hoje());
  });

  it(`recusa antes de ${PRIMEIRO_ANO}: quase sempre é um dedo escorregado`, () => {
    expect(() => dataDeLeitura("1019-03-12")).toThrow(DataInvalida);
    expect(dataDeLeitura("1900-01-01")).toBe("1900-01-01");
  });

  it("recusa um dia que não existe, em vez de ROLAR para o mês seguinte", () => {
    /**
     * `new Date("2019-02-31")` não levanta: ele vira 3 de março, em silêncio. Sem esta
     * checagem, quem digitasse 31 de fevereiro ficaria registrado como tendo terminado
     * o livro em março, e ninguém descobriria nunca.
     */
    expect(() => dataDeLeitura("2019-02-31")).toThrow(DataInvalida);
    expect(() => dataDeLeitura("2019-13-01")).toThrow(DataInvalida);
  });

  it("recusa o que não é uma data", () => {
    expect(() => dataDeLeitura("ontem")).toThrow(DataInvalida);
    expect(() => dataDeLeitura("12/03/2019")).toThrow(DataInvalida);
    expect(() => dataDeLeitura("2019-3-12")).toThrow(DataInvalida);
  });
});

describe("as três datas contam UMA história, e ela tem que fazer sentido", () => {
  it("terminar antes de começar não é uma data errada: é uma história errada", () => {
    expect(() =>
      validarLeitura({ comecou: "2019-05-01", terminou: "2019-03-12" }),
    ).toThrow(DataInvalida);
  });

  it("abandonar antes de começar também não", () => {
    expect(() =>
      validarLeitura({ comecou: "2019-05-01", abandonou: "2019-03-12" }),
    ).toThrow(DataInvalida);
  });

  it("um livro é terminado OU abandonado, e nunca os dois", () => {
    /**
     * São dois finais diferentes para a mesma história. Guardar os dois é guardar uma
     * contradição que a página do ano teria que resolver no chute.
     */
    expect(() =>
      validarLeitura({ terminou: "2019-03-12", abandonou: "2019-04-01" }),
    ).toThrow(DataInvalida);
  });

  it("começar e terminar no mesmo dia é legítimo: existe livro curto", () => {
    expect(validarLeitura({ comecou: "2019-03-12", terminou: "2019-03-12" })).toEqual({
      comecou: "2019-03-12",
      terminou: "2019-03-12",
      abandonou: null,
      precisaoComeco: "day",
      precisaoFim: "day",
    });
  });

  it("um livro em andamento tem começo e não tem fim", () => {
    expect(validarLeitura({ comecou: "2019-03-12" })).toEqual({
      comecou: "2019-03-12",
      terminou: null,
      abandonou: null,
      precisaoComeco: "day",
      precisaoFim: "day",
    });
  });

  it("uma leitura sem nenhuma data é válida: dá para não lembrar", () => {
    expect(validarLeitura({})).toEqual({
      comecou: null,
      terminou: null,
      abandonou: null,
      precisaoComeco: "day",
      precisaoFim: "day",
    });
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  O ANO BASTA, E ELE NÃO VIRA UM DIA INVENTADO.
 *
 *  "Quando você terminou?" quase sempre se responde com um número. O campo aceita o
 *  ano, e o app registra que foi SÓ o ano: sem isso, "li em 2019" viraria "terminei
 *  em 1º de janeiro de 2019", uma afirmação que o leitor nunca fez, e a estatística
 *  da paciência passaria a contar uma espera que ninguém viveu.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o ano basta, e ele se declara como ano", () => {
  it("um ano vira o 1º de janeiro COM a precisão dizendo que é só o ano", () => {
    expect(dataOuAno("2019")).toEqual({ valor: "2019-01-01", precisao: "year" });
  });

  it("uma data completa continua sendo dia", () => {
    expect(dataOuAno("2019-03-14")).toEqual({ valor: "2019-03-14", precisao: "day" });
  });

  it("vazio não é ano nenhum", () => {
    expect(dataOuAno("")).toEqual({ valor: null, precisao: "day" });
    expect(dataOuAno(null)).toEqual({ valor: null, precisao: "day" });
  });

  it("ano no futuro é recusado, como a data no futuro é", () => {
    const queVem = String(Number(hoje().slice(0, 4)) + 1);
    expect(() => anoDeLeitura(queVem)).toThrow(DataInvalida);
  });

  it("ano antes de 1900 é recusado: quase sempre é dedo escorregado", () => {
    expect(() => anoDeLeitura("1019")).toThrow(DataInvalida);
  });

  it("o que não é um ano não passa por ano", () => {
    expect(() => anoDeLeitura("20x9")).toThrow(DataInvalida);
    expect(() => anoDeLeitura("19")).toThrow(DataInvalida);
  });

  it("a leitura marcada só com o ano carrega a precisão até o fim", () => {
    expect(validarLeitura({ terminou: "2019" })).toEqual({
      comecou: null,
      terminou: "2019-01-01",
      abandonou: null,
      precisaoComeco: "day",
      precisaoFim: "year",
    });
  });

  it("abandonar em um ano também é só o ano", () => {
    const r = validarLeitura({ abandonou: "2021" });
    expect(r.abandonou).toBe("2021-01-01");
    expect(r.precisaoFim).toBe("year");
  });

  /**
   * Começar em março de 2019 e "terminar em 2019" NÃO é uma contradição: a pessoa
   * disse o ano, e o ano contém março. Comparar o dia contra o 1º de janeiro que a
   * gente pousou diria que o fim veio antes do começo, e recusaria uma história
   * perfeitamente possível.
   */
  it("começar em março e terminar 'em 2019' é aceito: o ano contém o mês", () => {
    const r = validarLeitura({ comecou: "2019-03-14", terminou: "2019" });
    expect(r.comecou).toBe("2019-03-14");
    expect(r.terminou).toBe("2019-01-01");
    expect(r.precisaoFim).toBe("year");
  });

  it("mas terminar num ano ANTERIOR ao começo continua sendo recusado", () => {
    expect(() => validarLeitura({ comecou: "2019-03-14", terminou: "2018" })).toThrow(DataInvalida);
  });
});

describe("hoje é uma data, e data não tem relógio", () => {
  it("hoje() devolve o dia do CALENDÁRIO local, e não o de UTC", () => {
    /**
     * `new Date().toISOString().slice(0, 10)` — que era o que o app usava — devolve o
     * dia em UTC. Quem termina um livro às 22h de 31 de dezembro em Brasília fica
     * registrado como tendo terminado em 1º de janeiro, e a retrospectiva joga o livro
     * para o ano seguinte. "Que dia você terminou" é pergunta de calendário.
     */
    const agora = new Date();
    const esperado = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;

    expect(hoje()).toBe(esperado);
    expect(hoje()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

import { describe, it, expect } from "vitest";
import { dataDeLeitura, validarLeitura, DataInvalida, hoje, PRIMEIRO_ANO } from "@/lib/datas";

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
    });
  });

  it("um livro em andamento tem começo e não tem fim", () => {
    expect(validarLeitura({ comecou: "2019-03-12" })).toEqual({
      comecou: "2019-03-12",
      terminou: null,
      abandonou: null,
    });
  });

  it("uma leitura sem nenhuma data é válida: dá para não lembrar", () => {
    expect(validarLeitura({})).toEqual({ comecou: null, terminou: null, abandonou: null });
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

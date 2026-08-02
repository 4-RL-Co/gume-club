import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O LIMITE DE LOGIN É POR PESSOA, E NÃO DE TODO MUNDO JUNTO.
 *
 *  ═══ O BUG QUE ISTO IMPEDE DE VOLTAR ═══
 *
 *  Sem saber de onde vem quem chega, o Better Auth cai num balde único por rota. Não é
 *  imprecisão: é que **quem martelar o login derruba o login de todos os leitores**.
 *  Uma negação de serviço na porta de entrada, ao alcance de qualquer um, e invisível
 *  — nada na tela diz que o limite é compartilhado.
 *
 *  ═══ POR QUE UM TESTE, SE É UMA LINHA DE CONFIGURAÇÃO ═══
 *
 *  Porque é uma linha que não faz nada de visível. Ninguém percebe se ela sumir: o app
 *  continua abrindo, o login continua funcionando, e a proteção deixa de existir em
 *  silêncio até o dia em que alguém a testa. Configuração sem trava é configuração
 *  que evapora.
 *
 *  E ela também guarda o RESULTADO DA MEDIÇÃO: `x-real-ip` está aqui porque foi medido
 *  em produção (valor único, e o Railway sobrescreve o que o cliente manda), e não
 *  porque pareceu razoável. Trocar por outro cabeçalho exige medir de novo.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o limite de tentativas de login", () => {
  const auth = readFileSync("lib/auth.ts", "utf8");

  it("sabe de onde vem quem chega", () => {
    expect(
      /ipAddressHeaders:\s*\["x-real-ip"\]/.test(auth),
      "o Better Auth voltou a não saber o IP de quem chega, e o limite de login virou " +
        "um balde compartilhado: quem martelar a porta tranca todos os leitores fora.",
    ).toBe(true);
  });

  /**
   * `x-forwarded-for` aqui seria PIOR que não ter nada: a cadeia tem dois saltos, o
   * Better Auth a descarta, e o resultado é o balde compartilhado de volta — com a
   * aparência de estar configurado.
   */
  it("não usa o cabeçalho que tem mais de um salto", () => {
    const bloco = auth.slice(auth.indexOf("ipAddress:"), auth.indexOf("ipAddress:") + 200);
    expect(
      /x-forwarded-for/.test(bloco),
      "x-forwarded-for voltou à configuração. A cadeia daqui tem dois saltos e o Better " +
        "Auth a descarta: fica com cara de configurado e sem proteção nenhuma.",
    ).toBe(false);
  });

  /** E a medição temporária não pode ter ficado para trás em produção. */
  it("o log da medição saiu", () => {
    expect(
      /medindo-proxy/.test(readFileSync("middleware.ts", "utf8")),
      "o log temporário da medição continua em produção, escrevendo em toda visita à home",
    ).toBe(false);
  });
});

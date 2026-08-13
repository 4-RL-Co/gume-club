import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM CADASTRA UM LIVRO À MÃO PRECISA SER CREDITADO POR ISSO.
 *
 *  ═══ O BUG ═══
 *
 *  `findOrCreateWork()` só grava `createdBy` quando quem chama manda `criadoPor`
 *  (ver lib/library.ts). `addByHand()` — o formulário de "não achei este livro,
 *  vou cadastrar" — tinha `actor` na mão e nunca passava `criadoPor: actor.id`.
 *  Cadastrar um livro à mão é o trabalho mais deliberado que existe para trazer
 *  um livro ao acervo, e ele nunca apareceu em /contribuidores por causa disto:
 *  em produção, ZERO obras tinham `created_by` preenchido.
 *
 *  ═══ POR QUE UM TESTE DE FONTE, E NÃO UM TESTE DE BANCO ═══
 *
 *  `addByHand()` é uma ação de servidor: ela chama `getActor()`, que depende de
 *  sessão e cookies, e não tem como ser chamada direto de um teste de unidade sem
 *  simular uma requisição inteira. O que dá para travar sem isso é a FORMA: a
 *  chamada a `findOrCreateWork` dentro de `addByHand` inclui `criadoPor`.
 * ════════════════════════════════════════════════════════════════════
 */
describe("addByHand credita quem cadastrou o livro", () => {
  const fonte = readFileSync("app/buscar/actions.ts", "utf8");

  function corpoDe(nomeDaFuncao: string): string {
    const inicio = fonte.indexOf(`export async function ${nomeDaFuncao}(`);
    expect(inicio, `não achei ${nomeDaFuncao}(): este teste está cego`).toBeGreaterThan(0);

    const proxima = fonte.indexOf("\nexport async function ", inicio + 1);
    return fonte.slice(inicio, proxima > inicio ? proxima : fonte.length);
  }

  it("addByHand passa criadoPor para findOrCreateWork", () => {
    const corpo = corpoDe("addByHand");

    expect(corpo, "addByHand não chama findOrCreateWork mais: este teste está cego").toContain(
      "findOrCreateWork(",
    );
    expect(
      corpo,
      "addByHand voltou a não creditar quem cadastrou o livro à mão. Sem criadoPor: " +
        "actor.id, a ficha nasce sem dono e a pessoa nunca aparece em /contribuidores.",
    ).toMatch(/criadoPor:\s*actor\.id/);
  });
});

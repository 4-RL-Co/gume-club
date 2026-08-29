import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * ════════════════════════════════════════════════════════════════════
 *  /entrar?novo=1 ABRE EM MODO "criar".
 *
 *  Inspeção de código-fonte, no mesmo estilo de lib/auth.convite.test.ts —
 *  este repo não tem jsdom/testing-library, e não vale introduzir um
 *  segundo jeito de testar UI só para esta linha. O que importa é que o
 *  seed inicial de `mode` leve em conta o parâmetro; a formatação exata
 *  fica livre.
 * ════════════════════════════════════════════════════════════════════
 */
describe("app/entrar/page.tsx: ?novo=1 seeda o modo 'criar'", () => {
  it("o useState de mode considera params.get('novo')", () => {
    const fonte = readFileSync("app/entrar/page.tsx", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

    const inicio = fonte.indexOf('useState<"entrar" | "criar">(');
    expect(inicio, "o useState do modo entrar/criar sumiu do arquivo").toBeGreaterThan(-1);

    const fim = fonte.indexOf(";", inicio);
    const trecho = fonte.slice(inicio, fim);

    expect(trecho, "o seed inicial não olha pra ?novo=1").toContain('params.get("novo")');
    expect(trecho, "o seed inicial não compara com \"1\"").toContain('"1"');
    expect(trecho, "o seed inicial não resulta em modo \"criar\"").toContain('"criar"');
  });
});

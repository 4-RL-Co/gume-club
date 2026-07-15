import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O NOME DO REPOSITÓRIO É `gume-club`, COM HÍFEN. O ANTIGO NÃO PODE VOLTAR.
 *
 *  O repositório se chamou `gumeclub` (sem hífen) e virou `gume-club`. Um grep pega o que
 *  já existe; este teste pega o que ALGUÉM ESCREVER AMANHÃ — um link colado num README, uma
 *  URL nova numa tela, e principalmente a chamada de API em lib/contributors.ts, que aponta
 *  para um repositório de verdade: com o nome errado ela bate no vazio, a /contribuidores
 *  esvazia, e a insígnia de construtor some de todo mundo sem um erro sequer.
 *
 *  O slug mora num lugar só (REPO, em lib/onde.ts). Este teste garante que ninguém o
 *  reescreva à mão com o nome velho.
 *
 *  ═══ O QUE NÃO CONTA ═══
 *
 *  As migrations são história congelada e append-only: a 0027 reserva o handle na forma
 *  CANÔNICA (`handle_canonico` tira o hífen), então `gume-club` já está coberto, e reescrever
 *  uma migration que já rodou é pior do que a menção. Elas ficam de fora. E este arquivo, que
 *  precisa escrever o nome proibido para procurá-lo, também.
 * ════════════════════════════════════════════════════════════════════
 */

const ESTE_ARQUIVO = "lib/nome-do-repo.test.ts";

/** Congelado (append-only) ou gerado: não é onde alguém escreve um link. */
const FORA = [
  "node_modules",
  ".next",
  ".git",
  "lib/db/migrations",
  "pnpm-lock.yaml",
  ESTE_ARQUIVO,
];

const EXTENSOES = [".ts", ".tsx", ".mjs", ".js", ".md", ".json", ".css", ".yml", ".yaml"];

function varrer(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const full = join(dir, nome);
    const rel = full.replace(process.cwd() + "/", "");
    if (FORA.some((f) => rel === f || rel.startsWith(f + "/"))) continue;
    if (statSync(full).isDirectory()) varrer(full, out);
    else if (EXTENSOES.some((e) => nome.endsWith(e))) out.push(rel);
  }
  return out;
}

describe("o nome do repositório é gume-club, com hífen", () => {
  it("o nome velho (gumeclub, sem hífen) não aparece em lugar nenhum", () => {
    const culpados: string[] = [];

    for (const arquivo of varrer(process.cwd())) {
      // `gumeclub` casa só a forma sem hífen: `gume-club` tem o hífen e `gume.club`
      // (o domínio) tem o ponto, então nenhum dos dois cai aqui.
      if (/gumeclub/i.test(readFileSync(arquivo, "utf8"))) culpados.push(arquivo);
    }

    expect(
      culpados,
      "o nome antigo do repositório (gumeclub, sem hífen) voltou. Ele aponta para um " +
        "repositório que não existe: a chamada da API em lib/contributors.ts esvazia a " +
        "/contribuidores em silêncio. Use REPO, de lib/onde.ts.",
    ).toEqual([]);
  });
});

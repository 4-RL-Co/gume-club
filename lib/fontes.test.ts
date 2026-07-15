import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { seriesDe, AniListRecusou } from "@/lib/anilist";

/**
 * ════════════════════════════════════════════════════════════════════
 *  NUNCA TRADUZA FALHA DE COMUNICAÇÃO EM AUSÊNCIA DE DADO.
 *
 *  É o bug mais caro deste projeto. Ele já quase matou o catálogo uma vez, e
 *  apareceu CINCO vezes — sempre com uma roupa nova:
 *
 *    · a API da Open Library devolveu 2 capas em 44 livros, e a conclusão foi
 *      "o catálogo não tem capa". Era a API errada: o DUMP tinha 414 mil edições.
 *    · 81 autores do cânone "não existiam". Era o campo de autor quebrado —
 *      Madame Bovary estava lá, com o autor em branco.
 *    · "[author not identified]" passou por autor de verdade, e a poda ia apagar
 *      Madame Bovary por não reconhecer o Flaubert.
 *    · o 429 da AniList virou "o mangaká não existe". Vinte deles, em fila.
 *    · um LIMIT sem ORDER BY, e "Mário de Andrade não está no acervo" — ele
 *      estava lá 162 vezes.
 *
 *  ═══ POR QUE ELE É TÃO DIFÍCIL DE VER ═══
 *
 *  Um `[]` devolvido por um timeout tem EXATAMENTE a mesma cara que um `[]`
 *  devolvido por uma busca honesta. Quem lê o relatório não tem como saber a
 *  diferença — então acredita na pior das duas.
 *
 *  "Não achei" e "não consegui perguntar" são coisas OPOSTAS.
 *
 *  Lista vazia significa UMA coisa só: a fonte respondeu, e não tem o que você
 *  pediu. Qualquer outra coisa LEVANTA.
 * ════════════════════════════════════════════════════════════════════
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Uma resposta HTTP de mentira, para a fonte não ser consultada de verdade no teste. */
function responde(status: number, corpo: unknown = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify(corpo), {
        status,
        headers: { "Content-Type": "application/json", "retry-after": "0" },
      }),
    ),
  );
}

describe("a AniList: o 429 não é um veredito sobre o acervo", () => {
  it("um 429 até o fim LEVANTA, e não devolve lista vazia", async () => {
    /**
     * Foi assim que vinte mangakás em fila apareceram como "não existem na AniList", e
     * depois os últimos quatro voltaram a funcionar. Era rate limit, e o relatório
     * chamava de ausência.
     *
     * Um script que insiste é lento. Um script que mente é caro.
     */
    responde(429);

    await expect(
      seriesDe("Kentaro Miura", 2),
      "um 429 virou lista vazia. O seed vai imprimir 'nada' e alguém vai concluir que o " +
        "mangaká não existe.",
    ).rejects.toThrow(AniListRecusou);
  });

  it("um 500 também LEVANTA: servidor caído não é acervo vazio", async () => {
    responde(503);
    await expect(seriesDe("Eiichiro Oda", 2)).rejects.toThrow(AniListRecusou);
  });

  it("um 404 devolve vazio, e ISSO é legítimo: a fonte respondeu", async () => {
    /**
     * A diferença inteira. 404 é uma RESPOSTA: "eu procurei, e não tenho". Ela vira uma
     * tarefa, e não um alarme.
     */
    responde(404);
    await expect(seriesDe("Fulano Que Não Existe", 1)).resolves.toEqual([]);
  });

  it("um 200 sem resultado devolve vazio, e também é legítimo", async () => {
    responde(200, { data: { Staff: null } });
    await expect(seriesDe("Fulano", 1)).resolves.toEqual([]);
  });
});

/* ─────────────────────────────────────────────────────────────────────
 *  E A PORTA FICA TRANCADA PARA O PRÓXIMO CLIENTE.
 * ───────────────────────────────────────────────────────────────────── */

/**
 * Os módulos que falam com o mundo lá fora. Cada um deles é uma chance de o bug voltar.
 *
 * `lib/catalog.ts` é a exceção DECLARADA, e ela é o oposto do bug: ele roda no caminho
 * de uma TECLA. Se a Open Library está fora do ar, a busca devolve o que a nossa base
 * tem, e a pessoa nem fica sabendo — porque uma fonte externa caída não pode derrubar a
 * tela de quem está digitando. Lá o silêncio é a decisão certa, e ela está escrita no
 * próprio arquivo.
 *
 * A regra vale para os clientes que MEDEM e que SEMEIAM: eles produzem relatórios e
 * escrevem no acervo, e um vazio silencioso ali vira uma conclusão falsa sobre o
 * catálogo.
 */
const NO_CAMINHO_DE_UMA_TECLA = ["lib/catalog.ts"];

function fontesExternas(): string[] {
  return readdirSync("lib")
    .filter((f) => f.endsWith(".ts") && !f.includes(".test."))
    .map((f) => join("lib", f))
    .filter((f) => !NO_CAMINHO_DE_UMA_TECLA.includes(f))
    .filter((f) => {
      const src = readFileSync(f, "utf8");
      // CHAMA de verdade uma API: um `fetch(` E um endereço. Um arquivo que só CITA uma
      // URL num comentário não fala com ninguém — e acusá-lo faria este teste virar
      // ruído, que é como um teste morre.
      return /\bfetch\s*\(/.test(src) && /https?:\/\//.test(src);
    });
}

describe("todo cliente de API externa distingue 'não achei' de 'não consegui perguntar'", () => {
  it("há clientes para vigiar", () => {
    expect(fontesExternas().length).toBeGreaterThan(0);
  });

  it.each(fontesExternas())("%s não engole 429 nem 5xx", (arquivo) => {
    const src = readFileSync(arquivo, "utf8");

    // Um cliente que nunca menciona 429 nem status >= 500 é um cliente que os trata como
    // qualquer outra resposta — ou seja, que os engole.
    const olhaParaOErro =
      /\b429\b/.test(src) || /status\s*>=?\s*500/.test(src) || /\b5xx\b/i.test(src);

    expect(
      olhaParaOErro,
      `${arquivo} fala com uma API externa e não menciona 429 nem 5xx em lugar nenhum.\n\n` +
        "Ou ele os engole e devolve lista vazia — e aí um rate limit vira 'o dado não " +
        "existe', que é o bug mais caro deste projeto — ou ele os trata e só não está " +
        "escrito.\n\n" +
        "Ver a seção 'NUNCA TRADUZA FALHA DE COMUNICAÇÃO EM AUSÊNCIA DE DADO' no AGENTS.md.",
    ).toBe(true);
  });
});

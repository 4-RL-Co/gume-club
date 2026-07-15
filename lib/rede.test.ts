import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM TEMPO ESGOTADO NÃO TEM CÓDIGO DE STATUS: ELE LANÇA.
 *
 *  ═══ O QUE ISTO CUSTOU ═══
 *
 *  O backfill de sinopses da Wikipédia rodou por uma hora, achou **959 sinopses**, e
 *  morreu no autor 1.120 de 1.200 com isto:
 *
 *      DOMException [TimeoutError]: The operation was aborted due to timeout
 *
 *  Nada foi gravado. Uma hora de trabalho apagada.
 *
 *  E o script TINHA um laço de tentativas — ele tratava 429, tratava 500, e tratava
 *  404. Só que `AbortSignal.timeout` não devolve `res.status`: ele **lança**. A exceção
 *  passou por cima de todo o cuidado e derrubou o processo.
 *
 *  ═══ O IRMÃO PIOR, QUE ISTO ACHOU ═══
 *
 *  Consertando os outros arquivos, apareceu esta linha em `lib/anilist.ts`:
 *
 *      if (!res) return [];
 *
 *  Com a rede fora, a AniList não respondia nada — e a função dizia, com toda a
 *  confiança, que **o mangaká não tem obra nenhuma**. O seed apagaria Berserk do acervo
 *  achando que a fonte tinha respondido.
 *
 *  É a LEI do AGENTS.md quebrada em duas palavras:
 *
 *      NUNCA TRADUZA FALHA DE COMUNICAÇÃO EM AUSÊNCIA DE DADO.
 *
 *  ═══ POR QUE UM TESTE, E NÃO UMA NOTA ═══
 *
 *  Porque a nota já existia. `lib/anilist.ts` tem um comentário, em letras garrafais,
 *  dizendo exatamente que um 429 não pode virar "não existe" — e três linhas abaixo o
 *  `if (!res) return []` fazia exatamente isso.
 *
 *  Documento não defende código. Este teste defende.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * ═══ O TESTE LÊ CÓDIGO, E NÃO COMENTÁRIO ═══
 *
 * A primeira versão disto acusou `lib/anilist.ts` de conter `if (!res) return []` — e
 * o que ela achou foi o COMENTÁRIO que eu tinha acabado de escrever explicando que
 * aquela linha existiu e foi consertada.
 *
 * Um teste que lê a nota sobre o bug como se fosse o bug é um teste que impede a
 * próxima pessoa de documentar o bug. Fora os comentários.
 */
function semComentarios(texto: string): string {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")) // guarda as linhas
    .replace(/\/\/[^\n]*/g, "");
}

/** Todo arquivo que fala com a internet. */
function arquivosComFetch(): { caminho: string; texto: string }[] {
  const achados: { caminho: string; texto: string }[] = [];

  for (const pasta of ["lib", "scripts", "seed"]) {
    let nomes: string[];
    try {
      nomes = readdirSync(pasta);
    } catch {
      continue;
    }

    for (const nome of nomes) {
      if (!/\.(ts|mjs)$/.test(nome) || nome.includes(".test.")) continue;

      const caminho = join(pasta, nome);
      const texto = readFileSync(caminho, "utf8");
      if (texto.includes("await fetch(")) achados.push({ caminho, texto: semComentarios(texto) });
    }
  }
  return achados;
}

describe("a rede caindo nunca vira um dado", () => {
  /**
   * ═══ TODO `fetch` COM PRAZO MORA DENTRO DE UM `try` ═══
   *
   * `AbortSignal.timeout` lança. Sem o `try`, o script inteiro morre — e morre DEPOIS
   * de horas de trabalho, jogando fora tudo o que ele já tinha achado.
   *
   * O teste procura a FORMA do erro, e não o arquivo: qualquer `fetch` novo que alguém
   * escrever com timeout e sem rede de segurança quebra a build no dia em que for
   * escrito, e não na noite em que rodar.
   */
  it("todo fetch com prazo está dentro de um try", () => {
    const nus: string[] = [];

    for (const { caminho, texto } of arquivosComFetch()) {
      const linhas = texto.split("\n");

      for (let i = 0; i < linhas.length; i++) {
        if (!linhas[i]!.includes("await fetch(")) continue;

        /**
         * ═══ SÓ O FETCH COM PRAZO ═══
         *
         * O download do dump da Open Library é um `fetch` sem timeout, e ele LANÇA de
         * propósito: são 3 GB, nada foi gravado ainda, e parar alto é a coisa certa.
         *
         * O que precisa de rede de segurança é o fetch com PRAZO — porque prazo quer
         * dizer "isto pode falhar e vale tentar de novo", e é dentro de um laço de
         * horas que a exceção mata o trabalho de todo mundo.
         */
        const chamada = linhas.slice(i, i + 8).join("\n");
        if (!chamada.includes("AbortSignal")) continue;

        // O `try` tem que estar nas linhas ACIMA do fetch, e perto: um try a trinta
        // linhas de distância é outra coisa protegendo outra coisa.
        const acima = linhas.slice(Math.max(0, i - 4), i).join("\n");
        if (!/\btry\s*\{/.test(acima)) {
          nus.push(`${caminho}:${i + 1}`);
        }
      }
    }

    expect(nus).toEqual([]);
  });

  /**
   * ═══ E NENHUM CAMINHO DE FALHA DEVOLVE UMA LISTA VAZIA ═══
   *
   * `return []` depois de uma falha de rede é a mentira mais cara que este projeto sabe
   * contar: ela diz "a fonte respondeu, e disse que não tem nada".
   *
   * Este teste procura, especificamente, o padrão que quase apagou o Berserk:
   *
   *     if (!res) return [];
   */
  it("nenhuma função devolve lista vazia porque a resposta não chegou", () => {
    const mentiras: string[] = [];

    for (const { caminho, texto } of arquivosComFetch()) {
      // `if (!res) return []` e primos: a resposta não veio, e a função finge que veio.
      const padrao = /if\s*\(\s*!\s*(res|resposta|r)\s*\)\s*(?:\{\s*)?return\s*(\[\s*\]|null|new Map\(\)|\{\s*\})/g;

      for (const achado of texto.matchAll(padrao)) {
        const linha = texto.slice(0, achado.index).split("\n").length;
        mentiras.push(`${caminho}:${linha} — ${achado[0]!.replace(/\s+/g, " ")}`);
      }
    }

    expect(mentiras).toEqual([]);
  });
});

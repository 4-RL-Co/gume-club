import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUANDO UMA LISTA TEM PAPÉIS, NUNCA USE POSIÇÃO.
 *
 *  Cinco bugs desta semana são O MESMO BUG:
 *
 *    · `authors[0]` do registro de EDIÇÃO pegou o TRADUTOR. "A Morte de Ivan
 *      Ilitch" ficou assinada por Roberto Algarte; o Drácula da Martin Claret,
 *      por "jaime arbe".
 *    · o autor da SÉRIE pegou o ILUSTRADOR. Hikaru no Go é da Yumi Hotta — o
 *      Obata desenha.
 *    · o artista de Bakemonogatari pegou um ILUSTRADOR CONVIDADO, que desenhou
 *      a capa de um capítulo.
 *    · `publishers[0]`, numa lista de co-editoras.
 *    · o primeiro nome de autor que casou, num monte de homônimos.
 *
 *  A FORMA é sempre a mesma: usar POSIÇÃO como se fosse PAPEL. A lista tem
 *  papéis, e a ordem não é um deles.
 *
 *  ═══ O QUE ESTE TESTE EXIGE ═══
 *
 *  `[0]` num resultado de fonte externa só passa se houver um COMENTÁRIO ao lado
 *  dizendo por que a ordem, ali, significa alguma coisa.
 *
 *  Não é burocracia: é a diferença entre uma escolha e um descuido. Quem escreve
 *  o comentário é obrigado a perguntar "a fonte declara que o primeiro é o
 *  principal?" — e essa pergunta, feita cinco vezes esta semana, teria evitado
 *  cinco bugs.
 * ════════════════════════════════════════════════════════════════════
 */

/** A justificativa. Uma destas palavras, num comentário logo acima do `[0]`. */
const JUSTIFICA = /\b(ordem|posi[cç][aã]o|primeir|principal|papel|declara|benigno)\b/i;

/**
 * As listas que vêm de FONTE EXTERNA, e onde a posição já mentiu.
 *
 * Não é toda lista do código: um `linhas[0]` de um CSV que a própria pessoa colou é
 * outra coisa. O perigo mora onde a lista tem PAPÉIS e veio de fora.
 */
const DE_FORA =
  /\b(authors?|staff|creators?|contributors?|publishers?|imprints?|editors?|translators?|illustrators?|works?|docs|items|media|edges|entries|results?|candidates?|matches?)\s*(\?\.)?\s*\[\s*0\s*\]/i;

function arquivos(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome.startsWith(".")) continue;
    const cheio = join(dir, nome);
    if (statSync(cheio).isDirectory()) arquivos(cheio, out);
    else if ([".ts", ".tsx", ".mjs"].includes(extname(nome)) && !nome.includes(".test.")) {
      out.push(cheio);
    }
  }
  return out;
}

/**
 * As vinte linhas acima. É ali que a justificativa tem que estar.
 *
 * Vinte, e não seis: os comentários deste projeto explicam POR QUE, e não O QUE — e um
 * "por quê" que cabe em seis linhas costuma ser um "o quê" disfarçado. A janela larga é
 * o preço de exigir explicação em vez de rótulo.
 */
function contexto(linhas: string[], i: number): string {
  return linhas.slice(Math.max(0, i - 20), i + 1).join("\n");
}

describe("posição não é papel", () => {
  const alvos = [...arquivos("lib"), ...arquivos("scripts")];

  it("há código para varrer", () => {
    expect(alvos.length).toBeGreaterThan(10);
  });

  it.each(alvos)("%s não pega o primeiro de uma lista com papéis sem dizer por quê", (arquivo) => {
    const src = readFileSync(arquivo, "utf8");
    const linhas = src.split("\n");

    const nus: string[] = [];

    for (const [i, linha] of linhas.entries()) {
      // Comentário não é código.
      if (/^\s*(\/\/|\*|\/\*)/.test(linha)) continue;
      if (!DE_FORA.test(linha)) continue;

      // A justificativa mora nas seis linhas acima — num comentário, e não no ar.
      if (JUSTIFICA.test(contexto(linhas, i))) continue;

      nus.push(`  linha ${i + 1}: ${linha.trim().slice(0, 76)}`);
    }

    expect(
      nus,
      `${arquivo} pega o PRIMEIRO item de uma lista que veio de fora, e não diz por quê:\n\n` +
        nus.join("\n") +
        "\n\nSe a lista tem PAPÉIS (author, translator, illustrator, editor), filtre pelo " +
        "papel — nunca pegue o primeiro. Foi assim que 'A Morte de Ivan Ilitch' ficou " +
        "assinada pelo tradutor, e que a arte de Bakemonogatari foi parar com uma " +
        "ilustradora convidada.\n\n" +
        "Se a ordem REALMENTE significa alguma coisa (a fonte declara que o primeiro é o " +
        "principal), escreva isso num comentário acima da linha. O comentário não é " +
        "burocracia: é a pergunta que, feita cinco vezes esta semana, teria evitado cinco " +
        "bugs.\n\n" +
        "Ver 'QUANDO UMA LISTA TEM PAPÉIS, NUNCA USE POSIÇÃO' no AGENTS.md.",
    ).toEqual([]);
  });
});

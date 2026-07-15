import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { CANONE, grafias, type AutorDoCanone } from "./canone";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O CÂNONE SE DEFENDE SOZINHO.
 *
 *  Uma lista curada é uma promessa, e uma promessa sem teste é um plano.
 *  Este arquivo é o que impede as três formas de ela apodrecer:
 *
 *  1. INCHAR. Trezentos vira trezentos e cinquenta num commit distraído,
 *     e mil em seis meses — e aí a gente está de volta às 414 mil edições
 *     que este trabalho existe para desfazer. O número não é mágico; o
 *     que é mágico é ter que DEFENDER a mudança dele.
 *
 *  2. PERDER A VERDADE DE CAMPO. Os autores de seed/olegas-shelf.csv não
 *     são uma lista que alguém inventou: são gosto real, já registrado.
 *     Se um deles cair da lista, a poda apaga um livro que uma pessoa de
 *     verdade tem na estante de verdade. Este teste lê o CSV e confere,
 *     um a um.
 *
 *  3. VIRAR RANKING. Nada aqui pode ter contador, peso ou posição. Se um
 *     dia alguém acrescentar um campo `popularidade` a este tipo, é para
 *     o build quebrar aqui, e não para descobrirmos na tela.
 * ════════════════════════════════════════════════════════════════════
 */

const TAMANHO_DO_CANONE = 367;

function canonico(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[.\s-]+/g, " ")
    .trim();
}

/** Os autores que estão na estante de verdade, lidos do CSV. */
function autoresDaEstante(): string[] {
  // A estante pessoal do mantenedor é dado privado e não entra no repo público. Onde ela
  // existe (a máquina do dono), este teste guarda o cânone contra ela; no CI e num clone
  // público, não há estante de verdade aqui para conferir, e não há o que apodrecer.
  const arquivo = new URL("./olegas-shelf.csv", import.meta.url);
  if (!existsSync(arquivo)) return [];
  const linhas = readFileSync(arquivo, "utf8")
    .split("\n")
    .slice(1)
    .filter(Boolean);

  const nomes = new Set<string>();
  for (const linha of linhas) {
    const campos: string[] = [];
    let atual = "";
    let aspas = false;
    for (const ch of linha) {
      if (ch === '"') aspas = !aspas;
      else if (ch === "," && !aspas) {
        campos.push(atual);
        atual = "";
      } else atual += ch;
    }
    campos.push(atual);

    const autor = campos[2]?.trim();
    // Uma antologia não tem autor: tem uma etiqueta. Ela não vira entrada do cânone.
    if (autor && !/^(diversos|v[áa]rios) autores$/i.test(autor)) nomes.add(autor);
  }
  return [...nomes];
}

describe("o cânone tem tamanho, e o tamanho é uma escolha", () => {
  it(`são exatamente ${TAMANHO_DO_CANONE} autores`, () => {
    expect(
      CANONE.length,
      `o cânone tem ${CANONE.length} autores, e devia ter ${TAMANHO_DO_CANONE}. ` +
        "Se você quer mudar o número, mude a constante deste teste NO MESMO COMMIT, e " +
        "escreva por quê em ai/DECISIONS.md. Um catálogo cresce fácil e encolhe difícil.",
    ).toBe(TAMANHO_DO_CANONE);
  });

  it("ninguém aparece duas vezes", () => {
    const vistos = new Map<string, string>();
    const repetidos: string[] = [];

    for (const a of CANONE) {
      const chave = canonico(a.nome);
      if (vistos.has(chave)) repetidos.push(`${a.nome} (já estava como "${vistos.get(chave)}")`);
      vistos.set(chave, a.nome);
    }

    expect(repetidos, `autor repetido no cânone: ${repetidos.join(", ")}`).toEqual([]);
  });

  it("nenhum apelido colide com o NOME de outro autor", () => {
    /**
     * "Dante" como apelido de Dante Alighieri é ótimo. "Dante" como apelido de outra
     * pessoa faria os dois casarem com as mesmas obras, e o backfill de capa gastaria
     * chamada de API no autor errado.
     */
    const nomes = new Map(CANONE.map((a) => [canonico(a.nome), a.nome]));
    const colisoes: string[] = [];

    for (const a of CANONE) {
      for (const apelido of a.alias ?? []) {
        const dono = nomes.get(canonico(apelido));
        if (dono && dono !== a.nome) {
          colisoes.push(`"${apelido}" é apelido de ${a.nome}, mas é o nome de ${dono}`);
        }
      }
    }

    expect(colisoes, colisoes.join("; ")).toEqual([]);
  });
});

describe("a verdade de campo nunca sai da lista", () => {
  it("todo autor que já está na estante de alguém está no cânone", () => {
    const noCanone = new Set<string>();
    for (const a of CANONE) for (const g of grafias(a)) noCanone.add(canonico(g));

    const faltando = autoresDaEstante().filter((nome) => !noCanone.has(canonico(nome)));

    expect(
      faltando,
      `estes autores estão na estante de alguém e NÃO estão no cânone: ${faltando.join(", ")}. ` +
        "Um autor fora do cânone é um autor que a poda apaga — e apagar o livro que uma " +
        "pessoa de verdade tem na estante de verdade é a única coisa que este projeto " +
        "não pode fazer.",
    ).toEqual([]);
  });
});

describe("o cânone não é um ranking", () => {
  it("nenhum autor carrega contador, peso ou posição", () => {
    /**
     * A regra do ai/DECISIONS.md: o cânone é uma escolha editorial ASSINADA, e não uma
     * métrica. Ele manda em três coisas — prioridade do backfill de capa, estantes
     * curadas e a parede da home — e em mais nada. No dia em que alguém puser um número
     * aqui, ele vai querer ordenar a busca por esse número, e aí o Gume virou o que ele
     * recusa ser.
     */
    const proibidos = ["peso", "posicao", "posição", "rank", "popularidade", "score", "ordem"];
    const fonte = readFileSync(new URL("./canone.ts", import.meta.url), "utf8");

    const tipo = fonte.slice(
      fonte.indexOf("export type AutorDoCanone"),
      fonte.indexOf("/* ─", fonte.indexOf("export type AutorDoCanone")),
    );

    for (const campo of proibidos) {
      expect(
        tipo.includes(`${campo}:`),
        `o tipo AutorDoCanone ganhou um campo "${campo}". O cânone não ordena a busca, ` +
          "não vira grade de populares e não tem contador. Ver ai/DECISIONS.md.",
      ).toBe(false);
    }
  });

  it("todo autor declara de onde veio", () => {
    const origens = new Set(["escolhido", "filosofia", "brasil", "estante", "mundo", "lusofonia"]);
    for (const a of CANONE) {
      expect(origens.has(a.origem), `${a.nome} tem origem inválida: ${a.origem}`).toBe(true);
    }
  });

  it("os nomes curtos demais para casar sozinhos estão marcados como exatos", () => {
    /**
     * "ONE" casaria com meio catálogo por similaridade. "CLAMP" também. Um casamento
     * frouxo aqui não é um erro cosmético: ele faz a poda POUPAR o livro errado, e o
     * backfill gastar chamada de API no autor errado.
     */
    const curtos = CANONE.filter((a: AutorDoCanone) => a.nome.length <= 5 && !a.exato);
    expect(
      curtos.map((a) => a.nome),
      "estes nomes são curtos demais para casar por similaridade e não estão marcados " +
        "com `exato: true`",
    ).toEqual([]);
  });
});

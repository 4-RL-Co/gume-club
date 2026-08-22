import { describe, it, expect } from "vitest";
import { empacotar } from "./masonry";

describe("empacotar: colunas de altura parecida", () => {
  it("não perde nem duplica item nenhum", () => {
    const itens = [1, 2, 3, 4, 5, 6, 7];
    const baldes = empacotar(itens, (n) => n, 3);
    expect(baldes.flat().sort((a, b) => a - b)).toEqual(itens);
  });

  it("devolve o número certo de colunas, mesmo vazias", () => {
    const baldes = empacotar([1], () => 1, 3);
    expect(baldes).toHaveLength(3);
    expect(baldes.filter((b) => b.length > 0)).toHaveLength(1);
  });

  it("lista vazia devolve colunas vazias, não quebra", () => {
    expect(empacotar([], () => 1, 3)).toEqual([[], [], []]);
  });

  /**
   * O caso que motivou o arquivo: um item MUITO mais pesado que os outros
   * (o "quem publica" de catorze linhas contra cartões de duas ou três).
   * O item pesado fica sozinho na própria coluna, e os leves se espalham
   * pelas outras — nunca um pesado dividindo coluna com outro pesado
   * enquanto uma coluna fica vazia.
   */
  it("um item muito pesado não deixa as outras colunas vazias", () => {
    const itens = [{ peso: 14 }, { peso: 3 }, { peso: 3 }, { peso: 3 }, { peso: 3 }];
    const baldes = empacotar(itens, (i) => i.peso, 3);

    expect(baldes.every((b) => b.length > 0), "sobrou coluna vazia").toBe(true);

    const pesos = baldes.map((b) => b.reduce((s, i) => s + i.peso, 0));
    // O balde do item pesado (14) nunca deveria também levar um leve: 14
    // sozinho já é mais que a média (26/3 ≈ 8,7), e empilhar mais um leve
    // em cima dele so pioraria o desequilíbrio.
    expect(Math.max(...pesos) - Math.min(...pesos)).toBeLessThan(14);
  });

  it("pesos iguais ficam bem distribuídos entre as colunas", () => {
    const itens = Array.from({ length: 6 }, () => ({ peso: 5 }));
    const baldes = empacotar(itens, (i) => i.peso, 3);
    expect(baldes.map((b) => b.length)).toEqual([2, 2, 2]);
  });

  it("uma coluna só devolve tudo junto, na ordem do mais pesado pro mais leve", () => {
    const itens = [{ n: "leve", peso: 1 }, { n: "pesado", peso: 9 }, { n: "medio", peso: 4 }];
    const [balde] = empacotar(itens, (i) => i.peso, 1);
    expect(balde!.map((i) => i.n)).toEqual(["pesado", "medio", "leve"]);
  });
});

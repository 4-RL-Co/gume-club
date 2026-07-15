import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { entraNoDataset, exigeCredito, FONTES } from "./licenca";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A PROMESSA DO DATASET CC0, PRESA POR UM TESTE.
 *
 *  "Publicar o acervo como um bem comum" é uma frase do README. Uma frase não impede
 *  ninguém de escrever, daqui a seis meses, um backfill que traga texto de uma loja e
 *  o marque como CC0.
 *
 *  Estes testes impedem. Se alguém abrir uma fonte nova, ou apontar a Wikipédia para
 *  dentro do dataset, a build quebra e a pessoa tem que dizer, na cara, por quê.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a licença", () => {
  it("deixa entrar no dataset o que é CC0", () => {
    expect(entraNoDataset("openlibrary")).toBe(true);
    expect(entraNoDataset("wikidata")).toBe(true);
    expect(entraNoDataset("gume")).toBe(true);
  });

  /**
   * ═══ O TESTE QUE MAIS IMPORTA ═══
   *
   * A Wikipédia é CC-BY-SA. Ela exige crédito e obriga quem reusar a manter a mesma
   * licença. Pôr esse texto num dataset CC0 é dizer "isto é de todos, sem condição" a
   * respeito do trabalho de outra pessoa — e não é.
   */
  it("NÃO deixa a Wikipédia entrar no dataset CC0, e exige crédito na tela", () => {
    expect(entraNoDataset("wikipedia")).toBe(false);
    expect(exigeCredito("wikipedia")).toBe(true);
  });

  /**
   * O padrão é o CUIDADO. Uma fonte desconhecida — porque alguém escreveu um backfill
   * novo e esqueceu de decidir a licença — fica de fora. Publicar por engano não tem
   * volta; deixar um buraco tem.
   */
  it("uma fonte que ninguém decidiu fica de fora", () => {
    expect(entraNoDataset(null)).toBe(false);
    expect(entraNoDataset(undefined)).toBe(false);
    expect(entraNoDataset("amazon")).toBe(false);
    expect(entraNoDataset("panini")).toBe(false);
    expect(entraNoDataset("goodreads")).toBe(false);
  });

  /**
   * ═══ O ENUM DO BANCO E O CÓDIGO NÃO PODEM DIVERGIR ═══
   *
   * Se alguém acrescentar uma fonte na migration e não aqui, o texto dela cairia no
   * balde do "desconhecido" — e a decisão de licença teria sido tomada por omissão.
   * Uma decisão dessas nunca é tomada por omissão.
   */
  it("as fontes do código são exatamente as do banco", () => {
    const migration = readFileSync("lib/db/migrations/0039_sinopse_e_autor.sql", "utf8");
    const enumSql = migration.match(/create type texto_fonte as enum \(([^)]+)\)/)?.[1];
    expect(enumSql).toBeTruthy();

    const noBanco = [...enumSql!.matchAll(/'([a-z]+)'/g)].map((m) => m[1]).sort();
    expect(noBanco).toEqual([...FONTES].sort());
  });
});

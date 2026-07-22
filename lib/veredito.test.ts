import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { VERDICTS, mine, theirs, fromStars, fromHalfStars } from "@/lib/veredito";

/**
 * A tradução de estrela para palavra é degrau por degrau desde que o 1 virou
 * julgamento ("detestei"). Este teste existe para que ela nunca mude sem alguém
 * decidir que mudou.
 */
describe("a nota é uma palavra", () => {
  it("tem cinco, nesta ordem, e nenhuma delas é 'odiei'", () => {
    expect(VERDICTS.map((v) => v.mine)).toEqual([
      "detestei", "não gostei", "achei ok", "gostei", "adorei",
    ]);
  });

  it("fala em primeira pessoa para você e em terceira para os outros", () => {
    expect(mine(5)).toBe("adorei");
    expect(theirs(5)).toBe("adorou");
    expect(theirs(1)).toBe("detestou");
  });

  it("nunca devolve um número", () => {
    for (const v of VERDICTS) {
      expect(mine(v.value)).not.toMatch(/\d/);
      expect(theirs(v.value)).not.toMatch(/\d/);
    }
  });

  it("traduz a estrela de importação, cada degrau na sua palavra", () => {
    expect(fromStars(5)).toBe(5);
    expect(fromStars(4)).toBe(4);
    expect(fromStars(3)).toBe(3);
    expect(fromStars(2)).toBe(2);
    // Uma estrela era achatada em "não gostei" enquanto o degrau 1 se chamava
    // "não terminei" (um quase-status). Com o 1 virando julgamento, a tradução
    // ficou inteira e o aviso de perda saiu da importação.
    expect(fromStars(1)).toBe(1);
    expect(fromStars(0)).toBeNull();
  });

  it("traduz a meia-estrela antiga deste app", () => {
    expect(fromHalfStars(10)).toBe(5); // cinco estrelas
    expect(fromHalfStars(9)).toBe(4);  // quatro e meia
    expect(fromHalfStars(8)).toBe(4);
    expect(fromHalfStars(7)).toBe(3);  // três e meia
    expect(fromHalfStars(6)).toBe(3);
    expect(fromHalfStars(5)).toBe(2);  // duas e meia e para baixo
    expect(fromHalfStars(1)).toBe(2);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  O GLIFO DA NOTA NÃO PODE SER UMA RAMPA.
 *
 *  Os cinco vereditos ganharam um ícone (para uma lista de notas não
 *  virar uma mancha cinza). Se um dia alguém fizer o ícone CRESCER com a
 *  nota, ou a opacidade SUBIR com a nota, essa pessoa terá desenhado uma
 *  escala. Escala vira média, média vira placar, e placar é exatamente o
 *  que a nota-palavra existe para matar.
 *
 *  Este teste varre o componente e quebra o build se isso acontecer.
 *  Estrutura, e não vigilância: a regra escrita num comentário é a regra
 *  que a quarta pessoa esquece.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o glifo da nota é categórico, e nunca uma escala", () => {
  const src = readFileSync("components/veredito.tsx", "utf8");

  it("os cinco vereditos têm um glifo, e são cinco formas DIFERENTES", () => {
    const bloco = src.match(/const GLIFO = \{([\s\S]*?)\}/)![1]!;
    const formas = [...bloco.matchAll(/^\s*[1-5]:\s*(\w+),/gm)].map((m) => m[1]!);

    expect(formas, "faltou glifo para algum veredito").toHaveLength(5);
    expect(new Set(formas).size, "dois vereditos com a MESMA forma").toBe(5);
  });

  it("nunca usa uma estrela: estrela é escala, e escala vira média", () => {
    expect(src).not.toMatch(/\bStar\b|\bStars\b/);
  });

  it("o TAMANHO e o TRAÇO são constantes, e não função da nota", () => {
    // Um `size={10 + value * 2}` seria uma rampa desenhada, e é exatamente o que
    // este teste existe para impedir.
    expect(src).toMatch(/const TAMANHO = \d+;/);
    expect(src).toMatch(/const TRACO = [\d.]+;/);
    expect(src).not.toMatch(/size=\{[^}]*value/);
    expect(src).not.toMatch(/strokeWidth=\{[^}]*value/);
    expect(src).not.toMatch(/opacity[^}]*value/i);
  });

  it("o glifo não tem cor própria: a única cor do Gume é a capa de um livro", () => {
    expect(src).not.toMatch(/text-(red|green|amber|yellow|emerald|rose)-/);
    expect(src).not.toMatch(/color-accent/);
  });
});

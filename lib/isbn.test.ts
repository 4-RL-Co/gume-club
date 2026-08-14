import { describe, it, expect } from "vitest";
import { paraIsbn13 } from "@/lib/isbn";

describe("o ISBN de dez também é um ISBN", () => {
  it("converte um ISBN-10 real para o ISBN-13 real do mesmo livro", () => {
    // Par documentado publicamente (The C Programming Language, edição de
    // referência do algoritmo EAN-13): 0-306-40615-2 ↔ 978-0-306-40615-7.
    expect(paraIsbn13("0306406152")).toBe("9780306406157");
  });

  it("aceita hífen, espaço e o X do dígito verificador", () => {
    expect(paraIsbn13("0-306-40615-2")).toBe("9780306406157");
    expect(paraIsbn13("0 306 40615 2")).toBe("9780306406157");
    expect(paraIsbn13("080442957X")).toBe(paraIsbn13("080442957x"));
  });

  it("um ISBN-13 já no formato certo passa direto", () => {
    expect(paraIsbn13("9780306406157")).toBe("9780306406157");
    expect(paraIsbn13("978-0-306-40615-7")).toBe("9780306406157");
  });

  it("o que não é dez nem treze dígitos não vira nada — não é um branco calado", () => {
    expect(paraIsbn13("123")).toBeNull();
    expect(paraIsbn13("12345678901234")).toBeNull();
    expect(paraIsbn13("")).toBeNull();
  });

  it("o nono caractere do ISBN-10 tem que ser dígito ou X, nunca outra letra", () => {
    expect(paraIsbn13("03064061Z2")).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("builds a book slug from title and author", () => {
    expect(slugify("A Arte da Guerra-Sun Tzu")).toBe("a-arte-da-guerra-sun-tzu");
  });

  it("strips accents and cedillas", () => {
    expect(slugify("Ficções-Jorge Luis Borges")).toBe("ficcoes-jorge-luis-borges");
  });

  it("collapses punctuation and trims separators", () => {
    expect(slugify("  Dom  Casmurro!!  ")).toBe("dom-casmurro");
  });

  it("falls back when nothing is sluggable", () => {
    expect(slugify("!!!")).toBe("obra");
  });
});

describe("uniqueSlug", () => {
  it("returns the base when free", () => {
    expect(uniqueSlug("a-b", new Set())).toBe("a-b");
  });

  it("suffixes on collision with a short number", () => {
    expect(uniqueSlug("a-b", new Set(["a-b"]))).toBe("a-b-2");
    expect(uniqueSlug("a-b", new Set(["a-b", "a-b-2"]))).toBe("a-b-3");
  });
});

import { describe, it, expect } from "vitest";
import { LIMITS, clamp, clampRequired } from "@/lib/limits";

describe("teto de texto", () => {
  it("corta no limite, e o limite é do servidor", () => {
    const enorme = "a".repeat(5_000_000);
    expect(clamp(enorme, LIMITS.review)!.length).toBe(LIMITS.review);
    expect(clamp(enorme, LIMITS.bio)!.length).toBe(LIMITS.bio);
  });

  it("campo em branco vira null, e nunca string vazia", () => {
    expect(clamp("   ", LIMITS.bio)).toBeNull();
    expect(clamp("", LIMITS.bio)).toBeNull();
    expect(clampRequired("   ", LIMITS.title)).toBe("");
  });

  it("o que não é texto não passa", () => {
    expect(clamp(undefined, 10)).toBeNull();
    expect(clamp(null, 10)).toBeNull();
    expect(clamp({ toString: () => "x".repeat(99) }, 10)).toBeNull();
    expect(clamp(12345, 10)).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { tipoDeImagem } from "@/lib/tipo-de-imagem";

/**
 * O caso que motivou o módulo: um HEIC de nome .png tem que ser reconhecido
 * como HEIC, porque é isso que decide se a conversão roda antes do recorte.
 * O nome do arquivo não aparece nesta API de propósito: ele não é evidência.
 */
describe("o tipo da imagem vem dos bytes, nunca do nome", () => {
  const heic = (marca: string) =>
    new Uint8Array([
      0, 0, 0, 0x18,
      ...[..."ftyp"].map((c) => c.charCodeAt(0)),
      ...[...marca].map((c) => c.charCodeAt(0)),
      0, 0, 0, 0,
    ]);

  it("reconhece png, jpeg e webp pelas assinaturas", () => {
    expect(tipoDeImagem(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    expect(tipoDeImagem(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]))).toBe("jpeg");
    expect(
      tipoDeImagem(new Uint8Array([...[..."RIFF"].map((c) => c.charCodeAt(0)), 0, 0, 0, 0, ...[..."WEBP"].map((c) => c.charCodeAt(0))])),
    ).toBe("webp");
  });

  it("reconhece o HEIC do iPhone em todas as marcas que ele usa", () => {
    for (const marca of ["heic", "heix", "hevc", "heif", "mif1", "msf1"]) {
      expect(tipoDeImagem(heic(marca))).toBe("heic");
    }
  });

  it("um RIFF sem WEBP não é webp, e um ftyp de mp4 não é heic", () => {
    expect(
      tipoDeImagem(new Uint8Array([...[..."RIFF"].map((c) => c.charCodeAt(0)), 0, 0, 0, 0, ...[..."WAVE"].map((c) => c.charCodeAt(0))])),
    ).toBe("desconhecido");
    expect(tipoDeImagem(heic("mp42"))).toBe("desconhecido");
  });

  it("bytes curtos ou vazios não quebram, só não são nada", () => {
    expect(tipoDeImagem(new Uint8Array([]))).toBe("desconhecido");
    expect(tipoDeImagem(new Uint8Array([0x89]))).toBe("desconhecido");
  });
});

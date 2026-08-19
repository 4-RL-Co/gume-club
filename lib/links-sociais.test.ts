import { describe, it, expect } from "vitest";
import { urlValida, rotuloDoLink, slugDoLink } from "@/lib/links-sociais";

describe("urlValida: só http/https, e uma URL de verdade", () => {
  it("aceita http e https", () => {
    expect(urlValida("https://instagram.com/alguem")).not.toBeNull();
    expect(urlValida("http://meusite.com.br")).not.toBeNull();
  });

  it("recusa protocolos perigosos e texto solto", () => {
    expect(urlValida("javascript:alert(1)")).toBeNull();
    expect(urlValida("não é um link")).toBeNull();
    expect(urlValida("")).toBeNull();
    expect(urlValida("ftp://arquivo.com")).toBeNull();
  });
});

describe("rotuloDoLink: o nome vem do domínio, nunca perguntado", () => {
  it("reconhece as redes mais comuns", () => {
    expect(rotuloDoLink("https://instagram.com/alguem")).toBe("Instagram");
    expect(rotuloDoLink("https://www.instagram.com/alguem")).toBe("Instagram");
    expect(rotuloDoLink("https://x.com/alguem")).toBe("X");
    expect(rotuloDoLink("https://twitter.com/alguem")).toBe("X");
    expect(rotuloDoLink("https://bsky.app/profile/alguem")).toBe("Bluesky");
    expect(rotuloDoLink("https://github.com/alguem")).toBe("GitHub");
  });

  it("o que ninguém aqui conhece mostra o próprio domínio, não 'site' genérico", () => {
    expect(rotuloDoLink("https://meusite.com.br/sobre")).toBe("meusite.com.br");
  });
});

describe("slugDoLink: o desenho do ícone, quando o Gume tem um", () => {
  it("as redes com desenho próprio devolvem o slug do simple-icons", () => {
    expect(slugDoLink("https://instagram.com/alguem")).toBe("instagram");
    expect(slugDoLink("https://x.com/alguem")).toBe("x");
    expect(slugDoLink("https://www.github.com/alguem")).toBe("github");
  });

  it("rede reconhecida sem desenho (federada, ou tirada do pacote) devolve null", () => {
    expect(slugDoLink("https://mastodon.social/@alguem")).toBeNull();
    expect(slugDoLink("https://linkedin.com/in/alguem")).toBeNull();
  });

  it("domínio desconhecido, ou link inválido, devolve null", () => {
    expect(slugDoLink("https://meusite.com.br")).toBeNull();
    expect(slugDoLink("não é um link")).toBeNull();
  });
});

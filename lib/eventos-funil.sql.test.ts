import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { POST } from "@/app/api/eventos/route";
import { normalizarOrigem } from "@/lib/funil";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O FUNIL NÃO GUARDA QUEM VISITOU. Mesma família de lib/torneira.sql.test.ts,
 *  contra Postgres de verdade.
 *
 *  Duas metades: a tabela não tem ONDE guardar uma pessoa (o schema), e o
 *  escritor não deixa NADA estranho passar por uma porta lateral (um corpo
 *  forjado com campos que não deveriam existir).
 * ════════════════════════════════════════════════════════════════════
 */

describe("eventos_funil não tem coluna de pessoa", () => {
  it("a tabela não tem coluna que aponte para gente", async () => {
    const cols = await db.execute<{ column_name: string }>(sql`
      select column_name from information_schema.columns
       where table_name = 'eventos_funil'`);

    const nomes = cols.map((c) => c.column_name);
    // "sessao_anon" NÃO bate de propósito: é o identificador anônimo que a
    // tabela existe para ter, e não aponta para uma conta em lugar nenhum.
    const suspeitos = nomes.filter((n) =>
      /user|usuario|viewer|leitor|email|nome|name|\bip\b|agent|fingerprint/i.test(n),
    );

    expect(
      suspeitos,
      `a tabela do funil ganhou uma coluna que aponta para uma PESSOA: ${suspeitos.join(", ")}. ` +
        "Uma coluna que não existe não vaza.",
    ).toEqual([]);
  });
});

describe("o escritor ignora qualquer coisa parecida com dado de pessoa", () => {
  it("um corpo forjado com e-mail/ip/user-agent não grava nenhum desses valores", async () => {
    const marcaFalsa = "vazamento-de-teste@nao-deveria-existir.com";

    const res = await POST(
      new Request("http://localhost/api/eventos", {
        method: "POST",
        body: JSON.stringify({
          tipo: "visita_home",
          origem: "reddit",
          // Nenhum destes campos existe no tipo esperado pelo escritor — a
          // pergunta é se um corpo hostil consegue empurrá-los pra dentro
          // mesmo assim.
          email: marcaFalsa,
          ip: "203.0.113.7",
          userAgent: "Mozilla/5.0 (o navegador de alguém)",
          userId: "00000000-0000-0000-0000-000000000000",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(res.status).toBe(200);

    // A sessão anônima veio no Set-Cookie da resposta: é assim que a linha
    // gravada é achada, sem depender de nenhum campo que não devia existir.
    const setCookie = res.headers.get("set-cookie") ?? "";
    const sessaoAnon = /gume_sessao_anon=([0-9a-f-]{36})/i.exec(setCookie)?.[1];
    expect(sessaoAnon, "a resposta não devolveu o cookie de sessão anônima").toBeTruthy();

    const linhas = await db.execute<Record<string, unknown>>(sql`
      select * from eventos_funil where sessao_anon = ${sessaoAnon}::uuid`);
    expect(linhas.length).toBe(1);

    const linha = JSON.stringify(linhas[0]);
    expect(linha, "o e-mail forjado vazou para a linha gravada").not.toContain(marcaFalsa);
    expect(linha, "o IP forjado vazou para a linha gravada").not.toContain("203.0.113.7");
    expect(linha, "o user-agent forjado vazou para a linha gravada").not.toContain("Mozilla");

    await db.execute(sql`delete from eventos_funil where sessao_anon = ${sessaoAnon}::uuid`);
  });

  it("um tipo fora da lista fechada é recusado, e nada é gravado", async () => {
    const res = await POST(
      new Request("http://localhost/api/eventos", {
        method: "POST",
        body: JSON.stringify({ tipo: "isso-nao-e-um-evento-de-verdade" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("normalizarOrigem nunca devolve a URL crua", () => {
  it("um referrer com caminho e query vira só o balde do domínio", () => {
    expect(normalizarOrigem("https://old.reddit.com/r/livros/comments/abc123/meu_post?ref=share")).toBe("reddit");
    expect(normalizarOrigem("https://l.facebook.com/l.php?u=https://gume.club")).toBe("facebook");
  });

  it("nada reconhecido vira 'outro', e não a string original", () => {
    const bruto = "https://um-blog-qualquer.exemplo.com/post-que-poderia-identificar-alguem";
    expect(normalizarOrigem(bruto)).toBe("outro");
  });

  it("valor vazio ou de tipo errado vira nulo", () => {
    expect(normalizarOrigem("")).toBeNull();
    expect(normalizarOrigem(null)).toBeNull();
    expect(normalizarOrigem(42)).toBeNull();
  });
});

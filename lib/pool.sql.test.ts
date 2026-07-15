import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { searchLocal } from "@/lib/catalog";

/**
 * ════════════════════════════════════════════════════════════════════
 *  DETERMINISMO SOB POOL.
 *
 *  O `set_limit()` do trigrama é um ajuste POR CONEXÃO. Rodá-lo solto
 *  antes da consulta, com um pool de dez conexões, é sorteio: a consulta
 *  cai numa conexão que não recebeu o ajuste, e volta com outro
 *  resultado. A MESMA busca devolvia 20 livros numa chamada e 14 na
 *  seguinte.
 *
 *  Isso apareceu como um bug de busca. É a FORMA de um vazamento.
 *
 *  Se um dia a autorização depender de estado de sessão (um
 *  `set_config('app.user_id')` lido por uma política de RLS, por
 *  exemplo), o mesmo sorteio passa a decidir QUEM a query acha que você
 *  é. Numa conexão o filtro vale; na seguinte, não vale, e ninguém vê,
 *  porque a resposta parece plausível.
 *
 *  Estes testes fecham a porta dos dois lados: um prova que o resultado
 *  é o mesmo dez vezes seguidas, e o outro prova que nada de
 *  autorização depende de sessão, varrendo o código atrás disso.
 * ════════════════════════════════════════════════════════════════════
 */

describe("o pool não sorteia resultado", () => {
  it("o limiar do trigrama viaja no handshake, e vale em TODA conexão", async () => {
    // Dez consultas seguidas caem em conexões diferentes do pool. Todas têm que
    // enxergar o mesmo limiar, ou a busca vira loteria.
    const limiares = await Promise.all(
      Array.from({ length: 10 }, () =>
        db.execute<{ v: string }>(sql`select current_setting('pg_trgm.similarity_threshold') as v`),
      ),
    );

    const vistos = new Set(limiares.map((r) => r[0]!.v));

    expect(
      vistos.size,
      `o limiar difere entre conexões do pool: ${[...vistos].join(", ")}. A busca vira sorteio.`,
    ).toBe(1);
    expect([...vistos][0]).toBe("0.45");
  });

  it("a mesma busca, dez vezes, devolve o mesmo resultado", async () => {
    const corridas = await Promise.all(
      Array.from({ length: 10 }, () => searchLocal("machado")),
    );

    const assinaturas = new Set(
      corridas.map((hits) => `${hits.length}|${hits.map((h) => h.title).join("~")}`),
    );

    expect(
      assinaturas.size,
      "a mesma busca devolveu resultados diferentes em conexões diferentes do pool",
    ).toBe(1);
  });
});

/**
 * A varredura. Estrutura, não vigilância.
 *
 * Hoje NADA de autorização depende de estado de sessão: o visibleTo() é um
 * predicado puro, com o id do leitor indo como parâmetro na própria consulta.
 * Este teste existe para que ninguém introduza essa dependência sem perceber.
 *
 * Se um dia a gente QUISER usar RLS de propósito, este teste falha, e falhar é o
 * ponto: aí a decisão passa por um humano acordado, que vai ter que garantir que
 * o `set_config` viaja no handshake da conexão, e não solto antes da query.
 */
const PROIBIDO = [
  { termo: /\bset_config\s*\(/i, porque: "variável de sessão" },
  { termo: /\bcurrent_setting\s*\(/i, porque: "leitura de variável de sessão" },
  { termo: /\bset\s+role\b/i, porque: "troca de papel por sessão" },
  { termo: /\bset\s+search_path\b/i, porque: "search_path por sessão" },
  { termo: /\brow\s+level\s+security\b|\benable\s+row\s+level\b/i, porque: "RLS depende de sessão" },
];

function arquivos(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const full = join(dir, nome);
    if (statSync(full).isDirectory()) arquivos(full, out);
    else if ([".ts"].includes(extname(nome)) && !nome.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

describe("nada de autorização depende de estado de sessão", () => {
  const raiz = process.cwd();

  it("o código de servidor não lê nem escreve variável de sessão", () => {
    const achados: string[] = [];

    for (const arquivo of arquivos(join(raiz, "lib"))) {
      const src = readFileSync(arquivo, "utf8");
      for (const { termo, porque } of PROIBIDO) {
        // o próprio ajuste do trigrama é a exceção conhecida, e ele viaja no
        // handshake da conexão (lib/db/index.ts), que é o jeito seguro
        if (termo.test(src) && !arquivo.endsWith("lib/db/index.ts")) {
          achados.push(`${arquivo.slice(raiz.length + 1)}: ${porque}`);
        }
      }
    }

    expect(
      achados,
      `estado de sessão no código de servidor. Com um pool, ele é sorteado por conexão:\n${achados.join("\n")}`,
    ).toEqual([]);
  });
});

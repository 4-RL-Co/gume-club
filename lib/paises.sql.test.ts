import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { paisDe } from "@/lib/paises";

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM PAÍS, UM NOME — NO BANCO, E NÃO SÓ NA FUNÇÃO.
 *
 *  `lib/paises.test.ts` prova que a REGRA está certa. Este arquivo prova que o BANCO a
 *  obedece — que é outra coisa, e é a que importa.
 *
 *  O acervo tinha o Brasil escrito de dois jeitos ("Brasil", "Brasileira") e o Reino
 *  Unido de três ("Reino Unido", "Britânica", e um "Unido" que uma regex minha
 *  fabricou). A /estatisticas conta países agrupando por este campo: com o Brasil
 *  contado duas vezes, ela diria "autores de oito países" quando são sete.
 *
 *  Uma estatística que conta a mesma coisa duas vezes é uma estatística em que ninguém
 *  confia — e ela é uma das melhores telas do app.
 *
 *  Este teste é o que impede o próximo backfill de trazer o problema de volta em
 *  silêncio: se alguém escrever "Brasileira" de novo, a build quebra.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o país no banco", () => {
  it("está escrito de um jeito só, e nenhum nome é uma variante de outro", async () => {
    const linhas = await db.execute<{ nationality: string; n: number }>(sql`
      select nationality, count(*)::int as n
        from authors
       where nationality is not null
       group by nationality`);

    // Um banco vazio (a CI recém-migrada) não tem o que medir, e isso não é um erro.
    if (linhas.length === 0) return;

    /**
     * Um nome está torto quando a regra o mudaria. Se `paisDe("Brasileira")` devolve
     * "Brasil", então "Brasileira" nunca deveria ter sido gravado.
     */
    const tortos = linhas
      .filter((l) => paisDe(l.nationality) !== l.nationality)
      .map((l) => `${l.nationality} (${l.n}×) deveria ser ${paisDe(l.nationality)}`);

    expect(tortos).toEqual([]);
  }, 30_000);
});

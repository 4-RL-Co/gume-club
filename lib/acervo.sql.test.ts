import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O CANÁRIO DO ACERVO. Um import que perde 12% do acervo tem que GRITAR.
 *
 *  O `scripts/import-openlibrary.mjs` lia a autoria do registro de EDIÇÃO —
 *  e a edição em português quase nunca traz autor. A ligação obra→autor mora no
 *  registro de OBRA, e o import nunca abriu aquele dump.
 *
 *  Resultado: **43.739 obras sem autor nenhum**, 11,7% do acervo. Mais 3.916 com
 *  o "autor" preenchido como `[author not identified]`, `Brazil` ou `Portugal`.
 *
 *  E ninguém percebeu. O import terminou dizendo "✓ pronto". A busca por autor
 *  não achava 47.655 obras, a página de um autor abria vazia, e a poda ia apagar
 *  Madame Bovary por não saber que era do Flaubert.
 *
 *  ═══ POR QUE ESTE TESTE EXISTE, E NÃO SÓ UM AVISO NO SCRIPT ═══
 *
 *  Um aviso no fim de um script que roda por três horas é um aviso que rola para
 *  fora da tela. Um teste que quebra o build é um teste que ninguém ignora.
 *
 *  Este arquivo olha para o BANCO, e não para o código: ele não pergunta se o
 *  import está escrito certo, pergunta se o acervo está inteiro. É a diferença
 *  entre revisar a receita e provar a comida.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * O PISO. Noventa e cinco por cento das obras precisam ter autor.
 *
 * Por que 95 e não 100: um acervo de verdade tem antologia, obra anônima, documento
 * oficial e ata de congresso — coisas que legitimamente não têm um autor, e exigir 100%
 * transformaria o canário num alarme que toca todo dia e que todo mundo aprende a
 * ignorar.
 *
 * E por que 95 e não 85: o bug que este teste existe para pegar derrubou o número para
 * 88,3%. Um piso de 85% teria deixado o bug passar sorrindo. O piso tem que doer ANTES
 * de o estrago acontecer, e não depois.
 */
const PISO_COM_AUTOR = 0.95;

/**
 * Nomes que ocupam o campo de autor sem serem uma pessoa. Eles são PIORES que o nulo:
 * um nulo a gente conta e vê; um "[author not identified]" passa por autor de verdade
 * em toda contagem, em toda busca e em toda poda.
 */
const NAO_SAO_PESSOAS = [
  "[author not identified]",
  "invalid author ID",
  "Brazil",
  "Portugal",
  "Portugal.",
  "s.n.",
];

describe("o acervo tem autor", () => {
  it(`pelo menos ${PISO_COM_AUTOR * 100}% das obras têm um autor que é uma pessoa`, async () => {
    const [r] = await db.execute<{ total: number; com_autor: number }>(sql`
      select count(*)::int as total,
             count(*) filter (
               where w.author_id is not null
                 and not exists (
                   select 1 from authors a
                    where a.id = w.author_id
                      and a.name = any(${sql.param(NAO_SAO_PESSOAS)}::text[]))
             )::int as com_autor
        from works w`);

    // Um banco vazio (CI recém-migrado) não tem o que medir, e não é um erro.
    if (!r || r.total < 1000) return;

    const fracao = r.com_autor / r.total;
    const orfas = r.total - r.com_autor;

    expect(
      fracao,
      `${orfas.toLocaleString("pt-BR")} de ${r.total.toLocaleString("pt-BR")} obras ` +
        `(${((1 - fracao) * 100).toFixed(1)}%) não têm autor utilizável.\n\n` +
        "Foi assim que o acervo perdeu 47 mil autores em silêncio: o import lia a " +
        "autoria do registro de EDIÇÃO, e a edição em português quase nunca traz um. " +
        "A ligação obra→autor mora no registro de OBRA.\n\n" +
        "Se isto quebrou depois de um import, o import está perdendo autor de novo. " +
        "Rode: node scripts/backfill-authors.mjs",
    ).toBeGreaterThanOrEqual(PISO_COM_AUTOR);
  });

  it("os livros que a gente SABE que existem estão assinados por quem os escreveu", async () => {
    /**
     * Não é uma amostra: são os casos que o bug produziu, um por um. Enquanto este teste
     * falhar, a busca por autor está quebrada — e a poda é perigosa, porque ela apaga o
     * que não casa com o cânone, e uma obra sem autor não casa com ninguém.
     *
     * "A Morte de Ivan Ilitch" é o caso do TRADUTOR: a Open Library lista
     * [Roberto Algarte, Лев Толстой], e o import pegava o primeiro.
     */
    const esperado: [string, string][] = [
      ["madame bovary", "flaubert"],
      ["guerra e paz", "tolst"],
      ["anna karenina", "tolst"],
      ["torto arado", "itamar vieira"],
      ["morte de ivan ilitch", "tolst"],
    ];

    const errados: string[] = [];

    for (const [titulo, autorEsperado] of esperado) {
      /**
       * ═══ SEM `LIMIT`. E ISSO É O CONSERTO DE UM TESTE QUE MENTIA ═══
       *
       * Esta consulta tinha um `limit 5` e nenhum `order by`. "Guerra e paz" casa vinte
       * obras do acervo — "Guerra e paz no norte de Angola", "Guerra e paz com energia
       * nuclear", "Guerra e Paz, Portinari" —, e o Postgres devolvia CINCO QUAISQUER
       * delas. O Tolstói está lá, e no dia em que ele não caiu no sorteio o teste
       * acusou um bug que não existia.
       *
       * Um teste que passa ou falha conforme a ordem que o banco resolveu devolver não
       * está medindo o acervo: está jogando dado. E é a sexta vez que este repositório
       * escreve um teste que passa por acidente — sempre pela mesma raiz, que é olhar
       * para uma AMOSTRA e concluir sobre o TODO.
       *
       * Sem `limit`: ou o livro certo está assinado por quem o escreveu, ou não está.
       */
      const linhas = await db.execute<{ title: string; autor: string | null }>(sql`
        select w.title, a.name as autor
          from works w left join authors a on a.id = w.author_id
         where immutable_unaccent(lower(w.title)) like ${"%" + titulo + "%"}
         order by w.title`);

      // O livro não está no acervo? Então não há nada a conferir. Este teste vigia o
      // AUTOR, e não a presença do livro.
      if (linhas.length === 0) continue;

      const algumCerto = linhas.some((l) =>
        (l.autor ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
          .includes(autorEsperado),
      );

      if (!algumCerto) {
        // A busca é ampla de propósito, então a mensagem mostra só as primeiras: quem for
        // ler isto precisa de um exemplo, e não de vinte linhas de ruído.
        const achados = linhas
          .slice(0, 5)
          .map((l) => `${l.title} → ${l.autor ?? "SEM AUTOR"}`)
          .join("; ");
        const resto = linhas.length > 5 ? ` (e mais ${linhas.length - 5})` : "";
        errados.push(`"${titulo}" devia ser de ${autorEsperado}, e está como: ${achados}${resto}`);
      }
    }

    expect(
      errados,
      "estes livros existem no acervo e estão assinados pela pessoa errada (ou por " +
        "ninguém):\n" + errados.map((e) => `  ${e}`).join("\n"),
    ).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { searchLocal } from "@/lib/catalog";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE A PESSOA DIGITOU TEM QUE VIR EM PRIMEIRO.
 *
 *  Três buscas erradas, achadas rodando o app de verdade — e as três só aparecem
 *  contra o acervo cheio. Nenhuma delas se vê lendo o SQL.
 *
 *    "dom casmurro"                            →  "Ciumento de carteirinha: uma
 *                                                  aventura com Dom Casmurro"
 *    "memorias postumas bras cubas antofagica" →  um estudo crítico, e nenhuma
 *                                                  edição da Antofágica
 *
 *  ═══ POR QUE OS DOIS ERROS TÊM A MESMA RAIZ ═══
 *
 *  A busca comparava o que a pessoa digitou com o título, e nada mais.
 *
 *  Um livro ESCRITO SOBRE Dom Casmurro tem "Dom Casmurro" no título, então ele casa
 *  1.00 — igualzinho ao livro de verdade. Todo clássico brasileiro tem uma prateleira
 *  de estudos críticos com o nome dele no título, e essa prateleira enterrava o
 *  original.
 *
 *  E "antofagica" era só mais uma palavra do título procurado, o que derrubava a nota
 *  do livro certo em vez de apontar para a edição certa.
 *
 *  ═══ ESTE TESTE OLHA PARA O BANCO, E NÃO PARA O CÓDIGO ═══
 *
 *  Ele não pergunta se a consulta está escrita bonito. Pergunta o que a pessoa VÊ. Num
 *  banco vazio (a CI recém-migrada) não há o que medir, e isso não é um erro — mas na
 *  máquina de quem tem o acervo, ele quebra na cara.
 * ════════════════════════════════════════════════════════════════════
 */

/** Um banco vazio não tem o que responder. Ver a nota acima. */
async function acervoCheio(): Promise<boolean> {
  const [r] = await db.execute<{ n: number }>(sql`select count(*)::int as n from works`);
  return Number(r?.n ?? 0) > 1000;
}

describe("a busca põe em primeiro o que a pessoa pediu", () => {
  it("'dom casmurro' devolve Dom Casmurro, e não um livro SOBRE Dom Casmurro", async (ctx) => {
    if (!(await acervoCheio())) return ctx.skip();

    const [primeiro] = await searchLocal("dom casmurro");
    expect(primeiro).toBeDefined();

    /**
     * O título É "Dom Casmurro" — não CONTÉM "Dom Casmurro".
     *
     * O subtítulo é perdoado ("Dom Casmurro: romance" é Dom Casmurro), e é por isso que
     * a comparação corta nos dois-pontos. O que não passa é o título que põe outra
     * coisa ANTES do nome do livro, porque aí o livro não é o assunto: é a referência.
     */
    const antesDosDoisPontos = primeiro!.title.split(":")[0]!.trim().toLowerCase();
    expect(antesDosDoisPontos).toBe("dom casmurro");
  }, 30_000);

  it("nomear a editora traz a edição DAQUELA editora, e não uma qualquer", async (ctx) => {
    if (!(await acervoCheio())) return ctx.skip();

    // O acervo tem que ter a editora, senão o teste não está medindo nada — ele estaria
    // passando por ausência, e um teste que passa por ausência é pior do que teste nenhum.
    const [tem] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from editions
       where publisher = 'Antofágica'
         and exists (select 1 from works w
                      where w.id = work_id
                        and immutable_unaccent(lower(w.title)) like '%bras cubas%')`);
    expect(Number(tem?.n ?? 0)).toBeGreaterThan(0);

    const [primeiro] = await searchLocal("memorias postumas bras cubas antofagica");

    expect(primeiro?.publisher).toBe("Antofágica");
    expect(primeiro?.title.toLowerCase()).toContain("brás cubas");
  }, 30_000);

  it("sem editora na frase, a busca continua sendo a que era", async (ctx) => {
    if (!(await acervoCheio())) return ctx.skip();

    // A separação de editora é um DESEMPATE, e não um peso: quando ninguém nomeou uma
    // editora, ela não pode mudar coisa nenhuma. Este teste é o que garante que o
    // conserto de uma busca não estragou as outras.
    const [primeiro] = await searchLocal("memorias postumas de bras cubas");
    expect(primeiro?.title.toLowerCase()).toContain("brás cubas");
  }, 30_000);
});

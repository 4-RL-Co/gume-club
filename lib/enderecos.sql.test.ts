import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { works } from "@/lib/db/schema";
import { renomearObra, slugAtualDe } from "@/lib/book";

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM ENDEREÇO JÁ COMPARTILHADO NUNCA MORRE.
 *
 *  ═══ POR QUE ISTO EXISTE ═══
 *
 *  O endereço de uma obra carrega o nome do autor. Quando o autor está ERRADO — e
 *  estava: a importação gravou a TRADUTORA da Metamorfose como autora, e o endereço
 *  nasceu `metamorfose-sheila-koerich` —, corrigir a ficha não conserta o endereço.
 *
 *  E o endereço é a parte que as pessoas veem, copiam e mandam uma para a outra.
 *  Renomear sem guardar o antigo troca uma verruga visível por uma perda silenciosa:
 *  todo link já compartilhado passa a dar "não encontrado", e quem clicou não faz
 *  ideia do que aconteceu. **Um link quebrado é pior que um link feio** — o feio
 *  ainda leva ao livro.
 *
 *  Precisa de banco. O CI sobe um.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let obraId: string;

beforeAll(async () => {
  const [w] = await db
    .insert(works)
    .values({ slug: `end-errado-${marca}`, title: `zz endereço ${marca}` })
    .returning({ id: works.id });
  obraId = w!.id;
});

afterAll(async () => {
  await db.execute(sql`delete from works where id = ${obraId}::uuid`);
});

describe("o endereço antigo continua chegando na obra", () => {
  it("renomear guarda o endereço velho, e ele aponta para o novo", async () => {
    await renomearObra(obraId, `end-certo-${marca}`);

    const [obra] = await db.execute<{ slug: string }>(sql`
      select slug from works where id = ${obraId}::uuid`);
    expect(obra?.slug, "a obra não foi renomeada").toBe(`end-certo-${marca}`);

    expect(
      await slugAtualDe(`end-errado-${marca}`),
      "o endereço antigo não leva a lugar nenhum: todo link já compartilhado quebrou, " +
        "e quem clicou vê 'não encontrado' sem entender por quê.",
    ).toBe(`end-certo-${marca}`);
  });

  /**
   * ═══ O CASO QUE TRANSFORMA O CONSERTO NUM BUG PIOR ═══
   *
   * Renomear A→B→A. Sem cuidado, "A" fica registrado como endereço ANTIGO de uma
   * obra que agora se chama "A" de novo — e a página passa a redirecionar A para A,
   * para sempre. O navegador chama isso de laço e desiste; a pessoa vê uma tela de
   * erro no lugar de um livro que existe.
   *
   * É pior que o bug original: antes o link levava ao lugar errado, agora não leva
   * a lugar nenhum.
   */
  it("voltar ao nome antigo não cria um laço de redirecionamento", async () => {
    await renomearObra(obraId, `end-errado-${marca}`);

    expect(
      await slugAtualDe(`end-errado-${marca}`),
      "o endereço atual da obra continua listado como 'antigo': a página vai " +
        "redirecionar ele para ele mesmo e o navegador entra em laço.",
    ).toBeNull();

    // E o caminho de volta continua valendo: quem tem o link de `end-certo` chega.
    expect(await slugAtualDe(`end-certo-${marca}`)).toBe(`end-errado-${marca}`);
  });

  it("um endereço que nunca existiu continua sendo não-encontrado", async () => {
    expect(
      await slugAtualDe(`nunca-existiu-${marca}`),
      "um endereço inventado passou a redirecionar para alguma coisa",
    ).toBeNull();
  });

  /**
   * A página tem que CONSULTAR isso antes de desistir. Sem a chamada, a tabela existe,
   * os testes acima passam, e o leitor continua vendo "não encontrado" — a trava
   * inteira viraria enfeite.
   */
  it("a página do livro pergunta pelo endereço antigo antes de dizer não-encontrado", () => {
    const src = readFileSync("app/livro/[slug]/page.tsx", "utf8")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n]*/g, " ");

    expect(
      /slugAtualDe\(/.test(src),
      "a página do livro parou de perguntar pelo endereço antigo: os links " +
        "compartilhados voltaram a quebrar, e a tabela virou enfeite.",
    ).toBe(true);

    expect(
      /permanentRedirect\(/.test(src),
      "o redirecionamento deixou de ser permanente: a mudança de endereço É " +
        "definitiva, e um 307 faz buscador e navegador baterem aqui para sempre.",
    ).toBe(true);
  });
});

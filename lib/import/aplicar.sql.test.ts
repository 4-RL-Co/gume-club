import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { parse } from "@/lib/import/parse";
import { aplicar } from "@/lib/import/aplicar";

/**
 * ════════════════════════════════════════════════════════════════════
 *  IMPORTAR DUAS VEZES NÃO PODE DUPLICAR NADA.
 *
 *  Este é o teste que separa um importador de um GERADOR DE LIXO, e a
 *  tela promete isso com todas as letras ("trouxe duas vezes o mesmo
 *  arquivo? nada duplica"). Uma promessa na tela sem um teste embaixo é
 *  uma mentira esperando o dia de ser descoberta.
 *
 *  E ele roda contra o Postgres DE VERDADE, porque o que está sendo
 *  testado são os `on conflict` e o casamento de livro, que são do
 *  banco. Um mock testaria a minha opinião sobre eles.
 * ════════════════════════════════════════════════════════════════════
 */

const goodreads = readFileSync("lib/import/fixtures/goodreads.csv", "utf8");
const actor = { id: "" };

beforeAll(async () => {
  const marca = Date.now().toString(36);
  const [u] = await db
    .insert(users)
    .values({ handle: `import-${marca}`, email: `import-${marca}@teste.local` })
    .returning({ id: users.id });
  actor.id = u!.id;
});

afterAll(async () => {
  /**
   * A limpeza varre pelo E-MAIL, e não só pelos ids desta rodada.
   *
   * Já vazou: quando o arquivo de teste falha ANTES do afterAll (e ele falhou, por
   * um erro de sintaxe de SQL na primeira versão), as linhas ficam no banco. E
   * usuário de teste no banco de desenvolvimento não é lixo inofensivo: ele APARECE
   * na busca de pessoas e na página /pessoas do app, como se fosse gente.
   *
   * Uma rede que só pega o que ela mesma jogou não pega o que a rodada anterior
   * deixou cair.
   */
  // As linhas da estante, as leituras, as notas e as estantes inventadas caem
  // junto por cascade. As OBRAS ficam: o catálogo é de todo mundo, e apagá-las
  // seria apagar livro de outra pessoa.
  if (actor.id) await db.execute(sql`delete from users where id = ${actor.id}::uuid`);

  // E a rede larga: qualquer sobra de uma rodada que morreu no meio.
  await db.execute(sql`delete from users where email like '%@teste.local'`);
});

/**
 * Uma consulta por tabela, escrita à mão.
 *
 * A versão curta disto recebia o nome da tabela como texto e o costurava dentro do
 * SQL. O `pnpm audit:security` quebrou o build por causa dela, e ele está CERTO:
 * montar SQL a partir de string é proibido neste repo, e "é só um teste" é
 * exatamente como a exceção entra. Uma regra com uma exceção é uma regra que a
 * quarta pessoa não segue.
 */
const um = async (q: ReturnType<typeof sql>) => {
  const [r] = await db.execute<{ n: number }>(q);
  return r?.n ?? 0;
};

const naEstante = () =>
  um(sql`select count(*)::int as n from library_entries where user_id = ${actor.id}::uuid`);
const notas = () =>
  um(sql`select count(*)::int as n from ratings where user_id = ${actor.id}::uuid`);
const estantesInventadas = () =>
  um(sql`select count(*)::int as n from collections where user_id = ${actor.id}::uuid`);

const leituras = () =>
  um(sql`select count(*)::int as n
           from readings r
           join library_entries le on le.id = r.entry_id
          where le.user_id = ${actor.id}::uuid`);

describe("o import grava a estante inteira", () => {
  it("traz os livros, as leituras, as notas e as estantes inventadas", async () => {
    const relatorio = await aplicar(actor, parse(goodreads));

    expect(relatorio.entraram).toBe(4);
    expect(relatorio.perdidos).toEqual([]);

    expect(await naEstante()).toBe(4);

    // Dom Casmurro foi lido TRÊS vezes, e o Kafka está sendo lido (uma leitura
    // aberta, sem data, porque o arquivo não trouxe o começo). Reler é de
    // primeira classe: as três contam.
    expect(await leituras()).toBeGreaterThanOrEqual(3);

    // Três livros têm nota; o Borges tem "0", que quer dizer NÃO AVALIEI.
    expect(await notas()).toBe(3);

    // A resenha E a nota privada, que são duas coisas diferentes.
    // A fixture tem mais de uma resenha, então `limit 1` sem ordem devolvia qualquer uma:
    // a nota privada "reler em 2030" é única do Dom Casmurro e prende a linha certa.
    const [resenha] = await db.execute<{ body: string; private_note: string | null }>(sql`
      select body, private_note from reviews
       where user_id = ${actor.id}::uuid and private_note = 'reler em 2030' limit 1`);
    expect(resenha?.body).toContain("continua");
    expect(resenha?.private_note).toBe("reler em 2030");

    // "favoritos" e "releituras" viraram estantes. "read" e "to-read" NÃO.
    const estantes = await db.execute<{ name: string }>(sql`
      select name from collections where user_id = ${actor.id}::uuid order by name`);
    expect(estantes.map((e) => e.name)).toEqual(["favoritos", "releituras", "ya"]);
  });

  it("não declara perda de nota: cada estrela tem a sua palavra", async () => {
    // O aviso de achatamento existiu enquanto uma e duas estrelas caíam juntas em
    // "não gostei". Com o degrau 1 virando julgamento ("detestei"), a tradução é
    // inteira e o aviso sumiu de propósito.
    const relatorio = await aplicar(actor, parse(goodreads));
    expect(relatorio.avisos.join(" ")).not.toMatch(/estrelas/);
  });
});

describe("importar DUAS vezes não duplica nada", () => {
  it("nem estante, nem leitura, nem nota, nem prateleira", async () => {
    const antes = {
      estante: await naEstante(),
      leituras: await leituras(),
      notas: await notas(),
      estantes: await estantesInventadas(),
    };

    // O MESMO arquivo, de novo. É o que a pessoa faz quando não tem certeza de
    // que deu certo na primeira vez, e é onde os outros importadores explodem.
    await aplicar(actor, parse(goodreads));

    expect(await naEstante(), "a estante duplicou").toBe(antes.estante);
    expect(await leituras(), "as leituras duplicaram: o ano dela contaria o dobro").toBe(
      antes.leituras,
    );
    expect(await notas(), "as notas duplicaram").toBe(antes.notas);
    expect(await estantesInventadas(), "as estantes inventadas duplicaram").toBe(antes.estantes);
  });

  it("e não cria NENHUMA obra nova no catálogo de todo mundo", async () => {
    /**
     * Um import que duplica obra não estraga só a estante de quem importou: ele
     * estraga o CATÁLOGO, que é compartilhado com todo mundo. Foi exatamente
     * assim que o do concorrente virou lixo.
     *
     * A medida é o DELTA, e não o total. O catálogo já tem sete obras chamadas
     * "Dom Casmurro" (o dump da Open Library trouxe o autor escrito de vários
     * jeitos, e trouxe estudos com o mesmo título), e isso é um problema
     * ANTERIOR a este import, anotado em docs/O-QUE-FALTA-NO-CODIGO.md. O que
     * este teste tem que provar é que o import não piora aquilo.
     */
    const obras = async () => {
      const [r] = await db.execute<{ n: number }>(sql`select count(*)::int as n from works`);
      return r!.n;
    };

    const antes = await obras();
    await aplicar(actor, parse(goodreads));
    expect(await obras(), "o segundo import criou obra nova no catálogo compartilhado").toBe(antes);
  });
});

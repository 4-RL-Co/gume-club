import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, editions, coverProposals } from "@/lib/db/schema";
import { getCatalogo } from "@/lib/contributors";
import { ligarAoConjunto, porEmblema, soltarDoConjunto } from "@/lib/conjuntos";

/**
 * ════════════════════════════════════════════════════════════════════
 *  TRAZER UM LIVRO É CONTRIBUIR. E ERA INVISÍVEL.
 *
 *  ═══ O BURACO ═══
 *
 *  A página de contribuidores existe para dar a ver que "quem conserta uma capa vale
 *  o que vale quem faz um commit". Ela contava CORREÇÕES, e mais nada.
 *
 *  Quem CRIA a ficha de um livro que faltava — o trabalho mais valioso para um
 *  catálogo — não aparecia. Não por esquecimento da tela: `works` não guardava quem
 *  criou. Em produção eram **3.307 obras de leitor sem dono nenhum**.
 *
 *  ═══ E QUEM SÓ TRAZ LIVRO NÃO ENTRAVA NA LISTA ═══
 *
 *  A consulta partia de `revisions`. Alguém que trouxesse cinquenta livros e nunca
 *  corrigisse um campo não existia nesta página — nem com zero, nem com nada.
 *
 *  ═══ TRÊS NÚMEROS, E NÃO UM ═══
 *
 *  Somar tudo esconderia a natureza do trabalho, que é o que a página serve para
 *  mostrar. A soma ORDENA; os três aparecem separados.
 *
 *  Precisa de banco. O CI sobe um.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let trouxe: string;
let corrigiu: string;
let montou: string;
let mandouCapa: string;
let alvoDoConjunto: string;

beforeAll(async () => {
  const mk = async (h: string) => {
    const [u] = await db.insert(users)
      .values({ handle: `${h}-${marca}`, email: `${h}-${marca}@ctb.test` })
      .returning({ id: users.id });
    return u!.id;
  };
  trouxe = await mk("ctb-trouxe");
  corrigiu = await mk("ctb-corrigiu");
  montou = await mk("ctb-montou");
  mandouCapa = await mk("ctb-capa");

  // Alguém que TROUXE dois livros e nunca corrigiu nada.
  for (const n of [1, 2]) {
    const [w] = await db.insert(works)
      .values({ slug: `ctb-${n}-${marca}`, title: `zz ctb ${n} ${marca}` })
      .returning({ id: works.id });
    await db.execute(sql`update works set created_by = ${trouxe}::uuid where id = ${w!.id}::uuid`);
  }

  // E alguém que corrigiu uma ficha e nunca trouxe livro.
  const [w] = await db.insert(works)
    .values({ slug: `ctb-alvo-${marca}`, title: `zz ctb alvo ${marca}` })
    .returning({ id: works.id });
  await db.execute(sql`
    insert into revisions (user_id, target_type, target_id, patch, previous)
    values (${corrigiu}::uuid, 'work', ${w!.id}::uuid,
            '{"title":"depois"}'::jsonb, '{"title":"antes"}'::jsonb)`);

  // E alguém que MONTOU um conjunto de edição (ligou um volume, e pôs o emblema)
  // e nunca corrigiu ficha nenhuma no sentido comum.
  const [wc] = await db.insert(works)
    .values({ slug: `ctb-cj-${marca}`, title: `zz ctb cj ${marca}` })
    .returning({ id: works.id });
  alvoDoConjunto = wc!.id;
  await ligarAoConjunto(
    { id: montou },
    alvoDoConjunto,
    { titulo: `zz ctb conjunto ${marca}`, total: 3, publisher: null },
    1,
  );
  const [c] = await db.execute<{ colecao_id: string }>(sql`
    select colecao_id from works where id = ${alvoDoConjunto}::uuid`);
  await porEmblema({ id: montou }, c!.colecao_id, "https://upload.wikimedia.org/zz-teste.svg");

  // E alguém que mandou capa, e ela foi usada. Uma segunda proposta ainda na fila
  // (pending) prova que só a que FOI USADA conta.
  const [wCapa] = await db.insert(works)
    .values({ slug: `ctb-capa-${marca}`, title: `zz ctb capa ${marca}` })
    .returning({ id: works.id });
  const [ed] = await db.insert(editions)
    .values({ workId: wCapa!.id, publisher: "Editora Teste" })
    .returning({ id: editions.id });
  await db.insert(coverProposals).values([
    { editionId: ed!.id, userId: mandouCapa, coverUrl: "https://upload.wikimedia.org/zz-capa-usada.jpg", state: "applied" },
    { editionId: ed!.id, userId: mandouCapa, coverUrl: "https://upload.wikimedia.org/zz-capa-fila.jpg", state: "pending" },
  ]);
});

afterAll(async () => {
  for (const id of [trouxe, corrigiu, montou, mandouCapa]) {
    await db.execute(sql`delete from users where id = ${id}::uuid`);
  }
  await db.execute(sql`delete from works where slug like ${`ctb-%${marca}`}`);
  await db.execute(sql`delete from colecoes where slug like ${`%ctb-conjunto-${marca}%`}`);
  await db.execute(sql`delete from series where slug like ${`%ctb-conjunto-${marca}%`}`);
});

describe("a página de contribuidores conta os quatro trabalhos", () => {
  it("quem só TROUXE livro aparece na lista", async () => {
    const lista = await getCatalogo();
    const p = lista.find((x) => x.handle === `ctb-trouxe-${marca}`);

    expect(
      p,
      "quem trouxe livros e nunca corrigiu um campo não aparece: o trabalho mais " +
        "valioso para um catálogo continua invisível.",
    ).toBeTruthy();
    expect(p?.livros).toBe(2);
    expect(p?.correcoes).toBe(0);
  });

  it("quem só corrigiu continua aparecendo, como sempre apareceu", async () => {
    const lista = await getCatalogo();
    const p = lista.find((x) => x.handle === `ctb-corrigiu-${marca}`);
    expect(p?.correcoes, "regressão: quem corrige sumiu da lista").toBe(1);
    expect(p?.livros).toBe(0);
  });

  /**
   * As três contagens vêm de tabelas diferentes. Um `join` entre elas multiplicaria as
   * linhas umas pelas outras: trinta correções virariam trezentas por causa de dez
   * livros, e ninguém desconfiaria de um número grande numa página de reconhecimento.
   */
  it("os números não se multiplicam entre si", async () => {
    const lista = await getCatalogo();
    const p = lista.find((x) => x.handle === `ctb-trouxe-${marca}`);
    expect(
      p?.livros,
      "a contagem de livros inflou: as subconsultas viraram join e as linhas se " +
        "multiplicaram umas pelas outras.",
    ).toBe(2);
  });

  /**
   * MONTAR UM CONJUNTO (ligar um volume, pôr o emblema) é revisão da mesma tabela de
   * uma correção de ficha, e por isso precisa de recorte próprio: sem ele, as duas
   * linhas de `revisions` cairiam dentro de `correcoes` e o trabalho de quem coleciona
   * ficaria com o rótulo genérico de quem só trocou um ano de edição. Ver lib/conjuntos.ts.
   */
  it("quem MONTA um conjunto aparece com rótulo próprio, e não vira 'correção'", async () => {
    const lista = await getCatalogo();
    const p = lista.find((x) => x.handle === `ctb-montou-${marca}`);

    expect(
      p,
      "quem ligou um volume a um conjunto e pôs o emblema não apareceu na lista",
    ).toBeTruthy();
    expect(
      p?.conjuntos,
      "as duas revisões de conjunto (ligar o volume, pôr o emblema) não foram contadas",
    ).toBe(2);
    expect(
      p?.correcoes,
      "o trabalho de conjunto vazou para o balde de 'correções': a mesma linha de " +
        "revisions contou duas vezes, uma vez em cada balde",
    ).toBe(0);
  });

  /**
   * SOLTAR é DESFAZER, e desfazer é corretivo, não montagem. `soltarDoConjunto()`
   * escreve na MESMA tabela e com a MESMA chave (`colecao_id`) que `ligarAoConjunto()`
   * — só que com o valor `null`. Contar as duas igual faria desfazer o próprio erro
   * inflar o balde de "coleções" por engano.
   */
  it("quem SOLTA um volume do conjunto conta como correção, e não como conjunto", async () => {
    await soltarDoConjunto({ id: montou }, alvoDoConjunto);

    const lista = await getCatalogo();
    const p = lista.find((x) => x.handle === `ctb-montou-${marca}`);

    expect(
      p?.conjuntos,
      "soltar o volume inflou o balde de conjuntos: continua contando só o que MONTA " +
        "(ligar o volume, pôr o emblema), não o que desfaz",
    ).toBe(2);
    expect(
      p?.correcoes,
      "soltar o volume não foi contado em lugar nenhum: desfazer uma ligação errada é " +
        "trabalho de catálogo, como qualquer outra correção",
    ).toBe(1);
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  'ACCEPTED' NUNCA FOI UM ESTADO DE VERDADE. NINGUÉM JAMAIS CONTOU POR CAPA.
   *
   *  O check constraint de cover_proposals só permite 'pending' | 'applied' |
   *  'refused' — e a consulta comparava com 'accepted', um valor que o banco nunca
   *  grava. Em produção: zero pessoas com capa contada, sempre, desde que a coluna
   *  nasceu. Só a proposta USADA ('applied') conta; a que ainda está na fila
   *  ('pending') não é trabalho feito, é trabalho proposto.
   * ════════════════════════════════════════════════════════════════════
   */
  it("quem manda capa e ela é USADA aparece com rótulo próprio", async () => {
    const lista = await getCatalogo();
    const p = lista.find((x) => x.handle === `ctb-capa-${marca}`);

    expect(p, "quem mandou uma capa usada não apareceu na lista").toBeTruthy();
    expect(
      p?.capas,
      "a capa aplicada não foi contada: 'accepted' não é um estado que o banco grava",
    ).toBe(1);
    expect(
      p?.livros,
      "mandar capa não é trazer livro: os dois baldes não podem se misturar",
    ).toBe(0);
  });
});

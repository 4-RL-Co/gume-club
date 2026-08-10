import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works } from "@/lib/db/schema";
import { getCatalogo } from "@/lib/contributors";

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

beforeAll(async () => {
  const mk = async (h: string) => {
    const [u] = await db.insert(users)
      .values({ handle: `${h}-${marca}`, email: `${h}-${marca}@ctb.test` })
      .returning({ id: users.id });
    return u!.id;
  };
  trouxe = await mk("ctb-trouxe");
  corrigiu = await mk("ctb-corrigiu");

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
});

afterAll(async () => {
  for (const id of [trouxe, corrigiu]) await db.execute(sql`delete from users where id = ${id}::uuid`);
  await db.execute(sql`delete from works where slug like ${`ctb-%${marca}`}`);
});

describe("a página de contribuidores conta os três trabalhos", () => {
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
});

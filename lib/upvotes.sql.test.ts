import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, reviews, collections } from "@/lib/db/schema";
import {
  upvotar, tirarUpvote, quemUpvotouResenha,
  upvotarLista, tirarUpvoteLista, quemUpvotouLista,
} from "@/lib/upvotes";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O UPVOTE, CONTRA POSTGRES DE VERDADE. Ver as migrations 0064 (resenha)
 *  e 0066 (lista).
 *
 *  Quatro promessas, nos dois: ninguém vota no próprio; ninguém vota no que
 *  não pode ver (a mesma visibleTo() de sempre, checada dentro do INSERT);
 *  votar duas vezes não conta duas; "quem votou" só aparece para o dono.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let autora: { id: string };
let leitor: { id: string };
let obra: string;
let obra2: string;
let resenhaPublica: string;
let resenhaPrivada: string;
let listaPublica: string;
let listaPrivada: string;

beforeAll(async () => {
  const [a] = await db.insert(users)
    .values({ handle: `up-autora-${marca}`, email: `up-autora-${marca}@up.test` })
    .returning({ id: users.id });
  autora = { id: a!.id };

  const [l] = await db.insert(users)
    .values({ handle: `up-leitor-${marca}`, email: `up-leitor-${marca}@up.test` })
    .returning({ id: users.id });
  leitor = { id: l!.id };

  const [w] = await db.insert(works)
    .values({ slug: `up-${marca}`, title: `zz upvote ${marca}` })
    .returning({ id: works.id });
  obra = w!.id;

  // reviews tem unique(user_id, work_id): a mesma autora não pode ter duas
  // resenhas na mesma obra, então a privada precisa de outra obra.
  const [w2] = await db.insert(works)
    .values({ slug: `up2-${marca}`, title: `zz upvote 2 ${marca}` })
    .returning({ id: works.id });
  obra2 = w2!.id;

  const [pub] = await db.insert(reviews)
    .values({ userId: autora.id, workId: obra, body: "resenha pública", visibility: "public" })
    .returning({ id: reviews.id });
  resenhaPublica = pub!.id;

  const [priv] = await db.insert(reviews)
    .values({ userId: autora.id, workId: obra2, body: "resenha privada", visibility: "private" })
    .returning({ id: reviews.id });
  resenhaPrivada = priv!.id;

  const [lpub] = await db.insert(collections)
    .values({ userId: autora.id, slug: `up-lista-${marca}`, name: "zz lista pública", visibility: "public" })
    .returning({ id: collections.id });
  listaPublica = lpub!.id;

  const [lpriv] = await db.insert(collections)
    .values({ userId: autora.id, slug: `up-lista-priv-${marca}`, name: "zz lista privada", visibility: "private" })
    .returning({ id: collections.id });
  listaPrivada = lpriv!.id;
});

afterAll(async () => {
  await db.execute(sql`delete from reviews where id in (${resenhaPublica}::uuid, ${resenhaPrivada}::uuid)`);
  await db.execute(sql`delete from collections where id in (${listaPublica}::uuid, ${listaPrivada}::uuid)`);
  await db.execute(sql`delete from works where id in (${obra}::uuid, ${obra2}::uuid)`);
  await db.execute(sql`delete from users where id in (${autora.id}::uuid, ${leitor.id}::uuid)`);
});

describe("votar numa resenha", () => {
  it("vota na pública, e o voto conta", async () => {
    const r = await upvotar(leitor, resenhaPublica);
    expect(r.ok).toBe(true);

    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from review_upvotes where review_id = ${resenhaPublica}::uuid`);
    expect(row?.n).toBe(1);
  });

  it("votar duas vezes não conta duas", async () => {
    await upvotar(leitor, resenhaPublica);
    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from review_upvotes where review_id = ${resenhaPublica}::uuid`);
    expect(row?.n).toBe(1);
  });

  it("a autora não vota na própria resenha", async () => {
    const r = await upvotar(autora, resenhaPublica);
    expect(r.ok, "a autora votou na própria resenha").toBe(false);

    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from review_upvotes
       where review_id = ${resenhaPublica}::uuid and user_id = ${autora.id}::uuid`);
    expect(row?.n).toBe(0);
  });

  /**
   * IDOR: o caminho de sempre — alguém troca o id da resenha no corpo da
   * requisição por uma que não pode ver. A trava é visibleTo(), dentro do
   * mesmo INSERT — não uma checagem separada que um refactor poderia
   * esquecer de chamar antes.
   */
  it("não vota numa resenha privada de outra pessoa", async () => {
    const r = await upvotar(leitor, resenhaPrivada);
    expect(r.ok, "votou numa resenha privada que não é dele").toBe(false);

    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from review_upvotes where review_id = ${resenhaPrivada}::uuid`);
    expect(row?.n).toBe(0);
  });

  it("tirar o voto tira, e só o dele", async () => {
    await tirarUpvote(leitor, resenhaPublica);
    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from review_upvotes where review_id = ${resenhaPublica}::uuid`);
    expect(row?.n).toBe(0);
  });

  /**
   * "já que upvote é ferramenta de amizade, tem que ser possível ver quem
   * deu upvote" — mesmo padrão de quemGuardou() em lib/listas.ts: o NÚMERO
   * é público, a LISTA de rostos só para o dono.
   */
  it("'quem votou' só aparece para a autora", async () => {
    await upvotar(leitor, resenhaPublica);

    const paraAutora = await quemUpvotouResenha(autora, resenhaPublica);
    expect(paraAutora.map((q) => q.handle)).toContain(`up-leitor-${marca}`);

    const paraOLeitor = await quemUpvotouResenha(leitor, resenhaPublica);
    expect(paraOLeitor, "quem não é autora recebeu os rostos de quem votou").toEqual([]);

    const paraNinguem = await quemUpvotouResenha(null, resenhaPublica);
    expect(paraNinguem).toEqual([]);

    await tirarUpvote(leitor, resenhaPublica);
  });
});

describe("votar numa lista", () => {
  it("vota na pública, e o voto conta", async () => {
    const r = await upvotarLista(leitor, listaPublica);
    expect(r.ok).toBe(true);

    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from list_upvotes where collection_id = ${listaPublica}::uuid`);
    expect(row?.n).toBe(1);
  });

  it("votar duas vezes não conta duas", async () => {
    await upvotarLista(leitor, listaPublica);
    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from list_upvotes where collection_id = ${listaPublica}::uuid`);
    expect(row?.n).toBe(1);
  });

  it("a dona não vota na própria lista", async () => {
    const r = await upvotarLista(autora, listaPublica);
    expect(r.ok, "a dona votou na própria lista").toBe(false);

    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from list_upvotes
       where collection_id = ${listaPublica}::uuid and user_id = ${autora.id}::uuid`);
    expect(row?.n).toBe(0);
  });

  it("não vota numa lista privada de outra pessoa", async () => {
    const r = await upvotarLista(leitor, listaPrivada);
    expect(r.ok, "votou numa lista privada que não é dele").toBe(false);

    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from list_upvotes where collection_id = ${listaPrivada}::uuid`);
    expect(row?.n).toBe(0);
  });

  it("tirar o voto tira, e só o dele", async () => {
    await tirarUpvoteLista(leitor, listaPublica);
    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from list_upvotes where collection_id = ${listaPublica}::uuid`);
    expect(row?.n).toBe(0);
  });

  it("'quem votou' só aparece para a dona", async () => {
    await upvotarLista(leitor, listaPublica);

    const paraDona = await quemUpvotouLista(autora, listaPublica);
    expect(paraDona.map((q) => q.handle)).toContain(`up-leitor-${marca}`);

    const paraOLeitor = await quemUpvotouLista(leitor, listaPublica);
    expect(paraOLeitor, "quem não é dona recebeu os rostos de quem votou").toEqual([]);

    await tirarUpvoteLista(leitor, listaPublica);
  });
});

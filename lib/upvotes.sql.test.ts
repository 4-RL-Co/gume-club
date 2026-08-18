import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, reviews } from "@/lib/db/schema";
import { upvotar, tirarUpvote } from "@/lib/upvotes";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O UPVOTE, CONTRA POSTGRES DE VERDADE. Ver a migration 0064.
 *
 *  Três promessas: ninguém vota na própria resenha; ninguém vota numa que
 *  não pode ver (a mesma visibleTo() de sempre, checada dentro do INSERT);
 *  votar duas vezes não conta duas.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let autora: { id: string };
let leitor: { id: string };
let obra: string;
let obra2: string;
let resenhaPublica: string;
let resenhaPrivada: string;

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
});

afterAll(async () => {
  await db.execute(sql`delete from reviews where id in (${resenhaPublica}::uuid, ${resenhaPrivada}::uuid)`);
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
});

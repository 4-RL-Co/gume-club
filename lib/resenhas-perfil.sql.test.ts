import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, authors, reviews, follows } from "@/lib/db/schema";
import { getResenhasDe } from "@/lib/explore";

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS RESENHAS DO PERFIL NÃO VAZAM.
 *
 *  Resenha nasce PRIVADA neste app, de propósito: a maior parte é escrita para si mesmo,
 *  e um app que publica por padrão ensina a escrever para uma plateia.
 *
 *  Uma seção nova no perfil é exatamente o tipo de tela onde isso morre: ela LISTA, e uma
 *  lista que esquece um `where` publica o caderno de alguém sem ninguém notar — o dono
 *  não vê a própria tela como um estranho vê.
 *
 *  Por isso a regra é provada aqui, contra o Postgres, dos três lados: o dono, quem
 *  segue, e o estranho.
 * ════════════════════════════════════════════════════════════════════
 */
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const lixo = { gente: [] as string[], obras: [] as string[], autores: [] as string[] };

let dono: { id: string };
let seguidor: { id: string };
let estranho: { id: string };
let obraId: string;

beforeAll(async () => {
  const mk = async (h: string) => {
    const [u] = await db
      .insert(users)
      .values({ handle: `${h}-${marca}`, email: `${h}-${marca}@r.test` })
      .returning({ id: users.id });
    lixo.gente.push(u!.id);
    return { id: u!.id };
  };
  dono = await mk("dono");
  seguidor = await mk("seguidor");
  estranho = await mk("estranho");

  const [a] = await db
    .insert(authors)
    .values({ name: `Autor R ${marca}`, slug: `autor-r-${marca}` })
    .returning({ id: authors.id });
  lixo.autores.push(a!.id);

  const [w] = await db
    .insert(works)
    .values({ title: `Livro R ${marca}`, authorId: a!.id, slug: `livro-r-${marca}` })
    .returning({ id: works.id });
  obraId = w!.id;
  lixo.obras.push(w!.id);

  await db.insert(follows).values({ followerId: seguidor.id, followeeId: dono.id, state: "accepted" });

  for (const v of ["private", "followers", "public"] as const) {
    await db.insert(reviews).values({
      userId: dono.id,
      workId: obraId,
      body: `resenha ${v} ${marca}`,
      visibility: v,
    });
    // reviews é único por (user, work): uma obra por visibilidade.
    if (v !== "public") {
      const [w2] = await db
        .insert(works)
        .values({ title: `Livro R ${v} ${marca}`, authorId: a!.id, slug: `livro-r-${v}-${marca}` })
        .returning({ id: works.id });
      lixo.obras.push(w2!.id);
      obraId = w2!.id;
    }
  }
});

afterAll(async () => {
  if (lixo.obras.length) await db.execute(sql`delete from works where id = any(${sql.param(lixo.obras)}::uuid[])`);
  if (lixo.autores.length) await db.execute(sql`delete from authors where id = any(${sql.param(lixo.autores)}::uuid[])`);
  if (lixo.gente.length) await db.execute(sql`delete from users where id = any(${sql.param(lixo.gente)}::uuid[])`);
});

const corpos = async (quem: { id: string } | null) =>
  (await getResenhasDe(quem, dono.id)).map((r) => r.body).sort();

describe("as resenhas do perfil respeitam a visibilidade", () => {
  it("o dono vê as três, inclusive a privada", async () => {
    expect(await corpos(dono)).toEqual([
      `resenha followers ${marca}`,
      `resenha private ${marca}`,
      `resenha public ${marca}`,
    ]);
  });

  it("quem segue vê a pública e a de seguidores, e NUNCA a privada", async () => {
    const vistas = await corpos(seguidor);
    expect(vistas).toEqual([`resenha followers ${marca}`, `resenha public ${marca}`]);
    expect(vistas, "a privada vazou para um seguidor").not.toContain(`resenha private ${marca}`);
  });

  it("um estranho logado vê só a pública", async () => {
    expect(await corpos(estranho)).toEqual([`resenha public ${marca}`]);
  });

  /** Deslogado é o caso que mais esquece de ser testado, e o que mais aparece no Google. */
  it("quem não entrou vê só a pública", async () => {
    expect(await corpos(null)).toEqual([`resenha public ${marca}`]);
  });
});

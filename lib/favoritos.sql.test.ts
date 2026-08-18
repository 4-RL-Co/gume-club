import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works } from "@/lib/db/schema";
import { shelve } from "@/lib/library";
import { getFavoritos, favoritar, desfavoritar, coroar, jaFavoritei } from "@/lib/favoritos";

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS FAVORITOS: SÓ QUEM LEU, NO MÁXIMO CINCO, E A POSIÇÃO 1 É A COROA.
 *
 *  Três coisas por Postgres de verdade: o gesto errado (favoritar sem ter
 *  lido, favoritar o sexto) não grava nada; coroar e desfavoritar não colidem
 *  com o unique(user_id, position) no meio da transação — é exatamente o tipo
 *  de empate que só o banco decide.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let leitor: { id: string };
const obras: string[] = [];

beforeAll(async () => {
  const [u] = await db.insert(users)
    .values({ handle: `fav-${marca}`, email: `fav-${marca}@fav.test` })
    .returning({ id: users.id });
  leitor = { id: u!.id };

  for (let i = 0; i < 6; i++) {
    const [w] = await db.insert(works)
      .values({ slug: `fav-${i}-${marca}`, title: `zz favorito ${i} ${marca}` })
      .returning({ id: works.id });
    obras.push(w!.id);
  }
  // As seis primeiras (0..5) todas lidas, exceto a última fica de fora de propósito.
  for (let i = 0; i < 5; i++) await shelve(leitor, obras[i]!, "read");
});

afterAll(async () => {
  await db.execute(sql`delete from works where id = any(${sql.param(obras)}::uuid[])`);
  await db.execute(sql`delete from users where id = ${leitor.id}::uuid`);
});

describe("favoritar exige ter lido", () => {
  it("não favorita um livro que você não leu", async () => {
    const r = await favoritar(leitor, obras[5]!); // não foi lido no beforeAll
    expect(r.ok, "favoritou um livro nunca lido").toBe(false);
    expect(await jaFavoritei(leitor.id, obras[5]!)).toBe(false);
  });

  it("favorita um livro lido, na próxima posição livre", async () => {
    const r = await favoritar(leitor, obras[0]!);
    expect(r.ok).toBe(true);
    expect(await jaFavoritei(leitor.id, obras[0]!)).toBe(true);

    const lista = await getFavoritos(leitor.id);
    expect(lista).toHaveLength(1);
    expect(lista[0]!.position).toBe(1);
  });

  it("favoritar duas vezes o mesmo livro não duplica", async () => {
    await favoritar(leitor, obras[0]!);
    const lista = await getFavoritos(leitor.id);
    expect(lista.filter((f) => f.workId === obras[0]).length).toBe(1);
  });
});

describe("o teto é cinco", () => {
  it("recusa o sexto favorito, mesmo lido", async () => {
    for (let i = 1; i < 5; i++) await favoritar(leitor, obras[i]!);
    expect((await getFavoritos(leitor.id)).length).toBe(5);

    // obras[5] não foi lido, mas mesmo se tivesse sido, o teto já bloqueia antes.
    const r = await favoritar(leitor, obras[5]!);
    expect(r.ok, "deixou entrar o sexto favorito").toBe(false);
  });
});

describe("coroar, contra o unique(user_id, position) de verdade", () => {
  it("mover o último para a posição 1 não colide, e todo mundo desliza", async () => {
    const antes = await getFavoritos(leitor.id);
    const ultimo = antes.at(-1)!;

    await coroar(leitor, ultimo.workId);

    const depois = await getFavoritos(leitor.id);
    expect(depois[0]!.workId, "o coroado não foi para a posição 1").toBe(ultimo.workId);
    expect(depois.map((f) => f.position)).toEqual([1, 2, 3, 4, 5]);
    // Ninguém sumiu, ninguém duplicou.
    expect(new Set(depois.map((f) => f.workId)).size).toBe(5);
  });

  it("coroar quem já é o coroado não faz nada estranho", async () => {
    const antes = await getFavoritos(leitor.id);
    await coroar(leitor, antes[0]!.workId);
    const depois = await getFavoritos(leitor.id);
    expect(depois).toEqual(antes);
  });
});

describe("desfavoritar, contra o mesmo unique", () => {
  it("tira do meio, e fecha o buraco sem colidir com quem vinha depois", async () => {
    const antes = await getFavoritos(leitor.id);
    const doMeio = antes[2]!; // position 3

    await desfavoritar(leitor, doMeio.workId);

    const depois = await getFavoritos(leitor.id);
    expect(depois).toHaveLength(4);
    expect(depois.map((f) => f.position)).toEqual([1, 2, 3, 4]);
    expect(depois.find((f) => f.workId === doMeio.workId)).toBeUndefined();

    // O lugar abriu: favoritar de novo tem que caber.
    const r = await favoritar(leitor, doMeio.workId);
    expect(r.ok).toBe(true);
    expect(await getFavoritos(leitor.id)).toHaveLength(5);
  });
});

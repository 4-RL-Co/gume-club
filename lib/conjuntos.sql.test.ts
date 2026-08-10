import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, editions } from "@/lib/db/schema";
import { marcarPosse, getConjuntos } from "@/lib/copies";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A COLEÇÃO CONTA CONJUNTOS, E A LACUNA É O ASSUNTO.
 *
 *  ═══ O QUE ISTO PROTEGE ═══
 *
 *  A primeira versão da coleção listava livros, e o dono leu como inventário: "queria
 *  que fosse pra colecionador mesmo". A diferença não está num rótulo — está no que a
 *  tela CONTA. Ninguém que coleciona pensa "tenho 340 cartas"; pensa "falta uma".
 *
 *  Três coisas precisam continuar verdadeiras, e cada uma é um jeito de a tela voltar
 *  a ser uma lista:
 *
 *  1. O que FALTA continua aparecendo. Escondê-lo deixa só o que você tem, que é
 *     inventário de novo.
 *  2. O selo só existe COMPLETO. Selo pela metade é enfeite, não conquista.
 *  3. O conjunto é da EDIÇÃO. Juntar a Deluxe com a normal estraga exatamente a coisa
 *     que a pessoa cuida — e o "volume 25" de uma não é o da outra.
 *
 *  Precisa de banco. O CI sobe um.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let leitor: string;
let serieId: string;
let deluxe: string;
let normal: string;
const obras: Record<string, string> = {};

beforeAll(async () => {
  const [u] = await db.insert(users)
    .values({ handle: `cj-${marca}`, email: `cj-${marca}@cj.test` })
    .returning({ id: users.id });
  leitor = u!.id;

  const [s] = await db.execute<{ id: string }>(sql`
    insert into series (title, slug, kind, total_volumes)
    values (${`zz serie ${marca}`}, ${`zz-serie-${marca}`}, 'manga', 3) returning id`);
  serieId = s!.id;

  const conj = async (titulo: string, total: number) => {
    const [c] = await db.execute<{ id: string }>(sql`
      insert into colecoes (series_id, slug, title, publisher, total_volumes)
      values (${serieId}::uuid, ${`${titulo}-${marca}`}, ${`${titulo} ${marca}`}, 'Editora', ${total})
      returning id`);
    return c!.id;
  };
  deluxe = await conj("deluxe", 3);
  normal = await conj("normal", 3);

  const obra = async (nome: string, vol: number, colecao: string) => {
    const [w] = await db.insert(works)
      .values({ slug: `cj-${nome}-${vol}-${marca}`, title: `zz ${nome} v${vol} ${marca}`, volume: String(vol) })
      .returning({ id: works.id });
    await db.execute(sql`update works set colecao_id = ${colecao}::uuid where id = ${w!.id}::uuid`);
    await db.insert(editions).values({ workId: w!.id, coverUrl: "https://covers.openlibrary.org/b/id/1-L.jpg" });
    obras[`${nome}${vol}`] = w!.id;
  };
  for (const v of [1, 2, 3]) { await obra("deluxe", v, deluxe); await obra("normal", v, normal); }
});

afterAll(async () => {
  await db.execute(sql`delete from users where id = ${leitor}::uuid`);
  await db.execute(sql`delete from works where slug like ${`cj-%-${marca}`}`);
  await db.execute(sql`delete from colecoes where slug like ${`%-${marca}`}`);
  await db.execute(sql`delete from series where slug = ${`zz-serie-${marca}`}`);
});

describe("a coleção por conjuntos", () => {
  it("o que FALTA continua na tela, e não só o que você tem", async () => {
    await marcarPosse({ id: leitor }, obras.deluxe1!, null, "owned");

    const [c] = await getConjuntos({ id: leitor });
    expect(c?.tenho).toBe(1);
    expect(c?.total).toBe(3);
    expect(
      c?.volumes.length,
      "os volumes que faltam sumiram da tela. Sem eles sobra só o que você já tem, " +
        "que é inventário de novo — e a lacuna é o assunto de quem coleciona.",
    ).toBe(3);
    expect(c?.volumes.filter((v) => !v.tenho).length, "nada ficou apagado").toBe(2);
  });

  it("o selo só aparece com o conjunto inteiro", async () => {
    let [c] = await getConjuntos({ id: leitor });
    expect(c?.completo, "selo apareceu pela metade: isso é enfeite, não conquista").toBe(false);

    await marcarPosse({ id: leitor }, obras.deluxe2!, null, "owned");
    await marcarPosse({ id: leitor }, obras.deluxe3!, null, "owned");

    [c] = await getConjuntos({ id: leitor });
    expect(c?.completo, "o conjunto inteiro é seu e o selo não veio").toBe(true);
  });

  /**
   * O caso que importa para quem coleciona: a Deluxe e a normal são conjuntos
   * diferentes, e completar uma não completa a outra.
   */
  it("a edição de luxo não completa a edição normal", async () => {
    await marcarPosse({ id: leitor }, obras.normal1!, null, "owned");

    const conjuntos = await getConjuntos({ id: leitor });
    expect(conjuntos.length, "os dois conjuntos viraram um só").toBe(2);

    const daNormal = conjuntos.find((x) => x.titulo.startsWith("normal"));
    expect(
      daNormal?.completo,
      "a edição normal ganhou selo por causa da deluxe: o volume de uma não é o da " +
        "outra, e juntá-las estraga a coisa que a pessoa cuida.",
    ).toBe(false);
    expect(daNormal?.tenho).toBe(1);
  });
});

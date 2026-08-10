import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, editions } from "@/lib/db/schema";
import { marcarPosse, getConjuntos } from "@/lib/copies";
import { ligarAoConjunto, soltarDoConjunto, buscarConjuntos } from "@/lib/conjuntos";

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

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM MONTA UM CONJUNTO, E POR QUE ISSO É CATÁLOGO.
 *
 *  Os conjuntos vinham todos da AniList, e só cobriam mangá conhecido. O dono tinha
 *  três volumes de Hellsing Deluxe fora de conjunto — livros de verdade, na estante
 *  dele, e o app não sabia que eram uma coleção.
 *
 *  ═══ ELE NÃO É "PRÓPRIO", E ISSO IMPORTA ═══
 *
 *  "Hellsing Deluxe tem 3 volumes" é um FATO SOBRE O MUNDO, como o autor ou a editora.
 *  Se o conjunto fosse pessoal, cada colecionador recadastraria os mesmos volumes, e o
 *  app teria N versões da mesma verdade — a duplicata que este acervo passou o dia
 *  consertando.
 *
 *  Sendo catálogo, ele vai para o LOG, com nome e reversível: é o histórico público
 *  que torna vandalismo caro, e não uma permissão que faria do dono um porteiro.
 * ════════════════════════════════════════════════════════════════════
 */
describe("montar um conjunto de edição", () => {
  it("criar liga o volume e fica no log de correções", async () => {
    const [w] = await db.insert(works)
      .values({ slug: `mont-${marca}`, title: `zz montar ${marca}` })
      .returning({ id: works.id });

    await ligarAoConjunto({ id: leitor }, w!.id, { titulo: `zz conj ${marca}`, total: 3, publisher: "Editora" }, 1);

    const [obra] = await db.execute<{ colecao_id: string | null; volume: string | null }>(sql`
      select colecao_id, volume from works where id = ${w!.id}::uuid`);
    expect(obra?.colecao_id, "o volume não foi ligado ao conjunto").toBeTruthy();
    expect(Number(obra?.volume), "o número do volume não foi gravado: sem ele o conjunto é uma pilha").toBe(1);

    const [rev] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from revisions
       where target_id = ${w!.id}::uuid and user_id = ${leitor}::uuid`);
    expect(
      rev?.n,
      "ligar um volume não entrou no log. Ligar ao conjunto errado estraga a coleção " +
        "de quem coleciona, e o histórico público é a única defesa que não vira porteiro.",
    ).toBe(1);
  });

  /** Achar antes de criar: sem isso, o segundo colecionador duplica o conjunto. */
  it("procurar acha o que já existe", async () => {
    const achados = await buscarConjuntos(`zz conj ${marca}`.slice(0, 12));
    expect(
      achados.some((a) => a.titulo === `zz conj ${marca}`),
      "a busca não acha o conjunto que existe, e o próximo colecionador cria outro igual",
    ).toBe(true);
  });

  it("soltar desfaz, e desfazer não é mais difícil que fazer", async () => {
    const [w] = await db.execute<{ id: string }>(sql`
      select id from works where slug = ${`mont-${marca}`}`);
    await soltarDoConjunto({ id: leitor }, w!.id);

    const [obra] = await db.execute<{ colecao_id: string | null }>(sql`
      select colecao_id from works where id = ${w!.id}::uuid`);
    expect(obra?.colecao_id, "soltar não soltou").toBeNull();
  });
});

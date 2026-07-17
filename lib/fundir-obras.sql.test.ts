import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, authors, editions, libraryEntries, ratings } from "@/lib/db/schema";
import { fundirObras, obraGemeaDe } from "@/lib/corrections";
import { Forbidden } from "@/lib/authz";

/**
 * ════════════════════════════════════════════════════════════════════
 *  DUAS FICHAS DO MESMO LIVRO.
 *
 *  Isto move ESTANTE, NOTA e RESENHA de gente de verdade entre duas fichas, e depois
 *  APAGA uma delas — e as nove tabelas que apontam para `works` são `on delete cascade`.
 *  Uma ordem errada aqui não dá erro: dá silêncio, e a resenha de alguém some.
 *
 *  É a operação mais perigosa do app. Por isso ela é provada contra o Postgres de
 *  verdade, e não contra uma ideia de Postgres.
 * ════════════════════════════════════════════════════════════════════
 */
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const lixo = { autores: [] as string[], obras: [] as string[], gente: [] as string[] };
let leitor: { id: string };
/**
 * DOIS autores, e não um: duas fichas do mesmo livro só podem existir sob autores
 * diferentes — `works_title_author_volume` proíbe o resto. E é exatamente daí que o bug
 * vem: o dump gravou o TRADUTOR como autor de um "Frankenstein", e a autora de verdade
 * ficou com outro. A colisão nasce na hora de trocar o autor para o certo.
 */
let tradutor: string;
let autora: string;
let n = 0;

const novaObra = async (titulo: string, quem: string) => {
  const [w] = await db
    .insert(works)
    .values({ title: titulo, authorId: quem, slug: `o-${marca}-${++n}` })
    .returning({ id: works.id });
  lixo.obras.push(w!.id);
  return w!.id;
};

beforeAll(async () => {
  const mkAutor = async (nome: string, slug: string) => {
    const [a] = await db.insert(authors).values({ name: nome, slug }).returning({ id: authors.id });
    lixo.autores.push(a!.id);
    return a!.id;
  };
  tradutor = await mkAutor(`matias sanchez ${marca}`, `tradutor-${marca}`);
  autora = await mkAutor(`Mary Shelley ${marca}`, `autora-${marca}`);

  const [u] = await db
    .insert(users)
    .values({ handle: `fobras-${marca}`, email: `fobras-${marca}@fo.test` })
    .returning({ id: users.id });
  leitor = { id: u!.id };
  lixo.gente.push(u!.id);
});

afterAll(async () => {
  if (lixo.obras.length) await db.execute(sql`delete from works where id = any(${sql.param(lixo.obras)}::uuid[])`);
  if (lixo.autores.length) await db.execute(sql`delete from authors where id = any(${sql.param(lixo.autores)}::uuid[])`);
  if (lixo.gente.length) await db.execute(sql`delete from users where id = any(${sql.param(lixo.gente)}::uuid[])`);
});

describe("fundir duas fichas do mesmo livro", () => {
  /**
   * O caso que deu origem a isto: o Frankenstein da autora certa tinha UMA edição e
   * ninguém na estante; o do tradutor tinha nove, e a estante do dono. A fusão tem que
   * trazer as nove E a estante, e não perder nada no caminho.
   */
  it("as edições e a estante chegam do outro lado, e a ficha velha some", async () => {
    const magra = await novaObra(`Frankenstein ${marca}`, autora);
    const gorda = await novaObra(`Frankenstein ${marca}`, tradutor);

    await db.insert(editions).values({ workId: gorda, publisher: "Antofágica" });
    await db.insert(editions).values({ workId: gorda, publisher: "DarkSide" });
    await db.insert(libraryEntries).values({ userId: leitor.id, workId: gorda, status: "read" });
    await db.insert(ratings).values({ userId: leitor.id, workId: gorda, value: 5 });

    await fundirObras(leitor, gorda, magra, "o tradutor virou autor no dump");

    const eds = await db.select().from(editions).where(eq(editions.workId, magra));
    expect(eds.length, "as duas edições tinham que ter mudado de ficha").toBe(2);

    const [le] = await db.select().from(libraryEntries).where(eq(libraryEntries.workId, magra));
    expect(le?.status, "a estante tinha que ter vindo junto").toBe("read");

    const [r] = await db.select().from(ratings).where(eq(ratings.workId, magra));
    expect(r?.value, "a nota tinha que ter vindo junto").toBe(5);

    expect((await db.select().from(works).where(eq(works.id, gorda))).length).toBe(0);
  });

  /**
   * ═══ A RECUSA, QUE É A PARTE IMPORTANTE ═══
   *
   * Se a MESMA pessoa tem as duas fichas, juntar teria que decidir qual nota sobrevive.
   * Uma resenha é a única coisa neste app que alguém sentou e escreveu: a máquina não
   * escolhe. Ela recusa, e devolve a decisão para a pessoa.
   */
  it("recusa quando a mesma pessoa tem as duas fichas", async () => {
    const a = await novaObra(`Dobrado ${marca}`, tradutor);
    const b = await novaObra(`Dobrado ${marca}`, autora);

    await db.insert(libraryEntries).values({ userId: leitor.id, workId: a, status: "read" });
    await db.insert(libraryEntries).values({ userId: leitor.id, workId: b, status: "want_to_read" });

    await expect(fundirObras(leitor, a, b, null)).rejects.toThrow(Forbidden);

    // E não pode ter deixado nada pela metade.
    const [ainda] = await db.select().from(libraryEntries).where(eq(libraryEntries.workId, a));
    expect(ainda?.status, "a transação tinha que ter voltado inteira").toBe("read");
    expect((await db.select().from(works).where(eq(works.id, a))).length, "a ficha não podia ter sumido").toBe(1);
  });
});

describe("obraGemeaDe", () => {
  it("acha a ficha gêmea do mesmo autor, e conta as edições dela", async () => {
    const eu = await novaObra(`Gemeo ${marca}`, tradutor);
    const gemea = await novaObra(`Gemeo ${marca}`, autora);
    await db.insert(editions).values({ workId: gemea, publisher: "Uma" });

    // A gêmea é procurada sob o autor NOVO (a autora), que é para onde a ficha iria.
    const g = await obraGemeaDe(eu, autora, `Gemeo ${marca}`, null);
    expect(g?.id).toBe(gemea);
    expect(g?.edicoes).toBe(1);
    expect(g?.conflito, "ninguém tem as duas: dá para juntar").toBe(false);
  });

  it("avisa quando a mesma pessoa tem as duas", async () => {
    const eu = await novaObra(`Conflitante ${marca}`, tradutor);
    const gemea = await novaObra(`Conflitante ${marca}`, autora);
    await db.insert(libraryEntries).values({ userId: leitor.id, workId: eu, status: "read" });
    await db.insert(libraryEntries).values({ userId: leitor.id, workId: gemea, status: "read" });

    const g = await obraGemeaDe(eu, autora, `Conflitante ${marca}`, null);
    expect(g?.conflito, "a mesma pessoa dos dois lados: a fusão não decide").toBe(true);
  });

  it("título diferente não é gêmea", async () => {
    const eu = await novaObra(`Sozinho ${marca}`, tradutor);
    expect(await obraGemeaDe(eu, autora, `Sozinho ${marca}`, null)).toBeNull();
  });
});

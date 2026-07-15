import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, libraryEntries, follows, recommendations } from "@/lib/db/schema";
import { shelve, shelveAndRead } from "@/lib/library";
import { follow, recommend } from "@/lib/social";
import { createCollection, toggleInCollection, setStatusMany } from "@/lib/curation";
import { collectionItems } from "@/lib/db/schema";

/**
 * ════════════════════════════════════════════════════════════════════
 *  CONCORRÊNCIA. A MESMA escrita, ao mesmo tempo, muitas vezes.
 *
 *  É o bug que não aparece em teste sequencial e aparece no dia em que
 *  duas abas estão abertas, o dedo escorrega no duplo clique, ou a
 *  conexão cai e o navegador repete o POST. O padrão perigoso é
 *  ler-modificar-escrever em dois passos: entre o "existe?" e o
 *  "insere", cabe a outra requisição, e nascem duas linhas.
 *
 *  Aqui tudo é ou uma operação atômica no SQL (upsert com ON CONFLICT)
 *  ou uma transação. Estes testes disparam vinte requisições iguais em
 *  paralelo e exigem UMA linha no fim.
 * ════════════════════════════════════════════════════════════════════
 */

const AO_MESMO_TEMPO = 20;

let ana: { id: string };
let bruno: { id: string };
let obra: string;
const criados: string[] = [];
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

beforeAll(async () => {
  const mk = async (handle: string) => {
    const [u] = await db
      .insert(users)
      .values({ handle, email: `${handle}@corrida.test` })
      .returning({ id: users.id });
    criados.push(u!.id);
    return { id: u!.id };
  };

  ana = await mk(`corrida-ana-${marca}`);
  bruno = await mk(`corrida-bruno-${marca}`);

  const [w] = await db
    .insert(works)
    .values({ slug: `corrida-${marca}`, title: `A obra da corrida ${marca}` })
    .returning({ id: works.id });
  obra = w!.id;
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
  if (obra) await db.execute(sql`delete from works where id = ${obra}::uuid`);
});

describe("a mesma escrita, vinte vezes ao mesmo tempo", () => {
  it("prateleirar o mesmo livro deixa UMA linha", async () => {
    await Promise.all(
      Array.from({ length: AO_MESMO_TEMPO }, () => shelve(ana, obra, "reading")),
    );

    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(libraryEntries)
      .where(and(eq(libraryEntries.userId, ana.id), eq(libraryEntries.workId, obra)));

    expect(row!.n, "nasceram linhas duplicadas na estante").toBe(1);
  });

  it("seguir a mesma pessoa deixa UMA linha", async () => {
    await Promise.all(Array.from({ length: AO_MESMO_TEMPO }, () => follow(ana, bruno.id)));

    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(follows)
      .where(and(eq(follows.followerId, ana.id), eq(follows.followeeId, bruno.id)));

    expect(row!.n, "seguir duas vezes criou dois follows").toBe(1);
  });

  it("recomendar o mesmo livro à mesma pessoa deixa UMA recomendação e UMA linha na estante dela", async () => {
    await Promise.all(
      Array.from({ length: AO_MESMO_TEMPO }, () => recommend(ana, bruno.id, obra, "leia isto")),
    );

    const [rec] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(recommendations)
      .where(and(
        eq(recommendations.fromUserId, ana.id),
        eq(recommendations.toUserId, bruno.id),
        eq(recommendations.workId, obra),
      ));

    const [entrada] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(libraryEntries)
      .where(and(eq(libraryEntries.userId, bruno.id), eq(libraryEntries.workId, obra)));

    expect(rec!.n, "a mesma recomendação entrou mais de uma vez").toBe(1);
    expect(entrada!.n, "a estante da pessoa recomendada ganhou linhas duplicadas").toBe(1);
  });

  it("pôr o mesmo livro na mesma estante inventada deixa UMA linha", async () => {
    const estante = (await createCollection(ana, `Corrida ${marca}`, "private"))!;

    await Promise.all(
      Array.from({ length: AO_MESMO_TEMPO }, () => toggleInCollection(ana, estante, obra, true)),
    );

    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(collectionItems)
      .where(and(eq(collectionItems.collectionId, estante), eq(collectionItems.workId, obra)));

    expect(row!.n, "o mesmo livro entrou duas vezes na mesma estante").toBe(1);
  });

  it("terminar o mesmo livro em paralelo (o duplo clique) não duplica a leitura", async () => {
    await Promise.all(
      Array.from({ length: AO_MESMO_TEMPO }, () => shelveAndRead(bruno, obra, "read")),
    );

    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n
        from readings r
        join library_entries le on le.id = r.entry_id
       where le.user_id = ${bruno.id}::uuid and le.work_id = ${obra}::uuid
         and r.finished_on is not null`);

    expect(row!.n, "um duplo clique em 'lido' virou várias leituras terminadas").toBe(1);
  });

  it("marcar como lido em lote e em paralelo não duplica a leitura", async () => {
    await Promise.all(
      Array.from({ length: AO_MESMO_TEMPO }, () => setStatusMany(ana, [obra], "read")),
    );

    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n
        from readings r
        join library_entries le on le.id = r.entry_id
       where le.user_id = ${ana.id}::uuid and le.work_id = ${obra}::uuid
         and r.finished_on is not null`);

    // Uma leitura terminada, e não vinte: senão a estatística do ano contaria
    // vinte livros lidos por causa de um duplo clique.
    expect(row!.n, "um livro terminado virou várias leituras").toBe(1);
  });
});

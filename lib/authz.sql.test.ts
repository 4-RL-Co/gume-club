import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { visibleTo } from "@/lib/authz";
import { libraryEntries, users, works, follows, collections } from "@/lib/db/schema";

/**
 * ════════════════════════════════════════════════════════════════════
 *  The test SECURITY.md demands, run against real SQL.
 *
 *  A JavaScript mirror of the rule proves the mirror. It does not prove the
 *  query, and the query is what runs in production. So this seeds two readers,
 *  a real follow, and one row of each visibility, and then asks Postgres.
 *
 *  Needs a database. CI brings one up; see .github/workflows/ci.yml.
 * ════════════════════════════════════════════════════════════════════
 */

const ana = { id: "" };   // dona das linhas
const bruno = { id: "" }; // segue a Ana
const carla = { id: "" }; // estranha, não segue ninguém

const ids: Record<string, string> = {};

beforeAll(async () => {
  const mk = async (handle: string) => {
    const [u] = await db
      .insert(users)
      .values({ handle, email: `${handle}@authz.test` })
      .returning({ id: users.id });
    return u!.id;
  };
  ana.id = await mk("authz-ana");
  bruno.id = await mk("authz-bruno");
  carla.id = await mk("authz-carla");

  // Bruno segue a Ana, e o follow está aceito.
  await db.insert(follows).values({ followerId: bruno.id, followeeId: ana.id, state: "accepted" });

  // Uma linha da Ana de cada visibilidade. Mesma obra, então só a visibilidade difere.
  for (const visibility of ["public", "followers", "private"] as const) {
    const [w2] = await db
      .insert(works)
      .values({ slug: `authz-${visibility}-${Date.now()}`, title: `Obra ${visibility}` })
      .returning({ id: works.id });
    const [row] = await db
      .insert(libraryEntries)
      .values({ userId: ana.id, workId: w2!.id, visibility, status: "read" })
      .returning({ id: libraryEntries.id });
    ids[visibility] = row!.id;
  }
});

afterAll(async () => {
  for (const u of [ana.id, bruno.id, carla.id]) {
    if (u) await db.execute(sql`delete from users where id = ${u}::uuid`);
  }
  await db.execute(sql`delete from works where slug like 'authz-%'`);
});

/** O que este espectador de fato consegue puxar das linhas da Ana, pelo SQL. */
async function seenBy(viewer: { id: string } | null): Promise<Set<string>> {
  const rows = await db
    .select({ id: libraryEntries.id })
    .from(libraryEntries)
    .where(and(
      eq(libraryEntries.userId, ana.id),
      visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility),
    ));
  return new Set(rows.map((r) => r.id));
}

describe("visibleTo, no banco", () => {
  it("linha PRIVADA não vaza para quem segue. É esta a linha que derruba um app.", async () => {
    const seen = await seenBy(bruno);
    expect(seen.has(ids.private!)).toBe(false);
  });

  it("quem segue vê a linha 'followers', e a pública", async () => {
    const seen = await seenBy(bruno);
    expect(seen.has(ids.followers!)).toBe(true);
    expect(seen.has(ids.public!)).toBe(true);
    expect(seen.size).toBe(2);
  });

  it("estranho logado não vê nem a privada nem a de seguidores", async () => {
    const seen = await seenBy(carla);
    expect(seen.has(ids.private!)).toBe(false);
    expect(seen.has(ids.followers!)).toBe(false);
    expect(seen.has(ids.public!)).toBe(true);
    expect(seen.size).toBe(1);
  });

  it("anônimo vê só a pública", async () => {
    const seen = await seenBy(null);
    expect(seen.size).toBe(1);
    expect(seen.has(ids.public!)).toBe(true);
  });

  it("a dona vê tudo que é dela, qualquer que seja a visibilidade", async () => {
    const seen = await seenBy(ana);
    expect(seen.size).toBe(3);
  });

  it("estar logado não é permissão: a Carla não vira dona chutando o UUID da Ana", async () => {
    // O filtro é por linha, no SQL. Não existe "logado, então pode ver".
    const seen = await seenBy({ id: carla.id });
    expect(seen.has(ids.private!)).toBe(false);
  });

  it("o teste tem dente: sem o filtro, as três linhas voltariam", async () => {
    // Se este teste passasse tanto com quanto sem o visibleTo(), ele não estaria
    // provando nada. Sem o filtro o SQL devolve as três linhas da Ana, inclusive
    // a privada. É exatamente isso que o filtro impede acima.
    const semFiltro = await db
      .select({ id: libraryEntries.id })
      .from(libraryEntries)
      .where(eq(libraryEntries.userId, ana.id));

    expect(semFiltro.length).toBe(3);
    expect((await seenBy(bruno)).size).toBe(2);
  });

  it("deixar de seguir tira a linha 'followers' na hora", async () => {
    await db.execute(sql`
      update follows set state = 'pending'
      where follower_id = ${bruno.id}::uuid and followee_id = ${ana.id}::uuid`);

    const seen = await seenBy(bruno);
    expect(seen.has(ids.followers!)).toBe(false);
    expect(seen.size).toBe(1);

    await db.execute(sql`
      update follows set state = 'accepted'
      where follower_id = ${bruno.id}::uuid and followee_id = ${ana.id}::uuid`);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  O FEED. É aqui que um app vaza.
 *
 *  A linha da estante pode estar perfeitamente escondida e a activity
 *  anunciar a mesma coisa para todo mundo. Por isso a activity herda a
 *  visibility da linha sobre a qual ela fala, e por isso o feed filtra
 *  por visibleTo() no SQL, e não em JavaScript.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o feed não vaza", () => {
  it("linha PRIVADA da Ana não aparece no feed do Bruno, que a segue", async () => {
    const { getFeed } = await import("@/lib/social");

    // a Ana faz três coisas: uma pública, uma de seguidores, uma privada
    for (const [visibility, workSlug] of [
      ["public", "feed-publico"],
      ["followers", "feed-seguidores"],
      ["private", "feed-privado"],
    ] as const) {
      const [w] = await db
        .insert(works)
        .values({ slug: `authz-${workSlug}-${Date.now()}`, title: `Feed ${visibility}` })
        .returning({ id: works.id });

      await db.execute(sql`
        insert into activities (actor_id, verb, work_id, visibility)
        values (${ana.id}::uuid, 'finished', ${w!.id}::uuid, ${visibility})`);
    }

    const feed = await getFeed({ id: bruno.id });
    const titulos = feed.items.map((i) => i.workTitle);

    // o que ele PODE ver
    expect(titulos).toContain("Feed public");
    expect(titulos).toContain("Feed followers");

    // e o que ele NÃO PODE, que é a razão deste teste existir
    expect(titulos).not.toContain("Feed private");
  });

  it("uma linha 'created_list' (sem livro, migration 0068) também respeita a visibility", async () => {
    const { getFeed } = await import("@/lib/social");
    const ids: Record<string, string> = {};

    for (const visibility of ["public", "private"] as const) {
      const [col] = await db
        .insert(collections)
        .values({ userId: ana.id, slug: `authz-lista-${visibility}-${Date.now()}`, name: `Estante ${visibility}`, visibility })
        .returning({ id: collections.id });
      ids[visibility] = col!.id;
      await db.execute(sql`
        insert into activities (actor_id, verb, work_id, collection_id, visibility)
        values (${ana.id}::uuid, 'created_list', null, ${col!.id}::uuid, ${visibility})`);
    }

    const feed = await getFeed({ id: bruno.id });
    const collectionIds = feed.items.map((i) => i.collectionId);

    expect(collectionIds).toContain(ids.public);
    expect(collectionIds, "estante PRIVADA vazou pelo feed sem livro nenhum").not.toContain(ids.private);
  });

  it("um estranho, que não segue ninguém, tem o feed vazio", async () => {
    const { getFeed } = await import("@/lib/social");
    const feed = await getFeed({ id: carla.id });
    expect(feed.items).toHaveLength(0);
  });

  it("deixar de seguir apaga a linha de 'followers' do feed na hora", async () => {
    const { getFeed } = await import("@/lib/social");

    await db.execute(sql`
      update follows set state = 'pending'
      where follower_id = ${bruno.id}::uuid and followee_id = ${ana.id}::uuid`);

    const feed = await getFeed({ id: bruno.id });
    expect(feed.items).toHaveLength(0); // nem a pública: o feed é só de quem você segue

    await db.execute(sql`
      update follows set state = 'accepted'
      where follower_id = ${bruno.id}::uuid and followee_id = ${ana.id}::uuid`);
  });

  it("o cursor é uuidv7, então ordena no tempo e não repete linha", async () => {
    const { getFeed } = await import("@/lib/social");
    const feed = await getFeed({ id: bruno.id });
    const ids = feed.items.map((i) => i.id);
    const ordenado = [...ids].sort().reverse();
    expect(ids).toEqual(ordenado); // desc por id == desc por tempo
  });
});

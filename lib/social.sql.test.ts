import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { record, getFeed } from "@/lib/social";
import { getResenhasPorId } from "@/lib/explore";
import { getListasPorId } from "@/lib/listas";
import { users, works, follows, activities, reviews, collections } from "@/lib/db/schema";

/**
 * ════════════════════════════════════════════════════════════════════
 *  DUAS COISAS NOVAS NO FEED (migration 0068): a resenha aparece inteira, e
 *  criar uma estante vira uma linha. As duas ganham corpo/rosto FORA da
 *  consulta do feed — getResenhasPorId() e getListasPorId(), buscadas em
 *  lote pela UI — e as duas checam visibilidade DE NOVO, ali dentro, e não
 *  só confiam na `visibility` que a activity copiou no instante em que foi
 *  gravada.
 *
 *  É esse "de novo" que este arquivo prova, contra Postgres de verdade: uma
 *  resenha ou uma estante que ficou privada DEPOIS de a linha do feed
 *  existir não pode vazar corpo, mesmo com a linha antiga ainda dizendo
 *  "public". Um espelho em JavaScript concordaria com o bug; só a consulta
 *  de verdade prova que ele não existe.
 * ════════════════════════════════════════════════════════════════════
 */

const ana = { id: "" };   // escreve as resenhas e as estantes
const bruno = { id: "" }; // segue a Ana

let obra: string;

beforeAll(async () => {
  const mk = async (handle: string) => {
    const [u] = await db
      .insert(users)
      .values({ handle, email: `${handle}@social.test` })
      .returning({ id: users.id });
    return u!.id;
  };
  ana.id = await mk("social-ana");
  bruno.id = await mk("social-bruno");

  await db.insert(follows).values({ followerId: bruno.id, followeeId: ana.id, state: "accepted" });

  const [w] = await db
    .insert(works)
    .values({ slug: `social-obra-${Date.now()}`, title: "A obra da Ana" })
    .returning({ id: works.id });
  obra = w!.id;
});

afterAll(async () => {
  for (const u of [ana.id, bruno.id]) {
    if (u) await db.execute(sql`delete from users where id = ${u}::uuid`);
  }
  await db.execute(sql`delete from works where slug like 'social-obra-%'`);
});

describe("record() de uma resenha faz upsert, não empilha", () => {
  it("editar a mesma resenha mantém UMA linha no feed, no mesmo lugar", async () => {
    const [rev] = await db
      .insert(reviews)
      .values({ userId: ana.id, workId: obra, body: "primeira versão", visibility: "public" })
      .returning({ id: reviews.id });
    const reviewId = rev!.id;

    await record(ana.id, "reviewed", obra, { visibility: "public", reviewId });
    const [primeira] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.reviewId, reviewId));

    // "editou a resenha" — corrigiu a mesma linha, não escreveu outra.
    await db.update(reviews).set({ body: "segunda versão, corrigida" }).where(eq(reviews.id, reviewId));
    await record(ana.id, "reviewed", obra, { visibility: "public", reviewId });

    const linhas = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.reviewId, reviewId));

    expect(linhas, "duas chamadas de record() para a mesma resenha empilharam duas linhas").toHaveLength(1);
    // E a posição no feed (que ordena por id, não por created_at) não pula para o
    // topo: consertar uma resenha não é "resenhou de novo".
    expect(linhas[0]!.id).toBe(primeira!.id);
  });
});

describe("criar uma estante vira uma linha do feed, sem livro", () => {
  it("a linha carrega collection_id e work_id nulo, e aparece pra quem segue", async () => {
    const [col] = await db
      .insert(collections)
      .values({ userId: ana.id, slug: `social-estante-${Date.now()}`, name: "Terror brasileiro", visibility: "public" })
      .returning({ id: collections.id });
    const collectionId = col!.id;

    await record(ana.id, "created_list", null, { visibility: "public", collectionId });

    const feed = await getFeed({ id: bruno.id });
    const linha = feed.items.find((i) => i.collectionId === collectionId);

    expect(linha, "a estante nova não apareceu no feed de quem segue a Ana").toBeDefined();
    expect(linha!.verb).toBe("created_list");
    expect(linha!.workSlug).toBeNull();
  });
});

describe("a resenha que ficou privada depois não vaza pelo feed", () => {
  it("getResenhasPorId não devolve o corpo, mesmo com a activity ainda dizendo 'public'", async () => {
    // reviews tem uma resenha por (usuário, obra) — uma obra à parte, para não
    // colidir com a resenha do grupo de testes anterior.
    const [w] = await db
      .insert(works)
      .values({ slug: `social-obra-privada-${Date.now()}`, title: "Vai ficar privada" })
      .returning({ id: works.id });
    const [rev] = await db
      .insert(reviews)
      .values({ userId: ana.id, workId: w!.id, body: "texto que devia ter sumido", visibility: "public" })
      .returning({ id: reviews.id });
    const reviewId = rev!.id;

    await record(ana.id, "reviewed", w!.id, { visibility: "public", reviewId });

    // A resenha vira privada SEM passar por record() de novo — é exatamente o
    // jeito de uma activity antiga ficar com a visibility desatualizada.
    await db.update(reviews).set({ visibility: "private" }).where(eq(reviews.id, reviewId));

    // A LINHA continua existindo (a visibility da activity, sozinha, ainda diz
    // "public" — é o comportamento de sempre, e não é o que este teste ataca).
    const feed = await getFeed({ id: bruno.id });
    expect(feed.items.some((i) => i.reviewId === reviewId)).toBe(true);

    // O CORPO não pode vir junto: é aqui que a segunda checagem de visibleTo()
    // dentro de getResenhasPorId precisa segurar a barra.
    const resenhas = await getResenhasPorId({ id: bruno.id }, [reviewId]);
    expect(resenhas[reviewId], "o corpo da resenha, agora privada, vazou pelo feed").toBeUndefined();
  });

  it("uma resenha apagada (soft delete) some do lote, mesmo sem cascata", async () => {
    const [w] = await db
      .insert(works)
      .values({ slug: `social-obra-moderada-${Date.now()}`, title: "Moderada" })
      .returning({ id: works.id });
    const [rev] = await db
      .insert(reviews)
      .values({ userId: ana.id, workId: w!.id, body: "moderada", visibility: "public", deletedAt: new Date() })
      .returning({ id: reviews.id });

    const resenhas = await getResenhasPorId({ id: bruno.id }, [rev!.id]);
    expect(resenhas[rev!.id]).toBeUndefined();
  });
});

describe("a estante que ficou privada depois não vaza pelo feed", () => {
  it("getListasPorId não devolve a estante, mesmo com a activity ainda dizendo 'public'", async () => {
    const [col] = await db
      .insert(collections)
      .values({ userId: ana.id, slug: `social-privada-${Date.now()}`, name: "Vai ficar privada", visibility: "public" })
      .returning({ id: collections.id });
    const collectionId = col!.id;

    await record(ana.id, "created_list", null, { visibility: "public", collectionId });
    await db.update(collections).set({ visibility: "private" }).where(eq(collections.id, collectionId));

    const listas = await getListasPorId({ id: bruno.id }, [collectionId]);
    expect(listas[collectionId], "a estante, agora privada, vazou pelo feed").toBeUndefined();
  });
});

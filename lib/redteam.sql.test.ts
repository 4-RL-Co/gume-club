import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, libraryEntries, collections, collectionItems, ratings, reviews } from "@/lib/db/schema";
import {
  removeFromShelf, renameCollection, deleteCollection, setCollectionVisibility,
  toggleInCollection, addManyToCollection, setStatusMany, setMyEdition,
  snapshotShelf, restoreShelf, createCollection, getCollections,
} from "@/lib/curation";
import { getShelf } from "@/lib/shelf";
import { getStats } from "@/lib/stats";
import { getFriendRatings } from "@/lib/ratings";
import { getEstantes, getAfinidade, getResenhas, getLendoAgora } from "@/lib/explore";
import { Forbidden } from "@/lib/authz";

/**
 * ════════════════════════════════════════════════════════════════════
 *  RED TEAM. A IA ataca o próprio sistema.
 *
 *  Cada teste aqui é um ATAQUE, contra Postgres de verdade, e não um
 *  espelho da regra escrito em JavaScript: um espelho concorda com o
 *  bug. O atacante é um usuário logado de verdade (autenticação não é
 *  autorização), e ele tenta ler e escrever nas linhas da vítima
 *  trocando o UUID, que é exatamente o que um IDOR é.
 *
 *  Se algum destes passar a falhar, alguém removeu uma checagem de
 *  dono. É para isso que eles existem. Ver SECURITY.md.
 * ════════════════════════════════════════════════════════════════════
 */

let atacante: { id: string };
let vitima: { id: string };
let obra: string;
let obraPrivada: string;
let estanteDaVitima: string;

const criados: string[] = [];

/** Uma marca por execução: dois testes seguidos não podem colidir no título da obra. */
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

beforeAll(async () => {
  const mk = async (handle: string) => {
    const [u] = await db
      .insert(users)
      .values({ handle, email: `${handle}@redteam.test` })
      .returning({ id: users.id });
    criados.push(u!.id);
    return { id: u!.id };
  };

  atacante = await mk(`redteam-atacante-${marca}`);
  vitima = await mk(`redteam-vitima-${marca}`);

  const [w1] = await db
    .insert(works)
    .values({ slug: `redteam-a-${marca}`, title: `A obra pública da vítima ${marca}` })
    .returning({ id: works.id });
  const [w2] = await db
    .insert(works)
    .values({ slug: `redteam-b-${marca}`, title: `A obra privada da vítima ${marca}` })
    .returning({ id: works.id });

  obra = w1!.id;
  obraPrivada = w2!.id;

  // a estante da vítima: uma linha pública e uma privada
  await db.insert(libraryEntries).values([
    { userId: vitima.id, workId: obra, status: "read", visibility: "public" },
    { userId: vitima.id, workId: obraPrivada, status: "reading", visibility: "private" },
  ]);

  await db.insert(ratings).values([
    { userId: vitima.id, workId: obra, value: 5, visibility: "public" },
    { userId: vitima.id, workId: obraPrivada, value: 2, visibility: "private" },
  ]);

  await db.insert(reviews).values({
    userId: vitima.id, workId: obraPrivada, body: "a resenha secreta", visibility: "private",
  });

  const id = await createCollection(vitima, "A estante privada da vítima", "private");
  estanteDaVitima = id!;
  await db.insert(collectionItems).values({ collectionId: estanteDaVitima, workId: obra });
});

afterAll(async () => {
  for (const id of criados) {
    await db.execute(sql`delete from users where id = ${id}::uuid`);
  }
  const obras = [obra, obraPrivada].filter(Boolean);
  if (obras.length) {
    await db.execute(sql`delete from works where id = any(${sql.param(obras)}::uuid[])`);
  }
});

// ──────────────────────────────────────────────────────────── IDOR: escrita

describe("IDOR: o atacante troca o UUID e tenta escrever na linha da vítima", () => {
  it("não tira o livro da estante de outra pessoa", async () => {
    await removeFromShelf(atacante, obra);

    const [ainda] = await db
      .select({ id: libraryEntries.id })
      .from(libraryEntries)
      .where(and(eq(libraryEntries.userId, vitima.id), eq(libraryEntries.workId, obra)));

    expect(ainda, "a linha da vítima sumiu: IDOR na estante").toBeDefined();
  });

  it("não prateleira em massa os livros de outra pessoa", async () => {
    await setStatusMany(atacante, [obra, obraPrivada], "did_not_finish");

    const rows = await db
      .select({ status: libraryEntries.status })
      .from(libraryEntries)
      .where(eq(libraryEntries.userId, vitima.id));

    expect(rows.map((r) => r.status).sort()).toEqual(["read", "reading"]);
  });

  it("não escolhe a edição do livro de outra pessoa", async () => {
    await setMyEdition(atacante, obra, null);

    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(libraryEntries)
      .where(and(eq(libraryEntries.userId, atacante.id), eq(libraryEntries.workId, obra)));

    // nada foi criado na conta do atacante, e nada foi mexido na da vítima
    expect(row!.n).toBe(0);
  });

  it("não renomeia, não apaga e não torna pública a estante de outra pessoa", async () => {
    await renameCollection(atacante, estanteDaVitima, "sequestrada");
    await setCollectionVisibility(atacante, estanteDaVitima, "public");
    await deleteCollection(atacante, estanteDaVitima);

    const [c] = await db
      .select({ name: collections.name, visibility: collections.visibility })
      .from(collections)
      .where(eq(collections.id, estanteDaVitima));

    expect(c, "a estante da vítima foi apagada por um estranho").toBeDefined();
    expect(c!.name).toBe("A estante privada da vítima");
    expect(c!.visibility).toBe("private");
  });

  it("não enfia livro na estante de outra pessoa", async () => {
    await toggleInCollection(atacante, estanteDaVitima, obraPrivada, true);
    await expect(addManyToCollection(atacante, estanteDaVitima, [obraPrivada])).rejects.toThrow(Forbidden);

    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, estanteDaVitima));

    expect(row!.n, "um estranho escreveu na estante da vítima").toBe(1);
  });

  it("não tira livro da estante de outra pessoa", async () => {
    await toggleInCollection(atacante, estanteDaVitima, obra, false);

    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, estanteDaVitima));

    expect(row!.n).toBe(1);
  });

  it("não fotografa nem restaura a estante de outra pessoa", async () => {
    const foto = await snapshotShelf(atacante, [obra, obraPrivada]);
    expect(foto, "o atacante leu a estante da vítima pelo snapshot").toHaveLength(0);

    // e não consegue plantar linhas na conta da vítima passando um retrato forjado
    await restoreShelf(atacante, [
      {
        workId: obra, status: "read", visibility: "public", editionId: null,
        recommendedBy: null, rating: 5, reviewBody: "plantada", reviewVisibility: "public",
        ownedEditionId: null, acquiredNote: null,
      },
    ]);

    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(reviews)
      .where(and(eq(reviews.userId, vitima.id), eq(reviews.workId, obra)));

    expect(row!.n, "o atacante escreveu uma resenha na conta da vítima").toBe(0);
  });
});

// ─────────────────────────────────────────────────────── vazamento de leitura

describe("visibility: a linha privada da vítima não chega em nenhuma superfície", () => {
  it("não aparece na estante dela vista por um estranho", async () => {
    const livros = await getShelf(atacante, vitima.id);
    expect(livros.map((l) => l.workId)).toEqual([obra]);
  });

  it("não aparece nas estatísticas dela vistas por um estranho", async () => {
    const s = await getStats(atacante, vitima.id, null);
    /**
     * A vítima tem DUAS linhas de estante: uma pública e uma privada. Um estranho
     * só pode enxergar a pública, e `shelf` conta a estante inteira, em qualquer
     * status. Se a linha privada vazasse para o agregado, isto viraria 2.
     *
     * Contar a estante inteira é uma checagem mais dura do que a anterior (que
     * olhava só os lidos): uma linha privada em QUALQUER status é um vazamento, e
     * agora o teste pega todos eles, e não só o de um status.
     */
    expect(s.shelf, "a estatística contou uma linha privada").toBe(1);
  });

  it("não aparece nas estantes inventadas dela vistas por um estranho", async () => {
    const cs = await getCollections(atacante, vitima.id);
    expect(cs, "uma estante privada apareceu para um estranho").toHaveLength(0);
  });

  it("a nota privada dela não aparece para quem a segue", async () => {
    await db.execute(sql`
      insert into follows (follower_id, followee_id, state)
      values (${atacante.id}::uuid, ${vitima.id}::uuid, 'accepted')
      on conflict do nothing`);

    const op = await getFriendRatings(atacante, [obra, obraPrivada]);

    expect(op[obra]?.friends, "a nota pública devia aparecer").toHaveLength(1);
    expect(op[obraPrivada], "a nota PRIVADA vazou para um seguidor").toBeUndefined();
  });

  it("a nota privada dela também não aparece na estante dela", async () => {
    const livros = await getShelf(atacante, vitima.id);
    const publica = livros.find((l) => l.workId === obra);
    expect(publica?.rating).toBe(5);
  });
});

// ───────────────────────────────────────────────────────────── o explorar

/**
 * O explorar é a tela onde o vazamento seria mais barato de acontecer: ela lê a
 * estante de TODO MUNDO. Se visibleTo() sair de qualquer uma das quatro
 * consultas, uma estante privada vira vitrine para estranho.
 */
describe("explorar: a linha privada não vira vitrine", () => {
  it("a estante privada dela não aparece na amostra de capas", async () => {
    const estantes = await getEstantes(atacante);
    const dela = estantes.find((e) => e.handle.startsWith("redteam-vitima"));

    // ela pode aparecer (tem linha pública), mas NUNCA com a obra privada
    if (dela) {
      expect(dela.capas.length, "capa de linha privada apareceu no explorar")
        .toBeLessThanOrEqual(1);
    }
  });

  it("a obra privada dela não entra na afinidade", async () => {
    // o atacante põe as duas obras na estante dele: a afinidade só pode enxergar
    // a linha PÚBLICA da vítima, nunca a privada
    await db.insert(libraryEntries).values([
      { userId: atacante.id, workId: obra, status: "read", visibility: "public" },
      { userId: atacante.id, workId: obraPrivada, status: "read", visibility: "public" },
    ]).onConflictDoNothing();

    const afinidade = await getAfinidade(atacante);
    const privada = afinidade.find((a) => a.title.includes("privada"));

    expect(privada, "a estante privada da vítima virou afinidade").toBeUndefined();
  });

  it("a resenha privada dela não aparece nas resenhas recentes", async () => {
    const resenhas = await getResenhas(atacante);
    expect(
      resenhas.some((r) => r.body === "a resenha secreta"),
      "a resenha PRIVADA da vítima foi publicada no explorar",
    ).toBe(false);
  });

  it("o livro que ela lê em privado não entra na vitrine", async () => {
    const lendo = await getLendoAgora(atacante);
    expect(
      lendo.some((l) => l.title.includes("privada")),
      "o livro de uma linha privada apareceu em 'estão lendo agora'",
    ).toBe(false);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  O BANIDO SOME DE TODA SUPERFÍCIE. NÃO DE ALGUMAS.
 *
 *  Banimento tem um modo de falha clássico e humilhante: a pessoa é
 *  banida, some do feed, some da busca, e continua aparecendo na estante
 *  pública, no explorar, ou no pôster do WhatsApp. Um só lugar esquecido
 *  e o banimento não existiu.
 *
 *  A defesa não é lembrar de filtrar em quarenta lugares: é o filtro
 *  morar DENTRO do visibleTo(), por onde toda leitura de linha alheia
 *  passa. Este teste prova que ele mora lá.
 * ════════════════════════════════════════════════════════════════════
 */
describe("um banido não aparece em lugar nenhum", () => {
  let banidoId = "";

  beforeAll(async () => {
    // A vítima vira a banida: ela já tem estante, nota e resenha públicas.
    banidoId = vitima.id;
    await db.execute(sql`
      update users set banned_at = now(), banned_reason = 'teste'
       where id = ${banidoId}::uuid`);
  });

  afterAll(async () => {
    await db.execute(sql`
      update users set banned_at = null, banned_reason = null
       where id = ${banidoId}::uuid`);
  });

  it("a estante pública dele fica vazia para um estranho", async () => {
    const livros = await getShelf(atacante, banidoId);
    expect(
      livros,
      "a estante de um banido continuou pública. O banimento não aconteceu.",
    ).toHaveLength(0);
  });

  it("as estatísticas dele não contam nada para um estranho", async () => {
    const s = await getStats(atacante, banidoId, null);
    expect(s.shelf, "as linhas de um banido continuaram sendo contadas").toBe(0);
  });

  it("as estantes inventadas dele somem", async () => {
    const cs = await getCollections(atacante, banidoId);
    expect(cs).toHaveLength(0);
  });

  it("e o próprio banido continua dono do que é dele: banir não é confiscar", async () => {
    /**
     * A licença deste projeto promete que os seus livros são seus, e essa promessa
     * não tem asterisco para quem se comportou mal. Banir tira a pessoa da vista dos
     * outros; não apaga o que é dela.
     *
     * (Na prática ela não consegue nem entrar: getViewer() devolve null. Mas o DADO
     * continua lá, e um desbanimento devolve tudo, porque nada foi apagado.)
     */
    const livros = await getShelf({ id: banidoId }, banidoId);
    expect(livros.length, "os dados do banido foram confiscados").toBeGreaterThan(0);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM RECOMENDOU APARECE NA CAPA. E O BANIDO NÃO.
 *
 *  A estante passou a mostrar o rosto de quem indicou o livro, e a mostrar isso
 *  também para quem VISITA. Isso não é exposição nova (a recomendação já nasce
 *  pública no feed), mas cria uma superfície nova onde um nome aparece — e toda
 *  superfície nova onde um nome aparece precisa obedecer à mesma regra do resto:
 *  um banido ou apagado some.
 *
 *  Sem isto, banir alguém o tiraria do feed, do explorar e do perfil, e ele
 *  continuaria estampado na capa de um livro na estante de outra pessoa.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o rosto de quem recomendou obedece às mesmas regras de todo mundo", () => {
  const marcaRec = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  let quemIndicou: string;
  let quemRecebeu: string;
  let obraIndicada: string;

  beforeAll(async () => {
    const mk = async (handle: string) => {
      const [u] = await db
        .insert(users)
        .values({ handle, email: `${handle}@redteam.test` })
        .returning({ id: users.id });
      criados.push(u!.id);
      return u!.id;
    };

    quemIndicou = await mk(`rec-indicou-${marcaRec}`);
    quemRecebeu = await mk(`rec-recebeu-${marcaRec}`);

    const [w] = await db
      .insert(works)
      .values({ slug: `rec-obra-${marcaRec}`, title: `A obra indicada ${marcaRec}` })
      .returning({ id: works.id });
    obraIndicada = w!.id;

    await db.insert(libraryEntries).values({
      userId: quemRecebeu,
      workId: obraIndicada,
      status: "want_to_read",
      visibility: "public",
      recommendedBy: quemIndicou,
    });
  });

  afterAll(async () => {
    await db.execute(sql`delete from works where id = ${obraIndicada}::uuid`);
  });

  it("um estranho que visita a estante vê de quem o livro veio", async () => {
    const livros = await getShelf(atacante, quemRecebeu);
    const achado = livros.find((l) => l.workId === obraIndicada);

    expect(achado?.recomendadoPor, "a procedência sumiu para quem visita").toBe(
      `rec-indicou-${marcaRec}`,
    );
  });

  it("e o rosto some quando quem indicou é banido", async () => {
    await db.execute(sql`update users set banned_at = now() where id = ${quemIndicou}::uuid`);

    const livros = await getShelf(atacante, quemRecebeu);
    const achado = livros.find((l) => l.workId === obraIndicada);

    // O LIVRO continua na estante: banir quem indicou não confisca o livro de quem
    // recebeu. O que some é o nome do banido.
    expect(achado, "banir quem indicou tirou o livro da estante de outra pessoa").toBeTruthy();
    expect(achado?.recomendadoPor, "um banido continuou estampado numa capa").toBeNull();
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, authors, editions, libraryEntries } from "@/lib/db/schema";
import { getShelf } from "@/lib/shelf";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "NA LISTA, OS MISERÁVEIS APARECE COM ESSA CAPA (NÃO É A MINHA), E QUANDO
 *  EU CLICO APARECE COM A CAPA CORRETA." — o dono, ao vivo.
 *
 *  A causa: app/estante/[slug]/page.tsx escolhia a edição pela data de
 *  criação, crua — sem checar se ela tinha capa. Um lote de import grava
 *  várias edições com o MESMO created_at (até o microssegundo, no mesmo
 *  INSERT em lote), e aí o desempate virava a ordem do UUID: arbitrária, e
 *  podia cair numa edição sem capa nenhuma. Ver edicaoPreferida(), em
 *  lib/shelf.ts.
 *
 *  Provado contra o Postgres de verdade porque é exatamente o tipo de
 *  empate que só o banco de dados de verdade decide.
 * ════════════════════════════════════════════════════════════════════
 */
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const lixo = { obras: [] as string[], gente: [] as string[] };
let autor: string;

beforeAll(async () => {
  const [a] = await db
    .insert(authors)
    .values({ name: `Autor Estante ${marca}`, slug: `autor-estante-${marca}` })
    .returning({ id: authors.id });
  autor = a!.id;
});

afterAll(async () => {
  if (lixo.obras.length) await db.execute(sql`delete from works where id = any(${sql.param(lixo.obras)}::uuid[])`);
  if (lixo.gente.length) await db.execute(sql`delete from users where id = any(${sql.param(lixo.gente)}::uuid[])`);
  await db.execute(sql`delete from authors where id = ${autor}::uuid`);
});

describe("edicaoPreferida (via getShelf): a edição com capa vence o empate", () => {
  it("quatro edições com o MESMO created_at — só a que tem capa pode vencer", async () => {
    const [u] = await db
      .insert(users)
      .values({ handle: `estante-${marca}`, email: `estante-${marca}@sh.test` })
      .returning({ id: users.id });
    lixo.gente.push(u!.id);

    const [w] = await db
      .insert(works)
      .values({ title: `Empate de Capa ${marca}`, authorId: autor, slug: `empate-capa-${marca}` })
      .returning({ id: works.id });
    lixo.obras.push(w!.id);

    // O MESMO instante para as quatro — é exatamente o que um lote de import
    // grava, e é o cenário em que o bug aparecia.
    const criadoEm = sql`'2020-01-01 00:00:00+00'::timestamptz`;
    await db.execute(sql`
      insert into editions (work_id, publisher, cover_url, created_at) values
        (${w!.id}::uuid, 'Sem Capa A', null, ${criadoEm}),
        (${w!.id}::uuid, 'Sem Capa B', null, ${criadoEm}),
        (${w!.id}::uuid, 'A Certa', 'https://exemplo.test/capa-certa.jpg', ${criadoEm}),
        (${w!.id}::uuid, 'Sem Capa C', null, ${criadoEm})`);

    // Sem edição escolhida (nem sua, nem possuída) — é o caso que
    // edicaoPreferida() resolve sozinha.
    await db.insert(libraryEntries).values({ userId: u!.id, workId: w!.id, status: "want_to_read" });

    const [livro] = await getShelf({ id: u!.id }, u!.id);

    expect(livro?.coverUrl, "a estante mostrou uma capa que não é a única que existe").toBe(
      "https://exemplo.test/capa-certa.jpg",
    );
  });

  it("a edição ESCOLHIDA vence mesmo quando outra teria vencido o desempate genérico", async () => {
    // "Aqui continua com a capa errada." O reader escolheu uma edição
    // específica (library_entries.edition_id); mesmo com outras cinco do
    // mesmo work tendo capa também, a escolhida é a que aparece — nunca o
    // desempate de edicaoPreferida(), que só entra quando ninguém escolheu.
    const [u] = await db
      .insert(users)
      .values({ handle: `estante-escolha-${marca}`, email: `estante-escolha-${marca}@sh.test` })
      .returning({ id: users.id });
    lixo.gente.push(u!.id);

    const [w] = await db
      .insert(works)
      .values({ title: `Cinco Capas ${marca}`, authorId: autor, slug: `cinco-capas-${marca}` })
      .returning({ id: works.id });
    lixo.obras.push(w!.id);

    // As duas primeiras venceriam o desempate genérico (created_at, depois id);
    // a terceira só ganha porque foi EXPLICITAMENTE escolhida.
    const criadoEm = sql`'2020-01-01 00:00:00+00'::timestamptz`;
    await db.execute(sql`
      insert into editions (work_id, publisher, cover_url, created_at) values
        (${w!.id}::uuid, 'A que ganharia o desempate', 'https://exemplo.test/desempate.jpg', ${criadoEm}),
        (${w!.id}::uuid, 'Também tem capa', 'https://exemplo.test/tambem.jpg', ${criadoEm})`);
    const [escolhida] = await db
      .insert(editions)
      .values({
        workId: w!.id,
        publisher: "A escolhida",
        coverUrl: "https://exemplo.test/escolhida.jpg",
        createdAt: sql`'2020-01-01 00:00:00+00'::timestamptz`,
      })
      .returning({ id: editions.id });

    await db.insert(libraryEntries).values({
      userId: u!.id,
      workId: w!.id,
      status: "want_to_read",
      editionId: escolhida!.id,
    });

    const [livro] = await getShelf({ id: u!.id }, u!.id);

    expect(livro?.coverUrl, "a edição escolhida por quem lê perdeu para o desempate genérico").toBe(
      "https://exemplo.test/escolhida.jpg",
    );
  });

  it("nenhuma edição com capa: continua devolvendo uma edição, não nenhuma", async () => {
    const [u] = await db
      .insert(users)
      .values({ handle: `estante-sem-capa-${marca}`, email: `estante-sem-capa-${marca}@sh.test` })
      .returning({ id: users.id });
    lixo.gente.push(u!.id);

    const [w] = await db
      .insert(works)
      .values({ title: `Sem Nenhuma Capa ${marca}`, authorId: autor, slug: `sem-nenhuma-capa-${marca}` })
      .returning({ id: works.id });
    lixo.obras.push(w!.id);

    await db.insert(editions).values({ workId: w!.id, publisher: "Editora Sem Capa" });
    await db.insert(libraryEntries).values({ userId: u!.id, workId: w!.id, status: "want_to_read" });

    const [livro] = await getShelf({ id: u!.id }, u!.id);

    expect(livro?.coverUrl).toBeNull();
    expect(livro?.publisher, "sem filtro nenhum, a edição continua junto — só a capa é null").toBe(
      "Editora Sem Capa",
    );
  });
});

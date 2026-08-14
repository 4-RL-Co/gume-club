import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, authors, editions, libraryEntries, ownedCopies } from "@/lib/db/schema";
import { fundirEdicoes, edicaoDoIsbn, obraDoIsbn } from "@/lib/corrections";

/**
 * ════════════════════════════════════════════════════════════════════
 *  DUAS FICHAS DA MESMA EDIÇÃO. Um ISBN é o número de UMA edição publicada.
 *
 *  "Se pertence a outra edição, quer dizer que é o mesmo livro, certo? Não tem
 *  como ter uma opção de dar merge?" — o dono, direto. Ver lib/corrections.ts
 *  (fundirEdicoes) e app/livro/[slug]/curation-actions.ts (saveBookEdit).
 *
 *  Isto move quem tem a cópia e quem está lendo entre duas linhas de EDIÇÃO, e
 *  depois apaga uma delas. Como fundirObras, é provado contra o Postgres de
 *  verdade: `editions.isbn13` é um UNIQUE de verdade, e não dá para simular a
 *  fusão sem uma colisão real acontecendo primeiro.
 *
 *  (Cheguei a escrever um segundo teste, achando que fundirObras — a fusão de
 *  OBRA — precisava de um remendo para o caso de duas obras que já carregassem
 *  a mesma edição cada uma. Tentei montar o cenário e o próprio Postgres
 *  recusou o INSERT de setup: o UNIQUE de isbn13 é GLOBAL e sempre foi, então
 *  duas linhas com o mesmo ISBN nunca chegam a coexistir no banco para
 *  começo de conversa — o "remendo" defendia contra um estado impossível.
 *  Removido; ver ai/DECISIONS.md.)
 * ════════════════════════════════════════════════════════════════════
 */
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const lixo = { autores: [] as string[], obras: [] as string[], gente: [] as string[] };
let leitor: { id: string };
let autor: string;
let n = 0;

const novaObra = async (titulo: string) => {
  const [w] = await db
    .insert(works)
    .values({ title: titulo, authorId: autor, slug: `fe-${marca}-${++n}` })
    .returning({ id: works.id });
  lixo.obras.push(w!.id);
  return w!.id;
};

/**
 * `editions.isbn13` é UNIQUE de verdade: cada chamada precisa de um valor
 * genuinamente diferente, e não um recorte de `marca` (padStart/padEnd não
 * mexem numa string que já é mais longa que o alvo — dois recortes do mesmo
 * `marca` são o MESMO texto, e colidiriam entre testes).
 */
const novoIsbn = () => `isbn-${marca}-${++n}`;

beforeAll(async () => {
  const [a] = await db
    .insert(authors)
    .values({ name: `Autor Fusão ${marca}`, slug: `autor-fe-${marca}` })
    .returning({ id: authors.id });
  autor = a!.id;
  lixo.autores.push(autor);

  const [u] = await db
    .insert(users)
    .values({ handle: `fedicoes-${marca}`, email: `fedicoes-${marca}@fo.test` })
    .returning({ id: users.id });
  leitor = { id: u!.id };
  lixo.gente.push(u!.id);
});

afterAll(async () => {
  if (lixo.obras.length) await db.execute(sql`delete from works where id = any(${sql.param(lixo.obras)}::uuid[])`);
  if (lixo.autores.length) await db.execute(sql`delete from authors where id = any(${sql.param(lixo.autores)}::uuid[])`);
  if (lixo.gente.length) await db.execute(sql`delete from users where id = any(${sql.param(lixo.gente)}::uuid[])`);
});

describe("fundir duas edições da mesma obra", () => {
  it("quem tem a cópia e quem está lendo chegam do outro lado, e a edição velha some", async () => {
    const obra = await novaObra(`Duplicada ${marca}`);
    const [de] = await db.insert(editions).values({ workId: obra, publisher: "Sebo" }).returning({ id: editions.id });
    const [para] = await db
      .insert(editions)
      .values({ workId: obra, publisher: "Companhia das Letras", isbn13: novoIsbn() })
      .returning({ id: editions.id });

    await db
      .insert(libraryEntries)
      .values({ userId: leitor.id, workId: obra, status: "reading", editionId: de!.id });
    await db
      .insert(ownedCopies)
      .values({ userId: leitor.id, workId: obra, state: "owned", editionId: de!.id });

    await fundirEdicoes(leitor, de!.id, para!.id, "duas linhas para a mesma edição");

    expect((await db.select().from(editions).where(eq(editions.id, de!.id))).length, "a edição velha tinha que ter saído").toBe(0);

    const [le] = await db.select().from(libraryEntries).where(eq(libraryEntries.workId, obra));
    expect(le?.editionId, "quem estava lendo tinha que apontar para a edição que sobrou").toBe(para!.id);

    const [oc] = await db.select().from(ownedCopies).where(eq(ownedCopies.workId, obra));
    expect(oc?.editionId, "quem tem a cópia tinha que apontar para a edição que sobrou").toBe(para!.id);
  });

  it("edicaoDoIsbn acha quem já responde por um ISBN, e obraDoIsbn traz a ficha dele", async () => {
    const dona = await novaObra(`Dona do ISBN ${marca}`);
    const isbn = novoIsbn();
    const [ed] = await db.insert(editions).values({ workId: dona, isbn13: isbn }).returning({ id: editions.id });

    const achada = await edicaoDoIsbn(isbn);
    expect(achada?.id).toBe(ed!.id);
    expect(achada?.workId).toBe(dona);

    const outraObra = await novaObra(`Quem Perguntou ${marca}`);
    const ficha = await obraDoIsbn(dona, outraObra);
    expect(ficha?.id).toBe(dona);
    expect(ficha?.conflito, "ninguém tem as duas: dá para juntar").toBe(false);
  });
});

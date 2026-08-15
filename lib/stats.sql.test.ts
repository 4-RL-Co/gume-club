import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, authors, editions, libraryEntries, readings } from "@/lib/db/schema";
import { getStats } from "@/lib/stats";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "A QUANTIDADE DE PÁGINAS NO MEU PERFIL E NAS MINHAS ESTATÍSTICAS
 *  NÃO ESTÁ BATENDO." — o dono, ao vivo.
 *
 *  A causa: lib/escada.ts sempre contou "lido" por `library_entries.status`;
 *  esta tela sempre contou só por uma `readings` com `finished_on`. Um lote
 *  de import grava o status vindo da prateleira de origem mesmo sem data —
 *  e insere uma `readings` com as três datas nulas, em vez de nenhuma linha.
 *
 *  Provado contra o Postgres de verdade porque é exatamente o tipo de
 *  divergência entre duas contas que passa limpa contra um mock.
 * ════════════════════════════════════════════════════════════════════
 */
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const lixo = { obras: [] as string[], gente: [] as string[] };
let autor: string;
let n = 0;

const novaObra = async (paginas: number | null) => {
  const [w] = await db
    .insert(works)
    .values({ title: `Stats ${marca} ${++n}`, authorId: autor, slug: `stats-${marca}-${n}` })
    .returning({ id: works.id });
  lixo.obras.push(w!.id);
  await db.insert(editions).values({ workId: w!.id, pageCount: paginas });
  return w!.id;
};

const novoLeitor = async (apelido: string) => {
  const [u] = await db
    .insert(users)
    .values({ handle: `${apelido}-${marca}`, email: `${apelido}-${marca}@st.test` })
    .returning({ id: users.id });
  lixo.gente.push(u!.id);
  return u!.id;
};

async function entrada(
  userId: string,
  workId: string,
  status: "reading" | "read" | "did_not_finish" | "want_to_read",
  leitura?: { finishedOn?: string; abandonedOn?: string } | "vazia",
) {
  const [le] = await db
    .insert(libraryEntries)
    .values({ userId, workId, status })
    .returning({ id: libraryEntries.id });

  if (leitura === "vazia") {
    // A leitura "vazia": import sem data, as três colunas nulas. É o bug.
    await db.insert(readings).values({ entryId: le!.id });
  } else if (leitura) {
    await db.insert(readings).values({
      entryId: le!.id,
      finishedOn: leitura.finishedOn,
      abandonedOn: leitura.abandonedOn,
    });
  }
}

beforeAll(async () => {
  const [a] = await db
    .insert(authors)
    .values({ name: `Autor Stats ${marca}`, slug: `autor-stats-${marca}` })
    .returning({ id: authors.id });
  autor = a!.id;
});

afterAll(async () => {
  if (lixo.obras.length) await db.execute(sql`delete from works where id = any(${sql.param(lixo.obras)}::uuid[])`);
  if (lixo.gente.length) await db.execute(sql`delete from users where id = any(${sql.param(lixo.gente)}::uuid[])`);
  await db.execute(sql`delete from authors where id = ${autor}::uuid`);
});

describe("finished(): status='read' também conta na vida inteira, não só a leitura com data", () => {
  it("status=read com leitura datada conta no ano certo e na vida inteira", async () => {
    const leitor = await novoLeitor("datado");
    await entrada(leitor, await novaObra(300), "read", { finishedOn: "2020-05-01" });

    const vidaToda = await getStats({ id: leitor }, leitor, null);
    expect(vidaToda.books).toBe(1);
    expect(vidaToda.pages).toBe(300);

    expect((await getStats({ id: leitor }, leitor, 2020)).books).toBe(1);
    expect((await getStats({ id: leitor }, leitor, 2021)).books).toBe(0);
  });

  it("status=read SEM leitura datada (o bug do import) conta na vida inteira, e não no ano", async () => {
    const leitor = await novoLeitor("semdata");
    await entrada(leitor, await novaObra(250), "read", "vazia");

    const vidaToda = await getStats({ id: leitor }, leitor, null);
    expect(vidaToda.books, "status=read tem que contar mesmo sem data — é o que a honra já fazia").toBe(1);
    expect(vidaToda.pages).toBe(250);

    // Sem data, não há ANO nenhum em que este livro possa aparecer.
    expect((await getStats({ id: leitor }, leitor, new Date().getFullYear())).books).toBe(0);
  });

  it("lendo não conta, nem na vida inteira", async () => {
    const leitor = await novoLeitor("lendo");
    await entrada(leitor, await novaObra(300), "reading");

    expect((await getStats({ id: leitor }, leitor, null)).books).toBe(0);
  });

  it("abandonado não conta, nem na vida inteira", async () => {
    const leitor = await novoLeitor("abandonou");
    await entrada(leitor, await novaObra(300), "did_not_finish", { abandonedOn: "2022-01-01" });

    expect((await getStats({ id: leitor }, leitor, null)).books).toBe(0);
  });

  it("quer ler, sem leitura nenhuma, não conta", async () => {
    const leitor = await novoLeitor("querler");
    await entrada(leitor, await novaObra(300), "want_to_read");

    expect((await getStats({ id: leitor }, leitor, null)).books).toBe(0);
  });
});

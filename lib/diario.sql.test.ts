import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, ratings, reviews, libraryEntries } from "@/lib/db/schema";
import { findOrCreateWork, shelveAndRead } from "@/lib/library";
import { getDiario } from "@/lib/diario";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O DIÁRIO. Contra o Postgres de verdade.
 *
 *  Quatro promessas: mais recente primeiro; releitura vira uma linha NOVA,
 *  marcada como tal, sem apagar a primeira; a estante privada não vira uma
 *  linha para um estranho (mesma régua de getLeituras); e "tem resenha" só
 *  acende na leitura que a resenha de fato referencia.
 * ════════════════════════════════════════════════════════════════════
 */

const criados: string[] = [];
const marca = Date.now().toString(36);

let leitor: { id: string };
let estranho: { id: string };
let obra: string;
let obraPrivada: string;

async function criar(handle: string) {
  const [u] = await db
    .insert(users)
    .values({ handle: `${handle}-${marca}`, email: `${handle}-${marca}@teste.local` })
    .returning({ id: users.id });
  criados.push(u!.id);
  return { id: u!.id };
}

beforeAll(async () => {
  leitor = await criar("diario-leitor");
  estranho = await criar("diario-estranho");

  const { workId } = await findOrCreateWork({
    title: `O livro do diário ${marca}`,
    author: `Autor de teste ${marca}`,
  });
  obra = workId;

  const { workId: workId2 } = await findOrCreateWork({
    title: `O livro privado do diário ${marca}`,
    author: `Autor de teste ${marca}`,
  });
  obraPrivada = workId2;
});

afterAll(async () => {
  for (const id of criados) {
    await db.execute(sql`delete from users where id = ${id}::uuid`);
  }
  await db.execute(sql`delete from users where email like '%@teste.local'`);
  await db.execute(sql`delete from works where title like ${"%" + marca}`);
  await db.execute(sql`delete from authors where name like ${"%" + marca}`);
});

describe("o diário: uma linha por leitura, mais recente primeiro", () => {
  it("uma leitura terminada vira uma linha", async () => {
    await shelveAndRead(leitor, obra, "read", "2019-03-12");

    await db.insert(ratings).values({ userId: leitor.id, workId: obra, value: 4 });

    const diario = await getDiario(leitor, leitor.id);
    const linha = diario.find((d) => d.workId === obra);

    expect(linha, "a leitura terminada não virou uma linha do diário").toBeDefined();
    expect(linha!.quando).toBe("2019-03-12");
    expect(linha!.rating).toBe(4);
    expect(linha!.releitura).toBe(false);
    expect(linha!.abandonado).toBe(false);
  });

  it("reler vira uma SEGUNDA linha, não reescreve a primeira", async () => {
    // "lendo" de novo num livro "lido" abre uma nova leitura (ver
    // components/book-panel.tsx e lib/library.ts).
    await shelveAndRead(leitor, obra, "reading");
    await shelveAndRead(leitor, obra, "read", "2024-02-20");

    const diario = await getDiario(leitor, leitor.id);
    const linhas = diario.filter((d) => d.workId === obra);

    expect(linhas.length, "a releitura não virou uma linha nova").toBe(2);

    // mais recente primeiro
    expect(linhas[0]!.quando).toBe("2024-02-20");
    expect(linhas[1]!.quando).toBe("2019-03-12");

    // a mais recente é a releitura; a original continua marcada como a primeira
    expect(linhas[0]!.releitura, "a segunda leitura não foi marcada como releitura").toBe(true);
    expect(linhas[1]!.releitura, "a primeira leitura virou releitura por engano").toBe(false);

    // o veredito é do LIVRO, e se repete nas duas linhas
    expect(linhas[0]!.rating).toBe(4);
    expect(linhas[1]!.rating).toBe(4);
  });

  it("um estranho não vê a leitura de uma estante privada", async () => {
    await shelveAndRead(estranho, obraPrivada, "read", "2022-06-01");
    await db.execute(sql`
      update library_entries set visibility = 'private'
       where user_id = ${estranho.id}::uuid and work_id = ${obraPrivada}::uuid`);

    const paraODono = await getDiario(estranho, estranho.id);
    expect(paraODono.some((d) => d.workId === obraPrivada), "o dono não vê a própria leitura").toBe(true);

    const paraOLeitor = await getDiario(leitor, estranho.id);
    expect(
      paraOLeitor.some((d) => d.workId === obraPrivada),
      "um estranho viu a leitura de uma estante privada",
    ).toBe(false);
  });

  it("'tem resenha' só acende na leitura que a resenha referencia", async () => {
    const diarioAntes = await getDiario(leitor, leitor.id);
    const linhas = diarioAntes.filter((d) => d.workId === obra);
    const [entry] = await db
      .select({ id: libraryEntries.id })
      .from(libraryEntries)
      .where(sql`${libraryEntries.userId} = ${leitor.id}::uuid and ${libraryEntries.workId} = ${obra}::uuid`);
    expect(entry).toBeDefined();

    // A resenha referencia a leitura MAIS RECENTE (a releitura de 2024), e é
    // escrita no MESMO DIA da leitura — este teste é sobre "tem_resenha", não
    // sobre a linha própria de "resenhei" (isso é o describe() de baixo).
    await db.insert(reviews).values({
      userId: leitor.id,
      workId: obra,
      readingId: linhas[0]!.readingId,
      body: "resenha da releitura",
      visibility: "public",
      createdAt: new Date("2024-02-20T12:00:00-03:00"),
    });

    const diario = await getDiario(leitor, leitor.id);
    const linhasDoLivro = diario.filter((d) => d.workId === obra);

    // Mesmo dia: NÃO vira uma terceira linha — só as duas leituras de sempre.
    expect(linhasDoLivro.length, "resenha no mesmo dia da leitura virou uma linha a mais").toBe(2);

    const [releitura, original] = linhasDoLivro;
    expect(releitura!.temResenha, "a leitura que tem a resenha não acendeu").toBe(true);
    expect(original!.temResenha, "a leitura antiga acendeu 'tem resenha' sem ter uma").toBe(false);

    await db.execute(sql`delete from reviews where reading_id = ${linhas[0]!.readingId}::uuid`);
  });
});

describe("\"resenhei\" vira linha própria só quando a data é OUTRA", () => {
  let obraDaResenha: string;
  let readingId: string;

  it("resenha escrita dias depois da leitura vira uma SEGUNDA linha, com 'resenhei'", async () => {
    const { workId } = await findOrCreateWork({
      title: `O livro resenhado depois ${marca}`,
      author: `Autor de teste ${marca}`,
    });
    obraDaResenha = workId;

    await shelveAndRead(leitor, workId, "read", "2025-01-10");
    const antes = await getDiario(leitor, leitor.id);
    readingId = antes.find((d) => d.workId === workId)!.readingId;

    await db.insert(reviews).values({
      userId: leitor.id,
      workId,
      readingId,
      body: "escrevi essa resenha bem depois",
      visibility: "public",
      createdAt: new Date("2025-01-20T12:00:00-03:00"),
    });

    const diario = await getDiario(leitor, leitor.id);
    const linhas = diario.filter((d) => d.workId === workId);

    expect(linhas.length, "a resenha em outro dia não virou uma linha nova").toBe(2);

    // mais recente primeiro: a resenha (20) vem antes da leitura (10)
    expect(linhas[0]!.tipo).toBe("resenha");
    expect(linhas[0]!.quando).toBe("2025-01-20");
    expect(linhas[1]!.tipo).toBe("leitura");
    expect(linhas[1]!.quando).toBe("2025-01-10");
  });

  it("a linha da resenha respeita a MESMA visibilidade — não some pro dono, some pro estranho", async () => {
    const paraODono = await getDiario(leitor, leitor.id);
    expect(paraODono.some((d) => d.readingId === readingId && d.tipo === "resenha")).toBe(true);

    const paraOEstranho = await getDiario(estranho, leitor.id);
    // a estante é pública por padrão, então a resenha pública também aparece
    expect(paraOEstranho.some((d) => d.readingId === readingId && d.tipo === "resenha")).toBe(true);

    // tornando a RESENHA privada (não a estante), ela some só pro estranho
    await db.execute(sql`update reviews set visibility = 'private' where reading_id = ${readingId}::uuid`);

    const depois = await getDiario(estranho, leitor.id);
    expect(
      depois.some((d) => d.readingId === readingId && d.tipo === "resenha"),
      "uma resenha privada apareceu como linha pra um estranho",
    ).toBe(false);

    const aindaParaODono = await getDiario(leitor, leitor.id);
    expect(aindaParaODono.some((d) => d.readingId === readingId && d.tipo === "resenha")).toBe(true);
  });
});

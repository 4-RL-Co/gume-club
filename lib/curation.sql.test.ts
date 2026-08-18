import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works } from "@/lib/db/schema";
import { editBook, getHistory } from "@/lib/curation";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ARRUMAR UM LIVRO (editBook), contra Postgres de verdade.
 *
 *  A sinopse é o caso mais delicado: "sinopse não é fato, é obra" (ver
 *  ai/DECISIONS.md — é por isso que o Gume nunca raspou uma de loja
 *  nenhuma). Quando ELA muda por aqui, a fonte tem que virar "gume" — é
 *  texto de quem está na tela, não texto importado — e limpar o campo
 *  tem que limpar a fonte junto, sem sobrar um "gume" órfão apontando
 *  para um texto que não existe mais.
 * ════════════════════════════════════════════════════════════════════
 */

let leitor: { id: string };
let obra: string;

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados: string[] = [];

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ handle: `curation-leitor-${marca}`, email: `curation-${marca}@curation.test` })
    .returning({ id: users.id });
  criados.push(u!.id);
  leitor = { id: u!.id };

  const [w] = await db
    .insert(works)
    .values({
      slug: `curation-${marca}`,
      title: `A obra da sinopse ${marca}`,
      description: "A sinopse que veio da Open Library.",
      descriptionSource: "openlibrary",
    })
    .returning({ id: works.id });
  obra = w!.id;
});

afterAll(async () => {
  if (obra) await db.execute(sql`delete from works where id = ${obra}::uuid`);
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
});

describe("a sinopse, com as próprias palavras de quem edita", () => {
  it("escrever uma sinopse nova aplica na hora, e a fonte vira 'gume'", async () => {
    await editBook(leitor, obra, null, { description: "O que eu conto do livro, com minhas palavras." }, null);

    const [w] = await db
      .select({ description: works.description, source: works.descriptionSource })
      .from(works)
      .where(eq(works.id, obra));
    expect(w!.description).toBe("O que eu conto do livro, com minhas palavras.");
    expect(w!.source, "a fonte não virou 'gume' quando o texto é de quem editou").toBe("gume");
  });

  it("a mudança vira uma linha pública no histórico, rotulada 'sinopse'", async () => {
    const log = await getHistory(obra, []);
    const linha = log.find((l) => (l.patch as Record<string, unknown>).description);
    expect(linha, "a correção de sinopse não gravou revisão").toBeDefined();
    expect(linha!.handle).toContain("curation-leitor");
  });

  it(
    "a fonte NÃO vira uma linha própria no histórico — é metadado da sinopse, não um campo que alguém 'corrigiu'",
    async () => {
      const log = await getHistory(obra, []);
      const comFonte = log.find((l) => "descriptionSource" in (l.patch as Record<string, unknown>));
      expect(comFonte, "descriptionSource vazou como campo próprio no histórico").toBeUndefined();
    },
  );

  it("limpar a sinopse limpa a fonte junto — sem 'gume' órfão apontando pro nada", async () => {
    await editBook(leitor, obra, null, { description: null }, null);

    const [w] = await db
      .select({ description: works.description, source: works.descriptionSource })
      .from(works)
      .where(eq(works.id, obra));
    expect(w!.description).toBeNull();
    expect(w!.source, "a fonte sobrou apontando para um texto que não existe mais").toBeNull();
  });

  it("não mandar `description` não toca no campo (undefined é 'não mexi', não 'apague')", async () => {
    await editBook(leitor, obra, null, { description: "de novo, com minhas palavras" }, null);
    await editBook(leitor, obra, null, { title: "só o título mudou" }, null);

    const [w] = await db
      .select({ title: works.title, description: works.description })
      .from(works)
      .where(eq(works.id, obra));
    expect(w!.title).toBe("só o título mudou");
    expect(w!.description, "a sinopse sumiu numa correção que nem mandou o campo").toBe(
      "de novo, com minhas palavras",
    );
  });
});

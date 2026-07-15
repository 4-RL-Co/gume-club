import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, editions } from "@/lib/db/schema";
import {
  corrigirEdicao, reverter, proporCapa, julgarCapa, getFilaDeCapas, getCorrecoes,
} from "@/lib/corrections";
import { Forbidden } from "@/lib/authz";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O HISTÓRICO DE CORREÇÕES.
 *
 *  Nada é sobrescrito em silêncio, a capa é a única exceção à correção
 *  livre, e reverter é ação de bibliotecário. Estes testes provam as
 *  três coisas contra o Postgres de verdade, e provam a que sustenta as
 *  fatias seguintes: dá para saber o que SOBREVIVEU.
 * ════════════════════════════════════════════════════════════════════
 */

let leitor: { id: string };
let bibliotecario: { id: string };
let edicao: string;
let obra: string;

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados: string[] = [];

beforeAll(async () => {
  const mk = async (handle: string, tier: number) => {
    const [u] = await db
      .insert(users)
      .values({ handle, email: `${handle}@corrections.test`, librarianTier: tier })
      .returning({ id: users.id });
    criados.push(u!.id);
    return { id: u!.id };
  };

  leitor = await mk(`corr-leitor-${marca}`, 0);
  bibliotecario = await mk(`corr-biblio-${marca}`, 1);

  const [w] = await db
    .insert(works)
    .values({ slug: `corr-${marca}`, title: `A obra da correção ${marca}` })
    .returning({ id: works.id });
  obra = w!.id;

  const [e] = await db
    .insert(editions)
    .values({ workId: obra, publisher: "Editora Errada", pageCount: 320 })
    .returning({ id: editions.id });
  edicao = e!.id;
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
  if (obra) await db.execute(sql`delete from works where id = ${obra}::uuid`);
});

describe("qualquer leitor corrige, e o nome dele fica", () => {
  it("corrigir aplica na hora E grava uma revisão com o autor", async () => {
    await corrigirEdicao(leitor, edicao, "pageCount", "344", "estava contando a folha de rosto");

    const [e] = await db.select({ p: editions.pageCount }).from(editions).where(eq(editions.id, edicao));
    expect(e!.p, "a correção não foi aplicada").toBe(344);

    const log = await getCorrecoes([edicao]);
    const linha = log.find((c) => c.campo === "páginas");

    expect(linha, "a correção não virou histórico").toBeDefined();
    expect(linha!.de).toBe("320");
    expect(linha!.para).toBe("344");
    expect(linha!.handle).toContain("corr-leitor");
  });

  it("um campo que NÃO está na lista não entra, venha o que vier no corpo", async () => {
    await expect(
      // @ts-expect-error de propósito: é exatamente isto que um atacante manda
      corrigirEdicao(leitor, edicao, "coverUrl", "https://evil.example/x.jpg", null),
    ).rejects.toThrow(Forbidden);

    const [e] = await db.select({ c: editions.coverUrl }).from(editions).where(eq(editions.id, edicao));
    expect(e!.c, "a capa entrou pela porta da correção livre").toBeNull();
  });
});

describe("reverter é ação de bibliotecário, e a reversão também é log", () => {
  it("um leitor comum não reverte", async () => {
    const log = await getCorrecoes([edicao]);
    const id = log[0]!.id.split(":")[0]!;

    await expect(reverter(leitor, id)).rejects.toThrow(Forbidden);
  });

  it("o bibliotecário reverte, o valor volta, e a reversão entra no histórico", async () => {
    const antes = await getCorrecoes([edicao]);
    const id = antes.find((c) => c.campo === "páginas" && !c.revertedAt)!.id.split(":")[0]!;

    await reverter(bibliotecario, id);

    const [e] = await db.select({ p: editions.pageCount }).from(editions).where(eq(editions.id, edicao));
    expect(e!.p, "o valor não voltou ao que era").toBe(320);

    const depois = await getCorrecoes([edicao]);

    // a original continua lá, marcada como revertida: histórico não se apaga
    const original = depois.find((c) => c.id.startsWith(id));
    expect(original, "a revisão original sumiu do histórico").toBeDefined();
    expect(original!.revertedAt).not.toBeNull();
    expect(original!.revertedByHandle).toContain("corr-biblio");

    // e a reversão é uma revisão NOVA
    expect(depois.length, "a reversão não virou uma linha do histórico").toBeGreaterThan(antes.length);
  });
});

describe("a capa é a única exceção: propõe qualquer um, aplica bibliotecário", () => {
  it("um leitor comum não vê a fila", async () => {
    await expect(getFilaDeCapas(leitor)).rejects.toThrow(Forbidden);
  });

  it("propor não muda a capa: ela entra numa fila", async () => {
    await proporCapa(leitor, edicao, "https://covers.openlibrary.org/b/id/1-L.jpg", "peguei na OL");

    const [e] = await db.select({ c: editions.coverUrl }).from(editions).where(eq(editions.id, edicao));
    expect(e!.c, "a proposta de capa foi aplicada sem bibliotecário nenhum").toBeNull();

    const fila = await getFilaDeCapas(bibliotecario);
    expect(fila.some((p) => p.handle?.includes("corr-leitor"))).toBe(true);
  });

  it("um leitor comum não julga a fila", async () => {
    const fila = await getFilaDeCapas(bibliotecario);
    await expect(julgarCapa(leitor, fila[0]!.id, true)).rejects.toThrow(Forbidden);
  });

  it("o bibliotecário aplica, e a revisão leva o nome de QUEM PROPÔS", async () => {
    const fila = await getFilaDeCapas(bibliotecario);
    await julgarCapa(bibliotecario, fila[0]!.id, true);

    const [e] = await db.select({ c: editions.coverUrl }).from(editions).where(eq(editions.id, edicao));
    expect(e!.c).toContain("covers.openlibrary.org");

    const log = await getCorrecoes([edicao]);
    const capa = log.find((c) => c.campo === "capa");

    expect(capa, "aplicar a capa não virou histórico").toBeDefined();
    expect(
      capa!.handle,
      "a revisão da capa levou o nome do bibliotecário: o trabalho é de quem ACHOU a capa",
    ).toContain("corr-leitor");
  });
});

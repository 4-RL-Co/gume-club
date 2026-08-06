import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, editions, libraryEntries } from "@/lib/db/schema";
import { getEstantes } from "@/lib/explore";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A VITRINE DE GENTE NÃO MOSTRA FANTASMA.
 *
 *  ═══ O QUE O DONO VIU ═══
 *
 *  "Quando a pessoa loga e não segue ninguém, primeira vez, aparecem um monte de
 *  estante/perfil de gente aleatória, sem foto."
 *
 *  Medido em produção: três estantes de verdade (316, 142 e 99 livros) misturadas com
 *  SEIS quase vazias, de 2 a 5 livros, a maioria sem foto e sem bio. Uma delas era de
 *  alguém que **nunca voltou** depois de se cadastrar.
 *
 *  O corte era DOIS livros com capa — feito para barrar o vazio absoluto, e não para
 *  curar uma vitrine.
 *
 *  ═══ POR QUE O SINAL DE VIDA É A METADE QUE IMPORTA ═══
 *
 *  Convidar alguém a seguir uma conta morta é o pior que esta tela pode fazer: a
 *  pessoa segue, o feed não enche nunca, e ela conclui que o app é vazio. O livro na
 *  estante diz que houve alguém; a última visita diz que ainda há.
 *
 *  Precisa de banco. O CI sobe um.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados: string[] = [];
let cheia: string;
let rala: string;
let sumida: string;

async function pessoa(h: string, visto: string | null): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ handle: `${h}-${marca}`, email: `${h}-${marca}@vit.test`, emailVerified: true, lastSeenOn: visto })
    .returning({ id: users.id });
  criados.push(u!.id);
  return u!.id;
}

async function encher(userId: string, quantos: number) {
  for (let i = 0; i < quantos; i++) {
    const [w] = await db.insert(works)
      .values({ slug: `vit-${marca}-${userId.slice(0, 8)}-${i}`, title: `zz vitrine ${marca} ${userId.slice(0, 8)} ${i}` })
      .returning({ id: works.id });
    await db.insert(editions).values({ workId: w!.id, coverUrl: "https://covers.openlibrary.org/b/id/1-L.jpg" });
    await db.insert(libraryEntries).values({ userId, workId: w!.id, status: "read", visibility: "public" });
  }
}

const hoje = new Date().toISOString().slice(0, 10);
const faz200dias = new Date(Date.now() - 200 * 864e5).toISOString().slice(0, 10);

beforeAll(async () => {
  cheia = await pessoa("vit-cheia", hoje);
  rala = await pessoa("vit-rala", hoje);
  sumida = await pessoa("vit-sumida", faz200dias);

  await encher(cheia, 12);
  // Cinco livros era o caso real do `lucas`: estante começada, e não uma vitrine.
  await encher(rala, 5);
  // Estante cheia, mas a pessoa não volta há meses.
  await encher(sumida, 12);
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
  await db.execute(sql`delete from works where slug like ${`vit-${marca}-%`}`);
});

describe("a vitrine de estantes para descobrir", () => {
  it("mostra quem tem estante de verdade e ainda aparece", async () => {
    const nomes = (await getEstantes(null, 100)).map((e) => e.handle);
    expect(nomes, "a estante cheia e viva sumiu da vitrine").toContain(`vit-cheia-${marca}`);
  });

  it("não mostra estante começada", async () => {
    const nomes = (await getEstantes(null, 100)).map((e) => e.handle);
    expect(
      nomes,
      "uma estante de cinco livros voltou à vitrine: é o 'monte de gente sem foto' que " +
        "o dono viu ao entrar pela primeira vez.",
    ).not.toContain(`vit-rala-${marca}`);
  });

  /** A metade que importa: estante cheia não basta se a pessoa não volta. */
  it("não mostra quem não aparece há meses", async () => {
    const nomes = (await getEstantes(null, 100)).map((e) => e.handle);
    expect(
      nomes,
      "a vitrine voltou a oferecer conta morta. Quem seguir vê o feed não encher nunca, " +
        "e conclui que o app é vazio.",
    ).not.toContain(`vit-sumida-${marca}`);
  });

  /**
   * E a ORDEM da tela: quem ainda não segue ninguém abre na curadoria da casa.
   * Sem isto, a primeira impressão do Gume é uma lista de estranhos.
   */
  it("quem não segue ninguém abre na curadoria, e ela não aparece duas vezes", () => {
    const src = readFileSync("components/explore.tsx", "utf8")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");

    expect(/\{!jaSegue && <CuradoriaCard \/>\}/.test(src), "a curadoria não sobe para quem chega").toBe(true);
    expect(/\{jaSegue && <CuradoriaCard \/>\}/.test(src), "a curadoria apareceria duas vezes na mesma tela").toBe(true);
  });
});

import { describe, it, expect, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, revisions } from "@/lib/db/schema";
import {
  ehBibliotecario, CORRECOES_PARA_BIBLIOTECARIO, DIAS_DE_CONTA, TAXA_MAXIMA_DE_REVERSAO_RECENTE,
} from "@/lib/librarian";

/**
 * ════════════════════════════════════════════════════════════════════
 *  RED TEAM: QUEM VIRA BIBLIOTECÁRIA SOZINHA.
 *
 *  "é mt desproporcional uma pessoa corrigir 50 livros e se só 1 for revertido ela ja
 *  nao ganha" — o dono. A regra antiga ("nenhuma reversão nos últimos 90 dias") media
 *  a pessoa contra ZERO; a nova mede PROPORÇÃO. Este arquivo prova as duas pontas: uma
 *  reversão isolada não tranca mais, e um padrão de verdade continua trancando.
 *
 *  Conta de ontem, não de hoje: `ehBibliotecario()` também exige DIAS_DE_CONTA — os
 *  fixtures usam `created_at` no passado para não confundir "não é bibliotecária
 *  porque é nova" com "não é bibliotecária por causa da reversão".
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados: string[] = [];
const VELHA = new Date(Date.now() - (DIAS_DE_CONTA + 5) * 24 * 60 * 60 * 1000);

async function novaConta(handle: string, criadaEm: Date = VELHA) {
  const [u] = await db.insert(users)
    .values({ handle, email: `${handle}@librarian.test`, createdAt: criadaEm })
    .returning({ id: users.id });
  criados.push(u!.id);
  return u!.id;
}

/** `n` correções sobreviventes, e `revertidas` delas marcadas como revertidas AGORA. */
async function corrigir(userId: string, n: number, revertidas = 0) {
  for (let i = 0; i < n; i++) {
    await db.insert(revisions).values({
      userId,
      targetType: "work",
      targetId: crypto.randomUUID(),
      patch: {},
      previous: {},
      revertedAt: i < revertidas ? new Date() : null,
    });
  }
}

async function ehBiblio(userId: string): Promise<boolean> {
  const [row] = await db.execute<{ sim: boolean }>(sql`
    select ${ehBibliotecario(sql`u`)} as sim from users u where u.id = ${userId}::uuid`);
  return row?.sim ?? false;
}

afterAll(async () => {
  // revisions.user_id é ON DELETE SET NULL (histórico não some com a conta) — sem
  // apagar as linhas primeiro, elas ficariam órfãs no banco para sempre.
  for (const id of criados) {
    await db.execute(sql`delete from revisions where user_id = ${id}::uuid`);
    await db.execute(sql`delete from users where id = ${id}::uuid`);
  }
});

describe("a porta que se abre sozinha", () => {
  it("50 sobreviventes, conta velha, zero reversão: vira bibliotecária", async () => {
    const id = await novaConta(`biblio-ok-${marca}`);
    await corrigir(id, CORRECOES_PARA_BIBLIOTECARIO);
    expect(await ehBiblio(id)).toBe(true);
  });

  it("menos que o mínimo de correções: não vira, mesmo com conta velha", async () => {
    const id = await novaConta(`biblio-pouco-${marca}`);
    await corrigir(id, CORRECOES_PARA_BIBLIOTECARIO - 1);
    expect(await ehBiblio(id)).toBe(false);
  });

  it("conta nova, mesmo com correções de sobra: não vira ainda", async () => {
    const id = await novaConta(`biblio-nova-${marca}`, new Date());
    await corrigir(id, CORRECOES_PARA_BIBLIOTECARIO * 2);
    expect(await ehBiblio(id)).toBe(false);
  });

  /**
   * A PONTA CENTRAL DA MUDANÇA: uma reversão isolada, numa carreira de 107
   * correções (o caso real que gerou esta regra), não tranca a insígnia.
   */
  it("uma reversão isolada numa carreira grande não bloqueia mais", async () => {
    const id = await novaConta(`biblio-rosangela-${marca}`);
    await corrigir(id, 107, 1); // 107 correções, 1 revertida agora — 1/107 ≈ 0.9%
    expect(await ehBiblio(id)).toBe(true);
  });

  it("uma reversão isolada logo acima do mínimo (50 sobreviventes, 1 revertida) também não bloqueia", async () => {
    const id = await novaConta(`biblio-minimo-${marca}`);
    // 51 correções ao todo, 1 revertida: exatamente 50 sobreviventes (o mínimo), taxa ~2%.
    await corrigir(id, CORRECOES_PARA_BIBLIOTECARIO + 1, 1);
    expect(await ehBiblio(id)).toBe(true);
  });

  it("um padrão de verdade (mais que 10% revertido) continua bloqueando", async () => {
    const id = await novaConta(`biblio-padrao-${marca}`);
    // 60 correções, 7 revertidas: ~11,7%, acima do teto de 10%.
    await corrigir(id, 60, 7);
    expect(TAXA_MAXIMA_DE_REVERSAO_RECENTE).toBe(0.1); // trava o número que o teste assume
    expect(await ehBiblio(id)).toBe(false);
  });

  it("exatamente no teto (10%) ainda passa; um a mais, não", async () => {
    const noTeto = await novaConta(`biblio-teto-${marca}`);
    await corrigir(noTeto, 100, 10); // exatamente 10%
    expect(await ehBiblio(noTeto)).toBe(true);

    const acima = await novaConta(`biblio-acima-${marca}`);
    await corrigir(acima, 100, 11); // 11%
    expect(await ehBiblio(acima)).toBe(false);
  });

  it("a porta manual (librarian_tier) vale sozinha, sem correção nenhuma", async () => {
    const id = await novaConta(`biblio-manual-${marca}`, new Date());
    await db.execute(sql`update users set librarian_tier = 1 where id = ${id}::uuid`);
    expect(await ehBiblio(id)).toBe(true);
  });
});

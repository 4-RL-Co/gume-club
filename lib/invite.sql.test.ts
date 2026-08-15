import { describe, it, expect, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, libraryEntries } from "@/lib/db/schema";
import { getShelvesToFollow } from "@/lib/invite";
import { LIVROS_DO_AMIGO } from "@/lib/regras";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A PRIMEIRA TELA NÃO OFERECE UM CADASTRO VAZIO.
 *
 *  "Aqui tem que aparecer quem tem pelo menos 10 livros na estante" — o
 *  dono, vendo a própria tela de boas-vindas cheia de contas com "0
 *  livros". O piso era "pelo menos um livro público": uma conta recém
 *  criada com um livro solto já bastava para virar sugestão pra todo
 *  mundo que chegasse sozinho. Ver lib/invite.ts.
 * ════════════════════════════════════════════════════════════════════
 */
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados = { gente: [] as string[], obras: [] as string[] };
let n = 0;

async function leitorCom(publicos: number, privados = 0) {
  const [u] = await db
    .insert(users)
    .values({ handle: `convite-${marca}-${++n}`, email: `convite-${marca}-${n}@iv.test` })
    .returning({ id: users.id });
  criados.gente.push(u!.id);

  for (let i = 0; i < publicos + privados; i++) {
    const [w] = await db
      .insert(works)
      .values({ title: `Convite ${marca} ${n}-${i}`, slug: `convite-${marca}-${n}-${i}` })
      .returning({ id: works.id });
    criados.obras.push(w!.id);
    await db.insert(libraryEntries).values({
      userId: u!.id,
      workId: w!.id,
      status: "read",
      visibility: i < publicos ? "public" : "private",
    });
  }

  return u!.id;
}

afterAll(async () => {
  if (criados.gente.length) {
    await db.execute(sql`delete from users where id = any(${sql.param(criados.gente)}::uuid[])`);
  }
  if (criados.obras.length) {
    await db.execute(sql`delete from works where id = any(${sql.param(criados.obras)}::uuid[])`);
  }
});

describe("getShelvesToFollow: uma estante de verdade, não um cadastro", () => {
  it(`um leitor com menos de ${LIVROS_DO_AMIGO} livros públicos não é sugerido`, async () => {
    const poucos = await leitorCom(LIVROS_DO_AMIGO - 1);
    const sugestoes = await getShelvesToFollow(null, 200);
    expect(sugestoes.some((s) => s.id === poucos)).toBe(false);
  });

  it(`um leitor com ${LIVROS_DO_AMIGO} livros públicos, exatamente, já é sugerido`, async () => {
    const suficiente = await leitorCom(LIVROS_DO_AMIGO);
    const sugestoes = await getShelvesToFollow(null, 200);
    const achado = sugestoes.find((s) => s.id === suficiente);
    expect(achado, "não apareceu na lista de sugestões").toBeTruthy();
    expect(achado?.books).toBe(LIVROS_DO_AMIGO);
  });

  it("livro privado não conta para o piso", async () => {
    // dez livros na estante, mas só nove públicos: continua de fora.
    const quaseLa = await leitorCom(LIVROS_DO_AMIGO - 1, 1);
    const sugestoes = await getShelvesToFollow(null, 200);
    expect(sugestoes.some((s) => s.id === quaseLa)).toBe(false);
  });
});

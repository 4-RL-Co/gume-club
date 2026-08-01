import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, editions } from "@/lib/db/schema";
import { shelve } from "@/lib/library";

/**
 * ════════════════════════════════════════════════════════════════════
 *  PÔR NA ESTANTE GRAVA QUAL EDIÇÃO. E NUNCA APAGA A QUE VOCÊ ESCOLHEU.
 *
 *  ═══ O BUG QUE ESTE ARQUIVO EXISTE POR CAUSA DE ═══
 *
 *  O dono buscou pelo ISBN da Metamorfose da Antofágica, achou, pôs na estante — e a
 *  tela do livro mostrou uma edição da Leya de 2013, com a capa de uma terceira.
 *
 *  Ele não errou nada. `shelve()` gravava só (usuário, obra, status): **a edição que
 *  ele acabou de identificar era descartada na última linha do caminho.** Sem ela, a
 *  página do livro cai na "primeira edição que tiver capa", e uma obra empacota
 *  edições de editoras diferentes — no acervo há obra com 36 editoras juntas.
 *
 *  O estrago não aparece onde nasce. Nasce ao prateleirar e aparece noutra tela,
 *  outro dia, como "este app mostra o livro errado".
 *
 *  ═══ POR QUE O SEGUNDO TESTE É O IMPORTANTE ═══
 *
 *  O conserto óbvio (gravar a edição no conflito) traz um bug pior de brinde: quem
 *  escolheu a edição a dedo, no "qual é a sua", perderia a escolha ao clicar em
 *  "lido" — porque reprateleirar reescreveria a linha com o palpite da busca.
 *
 *  Trocar "o app esqueceu a sua edição" por "o app desfez a sua escolha" seria
 *  andar para trás. O `coalesce` é quem garante a direção: o palpite preenche o
 *  branco, e nunca sobrescreve uma decisão.
 *
 *  Precisa de banco. O CI sobe um.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let leitorId: string;
let obraId: string;
let edicaoBuscada: string;
let edicaoEscolhida: string;

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ handle: `prat-${marca}`, email: `prat-${marca}@prat.test` })
    .returning({ id: users.id });
  leitorId = u!.id;

  const [w] = await db
    .insert(works)
    .values({ slug: `prat-obra-${marca}`, title: `zz obra ${marca}` })
    .returning({ id: works.id });
  obraId = w!.id;

  // Duas edições da MESMA obra, como a Metamorfose tinha: uma Antofágica e uma Leya.
  const [e1] = await db
    .insert(editions)
    .values({ workId: obraId, publisher: "Antofágica", isbn13: `978${marca}`.slice(0, 13) })
    .returning({ id: editions.id });
  const [e2] = await db
    .insert(editions)
    .values({ workId: obraId, publisher: "Leya" })
    .returning({ id: editions.id });
  edicaoBuscada = e1!.id;
  edicaoEscolhida = e2!.id;
});

afterAll(async () => {
  await db.execute(sql`delete from users where id = ${leitorId}::uuid`);
  await db.execute(sql`delete from works where slug = ${`prat-obra-${marca}`}`);
});

async function edicaoGravada(): Promise<string | null> {
  const [row] = await db.execute<{ edition_id: string | null }>(sql`
    select edition_id from library_entries
     where user_id = ${leitorId}::uuid and work_id = ${obraId}::uuid`);
  return row?.edition_id ?? null;
}

describe("prateleirar guarda a edição que o leitor identificou", () => {
  it("a edição da busca entra junto com o livro", async () => {
    await shelve({ id: leitorId }, obraId, "read", edicaoBuscada);

    expect(
      await edicaoGravada(),
      "a edição foi descartada ao prateleirar: é o bug da Metamorfose, e a página do " +
        "livro vai escolher uma edição qualquer no lugar da que o leitor achou.",
    ).toBe(edicaoBuscada);
  });

  /**
   * O teste que protege a pessoa do conserto. Ver o cabeçalho.
   */
  it("reprateleirar NÃO desfaz a edição que o leitor escolheu a dedo", async () => {
    // A pessoa escolhe a edição dela, no "qual é a sua".
    await db.execute(sql`
      update library_entries set edition_id = ${edicaoEscolhida}::uuid
       where user_id = ${leitorId}::uuid and work_id = ${obraId}::uuid`);

    // E depois clica em "lido" de novo, o que reprateleira com o palpite da busca.
    await shelve({ id: leitorId }, obraId, "reading", edicaoBuscada);

    expect(
      await edicaoGravada(),
      "reprateleirar sobrescreveu a edição escolhida a dedo. Trocamos 'o app esqueceu " +
        "a sua edição' por 'o app desfez a sua escolha', que é pior.",
    ).toBe(edicaoEscolhida);
  });

  it("e o status muda mesmo assim", async () => {
    const [row] = await db.execute<{ status: string }>(sql`
      select status from library_entries
       where user_id = ${leitorId}::uuid and work_id = ${obraId}::uuid`);

    expect(row?.status, "proteger a edição não pode congelar o status").toBe("reading");
  });

  /**
   * E quem prateleira sem edição nenhuma (uma lista colada, um livro sem ISBN) não
   * pode APAGAR a que já estava lá: `coalesce(null, null)` continua nulo, mas
   * `coalesce(escolhida, null)` tem que devolver a escolhida.
   */
  it("prateleirar sem edição não apaga a que já existia", async () => {
    await shelve({ id: leitorId }, obraId, "read", null);

    expect(
      await edicaoGravada(),
      "prateleirar sem edição zerou a edição que já estava gravada",
    ).toBe(edicaoEscolhida);
  });
});

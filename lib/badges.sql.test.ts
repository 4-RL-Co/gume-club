import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getBadgesOf, conceder } from "@/lib/badges";
import { ORDEM } from "@/lib/badges-view";
import { editions, users, works } from "@/lib/db/schema";

/**
 * ════════════════════════════════════════════════════════════════════
 *  As SETE insígnias, contra o banco de verdade.
 *
 *  Eram oito. O SEMEADOR saiu junto com doar/trocar/emprestar (migration 0046): ele era
 *  dado a quem passava um exemplar adiante, e ninguém mais passa exemplar a ninguém.
 *  Uma insígnia que não tem mais como ser conquistada não fica de enfeite no catálogo.
 *
 *  O que estes testes protegem não é o cálculo: é o CRITÉRIO. Uma
 *  insígnia com critério frouxo não é generosa, é inflacionária, e a
 *  primeira que inflar leva as outras sete junto — porque a partir daí
 *  ninguém mais sabe o que qualquer uma delas quer dizer.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados: string[] = [];
let obra = "";

let leitor: { id: string };
let biblio: { id: string };

const mk = async (nome: string, tier = 0) => {
  const handle = `insig-${nome}-${marca}`;
  const [u] = await db
    .insert(users)
    .values({ handle, email: `${handle}@insignia.test`, librarianTier: tier })
    .returning({ id: users.id });
  criados.push(u!.id);
  return { id: u!.id };
};

beforeAll(async () => {
  leitor = await mk("leitor");
  biblio = await mk("biblio", 1);

  const [w] = await db
    .insert(works)
    .values({ slug: `insignia-${marca}`, title: `A obra da insígnia ${marca}` })
    .returning({ id: works.id });
  obra = w!.id;

  await db
    .insert(editions)
    .values({ workId: obra, publisher: "Editora", pageCount: 100 })
    .returning({ id: editions.id });
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
  if (obra) await db.execute(sql`delete from works where id = ${obra}::uuid`);
});

const insigniasDe = async (id: string) => (await getBadgesOf([id]))[id] ?? [];

describe("ZELADOR: DEZ correções, e só as que SOBREVIVERAM", () => {
  it("um leitor comum NÃO consegue conceder, nem para si mesmo", async () => {
    await expect(
      conceder(leitor, leitor.id, "idealizador", "eu mesmo acho que mereço"),
      "qualquer leitor logado conseguiu se dar uma insígnia. Insígnia que se autoconcede não " +
        "vale nada, e leva as outras seis junto.",
    ).rejects.toThrow();

    expect(await insigniasDe(leitor.id)).not.toContain("idealizador");
  });

  it("o deslogado não concede nada", async () => {
    await expect(conceder(null, leitor.id, "idealizador", "oi")).rejects.toThrow();
  });

  it("só existe UM idealizador no mundo, e quem garante é o BANCO", async () => {
    /**
     * Não é uma promessa do código: é um índice único PARCIAL (migration 0024). A
     * diferença importa, porque uma promessa do código sobrevive até a quarta pessoa
     * escrever um segundo insert, e um índice não sobrevive a nada.
     *
     * O seed já concedeu a insígnia ao dono da instância. Uma segunda concessão, para
     * outra pessoa, é ENGOLIDA pelo `on conflict do nothing` do conceder() — e o que
     * importa não é ela estourar, é a segunda pessoa NÃO FICAR com a insígnia.
     *
     * Testar o resultado, e não a exceção: a exceção é um detalhe de como o insert foi
     * escrito, e a garantia é que só existe um.
     */
    await conceder(biblio, leitor.id, "idealizador", "quero ser eu também");

    expect(
      await insigniasDe(leitor.id),
      "uma SEGUNDA pessoa ficou com a insígnia de idealizador",
    ).not.toContain("idealizador");

    const [quantos] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from badge_grants
       where badge = 'idealizador' and revoked_at is null`);

    expect(Number(quantos!.n), "existe mais de um idealizador no mundo").toBe(1);
  });
});

describe("a ordem no perfil é sempre a mesma", () => {
  it("nunca por raridade, nunca por data de conquista", async () => {
    /**
     * A ordem é a da lista, e nunca a da conquista. Se ela mudasse por data, a
     * primeira posição viraria "a mais recente"; se mudasse por raridade, viraria um
     * prêmio, e a última, um consolo.
     */
    const minhas = await insigniasDe(biblio.id);
    const ordem = ORDEM.filter((i) => minhas.includes(i));
    expect(minhas, "as insígnias saíram fora da ordem fixa").toEqual(ordem);
  });
});

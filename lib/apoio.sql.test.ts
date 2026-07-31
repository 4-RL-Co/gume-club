import { describe, it, expect, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, stripeSubscription } from "@/lib/db/schema";
import { ehApoiador, novaValidadeAvulso, DIAS_DE_AVULSO } from "@/lib/apoio";
import { getApoiadores } from "@/lib/contributors";

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM APOIA, PERGUNTADO AO BANCO DE VERDADE.
 *
 *  Estes testes existem por causa de uma coisa só, e ela é o motivo de `is_supporter`
 *  ter deixado de ser uma coluna: **o apoio acaba sozinho, e ninguém avisa.**
 *
 *  Um booleano gravado por webhook não tem como ficar certo no dia em que o prazo vence,
 *  porque nesse dia não acontece evento nenhum: o tempo só passa. O teste do avulso
 *  vencido abaixo é a prova de que a insígnia sai sozinha, e é o que a decisão de criar
 *  a insígnia prometeu desde o começo.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados: string[] = [];

async function novoLeitor(nome: string, campos: Record<string, unknown> = {}) {
  const handle = `apoio-${nome}-${marca}`;
  const [u] = await db
    .insert(users)
    .values({ handle, email: `${handle}@apoio.test`, ...campos })
    .returning({ id: users.id });
  criados.push(u!.id);
  return u!.id;
}

/** A pergunta que a insígnia, a moldura e a lista fazem. Uma só, e é esta. */
async function apoia(id: string): Promise<boolean> {
  const [linha] = await db.execute<{ apoia: boolean }>(sql`
    select ${ehApoiador(sql`u`)} as apoia from users u where u.id = ${id}::uuid`);
  return Boolean(linha?.apoia);
}

afterAll(async () => {
  if (criados.length) {
    await db.execute(sql`delete from users where id = any(${sql.param(criados)}::uuid[])`);
  }
});

describe("ehApoiador", () => {
  it("quem nunca apoiou não apoia", async () => {
    expect(await apoia(await novoLeitor("ninguem"))).toBe(false);
  });

  it("assinatura ativa apoia", async () => {
    const id = await novoLeitor("assina");
    await db.insert(stripeSubscription).values({
      userId: id,
      stripeSubscriptionId: `sub_ativa_${marca}`,
      priceId: "price_teste",
      tier: "lombada",
      status: "active",
    });
    expect(await apoia(id)).toBe(true);
  });

  it("assinatura em teste apoia: um teste é um apoio começando", async () => {
    const id = await novoLeitor("trial");
    await db.insert(stripeSubscription).values({
      userId: id,
      stripeSubscriptionId: `sub_trial_${marca}`,
      priceId: "price_teste",
      tier: "marcador",
      status: "trialing",
    });
    expect(await apoia(id)).toBe(true);
  });

  /**
   * ═══ CANCELADA E ATRASADA NÃO APOIAM ═══
   *
   * `past_due` é o caso que engana: o Stripe ainda está tentando cobrar, e a tentação é
   * contar como apoio para não "punir" quem teve um problema no cartão. Mas insígnia a
   * mais é o app mentindo, e insígnia a menos é o app esperando: ela volta sozinha no
   * instante em que o pagamento entrar.
   */
  it.each(["canceled", "past_due", "unpaid", "incomplete", "incomplete_expired"])(
    "assinatura %s não apoia",
    async (status) => {
      const id = await novoLeitor(`st-${status}`);
      await db.insert(stripeSubscription).values({
        userId: id,
        stripeSubscriptionId: `sub_${status}_${marca}`,
        priceId: "price_teste",
        tier: "capadura",
        status,
      });
      expect(await apoia(id)).toBe(false);
    },
  );

  it("avulso dentro do prazo apoia", async () => {
    const id = await novoLeitor("avulso-vivo");
    await db.execute(sql`
      update users set avulso_badge_until = now() + interval '10 days' where id = ${id}::uuid`);
    expect(await apoia(id)).toBe(true);
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  O TESTE QUE JUSTIFICA A DECISÃO INTEIRA.
   *
   *  A data passou, e NINGUÉM tocou em nada: nenhum webhook chegou, nenhuma faxina
   *  rodou, nenhum job noturno existiu. A insígnia tem que ter saído sozinha.
   *
   *  Com um booleano guardado, este teste seria impossível de passar sem inventar um
   *  processo que alguém teria que lembrar de manter vivo.
   * ════════════════════════════════════════════════════════════════════
   */
  it("avulso vencido NÃO apoia, e ninguém precisou limpar nada", async () => {
    const id = await novoLeitor("avulso-vencido");
    await db.execute(sql`
      update users set avulso_badge_until = now() - interval '1 second' where id = ${id}::uuid`);
    expect(await apoia(id)).toBe(false);
  });
});

describe("a janela do avulso", () => {
  it("um pagamento dá 30 dias a partir de agora", async () => {
    const id = await novoLeitor("um-avulso");
    await db.execute(sql`
      update users set avulso_badge_until = ${novaValidadeAvulso()} where users.id = ${id}::uuid`);

    const [linha] = await db.execute<{ dias: number }>(sql`
      select extract(day from (avulso_badge_until - now()))::int as dias
        from users where id = ${id}::uuid`);

    expect(Number(linha?.dias)).toBe(DIAS_DE_AVULSO - 1);
  });

  /**
   * ═══ PAGAMENTOS SOMAM, E NÃO SE SOBRESCREVEM ═══
   *
   * Quem apoia duas vezes na mesma semana pagou dois meses. Sobrescrever seria cobrar
   * dois e entregar um, e é o tipo de erro que ninguém reclama porque ninguém percebe.
   */
  it("dois pagamentos seguidos somam 60 dias", async () => {
    const id = await novoLeitor("dois-avulsos");

    for (let i = 0; i < 2; i++) {
      await db.execute(sql`
        update users set avulso_badge_until = ${novaValidadeAvulso()} where users.id = ${id}::uuid`);
    }

    const [linha] = await db.execute<{ dias: number }>(sql`
      select extract(day from (avulso_badge_until - now()))::int as dias
        from users where id = ${id}::uuid`);

    expect(Number(linha?.dias)).toBe(DIAS_DE_AVULSO * 2 - 1);
  });

  /**
   * ═══ UM APOIO ANTIGO NÃO PUXA A DATA PARA TRÁS ═══
   *
   * Sem o `greatest(..., now())`, quem apoiou em janeiro e de novo em julho começaria a
   * contar de fevereiro, e a insígnia nasceria vencida no mesmo instante em que a pessoa
   * pagou por ela.
   */
  it("um avulso já vencido recomeça de hoje, e não do passado", async () => {
    const id = await novoLeitor("avulso-antigo");
    await db.execute(sql`
      update users set avulso_badge_until = now() - interval '200 days' where id = ${id}::uuid`);
    await db.execute(sql`
      update users set avulso_badge_until = ${novaValidadeAvulso()} where users.id = ${id}::uuid`);

    expect(await apoia(id)).toBe(true);

    const [linha] = await db.execute<{ dias: number }>(sql`
      select extract(day from (avulso_badge_until - now()))::int as dias
        from users where id = ${id}::uuid`);
    expect(Number(linha?.dias)).toBe(DIAS_DE_AVULSO - 1);
  });
});

describe("a lista pública de apoiadores", () => {
  /**
   * ════════════════════════════════════════════════════════════════════
   *  APARECER É OPT-IN, E O PADRÃO É NÃO APARECER.
   *
   *  Pagar não é consentir em ser publicado. Este é o teste que impede o padrão de virar
   *  "todo mundo" numa refatoração distraída: quem apoia e não pediu nada continua fora.
   * ════════════════════════════════════════════════════════════════════
   */
  it("quem apoia e não pediu para aparecer fica de fora", async () => {
    const id = await novoLeitor("calado");
    await db.execute(sql`
      update users set avulso_badge_until = now() + interval '10 days' where id = ${id}::uuid`);

    expect(await apoia(id)).toBe(true);

    const lista = await getApoiadores();
    expect(lista.some((a) => a.handle === `apoio-calado-${marca}`)).toBe(false);
  });

  it("quem marcou a caixa aparece", async () => {
    const id = await novoLeitor("visivel");
    await db.execute(sql`
      update users
         set avulso_badge_until = now() + interval '10 days', supporter_public = true
       where id = ${id}::uuid`);

    const lista = await getApoiadores();
    expect(lista.some((a) => a.handle === `apoio-visivel-${marca}`)).toBe(true);
  });

  /**
   * Marcar a caixa não é um passe vitalício: ela guarda a ESCOLHA, e não o direito. Quem
   * para de apoiar sai da lista sozinho, e ninguém precisa passar desmarcando caixa de
   * quem cancelou.
   */
  it("quem marcou a caixa e parou de apoiar sai sozinho", async () => {
    const id = await novoLeitor("ex-apoiador");
    await db.execute(sql`
      update users
         set avulso_badge_until = now() - interval '1 day', supporter_public = true
       where id = ${id}::uuid`);

    const lista = await getApoiadores();
    expect(lista.some((a) => a.handle === `apoio-ex-apoiador-${marca}`)).toBe(false);
  });

  /**
   * A lista não expõe valor, e não tem como expor: o tipo que ela devolve tem três
   * campos, e nenhum é dinheiro. Um campo a mais aqui seria a porta pela qual "quem apoia
   * mais" entra na tela.
   */
  it("não devolve valor nenhum", async () => {
    const lista = await getApoiadores();
    for (const a of lista) {
      expect(Object.keys(a).sort()).toEqual(["handle", "image", "name"]);
    }
  });
});

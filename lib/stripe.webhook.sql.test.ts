import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Stripe from "stripe";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { DIAS_DE_AVULSO } from "@/lib/apoio";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O WEBHOOK DO STRIPE, ATACADO DE PROPÓSITO.
 *
 *  Esta é a única superfície do app em que uma requisição SEM SESSÃO muda dado de leitor.
 *  Ela não está na lista de rotas protegidas por getViewer(), e por isso ela precisa de
 *  um teste que faça o papel que a sessão faria em qualquer outra rota.
 *
 *  Três perguntas, e as três são de segurança:
 *
 *    1. um POST sem assinatura válida consegue dar insígnia a alguém?
 *    2. o MESMO aviso, entregue duas vezes, paga duas vezes?
 *    3. sem segredo no ambiente, a rota processa alguma coisa?
 *
 *  A assinatura aqui é gerada com o HMAC de verdade do SDK, e não com um mock: um teste
 *  que finge a verificação prova que o mock funciona, e não que a rota protege.
 * ════════════════════════════════════════════════════════════════════
 */

const SEGREDO = "whsec_teste_do_gume_nao_e_um_segredo_de_verdade";
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados: string[] = [];

const ORIGINAL = {
  secret: process.env.STRIPE_SECRET_KEY,
  webhook: process.env.STRIPE_WEBHOOK_SECRET,
};

let POST: (req: Request) => Promise<Response>;
let leitor = "";

/** Um evento de checkout avulso concluído, do jeito que o Stripe manda. */
function eventoAvulso(eventId: string, userId: string, centavos = 2500) {
  return JSON.stringify({
    id: eventId,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_teste_${eventId}`,
        object: "checkout.session",
        mode: "payment",
        payment_status: "paid",
        amount_total: centavos,
        currency: "brl",
        customer: null,
        payment_intent: `pi_teste_${eventId}`,
        client_reference_id: userId,
        metadata: { userId, kind: "avulso" },
      },
    },
  });
}

/** O cabeçalho que o Stripe manda, assinado com o segredo do endpoint. De verdade. */
function assinar(corpo: string, segredo = SEGREDO): string {
  return Stripe.webhooks.generateTestHeaderString({ payload: corpo, secret: segredo });
}

function bater(corpo: string, assinatura: string | null): Promise<Response> {
  return POST(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: assinatura ? { "stripe-signature": assinatura } : {},
      body: corpo,
    }),
  );
}

/** Até quando a insígnia de avulso vale para este leitor, em dias a partir de agora. */
async function diasDeInsignia(id: string): Promise<number | null> {
  const [linha] = await db.execute<{ dias: number | null }>(sql`
    select extract(day from (avulso_badge_until - now()))::int as dias
      from users where id = ${id}::uuid`);
  return linha?.dias === null || linha?.dias === undefined ? null : Number(linha.dias);
}

beforeAll(async () => {
  /**
   * A chave secreta precisa existir para o cliente ser criado, mas nenhum teste daqui
   * chega a falar com o Stripe: os eventos de avulso são resolvidos só com o corpo, e é
   * de propósito que os testes fiquem nesse caminho. Um teste que precisa de rede é um
   * teste que um dia vai falhar por causa da rede.
   */
  /**
   * O valor tem hífen de propósito: uma chave de teste do Stripe é `sk_test_` seguido de
   * letras e números, e o `pnpm audit:security` reprova qualquer coisa com essa cara num
   * arquivo rastreado. Ele reprovou este arquivo na primeira vez, e estava certo: um
   * scanner que abre exceção para teste é um scanner que não pega a chave que alguém
   * colar num teste. Então o falso aqui não se parece com o verdadeiro.
   */
  process.env.STRIPE_SECRET_KEY = "sk_test-nao-e-uma-chave";
  process.env.STRIPE_WEBHOOK_SECRET = SEGREDO;

  ({ POST } = await import("@/app/api/webhooks/stripe/route"));

  const handle = `webhook-${marca}`;
  const [u] = await db
    .insert(users)
    .values({ handle, email: `${handle}@apoio.test` })
    .returning({ id: users.id });
  leitor = u!.id;
  criados.push(leitor);
});

afterAll(async () => {
  if (criados.length) {
    await db.execute(sql`delete from users where id = any(${sql.param(criados)}::uuid[])`);
  }
  await db.execute(sql`delete from stripe_processed_event where event_id like ${`evt_teste_${marca}%`}`);

  if (ORIGINAL.secret === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = ORIGINAL.secret;
  if (ORIGINAL.webhook === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
  else process.env.STRIPE_WEBHOOK_SECRET = ORIGINAL.webhook;
});

describe("a assinatura do webhook", () => {
  it("recusa um POST sem cabeçalho de assinatura", async () => {
    const r = await bater(eventoAvulso(`evt_teste_${marca}_sem`, leitor), null);
    expect(r.status).toBe(400);
    expect(await diasDeInsignia(leitor)).toBeNull();
  });

  /**
   * ═══ O ATAQUE ÓBVIO, E O MOTIVO DE ESTA ROTA EXISTIR DESCONFIADA ═══
   *
   * Qualquer um sabe a URL do webhook, e qualquer um sabe o formato do evento: ele está
   * na documentação pública do Stripe. Sem HMAC, este corpo daria uma insígnia de
   * apoiador de graça para qualquer pessoa que soubesse o próprio uuid.
   */
  it("recusa um corpo forjado, com assinatura inventada", async () => {
    const corpo = eventoAvulso(`evt_teste_${marca}_forjado`, leitor);
    const r = await bater(corpo, "t=1,v1=umaassinaturaquealguemchutou");
    expect(r.status).toBe(400);
    expect(await diasDeInsignia(leitor)).toBeNull();
  });

  /** Assinado com OUTRO segredo: é o caso de quem tem um webhook secret que não é o nosso. */
  it("recusa um corpo assinado com o segredo errado", async () => {
    const corpo = eventoAvulso(`evt_teste_${marca}_outro`, leitor);
    const r = await bater(corpo, assinar(corpo, "whsec_de_outra_pessoa_qualquer_00000"));
    expect(r.status).toBe(400);
    expect(await diasDeInsignia(leitor)).toBeNull();
  });

  /**
   * ═══ A ASSINATURA É SOBRE O CORPO, E NÃO SOBRE A INTENÇÃO ═══
   *
   * Assina um corpo honesto, e manda outro. É o ataque que passa se alguém "consertar" a
   * rota lendo `req.json()` e reserializando: a verificação passaria a conferir um texto
   * que não é o que o Stripe assinou.
   */
  it("recusa quando o corpo entregue não é o corpo assinado", async () => {
    const honesto = eventoAvulso(`evt_teste_${marca}_troca`, leitor, 500);
    const trocado = eventoAvulso(`evt_teste_${marca}_troca`, leitor, 500_000);
    const r = await bater(trocado, assinar(honesto));
    expect(r.status).toBe(400);
    expect(await diasDeInsignia(leitor)).toBeNull();
  });
});

describe("o mesmo aviso, duas vezes", () => {
  /**
   * ════════════════════════════════════════════════════════════════════
   *  O STRIPE REENVIA DE PROPÓSITO, E ESTÁ CERTO EM REENVIAR.
   *
   *  Uma resposta que se perdeu na volta, um deploy no meio, um tempo esgotado. Sem
   *  trava, o mesmo pagamento de 30 dias viraria 60, e depois 90, a cada reenvio.
   * ════════════════════════════════════════════════════════════════════
   */
  it("paga uma vez só", async () => {
    const id = `evt_teste_${marca}_repetido`;
    const corpo = eventoAvulso(id, leitor);
    const assinatura = assinar(corpo);

    const primeira = await bater(corpo, assinatura);
    expect(primeira.status).toBe(200);
    expect(await diasDeInsignia(leitor)).toBe(DIAS_DE_AVULSO - 1);

    const segunda = await bater(corpo, assinatura);
    expect(segunda.status).toBe(200);
    expect(await segunda.json()).toMatchObject({ repetido: true });

    // O ponto inteiro: a data NÃO andou.
    expect(await diasDeInsignia(leitor)).toBe(DIAS_DE_AVULSO - 1);
  });

  /**
   * E a trava não é só a tabela de eventos: mesmo com um id de evento novo, a MESMA
   * sessão de checkout não vira dois apoios. É o cinto de segurança do cinto de segurança,
   * e ele pega o caso em que o Stripe reenvia o mesmo pagamento com um envelope novo.
   */
  it("a mesma sessão de checkout não paga de novo, nem com id de evento diferente", async () => {
    const antes = await diasDeInsignia(leitor);

    const corpo = eventoAvulso(`evt_teste_${marca}_repetido`, leitor).replace(
      `evt_teste_${marca}_repetido"`,
      `evt_teste_${marca}_envelope_novo"`,
    );
    const r = await bater(corpo, assinar(corpo));

    expect(r.status).toBe(200);
    expect(await diasDeInsignia(leitor)).toBe(antes);
  });
});

describe("sem segredo no ambiente", () => {
  /**
   * Quem hospeda o próprio Gume não tem Stripe. A rota não pode ficar aberta processando
   * o que chegar só porque ninguém configurou nada: sem segredo, ela não existe.
   */
  it("a rota não processa nada", async () => {
    const guardado = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      const corpo = eventoAvulso(`evt_teste_${marca}_sem_segredo`, leitor);
      const r = await bater(corpo, assinar(corpo, SEGREDO));
      expect(r.status).toBe(404);
    } finally {
      process.env.STRIPE_WEBHOOK_SECRET = guardado;
    }
  });
});

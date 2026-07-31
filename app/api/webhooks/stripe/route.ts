import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { stripe, tierDoPreco } from "@/lib/stripe";
import { novaValidadeAvulso, ehTier, type Tier } from "@/lib/apoio";

/** Node, e não Edge: o banco e a verificação de assinatura não existem no Edge. */
export const runtime = "nodejs";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O AVISO DO STRIPE. É CAMPAINHA, E NÃO PROVA.
 *
 *  Este é o único lugar do app onde uma requisição sem sessão pode mudar dado de leitor,
 *  e por isso ele é o mais desconfiado. Três travas, e nenhuma delas é opcional.
 *
 *  ═══ 1. A ASSINATURA, SOBRE O CORPO CRU ═══
 *
 *  Qualquer um pode dar um POST aqui dizendo "fulano pagou". O que separa o Stripe de um
 *  desconhecido é um HMAC sobre o corpo, conferido com o segredo do endpoint.
 *
 *  E ele é sobre o corpo CRU, byte a byte. Se qualquer coisa fizer o parse do JSON antes,
 *  a assinatura passa a ser conferida contra um texto reserializado, que quase sempre
 *  difere do original num espaço ou numa ordem de chave, e a verificação falha para
 *  SEMPRE. Por isso `req.text()`, e nada de `req.json()` neste arquivo.
 *
 *  ═══ 2. A IDEMPOTÊNCIA, PORQUE O STRIPE REENVIA DE PROPÓSITO ═══
 *
 *  Uma resposta que se perdeu na volta, um deploy no meio, um tempo esgotado: o Stripe
 *  manda o mesmo evento de novo, e está certo em mandar. Sem trava, um apoio avulso
 *  reenviado daria 60 dias de insígnia por um pagamento de 30.
 *
 *  A trava é `stripe_processed_event`, e o id do evento entra JUNTO com o efeito, e nunca
 *  antes: marcar antes de aplicar perderia o pagamento em silêncio se o meio falhasse.
 *
 *  ═══ 3. O CORPO NÃO É A VERDADE, MESMO ASSINADO ═══
 *
 *  A assinatura prova que o Stripe mandou, e não que o que ele mandou ainda vale: um
 *  evento atrasado descreve um estado que já mudou. Para assinatura, que é o que decide
 *  insígnia por tempo indeterminado, a rota vai buscar o estado atual na API antes de
 *  gravar. O corpo diz ONDE olhar; a API diz O QUE é verdade.
 *
 *  ═══ E ELA NÃO LOGA O CORPO ═══
 *
 *  Nem em erro. O payload tem e-mail, nome e valor pago de uma pessoa, e um log é o lugar
 *  mais fácil do mundo de vazar sem ninguém perceber.
 * ════════════════════════════════════════════════════════════════════
 */
export async function POST(req: Request) {
  const sdk = stripe();
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;

  /**
   * Sem chave ou sem segredo, esta instância não recebe webhook nenhum. 404, e não 500:
   * o endpoint honestamente não existe aqui.
   */
  if (!sdk || !segredo) {
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }

  const assinatura = req.headers.get("stripe-signature");
  if (!assinatura) {
    return NextResponse.json({ error: "sem assinatura" }, { status: 400 });
  }

  /** O corpo CRU. Ver a trava 1 no cabeçalho: nada pode fazer parse antes daqui. */
  const cru = await req.text();

  let evento: Stripe.Event;
  try {
    evento = sdk.webhooks.constructEvent(cru, assinatura, segredo);
  } catch {
    /**
     * Assinatura inválida. 400, e sem detalhe: dizer POR QUE falhou é ensinar a forjar.
     * E sem log do corpo, que é justamente o que um atacante gostaria de plantar num log.
     */
    return NextResponse.json({ error: "assinatura inválida" }, { status: 400 });
  }

  /**
   * ═══ JÁ VI ESTE? ═══
   *
   * A pergunta barata primeiro. Um evento repetido sai daqui com 200 sem tocar em nada:
   * responder 200 é o certo, porque para o Stripe ele FOI processado, e um erro faria
   * ele reenviar para sempre.
   */
  const [visto] = await db.execute<{ event_id: string }>(sql`
    select event_id from stripe_processed_event where event_id = ${evento.id} limit 1`);

  if (visto) {
    return NextResponse.json({ ok: true, repetido: true });
  }

  try {
    await aplicar(sdk, evento);
  } catch {
    /**
     * Deu errado ao aplicar. 500 SEM marcar o evento como processado, para o Stripe
     * reenviar: é exatamente para isso que o reenvio existe. Engolir com 200 aqui seria
     * perder o apoio de alguém em silêncio, que é o pior desfecho possível.
     */
    return NextResponse.json({ error: "falha ao processar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * O efeito, e a marca do evento, numa transação só.
 *
 * Ou as duas coisas acontecem, ou nenhuma. É o que impede os dois desastres simétricos:
 * aplicar duas vezes (marcou e não aplicou) e nunca aplicar (aplicou e não marcou).
 */
async function aplicar(sdk: Stripe, evento: Stripe.Event): Promise<void> {
  await db.transaction(async (tx) => {
    switch (evento.type) {
      case "checkout.session.completed":
        await sessaoCompleta(tx, sdk, evento.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await gravarAssinatura(tx, sdk, evento.data.object.id);
        break;

      /**
       * A fatura mexe no status da assinatura (paga volta a `active`, falhada vai para
       * `past_due`), então a resposta é a mesma: reler no Stripe e gravar o que ele
       * disser. A rota não adivinha o status novo a partir do tipo do evento, porque
       * adivinhar é como as duas versões começam a divergir.
       *
       * ═══ PELO CLIENTE, E NÃO PELA LINHA DA FATURA ═══
       *
       * O caminho até a assinatura DENTRO de uma fatura já mudou de lugar mais de uma vez
       * entre versões da API do Stripe. Ler pelo cliente custa uma chamada a mais e não
       * quebra numa atualização de biblioteca: um evento de fatura é raro, e a corretude
       * aqui vale mais que a chamada economizada.
       */
      case "invoice.paid":
      case "invoice.payment_failed": {
        const fatura = evento.data.object;
        const cliente =
          typeof fatura.customer === "string" ? fatura.customer : fatura.customer?.id;
        if (cliente) await ressincronizarCliente(tx, sdk, cliente);
        break;
      }

      default:
        // Um evento que a gente não trata continua sendo um evento VISTO: marcar embaixo
        // impede o Stripe de reenviá-lo para sempre.
        break;
    }

    await tx.execute(sql`
      insert into stripe_processed_event (event_id) values (${evento.id})
      on conflict (event_id) do nothing`);
  });
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * O checkout terminou.
 *
 * Assinatura: só amarra o cliente à pessoa. O apoio em si é gravado pelo evento de
 * assinatura, que é quem carrega status e vencimento.
 *
 * Avulso: grava o pagamento e estende a insígnia em 30 dias.
 */
async function sessaoCompleta(tx: Tx, sdk: Stripe, sessao: Stripe.Checkout.Session): Promise<void> {
  const userId = sessao.metadata?.userId ?? sessao.client_reference_id;
  if (!userId) return;

  /**
   * ═══ PAGO, E NÃO SÓ "COMPLETO" ═══
   *
   * Uma sessão pode completar com o pagamento ainda pendente (boleto, débito em análise).
   * Dar insígnia por sessão completa seria dar insígnia por promessa de pagamento.
   */
  if (sessao.payment_status !== "paid" && sessao.mode === "payment") return;

  const customer = typeof sessao.customer === "string" ? sessao.customer : sessao.customer?.id;
  if (customer) {
    await tx.execute(sql`
      update users
         set stripe_customer_id = ${customer}
       where id = ${userId}::uuid
         and stripe_customer_id is null`);
  }

  if (sessao.mode === "subscription") {
    const id = typeof sessao.subscription === "string" ? sessao.subscription : sessao.subscription?.id;
    if (id) await gravarAssinatura(tx, sdk, id);
    return;
  }

  if (sessao.mode !== "payment") return;

  const centavos = sessao.amount_total;
  if (!centavos || centavos <= 0) return;

  const intent =
    typeof sessao.payment_intent === "string" ? sessao.payment_intent : sessao.payment_intent?.id;

  /**
   * O `do nothing` é o cinto de segurança do cinto de segurança: mesmo que a trava por
   * id de evento falhasse, a mesma sessão de checkout não vira dois apoios.
   *
   * E o `insert` vem ANTES da extensão da insígnia, de propósito: se ele não inseriu
   * nada (porque já existia), a extensão também não acontece. É o que amarra os 30 dias
   * ao pagamento, e não à chegada do aviso.
   */
  const gravou = await tx.execute<{ id: string }>(sql`
    insert into stripe_one_time_support
      (user_id, stripe_checkout_session_id, stripe_payment_intent_id, amount_cents, currency)
    values (${userId}::uuid, ${sessao.id}, ${intent ?? null}, ${centavos},
            ${sessao.currency ?? "brl"})
    on conflict (stripe_checkout_session_id) do nothing
    returning id`);

  if (gravou.length === 0) return;

  /**
   * +30 dias, e eles SOMAM. A fórmula mora em lib/apoio.ts, num lugar só, para o dia em
   * que a janela mudar ser uma linha. Ver novaValidadeAvulso().
   */
  await tx.execute(sql`
    update users
       set avulso_badge_until = ${novaValidadeAvulso()}
     where users.id = ${userId}::uuid`);
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A ASSINATURA, LIDA DO STRIPE E NÃO DO CORPO.
 *
 *  Recebe só o ID do evento e vai buscar o resto. Um evento pode chegar atrasado, fora de
 *  ordem, ou depois de outro que já mudou o estado: gravar o corpo de um evento antigo
 *  reviveria uma assinatura cancelada. Buscar o estado atual custa uma chamada e resolve
 *  os três casos de uma vez.
 * ════════════════════════════════════════════════════════════════════
 */
async function gravarAssinatura(tx: Tx, sdk: Stripe, subscriptionId: string): Promise<void> {
  const assinatura = await sdk.subscriptions.retrieve(subscriptionId);

  const userId =
    assinatura.metadata?.userId ??
    (await donoDoCliente(
      tx,
      typeof assinatura.customer === "string" ? assinatura.customer : assinatura.customer?.id,
    ));
  if (!userId) return;

  /**
   * O item da assinatura. `[0]` aqui é legítimo, e não o bug de posição-como-papel que o
   * AGENTS.md descreve: uma assinatura de apoio tem exatamente UM item (o checkout manda
   * um `line_item` só), e os itens do Stripe não têm papéis entre os quais escolher.
   */
  const item = assinatura.items.data[0];
  const priceId = item?.price?.id;
  if (!priceId) return;

  /**
   * O tier vem do PREÇO, e o metadata é só o desempate. Se alguém trocar de plano pelo
   * portal do Stripe, o metadata continua dizendo o plano antigo e o preço não: o preço
   * é o fato.
   */
  const doMetadata = assinatura.metadata?.tier;
  const tier: Tier | null =
    tierDoPreco(priceId) ?? (ehTier(doMetadata) ? doMetadata : null);

  /**
   * Um preço que esta instância não conhece. Não inventa um tier para caber: uma linha
   * com tier chutado vira um fato errado no banco, e ninguém sabe que precisa conferir.
   */
  if (!tier) return;

  const fim = item?.current_period_end ?? null;

  await tx.execute(sql`
    insert into stripe_subscription
      (user_id, stripe_subscription_id, price_id, tier, status, current_period_end)
    values (${userId}::uuid, ${assinatura.id}, ${priceId}, ${tier}, ${assinatura.status},
            ${fim ? sql`to_timestamp(${fim})` : sql`null`})
    on conflict (stripe_subscription_id) do update
       set price_id = excluded.price_id,
           tier = excluded.tier,
           status = excluded.status,
           current_period_end = excluded.current_period_end,
           updated_at = now()`);
}

/** Quem é o dono deste cliente do Stripe, quando o metadata não veio. */
async function donoDoCliente(tx: Tx, customerId: string | undefined): Promise<string | null> {
  if (!customerId) return null;
  const [linha] = await tx.execute<{ id: string }>(sql`
    select id from users where stripe_customer_id = ${customerId} limit 1`);
  return linha?.id ?? null;
}

/**
 * Todas as assinaturas deste cliente, regravadas do jeito que o Stripe as descreve agora.
 *
 * `status: "all"` de propósito: uma que acabou de ser cancelada precisa chegar aqui como
 * cancelada, e um filtro por ativas a deixaria para trás, viva no nosso banco para sempre.
 */
async function ressincronizarCliente(tx: Tx, sdk: Stripe, customerId: string): Promise<void> {
  const lista = await sdk.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  for (const assinatura of lista.data) {
    await gravarAssinatura(tx, sdk, assinatura.id);
  }
}

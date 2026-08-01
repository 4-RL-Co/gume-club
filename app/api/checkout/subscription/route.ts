import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/viewer";
import { RATES, limitar, varrer } from "@/lib/rate-limit";
import { ehTier } from "@/lib/apoio";
import { stripe, precoDo, urlDoApp } from "@/lib/stripe";

/** Node, e não Edge: o banco e o limitador não existem no Edge. */
export const runtime = "nodejs";

/**
 * ════════════════════════════════════════════════════════════════════
 *  COMEÇAR UMA ASSINATURA DE APOIO.
 *
 *  A rota não cobra nada: ela cria uma sessão de checkout no Stripe e devolve a URL. O
 *  cartão é digitado lá, numa página do Stripe, e nenhum dado de cartão passa por aqui
 *  em momento nenhum. É o motivo de existir o redirecionamento em vez de um formulário
 *  nosso.
 *
 *  ═══ E ELA NÃO DÁ INSÍGNIA A NINGUÉM ═══
 *
 *  Criar uma sessão de checkout é dizer "quero pagar", e não "paguei". Quem grava apoio
 *  é o webhook, depois de o Stripe confirmar. Se esta rota desse a insígnia, bastaria
 *  abrir o checkout e fechar a aba para ter uma de graça.
 * ════════════════════════════════════════════════════════════════════
 */
export async function POST(req: Request) {
  const sdk = stripe();
  /**
   * Esta instância não tem apoio configurado, e isso é legítimo: quem hospeda o próprio
   * Gume não tem conta no Stripe. A rota simplesmente não existe ali.
   */
  if (!sdk) {
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }

  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "entre para apoiar o Gume" }, { status: 401 });
  }

  /**
   * Por pessoa, como toda escrita. Criar sessão de checkout em laço não cobra ninguém,
   * mas enche a conta do Stripe de sessões abandonadas e é uma chamada de rede paga por
   * clique. Ver lib/rate-limit.ts.
   */
  const veredito = await limitar(`checkout:${viewer.id}`, RATES.write);
  void varrer();
  if (!veredito.ok) {
    return NextResponse.json(
      { error: "muitas tentativas seguidas. tente de novo em instantes" },
      { status: 429, headers: { "retry-after": String(veredito.retryAfter) } },
    );
  }

  const corpo = await req.json().catch(() => null);
  const tier = (corpo as { tier?: unknown } | null)?.tier;

  if (!ehTier(tier)) {
    return NextResponse.json({ error: "plano desconhecido" }, { status: 400 });
  }

  const price = precoDo(tier);
  if (!price) {
    /**
     * O plano existe no código e não no ambiente desta instância. É erro de configuração,
     * e não da pessoa: 500, e não 400. Um 400 aqui mandaria o leitor procurar o próprio
     * erro numa coisa que ele não pode consertar.
     */
    return NextResponse.json({ error: "não foi possível abrir o apoio agora" }, { status: 500 });
  }

  /**
   * ═══ O CLIENTE NO STRIPE, UM POR PESSOA ═══
   *
   * Sem isto, cada apoio criaria um cliente novo, e o histórico de quem apoia duas vezes
   * ficaria partido em dois no dashboard. O id fica em `users.stripe_customer_id`, com
   * índice único: dois leitores no mesmo cliente seria um pagando a insígnia do outro.
   */
  const [linha] = await db.execute<{ stripe_customer_id: string | null; email: string }>(sql`
    select stripe_customer_id, email::text as email
      from users
     where id = ${viewer.id}::uuid
     limit 1`);

  if (!linha) {
    return NextResponse.json({ error: "entre para apoiar o Gume" }, { status: 401 });
  }

  let customerId = linha.stripe_customer_id;

  if (!customerId) {
    const cliente = await sdk.customers.create({
      email: linha.email,
      // Para achar a pessoa a partir do Stripe quando algo der errado e alguém precisar
      // olhar. É um uuid, e não um nome: o dashboard do Stripe não precisa saber quem lê o quê.
      metadata: { userId: viewer.id },
    });
    customerId = cliente.id;

    /**
     * `where stripe_customer_id is null` para não sobrescrever um vínculo que outra
     * requisição criou no mesmo instante. Se duas abas clicarem juntas, uma grava e a
     * outra não, e as duas seguem com um cliente válido.
     */
    await db.execute(sql`
      update users
         set stripe_customer_id = ${customerId}
       where id = ${viewer.id}::uuid
         and stripe_customer_id is null`);
  }

  const sessao = await sdk.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    /**
     * Os dois caminhos de volta para o app. O `client_reference_id` e o `metadata` são o
     * que liga a sessão à pessoa quando o webhook chegar: sem eles, o Stripe avisaria que
     * alguém pagou e não haveria como saber quem.
     */
    client_reference_id: viewer.id,
    metadata: { userId: viewer.id, tier },
    subscription_data: { metadata: { userId: viewer.id, tier } },
    success_url: urlDoApp("/apoiar?obrigado=1"),
    cancel_url: urlDoApp("/apoiar"),
  });

  if (!sessao.url) {
    return NextResponse.json({ error: "não foi possível abrir o apoio agora" }, { status: 502 });
  }

  return NextResponse.json({ url: sessao.url });
}

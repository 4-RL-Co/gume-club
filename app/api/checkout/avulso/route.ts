import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/viewer";
import { RATES, limitar, varrer } from "@/lib/rate-limit";
import { validarValor } from "@/lib/apoio";
import { stripe, urlDoApp } from "@/lib/stripe";

/** Node, e não Edge: o banco e o limitador não existem no Edge. */
export const runtime = "nodejs";

/**
 * ════════════════════════════════════════════════════════════════════
 *  APOIAR UMA VEZ, COM O VALOR QUE A PESSOA QUISER.
 *
 *  ═══ POR QUE O VALOR É MONTADO AQUI, E NÃO NO DASHBOARD DO STRIPE ═══
 *
 *  O dashboard do Stripe não cria pagamento de valor aberto: o Payment Link recusa o
 *  modelo "o cliente escolhe o preço". Então a sessão é montada pelo app, com
 *  `price_data` e o valor que a pessoa digitou.
 *
 *  E isso acabou sendo o certo por outro motivo: é o checkout do app que amarra o
 *  pagamento ao leitor logado, e sem essa amarra não haveria como dar a insígnia a
 *  ninguém. Um Payment Link solto recebe dinheiro de um desconhecido.
 *
 *  A alternativa era criar uma vez, por script, uma Price com `custom_unit_amount`. Ela
 *  daria no mesmo e cobraria um passo de instalação a mais para quem hospeda: um script
 *  que alguém precisa lembrar de rodar antes de o botão funcionar. `price_data` não
 *  precisa de nada além da chave que a instância já tem.
 *
 *  ═══ O VALOR É CONFERIDO AQUI, E NÃO SÓ NA TELA ═══
 *
 *  A tela confere para a pessoa não errar. O servidor confere porque a tela é do
 *  atacante: quem manda o POST direto não passa por tela nenhuma, e um valor negativo ou
 *  absurdo entraria inteiro na sessão. Ver validarValor(), em lib/apoio.ts.
 * ════════════════════════════════════════════════════════════════════
 */
export async function POST(req: Request) {
  const sdk = stripe();
  if (!sdk) {
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }

  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "entre para apoiar o Gume" }, { status: 401 });
  }

  const veredito = await limitar(`checkout:${viewer.id}`, RATES.write);
  void varrer();
  if (!veredito.ok) {
    return NextResponse.json(
      { error: "muitas tentativas seguidas. tente de novo em instantes" },
      { status: 429, headers: { "retry-after": String(veredito.retryAfter) } },
    );
  }

  const corpo = await req.json().catch(() => null);
  const valor = validarValor((corpo as { amount_cents?: unknown } | null)?.amount_cents);

  if (!valor.ok) {
    return NextResponse.json({ error: valor.porque }, { status: 400 });
  }

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
      metadata: { userId: viewer.id },
    });
    customerId = cliente.id;

    await db.execute(sql`
      update users
         set stripe_customer_id = ${customerId}
       where id = ${viewer.id}::uuid
         and stripe_customer_id is null`);
  }

  const sessao = await sdk.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "brl",
          unit_amount: valor.centavos,
          product_data: { name: "Apoio avulso ao Gume" },
        },
        quantity: 1,
      },
    ],
    client_reference_id: viewer.id,
    metadata: { userId: viewer.id, kind: "avulso" },
    payment_intent_data: { metadata: { userId: viewer.id, kind: "avulso" } },
    success_url: urlDoApp("/apoiar?obrigado=1"),
    cancel_url: urlDoApp("/apoiar"),
  });

  if (!sessao.url) {
    return NextResponse.json({ error: "não foi possível abrir o apoio agora" }, { status: 502 });
  }

  return NextResponse.json({ url: sessao.url });
}

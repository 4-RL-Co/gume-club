import * as Sentry from "@sentry/nextjs";

/**
 * O ALARME DE ERRO DO SERVIDOR. E ele nasce DESLIGADO, como toda medição.
 *
 * Antes disto, um erro de produção era invisível: a tela de erro aparecia para o
 * leitor e ninguém do nosso lado ficava sabendo (o primeiro bug real chegou por
 * mensagem de WhatsApp). Com o DSN ligado, cada erro vira alerta com o rastro.
 *
 * SÓ ERRO, nada mais, de propósito: sem traces de performance e sem replay de
 * sessão (replay é papel do Clarity, e coletar duas vezes é coletar demais).
 * Sem a variável, nenhum byte sai. Ver components/medicao.tsx e ai/DECISIONS.md.
 */
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    // O ambiente separa o joio: erro de dev não acorda ninguém.
    environment: process.env.NODE_ENV,
  });
}

export const onRequestError = Sentry.captureRequestError;

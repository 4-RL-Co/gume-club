import * as Sentry from "@sentry/nextjs";

/**
 * O alarme de erro DO NAVEGADOR. Mesmas regras do servidor (instrumentation.ts):
 * desligado sem a variável, só erro, sem traces e sem replay — replay é papel do
 * Clarity, e o que o leitor tem na estante não é dado de erro.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    environment: process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

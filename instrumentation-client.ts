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

    /**
     * ════════════════════════════════════════════════════════════════════
     *  ═══ O QUE NÃO É NOSSO NÃO ACORDA NINGUÉM ═══
     *
     *  O alarme pegou um "Cannot read properties of undefined (reading
     *  'toObject')" que não tinha como ser nosso: a palavra `toObject` não
     *  aparece em nenhum arquivo deste repositório, a pilha inteira dizia
     *  `<script>` (código colado na página, e não arquivo servido por nós) e
     *  o último quadro era `ext:core/01_core.js`, que é entranha do Deno,
     *  num visitante que se anunciava como Chrome no Windows.
     *
     *  Ou é extensão de navegador injetando código na página, ou é robô
     *  rodando o app dentro de outro motor. Nos dois casos o erro aconteceu
     *  na mesma aba que o Gume, e não no Gume.
     *
     *  ═══ A RÉGUA É A PILHA, E NÃO A MENSAGEM ═══
     *
     *  Filtrar por texto de erro seria uma lista que cresce para sempre, uma
     *  entrada por extensão que alguém instalar. A pergunta certa é outra, e
     *  ela vale para qualquer mensagem: ALGUM quadro desta pilha veio de um
     *  arquivo que nós servimos? Se nenhum veio, não há o que consertar
     *  deste lado.
     *
     *  Erro SEM pilha nenhuma passa de propósito. É o caso do que a tela de
     *  erro reporta (app/error.tsx): uma falha do servidor chega ao navegador
     *  como uma marca sem rastro, e ela é justamente a que a gente quer ver.
     * ════════════════════════════════════════════════════════════════════
     */
    beforeSend(event) {
      const quadros =
        event.exception?.values?.flatMap((v) => v.stacktrace?.frames ?? []) ?? [];
      if (quadros.length === 0) return event;
      const nosso = quadros.some((q) => (q.filename ?? "").includes("/_next/"));
      return nosso ? event : null;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

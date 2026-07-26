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

    /**
     * ════════════════════════════════════════════════════════════════════
     *  ═══ O VARREDOR DE WORDPRESS NÃO É UM BUG NOSSO ═══
     *
     *  O primeiro alarme do servidor foi um "Failed to find Server Action",
     *  duas vezes, num POST para a home. O corpo da requisição entregou o
     *  autor: campos `rest_route`, `/wp/v2/posts`, `/batch/v1`. É um robô
     *  procurando WordPress, e ele acha porta em todo endereço da internet.
     *
     *  O erro sai do Next, e não do nosso código: quando um formulário chega
     *  por POST numa página, ele procura no corpo a marca da ação que deveria
     *  executar. O robô manda um formulário sem marca nenhuma, e o Next diz
     *  o que dá para dizer.
     *
     *  ═══ O QUE SE PERDE, E POR QUE VALE ═══
     *
     *  Este mesmo erro acontece com gente de verdade: quem deixou a aba
     *  aberta durante uma atualização e clicou num botão dela depois. É um
     *  caso REAL, e mesmo assim ele sai daqui, porque o alarme não muda nada
     *  sobre ele: não há conserto do nosso lado (a ação antiga não existe
     *  mais, ponto), a pessoa vê a tela de erro com o "tentar de novo" que
     *  resolve, e o preço de manter era o robô tocando a campainha todo dia
     *  até ninguém mais atender nenhuma.
     *
     *  Alarme que toca sempre é alarme desligado. Este fica calado para os
     *  outros continuarem sendo ouvidos.
     * ════════════════════════════════════════════════════════════════════
     */
    ignoreErrors: ["Failed to find Server Action"],
  });
}

export const onRequestError = Sentry.captureRequestError;

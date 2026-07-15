import { AsyncLocalStorage } from "node:async_hooks";
import { limitar } from "@/lib/rate-limit";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O CÓDIGO POR E-MAIL. E o buraco que ele abre.
 *
 *  ═══ ISTO NÃO É UM SEGUNDO FATOR, E NÃO PODE SER CHAMADO ASSIM ═══
 *
 *  **Código por e-mail não é um segundo fator se o reset de senha também vai por
 *  e-mail: é o mesmo fator, duas vezes.**
 *
 *  Ele protege contra senha vazada e reusada — que é o ataque real num app deste
 *  tamanho — e não protege contra invasão do e-mail. Chamar de "2FA" seria prometer uma
 *  segurança que não existe.
 *
 *  Na tela ele se chama **"código por e-mail"**, e em lugar nenhum "autenticação de dois
 *  fatores" ou "verificação em duas etapas". Ver ai/DECISIONS.md.
 *
 *  ═══ O QUE MUDA, E É SÉRIO ═══
 *
 *  O e-mail passa a estar no **caminho crítico do login**.
 *
 *      ANTES   e-mail caído  →  ninguém se cadastra
 *      AGORA   e-mail caído  →  NINGUÉM ENTRA
 *
 *  ═══ E A BIBLIOTECA MENTE SOBRE O ENVIO ═══
 *
 *  Este é o motivo de este arquivo existir. O `/two-factor/send-otp` do Better Auth faz
 *  isto (lido em plugins/two-factor/otp/index.mjs):
 *
 *      const sendOTPResult = options.sendOTP({ user, otp: code });
 *      if (sendOTPResult instanceof Promise)
 *        await runInBackgroundOrAwait(sendOTPResult.catch(e => logger.error(...)));
 *      return ctx.json({ status: true });        // ← SEMPRE true
 *
 *  **Ele engole o erro do envio e responde "enviado".** Se o Resend estiver fora do ar,
 *  a tela diz "mandamos um código para o seu e-mail", a pessoa espera, e nada chega.
 *
 *  É a lei do AGENTS.md quebrada dentro da dependência: *nunca traduza falha de
 *  comunicação em outra coisa.* E o estrago aqui é o pior possível — a pessoa não
 *  consegue entrar, e o app diz que está tudo bem.
 *
 *  ═══ COMO O RESULTADO DE VERDADE VOLTA ATÉ A TELA ═══
 *
 *  Um `AsyncLocalStorage`. A ação de servidor abre uma caixa, chama o Better Auth, e o
 *  `sendOTP` — que roda DENTRO da mesma requisição — escreve nela o que aconteceu de
 *  verdade. A ação lê a caixa e diz a verdade para a tela.
 *
 *  Não é uma variável de módulo: com duas pessoas pedindo código ao mesmo tempo, uma
 *  variável de módulo entregaria o resultado de uma para a outra. O `AsyncLocalStorage`
 *  é por requisição, e não por processo.
 * ════════════════════════════════════════════════════════════════════
 */

export type Envio =
  | { ok: true }
  | { ok: false; motivo: "muitos-pedidos" | "nao-saiu" };

const caixa = new AsyncLocalStorage<{ resultado: Envio | null }>();

/**
 * ═══ O LIMITE É POR PESSOA, E NÃO SÓ POR IP ═══
 *
 * A rota `/api/auth/*` já limita por IP. Isso não basta: um atacante com mil IPs pediria
 * mil códigos para o e-mail da vítima, e a caixa de entrada dela viraria um ataque — e um
 * dos códigos, o que ela por acaso digitasse.
 *
 * A contagem é no banco, e não na memória: em serverless, memória de processo é memória
 * de ninguém. Ver lib/rate-limit.ts.
 *
 * Cinco pedidos em dez minutos. É generoso para quem não recebeu o primeiro, e é
 * ridículo para um script.
 */
const PEDIDOS = { limit: 5, windowMs: 10 * 60_000 };

/** Abre a caixa. A ação de servidor chama o Better Auth aqui dentro. */
export async function comCaixa<T>(fn: () => Promise<T>): Promise<{ saida: T; envio: Envio | null }> {
  const box: { resultado: Envio | null } = { resultado: null };
  const saida = await caixa.run(box, fn);
  return { saida, envio: box.resultado };
}

/**
 * O que o `sendOTP` do lib/auth.ts chama. Ele manda o e-mail DE VERDADE e escreve na
 * caixa o que aconteceu — inclusive quando não mandou.
 */
export async function mandar(
  userId: string,
  enviar: () => Promise<boolean>,
): Promise<void> {
  const box = caixa.getStore();

  const veredito = await limitar(`codigo-por-email:${userId}`, PEDIDOS);
  if (!veredito.ok) {
    if (box) box.resultado = { ok: false, motivo: "muitos-pedidos" };
    return;
  }

  let foi = false;
  try {
    foi = await enviar();
  } catch {
    foi = false;
  }

  if (box) box.resultado = foi ? { ok: true } : { ok: false, motivo: "nao-saiu" };
}

/**
 * A frase que a tela mostra. Uma por motivo, e nenhuma delas mente.
 *
 * "Código enviado" quando ele não saiu é a pior mensagem que este app pode dar: a pessoa
 * espera, olha o spam, espera mais, e conclui que perdeu a conta.
 */
export function oQueDizer(envio: Envio | null): string | null {
  if (!envio || envio.ok) return null;

  if (envio.motivo === "muitos-pedidos") {
    return "Você pediu códigos demais em pouco tempo. Espere dez minutos e tente de novo.";
  }

  return (
    "Não conseguimos mandar o e-mail agora, e o código NÃO foi enviado. " +
    "O problema é nosso, e não seu. Tente de novo em um minuto."
  );
}

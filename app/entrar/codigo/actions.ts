"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { comCaixa, oQueDizer } from "@/lib/codigo-por-email";

/**
 * ════════════════════════════════════════════════════════════════════
 *  MANDAR O CÓDIGO. E dizer a VERDADE sobre o envio.
 *
 *  ═══ POR QUE ISTO NÃO É UMA CHAMADA DIRETA À BIBLIOTECA ═══
 *
 *  O `/two-factor/send-otp` do Better Auth responde `status: true` **mesmo quando o
 *  e-mail não sai** — ele engole o erro do envio e loga. Lido no código, em
 *  plugins/two-factor/otp/index.mjs.
 *
 *  Com o código por e-mail no caminho crítico do login, isso é o pior erro possível: o
 *  Resend cai, a tela diz "mandamos um código", a pessoa espera, olha o spam, espera
 *  mais, e conclui que perdeu a conta. E o app diz que está tudo bem.
 *
 *  É a lei do AGENTS.md: **não traduza falha de comunicação em outra coisa.**
 *
 *  Aqui a ação abre uma caixa (lib/codigo-por-email.ts), chama o Better Auth, e lê o que
 *  o envio de verdade escreveu nela. Se não saiu, a tela diz que não saiu.
 *
 *  ═══ ELA NÃO PERGUNTA QUEM ESTÁ CHAMANDO, E ISSO É DE PROPÓSITO ═══
 *
 *  Quem pede o código está no MEIO do login: a senha já foi conferida, e a sessão ainda
 *  não existe. Não há ator a quem perguntar.
 *
 *  Quem autoriza é o Better Auth, pelo cookie de segundo passo que ele mesmo emitiu — e
 *  é ele quem sabe de quem é. Sem esse cookie, `sendTwoFactorOTP` recusa.
 * ════════════════════════════════════════════════════════════════════
 */
export async function mandarCodigo(): Promise<{ ok: boolean; erro: string | null }> {
  const cabecalhos = await headers();

  const { envio } = await comCaixa(async () => {
    try {
      return await auth.api.sendTwoFactorOTP({ headers: cabecalhos });
    } catch {
      // Sem o cookie do segundo passo, não há a quem mandar. A tela pede para entrar de novo.
      return null;
    }
  });

  if (envio === null) {
    return {
      ok: false,
      erro: "A sua tentativa de entrar expirou. Volte e digite a senha de novo.",
    };
  }

  const erro = oQueDizer(envio);
  return { ok: erro === null, erro };
}

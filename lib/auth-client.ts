"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

/**
 * The browser half of auth. It holds no secret: every credential stays on the
 * server, and the session lives in an httpOnly cookie the client cannot read.
 */
export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      /**
       * Quem tem 2FA ligado não entra direto: o Better Auth devolve `twoFactorRedirect` e
       * o navegador vai para a tela do código.
       *
       * A sessão só nasce DEPOIS do segundo fator. Não existe meia-sessão, e não existe
       * "entrou mas ainda não confirmou": ou a pessoa passou pelos dois fatores, ou ela
       * não está dentro.
       */
      onTwoFactorRedirect() {
        window.location.href = "/entrar/codigo";
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, twoFactor } = authClient;

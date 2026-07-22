"use client";

import { useEffect } from "react";

/**
 * A TELA DE QUANDO O NOSSO LADO QUEBRA.
 *
 * Ela não existia, e a ausência tinha um preço específico: num app inteiro em
 * português, a única frase que o leitor via quando uma consulta falhava era a
 * tela padrão do framework, em inglês. A pessoa que nunca viu um erro de
 * servidor na vida lia aquilo como "o site acabou". Auditoria de 2026-07-22.
 *
 * A voz da casa vale dobrado aqui: o erro é NOSSO, e a frase diz isso. Nada de
 * código de erro na cara de quem lê, nada de "algo deu errado" sem dono.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // O erro vai para o log do servidor pelo próprio framework; aqui é só o console
    // de quem estiver com a aba aberta e souber o que procurar.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center px-6 pb-32 sm:px-10">
      <h1 className="voice text-[32px] leading-snug sm:text-[40px]">
        Isso quebrou do nosso lado.
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
        Não foi você, e a sua estante está inteira. Tente de novo: na maioria das vezes,
        já volta.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-canvas)]"
      >
        Tentar de novo
      </button>
    </main>
  );
}

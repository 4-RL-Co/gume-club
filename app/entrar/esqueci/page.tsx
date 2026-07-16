"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

/**
 * ESQUECI A SENHA. A porta que faltava.
 *
 * Sem ela, quem esquecia a senha ficava trancado para sempre — não havia segunda porta.
 * Aqui a pessoa põe o e-mail e recebe um link (via Resend) para criar uma senha nova.
 *
 * A tela NUNCA diz se o e-mail existe. "Se a conta existe, o link foi enviado" é a mesma
 * resposta para todo mundo — senão esta página vira um detector de quem tem conta aqui.
 */
export default function Esqueci() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  const submit = (data: FormData) =>
    start(async () => {
      setError(null);
      const email = String(data.get("email") ?? "").trim();
      const res = await authClient.requestPasswordReset({
        email,
        redirectTo: "/entrar/redefinir",
      });
      // Mesmo num erro que não seja de rede, a gente não conta se o e-mail existe.
      if (res.error && res.error.status && res.error.status >= 500) {
        setError("Não deu para enviar agora. Tente de novo em um instante.");
        return;
      }
      setSent(true);
    });

  return (
    <main className="mx-auto max-w-sm px-6 pb-32">
      <h1 className="voice mt-16 text-3xl leading-tight">Recuperar senha</h1>

      {sent ? (
        <p className="mt-6 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Se existe uma conta com esse e-mail, mandamos um link para você criar uma senha
          nova. Ele vale por uma hora. Confira a caixa de entrada (e o spam, por via das
          dúvidas).
        </p>
      ) : (
        <>
          <p className="mt-2 text-[14px] text-[var(--color-ink-soft)]">
            Põe o seu e-mail e a gente manda um link para você criar uma senha nova.
          </p>

          <form action={submit} className="mt-8 flex flex-col gap-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                e-mail
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2.5 text-[15px] outline-none focus:border-[var(--color-ink)]"
              />
            </label>

            {error && <p className="text-[13px] text-[var(--color-perigo)]">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
            >
              {pending ? "Enviando" : "Enviar link"}
            </button>
          </form>
        </>
      )}

      <Link
        href="/entrar"
        className="mt-8 inline-block text-[13px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
      >
        voltar para entrar
      </Link>
    </main>
  );
}

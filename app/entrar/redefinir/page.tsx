"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * A senha nova, no fim do link que chegou por e-mail.
 *
 * O token vem na URL (`?token=`). Se ele expirou ou já foi usado, o Better Auth recusa e a
 * tela manda pedir outro. `useSearchParams` mora num Suspense de propósito: sem ele, o Next
 * reclama no build.
 */
function Redefinir() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (data: FormData) =>
    start(async () => {
      setError(null);
      const newPassword = String(data.get("password") ?? "");
      if (!token) {
        setError("Link inválido. Peça um novo em 'esqueci a senha'.");
        return;
      }
      const res = await authClient.resetPassword({ newPassword, token });
      if (res.error) {
        setError(
          "Não deu para redefinir. O link pode ter expirado, então peça um novo. " +
            "A senha precisa de doze caracteres ou mais.",
        );
        return;
      }
      router.push("/entrar");
    });

  return (
    <main className="mx-auto max-w-sm px-6 pb-32">
      <h1 className="voice mt-16 text-3xl leading-tight">Nova senha</h1>
      <p className="mt-2 text-[14px] text-[var(--color-ink-soft)]">
        Escolha uma senha nova. Doze caracteres ou mais.
      </p>

      <form action={submit} className="mt-8 flex flex-col gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            nova senha
          </span>
          <input
            name="password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2.5 text-[15px] outline-none focus:border-[var(--color-ink)]"
          />
        </label>

        {error && <p className="text-[13px] text-[var(--color-perigo)]">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pending ? "Salvando" : "Salvar senha nova"}
        </button>
      </form>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Redefinir />
    </Suspense>
  );
}

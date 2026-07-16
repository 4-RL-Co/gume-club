"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Trocar a senha estando logado, com a senha atual na mão. É o par do "esqueci a senha":
 * um serve para quem lembra e quer trocar, o outro para quem não lembra e ficou de fora.
 * O Better Auth exige a senha atual — trocar sem ela seria um sequestro de sessão bastar.
 */
export function TrocarSenha() {
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, start] = useTransition();

  const submit = (data: FormData) =>
    start(async () => {
      setMsg(null);
      const currentPassword = String(data.get("atual") ?? "");
      const newPassword = String(data.get("nova") ?? "");
      const res = await authClient.changePassword({ currentPassword, newPassword });
      if (res.error) {
        setMsg({
          ok: false,
          texto: "Não deu. Confira a senha atual, e a nova precisa de doze caracteres ou mais.",
        });
        return;
      }
      setMsg({ ok: true, texto: "Senha trocada." });
      (document.getElementById("trocar-senha") as HTMLFormElement | null)?.reset();
    });

  return (
    <section className="surface mt-6 p-6">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        trocar senha
      </h2>

      <form id="trocar-senha" action={submit} className="mt-4 flex max-w-sm flex-col gap-3">
        <Campo name="atual" label="senha atual" autoComplete="current-password" />
        <Campo name="nova" label="senha nova" autoComplete="new-password" minLength={12} />

        {msg && (
          <p
            className={`text-[13px] ${
              msg.ok ? "text-[var(--color-ink-soft)]" : "text-[var(--color-perigo)]"
            }`}
          >
            {msg.texto}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 self-start rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2 text-[13px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
        >
          {pending ? "Trocando" : "Trocar senha"}
        </button>
      </form>
    </section>
  );
}

function Campo({
  name,
  label,
  ...rest
}: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {label}
      </span>
      <input
        name={name}
        type="password"
        required
        {...rest}
        className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2.5 text-[15px] outline-none focus:border-[var(--color-ink)]"
      />
    </label>
  );
}

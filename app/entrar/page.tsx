"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signUp } from "@/lib/auth-client";
import { rememberInviter } from "@/app/entrar/invite";

/**
 * Entrar. E-mail e senha, ou Google. Nada mais.
 *
 * Nenhum segredo mora aqui: a senha vai para o servidor, o hash é do Better
 * Auth, e a sessão volta num cookie httpOnly que este código não consegue ler.
 */
export default function Entrar() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");

  // /entrar?convite=<handle>. Stored server-side in a short cookie so it survives
  // the trip to Google and back, and read once when the account is created. A
  // porta saúda quem foi chamado: `rememberInviter` devolve o nome de quem
  // convidou, ou null se o convite for para alguém que não existe.
  const convite = params.get("convite");
  const [quemChamou, setQuemChamou] = useState<string | null>(null);
  useEffect(() => {
    if (!convite) return;
    let vivo = true;
    rememberInviter(convite).then((nome) => {
      if (vivo && nome) {
        setQuemChamou(nome);
        // Quem chega por um convite está criando conta, não entrando numa que já tem.
        setMode("criar");
      }
    });
    return () => {
      vivo = false;
    };
  }, [convite]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (data: FormData) =>
    start(async () => {
      setError(null);
      const email = String(data.get("email") ?? "").trim();
      const password = String(data.get("password") ?? "");
      const name = String(data.get("name") ?? "").trim();

      const res =
        mode === "criar"
          ? await signUp.email({ email, password, name: name || email.split("@")[0]! })
          : await signIn.email({ email, password });

      if (res.error) {
        // A mensagem é deliberadamente vaga: dizer "esse e-mail não existe"
        // entrega quem tem conta aqui para quem só está testando e-mails.
        setError(
          mode === "criar"
            ? "Não deu para criar a conta. A senha precisa de 12 caracteres ou mais."
            : "E-mail ou senha não conferem.",
        );
        return;
      }
      // A new reader lands at the door, never on an empty shelf: /bem-vindo shows
      // who brought them, or hand-picked shelves if they came alone.
      router.push(mode === "criar" ? "/bem-vindo" : "/");
      router.refresh();
    });

  return (
    <main className="mx-auto max-w-sm px-6 pb-32">
      <h1 className="voice mt-16 text-3xl leading-tight">
        {mode === "entrar" ? "Entrar" : "Criar conta"}
      </h1>
      <p className="mt-2 text-[14px] text-[var(--color-ink-soft)]">
        Sua estante. Seus dados. Exportáveis a qualquer hora.
      </p>

      {/* Quem chega por um convite chega porque alguém chamou, e a recomendação de uma
          pessoa é o produto. Diz o nome, e para por aí: sem contagem regressiva, sem
          "seu amigo está esperando", sem pressão nenhuma. */}
      {quemChamou && (
        <p className="mt-6 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-3 text-[15px] leading-relaxed text-[var(--color-ink)]">
          <span className="font-medium">{quemChamou}</span> te chamou pro Gume.
        </p>
      )}

      <form action={submit} className="mt-8 flex flex-col gap-3">
        {mode === "criar" && (
          <Field name="name" label="nome" autoComplete="name" />
        )}
        <Field name="email" label="e-mail" type="email" required autoComplete="email" />
        <Field
          name="password"
          label="senha"
          type="password"
          required
          minLength={12}
          autoComplete={mode === "criar" ? "new-password" : "current-password"}
        />
        {mode === "criar" && (
          <p className="text-[12px] text-[var(--color-ink-faint)]">Doze caracteres ou mais.</p>
        )}

        {error && <p className="text-[13px] text-[var(--color-perigo)]">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pending ? "Um momento" : mode === "entrar" ? "Entrar" : "Criar conta"}
        </button>

        {mode === "entrar" && (
          <Link
            href="/entrar/esqueci"
            className="mt-1 text-center text-[12px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            esqueci a senha
          </Link>
        )}
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--color-rule)]" />
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">ou</span>
        <span className="h-px flex-1 bg-[var(--color-rule)]" />
      </div>

      {/* ═══ O BOTÃO DO GITHUB SAIU DAQUI ═══

          Ele estava na tela e NÃO ABRIA: o log dizia, a cada carga, "Social provider
          github is missing clientId or clientSecret". A pessoa clicava, nada acontecia, e
          ela concluía que o app estava quebrado antes de ter uma conta.

          Uma porta que aparece e não funciona é pior do que porta nenhuma.

          E "entrar com GitHub" num app de LEITURA confunde leitor: o público do Gume não
          sabe o que é GitHub, e não deveria precisar saber. O GitHub volta um dia, e como
          VÍNCULO de conta (a insígnia de Construtor precisa do handle), e não como porta
          de entrada. Ver lib/auth.ts e ai/DECISIONS.md. */}
      <button
        onClick={() => signIn.social({ provider: "google", callbackURL: "/bem-vindo" })}
        className="flex w-full items-center justify-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)]"
      >
        {/* A marca do Google, nas cores dela. É a ÚNICA marca de terceiro que o app
            desenha, e ela tem que ser reconhecível: um "G" cinza não é o Google, e um
            botão de login que a pessoa não reconhece é um botão que ela não aperta. */}
        <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
          <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.3z" />
          <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.2 15.4 46 24 46z" />
          <path fill="#FBBC05" d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.5C2.9 17.1 2 20.4 2 24s.9 6.9 2.5 10l7.3-5.7z" />
          <path fill="#EA4335" d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.4 2 8.1 6.8 4.5 14l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
        </svg>
        Entrar com o Google
      </button>

      <button
        onClick={() => {
          setMode(mode === "entrar" ? "criar" : "entrar");
          setError(null);
        }}
        className="mt-8 text-[13px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
      >
        {mode === "entrar" ? "Não tenho conta ainda." : "Já tenho conta."}
      </button>
    </main>
  );
}

function Field({
  name, label, ...rest
}: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {label}
      </span>
      <input
        name={name}
        {...rest}
        className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2.5 text-[15px] outline-none focus:border-[var(--color-ink)]"
      />
    </label>
  );
}

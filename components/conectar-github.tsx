"use client";

import { useState, useTransition } from "react";
import { Code } from "lucide-react";
import { linkSocial } from "@/lib/auth-client";

/**
 * ════════════════════════════════════════════════════════════════════
 *  CONECTAR O GITHUB. É identidade, e nunca uma porta de entrada.
 *
 *  A insígnia de Construtor não é autodeclarada: ela se calcula cruzando a conta
 *  do GitHub LIGADA por OAuth com quem tem PR mesclado no repositório. Sem esta
 *  tela, o cruzamento era impossível, e a insígnia não tinha como existir para
 *  ninguém — nem para quem escreveu o app inteiro.
 *
 *  ═══ O QUE ESTE BOTÃO NÃO FAZ ═══
 *
 *  Ele não cria conta e não faz login. O GitHub entra desligado do cadastro de
 *  propósito (ele pode entregar e-mail não verificado, que é vetor de tomada de
 *  conta), e o servidor recusa qualquer tentativa de cadastro por ele. Ver as duas
 *  travas em lib/auth.ts.
 *
 *  Se as credenciais do GitHub não estiverem no ambiente, esta seção nem aparece:
 *  uma porta que aparece e não abre é pior do que porta nenhuma, e foi exatamente
 *  isso que tirou o GitHub daqui da primeira vez.
 * ════════════════════════════════════════════════════════════════════
 */
export function ConectarGithub({ ligado }: { ligado: string | null }) {
  const [pendente, começar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <section className="surface mt-6 p-6">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        seu código
      </h2>

      {ligado ? (
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Conectado como{" "}
          <span className="font-medium text-[var(--color-ink)]">{ligado}</span>. Se você tem
          trabalho seu dentro do Gume, a insígnia de construtor aparece sozinha.
        </p>
      ) : (
        <>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            Conecte a sua conta para o Gume reconhecer o que você construiu aqui dentro. Ele
            não vira jeito de entrar: serve só para saber que o código é seu.
          </p>

          <button
            onClick={() =>
              começar(async () => {
                setErro(null);
                const r = await linkSocial({ provider: "github", callbackURL: "/perfil" });
                if (r?.error) setErro("Não deu para conectar agora. Tente de novo daqui a pouco.");
              })
            }
            disabled={pendente}
            className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)] disabled:opacity-40"
          >
            <Code size={16} strokeWidth={1.5} aria-hidden />
            {pendente ? "Um momento" : "Conectar"}
          </button>

          {erro && <p className="mt-3 text-[13px] text-[var(--color-perigo)]">{erro}</p>}
        </>
      )}
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { linkSocial } from "@/lib/auth-client";

/**
 * A marca do GitHub, em path. O botão dizia "Conectar" com um ícone genérico de
 * código, e a palavra GitHub não aparecia EM LUGAR NENHUM da tela: quem lia não
 * sabia qual conta ia conectar. O logo que a pessoa já conhece diz mais rápido
 * que qualquer frase.
 */
function MarcaGithub({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

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
      <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        <MarcaGithub size={14} />
        seu código no GitHub
      </h2>

      {ligado ? (
        // O que o vínculo guarda é o ID NUMÉRICO do GitHub (é por ele que a insígnia
        // cruza com quem tem trabalho aceito), e número de conta não é nome: dizer
        // "conectado como 132447326" pareceria um erro. Então a tela diz o estado, e só.
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          <span className="font-medium text-[var(--color-ink)]">Conectado.</span> Se você tem
          trabalho seu dentro do Gume, a insígnia de construtor aparece sozinha.
        </p>
      ) : (
        <>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            Conecte a sua conta do GitHub para o Gume reconhecer o que você construiu aqui
            dentro. Ela não vira jeito de entrar: serve só para saber que o código é seu.
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
            <MarcaGithub />
            {pendente ? "Um momento" : "Conectar o GitHub"}
          </button>

          {erro && <p className="mt-3 text-[13px] text-[var(--color-perigo)]">{erro}</p>}
        </>
      )}
    </section>
  );
}

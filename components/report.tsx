"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { denunciar } from "@/app/moderacao/actions";
import { Campo } from "@/components/campo";
import { LIMITS } from "@/lib/limits";
import { toast } from "@/lib/toast";

/**
 * Denunciar um perfil. Um botão, um e-mail, e mais nada.
 *
 * Discreto de propósito: um botão de denúncia grande e vermelho é um convite para
 * denunciar por discordar, e a maior parte do trabalho de moderação de um app pequeno
 * é ler denúncia que não era denúncia.
 *
 * Sem fila, sem painel, sem número de protocolo. A caixa de entrada de quem modera É
 * o painel, e ela é o painel de propósito: uma denúncia que ninguém lê é pior que uma
 * que não existe, porque promete e não entrega.
 */
export function Report({ handle }: { handle: string }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [pendente, comecar] = useTransition();

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
      >
        <Flag size={14} strokeWidth={1.5} />
        denunciar
      </button>
    );
  }

  return (
    <div className="surface w-full max-w-lg p-5">
      <p className="text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
        O que está acontecendo com <span className="text-[var(--color-ink)]">@{handle}</span>? Isso
        chega direto em quem cuida do Gume.
      </p>

      {/* Uma denúncia escrita com cuidado é longa, e o servidor a cortava em 280
          caracteres sem avisar: quem explicasse direito o que aconteceu tinha a
          explicação decepada, e quem modera lia metade de uma frase. */}
      <div className="mt-4">
        <Campo
          autoFocus
          valor={motivo}
          aoMudar={setMotivo}
          teto={LIMITS.note}
          linhas={3}
          className="w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-3 text-[15px] leading-relaxed outline-none focus:border-[var(--color-ink)]"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <button
          disabled={pendente || motivo.trim().length === 0}
          onClick={() =>
            comecar(async () => {
              try {
                await denunciar(handle, motivo);
                toast("Recebido. Uma pessoa vai ler.");
                setAberto(false);
                setMotivo("");
              } catch {
                toast("Não deu para enviar agora.");
              }
            })
          }
          className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pendente ? "enviando" : "Enviar"}
        </button>

        <button
          onClick={() => setAberto(false)}
          className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          deixa
        </button>
      </div>
    </div>
  );
}

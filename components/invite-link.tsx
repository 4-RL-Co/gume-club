"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";

/**
 * Your invite link. Everyone has one, it never runs out, and there is no waiting
 * list. Scarcity of invitations is marketing pretending to be exclusivity.
 *
 * There is no counter here, and there will not be one: "you have invited 3 people"
 * turns bringing a friend into a task with a score attached. See ai/DECISIONS.md.
 *
 * ═══ COMPARTILHAR PELO SISTEMA, QUANDO DÁ ═══
 *
 * No celular, a diferença entre mandar o link no WhatsApp e desistir é um toque. A Web
 * Share API abre a folha de compartilhar do próprio aparelho, com o WhatsApp lá dentro.
 * Ela não existe em todo navegador (desktop, em geral, não tem), então o botão só
 * aparece quando o navegador sabe compartilhar. Copiar funciona em todo lugar e fica.
 */
export function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [podeCompartilhar, setPodeCompartilhar] = useState(false);

  // navigator.share só existe no cliente, e só em alguns navegadores. Decidimos DEPOIS
  // de montar, para o servidor e o cliente renderizarem a mesma coisa na primeira volta.
  useEffect(() => {
    setPodeCompartilhar(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const compartilhar = () => {
    navigator
      .share({ title: "Gume", text: "Vem pro Gume comigo.", url })
      .catch(() => {
        // A pessoa fechou a folha de compartilhar, ou o navegador recusou. Não é erro:
        // não faz nada, e o botão de copiar continua ali.
      });
  };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <code className="min-w-0 flex-1 truncate rounded-[var(--radius-control)] border border-[var(--color-rule)] px-3 py-2 text-[13px] text-[var(--color-ink-soft)]">
        {url}
      </code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
        className="shrink-0 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)]"
      >
        {copied ? "copiado" : "copiar"}
      </button>
      {podeCompartilhar && (
        <button
          onClick={compartilhar}
          aria-label="compartilhar"
          className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2 text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)]"
        >
          <Share2 size={15} strokeWidth={1.5} aria-hidden />
          compartilhar
        </button>
      )}
    </div>
  );
}

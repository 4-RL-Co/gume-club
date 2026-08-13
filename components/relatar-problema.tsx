"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Flag, X } from "lucide-react";
import { relatarProblemaAction } from "@/app/relatar/actions";
import { LIMITS } from "@/lib/limits";
import { toast } from "@/lib/toast";

/**
 * ════════════════════════════════════════════════════════════════════
 *  RELATAR UM PROBLEMA. Um botão pequeno, em toda tela, sem precisar de conta.
 *
 *  "Denunciar" (components/report.tsx) é sobre uma PESSOA, e mora só no
 *  perfil dela — exige estar logado, porque faz sentido dizer QUEM está
 *  denunciando. Um bug no app é outra coisa: quem topa com um erro pode
 *  nem ter conta ainda, e é bem capaz de ser justo essa a razão de não
 *  conseguir criar uma. Ver lib/relatar.ts (o limite é por IP, não por
 *  usuário).
 *
 *  ═══ CANTO ESQUERDO, DE PROPÓSITO ═══
 *
 *  components/voltar-ao-topo.tsx já mora no canto direito (some/aparece
 *  com a rolagem). Este fica no canto oposto, e sempre visível — os dois
 *  nunca disputam o mesmo lugar.
 *
 *  ═══ A MESMA ANIMAÇÃO DO DIÁLOGO DE LISTA ═══
 *
 *  Escala a partir de 0.96 com leve overshoot, cross-fade — a régua que
 *  docs/design.md documenta e components/dialogo-lista.tsx foi o primeiro a
 *  cumprir. O cartão fica sempre montado (visibilidade via opacity+scale,
 *  não `{aberto && ...}`) pra transição rodar de verdade.
 * ════════════════════════════════════════════════════════════════════
 */
export function RelatarProblema() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const campoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const t = setTimeout(() => campoRef.current?.focus(), 200);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("keydown", onKey);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = antes;
    };
  }, [aberto]);

  const enviar = () => {
    setErro(null);
    start(async () => {
      const { erro } = await relatarProblemaAction(mensagem, pathname);
      if (erro) { setErro(erro); return; }
      toast("Recebido. Uma pessoa vai ler.");
      setAberto(false);
      setMensagem("");
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="relatar um problema"
        title="relatar um problema"
        className="surface fixed bottom-24 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-ink-faint)] shadow-lg transition-colors hover:text-[var(--color-ink)] sm:bottom-6 sm:left-6"
      >
        <Flag size={16} strokeWidth={1.5} aria-hidden />
      </button>

      <div
        aria-hidden={!aberto}
        onClick={() => setAberto(false)}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        style={{
          opacity: aberto ? 1 : 0,
          pointerEvents: aberto ? "auto" : "none",
          transition: "opacity 200ms var(--ease-spring)",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="relatar um problema"
          onClick={(e) => e.stopPropagation()}
          className="surface w-full max-w-md p-6"
          style={{
            transform: aberto ? "scale(1)" : "scale(0.96)",
            opacity: aberto ? 1 : 0,
            transition: "transform 200ms var(--ease-spring), opacity 200ms var(--ease-spring)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="voice text-[22px] leading-snug">relatar um problema</h2>
            <button type="button" onClick={() => setAberto(false)} aria-label="fechar" className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
            Conta o que aconteceu. Isso chega direto em quem cuida do Gume (não é uma
            fila, é a caixa de entrada dela mesma). Se quiser resposta, deixe um jeito
            de te achar.
          </p>

          <textarea
            ref={campoRef}
            value={mensagem}
            maxLength={LIMITS.note}
            onChange={(e) => setMensagem(e.target.value)}
            rows={4}
            disabled={pending}
            placeholder="o que deu errado, e onde"
            className="mt-4 w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
          />

          {erro && <p className="mt-2 text-[13px] text-[var(--color-perigo)]">{erro}</p>}

          <button
            type="button"
            disabled={pending || mensagem.trim().length === 0}
            onClick={enviar}
            className="mt-4 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-canvas)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "enviando…" : "enviar"}
          </button>
        </div>
      </div>
    </>
  );
}

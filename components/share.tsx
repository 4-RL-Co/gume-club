"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { toast } from "@/lib/toast";

/**
 * ════════════════════════════════════════════════════════════════════
 *  COMPARTILHAR. É o único canal de crescimento que este app tem.
 *
 *  O Gume não tem anúncio, não tem feed algorítmico e não tem convite
 *  em escassez. O modelo de crescimento é literalmente "um amigo mostra
 *  a estante para o outro", e até hoje não existia um botão para isso:
 *  a pessoa tinha que copiar a URL da barra do navegador, no celular,
 *  que é onde ela está.
 *
 *  ═══ DOIS CAMINHOS, E O NAVEGADOR ESCOLHE ═══
 *
 *  No celular, a folha nativa de compartilhamento (`navigator.share`):
 *  ela abre o WhatsApp, que é onde as pessoas de verdade mandam links
 *  de verdade. No desktop, copiar, porque lá a folha nativa não existe
 *  ou é constrangedora.
 *
 *  A escolha é do NAVEGADOR, e não do nosso palpite sobre a largura da
 *  tela: um tablet com teclado tem `navigator.share` e uma janela larga,
 *  e adivinhar pelo tamanho erraria nele.
 *
 *  Cancelar não é erro. Quem abre a folha e desiste não pode ver uma
 *  mensagem vermelha: a pessoa fez exatamente o que queria fazer.
 * ════════════════════════════════════════════════════════════════════
 */
export function Share({
  titulo,
  texto,
  className = "",
}: {
  /** O que aparece na folha nativa. "A estante de Rui", "Dom Casmurro". */
  titulo: string;
  /** Uma linha de contexto. Opcional: a folha nativa nem sempre mostra. */
  texto?: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    // A URL é lida na HORA, e nunca passada por prop: renderizar o link no
    // servidor exigiria saber o domínio, e o domínio muda entre localhost, a
    // instância hospedada e a de quem rodar a própria cópia do Gume.
    const url = window.location.href;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url });
      } catch {
        // A pessoa abriu a folha e desistiu. Isso não é um erro, e não merece
        // uma mensagem: ela fez o que queria.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast("Link copiado. Agora é só colar.");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast("Não deu para copiar. O link está na barra de endereço.");
    }
  }

  return (
    <button
      onClick={compartilhar}
      aria-label={`compartilhar ${titulo}`}
      className={`flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)] ${className}`}
    >
      {copiado ? <Check size={15} strokeWidth={1.5} /> : <Share2 size={15} strokeWidth={1.5} />}
      {copiado ? "copiado" : "compartilhar"}
    </button>
  );
}

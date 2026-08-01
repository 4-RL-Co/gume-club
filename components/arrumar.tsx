"use client";

import { useState } from "react";
import { ImagePlus, Pencil } from "lucide-react";

/**
 * O LÁPIS da ficha. "Arrumar este livro" era uma gaveta com título e resumo no
 * porão da página; virou um lápis discreto no canto do cartão de informações,
 * que é onde o erro aparece para quem o vê. Um toque abre o formulário de
 * correção e o histórico, ali mesmo.
 */
/**
 * ════════════════════════════════════════════════════════════════════
 *  ═══ QUANDO FALTA A CAPA, O CONVITE FICA VISÍVEL ═══
 *
 *  A dica do lápis já dizia "faltou capa, ou tem algum dado errado? você mesmo
 *  ajeita" — dentro de um `title`, que **não existe no celular** e que ninguém lê no
 *  computador. O convite estava escrito num lugar onde ele não é lido.
 *
 *  E o buraco é grande: 231 livros em estante de alguém não têm capa em fonte pública
 *  nenhuma. Foram tentados o ISBN nas duas bases e a busca por título e autor; são
 *  edições brasileiras pequenas que o Google e a Open Library não cobrem. **Não existe
 *  API que resolva** — existe gente com o livro na mão.
 *
 *  Quem abre a página de um livro sem capa costuma ser exatamente quem o tem. O
 *  formulário para consertar já existia, atrás do lápis; o que faltava era pedir.
 *
 *  O convite só aparece quando falta capa: um pedido permanente em toda página vira
 *  ruído, e ruído é o que faz a pessoa parar de ler os avisos do app.
 * ════════════════════════════════════════════════════════════════════
 */
export function Arrumar({
  children,
  semCapa = false,
}: {
  children: React.ReactNode;
  /** Este livro não tem capa em edição nenhuma: vale pedir, em vez de só oferecer. */
  semCapa?: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-label="arrumar este livro"
        title="faltou capa, ou tem algum dado errado? você mesmo ajeita"
        className={[
          "absolute right-5 top-5 rounded-full p-2 transition-colors",
          aberto
            ? "text-[var(--color-ink)]"
            : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
        ].join(" ")}
      >
        <Pencil size={15} strokeWidth={1.5} aria-hidden />
      </button>
      {semCapa && !aberto && (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="mt-6 flex w-full items-center gap-3 rounded-[var(--radius-2)] border border-dashed border-[var(--color-rule)] px-4 py-3 text-left transition-colors hover:border-[var(--color-ink)]"
        >
          <ImagePlus size={16} strokeWidth={1.5} aria-hidden className="shrink-0 text-[var(--color-ink-faint)]" />
          <span className="text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
            Este livro está sem capa. Se você tem ele na mão, pode mandar uma foto: ela
            fica para todo mundo que chegar depois.
          </span>
        </button>
      )}
      {aberto && <div className="mt-8 border-t border-[var(--color-rule)] pt-6">{children}</div>}
    </>
  );
}

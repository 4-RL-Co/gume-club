"use client";

import { useState, useTransition } from "react";
import { BookMarked, Package } from "lucide-react";
import { marcar } from "@/app/livro/[slug]/colecao-actions";
import type { Posse } from "@/lib/copies";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "TENHO ESTE LIVRO." Uma pergunta que a estante nunca fez.
 *
 *  ═══ POR QUE ISTO NÃO É UM ESTADO DA PRATELEIRA ═══
 *
 *  A prateleira responde "o que eu li": esperando, lendo, lido, abandonado. Todos são
 *  momentos de uma LEITURA.
 *
 *  Ter é outra pergunta, e as respostas se cruzam: dá para ter lido sem ter o livro
 *  (emprestado, biblioteca, vendido depois) e para ter sem nunca abrir. Quem coleciona
 *  vive na segunda, e o app a empurrava para "esperando" — que é uma INTENÇÃO DE LER
 *  que a pessoa nunca teve.
 *
 *  Por isso os dois botões ficam num cartão SEPARADO do painel de leitura, e não como
 *  mais um estado ao lado de "lido". Juntos, eles ensinariam que ter é um jeito de ler.
 *
 *  ═══ E "QUERO TER" NÃO É "QUERO LER" ═══
 *
 *  A prateleira já tem "esperando", que é querer ler. Este é o desejo pelo OBJETO: a
 *  edição bonita de um livro que você já leu em pdf, o volume que falta na coleção.
 *  São desejos diferentes, e um colecionador sabe disso melhor que ninguém.
 * ════════════════════════════════════════════════════════════════════
 */
export function Tenho({
  slug, workId, editionId, posse,
}: {
  slug: string;
  workId: string;
  editionId: string | null;
  posse: Posse;
}) {
  const [atual, setAtual] = useState<Posse>(posse);
  const [pending, start] = useTransition();

  /** Clicar no que já está marcado DESMARCA: é como a pessoa diz "não tenho mais". */
  const alternar = (qual: Exclude<Posse, null>) =>
    start(async () => {
      const novo = atual === qual ? null : qual;
      await marcar(slug, workId, editionId, novo);
      setAtual(novo);
    });

  const botao = (qual: Exclude<Posse, null>, Icone: typeof Package, on: string, off: string) => {
    const marcado = atual === qual;
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => alternar(qual)}
        aria-pressed={marcado}
        className={[
          "inline-flex items-center gap-2 rounded-[var(--radius-control)] border px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-40",
          marcado
            ? "border-[var(--color-ink)] text-[var(--color-ink)]"
            : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
        ].join(" ")}
      >
        <Icone size={15} strokeWidth={1.5} fill={marcado ? "currentColor" : "none"} aria-hidden />
        {marcado ? on : off}
      </button>
    );
  };

  return (
    <section className="surface p-6 sm:p-7">
      <h2 className="mb-4 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        na sua coleção
      </h2>
      <div className="flex flex-wrap gap-2">
        {botao("owned", Package, "você tem", "tenho")}
        {botao("wanted", BookMarked, "você quer", "quero ter")}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
        Ter não é ler: isto vale para o exemplar, e não muda a sua prateleira.
      </p>
    </section>
  );
}

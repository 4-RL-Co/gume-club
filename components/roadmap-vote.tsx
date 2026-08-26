"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowBigUp } from "lucide-react";
import { votarAction, tirarVotoAction } from "@/app/o-que-vem/actions";
import { toast } from "@/lib/toast";

/**
 * O botão de voto de "o que vem por aí" — mesma forma otimista de
 * components/upvote-lista.tsx, adaptado pro teto de 3 por ano: aqui a recusa do
 * servidor é uma FRASE de verdade (que fala com leitor), não um silêncio, porque "por
 * que não deixou?" tem uma resposta concreta (o teto, o item já saiu do ar).
 */
export function RoadmapVote({
  itemId, votei: votei0, votos: votos0, podeVotar,
}: {
  itemId: string;
  votei: boolean;
  votos: number;
  /** false para visitante sem sessão: o botão vira convite pra entrar. */
  podeVotar: boolean;
}) {
  const [votei, setVotei] = useState(votei0);
  const [votos, setVotos] = useState(votos0);
  const [pending, start] = useTransition();

  const votar = () => {
    const antes = { votei, votos };
    setVotei(!votei);
    setVotos((v) => v + (votei ? -1 : 1));
    start(async () => {
      if (antes.votei) {
        await tirarVotoAction(itemId);
        return;
      }
      const res = await votarAction(itemId);
      if (!res.ok) {
        setVotei(antes.votei);
        setVotos(antes.votos);
        toast(res.erro);
      }
    });
  };

  if (!podeVotar) {
    return (
      <Link
        href="/entrar"
        className="pill flex items-center gap-1.5 border border-[var(--color-rule)] px-3 py-1.5 text-[13px] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
      >
        <ArrowBigUp size={14} strokeWidth={1.75} aria-hidden />
        {votos > 0 && <span className="tabular">{votos}</span>}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={votei}
      onClick={votar}
      className={[
        "pill flex items-center gap-1.5 border px-3 py-1.5 text-[13px] disabled:opacity-40",
        votei
          ? "border-[var(--color-colaborar)] text-[var(--color-colaborar)]"
          : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      <ArrowBigUp size={14} strokeWidth={1.75} fill={votei ? "currentColor" : "none"} aria-hidden />
      {votos > 0 && <span className="tabular">{votos}</span>}
    </button>
  );
}

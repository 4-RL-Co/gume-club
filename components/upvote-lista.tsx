"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowBigUp } from "lucide-react";
import { Avatar } from "@/components/avatar";
import {
  upvotarListaAction, tirarUpvoteListaAction, quemVotouListaAction,
} from "@/app/estante/[slug]/actions";
import type { QuemVotou } from "@/lib/upvotes";

/**
 * O upvote de uma lista — mesma forma de components/upvote-resenha.tsx,
 * adaptado pra lista em vez de resenha. "Quero q dê pra dar upvote em
 * resenhas e listas" — o dono. Ver lib/upvotes.ts e a migration 0066.
 *
 * NÃO é o mesmo gesto de "guardar" (components/guardar-estante.tsx): guardar
 * é comprometer, upvote é mais leve. Os dois convivem, um do lado do outro.
 */
export function UpvoteLista({
  slug, collectionId, votei: votei0, upvotes: upvotes0, podeVotar, souDono,
}: {
  slug: string;
  collectionId: string;
  votei: boolean;
  upvotes: number;
  podeVotar: boolean;
  souDono: boolean;
}) {
  const [votei, setVotei] = useState(votei0);
  const [upvotes, setUpvotes] = useState(upvotes0);
  const [pending, start] = useTransition();
  const [aberto, setAberto] = useState(false);
  const [quem, setQuem] = useState<QuemVotou[] | null>(null);

  const votar = () => {
    const antes = { votei, upvotes };
    setVotei(!votei);
    setUpvotes((n) => n + (votei ? -1 : 1));
    start(async () => {
      if (antes.votei) {
        await tirarUpvoteListaAction(slug, collectionId);
        return;
      }
      const res = await upvotarListaAction(slug, collectionId);
      if (!res.ok) {
        setVotei(antes.votei);
        setUpvotes(antes.upvotes);
      }
    });
  };

  const verQuemVotou = () => {
    if (aberto) {
      setAberto(false);
      return;
    }
    setAberto(true);
    if (quem === null) {
      start(async () => setQuem(await quemVotouListaAction(collectionId)));
    }
  };

  if (!podeVotar && !(souDono && upvotes > 0)) return null;

  return (
    <span className="flex flex-wrap items-center gap-2">
      {podeVotar && (
        <button
          type="button"
          disabled={pending}
          aria-pressed={votei}
          onClick={votar}
          className={[
            "pill flex items-center gap-1.5 border px-3 py-1.5 text-[13px] disabled:opacity-40",
            votei
              ? "border-[var(--color-accent)] text-[var(--color-accent)]"
              : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
          ].join(" ")}
        >
          <ArrowBigUp size={14} strokeWidth={1.75} fill={votei ? "currentColor" : "none"} aria-hidden />
          {upvotes > 0 && <span className="tabular">{upvotes}</span>}
        </button>
      )}

      {souDono && upvotes > 0 && (
        <button
          type="button"
          onClick={verQuemVotou}
          className="text-[12px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
        >
          {upvotes} {upvotes === 1 ? "voto" : "votos"} · {aberto ? "esconder" : "quem votou"}
        </button>
      )}

      {aberto && quem && quem.length > 0 && (
        <span className="flex flex-wrap items-center gap-2">
          {quem.map((q) => (
            <Link
              key={q.handle}
              href={`/@${q.handle}`}
              className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              <Avatar src={q.image} name={q.name} handle={q.handle} size={18} />
              {q.name ?? q.handle}
            </Link>
          ))}
        </span>
      )}
    </span>
  );
}

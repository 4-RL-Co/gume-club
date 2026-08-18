"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowBigUp } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { upvotarAction, tirarUpvoteAction, quemVotouResenhaAction } from "@/app/livro/[slug]/actions";
import type { QuemVotou } from "@/lib/upvotes";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O UPVOTE DE UMA RESENHA — o botão, e "quem votou" para o autor.
 *
 *  Nasceu em components/resenhas-do-livro.tsx e veio pra cá quando o perfil
 *  ganhou o mesmo botão na aba "resenhas" — um lugar só, e não duas cópias
 *  que um dia divergem.
 *
 *  ═══ "QUEM VOTOU" É BUSCADO SOB DEMANDA, DIFERENTE DE "QUEM GUARDOU" ═══
 *
 *  components/quem-guardou.tsx recebe os rostos já prontos, porque uma
 *  estante tem UM "quem guardou" na tela. Uma lista de resenhas tem UMA
 *  revelação por resenha — buscar todas de uma vez, para resenhas que
 *  ninguém vai abrir, é trabalho pro banco que a tela não usa. Por isso este
 *  busca só quando o autor clica. A trava é a mesma: `quemUpvotouResenha()`
 *  devolve vazio para quem não é o autor, no SQL — ver lib/upvotes.ts.
 * ════════════════════════════════════════════════════════════════════
 */
export function UpvoteResenha({
  reviewId, slug, votei: votei0, upvotes: upvotes0, podeVotar, souAutor,
}: {
  reviewId: string;
  slug: string;
  votei: boolean;
  upvotes: number;
  /** Só quem está logado vota, e nunca na própria resenha. */
  podeVotar: boolean;
  /** Só o autor vê "quem votou". */
  souAutor: boolean;
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
        await tirarUpvoteAction(slug, reviewId);
        return;
      }
      const res = await upvotarAction(slug, reviewId);
      if (!res.ok) {
        // A resenha sumiu ou deixou de ser visível entre o clique e o servidor
        // responder — o otimista desfaz, calado: não é um erro que a pessoa causou.
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
      start(async () => setQuem(await quemVotouResenhaAction(reviewId)));
    }
  };

  return (
    <span className="flex flex-wrap items-center gap-2">
      {podeVotar ? (
        <button
          type="button"
          disabled={pending}
          aria-pressed={votei}
          onClick={votar}
          className={[
            "flex items-center gap-1 rounded-[var(--radius-control)] border px-2 py-1 text-[12px] disabled:opacity-40",
            votei
              ? "border-[var(--color-accent)] text-[var(--color-accent)]"
              : "border-[var(--color-rule)] text-[var(--color-ink-faint)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
          ].join(" ")}
        >
          <ArrowBigUp size={13} strokeWidth={1.75} fill={votei ? "currentColor" : "none"} aria-hidden />
          {upvotes > 0 && <span className="tabular">{upvotes}</span>}
        </button>
      ) : (
        upvotes > 0 && (
          <span className="flex items-center gap-1 text-[12px] text-[var(--color-ink-faint)]">
            <ArrowBigUp size={13} strokeWidth={1.75} aria-hidden />
            <span className="tabular">{upvotes}</span>
          </span>
        )
      )}

      {souAutor && upvotes > 0 && (
        <button
          type="button"
          onClick={verQuemVotou}
          className="text-[12px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
        >
          {aberto ? "esconder" : "quem votou"}
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

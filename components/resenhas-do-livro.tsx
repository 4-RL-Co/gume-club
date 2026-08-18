"use client";

import { useState, useTransition } from "react";
import { ArrowBigUp } from "lucide-react";
import { AvatarLink } from "@/components/avatar";
import { upvotarAction, tirarUpvoteAction } from "@/app/livro/[slug]/actions";
import type { ResenhaDoLivro } from "@/lib/explore";

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS RESENHAS DESTE LIVRO, de quem não é você.
 *
 *  A sua já está aberta, no editor de "arrumar" — ver lib/explore.ts
 *  (getResenhasDoLivro), que já tira a sua desta lista. Aqui é só o que os
 *  OUTROS escreveram, público ou visível para quem segue.
 *
 *  ═══ POR QUE "LER MAIS" EXPANDE NO LUGAR, E NÃO LINKA PARA OUTRA PÁGINA ═══
 *
 *  No perfil e no Explorar, a resenha cortada linka para a página do livro — é
 *  para lá que a resenha inteira mora. Aqui a gente JÁ ESTÁ na página do
 *  livro: não existe um "lá" para onde mandar o clique. Expandir no lugar é a
 *  única saída que não é um link para a própria tela.
 *
 *  ═══ O UPVOTE, E O QUE ELE NÃO É ═══
 *
 *  Vota na RESENHA, nunca na pessoa que escreveu — não existe placar de
 *  "quem recebe mais votos" em lugar nenhum do app, só o número desta
 *  resenha, aqui. Ver a migration 0064 e lib/upvotes.ts.
 * ════════════════════════════════════════════════════════════════════
 */
export function ResenhasDoLivro({
  resenhas, slug, podeVotar,
}: {
  resenhas: ResenhaDoLivro[];
  slug: string;
  /** Só quem está logado vota. Ver lib/upvotes.ts. */
  podeVotar: boolean;
}) {
  if (resenhas.length === 0) return null;

  return (
    <section className="surface p-6 sm:p-7">
      <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {resenhas.length === 1 ? "1 resenha" : `${resenhas.length} resenhas`}
      </p>

      <ul className="mt-5 flex flex-col gap-6">
        {resenhas.map((r) => (
          <Uma key={r.id} r={r} slug={slug} podeVotar={podeVotar} />
        ))}
      </ul>
    </section>
  );
}

function Uma({ r, slug, podeVotar }: { r: ResenhaDoLivro; slug: string; podeVotar: boolean }) {
  const [aberta, setAberta] = useState(false);
  const [votei, setVotei] = useState(r.votei);
  const [upvotes, setUpvotes] = useState(r.upvotes);
  const [pending, start] = useTransition();

  // Um corte grosseiro, só para decidir se vale a pena oferecer "ler mais": uma
  // resenha de duas frases não precisa do botão, e ele ali seria um convite vazio.
  const longa = r.body.length > 320;

  const votar = () => {
    const antes = { votei, upvotes };
    setVotei(!votei);
    setUpvotes((n) => n + (votei ? -1 : 1));
    start(async () => {
      if (antes.votei) {
        await tirarUpvoteAction(slug, r.id);
        return;
      }
      const res = await upvotarAction(slug, r.id);
      if (!res.ok) {
        // A resenha sumiu ou deixou de ser visível entre o clique e o servidor
        // responder — o otimista desfaz, calado: não é um erro que a pessoa
        // causou.
        setVotei(antes.votei);
        setUpvotes(antes.upvotes);
      }
    });
  };

  return (
    <li className="flex items-start gap-4">
      <AvatarLink src={r.image} name={r.name} handle={r.handle} size={36} />

      <div className="min-w-0 flex-1">
        <p className="text-[13px]">
          <a href={`/@${r.handle}`} className="font-medium text-[var(--color-ink)] hover:underline">
            {r.name ?? r.handle}
          </a>
        </p>

        <p
          className={[
            "voice mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-ink-soft)]",
            aberta || !longa ? "" : "line-clamp-4",
          ].join(" ")}
        >
          {r.body}
        </p>

        {longa && (
          <button
            type="button"
            onClick={() => setAberta((v) => !v)}
            className="mt-1 text-[12px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            {aberta ? "ler menos" : "ler resenha inteira"}
          </button>
        )}

        <div className="mt-2 flex items-center gap-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {new Date(r.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
          </p>

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
        </div>
      </div>
    </li>
  );
}

"use client";

import { useState } from "react";
import { UpvoteResenha } from "@/components/upvote-resenha";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A RESENHA, INTEIRA, DENTRO DO CARD DO FEED.
 *
 *  Antes, "fulano resenhou Dom Casmurro" era só a frase: quem quisesse ler
 *  tinha que sair do feed e caçar a resenha na página do livro. O verbo já
 *  existia (lib/social.ts); o que faltava era mostrar o que ele anuncia.
 *
 *  Mesmo corte de components/resenhas-do-livro.tsx (linha-clamp de quatro
 *  linhas, "ler resenha inteira" só quando vale a pena), sem a âncora de
 *  hash: lá existem várias resenhas na mesma tela e o link precisa saber
 *  qual delas rolar até; aqui o card JÁ É a resenha, não tem para onde rolar.
 * ════════════════════════════════════════════════════════════════════
 */
export function ResenhaNoFeed({
  reviewId, workSlug, body, upvotes, votei,
}: {
  reviewId: string;
  workSlug: string;
  body: string;
  upvotes: number;
  votei: boolean;
}) {
  const [aberta, setAberta] = useState(false);

  // Mesmo corte grosseiro de resenhas-do-livro.tsx: duas frases não precisam do botão.
  const longa = body.length > 320;

  return (
    <div className="mt-2">
      <p
        className={[
          "voice whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-ink)]",
          aberta || !longa ? "" : "line-clamp-4",
        ].join(" ")}
      >
        {body}
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

      <div className="mt-2">
        {/* Quem chega aqui está logado (o feed inteiro exige sessão), e nunca é o
            autor: o feed nunca mostra a própria atividade de volta para você. */}
        <UpvoteResenha
          reviewId={reviewId}
          slug={workSlug}
          votei={votei}
          upvotes={upvotes}
          podeVotar
          souAutor={false}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AvatarLink } from "@/components/avatar";
import { UpvoteResenha } from "@/components/upvote-resenha";
import type { ResenhaDoLivro } from "@/lib/explore";

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS RESENHAS DESTE LIVRO, de quem não é você.
 *
 *  A sua já está aberta, no editor de "arrumar" — ver lib/explore.ts
 *  (getResenhasDoLivro), que já tira a sua desta lista. Aqui é só o que os
 *  OUTROS escreveram, público ou visível para quem segue.
 *
 *  E por isso "quem votou" (components/upvote-resenha.tsx) nunca aparece
 *  aqui: essa revelação é só para o AUTOR, e o autor nunca vê a própria
 *  resenha nesta lista. Ela mora na aba "resenhas" do perfil dele.
 *
 *  ═══ POR QUE "LER MAIS" EXPANDE NO LUGAR, E NÃO LINKA PARA OUTRA PÁGINA ═══
 *
 *  No perfil e no Explorar, a resenha cortada linka para a página do livro — é
 *  para lá que a resenha inteira mora. Aqui a gente JÁ ESTÁ na página do
 *  livro: não existe um "lá" para onde mandar o clique. Expandir no lugar é a
 *  única saída que não é um link para a própria tela.
 *
 *  ═══ E O LINK NÃO PODE LARGAR VOCÊ NUM MEIO DE UMA PILHA ═══
 *
 *  "quando eu clico pra ler a resenha inteira ele vai la pra pagina do livro,
 *  e se tiverem um monte de resenhas la eu perco a q eu fui ver?" — o dono.
 *  O link (components/explore.tsx, components/perfil-abas.tsx) chega com
 *  `#resenha-<id>` na URL; cada `<li>` tem esse mesmo `id`, e o navegador
 *  rola até ela sozinho. A que é alvo do link também abre inteira sem
 *  precisar de um segundo clique em "ler resenha inteira" — chegar cortada
 *  de novo, depois de ter clicado exatamente para ler inteira, seria a mesma
 *  pergunta duas vezes — e ganha um contorno para o olho achar rápido qual
 *  das N é a certa.
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

  // Um corte grosseiro, só para decidir se vale a pena oferecer "ler mais": uma
  // resenha de duas frases não precisa do botão, e ele ali seria um convite vazio.
  const longa = r.body.length > 320;

  const ancora = `resenha-${r.id}`;

  // Só depois de montar: no servidor não existe `location.hash`, e ler o hash
  // no primeiro render faria o HTML do servidor e o do cliente discordarem
  // (o React acusaria isso como erro de hidratação). A resenha alvo abre
  // inteira sozinha — chegar cortada de novo, tendo acabado de clicar
  // exatamente para ler inteira, seria a mesma pergunta duas vezes.
  const [alvo, setAlvo] = useState(false);
  useEffect(() => {
    if (window.location.hash === `#${ancora}`) {
      setAlvo(true);
      setAberta(true);
    }
  }, [ancora]);

  return (
    <li
      id={ancora}
      className={[
        "flex scroll-mt-6 items-start gap-4",
        alvo && "-m-3 rounded-[var(--radius-2)] border border-[var(--color-accent)] p-3",
      ].filter(Boolean).join(" ")}
    >
      <AvatarLink src={r.image} name={r.name} handle={r.handle} size={40} />

      <div className="min-w-0 flex-1">
        {/* "as fontes... são muito pequenas" — o dono. Era 13px, e essa é a
            única linha da resenha que carrega um NOME de gente. */}
        <p className="text-[14px]">
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

          <UpvoteResenha
            reviewId={r.id}
            slug={slug}
            votei={r.votei}
            upvotes={r.upvotes}
            podeVotar={podeVotar}
            souAutor={false}
          />
        </div>
      </div>
    </li>
  );
}

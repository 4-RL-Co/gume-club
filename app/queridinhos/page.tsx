import Link from "next/link";
import Image from "next/image";
import { Crown, BookOpenCheck, Bookmark, Heart } from "lucide-react";
import { DOURADO } from "@/lib/dourado";
import { Cover } from "@/components/cover";
import { Empty } from "@/components/empty";
import { getViewer } from "@/lib/viewer";
import { getQueridinhos } from "@/lib/queridinhos";
import { origemAceita } from "@/lib/imagens";
import { jaGuardei } from "@/lib/curadoria-guardada";
import { GuardarCuradoria } from "@/components/guardar-curadoria";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  /queridinhos: o top 100 da comunidade, montado por ela mesma.
 *
 *  Uma lista curada pelo Gume no sentido exato: ninguém escolhe, os vereditos
 *  escolhem. É ranking de LIVRO (curadoria, gosto), nunca de gente (placar,
 *  esforço): ver lib/queridinhos.ts, onde a fronteira está escrita.
 *
 *  A página é pública como o catálogo é público: é a vitrine da livraria,
 *  dizendo o que a casa mais ama.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function Queridinhos() {
  // Resolve quem olha por costume da casa (toda superfície resolve o ator), ainda
  // que a lista seja a mesma para todo mundo: ela só carrega o que é público.
  // E agora ele serve para uma coisa a mais: saber se ESTA pessoa já guardou a lista.
  const viewer = await getViewer();
  const guardada = await jaGuardei(viewer, "queridinhos");

  const livros = await getQueridinhos(100);

  return (
    <main className="relative mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      {/* A aura do 1º colocado banha o topo: a lista editorial abre com a cara do
          livro que a comunidade mais ama hoje. Ver .aura-capa em globals.css. */}
      {livros[0]?.coverUrl && origemAceita(livros[0].coverUrl) && (
        <div className="aura-capa" aria-hidden>
          <Image src={livros[0].coverUrl} alt="" fill sizes="128px" quality={30} className="object-cover" />
        </div>
      )}

      {/* ═══ O CABEÇALHO EDITORIAL ═══

          É a lista da CASA, e abre como capa de revista: a coroa dourada (exceção de
          cor dirigida pelo dono, ver ai/DECISIONS.md), o título grande na serifa da
          voz, e a regra da lista dita em uma frase. */}
      <header className="mt-16 sm:mt-24">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em]" style={{ color: DOURADO }}>
          <Crown size={14} strokeWidth={1.75} aria-hidden />
          a curadoria do Gume
        </p>
        <h1 className="voice mt-3 max-w-3xl text-[40px] leading-[1.04] tracking-[-0.015em] sm:text-[52px]">
          Top 100: os queridinhos do Gume
        </h1>
        {/* GUARDAR, o mesmo gesto de guardar a estante de alguém. Só para quem entrou:
            guardar é uma coisa que pertence a uma conta, e oferecer o botão a quem não
            entrou seria um convite que termina numa tela de login. */}
        {viewer && (
          <div className="mt-6">
            <GuardarCuradoria chave="queridinhos" guardada={guardada} />
          </div>
        )}

        <p className="voice mt-5 max-w-2xl text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
          Os livros que a comunidade mais amou, na ordem do amor recebido. Ninguém edita esta
          lista: cada &quot;gostei&quot; e cada &quot;adorei&quot; conta um voto, e ela se refaz
          a cada visita.
        </p>
      </header>

      {livros.length === 0 ? (
        <div className="mt-10">
          <Empty>
            Ainda não tem queridinho por aqui. Quando alguém gostar ou adorar um livro, ele aparece.
          </Empty>
        </div>
      ) : (
        <ol className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {livros.map((livro, i) => {
            const n = i + 1;
            return (
              <li key={livro.slug} className="relative h-full">
                {/* O PÓDIO: os três primeiros dizem a posição em voz alta, na serifa
                    da voz e tinta cheia. Do 4º em diante o número é nota de rodapé.
                    Pódio de LIVRO, escolhido pela comunidade: é curadoria, e a
                    fronteira está em lib/queridinhos.ts. */}
                <span
                  aria-hidden
                  className={[
                    "voice pointer-events-none absolute z-10 leading-none",
                    n === 1
                      ? "left-3 top-1.5 text-[44px] font-medium text-[var(--color-ink)]"
                      : n === 2
                        ? "left-3.5 top-2 text-[34px] font-medium text-[var(--color-ink)]"
                        : n === 3
                          ? "left-3.5 top-2.5 text-[28px] font-medium text-[var(--color-ink)]"
                          : "left-4 top-3 text-[18px] text-[var(--color-ink-faint)]",
                  ].join(" ")}
                  style={
                    n <= 3
                      ? { textShadow: "0 1px 12px color-mix(in srgb, var(--color-canvas) 85%, transparent)" }
                      : undefined
                  }
                >
                  {n}
                </span>

                <Link
                  href={`/livro/${livro.slug}`}
                  className="card group flex h-full flex-col items-center p-6 text-center sm:p-7"
                >
                  <span className="cover-lift block w-[58%]">
                    <Cover title={livro.title} author={livro.author} src={livro.coverUrl} />
                  </span>

                  <span className="voice mt-5 line-clamp-2 text-[15px] leading-snug text-[var(--color-ink)]">
                    {livro.title}
                  </span>
                  {livro.author && (
                    <span className="mt-1 line-clamp-1 text-[12px] text-[var(--color-ink-faint)]">
                      {livro.author}
                    </span>
                  )}

                  {/* Os números do card, com as cores da fila da comunidade (exceção
                      dirigida pelo dono: a cor mora no ícone, o número fica tinta). */}
                  <span className="mt-auto flex items-center gap-3.5 pt-3 text-[12px] text-[var(--color-ink-soft)]">
                    <span className="inline-flex items-center gap-1" title={`${livro.leram} leram`}>
                      <BookOpenCheck size={13} strokeWidth={1.75} aria-hidden style={{ color: "#4da76a" }} />
                      <span className="tabular">{livro.leram}</span>
                    </span>
                    <span className="inline-flex items-center gap-1" title={`${livro.gostaram} gostaram ou adoraram`}>
                      <Heart size={13} strokeWidth={1.75} aria-hidden style={{ color: "#e8843c" }} />
                      <span className="tabular">{livro.gostaram}</span>
                    </span>
                    <span className="inline-flex items-center gap-1" title={`em ${livro.estantes} ${livro.estantes === 1 ? "estante" : "estantes"}`}>
                      <Bookmark size={13} strokeWidth={1.75} aria-hidden style={{ color: "#4a9dc9" }} />
                      <span className="tabular">{livro.estantes}</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}

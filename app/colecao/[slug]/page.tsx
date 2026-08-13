import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Package } from "lucide-react";
import { getActorOrNull } from "@/lib/actor";
import { getConjuntoDetalhe } from "@/lib/conjunto-detalhe";
import { origemAceita } from "@/lib/imagens";
import { Cover } from "@/components/cover";
import { Prosa } from "@/components/prosa";
import { Empty } from "@/components/empty";
import { SeloColecionador } from "@/components/selo-colecionador";
import { DOURADO } from "@/lib/dourado";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A PÁGINA DE DENTRO DA COLEÇÃO. Só existe pra quem chegou lá.
 *
 *  ═══ POR QUE ELA É UM PRÊMIO, E NÃO UM ATALHO ═══
 *
 *  "A coleção vem ANTES da estante no perfil" já dizia: uma coleção completa é a
 *  coisa mais difícil de conseguir que existe no app. Esta página é o que tem do
 *  outro lado disso — sobre o autor, a obra, as edições — e ela só se abre para
 *  quem já tem todos os volumes. Ver ai/DECISIONS.md.
 *
 *  ═══ O DESBLOQUEIO NÃO É UMA COLUNA ═══
 *
 *  `getConjuntoDetalhe` computa `completo` na hora, do mesmo jeito que `getConjuntos`
 *  sempre computou. Não existe "% completo" guardado (migration 0036 proíbe isso de
 *  propósito), e esta página não inventa uma exceção: ela olha o fato de agora.
 *
 *  ═══ QUEM QUASE CHEGOU NÃO VÊ UMA PORTA FECHADA ═══
 *
 *  Um 404 para "faltam dois volumes" seria mentir que a coleção não existe. A tela
 *  mostra o que falta, com a mesma gramática do resto do app: a lacuna é o assunto.
 * ════════════════════════════════════════════════════════════════════
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const actor = await getActorOrNull();
  const c = actor ? await getConjuntoDetalhe(actor, (await params).slug) : null;
  if (!c) return {};
  return { title: `${c.titulo} · Gume` };
}

export default async function ColecaoDetalhe({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await getActorOrNull();

  if (!actor) {
    return (
      <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
        <div className="mt-24">
          <Empty>
            <Link href="/entrar" className="underline decoration-[var(--color-ink)] underline-offset-4">
              Entre
            </Link>{" "}
            para ver esta coleção.
          </Empty>
        </div>
      </main>
    );
  }

  const c = await getConjuntoDetalhe(actor, slug);
  if (!c) notFound();

  /* ═══ AINDA NÃO. E A TELA DIZ ISSO, EM VEZ DE ESCONDER A PORTA ═══

     Um leitor que tocou o conjunto (tem ou quer pelo menos um volume) mas não
     completou vê exatamente o que falta — a mesma gramática do resto da coleção,
     nunca um 404 fingindo que nada existe aqui. */
  if (!c.completo) {
    const faltam = c.total - c.tenho;
    return (
      <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
        <div className="mt-24 text-center">
          <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
            <Package size={14} strokeWidth={1.75} aria-hidden />
            ainda não
          </p>
          <h1 className="voice mt-4 text-[32px] leading-[1.05] tracking-[-0.015em] sm:text-[40px]">
            {c.titulo}
          </h1>
          <p className="voice mt-5 text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
            Você tem {c.tenho} de {c.total}.{" "}
            {faltam === 1 ? "Falta um volume" : `Faltam ${faltam} volumes`} para esta página abrir.
          </p>
          <Link
            href="/colecao"
            className="mt-8 inline-block text-[14px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            voltar para a sua coleção
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 pb-32 sm:px-10">
      {/* ═══ O CABEÇALHO: O EMBLEMA GRANDE, E A MEDALHA DE QUEM CHEGOU AQUI ═══

          A medalha morde o anel dourado do emblema — por isso o `overflow-hidden`
          e o `rounded-full` que recortam a FOTO moraram num span interno, `absolute
          inset-0`; o span externo fica só `relative`, sem cortar nada, e é onde a
          medalha (fora do círculo) consegue vazar. Ver components/selo-colecionador.tsx. */}
      <header className="mt-20 flex flex-col items-center text-center sm:mt-28">
        {/* A foto PREENCHE o círculo (object-cover), não boia pequena dentro dele: um
            personagem ou um rosto cortado à força de padding vira um selo ilegível,
            e não precisa crescer além do círculo pra ficar visível — só preencher. */}
        {c.emblema && origemAceita(c.emblema) && (
          <span className="relative mb-6 flex h-24 w-24 sm:h-28 sm:w-28">
            <span
              className="surface-2 absolute inset-0 overflow-hidden rounded-full"
              style={{ boxShadow: `0 0 0 3px color-mix(in srgb, ${DOURADO} 70%, transparent)` }}
            >
              <Image src={c.emblema} alt="" fill sizes="(min-width: 640px) 112px, 96px" className="object-cover" />
            </span>
            <span className="absolute -bottom-2 -right-2 z-10">
              <SeloColecionador tamanho={44} girar={10} />
            </span>
          </span>
        )}
        {/* A medalha já carrega o símbolo; esta linha vira legenda neutra, não
            repete a cor nem o ícone. Se não há emblema (nada pra medalha morder),
            ela sozinha continua dizendo o fato. */}
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          coleção completa
        </p>
        <h1 className="voice mt-5 max-w-2xl text-[40px] leading-[1.04] tracking-[-0.015em] sm:text-[52px]">
          {c.titulo}
        </h1>
        <p className="tabular mt-4 text-[12px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          {c.total} {c.total === 1 ? "volume" : "volumes"}
          {c.publisher ? ` · ${c.publisher}` : ""}
          {c.serie ? ` · ${c.serie.titulo}` : ""}
        </p>
      </header>

      {/* ═══ SOBRE O AUTOR. O QUE JÁ EXISTE NO CATÁLOGO, E NADA INVENTADO ═══

          A bio nunca é gerada por IA (é recusa, está no README): esta tela só
          mostra o que um leitor já escreveu em authors.bio. Quando falta, a tela
          diz que falta — a mesma gramática de /autor/[slug]. */}
      {c.autor && (
        <section className="surface mt-14 p-7 sm:p-8">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            sobre o autor
          </h2>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            {c.autor.imageUrl && origemAceita(c.autor.imageUrl) && (
              <Image
                src={c.autor.imageUrl}
                alt={`Retrato de ${c.autor.nome}`}
                width={88}
                height={88}
                sizes="88px"
                className="h-22 w-22 shrink-0 rounded-full object-cover"
                style={{ border: "1px solid var(--color-rule)" }}
              />
            )}
            <div className="min-w-0 flex-1">
              <Link href={`/autor/${c.autor.slug}`} className="voice text-[19px] leading-snug hover:underline">
                {c.autor.nome}
              </Link>
              {c.autor.nationality && (
                <p className="mt-0.5 text-[12px] text-[var(--color-ink-faint)]">{c.autor.nationality}</p>
              )}
              <div className="mt-3">
                {c.autor.bio ? (
                  <Prosa texto={c.autor.bio} fonte={c.autor.bioSource} />
                ) : (
                  <p className="text-[14px] leading-relaxed text-[var(--color-ink-faint)]">
                    Ninguém escreveu ainda quem foi essa pessoa.
                  </p>
                )}
              </div>
              <Link
                href={`/autor/${c.autor.slug}`}
                className="mt-3 inline-block text-[13px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
              >
                ver a página do autor
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ AS EDIÇÕES. CADA VOLUME, COM O QUE O CATÁLOGO SABE DELE ═══ */}
      <section className="mt-10">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          as edições
        </h2>
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {c.volumes.map((v) => (
            <li key={v.slug}>
              <Link href={`/livro/${v.slug}`} className="card flex h-full flex-col p-4">
                <span className="cover-lift block w-[70%] self-center">
                  <Cover title={v.title} author={c.autor?.nome ?? null} src={v.coverUrl} />
                </span>
                <span className="voice mt-3 line-clamp-2 text-[13px] leading-snug text-[var(--color-ink)]">
                  {v.title}
                </span>
                <span className="tabular mt-1 text-[11px] text-[var(--color-ink-faint)]">
                  {v.volume ? `vol. ${v.volume}` : ""}
                  {v.publishedYear ? ` · ${v.publishedYear}` : ""}
                </span>
                {v.publisher && (
                  <span className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{v.publisher}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-14 text-center">
        <Link
          href="/colecao"
          className="text-[13px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
        >
          voltar para a sua coleção
        </Link>
      </p>
    </main>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Crown, Signpost } from "lucide-react";
import { Cover } from "@/components/cover";
import { Carrossel } from "@/components/carrossel";
import { ConjuntoCard } from "@/components/conjunto";
import { PerfilEstante } from "@/components/perfil-estante";
import { ListaGrid } from "@/components/lista-card";
import { Empty } from "@/components/empty";
import { DOURADO } from "@/lib/dourado";
import type { Conjunto } from "@/lib/copies";
import type { ShelfBook } from "@/lib/shelf-view";
import type { Opinion } from "@/lib/ratings";
import type { ListaCard } from "@/lib/listas";
import type { ResenhaDaPessoa } from "@/lib/explore";
import type { Curadoria } from "@/lib/curadoria-guardada";

const EYEBROW = "text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PERFIL EM ABAS. Sete seções empilhadas viravam um pergaminho; agora
 *  cada uma tem um lugar próprio, e só uma aparece por vez.
 *
 *  MESMO PADRÃO de components/painel.tsx: um componente de cliente com
 *  `useState<Aba>`, os dados TODOS já buscados no servidor (nenhuma query
 *  nova aqui) e passados como prop — trocar de aba é só trocar o que
 *  aparece, sem voltar ao servidor e sem piscar a tela.
 *
 *  Uma aba só existe se tiver algo dentro — a mesma regra que cada seção já
 *  seguia (`{x.length > 0 && (...)}`). Um perfil novo, sem coleção nem
 *  resenha, não ganha abas vazias: ganha só as abas que respondem por algo.
 *  A ordem (coleções, estante, resenhas, listas) é a mesma prioridade que a
 *  página já tinha empilhada: o que é mais difícil de conseguir vem primeiro.
 * ════════════════════════════════════════════════════════════════════
 */
export function PerfilAbas({
  mine, primeiroNome, podeEditarConjunto,
  conjuntos,
  books, opinions, adorou,
  resenhas,
  shelves, guardadas, curadorias, curadoriaFixa, ehGuia,
  contagemEstante,
}: {
  mine: boolean;
  primeiroNome: string;
  podeEditarConjunto: boolean;
  conjuntos: Conjunto[];
  books: ShelfBook[];
  opinions: Record<string, Opinion>;
  adorou: ShelfBook[];
  resenhas: ResenhaDaPessoa[];
  shelves: ListaCard[];
  guardadas: ListaCard[];
  curadorias: Curadoria[];
  /** O card da curadoria da casa, já renderizado — CuradoriaCard é um Server
      Component assíncrono (busca no banco), e um componente de cliente não
      pode importar e desenhar um Server Component sozinho: só recebê-lo já
      pronto, de quem o renderizou (app/[handle]/page.tsx). */
  curadoriaFixa: ReactNode;
  ehGuia: boolean;
  contagemEstante: { tudo: number; lidos: number };
}) {
  const ABAS = [
    { key: "colecoes" as const, label: "coleções", n: conjuntos.length, existe: conjuntos.length > 0 },
    { key: "estante" as const, label: "estante", n: contagemEstante.tudo, existe: books.length > 0 || adorou.length > 0 },
    { key: "resenhas" as const, label: "resenhas", n: resenhas.length, existe: resenhas.length > 0 },
    {
      key: "listas" as const,
      label: "listas",
      n: shelves.length + guardadas.length + curadorias.length,
      existe: shelves.length > 0 || guardadas.length > 0 || curadorias.length > 0 || !!curadoriaFixa,
    },
  ].filter((a) => a.existe);

  const [aba, setAba] = useState(ABAS[0]?.key);

  if (ABAS.length === 0) {
    return (
      <Empty>
        {mine ? "Sua estante está vazia." : `${primeiroNome} ainda não mostrou nada por aqui.`}
      </Empty>
    );
  }

  return (
    <div className="mt-10">
      <nav className="flex flex-wrap gap-1 overflow-x-auto rounded-full border p-1" style={{ borderColor: "var(--color-rule)" }}>
        {ABAS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setAba(a.key)}
            aria-current={aba === a.key ? "page" : undefined}
            className="shrink-0 rounded-full px-4 py-2 text-[14px] font-medium capitalize transition-colors"
            style={aba === a.key
              ? { background: "var(--color-ink)", color: "var(--color-canvas)" }
              : { color: "var(--color-ink-soft)" }}
          >
            {a.label}
            {a.n > 0 && <span className="tabular ml-1.5 opacity-70">{a.n}</span>}
          </button>
        ))}
      </nav>

      {aba === "colecoes" && (
        <section className="mt-6">
          <div className="flex flex-col gap-5">
            {conjuntos.map((c) => (
              <ConjuntoCard key={c.id} c={c} podeEditar={podeEditarConjunto} />
            ))}
          </div>
        </section>
      )}

      {aba === "estante" && (
        <section className="mt-6">
          {adorou.length > 0 && (
            <Carrossel titulo={mine ? "o que eu adorei" : `o que ${primeiroNome} adorou`} books={adorou} />
          )}
          {books.length > 0 && (
            <div className={adorou.length > 0 ? "mt-10" : ""}>
              <PerfilEstante books={books} opinions={opinions} />
            </div>
          )}
        </section>
      )}

      {aba === "resenhas" && (
        <section className="surface mt-6 p-7">
          <ul className="flex flex-col gap-6">
            {resenhas.map((r) => (
              <li key={r.id} className="flex gap-5">
                <Link href={`/livro/${r.slug}`} className="cover-lift w-14 shrink-0">
                  <Cover title={r.title} src={r.coverUrl} />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/livro/${r.slug}`} className="voice text-[17px] leading-snug hover:underline">
                    {r.title}
                  </Link>

                  {/* `line-clamp` porque isto é uma LISTA: a resenha inteira mora na
                      página do livro, e uma lista onde cada item tem seis parágrafos
                      deixa de ser uma lista. */}
                  <p className="voice mt-2 line-clamp-4 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                    {r.body}
                  </p>

                  <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                    {new Date(r.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                    {/* Só o dono precisa saber o que está fechado: para os outros, o que
                        eles estão vendo já É o que dá para ver. */}
                    {mine && r.visibility !== "public" && (
                      <span className="normal-case tracking-normal">
                        {r.visibility === "private" ? " · só para você" : " · para quem te segue"}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {aba === "listas" && (
        <section className="mt-6 flex flex-col gap-8">
          <div>
            <h3 className={`${EYEBROW} flex flex-wrap items-center gap-2`}>
              {mine ? "minhas listas" : `listas que ${primeiroNome} montou`}
              {/* O selo de GUIA: pelo menos uma lista daqui já foi guardada por alguém.
                  Fora do sistema de insígnias de propósito. Ver ai/DECISIONS.md. */}
              {ehGuia && (
                <span className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-2 py-0.5 text-[10px] normal-case tracking-normal text-[var(--color-ink-faint)]">
                  <Signpost size={11} strokeWidth={1.75} aria-hidden />
                  guia
                </span>
              )}
            </h3>
            {/* A curadoria editorial, FIXA no topo das listas da casa. */}
            {curadoriaFixa && <div className="mt-4">{curadoriaFixa}</div>}
            {shelves.length > 0 && (
              <div className="mt-4">
                <ListaGrid listas={shelves} mostrarDono={false} />
              </div>
            )}
          </div>

          {(guardadas.length > 0 || curadorias.length > 0) && (
            <div>
              <h3 className={EYEBROW}>
                {mine ? "listas que eu guardei" : `listas que ${primeiroNome} guardou`}
              </h3>

              {/* A curadoria da casa vem PRIMEIRO e como uma linha, e não como card: ela
                  não tem dono para creditar (é da casa) nem capas próprias para mostrar —
                  as capas dela são as do momento, e mudam sozinhas. */}
              {curadorias.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2">
                  {curadorias.map((c) => (
                    <li key={c.chave}>
                      <Link
                        href={c.href}
                        className="surface surface-hover flex items-center gap-2.5 px-5 py-4 text-[15px] text-[var(--color-ink)]"
                      >
                        <Crown size={14} strokeWidth={1.75} aria-hidden style={{ color: DOURADO }} />
                        {c.titulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {guardadas.length > 0 && (
                <div className="mt-4">
                  <ListaGrid listas={guardadas} />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

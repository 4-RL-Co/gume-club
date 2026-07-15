"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { julgarUmaCapa } from "@/app/livro/[slug]/correction-actions";
import { toast } from "@/lib/toast";
import type { Proposta } from "@/lib/corrections-view";

/**
 * A FILA DE CAPAS. Só bibliotecário vê, e só bibliotecário julga.
 *
 * A capa é o único campo que passa por uma fila, porque é o único que aparece na
 * tela de todo mundo: é onde o vandalismo tem plateia. Todo o resto o leitor
 * corrige e aplica na hora, porque o nome dele fica no histórico, e é o nome que
 * torna o vandalismo caro.
 *
 * Quando o bibliotecário aceita, a revisão leva o nome de QUEM PROPÔS. O trabalho
 * é de quem achou a capa; o bibliotecário só abriu a porta.
 */
export function FilaDeCapas({ fila }: { fila: Proposta[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const julgar = (id: string, aplicar: boolean, titulo: string) =>
    start(async () => {
      await julgarUmaCapa(id, aplicar);
      toast(aplicar ? `A capa de ${titulo} entrou.` : "Recusada.");
      router.refresh();
    });

  return (
    <ul className="flex flex-col gap-5">
      {fila.map((p) => (
        <li key={p.id} className="surface-2 flex flex-wrap items-center gap-5 p-4">
          {/* a capa proposta, e a que está lá hoje, lado a lado: julgar sem ver as
              duas é julgar no escuro */}
          <span className="flex shrink-0 items-end gap-3">
            {p.atual && (
              <span className="flex flex-col items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.atual} alt="" className="w-14 rounded-[var(--radius-cover)] opacity-50" />
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                  hoje
                </span>
              </span>
            )}

            <span className="flex flex-col items-center gap-1.5">
              <span className="cover-lift block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.coverUrl}
                  alt=""
                  className="w-16 rounded-[var(--radius-cover)]"
                />
              </span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                proposta
              </span>
            </span>
          </span>

          <span className="min-w-0 flex-1">
            <Link href={`/livro/${p.workSlug}`} className="voice block truncate text-[16px] hover:underline">
              {p.workTitle}
            </Link>

            <span className="mt-1 block text-[13px] text-[var(--color-ink-soft)]">
              {p.handle ? (
                <Link href={`/@${p.handle}`} className="hover:underline">
                  {p.name ?? p.handle}
                </Link>
              ) : (
                "alguém"
              )}{" "}
              achou esta capa
            </span>

            {p.note && (
              <span className="mt-1 block text-[12px] text-[var(--color-ink-faint)]">{p.note}</span>
            )}
          </span>

          <span className="flex shrink-0 items-center gap-3">
            <button
              disabled={pending}
              onClick={() => julgar(p.id, true, p.workTitle)}
              className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
            >
              aceitar
            </button>
            <button
              disabled={pending}
              onClick={() => julgar(p.id, false, p.workTitle)}
              className="text-[13px] text-[var(--color-ink-faint)] underline underline-offset-4 hover:text-[var(--color-perigo)] disabled:opacity-40"
            >
              recusar
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

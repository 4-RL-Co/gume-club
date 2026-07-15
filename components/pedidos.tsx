"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Search, Undo2 } from "lucide-react";
import { atenderPedido, reabrirPedido } from "@/app/pedidos/actions";

type Pedido = {
  id: string;
  texto: string;
  quantas: number;
  desde: string;
  ultima: string;
};

/**
 * A fila, e os dois botões que ela precisa: PROCURAR (para ir ver do que se trata) e
 * ATENDIDO (para tirar da frente quando o livro entrou).
 *
 * O "atendido" some da lista na hora, mas NÃO some do banco: ele vira uma data. A
 * fila resolvida é a única memória de como o catálogo cresceu, e apagá-la seria
 * apagar a prova de que a torneira funciona.
 */
export function Pedidos({ fila }: { fila: Pedido[] }) {
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const [pendente, start] = useTransition();

  return (
    <ul className="mt-8 divide-y divide-[var(--color-rule)]">
      {fila.map((p) => {
        const feito = feitos.has(p.id);

        return (
          <li
            key={p.id}
            className="flex items-center gap-4 py-3.5 transition-opacity"
            style={{ opacity: feito ? 0.4 : 1 }}
          >
            <div className="min-w-0 flex-1">
              <p className="voice truncate text-[16px] leading-snug">{p.texto}</p>
              <p className="tabular mt-0.5 text-[12px] text-[var(--color-ink-faint)]">
                {p.quantas === 1 ? "pedido uma vez" : `pedido ${p.quantas} vezes`}
                {" · "}
                {quando(p.ultima)}
              </p>
            </div>

            <Link
              href={`/buscar?q=${encodeURIComponent(p.texto)}`}
              aria-label={`procurar ${p.texto}`}
              className="shrink-0 rounded-[var(--radius-control)] border border-[var(--color-rule)] p-2 text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
            >
              <Search size={15} strokeWidth={1.75} />
            </Link>

            <button
              disabled={pendente}
              aria-label={feito ? `reabrir ${p.texto}` : `marcar ${p.texto} como atendido`}
              onClick={() =>
                start(async () => {
                  if (feito) {
                    await reabrirPedido(p.id);
                    setFeitos((s) => {
                      const novo = new Set(s);
                      novo.delete(p.id);
                      return novo;
                    });
                  } else {
                    await atenderPedido(p.id);
                    setFeitos((s) => new Set(s).add(p.id));
                  }
                })
              }
              className="shrink-0 rounded-[var(--radius-control)] border border-[var(--color-rule)] p-2 text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
            >
              {feito ? <Undo2 size={15} strokeWidth={1.75} /> : <Check size={15} strokeWidth={1.75} />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function quando(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "há um mês" : `há ${meses} meses`;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Cover } from "@/components/cover";
import type { ShelfBook } from "@/lib/shelf-view";

/**
 * A VITRINE DOS "ADOREI", COM SETA PARA PASSAR.
 *
 * Uma fila que rola de lado precisa dizer que rola: sem a seta, quem está no mouse não
 * sabe que existe mais livro à direita, e a metade escondida some. As setas só aparecem
 * quando há para onde rolar — no começo não há seta à esquerda, no fim não há à direita,
 * e numa fila curta que cabe inteira não há nenhuma. Chrome que aparece só quando serve.
 *
 * É o único pedaço client do perfil, e de propósito: medir a largura e rolar são coisas
 * do navegador. As capas continuam sendo `Cover`, o mesmo componente da parede.
 */
export function Carrossel({ titulo, books }: { titulo: string; books: ShelfBook[] }) {
  const fila = useRef<HTMLUListElement>(null);
  const [temEsquerda, setTemEsquerda] = useState(false);
  const [temDireita, setTemDireita] = useState(false);

  const medir = useCallback(() => {
    const el = fila.current;
    if (!el) return;
    setTemEsquerda(el.scrollLeft > 4);
    setTemDireita(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [medir]);

  const rolar = (sentido: 1 | -1) => {
    const el = fila.current;
    if (!el) return;
    el.scrollBy({ left: sentido * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="surface mt-5 p-7">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {titulo}
      </h2>

      <div className="relative mt-5">
        {temEsquerda && <Seta sentido={-1} onClick={() => rolar(-1)} />}

        <ul
          ref={fila}
          onScroll={medir}
          className="flex gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {books.map((b) => (
            <li key={b.workId} className="w-24 shrink-0 sm:w-28">
              <Link href={`/livro/${b.slug}`} className="cover-lift block">
                <Cover title={b.title} author={b.author} src={b.coverUrl} />
              </Link>
            </li>
          ))}
        </ul>

        {temDireita && <Seta sentido={1} onClick={() => rolar(1)} />}
      </div>
    </section>
  );
}

/** Um anel de vidro sobre as capas — chrome, nunca conteúdo (docs/design.md). */
function Seta({ sentido, onClick }: { sentido: 1 | -1; onClick: () => void }) {
  const Icone = sentido === -1 ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={sentido === -1 ? "voltar" : "avançar"}
      className={`surface absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)] ${
        sentido === -1 ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
      }`}
    >
      <Icone size={18} strokeWidth={1.5} />
    </button>
  );
}

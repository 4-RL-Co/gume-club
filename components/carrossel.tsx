"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Cover } from "@/components/cover";
import type { ShelfBook } from "@/lib/shelf-view";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A VITRINE DOS "ADOREI", EM PROFUNDIDADE.
 *
 *  Era uma fila reta de capas. Virou uma vitrine de verdade: a capa do centro
 *  vem à frente, as vizinhas giram para dentro em perspectiva, e um reflexo
 *  baixo escorre de cada uma, como livros de pé num balcão de vidro. Rolar é a
 *  interação inteira: o que está no centro é o que está em foco, e o resto se
 *  inclina para ele.
 *
 *  ═══ POR QUE ISSO NÃO BRIGA COM O DESIGN ═══
 *
 *  A regra da casa é "a única cor vem das capas" (docs/design.md). Esta vitrine
 *  não adiciona cor nenhuma: ela dá PALCO às capas, que são o conteúdo. O vidro
 *  continua sendo só as setas; o reflexo é a própria capa, apagando.
 *
 *  ═══ COMO FUNCIONA, SEM BIBLIOTECA ═══
 *
 *  Um scroll horizontal comum com snap no centro. A cada quadro (rAF), cada capa
 *  calcula a distância do próprio centro ao centro da janela e vira essa
 *  distância em rotação, profundidade e escala. É o navegador rolando, como
 *  sempre rolou: o 3D é maquiagem em cima do scroll, então o teclado, o arrasto
 *  e o trackpad já funcionam de graça.
 *
 *  Quem pediu menos movimento (prefers-reduced-motion) recebe a fila reta de
 *  antes: profundidade é tempero, e não pode ser enjoo.
 * ════════════════════════════════════════════════════════════════════
 */

/** O quanto a capa vizinha gira (graus) e afunda (px) no auge da distância. */
const GIRO_MAX = 42;
const FUNDO_MAX = 110;

export function Carrossel({ titulo, books }: { titulo: string; books: ShelfBook[] }) {
  const fila = useRef<HTMLUListElement>(null);
  const [temEsquerda, setTemEsquerda] = useState(false);
  const [temDireita, setTemDireita] = useState(true);
  const [semMovimento, setSemMovimento] = useState(false);
  const quadro = useRef<number>(0);

  const medir = useCallback(() => {
    const el = fila.current;
    if (!el) return;
    setTemEsquerda(el.scrollLeft > 4);
    setTemDireita(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  /** A maquiagem 3D de um quadro: distância do centro vira giro, fundo e escala. */
  const pintar = useCallback(() => {
    const el = fila.current;
    if (!el) return;
    const centro = el.scrollLeft + el.clientWidth / 2;

    for (const li of Array.from(el.children) as HTMLElement[]) {
      const alvo = li.querySelector<HTMLElement>("[data-palco]");
      if (!alvo) continue;

      const meio = li.offsetLeft + li.offsetWidth / 2;
      // -1 é meia tela à esquerda, 0 é o centro exato, +1 é meia tela à direita.
      const d = Math.max(-1, Math.min(1, (meio - centro) / (el.clientWidth / 2)));
      const perto = 1 - Math.abs(d);

      alvo.style.transform =
        `perspective(900px) rotateY(${(-d * GIRO_MAX).toFixed(2)}deg) ` +
        `translateZ(${(-FUNDO_MAX * Math.abs(d)).toFixed(1)}px) ` +
        `scale(${(0.92 + perto * 0.14).toFixed(3)})`;
      alvo.style.opacity = String(0.55 + perto * 0.45);
      li.style.zIndex = String(Math.round(perto * 100));
    }
  }, []);

  const aoRolar = useCallback(() => {
    medir();
    if (semMovimento) return;
    cancelAnimationFrame(quadro.current);
    quadro.current = requestAnimationFrame(pintar);
  }, [medir, pintar, semMovimento]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSemMovimento(mq.matches);
    const ouvir = (e: MediaQueryListEvent) => setSemMovimento(e.matches);
    mq.addEventListener("change", ouvir);

    medir();
    if (!mq.matches) pintar();
    window.addEventListener("resize", aoRolar);
    return () => {
      mq.removeEventListener("change", ouvir);
      window.removeEventListener("resize", aoRolar);
      cancelAnimationFrame(quadro.current);
    };
  }, [medir, pintar, aoRolar]);

  const rolar = (sentido: 1 | -1) => {
    const el = fila.current;
    if (!el) return;
    el.scrollBy({ left: sentido * el.clientWidth * 0.6, behavior: "smooth" });
  };

  return (
    <section className="surface mt-5 overflow-hidden p-7">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {titulo}
      </h2>

      <div className="relative mt-2">
        {temEsquerda && <Seta sentido={-1} onClick={() => rolar(-1)} />}

        <ul
          ref={fila}
          onScroll={aoRolar}
          className="flex items-center gap-6 overflow-x-auto pb-1 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={
            semMovimento
              ? undefined
              : {
                  // O respiro nas pontas deixa a primeira e a última capa chegarem ao
                  // centro do palco; o snap faz cada parada cair numa capa.
                  paddingInline: "calc(50% - 4rem)",
                  scrollSnapType: "x mandatory",
                }
          }
        >
          {books.map((b) => (
            <li
              key={b.workId}
              className="w-28 shrink-0 sm:w-32"
              style={semMovimento ? undefined : { scrollSnapAlign: "center" }}
            >
              <div
                data-palco
                style={semMovimento ? undefined : { transformStyle: "preserve-3d", willChange: "transform" }}
              >
                <Link href={`/livro/${b.slug}`} className="block" title={b.title}>
                  <Cover title={b.title} author={b.author} src={b.coverUrl} />

                  {/* O reflexo: a própria capa, de cabeça para baixo, sumindo. É o que
                      transforma a fila num balcão de vidro, e não custa uma imagem a
                      mais: é o mesmo desenho, mascarado. */}
                  {!semMovimento && (
                    <span
                      aria-hidden
                      className="pointer-events-none mt-0.5 block"
                      style={{
                        transform: "scaleY(-1)",
                        opacity: 0.22,
                        maskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent 55%)",
                        WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent 55%)",
                      }}
                    >
                      <Cover title={b.title} author={b.author} src={b.coverUrl} />
                    </span>
                  )}
                </Link>
              </div>
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
      className={`surface absolute top-1/2 z-[110] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)] ${
        sentido === -1 ? "left-0" : "right-0"
      }`}
    >
      <Icone size={18} strokeWidth={1.5} />
    </button>
  );
}

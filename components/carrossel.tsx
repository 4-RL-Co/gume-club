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
  const [emFoco, setEmFoco] = useState(0);
  const focoRef = useRef(0);
  const quadro = useRef<number>(0);

  const medir = useCallback(() => {
    const el = fila.current;
    if (!el) return;
    setTemEsquerda(el.scrollLeft > 4);
    setTemDireita(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  /**
   * A maquiagem 3D de um quadro: distância do PONTO DE FOCO vira giro, fundo e escala.
   *
   * O foco fica a 28% da borda esquerda, e não no centro. Com o foco no centro, a
   * primeira capa precisava de meia tela vazia à esquerda para chegar lá, e a seção
   * abria com um buraco. Com o foco à esquerda, a fila começa quase encostada, a capa
   * em destaque fica onde o olho ocidental começa a ler, e o resto da fila recua para
   * a direita como uma prateleira em fuga.
   */
  const pintar = useCallback(() => {
    const el = fila.current;
    if (!el) return;
    const foco = el.scrollLeft + el.clientWidth * 0.28;

    /**
     * ═══ O FOCO TEM QUE SER INCONFUNDÍVEL ═══
     *
     * A primeira régua (escala 0,92 a 1,06 e opacidade a partir de 0,55) era tímida:
     * com três capas quase do mesmo tamanho e quase do mesmo brilho, ninguém sabia
     * qual estava em foco. Agora a diferença é gritada: a capa em foco fica em
     * tamanho cheio e acesa; as vizinhas caem para 78% e escurecem até 30%. E a
     * legenda embaixo diz o título, porque foco que precisa de adivinhação não é foco.
     */
    let melhor = 0;
    let melhorPerto = -1;

    (Array.from(el.children) as HTMLElement[]).forEach((li, i) => {
      const alvo = li.querySelector<HTMLElement>("[data-palco]");
      if (!alvo) return;

      const meio = li.offsetLeft + li.offsetWidth / 2;
      const d = Math.max(-1, Math.min(1, (meio - foco) / (el.clientWidth * 0.45)));
      const perto = 1 - Math.abs(d);
      if (perto > melhorPerto) {
        melhorPerto = perto;
        melhor = i;
      }

      alvo.style.transform =
        `perspective(900px) rotateY(${(-d * GIRO_MAX).toFixed(2)}deg) ` +
        `translateZ(${(-FUNDO_MAX * Math.abs(d)).toFixed(1)}px) ` +
        `scale(${(0.78 + perto * 0.34).toFixed(3)})`;
      alvo.style.opacity = String(0.3 + perto * 0.7);
      li.style.zIndex = String(Math.round(perto * 100));
    });

    if (focoRef.current !== melhor) {
      focoRef.current = melhor;
      setEmFoco(melhor);
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
          className="flex items-start gap-6 overflow-x-auto pb-1 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={
            semMovimento
              ? undefined
              : {
                  /**
                   * O respiro das pontas acompanha o PONTO DE FOCO (28% da esquerda):
                   * a fila começa quase encostada, sem meia tela vazia, e a última capa
                   * ainda alcança o foco no fim da rolagem.
                   *
                   * SEM scroll-snap, de propósito: o snap obrigatório brigava com a
                   * rolagem VERTICAL da página, que ficava presa no container. Rolar a
                   * página não pode ter pedágio; o 3D funciona contínuo do mesmo jeito.
                   */
                  paddingInlineStart: "calc(28% - 4rem)",
                  paddingInlineEnd: "58%",
                }
          }
        >
          {books.map((b) => (
            <li key={b.workId} className="w-28 shrink-0 sm:w-32">
              <div
                data-palco
                style={semMovimento ? undefined : { transformStyle: "preserve-3d", willChange: "transform" }}
              >
                <Link href={`/livro/${b.slug}`} className="block" title={b.title}>
                  <Cover title={b.title} author={b.author} src={b.coverUrl} />

                  {/* O reflexo: a própria capa, de cabeça para baixo, morrendo em um
                      dedo de altura. Ele mora numa janela BAIXA (h-12) com overflow
                      escondido: a primeira versão deixava o reflexo inteiro no fluxo, o
                      container dobrava de altura, e a seção virava um paredão. */}
                  {!semMovimento && (
                    <span aria-hidden className="pointer-events-none block h-12 overflow-hidden">
                      <span
                        className="block"
                        style={{
                          transform: "scaleY(-1)",
                          opacity: 0.2,
                          maskImage: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 80%)",
                          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 80%)",
                        }}
                      >
                        <Cover title={b.title} author={b.author} src={b.coverUrl} />
                      </span>
                    </span>
                  )}
                </Link>
              </div>
            </li>
          ))}
        </ul>

        {temDireita && <Seta sentido={1} onClick={() => rolar(1)} />}
      </div>

      {/* A LEGENDA DO FOCO: o título do livro aceso, dito por extenso. O 3D aponta,
          a legenda confirma, e ninguém precisa adivinhar qual capa está na frente. */}
      {!semMovimento && books[emFoco] && (
        <p className="mt-3 min-h-[1.5rem] text-[14px] text-[var(--color-ink-soft)]" aria-live="polite">
          <span className="voice text-[16px] text-[var(--color-ink)]">{books[emFoco].title}</span>
          {books[emFoco].author && <span className="text-[var(--color-ink-faint)]"> · {books[emFoco].author}</span>}
        </p>
      )}
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

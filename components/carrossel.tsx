"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Cover } from "@/components/cover";
import type { ShelfBook } from "@/lib/shelf-view";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A VITRINE DOS "ADOREI": UM CARROSSEL CIRCULAR, com a capa do meio no trono.
 *
 *  Terceira forma desta vitrine, e cada uma aprendeu com o uso real:
 *
 *  1ª: foco no centro → a fila abria com meia tela vazia à esquerda.
 *  2ª: foco à esquerda → o vazio sumiu, mas ninguém sabia qual capa estava
 *      em foco, e as pontas ficavam desordenadas.
 *  3ª (esta): o foco VOLTA ao centro, e o vazio morre de outro jeito: a fila
 *      é um ANEL. O conteúdo se repete três vezes, a rolagem nasce no terço do
 *      meio, e quando ela se aproxima de uma borda o carrossel se reancora um
 *      terço adiante, sem ninguém ver: as três cópias são idênticas. Não há
 *      começo vazio porque não há começo: é um círculo, e uma volta inteira
 *      sempre te traz de volta ao primeiro.
 *
 *  As capas se dispõem num ARCO: a do centro no alto do palco, inteira e acesa;
 *  as vizinhas descem e giram para dentro conforme se afastam, como num
 *  expositor giratório de livraria. A legenda embaixo diz o título da capa em
 *  foco, porque foco que precisa de adivinhação não é foco.
 *
 *  Quem pediu menos movimento (prefers-reduced-motion) recebe uma fila reta,
 *  sem anel e sem 3D: profundidade é tempero, e não pode ser enjoo. Com poucas
 *  capas (até quatro) também não há anel: um círculo de três livros é um
 *  carrossel de hamster.
 * ════════════════════════════════════════════════════════════════════
 */

const GIRO_MAX = 35;
const FUNDO_MAX = 110;
/**
 * A rampa da rotação. O giro SATURA rápido (a um terço do meio-palco a capa já está
 * no ângulo cheio), e é isso que dá o anfiteatro da referência: o flanco esquerdo
 * INTEIRO olha para o trono num ângulo só, o direito idem, e apenas o trono fica de
 * frente. Sem a rampa, cada capa tinha um ângulo diferente conforme a distância, e a
 * fila parecia desarrumada: um livro de frente aqui, um meio torto ali.
 */
const RAMPA = 0.32;

export function Carrossel({ titulo, books }: { titulo: string; books: ShelfBook[] }) {
  const fila = useRef<HTMLUListElement>(null);
  const [semMovimento, setSemMovimento] = useState(false);
  const [emFoco, setEmFoco] = useState(0);
  const focoRef = useRef(0);
  const quadro = useRef<number>(0);
  const ancorado = useRef(false);

  // O anel só existe com capas suficientes e com movimento permitido.
  const anel = !semMovimento && books.length >= 5;
  const trilha = anel ? [...books, ...books, ...books] : books;

  /** Reancora a rolagem no terço do meio quando ela se aproxima de uma borda. */
  const reancorar = useCallback(() => {
    const el = fila.current;
    if (!el || !anel) return;
    const um = el.scrollWidth / 3;
    if (el.scrollLeft < um * 0.5) el.scrollLeft += um;
    else if (el.scrollLeft > um * 1.5) el.scrollLeft -= um;
  }, [anel]);

  /** A maquiagem de um quadro: distância do CENTRO vira giro, arco, fundo e escala. */
  const pintar = useCallback(() => {
    const el = fila.current;
    if (!el) return;
    const centro = el.scrollLeft + el.clientWidth / 2;

    let melhor = 0;
    let melhorPerto = -1;

    (Array.from(el.children) as HTMLElement[]).forEach((li, i) => {
      const alvo = li.querySelector<HTMLElement>("[data-palco]");
      if (!alvo) return;

      const meio = li.offsetLeft + li.offsetWidth / 2;
      const d = Math.max(-1, Math.min(1, (meio - centro) / (el.clientWidth * 0.45)));
      const perto = 1 - Math.abs(d);
      if (perto > melhorPerto) {
        melhorPerto = perto;
        melhor = i;
      }

      // O giro saturado: sinal diz o lado, a rampa leva ao ângulo cheio bem rápido.
      const giro = -Math.sign(d) * GIRO_MAX * Math.min(1, Math.abs(d) / RAMPA);

      // Sem translateY: a escala encolhe a capa em torno do próprio centro, e é isso
      // que desenha o arco sozinho (os flancos flutuam alinhados pelo meio do trono).
      alvo.style.transform =
        `perspective(900px) rotateY(${giro.toFixed(2)}deg) ` +
        `translateZ(${(-FUNDO_MAX * Math.abs(d)).toFixed(1)}px) ` +
        `scale(${(0.8 + perto * 0.3).toFixed(3)})`;
      alvo.style.opacity = String(0.35 + perto * 0.65);
      li.style.zIndex = String(Math.round(perto * 100));
    });

    if (focoRef.current !== melhor) {
      focoRef.current = melhor;
      setEmFoco(melhor);
    }
  }, []);

  const aoRolar = useCallback(() => {
    if (semMovimento) return;
    reancorar();
    cancelAnimationFrame(quadro.current);
    quadro.current = requestAnimationFrame(pintar);
  }, [pintar, reancorar, semMovimento]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSemMovimento(mq.matches);
    const ouvir = (e: MediaQueryListEvent) => setSemMovimento(e.matches);
    mq.addEventListener("change", ouvir);

    // A rolagem NASCE no terço do meio: o anel não tem começo, então ninguém
    // precisa ver um. Só uma vez, para o resize não te teleportar.
    const el = fila.current;
    if (el && anel && !ancorado.current) {
      ancorado.current = true;
      el.scrollLeft = el.scrollWidth / 3;
    }
    if (!mq.matches) pintar();

    window.addEventListener("resize", aoRolar);
    return () => {
      mq.removeEventListener("change", ouvir);
      window.removeEventListener("resize", aoRolar);
      cancelAnimationFrame(quadro.current);
    };
  }, [anel, pintar, aoRolar]);

  const rolar = (sentido: 1 | -1) => {
    const el = fila.current;
    if (!el) return;
    el.scrollBy({ left: sentido * el.clientWidth * 0.5, behavior: "smooth" });
  };

  const focado = trilha[emFoco] ?? books[0];

  return (
    <section className="surface mt-5 overflow-hidden p-7">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {titulo}
      </h2>

      <div className="relative mt-2">
        {/* No anel sempre há para onde ir nos dois sentidos: as setas ficam. */}
        {!semMovimento && <Seta sentido={-1} onClick={() => rolar(-1)} />}

        <ul
          ref={fila}
          onScroll={aoRolar}
          className={[
            "flex items-center gap-6 overflow-x-auto pb-1 pt-4",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            !anel && !semMovimento ? "justify-center" : "",
          ].join(" ")}
        >
          {trilha.map((b, i) => (
            <li key={`${b.workId}-${i}`} className="w-28 shrink-0 sm:w-32">
              <div
                data-palco
                style={semMovimento ? undefined : { transformStyle: "preserve-3d", willChange: "transform" }}
              >
                <Link href={`/livro/${b.slug}`} className="block" title={b.title}>
                  <Cover title={b.title} author={b.author} src={b.coverUrl} />

                  {/* O reflexo: a própria capa, de cabeça para baixo, morrendo em um
                      dedo de altura dentro de uma janela baixa. */}
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

        {!semMovimento && <Seta sentido={1} onClick={() => rolar(1)} />}
      </div>

      {/* A LEGENDA DO FOCO, centrada sob o trono: o 3D aponta, a legenda confirma. */}
      {!semMovimento && focado && (
        <p className="mt-3 min-h-[1.5rem] text-center text-[14px] text-[var(--color-ink-soft)]" aria-live="polite">
          <span className="voice text-[16px] text-[var(--color-ink)]">{focado.title}</span>
          {focado.author && <span className="text-[var(--color-ink-faint)]"> · {focado.author}</span>}
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

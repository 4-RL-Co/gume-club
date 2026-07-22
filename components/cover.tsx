"use client";

import { useState } from "react";
import Image from "next/image";
import { origemAceita } from "@/lib/imagens";

/**
 * A cover. When Open Library has no image we draw a typographic one instead of
 * a gray box: an empty slot on the wall is worse than an honest one.
 *
 * The generated cover must never out-shout a real one. Cover art is the only
 * saturated colour on the screen (docs/design.md), and a wall of lime green and
 * neon purple placeholders inverts exactly that: the real jackets, which are the
 * actual content, drown in the filler. So the palette here is printing ink, not
 * colour blocks: low chroma, dark, warm, quiet. It should read as a paperback
 * whose photo we simply do not have, and it should recede behind any real cover
 * standing next to it.
 *
 * The typography IS the cover, in the Penguin Classics sense: a serif title with
 * real presence, a 1px rule, the author in small caps beneath. Not an 11px label
 * crammed into a corner.
 */
const INKS = [
  "#242422", // tinta quase preta
  "#2E2E2B", // grafite
  "#3A1E22", // bordô fechado
  "#1F2C43", // azul-carimbo escuro
  "#1E332B", // verde-garrafa
  "#4A3620", // ocre queimado
  "#2B2233", // ameixa apagada
  "#33291F", // sépia
];

/** Warm paper white. Never pure #FFF: this is ink on a page, not a screen. */
const PAPER = "240 236 228";

export function Cover({
  title, author, src, prioridade = false,
}: {
  title: string;
  author?: string | null;
  src?: string | null;
  /**
   * A capa-herói de uma página (a grande, da página do livro) carrega ANTES de
   * tudo: ela é o motivo de a pessoa ter aberto a tela. Todo o resto fica lazy.
   */
  prioridade?: boolean;
}) {
  /**
   * ═══ A IMAGEM QUE MORREU VIRA A CAPA TIPOGRÁFICA, e não um ícone quebrado ═══
   *
   * Uma URL de capa aponta para um servidor de terceiro (Open Library, Google), e
   * servidor de terceiro some: a imagem voltava 404 e a estante mostrava o ícone
   * quebrado do navegador com o texto alternativo vazando por cima do bloco de
   * tinta. Pior que lombada em branco: lombada QUEBRADA.
   *
   * Com o erro capturado, a capa que morreu cai para a mesma capa tipográfica de
   * quem nunca teve imagem, que é honesta e bonita. É o motivo de este componente
   * ser client: o `onError` é do navegador, e só ele sabe que a imagem morreu.
   */
  const [morreu, setMorreu] = useState(false);

  // A 32-bit accumulation, reduced once at the end. Taking the modulo on every
  // character (the obvious version) collapses the distribution and lands half a
  // shelf on the same ink, which is what turns the wall brown.
  let h = 0;
  for (const c of title) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  const ink = INKS[Math.abs(h) % INKS.length];

  if (src && !morreu && origemAceita(src)) {
    // The ink block sits UNDER the jacket while it loads. A wall of forty covers
    // that flashes gray and then fills in reads as a page that is broken and then
    // recovers; a wall that starts as ink and resolves into jackets reads as a
    // wall. Same milliseconds, and only one of them looks intentional.
    //
    // ═══ E A IMAGEM PASSA PELO NOSSO OTIMIZADOR ═══
    //
    // Era um <img> direto no servidor de terceiro: cada leitor negociava com a
    // Open Library (lenta) e baixava a versão GRANDE para um slot de 112px. Com o
    // next/image, o nosso servidor busca uma vez, corta para o tamanho do slot,
    // converte para WebP e cacheia por um mês: a Open Library vira problema nosso,
    // uma vez, em vez de problema de todo leitor, sempre. A política de capa POR
    // REFERÊNCIA fica intacta: o que o banco guarda continua sendo o endereço da
    // fonte; cache é cache, não cópia.
    //
    // Um host fora das origens aceitas faz o otimizador recusar, o onError
    // dispara, e a capa cai para a tipográfica: melhor lombada honesta que
    // imagem quebrada.
    return (
      <span
        className="relative block aspect-2/3 w-full overflow-hidden"
        style={{ background: ink, borderRadius: "var(--radius-cover)" }}
      >
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 640px) 45vw, 240px"
          priority={prioridade}
          onError={() => setMorreu(true)}
          className="object-cover"
          style={{ borderRadius: "var(--radius-cover)" }}
        />
      </span>
    );
  }

  return (
    <div
      className="aspect-2/3 flex w-full flex-col justify-between"
      style={{
        background: ink,
        borderRadius: "var(--radius-cover)",
        padding: "9%",
        // Type scales with the cover itself, so one component serves a 56px
        // search thumbnail and a 200px book page without a size prop.
        containerType: "inline-size",
      }}
    >
      <span
        className="voice block overflow-hidden"
        style={{
          fontSize: "clamp(10px, 12cqw, 26px)",
          lineHeight: 1.18,
          color: `rgb(${PAPER} / 0.92)`,
          display: "-webkit-box",
          WebkitLineClamp: 5,
          WebkitBoxOrient: "vertical",
        }}
      >
        {title}
      </span>

      {author && (
        <span className="block">
          <span
            className="block w-full"
            style={{ height: 1, background: `rgb(${PAPER} / 0.24)`, marginBottom: "7%" }}
          />
          <span
            className="block overflow-hidden uppercase"
            style={{
              fontSize: "clamp(6px, 5.2cqw, 11px)",
              letterSpacing: "0.14em",
              lineHeight: 1.3,
              color: `rgb(${PAPER} / 0.55)`,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {author}
          </span>
        </span>
      )}
    </div>
  );
}

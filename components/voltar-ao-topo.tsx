"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * VOLTAR AO TOPO. Aparece depois de duas telas de rolagem, e só então: quem está
 * no topo não precisa de um botão para ir aonde já está. Numa estante de duzentos
 * livros, subir no dedo é uma caminhada; isto é o elevador.
 *
 * No celular ele senta ACIMA da barra de baixo (bottom-24), senão a barra o
 * engole. Vidro, como todo chrome flutuante da casa.
 */
export function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let quadro = 0;
    const olhar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => setVisivel(window.scrollY > window.innerHeight * 2));
    };
    olhar();
    window.addEventListener("scroll", olhar, { passive: true });
    return () => {
      window.removeEventListener("scroll", olhar);
      cancelAnimationFrame(quadro);
    };
  }, []);

  if (!visivel) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="voltar ao topo"
      className="surface fixed bottom-24 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-ink-soft)] shadow-lg transition-colors hover:text-[var(--color-ink)] sm:bottom-6 sm:right-6"
    >
      <ArrowUp size={18} strokeWidth={1.5} aria-hidden />
    </button>
  );
}

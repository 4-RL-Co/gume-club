"use client";

import { useState } from "react";
import Image from "next/image";
import { origemAceita } from "@/lib/imagens";
import type { CapaDaParede } from "@/lib/parede";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A FITA DE CAPAS. Ela anda, e toda ela tem capa de verdade.
 *
 *  ═══ POR QUE ELA NÃO USA O <Cover> ═══
 *
 *  O `Cover` é o certo em quase todo lugar: quando a imagem morre, ele desenha uma capa
 *  TIPOGRÁFICA, que é honesta e bonita, e muito melhor que um ícone quebrado. Numa
 *  estante, um livro sem capa continua sendo um livro, e ele tem que aparecer.
 *
 *  Aqui não. Esta fileira é ilustração: ela não deve nada a nenhum livro específico, e
 *  ninguém veio a esta tela procurar um título. Uma capa tipográfica no meio dela não lê
 *  como "este livro não tem foto", lê como um buraco no desenho.
 *
 *  Então a regra se inverte: **imagem que falha some da fita**, e as vizinhas fecham o
 *  espaço. É a única tela do app onde a capa some, e é porque é a única onde ela é enfeite.
 *
 *  Por isso ela pede mais capas do que mostra: as que caírem deixam lugar para as
 *  seguintes, e a fileira nunca termina curta.
 *
 *  ═══ E ELA ANDA ═══
 *
 *  Esta fileira já foi parada, e o comentário antigo defendia isso dizendo que movimento
 *  competiria com o texto. O dono olhou a tela e discordou, e a tela é dele: uma estante
 *  que desliza devagar é convidativa, e uma fileira imóvel de sete capas cortadas na
 *  borda parece um pedaço que faltou carregar.
 *
 *  O ritmo é o mesmo da parede da home (`.marquee`, uma volta em torno de 90 segundos):
 *  devagar o bastante para ser notado só por quem parar para olhar. Um carrossel rápido
 *  aqui viraria banner de promoção, que é exatamente o que esta tela não é.
 *
 *  A fita é DUPLICADA e desliza 50%: quando a cópia chega onde a original começou, a
 *  animação reinicia no mesmo pixel, e o laço não tem emenda. E quem pede menos movimento
 *  no sistema vê tudo parado, porque o `prefers-reduced-motion` do globals.css desliga a
 *  animação sem desligar a fileira.
 * ════════════════════════════════════════════════════════════════════
 */
export function FitaDeCapas({ capas, quantas = 14 }: { capas: CapaDaParede[]; quantas?: number }) {
  /** As que morreram no navegador. Só o navegador sabe que uma imagem não veio. */
  const [mortas, setMortas] = useState<Set<string>>(new Set());

  const vivas = capas
    .filter((c) => c.cover_url && origemAceita(c.cover_url) && !mortas.has(c.cover_url))
    .slice(0, quantas);

  /**
   * Com pouquíssimas capas o laço ficaria com um vazio andando pela tela. Melhor não
   * desenhar fita nenhuma do que desenhar uma que pisca um buraco a cada volta.
   */
  if (vivas.length < 6) return null;

  const fita = [...vivas, ...vivas];

  function morreu(url: string) {
    setMortas((antes) => {
      const novo = new Set(antes);
      novo.add(url);
      return novo;
    });
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none relative -mx-6 mt-12 overflow-hidden sm:-mx-10"
      style={{
        // Máscara, e não uma faixa por cima: por cima, ela pintaria uma barra sólida sobre
        // o fundo de quem estiver no tema claro.
        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <ul className="marquee flex w-max gap-3 sm:gap-4" style={{ animationDuration: "95s" }}>
        {fita.map((c, i) => (
          <li key={`${c.cover_url}-${i}`} className="w-20 shrink-0 sm:w-24">
            <span
              className="relative block aspect-2/3 w-full overflow-hidden"
              style={{ borderRadius: "var(--radius-cover)" }}
            >
              <Image
                src={c.cover_url!}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
                style={{ borderRadius: "var(--radius-cover)" }}
                onError={() => morreu(c.cover_url!)}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

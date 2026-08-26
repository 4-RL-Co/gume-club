import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { INSTAGRAM, DISCORD } from "@/lib/onde";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A CASA DE QUEM FAZ. As telas de contribuição, com a mesma cara.
 *
 *  "Quem faz", "As insígnias", "O que vem por aí" e "O que já chegou" **têm que ser as
 *  telas mais bonitas do app**, porque são elas que recebem quem contribui.
 *
 *  ═══ ELE JÁ FOI TRÊS TELAS, "O QUE FALTA" SAIU, E DUAS ENTRARAM ═══
 *
 *  Era "Quem faz", "O que falta" e "As insígnias". "O que falta" mostrava os livros com
 *  ficha incompleta da sua própria estante e a fila de capas do bibliotecário — e "tire
 *  a página inteira" foi o pedido: a página inteira saiu, e nada dela foi realocado.
 *
 *  Depois entraram "O que vem por aí" e "O que já chegou" (ver ai/DECISIONS.md): decidir
 *  o que o Gume vai ser também é construir, tanto quanto consertar uma ficha.
 *
 *  As telas da casa compartilham:
 *
 *    · o EIXO ROSA, que é a cor de colaborar (--color-colaborar) e não aparece em
 *      nenhum outro canto do app. Ele é o que diz "você está na casa de quem faz".
 *    · o mesmo cabeçalho, o mesmo respiro, a mesma largura de coluna.
 *    · e as PORTAS uma para a outra, no rodapé. Quem termina de ler uma delas tem uma
 *      próxima pergunta, e ela é sempre a outra.
 *
 *  ═══ O ROSA É UM FILETE, E NÃO UM FUNDO ═══
 *
 *  A tentação era pintar a tela. Uma tela inteira colorida grita, e o que grita cansa —
 *  e estas são as telas em que a gente MAIS quer que alguém fique.
 *
 *  Um filete de dois pixels ao lado do título faz o mesmo trabalho e não briga com nada.
 *  É a diferença entre um cartaz e uma casa.
 * ════════════════════════════════════════════════════════════════════
 */

export function Cabecalho({
  eyebrow,
  titulo,
  linha,
}: {
  /** "quem faz", "o que falta". Em versalete, e é ele que carrega o rosa. */
  eyebrow: string;
  titulo: React.ReactNode;
  /** Uma frase. A que diz por que esta tela existe. */
  linha: React.ReactNode;
}) {
  return (
    <header className="mt-16 sm:mt-24">
      <p className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em]">
        {/* O filete rosa. Dois pixels, e é ele que diz "casa de quem faz". */}
        <span
          aria-hidden
          className="inline-block h-[2px] w-7 rounded-full"
          style={{ background: "var(--color-colaborar)" }}
        />
        <span style={{ color: "var(--color-colaborar)" }}>{eyebrow}</span>
      </p>

      <h1 className="voice mt-5 max-w-2xl text-[40px] leading-[1.04] tracking-[-0.015em] sm:text-[56px]">
        {titulo}
      </h1>

      <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
        {linha}
      </p>
    </header>
  );
}

/**
 * As portas para o resto da casa: a outra tela, e os canais de contato.
 *
 * Quem termina de ler uma delas tem uma próxima pergunta: "quem mais faz isso?", "o que
 * eu ganho com isso?", "quem decide o que vem por aí?".
 *
 * Sem elas, cada tela era um beco: a pessoa lia, concordava, e ia embora.
 */
export function Portas({ aqui }: { aqui: "quem-faz" | "insignias" | "o-que-vem" | "o-que-chegou" }) {
  const TODAS = [
    {
      key: "quem-faz",
      href: "/contribuidores",
      titulo: "Quem faz",
      texto: "Quem escreve o código e quem cuida do catálogo, com o mesmo peso.",
      fora: false,
    },
    {
      key: "insignias",
      href: "/insignias",
      titulo: "As insígnias e as honras",
      texto: "O que cada uma reconhece, e o que a pessoa fez para ganhá-la.",
      fora: false,
    },
    /**
     * ═══ DECIDIR O QUE VEM POR AÍ TAMBÉM É CONSTRUIR ═══
     *
     * "crie uma pagina de roadmap onde eu vou colocar funcionalidades q estão
     * planejadas, que estão em andamento e ideias" — o dono. Reabre a decisão de
     * 2026-07-11 ("o roadmap mora no GitHub Discussions") — ver ai/DECISIONS.md.
     */
    {
      key: "o-que-vem",
      href: "/o-que-vem",
      titulo: "O que vem por aí",
      texto: "O que está planejado, em andamento, e as ideias. Vota quem quiser.",
      fora: false,
    },
    {
      key: "o-que-chegou",
      href: "/o-que-chegou",
      titulo: "O que já chegou",
      texto: "O que era ideia, virou planejado, e um dia saiu do ar direto pro app.",
      fora: false,
    },
    /**
     * ═══ AS PORTAS QUE LEVAM PARA FORA ═══
     *
     * As telas da casa respondem "quem faz" e "o que se ganha fazendo". Falta a pergunta
     * que vem depois de todas: **"e quem decide o que vem por aí?"**
     *
     * A resposta era "A conversa", um link para o GitHub Discussions — nichado demais
     * para quem não lê código. Dois canais tomaram o lugar, do tamanho das outras portas
     * e nunca filtrados — nenhum dos dois é uma das telas, e cabe estar em todas.
     */
    {
      key: "instagram",
      href: INSTAGRAM,
      titulo: "Instagram",
      texto: "Onde se opina no que vem por aí, e onde se avisa que algo quebrou.",
      fora: true,
    },
    {
      key: "discord",
      href: DISCORD,
      titulo: "Discord",
      texto: "Onde a conversa acontece de verdade. O convite não expira.",
      fora: true,
    },
  ].filter((p) => p.key !== aqui);

  return (
    <nav className="mt-20 border-t pt-10" style={{ borderColor: "var(--color-rule)" }}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
        e também
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {TODAS.map((p) => {
          const dentro = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] text-[var(--color-ink)]">{p.titulo}</span>
                <span className="mt-1.5 block text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
                  {p.texto}
                </span>
              </span>

              {/* A seta diz que dá para entrar. Sem ela, um cartão no rodapé é um resumo.
                  E a seta que aponta para FORA diz que a porta muda de prédio: quem clica
                  esperando continuar no Gume e cai em outro site perde o lugar onde estava. */}
              {p.fora ? (
                <ArrowUpRight
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden
                  className="shrink-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  style={{ color: "var(--color-colaborar)" }}
                />
              ) : (
                <ArrowRight
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden
                  className="shrink-0 transition-all duration-200 group-hover:translate-x-0.5"
                  style={{ color: "var(--color-colaborar)" }}
                />
              )}
            </>
          );

          const classe =
            "surface group flex flex-1 items-center gap-4 p-5 transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]";

          return p.fora ? (
            <a key={p.key} href={p.href} target="_blank" rel="noreferrer" className={classe}>
              {dentro}
            </a>
          ) : (
            <Link key={p.key} href={p.href} className={classe}>
              {dentro}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

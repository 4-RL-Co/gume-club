import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CONVERSA } from "@/lib/onde";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A CASA DE QUEM FAZ. As três telas de contribuição, com a mesma cara.
 *
 *  "Quem faz", "O que falta" e "As insígnias" **têm que ser as telas mais bonitas do
 *  app**, porque são elas que recebem quem contribui.
 *
 *  ═══ E ELAS ERAM TRÊS TELAS ESTRANHAS UMA À OUTRA ═══
 *
 *  Cada uma com o seu cabeçalho, a sua largura, o seu ritmo. Quem chegava numa não
 *  sabia que as outras duas eram do mesmo assunto — e o assunto é o coração do projeto.
 *
 *  Agora as três compartilham:
 *
 *    · o EIXO ROSA, que é a cor de colaborar (--color-colaborar) e não aparece em
 *      nenhum outro canto do app. Ele é o que diz "você está na casa de quem faz".
 *    · o mesmo cabeçalho, o mesmo respiro, a mesma largura de coluna.
 *    · e as PORTAS uma para a outra, no rodapé. Quem termina de ler uma delas tem uma
 *      próxima pergunta, e ela é sempre uma das outras duas.
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
 * As portas para as outras duas telas da casa.
 *
 * Quem termina de ler uma delas tem uma próxima pergunta, e ela é sempre uma das outras
 * duas: "quem faz isso?", "o que eu posso fazer?", "o que eu ganho com isso?".
 *
 * Sem elas, cada tela era um beco: a pessoa lia, concordava, e ia embora.
 */
export function Portas({ aqui }: { aqui: "quem-faz" | "o-que-falta" | "insignias" | "o-que-mudou" }) {
  const TODAS = [
    {
      key: "o-que-falta",
      href: "/o-que-falta",
      titulo: "O que falta",
      texto: "Os livros sem capa, sem autor, sem ano. É por onde se começa.",
      fora: false,
    },
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
     * A porta do PASSADO. As outras respondem "quem faz", "o que dá para fazer" e
     * "o que se ganha"; esta responde "o que já aconteceu": quem volta depois de um
     * tempo fora descobre o que chegou sem arqueologia. Só coisa grande, ver
     * lib/mudancas.ts.
     */
    {
      key: "o-que-mudou",
      href: "/o-que-mudou",
      titulo: "O que mudou",
      texto: "As novidades grandes, da mais nova para baixo.",
      fora: false,
    },
    /**
     * ═══ A QUARTA PORTA, E ELA LEVA PARA FORA ═══
     *
     * As três telas da casa respondem "quem faz", "o que dá para fazer" e "o que se ganha
     * fazendo". Falta a quarta pergunta, que é a que vem depois de todas: **"e quem decide
     * o que vem por aí?"**
     *
     * A resposta existia, e era um link solto no rodapé de um parágrafo. Agora ela é uma
     * porta, do tamanho das outras, e nunca é filtrada: ela não é uma das três telas, e
     * cabe estar em todas.
     */
    {
      key: "conversa",
      href: CONVERSA,
      titulo: "A conversa",
      texto: "Onde se decide o que vem por aí, em voz alta. Dá para chegar e discordar.",
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
            "surface group flex flex-1 items-center gap-4 p-5 transition-colors hover:bg-white/[0.03]";

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

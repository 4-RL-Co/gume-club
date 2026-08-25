import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { INSTAGRAM, DISCORD } from "@/lib/onde";

/**
 * ════════════════════════════════════════════════════════════════════
 *  TORCER PELO GUME. Um convite pequeno, num momento em que faz sentido.
 *
 *  "a parte de comunidade e apoiar o gume deve aparecer em alguns outros
 *  lugares (que não sejam incomodos) para ter CTA, falta CTA pra isso e
 *  geralmente essas ações sao feitas apos uma chamada ou serem
 *  encorajados" — o dono.
 *
 *  Instagram, Discord e Apoiar já moravam na barra (sempre visível, nunca
 *  ligados a um momento) e no rodapé da home/sobre. Isso é ENCONTRÁVEL, mas
 *  não é um CONVITE: ninguém sente vontade de seguir uma marca olhando um
 *  item de menu. Este cartão mora só em dois lugares — o fim de
 *  /estatísticas e o fim do SEU PRÓPRIO perfil público — porque são os dois
 *  momentos em que a pessoa está olhando a própria trajetória de leitura
 *  com orgulho, e é depois desse tipo de momento que se pede uma torcida,
 *  não no meio de uma tarefa.
 *
 *  ═══ POR QUE NÃO É A MESMA CARA DE "PORTAS" (casa-de-quem-faz.tsx) ═══
 *
 *  "Construir" (Quem faz, código, catálogo) é TRABALHO, e carrega o rosa
 *  (--color-colaborar) só dele. Seguir no Instagram, entrar no Discord e
 *  apoiar com dinheiro são a MESMA pergunta — "eu gosto disso, e quero que
 *  continue existindo" — e nenhuma delas é trabalho. Por isso Apoiar mora
 *  aqui, junto de Instagram e Discord, com a MESMA cor neutra que a seção
 *  "comunidade" da barra já usa (ver components/sidebar.tsx) — e não com o
 *  rosa que a tela /apoiar usa sozinha.
 *
 *  ═══ NUNCA PARA UM DESCONHECIDO ═══
 *
 *  No perfil, só aparece para o dono do perfil olhando o PRÓPRIO perfil
 *  (`mine`, em app/[handle]/page.tsx). Pedir que um visitante siga o Gume
 *  na estante de outra pessoa é um anúncio; pedir à própria pessoa, no
 *  fim da própria estante, é um convite.
 * ════════════════════════════════════════════════════════════════════
 */
const DOORS = [
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
  {
    key: "apoiar",
    href: "/apoiar",
    titulo: "Apoiar o Gume",
    texto: "Quem apoia mantém o Gume no ar, sem anúncio, de graça para todo mundo.",
    fora: false,
  },
] as const;

export function ApoieEAcompanhe() {
  return (
    <nav className="mt-20 border-t pt-10" style={{ borderColor: "var(--color-rule)" }}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
        e também
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {DOORS.map((p) => {
          const dentro = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] text-[var(--color-ink)]">{p.titulo}</span>
                <span className="mt-1.5 block text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
                  {p.texto}
                </span>
              </span>

              {p.fora ? (
                <ArrowUpRight
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden
                  className="shrink-0 text-[var(--color-ink-faint)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              ) : (
                <ArrowRight
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden
                  className="shrink-0 text-[var(--color-ink-faint)] transition-all duration-200 group-hover:translate-x-0.5"
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

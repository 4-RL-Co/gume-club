import Link from "next/link";
import { Cover } from "@/components/cover";
import { Avatar } from "@/components/avatar";
import { estiloDoLeque } from "@/components/leque-capas";
import type { AmigoLendo } from "@/lib/social";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A TIRA DE "LENDO AGORA", NO TOPO DO FEED DE AMIGOS.
 *
 *  Um card por PESSOA, e não por livro. O feed conta o que já aconteceu; esta tira conta o
 *  que está aberto na mão de quem você segue agora, em capas, que é o que aproxima duas
 *  pessoas que leem.
 *
 *  ═══ POR QUE UMA CAIXA POR GENTE ═══
 *
 *  A primeira versão fazia um card por livro: quem estava lendo três aparecia três vezes, e
 *  o rosto batia no nome. Agora cada pessoa tem UMA caixa, com os livros dela empilhados em
 *  leque dentro dela, e o rosto (círculo) com o nome embaixo, centrado. Livro é retângulo,
 *  pessoa é círculo: a forma diz qual é qual. As capas linkam para o livro; o rosto, para a
 *  pessoa, e os dois links são IRMÃOS, nunca aninhados.
 * ════════════════════════════════════════════════════════════════════
 */
export function AmigosLendo({ amigos }: { amigos: AmigoLendo[] }) {
  if (amigos.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="tabular text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        os seus amigos estão lendo
      </h2>

      <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {amigos.map((a) => {
          const n = a.livros.length;
          return (
            <li key={a.handle} className="surface surface-hover flex flex-col items-center p-6">
              {/* O leque de capas. Uma sozinha fica reta; várias se sobrepõem e giram um
                  pouco, com a do meio por cima. Altura fixa para as caixas baterem.
                  .leque: no hover do card as capas se afastam um dedo. Ver globals.css
                  e components/leque-capas.tsx. */}
              <div className="leque flex h-48 items-center justify-center">
                {a.livros.map((livro, i) => (
                  <Link
                    key={livro.slug}
                    href={`/livro/${livro.slug}`}
                    className="cover-lift block w-28 shrink-0"
                    style={estiloDoLeque(i, n)}
                  >
                    <Cover title={livro.title} author={livro.author} src={livro.coverUrl} />
                  </Link>
                ))}
              </div>

              <Link
                href={`/@${a.handle}`}
                className="group mt-5 flex flex-col items-center gap-2"
              >
                <Avatar src={a.image} name={a.name} handle={a.handle} size={36} />
                <span className="text-[14px] text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]">
                  {a.name ?? a.handle}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

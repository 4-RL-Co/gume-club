import Link from "next/link";
import { Package } from "lucide-react";
import { Cover } from "@/components/cover";
import { Empty } from "@/components/empty";
import { nomeDoAutor } from "@/lib/autores";
import type { ItemDaColecao } from "@/lib/copies";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A GRADE DA COLEÇÃO. "o que você tem" ou "o que você quer ter" — extraída
 *  de app/colecao/page.tsx quando /colecao virou um filtro dentro de
 *  /estante ("acho que dá pra ficar apenas mais uma aba dentro da pagina
 *  /estante, ou até mesmo um filtro: tenho" — o dono).
 *
 *  Não é BookCard: uma estante responde "o que eu li" (nota, honra, quem
 *  recomendou); esta responde "o que eu tenho" (editora, ano da edição,
 *  de onde veio). São perguntas diferentes, e forçar as duas no mesmo
 *  cartão faria um mentir pro outro.
 *
 *  "as capas devem ser um pouquinho maiores" — eram w-[58%]; agora 64%.
 * ════════════════════════════════════════════════════════════════════
 */
export function ColecaoGrid({ itens, quero }: { itens: ItemDaColecao[]; quero: boolean }) {
  if (itens.length === 0) {
    return (
      <div className="mt-10">
        <Empty>
          {quero
            ? "Nenhum livro na lista de desejo ainda. Marque “quero ter” na página de um livro."
            : "Nenhum livro marcado como seu ainda. Marque “tenho” na página de um livro."}
        </Empty>
      </div>
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {itens.map((i) => (
        <li key={i.slug}>
          <Link href={`/livro/${i.slug}`} className="card group flex h-full flex-col p-5">
            <span className="cover-lift block w-[64%] self-center">
              <Cover title={i.title} author={i.author} src={i.coverUrl} />
            </span>
            <span className="voice mt-4 line-clamp-2 text-[15px] leading-snug text-[var(--color-ink)]">
              {i.title}
            </span>
            <span className="mt-1 line-clamp-1 text-[12px] text-[var(--color-ink-faint)]">
              {nomeDoAutor(i.author)}
            </span>

            {/* A EDIÇÃO, quando você disse qual é a sua: numa coleção, o exemplar
                é o assunto. Editora e ano dizem mais que o título repetido. */}
            {i.publisher && (
              <span className="mt-2 text-[12px] text-[var(--color-ink-soft)]">
                {i.publisher}
                {i.publishedYear ? `, ${i.publishedYear}` : ""}
              </span>
            )}

            {i.acquiredNote && (
              <span className="voice mt-2 line-clamp-2 text-[13px] leading-snug text-[var(--color-ink-soft)]">
                {i.acquiredNote}
              </span>
            )}

            {/* Ter e não ter lido é o estado que esta grade existe para mostrar. */}
            {!quero && !i.lido && (
              <span className="mt-auto flex items-center gap-1.5 pt-3 text-[12px] text-[var(--color-ink-faint)]">
                <Package size={12} strokeWidth={1.75} aria-hidden />
                ainda não li
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

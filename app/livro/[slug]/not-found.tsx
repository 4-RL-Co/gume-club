import Link from "next/link";
import { ScreenHeader } from "@/components/screen-header";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ESTE LIVRO NÃO ESTÁ AQUI.
 *
 *  ═══ O QUE ESTAVA ACONTECENDO ═══
 *
 *  Um endereço de livro que não existe — um link velho, um slug digitado errado, um
 *  livro que saiu do acervo na poda — abria uma **página em branco**. Só a barra
 *  lateral, e nada no meio. Nem um erro, nem um aviso: o app parecia quebrado.
 *
 *  E ele devolvia **200**, dizendo ao Google "esta página existe, pode indexar" sobre
 *  um livro que não existe. Num catálogo de 267 mil obras, isso é um convite a encher
 *  a busca do Google de fantasmas.
 *
 *  ═══ A CAUSA, QUE NÃO ERA ÓBVIA ═══
 *
 *  A pasta tinha um `loading.tsx`. Ele cria uma fronteira de streaming: o Next manda o
 *  cabeçalho `200` pela rede **antes** de a página resolver — e depois disso não há como
 *  voltar atrás e dizer 404. O esqueleto de carregamento estava, literalmente, custando
 *  o código de status.
 *
 *  A página do autor não tinha `loading.tsx`, e por isso sempre devolveu 404 direitinho.
 *  Dois arquivos ao lado um do outro, e um comportamento diferente.
 *
 *  ═══ A ESCOLHA ═══
 *
 *  O esqueleto saiu. Um esqueleto bonito por meio segundo não paga uma página em branco
 *  e um 200 mentiroso — e a primeira consulta desta página é uma busca por slug, com
 *  índice, que não é o que demora.
 * ════════════════════════════════════════════════════════════════════
 */
export default function NaoAchamos() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
      <ScreenHeader title="Não achamos este livro." />

      <p className="voice mt-6 max-w-prose text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
        Ou o endereço está errado, ou este livro nunca esteve aqui. O acervo do Gume é
        escolhido a mão, e ele ainda tem muito buraco.
      </p>

      <p className="mt-8 text-[15px] text-[var(--color-ink-soft)]">
        <Link
          href="/"
          className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
        >
          Procure pelo nome
        </Link>{" "}
        — e, se não encontrar, você mesmo pode cadastrar o livro. Leva quinze segundos, e
        ele fica para todo mundo.
      </p>
    </main>
  );
}

import Link from "next/link";
import { Package } from "lucide-react";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { Cover } from "@/components/cover";
import { getActorOrNull } from "@/lib/actor";
import { getColecao, contarColecao, getConjuntos } from "@/lib/copies";
import { ConjuntoCard } from "@/components/conjunto";
import { nomeDoAutor } from "@/lib/autores";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A COLEÇÃO: o que você TEM. Outra pergunta que a estante.
 *
 *  A estante responde "o que eu li". Esta responde "o que eu tenho", e as duas se
 *  cruzam sem se conter: dá para ter lido sem ter o livro (emprestado, biblioteca,
 *  vendido depois) e para ter sem nunca abrir.
 *
 *  Quem coleciona vive na segunda, e o app não tinha onde pôr isso: um livro comprado
 *  e nunca aberto virava "esperando" na prateleira, que é uma intenção de ler que a
 *  pessoa nunca teve.
 *
 *  ═══ ELA É SUA, E DE MAIS NINGUÉM ═══
 *
 *  Não existe a coleção de outra pessoa nesta rota, e isso é escolha e não descuido:
 *  "o que eu tenho guardado em casa" é outra coisa que "o que eu li". Quando alguém
 *  quiser mostrar a coleção, vai ser um botão que ela aperta. Ver lib/copies.ts.
 *
 *  ═══ O NÚMERO QUE IMPORTA ═══
 *
 *  "Tenho e ainda não li" é a única contagem desta tela, e é a pergunta de quem
 *  coleciona. Não há placar de quantos livros você tem: isso seria medir a pessoa
 *  pela pilha, e este app se recusa a ordenar gente por esforço.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function Colecao({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getActorOrNull();
  const params = await searchParams;
  const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const quero = um(params.ver) === "quero";

  if (!actor) {
    return (
      <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
        <ScreenHeader title="Coleção" />
        <div className="mt-10">
          <Empty>
            <Link href="/entrar" className="underline decoration-[var(--color-ink)] underline-offset-4">
              Entre
            </Link>{" "}
            para guardar os livros que você tem.
          </Empty>
        </div>
      </main>
    );
  }

  const [itens, contas, conjuntos] = await Promise.all([
    getColecao(actor, quero ? "wanted" : "owned"),
    contarColecao(actor),
    // Os CONJUNTOS abrem a tela: é o que separa colecionar de possuir. Ver lib/copies.ts.
    getConjuntos(actor),
  ]);

  /**
   * Os avulsos são o que NÃO pertence a conjunto nenhum. Eles continuam na tela, sem
   * barra e sem cobrança: inventar um conjunto de um volume só para toda obra encheria
   * a tela de barras completas, que não dizem nada.
   */
  const emConjunto = new Set(conjuntos.flatMap((c) => c.volumes.map((v) => v.slug)));
  const avulsos = itens.filter((i) => !emConjunto.has(i.slug));

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      <ScreenHeader title="Coleção" meta={["o que você tem", "ter não é ler"]} />

      <nav className="mt-8 flex flex-wrap gap-2">
        {[
          { on: !quero, href: "/colecao", label: `tenho (${contas.tenho})` },
          { on: quero, href: "/colecao?ver=quero", label: `quero ter (${contas.quero})` },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            aria-current={a.on ? "page" : undefined}
            className={[
              "pill px-4 py-2 text-[14px] transition-colors",
              a.on
                ? "afiado font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            {a.label}
          </Link>
        ))}
      </nav>

      {/* A única contagem da tela, e ela é a pergunta de quem coleciona. */}
      {!quero && contas.tenhoENaoLi > 0 && (
        <p className="mt-6 text-[15px] text-[var(--color-ink-soft)]">
          {contas.tenhoENaoLi === 1
            ? "Um livro seu ainda esperando ser aberto."
            : `${contas.tenhoENaoLi} livros seus ainda esperando serem abertos.`}
        </p>
      )}

      {/* ═══ OS CONJUNTOS PRIMEIRO ═══
          A estante conta livros lidos; a coleção conta CONJUNTOS. "4 de 14" é a
          gramática de quem coleciona, e é ela que precisa abrir a tela. */}
      {!quero && conjuntos.length > 0 && (
        <div className="mt-8 flex flex-col gap-5">
          {conjuntos.map((c) => (
            <ConjuntoCard key={c.id} c={c} />
          ))}
        </div>
      )}

      {!quero && conjuntos.length > 0 && avulsos.length > 0 && (
        <h2 className="mt-10 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          fora de conjunto
        </h2>
      )}

      {itens.length === 0 ? (
        <div className="mt-10">
          <Empty>
            {quero
              ? "Nenhum livro na lista de desejo ainda. Marque “quero ter” na página de um livro."
              : "Nenhum livro marcado como seu ainda. Marque “tenho” na página de um livro."}
          </Empty>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(quero ? itens : avulsos).map((i) => (
            <li key={i.slug}>
              <Link href={`/livro/${i.slug}`} className="card group flex h-full flex-col p-5">
                <span className="cover-lift block w-[58%] self-center">
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

                {/* Ter e não ter lido é o estado que esta tela existe para mostrar. */}
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
      )}
    </main>
  );
}

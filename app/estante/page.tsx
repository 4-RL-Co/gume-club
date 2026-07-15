import Link from "next/link";
import { getViewer, getShelfOwner, getUser } from "@/lib/viewer";
import { getShelf, getShelfCounts, getShelfYears } from "@/lib/shelf";
import { getFriendRatings } from "@/lib/ratings";
import { getCollections } from "@/lib/curation";
import { readParams } from "@/lib/shelf-view";
import { ShelfControls } from "@/components/shelf-controls";
import { ShelfSelect } from "@/components/shelf-select";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { Notice } from "@/components/notice";
import { ShelfTabs } from "@/components/shelf-tabs";

export const dynamic = "force-dynamic";

export default async function Estante({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { filter, sort, view, direcao, ano } = readParams(await searchParams);
  const viewer = await getViewer();

  // Logged in, you are looking at your own shelf. Logged out, at the founding
  // reader's, and visibleTo() shows you only its public rows.
  const owner = viewer ? await getUser(viewer.id) : await getShelfOwner();

  if (!owner) {
    return <Empty>Ainda não tem ninguém por aqui.</Empty>;
  }

  const mine = viewer?.id === owner.id;

  // Both of these filter visibility in SQL, through visibleTo(). See SECURITY.md.
  const [books, counts, anos] = await Promise.all([
    getShelf(viewer, owner.id, { filter, sort, direcao, ano }),
    getShelfCounts(viewer, owner.id),
    // Os anos em que ela terminou ou largou alguma coisa. Só em "lidos" e
    // "abandonados": um livro esperando na estante não aconteceu em ano nenhum.
    getShelfYears(viewer, owner.id, filter),
  ]);

  // What the people you follow gave these books. One query for the whole shelf.
  const [opinions, shelves] = await Promise.all([
    getFriendRatings(viewer, books.map((b) => b.workId)),
    viewer ? getCollections(viewer, owner.id) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      <ScreenHeader
        title={
          mine
            ? "A estante é sua"
            : owner.displayName
              ? `A estante de ${owner.displayName}`
              : "A estante"
        }
        meta={[
          `${counts.tudo ?? 0} ${counts.tudo === 1 ? "livro" : "livros"}`,
          (counts.lidos ?? 0) > 0 && `${counts.lidos} lidos`,
          (counts.lendo ?? 0) > 0 && `${counts.lendo} lendo`,
          (counts.esperando ?? 0) > 0 && `${counts.esperando} esperando`,
        ]}
      />

      <ShelfTabs active="estante" />

      {/* Se você tinha nota em estrela, ela virou palavra, e quatro e quatro e meia
          viraram a mesma frase. Você fica sabendo. Perda silenciosa não é honesta. */}
      {mine && books.some((b) => b.rating !== null) && (
        <Notice id="notas-viraram-palavras">
          Suas notas viraram palavras. Onde havia estrelas agora está o que você achou:
          adorei, gostei, achei ok. Quatro estrelas e quatro e meia viraram a mesma frase,
          então alguma coisa se perdeu no caminho, e é justo você saber.
        </Notice>
      )}

      <ShelfControls
        filter={filter}
        sort={sort}
        view={view}
        direcao={direcao}
        ano={ano}
        anos={anos}
        counts={counts}
      />

      {books.length === 0 ? (
        /* ═══ TRAZER A ESTANTE MORA AQUI, E NÃO NO MENU ═══

           Era um item na barra lateral, discreto, ao lado de "Sobre". Importar não é um
           LUGAR: é uma coisa que se faz com a estante, e ela pertence à tela que a
           pessoa está olhando na hora em que precisa dela.

           E a hora em que ela precisa é esta: a estante vazia. Quem entra, vê o vazio,
           cadastra três livros à mão e não volta. Aqui o convite está na frente do
           problema, e não escondido num menu que ninguém abre duas vezes. */
        <Empty>
          {mine ? (
            <>
              Sua estante está vazia. Se você já tem uma lista em outro lugar,{" "}
              <Link
                href="/importar"
                className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
              >
                traga ela para cá
              </Link>
              . Ou procure um livro e comece por ele.
            </>
          ) : (
            "Nada nesta prateleira ainda."
          )}
        </Empty>
      ) : (
        <ShelfSelect books={books} view={view} mine={mine} opinions={opinions} shelves={shelves} />
      )}

      {/* Quem JÁ tem estante também traz mais livros — só não precisa que isso grite
          todo dia. Discreto, no fim, e sempre no mesmo lugar. */}
      {mine && books.length > 0 && (
        <p className="mt-12 text-[13px] text-[var(--color-ink-faint)]">
          <Link
            href="/importar"
            className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            Trazer mais livros de outro lugar
          </Link>
        </p>
      )}
    </main>
  );
}

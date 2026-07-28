import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { visibleTo } from "@/lib/authz";
import { getViewer } from "@/lib/viewer";
import { collections, collectionItems, works, authors, editions, libraryEntries, ownedCopies, ratings } from "@/lib/db/schema";
import { getFriendRatings } from "@/lib/ratings";
import type { ShelfBook } from "@/lib/shelf-view";
import { Share } from "@/components/share";
import { ScreenHeader } from "@/components/screen-header";
import { CoverWall } from "@/components/cover-wall";
import { Empty } from "@/components/empty";
import { ShelfSettings } from "@/components/shelf-settings";
import { Avatar } from "@/components/avatar";
import { GuardarEstante } from "@/components/guardar-estante";
import { OrganizarEstante } from "@/components/organizar-estante";
import { PorNaEstante } from "@/components/por-na-estante";
import { jaGuardei } from "@/lib/listas";
import { origemAceita } from "@/lib/imagens";

export const dynamic = "force-dynamic";

/**
 * A shelf the reader invented. Public or private, and the visibility rule is the
 * same one as everywhere else: visibleTo(), in SQL. A private shelf is a private
 * shelf, including the books on it.
 */
export default async function Estante({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();

  const [shelf] = await db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      description: collections.description,
      ranked: collections.ranked,
      coverWorkId: collections.coverWorkId,
      fotoUrl: collections.coverUrl,
      visibility: collections.visibility,
      userId: collections.userId,
      handle: sql<string>`(select u.handle from users u where u.id = ${collections.userId})`,
      donoNome: sql<string | null>`(select u.display_name from users u where u.id = ${collections.userId})`,
      donoFoto: sql<string | null>`(select u.image from users u where u.id = ${collections.userId})`,
    })
    .from(collections)
    .where(and(
      eq(collections.slug, slug),
      visibleTo(viewer, collections.userId, collections.visibility),
    ))
    .limit(1);

  if (!shelf) notFound();

  const mine = viewer?.id === shelf.userId;
  const guardada = !mine && viewer ? await jaGuardei(viewer, shelf.id) : false;

  const books = await db
    .select({
      workId: works.id,
      slug: works.slug,
      title: works.title,
      author: authors.name,
      nationality: authors.nationality,
      publisher: editions.publisher,
      format: editions.format,
      editionYear: editions.publishedYear,
      firstPublished: works.firstPublished,
      pageCount: editions.pageCount,
      coverUrl: editions.coverUrl,
      genre: works.genre,
      status: sql<string>`coalesce(${libraryEntries.status}::text, 'want_to_read')`,
      rating: ratings.value,
      acquiredNote: ownedCopies.acquiredNote,
      addedAt: collectionItems.addedAt,
    })
    .from(collectionItems)
    .innerJoin(works, eq(works.id, collectionItems.workId))
    .leftJoin(authors, eq(authors.id, works.authorId))
    .leftJoin(libraryEntries, and(
      eq(libraryEntries.workId, works.id),
      eq(libraryEntries.userId, shelf.userId),
    ))
    .leftJoin(ratings, and(
      eq(ratings.workId, works.id),
      eq(ratings.userId, shelf.userId),
      visibleTo(viewer, ratings.userId, ratings.visibility),
    ))
    .leftJoin(ownedCopies, and(
      eq(ownedCopies.workId, works.id),
      eq(ownedCopies.userId, shelf.userId),
    ))
    .leftJoin(editions, sql`${editions.id} = (
      select e2.id from editions e2 where e2.work_id = ${works.id}
      order by e2.created_at asc, e2.id asc limit 1)`)
    .where(eq(collectionItems.collectionId, shelf.id))
    .orderBy(collectionItems.position, collectionItems.addedAt);

  const opinions = await getFriendRatings(viewer, books.map((b) => b.workId));

  /**
   * AS TAGS DA ESTANTE, derivadas dos próprios livros: os gêneros que mais aparecem.
   * Ninguém digita tag (campo de tag livre é máquina de duplicata, como o nome de
   * estante já ensinou); a curadoria se descreve sozinha pelo que tem dentro.
   */
  const generos = [...books.reduce((m, b) => {
    if (b.genre) m.set(b.genre, (m.get(b.genre) ?? 0) + 1);
    return m;
  }, new Map<string, number>())]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);

  /** A capa da estante: a ESCOLHIDA por quem montou, ou a do primeiro livro com capa.
      Ela vira a aura do topo, como na página do livro. Ver a migration 0053. */
  const capaDaEstante = [
    books.find((b) => b.workId === shelf.coverWorkId)?.coverUrl,
    ...books.map((b) => b.coverUrl),
  ].find((u) => u && origemAceita(u)) ?? null;

  return (
    <main className="relative mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      {/* A aura do topo: a FOTO subida, se houver, senão a capa escolhida. */}
      {(shelf.fotoUrl ?? capaDaEstante) && origemAceita(shelf.fotoUrl ?? capaDaEstante!) && (
        <div className="aura-capa" aria-hidden>
          <Image src={shelf.fotoUrl ?? capaDaEstante!} alt="" fill sizes="128px" quality={30} className="object-cover" />
        </div>
      )}

      {/* ═══ O PANO DE FUNDO, como as listas do Letterboxd ═══

          A foto que quem montou subiu, larga, morrendo suave para o fundo da página
          (máscara em dois eixos: sem borda dura em lugar nenhum). Ela é CLIMA e
          moldura; o título continua sendo o dono da página. */}
      {shelf.fotoUrl && origemAceita(shelf.fotoUrl) && (
        <div aria-hidden className="relative -mx-6 -mb-10 h-56 overflow-hidden sm:-mx-10 sm:h-72">
          <Image
            src={shelf.fotoUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{
              maskImage: "linear-gradient(to bottom, black 35%, transparent 96%), linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, black 35%, transparent 96%)",
              maskComposite: "intersect",
            }}
          />
        </div>
      )}

      <ScreenHeader
        title={shelf.name}
        meta={[
          `${books.length} ${books.length === 1 ? "livro" : "livros"}`,
          shelf.visibility === "private" ? "só sua" : `de @${shelf.handle}`,
        ]}
      >
        <span className="flex items-center gap-5">
          {/* Estante privada não ganha botão de compartilhar: o link não abriria
              para quem recebesse, e um botão que promete o que não cumpre é pior
              que nenhum botão. */}
          {shelf.visibility !== "private" && <Share titulo={shelf.name} />}
          {/* GUARDAR é gesto de visita: a sua estante já é sua. E ninguém conta
              quantos guardaram, em tela nenhuma. Ver lib/listas.ts. */}
          {!mine && viewer && (
            <GuardarEstante slug={shelf.slug} collectionId={shelf.id} guardada={guardada} />
          )}
          {mine && (
            <ShelfSettings
              id={shelf.id}
              slug={shelf.slug}
              name={shelf.name}
              visibility={shelf.visibility}
              description={shelf.description}
              numerada={shelf.ranked}
              capaWorkId={shelf.coverWorkId}
              fotografada={Boolean(shelf.fotoUrl)}
              capas={books
                .filter((b) => b.coverUrl)
                .slice(0, 12)
                .map((b) => ({ workId: b.workId, title: b.title, coverUrl: b.coverUrl! }))}
            />
          )}
        </span>
      </ScreenHeader>

      {/* O ESPAÇO DE QUEM MONTOU: rosto e nome logo sob o título, porque uma estante
          montada é a assinatura de alguém, e não uma pasta anônima. */}
      {shelf.visibility !== "private" && (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href={`/@${shelf.handle}`}
            className="flex items-center gap-2.5 text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            <Avatar src={shelf.donoFoto} name={shelf.donoNome} handle={shelf.handle} size={26} />
            <span>
              montada por{" "}
              <span className="font-medium text-[var(--color-ink)]">
                {shelf.donoNome ?? shelf.handle}
              </span>
            </span>
          </Link>

          {/* As tags: os gêneros que a própria estante carrega. Ninguém digitou nada. */}
          {generos.map((g) => (
            <span
              key={g}
              className="pill border border-[var(--color-rule)] px-3 py-1 text-[12px] lowercase text-[var(--color-ink-faint)]"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      {/* A descrição, embaixo do nome: o recorte desta curadoria, nas palavras de quem
          montou. É o mesmo texto do card dela no perfil e no explorar. */}
      {shelf.description && (
        <p className="voice mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
          {shelf.description}
        </p>
      )}

      {/* ═══ A PORTA DE ENTRADA DA ESTANTE, E ELA VEM ANTES DE ORDENAR ═══

          "Não entendi como é a dinâmica de colar um livro ali." Dava para pôr livro
          numa estante, e só da página do livro; aqui só havia uma frase mandando a
          pessoa embora. Quem abre uma estante vazia quer encher ESTA estante.

          Fica acima do organizar de propósito: encher vem antes de ordenar, e o
          organizar só aparece com dois livros, então quem chega no zero via a tela
          mais vazia possível. Ver components/por-na-estante.tsx. */}
      {mine && <PorNaEstante slug={shelf.slug} collectionId={shelf.id} />}

      {mine && books.length > 1 && (
        <div className="mt-6">
          <OrganizarEstante
            slug={shelf.slug}
            collectionId={shelf.id}
            itens={books.map((b) => ({ workId: b.workId, title: b.title }))}
          />
        </div>
      )}

      {books.length === 0 ? (
        /* A frase dizia "abra um livro e coloque ele aqui", e mandava a pessoa para
           uma tela onde ela tinha que adivinhar o resto. Agora o campo está logo
           acima, então o estado vazio só precisa dizer o que ele é. Para quem está
           visitando a estante de outra pessoa, não há campo nenhum, e a frase
           também não promete um. */
        <Empty>
          {mine
            ? "Estante vazia. Procure um livro aqui em cima para começar."
            : "Estante vazia por enquanto."}
        </Empty>
      ) : (
        <CoverWall
          books={books.map((b): ShelfBook => ({
            ...b,
            honra: null,
            recomendadoPor: null,
            recomendadoPorNome: null,
            recomendadoPorFoto: null,
          }))}
          opinions={opinions}
          numerada={shelf.ranked}
        />
      )}
    </main>
  );
}

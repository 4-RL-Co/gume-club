import Link from "next/link";
import { getViewer, getShelfOwner, getUser } from "@/lib/viewer";
import { getShelf, getShelfCounts, getShelfYears } from "@/lib/shelf";
import { getFriendRatings } from "@/lib/ratings";
import { getCollections } from "@/lib/curation";
import { getColecao, contarColecao } from "@/lib/copies";
import { getActorOrNull } from "@/lib/actor";
import { readParams } from "@/lib/shelf-view";
import { ShelfControls } from "@/components/shelf-controls";
import { ShelfSelect } from "@/components/shelf-select";
import { ColecaoGrid } from "@/components/colecao-grid";
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
  const params = await searchParams;
  const { filter, sort, view, direcao, ano } = readParams(params);

  /**
   * ═══ "TENHO"/"QUERO TER" NÃO SÃO PRATELEIRA, SÃO POSSE ═══
   *
   * /colecao virou isto: "acho que dá pra ficar apenas mais uma aba dentro
   * da pagina /estante, ou até mesmo um filtro: tenho, aí filtra na
   * estante" — o dono. Mas posse (owned_copies) não é status de leitura
   * (library_entries) — dá pra TER um livro sem nunca ter marcado ele na
   * estante, e getShelf() nem soube procurar por isso. Por isso ?posse=
   * é um parâmetro À PARTE de ?filtro=, com sua PRÓPRIA busca
   * (getColecao/contarColecao, o mesmo par que /colecao já usava) — e não
   * mais um valor dentro de FILTERS fingindo ser prateleira.
   *
   * SÓ SEU: a coleção nunca teve visão de visitante (ver lib/copies.ts,
   * "ela é sua, e de mais ninguém") — um ?posse= na URL de outra pessoa
   * é ignorado.
   */
  const posseParam = Array.isArray(params.posse) ? params.posse[0] : params.posse;
  const posse = posseParam === "tenho" || posseParam === "quero" ? posseParam : null;

  /**
   * O RECORTE, EM TEXTO, para viajar até a página do livro e voltar de lá.
   *
   * É a URL desta tela sem o "?": quem estava nos lidos, ordenados por nota, volta para
   * os lidos ordenados por nota. Sem isto, o único caminho de volta era a seta do
   * navegador, e cada livro aberto custava o recorte inteiro. Ver BookCard.
   */
  // No recorte padrão ("todos", sem query) o texto sai vazio, e o livro aberto dali
  // ficava SEM caminho de volta enquanto todos os outros recortes tinham. O padrão
  // vira "filtro=tudo" de propósito: voltar existe de qualquer lugar da estante.
  const de = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v] as [string, string]] : [],
    ),
  ).toString() || "filtro=tudo";
  const viewer = await getViewer();

  // Logged in, you are looking at your own shelf. Logged out, at the founding
  // reader's, and visibleTo() shows you only its public rows.
  const owner = viewer ? await getUser(viewer.id) : await getShelfOwner();

  if (!owner) {
    return <Empty>Ainda não tem ninguém por aqui.</Empty>;
  }

  const mine = viewer?.id === owner.id;
  // Um ?posse= na estante de outra pessoa é ignorado — a coleção nunca teve
  // visão de visitante. Ver a nota lá em cima.
  const posseAtivo = mine ? posse : null;

  // Both of these filter visibility in SQL, through visibleTo(). See SECURITY.md.
  const [books, counts, anos] = await Promise.all([
    posseAtivo ? Promise.resolve([]) : getShelf(viewer, owner.id, { filter, sort, direcao, ano }),
    getShelfCounts(viewer, owner.id),
    // Os anos em que ela terminou ou largou alguma coisa. Só em "lidos" e
    // "abandonados": um livro esperando na estante não aconteceu em ano nenhum.
    posseAtivo ? Promise.resolve([]) : getShelfYears(viewer, owner.id, filter),
  ]);

  // What the people you follow gave these books. One query for the whole shelf.
  const [opinions, shelves] = await Promise.all([
    posseAtivo ? Promise.resolve({}) : getFriendRatings(viewer, books.map((b) => b.workId)),
    viewer && !posseAtivo ? getCollections(viewer, owner.id) : Promise.resolve([]),
  ]);

  /**
   * A COLEÇÃO — "tenho" e "quero ter" — busca só quando é sua a estante.
   * `contas` alimenta o NÚMERO nos dois pills mesmo fora do modo posse (a
   * mesma UX que /colecao já tinha: os dois números sempre visíveis, o tab
   * ativo é que muda); `itensDaColecao` só busca quando um dos dois está de
   * fato selecionado, pra não pagar a consulta em toda visita à estante normal.
   */
  const actor = mine ? await getActorOrNull() : null;
  const [contas, itensDaColecao] = await Promise.all([
    actor ? contarColecao(actor) : Promise.resolve({ tenho: 0, quero: 0, tenhoENaoLi: 0 }),
    posseAtivo && actor ? getColecao(actor, posseAtivo === "quero" ? "wanted" : "owned") : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
      <ScreenHeader
        title={
          posseAtivo === "tenho"
            ? "O que você tem"
            : posseAtivo === "quero"
              ? "O que você quer ter"
              : mine
                ? "A estante é sua"
                : owner.displayName
                  ? `A estante de ${owner.displayName}`
                  : "A estante"
        }
        meta={
          posseAtivo
            ? [
                posseAtivo === "tenho"
                  ? `${contas.tenho} ${contas.tenho === 1 ? "livro" : "livros"}`
                  : `${contas.quero} ${contas.quero === 1 ? "livro" : "livros"}`,
                posseAtivo === "tenho" && contas.tenhoENaoLi > 0 && `${contas.tenhoENaoLi} ainda não lidos`,
              ]
            : [
                `${counts.tudo ?? 0} ${counts.tudo === 1 ? "livro" : "livros"}`,
                (counts.lidos ?? 0) > 0 && `${counts.lidos} lidos`,
                (counts.lendo ?? 0) > 0 && `${counts.lendo} lendo`,
                (counts.esperando ?? 0) > 0 && `${counts.esperando} esperando`,
              ]
        }
      />

      <ShelfTabs active="estante" />

      {/* Se você tinha nota em estrela, ela virou palavra, e quatro e quatro e meia
          viraram a mesma frase. Você fica sabendo. Perda silenciosa não é honesta. */}
      {mine && !posseAtivo && books.some((b) => b.rating !== null) && (
        <Notice id="notas-viraram-palavras">
          Suas notas viraram palavras. Onde havia estrelas agora está o que você achou:
          adorei, gostei, achei ok. Quatro estrelas e quatro e meia viraram a mesma frase,
          então alguma coisa se perdeu no caminho, e é justo você saber.
        </Notice>
      )}

      {/* ═══ A LEITURA E A POSSE, LADO A LADO ═══
          "poderia ser apenas mais uma aba dentro da pagina /estante, ou até mesmo
          um filtro: tenho, aí filtra na estante" — o dono. Fica de fora de quem
          visita: a coleção nunca teve visão de visitante. */}
      {mine && (
        <div className="mt-6 flex flex-wrap gap-1.5">
          <Link
            href="/estante"
            aria-current={!posseAtivo ? "page" : undefined}
            className={[
              "pill px-4 py-2 text-[14px] transition-colors",
              !posseAtivo
                ? "afiado font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            o que eu li
          </Link>
          <Link
            href="/estante?posse=tenho"
            aria-current={posseAtivo === "tenho" ? "page" : undefined}
            className={[
              "pill px-4 py-2 text-[14px] transition-colors",
              posseAtivo === "tenho"
                ? "afiado font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            tenho ({contas.tenho})
          </Link>
          <Link
            href="/estante?posse=quero"
            aria-current={posseAtivo === "quero" ? "page" : undefined}
            className={[
              "pill px-4 py-2 text-[14px] transition-colors",
              posseAtivo === "quero"
                ? "afiado font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            quero ter ({contas.quero})
          </Link>
        </div>
      )}

      {posseAtivo ? (
        <ColecaoGrid itens={itensDaColecao} quero={posseAtivo === "quero"} />
      ) : (
        <>
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
                  . Ou{" "}
                  <Link
                    href="/buscar"
                    className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
                  >
                    procure um livro
                  </Link>{" "}
                  e comece por ele.
                </>
              ) : (
                "Nada nesta prateleira ainda."
              )}
            </Empty>
          ) : (
            <ShelfSelect books={books} view={view} mine={mine} opinions={opinions} shelves={shelves} de={de} />
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
        </>
      )}
    </main>
  );
}

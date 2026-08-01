import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ArrowLeft, BookOpenCheck, Bookmark, Heart, Crown } from "lucide-react";
import { Cover } from "@/components/cover";
import { Prosa } from "@/components/prosa";
import { Gaveta } from "@/components/gaveta";
import { Share } from "@/components/share";
import { BookPanel } from "@/components/book-panel";
import { Leituras } from "@/components/leituras";
import { resumoDasLeituras } from "@/lib/leituras-view";
import { getLeituras } from "@/lib/leituras";
import { AuthorPanel } from "@/components/author-panel";
import { Recommend } from "@/components/recommend";
import { BookTools, EscolherEdicao } from "@/components/book-tools";
import { Arrumar } from "@/components/arrumar";
import { QuandoLeu } from "@/components/quando-leu";
import { Correcao } from "@/components/correction";
import { CorrectionsLog } from "@/components/corrections-log";
import { getCorrecoes, souBibliotecario } from "@/lib/corrections";
import { getFollowees, getRecommender } from "@/lib/social";
import { getShelvesOf, getCollections } from "@/lib/curation";
import { getFriendRatings } from "@/lib/ratings";
import { getBook, slugAtualDe } from "@/lib/book";
import { AvatarLink } from "@/components/avatar";
import { RememberBook } from "@/components/remember-book";
import { VerdictOf } from "@/components/veredito";
import { getViewer } from "@/lib/viewer";
import { getActorOrNull } from "@/lib/actor";
import { FORMAT_LABEL } from "@/lib/shelf-view";
import { origemAceita } from "@/lib/imagens";
import { nomeDoAutor } from "@/lib/autores";

export const dynamic = "force-dynamic";

/**
 * The book page: a cover on the left, a STACK OF CARDS on the right, one card per
 * subject. Nothing floats loose on the page background.
 *
 * Before, this was a cover and some metadata adrift in two thirds of nothing. The
 * fix is not more spacing, it is containment: the book, the actions, the review,
 * the author and the editions are five different subjects, so they are five
 * different surfaces.
 *
 * The serif is for VOICE: the title, and nothing else on this page. "Companhia
 * das Letras" and "capa dura" are interface data, and setting data in a display
 * serif is what made this look amateur. Data is Inter.
 */
export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;

  /**
   * ═══ DE ONDE VOCÊ VEIO ═══
   *
   * A estante manda o recorte dela no link ("filtro=lidos&ordem=nota"), e aqui ele vira
   * um caminho de volta. Quem estava organizando os LIDOS abria um livro e só tinha a
   * seta do navegador para voltar — e a seta é do navegador, não do app: ela não sabe se
   * você entrou por ali ou caiu de um link de fora.
   *
   * É só a QUERY, e nunca uma URL inteira: o destino é sempre /estante, montado aqui.
   * Um "voltar" que aceitasse endereço de fora seria um pulo para qualquer site, escrito
   * por quem mandou o link. Ver BookCard.
   */
  const de = (await searchParams).de;
  const volta = typeof de === "string" && de ? `/estante?${de}` : null;
  const [viewer, actor] = await Promise.all([getViewer(), getActorOrNull()]);
  const book = await getBook(slug, viewer, actor?.id ?? null);

  /**
   * ════════════════════════════════════════════════════════════════════
   *  ANTES DE DIZER "NÃO ENCONTRADO", PERGUNTE SE ESTE ENDEREÇO JÁ EXISTIU.
   *
   *  O endereço de uma obra carrega o nome do autor, e autor errado acontece: a
   *  importação gravou a TRADUTORA da Metamorfose como autora, e o endereço nasceu
   *  `metamorfose-sheila-koerich`. Corrigir a ficha não conserta o endereço — e o
   *  endereço é a parte que as pessoas copiam e mandam uma para a outra.
   *
   *  Sem esta consulta, arrumar o autor QUEBRA todo link já compartilhado, e quem
   *  clica vê "não encontrado" sem entender por quê. Um link quebrado é pior que um
   *  link feio: o feio ainda leva ao livro.
   *
   *  `permanentRedirect` (308) e não `redirect` (307), porque a mudança é definitiva:
   *  o navegador e os buscadores passam a guardar o endereço novo em vez de bater
   *  aqui para sempre. É o que diz a verdade sobre o que aconteceu.
   *
   *  Só custa uma consulta a mais no caminho do 404, que é o caminho raro.
   * ════════════════════════════════════════════════════════════════════
   */
  if (!book) {
    const agora = await slugAtualDe(slug);
    if (agora) permanentRedirect(`/livro/${agora}${volta ? `?de=${encodeURIComponent(de as string)}` : ""}`);
    notFound();
  }

  const [friends, recommender, shelves, todasAsEstantes, opinions] = await Promise.all([
    actor ? getFollowees(actor.id) : Promise.resolve([]),
    actor ? getRecommender(actor.id, book.workId) : Promise.resolve(null),
    /** As estantes suas em que ESTE livro já está. */
    actor ? getShelvesOf(actor.id, book.workId) : Promise.resolve([]),
    /**
     * E TODAS as suas estantes, para o painel poder OFERECÊ-LAS em vez de pedir que você
     * digite o nome delas.
     *
     * Digitar o nome de uma coisa que já existe é uma máquina de fazer duplicata: "para
     * reler" e "pra reler" viram duas estantes, e a pessoa só descobre quando a barra
     * lateral está cheia de quase-iguais. Ver components/book-panel.tsx.
     */
    actor ? getCollections(viewer, actor.id) : Promise.resolve([]),
    getFriendRatings(viewer, [book.workId]),
  ]);

  const opinion = opinions[book.workId];

  // O histórico é PÚBLICO: é ele, e não uma permissão, que torna vandalismo caro.
  // O histórico é PÚBLICO: é ele, e não uma permissão, que torna vandalismo caro.
  // O histórico é PÚBLICO: é ele, e não uma permissão, que torna vandalismo caro.
  //
  // A cópia de papel saiu daqui: "de onde veio esse livro" mora numa gaveta dentro do
  // painel, e ele lê a nota direto de `book.mine`. Doar, trocar e emprestar foram
  // removidos do app (migration 0046).
  const [correcoes, bibliotecario, comunidade] = await Promise.all([
    getCorrecoes([book.workId, ...book.editions.map((e) => e.id)]),
    souBibliotecario(viewer),
    /**
     * O LIVRO NA COMUNIDADE, em uma consulta: quantos leram, em quantas estantes
     * montadas ele está, quantos gostaram ou adoraram, e a posição nos queridinhos
     * quando ele está no top 100.
     *
     * Tudo contagem sobre um LIVRO, nunca sobre gente (curadoria fala de gosto;
     * placar falaria de esforço).
     *
     * ═══ A REGRA DE VISIBILIDADE MUDOU, E ELA MORA EM lib/queridinhos.ts ═══
     *
     * VEREDITO (adorei, gostei) conta pública OU privada; ESTANTE (leram, em
     * quantas) só conta pública. O porquê está inteiro no cabeçalho daquele
     * arquivo, com o custo de privacidade escrito em voz alta.
     *
     * As duas telas TÊM que usar a mesma régua. Se a de lá contar privado e a
     * daqui não, a coroa desta página aparece num livro que a lista de lá põe em
     * outro lugar, e o leitor vê o app discordando de si mesmo. `lib/queridinhos.sql.test.ts`
     * compara as duas e quebra o build se elas divergirem.
     */
    db
      .execute<{ leram: number; estantes: number; gostaram: number; posicao: number | null }>(sql`
        with publico as (
          -- GOSTEI OU ADOREI, e é o mesmo voto que ordena /queridinhos. Era só
          -- "adorei" (value = 5) aqui e na lista, enquanto as duas telas imprimiam
          -- "gostaram ou adoraram": ordenavam por um número que não mostravam.
          -- Agora o número da tela É o número da posição. Ver lib/queridinhos.ts.
          select r.work_id, count(*) filter (where r.value >= 4)::int as gostaram
            from ratings r
            join users u on u.id = r.user_id
           where u.deleted_at is null and u.banned_at is null
           group by r.work_id
        )
        select
          (select count(*)::int from library_entries le
             join users u on u.id = le.user_id
            where le.work_id = ${book.workId}::uuid
              and le.status = 'read'
              and le.visibility = 'public'
              and u.deleted_at is null and u.banned_at is null) as leram,
          -- EM QUANTAS ESTANTES: gente com o livro na PRÓPRIA estante (qualquer
          -- status: lido, lendo, esperando, largado) mais quem o pôs numa estante
          -- montada. Estar na estante é estar na estante, e o status é detalhe.
          (select count(distinct dono)::int from (
             select le.user_id as dono from library_entries le
               join users u on u.id = le.user_id
              where le.work_id = ${book.workId}::uuid
                and le.visibility = 'public'
                and u.deleted_at is null and u.banned_at is null
             union
             select c.user_id from collection_items ci
               join collections c on c.id = ci.collection_id
               join users u on u.id = c.user_id
              where ci.work_id = ${book.workId}::uuid
                and c.visibility = 'public'
                and u.deleted_at is null and u.banned_at is null
           ) donos) as estantes,
          -- O número impresso na tela sai da MESMA conta que dá a posição. Ele era
          -- uma consulta à parte, e foi essa separação que deixou os dois discordarem.
          coalesce((select p.gostaram from publico p where p.work_id = ${book.workId}::uuid), 0) as gostaram,
          (select case when meu.gostaram is null or meu.gostaram = 0 then null else (
             select 1 + count(*)::int from publico p
               join works w2 on w2.id = p.work_id
              where p.gostaram > meu.gostaram
                 or (p.gostaram = meu.gostaram and w2.title < (select w3.title from works w3 where w3.id = ${book.workId}::uuid))
           ) end
           from (select p2.gostaram from publico p2 where p2.work_id = ${book.workId}::uuid) meu) as posicao
      `)
      .then((r) => r[0] ?? { leram: 0, estantes: 0, gostaram: 0, posicao: null }),
  ]);

  /**
   * AS MINHAS LEITURAS deste livro, com as datas EDITÁVEIS.
   *
   * Só as minhas: corrigir a data de uma leitura é mexer na história de quem leu, e
   * quem lê o perfil de outra pessoa lê, e não escreve. A autorização real mora em
   * lib/leituras.ts, no servidor — `readings` não tem dono próprio, o dono está em
   * `library_entries`, e é lá que a checagem salta.
   */
  const leituras = actor ? await getLeituras(viewer, actor.id, book.workId) : [];

  /**
   * ════════════════════════════════════════════════════════════════════
   *  A CAPA É A DA SUA EDIÇÃO. E ELA NÃO ERA.
   *
   *  "Quando eu mudo qual edição é a minha, não muda a página/capa do livro."
   *
   *  Estava certo pela metade, que é o pior jeito de estar. Os DADOS já respeitavam a sua
   *  escolha (editora, ano, páginas, ISBN vinham da sua edição), e a CAPA era escolhida à
   *  parte: "a primeira edição que tiver capa". A sua não entrava na conta.
   *
   *  Então a pessoa escolhia a edição da Companhia das Letras, via "Companhia das Letras"
   *  escrito na ficha, e continuava olhando para a capa da Penguin. O app parecia ter
   *  ignorado o clique — e, na parte que ela olhava, tinha mesmo.
   *
   *  ═══ E POR QUE A ESCOLHA DE EDIÇÃO EXISTE ═══
   *
   *  Porque a OBRA é a ideia e a EDIÇÃO é o objeto (docs/schema.md, decisão 1). Dom
   *  Casmurro é um só; o exemplar na sua mão tem uma editora, um número de páginas, um
   *  tradutor e uma capa. É a confusão entre as duas coisas que apodreceu o catálogo do
   *  Goodreads, e é por isso que aqui elas são tabelas diferentes.
   *
   *  Escolher a sua edição é dizer QUAL objeto você tem. A partir daqui, a página mostra
   *  o seu.
   * ════════════════════════════════════════════════════════════════════
   */
  const minha = book.editions.find((e) => e.id === book.mine?.editionId);
  const comCapa = book.editions.find((e) => e.coverUrl);

  /** A ficha é a da sua edição, se você declarou uma. */
  const edition = minha ?? comCapa ?? book.editions[0];

  /**
   * ════════════════════════════════════════════════════════════════════
   *  A CAPA EMPRESTADA, E POR QUE ELA PRECISA DIZER QUE É EMPRESTADA.
   *
   *  "Mudei a edição do Dom Casmurro do Clube de Literatura Clássica para o do Instituto
   *   Nacional do Livro e todos os dados mudaram, menos a capa."
   *
   *  A edição do INL, de 1969, **não tem capa cadastrada**. Nenhuma das 44 edições de Dom
   *  Casmurro no acervo tem, exceto sete.
   *
   *  E a página fazia o que parecia gentil: emprestava a capa de outra edição, calada.
   *  Resultado: todos os dados da tela mudaram e a capa ficou igual — e o que a pessoa
   *  entende disso não é "esta edição não tem capa". É **"o app ignorou o meu clique"**.
   *  Ela clica de novo, desiste, e volta para a edição de antes. Que foi exatamente o que
   *  aconteceu.
   *
   *  ═══ EU ESCREVI ESSE EMPRÉSTIMO HOJE DE MANHÃ, E O ARGUMENTO ERA BOM ═══
   *
   *  "Mostrar um retângulo vazio seria trocar um erro por outro." Continua sendo verdade.
   *  O erro não era emprestar: era emprestar EM SILÊNCIO.
   *
   *  Uma tela que mostra uma coisa que não é a que você pediu, e não avisa, mente. Agora
   *  ela empresta e DIZ que emprestou — e o convite para arrumar vem junto, porque quem
   *  acabou de escolher a edição é exatamente quem tem o livro na mão.
   * ════════════════════════════════════════════════════════════════════
   */
  const cover = minha?.coverUrl ? minha : (comCapa ?? book.editions[0]);

  /** A capa na tela é de OUTRA edição, e não da que você escolheu. */
  const capaEmprestada = Boolean(minha && !minha.coverUrl && cover?.coverUrl);

  return (
    <main className="relative mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      {/* A AURA: a própria capa, estourada de desfoque, banhando o topo da página com a
          paleta DESTE livro. Clima, e não conteúdo: o texto passa por cima com o
          contraste de sempre. Ver .aura-capa em globals.css. */}
      {cover?.coverUrl && origemAceita(cover.coverUrl) && (
        <div className="aura-capa" aria-hidden>
          {/* A aura é borrão: 128px de fonte bastam, e o otimizador entrega isso
              em um punhado de kilobytes em vez da capa inteira de novo. */}
          <Image src={cover.coverUrl} alt="" fill sizes="128px" quality={30} className="object-cover" />
        </div>
      )}
      {volta && (
        <Link
          href={volta}
          className="mt-8 inline-flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)] sm:mt-10"
        >
          <ArrowLeft size={15} strokeWidth={1.5} />
          voltar para a estante
        </Link>
      )}
      <RememberBook slug={slug} title={book.title} />
      <div className="mt-16 grid gap-5 sm:mt-24 sm:grid-cols-12">
        {/* ── left: the cover, in a card of its own ─────────────────── */}
        <aside className="sm:col-span-4 lg:col-span-3">
          <div className="surface sticky top-6 p-6">
            <div className="cover-lift">
              <Cover title={book.title} author={book.author} src={cover?.coverUrl ?? null} prioridade />
            </div>

            {/* A CAPA EMPRESTADA DIZ QUE É EMPRESTADA.
                Sem esta frase, quem troca de edição vê os dados mudarem e a capa ficar
                igual, e conclui que o app ignorou o clique. Ver a nota lá em cima. */}
            {capaEmprestada && (
              <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-ink-faint)]">
                Esta capa é de outra edição. A sua ({edition?.publisher ?? "a que você escolheu"}
                {edition?.publishedYear ? `, ${edition.publishedYear}` : ""}) ainda não tem capa no
                Gume.{" "}
                <a
                  href="#ficha"
                  className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
                >
                  Você tem esse livro na mão: sugira a capa dele.
                </a>
              </p>
            )}

            {/**
              * ═══ ISTO ERA UMA NOTA INTERNA VAZANDO PARA O LEITOR ═══
              *
              * Dizia: "Este livro foi cadastrado à mão. Ainda vamos conferir os dados."
              *
              * Um leitor de fora leu e disse: "não sei se isso é pra mim ou é uma nota
              * interna de vocês — como usuário, me deixa desconfiado dos dados sem
              * necessidade."
              *
              * Ele tem razão. A frase fala do NOSSO processo ("vamos conferir"), e o que ela
              * consegue transmitir é: não confie no que você está lendo. Espalha dúvida sobre
              * a ficha inteira e não oferece nada em troca.
              *
              * A frase certa não fala de processo: fala do que a PESSOA pode fazer. A ficha
              * está incompleta, ela tem o livro na mão, e arrumar leva um minuto.
              */}
            {book.needsReview && (
              <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-ink-faint)]">
                A ficha deste livro veio incompleta.{" "}
                <a
                  href="#ficha"
                  className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
                >
                  Se você tem ele aí, arrume.
                </a>
              </p>
            )}
          </div>
        </aside>

        {/* ── right: a stack of cards, one subject each ─────────────── */}
        <div className="flex flex-col gap-5 sm:col-span-8 lg:col-span-9">
          <section className="surface relative p-6 sm:p-8">
            <h1 className="voice text-[34px] leading-[1.05] tracking-[-0.015em] sm:text-[44px]">
              {book.title}
            </h1>

            {/* O AUTOR É UM LUGAR, e o nome dele é a porta.
                Antes isto era texto morto: o leitor clicava no nome e não acontecia
                nada. A página do autor existia — com retrato, biografia e o resto da
                obra dele — e não tinha entrada. */}
            {/* Sem autor, a tela escreve "Desconhecido" em vez de deixar o espaço
                vazio: vazio lê como "faltou preencher", e para uma saga anônima isso
                é falso — a ficha está completa. Sem link, porque não há para onde ir.
                Ver nomeDoAutor(), em lib/autores.ts. */}
            <p className="mt-3 text-[15px] text-[var(--color-ink-soft)]">
              {book.author && book.authorSlug ? (
                <Link
                  href={`/autor/${book.authorSlug}`}
                  className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
                >
                  {book.author}
                </Link>
              ) : (
                nomeDoAutor(book.author)
              )}
            </p>

            <div className="mt-6">
              <Share titulo={book.title} texto={book.author ?? undefined} />
            </div>

            {/* ═══ A SINOPSE ═══
                O que o livro É, em um parágrafo. Não é resenha — resenha é o que o
                LEITOR escreve, e é o produto deste app. A sinopse existe para quem
                ainda não decidiu se quer ler, e sem ela a página de um livro mostrava
                título, autor e capa, e mais nada.

                Ela vem do dump da Open Library, cujo dado é CC0 — e por isso ela pode
                entrar no dataset aberto que o Gume promete publicar. Sinopse de loja é
                texto autoral, com direito, e fica de fora. Ver ai/PRD.md. */}
            <Prosa
              texto={book.description}
              fonte={book.descriptionSource}
              className="mt-8"
            />

            {/* The year of the WORK and the year of the EDITION are different
                facts, so they sit side by side and are labelled. */}
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              {/* A editora leva para a vitrine dela no explorar: o selo é um corredor
                  do catálogo, e um nome que abre uma sala vale mais que um nome parado. */}
              <Fact
                label="editora"
                value={edition?.publisher ?? null}
                href={edition?.publisher ? `/explorar?ver=editoras&qual=${encodeURIComponent(edition.publisher)}` : undefined}
              />
              <Fact label="ano da obra" value={book.firstPublished} />
              <Fact label="ano da edição" value={edition?.publishedYear ?? null} />
              <Fact
                label="formato"
                value={edition?.format ? FORMAT_LABEL[edition.format] ?? edition.format : null}
              />
              <Fact label="páginas" value={edition?.pageCount ?? null} />
              <Fact label="ISBN" value={edition?.isbn13 ?? null} />
            </dl>

            {/* ═══ O LIVRO NA COMUNIDADE, numa fila de ícones com cor ═══

                Quantos leram, em quantas estantes montadas ele mora, quantos gostaram
                ou adoraram, e a COROA quando ele está no top 100 dos queridinhos.

                As CORES nos ícones são exceção dirigida pelo dono (registrada no
                ai/DECISIONS.md), no espírito do Letterboxd: verde para leram, azul para
                estantes, laranja para o coração, dourado para a coroa. SÓ o ícone leva
                cor; o texto continua tinta. E a fila aparece sempre, com zero incluso:
                uma fila que some e volta conforme os números parece bug, não recusa. */}
            <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--color-rule)] pt-4 text-[13px] text-[var(--color-ink-soft)]">
              <span className="inline-flex items-center gap-1.5" title={`${comunidade.leram} ${comunidade.leram === 1 ? "pessoa leu" : "pessoas leram"}`}>
                <BookOpenCheck size={14} strokeWidth={1.75} aria-hidden style={{ color: "#4da76a" }} />
                <span className="tabular font-medium text-[var(--color-ink)]">{comunidade.leram}</span> leram
              </span>
              <span className="inline-flex items-center gap-1.5" title="em quantas estantes montadas este livro está">
                <Bookmark size={14} strokeWidth={1.75} aria-hidden style={{ color: "#4a9dc9" }} />
                em <span className="tabular font-medium text-[var(--color-ink)]">{comunidade.estantes}</span>{" "}
                {comunidade.estantes === 1 ? "estante" : "estantes"}
              </span>
              <span className="inline-flex items-center gap-1.5" title={`${comunidade.gostaram} gostaram ou adoraram este livro`}>
                <Heart size={14} strokeWidth={1.75} aria-hidden style={{ color: "#e8843c" }} />
                <span className="tabular font-medium text-[var(--color-ink)]">{comunidade.gostaram}</span> gostaram ou adoraram
              </span>
              {comunidade.posicao !== null && comunidade.posicao <= 100 && (
                <Link
                  href="/queridinhos"
                  className="inline-flex items-center gap-1.5 text-[var(--color-ink)] underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
                  title="entre os cem que a comunidade mais adorou"
                >
                  <Crown size={14} strokeWidth={1.75} aria-hidden style={{ color: "#d9a520" }} />
                  <span className="tabular font-medium">{comunidade.posicao}º</span> dos queridinhos
                </Link>
              )}
            </p>

            {/* ═══ O LÁPIS: arrumar este livro mora AQUI, no cartão onde o erro
                aparece. Era uma gaveta no porão da página com título e resumo; um
                erro de ficha se vê NA ficha, e é nela que se conserta. O histórico
                continua público (é ele que torna vandalismo caro). ═══ */}
            <Arrumar semCapa={!cover?.coverUrl}>
            {actor && edition ? (
              <>
                <Correcao
                  slug={slug}
                  workId={book.workId}
                  editionId={edition.id}
                  temOutrasEdicoes={book.editions.length > 1}
                  livro={{
                    title: book.title,
                    author: book.author,
                    publisher: edition.publisher,
                    firstPublished: book.firstPublished,
                    publishedYear: edition.publishedYear,
                    pageCount: edition.pageCount,
                    format: edition.format,
                    isbn13: edition.isbn13,
                    coverUrl: edition.coverUrl,
                  }}
                />

                <div id="ficha" className="mt-8 scroll-mt-6 border-t border-[var(--color-rule)] pt-6">
                  <Label>o que já foi arrumado</Label>
                  <div className="mt-4">
                    <CorrectionsLog slug={slug} correcoes={correcoes} souBibliotecario={bibliotecario} />
                  </div>
                </div>
              </>
            ) : (
              <CorrectionsLog slug={slug} correcoes={correcoes} souBibliotecario={bibliotecario} />
            )}
            </Arrumar>
          </section>

          {recommender && (
            <section className="surface flex gap-5 p-6 sm:p-7">
              <AvatarLink
                src={recommender.image}
                name={recommender.displayName}
                handle={recommender.handle}
                size={44}
              />
              <div className="min-w-0 flex-1">
                <Label>veio de alguém</Label>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                  <span className="font-medium text-[var(--color-ink)]">
                    {recommender.displayName ?? recommender.handle}
                  </span>{" "}
                  recomendou este livro para você{recommender.note ? ":" : "."}
                </p>
                {recommender.note && (
                  <p className="voice mt-3 text-[17px] leading-relaxed text-[var(--color-ink)]">
                    {recommender.note}
                  </p>
                )}
              </div>
            </section>
          )}

          {/*
            O que as pessoas que você SEGUE acharam, com a cara delas, em palavras.
            Sem média: nem a global (que é a nota do Goodreads, um veredito sem
            ninguém atrás para você discordar) nem a dos amigos, porque palavra não
            soma. "O Rui adorou e a Tereza gostou" é opinião de gente.
          */}
          {opinion && opinion.friends.length > 0 && (
            <section className="surface p-6 sm:p-7">
              <Label>quem você segue</Label>

              <ul className="mt-5 flex flex-col gap-3">
                {opinion.friends.map((f) => (
                  <li key={f.handle} className="flex items-center gap-3">
                    <AvatarLink src={f.image} name={f.name} handle={f.handle} size={28} />
                    <a href={`/@${f.handle}`} className="min-w-0 flex-1 truncate hover:underline">
                      <VerdictOf name={f.name ?? f.handle} value={f.value} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {actor ? (
            <>
              <BookPanel
                book={book}
                slug={slug}
                shelves={shelves}
                todas={todasAsEstantes.map((e) => e.name)}
              />

              {/* QUANDO você leu, em UMA LINHA discreta, encostada no painel: o resumo
                  em itálico e um "ajustar" que abre o editor ali mesmo. Já foi cartão e
                  já foi gaveta; a resposta cabe em meia frase, e meia frase com moldura
                  própria ocupava o lugar de uma seção. */}
              {leituras.length > 0 && (
                <QuandoLeu resumo={resumoDasLeituras(leituras)}>
                  <Leituras leituras={leituras} slug={slug} />
                </QuandoLeu>
              )}

              {/* INDICAR MORA AQUI EM CIMA, junto das ações de toda hora. Ele vivia
                  lá embaixo, no porão das gavetas, e o dono não o achava: pôr um livro
                  na mão de alguém é o gesto mais social do app, e um gesto que ninguém
                  encontra não existe. Continua gaveta (abre num toque), mas na
                  prateleira de cima. */}
              {friends.length > 0 && (
                <Gaveta titulo="indicar este livro" resumo="para alguém que você segue">
                  <Recommend workId={book.workId} slug={slug} friends={friends} />
                </Gaveta>
              )}
            </>
          ) : (
            <section className="surface p-6">
              <p className="text-[14px] text-[var(--color-ink-soft)]">
                Entre para guardar este livro na estante, dar a sua palavra e escrever.
              </p>
            </section>
          )}

          {/* ═══ DAQUI PARA BAIXO, TUDO MORA EM GAVETA ═══

              Esta página tinha DOZE cartões empilhados. Cada um é útil, e juntos eram um
              formulário de cadastro — ninguém entra num app de leitura com vontade de
              preencher um cadastro.

              O que fica ABERTO é o que a pessoa faz toda vez: prateleira, nota, resenha,
              e quem escreveu o livro. O que ela faz uma vez na vida — a linhagem da
              cópia, o registro de correções, a lista das quarenta edições — abre com um
              toque, e diz o que tem dentro antes de abrir. Ver components/gaveta.tsx. */}

          {book.author && (
            <AuthorPanel
              name={book.author}
              slug={book.authorSlug}
              nationality={book.nationality}
              portraitUrl={book.authorImage}
              bio={book.authorBio}
              bioSource={book.authorBioSource}
            />
          )}

          {/* ═══ A CÓPIA DE PAPEL SAIU DAQUI ═══

              Doar, trocar e emprestar foram removidos do Gume (migration 0046). Aquilo
              empurrava o app para ser um lugar de TRANSAÇÃO entre pessoas — com contato,
              combinado e encontro — e trazia um peso de moderação mesmo quando dava certo.

              O que sobrou é "de onde veio esse livro", que é a HISTÓRIA de um exemplar, e
              não um anúncio. Ela mora numa gaveta dentro do painel. Ver lib/copies.ts. */}


          {/* ═══ AS EDIÇÕES E "QUAL É A MINHA" VIRARAM UMA COISA SÓ ═══

              Eram duas moradas para o mesmo assunto: a gaveta com a LISTA e, noutro
              cartão, o seletor. A pessoa abria a lista, via a dela marcada, e não
              entendia onde se trocava. Agora: com o livro na SUA estante, a gaveta É o
              seletor; de visita, ela é a lista. */}
          {book.editions.length > 1 && (
            <div id="edicoes" className="scroll-mt-6">
            <Gaveta
              titulo="edições"
              resumo={
                actor && book.mine?.status
                  ? `${book.editions.length} desta obra, e qual é a sua`
                  : `${book.editions.length} edições desta obra`
              }
            >
              {actor && book.mine?.status ? (
                <EscolherEdicao
                  slug={slug}
                  workId={book.workId}
                  onShelf
                  myEditionId={book.mine?.editionId ?? null}
                  editions={book.editions.map((e) => ({
                    id: e.id,
                    publisher: e.publisher,
                    year: e.publishedYear,
                    pages: e.pageCount,
                    isbn: e.isbn13,
                  }))}
                />
              ) : (
                <>
                  <ul className="flex flex-col gap-1">
                    {book.editions.slice(0, 8).map((e) => (
                      <li
                        key={e.id}
                        className={[
                          "tabular flex flex-wrap items-center gap-x-3 px-3 py-2 text-[14px]",
                          e.id === book.mine?.editionId
                            ? "surface-2 text-[var(--color-ink)]"
                            : "text-[var(--color-ink-soft)]",
                        ].join(" ")}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {e.publisher ?? "editora desconhecida"}
                          {e.publishedYear ? `, ${e.publishedYear}` : ""}
                        </span>
                        {e.pageCount && (
                          <span className="text-[var(--color-ink-faint)]">{e.pageCount} p.</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {book.editions.length > 8 && (
                    <p className="mt-3 text-[13px] text-[var(--color-ink-faint)]">
                      e mais {book.editions.length - 8}.
                    </p>
                  )}
                </>
              )}
            </Gaveta>
            </div>
          )}

          {actor && book.mine?.status && (
            <BookTools workId={book.workId} onShelf={Boolean(book.mine?.status)} />
          )}
        </div>
      </div>
    </main>
  );
}

/** A section label. Small caps, letterspaced, quiet. Never the serif. */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
      {children}
    </h2>
  );
}

/**
 * A fact. Inter, not the serif: "Companhia das Letras" is interface data, and
 * setting data in a display serif is exactly what made this look amateur.
 */
function Fact({ label, value, href }: { label: string; value: string | number | null; href?: string }) {
  if (value === null || value === "") return null;
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {label}
      </dt>
      <dd className="tabular mt-1.5 text-[15px] text-[var(--color-ink)]">
        {href ? (
          <Link href={href} className="underline decoration-[var(--color-rule)] underline-offset-4 transition-colors hover:decoration-[var(--color-ink)]">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

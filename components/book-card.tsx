import Link from "next/link";
import { Cover } from "@/components/cover";
import { tintaDeHonra, nomeDaHonra } from "@/lib/honras";
import { Verdict } from "@/components/veredito";
import { Avatar, AvatarStack } from "@/components/avatar";
import { STATUS_LABEL, type ShelfBook } from "@/lib/shelf-view";
import type { Opinion } from "@/lib/ratings";
import { theirs } from "@/lib/veredito";
import { nomeDoAutor } from "@/lib/autores";

/**
 * A book is a card, and the cover floats inside it.
 *
 * Before, the cover bled edge to edge in the grid with its title printed across
 * it, which made every book read as a paint swatch. Inside a card, with air
 * around it and a soft shadow under it, the same cover becomes an object sitting
 * on a surface. That is the whole difference, and it is a shadow and some
 * padding, not a feature.
 *
 * No status badge. Forty-four repetitions of "esperando" is texture, not
 * information, and the shelf you picked in the sidebar already told you. What
 * survives is a single dot, and only on hover: quiet enough to ignore, there
 * when the "tudo" view mixes the shelves together.
 *
 * Two things DO earn a permanent place: your star, and the faces of the people
 * you follow who also read it. A shelf that cannot show you what you thought of
 * your own books is a list of titles.
 */
export function BookCard({
  book,
  opinion,
  focused = false,
  de,
  numero = null,
}: {
  book: ShelfBook;
  opinion?: Opinion;
  /** Em foco pelo teclado: j e k andam por aqui, e o card precisa dizer onde você está. */
  focused?: boolean;
  /**
   * DE ONDE VOCÊ VEIO: a query da estante ("filtro=lidos&ordem=nota").
   *
   * Ela viaja no link para a página do livro saber para onde é "voltar". Sem isto, o
   * único caminho de volta era a seta do navegador — e quem estava organizando os LIDOS
   * caía na estante inteira de novo, e perdia o recorte a cada livro que abria.
   */
  de?: string;
  /**
   * A POSIÇÃO numa estante NUMERADA (1º, 2º, 3º). Só existe quando quem montou a
   * estante escolheu numerar: é a ordem de UMA curadoria, sobre LIVROS, e nunca um
   * placar de gente. Nulo em todo outro contexto.
   */
  numero?: number | null;
}) {
  const status = STATUS_LABEL[book.status] ?? book.status;

  /**
   * ════════════════════════════════════════════════════════════════════
   *  O LIVRO QUE TE FEZ SUBIR DE HONRA GANHA UMA MOLDURA.
   *
   *  Não é um troféu, e o desenho é o que garante isso: é um FIO da cor do degrau em
   *  volta da capa, e o nome só aparece quando o mouse passa por cima.
   *
   *  Um selo grande, com número e brilho, viraria um troféu — e troféu, colado numa
   *  capa, vira placar assim que duas estantes ficam lado a lado. O que a moldura diz é
   *  "foi este aqui", e não "eu li sessenta".
   *
   *  A cor vem de `tintaDeHonra`, que é a MESMA paleta da moldura do avatar: o anel de
   *  Platina no rosto de alguém e o fio de Platina numa capa são a mesma cor, e é isso
   *  que faz a pessoa entender o que está vendo sem ninguém explicar.
   * ════════════════════════════════════════════════════════════════════
   */
  const tinta = tintaDeHonra(book.honra);
  const honra = nomeDaHonra(book.honra);

  return (
    <li className="relative h-full" id={`livro-${book.workId}`}>
      {/* O NÚMERO da estante numerada, na serifa da voz. O TOP 3 é pódio de CURADORIA
          (livros escolhidos por uma pessoa, nunca gente ordenada), e o pódio se diz
          com tamanho e tinta cheia, não com ouro e prata: metal é a paleta que o
          design proíbe porque todo mundo lê troféu. O 1º é o maior, o 4º em diante
          é uma nota de rodapé. */}
      {numero !== null && (
        <span
          aria-hidden
          className={[
            "voice pointer-events-none absolute z-10 leading-none",
            numero === 1
              ? "left-3 top-1.5 text-[44px] font-medium text-[var(--color-ink)]"
              : numero === 2
                ? "left-3.5 top-2 text-[34px] font-medium text-[var(--color-ink)]"
                : numero === 3
                  ? "left-3.5 top-2.5 text-[28px] font-medium text-[var(--color-ink)]"
                  : "left-4 top-3 text-[20px] text-[var(--color-ink-faint)]",
          ].join(" ")}
          style={
            numero <= 3
              ? { textShadow: "0 1px 12px color-mix(in srgb, var(--color-canvas) 85%, transparent)" }
              : undefined
          }
        >
          {numero}
        </span>
      )}
      {/* ════════════════════════════════════════════════════════════════
          ═══ QUEM TE DEU ESTE LIVRO, NO CANTO DA CAPA ═══

          Um livro que veio de alguém é diferente de um livro que você achou sozinho, e
          a estante não contava essa diferença: a recomendação chegava e a procedência
          sumia. Agora o rosto de quem indicou fica na capa, e quem VISITA a estante
          também vê — foi para isso que a recomendação nasceu pública no feed.

          ═══ IRMÃO DO CARD, E NUNCA DENTRO DELE ═══

          O card inteiro é um link para o LIVRO. Este rosto é um link para a PESSOA, e
          dois destinos não cabem num link só: link dentro de link é HTML inválido, e o
          navegador resolve o conflito do jeito dele. Então ele mora fora do card, por
          cima, como irmão. É a mesma regra da tira de "amigos lendo".

          Só aparece quando existe recomendação, que é a minoria das linhas — e é isso
          que faz o rosto significar alguma coisa quando aparece.
          ════════════════════════════════════════════════════════════════ */}
      {book.recomendadoPor && (
        <Link
          href={`/@${book.recomendadoPor}`}
          title={`${book.recomendadoPorNome ?? book.recomendadoPor} indicou este livro`}
          aria-label={`${book.recomendadoPorNome ?? book.recomendadoPor} indicou este livro`}
          className="absolute left-3 top-3 z-10 rounded-full ring-2 ring-[var(--surface-1)] transition-transform hover:scale-110"
        >
          <Avatar
            src={book.recomendadoPorFoto}
            name={book.recomendadoPorNome}
            handle={book.recomendadoPor}
            size={26}
          />
        </Link>
      )}

      {/* h-full so a one-line title and a two-line title still bottom out level:
          a ragged baseline across a row reads as a bug, not as rhythm. */}
      <Link
        /* A ORIGEM VIAJA NO LINK. Ver o "voltar" em app/livro/[slug]/page.tsx. */
        href={de ? `/livro/${book.slug}?de=${encodeURIComponent(de)}` : `/livro/${book.slug}`}
        className={[
          "card group relative flex h-full flex-col items-center p-6 text-center sm:p-7",
          focused ? "ring-1 ring-[var(--color-accent)]" : "",
        ].join(" ")}
      >
        {/* The dot says which shelf, without a word of chrome on the resting state. */}
        <span
          aria-hidden
          className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-[var(--color-ink-faint)] opacity-0 transition-opacity group-hover:opacity-70"
        />
        <span className="sr-only">{status}</span>

        <span
          className="cover-lift relative block w-[58%]"
          style={
            tinta
              ? {
                  // O fio, e a luz baixinha por baixo dele. É tudo.
                  outline: `1.5px solid ${tinta.de}`,
                  outlineOffset: "3px",
                  borderRadius: "var(--radius-cover)",

                  /**
                   * E o ÚLTIMO DEGRAU brilha, como brilha na moldura do rosto.
                   *
                   * O Gume e a Katana liam como prata: dois acromáticos num fio fino são a
                   * mesma coisa para o olho. O topo deixou de ser "o mais claro" e passou a
                   * ser "o que emite luz" (ver lib/paleta.ts) — e se a capa não brilhasse
                   * junto, o livro que te levou ao topo pareceria o livro que te levou à
                   * prata. A mesma honra tem que se parecer consigo mesma nos dois lugares.
                   */
                  boxShadow: tinta.aura
                    ? `0 0 26px 2px color-mix(in srgb, ${tinta.aura} 45%, transparent), ` +
                      `0 0 9px 0 color-mix(in srgb, ${tinta.aura} 80%, transparent)`
                    : `0 0 14px -4px ${tinta.de}`,
                }
              : undefined
          }
        >
          <Cover title={book.title} author={book.author} src={book.coverUrl} />
        </span>

        {honra && (
          <span
            className="mt-4 text-[11px] uppercase tracking-[0.14em] opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: tinta?.de }}
          >
            {/* O que a moldura quer dizer, em quatro palavras, e só quando perguntam. */}
            te levou a {honra}
          </span>
        )}

        <span className="voice mt-6 line-clamp-2 text-[15px] leading-snug text-[var(--color-ink)]">
          {book.title}
        </span>
        <span className="mt-1 line-clamp-1 text-[12px] text-[var(--color-ink-faint)]">
          {nomeDoAutor(book.author)}
        </span>

        {/* O que VOCÊ achou, em palavra, e as caras de quem também leu. Nenhum
            número: nem nota, nem média, nem contagem. mt-auto prende os dois no
            pé do card, para alinharem na linha em vez de boiarem sob títulos de
            alturas diferentes. */}
        {(book.rating !== null || opinion) && (
          <span className="mt-auto flex flex-col items-center gap-2.5 pt-4">
            {book.rating !== null && <Verdict value={book.rating} />}

            {opinion && opinion.friends.length > 0 && (
              <span
                title={opinion.friends
                  .map((f) => `${f.name ?? f.handle} ${theirs(f.value)}`)
                  .join(" · ")}
              >
                <AvatarStack people={opinion.friends} size={18} max={3} />
              </span>
            )}
          </span>
        )}
      </Link>
    </li>
  );
}

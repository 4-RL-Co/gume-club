import Link from "next/link";
import { BookOpen, BookCheck, Bookmark, Quote, PenLine, Send } from "lucide-react";
import { getFeed, type FeedItem } from "@/lib/social";
import { getCoroasDe } from "@/lib/escada";
import { NOME, type Honra } from "@/lib/honras";
import { Moldura } from "@/components/moldura";
import { Empty } from "@/components/empty";
import { Cover } from "@/components/cover";

import { theirs } from "@/lib/veredito";
import type { Viewer } from "@/lib/authz";
import { getBadgesOf } from "@/lib/badges";
import { Badges } from "@/components/badges";

/** "fulano terminou", "fulano avaliou". Pessoas, e não conteúdo. */
const SAID: Record<string, string> = {
  started: "começou",
  finished: "terminou",
  shelved: "colocou na estante",
  rated: "avaliou",
  reviewed: "resenhou",
  recommended: "recomendou",
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  O GLIFO DO VERBO. Um selo fraco no canto do card.
 *
 *  Numa coluna de trinta cards, todos com a mesma cara (rosto, capa,
 *  frase), o olho não distingue "começou" de "terminou" sem parar e ler
 *  a linha inteira. O glifo devolve a leitura de relance: dá para varrer
 *  o feed e SABER o que aconteceu, sem ler nada.
 *
 *  ═══ ELE É FRACO, E ISSO É O PONTO ═══
 *
 *  Opacidade baixa, sem fundo, sem círculo, sem cor. Ele é uma marca
 *  d'água, e não um selo de importância: no instante em que ele competir
 *  com a CAPA, o feed vira uma barra de ícones com livros de enfeite, e
 *  a capa é o conteúdo.
 *
 *  E todos os seis têm o MESMO tamanho e a MESMA opacidade. Nenhum verbo
 *  vale mais que outro: "terminou" não é uma conquista maior que
 *  "começou", e desenhar isso seria dizer o contrário.
 * ════════════════════════════════════════════════════════════════════
 */
const GLIFO: Record<string, typeof BookOpen> = {
  started: BookOpen, //      abriu o livro
  finished: BookCheck, //    fechou o livro
  shelved: Bookmark, //      guardou para depois
  rated: Quote, //           disse o que achou, em uma palavra
  reviewed: PenLine, //      escreveu
  recommended: Send, //      mandou para alguém: de PESSOA para pessoa
};

/** Iguais para os seis. Mexeu em um, disse que um verbo vale mais que outro. */
const GLIFO_TAMANHO = 17;
const GLIFO_TRACO = 1.5;

/**
 * O feed de quem você segue. Cronológico, sem algoritmo, sem ranking.
 *
 * Mora dentro de /pessoas agora, como uma aba. A tela é a mesma; o que mudou é
 * que ela parou de ser um destino solto na barra lateral e virou o que sempre
 * foi: uma das três formas de olhar para gente.
 */
export async function FeedList({ viewer, cursor }: { viewer: Viewer; cursor: string | null }) {
  const { items, nextCursor } = await getFeed(viewer, cursor);

  /**
   * As insígnias das pessoas do feed. PAPEL, e nunca número: saber que a correção
   * foi feita por um bibliotecário é útil; saber que ele fez quarenta e sete é
   * placar, e placar fica em /contribuidores.
   */
  const insignias = await getBadgesOf([...new Set(items.map((i) => i.actorId))]);

  if (items.length === 0) {
    return (
      <Empty>
        Silêncio. Siga alguém em{" "}
        <Link href="/pessoas?aba=explorar" className="underline decoration-[var(--color-ink)] underline-offset-4">
          explorar
        </Link>
        , e o que essa pessoa ler aparece aqui.
      </Empty>
    );
  }

  return (
    <>
      <FeedItems items={items} insignias={insignias} className="mt-8" />

      {/* Cursor, nunca OFFSET: atividade nova chegando no meio da rolagem faria um
          offset pular ou repetir linha. O id é uuidv7, então ele ordena por tempo. */}
      {nextCursor && (
        <div className="mt-12 text-center">
          <Link
            href={`/pessoas?aba=amigos&antes=${nextCursor}`}
            className="text-[13px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            mais antigos
          </Link>
        </div>
      )}
    </>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A LINHA DO FEED. Uma só, para o feed de amigos e para a PRAÇA.
 *
 *  A praça (o que está acontecendo entre gente que você não segue) usa exatamente
 *  esta lista. Não é economia de código: é a garantia de que o mesmo fato tem o mesmo
 *  peso nas duas telas.
 *
 *  Dois desenhos para a mesma coisa é como se começa, sem querer, a fazer uma delas
 *  parecer mais importante — e aí a pessoa aprende a postar para a que parece mais.
 * ════════════════════════════════════════════════════════════════════
 */
export async function FeedItems({
  items,
  insignias: dadas,
  className = "",
}: {
  items: FeedItem[];
  /** Já carregadas pelo feed de amigos. A praça deixa em branco, e a gente busca. */
  insignias?: Record<string, Awaited<ReturnType<typeof getBadgesOf>>[string]>;
  className?: string;
}) {
  const quem = [...new Set(items.map((i) => i.actorId))];

  const [insignias, coroas] = await Promise.all([
    dadas ? Promise.resolve(dadas) : getBadgesOf(quem),
    // UMA consulta para o feed inteiro, e não uma por linha. Ver lib/escada.ts.
    getCoroasDe(quem),
  ]);

  return (
    <ul className={`flex flex-col gap-4 ${className}`}>
      {items.map((it) => (
          <li key={it.id} className="surface relative flex gap-5 p-6 sm:p-7">
            {/* O selo do verbo. Canto de cima, à direita, e fraco: uma marca d'água,
                e nunca um selo de importância. Decorativo de propósito (a frase já
                diz o verbo, em português), então ele é escondido do leitor de tela:
                repetir "terminou" duas vezes para quem ouve é ruído, e não reforço. */}
            {GLIFO[it.verb] && (
              <span
                aria-hidden
                className="pointer-events-none absolute right-5 top-5 text-[var(--color-ink)] opacity-[0.14]"
              >
                {(() => {
                  const Selo = GLIFO[it.verb]!;
                  return <Selo size={GLIFO_TAMANHO} strokeWidth={GLIFO_TRACO} />;
                })()}
              </span>
            )}

            {/* A CARA, COM A MOLDURA DO ELO, e depois o livro. Pessoa redonda, livro
                retângulo — a forma sozinha diz qual é qual antes de você ler uma palavra.

                A moldura vem junto porque ela é a IDENTIDADE da pessoa: se ela só
                aparecesse no perfil, ninguém veria a de ninguém, e ela seria um enfeite
                que a pessoa põe para si mesma.

                O que NÃO vem junto é a barra: "faltam 3 livros para o Rui virar Prata"
                num feed é um app cutucando você a cutucar o Rui. Ver lib/escada.ts. */}
            <Link href={`/@${it.actorHandle}`} aria-label={it.actorName ?? it.actorHandle} className="shrink-0">
              <Moldura
                coroa={coroas[it.actorId] ?? null}
                src={it.actorImage}
                name={it.actorName}
                handle={it.actorHandle}
                size={48}
              />
            </Link>

            <Link href={`/livro/${it.workSlug}`} className="cover-lift w-12 shrink-0 sm:w-14">
              <Cover title={it.workTitle} author={it.author} src={it.coverUrl} />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                <Link href={`/@${it.actorHandle}`} className="font-medium text-[var(--color-ink)] hover:underline">
                  {it.actorName ?? it.actorHandle}
                </Link>
                <Badges badges={insignias[it.actorId] ?? []} className="ml-1.5" />{" "}
                {SAID[it.verb] ?? it.verb}
                {it.verb === "recommended" && it.targetHandle && (
                  <>
                    {" para "}
                    <Link href={`/@${it.targetHandle}`} className="hover:underline">
                      @{it.targetHandle}
                    </Link>
                  </>
                )}{" "}
                <Link href={`/livro/${it.workSlug}`} className="voice text-[16px] text-[var(--color-ink)] hover:underline">
                  {it.workTitle}
                </Link>
                {it.rating !== null && (
                  <span className="ml-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                    {theirs(it.rating)}
                  </span>
                )}

                {/* ═══ O DEGRAU, NA MESMA LINHA DO LIVRO ═══

                    "o Rui terminou Dom Casmurro · virou Prata."

                    Não é uma linha própria no feed, e é de propósito: "o Rui subiu para
                    Prata" não diz o que ele leu, não dá em que clicar, e no dia em que
                    três amigos subirem o feed vira um mural de parabéns.

                    Aqui o LIVRO fica com o crédito de ter levado a pessoa até lá — que é
                    o que aconteceu de verdade. */}
                {rotuloDaHonra(it.honra) && (
                  <span className="ml-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
                    · virou {rotuloDaHonra(it.honra)}
                  </span>
                )}
              </p>

              {it.note && (
                <p className="voice mt-2 text-[15px] leading-relaxed text-[var(--color-ink)]">{it.note}</p>
              )}

              <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                {new Date(it.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
              </p>
            </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * "prata" vira "Prata". "gume+3" vira "Gume +3".
 *
 * O banco guarda a CHAVE (e a estrela colada nela), e nunca o nome de tela: o nome muda,
 * e já mudou — os três últimos degraus da literatura eram "Mestre", "Grão-Mestre" e
 * "Desafiante" até anteontem. Uma linha de feed de março não pode envelhecer errado.
 */
function rotuloDaHonra(bruto: string | null): string | null {
  if (!bruto) return null;

  const [chave, estrelas] = bruto.split("+");
  const nome = NOME[chave as Honra];
  if (!nome) return null;

  return estrelas ? `${nome} +${estrelas}` : nome;
}

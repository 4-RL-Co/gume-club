import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getViewer } from "@/lib/viewer";
import { getOQueFalta } from "@/lib/gaps";
import { souBibliotecario, getFilaDeCapas } from "@/lib/corrections";
import { FALTA_NO_APP } from "@/lib/falta-no-app";
import { Cabecalho, Portas } from "@/components/casa-de-quem-faz";
import { Cover } from "@/components/cover";
import { FilaDeCapas } from "@/components/cover-queue";
import { CONVERSA } from "@/lib/onde";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE FALTA. E o recorte é UM SÓ: a sua estante.
 *
 *  "Contribua!" é um pedido que ninguém atende, porque ele não diz o que fazer. Um pedido
 *  concreto, sim: é assim que o OpenStreetMap cresce.
 *
 *  Esta tela já abriu com os totais do catálogo ("336.448 sem capa"), e eles saíram. A
 *  intenção era honestidade. O efeito era um muro: um número que ninguém consegue imaginar
 *  não é um pedido, é um aviso de que você não faz diferença.
 *
 *  ═══ O QUE MUDOU NO DESENHO, E POR QUÊ ═══
 *
 *  "Acho que as páginas quem faz e o que falta não estão bonitas, atraentes e com UX legal
 *   o suficiente."
 *
 *  Ele tem razão, e o problema não era decoração. Era ORDEM.
 *
 *  O TRABALHO ESTAVA ENTERRADO. A tela abria com cinco parágrafos explicando por que
 *  ajudar vale a pena, e só lá embaixo, depois de tudo, aparecia a única coisa acionável:
 *  os seus livros com a ficha incompleta. **Quem abre esta página já decidiu ajudar** — ela
 *  não precisa ser convencida, precisa saber ONDE. O convencimento vinha antes do trabalho,
 *  e o trabalho ficava para depois da rolagem.
 *
 *  E OS LIVROS NÃO TINHAM CAPA. Numa tela sobre capas que faltam, os livros apareciam como
 *  linhas de texto, com "falta capa" escrito numa etiqueta cinza do lado. Agora eles são
 *  uma GRADE DE CAPAS — e os que não têm capa nenhuma aparecem com a capa tipográfica do
 *  Gume, no meio dos que têm. **O buraco fica visível em vez de descrito.** Ninguém precisa
 *  ler uma etiqueta para entender o que está faltando: dá para VER.
 *
 *  A prosa não sumiu. Ela desceu para o pé da página, que é onde mora quem quer entender o
 *  porquê depois de já ter feito.
 *
 *  A fila de capas mora aqui também, e só bibliotecário a vê.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function OQueFalta() {
  const viewer = await getViewer();

  const [meus, bibliotecario] = await Promise.all([
    getOQueFalta(viewer),
    souBibliotecario(viewer),
  ]);

  const fila = bibliotecario ? await getFilaDeCapas(viewer) : [];

  return (
    <main className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
      <Cabecalho
        eyebrow="o que falta"
        titulo={<>O que <em className="italic text-[var(--color-ink-soft)]">falta</em>.</>}
        linha={
          <>
            O catálogo veio de um acervo aberto e chegou incompleto. Quem tem o livro na mão
            é quem pode consertar a ficha dele, e leva um minuto: é virar e olhar a lombada.
          </>
        }
      />

      {/**
       * ════════════════════════════════════════════════════════════════
       *  O TRABALHO, PRIMEIRO. E ele é o SEU trabalho, e não o do catálogo.
       *
       *  Estes são os livros que estão na sua casa. Você é a única pessoa no mundo que pode
       *  consertar essa ficha agora — e como as pessoas leem livros parecidos, arrumar a sua
       *  estante É arrumar o catálogo de todo mundo.
       * ════════════════════════════════════════════════════════════════
       */}
      {!viewer ? (
        <section className="surface mt-12 p-8 text-center sm:p-12">
          <p className="voice text-[22px] leading-snug text-[var(--color-ink)]">
            Entre para ver quais dos seus livros estão com a ficha incompleta.
          </p>
          <Link
            href="/entrar"
            className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-canvas)]"
          >
            Entrar
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
          </Link>
        </section>
      ) : meus.length === 0 ? (
        <section className="surface mt-12 p-8 text-center sm:p-12">
          <p className="voice text-[22px] leading-snug text-[var(--color-ink)]">
            A ficha de todos os seus livros está completa.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            Não tem nada para você fazer por aqui, e isso é uma boa notícia.
          </p>
        </section>
      ) : (
        <section className="mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
              na sua estante
            </h2>

            {/**
             * O NÚMERO É PEQUENO, E É POR ISSO QUE ELE FUNCIONA.
             *
             * "336.448 livros sem capa" é um muro: ninguém consegue imaginar aquilo, e a
             * conclusão é "eu não faço diferença". "Sete" é uma tarde. Este é o único
             * número que esta tela pode mostrar sem desanimar quem leu.
             */}
            <p className="text-[13px] text-[var(--color-ink-faint)]">
              {meus.length === 1
                ? "um livro seu, e ele está aí na sua casa"
                : `${meus.length} livros seus, e eles estão aí na sua casa`}
            </p>
          </div>

          {/**
           * A GRADE DE CAPAS. O buraco fica VISÍVEL.
           *
           * Os livros sem capa aparecem com a capa tipográfica do Gume, no meio dos que têm
           * capa de verdade. Não precisa ler etiqueta nenhuma para entender o que falta: o
           * olho vê. Era uma lista de texto com "falta capa" escrito do lado, numa tela cujo
           * assunto é exatamente a capa que falta.
           */}
          <ul className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5 lg:grid-cols-5">
            {meus.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/livro/${m.slug}`}
                  className="card group flex h-full flex-col p-4 transition-colors"
                >
                  <span className="cover-lift block">
                    <Cover title={m.title} author={m.author} src={m.coverUrl} />
                  </span>

                  <span className="voice mt-4 line-clamp-2 text-[14px] leading-snug text-[var(--color-ink)]">
                    {m.title}
                  </span>

                  {m.author && (
                    <span className="mt-1 line-clamp-1 text-[12px] text-[var(--color-ink-faint)]">
                      {m.author}
                    </span>
                  )}

                  {/* O QUE FALTA, em rosa: a cor de colaborar, e a única coisa colorida
                      do cartão. É ela que diz o que fazer, e ela não pode competir com
                      mais nada. */}
                  <span className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    {m.faltando.map((f) => (
                      <span
                        key={f}
                        className="pill border px-2.5 py-1 text-[11px] uppercase tracking-[0.1em]"
                        style={{
                          borderColor: "color-mix(in srgb, var(--color-colaborar) 35%, transparent)",
                          color: "var(--color-colaborar)",
                        }}
                      >
                        falta {f}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── A FILA DE CAPAS: só bibliotecário ─────────────────────────
          A capa é o único campo que um bibliotecário confere antes de entrar,
          porque é o único que aparece na tela de todo mundo. */}
      {bibliotecario && fila.length > 0 && (
        <section className="surface mt-12 p-7 sm:p-8">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            capas esperando você
          </h2>
          <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
            Alguém achou uma capa. A capa aparece na tela de todo mundo, então ela passa por você
            antes de entrar. Quando você aceita, o crédito fica com quem achou.
          </p>

          <div className="mt-7">
            <FilaDeCapas fila={fila} />
          </div>
        </section>
      )}

      {/* ── O QUE FALTA NO APP ──────────────────────────────────────────
          Depois dos livros, e não antes: quem não quer conferir lombada nenhuma ainda
          pode dizer o que o produto precisa ter. Apontar o que falta é trabalho, e é o
          mais barato de desprezar.

          Fala em PORTUGUÊS DE GENTE, e nunca em jargão: "baixar os seus livros num
          arquivo", e não "exportar em JSON". A lista mora em lib/falta-no-app.ts, e um
          teste quebra o build se esta tela falar como desenvolvedor. */}
      <section className="mt-16 border-t border-[var(--color-rule)] pt-12">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          no app
        </h2>

        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          O que o app ainda não faz. Sem prazo e sem promessa: é o que a gente sabe que falta,
          dito em voz alta.
        </p>

        <ul className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {FALTA_NO_APP.map((f) => (
            <li key={f.o_que} className="flex gap-3">
              {/* O tracinho rosa. Ele não é enfeite: é o que faz a lista parecer uma lista
                  de trabalho, e não um parágrafo picado. */}
              <span
                aria-hidden
                className="mt-2.5 h-px w-4 shrink-0"
                style={{ background: "var(--color-colaborar)" }}
              />
              <span className="min-w-0">
                <span className="voice block text-[16px] leading-snug text-[var(--color-ink)]">
                  {f.o_que}
                </span>
                <span className="mt-1.5 block text-[14px] leading-relaxed text-[var(--color-ink-faint)]">
                  {f.por_que}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-9 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Está faltando outra coisa? Diga. A conversa sobre o que vem depois acontece{" "}
          <a
            href={CONVERSA}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-[var(--color-ink)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            aqui
          </a>
          , e é lá que essa lista muda.
        </p>
      </section>

      {/* ── E O PORQUÊ, NO PÉ ──────────────────────────────────────────
          Quem quis ajudar já ajudou lá em cima. Isto é para quem quer entender depois.

          O CONVITE NÃO PODE SOAR COMO COBRANÇA: a pessoa está aqui pelos livros dela, e
          não para trabalhar de graça. Uma tela de "o que falta" que dá a entender o
          contrário faz a pessoa se sentir devendo, e ninguém volta para um lugar onde se
          sente devendo. */}
      <section className="mt-16 border-t border-[var(--color-rule)] pt-12">
        <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Nada disso é obrigação sua: se você só quiser usar o Gume e cuidar da sua estante, é
          para isso que ele existe. Mas ajudar aqui vale a pena, e não por caridade: um livro
          arrumado hoje chega arrumado para a próxima pessoa que pegar ele, e um dia essa pessoa
          é você. Ninguém dá conta do catálogo inteiro, e ninguém precisa.
        </p>

        <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-[var(--color-ink-faint)]">
          O que você arrumar fica gravado com o seu nome na página do livro. É por isso que não
          existe permissão a pedir a ninguém:{" "}
          <Link
            href="/contribuidores"
            className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            quem faz, aparece
          </Link>
          .
        </p>
      </section>

      <Portas aqui="o-que-falta" />
    </main>
  );
}

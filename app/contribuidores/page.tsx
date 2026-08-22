import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { getApoiadores, getCatalogo, getCodigo } from "@/lib/contributors";
import { apoioLigado } from "@/lib/stripe";
import { Cabecalho, Portas } from "@/components/casa-de-quem-faz";
import { Avatar } from "@/components/avatar";
import { Empty } from "@/components/empty";

export const dynamic = "force-dynamic";

/**
 * CONTRIBUIDORES. Duas listas, o mesmo peso visual, a mesma tipografia.
 *
 * Quem escreve o código, e quem cuida do catálogo. Sem hierarquia entre elas, e
 * isso é uma escolha de desenho tanto quanto de ideia: se uma das duas ganhasse
 * um título maior, uma borda, ou o topo da página, a página estaria dizendo qual
 * trabalho vale mais. Quem conserta uma capa vale o que vale quem faz um commit.
 *
 * É a ÚNICA tela do Gume com número de contribuição. Ele não viaja: nunca no
 * perfil, nunca no feed. Ver lib/contributors.ts e ai/DECISIONS.md.
 */
export default async function Contribuidores() {
  const [catalogo, apoiadores] = await Promise.all([getCatalogo(), getApoiadores()]);

  /**
   * Esta instância aceita apoio? Quem hospeda o próprio Gume não tem conta de pagamento,
   * e para ele a seção inteira não existe: um convite para apoiar que leva a uma página
   * que responde "não encontrado" é pior do que convite nenhum.
   */
  const podeApoiar = apoioLigado();

  /**
   * "Ninguém contribuiu" e "não consegui perguntar" são coisas OPOSTAS, e a tela precisa
   * dizer qual das duas é. O GitHub limita a 60 chamadas por hora sem token, e responde
   * 403 — e uma lista vazia aqui diria, com todas as letras, que ninguém escreveu uma
   * linha deste app. Ver AGENTS.md.
   */
  let codigo: Awaited<ReturnType<typeof getCodigo>> = [];
  let gitHubMudo = false;
  try {
    codigo = await getCodigo();
  } catch {
    gitHubMudo = true;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
      <Cabecalho
        eyebrow="quem faz"
        titulo={<>Quem <em className="italic text-[var(--color-ink-soft)]">faz</em> o Gume.</>}
        linha={<>
          Duas metades do mesmo trabalho. Quem escreve o código e quem cuida do catálogo
          estão na mesma página, com o mesmo tamanho, porque valem o mesmo.
        </>}
      />

      {/**
       * ════════════════════════════════════════════════════════════════
       *  AS PESSOAS SÃO CARTÕES, E NÃO LINHAS DE UMA TABELA.
       *
       *  "Acho que as páginas quem faz e o que falta não estão bonitas."
       *
       *  Esta era uma página de RECONHECIMENTO desenhada como uma planilha: duas colunas
       *  finas, avatares de 36 pixels, o nome, e um número alinhado à direita. Ela listava
       *  as pessoas com o mesmo cuidado com que um extrato lista débitos.
       *
       *  Reconhecimento tem que ser GENEROSO no espaço, ou não é reconhecimento. O rosto
       *  cresceu, o cartão tem ar em volta, e o número desceu para o pé — ele continua
       *  existindo (é a única tela do app que pode ter número de contribuição), e parou de
       *  ser a coisa mais alinhada do cartão.
       *
       *  O que NÃO mudou: as duas listas têm o mesmo peso visual. Se uma ganhasse um título
       *  maior, uma borda ou o topo da página, a página estaria dizendo qual trabalho vale
       *  mais. Quem conserta uma capa vale o que vale quem faz um commit.
       * ════════════════════════════════════════════════════════════════
       */}
      <div className="mt-12 grid gap-12 sm:grid-cols-2 sm:gap-10">
        {/* ── quem cuida do catálogo ──────────────────────────────── */}
        <section>
          <Titulo>quem cuida do catálogo</Titulo>

          {catalogo.length === 0 ? (
            <Empty>
              Ninguém corrigiu nada ainda. Abra um livro que você tem na mão e conserte a ficha: o
              seu nome fica.
            </Empty>
          ) : (
            <ul className="mt-6 flex flex-col gap-2.5">
              {catalogo.map((p) => (
                <li key={p.handle}>
                  <Link
                    href={`/@${p.handle}`}
                    className="surface surface-hover flex items-center gap-4 p-4"
                  >
                    <Avatar src={p.image} name={p.name} handle={p.handle} size={44} />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-[var(--color-ink)]">
                        {p.name ?? p.handle}
                      </span>

                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-[var(--color-ink-faint)]">
                        {/* ════════════════════════════════════════════════════
                            OS QUATRO TRABALHOS, SEPARADOS. E os números vivem AQUI,
                            e só aqui: nunca no perfil, nunca no feed.

                            Era só "correções". Quem TROUXE um livro que faltava no
                            acervo — o trabalho mais valioso para um catálogo — não
                            aparecia, quem mandou capa também não, e quem montou um
                            conjunto de edição ("Hellsing Deluxe tem 10 volumes")
                            desaparecia dentro do mesmo rótulo de quem só trocou um
                            ano de ficha.

                            Somar tudo num número esconderia a natureza do trabalho,
                            que é o que esta página existe para dar a ver. Cada um só
                            aparece se houver: uma linha de zeros não informa nada.
                            ════════════════════════════════════════════════════ */}
                        {p.livros > 0 && (
                          <span className="tabular">
                            {p.livros} {p.livros === 1 ? "livro" : "livros"}
                          </span>
                        )}
                        {p.capas > 0 && (
                          <>
                            {p.livros > 0 && <span aria-hidden>·</span>}
                            <span className="tabular">
                              {p.capas} {p.capas === 1 ? "capa" : "capas"}
                            </span>
                          </>
                        )}
                        {p.conjuntos > 0 && (
                          <>
                            {(p.livros > 0 || p.capas > 0) && <span aria-hidden>·</span>}
                            <span className="tabular">
                              {p.conjuntos} {p.conjuntos === 1 ? "coleção" : "coleções"}
                            </span>
                          </>
                        )}
                        {p.correcoes > 0 && (
                          <>
                            {(p.livros > 0 || p.capas > 0 || p.conjuntos > 0) && <span aria-hidden>·</span>}
                            <span className="tabular">
                              {p.correcoes} {p.correcoes === 1 ? "correção" : "correções"}
                            </span>
                          </>
                        )}

                        {p.librarian && (
                          <>
                            <span aria-hidden>·</span>
                            <span
                              className="uppercase tracking-[0.12em]"
                              style={{ color: "var(--color-colaborar)" }}
                            >
                              bibliotecário
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── quem escreve o código ───────────────────────────────── */}
        <section>
          <Titulo>quem escreve o código</Titulo>

          {/* Duas mensagens, porque são duas coisas diferentes. Uma lista vazia porque
              ninguém escreveu código é um fato; uma lista vazia porque o GitHub não
              respondeu é um problema NOSSO, e dizer "ninguém contribuiu" nesse caso é
              apagar o trabalho de quem contribuiu. Ver AGENTS.md. */}
          {gitHubMudo ? (
            <Empty>Não deu para consultar esta lista agora. Tente daqui a pouco.</Empty>
          ) : codigo.length === 0 ? (
            <Empty>Ninguém escreveu código ainda. Pode ser você.</Empty>
          ) : (
            <ul className="mt-6 flex flex-col gap-2.5">
              {codigo.map((p) => (
                <li key={p.login}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="surface surface-hover flex items-center gap-4 p-4"
                  >
                    <Avatar src={p.avatar} name={p.login} handle={p.login} size={44} />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-[var(--color-ink)]">
                        {p.login}
                      </span>
                      <span className="tabular mt-0.5 block text-[12px] text-[var(--color-ink-faint)]">
                        {p.commits} {p.commits === 1 ? "mudança" : "mudanças"}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/**
       * ERA UM BLOCO DE QUATRO PARÁGRAFOS, e virou um.
       *
       * "Quem mais cuidou aparece primeiro", "o número conta só o que ficou de pé", "quem
       * chegou primeiro aparece primeiro", "entrar nesta lista é mais fácil do que parece":
       * quatro frases, empilhadas, dizendo três coisas e meia. Uma parede de nota de rodapé
       * no fim de uma página de reconhecimento.
       */}
      <p className="mt-12 max-w-2xl text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
        Quem mais cuidou do catálogo aparece primeiro, e o número conta só as correções que
        ficaram de pé. Entrar nesta lista é mais fácil do que parece: comece pelos livros que
        já estão na sua estante, porque um conserto conta.
      </p>

      {/* ═══ QUEM PAGA A CONTA ═══

          Esta página já se recusou a mostrar isto. A regra era: "pagar não põe ninguém na
          lista de quem trabalhou", e o medo era de que ninguém mais soubesse, olhando,
          quem doou trabalho e quem doou dinheiro.

          O medo era de CONFUSÃO, e não de reconhecimento. Apoiar financeiramente é
          importante: sem quem paga a conta, o servidor cai e as duas listas acima param
          de existir.

          Então o reconhecimento acontece, e a confusão continua impossível: seção
          separada, título que diz o que é, e NENHUM NÚMERO. Não existe "quem apoiou
          mais". A ordem é de chegada, que é um fato sobre o tempo e não sobre o bolso. */}
      {/* ═══ A SEÇÃO NÃO DEPENDE MAIS DE A LISTA TER GENTE ═══

          Ela só aparecia com `apoiadores.length > 0`, e aparecer na lista virou uma
          escolha (opt-in): pagar não é consentir em ser publicado. Com a condição antiga,
          uma lista vazia levaria embora também o convite para apoiar, e a porta sumiria
          justamente enquanto ninguém tivesse entrado por ela.

          Agora a seção existe sempre que esta instância aceita apoio, e a lista é a parte
          opcional dela. */}
      {podeApoiar && (
        <section className="mt-20 border-t border-[var(--color-rule)] pt-12">
          <Titulo>quem paga a conta</Titulo>

          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            Servidor custa dinheiro, e o Gume não tem anúncio. Quem apoia paga a conta para
            que ele seja de graça para todo mundo, e isso não é menos do que escrever código: é o
            que mantém o código no ar.
          </p>

          {apoiadores.length > 0 && (
            <>
              <ul className="mt-8 flex flex-wrap gap-3">
                {apoiadores.map((p) => (
                  <li key={p.handle}>
                    <Link
                      href={`/@${p.handle}`}
                      className="surface surface-hover flex items-center gap-3 py-2.5 pl-2.5 pr-5"
                    >
                      <Avatar src={p.image} name={p.name} handle={p.handle} size={34} />
                      <span className="text-[15px] text-[var(--color-ink)]">
                        {p.name ?? p.handle}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-8 max-w-2xl text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
                Quem apoia e quis aparecer aqui, por ordem de chegada. Apoiar é sim ou não.
              </p>
            </>
          )}

          {/* ═══ ELE ERA UM CARTÃO CINZA, E SUMIA ═══

              Este é o único lugar do app que pede dinheiro, e ele estava desenhado como
              todo o resto: uma superfície neutra no meio de uma página de superfícies
              neutras. Uma porta que ninguém enxerga é uma porta fechada.

              Agora ele é sólido, na cor de "quem faz". É o único botão preenchido desta
              tela, e é de propósito: se houvesse dois, nenhum chamaria. */}
          <Link
            href="/apoiar"
            className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius-control)] px-5 py-3 text-[15px] font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--color-colaborar)", color: "#1a1a18" }}
          >
            <HeartHandshake size={17} strokeWidth={1.75} />
            Apoiar o Gume
          </Link>

          <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
            Você ganha uma insígnia no perfil, e o seu nome nesta lista se quiser. Nenhuma
            função do app fica atrás de pagamento.
          </p>
        </section>
      )}

      <Portas aqui="quem-faz" />

    </main>
  );
}

/**
 * Uma porta. O nome e uma frase — porque um link solto obriga a pessoa a clicar para
 * descobrir o que tem do outro lado, e clicar para descobrir é fazer ela pagar para ver.
 */

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
      {children}
    </h2>
  );
}

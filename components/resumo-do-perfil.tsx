import { Gaveta } from "@/components/gaveta";
import { Barras, Vereditos, Seculos } from "@/components/graficos-leitura";
import { MapaMundi } from "@/components/mapa-mundi";
import type { ResumoDoPerfil as Resumo } from "@/lib/stats";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O RESUMO DO PERFIL. Inspirado na barra lateral do yourgamerprofile.com,
 *  traduzido pelas regras de sempre.
 *
 *  Oito cartões — o que sobrevive da tradução, o que "abrir /estatisticas pra
 *  visitantes" trouxe depois, e o que ainda faltava:
 *   - o ano corrente (livros e páginas, reaproveitando a régua que a HONRA
 *     já usa — nunca tempo de leitura, nunca ofensiva);
 *   - distribuição de veredito (sem média, sem dígito de nota — só contagem
 *     por palavra, a mesma régua de /estatisticas);
 *   - gêneros mais lidos (a versão comportada do gráfico radar do print);
 *   - os autores mais lidos;
 *   - quem publica o que a pessoa lê (editoras);
 *   - de onde vêm os autores, num MAPA MÚNDI (components/mapa-mundi.tsx —
 *     "em países, pq não fazemos um mapa mundi com um heatmap?", o dono);
 *   - papel ou tela (formato);
 *   - o século das obras.
 *
 *  Tudo isso é o "recorte curador" que /estatisticas nunca abriu pra
 *  visitante: veredito, gênero, autor, editora, nacionalidade, formato e
 *  século são GOSTO, não posse — a mesma linha que separa "e a comunidade" do
 *  resto daquela página. Quantos livros na estante e a paciência ficam de
 *  fora, e ficam só na tela privada. Ver lib/stats.ts, getResumoDoPerfil().
 *
 *  ═══ E AGORA MORA NUMA GAVETA ═══
 *
 *  "os stats tem que ser um lugar que tu clica e vê, se não o perfil vai
 *  ficar gigante novamente" — o dono, depois de ver oito cartões chegando.
 *  Mesma Gaveta que já esconde o que é raro na página de um livro
 *  (components/gaveta.tsx): fechada por padrão, com o número que mais
 *  importa (o ano corrente) já visível no resumo de fora, sem precisar abrir
 *  para saber se vale a pena abrir.
 *
 *  O que NÃO traduz, de propósito: contador de seguidores/curtida (README:
 *  "sem contador de seguidores") e o mapa de atividade estilo GitHub — perto
 *  demais de "ofensiva" (streak), que o README também recusa.
 * ════════════════════════════════════════════════════════════════════
 */
export function ResumoDoPerfil({ resumo, primeiroNome, mine }: { resumo: Resumo; primeiroNome: string; mine: boolean }) {
  const {
    verdicts, genres, nationalities, formats, authors, publishers, centuries, anoCorrente,
  } = resumo;
  const totalVerdicts = verdicts.reduce((s, v) => s + v.n, 0);

  if (
    totalVerdicts === 0 && genres.length === 0 && nationalities.length === 0 &&
    formats.length === 0 && authors.length === 0 && publishers.length === 0 &&
    centuries.length === 0 && anoCorrente.livros === 0
  ) return null;

  const resumoDaGaveta =
    anoCorrente.livros > 0
      ? `${anoCorrente.livros} ${anoCorrente.livros === 1 ? "livro" : "livros"} em ${anoCorrente.ano}`
      : totalVerdicts > 0
        ? `${totalVerdicts} ${totalVerdicts === 1 ? "livro avaliado" : "livros avaliados"}`
        : null;

  return (
    <div className="mt-8">
      <Gaveta titulo={mine ? "as suas estatísticas" : `as estatísticas de ${primeiroNome}`} resumo={resumoDaGaveta}>
        <div className="grid gap-5 sm:grid-cols-3">
          {/* ═══ O NÚMERO GRANDE, E NÃO UMA FRASE PERDIDA NO ALTO DO CARTÃO ═══
              Era uma linha de texto só, do tamanho de qualquer parágrafo, boiando no topo
              de um cartão do tamanho dos vizinhos (que têm cinco barras cada) — sobrava
              vazio embaixo. docs/design.md já reserva a serifa de display para "número
              grande" (é a mesma escolha da home, em Numero()); aqui ela ganha o mesmo
              tratamento, e o bloco centraliza no espaço que o grid dá ao cartão — o que
              só existe em telas largas, onde os três cartões dividem uma linha; numa
              coluna só (mobile) cada cartão já tem a altura do próprio conteúdo, e o
              `justify-center` não move nada. */}
          {anoCorrente.livros > 0 && (
            <section className="surface flex flex-col p-6">
              <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                {anoCorrente.ano}
              </h2>

              <div className="mt-5 flex flex-1 flex-col justify-center gap-1.5">
                <span className="voice tabular text-[40px] leading-none text-[var(--color-ink)]">
                  {anoCorrente.livros}
                </span>
                <span className="text-[13px] text-[var(--color-ink-soft)]">
                  {anoCorrente.livros === 1 ? "livro terminado" : "livros terminados"}
                  {!mine && ` por ${primeiroNome}`}
                </span>
                {anoCorrente.paginas !== null && (
                  <span className="tabular mt-2 text-[13px] text-[var(--color-ink-faint)]">
                    {anoCorrente.paginas.toLocaleString("pt-BR")} páginas
                  </span>
                )}
              </div>
            </section>
          )}

          {totalVerdicts > 0 && (
            <section className="surface p-6">
              <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                o que {mine ? "você achou" : `${primeiroNome} achou`}
              </h2>
              <div className="mt-5">
                <Vereditos dados={verdicts} />
              </div>
            </section>
          )}

          {genres.length > 0 && (
            <section className="surface p-6">
              <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                gêneros mais lidos
              </h2>
              <div className="mt-5">
                <Barras dados={genres} cor="--grafico-generos" />
              </div>
            </section>
          )}

          {authors.length > 0 && (
            <section className="surface p-6">
              <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                autores mais lidos
              </h2>
              <div className="mt-5">
                <Barras dados={authors} cor="--grafico-autores" />
              </div>
            </section>
          )}

          {publishers.length > 0 && (
            <section className="surface p-6">
              <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                {mine ? "quem publica o que você lê" : `quem publica o que ${primeiroNome} lê`}
              </h2>
              <div className="mt-5">
                <Barras dados={publishers} cor="--grafico-editoras" />
              </div>
            </section>
          )}

          {nationalities.length > 0 && (
            <section className="surface p-6 sm:col-span-3">
              <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                de onde vêm os autores
              </h2>
              <div className="mt-5">
                <MapaMundi dados={nationalities} />
              </div>
            </section>
          )}

          {formats.length > 0 && (
            <section className="surface p-6">
              <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                papel ou tela
              </h2>
              <div className="mt-5">
                <Barras dados={formats} cor="--grafico-formatos" />
              </div>
            </section>
          )}

          {centuries.length > 0 && (
            <section className="surface p-6 sm:col-span-3">
              <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                o século das obras
              </h2>
              <div className="mt-7">
                <Seculos dados={centuries} />
              </div>
            </section>
          )}
        </div>
      </Gaveta>
    </div>
  );
}

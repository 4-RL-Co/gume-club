import { Barras, Vereditos } from "@/components/graficos-leitura";
import type { ResumoDoPerfil as Resumo } from "@/lib/stats";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O RESUMO DO PERFIL. Inspirado na barra lateral do yourgamerprofile.com,
 *  traduzido pelas regras de sempre.
 *
 *  Cinco cartões — o que sobrevive da tradução, e o que "abrir /estatisticas
 *  pra visitantes" trouxe depois:
 *   - o ano corrente (livros e páginas, reaproveitando a régua que a HONRA
 *     já usa — nunca tempo de leitura, nunca ofensiva);
 *   - distribuição de veredito (sem média, sem dígito de nota — só contagem
 *     por palavra, a mesma régua de /estatisticas);
 *   - gêneros mais lidos (a versão comportada do gráfico radar do print);
 *   - de onde vêm os autores (nacionalidade);
 *   - papel ou tela (formato).
 *
 *  Os dois últimos são o "recorte curador" que /estatisticas nunca abriu pra
 *  visitante: veredito, gênero, nacionalidade e formato são GOSTO, não
 *  posse — a mesma linha que separa "e a comunidade" do resto daquela
 *  página. Quantos livros na estante e a paciência ficam de fora, e ficam
 *  só na tela privada. Ver lib/stats.ts, getResumoDoPerfil().
 *
 *  O que NÃO traduz, de propósito: contador de seguidores/curtida (README:
 *  "sem contador de seguidores") e o mapa de atividade estilo GitHub — perto
 *  demais de "ofensiva" (streak), que o README também recusa.
 * ════════════════════════════════════════════════════════════════════
 */
export function ResumoDoPerfil({ resumo, primeiroNome, mine }: { resumo: Resumo; primeiroNome: string; mine: boolean }) {
  const { verdicts, genres, nationalities, formats, anoCorrente } = resumo;
  const totalVerdicts = verdicts.reduce((s, v) => s + v.n, 0);

  if (
    totalVerdicts === 0 && genres.length === 0 && nationalities.length === 0 &&
    formats.length === 0 && anoCorrente.livros === 0
  ) return null;

  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-3">
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

      {nationalities.length > 0 && (
        <section className="surface p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            de onde vêm os autores
          </h2>
          <div className="mt-5">
            <Barras dados={nationalities} cor="--grafico-paises" />
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
    </div>
  );
}

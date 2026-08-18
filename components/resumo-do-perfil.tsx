import { Barras, Vereditos } from "@/components/graficos-leitura";
import type { ResumoDoPerfil as Resumo } from "@/lib/stats";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O RESUMO DO PERFIL. Inspirado na barra lateral do yourgamerprofile.com,
 *  traduzido pelas regras de sempre.
 *
 *  Três cartões, e só três — o que sobrevive da tradução:
 *   - distribuição de veredito (sem média, sem dígito de nota — só contagem
 *     por palavra, a mesma régua de /estatisticas);
 *   - gêneros mais lidos (a versão comportada do gráfico radar do print);
 *   - o ano corrente (livros e páginas, reaproveitando a régua que a HONRA
 *     já usa — nunca tempo de leitura, nunca ofensiva).
 *
 *  O que NÃO traduz, de propósito: contador de seguidores/curtida (README:
 *  "sem contador de seguidores") e o mapa de atividade estilo GitHub — perto
 *  demais de "ofensiva" (streak), que o README também recusa.
 * ════════════════════════════════════════════════════════════════════
 */
export function ResumoDoPerfil({ resumo, primeiroNome, mine }: { resumo: Resumo; primeiroNome: string; mine: boolean }) {
  const { verdicts, genres, anoCorrente } = resumo;
  const totalVerdicts = verdicts.reduce((s, v) => s + v.n, 0);

  if (totalVerdicts === 0 && genres.length === 0 && anoCorrente.livros === 0) return null;

  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-3">
      {anoCorrente.livros > 0 && (
        <section className="surface p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {anoCorrente.ano}
          </h2>
          <p className="voice mt-3 text-[19px] leading-snug text-[var(--color-ink)]">
            {mine ? "Você terminou" : `${primeiroNome} terminou`}{" "}
            <span className="tabular">{anoCorrente.livros}</span>{" "}
            {anoCorrente.livros === 1 ? "livro" : "livros"}
            {anoCorrente.paginas !== null && (
              <>, <span className="tabular">{anoCorrente.paginas.toLocaleString("pt-BR")}</span> páginas</>
            )}
            .
          </p>
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
    </div>
  );
}

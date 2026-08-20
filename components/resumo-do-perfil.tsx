import { Gaveta } from "@/components/gaveta";
import { Barras, Vereditos, Seculos } from "@/components/graficos-leitura";
import { MapaMundi } from "@/components/mapa-mundi";
import { empacotar } from "@/lib/masonry";
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
 *
 *  ═══ AS COLUNAS SÃO EMPACOTADAS, NÃO SÃO `columns-3` ═══
 *
 *  "e sobre estatisticas, olha essas boxes todas tortas" — o dono, com um
 *  print de uma coluna gigante ("quem publica", catorze linhas) ao lado de
 *  duas bem mais curtas. O CSS `columns-N` empacota sozinho, mas com meia
 *  dúzia de cartões de alturas bem diferentes ele erra: mede a altura
 *  total, divide por N, e não sabe redistribuir quando um cartão sozinho já
 *  estoura essa média. `lib/masonry.ts` (`empacotar()`) faz à mão o que o
 *  navegador faz mal aqui — cada cartão entra com um PESO (quantas linhas
 *  ele desenha), e o algoritmo guloso bota cada um na coluna mais vazia no
 *  momento.
 *
 *  Isso exige duas renderizações dos mesmos cartões: uma em ORDEM NATURAL
 *  (empilhada, `sm:hidden`) pra tela estreita — onde não existe coluna, e a
 *  prioridade é a mesma de sempre, o ano corrente primeiro — e outra
 *  EMPACOTADA (`hidden sm:grid`) pra tela larga, onde as colunas existem e
 *  precisam ficar parecidas em altura. Os mesmos elementos, usados duas
 *  vezes: React não se importa (não são componentes com estado), e o custo
 *  é um pouco de HTML a mais num trecho que é só texto e barra.
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

  // Cada cartão entra com um PESO: aproximadamente quantas linhas ele desenha.
  // O cabeçalho conta como 1 linha; uma barra por item da lista.
  const blocos: { key: string; peso: number; node: React.ReactNode }[] = [];

  if (anoCorrente.livros > 0) {
    blocos.push({
      key: "ano",
      peso: 4,
      node: (
        <section key="ano" className="surface mb-5 flex flex-col break-inside-avoid p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {anoCorrente.ano}
          </h2>

          <div className="mt-5 flex flex-col gap-1.5">
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
      ),
    });
  }

  if (totalVerdicts > 0) {
    blocos.push({
      key: "verdicts",
      peso: 1 + verdicts.length, // os cinco degraus aparecem sempre — ver Vereditos()
      node: (
        <section key="verdicts" className="surface mb-5 break-inside-avoid p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            o que {mine ? "você achou" : `${primeiroNome} achou`}
          </h2>
          <div className="mt-5">
            <Vereditos dados={verdicts} />
          </div>
        </section>
      ),
    });
  }

  if (genres.length > 0) {
    blocos.push({
      key: "genres",
      peso: 1 + genres.length,
      node: (
        <section key="genres" className="surface mb-5 break-inside-avoid p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            gêneros mais lidos
          </h2>
          <div className="mt-5">
            <Barras dados={genres} cor="--grafico-generos" />
          </div>
        </section>
      ),
    });
  }

  if (authors.length > 0) {
    blocos.push({
      key: "authors",
      peso: 1 + authors.length,
      node: (
        <section key="authors" className="surface mb-5 break-inside-avoid p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            autores mais lidos
          </h2>
          <div className="mt-5">
            <Barras dados={authors} cor="--grafico-autores" />
          </div>
        </section>
      ),
    });
  }

  if (publishers.length > 0) {
    blocos.push({
      key: "publishers",
      peso: 1 + publishers.length,
      node: (
        <section key="publishers" className="surface mb-5 break-inside-avoid p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {mine ? "quem publica o que você lê" : `quem publica o que ${primeiroNome} lê`}
          </h2>
          <div className="mt-5">
            <Barras dados={publishers} cor="--grafico-editoras" />
          </div>
        </section>
      ),
    });
  }

  if (formats.length > 0) {
    blocos.push({
      key: "formats",
      peso: 1 + formats.length,
      node: (
        <section key="formats" className="surface mb-5 break-inside-avoid p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            papel ou tela
          </h2>
          <div className="mt-5">
            <Barras dados={formats} cor="--grafico-formatos" />
          </div>
        </section>
      ),
    });
  }

  const COLUNAS = 3;
  const colunas = empacotar(blocos, (b) => b.peso, COLUNAS);

  return (
    <div className="mt-8">
      <Gaveta titulo={mine ? "as suas estatísticas" : `as estatísticas de ${primeiroNome}`} resumo={resumoDaGaveta}>
        {/* Tela estreita: ordem natural, empilhada — não existe coluna pra
            desequilibrar. Tela larga: as mesmas seções, empacotadas por
            peso em 3 colunas. Ver o comentário de topo do arquivo. */}
        <div className="flex flex-col sm:hidden">
          {blocos.map((b) => b.node)}
        </div>

        <div className="hidden sm:grid sm:grid-cols-3 sm:gap-5">
          {colunas.map((coluna, i) => (
            <div key={i} className="flex flex-col">
              {coluna.map((b) => b.node)}
            </div>
          ))}
        </div>

        {nationalities.length > 0 && (
          <section className="surface mt-5 p-6">
            <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              de onde vêm os autores
            </h2>
            <div className="mt-5">
              <MapaMundi dados={nationalities} />
            </div>
          </section>
        )}

        {centuries.length > 0 && (
          <section className="surface mt-5 p-6">
            <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              o século das obras
            </h2>
            <div className="mt-7">
              <Seculos dados={centuries} />
            </div>
          </section>
        )}
      </Gaveta>
    </div>
  );
}

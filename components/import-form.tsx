"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Upload, ScanBarcode, Type, Sparkles } from "lucide-react";
import { ler, procurar, importar, type Previa } from "@/app/importar/actions";
import { LOTE, ehFato, type Relatorio, type Achado } from "@/lib/import/tipos";
import { Cover } from "@/components/cover";
import { mine } from "@/lib/veredito";

/**
 * ════════════════════════════════════════════════════════════════════
 *  TRAZER A ESTANTE INTEIRA, DE UM ARQUIVO.
 *
 *  É o que decide se os dez primeiros amigos ficam ou cadastram três livros e somem.
 *
 *  Quatro passos, e a ordem é a coisa mais importante desta tela:
 *
 *      1. o arquivo
 *      2. ONDE CADA LIVRO FOI PARAR NO CATÁLOGO, e COMO   ← a tela inteira
 *      3. a confirmação, com o que se perde no caminho
 *      4. o relatório: o que entrou, e o que não entrou
 *
 *  ═══ O PASSO 2 ERA OUTRO, E ESTAVA ERRADO ═══
 *
 *  Ele mostrava o que o PARSER tinha entendido do arquivo: "160 livros, 84 lidos, 30 com
 *  resenha". Bonito, e não é a pergunta que importa.
 *
 *  A pessoa não precisa conferir se a gente leu "Dom Casmurro" na linha do CSV. Ela precisa
 *  conferir **em que livro do catálogo aquilo foi parar** — e disso a tela não sabia nada,
 *  porque a prévia nunca tocava no catálogo.
 *
 *  ═══ ISBN É FATO. TÍTULO É PALPITE. E A TELA MOSTRA A DIFERENÇA ═══
 *
 *  Um casamento por ISBN é um número impresso na contracapa: ou bate, ou não bate.
 *
 *  Um casamento por título é uma aposta — e o acervo tem "Dom Casmurro" do Machado e
 *  "Dom Casmurro" de um professor que escreveu um estudo sobre ele.
 *
 *  Misturar os dois na mesma lista obriga a pessoa a desconfiar de tudo, e quem desconfia
 *  de tudo não confere nada: clica em confirmar e reza. **Separados, ela só precisa olhar
 *  os palpites** — que são poucos, e são exatamente onde o erro mora.
 *
 *  Um erro que entra sozinho numa estante de 400 livros é um erro que ninguém percebe por
 *  dois anos.
 * ════════════════════════════════════════════════════════════════════
 */
export function ImportForm() {
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [achados, setAchados] = useState<Achado[] | null>(null);
  const [fora, setFora] = useState<Set<number>>(new Set());
  const [andando, setAndando] = useState<{ feitos: number; total: number } | null>(null);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, comecar] = useTransition();

  /**
   * ═══ EM LOTES, E A BARRA ANDA ═══
   *
   * Quatrocentos livros são quatrocentas buscas no catálogo, e elas não cabem numa
   * requisição: a função morre no meio, e a pessoa vê "erro" depois de dois minutos — por
   * um arquivo que ela levou uma hora para tirar do outro app.
   *
   * O cliente pede um lote de cada vez. A barra que anda não é enfeite: uma tela parada por
   * quarenta segundos é uma tela quebrada, e a pessoa recarrega no meio.
   */
  async function emLotes<T, R>(itens: T[], fazer: (lote: T[]) => Promise<R[]>): Promise<R[]> {
    const saida: R[] = [];
    setAndando({ feitos: 0, total: itens.length });

    for (let i = 0; i < itens.length; i += LOTE) {
      const lote = itens.slice(i, i + LOTE);
      saida.push(...(await fazer(lote)));
      setAndando({ feitos: Math.min(i + LOTE, itens.length), total: itens.length });
    }

    setAndando(null);
    return saida;
  }

  function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);

    const leitor = new FileReader();
    leitor.onload = () => {
      const texto = String(leitor.result ?? "");

      comecar(async () => {
        try {
          const p = await ler(texto);

          if (p.livros.length === 0) {
            setErro("Não achamos nenhum livro nesse arquivo. Ele tem uma linha de títulos no topo?");
            return;
          }

          // E AGORA a parte que importa: onde cada um foi parar no catálogo.
          const casados = await emLotes(p.livros, (lote) => procurar(lote));

          setPrevia(p);
          setAchados(casados);
          setFora(new Set());
        } catch {
          setErro("Não deu para ler esse arquivo.");
          setAndando(null);
        }
      });
    };

    leitor.readAsText(arquivo);
  }

  // ── 4. o relatório ─────────────────────────────────────────────────
  if (relatorio) {
    return (
      <section className="surface mt-10 p-7 sm:p-9">
        <p className="voice text-[30px] leading-snug sm:text-[38px]">
          {relatorio.entraram} {relatorio.entraram === 1 ? "livro entrou" : "livros entraram"} na
          sua estante.
        </p>

        {relatorio.avisos.length > 0 && (
          <ul className="mt-7 flex flex-col gap-3">
            {relatorio.avisos.map((a, i) => (
              <li key={i} className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                {a}
              </li>
            ))}
          </ul>
        )}

        {relatorio.perdidos.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              {relatorio.perdidos.length === 1 ? "este não entrou" : "estes não entraram"}
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {relatorio.perdidos.slice(0, 20).map((p, i) => (
                <li key={i} className="text-[14px] text-[var(--color-ink-soft)]">
                  {p.linha}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Link
            href="/estante"
            className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-canvas)]"
          >
            Ver a estante
          </Link>
          <button
            onClick={() => {
              setRelatorio(null);
              setPrevia(null);
              setAchados(null);
            }}
            className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          >
            trazer outro arquivo
          </button>
        </div>
      </section>
    );
  }

  // ── 2 e 3. a conferência ───────────────────────────────────────────
  if (previa && achados) {
    const escolhidos = previa.livros.filter((_, i) => !fora.has(i));

    const fatos = achados.filter((a) => ehFato(a.como)).length;
    const palpites = achados.filter((a) => a.como === "titulo").length;
    const novos = achados.filter((a) => a.como === "novo").length;

    /** Os palpites primeiro: são os únicos que precisam de um par de olhos. */
    const ordem = achados.map((a, i) => ({ a, i })).sort((x, y) => peso(x.a.como) - peso(y.a.como));

    return (
      <section className="surface mt-10 p-7 sm:p-9">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          confira antes de entrar
        </h2>

        <p className="voice mt-5 text-[28px] leading-snug sm:text-[34px]">
          {previa.livros.length} livros
          {previa.fonte !== "desconhecida" && `, do ${nome(previa.fonte)}`}.
        </p>

        {/**
         * ═══ O NÚMERO QUE IMPORTA NÃO É "QUANTOS", É "COMO" ═══
         *
         * A pessoa precisa saber quantos são de cada tipo ANTES de olhar a lista: é isso que
         * decide se ela vai conferir com cuidado ou passar o olho.
         */}
        <ul className="mt-7 flex flex-col gap-2.5 text-[15px] text-[var(--color-ink-soft)]">
          {fatos > 0 && (
            <li className="flex items-start gap-2.5">
              <ScanBarcode
                size={16}
                strokeWidth={1.5}
                className="mt-1 shrink-0 text-[var(--color-accent)]"
                aria-hidden
              />
              <span>
                <strong className="font-medium text-[var(--color-ink)]">{fatos}</strong> pelo ISBN.
                Esses são certos: o número está impresso no livro.
              </span>
            </li>
          )}

          {palpites > 0 && (
            <li className="flex items-start gap-2.5">
              <Type
                size={16}
                strokeWidth={1.5}
                className="mt-1 shrink-0"
                style={{ color: "var(--color-colaborar)" }}
                aria-hidden
              />
              <span>
                <strong className="font-medium text-[var(--color-ink)]">{palpites}</strong> pelo
                título e pelo autor, porque o arquivo não trouxe o ISBN.{" "}
                <strong className="font-medium text-[var(--color-ink)]">Confira esses.</strong>
              </span>
            </li>
          )}

          {novos > 0 && (
            <li className="flex items-start gap-2.5">
              <Sparkles
                size={16}
                strokeWidth={1.5}
                className="mt-1 shrink-0 text-[var(--color-ink-faint)]"
                aria-hidden
              />
              <span>
                <strong className="font-medium text-[var(--color-ink)]">{novos}</strong> ainda não
                existem no catálogo. Eles entram, e um bibliotecário confere a ficha depois.
              </span>
            </li>
          )}
        </ul>

        {previa.avisos.length > 0 && (
          <div className="mt-8 border-t border-[var(--color-rule)] pt-7">
            <h3 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              o que muda de forma
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {previa.avisos.map((a, i) => (
                <li key={i} className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/**
         * A LISTA, COM OS PALPITES EM CIMA.
         *
         * Desmarcar é a razão de esta tela existir. Se ela só mostrasse, seria um aviso — e um
         * aviso que não dá para agir é um aviso decorativo.
         */}
        <ul className="mt-8 flex flex-col gap-2">
          {ordem.map(({ a, i }) => {
            const dentro = !fora.has(i);
            const livro = previa.livros[i]!;

            return (
              <li key={i}>
                <button
                  onClick={() =>
                    setFora((atual) => {
                      const novo = new Set(atual);
                      if (novo.has(i)) novo.delete(i);
                      else novo.add(i);
                      return novo;
                    })
                  }
                  aria-pressed={dentro}
                  className={[
                    "surface-2 flex w-full items-center gap-4 p-3 text-left transition-opacity",
                    dentro ? "" : "opacity-40",
                  ].join(" ")}
                >
                  <span className="w-9 shrink-0">
                    <Cover
                      title={a.tituloNoCatalogo ?? a.titulo}
                      author={a.autorNoCatalogo ?? a.autor}
                      src={a.coverUrl}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="voice block truncate text-[15px]">
                      {a.tituloNoCatalogo ?? a.titulo}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                      {a.autorNoCatalogo ?? a.autor ?? "autor desconhecido"}
                    </span>

                    {/* O TÍTULO DO ARQUIVO, quando ele é OUTRO. É aqui que o erro aparece: a
                        pessoa vê os dois lado a lado, e decide. */}
                    {a.tituloNoCatalogo &&
                      a.tituloNoCatalogo.toLowerCase() !== a.titulo.toLowerCase() && (
                        <span className="mt-0.5 block truncate text-[12px] text-[var(--color-ink-faint)]">
                          no seu arquivo: {a.titulo}
                        </span>
                      )}
                  </span>

                  <Selo como={a.como} />

                  <span className="hidden shrink-0 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] sm:block">
                    {livro.estrelas !== null
                      ? mine(arredonda(livro.estrelas))
                      : rotulo(livro.status)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-9 flex flex-wrap items-center gap-5">
          <button
            disabled={pendente || escolhidos.length === 0}
            onClick={() =>
              comecar(async () => {
                /**
                 * EM LOTES, e os relatórios se somam. Gravar quatrocentos livros é gravar
                 * quatrocentas estantes, quatrocentas leituras e quatrocentas notas — e isso
                 * não cabe numa requisição serverless.
                 */
                const partes = await emLotes(escolhidos, async (lote) => [await importar(lote)]);

                setRelatorio(
                  partes.reduce<Relatorio>(
                    (soma, r) => ({
                      linhas: soma.linhas + r.linhas,
                      entraram: soma.entraram + r.entraram,
                      novos: soma.novos + r.novos,
                      perdidos: [...soma.perdidos, ...r.perdidos],
                      avisos: [...new Set([...soma.avisos, ...r.avisos])],
                    }),
                    { linhas: 0, entraram: 0, novos: 0, perdidos: [], avisos: [] },
                  ),
                );
              })
            }
            className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-6 py-3 text-[15px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
          >
            {pendente
              ? andando
                ? `trazendo ${andando.feitos} de ${andando.total}`
                : "trazendo"
              : `Trazer ${escolhidos.length} ${escolhidos.length === 1 ? "livro" : "livros"}`}
          </button>

          {fora.size > 0 && (
            <span className="text-[13px] text-[var(--color-ink-faint)]">
              {fora.size} {fora.size === 1 ? "desmarcado" : "desmarcados"}
            </span>
          )}

          <button
            onClick={() => {
              setPrevia(null);
              setAchados(null);
            }}
            className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          >
            deixa
          </button>
        </div>
      </section>
    );
  }

  // ── 1. o arquivo ───────────────────────────────────────────────────
  return (
    <section className="mt-10">
      <label className="surface flex cursor-pointer flex-col items-center gap-4 px-7 py-14 text-center transition-colors hover:border-[var(--color-ink)]">
        <Upload size={22} strokeWidth={1.25} className="text-[var(--color-ink-faint)]" />

        <span className="voice text-[20px]">
          {andando
            ? `procurando no catálogo: ${andando.feitos} de ${andando.total}`
            : pendente
              ? "lendo o arquivo"
              : "Escolher o arquivo"}
        </span>

        <span className="max-w-sm text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
          O arquivo que você baixou do Goodreads, do StoryGraph, do Skoob ou do Fable. Também
          serve uma planilha sua, e serve o arquivo que você baixou daqui.
        </span>

        <input
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={(e) => escolher(e.target.files?.[0])}
        />
      </label>

      {andando && (
        <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-rule)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-200"
            style={{ width: `${Math.round((andando.feitos / andando.total) * 100)}%` }}
          />
        </div>
      )}

      {erro && <p className="mt-5 text-[15px] text-[var(--color-ink-soft)]">{erro}</p>}
    </section>
  );
}

/** Casou por ISBN, por título, ou não casou. O selo é a única coisa que a pessoa precisa ler. */
function Selo({ como }: { como: Achado["como"] }) {
  if (como === "novo") {
    return (
      <span className="hidden shrink-0 items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)] sm:flex">
        <Sparkles size={13} strokeWidth={1.5} aria-hidden />
        novo
      </span>
    );
  }

  if (como === "titulo") {
    return (
      <span
        className="flex shrink-0 items-center gap-1.5 text-[11px] uppercase tracking-[0.1em]"
        style={{ color: "var(--color-colaborar)" }}
        title="Casamos pelo título e pelo autor, porque o arquivo não trouxe o ISBN. Confira."
      >
        <Type size={13} strokeWidth={1.5} aria-hidden />
        pelo título
      </span>
    );
  }

  return (
    <span
      className="flex shrink-0 items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-[var(--color-accent)]"
      title="Casamos pelo ISBN, que está impresso no livro. Este é certo."
    >
      <ScanBarcode size={13} strokeWidth={1.5} aria-hidden />
      pelo isbn
    </span>
  );
}

/** Os palpites primeiro: são os únicos que precisam de um par de olhos. */
function peso(como: Achado["como"]): number {
  if (como === "titulo") return 0;
  if (como === "novo") return 1;
  return 2;
}

function nome(fonte: string): string {
  return { goodreads: "Goodreads", storygraph: "StoryGraph", skoob: "Skoob", fable: "Fable" }[
    fonte
  ] ?? fonte;
}

function rotulo(status: string): string {
  return (
    { want_to_read: "esperando", reading: "lendo", read: "lido", did_not_finish: "larguei" }[
      status
    ] ?? ""
  );
}

/** A estrela decimal do StoryGraph (4.25) vira a palavra mais próxima. */
function arredonda(estrelas: number): number {
  const s = Math.round(estrelas);
  return s <= 2 ? 2 : Math.min(5, s);
}

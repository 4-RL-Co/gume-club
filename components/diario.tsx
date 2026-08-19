"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, FileText } from "lucide-react";
import { Cover } from "@/components/cover";
import { GLIFO } from "@/components/veredito";
import { mine as palavraDoVeredito } from "@/lib/veredito";
import type { EntradaDiario } from "@/lib/diario";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O DIÁRIO. Uma linha por leitura, mais recente primeiro — inspirado no
 *  Diary do Letterboxd, traduzido pelas regras de sempre: sem estrela (a
 *  nota é a mesma palavra-veredito de todo o resto do app), sem "curtiu"
 *  (não existe curtida em livro), e a data já diz a sua PRECISÃO — "2019"
 *  quando só o ano é lembrado, o dia quando ele é.
 *
 *  ═══ O SELO DO MÊS, SÓ NA PRIMEIRA LINHA DO MÊS ═══
 *
 *  "acho que os posicionamentos devem ser mais criativos, olha que bonito o
 *  diário do letterboxd" — o dono, com o print. Lá, o selo (mês + ano) só
 *  aparece na primeira leitura de cada mês; as seguintes do MESMO mês
 *  mostram só o dia solto, alinhado por baixo do selo anterior. Reescrever o
 *  mês em toda linha seria repetir o óbvio; nunca escrever nenhum faria a
 *  pessoa perder a conta de onde um mês termina e o outro começa.
 *
 *  Datas com só o ano (sem dia) não entram nesse agrupamento — não tem selo
 *  de mês pra elas, porque não existe mês pra mostrar. Ver formataQuando().
 *
 *  ═══ FILTROS, E O QUE CADA LINHA É ═══
 *
 *  "no diario tem que ter filtros e também não dá pra saber oq foi leitura e
 *  oq foi resenha" — o dono, com o print do toolbar do Letterboxd (RATING,
 *  DIARY YEAR). Dois filtros por cima do livros/resenhas que já existia — ano
 *  e veredito, só com os valores que EXISTEM na lista (um filtro com opção
 *  vazia é uma pergunta sem resposta possível) — e cada linha agora ESCREVE
 *  o que ela é ("releitura", "resenha"), em vez de só um ícone pequeno fácil
 *  de não notar.
 * ════════════════════════════════════════════════════════════════════
 */
export function Diario({ entradas }: { entradas: EntradaDiario[] }) {
  const [filtro, setFiltro] = useState<"livros" | "resenhas">("livros");
  const [ano, setAno] = useState<number | null>(null);
  const [veredito, setVeredito] = useState<number | null>(null);

  const comResenha = useMemo(() => entradas.filter((e) => e.temResenha), [entradas]);

  // Só os anos e vereditos que EXISTEM nesta lista — a mesma régua do "todo
  // ano" de /estatisticas: um filtro com opção vazia é o app inventando uma
  // pergunta que não tem resposta.
  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>();
    for (const e of entradas) {
      if (e.quando) anos.add(Number(e.quando.slice(0, 4)));
    }
    return [...anos].sort((a, b) => b - a);
  }, [entradas]);

  const vereditosDisponiveis = useMemo(() => {
    const presentes = new Set(entradas.map((e) => e.rating).filter((v): v is number => v !== null));
    return [5, 4, 3, 2, 1].filter((v) => presentes.has(v));
  }, [entradas]);

  const visiveis = useMemo(() => {
    let lista = filtro === "resenhas" ? comResenha : entradas;
    if (ano !== null) lista = lista.filter((e) => e.quando?.startsWith(String(ano)));
    if (veredito !== null) lista = lista.filter((e) => e.rating === veredito);
    return lista;
  }, [entradas, comResenha, filtro, ano, veredito]);

  if (entradas.length === 0) return null;

  let ultimoMes: string | null = null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-2">
        {comResenha.length > 0 && (
          <div className="flex gap-1.5">
            <BotaoFiltro ativo={filtro === "livros"} onClick={() => setFiltro("livros")}>
              livros terminados
            </BotaoFiltro>
            <BotaoFiltro ativo={filtro === "resenhas"} onClick={() => setFiltro("resenhas")}>
              resenhas
            </BotaoFiltro>
          </div>
        )}

        {anosDisponiveis.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <BotaoFiltro ativo={ano === null} onClick={() => setAno(null)}>
              todo ano
            </BotaoFiltro>
            {anosDisponiveis.map((a) => (
              <BotaoFiltro key={a} ativo={ano === a} onClick={() => setAno(a)}>
                {a}
              </BotaoFiltro>
            ))}
          </div>
        )}

        {vereditosDisponiveis.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <BotaoFiltro ativo={veredito === null} onClick={() => setVeredito(null)}>
              todo veredito
            </BotaoFiltro>
            {vereditosDisponiveis.map((v) => (
              <BotaoFiltro key={v} ativo={veredito === v} onClick={() => setVeredito(v)}>
                {palavraDoVeredito(v)}
              </BotaoFiltro>
            ))}
          </div>
        )}
      </div>

      {visiveis.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-[var(--color-ink-faint)]">
          Nada com esse recorte.
        </p>
      ) : (
        <ul className="flex flex-col">
          {visiveis.map((e) => {
            const mesChave = mesChaveDe(e.quando);
            const primeiroDoMes = mesChave !== null && mesChave !== ultimoMes;
            ultimoMes = mesChave;

            return (
              <li
                key={e.readingId}
                className="flex items-start gap-4 border-b border-[var(--color-rule)] py-4 first:pt-0 last:border-0 last:pb-0"
              >
                <div className="w-14 shrink-0 pt-0.5">
                  {mesChave === null ? (
                    <span className="tabular block text-center text-[13px] text-[var(--color-ink-faint)]">
                      {e.quando ?? "sem data"}
                    </span>
                  ) : primeiroDoMes ? (
                    <SeloDoMes quando={e.quando!} />
                  ) : (
                    <DiaSolto quando={e.quando!} />
                  )}
                </div>

                <Link href={`/livro/${e.slug}`} className="cover-lift w-12 shrink-0">
                  <Cover title={e.title} author={e.author} src={e.coverUrl} />
                </Link>

                <div className="min-w-0 flex-1 pt-0.5">
                  <Link
                    href={`/livro/${e.slug}`}
                    className="voice block truncate text-[16px] leading-snug text-[var(--color-ink)] hover:underline"
                  >
                    {e.title}
                  </Link>
                  {e.author && (
                    <span className="mt-0.5 block truncate text-[13px] text-[var(--color-ink-faint)]">{e.author}</span>
                  )}

                  {/* O RÓTULO: "não dá pra saber oq foi leitura e oq foi resenha" — o
                      dono. O ícone sozinho já dizia isso, mas fácil de não notar; a
                      palavra ao lado não deixa dúvida. */}
                  {(e.releitura || e.temResenha) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      {e.releitura && (
                        <span className="flex items-center gap-1 text-[11px] text-[var(--color-ink-faint)]">
                          <RotateCcw size={11} strokeWidth={1.75} aria-hidden />
                          releitura
                        </span>
                      )}
                      {e.temResenha && (
                        <Link
                          href={`/livro/${e.slug}`}
                          className="flex items-center gap-1 text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                        >
                          <FileText size={11} strokeWidth={1.75} aria-hidden />
                          resenha
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center pt-0.5">
                  {e.abandonado ? (
                    <span className="text-[12px] text-[var(--color-ink-faint)]">abandonei</span>
                  ) : (
                    e.rating !== null && (
                      <span title={palavraDoVeredito(e.rating)} className="text-[var(--color-ink-faint)]">
                        {(() => {
                          const Glifo = GLIFO[e.rating as keyof typeof GLIFO];
                          return <Glifo size={15} strokeWidth={1.75} aria-hidden />;
                        })()}
                      </span>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BotaoFiltro({
  ativo, onClick, children,
}: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={[
        "pill px-3.5 py-1.5 text-[13px] transition-colors",
        ativo
          ? "bg-[var(--color-ink)] font-medium text-[var(--color-canvas)]"
          : "border border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

/** "YYYY-MM", ou `null` quando a data é só o ano (sem mês pra agrupar). */
function mesChaveDe(quando: string | null): string | null {
  if (!quando || /^\d{4}$/.test(quando)) return null;
  return quando.slice(0, 7);
}

/** O selo, tipo folhinha: mês em cima, ano embaixo, o dia solto abaixo dele. */
function SeloDoMes({ quando }: { quando: string }) {
  const [ano, mes, dia] = quando.split("-").map(Number);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-14 overflow-hidden rounded-[10px] border border-[var(--color-rule)] text-center">
        <div className="bg-[var(--color-ink)] py-1 text-[10px] font-semibold tracking-[0.08em] text-[var(--color-canvas)]">
          {MESES[(mes ?? 1) - 1]}
        </div>
        <div className="py-1 text-[11px] text-[var(--color-ink-faint)]">{ano}</div>
      </div>
      <span className="tabular text-[15px] text-[var(--color-ink)]">{dia}</span>
    </div>
  );
}

/**
 * Só o dia, alinhado embaixo de onde o selo do mês ficaria — o `mt-[52px]` é
 * a altura do selo (duas linhas de texto + borda) medida no código, sem
 * navegador aqui pra calibrar no olho. Conferir ao vivo e ajustar se as duas
 * colunas (selo vs. dia solto) não baterem exatamente.
 */
function DiaSolto({ quando }: { quando: string }) {
  const dia = Number(quando.split("-")[2]);
  return (
    <span className="tabular mt-[52px] block text-center text-[15px] text-[var(--color-ink)]">
      {dia}
    </span>
  );
}

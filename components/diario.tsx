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
 * ════════════════════════════════════════════════════════════════════
 */
export function Diario({ entradas }: { entradas: EntradaDiario[] }) {
  if (entradas.length === 0) return null;

  return (
    <ul className="flex flex-col">
      {entradas.map((e) => (
        <li
          key={e.readingId}
          className="flex items-center gap-4 border-b border-[var(--color-rule)] py-3.5 first:pt-0 last:border-0 last:pb-0"
        >
          <span className="tabular w-20 shrink-0 text-[12px] text-[var(--color-ink-faint)]">
            {formataData(e.quando)}
          </span>

          <Link href={`/livro/${e.slug}`} className="cover-lift w-10 shrink-0">
            <Cover title={e.title} author={e.author} src={e.coverUrl} />
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={`/livro/${e.slug}`}
              className="voice block truncate text-[15px] leading-snug text-[var(--color-ink)] hover:underline"
            >
              {e.title}
            </Link>
            {e.author && (
              <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">{e.author}</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {e.releitura && (
              <span title="uma releitura" className="text-[var(--color-ink-faint)]">
                <RotateCcw size={13} strokeWidth={1.75} aria-hidden />
              </span>
            )}

            {e.temResenha && (
              <Link href={`/livro/${e.slug}`} title="tem resenha" className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
                <FileText size={13} strokeWidth={1.75} aria-hidden />
              </Link>
            )}

            {e.abandonado ? (
              <span className="text-[11px] text-[var(--color-ink-faint)]">abandonei</span>
            ) : (
              e.rating !== null && (
                <span title={palavraDoVeredito(e.rating)} className="text-[var(--color-ink-faint)]">
                  {(() => {
                    const Glifo = GLIFO[e.rating as keyof typeof GLIFO];
                    return <Glifo size={14} strokeWidth={1.75} aria-hidden />;
                  })()}
                </span>
              )
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** "2019" fica "2019". "2019-03-14" vira "14 ago 2019" — o formato diz a precisão. */
function formataData(quando: string | null): string {
  if (!quando) return "sem data";
  if (/^\d{4}$/.test(quando)) return quando;

  const [ano, mes, dia] = quando.split("-").map(Number);
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${dia} ${MESES[(mes ?? 1) - 1]} ${ano}`;
}

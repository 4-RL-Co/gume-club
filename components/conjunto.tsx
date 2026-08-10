import Link from "next/link";
import { Trophy } from "lucide-react";
import { Cover } from "@/components/cover";
import type { Conjunto } from "@/lib/copies";

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM CONJUNTO DA COLEÇÃO. O que você tem em cor, o que falta apagado.
 *
 *  ═══ POR QUE O PRETO E BRANCO É O DESENHO CERTO ═══
 *
 *  Esconder o que falta transformaria a tela numa lista do que você já tem — que é
 *  inventário de novo. **A lacuna é o assunto de quem coleciona**, e ela precisa ser
 *  visível: o volume 7 apagado no meio dos coloridos é a própria vontade de completar.
 *
 *  É a gramática que o dono trouxe da referência: o item bloqueado continua na tela,
 *  em cinza, e a cor é a recompensa.
 *
 *  ═══ O SELO SÓ APARECE COMPLETO ═══
 *
 *  Um selo que aparece pela metade não é conquista, é enfeite. Ele só existe quando
 *  todos os volumes conhecidos são seus, e é a única coisa dourada da tela.
 *
 *  ═══ O QUE ESTA TELA NÃO FAZ ═══
 *
 *  Não compara você com ninguém. Não há "você é o 3º que mais completou", nem quantas
 *  pessoas têm este conjunto. Isso seria placar, e placar transforma colecionar numa
 *  competição — que é a coisa que este app recusa em toda superfície.
 * ════════════════════════════════════════════════════════════════════
 */
export function ConjuntoCard({ c }: { c: Conjunto }) {
  const pct = c.total > 0 ? Math.round((c.tenho / c.total) * 100) : 0;

  return (
    <section className="surface p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="voice text-[19px] leading-snug text-[var(--color-ink)]">{c.titulo}</h2>
          <p className="mt-1 text-[13px] text-[var(--color-ink-faint)]">
            <span className="tabular">{c.tenho} de {c.total}</span>
            {c.publisher ? ` · ${c.publisher}` : ""}
          </p>
        </div>

        {/* A única coisa dourada da tela, e só quando está completo. */}
        {c.completo && (
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border px-3 py-1.5 text-[12px] font-medium"
            style={{ color: "#d9a520", borderColor: "#d9a520" }}
          >
            <Trophy size={13} strokeWidth={1.75} aria-hidden />
            completa
          </span>
        )}
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: c.completo ? "#d9a520" : "var(--color-ink-soft)" }}
        />
      </div>

      <ul className="mt-5 flex flex-wrap gap-3">
        {c.volumes.map((v) => (
          <li key={v.slug} className="w-[68px] sm:w-[76px]">
            <Link href={`/livro/${v.slug}`} className="block" title={v.title}>
              {/* O QUE FALTA CONTINUA NA TELA, apagado. É a lacuna que move quem
                  coleciona, e escondê-la devolveria a tela ao inventário. */}
              <span
                className={[
                  "cover-lift block transition-all",
                  v.tenho ? "" : "opacity-45 grayscale",
                ].join(" ")}
              >
                <Cover title={v.title} src={v.coverUrl} />
              </span>
              <span
                className={[
                  "tabular mt-1.5 block text-center text-[11px]",
                  v.tenho ? "text-[var(--color-ink-soft)]" : "text-[var(--color-ink-faint)]",
                ].join(" ")}
              >
                {v.volume ?? "—"}
                {/* Querer é diferente de não ter: o app sabe, e diz baixinho. */}
                {!v.tenho && v.quero ? " ·" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

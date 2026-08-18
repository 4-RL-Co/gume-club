import Link from "next/link";
import { Crown } from "lucide-react";
import { Cover } from "@/components/cover";
import type { FavoritoBook } from "@/lib/favoritos";

/**
 * OS FAVORITOS, no perfil de quem visita. Até cinco, o primeiro coroado —
 * substitui "o que eu adorei" (todo 5 estrelas, sem limite, automático). Ver
 * lib/favoritos.ts. A versão editável (coroar, tirar) é
 * components/gerenciar-favoritos.tsx, e mora só em /perfil.
 *
 * CENTRALIZADOS, e não flush à esquerda: com menos de cinco, uma fila
 * começando na borda deixava o resto do cartão vazio, largado — cinco
 * escolhas merecem ficar no meio do palco, não empurradas pro canto.
 */
export function FavoritosVitrine({ titulo, favoritos }: { titulo: string; favoritos: FavoritoBook[] }) {
  if (favoritos.length === 0) return null;

  return (
    <section className="surface mt-5 p-7 sm:p-8">
      <h2 className="text-center text-[11px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
        {titulo}
      </h2>

      <ul className="mt-6 flex flex-wrap justify-center gap-6 sm:gap-8">
        {favoritos.map((f, i) => (
          <li key={f.slug} className="w-28 shrink-0 sm:w-32">
            <div className="relative">
              {/* O coroado ganha o mesmo anel dourado de toda conquista completa
                  no app (ver lib/dourado.ts) — não só o selo, o CONTORNO
                  também muda, pra chamar o olho antes de reparar no selo. */}
              {i === 0 && (
                <span
                  className="absolute -top-2.5 -right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-sm"
                  style={{ background: "var(--color-accent)" }}
                  aria-label="o favorito"
                >
                  <Crown size={14} strokeWidth={2} className="text-[var(--color-on-accent)]" />
                </span>
              )}
              <Link
                href={`/livro/${f.slug}`}
                className="cover-lift block rounded-[var(--radius-2)] transition-transform duration-200 hover:-translate-y-0.5"
                title={f.title}
                style={i === 0 ? { boxShadow: `0 0 0 2px color-mix(in srgb, var(--color-accent) 55%, transparent)` } : undefined}
              >
                <Cover title={f.title} author={f.author} src={f.coverUrl} />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

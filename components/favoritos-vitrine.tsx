import Link from "next/link";
import { Crown } from "lucide-react";
import { Cover } from "@/components/cover";
import type { FavoritoBook } from "@/lib/favoritos";

/**
 * OS FAVORITOS, no perfil de quem visita. Até cinco, o primeiro coroado —
 * substitui "o que eu adorei" (todo 5 estrelas, sem limite, automático). Ver
 * lib/favoritos.ts. A versão editável (coroar, tirar) é
 * components/gerenciar-favoritos.tsx, e mora só em /perfil.
 */
export function FavoritosVitrine({ titulo, favoritos }: { titulo: string; favoritos: FavoritoBook[] }) {
  if (favoritos.length === 0) return null;

  return (
    <section className="surface mt-5 p-7">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {titulo}
      </h2>

      <ul className="mt-5 flex flex-wrap gap-5">
        {favoritos.map((f, i) => (
          <li key={f.slug} className="w-24 shrink-0 sm:w-28">
            <div className="relative">
              {i === 0 && (
                <span
                  className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: "var(--color-accent)" }}
                  aria-label="o favorito"
                >
                  <Crown size={13} strokeWidth={2} className="text-[var(--color-on-accent)]" />
                </span>
              )}
              <Link href={`/livro/${f.slug}`} className="cover-lift block" title={f.title}>
                <Cover title={f.title} author={f.author} src={f.coverUrl} />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

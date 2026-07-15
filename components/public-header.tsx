import Link from "next/link";
import { Logo } from "@/components/logo";

/**
 * Chrome for somebody who is not logged in.
 *
 * They get the mark, one door, and nothing else. The app sidebar is full of
 * things a visitor does not have (their shelves, their tags, their profile), and
 * showing it would be a lobby full of doors that are all locked. The landing is a
 * manifesto, and a manifesto with a nav rail beside it is a product tour.
 */
export function PublicHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
      <Link href="/">
        <Logo />
      </Link>

      <nav className="flex items-center gap-6">
        <Link
          href="/sobre"
          className="text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
        >
          Sobre
        </Link>
        <Link
          href="/entrar"
          className="rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-1.5 text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)]"
        >
          Entrar
        </Link>
      </nav>
    </header>
  );
}

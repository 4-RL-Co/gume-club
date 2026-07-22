import Link from "next/link";

/**
 * Estante · Estatísticas.
 *
 * Estatística não é um destino paralelo: é uma VISTA dos seus livros. Ela era um
 * item de barra lateral, o que a punha no mesmo nível de "onde estou", e ela não
 * é um lugar: é outro jeito de olhar para o mesmo lugar.
 */
export function ShelfTabs({ active }: { active: "estante" | "estatisticas" }) {
  const abas = [
    { key: "estante", label: "Estante", href: "/estante" },
    { key: "estatisticas", label: "Estatísticas", href: "/estatisticas" },
  ] as const;

  return (
    <nav className="mt-8 flex gap-2">
      {abas.map((a) => {
        const on = a.key === active;
        return (
          <Link
            key={a.key}
            href={a.href}
            aria-current={on ? "page" : undefined}
            className={[
              "pill px-4 py-2 text-[14px] transition-colors",
              on
                ? "afiado font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            {a.label}
          </Link>
        );
      })}
    </nav>
  );
}

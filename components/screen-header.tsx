/**
 * The header of a screen. This is the thing that sets the tone, and it is what
 * separates editorial from dashboard: a big display serif, high contrast, with a
 * lot of air around it, and underneath a single line of small, letterspaced
 * caps carrying the numbers.
 *
 * "44 LIVROS · 16 LIDOS", not a grey chip that says Total. Metadata in small
 * caps instead of UI labels. See ai/DECISIONS.md, "editorial de galeria".
 */
export function ScreenHeader({
  title,
  meta,
  children,
}: {
  title: React.ReactNode;
  /** The small-caps line. Falsy entries drop out, so an empty shelf says nothing. */
  meta?: (string | false | null | undefined)[];
  children?: React.ReactNode;
}) {
  const bits = (meta ?? []).filter(Boolean) as string[];

  return (
    <header className="mt-20 sm:mt-28">
      {/* Aggressive hierarchy is the whole trick. When the title, the metadata and
          the body all sit within a few points of each other, the page reads as a
          dashboard no matter how good the type is. 64px against 11px does not. */}
      <h1 className="voice max-w-3xl text-[44px] leading-[1.02] tracking-[-0.015em] sm:text-[64px]">
        {title}
      </h1>

      {bits.length > 0 && (
        <p className="tabular mt-7 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          {bits.join(" · ")}
        </p>
      )}

      {children}
    </header>
  );
}

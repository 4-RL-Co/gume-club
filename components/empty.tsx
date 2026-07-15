/**
 * An empty state, set as a printer would set it: a fleuron, a double rule, and a
 * line of type. Never an illustration. An illustration of a sad little book is
 * the visual language of a startup apologising, and this product does not
 * apologise for an empty shelf: an empty shelf is where every library starts.
 *
 * The fleuron is a real typographic ornament (U+2766, floral heart), set in the
 * display serif. It is the same move a colophon makes at the end of a chapter.
 */
export function Empty({
  children,
  ornament = "❦",
}: {
  children: React.ReactNode;
  ornament?: string;
}) {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <div
        aria-hidden
        className="voice text-2xl leading-none text-[var(--color-ink-faint)]"
      >
        {ornament}
      </div>

      {/* double rule: thick, hair, the way a title page separates matter */}
      <div aria-hidden className="mx-auto mt-6 w-24">
        <div className="h-px bg-[var(--color-rule)]" />
        <div className="mt-[3px] h-px bg-[var(--color-rule)] opacity-50" />
      </div>

      <p className="voice mt-7 text-[19px] leading-relaxed text-[var(--color-ink-soft)]">
        {children}
      </p>
    </div>
  );
}

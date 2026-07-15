/**
 * The herald's seal.
 *
 * A typographic seal, in the spirit of an engraved colophon: a hairline frame, a
 * fleuron, and words. It says a FACT, never a score.
 *
 * There is no number on it, and there will not be one. Not "brought 7 readers",
 * not a tier, not a medal, not a rank. The moment a number sits beside a person,
 * reading turns into standing, and standing is on the never list in the README.
 * Hospitality is not a leaderboard. See ai/DECISIONS.md.
 */
export function HeraldSeal({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-3 px-4 py-2.5 ${className}`}
      style={{
        border: "1px solid color-mix(in srgb, var(--color-ink) 22%, transparent)",
        borderRadius: "var(--radius-control)",
      }}
    >
      <span aria-hidden className="voice text-[15px] leading-none text-[var(--color-accent)]">
        ❦
      </span>
      <span className="text-[10px] uppercase leading-none tracking-[0.18em] text-[var(--color-ink-soft)]">
        trouxe leitores
      </span>
    </span>
  );
}

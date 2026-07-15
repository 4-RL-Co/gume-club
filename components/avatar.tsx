import Link from "next/link";

/**
 * A person is round. A book is a rectangle with a hard corner.
 *
 * That is the whole rule, and it is doing real work: on a feed where every row
 * carries a cover AND a face, the shape alone tells you which is which before
 * you have read a word. Rounding the person and squaring the book is why you can
 * skim it.
 *
 * No photo is not an error and it is not a grey silhouette: it is the reader's
 * initial, set on a quiet block, which is the same material the covers without
 * jackets are made of.
 */
export function Avatar({
  src,
  name,
  handle,
  size = 32,
}: {
  src?: string | null;
  name?: string | null;
  handle: string;
  size?: number;
}) {
  const label = name ?? handle;
  const initial = (label.trim()[0] ?? "?").toUpperCase();

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-2)] ring-1 ring-white/[0.08]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span
          className="font-medium text-[var(--color-ink-soft)]"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          {initial}
        </span>
      )}
    </span>
  );
}

/** The face, and clicking it takes you to the person. The name is the accessible label. */
export function AvatarLink({
  src,
  name,
  handle,
  size = 32,
}: {
  src?: string | null;
  name?: string | null;
  handle: string;
  size?: number;
}) {
  return (
    <Link href={`/@${handle}`} aria-label={name ?? handle} className="shrink-0">
      <Avatar src={src} name={name} handle={handle} size={size} />
    </Link>
  );
}

/**
 * Faces overlapping, for "three people you follow read this". Capped at four and
 * then the rest becomes a number, because the point is the FACES: past four they
 * stop being people and start being a metric.
 */
export function AvatarStack({
  people,
  size = 20,
  max = 4,
}: {
  people: { handle: string; name?: string | null; image?: string | null }[];
  size?: number;
  max?: number;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;

  return (
    <span className="flex items-center">
      {shown.map((p, i) => (
        <span key={p.handle} style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}>
          <Avatar src={p.image} name={p.name} handle={p.handle} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span className="tabular ml-2 text-[11px] text-[var(--color-ink-faint)]">+{rest}</span>
      )}
    </span>
  );
}

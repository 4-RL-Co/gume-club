/** O formato das estatísticas, antes dos números. Esqueleto, nunca ampulheta. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      <div className="mt-20 h-14 w-72 animate-pulse rounded-[var(--radius-2)] bg-white/[0.04] sm:mt-28" />
      <div className="mt-7 h-3 w-48 animate-pulse rounded-full bg-white/[0.03]" />

      <div className="mt-10 flex flex-col gap-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <section key={i} className="surface p-7 sm:p-8">
            <span className="block h-2.5 w-40 animate-pulse rounded-full bg-white/[0.04]" />
            <div className="mt-7 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <span key={j} className="block h-2.5 animate-pulse rounded-full bg-white/[0.03]" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

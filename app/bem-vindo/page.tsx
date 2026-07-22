import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { getInviter, getShelvesToFollow } from "@/lib/invite";
import { getShelf, getShelfCounts } from "@/lib/shelf";
import { isFollowing } from "@/lib/social";
import { ScreenHeader } from "@/components/screen-header";
import { CoverWall } from "@/components/cover-wall";
import { FollowButton } from "@/components/follow-button";
import { Cover } from "@/components/cover";

export const dynamic = "force-dynamic";

/**
 * The door.
 *
 * Nobody may land in an empty room. If you came through someone's invite, the
 * first thing you see is not a blank shelf, it is THEIRS: "A Marina te trouxe",
 * and then the books he reads, and a button to follow him. You begin the app
 * inside a conversation instead of inside a void.
 *
 * If you arrived on your own, you get shelves worth following, curated by hand.
 * Either way, the first screen has people on it. See ai/DECISIONS.md.
 */
export default async function BemVindo() {
  const viewer = await getViewer();
  if (!viewer) redirect("/entrar");

  const inviter = await getInviter(viewer.id);

  if (!inviter) return <SemConvite viewerId={viewer.id} />;

  const [books, counts, following] = await Promise.all([
    getShelf(viewer, inviter.id, { filter: "tudo", sort: "adicionado" }),
    getShelfCounts(viewer, inviter.id),
    isFollowing(viewer.id, inviter.id),
  ]);

  const name = inviter.displayName ?? inviter.handle;

  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 sm:px-10">
      <ScreenHeader
        title={
          <>
            {name} <span className="text-[var(--color-ink-soft)]">te trouxe.</span>
          </>
        }
        meta={[`${counts.tudo ?? 0} livros na estante dele`, (counts.lidos ?? 0) > 0 && `${counts.lidos} lidos`]}
      >
        <p className="mt-8 max-w-xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
          Você não chegou aqui por um anúncio. Chegou por uma pessoa, e é a estante dela que
          abre o Gume para você.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <FollowButton userId={inviter.id} handle={inviter.handle} following={following} />
          <Link
            href="/"
            className="text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            ir para a minha estante
          </Link>
        </div>
      </ScreenHeader>

      {books.length > 0 && (
        <>
          <h2 className="mt-20 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            o que {name} lê
          </h2>
          <CoverWall books={books} />
        </>
      )}
    </main>
  );
}

/**
 * Arrived alone. Open signup stays open, and it does not lead to a dark room: a
 * handful of shelves, chosen by a person. Never "suggested for you", never an
 * engagement signal, never a ranking.
 */
async function SemConvite({ viewerId }: { viewerId: string }) {
  const shelves = await getShelvesToFollow(viewerId);

  return (
    <main className="mx-auto max-w-4xl px-6 pb-32 sm:px-10">
      <ScreenHeader title="Bem-vindo ao Gume." meta={["a mente nunca perde o fio"]}>
        <p className="mt-8 max-w-xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
          Uma estante sozinha é uma planilha. Siga alguém, e o Gume começa a acontecer. Estas
          foram escolhidas a dedo, por gente, e não por um algoritmo.
        </p>
      </ScreenHeader>

      {shelves.length === 0 ? (
        <p className="mt-16 text-[var(--color-ink-soft)]">
          Você é o primeiro por aqui.{" "}
          <Link href="/buscar" className="underline decoration-[var(--color-ink)] underline-offset-4">
            Comece pela sua estante.
          </Link>
        </p>
      ) : (
        <ul className="mt-16 grid gap-4 sm:grid-cols-2">
          {shelves.map((s) => (
            <li key={s.id} className="card flex items-center gap-4 p-6">
              <div className="cover-lift w-12 shrink-0">
                <Cover title={s.displayName ?? s.handle} author={null} src={null} />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/@${s.handle}`} className="voice block truncate text-[17px] hover:underline">
                  {s.displayName ?? s.handle}
                </Link>
                <p className="tabular mt-0.5 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                  {s.books} {s.books === 1 ? "livro" : "livros"}
                </p>
              </div>
              <FollowButton userId={s.id} handle={s.handle} following={false} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-14">
        <Link
          href="/"
          className="text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
        >
          ir para a minha estante
        </Link>
      </p>
    </main>
  );
}

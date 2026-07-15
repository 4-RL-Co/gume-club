import Link from "next/link";
import { Empty } from "@/components/empty";
import { Cover } from "@/components/cover";
import { AvatarLink } from "@/components/avatar";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { recommendations, works, authors, users } from "@/lib/db/schema";

/**
 * Duas trilhas, e elas não são a mesma coisa.
 *
 * O que você DEU é o registro do que você pôs na mão de alguém: é o único lugar
 * que lembra que você já deu este livro a esta pessoa. O que você RECEBEU é uma
 * pilha de livros que alguém escolheu para você, com nome e motivo. Empilhadas
 * numa coluna só, viravam "atividade de recomendação", que é a papa que este app
 * existe para recusar.
 *
 * Nenhuma das duas é placar: sem "top recomendador", sem ranking, sem taxa de
 * aceitação. Mora dentro de /pessoas, como uma aba.
 */
export const TRACKS = [
  { key: "dadas", label: "que você deu" },
  { key: "recebidas", label: "que te deram" },
] as const;

export type TrackKey = (typeof TRACKS)[number]["key"];

export async function Recomendacoes({
  viewerId,
  track: asked,
}: {
  viewerId: string;
  track?: string;
}) {
  const chosen = TRACKS.find((t) => t.key === asked)?.key;

  const [dadas, recebidas] = await Promise.all([list("from", viewerId), list("to", viewerId)]);

  // Sem trilha pedida pelo nome, abre a que TEM alguma coisa dentro. Cair numa
  // coluna vazia enquanto a outra guarda três livros é o app escondendo o próprio
  // conteúdo atrás de um padrão.
  const track: TrackKey =
    chosen ?? (dadas.length === 0 && recebidas.length > 0 ? "recebidas" : "dadas");

  const shown = track === "dadas" ? dadas : recebidas;
  const counts = { dadas: dadas.length, recebidas: recebidas.length };

  return (
    <div className="mt-8">
      <nav className="flex gap-2">
        {TRACKS.map((t) => {
          const active = t.key === track;
          return (
            <Link
              key={t.key}
              href={`/pessoas?aba=recomendacoes&trilha=${t.key}`}
              aria-current={active ? "page" : undefined}
              className={[
                "pill flex items-center gap-2 px-4 py-2 text-[14px] transition-colors",
                active
                  ? "afiado font-medium text-[var(--color-ink)]"
                  : "text-[var(--color-ink-soft)] hover:bg-white/[0.03] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {t.label}
              <span className="tabular text-[12px] text-[var(--color-ink-faint)]">{counts[t.key]}</span>
            </Link>
          );
        })}
      </nav>

      {shown.length === 0 ? (
        <Empty>
          {track === "dadas"
            ? "Você ainda não passou nenhum livro adiante. Abra um livro e recomende a alguém: ele cai na estante da pessoa, vindo de você."
            : "Ninguém te deu um livro ainda. Quando alguém der, ele aparece aqui e na sua estante."}
        </Empty>
      ) : (
        // Card, e não lista: a capa (o argumento) maior no alto, a nota no meio, e quem
        // passou o livro embaixo. Numa tela ampla, a lista de tiras fazia a capa sumir.
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <li key={r.id} className="surface flex flex-col p-6">
              <div className="flex gap-4">
                <Link href={`/livro/${r.slug}`} className="cover-lift w-16 shrink-0">
                  <Cover title={r.title} author={r.author} src={r.coverUrl} />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/livro/${r.slug}`}
                    className="voice text-[17px] leading-snug hover:underline"
                  >
                    {r.title}
                  </Link>
                  {r.author && (
                    <p className="mt-1 text-[13px] text-[var(--color-ink-faint)]">{r.author}</p>
                  )}
                </div>
              </div>

              {r.note && (
                <p className="voice mt-4 text-[15px] leading-relaxed text-[var(--color-ink)]">
                  {r.note}
                </p>
              )}

              <div className="mt-auto flex items-center gap-2 pt-5">
                <AvatarLink src={r.image} name={r.displayName} handle={r.handle} size={28} />
                <p className="tabular text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                  {track === "dadas" ? "para" : "de"}{" "}
                  <Link href={`/@${r.handle}`} className="hover:text-[var(--color-ink)]">
                    {r.displayName ?? r.handle}
                  </Link>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * One track. `from` is what you gave, so we join the person on the receiving end;
 * `to` is what you were given, so we join the sender. Same shape either way, so
 * both render through one component and only the preposition changes.
 */
function list(side: "from" | "to", viewerId: string) {
  const mine = side === "from" ? recommendations.fromUserId : recommendations.toUserId;
  const other = side === "from" ? recommendations.toUserId : recommendations.fromUserId;

  return db
    .select({
      id: recommendations.id,
      note: recommendations.note,
      createdAt: recommendations.createdAt,
      slug: works.slug,
      title: works.title,
      author: authors.name,
      coverUrl: sql<string | null>`(
        select e.cover_url from editions e
        where e.work_id = ${works.id} and e.cover_url is not null
        order by e.created_at limit 1
      )`,
      handle: users.handle,
      displayName: users.displayName,
      image: users.image,
    })
    .from(recommendations)
    .innerJoin(works, eq(works.id, recommendations.workId))
    .leftJoin(authors, eq(authors.id, works.authorId))
    .innerJoin(users, eq(users.id, other))
    .where(eq(mine, viewerId))
    .orderBy(desc(recommendations.id));
}

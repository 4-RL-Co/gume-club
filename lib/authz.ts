import { and, eq, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/**
 * ════════════════════════════════════════════════════════════════════
 *  The authorization module. Read SECURITY.md before touching this.
 *
 *  This file is written by hand and reviewed by a human, always, even
 *  when an agent wrote the rest of the PR. It is deliberately small
 *  enough to read in full in five minutes.
 *
 *  Rules:
 *   1. Every query that can return another user's rows goes through
 *      `visibleTo()`. The filter runs in SQL, never in JavaScript, and
 *      never in the client.
 *   2. Every mutation goes through `assertOwner()` BEFORE it mutates.
 *   3. Being authenticated means nothing. Authentication is not
 *      authorization. A logged-in user is still a stranger to every row
 *      that isn't theirs.
 *
 *  If you find an ownership check written inline in a route handler,
 *  that's the bug. Move it here.
 *
 *  ────────────────────────────────────────────────────────────────
 *  THE ALIAS RULE. Read this before you "fix" anything below.
 *
 *  `visibleTo()` emits the REAL TABLE NAME, on purpose. Alias the table
 *  in your query and Postgres refuses the statement outright:
 *
 *      invalid reference to FROM-clause entry for table "reviews"
 *
 *  That is not a limitation. That IS the guarantee. The visibility rule
 *  cannot be made to point at the wrong table, because it does not know
 *  how to point anywhere except at the true name.
 *
 *  NEVER "fix" this by making visibleTo() take an alias as a parameter.
 *  The day it accepts one, passing the WRONG alias starts compiling,
 *  starts running, and starts returning rows that should not exist.
 *  Today that mistake is loud and immediate; that day it becomes silent.
 *  A leak you cannot compile is worth more than a leak you have to
 *  remember to look for.
 *
 *  If a query needs an alias, REWRITE THE QUERY. Alias the table you own
 *  (your own rows need no visibility filter, because you can always see
 *  what is yours) and leave the OTHER person's table unaliased, which is
 *  the one visibleTo() is filtering. lib/explore.ts does exactly this in
 *  getAfinidade(), and says so in a comment.
 *  ────────────────────────────────────────────────────────────────
 * ════════════════════════════════════════════════════════════════════
 */

export type Viewer = { id: string } | null;

export type Visibility = "public" | "followers" | "private";

/** A row that belongs to someone and carries its own visibility. */
export type OwnedRow = { userId: string; visibility: Visibility };

export class Forbidden extends Error {
  constructor(message = "forbidden") {
    super(message);
    this.name = "Forbidden";
  }
}

/**
 * SQL predicate: "rows of `ownerCol` with `visCol` that this viewer may see."
 *
 * - anonymous            → public rows only
 * - the owner            → all their own rows, whatever the visibility
 * - a logged-in stranger → public rows, plus `followers` rows of people they follow
 *
 * The `followers` case is expressed as an EXISTS against the follows table so
 * it stays a single query and cannot be forgotten by a caller.
 */
export function visibleTo(
  viewer: Viewer,
  ownerCol: PgColumn,
  visCol: PgColumn,
): SQL {
  /**
   * ════════════════════════════════════════════════════════════════════
   *  O BANIDO SOME DAQUI, E ISSO SOME DE TODO LUGAR DE UMA VEZ.
   *
   *  A regra deste repo é que TODA leitura que pode devolver a linha de
   *  outra pessoa passa por visibleTo(). Então banir alguém aqui dentro é
   *  bani-lo do feed, do explorar, da estante pública, das estatísticas da
   *  comunidade, dos pôsteres do WhatsApp e de tudo que vier depois — sem
   *  ninguém precisar lembrar de filtrar em cada lugar.
   *
   *  A alternativa seria um `and(naoBanido)` em quarenta consultas, e a
   *  quadragésima primeira seria escrita por alguém que não sabia. Esse é
   *  exatamente o modo de falha que a lista PUBLICO de lib/surface.test.ts
   *  existe para pegar, e ele não deve depender de um teste: deve ser
   *  impossível.
   *
   *  Custa uma subconsulta correlacionada por checagem de visibilidade,
   *  contra a chave primária de `users`. É barato, e é a defesa mais forte
   *  que dava para comprar por esse preço.
   *
   *  Vale para a linha do banido nas telas dos OUTROS. A conta dele para
   *  de existir na hora do login (getViewer devolve null), e o perfil dele
   *  devolve 404.
   * ════════════════════════════════════════════════════════════════════
   */
  const donoExiste = sql`not exists (
    select 1 from users bu
     where bu.id = ${ownerCol}
       and (bu.banned_at is not null or bu.deleted_at is not null)
  )`;

  const isPublic = eq(visCol, "public");

  if (!viewer) return and(donoExiste, isPublic)!;

  const isMine = eq(ownerCol, viewer.id);

  const isFollowersAndIFollow = and(
    eq(visCol, "followers"),
    sql`exists (
      select 1 from follows f
      where f.follower_id = ${viewer.id}::uuid
        and f.followee_id = ${ownerCol}
        and f.state = 'accepted'
    )`,
  );

  // O dono continua vendo as PRÓPRIAS linhas mesmo banido: o dado é dele, e banir não
  // é confiscar. Ele só não vê mais nada, porque a sessão dele deixa de existir.
  return or(isMine, and(donoExiste, or(isPublic, isFollowersAndIFollow)))!;
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  SQL predicate: "rows of `ownerCol` where the viewer and the owner
 *  follow EACH OTHER."
 *
 *  This exists for exactly one thing: the reader's contact channel, on
 *  an available copy. It is NOT a general visibility rule and must not
 *  become one — nothing else in the product is gated on mutual follow.
 *
 *  WHY MUTUAL FOLLOW IS THE TRUST SYSTEM
 *
 *  The alternative was a private message system, and a DM is the single
 *  largest moderation surface a product can have. "No comments" was
 *  decided precisely so that moderation stays possible for ONE person.
 *  A marketplace smuggles messages, reputation and dispute into a
 *  weekend project through the back door.
 *
 *  Mutual follow is a trust system we ALREADY HAVE, and it costs nothing
 *  to run: you follow them, they follow you back. The Gume makes the
 *  introduction and leaves the room.
 *
 *  THE COST, ACCEPTED WITH EYES OPEN: a swap only happens between people
 *  who already chose each other. A stranger can see the copy is
 *  available and has no way to ask. That is the CORRECT behaviour, not a
 *  missing feature. See ai/DECISIONS.md.
 * ════════════════════════════════════════════════════════════════════
 */
export function mutuals(viewer: Viewer, ownerCol: PgColumn): SQL {
  // Nobody is mutual with nobody. An anonymous visitor never sees a contact.
  if (!viewer) return sql`false`;

  return sql`(
    ${ownerCol} <> ${viewer.id}::uuid
    and exists (
      select 1 from follows f
      where f.follower_id = ${viewer.id}::uuid
        and f.followee_id = ${ownerCol}
        and f.state = 'accepted'
    )
    and exists (
      select 1 from follows f2
      where f2.follower_id = ${ownerCol}
        and f2.followee_id = ${viewer.id}::uuid
        and f2.state = 'accepted'
    )
  )`;
}

/**
 * In-memory mirror of `visibleTo`, for tests and for the rare case where a row
 * is already loaded. Never use this INSTEAD of the SQL filter: over-fetching
 * rows and then hiding them in JavaScript is how data leaks.
 */
export function canSee(
  viewer: Viewer,
  row: OwnedRow,
  viewerFollowsOwner = false,
): boolean {
  if (row.visibility === "public") return true;
  if (!viewer) return false;
  if (viewer.id === row.userId) return true;
  if (row.visibility === "followers") return viewerFollowsOwner;
  return false; // private
}

/** Throws unless the viewer owns the row. Call this BEFORE every mutation. */
export function assertOwner(viewer: Viewer, row: { userId: string }): asserts viewer is { id: string } {
  if (!viewer || viewer.id !== row.userId) throw new Forbidden();
}

/** Throws unless someone is logged in. Authentication only: never enough on its own. */
export function assertAuthenticated(viewer: Viewer): asserts viewer is { id: string } {
  if (!viewer) throw new Forbidden("unauthenticated");
}

/**
 * The ONE case where a viewer may write a row that belongs to somebody else.
 *
 * A recommendation lands on the recipient's shelf: one book, one person, one line
 * of why. That is the product, and it is why this exception exists at all.
 *
 * It is deliberately the narrowest possible hole, and the caller may do exactly
 * one thing with it: INSERT a `want_to_read` library_entry stamped with
 * `recommended_by`. It never permits editing, deleting, re-shelving, rating or
 * reviewing on somebody else's behalf, and `ON CONFLICT DO NOTHING` at the call
 * site means a recommendation can never overwrite a book they already shelved.
 *
 * You cannot recommend to yourself, and you must be logged in. Everything else a
 * recommendation touches (the recommendations row, the activity) is the sender's
 * own, and goes through the normal rules.
 */
export function assertCanRecommendTo(
  viewer: Viewer,
  targetUserId: string,
): asserts viewer is { id: string } {
  assertAuthenticated(viewer);
  if (viewer.id === targetUserId) throw new Forbidden("cannot recommend to yourself");
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUANDO ENTRAR DINHEIRO (apoiador, um dia): NUNCA float.
 *
 *  Dinheiro é inteiro, em centavos. `float` não representa 0,10 e o
 *  erro se acumula em toda soma: um centavo por transação vira uma
 *  divergência de caixa que ninguém sabe explicar, e o dia em que
 *  alguém for auditar, a conta não fecha.
 *
 *  Isto está anotado AQUI, no módulo que todo mundo lê antes de mexer
 *  em permissão, e no schema, ao lado da tabela que ainda não existe.
 *  A regra precisa estar escrita antes da primeira linha de cobrança,
 *  não depois. Ver SECURITY-AUDIT.md.
 * ════════════════════════════════════════════════════════════════════
 */

/** Librarians can edit catalog metadata (works, editions, authors). Nothing else. */
export function assertLibrarian(viewer: Viewer, tier: number): asserts viewer is { id: string } {
  assertAuthenticated(viewer);
  if (tier < 1) throw new Forbidden("not a librarian");
}

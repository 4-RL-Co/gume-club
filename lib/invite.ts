import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Server only. The door.
 *
 * The handle IS the invite. There is no code table, no invite that expires, no
 * invite that runs out, and no waiting list. Scarcity of invitations is marketing
 * pretending to be exclusivity, and we do not sell exclusivity. See ai/DECISIONS.md.
 */

/** Anyone's invite link. Everyone has one, always, and it never runs out. */
export function inviteLink(handle: string, appUrl = process.env.APP_URL ?? ""): string {
  return `${appUrl}/entrar?convite=${handle}`;
}

/** Who brought this reader in. Null when they arrived on their own, which is fine. */
export async function getInviter(userId: string) {
  const [row] = await db
    .select({
      id: sql<string>`inviter.id`,
      handle: sql<string>`inviter.handle`,
      displayName: sql<string | null>`inviter.display_name`,
    })
    .from(users)
    .innerJoin(sql`users as inviter`, sql`inviter.id = ${users.invitedBy}`)
    .where(and(eq(users.id, userId), sql`inviter.deleted_at is null`))
    .limit(1);

  return row ?? null;
}

/**
 * ═══ O ARAUTO NÃO MORA MAIS AQUI ═══
 *
 * Havia uma `isHerald()` neste arquivo, e ela era um segundo lugar que decidia quem é
 * arauto: um convidado, um livro. A insígnia de verdade mora em lib/badges.ts, e a régua
 * dela é outra: CINCO leitores que ficaram, cada um com dez livros (lib/regras.ts). Duas
 * definições da mesma honra é como o perfil mostrava o selo para quem a página de
 * insígnias não reconhecia. Uma honra, uma régua, um lugar. Quem precisa do selo pergunta
 * a getBadges(), como toda tela que mostra insígnia. Ver lib/conexoes.sql.test.ts.
 */

/**
 * Shelves worth following, for a reader who arrived alone.
 *
 * Nobody may land in an empty room. Curated BY HAND, never by an algorithm: no
 * ranking, no "suggested for you", no engagement signal. For now the hand-written
 * list lives in CURATED; when it is empty or thin, we fall back to the founding
 * readers, which is still a human choice (the people who were here first) and not
 * a computed one.
 */
const CURATED: string[] = [];

export async function getShelvesToFollow(viewerId: string | null, limit = 6) {
  const rows = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      books: sql<number>`(
        select count(*)::int from library_entries le
        where le.user_id = ${users.id} and le.visibility = 'public'
      )`,
    })
    .from(users)
    .where(and(
      sql`${users.deletedAt} is null`,
      viewerId ? sql`${users.id} <> ${viewerId}::uuid` : undefined,
      // never suggest somebody with nothing on their shelf: that is an empty room
      // with a different door on it.
      sql`exists (
        select 1 from library_entries le
        where le.user_id = ${users.id} and le.visibility = 'public'
      )`,
      // parameterised, never interpolated: see scripts/audit-security.mjs
      CURATED.length ? inArray(users.handle, CURATED) : undefined,
    ))
    .orderBy(users.createdAt)
    .limit(limit);

  return rows;
}

import { and, eq, sql } from "drizzle-orm";
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
 * ═══ `getShelvesToFollow()` NÃO MORA MAIS AQUI ═══
 *
 * Buscava estantes-modelo pra tela de /bem-vindo, pra quem chegava sem
 * convite. "tire a pagina de bem-vindo do gume, muito ruim (...) pode já
 * redirecionar pra pasta inicial mesmo" — o dono. A tela saiu inteira; sem
 * ela, esta função não tinha mais quem a chamasse. Ver ai/DECISIONS.md.
 */

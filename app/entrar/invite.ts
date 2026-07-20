"use server";

import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { INVITE_COOKIE } from "@/lib/auth";

/**
 * Remembers who invited you, and tells the door who to greet.
 *
 * A link is /entrar?convite=<handle>. The handle goes into a short-lived httpOnly
 * cookie so it survives the round trip to Google and back, which a query string
 * would not. lib/auth.ts reads it once, at user creation, and writes users.invited_by.
 *
 * ═══ POR QUE ELE AGORA LÊ O BANCO ═══
 *
 * A recomendação de uma PESSOA é o produto: quem chega por um convite não chega num
 * app qualquer, chega porque alguém chamou. Então a porta diz o nome de quem chamou,
 * e para isso precisa traduzir o handle num nome. É uma leitura só, do que já é
 * público (o handle e o nome de exibição de um leitor), e nunca uma escrita.
 *
 * A leitura é o portão de sanidade do convite: um handle que não é de ninguém, ou é
 * de alguém banido ou apagado, devolve `null`, e a porta não saúda ninguém. Um convite
 * para um fantasma não vira uma saudação a um fantasma.
 *
 * Esta ação roda ANTES de a pessoa existir: não há sessão, e por isso ela está na
 * lista PUBLICO de lib/surface.test.ts. A leitura é só de dado público, e não há
 * linha de leitor a proteger aqui.
 */
export async function rememberInviter(handle: string): Promise<string | null> {
  const clean = handle.trim().replace(/^@/, "").slice(0, 40);
  if (!/^[a-z0-9-]+$/i.test(clean)) return null; // a junk handle is simply not remembered

  const [quem] = await db.execute<{ handle: string; display_name: string | null }>(sql`
    select handle, display_name from users
     where lower(handle) = lower(${clean})
       and deleted_at is null
       and banned_at is null
     limit 1
  `);

  // Um convite para alguém que não existe não é lembrado, e não saúda ninguém.
  if (!quem) return null;

  (await cookies()).set(INVITE_COOKIE, quem.handle, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // one hour: long enough to sign up, short enough to be forgotten
    path: "/",
  });

  return quem.display_name ?? quem.handle;
}

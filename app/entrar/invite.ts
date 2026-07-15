"use server";

import { cookies } from "next/headers";
import { INVITE_COOKIE } from "@/lib/auth";

/**
 * Remembers who invited you, for the length of one signup.
 *
 * A link is /entrar?convite=<handle>. The handle goes into a short-lived httpOnly
 * cookie so it survives the round trip to GitHub and back, which a query string
 * would not. lib/auth.ts reads it once, at user creation, and writes users.invited_by.
 *
 * There is no invite screen and none is being built. This is the one line that
 * makes the lineage recordable at all, and it has to exist before the first ten
 * readers sign up, not after.
 */
export async function rememberInviter(handle: string): Promise<void> {
  const clean = handle.trim().replace(/^@/, "").slice(0, 40);
  if (!/^[a-z0-9-]+$/i.test(clean)) return; // a junk handle is simply not remembered

  (await cookies()).set(INVITE_COOKIE, clean, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // one hour: long enough to sign up, short enough to be forgotten
    path: "/",
  });
}

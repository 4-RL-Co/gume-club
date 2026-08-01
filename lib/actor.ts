import { Forbidden } from "@/lib/authz";
import { getViewer } from "@/lib/viewer";
import { limitarEscrita } from "@/lib/escrita";

/**
 * Who is writing. Every mutation resolves the actor here and then hands the row
 * to assertOwner() in lib/authz.ts. This function does NOT decide permissions:
 * it only answers "who is this", which is authentication, and authentication is
 * not authorization.
 *
 * An unauthenticated write is Forbidden, in every environment. There is no
 * development shortcut here any more: sessions are real, so a write without one
 * is a bug, not a convenience.
 *
 * ═══ E É AQUI QUE A ESCRITA É CONTADA ═══
 *
 * O limite de escrita morava no `middleware.ts`, e cobria toda ação de servidor de uma
 * vez, porque toda ação é um POST. Isso morreu quando o limite foi para o banco: o
 * middleware roda no runtime Edge, que não fala com o Postgres. Ver lib/rate-limit.ts.
 *
 * Ele desceu para cá, que é o portão por onde toda mutação já passava — e o comentário
 * acima já dizia isso desde sempre: "every mutation resolves the actor here".
 *
 * A propriedade que valia ouro continua de pé: **uma ação nova nasce contada sem ninguém
 * lembrar.** Ver lib/escrita.ts e lib/acoes.test.ts.
 */
export async function getActor(): Promise<{ id: string }> {
  const viewer = await getViewer();
  if (!viewer) throw new Forbidden("unauthenticated");

  await limitarEscrita(viewer.id);

  return viewer;
}

/**
 * The actor, or nobody. For READS: a page that shows "your rating, your review"
 * needs to know whether there is a you, and an anonymous visitor is not an error.
 * Mutations use getActor(), which throws instead.
 */
export async function getActorOrNull(): Promise<{ id: string } | null> {
  return getViewer();
}

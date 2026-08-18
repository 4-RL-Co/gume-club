import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertAuthenticated, visibleTo, type Viewer } from "@/lib/authz";
import { reviews } from "@/lib/db/schema";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O UPVOTE. Ver a migration 0064 pro porquê inteiro.
 *
 *  Vota em RESENHA, nunca em pessoa. Não dá para votar na própria (não é
 *  reconhecimento de si mesmo), e só dá para votar no que você já pode VER —
 *  a mesma visibleTo() de sempre, checada de novo aqui dentro, e não só
 *  confiada de quem chamou: o botão só aparece numa resenha visível, mas o
 *  servidor não confia em o que o botão promete.
 * ════════════════════════════════════════════════════════════════════
 */

export async function upvotar(actor: { id: string }, reviewId: string): Promise<{ ok: true } | { ok: false }> {
  assertAuthenticated(actor as Viewer);

  const gravadas = await db.execute(sql`
    insert into review_upvotes (user_id, review_id)
    select ${actor.id}::uuid, reviews.id
      from reviews
     where reviews.id = ${reviewId}::uuid
       and reviews.deleted_at is null
       and reviews.user_id <> ${actor.id}::uuid
       and ${visibleTo({ id: actor.id }, reviews.userId, reviews.visibility)}
    on conflict (user_id, review_id) do nothing
    returning review_id`);

  return { ok: gravadas.length > 0 };
}

export async function tirarUpvote(actor: { id: string }, reviewId: string): Promise<void> {
  assertAuthenticated(actor as Viewer);
  await db.execute(sql`
    delete from review_upvotes where user_id = ${actor.id}::uuid and review_id = ${reviewId}::uuid`);
}

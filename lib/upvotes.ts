import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertAuthenticated, visibleTo, type Viewer } from "@/lib/authz";
import { reviews, collections } from "@/lib/db/schema";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O UPVOTE. Ver a migration 0064 (resenha) e 0066 (lista) pro porquê inteiro.
 *
 *  Vota em RESENHA ou LISTA, nunca em pessoa. Não dá para votar na própria
 *  (não é reconhecimento de si mesmo), e só dá para votar no que você já
 *  pode VER — a mesma visibleTo() de sempre, checada de novo aqui dentro, e
 *  não só confiada de quem chamou: o botão só aparece numa resenha/lista
 *  visível, mas o servidor não confia no que o botão promete.
 *
 *  ═══ QUEM VOTOU É PRIVADO, MESMO PADRÃO DE "QUEM GUARDOU" ═══
 *
 *  "já que upvote é ferramenta de amizade, tem que ser possível ver quem
 *  deu upvote" — o dono. O NÚMERO é público (aparece pra qualquer um); a
 *  LISTA de rostos só aparece para quem é DONO da resenha/lista, exatamente
 *  como `quemGuardou()` já faz em lib/listas.ts. A checagem de dono mora
 *  DENTRO da consulta (`c.user_id = viewer.id`) — quem não é dono recebe
 *  lista vazia, nunca um erro que confirme que a resenha/lista existe.
 * ════════════════════════════════════════════════════════════════════
 */

export type QuemVotou = { handle: string; name: string | null; image: string | null };

// ─────────────────────────────────────────────────────── resenha

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

/** Os rostos de quem votou numa resenha seus. Vazio para quem não é o autor. */
export async function quemUpvotouResenha(viewer: Viewer, reviewId: string): Promise<QuemVotou[]> {
  if (!viewer) return [];
  return db.execute<QuemVotou>(sql`
    select u.handle, u.display_name as name, u.image
      from review_upvotes ru
      join reviews r on r.id = ru.review_id
      join users u on u.id = ru.user_id
     where ru.review_id = ${reviewId}::uuid
       and r.user_id = ${viewer.id}::uuid
       and u.deleted_at is null and u.banned_at is null
     order by ru.created_at desc
     limit 200`);
}

// ─────────────────────────────────────────────────────── lista

export async function upvotarLista(actor: { id: string }, collectionId: string): Promise<{ ok: true } | { ok: false }> {
  assertAuthenticated(actor as Viewer);

  const gravadas = await db.execute(sql`
    insert into list_upvotes (user_id, collection_id)
    select ${actor.id}::uuid, collections.id
      from collections
     where collections.id = ${collectionId}::uuid
       and collections.user_id <> ${actor.id}::uuid
       and ${visibleTo({ id: actor.id }, collections.userId, collections.visibility)}
    on conflict (user_id, collection_id) do nothing
    returning collection_id`);

  return { ok: gravadas.length > 0 };
}

export async function tirarUpvoteLista(actor: { id: string }, collectionId: string): Promise<void> {
  assertAuthenticated(actor as Viewer);
  await db.execute(sql`
    delete from list_upvotes where user_id = ${actor.id}::uuid and collection_id = ${collectionId}::uuid`);
}

/** Quantos votaram, e se ESTE viewer já votou. Para abrir a página da lista. */
export async function contarUpvotesLista(
  collectionId: string,
  viewerId: string | null,
): Promise<{ n: number; votei: boolean }> {
  const [row] = await db.execute<{ n: number; votei: boolean }>(sql`
    select count(*)::int as n,
           coalesce(bool_or(user_id = ${viewerId ?? null}::uuid), false) as votei
      from list_upvotes where collection_id = ${collectionId}::uuid`);
  return { n: row?.n ?? 0, votei: row?.votei ?? false };
}

/** Os rostos de quem votou numa lista sua. Vazio para quem não é dono dela. */
export async function quemUpvotouLista(viewer: Viewer, collectionId: string): Promise<QuemVotou[]> {
  if (!viewer) return [];
  return db.execute<QuemVotou>(sql`
    select u.handle, u.display_name as name, u.image
      from list_upvotes lu
      join collections c on c.id = lu.collection_id
      join users u on u.id = lu.user_id
     where lu.collection_id = ${collectionId}::uuid
       and c.user_id = ${viewer.id}::uuid
       and u.deleted_at is null and u.banned_at is null
     order by lu.created_at desc
     limit 200`);
}

import { and, inArray, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { visibleTo, type Viewer } from "@/lib/authz";
import { ratings, users } from "@/lib/db/schema";

/** Server only. What the people you follow thought of a book. */

export type FriendRating = {
  handle: string;
  name: string | null;
  image: string | null;
  /** smallint 1..5, e na tela é uma PALAVRA. Ver lib/veredito.ts. */
  value: number;
};

export type Opinion = {
  friends: FriendRating[];
};

/**
 * O que as pessoas que você segue acharam, para um lote de obras.
 *
 * Não existe média aqui, nem a dos amigos: a nota agora é uma palavra, e palavra
 * não soma. Não existe "a média entre gostei e adorei". O que existe é "o Rui
 * adorou e a Tereza gostou", que é opinião de gente, e você discute com a pessoa
 * se discordar. Média global segue proibida, e agora é impossível por construção.
 *
 * Uma consulta para a estante inteira, e não uma por livro: uma estante de 400
 * livros seriam 400 idas ao banco. O filtro de visibilidade é o visibleTo(), em
 * SQL: nota privada não sai do banco. Ver SECURITY.md.
 */
export async function getFriendRatings(
  viewer: Viewer,
  workIds: string[],
): Promise<Record<string, Opinion>> {
  if (!viewer || workIds.length === 0) return {};

  const rows = await db
    .select({
      workId: ratings.workId,
      value: ratings.value,
      handle: users.handle,
      name: users.displayName,
      image: users.image,
    })
    .from(ratings)
    .innerJoin(users, eq(users.id, ratings.userId))
    .where(and(
      inArray(ratings.workId, workIds),
      // your own rating is not news to you: it is shown separately, as yours.
      sql`${ratings.userId} <> ${viewer.id}::uuid`,
      // only people you follow. never "readers like you", never everyone.
      sql`exists (
        select 1 from follows f
        where f.follower_id = ${viewer.id}::uuid
          and f.followee_id = ${ratings.userId}
          and f.state = 'accepted'
      )`,
      visibleTo(viewer, ratings.userId, ratings.visibility),
      sql`${users.deletedAt} is null`,
    ))
    .orderBy(sql`${ratings.value} desc`);

  const byWork: Record<string, Opinion> = {};

  for (const r of rows) {
    const op = (byWork[r.workId] ??= { friends: [] });
    op.friends.push({ handle: r.handle, name: r.name, image: r.image, value: r.value });
  }

  return byWork;
}

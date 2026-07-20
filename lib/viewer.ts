import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Viewer } from "@/lib/authz";

/**
 * Who is looking. Authentication only: this says WHO, never WHAT THEY MAY SEE.
 * What they may see is decided by visibleTo() and assertOwner(), in lib/authz.ts.
 *
 * The session is read from an httpOnly cookie on the server. It is never trusted
 * from a header, a query param, or anything else the client can set.
 */
export async function getViewer(): Promise<Viewer> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  /**
   * UM LEITOR APAGADO OU BANIDO É NINGUÉM, mesmo segurando um cookie de sessão vivo.
   *
   * Este é o funil por onde TUDO passa: toda tela, toda ação de servidor, toda rota.
   * Banir aqui é banir de tudo, e não depende de nenhuma tela lembrar de checar.
   *
   * Note que a gente NÃO apaga a sessão dele no banco. Não precisa: a sessão pode
   * continuar existindo, porque ela deixou de significar alguma coisa. Uma defesa que
   * depende de a gente ter conseguido apagar todas as sessões é uma defesa que falha
   * na sessão que a gente não achou.
   */
  /**
   * ═══ O ÚLTIMO DIA, GRAVADO AQUI, DE GRAÇA ═══
   *
   * Este é o funil por onde TODA tela passa, então é o único lugar que sabe que a pessoa
   * apareceu HOJE mesmo quando ela nunca faz login de novo (a sessão dura). É aqui, e não
   * no login, que a retenção fica honesta.
   *
   * O update mora na MESMA ida ao banco que a checagem, num CTE: uma consulta, não duas.
   * E ele é um no-op depois da primeira vez no dia (`is distinct from` a data de hoje em
   * São Paulo), então é no máximo uma escrita por pessoa por dia. Um banido ou apagado
   * não atualiza nada, porque a condição do update é a mesma da checagem.
   *
   * A data é a de São Paulo (`at time zone`), e nunca a de UTC: "apareceu hoje" tem que
   * ser o hoje do leitor. Ver lib/datas.ts e a migration 0050.
   */
  const [row] = await db.execute<{ id: string }>(sql`
    with vivo as (
      select id from users
       where id = ${session.user.id}::uuid
         and deleted_at is null
         and banned_at is null
    ), visto as (
      update users
         set last_seen_on = (now() at time zone 'America/Sao_Paulo')::date
       where id = (select id from vivo)
         and last_seen_on is distinct from (now() at time zone 'America/Sao_Paulo')::date
      returning id
    )
    select id from vivo
  `);
  return row ? { id: row.id } : null;
}

/** One reader, by id. Not a permission: just a name to put on a page. */
export async function getUser(
  id: string,
): Promise<{ id: string; handle: string; displayName: string | null } | null> {
  // O `handle` vem junto porque ele é o ENDEREÇO da pessoa: sem ele, montar um link
  // para o próprio perfil exigiria uma segunda consulta em toda tela que precisasse.
  const rows = await db.execute<{ id: string; handle: string; display_name: string | null }>(sql`
    select id, handle, display_name from users
     where id = ${id}::uuid and deleted_at is null limit 1
  `);
  const row = rows[0];
  return row ? { id: row.id, handle: row.handle, displayName: row.display_name } : null;
}

/**
 * Whose shelf an anonymous visitor sees: the founding reader's, the oldest
 * account on the instance. Not a hardcoded handle, because the seeded reader is
 * deleted the moment a real one adopts the shelf.
 *
 * Not a permission either: it only picks which rows we ask for. What an
 * anonymous visitor may SEE of them is still decided by visibleTo(), in SQL,
 * which for them means the public rows and nothing else.
 */
export async function getShelfOwner(): Promise<{ id: string; displayName: string | null } | null> {
  const rows = await db.execute<{ id: string; display_name: string | null }>(sql`
    select id, display_name from users
    where deleted_at is null
    order by created_at asc, id asc
    limit 1
  `);
  const row = rows[0];
  return row ? { id: row.id, displayName: row.display_name } : null;
}

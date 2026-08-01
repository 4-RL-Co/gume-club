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
  const [row] = await db.execute<{ id: string }>(sql`
    select id from users
     where id = ${session.user.id}::uuid
       and deleted_at is null
       and banned_at is null
     limit 1
  `);
  if (!row) return null;

  const viewer = { id: row.id };

  /**
   * ═══ O ÚLTIMO DIA, GRAVADO AQUI, MAS BEST-EFFORT ═══
   *
   * Este é o funil por onde TODA tela passa, então é o único lugar que sabe que a pessoa
   * apareceu HOJE mesmo quando ela nunca faz login de novo (a sessão dura). É aqui, e não
   * no login, que a retenção fica honesta.
   *
   * ═══ POR QUE ELE É SEPARADO, E POR QUE ELE ENGOLE O ERRO ═══
   *
   * Gravar o último dia é ANALÍTICA, e não autorização. Ele NÃO PODE derrubar o funil.
   * Uma vez ele já derrubou: a coluna `last_seen_on` (migration 0050) não existia no banco
   * de produção, e um CTE que a mencionava fazia TODA página do site cair. Um dado que só
   * o painel do dono lê não vale uma tela branca para o leitor.
   *
   * Então: a checagem crítica (existe? banido?) roda primeiro, sozinha, e decide o viewer.
   * A escrita do último dia vem DEPOIS, num try/catch que engole qualquer erro (coluna que
   * ainda não migrou, banco de leitura, o que for). O pior caso é a retenção ficar um pouco
   * menos precisa até o deploy migrar, e isso é aceitável. Uma tela branca não é.
   *
   * O update é no-op depois da primeira vez no dia (`is distinct from` a data de São Paulo),
   * então é no máximo uma escrita por pessoa por dia. Fuso de São Paulo, nunca UTC. Ver
   * lib/datas.ts e a migration 0050.
   */
  try {
    await db.execute(sql`
      update users
         set last_seen_on = (now() at time zone 'America/Sao_Paulo')::date
       where id = ${viewer.id}::uuid
         and last_seen_on is distinct from (now() at time zone 'America/Sao_Paulo')::date
    `);
  } catch {
    // Analítica não derruba o funil. Ver o comentário acima.
  }

  return viewer;
}

/** One reader, by id. Not a permission: just a name to put on a page. */
export async function getUser(
  id: string,
): Promise<{ id: string; handle: string; displayName: string | null; image: string | null } | null> {
  // O `handle` vem junto porque ele é o ENDEREÇO da pessoa: sem ele, montar um link
  // para o próprio perfil exigiria uma segunda consulta em toda tela que precisasse.
  // A `image` vem pelo mesmo motivo: a barra precisa desenhar a cara de quem está
  // dentro no primeiro pixel, e não depois de uma ida ao servidor. Ver a nota em
  // components/sidebar.tsx sobre por que ela não pergunta isso do navegador.
  const rows = await db.execute<{
    id: string;
    handle: string;
    display_name: string | null;
    image: string | null;
  }>(sql`
    select id, handle, display_name, image from users
     where id = ${id}::uuid and deleted_at is null limit 1
  `);
  const row = rows[0];
  return row
    ? { id: row.id, handle: row.handle, displayName: row.display_name, image: row.image }
    : null;
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

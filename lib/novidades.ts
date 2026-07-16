import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertAuthenticated, type Viewer } from "@/lib/authz";

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS NOVIDADES. Três coisas, e só três, que uma pessoa quer saber que aconteceram.
 *
 *  ═══ POR QUE EXISTE, DEPOIS DE "TODO O RESTO É SILÊNCIO" ═══
 *
 *  A decisão antiga (ai/DECISIONS.md, 11/07) dizia: exatamente uma notificação, e o resto
 *  é silêncio. Ela nasceu antes de existir gente de verdade no app, e mirava o RUÍDO: o
 *  mural de "fulano curtiu", a esteira que puxa a pessoa de volta sem ela ter pedido.
 *
 *  Estas três não são ruído. São os únicos momentos em que alguém agiu SOBRE VOCÊ e você
 *  não tem como saber sozinho:
 *
 *    · alguém começou a te seguir
 *    · alguém que VOCÊ convidou finalmente entrou
 *    · alguém te recomendou um livro
 *
 *  Sem isto, a esposa que criou conta e te seguiu some no vazio, e o convite que deu certo
 *  parece que não deu. Não há contador de likes, não há "em alta", não há nada que uma
 *  pessoa precise performar. São fatos sobre laços, e laço é o produto inteiro do Gume.
 *
 *  ═══ O QUE ELA LÊ, E O QUE NÃO VAZA ═══
 *
 *  Seguir é público. Entrar é público. A recomendação é SUA (você é o destinatário). Não
 *  há dado privado de terceiro aqui: o que ela devolve é quem, quando, e — na recomendação
 *  — qual livro. Nada da estante de ninguém.
 *
 *  ═══ O "VISTO" MORA NO NAVEGADOR, E NÃO NO BANCO ═══
 *
 *  De propósito: o deploy não roda migration sozinho, e um contador de not-lidas não vale
 *  uma coluna nova coordenada à mão em produção. O sino guarda no navegador a data do que
 *  você já viu, e conta o que é mais novo que ela. Por aparelho, e tudo bem: "já vi isto"
 *  é uma coisa que o aparelho sabe, não o servidor.
 * ════════════════════════════════════════════════════════════════════
 */

export type TipoNovidade = "seguiu" | "convidado" | "recomendou";

export type Novidade = {
  /** Chave estável para o React: tipo + quem + quando. */
  id: string;
  tipo: TipoNovidade;
  /** ISO, para atravessar do servidor ao cliente e comparar com o "visto" do navegador. */
  quando: string;
  handle: string;
  name: string | null;
  image: string | null;
  /** Só na recomendação. */
  livroTitulo: string | null;
  livroSlug: string | null;
};

export async function getNovidades(viewer: Viewer): Promise<Novidade[]> {
  assertAuthenticated(viewer);

  const rows = await db.execute<{
    tipo: TipoNovidade;
    quando: Date;
    handle: string;
    name: string | null;
    image: string | null;
    titulo: string | null;
    slug: string | null;
  }>(sql`
    (
      select 'seguiu'::text as tipo, f.created_at as quando,
             u.handle, u.display_name as name, u.image,
             null::text as titulo, null::text as slug
        from follows f
        join users u on u.id = f.follower_id
       where f.followee_id = ${viewer!.id}::uuid
         and u.deleted_at is null and u.banned_at is null
    )
    union all
    (
      select 'convidado'::text as tipo, u.created_at as quando,
             u.handle, u.display_name as name, u.image,
             null::text as titulo, null::text as slug
        from users u
       where u.invited_by = ${viewer!.id}::uuid
         and u.deleted_at is null and u.banned_at is null
    )
    union all
    (
      select 'recomendou'::text as tipo, r.created_at as quando,
             u.handle, u.display_name as name, u.image,
             w.title as titulo, w.slug as slug
        from recommendations r
        join users u on u.id = r.from_user_id
        join works w on w.id = r.work_id
       where r.to_user_id = ${viewer!.id}::uuid
         and u.deleted_at is null and u.banned_at is null
    )
    order by quando desc
    limit 40`);

  return rows.map((r) => ({
    id: `${r.tipo}:${r.handle}:${new Date(r.quando).toISOString()}`,
    tipo: r.tipo,
    quando: new Date(r.quando).toISOString(),
    handle: r.handle,
    name: r.name,
    image: r.image,
    livroTitulo: r.titulo,
    livroSlug: r.slug,
  }));
}

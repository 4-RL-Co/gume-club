import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS QUERIDINHOS DO GUME. A curadoria da comunidade, feita sozinha.
 *
 *  Os cem livros que mais receberam "adorei". É um ranking, e é um ranking
 *  PERMITIDO pela fronteira que este projeto guarda desde o começo: ele ordena
 *  LIVROS pelo amor que receberam, e nunca GENTE pelo esforço que fez. Estatística
 *  de curadoria fala de gosto; placar falaria de produção. "Quantas pessoas
 *  adoraram Dom Casmurro" é da primeira família; "quem leu mais livros" é da
 *  segunda, e continua proibida.
 *
 *  ═══ SÓ NOTA PÚBLICA ENTRA ═══
 *
 *  A nota privada de alguém não vira estatística de ninguém, nem anônima, nem
 *  agregada: quem marcou "adorei" em privado não contou para ninguém, e o app
 *  não conta por ela. Banido e apagado saem, como saem de tudo.
 *
 *  A lista se refaz a cada visita: não há tabela, não há edição, não há mão na
 *  balança. É o que a comunidade ama hoje, dito pelos vereditos dela.
 * ════════════════════════════════════════════════════════════════════
 */

export type Queridinho = {
  slug: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  /** Quantas pessoas adoraram. Contagem sobre um LIVRO, nunca sobre gente. */
  adoraram: number;
  /** Quantas leram (status lido, público). */
  leram: number;
  /** Gostaram OU adoraram (veredito 4 ou 5, público). */
  gostaram: number;
  /** Em quantas estantes ele mora: gente com o livro na própria estante (qualquer
      status) ou numa estante montada, tudo público. */
  estantes: number;
};

export async function getQueridinhos(limite = 100): Promise<Queridinho[]> {
  const rows = await db.execute<Queridinho>(sql`
    select w.slug,
           w.title,
           a.name as author,
           (select e.cover_url from editions e
             where e.work_id = w.id and e.cover_url is not null
             order by e.created_at asc limit 1) as "coverUrl",
           count(*)::int as adoraram,
           -- Os números do card, como a referência do dono: leram, gostaram ou
           -- adoraram, e em quantas estantes mora. Tudo público, tudo sobre o LIVRO.
           (select count(*)::int from library_entries le
              join users u2 on u2.id = le.user_id
             where le.work_id = w.id and le.status = 'read' and le.visibility = 'public'
               and u2.deleted_at is null and u2.banned_at is null) as leram,
           (select count(*)::int from ratings r2
              join users u3 on u3.id = r2.user_id
             where r2.work_id = w.id and r2.value >= 4 and r2.visibility = 'public'
               and u3.deleted_at is null and u3.banned_at is null) as gostaram,
           (select count(distinct dono)::int from (
              select le2.user_id as dono from library_entries le2
                join users u4 on u4.id = le2.user_id
               where le2.work_id = w.id and le2.visibility = 'public'
                 and u4.deleted_at is null and u4.banned_at is null
              union
              select c.user_id from collection_items ci
                join collections c on c.id = ci.collection_id
                join users u5 on u5.id = c.user_id
               where ci.work_id = w.id and c.visibility = 'public'
                 and u5.deleted_at is null and u5.banned_at is null
            ) donos) as estantes
      from ratings r
      join users u on u.id = r.user_id
      join works w on w.id = r.work_id
      left join authors a on a.id = w.author_id
     where r.value = 5
       and r.visibility = 'public'
       and u.deleted_at is null
       and u.banned_at is null
     group by w.id, w.slug, w.title, a.name
     -- O desempate é o título, e não a data: uma lista que muda de ordem sem nenhum
     -- veredito novo parece sorteio, e esta aqui é um retrato.
     order by count(*) desc, w.title asc
     limit ${limite}`);

  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    author: r.author,
    coverUrl: r.coverUrl,
    adoraram: r.adoraram,
    leram: r.leram,
    gostaram: r.gostaram,
    estantes: r.estantes,
  }));
}

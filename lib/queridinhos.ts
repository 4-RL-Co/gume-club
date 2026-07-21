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
};

export async function getQueridinhos(limite = 100): Promise<Queridinho[]> {
  const rows = await db.execute<Queridinho>(sql`
    select w.slug,
           w.title,
           a.name as author,
           (select e.cover_url from editions e
             where e.work_id = w.id and e.cover_url is not null
             order by e.created_at asc limit 1) as "coverUrl",
           count(*)::int as adoraram
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
  }));
}

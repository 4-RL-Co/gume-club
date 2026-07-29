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
 *  ═══ O VEREDITO CONTA SEMPRE. A ESTANTE, SÓ SE FOR PÚBLICA ═══
 *
 *  Isto contava só nota pública, e a lista saía errada: um livro com dois
 *  "adorei", sendo um deles privado, valia UM e caía no desempate por título,
 *  atrás de livros com menos amor que ele. Foi visto na Saga de Njáll, que
 *  aparecia na 22ª posição, no meio do bloco alfabético dos empatados em um.
 *
 *  A regra nova, decidida pelo dono, tem uma linha no meio:
 *
 *    VEREDITO (adorei, gostei)  → conta, pública ou privada. É opinião sobre o
 *                                 LIVRO, agregada sobre a comunidade inteira, e
 *                                 uma lista de gosto que ignora metade dos votos
 *                                 não é um retrato do gosto: é um retrato de quem
 *                                 deixou a nota aberta.
 *
 *    ESTANTE (leram, em quantas) → só pública. Estante é um LUGAR que pertence a
 *                                 uma pessoa, e não uma opinião sobre o livro.
 *
 *  ═══ O QUE ISSO CUSTA, ESCRITO EM VOZ ALTA ═══
 *
 *  Um livro com UM veredito no Gume inteiro, e ele privado, passa a aparecer com
 *  "1". Ninguém sabe QUEM, mas alguém que soubesse que só uma pessoa tem aquele
 *  livro poderia deduzir a nota dela. É estreito e é real, e está aqui escrito
 *  para não ser redescoberto por susto. Ver ai/DECISIONS.md.
 *
 *  `adoraram` e `gostaram` andam JUNTAS nessa regra por aritmética, e não por
 *  gosto: gostaram é `value >= 4`, que INCLUI os adorei. Se uma contasse privado
 *  e a outra não, a tela mostraria "3 adoraram" ao lado de "2 gostaram ou
 *  adoraram", que é impossível, e o leitor concluiria que o app não sabe contar.
 *
 *  Banido e apagado saem, como saem de tudo.
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
           -- Os números do card: leram, gostaram ou adoraram, e em quantas estantes
           -- mora. Tudo sobre o LIVRO, nunca sobre gente. O veredito conta sempre;
           -- as duas contagens de ESTANTE continuam só sobre estante pública.
           (select count(*)::int from library_entries le
              join users u2 on u2.id = le.user_id
             where le.work_id = w.id and le.status = 'read' and le.visibility = 'public'
               and u2.deleted_at is null and u2.banned_at is null) as leram,
           (select count(*)::int from ratings r2
              join users u3 on u3.id = r2.user_id
             -- Sem filtro de visibilidade, e ela anda junto com 'adoraram' por
             -- ARITMÉTICA: gostaram é value >= 4, que inclui os adorei. Ver o topo.
             where r2.work_id = w.id and r2.value >= 4
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

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { visibleTo, type Viewer } from "@/lib/authz";
import { libraryEntries, reviews } from "@/lib/db/schema";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O DIÁRIO. Uma linha por LEITURA, não por livro — a mesma diferença que
 *  lib/leituras.ts já faz na ficha de um livro só, agora cruzando todos eles
 *  em ordem cronológica. "é legal também ter uma linha do tempo tipo um
 *  diario de livros terminados" — o dono, olhando o Diary do Letterboxd.
 *
 *  Reler entra como uma linha NOVA, com a SUA data — nunca reescrevendo a
 *  primeira. É a mesma régua de sempre: "ler O Hobbit em 2009 e de novo em
 *  2024 são DUAS leituras" (lib/leituras.ts). `releitura` aqui é só um sinal
 *  visual (a Nª vez), calculado comparando a data desta linha com as outras
 *  do MESMO livro — não uma coluna, para não existir um número que discorde
 *  do que as datas já dizem.
 *
 *  O veredito mostrado é o do LIVRO (`ratings`, uma nota por pessoa por
 *  livro — nunca por leitura: reavaliar a cada releitura não é o que a
 *  palavra-veredito promete), então ele se repete em toda linha do mesmo
 *  título. É o dado que existe; inventar um por leitura seria um campo
 *  fantasma que a tela promete e o banco não tem.
 * ════════════════════════════════════════════════════════════════════
 */
export type EntradaDiario = {
  readingId: string;
  workId: string;
  slug: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  abandonado: boolean;
  /** "2019" (só o ano) ou "2019-03-14" — o formato diz a precisão, como em toda data deste app. */
  quando: string | null;
  rating: number | null;
  releitura: boolean;
  temResenha: boolean;
};

const CAP = 120;

/**
 * O diário de alguém: cada leitura terminada ou abandonada, mais recente
 * primeiro. Filtra `visibility` no SQL (a da linha da estante, mesma régua
 * de `getLeituras`) — uma leitura de estante privada não é uma linha
 * escondida, ela não é uma linha.
 *
 * Sem paginação nesta primeira versão: as últimas ${CAP} leituras. Quem lê
 * mais que isso por enquanto vê só as mais recentes — um teto silencioso é
 * aceitável aqui pelo mesmo motivo do histórico de correções (getHistory,
 * getCorrecoes): é um feed, não um arquivo que precisa ser completo.
 */
export async function getDiario(viewer: Viewer, ownerId: string): Promise<EntradaDiario[]> {
  const rows = await db.execute<{
    reading_id: string; work_id: string; slug: string; title: string; author: string | null;
    cover_url: string | null; abandonado: boolean; quando: string | null; rating: number | null;
    releitura: boolean; tem_resenha: boolean;
  }>(sql`
    select
      r.id as reading_id,
      w.id as work_id, w.slug, w.title, a.name as author,
      (select e.cover_url from editions e
        where e.work_id = w.id and e.cover_url is not null
        order by e.created_at asc, e.id asc limit 1) as cover_url,
      (r.abandoned_on is not null) as abandonado,
      case when r.ended_precision = 'year'
           then to_char(coalesce(r.finished_on, r.abandoned_on), 'YYYY')
           else to_char(coalesce(r.finished_on, r.abandoned_on), 'YYYY-MM-DD') end as quando,
      ra.value as rating,
      (row_number() over (
         partition by r.entry_id
         order by coalesce(r.finished_on, r.abandoned_on) asc, r.created_at asc
       ) > 1) as releitura,
      exists(
        select 1 from reviews
         where reviews.reading_id = r.id
           and reviews.deleted_at is null
           and ${visibleTo(viewer, reviews.userId, reviews.visibility)}
      ) as tem_resenha
      from readings r
      -- SEM APELIDO em library_entries: visibleTo() monta o filtro com o nome
      -- real da tabela. Ver o mesmo aviso, mais longo, em lib/leituras.ts.
      join library_entries on library_entries.id = r.entry_id
      join works w on w.id = library_entries.work_id
      left join authors a on a.id = w.author_id
      left join ratings ra on ra.user_id = library_entries.user_id and ra.work_id = library_entries.work_id
     where library_entries.user_id = ${ownerId}::uuid
       and (r.finished_on is not null or r.abandoned_on is not null)
       and ${visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility)}
     order by coalesce(r.finished_on, r.abandoned_on) desc, r.created_at desc
     limit ${CAP}`);

  return rows.map((r) => ({
    readingId: r.reading_id,
    workId: r.work_id,
    slug: r.slug,
    title: r.title,
    author: r.author,
    coverUrl: r.cover_url,
    abandonado: r.abandonado,
    quando: r.quando,
    rating: r.rating,
    releitura: r.releitura,
    temResenha: r.tem_resenha,
  }));
}

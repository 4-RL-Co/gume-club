import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * ════════════════════════════════════════════════════════════════════
 *  EXPLORAR O CATÁLOGO: autores, gêneros e editoras.
 *
 *  Tudo aqui é CATÁLOGO, e catálogo é de todo mundo: obra, autor, gênero e
 *  editora são a vitrine da livraria, sem linha de leitor no meio — por isso
 *  nenhuma consulta deste arquivo precisa de visibleTo(). O que ele nunca
 *  devolve é gente: leitor mora nas outras abas, com as regras de leitor.
 *
 *  As contagens são de LIVRO (quantas obras tem um gênero, quantas edições tem
 *  uma editora): curadoria, não placar. Autores, gêneros e editoras vêm DOS MAIS
 *  POPULARES para baixo, porque popularidade de catálogo é gosto da comunidade
 *  (a família dos queridinhos); as vitrines de OBRA dentro de um rótulo seguem
 *  sorteando, e GENTE segue sorteada nas outras abas.
 * ════════════════════════════════════════════════════════════════════
 */

export type AutorVitrine = {
  slug: string;
  name: string;
  nationality: string | null;
  imageUrl: string | null;
  /** Quantas obras dele moram no acervo. Contagem de livro, não de gente. */
  obras: number;
};

/**
 * Autores para descobrir, DOS MAIS LIDOS para baixo.
 *
 * A régua da popularidade: quantos leitores têm obra dele na estante (pública, de
 * gente viva). É a mesma família dos queridinhos: ordenar AUTOR pelo amor recebido é
 * curadoria e fala de gosto; o que continua sorteado é GENTE, nas outras vitrines,
 * porque gente ordenada é pódio. O desempate é o tamanho no acervo, e depois o nome:
 * um catálogo novo, ainda sem leitores, mostra os autores mais presentes.
 */
export async function getAutoresParaExplorar(limite = 18): Promise<AutorVitrine[]> {
  const rows = await db.execute<AutorVitrine>(sql`
    select a.slug,
           a.name,
           a.nationality,
           a.image_url as "imageUrl",
           count(distinct w.id)::int as obras
      from authors a
      join works w on w.author_id = a.id
      left join library_entries le on le.work_id = w.id and le.visibility = 'public'
      left join users u on u.id = le.user_id and u.deleted_at is null and u.banned_at is null
     group by a.id, a.slug, a.name, a.nationality, a.image_url
     order by count(distinct u.id) desc, count(distinct w.id) desc, a.name asc
     limit ${limite}`);
  return rows;
}

export type Rotulo = { nome: string; obras: number };

/** Os gêneros do acervo, dos mais povoados para baixo. */
export async function getGeneros(limite = 24): Promise<Rotulo[]> {
  const rows = await db.execute<{ nome: string; obras: number }>(sql`
    select w.genre as nome, count(*)::int as obras
      from works w
     where w.genre is not null and w.genre <> ''
     group by w.genre
     order by count(*) desc, w.genre asc
     limit ${limite}`);
  return rows;
}

/** As editoras do acervo, das mais presentes para baixo. */
export async function getEditoras(limite = 24): Promise<Rotulo[]> {
  const rows = await db.execute<{ nome: string; obras: number }>(sql`
    select e.publisher as nome, count(distinct e.work_id)::int as obras
      from editions e
     where e.publisher is not null and e.publisher <> ''
     group by e.publisher
     order by count(distinct e.work_id) desc, e.publisher asc
     limit ${limite}`);
  return rows;
}

export type ObraVitrine = {
  slug: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
};

const capaDaObra = sql`(
  select e2.cover_url from editions e2
   where e2.work_id = w.id and e2.cover_url is not null
   order by e2.created_at asc limit 1)`;

/** As obras de UM gênero, sorteadas. Com capa primeiro: vitrine sem capa é lombada. */
export async function getObrasPorGenero(genero: string, limite = 24): Promise<ObraVitrine[]> {
  const rows = await db.execute<ObraVitrine>(sql`
    select w.slug, w.title, a.name as author, ${capaDaObra} as "coverUrl"
      from works w
      left join authors a on a.id = w.author_id
     where w.genre = ${genero}
     order by (${capaDaObra} is null) asc, random()
     limit ${limite}`);
  return rows;
}

/** As obras de UMA editora, sorteadas. */
export async function getObrasPorEditora(editora: string, limite = 24): Promise<ObraVitrine[]> {
  const rows = await db.execute<ObraVitrine>(sql`
    select distinct on (w.id) w.slug, w.title, a.name as author, ${capaDaObra} as "coverUrl"
      from works w
      join editions e on e.work_id = w.id
      left join authors a on a.id = w.author_id
     where e.publisher = ${editora}
     limit ${limite}`);
  return rows;
}

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
 *  uma editora): curadoria, não placar. E as vitrines de obra SORTEIAM, como
 *  todo o explorar: sem "em alta", sem mérito inventado.
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

/** Autores para descobrir: só quem tem obra no acervo, sorteados a cada visita. */
export async function getAutoresParaExplorar(limite = 18): Promise<AutorVitrine[]> {
  const rows = await db.execute<AutorVitrine>(sql`
    select a.slug,
           a.name,
           a.nationality,
           a.image_url as "imageUrl",
           (select count(*)::int from works w where w.author_id = a.id) as obras
      from authors a
     where exists (select 1 from works w where w.author_id = a.id)
     order by random()
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

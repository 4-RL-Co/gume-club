import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A PÁGINA DE DENTRO DA COLEÇÃO. Sobre o autor, a obra, as edições.
 *
 *  ═══ NADA AQUI É INVENTADO ═══
 *
 *  Bio de autor nunca é gerada por IA — é recusa, está no README. Esta consulta só
 *  LÊ o que já existe no catálogo (`authors.bio`, escrita por um leitor; `series`;
 *  `editions`). Quando falta, a tela precisa dizer que falta, e não inventar.
 *
 *  ═══ O DESBLOQUEIO É PARA QUEM COMPLETOU, E COMPUTADO NA HORA ═══
 *
 *  Não existe coluna de "coleção completa" em lugar nenhum (migration 0036 proíbe
 *  isso, de propósito: a lacuna é o produto, nunca um número guardado). Esta função
 *  devolve o conjunto INTEIRO, completo ou não — quem decide o que mostrar é a
 *  própria tela, olhando `completo` a cada visita.
 *
 *  ═══ SÓ ENTRA QUEM VOCÊ JÁ TOCOU ═══
 *
 *  O `join meus` é o mesmo filtro de `getConjuntos` (lib/copies.ts): a consulta só
 *  devolve algo se o ATOR tem ou quer pelo menos um volume deste conjunto. Sem isso,
 *  qualquer pessoa logada acharia a página de detalhe de uma coleção que nunca tocou.
 * ════════════════════════════════════════════════════════════════════
 */

export type VolumeDetalhado = {
  slug: string;
  title: string;
  volume: number | null;
  coverUrl: string | null;
  tenho: boolean;
  publisher: string | null;
  publishedYear: number | null;
  pageCount: number | null;
};

export type ConjuntoDetalhe = {
  id: string;
  slug: string;
  titulo: string;
  publisher: string | null;
  emblema: string | null;
  total: number;
  tenho: number;
  completo: boolean;
  serie: { titulo: string; kind: string; status: string } | null;
  autor: {
    nome: string;
    slug: string;
    bio: string | null;
    bioSource: string | null;
    imageUrl: string | null;
    nationality: string | null;
  } | null;
  volumes: VolumeDetalhado[];
};

export async function getConjuntoDetalhe(
  actor: { id: string } | null,
  slug: string,
): Promise<ConjuntoDetalhe | null> {
  if (!actor) return null;

  const rows = await db.execute<{
    id: string; slug: string; titulo: string; publisher: string | null;
    total: number | null; emblema: string | null;
    serie_titulo: string | null; serie_kind: string | null; serie_status: string | null;
    autor_nome: string | null; autor_slug: string | null; autor_bio: string | null;
    autor_bio_fonte: string | null; autor_image: string | null; autor_nacionalidade: string | null;
    vol_slug: string; vol_title: string; vol_volume: string | null; vol_cover: string | null;
    vol_publisher: string | null; vol_ano: number | null; vol_paginas: number | null;
    tenho: boolean;
  }>(sql`
    with meus as (
      select distinct w.colecao_id
        from owned_copies oc
        join works w on w.id = oc.work_id
       where oc.user_id = ${actor.id}::uuid and w.colecao_id is not null
    )
    select c.id, c.slug, c.title as titulo, c.publisher, c.total_volumes as total, c.emblema_url as emblema,
           s.title as serie_titulo, s.kind as serie_kind, s.status as serie_status,
           a.name as autor_nome, a.slug as autor_slug, a.bio as autor_bio, a.bio_source as autor_bio_fonte,
           a.image_url as autor_image, a.nationality as autor_nacionalidade,
           w.slug as vol_slug, w.title as vol_title, w.volume::text as vol_volume,
           ed.cover_url as vol_cover, ed.publisher as vol_publisher,
           ed.published_year as vol_ano, ed.page_count as vol_paginas,
           coalesce(oc.state = 'owned', false) as tenho
      from colecoes c
      join meus m on m.colecao_id = c.id
      left join series s on s.id = c.series_id
      join works w on w.colecao_id = c.id
      /**
       * UMA EDIÇÃO SÓ, e todos os quatro campos saem DELA. Eram quatro subconsultas
       * independentes (uma por campo, cada uma com o seu próprio "is not null") — e uma
       * ficha com edições esparsas (comum em dado importado) podia trazer a capa de uma
       * edição e a editora de outra, misturando duas edições numa carta só. A prioridade
       * é a mesma de sempre (a que tem capa), mas agora é UMA linha, e o resto dela anda
       * junto: publicador, ano e páginas são todos da mesma edição que deu a capa.
       */
      left join lateral (
        select e.cover_url, e.publisher, e.published_year, e.page_count
          from editions e
         where e.work_id = w.id
         order by (e.cover_url is not null) desc, e.created_at asc
         limit 1
      ) ed on true
      left join authors a on a.id = w.author_id
      left join owned_copies oc on oc.work_id = w.id and oc.user_id = ${actor.id}::uuid
     where c.slug = ${slug}
     order by w.volume asc nulls last`);

  if (rows.length === 0) return null;

  const primeira = rows[0]!;
  const total = primeira.total ?? rows.length;
  const tenho = rows.filter((r) => r.tenho).length;

  // O primeiro volume com autor conhecido decide: quase todo conjunto é de um só.
  const comAutor = rows.find((r) => r.autor_nome);
  const autor = comAutor
    ? {
        nome: comAutor.autor_nome!,
        slug: comAutor.autor_slug!,
        bio: comAutor.autor_bio,
        bioSource: comAutor.autor_bio_fonte,
        imageUrl: comAutor.autor_image,
        nationality: comAutor.autor_nacionalidade,
      }
    : null;

  return {
    id: primeira.id,
    slug: primeira.slug,
    titulo: primeira.titulo,
    publisher: primeira.publisher,
    // SEM EMBLEMA PRÓPRIO, A CARA VIRA A DO AUTOR — a mesma regra de getConjuntos()
    // (lib/copies.ts). O manual sempre ganha; isto só entra quando ele é nulo.
    emblema: primeira.emblema ?? autor?.imageUrl ?? null,
    total,
    tenho,
    completo: total > 0 && tenho >= total,
    serie: primeira.serie_titulo
      ? { titulo: primeira.serie_titulo, kind: primeira.serie_kind ?? "series", status: primeira.serie_status ?? "unknown" }
      : null,
    autor,
    volumes: rows.map((r) => ({
      slug: r.vol_slug,
      title: r.vol_title,
      volume: r.vol_volume === null ? null : Number(r.vol_volume),
      coverUrl: r.vol_cover,
      tenho: r.tenho,
      publisher: r.vol_publisher,
      publishedYear: r.vol_ano,
      pageCount: r.vol_paginas,
    })),
  };
}

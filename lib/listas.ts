import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assertAuthenticated, assertOwner, visibleTo, type Viewer,
} from "@/lib/authz";
import { collections, collectionSaves } from "@/lib/db/schema";
import { LIMITS, clamp } from "@/lib/limits";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A ESTANTE INVENTADA, INTEIRA: ordem, capricho, e o gesto de guardar.
 *
 *  `collection_items` tinha `position` desde o primeiro dia e nenhuma tela
 *  escrevia nele. Este módulo é o que faltava para a estante ser curadoria de
 *  verdade: quem monta escolhe a ordem (e se ela é numerada), quem visita pode
 *  GUARDAR a estante boa, e a vitrine do explorar mostra estantes com cara de
 *  estante: capas, nome, descrição e quem fez.
 *
 *  ═══ GUARDAR NUNCA VIRA NÚMERO ═══
 *
 *  Guardar é endosso, e endosso contado é curtida com outro nome: "guardada por
 *  12 pessoas" é exatamente o contador que o README promete não ter. Então a
 *  regra deste módulo é estrutural: NENHUMA consulta conta `collection_saves`.
 *  Quem guarda vê o que guardou; quem fez recebe o crédito pelo nome na estante
 *  guardada; e quantas vezes, ninguém sabe, nem o dono. Um teste varre este
 *  arquivo e quebra o build se uma contagem nascer aqui.
 *
 *  ═══ VISIBILIDADE, COMO EM TODO LUGAR ═══
 *
 *  Toda leitura que pode devolver a estante de outra pessoa filtra com
 *  visibleTo(), no SQL. Guardar uma estante que você não pode ver não insere
 *  linha nenhuma (o insert é um select com o filtro dentro), e uma estante que
 *  ficou privada DEPOIS de guardada some da tela de quem guardou: o vínculo
 *  fica, a visibilidade manda.
 * ════════════════════════════════════════════════════════════════════
 */

/** Uma capa do leque. Título e autor viajam para a lombada desenhada quando não há imagem. */
export type CapaDeLista = { coverUrl: string | null; title: string; author: string | null };

/** O card de uma estante: o que a vitrine mostra sem abrir. */
export type ListaCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ranked: boolean;
  /** Até cinco capas, na ordem da estante. É o leque do card. */
  capas: CapaDeLista[];
  /** Quantos livros a estante tem. Contagem de LIVRO, nunca de gente. */
  livros: number;
  dono: { handle: string; name: string | null; image: string | null };
};

const CAPAS_NO_LEQUE = 5;

/** O select de um card, compartilhado por perfil, guardadas e explorar. */
function cardSelect(viewer: Viewer) {
  return sql`
    select collections.id,
           collections.slug,
           collections.name,
           collections.description,
           collections.ranked,
           u.handle as dono_handle,
           u.display_name as dono_name,
           u.image as dono_image,
           (select count(*)::int from collection_items ci
             where ci.collection_id = collections.id) as livros,
           coalesce((
             select json_agg(json_build_object(
                      'coverUrl', c.cover_url, 'title', c.title, 'author', c.author))
               from (
                 select w.title,
                        a.name as author,
                        (select e.cover_url from editions e
                          where e.work_id = w.id and e.cover_url is not null
                          order by e.created_at asc limit 1) as cover_url
                   from collection_items ci
                   join works w on w.id = ci.work_id
                   left join authors a on a.id = w.author_id
                  where ci.collection_id = collections.id
                  -- A capa ESCOLHIDA lidera o leque; sem escolha, vale a ordem da estante.
                  order by (ci.work_id = collections.cover_work_id) desc nulls last,
                           ci.position asc, ci.added_at asc
                  limit ${CAPAS_NO_LEQUE}
               ) c), '[]'::json) as capas
      from collections
      join users u on u.id = collections.user_id
     where ${visibleTo(viewer, collections.userId, collections.visibility)}
       and u.deleted_at is null
       and u.banned_at is null`;
}

type CardRow = {
  id: string; slug: string; name: string; description: string | null; ranked: boolean;
  dono_handle: string; dono_name: string | null; dono_image: string | null;
  livros: number; capas: CapaDeLista[];
};

function paraCard(r: CardRow): ListaCard {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    ranked: r.ranked,
    capas: r.capas,
    livros: r.livros,
    dono: { handle: r.dono_handle, name: r.dono_name, image: r.dono_image },
  };
}

/** As estantes que alguém montou, como cards. As suas todas; as dos outros, o que você pode ver. */
export async function getListasDe(viewer: Viewer, ownerId: string): Promise<ListaCard[]> {
  const rows = await db.execute<CardRow>(sql`
    ${cardSelect(viewer)}
       and collections.user_id = ${ownerId}::uuid
     order by collections.created_at desc`);
  return rows.map(paraCard);
}

/**
 * As estantes que alguém GUARDOU. O crédito vai inteiro para quem montou: o card é o
 * mesmo, com o nome de quem fez. Uma estante que ficou privada depois some daqui,
 * porque o filtro de visibilidade roda de novo a cada leitura.
 */
export async function getListasGuardadas(viewer: Viewer, ownerId: string): Promise<ListaCard[]> {
  const rows = await db.execute<CardRow>(sql`
    ${cardSelect(viewer)}
       and exists (
         select 1 from collection_saves s
          where s.collection_id = collections.id
            and s.user_id = ${ownerId}::uuid)
     order by (select s2.saved_at from collection_saves s2
                where s2.collection_id = collections.id
                  and s2.user_id = ${ownerId}::uuid) desc`);
  return rows.map(paraCard);
}

/**
 * Estantes para descobrir, no explorar. SORTEADAS entre as que têm vida (três livros ou
 * mais), e rotacionando a cada visita: é o mesmo mecanismo das estantes de gente, e pelo
 * mesmo motivo, escrito lá: dar vez a todo mundo sem inventar um critério de mérito.
 * "As mais guardadas" seria um ranking de popularidade, e popularidade é a coisa que
 * este produto se recusa a medir.
 */
export async function getListasParaExplorar(viewer: Viewer, limite = 6): Promise<ListaCard[]> {
  const rows = await db.execute<CardRow>(sql`
    ${cardSelect(viewer)}
       and u.email_verified = true
       and (select count(*) from collection_items ci
             where ci.collection_id = collections.id) >= 3
       ${viewer ? sql`and collections.user_id <> ${viewer.id}::uuid` : sql``}
     order by random()
     limit ${limite}`);
  return rows.map(paraCard);
}

/**
 * TODAS as coleções públicas, para a galeria de /colecoes. Cronológico (a mais nova
 * primeiro), sem algoritmo: é o mesmo costume do feed. As editoriais da casa não
 * entram por aqui: elas são fixadas no topo da tela, e o destaque delas é editorial,
 * não conquistado por métrica.
 */
export async function getTodasAsListas(viewer: Viewer, limite = 100): Promise<ListaCard[]> {
  const rows = await db.execute<CardRow>(sql`
    ${cardSelect(viewer)}
       and u.email_verified = true
       and exists (select 1 from collection_items ci where ci.collection_id = collections.id)
     order by collections.created_at desc
     limit ${limite}`);
  return rows.map(paraCard);
}

// ─────────────────────────────────────────────────────────── as mutações

/**
 * A ordem da estante, escrita pelo dono. Recebe os livros na ordem final e grava a
 * posição de cada um. Só mexe em linhas da estante DELE (o where é a autorização,
 * como em toda mutação de estante), e só em livros que já estão nela: isto ordena,
 * não adiciona.
 */
export async function ordenarLista(
  actor: { id: string },
  collectionId: string,
  workIds: string[],
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });
  if (workIds.length === 0 || workIds.length > 500) return;

  await db.transaction(async (tx) => {
    for (let i = 0; i < workIds.length; i++) {
      await tx.execute(sql`
        update collection_items
           set position = ${i + 1}
         where collection_id = ${collectionId}::uuid
           and work_id = ${workIds[i]}::uuid
           and exists (
             select 1 from collections c
              where c.id = ${collectionId}::uuid
                and c.user_id = ${actor.id}::uuid)`);
    }
  });
}

/** Um degrau só: sobe ou desce um livro uma posição. É o que os botões da tela usam. */
export async function moverNaLista(
  actor: { id: string },
  collectionId: string,
  workId: string,
  direcao: "subir" | "descer",
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });

  await db.transaction(async (tx) => {
    // A ordem atual, do dono, normalizada. Fora da estante do ator, devolve nada.
    const itens = await tx.execute<{ work_id: string }>(sql`
      select ci.work_id
        from collection_items ci
        join collections c on c.id = ci.collection_id
       where ci.collection_id = ${collectionId}::uuid
         and c.user_id = ${actor.id}::uuid
       order by ci.position asc, ci.added_at asc`);

    const ordem = itens.map((i) => i.work_id);
    const de = ordem.indexOf(workId);
    if (de < 0) return;

    const para = direcao === "subir" ? de - 1 : de + 1;
    if (para < 0 || para >= ordem.length) return;

    [ordem[de], ordem[para]] = [ordem[para]!, ordem[de]!];

    for (let i = 0; i < ordem.length; i++) {
      await tx.execute(sql`
        update collection_items
           set position = ${i + 1}
         where collection_id = ${collectionId}::uuid
           and work_id = ${ordem[i]}::uuid`);
    }
  });
}

/** Numerada ou não: 1º, 2º, 3º é escolha de quem monta, estante por estante. */
export async function numerarLista(
  actor: { id: string },
  collectionId: string,
  numerada: boolean,
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });
  await db
    .update(collections)
    .set({ ranked: numerada })
    .where(and(eq(collections.id, collectionId), eq(collections.userId, actor.id)));
}

/**
 * A CARA da estante: qual livro DELA a representa no card e na aura. `null` volta ao
 * padrão (o primeiro da ordem). O livro tem que estar NA estante: a cara de uma
 * coleção é um dos livros dela, e não um pôster alheio.
 */
export async function escolherCapaDaLista(
  actor: { id: string },
  collectionId: string,
  workId: string | null,
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });

  if (workId === null) {
    await db.execute(sql`
      update collections set cover_work_id = null
       where id = ${collectionId}::uuid and user_id = ${actor.id}::uuid`);
    return;
  }

  await db.execute(sql`
    update collections
       set cover_work_id = ${workId}::uuid
     where id = ${collectionId}::uuid
       and user_id = ${actor.id}::uuid
       and exists (
         select 1 from collection_items ci
          where ci.collection_id = ${collectionId}::uuid
            and ci.work_id = ${workId}::uuid)`);
}

/**
 * A FOTO da estante. A URL vem do NOSSO funil de upload (a tela chama /api/upload e
 * repassa o endereço devolvido), e este setter só aceita o que se parece com ele: um
 * caminho local (/uploads/...) ou um https. Nunca http puro, nunca data:, nunca
 * javascript:. `null` tira a foto.
 */
export async function fotografarLista(
  actor: { id: string },
  collectionId: string,
  url: string | null,
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });

  const limpa = url?.trim() ?? null;
  if (limpa !== null) {
    // O funil de upload entrega /uploads/ (disco) ou o host do Blob (produção).
    // "Qualquer https" aceitava um servidor arbitrário — o rastreador dentro do
    // app que lib/imagens.ts existe para impedir. Mesma régua do avatar
    // (app/perfil/actions.ts). Auditoria de 2026-07-22.
    const ok =
      limpa.length <= 600 &&
      (limpa.startsWith("/uploads/") ||
        /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(limpa));
    if (!ok) return; // um endereço que não veio do funil não entra, e nada é dito
  }

  await db
    .update(collections)
    .set({ coverUrl: limpa })
    .where(and(eq(collections.id, collectionId), eq(collections.userId, actor.id)));
}

/** A descrição: o que esta estante é, dito por quem montou. */
export async function descreverLista(
  actor: { id: string },
  collectionId: string,
  descricao: string,
): Promise<void> {
  assertOwner(actor as Viewer, { userId: actor.id });
  const limpo = clamp(descricao, LIMITS.note) || null;
  await db
    .update(collections)
    .set({ description: limpo })
    .where(and(eq(collections.id, collectionId), eq(collections.userId, actor.id)));
}

/**
 * Guardar a estante de outra pessoa.
 *
 * O insert é um select com a visibilidade DENTRO: guardar uma estante que você não
 * pode ver não insere nada, e não conta como erro (para quem tenta às cegas, o
 * silêncio é a resposta). Guardar a própria estante também não faz nada: ela já é sua.
 */
export async function guardarLista(viewer: Viewer, collectionId: string): Promise<void> {
  assertAuthenticated(viewer);

  await db.execute(sql`
    insert into collection_saves (user_id, collection_id)
    select ${viewer.id}::uuid, collections.id
      from collections
     where collections.id = ${collectionId}::uuid
       and collections.user_id <> ${viewer.id}::uuid
       and ${visibleTo(viewer, collections.userId, collections.visibility)}
    on conflict do nothing`);
}

/** Esquecer. Some da sua tela, e ninguém é avisado: guardar nunca foi um evento social. */
export async function esquecerLista(viewer: Viewer, collectionId: string): Promise<void> {
  assertAuthenticated(viewer);
  await db
    .delete(collectionSaves)
    .where(and(
      eq(collectionSaves.userId, viewer.id),
      eq(collectionSaves.collectionId, collectionId),
    ));
}

/** A tela precisa saber se o botão diz "guardar" ou "guardada". */
export async function jaGuardei(viewer: Viewer, collectionId: string): Promise<boolean> {
  if (!viewer) return false;
  const [row] = await db
    .select({ um: sql<number>`1` })
    .from(collectionSaves)
    .where(and(
      eq(collectionSaves.userId, viewer.id),
      eq(collectionSaves.collectionId, collectionId),
    ))
    .limit(1);
  return Boolean(row);
}

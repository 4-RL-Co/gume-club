import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertAuthenticated, type Viewer } from "@/lib/authz";

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS FAVORITOS. Até cinco, e o primeiro é o coroado.
 *
 *  "não gosto de mostrar TODOS os livros que amei" — o carrossel "o que eu
 *  adorei" (rating 5, sem limite, automático) virava vitrine, não escolha, pra
 *  quem tinha trinta. Inspirado no destaque do yourgamerprofile.com: cinco no
 *  máximo, e um deles é O favorito — curadoria de verdade, do tamanho de uma
 *  mão.
 *
 *  ═══ SÓ O QUE VOCÊ LEU ═══
 *
 *  Favoritar um livro que você nunca leu não é favorito, é lista de desejo —
 *  que já tem lugar (`owned_copies.state = 'wanted'`, e as listas). A trava é
 *  no SQL, como toda escrita deste app: `favoritar()` só insere se existir uma
 *  `library_entries` sua com `status = 'read'` para aquele livro.
 *
 *  ═══ A POSIÇÃO 1 É A COROA, NUNCA UM BOOLEANO À PARTE ═══
 *
 *  Uma coluna `crowned` que pudesse discordar de `position = 1` é uma coluna
 *  que um dia diverge (dois favoritos coroados, ou nenhum). Coroar É mover
 *  para a posição 1.
 * ════════════════════════════════════════════════════════════════════
 */

export type FavoritoBook = {
  workId: string;
  slug: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  position: number;
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  ═══ "PUS O PROCESSO EDIÇÃO ANTOFÁGICA, E NO PERFIL APARECE OUTRA CAPA" ═══
 *
 *  A MESMA classe de bug que lib/shelf.ts já consertou uma vez ("aqui
 *  continua com a capa errada", ver o comentário lá): esta consulta pegava a
 *  capa da edição MAIS ANTIGA da obra, crua, sem perguntar qual delas é a
 *  SUA. Um work pode ter dezenas de edições — favoritar não escolhe uma, é
 *  ler que escolhe (na ficha do livro, `library_entries.edition_id`, ou o
 *  exemplar que você registrou, `owned_copies.edition_id`).
 *
 *  A régua é a mesma de `edicaoDoLeitor()` (lib/shelf.ts): a sua leitura
 *  manda, depois o exemplar que você tem, só então o desempate genérico
 *  (capa existe primeiro, depois a mais antiga). Repetida aqui em SQL cru,
 *  e não importada, porque `edicaoDoLeitor()`/`edicaoPreferida()` são
 *  fragmentos do query builder — presos aos nomes de tabela sem apelido
 *  (`works`, `library_entries`), e esta consulta já apelida todas as suas
 *  (`w`, `fb`...). Misturar os dois estilos na mesma consulta quebra o SQL.
 * ════════════════════════════════════════════════════════════════════
 */
/** Os favoritos de alguém, na ordem — o [0] é sempre o coroado, quando existe. */
export async function getFavoritos(userId: string): Promise<FavoritoBook[]> {
  const rows = await db.execute<{
    work_id: string; slug: string; title: string; author: string | null;
    cover_url: string | null; position: number;
  }>(sql`
    select w.id as work_id, w.slug, w.title, a.name as author,
           coalesce(e.cover_url, (
             select e2.cover_url from editions e2
              where e2.work_id = w.id and e2.cover_url is not null
              order by e2.created_at asc, e2.id asc limit 1)) as cover_url,
           fb.position
      from favorite_books fb
      join works w on w.id = fb.work_id
      left join authors a on a.id = w.author_id
      left join library_entries le on le.user_id = fb.user_id and le.work_id = fb.work_id
      left join owned_copies oc on oc.user_id = fb.user_id and oc.work_id = fb.work_id
      left join editions e on e.id = coalesce(
        le.edition_id, oc.edition_id,
        (select e3.id from editions e3 where e3.work_id = w.id
          order by (e3.cover_url is null), e3.created_at asc, e3.id asc limit 1))
     where fb.user_id = ${userId}::uuid
     order by fb.position asc`);

  return rows.map((r) => ({
    workId: r.work_id, slug: r.slug, title: r.title, author: r.author,
    coverUrl: r.cover_url, position: r.position,
  }));
}

/**
 * Todo livro que você já leu e AINDA não favoritou — a lista que
 * GerenciarFavoritos (/perfil) filtra na hora, sem voltar ao servidor a cada
 * letra, mesmo padrão de components/shelf-select.tsx. Só entra quem pode de
 * fato virar favorito: já leu, e ainda não é um dos cinco.
 */
export async function getFavoritaveis(userId: string): Promise<FavoritoBook[]> {
  const rows = await db.execute<{
    work_id: string; slug: string; title: string; author: string | null; cover_url: string | null;
  }>(sql`
    select distinct w.id as work_id, w.slug, w.title, a.name as author,
           (select e.cover_url from editions e
             where e.work_id = w.id and e.cover_url is not null
             order by e.created_at asc, e.id asc limit 1) as cover_url
      from library_entries le
      join works w on w.id = le.work_id
      left join authors a on a.id = w.author_id
     where le.user_id = ${userId}::uuid and le.status = 'read'
       and not exists (
         select 1 from favorite_books fb where fb.user_id = ${userId}::uuid and fb.work_id = w.id)
     order by w.title asc`);

  return rows.map((r) => ({
    workId: r.work_id, slug: r.slug, title: r.title, author: r.author,
    coverUrl: r.cover_url, position: 0,
  }));
}

/** Você já favoritou este livro? Para a ficha do livro saber que botão mostrar. */
export async function jaFavoritei(userId: string, workId: string): Promise<boolean> {
  const [row] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from favorite_books where user_id = ${userId}::uuid and work_id = ${workId}::uuid`);
  return (row?.n ?? 0) > 0;
}

/**
 * Adiciona aos favoritos, no PRÓXIMO lugar livre — nunca na coroa: coroar é um
 * gesto à parte (coroar(), abaixo), e favoritar sozinho não decide isso por
 * você.
 */
export async function favoritar(
  actor: { id: string },
  workId: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  assertAuthenticated(actor as Viewer);

  const [existe] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from favorite_books where user_id = ${actor.id}::uuid`);
  if ((existe?.n ?? 0) >= 5) {
    return { ok: false, erro: "você já tem 5 favoritos — tire um antes de pôr outro" };
  }

  /**
   * A checagem de "você leu" mora DENTRO do insert: se não existir uma
   * library_entries sua com status='read' para este livro, o select da fonte
   * não devolve linha nenhuma, e o insert grava nada. Não é uma consulta antes
   * seguida de um insert separado — não existe intervalo em que a leitura
   * poderia ter sido apagada entre as duas.
   */
  const gravadas = await db.execute(sql`
    insert into favorite_books (user_id, work_id, position)
    select ${actor.id}::uuid, ${workId}::uuid,
           coalesce((select max(position) from favorite_books where user_id = ${actor.id}::uuid), 0) + 1
     where exists (
       select 1 from library_entries le
        where le.user_id = ${actor.id}::uuid and le.work_id = ${workId}::uuid and le.status = 'read')
    on conflict (user_id, work_id) do nothing
    returning work_id`);

  if (gravadas.length === 0) {
    return { ok: false, erro: "só dá para favoritar um livro que você já leu" };
  }
  return { ok: true };
}

/**
 * Tira dos favoritos, e fecha o buraco: quem vinha depois sobe uma posição
 * cada. Sem isso, tirar o do meio deixaria 1, 3, 4 — e o próximo favoritar
 * cairia em 5 antes da hora, ou pior, colidiria com a posição livre.
 *
 * MESMO TRUQUE DE DUAS FASES de coroar(), abaixo, e pelo mesmo motivo: um
 * único UPDATE que decrementa várias linhas de uma vez não tem ordem de
 * processamento garantida entre elas — o Postgres pode tentar gravar a
 * posição 4→3 antes de 3→2 ainda ter saído do caminho, e a
 * unique(user_id, position) recusa. Offset negativo primeiro (onde não há
 * como colidir), posição final depois.
 */
export async function desfavoritar(actor: { id: string }, workId: string): Promise<void> {
  assertAuthenticated(actor as Viewer);

  await db.transaction(async (tx) => {
    const [alvo] = await tx.execute<{ position: number }>(sql`
      delete from favorite_books
       where user_id = ${actor.id}::uuid and work_id = ${workId}::uuid
      returning position`);
    if (!alvo) return;

    const acimaOffset = await tx.execute<{ work_id: string; posicao_original: number }>(sql`
      update favorite_books set position = -position
       where user_id = ${actor.id}::uuid and position > ${alvo.position}
      returning work_id, -position as posicao_original`);

    for (const row of acimaOffset) {
      await tx.execute(sql`
        update favorite_books set position = ${row.posicao_original - 1}
         where user_id = ${actor.id}::uuid and work_id = ${row.work_id}::uuid`);
    }
  });
}

/**
 * Move para a posição 1 — a coroa. Todo mundo que estava entre a 1 e a
 * anterior do alvo desliza uma casa pra trás.
 *
 * O RESHUFFLE é em DUAS fases, com um offset negativo temporário: mover
 * direto (2→1, 1→2) colide com o `unique(user_id, position)` no meio da
 * transação — a linha que vira 1 tentaria gravar antes de a antiga 1 ter
 * saído do caminho. Primeiro todo mundo recua para o negativo (onde não há
 * como colidir: nenhuma posição real é negativa), depois cada um grava a
 * posição final de uma vez.
 */
export async function coroar(actor: { id: string }, workId: string): Promise<void> {
  assertAuthenticated(actor as Viewer);

  await db.transaction(async (tx) => {
    const atuais = await tx.execute<{ work_id: string; position: number }>(sql`
      select work_id, position from favorite_books
       where user_id = ${actor.id}::uuid
       order by position asc`);

    const alvo = atuais.find((a) => a.work_id === workId);
    if (!alvo || alvo.position === 1) return;

    const nova = [
      workId,
      ...atuais.filter((a) => a.work_id !== workId).map((a) => a.work_id),
    ];

    await tx.execute(sql`
      update favorite_books set position = -position
       where user_id = ${actor.id}::uuid`);

    for (const [i, wid] of nova.entries()) {
      await tx.execute(sql`
        update favorite_books set position = ${i + 1}
         where user_id = ${actor.id}::uuid and work_id = ${wid}::uuid`);
    }
  });
}

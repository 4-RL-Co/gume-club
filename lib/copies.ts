import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ownedCopies } from "@/lib/db/schema";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O EXEMPLAR DE PAPEL. E ele NÃO está à venda, à troca, nem à disposição.
 *
 *  ═══ O QUE ESTE ARQUIVO ERA, E DEIXOU DE SER ═══
 *
 *  Ele guardava um pequeno mercado: doar, trocar, emprestar, com canal de contato e
 *  corrente de quem passou o livro para quem.
 *
 *  Saiu inteiro (migration 0046). O Gume é um registro de leitura, e aquilo o empurrava
 *  para ser um lugar de **transação entre pessoas** — com combinado, encontro e tudo o
 *  que vem junto quando estranhos precisam se acertar sobre um objeto. Isso traz um peso
 *  de moderação que nada no app estava pronto para carregar, e traz esse peso **mesmo
 *  quando dá certo**.
 *
 *  ═══ O QUE SOBROU, E POR QUE ELE VALE A PENA ═══
 *
 *  "Tenho este livro em papel, e ganhei da minha irmã em 2019."
 *
 *  Isso não é um anúncio: é a HISTÓRIA de um exemplar, e é uma das coisas mais bonitas
 *  que este app guarda. Ela nunca dependeu de o livro estar à disposição de ninguém.
 *
 *  Nada aqui é lido por outra pessoa. Não há visibilidade a filtrar porque não há nada
 *  que atravesse de uma estante para outra.
 * ════════════════════════════════════════════════════════════════════
 */

export type MinhaCopia = {
  state: string;
  acquiredNote: string | null;
  editionId: string | null;
};

/** O meu exemplar deste livro. Só o meu: não existe o exemplar de outra pessoa aqui. */
export async function getMinhaCopia(
  actor: { id: string } | null,
  workId: string,
): Promise<MinhaCopia | null> {
  if (!actor) return null;

  const [copia] = await db
    .select({
      state: ownedCopies.state,
      acquiredNote: ownedCopies.acquiredNote,
      editionId: ownedCopies.editionId,
    })
    .from(ownedCopies)
    .where(and(eq(ownedCopies.userId, actor.id), eq(ownedCopies.workId, workId)))
    .limit(1);

  return copia ?? null;
}

/**
 * "De onde veio esse livro?" — texto livre, e nunca uma lista.
 *
 * Ninguém ganhou um livro de "subscription_box": ganhou a caixa de janeiro do clube de
 * filosofia, ou a irmã deu. Nunca obrigatório, nunca cobrado.
 */
export async function guardarHistoria(
  actor: { id: string },
  workId: string,
  editionId: string | null,
  nota: string,
): Promise<void> {
  const limpo = nota.trim().slice(0, 140);

  await db.execute(sql`
    insert into owned_copies (user_id, work_id, edition_id, state, acquired_note)
    values (${actor.id}::uuid, ${workId}::uuid, ${editionId}::uuid, 'owned', ${limpo || null})
    on conflict (user_id, work_id)
      do update set acquired_note = excluded.acquired_note,
                    edition_id    = coalesce(excluded.edition_id, owned_copies.edition_id)`);
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A COLEÇÃO. Um EIXO à parte da estante, e não um recorte dela.
 *
 *  ═══ POR QUE ISTO PRECISOU EXISTIR ═══
 *
 *  O dono coleciona livros, e disse a frase que faltava: *"tem livros que eu li e não
 *  tenho na estante"*. O contrário também: livros que ele tem e não leu, e que talvez
 *  nunca leia.
 *
 *  A tabela já separava as duas coisas desde sempre — "ter não é ler" está escrito no
 *  schema. O que não existia era **um jeito de dizer "eu tenho"**: a única forma de
 *  nascer uma linha aqui era como efeito colateral de escrever a nota "de onde veio".
 *  Quem não contasse a história do exemplar nunca registrava que ele era seu. Em
 *  produção eram 29 exemplares, de 4 pessoas — não por falta de interesse, mas por
 *  falta de porta.
 *
 *  ═══ POR QUE É LUGAR, E NÃO FILTRO ═══
 *
 *  A regra da casa diz que recorte não é lugar: "lendo" e "lidos" saíram da navegação
 *  por isso. Ela vale para recortes de LEITURA, e coleção não é um deles.
 *
 *  A estante responde "o que eu li". A coleção responde "o que eu tenho". São perguntas
 *  independentes, e o mesmo livro pode responder sim a uma e não à outra. Forçar a
 *  segunda a ser filtro da primeira é o que já produziu o "esperando" mentiroso: um
 *  livro comprado e nunca aberto virava uma INTENÇÃO DE LER que ninguém teve.
 *
 *  ═══ E ELA É SUA, E DE MAIS NINGUÉM ═══
 *
 *  O cabeçalho deste arquivo já dizia: nada aqui é lido por outra pessoa. Isso continua
 *  valendo, e agora vale de propósito e não por acaso.
 *
 *  A coluna `visibility` da tabela tem `public` como padrão, e **nenhuma consulta a
 *  lê**. Se a coleção virasse pública porque um padrão de coluna dizia isso, o app
 *  publicaria o que as pessoas têm em casa sem ninguém ter escolhido — e "o que eu
 *  tenho guardado" é outra coisa que "o que eu li". Quando alguém quiser mostrar a
 *  coleção, isso vai ser um botão que ela aperta, e não um padrão que ela herdou.
 * ════════════════════════════════════════════════════════════════════
 */

/** O que dá para dizer sobre um exemplar hoje. `null` é "não tenho e não quero marcar". */
export type Posse = "owned" | "wanted" | null;

export type ItemDaColecao = {
  slug: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  state: string;
  acquiredNote: string | null;
  /** A edição QUE É SUA, quando você escolheu uma: é o exemplar, e não a obra. */
  publisher: string | null;
  publishedYear: number | null;
  /** Você leu este livro? A outra pergunta, e a razão de a coleção existir. */
  lido: boolean;
};

/**
 * Marcar (ou desmarcar) que este livro é seu.
 *
 * `null` APAGA a linha em vez de gravar um estado "não tenho": a ausência já significa
 * isso, e um terceiro estado para dizer o que o vazio diz seria uma linha por livro
 * que ninguém tem, no acervo inteiro.
 *
 * A nota de procedência sobrevive à mudança de estado: quem escreveu "presente da minha
 * irmã" e depois emprestou o livro não perde a história por causa disso. Ela só some
 * quando a linha some, que é quando a pessoa diz que o livro não é dela.
 */
export async function marcarPosse(
  actor: { id: string },
  workId: string,
  editionId: string | null,
  posse: Posse,
): Promise<void> {
  if (posse === null) {
    await db
      .delete(ownedCopies)
      .where(and(eq(ownedCopies.userId, actor.id), eq(ownedCopies.workId, workId)));
    return;
  }

  await db
    .insert(ownedCopies)
    .values({ userId: actor.id, workId, editionId, state: posse })
    .onConflictDoUpdate({
      target: [ownedCopies.userId, ownedCopies.workId],
      // A edição só é preenchida se estiver vazia: quem escolheu a sua a dedo escolheu,
      // e marcar "tenho" de novo não pode desfazer isso. Mesma regra da estante.
      set: { state: posse, editionId: sql`coalesce(${ownedCopies.editionId}, excluded.edition_id)` },
    });
}

/**
 * A coleção de quem está olhando. Só a dele: ver a nota sobre visibilidade, acima.
 *
 * O `lido` vem de uma consulta à estante, e é o dado que dá sentido à tela: sem ele a
 * coleção seria uma segunda lista de livros, e com ele ela responde "o que eu tenho e
 * ainda não li", que é a pergunta de quem coleciona.
 */
export async function getColecao(
  actor: { id: string } | null,
  estado: "owned" | "wanted" = "owned",
): Promise<ItemDaColecao[]> {
  if (!actor) return [];

  const rows = await db.execute<ItemDaColecao>(sql`
    select w.slug, w.title, a.name as author,
           coalesce(
             (select e2.cover_url from editions e2
               where e2.id = oc.edition_id and e2.cover_url is not null),
             (select e3.cover_url from editions e3
               where e3.work_id = w.id and e3.cover_url is not null
               order by e3.created_at asc limit 1)
           ) as "coverUrl",
           oc.state, oc.acquired_note as "acquiredNote",
           e.publisher, e.published_year as "publishedYear",
           exists (
             select 1 from library_entries le
              where le.user_id = oc.user_id and le.work_id = oc.work_id
                and le.status = 'read'
           ) as lido
      from owned_copies oc
      join works w on w.id = oc.work_id
      left join authors a on a.id = w.author_id
      left join editions e on e.id = oc.edition_id
     where oc.user_id = ${actor.id}::uuid
       and oc.state = ${estado}
     order by w.title asc`);

  return rows.map((r) => ({ ...r }));
}

/** Quantos em cada estado, para a tela dizer o tamanho da coleção sem carregá-la. */
export async function contarColecao(
  actor: { id: string } | null,
): Promise<{ tenho: number; quero: number; tenhoENaoLi: number }> {
  if (!actor) return { tenho: 0, quero: 0, tenhoENaoLi: 0 };

  const [row] = await db.execute<{ tenho: number; quero: number; tenho_e_nao_li: number }>(sql`
    select
      count(*) filter (where oc.state = 'owned')::int  as tenho,
      count(*) filter (where oc.state = 'wanted')::int as quero,
      count(*) filter (
        where oc.state = 'owned'
          and not exists (
            select 1 from library_entries le
             where le.user_id = oc.user_id and le.work_id = oc.work_id and le.status = 'read')
      )::int as tenho_e_nao_li
      from owned_copies oc
     where oc.user_id = ${actor.id}::uuid`);

  return {
    tenho: row?.tenho ?? 0,
    quero: row?.quero ?? 0,
    tenhoENaoLi: row?.tenho_e_nao_li ?? 0,
  };
}

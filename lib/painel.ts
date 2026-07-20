import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertIdealizador, type Viewer } from "@/lib/authz";
import { FUSO } from "@/lib/datas";
import { getCodigo, GitHubRecusou } from "@/lib/contributors";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PAINEL PRIVADO. Os números de verdade do projeto, para uma pessoa só.
 *
 *  ═══ QUEM VÊ ═══
 *
 *  Só o idealizador, e a checagem é `assertIdealizador` de lib/authz.ts,
 *  como toda autorização deste app. A página responde 404 (e não 403) para
 *  qualquer outra pessoa, porque um 403 confessa que a página existe. Ver
 *  app/painel/page.tsx.
 *
 *  ═══ ELE FALA COM O DONO, E POR ISSO USA PALAVRAS DE DONO ═══
 *
 *  "retenção", "coorte", "mediana": o resto do app não pode falar assim
 *  (lib/voice.test.ts quebra o build), e este arquivo e a página dele estão
 *  na exceção DAQUELE teste, explícita e comentada, porque aqui quem lê é
 *  quem construiu.
 *
 *  ═══ O QUE ELE NÃO É ═══
 *
 *  Não é rastreamento: nenhum clique, nenhuma página vista, nenhum scroll.
 *  Só o que diz se o projeto está vivo. E não é um placar: nunca uma lista
 *  de leitores ordenada por quanto leram, nem que só o dono veja. Distribuição
 *  e mediana, jamais ranking de gente com nome. Ver ai/DECISIONS.md.
 *
 *  ═══ DESEMPENHO ═══
 *
 *  São muitas agregações. Elas NÃO rodam em série: cada bloco (gente, uso,
 *  contribuição, convite, catálogo) é uma consulta, e os blocos rodam juntos
 *  num Promise.all. Se um dia ficar lento com a base grande, o próximo passo é
 *  um cache curto (a página não precisa ser ao vivo ao segundo), e não trinta
 *  consultas em fila. A leitura do GitHub (código) é a única que sai para fora,
 *  e ela falha sozinha sem derrubar o resto.
 *
 *  ═══ FUSO ═══
 *
 *  Todo agrupamento por dia usa `at time zone` de São Paulo (FUSO, lib/datas.ts),
 *  e nunca UTC: um "cadastros de hoje" agrupado em Greenwich erra na virada do dia.
 * ════════════════════════════════════════════════════════════════════
 */

/** Uma barra do gráfico de crescimento. `chave` é o dia/semana/mês; `n`, quantos entraram. */
export type Ponto = { chave: string; n: number };

/** Uma linha do log de cadastro. O e-mail NUNCA sai desta página. */
export type Cadastro = {
  handle: string;
  email: string;
  quando: string;
  metodo: "google" | "email" | "outro";
  convidadoPor: string | null;
};

/** Uma fatia nomeada: a palavra e quantos. Para a distribuição das notas. */
export type Fatia = { rotulo: string; n: number };

export type Painel = {
  gente: {
    total: number;
    /** Cadastros nos últimos 7, 30 e 90 dias. */
    novos7: number;
    novos30: number;
    novos30Anterior: number;
    novos90: number;
    /** Ativos: apareceram nos últimos 7 e 30 dias. */
    ativos7: number;
    ativos30: number;
    porDia: Ponto[];
    porSemana: Ponto[];
    porMes: Ponto[];
    /** Retenção crua: de quem teve chance (conta com 7+ dias), quantos voltaram depois da primeira semana. */
    coorteMadura: number;
    retidos: number;
    log: Cadastro[];
  };
  uso: {
    mediaLivros: number;
    medianaLivros: number;
    mediaLidos: number;
    medianaLidos: number;
    contasVazias: number;
    resenhas: number;
    notas: Fatia[];
  };
  contribuicao: {
    /** Correções que sobreviveram (não foram revertidas), por período, e quanta gente distinta. */
    correcoes30: number;
    pessoasQueCorrigiram: number;
    capasEnviadas: number;
    capasEsperando: number;
    obrasDeLeitor: number;
    /** Quem escreveu código. `null` quando o GitHub não respondeu. */
    codigo: number | null;
    /** A tese do projeto: a fatia de gente que contribuiu ao menos uma vez. */
    contribuintes: number;
  };
  convite: {
    porConvite: number;
    sozinhos: number;
    quemJaConvidou: number;
    convitesQueVingaram: number;
  };
  catalogo: {
    obras: number;
    edicoes: number;
    semCapa: number;
    semAno: number;
    semEditora: number;
    semAutor: number;
    /** As buscas que não acharam nada. Só o termo e quantas vezes, nunca quem procurou. */
    buscasVazias: { termo: string; quantas: number }[];
  };
};

export async function getPainel(viewer: Viewer): Promise<Painel> {
  // A porta, e ela é a mesma de todo o resto: só o idealizador. Defesa em profundidade,
  // além do 404 da página: esta função não devolve dado para mais ninguém.
  await assertIdealizador(viewer);

  const hojeSP = sql`(now() at time zone ${FUSO})::date`;

  const [gente, uso, contribuicaoBase, convite, catalogo, codigo] = await Promise.all([
    getGente(hojeSP),
    getUso(),
    getContribuicao(),
    getConvite(),
    getCatalogo(),
    getCodigoContagem(),
  ]);

  return { gente, uso, contribuicao: { ...contribuicaoBase, codigo }, convite, catalogo };
}

// ─────────────────────────────────────────────────────────────── GENTE

async function getGente(hojeSP: ReturnType<typeof sql>): Promise<Painel["gente"]> {
  const [contagens] = await db.execute<{
    total: number; novos7: number; novos30: number; novos30_anterior: number; novos90: number;
    ativos7: number; ativos30: number; coorte_madura: number; retidos: number;
  }>(sql`
    select
      count(*) filter (where deleted_at is null)::int as total,
      count(*) filter (where deleted_at is null and created_at >= now() - interval '7 days')::int as novos7,
      count(*) filter (where deleted_at is null and created_at >= now() - interval '30 days')::int as novos30,
      count(*) filter (where deleted_at is null
                         and created_at >= now() - interval '60 days'
                         and created_at <  now() - interval '30 days')::int as novos30_anterior,
      count(*) filter (where deleted_at is null and created_at >= now() - interval '90 days')::int as novos90,
      count(*) filter (where deleted_at is null and last_seen_on >= ${hojeSP} - 7)::int as ativos7,
      count(*) filter (where deleted_at is null and last_seen_on >= ${hojeSP} - 30)::int as ativos30,
      -- COORTE MADURA: contas velhas o bastante (7+ dias) para terem tido a chance de voltar.
      count(*) filter (where deleted_at is null
                         and created_at <= now() - interval '7 days')::int as coorte_madura,
      -- RETIDOS: dessas, quem voltou 7+ dias depois de se cadastrar. É a métrica que mais dói.
      count(*) filter (where deleted_at is null
                         and created_at <= now() - interval '7 days'
                         and last_seen_on is not null
                         and last_seen_on - (created_at at time zone ${FUSO})::date >= 7)::int as retidos
    from users
  `);

  const [porDia, porSemana, porMes, log] = await Promise.all([
    db.execute<{ chave: string; n: number }>(sql`
      select to_char((created_at at time zone ${FUSO})::date, 'YYYY-MM-DD') as chave, count(*)::int as n
        from users
       where deleted_at is null and created_at >= now() - interval '30 days'
       group by 1 order by 1
    `),
    db.execute<{ chave: string; n: number }>(sql`
      select to_char(date_trunc('week', (created_at at time zone ${FUSO})), 'YYYY-MM-DD') as chave, count(*)::int as n
        from users
       where deleted_at is null and created_at >= now() - interval '84 days'
       group by 1 order by 1
    `),
    db.execute<{ chave: string; n: number }>(sql`
      select to_char(date_trunc('month', (created_at at time zone ${FUSO})), 'YYYY-MM') as chave, count(*)::int as n
        from users
       where deleted_at is null and created_at >= now() - interval '365 days'
       group by 1 order by 1
    `),
    // O LOG DE CADASTRO. O método vem do provedor do Better Auth: 'google' ou 'credential'
    // (e-mail e senha). O e-mail está aqui, e ele não sai desta página. Nunca em log de
    // servidor, nunca em URL: é renderizado direto na tela que só o idealizador abre.
    db.execute<{
      handle: string; email: string; quando: string; provider: string | null; convidou: string | null;
    }>(sql`
      select u.handle,
             u.email,
             to_char((u.created_at at time zone ${FUSO}), 'YYYY-MM-DD HH24:MI') as quando,
             (select a."providerId" from account a where a."userId" = u.id order by a."createdAt" asc limit 1) as provider,
             inviter.handle as convidou
        from users u
        left join users inviter on inviter.id = u.invited_by and inviter.deleted_at is null
       where u.deleted_at is null
       order by u.created_at desc
       limit 50
    `),
  ]);

  return {
    total: contagens?.total ?? 0,
    novos7: contagens?.novos7 ?? 0,
    novos30: contagens?.novos30 ?? 0,
    novos30Anterior: contagens?.novos30_anterior ?? 0,
    novos90: contagens?.novos90 ?? 0,
    ativos7: contagens?.ativos7 ?? 0,
    ativos30: contagens?.ativos30 ?? 0,
    coorteMadura: contagens?.coorte_madura ?? 0,
    retidos: contagens?.retidos ?? 0,
    porDia: porDia.map((r) => ({ chave: r.chave, n: r.n })),
    porSemana: porSemana.map((r) => ({ chave: r.chave, n: r.n })),
    porMes: porMes.map((r) => ({ chave: r.chave, n: r.n })),
    log: log.map((r) => ({
      handle: r.handle,
      email: r.email,
      quando: r.quando,
      metodo: r.provider === "google" ? "google" : r.provider === "credential" ? "email" : "outro",
      convidadoPor: r.convidou,
    })),
  };
}

// ─────────────────────────────────────────────────────────────── USO

async function getUso(): Promise<Painel["uso"]> {
  // Média E mediana, juntas, de propósito: se um leitor tem 142 livros e os outros têm 3,
  // a média mente e a mediana não. As duas contam TODA conta, inclusive as vazias (zero
  // livros), porque a conta vazia é parte da verdade sobre o uso.
  const [numeros] = await db.execute<{
    media_livros: number; mediana_livros: number; media_lidos: number; mediana_lidos: number;
    vazias: number; resenhas: number;
  }>(sql`
    with por_pessoa as (
      select u.id,
             (select count(*) from library_entries le where le.user_id = u.id)::int as livros,
             (select count(*) from library_entries le where le.user_id = u.id and le.status = 'read')::int as lidos
        from users u
       where u.deleted_at is null
    )
    select
      coalesce(avg(livros), 0)::float as media_livros,
      coalesce(percentile_cont(0.5) within group (order by livros), 0)::float as mediana_livros,
      coalesce(avg(lidos), 0)::float as media_lidos,
      coalesce(percentile_cont(0.5) within group (order by lidos), 0)::float as mediana_lidos,
      count(*) filter (where livros = 0)::int as vazias,
      (select count(*) from reviews r
        join users u on u.id = r.user_id
       where u.deleted_at is null)::int as resenhas
    from por_pessoa
  `);

  const notas = await db.execute<{ value: number; n: number }>(sql`
    select r.value, count(*)::int as n
      from ratings r
      join users u on u.id = r.user_id and u.deleted_at is null
     group by r.value
  `);

  // A nota é PALAVRA, e não estrela: a distribuição fala a língua do app.
  const PALAVRA: Record<number, string> = {
    1: "não terminei", 2: "não gostei", 3: "achei ok", 4: "gostei", 5: "adorei",
  };
  const mapaNotas = new Map(notas.map((r) => [r.value, r.n]));

  return {
    mediaLivros: numeros?.media_livros ?? 0,
    medianaLivros: numeros?.mediana_livros ?? 0,
    mediaLidos: numeros?.media_lidos ?? 0,
    medianaLidos: numeros?.mediana_lidos ?? 0,
    contasVazias: numeros?.vazias ?? 0,
    resenhas: numeros?.resenhas ?? 0,
    notas: [1, 2, 3, 4, 5].map((v) => ({ rotulo: PALAVRA[v]!, n: mapaNotas.get(v) ?? 0 })),
  };
}

// ─────────────────────────────────────────────────────────── CONTRIBUIÇÃO

async function getContribuicao(): Promise<Omit<Painel["contribuicao"], "codigo">> {
  const [c] = await db.execute<{
    correcoes30: number; pessoas_corrigiram: number; capas_enviadas: number;
    capas_esperando: number; obras_de_leitor: number; contribuintes: number;
  }>(sql`
    select
      -- Correções que SOBREVIVERAM (não revertidas), nos últimos 30 dias. Contar correção
      -- feita, e não sobrevivida, premia vandalismo trivial. Ver lib/contributors.ts.
      (select count(*) from revisions
        where reverted_at is null
          and user_id is not null
          and created_at >= now() - interval '30 days')::int as correcoes30,
      (select count(distinct user_id) from revisions
        where reverted_at is null and user_id is not null)::int as pessoas_corrigiram,
      (select count(*) from cover_proposals)::int as capas_enviadas,
      (select count(*) from cover_proposals where state = 'pending')::int as capas_esperando,
      -- Obras que um leitor cadastrou a mão (needs_review). Edição não guarda quem criou,
      -- então isto conta OBRA, e não edição, e o painel diz isso.
      (select count(*) from works where needs_review = true)::int as obras_de_leitor,
      -- A TESE: gente que contribuiu ao menos uma vez, de qualquer forma que o banco sabe
      -- (correção que ficou de pé, ou capa proposta). Código vem do GitHub, à parte.
      (select count(*) from (
         select user_id from revisions where reverted_at is null and user_id is not null
         union
         select user_id from cover_proposals where user_id is not null
       ) q)::int as contribuintes
  `);

  return {
    correcoes30: c?.correcoes30 ?? 0,
    pessoasQueCorrigiram: c?.pessoas_corrigiram ?? 0,
    capasEnviadas: c?.capas_enviadas ?? 0,
    capasEsperando: c?.capas_esperando ?? 0,
    obrasDeLeitor: c?.obras_de_leitor ?? 0,
    contribuintes: c?.contribuintes ?? 0,
  };
}

/** O código vem do GitHub, e ele pode não responder. Falha sozinho, sem derrubar o painel. */
async function getCodigoContagem(): Promise<number | null> {
  try {
    const gente = await getCodigo();
    return gente.length;
  } catch (e) {
    if (e instanceof GitHubRecusou) return null;
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────── CONVITE

async function getConvite(): Promise<Painel["convite"]> {
  const [c] = await db.execute<{
    por_convite: number; sozinhos: number; ja_convidou: number; vingaram: number;
  }>(sql`
    select
      count(*) filter (where invited_by is not null)::int as por_convite,
      count(*) filter (where invited_by is null)::int as sozinhos,
      -- Gente que já convidou ALGUÉM que ficou. Sem quantos: é sim ou não, não é placar.
      (select count(distinct invited_by) from users
        where invited_by is not null and deleted_at is null)::int as ja_convidou,
      -- Convites que viraram cadastro de verdade (o convidado ainda existe).
      (select count(*) from users c
        where c.invited_by is not null and c.deleted_at is null)::int as vingaram
    from users
    where deleted_at is null
  `);

  return {
    porConvite: c?.por_convite ?? 0,
    sozinhos: c?.sozinhos ?? 0,
    quemJaConvidou: c?.ja_convidou ?? 0,
    convitesQueVingaram: c?.vingaram ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────── CATÁLOGO

async function getCatalogo(): Promise<Painel["catalogo"]> {
  const [c] = await db.execute<{
    obras: number; edicoes: number; sem_capa: number; sem_ano: number; sem_editora: number; sem_autor: number;
  }>(sql`
    select
      (select count(*) from works)::int as obras,
      (select count(*) from editions)::int as edicoes,
      (select count(*) from editions where cover_url is null)::int as sem_capa,
      (select count(*) from editions where published_year is null)::int as sem_ano,
      (select count(*) from editions where publisher is null or publisher = '')::int as sem_editora,
      (select count(*) from works where author_id is null)::int as sem_autor
  `);

  // As buscas que não acharam nada, ainda não atendidas. Só o termo e quantas vezes, nunca
  // quem procurou: a tabela não tem user_id de propósito. Ver lib/torneira.ts. É a lista
  // mais valiosa da página: o buraco do catálogo, dito pelo próprio leitor.
  const buscas = await db.execute<{ texto: string; quantas: number }>(sql`
    select texto, quantas
      from buscas_vazias
     where atendida_em is null
     order by quantas desc, ultima_em desc
     limit 40
  `);

  return {
    obras: c?.obras ?? 0,
    edicoes: c?.edicoes ?? 0,
    semCapa: c?.sem_capa ?? 0,
    semAno: c?.sem_ano ?? 0,
    semEditora: c?.sem_editora ?? 0,
    semAutor: c?.sem_autor ?? 0,
    buscasVazias: buscas.map((r) => ({ termo: r.texto, quantas: r.quantas })),
  };
}

import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertIdealizador, type Viewer } from "@/lib/authz";
import { FUSO } from "@/lib/datas";
import { podeSerDescoberto } from "@/lib/descoberta";
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
 *  ═══ FILTROS ═══
 *
 *  O período (uma janela de tempo) controla o gráfico de crescimento, o log de
 *  cadastro e o resumo do período. Os KPIs de saúde (7/30/90 dias, ativos,
 *  retenção) são janelas FIXAS de propósito: eles são a régua padrão, e uma régua
 *  que muda de tamanho não compara nada. O catálogo é ponto no tempo, e não filtra.
 *
 *  ═══ FUSO ═══
 *
 *  Todo agrupamento por dia usa `at time zone` de São Paulo (FUSO, lib/datas.ts),
 *  e nunca UTC: um "cadastros de hoje" agrupado em Greenwich erra na virada do dia.
 * ════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────── FILTRO

export type Periodo = "7d" | "30d" | "90d" | "12m" | "tudo" | "custom";
export type Granularidade = "dia" | "semana" | "mes";
export type MetodoFiltro = "todos" | "google" | "email";
export type OrigemFiltro = "todos" | "convite" | "sozinho";

export type Filtro = {
  periodo: Periodo;
  /** Só quando periodo === "custom": os limites em YYYY-MM-DD, no fuso de São Paulo. */
  desde: string | null;
  ate: string | null;
  gran: Granularidade;
  metodo: MetodoFiltro;
  origem: OrigemFiltro;
};

export const FILTRO_PADRAO: Filtro = {
  periodo: "tudo",
  desde: null,
  ate: null,
  gran: "mes",
  metodo: "todos",
  origem: "todos",
};

/** Lê o filtro dos parâmetros da URL, com padrões seguros. Nada aqui confia no formato. */
export function filtroDaUrl(params: Record<string, string | string[] | undefined>): Filtro {
  const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const periodos: Periodo[] = ["7d", "30d", "90d", "12m", "tudo", "custom"];
  const grans: Granularidade[] = ["dia", "semana", "mes"];
  const dataOk = (s: string | undefined): string | null =>
    s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;

  const periodo = periodos.includes(um(params.periodo) as Periodo)
    ? (um(params.periodo) as Periodo)
    : "tudo";
  const gran = grans.includes(um(params.gran) as Granularidade)
    ? (um(params.gran) as Granularidade)
    : periodo === "7d" || periodo === "30d"
      ? "dia"
      : periodo === "90d"
        ? "semana"
        : "mes";

  return {
    periodo,
    desde: dataOk(um(params.desde)),
    ate: dataOk(um(params.ate)),
    gran,
    metodo: (["todos", "google", "email"] as MetodoFiltro[]).includes(um(params.metodo) as MetodoFiltro)
      ? (um(params.metodo) as MetodoFiltro)
      : "todos",
    origem: (["todos", "convite", "sozinho"] as OrigemFiltro[]).includes(um(params.origem) as OrigemFiltro)
      ? (um(params.origem) as OrigemFiltro)
      : "todos",
  };
}

/** A condição SQL de "criado dentro da janela", no fuso de São Paulo. */
function janela(col: SQL, f: Filtro): SQL {
  const dia = (c: SQL) => sql`(${c} at time zone ${FUSO})::date`;
  switch (f.periodo) {
    case "7d":
      return sql`${col} >= now() - interval '7 days'`;
    case "30d":
      return sql`${col} >= now() - interval '30 days'`;
    case "90d":
      return sql`${col} >= now() - interval '90 days'`;
    case "12m":
      return sql`${col} >= now() - interval '365 days'`;
    case "custom":
      return sql`${dia(col)} between coalesce(${f.desde}::date, '0001-01-01') and coalesce(${f.ate}::date, '9999-12-31')`;
    case "tudo":
    default:
      return sql`true`;
  }
}

// ─────────────────────────────────────────────────────────────── METAS

/**
 * As metas SOBEM sozinhas. Bateu 100 usuários, a próxima é 250; bateu 5
 * contribuidores, a próxima é 10. Uma meta que fica parada depois de batida deixa
 * de puxar; uma que sobe continua sendo um horizonte. A escada começa onde o dono
 * pediu (100 e 5) e cresce em passos redondos.
 */
const ESCADA_USUARIOS = [100, 250, 500, 1000, 2500, 5000, 10000, 25000];
const ESCADA_CONTRIB = [5, 10, 25, 50, 100, 250, 500];

export type Meta = { alvo: number; atual: number; batidas: number };

function metaDe(atual: number, escada: number[]): Meta {
  // A meta atual é o primeiro degrau ACIMA do valor de hoje. Passou do último, o alvo é ele.
  const alvo = escada.find((d) => d > atual) ?? escada[escada.length - 1]!;
  const batidas = escada.filter((d) => d <= atual).length;
  return { alvo, atual, batidas };
}

// ─────────────────────────────────────────────────────────────── TIPOS

export type Ponto = { chave: string; n: number };

/** Uma linha do log de cadastro. O e-mail NUNCA sai desta página num arquivo. */
export type Cadastro = {
  handle: string;
  email: string;
  quando: string;
  metodo: "google" | "email" | "outro";
  convidadoPor: string | null;
};

export type Fatia = { rotulo: string; n: number };

export type Painel = {
  filtro: Filtro;
  metas: { usuarios: Meta; contribuidores: Meta };
  gente: {
    total: number;
    novos7: number;
    novos30: number;
    novos30Anterior: number;
    novos90: number;
    /** Cadastros dentro do período filtrado. */
    novosPeriodo: number;
    ativos1: number;
    ativos7: number;
    ativos30: number;
    /** Contas sem sinal de vida em 30 dias (adormecidas), e nunca vistas. */
    adormecidos: number;
    /** Como as contas entraram, por método. */
    metodoGoogle: number;
    metodoEmail: number;
    porDia: Ponto[];
    porSemana: Ponto[];
    porMes: Ponto[];
    /** A série do período filtrado, na granularidade escolhida. */
    serie: Ponto[];
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
    resenhas30: number;
    notasDadas30: number;
    notas: Fatia[];
    /** Distribuição do tamanho das estantes: quantas contas em cada faixa. */
    tamanhoEstante: Fatia[];
  };
  contribuicao: {
    correcoes30: number;
    correcoesPeriodo: number;
    pessoasQueCorrigiram: number;
    capasEnviadas: number;
    capasEsperando: number;
    obrasDeLeitor: number;
    codigo: number | null;
    contribuintes: number;
  };
  convite: {
    porConvite: number;
    sozinhos: number;
    quemJaConvidou: number;
    convitesQueVingaram: number;
    /** Convidados que vingaram por pessoa que convidou. Um proxy de viralidade. */
    mediaPorConvidante: number;
  };
  catalogo: {
    obras: number;
    edicoes: number;
    semCapa: number;
    semAno: number;
    semEditora: number;
    semAutor: number;
    buscasVazias: { termo: string; quantas: number }[];
  };
  /**
   * ════════════════════════════════════════════════════════════════════
   *  A BASE, PESSOA A PESSOA.
   *
   *  ═══ ISTO É PRIVADO, E TEM QUE CONTINUAR SENDO ═══
   *
   *  O Gume se recusa a ordenar GENTE por esforço — está escrito em
   *  lib/queridinhos.ts e vale para todo o produto: "quem leu mais livros" é placar,
   *  e placar transforma ler numa competição. Esta lista existe porque o painel é a
   *  sala privada de quem sustenta o projeto, atrás de assertIdealizador(), e saber
   *  quem está usando é o mínimo para decidir o que construir.
   *
   *  **Ela nunca pode virar tela pública.** No dia em que alguém quiser reaproveitar
   *  esta consulta noutro lugar, a resposta é não. O que aqui é diagnóstico, lá vira
   *  ranking de leitor.
   *
   *  ═══ E-MAIL AQUI, E SÓ AQUI ═══
   *
   *  É o dado mais sensível do banco. Ele aparece porque o dono precisa falar com quem
   *  usa (o leitor de 503 livros que não confirmou o e-mail é um caso concreto), e
   *  porque esta sala já é a única que mostra o backup inteiro.
   * ════════════════════════════════════════════════════════════════════
   */
  pessoas: Pessoa[];
  insights: string[];
};

/**
 * O ENGAJAMENTO É UMA DESCRIÇÃO, E NÃO UMA NOTA.
 *
 * Não é 0 a 100 nem estrelinha: são quatro estados que dizem o que a pessoa ESTÁ
 * FAZENDO, porque é isso que responde "o que eu construo agora". Um número diria
 * quem é "melhor", e não existe leitor melhor que outro.
 *
 *  - `sumiu`      — não aparece há mais de 30 dias (ou nunca voltou)
 *  - `espiando`   — volta, mas quase não tem estante: o app ainda não pegou
 *  - `lendo`      — estante de verdade, e aparece
 *  - `construindo`— além disso, escreve: resenha ou conserto de ficha
 */
export type Engajamento = "sumiu" | "espiando" | "lendo" | "construindo";

export type Pessoa = {
  handle: string;
  nome: string | null;
  email: string;
  emailVerificado: boolean;
  /**
   * Está fora do explorar, das listas e dos buscadores AGORA.
   *
   * NÃO é "não confirmou o e-mail": a estante também prova (lib/descoberta.ts), e o
   * leitor dos 503 livros aparece hoje mesmo sem ter confirmado. Uma coluna que
   * olhasse só o e-mail chamaria de invisível quem está visível — o painel mentiria
   * na cara do dono, que é o erro que este dia inteiro passou consertando.
   */
  invisivel: boolean;
  entrouEm: Date;
  /** Última vez que apareceu. `null` = nunca voltou depois de se cadastrar. */
  ultimaVez: Date | null;
  livros: number;
  resenhas: number;
  correcoes: number;
  engajamento: Engajamento;
};

/**
 * A base, pessoa a pessoa. Uma consulta só: são dezenas de contas hoje, e mesmo com
 * milhares isto é uma varredura por leitor, não por livro.
 *
 * O engajamento é derivado AQUI, no SQL, e não na tela: a mesma classificação vai
 * para o relatório em markdown que o painel exporta, e duas definições de "engajado"
 * divergiriam no primeiro dia.
 */
async function getPessoas(hojeSP: SQL): Promise<Pessoa[]> {
  const rows = await db.execute<{
    handle: string; nome: string | null; email: string; email_verificado: boolean;
    entrou_em: Date; ultima_vez: Date | null; invisivel: boolean;
    livros: number; resenhas: number; correcoes: number; engajamento: Engajamento;
  }>(sql`
    with base as (
      select u.handle, u.display_name as nome, u.email, u.email_verified as email_verificado,
             u.created_at as entrou_em, u.last_seen_on as ultima_vez,
             (select count(*) from library_entries le where le.user_id = u.id)::int as livros,
             (select count(*) from reviews r
               where r.user_id = u.id and r.deleted_at is null)::int as resenhas,
             (select count(*) from revisions rv
               where rv.user_id = u.id and rv.reverted_at is null)::int as correcoes,
             (u.last_seen_on is null or u.last_seen_on < ${hojeSP} - 30) as sumido,
             -- A MESMA régua de lib/descoberta.ts: e-mail confirmado OU estante que prova.
             not (${podeSerDescoberto}) as invisivel
        from users u
       where u.deleted_at is null
    )
    select base.*,
           case
             -- Sumido vem PRIMEIRO: quem não volta há um mês não é "construindo"
             -- por causa de uma resenha de abril. O estado é sobre agora.
             when sumido then 'sumiu'
             when resenhas > 0 or correcoes > 0 then 'construindo'
             when livros >= 3 then 'lendo'
             else 'espiando'
           end as engajamento
      from base
     order by livros desc, entrou_em desc`);

  return rows.map((r) => ({
    handle: r.handle,
    nome: r.nome,
    email: r.email,
    emailVerificado: r.email_verificado,
    invisivel: r.invisivel,
    entrouEm: r.entrou_em,
    ultimaVez: r.ultima_vez,
    livros: r.livros,
    resenhas: r.resenhas,
    correcoes: r.correcoes,
    engajamento: r.engajamento,
  }));
}

// ─────────────────────────────────────────────────────────────── ENTRADA

export async function getPainel(viewer: Viewer, filtro: Filtro = FILTRO_PADRAO): Promise<Painel> {
  await assertIdealizador(viewer);
  return coletarPainel(filtro);
}

/**
 * Junta os números, SEM checar quem pediu. Privada por convenção, e os DOIS chamadores
 * autorizam antes: getPainel (a página, pelo idealizador) e a rota de export (por sessão
 * ou token). Nunca chame isto sem autorizar primeiro.
 */
export async function coletarPainel(filtro: Filtro = FILTRO_PADRAO): Promise<Painel> {
  const hojeSP = sql`(now() at time zone ${FUSO})::date`;

  const [gente, uso, contribuicao, convite, catalogo, codigo, pessoas] = await Promise.all([
    getGente(hojeSP, filtro),
    getUso(),
    getContribuicao(filtro),
    getConvite(),
    getCatalogo(),
    getCodigoContagem(),
    getPessoas(hojeSP),
  ]);

  const metas = {
    usuarios: metaDe(gente.total, ESCADA_USUARIOS),
    contribuidores: metaDe(contribuicao.contribuintes, ESCADA_CONTRIB),
  };

  const painel: Painel = {
    filtro,
    metas,
    gente,
    uso,
    contribuicao: { ...contribuicao, codigo },
    convite,
    catalogo,
    pessoas,
    insights: [],
  };
  painel.insights = gerarInsights(painel);
  return painel;
}

// ─────────────────────────────────────────────────────────────── GENTE

async function getGente(hojeSP: SQL, filtro: Filtro): Promise<Painel["gente"]> {
  const dentro = janela(sql`created_at`, filtro);

  const [contagens] = await db.execute<{
    total: number; novos7: number; novos30: number; novos30_anterior: number; novos90: number;
    novos_periodo: number; ativos1: number; ativos7: number; ativos30: number; adormecidos: number;
    metodo_google: number; metodo_email: number; coorte_madura: number; retidos: number;
  }>(sql`
    select
      count(*) filter (where deleted_at is null)::int as total,
      count(*) filter (where deleted_at is null and created_at >= now() - interval '7 days')::int as novos7,
      count(*) filter (where deleted_at is null and created_at >= now() - interval '30 days')::int as novos30,
      count(*) filter (where deleted_at is null
                         and created_at >= now() - interval '60 days'
                         and created_at <  now() - interval '30 days')::int as novos30_anterior,
      count(*) filter (where deleted_at is null and created_at >= now() - interval '90 days')::int as novos90,
      count(*) filter (where deleted_at is null and ${dentro})::int as novos_periodo,
      count(*) filter (where deleted_at is null and last_seen_on >= ${hojeSP})::int as ativos1,
      count(*) filter (where deleted_at is null and last_seen_on >= ${hojeSP} - 7)::int as ativos7,
      count(*) filter (where deleted_at is null and last_seen_on >= ${hojeSP} - 30)::int as ativos30,
      count(*) filter (where deleted_at is null and (last_seen_on is null or last_seen_on < ${hojeSP} - 30))::int as adormecidos,
      (select count(*) from account a join users u on u.id = a."userId"
        where u.deleted_at is null and a."providerId" = 'google')::int as metodo_google,
      (select count(*) from account a join users u on u.id = a."userId"
        where u.deleted_at is null and a."providerId" = 'credential')::int as metodo_email,
      count(*) filter (where deleted_at is null
                         and created_at <= now() - interval '7 days')::int as coorte_madura,
      count(*) filter (where deleted_at is null
                         and created_at <= now() - interval '7 days'
                         and last_seen_on is not null
                         and last_seen_on - (created_at at time zone ${FUSO})::date >= 7)::int as retidos
    from users
  `);

  const [porDia, porSemana, porMes, serie, log] = await Promise.all([
    serieCrescimento("dia", sql`created_at >= now() - interval '30 days'`),
    serieCrescimento("semana", sql`created_at >= now() - interval '84 days'`),
    serieCrescimento("mes", sql`created_at >= now() - interval '365 days'`),
    serieCrescimento(filtro.gran, dentro),
    getLog(hojeSP, filtro),
  ]);

  return {
    total: contagens?.total ?? 0,
    novos7: contagens?.novos7 ?? 0,
    novos30: contagens?.novos30 ?? 0,
    novos30Anterior: contagens?.novos30_anterior ?? 0,
    novos90: contagens?.novos90 ?? 0,
    novosPeriodo: contagens?.novos_periodo ?? 0,
    ativos1: contagens?.ativos1 ?? 0,
    ativos7: contagens?.ativos7 ?? 0,
    ativos30: contagens?.ativos30 ?? 0,
    adormecidos: contagens?.adormecidos ?? 0,
    metodoGoogle: contagens?.metodo_google ?? 0,
    metodoEmail: contagens?.metodo_email ?? 0,
    porDia, porSemana, porMes, serie,
    coorteMadura: contagens?.coorte_madura ?? 0,
    retidos: contagens?.retidos ?? 0,
    log,
  };
}

async function serieCrescimento(gran: Granularidade, cond: SQL): Promise<Ponto[]> {
  const balde =
    gran === "dia"
      ? sql`to_char((created_at at time zone ${FUSO})::date, 'YYYY-MM-DD')`
      : gran === "semana"
        ? sql`to_char(date_trunc('week', (created_at at time zone ${FUSO})), 'YYYY-MM-DD')`
        : sql`to_char(date_trunc('month', (created_at at time zone ${FUSO})), 'YYYY-MM')`;

  const rows = await db.execute<{ chave: string; n: number }>(sql`
    select ${balde} as chave, count(*)::int as n
      from users
     where deleted_at is null and ${cond}
     group by 1 order by 1
  `);
  return rows.map((r) => ({ chave: r.chave, n: r.n }));
}

async function getLog(hojeSP: SQL, filtro: Filtro): Promise<Cadastro[]> {
  const dentro = janela(sql`u.created_at`, filtro);
  // O método filtra pelo provedor; a origem, por ter (ou não) quem convidou.
  const porMetodo =
    filtro.metodo === "google"
      ? sql`and exists (select 1 from account a where a."userId" = u.id and a."providerId" = 'google')`
      : filtro.metodo === "email"
        ? sql`and exists (select 1 from account a where a."userId" = u.id and a."providerId" = 'credential')`
        : sql``;
  const porOrigem =
    filtro.origem === "convite"
      ? sql`and u.invited_by is not null`
      : filtro.origem === "sozinho"
        ? sql`and u.invited_by is null`
        : sql``;

  const log = await db.execute<{
    handle: string; email: string; quando: string; provider: string | null; convidou: string | null;
  }>(sql`
    select u.handle,
           u.email,
           to_char((u.created_at at time zone ${FUSO}), 'YYYY-MM-DD HH24:MI') as quando,
           (select a."providerId" from account a where a."userId" = u.id order by a."createdAt" asc limit 1) as provider,
           inviter.handle as convidou
      from users u
      left join users inviter on inviter.id = u.invited_by and inviter.deleted_at is null
     where u.deleted_at is null and ${dentro} ${porMetodo} ${porOrigem}
     order by u.created_at desc
     limit 100
  `);

  return log.map((r) => ({
    handle: r.handle,
    email: r.email,
    quando: r.quando,
    metodo: r.provider === "google" ? "google" : r.provider === "credential" ? "email" : "outro",
    convidadoPor: r.convidou,
  }));
}

// ─────────────────────────────────────────────────────────────── USO

async function getUso(): Promise<Painel["uso"]> {
  const [numeros] = await db.execute<{
    media_livros: number; mediana_livros: number; media_lidos: number; mediana_lidos: number;
    vazias: number; resenhas: number; resenhas30: number; notas30: number;
    faixa0: number; faixa1: number; faixa5: number; faixa10: number; faixa25: number;
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
      count(*) filter (where livros = 0)::int as faixa0,
      count(*) filter (where livros between 1 and 4)::int as faixa1,
      count(*) filter (where livros between 5 and 9)::int as faixa5,
      count(*) filter (where livros between 10 and 24)::int as faixa10,
      count(*) filter (where livros >= 25)::int as faixa25,
      (select count(*) from reviews r join users u on u.id = r.user_id
        where u.deleted_at is null and r.deleted_at is null)::int as resenhas,
      (select count(*) from reviews r join users u on u.id = r.user_id
        where u.deleted_at is null and r.deleted_at is null and r.created_at >= now() - interval '30 days')::int as resenhas30,
      (select count(*) from ratings ra join users u on u.id = ra.user_id
        where u.deleted_at is null and ra.rated_at >= now() - interval '30 days')::int as notas30
    from por_pessoa
  `);

  const notas = await db.execute<{ value: number; n: number }>(sql`
    select r.value, count(*)::int as n
      from ratings r join users u on u.id = r.user_id and u.deleted_at is null
     group by r.value
  `);
  const PALAVRA: Record<number, string> = {
    1: "detestei", 2: "não gostei", 3: "achei ok", 4: "gostei", 5: "adorei",
  };
  const mapaNotas = new Map(notas.map((r) => [r.value, r.n]));

  return {
    mediaLivros: numeros?.media_livros ?? 0,
    medianaLivros: numeros?.mediana_livros ?? 0,
    mediaLidos: numeros?.media_lidos ?? 0,
    medianaLidos: numeros?.mediana_lidos ?? 0,
    contasVazias: numeros?.vazias ?? 0,
    resenhas: numeros?.resenhas ?? 0,
    resenhas30: numeros?.resenhas30 ?? 0,
    notasDadas30: numeros?.notas30 ?? 0,
    notas: [1, 2, 3, 4, 5].map((v) => ({ rotulo: PALAVRA[v]!, n: mapaNotas.get(v) ?? 0 })),
    tamanhoEstante: [
      { rotulo: "vazia", n: numeros?.faixa0 ?? 0 },
      { rotulo: "1 a 4", n: numeros?.faixa1 ?? 0 },
      { rotulo: "5 a 9", n: numeros?.faixa5 ?? 0 },
      { rotulo: "10 a 24", n: numeros?.faixa10 ?? 0 },
      { rotulo: "25 ou mais", n: numeros?.faixa25 ?? 0 },
    ],
  };
}

// ─────────────────────────────────────────────────────────── CONTRIBUIÇÃO

async function getContribuicao(filtro: Filtro): Promise<Omit<Painel["contribuicao"], "codigo">> {
  const dentro = janela(sql`created_at`, filtro);
  const [c] = await db.execute<{
    correcoes30: number; correcoes_periodo: number; pessoas_corrigiram: number; capas_enviadas: number;
    capas_esperando: number; obras_de_leitor: number; contribuintes: number;
  }>(sql`
    select
      (select count(*) from revisions
        where reverted_at is null and user_id is not null
          and created_at >= now() - interval '30 days')::int as correcoes30,
      (select count(*) from revisions
        where reverted_at is null and user_id is not null and ${dentro})::int as correcoes_periodo,
      (select count(distinct user_id) from revisions
        where reverted_at is null and user_id is not null)::int as pessoas_corrigiram,
      (select count(*) from cover_proposals)::int as capas_enviadas,
      (select count(*) from cover_proposals where state = 'pending')::int as capas_esperando,
      (select count(*) from works where needs_review = true)::int as obras_de_leitor,
      (select count(*) from (
         select user_id from revisions where reverted_at is null and user_id is not null
         union
         select user_id from cover_proposals where user_id is not null
       ) q)::int as contribuintes
  `);

  return {
    correcoes30: c?.correcoes30 ?? 0,
    correcoesPeriodo: c?.correcoes_periodo ?? 0,
    pessoasQueCorrigiram: c?.pessoas_corrigiram ?? 0,
    capasEnviadas: c?.capas_enviadas ?? 0,
    capasEsperando: c?.capas_esperando ?? 0,
    obrasDeLeitor: c?.obras_de_leitor ?? 0,
    contribuintes: c?.contribuintes ?? 0,
  };
}

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
      (select count(distinct invited_by) from users
        where invited_by is not null and deleted_at is null)::int as ja_convidou,
      (select count(*) from users c
        where c.invited_by is not null and c.deleted_at is null)::int as vingaram
    from users
    where deleted_at is null
  `);

  const jaConvidou = c?.ja_convidou ?? 0;
  const vingaram = c?.vingaram ?? 0;
  return {
    porConvite: c?.por_convite ?? 0,
    sozinhos: c?.sozinhos ?? 0,
    quemJaConvidou: jaConvidou,
    convitesQueVingaram: vingaram,
    mediaPorConvidante: jaConvidou > 0 ? vingaram / jaConvidou : 0,
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

// ─────────────────────────────────────────────────────────────── INSIGHTS

/**
 * Frases que o dono leria olhando os números e pensando alto. Não é IA: é aritmética
 * com um limiar, dita em português. Cada uma aponta uma coisa que talvez mereça ação.
 */
function gerarInsights(p: Painel): string[] {
  const nf = new Intl.NumberFormat("pt-BR");
  const n = (x: number) => nf.format(x);
  const out: string[] = [];

  const ativacao = p.gente.total > 0 ? (p.gente.total - p.uso.contasVazias) / p.gente.total : 0;
  if (p.gente.total >= 5) {
    if (ativacao < 0.5) {
      out.push(`Metade das contas ainda não pôs um livro na estante (ativação em ${Math.round(ativacao * 100)}%). O cadastro está virando conta, mas não uso.`);
    } else {
      out.push(`Ativação em ${Math.round(ativacao * 100)}%: a maioria de quem entra chega a pôr um livro na estante.`);
    }
  }

  if (p.gente.coorteMadura >= 20) {
    const ret = Math.round((p.gente.retidos / p.gente.coorteMadura) * 100);
    out.push(`Retenção da primeira semana em ${ret}%. É a métrica que mais importa: ${ret < 30 ? "está baixa, e crescer sem reter é encher um balde furado." : "gente está voltando."}`);
  }

  if (p.gente.adormecidos > 0 && p.gente.total > 0) {
    const dorm = Math.round((p.gente.adormecidos / p.gente.total) * 100);
    if (dorm >= 40) out.push(`${dorm}% das contas não aparecem há mais de 30 dias. Vale entender o que aconteceu antes de trazer gente nova.`);
  }

  if (p.contribuicao.contribuintes < p.metas.contribuidores.alvo) {
    out.push(`Faltam ${n(p.metas.contribuidores.alvo - p.contribuicao.contribuintes)} para a meta de ${n(p.metas.contribuidores.alvo)} contribuidores. A tese do projeto vive ou morre aqui.`);
  }

  if (p.catalogo.buscasVazias.length > 0) {
    const top = p.catalogo.buscasVazias[0]!;
    out.push(`O buraco mais pedido do catálogo é "${top.termo}" (${top.quantas === 1 ? "1 busca" : `${top.quantas} buscas`} sem resultado). É o próximo autor a trazer.`);
  }

  if (p.gente.total > 0) {
    const faltam = p.metas.usuarios.alvo - p.gente.total;
    if (faltam > 0) out.push(`Faltam ${n(faltam)} contas para a meta de ${n(p.metas.usuarios.alvo)}.`);
  }

  return out;
}

// ─────────────────────────────────────────────────── O PAINEL EM MARKDOWN

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PAINEL EM MARKDOWN, PARA UM AGENTE LER.
 *
 *  ═══ O E-MAIL NÃO ENTRA AQUI ═══
 *
 *  O log de cadastro na TELA mostra o e-mail (a tela só o dono abre). O
 *  MARKDOWN não: ele é um arquivo, e arquivo viaja. E-mail é dado pessoal, e
 *  dado pessoal não viaja num arquivo. O log em markdown leva só o handle, o
 *  dia, o método e a procedência.
 * ════════════════════════════════════════════════════════════════════
 */
export function painelEmMarkdown(p: Painel, geradoEm: string): string {
  const nf = new Intl.NumberFormat("pt-BR");
  const n = (x: number) => nf.format(x);
  const um = (x: number) => x.toFixed(1).replace(".", ",");
  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "sem base");

  const stickiness = p.gente.ativos30 > 0 ? `${Math.round((p.gente.ativos1 / p.gente.ativos30) * 100)}%` : "sem base";
  const ativacao = pct(p.gente.total - p.uso.contasVazias, p.gente.total);
  const retencao = p.gente.coorteMadura >= 20 ? pct(p.gente.retidos, p.gente.coorteMadura) : `poucos dados (${n(p.gente.retidos)}/${n(p.gente.coorteMadura)})`;

  const L: string[] = [];
  L.push(`# O Gume, por dentro`);
  L.push("");
  L.push(`Gerado em ${geradoEm}. Só o dono vê estes números. Sem e-mail e sem rastreamento de comportamento.`);
  L.push("");

  L.push(`## Metas`);
  L.push(`- Usuários: **${n(p.metas.usuarios.atual)} / ${n(p.metas.usuarios.alvo)}** (${pct(p.metas.usuarios.atual, p.metas.usuarios.alvo)})`);
  L.push(`- Contribuidores: **${n(p.metas.contribuidores.atual)} / ${n(p.metas.contribuidores.alvo)}** (${pct(p.metas.contribuidores.atual, p.metas.contribuidores.alvo)})`);
  L.push("");

  if (p.insights.length) {
    L.push(`## Leitura rápida`);
    for (const i of p.insights) L.push(`- ${i}`);
    L.push("");
  }

  L.push(`## Gente`);
  L.push(`- Contas: **${n(p.gente.total)}**`);
  L.push(`- Novos: ${n(p.gente.novos7)} em 7 dias, ${n(p.gente.novos30)} em 30 dias, ${n(p.gente.novos90)} em 90 dias`);
  L.push(`- Ativos: ${n(p.gente.ativos1)} hoje (DAU), ${n(p.gente.ativos7)} em 7 dias (WAU), ${n(p.gente.ativos30)} em 30 dias (MAU)`);
  L.push(`- Aderência (DAU/MAU): **${stickiness}**`);
  L.push(`- Adormecidos (sem aparecer há 30+ dias): ${n(p.gente.adormecidos)}`);
  L.push(`- Retenção (voltaram depois da 1a semana): **${retencao}**`);
  L.push(`- Método: ${n(p.gente.metodoGoogle)} por google, ${n(p.gente.metodoEmail)} por e-mail`);
  L.push("");

  L.push(`## Uso`);
  L.push(`- Livros por pessoa: mediana **${um(p.uso.medianaLivros)}**, média ${um(p.uso.mediaLivros)}`);
  L.push(`- Lidos por pessoa: mediana **${um(p.uso.medianaLidos)}**, média ${um(p.uso.mediaLidos)}`);
  L.push(`- Ativação: **${ativacao}** (${n(p.uso.contasVazias)} contas vazias)`);
  L.push(`- Resenhas: ${n(p.uso.resenhas)} no total, ${n(p.uso.resenhas30)} nos últimos 30 dias`);
  L.push(`- Notas dadas nos últimos 30 dias: ${n(p.uso.notasDadas30)}`);
  L.push(`- Tamanho das estantes: ${p.uso.tamanhoEstante.map((f) => `${f.rotulo} ${n(f.n)}`).join(", ")}`);
  L.push(`- Notas: ${p.uso.notas.map((f) => `${f.rotulo} ${n(f.n)}`).join(", ")}`);
  L.push("");

  L.push(`## Contribuição`);
  L.push(`- Contribuíram ao menos uma vez: **${pct(p.contribuicao.contribuintes, p.gente.total)}** das contas (${n(p.contribuicao.contribuintes)})`);
  L.push(`- Correções em 30 dias: ${n(p.contribuicao.correcoes30)}, por ${n(p.contribuicao.pessoasQueCorrigiram)} pessoas ao todo`);
  L.push(`- Capas: ${n(p.contribuicao.capasEnviadas)} enviadas, ${n(p.contribuicao.capasEsperando)} esperando`);
  L.push(`- Obras de leitor: ${n(p.contribuicao.obrasDeLeitor)}`);
  L.push(`- Código: ${p.contribuicao.codigo === null ? "sem dado" : n(p.contribuicao.codigo)}`);
  L.push("");

  L.push(`## Convite`);
  L.push(`- Por convite: ${n(p.convite.porConvite)}; sozinhos: ${n(p.convite.sozinhos)}`);
  L.push(`- Já convidaram alguém: ${n(p.convite.quemJaConvidou)} pessoas`);
  L.push(`- Convites que vingaram: ${n(p.convite.convitesQueVingaram)} (média ${um(p.convite.mediaPorConvidante)} por convidante)`);
  L.push("");

  L.push(`## Catálogo`);
  L.push(`- Obras: ${n(p.catalogo.obras)}; edições: ${n(p.catalogo.edicoes)}`);
  L.push(`- Edições sem capa: ${n(p.catalogo.semCapa)}; sem ano: ${n(p.catalogo.semAno)}; sem editora: ${n(p.catalogo.semEditora)}`);
  L.push(`- Obras sem autor: ${n(p.catalogo.semAutor)}`);
  L.push("");

  L.push(`### Procuraram e não acharam`);
  if (p.catalogo.buscasVazias.length === 0) L.push(`Nada por ora.`);
  else for (const b of p.catalogo.buscasVazias) L.push(`- ${b.termo} (${b.quantas === 1 ? "1 vez" : `${b.quantas} vezes`})`);
  L.push("");

  L.push(`### Quem chegou por último`);
  // A coluna de procedência só entra se alguém, alguma vez, chegou por convite. Com
  // zero convites vingados ela diria "chegou sozinho" em toda linha, sempre — uma
  // coluna que nunca varia não é informação. Ver a mesma trava em components/painel.tsx.
  const comProcedencia = p.convite.porConvite > 0;
  L.push(comProcedencia ? `| pessoa | quando | método | procedência |` : `| pessoa | quando | método |`);
  L.push(comProcedencia ? `| --- | --- | --- | --- |` : `| --- | --- | --- |`);
  for (const c of p.gente.log) {
    const metodo = c.metodo === "google" ? "google" : c.metodo === "email" ? "e-mail" : "outro";
    if (comProcedencia) {
      const proc = c.convidadoPor ? `veio por ${c.convidadoPor}` : "chegou sozinho";
      L.push(`| ${c.handle} | ${c.quando} | ${metodo} | ${proc} |`);
    } else {
      L.push(`| ${c.handle} | ${c.quando} | ${metodo} |`);
    }
  }
  L.push("");

  return L.join("\n");
}

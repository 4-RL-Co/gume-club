import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coroaDe, posicaoDe, type Coroa, type Posicao } from "@/lib/honras";
import { ehApoiador } from "@/lib/apoio";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ONDE CADA PESSOA ESTÁ NA ESCADA.
 *
 *  A conta em si mora em lib/honras.ts, que é pura e tem teste (lib/honras.test.ts). Aqui
 *  só se pergunta ao banco **quantas** leituras a pessoa terminou.
 *
 *  ═══ O QUE CONTA, E O QUE NÃO CONTA ═══
 *
 *  Conta: uma obra na estante com status `read`. Livro, HQ ou volume de mangá, tudo na
 *  mesma conta — cada volume é uma leitura, e uma escada só. Uma vez, e não uma por
 *  releitura: reler Dom Casmurro cinco vezes é uma coisa linda e não são cinco livros.
 *
 *  NÃO conta: abandonado, lendo, esperando. E a NOTA não entra: ler e odiar vale o mesmo
 *  que ler e adorar. No momento em que "adorei" valesse mais, o app estaria comprando
 *  elogio, e a resenha honesta — que é o produto inteiro do Gume — começaria a morrer.
 *  Ver a lista de recusas no fim de lib/honras.ts.
 *
 *  ═══ A VISIBILIDADE, E A DECISÃO QUE ELA OBRIGOU ═══
 *
 *  A regra deste repo é dura: **toda leitura de dado de outra pessoa filtra visibility no
 *  SQL.** E aqui ela cria um problema de verdade.
 *
 *  Se a honra contasse só o que o VISITANTE pode ver, a mesma pessoa apareceria como Ouro
 *  para um amigo e Ferro para um estranho — a moldura dela mudaria de cor dependendo de
 *  quem olha. Isso não é privacidade: é um app que não sabe quem você é.
 *
 *  Então a honra conta **tudo o que a pessoa leu**, inclusive o que está privado. O que
 *  ela revela é um NÚMERO agregado, e nunca um título: saber que alguém leu 214 obras não
 *  conta nada sobre QUAIS.
 *
 *  E quem não quer nem isso tem a saída que já existia: um perfil privado não abre para
 *  estranho, e a honra mora dentro do perfil. Ver lib/authz.ts.
 * ════════════════════════════════════════════════════════════════════
 */

export type Escadas = {
  posicao: Posicao;
  /**
   * A moldura que a pessoa usa hoje.
   *
   * Quem apoia escolhe entre a da honra e a de apoiador; quem não apoia usa a da honra.
   */
  coroa: Coroa;
  apoia: boolean;
};

export async function getEscadas(userId: string): Promise<Escadas> {
  const [linha] = await db.execute<{
    lidos: number;
    apoia: boolean;
    moldura: string | null;
  }>(sql`
    select
      -- Uma obra terminada é UMA leitura, mesmo relida cinco vezes. Reler não infla honra.
      count(*) filter (where le.status = 'read')::int as lidos,
      (select ${ehApoiador(sql`u`)} from users u where u.id = ${userId}::uuid) as apoia,
      (select u.moldura      from users u where u.id = ${userId}::uuid) as moldura
    from library_entries le
   where le.user_id = ${userId}::uuid`);

  const posicao = posicaoDe(Number(linha?.lidos ?? 0));
  const apoia = Boolean(linha?.apoia);

  /**
   * A COROA: qual moldura aparece na cara da pessoa. A honra, ou o apoio se a pessoa
   * apoia e escolheu essa moldura.
   *
   * A regra mora em `coroaDe()`, em lib/honras.ts, que é pura e tem teste (lib/honras.test.ts) — e ela estava
   * escrita DUAS VEZES aqui dentro, solta: uma para o perfil e outra para o feed. Uma
   * regra de produto duplicada é uma regra que vai divergir, e aí a mesma pessoa aparece
   * com um anel no perfil e outro no feed.
   */
  return { posicao, apoia, coroa: coroaDe(posicao, { apoia, moldura: linha?.moldura ?? null }) };
}


/**
 * ════════════════════════════════════════════════════════════════════
 *  A COROA DE MUITA GENTE, DE UMA VEZ SÓ.
 *
 *  A moldura aparece no feed, na praça, no explorar e na busca — em qualquer lugar onde
 *  há cara de gente. E `getEscadas()` faz uma consulta por pessoa: num feed de vinte
 *  linhas, isso são vinte consultas.
 *
 *  Esta faz UMA. É o mesmo padrão de `getBadgesOf()`, e pelo mesmo motivo.
 *
 *  ═══ SÓ A COROA, E NÃO A ESCADA INTEIRA ═══
 *
 *  No feed a gente precisa da cor do anel, e de mais nada. A barra de progresso, o
 *  "faltam 3 para Prata" e o número de livros são coisas do PERFIL — porque são coisas
 *  que a pessoa quer saber sobre SI, e não sobre um estranho que passou no feed.
 *
 *  Um feed que mostrasse "faltam 3 livros para o Rui virar Prata" seria um feed cutucando
 *  você a cutucar o Rui. Isso é ansiedade embalada como comunidade.
 * ════════════════════════════════════════════════════════════════════
 */
export async function getCoroasDe(userIds: string[]): Promise<Record<string, Coroa>> {
  return coroas(sql`u.id = any(${sql.param(userIds)}::uuid[])`, "id", userIds.length);
}

/**
 * A mesma coisa, pelo APELIDO.
 *
 * Metade das telas do Gume carrega `handle` e não carrega `id` — o explorar mostra
 * estantes, e uma estante é de "@rui", e não de um uuid. Forçar o id a subir até lá só
 * para desenhar um anel seria mudar cinco tipos por causa de uma moldura.
 */
export async function getCoroasPorHandle(handles: string[]): Promise<Record<string, Coroa>> {
  return coroas(sql`u.handle = any(${sql.param(handles)}::citext[])`, "handle", handles.length);
}

async function coroas(
  quem: ReturnType<typeof sql>,
  chave: "id" | "handle",
  quantos: number,
): Promise<Record<string, Coroa>> {
  if (quantos === 0) return {};

  const linhas = await db.execute<{
    id: string;
    handle: string;
    lidos: number;
    apoia: boolean;
    moldura: string | null;
  }>(sql`
    select u.id,
           u.handle::text as handle,
           ${ehApoiador(sql`u`)} as apoia,
           u.moldura,
           count(le.id) filter (where le.status = 'read')::int as lidos
      from users u
      -- LEFT: quem não leu nada continua tendo coroa (Ferro). Um inner join sumiria
      -- com a pessoa do feed, e a moldura dela viraria um buraco.
      left join library_entries le on le.user_id = u.id
     where ${quem}
     -- Só a chave: agrupado pela primária, o Postgres deixa ler as outras colunas de
     -- users (e o exists de apoio) sem repeti-las aqui.
     group by u.id`);

  const fora: Record<string, Coroa> = {};

  for (const l of linhas) {
    const posicao = posicaoDe(Number(l.lidos ?? 0));
    const k = chave === "id" ? l.id : l.handle;

    // A MESMA regra do perfil, e a mesma função. Ver coroaDe() em lib/honras.ts.
    fora[k] = coroaDe(posicao, { apoia: Boolean(l.apoia), moldura: l.moldura });
  }

  return fora;
}


/**
 * ════════════════════════════════════════════════════════════════════
 *  ESTE LIVRO FEZ A PESSOA SUBIR DE DEGRAU?
 *
 *  Chamado no instante em que alguém marca um livro como lido, DEPOIS de o livro entrar na
 *  estante. Se a honra acabou de mudar, devolve o degrau novo.
 *
 *  ═══ POR QUE "ANTES" É UMA SUBTRAÇÃO, E NÃO UMA CONSULTA ═══
 *
 *  Dava para consultar a honra antes de gravar e de novo depois. Duas consultas, e um
 *  buraco no meio: se duas abas marcarem dois livros ao mesmo tempo, as duas leem o mesmo
 *  "antes", e as duas anunciam a subida. O feed ganha dois "virou Prata".
 *
 *  Aqui o "antes" é o "depois" MENOS UM — e o menos um é este livro, que a gente acabou de
 *  gravar e sabe que existe. Uma consulta, e nenhuma janela para nada acontecer no meio.
 *
 *  ═══ E ELE NUNCA ANUNCIA UMA DESCIDA ═══
 *
 *  Não existe descida. Se alguém tirar um livro da estante, o número cai, e a honra cai
 *  junto — e **nada é escrito no feed**. A honra do passado, gravada na atividade daquele
 *  dia, continua lá: você FOI Prata naquele dia, e isso aconteceu.
 * ════════════════════════════════════════════════════════════════════
 */
export async function degrauNovo(userId: string): Promise<string | null> {
  const [linha] = await db.execute<{ quantas: number }>(sql`
    select count(*)::int as quantas
      from library_entries le
     where le.user_id = ${userId}::uuid
       and le.status = 'read'`);

  if (!linha) return null;

  const depois = posicaoDe(Number(linha.quantas));

  // O "antes" é este mesmo número menos ESTE livro. Ver a nota acima.
  const antes = posicaoDe(Number(linha.quantas) - 1);

  /**
   * Sobe quando muda de DEGRAU **ou** quando ganha uma ESTRELA.
   *
   * "O Rui terminou Dom Casmurro · virou Gume +3" é uma notícia tão boa quanto "virou
   * Prata" — e não anunciar a estrela seria dizer a quem chegou ao topo que ele parou de
   * conquistar coisas.
   */
  if (depois.honra !== antes.honra) return depois.honra;
  if (depois.estrelas > antes.estrelas) return `${depois.honra}+${depois.estrelas}`;

  return null;
}

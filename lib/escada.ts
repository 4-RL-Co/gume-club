import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coroaDe, posicaoDe, type Coroa, type Forma, type Posicao } from "@/lib/honras";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ONDE CADA PESSOA ESTÁ NAS DUAS ESCADAS.
 *
 *  A conta em si mora em lib/honras.ts, que é pura e tem teste (lib/honras.test.ts). Aqui só se pergunta ao
 *  banco **quantas** leituras a pessoa terminou, de cada forma.
 *
 *  ═══ O QUE CONTA, E O QUE NÃO CONTA ═══
 *
 *  Conta: um livro na estante com status `read`. Uma vez, e não uma por releitura —
 *  reler Dom Casmurro cinco vezes é uma coisa linda e não são cinco livros.
 *
 *  NÃO conta: abandonado, lendo, esperando. E a NOTA não entra: ler e odiar vale o
 *  mesmo que ler e adorar. No momento em que "adorei" valesse mais, o app estaria
 *  comprando elogio, e a resenha honesta — que é o produto inteiro do Gume — começaria
 *  a morrer. Ver a lista de recusas no fim de lib/honras.ts.
 *
 *  ═══ A VISIBILIDADE, E A DECISÃO QUE ELA OBRIGOU ═══
 *
 *  A regra deste repo é dura: **toda leitura de dado de outra pessoa filtra visibility
 *  no SQL.** E aqui ela cria um problema de verdade.
 *
 *  Se o elo contasse só o que o VISITANTE pode ver, a mesma pessoa apareceria como
 *  Ouro para um amigo e Ferro para um estranho — a moldura dela mudaria de cor
 *  dependendo de quem olha. Isso não é privacidade: é um app que não sabe quem você é.
 *
 *  Então o elo conta **tudo o que a pessoa leu**, inclusive o que está privado. O que
 *  ele revela é um NÚMERO agregado, e nunca um título: saber que alguém leu 214 livros
 *  não conta nada sobre QUAIS.
 *
 *  E quem não quer nem isso tem a saída que já existia: um perfil privado não abre para
 *  estranho, e o elo mora dentro do perfil. Ver lib/authz.ts.
 * ════════════════════════════════════════════════════════════════════
 */

export type Escadas = {
  livro: Posicao;
  quadrinho: Posicao;
  /**
   * A moldura que a pessoa usa hoje.
   *
   * Quem apoia escolhe entre a do elo e a de apoiador; quem não apoia usa a do elo. É
   * o elo da escada MAIOR — se você leu 300 livros e 12 mangás, a sua cara mostra o que
   * você é de verdade.
   */
  coroa: Coroa;
  apoia: boolean;
};

export async function getEscadas(userId: string): Promise<Escadas> {
  const [linha] = await db.execute<{
    livros: number;
    quadrinhos: number;
    apoia: boolean;
    moldura: string | null;
  }>(sql`
    select
      -- Uma obra terminada é UMA leitura, mesmo relida cinco vezes. Reler não infla elo.
      count(*) filter (where w.forma = 'livro')::int      as livros,
      count(*) filter (where w.forma = 'quadrinho')::int  as quadrinhos,
      (select u.is_supporter from users u where u.id = ${userId}::uuid) as apoia,
      (select u.moldura      from users u where u.id = ${userId}::uuid) as moldura
    from library_entries le
    join works w on w.id = le.work_id
   where le.user_id = ${userId}::uuid
     and le.status = 'read'`);

  const livro = posicaoDe("livro", Number(linha?.livros ?? 0));
  const quadrinho = posicaoDe("quadrinho", Number(linha?.quadrinhos ?? 0));

  const apoia = Boolean(linha?.apoia);

  /**
   * A COROA: qual moldura aparece na cara da pessoa. A HONRA MAIS ALTA, sempre.
   *
   * A regra mora em `coroaDe()`, em lib/honras.ts, que é pura e tem teste (lib/honras.test.ts) — e ela estava
   * escrita DUAS VEZES aqui dentro, solta: uma para o perfil e outra para o feed. Uma
   * regra de produto duplicada é uma regra que vai divergir, e aí a mesma pessoa aparece
   * com um anel no perfil e outro no feed.
   */
  return { livro, quadrinho, apoia, coroa: coroaDe(livro, quadrinho, { apoia, moldura: linha?.moldura ?? null }) };
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
 *  Um feed que mostrasse "faltam 3 livros para o Rui virar Prata" seria um feed
 *  cutucando você a cutucar o Rui. Isso é ansiedade embalada como comunidade.
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
    livros: number;
    quadrinhos: number;
    apoia: boolean;
    moldura: string | null;
  }>(sql`
    select u.id,
           u.handle::text as handle,
           u.is_supporter as apoia,
           u.moldura,
           count(*) filter (where le.status = 'read' and w.forma = 'livro')::int      as livros,
           count(*) filter (where le.status = 'read' and w.forma = 'quadrinho')::int  as quadrinhos
      from users u
      -- LEFT: quem não leu nada continua tendo coroa (Ferro). Um inner join sumiria
      -- com a pessoa do feed, e a moldura dela viraria um buraco.
      left join library_entries le on le.user_id = u.id
      left join works w on w.id = le.work_id
     where ${quem}
     group by u.id, u.handle, u.is_supporter, u.moldura`);

  const fora: Record<string, Coroa> = {};

  for (const l of linhas) {
    const livro = posicaoDe("livro", Number(l.livros ?? 0));
    const quadrinho = posicaoDe("quadrinho", Number(l.quadrinhos ?? 0));

    const k = chave === "id" ? l.id : l.handle;

    // A MESMA regra do perfil, e a mesma função. Ver coroaDe() em lib/honras.ts.
    fora[k] = coroaDe(livro, quadrinho, { apoia: Boolean(l.apoia), moldura: l.moldura });
  }

  return fora;
}


/**
 * ════════════════════════════════════════════════════════════════════
 *  ESTE LIVRO FEZ A PESSOA SUBIR DE DEGRAU?
 *
 *  Chamado no instante em que alguém marca um livro como lido, DEPOIS de o livro entrar
 *  na estante. Se o elo daquela forma acabou de mudar, devolve o degrau novo.
 *
 *  ═══ POR QUE "ANTES" É UMA SUBTRAÇÃO, E NÃO UMA CONSULTA ═══
 *
 *  Dava para consultar o elo antes de gravar e de novo depois. Duas consultas, e um
 *  buraco no meio: se duas abas marcarem dois livros ao mesmo tempo, as duas leem o
 *  mesmo "antes", e as duas anunciam a subida. O feed ganha dois "virou Prata".
 *
 *  Aqui o "antes" é o "depois" MENOS UM — e o menos um é este livro, que a gente acabou
 *  de gravar e sabe que existe. Uma consulta, e nenhuma janela para nada acontecer no
 *  meio.
 *
 *  ═══ E ELE NUNCA ANUNCIA UMA DESCIDA ═══
 *
 *  Não existe descida. Se alguém tirar um livro da estante, o número cai, e o elo cai
 *  junto — e **nada é escrito no feed**. O elo do passado, gravado na atividade daquele
 *  dia, continua lá: você FOI Prata naquele dia, e isso aconteceu.
 * ════════════════════════════════════════════════════════════════════
 */
export async function degrauNovo(userId: string, workId: string): Promise<string | null> {
  const [linha] = await db.execute<{ forma: Forma; quantas: number }>(sql`
    select w.forma,
           (select count(*)::int
              from library_entries le2
              join works w2 on w2.id = le2.work_id
             where le2.user_id = ${userId}::uuid
               and le2.status = 'read'
               and w2.forma = w.forma) as quantas
      from works w
     where w.id = ${workId}::uuid`);

  if (!linha) return null;

  const depois = posicaoDe(linha.forma, Number(linha.quantas));

  // O "antes" é este mesmo número menos ESTE livro. Ver a nota acima.
  const antes = posicaoDe(linha.forma, Number(linha.quantas) - 1);

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

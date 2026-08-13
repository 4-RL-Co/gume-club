import { sql } from "drizzle-orm";
import { ehBibliotecario, CORRECOES_PARA_BIBLIOTECARIO } from "@/lib/librarian";
import { ehApoiador } from "@/lib/apoio";
import {
  CORTE_FUNDADOR, CORRECOES_PARA_ZELADOR, AMIGOS_PARA_ARAUTO, LIVROS_DO_AMIGO,
} from "@/lib/regras";
import { db } from "@/lib/db";
import { getCodigo } from "@/lib/contributors";
import { assertLibrarian, type Viewer } from "@/lib/authz";
import { users } from "@/lib/db/schema";
import { LIMITS, clamp } from "@/lib/limits";
import { INSIGNIAS, ORDEM, type Insignia } from "@/lib/badges-view";

export { INSIGNIAS, ORDEM, type Insignia };

/**
 * Os números moram em `lib/regras.ts`, que é PURO (sem banco dentro) — é o que permite
 * que a TELA leia o mesmo número que a CONSULTA usa. Eles são reexportados daqui porque
 * meia dúzia de arquivos já os importava deste endereço.
 *
 * O motivo de eles terem mudado de casa: o código dizia que membro fundador são as
 * CINQUENTA primeiras pessoas, e a tela dizia "você está entre as CEM primeiras". Um
 * número dito em dois lugares é um número que um dia discorda de si mesmo — e este
 * discordava dentro de uma promessa.
 */
export { CORTE_FUNDADOR, CORRECOES_PARA_ZELADOR } from "@/lib/regras";

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS OITO INSÍGNIAS. Todas binárias, todas sobre DOAÇÃO à comunidade.
 *
 *  ═══ INSÍGNIA É UM FATO. Você é, ou não é. ═══
 *
 *  Não existe "Bibliotecário Sênior", não existe XP, e não existe insígnia
 *  que se compra. Cada uma é um sim ou um não: você tem, ou não tem.
 *
 *  ═══ E ESTE BLOCO JÁ NEGOU DUAS COISAS QUE O APP FAZ ═══
 *
 *  Ele dizia, em maiúsculas: "nada de nível, de tier, de barra de
 *  progresso. ESCADA PRODUZ FARM". Duas coisas mudaram desde então, e a
 *  nota ficou de pé mentindo — que é a pior coisa que um comentário pode
 *  fazer, porque a próxima pessoa constrói em cima dele sem conferir.
 *
 *  1. O ZELADOR VIRA BIBLIOTECÁRIO. São dois degraus do mesmo trabalho
 *     (dez correções, e cinquenta), e a segunda toma o lugar da primeira.
 *     A insígnia continua sendo um fato — mas ela é um fato que EVOLUI.
 *
 *  2. EXISTE BARRA DE PROGRESSO, e ela é só para CONTRIBUIÇÃO.
 *
 *  O medo do farm continua certo, e ele mudou de endereço: o que não pode
 *  virar escada é a LEITURA, e não o mutirão. Consertar o catálogo não é
 *  uma experiência íntima que uma barra corrompe: é trabalho coletivo, e
 *  um mutirão em que ninguém sabe quanto falta é um mutirão que não anda.
 *
 *  A trava real contra o farm nunca foi a ausência de degrau: é a REVERSÃO.
 *  Correção que alguém precisou desfazer não conta. Quem enche o contador
 *  com lixo tem o lixo revertido, e o contador volta.
 *
 *  ═══ O NÚMERO NÃO VIAJA. A INSÍGNIA VIAJA. ═══
 *
 *  Número é placar, e fica preso em /contribuidores. Insígnia é PAPEL:
 *  diz o que a pessoa É, e não quanto ela FEZ. Por isso ela anda junto
 *  com o nome, no perfil e no feed — saber que foi um BIBLIOTECÁRIO que
 *  fez aquela correção é informação útil; saber que ele fez 47 é placar.
 *
 *  ═══ NENHUMA É SOBRE LEITURA. E NÃO EXISTE "RESENHISTA". ═══
 *
 *  A recusa do "Resenhista" é deliberada, e é a mais importante da lista:
 *  resenha é produzida POR leitura, e premiar quem resenha corrompe
 *  justamente a coisa cuja honestidade mais importa neste app. Uma
 *  resenha escrita para ganhar uma insígnia não é uma resenha: é uma
 *  performance, e ela envenena a única coisa que o Gume pede que seja
 *  sincera.
 *
 *  Se alguém propuser "Resenhista", "Leitor Voraz", "Maratonista" ou
 *  parente, FECHE O PR E CITE ESTA LINHA.
 *
 *  ═══ APOIADOR NÃO É INSÍGNIA. ═══
 *
 *  O selo de quem paga não mora aqui, não usa esta paleta e não usa esta
 *  forma. Ele comprou um selo; não doou trabalho. Se os dois se
 *  parecerem, a mensagem que sobra é "dá para comprar mérito", e isso
 *  mata a página de contribuidores inteira. Ver components/badges.tsx.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * As insígnias de uma pessoa. Binárias, e na ORDEM FIXA da lista.
 *
 * Repare no que esta função NÃO devolve: nenhum número. Nem quantas correções, nem
 * quantos commits, nem quantos convites, nem quantas cópias. Se um dia ela
 * devolver, alguém vai pôr o número do lado do nome, e aí virou placar.
 */
/**
 * ═══ O NÚMERO DE CHEGADA DOS FUNDADORES ═══
 *
 * "membro fundador #7". Preenchido por `getBadgesOf`, que já faz a conta.
 *
 * Um Map de módulo, e não uma consulta a mais: quem quer o número já chamou getBadgesOf
 * um instante antes, e uma segunda ida ao banco para o mesmo dado é uma ida a mais.
 *
 * Ele é um FATO sobre um instante que já passou. Não muda, não some, e não ordena
 * ninguém contra ninguém: mede QUANDO a pessoa chegou, e não o que ela fez.
 */
const CHEGADA = new Map<string, number>();

export function chegadaDe(userId: string): number | null {
  return CHEGADA.get(userId) ?? null;
}

export async function getBadges(userId: string): Promise<Insignia[]> {
  const mapa = await getBadgesOf([userId]);
  const minhas = mapa[userId] ?? [];

  // CONSTRUTOR custa uma chamada de rede, então só pergunta para uma pessoa.
  const [row] = await db.execute<{ github: string | null }>(sql`
    select (select a."accountId" from account a
             where a."userId" = u.id and a."providerId" = 'github'
             limit 1) as github
      from users u where u.id = ${userId}::uuid`);

  if (row?.github) {
    /**
     * ═══ UM 403 DO GITHUB NÃO PODE REVOGAR UMA INSÍGNIA ═══
     *
     * `getCodigo()` LEVANTA quando o GitHub recusa (403 por rate limit, 5xx, rede
     * caída), em vez de devolver lista vazia. Sem isso, uma hora de rate limit fazia a
     * insígnia de construtor sumir do perfil de quem escreveu código — e voltar sozinha
     * depois, sem ninguém entender.
     *
     * Aqui o erro é ENGOLIDO de propósito, e a diferença é toda: a insígnia não é
     * concedida nesta renderização, mas também não é NEGADA — ela some da resposta, e
     * volta na próxima. O que não pode acontecer é a página inteira do perfil de alguém
     * morrer porque o GitHub está de mau humor.
     *
     * Ver AGENTS.md: nunca traduza falha de comunicação em ausência de dado.
     */
    try {
      const contribuidores = await getCodigo();
      if (contribuidores.some((c) => String(c.id) === String(row.github))) {
        return ordenar([...minhas, "construtor"]);
      }
    } catch {
      // O GitHub recusou. A insígnia não entra nesta resposta, e nada é revogado.
    }
  }

  return minhas;
}

/**
 * As insígnias de várias pessoas de uma vez. O feed mostra muitos nomes.
 *
 * Não inclui CONSTRUTOR: ela depende de uma chamada ao GitHub, e trinta linhas de
 * feed não podem custar trinta chamadas de rede. Ela aparece no perfil, que é onde
 * a pessoa vai olhar de verdade.
 */
export async function getBadgesOf(userIds: string[]): Promise<Record<string, Insignia[]>> {
  if (userIds.length === 0) return {};

  const rows = await db.execute<{
    id: string;
    bibliotecario: boolean;
    moderador: boolean;
    zelador: boolean;
    arauto: boolean;
    fundador: boolean;
    /** Quem paga a conta do servidor. Ver a nota em lib/badges-view.ts. */
    apoiador: boolean;
    /** A ordem de chegada. 1 a 100 para quem é fundador; nulo para o resto. */
    chegada: number | null;
    idealizador: boolean;
  }>(sql`
    select u.id,

      -- BIBLIOTECÁRIO. A regra mora em lib/librarian.ts, e ela é UMA SÓ: a mesma
      -- que decide se a pessoa pode APROVAR uma capa e DESFAZER o trabalho de
      -- outra. Se a insígnia e o poder tivessem regras separadas, um dia alguém
      -- exibiria a insígnia e a fila responderia "você não pode".
      --
      -- Ele SE GANHA SOZINHO (50 correções sobreviventes, 30 dias de conta, nenhuma
      -- reversão em 90 dias) e também se concede à mão (librarian_tier). Um cargo
      -- que só o dono distribui é um cargo que transforma o dono num porteiro.
      ${ehBibliotecario(sql`u`)} as bibliotecario,

      -- MODERADOR. Um cargo SEPARADO do bibliotecário, e a separação é o ponto.
      -- Bibliotecário mexe em FICHA DE LIVRO e se ganha sozinho cruzando um número.
      -- Moderador mexe em GENTE, e só quem imaginou o Gume concede. Poder sobre livro
      -- se ganha por trabalho; poder sobre pessoa se ganha por confiança, e confiança
      -- não é uma consulta. Ver lib/moderacao.ts.
      (u.moderator_at is not null) as moderador,

      -- ZELADOR: DEZ correções de catálogo que SOBREVIVERAM.
      --
      -- Era UMA, e uma correção qualquer é a coisa mais fácil do mundo: aquilo não
      -- era reconhecimento, era prêmio de participação. Correção que alguém precisou
      -- desfazer não conta, e é isso que torna o farm caro: quem enche o contador
      -- com lixo tem o lixo revertido.
      (
        select count(*) from revisions r
         where r.user_id = u.id and r.reverted_at is null
      ) >= ${CORRECOES_PARA_ZELADOR} as zelador,

      -- ARAUTO: trouxe leitores que FICARAM. E "ficaram" agora custa alguma coisa.
      --
      -- Era UMA pessoa convidada com UM livro na estante: um amigo que abriu o app uma
      -- vez. Isso não é trazer gente para o Gume, e uma insígnia que se ganha sem esforço
      -- não reconhece nada: ela enfeita o perfil de todo mundo, e o que enfeita todo
      -- mundo não distingue ninguém.
      --
      -- Agora são CINCO pessoas, cada uma com DEZ livros. Dez livros é o ponto em que
      -- alguém parou de experimentar e passou a usar. Ver lib/regras.ts.
      --
      -- E continua SEM NÚMERO na tela: é insígnia, e não placar. Não contrabandeie um
      -- contador por aqui, ou a próxima coisa a nascer é a lista de quem convidou mais.
      (
        select count(*) from users c
         where c.invited_by = u.id
           and c.deleted_at is null
           and (
             select count(*) from library_entries le where le.user_id = c.id
           ) >= ${LIVROS_DO_AMIGO}
      ) >= ${AMIGOS_PARA_ARAUTO} as arauto,

      -- MEMBRO FUNDADOR: estava entre os primeiros. O corte é fixo e não se move.
      (
        (select count(*) from users u2
          where u2.created_at < u.created_at and u2.deleted_at is null) < ${CORTE_FUNDADOR}
      ) as fundador,

      /**
       * O APOIADOR. É a única insígnia que não se conquista: ela se paga.
       *
       * E ela é **viva**: sai sozinha no dia em que a pessoa para de apoiar. Não há nada
       * a revogar, nada a limpar, e nenhum bibliotecário decidindo quem ainda merece.
       * Ver ai/DECISIONS.md.
       */
      -- Era um booleano guardado (is_supporter). Virou uma pergunta
      -- respondida na hora (assinatura viva, ou avulso ainda no prazo) porque a coluna
      -- não conseguia cumprir o "ela é viva" que está escrito logo acima: o avulso vence
      -- em 30 dias, e no dia 31 o Stripe não manda evento nenhum, porque não aconteceu
      -- nada. A regra mora em lib/apoio.ts, e é a mesma que a moldura e a lista usam.
      ${ehApoiador(sql`u`)} as apoiador,

      /**
       * O NÚMERO DE CHEGADA. "membro fundador #7".
       *
       * Quantas pessoas chegaram antes dela, mais um. É um FATO sobre um instante que já
       * passou: ele não muda, não some, e não ordena ninguém contra ninguém.
       *
       * Um número numa insígnia é quase sempre placar, e este é a exceção honesta: ele
       * não mede o que a pessoa FEZ, mede QUANDO ela chegou. Ninguém pode fazer mais.
       */
      (select count(*) + 1 from users u2
        where u2.created_at < u.created_at and u2.deleted_at is null)::int as chegada,


      -- IDEALIZADOR. A única concedida, e ela NÃO É DESBLOQUEÁVEL: ninguém pode
      -- "conseguir" ter imaginado uma coisa. Por isso ela não precisa ser automática,
      -- e é a única exceção honesta à regra de que tudo aqui se ganha sozinho.
      --
      -- E o banco garante que só existe uma no mundo: índice único parcial, migration
      -- 0024. Não é uma promessa do código.
      exists (
        select 1 from badge_grants g
         where g.user_id = u.id and g.badge = 'idealizador' and g.revoked_at is null
      ) as idealizador

      from users u
     where u.id = any(${sql.param(userIds)}::uuid[])
       and u.deleted_at is null`);

  const out: Record<string, Insignia[]> = {};

  for (const r of rows) {
    const minhas: Insignia[] = [];

    /**
     * ════════════════════════════════════════════════════════════════════
     *  ZELADOR E BIBLIOTECÁRIO SÃO A MESMA INSÍGNIA, EM DOIS DEGRAUS.
     *
     *  Elas nasceram separadas, e no perfil apareciam as duas ao mesmo tempo — duas
     *  insígnias, lado a lado, dizendo a MESMA COISA: "esta pessoa conserta o catálogo".
     *  A única diferença entre elas é quantas correções (dez, e cinquenta).
     *
     *  Duas insígnias para um trabalho só não reconhecem o dobro: elas dividem o
     *  reconhecimento no meio, e enchem o perfil. O perfil de quem mais trabalha era o
     *  mais poluído — o oposto do que a insígnia existe para fazer.
     *
     *  Agora é UMA, e ela EVOLUI: zelador aos dez, bibliotecário aos cinquenta. Quem
     *  chega a bibliotecário não "ganha mais uma": ele sobe. Ver lib/regras.ts.
     *
     *  E não é só cosmético: o PODER continua vindo de `ehBibliotecario()`, no servidor.
     *  Esconder ou mostrar uma insígnia nunca deu poder a ninguém, e nunca tirou.
     * ════════════════════════════════════════════════════════════════════
     */
    if (r.bibliotecario) minhas.push("bibliotecario");
    else if (r.zelador) minhas.push("zelador");

    if (r.moderador) minhas.push("moderador");
    if (r.idealizador) minhas.push("idealizador");
    if (r.arauto) minhas.push("arauto");
    if (r.fundador) minhas.push("fundador");
    if (r.apoiador) minhas.push("apoiador");
    out[r.id] = ordenar(minhas);
    if (r.fundador && r.chegada !== null) CHEGADA.set(r.id, Number(r.chegada));
  }

  return out;
}

/**
 * A ORDEM É SEMPRE A MESMA, e é a da lista.
 *
 * Nunca por "raridade", nunca por data, nunca por quantas a pessoa tem. Ordem fixa
 * é o que impede o olho de ler hierarquia onde não existe nenhuma: se a ordem
 * mudasse por raridade, a primeira posição viraria um prêmio.
 */
function ordenar(minhas: Insignia[]): Insignia[] {
  const set = new Set(minhas);
  return ORDEM.filter((i) => set.has(i));
}

// ────────────────────────────────────────────────── conceder e retirar

/**
 * Conceder CAÇADOR ou TRADUTOR. Só bibliotecário, e a concessão tem nome e motivo.
 *
 * É append-only, como toda revisão deste projeto: conceder é um ato público, e
 * retirar também. Retirar não apaga a linha: marca.
 */
export async function conceder(
  viewer: Viewer,
  userId: string,
  badge: "idealizador",
  motivo: string,
): Promise<void> {
  const [eu] = viewer
    ? await db.select({ tier: users.librarianTier }).from(users).where(sql`${users.id} = ${viewer.id}::uuid`)
    : [];
  assertLibrarian(viewer, eu?.tier ?? 0);

  await db.execute(sql`
    insert into badge_grants (user_id, badge, granted_by, reason)
    values (${userId}::uuid, ${badge}, ${viewer.id}::uuid, ${clamp(motivo, LIMITS.note)})
    on conflict do nothing`);
}

export async function retirar(viewer: Viewer, userId: string, badge: string): Promise<void> {
  const [eu] = viewer
    ? await db.select({ tier: users.librarianTier }).from(users).where(sql`${users.id} = ${viewer.id}::uuid`)
    : [];
  assertLibrarian(viewer, eu?.tier ?? 0);

  await db.execute(sql`
    update badge_grants
       set revoked_at = now(), revoked_by = ${viewer.id}::uuid
     where user_id = ${userId}::uuid and badge = ${badge} and revoked_at is null`);
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A BARRA DE PROGRESSO. Ela existe, e só para CONTRIBUIÇÃO.
 *
 *  ═══ ISTO REVERTE UMA REGRA, E A REVERSÃO TEM DONO E TEM MOTIVO ═══
 *
 *  Estava escrito, em maiúsculas, em dois documentos: "nada de nível, de
 *  tier, de 'faltam 12 correções'. ESCADA PRODUZ FARM."
 *
 *  A distinção que virou a decisão é do dono, e ela é boa: o que este
 *  app existe para NÃO fazer é transformar leitura em COBRANÇA.
 *
 *  ═══ E ESTA FRASE DIZIA MAIS DO QUE PODIA ═══
 *
 *  Ela terminava assim: "uma barra enchendo ao lado de 'livros lidos'
 *  transforma leitura em meta. Isso continua proibido, para sempre, e há
 *  teste."
 *
 *  Não continua, e não há. As HONRAS existem, e elas são exatamente isso:
 *  uma escada por livro lido, com uma barra que diz quanto falta para o
 *  próximo degrau. A frase foi escrita antes delas e ficou de pé mentindo
 *  — prometendo uma trava que não existe, num arquivo onde a próxima
 *  pessoa (ou a próxima IA) ia acreditar sem conferir.
 *
 *  ═══ O QUE DE VERDADE CONTINUA PROIBIDO, E TEM TESTE ═══
 *
 *  Não é a barra. É o que faria dela uma cobrança, e são quatro coisas,
 *  travadas em lib/honras.regras.test.ts:
 *
 *      o RELÓGIO   sem ofensiva, sem meta do ano, sem temporada
 *      o PLACAR    nenhuma lista ordena gente por quanto leu
 *      a NOTA      ler e odiar conta igual a ler e adorar
 *      o CASTIGO   abandonar um livro não tira nada de ninguém
 *
 *  Uma barra que sobe e nunca desce, sem prazo e sem ninguém para
 *  comparar, não cobra nada de ninguém: ela só mostra uma vida de leitor
 *  tomando forma. É o relógio e o placar que transformam leitura em meta,
 *  e não a barra.
 *
 *  CONTRIBUIÇÃO é outra coisa. Consertar o catálogo não é uma experiência
 *  íntima que uma barra corrompe: é um mutirão. Saber que faltam três
 *  correções para virar zelador não estraga nada, e faz o mutirão andar.
 *
 *  ═══ E O FARM? ═══
 *
 *  Ele continua caro, e não é a barra que o segura: é a MÉTRICA. Só conta
 *  o que SOBREVIVEU. Quem enche o contador com correção lixo tem o lixo
 *  revertido, e a barra ANDA PARA TRÁS. Uma escada cujo degrau desaba
 *  quando você pisa errado não é uma escada que se sobe correndo.
 *
 *  ═══ A LINHA QUE NÃO SE CRUZA ═══
 *
 *  Barra de progresso para CONTRIBUIÇÃO: pode.
 *  Barra de progresso para LEITURA: nunca. Nem para livro lido, nem para
 *  página, nem para meta do ano, nem para ofensiva. Ver ai/DECISIONS.md.
 * ════════════════════════════════════════════════════════════════════
 */
export type Progresso = {
  /** Correções que sobreviveram. Revertida não conta, e a barra anda para trás. */
  correcoes: number;
};

export async function getProgresso(userId: string): Promise<Progresso> {
  const [r] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n
      from revisions
     where user_id = ${userId}::uuid and reverted_at is null`);

  return { correcoes: r?.n ?? 0 };
}

/**
 * Quantas correções cada insígnia pede. `null` = não é uma escada: é um FATO que
 * acontece (você escreveu código, alguém entrou por sua causa, você chegou cedo).
 *
 * Um fato não tem barra, e desenhar uma barra para ele seria mentir sobre como ele
 * funciona: não existe "68% de ter tido a ideia do Gume".
 */
export const META: Record<string, number | null> = {
  zelador: CORRECOES_PARA_ZELADOR,
  bibliotecario: CORRECOES_PARA_BIBLIOTECARIO,
  // Confiança não tem barra: não existe "68% de ser confiável".
  moderador: null,
  construtor: null,
  arauto: null,
  fundador: null,
  // Não tem meta: não existe "68% de apoiar". Ou você apoia, ou não.
  apoiador: null,
  idealizador: null,
};

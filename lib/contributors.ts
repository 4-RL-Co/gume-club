import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { REPO } from "@/lib/onde";

/**
 * O GitHub recusou. Isso NÃO é "ninguém contribuiu".
 *
 * Ele limita a 60 chamadas por hora sem token, e responde 403. Engolir isso esvaziava a
 * página de contribuidores E revogava a insígnia de construtor de todo mundo, porque ela
 * é calculada a partir desta lista. Ver AGENTS.md: nunca traduza falha de comunicação em
 * ausência de dado.
 */
export class GitHubRecusou extends Error {}

/**
 * ════════════════════════════════════════════════════════════════════
 *  CONTRIBUIDORES. Duas listas, o mesmo peso.
 *
 *  Quem escreve o código, e quem cuida do catálogo. Sem hierarquia entre
 *  elas: quem conserta uma capa vale o que vale quem faz um commit.
 *
 *  ═══ COM NÚMERO, E ISSO NÃO FERE O MANIFESTO ═══
 *
 *  Não existe número comparável entre pessoas SOBRE LEITURA. Ler não é
 *  competição. Manutenção do bem comum não é leitura: contar capas
 *  consertadas não mede o gosto de ninguém, não compara leitor com
 *  leitor, e não muda como ninguém lê. Mede TRABALHO DOADO. É o que a
 *  Wikipédia e o OpenStreetMap contam, e é por isso que eles existem.
 *  A fronteira não se move: número de conserto, sim. Número de leitura,
 *  nunca.
 *
 *  ═══ AS TRÊS REGRAS QUE IMPEDEM O NÚMERO DE APODRECER ═══
 *
 *  1. Conta só o que SOBREVIVEU (correção não revertida). Contar edição
 *     FEITA produz edição LIXO: a pessoa enche o contador com correção
 *     trivial ou errada. É problema documentado na Wikipédia.
 *
 *  2. NÃO ordena do maior para o menor. Ordena por quem chegou primeiro.
 *     O número é um REGISTRO, não um placar.
 *
 *  3. O número vive só aqui. Nunca no perfil, nunca no feed. O número
 *     não viaja; a insígnia viaja, porque insígnia é papel.
 * ════════════════════════════════════════════════════════════════════
 */

export type DoCatalogo = {
  handle: string;
  name: string | null;
  image: string | null;
  librarian: boolean;
  /** Correções que sobreviveram. Nunca ordena a lista. */
  correcoes: number;
  desde: Date;
};

export type DoCodigo = {
  /** O id numérico do GitHub. É por ele que a insígnia de CÓDIGO é verificada. */
  id: number;
  login: string;
  avatar: string;
  url: string;
  commits: number;
};

/**
 * Quem cuida do catálogo.
 *
 * Só o que sobreviveu: `reverted_at is null`. Uma correção que um bibliotecário
 * precisou desfazer não é trabalho doado, é trabalho a mais para outra pessoa.
 *
 * ═══ A ORDEM É POR QUEM FEZ MAIS. Isto é uma REVERSÃO, e ela é consciente. ═══
 *
 * Até 2026-07-12 esta lista vinha por ordem de CHEGADA, e o motivo escrito era:
 * "ordenar pelo número transforma a página num placar, e no dia em que virar
 * placar, alguém começa a farmar correção trivial para subir nele."
 *
 * O medo continua verdadeiro, e o custo está aceito de olhos abertos: contar só o
 * que SOBREVIVEU (abaixo) impede a correção ERRADA, e não impede a correção
 * TRIVIAL. Com a lista ordenada, a jogada ótima passa a ser fazer quinhentas
 * correções minúsculas e certas.
 *
 * O que fez a decisão virar: ordem de chegada NÃO É NEUTRA, é só outra ordem — e
 * com cem pessoas ela ENTERRA quem mais cuidou do catálogo. Este projeto promete
 * que quem conserta uma capa vale o que vale quem faz um commit, e reconhecimento
 * que ninguém consegue VER não é reconhecimento: é uma frase bonita.
 *
 * O que NÃO entrou junto, e continua proibido: posição ordinal (#1, #2), pódio,
 * medalha, ouro/prata/bronze, e o número em qualquer lugar fora desta página. A
 * lista é ORDENADA, e não premiada. Ver ai/DECISIONS.md.
 *
 * O desempate é a chegada: entre duas pessoas com o mesmo número, quem chegou
 * primeiro vem primeiro. O valor antigo não foi jogado fora, virou o critério de
 * desempate.
 */
export async function getCatalogo(): Promise<DoCatalogo[]> {
  const rows = await db.execute<{
    handle: string; name: string | null; image: string | null;
    librarian_tier: number; correcoes: number; desde: Date;
  }>(sql`
    select u.handle, u.display_name as name, u.image, u.librarian_tier,
           count(r.id)::int as correcoes,
           u.created_at as desde
      from revisions r
      join users u on u.id = r.user_id
     where r.reverted_at is null
       and u.deleted_at is null
     group by u.id
     order by count(r.id) desc, u.created_at asc`);

  return rows.map((r) => ({
    handle: r.handle,
    name: r.name,
    image: r.image,
    librarian: (r.librarian_tier ?? 0) > 0,
    correcoes: r.correcoes,
    desde: r.desde,
  }));
}

/**
 * Quem escreve o código, direto do GitHub.
 *
 * Cacheada por uma hora: a página não pode depender de um serviço de fora estar
 * de pé, e ninguém precisa da contagem de commits atualizada ao segundo. Se o
 * GitHub cair, a lista some, e a página continua dizendo a verdade sobre a outra
 * metade em vez de mostrar um erro.
 */
export async function getCodigo(): Promise<DoCodigo[]> {
  // O slug vem de lib/onde.ts, e não hardcoded aqui: um rename do repositório não pode
  // esvaziar esta lista em silêncio. Ver o comentário do REPO lá.
  const repo = REPO;

  try {
    /**
     * ═══ O TOKEN, E POR QUE ELE DEIXOU DE SER OPCIONAL NA PRÁTICA ═══
     *
     * Sem token, o GitHub dá 60 chamadas por hora POR IP. Na máquina de quem desenvolve
     * isso é infinito; em produção, o IP de saída é COMPARTILHADO com todo mundo que
     * hospeda no mesmo lugar — e sessenta chamadas por hora se esgotam com os vizinhos,
     * sem ninguém aqui ter chamado nada.
     *
     * Resultado: a página de quem faz o Gume dizia "não deu para consultar" para o
     * próprio dono do projeto. Ela estava CERTA (é honesta em vez de dizer que ninguém
     * contribuiu), e ainda assim inútil.
     *
     * Com token são 5.000 por hora, e ele não precisa de escopo nenhum: a lista de
     * contribuidores de um repositório público já é pública. O token aqui não dá acesso
     * a nada — ele só diz quem está perguntando.
     *
     * Sem token, continua funcionando, e continua dizendo a verdade quando não der.
     */
    const token = process.env.GITHUB_TOKEN;

    const res = await fetch(`https://api.github.com/repos/${repo}/contributors?per_page=100`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Gume (gume.club)",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 3600 },
    });

    /**
     * ═══ 403 DO GITHUB NÃO É "NINGUÉM CONTRIBUIU" ═══
     *
     * Isto era `if (!res.ok) return []`, e a consequência era silenciosa e grave: o
     * GitHub limita a 60 chamadas por hora sem token, e responde **403**. Ao engolir
     * isso, a página de contribuidores ficava vazia — e, pior, a insígnia de CONSTRUTOR
     * sumia de todo mundo, porque ela é calculada a partir desta lista.
     *
     * Uma insígnia revogada por um rate limit é uma insígnia que ninguém entende ter
     * perdido.
     *
     * É o bug mais caro do projeto, de novo: confundir "não achei" com "não consegui
     * perguntar". Ver AGENTS.md.
     */
    if (res.status === 403 || res.status === 429 || res.status >= 500) {
      throw new GitHubRecusou(
        `o GitHub recusou (${res.status}). Isso NÃO quer dizer que ninguém contribuiu.`,
      );
    }

    if (!res.ok) return [];

    const json = (await res.json()) as {
      id: number; login: string; avatar_url: string; html_url: string;
      contributions: number; type: string;
    }[];

    /**
     * ═══ ROBÔ NÃO É CONTRIBUIDOR ═══
     *
     * O `type === "User"` já barra os bots declarados do GitHub, mas as contas de
     * serviço (o deploy da Railway, o agente da Anthropic) às vezes chegam com cara
     * de usuário — e aí o painel dizia que "3 escreveram código" quando era um humano
     * e dois robôs. Contribuidor é GENTE: máquina que empurra commit é ferramenta de
     * alguém, e a ferramenta não ganha crédito nem conta em meta.
     */
    // A lista cresce quando um serviço novo aparece no repo com cara de gente
    // (o GitGuardian foi o de 2026-07-23). O teste em lib/contributors.sql.test.ts
    // prova que cada um destes cai, e que um humano de nome parecido não cai.
    const ROBOS =
      /\[bot\]$|^(claude|railway|github-actions|dependabot|renovate|gitguardian|snyk|codecov|sonarcloud|vercel|netlify|imgbot|allcontributors|copilot|anthropic)([-_].*)?$/i;

    return json
      .filter((c) => c.type === "User" && !ROBOS.test(c.login))
      .map((c) => ({
        id: c.id,
        login: c.login,
        avatar: c.avatar_url,
        url: c.html_url,
        commits: c.contributions,
      }));
  } catch (e) {
    // O `throw` acima passa reto: quem chama PRECISA saber a diferença entre "ninguém
    // contribuiu" e "não consegui perguntar". Um catch cego aqui desfaria o conserto.
    if (e instanceof GitHubRecusou) throw e;

    // Rede caída, DNS, timeout. Também não é ausência — e também levanta.
    throw new GitHubRecusou("não deu para falar com o GitHub agora.");
  }
}


/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM PAGA A CONTA. E por que ela está nesta página.
 *
 *  ═══ ESTA PÁGINA JÁ SE RECUSOU A MOSTRAR ISTO ═══
 *
 *  Havia uma regra escrita, e um teste: *"pagar não põe ninguém na lista de quem
 *  trabalhou"*. O medo era este, e ele continua certo:
 *
 *      "Quem apoia COMPROU; quem contribui DOOU trabalho. Se os dois se parecerem, a
 *       mensagem que sobra é 'dá para comprar mérito', e a partir daí ninguém mais sabe,
 *       olhando, quem trabalhou e quem pagou."
 *
 *  ═══ O QUE MUDOU ═══
 *
 *  **Apoiar financeiramente é importante, e esconder isso não honra ninguém.** Sem quem
 *  paga a conta, o servidor cai e as outras duas listas param de existir.
 *
 *  O medo era de CONFUSÃO, e não de reconhecimento. Então o reconhecimento acontece, e a
 *  confusão continua impossível:
 *
 *    · **é uma seção SEPARADA**, com um título que diz o que é. Ninguém vai olhar para
 *      ela achando que aquela gente escreveu código.
 *    · **não tem número.** Não existe "quem apoiou mais", não existe valor, não existe
 *      ordem por dinheiro. Uma lista de apoiadores ordenada por quanto cada um paga é
 *      exatamente a coisa que a regra antiga temia — e ela não vai existir.
 *    · **a ordem é de chegada.** Quem apoiou primeiro aparece primeiro, e isso é um fato
 *      sobre o tempo, e não sobre o bolso.
 *
 *  As outras duas listas continuam ordenadas por TRABALHO, e o dinheiro não entra nelas.
 * ════════════════════════════════════════════════════════════════════
 */
export type Apoiador = {
  handle: string;
  name: string | null;
  image: string | null;
};

export async function getApoiadores(): Promise<Apoiador[]> {
  const linhas = await db.execute<Apoiador>(sql`
    select u.handle::text as handle,
           u.display_name as name,
           u.image
      from users u
     where u.is_supporter = true
       and u.deleted_at is null
     -- POR ORDEM DE CHEGADA. Nunca por valor, nunca por tempo de apoio, nunca por nada
     -- que possa ser lido como "este apoia mais". Não existe apoiar mais.
     order by u.created_at asc
     limit 200`);

  return linhas;
}

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * ════════════════════════════════════════════════════════════════════
 *  RATE LIMIT. Um balde por chave, NO BANCO.
 *
 *  Sem isto, o login é um oráculo de força bruta de graça, a busca é uma negação de
 *  serviço de graça (cada tecla vira um trigrama sobre 414 mil edições), e qualquer
 *  escrita é um formulário de spam.
 *
 *  ═══ ELE MOROU NA MEMÓRIA, E ISSO IA VIRAR UM BURACO NO DEPLOY ═══
 *
 *  Era um `Map` no processo. Estava CERTO para um servidor só: um processo, um balde,
 *  uma contagem. E o comentário antigo dizia, com todas as letras, que com duas
 *  instâncias "o limite efetivo dobra".
 *
 *  Ele subestimava, e o erro não depende de onde o app roda: basta existir mais de uma
 *  instância. Um script que tenta mil senhas se espalha pelas réplicas; cada uma conta o
 *  seu punhado, nenhuma passa do teto de dez, e **centenas de tentativas de senha
 *  passam**. O limite não afrouxa: ele para de existir, e continua PARECENDO que existe.
 *
 *  Hoje o Gume roda em container, com uma réplica. É exatamente o cenário em que o `Map`
 *  ainda funcionaria, e é por isso que ele é perigoso: ele volta a mentir no dia em que
 *  alguém subir a segunda réplica, e esse dia não vem com aviso.
 *
 *  ═══ POR QUE O BANCO, E ONDE ELE PASSOU A SER CHAMADO ═══
 *
 *  O Postgres já está aqui, já é a fonte da verdade, e já é compartilhado por todas as
 *  instâncias. Um Redis resolveria o mesmo e cobraria um serviço novo, uma conta nova e
 *  um segredo novo — por uma tabela de três colunas.
 *
 *  E o limite MUDOU DE LUGAR, não só de caixa: ele era chamado no `middleware.ts`, e o
 *  middleware do Next roda no runtime Edge, que **não fala com o Postgres**. Então quem
 *  chama agora é quem roda em Node e é dono do risco:
 *
 *      /api/auth/*      força bruta de senha, fazenda de cadastro, enxurrada de código
 *      /api/buscar      a busca cara, que qualquer um pode disparar
 *      mandarCodigo     o e-mail de entrada, por PESSOA e não só por IP
 *
 *  ═══ A CONTA É ATÔMICA, E ISSO NÃO É DETALHE ═══
 *
 *  Ler, somar um e gravar em três comandos separados é uma corrida: duas instâncias leem
 *  "9", as duas escrevem "10", e passaram onze. Num limite de força bruta isso é a
 *  diferença entre limitar e fingir que limita.
 *
 *  É um comando só. O Postgres tranca a linha no `on conflict`, e a soma acontece dentro
 *  da tranca.
 * ════════════════════════════════════════════════════════════════════
 */

/** Os tetos. Generosos para gente, apertados para script. */
export const RATES = {
  /** Login. Força bruta morre aqui. */
  auth: { limit: 10, windowMs: 5 * 60_000 },
  /**
   * CRIAR CONTA. Muito mais apertado que entrar, e por outro motivo.
   *
   * Entrar errado dez vezes é uma pessoa que esqueceu a senha. CRIAR CONTA dez vezes
   * do mesmo IP em cinco minutos não é ninguém: é um script montando uma fazenda de
   * spam, e é o que SEMPRE acontece quando o cadastro abre.
   *
   * Três por hora é generoso para uma casa inteira compartilhando um IP, e é ridículo
   * para um script. Quem tropeçar nisso pede de novo daqui a pouco, e não perde nada.
   */
  signup: { limit: 3, windowMs: 60 * 60_000 },
  /**
   * ════════════════════════════════════════════════════════════════════
   *  BUSCA. Sessenta por minuto era um PEDÁGIO CONTRA GENTE.
   *
   *  ═══ O QUE ACONTECEU ═══
   *
   *  Um leitor testando o app pela primeira vez levou 429 no primeiro minuto — e o cliente
   *  desenhava o 429 como "nenhum resultado". Ele buscou três livros, viu silêncio, e
   *  concluiu que a busca estava quebrada. Foi o momento em que ele fecharia a aba.
   *
   *  ═══ A CONTA QUE EU NÃO TINHA FEITO ═══
   *
   *  A busca é POR TECLA. Digitar "vagabond" devagar dispara uma requisição a cada pausa de
   *  220 ms — e cada uma delas dispara uma SEGUNDA quando o catálogo devolve pouco (a que
   *  sai para a internet).
   *
   *  Uma palavra custa de seis a dez requisições. Sessenta por minuto é **seis palavras**.
   *  Ninguém explora um app de livros digitando seis palavras por minuto.
   *
   *  Um limite que a pessoa de verdade esbarra antes do script não é um limite: é um
   *  pedágio. Ele castiga exatamente quem está conhecendo o app, e é invisível para quem
   *  roda um laço com sleep.
   *
   *  ═══ TREZENTOS ═══
   *
   *  É inalcançável digitando (seriam trinta palavras por minuto, sem parar, por um minuto
   *  inteiro), e continua sendo ridículo para um script — que faria trinta mil.
   *
   *  A rota continua sendo a mais cara do app, e o teto continua existindo. Ele só parou de
   *  mirar na pessoa errada.
   * ════════════════════════════════════════════════════════════════════
   */
  search: { limit: 300, windowMs: 60_000 },
  /** Toda escrita: prateleirar, dar nota, resenhar, recomendar. */
  write: { limit: 120, windowMs: 60_000 },
  /**
   * UPLOAD DE IMAGEM. Mais apertado que a escrita comum, e por dinheiro: cada
   * upload em produção é uma escrita PAGA no blob, de até 4 MB. Vinte por minuto
   * é folgado para gente (ninguém troca de avatar duas vezes por segundo) e é
   * teto para o laço que transformaria a conta de hospedagem num incêndio. Era a
   * única escrita do app fora do balde; auditoria de 2026-07-22.
   */
  upload: { limit: 20, windowMs: 60_000 },
} as const;

export type Regra = { limit: number; windowMs: number };
export type Verdict = { ok: true } | { ok: false; retryAfter: number };

/**
 * Conta uma tentativa, e diz se ela passa.
 *
 * O comando é um só, e faz as três coisas de uma vez:
 *
 *   - a chave não existe        → cria o balde com 1
 *   - o balde existe e VENCEU   → recomeça do 1, com uma janela nova
 *   - o balde existe e está vivo→ soma 1, e mantém a janela (a janela NÃO reinicia a
 *                                 cada tentativa: se reiniciasse, um script batendo sem
 *                                 parar empurraria o fim para sempre e nunca destravaria
 *                                 ninguém, nem ele mesmo)
 *
 * Devolve o estado DEPOIS da soma, que é o único que importa.
 */
export async function limitar(key: string, regra: Regra): Promise<Verdict> {
  const janela = `${Math.round(regra.windowMs / 1000)} seconds`;

  const linhas = await db.execute<{ hits: number; resta: number }>(sql`
    insert into rate_limits (key, hits, reset_at)
    values (${key}, 1, now() + ${janela}::interval)
    on conflict (key) do update
       set hits = case
                    when rate_limits.reset_at <= now() then 1
                    else rate_limits.hits + 1
                  end,
           reset_at = case
                    when rate_limits.reset_at <= now() then now() + ${janela}::interval
                    else rate_limits.reset_at
                  end
    returning hits, ceil(extract(epoch from (reset_at - now())))::int as resta`);

  const linha = linhas[0];

  /**
   * O BANCO CAIU, E A PORTA NÃO FICA ABERTA NEM TRANCADA POR ACIDENTE.
   *
   * Se a consulta não devolveu nada, alguma coisa está muito errada. Deixar passar seria
   * abrir a força bruta justo na hora em que o app está mal. Recusar tudo seria derrubar
   * o login inteiro por causa do limitador.
   *
   * A escolha é RECUSAR, e é deliberada: uma porta trancada é um problema que a pessoa
   * percebe e reclama. Uma porta aberta é um problema que só o atacante percebe.
   */
  if (!linha) return { ok: false, retryAfter: 60 };

  if (linha.hits > regra.limit) {
    return { ok: false, retryAfter: Math.max(1, linha.resta) };
  }

  return { ok: true };
}

/**
 * Apaga o que já venceu.
 *
 * Sem isto, um atacante com mil IPs deixa mil linhas mortas para trás: ele não passa de
 * limite nenhum, e enche a tabela devagar, para sempre.
 *
 * Roda por sorteio, uma vez a cada duzentas chamadas, e não por um contador de módulo: um
 * contador vive na memória de UM processo, e não atravessa réplica nem reinício. Um dado
 * de duzentas faces funciona igual em qualquer instância, sem nada guardado.
 *
 * E ela nunca derruba a chamada de quem pediu: uma faxina que falha é uma faxina, e não
 * um login negado.
 */
export async function varrer(): Promise<void> {
  if (Math.random() > 1 / 200) return;

  try {
    await db.execute(sql`delete from rate_limits where reset_at < now() - interval '1 hour'`);
  } catch {
    // Nada. Faxina não é caminho crítico.
  }
}

/**
 * Quem está batendo na porta.
 *
 * `x-real-ip` PRIMEIRO, e de propósito: é o cabeçalho que o proxy da frente escreve
 * com o IP que ELE viu na borda, e que o cliente não consegue forjar. O
 * `x-forwarded-for` é uma lista que proxies vão ACRESCENTANDO — se a borda
 * acrescenta em vez de substituir, o primeiro item é o que o atacante mandou, e
 * cada requisição com um valor novo cairia num balde novo: o limite de força bruta
 * pareceria limitar e não limitaria. Auditoria de 2026-07-22.
 *
 * ═══ E ISTO DEPENDE DE QUEM ESTÁ NA FRENTE ═══
 *
 * Quem hospedar atrás de um proxy que NÃO põe `x-real-ip` cai no primeiro
 * `x-forwarded-for`, que é o melhor que aquele ambiente oferece, e é mais fraco.
 * Não é uma escolha nossa: é o que sobra.
 *
 * **Confira no seu ambiente antes de abrir ao público.** Se o proxy da frente não
 * escrever `x-real-ip`, o limite de força bruta fica mais frouxo do que este
 * arquivo faz parecer, e ninguém vai notar pela tela.
 */
export function quem(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const encaminhado = req.headers.get("x-forwarded-for");
  return encaminhado?.split(",")[0]?.trim() || "sem-ip";
}

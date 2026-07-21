/**
 * ════════════════════════════════════════════════════════════════════
 *  AS DATAS DE UMA LEITURA. Elas são do LEITOR, e não do relógio do servidor.
 *
 *  O app gravava `new Date()` como o dia em que a pessoa terminou o livro.
 *  Sempre hoje. Não havia como corrigir, e não havia como dizer outra coisa.
 *
 *  Isso não é um detalhe de formulário: é o Gume não saber QUANDO ninguém leu
 *  nada. A página de estatísticas e a retrospectiva do ano são construídas
 *  inteiras em cima dessas três datas, e elas estavam todas mentindo.
 *
 *  Pior: a mentira era SILENCIOSA. Ninguém abre um chamado dizendo "a data do
 *  meu livro está errada", porque ninguém olha. O erro só aparece em dezembro,
 *  quando a retrospectiva diz que você leu quarenta livros em novembro.
 *
 *  ═══ POR QUE ISTO É PRÉ-REQUISITO DO IMPORTADOR ═══
 *
 *  A promessa do README é "sem perdas: datas de leitura, notas, texto de
 *  resenha, prateleiras". Se `finished_on` não aceita uma data arbitrária, o
 *  arquivo do Goodreads entra sem data nenhuma — dez anos de leitura viram dez
 *  anos de "hoje". O importador NASCERIA quebrado. Não dá para fazer um antes
 *  do outro.
 *
 *  ═══ `date`, E NUNCA `timestamptz` ═══
 *
 *  Já está no ai/DECISIONS.md, e o motivo continua valendo: quem terminou um
 *  livro às 22h de 31 de dezembro em Brasília terminou em 31 de dezembro. Um
 *  `timestamptz` guarda isso como 1º de janeiro em UTC, e a retrospectiva joga
 *  o livro para o ano seguinte. "Que dia você terminou" é uma pergunta de
 *  calendário, e não de relógio.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * A data mais antiga que aceitamos.
 *
 * Não é "o nascimento da pessoa" — a gente não sabe quando ela nasceu, e não vai
 * perguntar. É um piso contra o dedo escorregado: quem digita 1019 em vez de 2019
 * quase sempre errou, e quem leu de verdade em 1899 tem outros problemas.
 *
 * Frouxo de propósito. Um piso apertado demais recusaria a leitura legítima de alguém
 * que registra a estante do avô, e recusar o dado de alguém é pior que aceitar um dado
 * estranho.
 */
export const PRIMEIRO_ANO = 1900;

/**
 * O FUSO do Gume. Um leitor terminou o livro às 23h de 31 de dezembro em São Paulo, e não
 * em 1º de janeiro em Greenwich.
 *
 * Já valia como `process.env.TZ` no runtime (ver lib/fuso.test.ts). Isto é o mesmo fuso,
 * nomeado, para o SQL que agrupa por DIA: `created_at at time zone FUSO` devolve o dia em
 * que a coisa aconteceu para quem estava aqui, e não o dia do relógio de Greenwich. Um
 * gráfico de crescimento agrupado em UTC erra na virada de cada dia, que é o mesmo bug que
 * a data de leitura já sofreu.
 */
export const FUSO = "America/Sao_Paulo";

export class DataInvalida extends Error {}

/** Hoje, no calendário. Sem hora, sem fuso: é uma data, e data não tem relógio. */
export function hoje(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/**
 * Uma data de leitura, ou nada.
 *
 * Vazio devolve `null`, e isso é legítimo: um livro que você está lendo não tem data
 * de fim, e uma leitura que você registrou sem lembrar quando começou não tem data de
 * início. Nulo é uma resposta; data errada não é.
 *
 * O que ela RECUSA:
 *   - texto que não é uma data (`2019-13-45`, `ontem`, `aaaa`)
 *   - data no FUTURO: ninguém terminou amanhã um livro
 *   - data antes de 1900: quase sempre é um dedo escorregado
 */
export function dataDeLeitura(bruto: unknown): string | null {
  if (bruto === null || bruto === undefined) return null;

  const texto = String(bruto).trim();
  if (!texto) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw new DataInvalida("essa data não parece uma data");
  }

  // `new Date("2019-02-31")` não levanta: ele ROLA para 3 de março, em silêncio. Então
  // a gente confere se a data que voltou é a mesma que entrou. Sem isto, 31 de fevereiro
  // vira 3 de março e ninguém percebe.
  const d = new Date(`${texto}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== texto) {
    throw new DataInvalida("esse dia não existe no calendário");
  }

  if (texto > hoje()) {
    throw new DataInvalida("essa data ainda não chegou");
  }

  if (Number(texto.slice(0, 4)) < PRIMEIRO_ANO) {
    throw new DataInvalida(`o ano parece errado (antes de ${PRIMEIRO_ANO})`);
  }

  return texto;
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O ANO BASTA, E NA MAIOR PARTE DAS VEZES ELE É TUDO QUE SE SABE.
 *
 *  "Quando você terminou?" quase sempre se responde com um número: 2019. Pedir dia,
 *  mês e ano para isso obriga quem não lembra a INVENTAR um dia, e o banco passa a
 *  guardar uma precisão que nunca existiu.
 *
 *  Então o campo aceita as duas formas, e o FORMATO diz qual é:
 *
 *      "2019"        → o ano, e só ele        → precisão 'year'
 *      "2019-03-14"  → o dia exato            → precisão 'day'
 *
 *  Um ano vira 2019-01-01 no banco, porque a coluna é `date` e precisa de um dia.
 *  Esse 1º de janeiro NÃO é uma afirmação sobre o calendário: é um lugar para pousar.
 *  Quem sabe que ele não vale é a coluna de precisão (ver a migration 0051), e é ela
 *  que impede a estatística da paciência de contar um dia que ninguém viveu.
 * ════════════════════════════════════════════════════════════════════
 */
export type Precisao = "day" | "year";

/** Uma data de leitura com a precisão que o leitor de fato afirmou. */
export type DataComPrecisao = { valor: string | null; precisao: Precisao };

/**
 * O ano de uma leitura, ou nada.
 *
 * Recusa o que `dataDeLeitura` recusa, pela mesma régua: ano no futuro (ninguém leu
 * em 2030) e ano antes de 1900 (quase sempre dedo escorregado).
 */
export function anoDeLeitura(bruto: unknown): number | null {
  if (bruto === null || bruto === undefined) return null;

  const texto = String(bruto).trim();
  if (!texto) return null;

  if (!/^\d{4}$/.test(texto)) {
    throw new DataInvalida("isso não parece um ano");
  }

  const ano = Number(texto);
  if (ano > Number(hoje().slice(0, 4))) {
    throw new DataInvalida("esse ano ainda não chegou");
  }
  if (ano < PRIMEIRO_ANO) {
    throw new DataInvalida(`o ano parece errado (antes de ${PRIMEIRO_ANO})`);
  }

  return ano;
}

/**
 * Uma data de leitura escrita como ANO ou como DIA, e a precisão que veio junto.
 *
 * É o que a tela manda: quem aceitou o padrão manda "2019"; quem abriu "quero pôr o
 * dia" manda "2019-03-14". Nada além disso precisa viajar, porque o formato já conta.
 */
export function dataOuAno(bruto: unknown): DataComPrecisao {
  if (bruto === null || bruto === undefined) return { valor: null, precisao: "day" };

  const texto = String(bruto).trim();
  if (!texto) return { valor: null, precisao: "day" };

  if (/^\d{4}$/.test(texto)) {
    const ano = anoDeLeitura(texto);
    // O 1º de janeiro é o lugar de pousar, e a precisão é quem diz que ele não vale.
    return { valor: ano === null ? null : `${ano}-01-01`, precisao: "year" };
  }

  return { valor: dataDeLeitura(texto), precisao: "day" };
}

/**
 * As três datas de UMA leitura, conferidas juntas.
 *
 * Porque elas não são independentes: terminar antes de começar não é uma data errada,
 * é uma HISTÓRIA errada, e nenhuma das duas datas sozinha denuncia isso.
 *
 * E uma leitura não pode ser terminada E abandonada. São dois finais diferentes para a
 * mesma história, e guardar os dois é guardar uma contradição que a página do ano vai
 * ter que resolver no chute.
 */
export type Datas = {
  comecou: string | null;
  terminou: string | null;
  abandonou: string | null;
  /**
   * A precisão de cada ponta. O começo tem a sua; o fim é um só (terminado OU
   * abandonado), então uma precisão cobre os dois. Ver a migration 0051.
   */
  precisaoComeco: Precisao;
  precisaoFim: Precisao;
};

export function validarLeitura(bruto: {
  comecou?: unknown;
  terminou?: unknown;
  abandonou?: unknown;
}): Datas {
  // Cada campo pode chegar como ano ("2019") ou como dia ("2019-03-14"). O formato diz
  // a precisão, e nada mais precisa viajar da tela até aqui.
  const comeco = dataOuAno(bruto.comecou);
  const term = dataOuAno(bruto.terminou);
  const aband = dataOuAno(bruto.abandonou);

  const datas: Datas = {
    comecou: comeco.valor,
    terminou: term.valor,
    abandonou: aband.valor,
    precisaoComeco: comeco.precisao,
    // O fim que existe é quem dita a precisão do fim. Sem fim nenhum, 'day' é o padrão
    // inofensivo: não há data para ele qualificar.
    precisaoFim: term.valor ? term.precisao : aband.valor ? aband.precisao : "day",
  };

  if (datas.terminou && datas.abandonou) {
    throw new DataInvalida("um livro é terminado ou abandonado, e não os dois");
  }

  /**
   * O fim não vem antes do começo. Com ano, a comparação é por ANO, e não por dia: quem
   * começou em março de 2019 e marcou "terminei em 2019" não está se contradizendo, e
   * comparar 2019-03-14 com o 1º de janeiro que pousamos diria que sim.
   */
  const fim = datas.terminou ?? datas.abandonou;
  if (datas.comecou && fim) {
    const porAno = datas.precisaoComeco === "year" || datas.precisaoFim === "year";
    const a = porAno ? datas.comecou.slice(0, 4) : datas.comecou;
    const b = porAno ? fim.slice(0, 4) : fim;
    if (b < a) throw new DataInvalida("o fim não pode vir antes do começo");
  }

  return datas;
}

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
};

export function validarLeitura(bruto: {
  comecou?: unknown;
  terminou?: unknown;
  abandonou?: unknown;
}): Datas {
  const datas: Datas = {
    comecou: dataDeLeitura(bruto.comecou),
    terminou: dataDeLeitura(bruto.terminou),
    abandonou: dataDeLeitura(bruto.abandonou),
  };

  if (datas.terminou && datas.abandonou) {
    throw new DataInvalida("um livro é terminado ou abandonado, e não os dois");
  }

  const fim = datas.terminou ?? datas.abandonou;
  if (datas.comecou && fim && fim < datas.comecou) {
    throw new DataInvalida("o fim não pode vir antes do começo");
  }

  return datas;
}

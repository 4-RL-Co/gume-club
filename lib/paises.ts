/**
 * ════════════════════════════════════════════════════════════════════
 *  O NOME DE UM PAÍS, E SÓ UM NOME POR PAÍS.
 *
 *  A seção de países da /estatisticas — "você leu autores de sete países" — só vale
 *  alguma coisa se cada país tiver UM nome. Uma estatística que conta a mesma coisa
 *  duas vezes é uma estatística em que ninguém confia.
 *
 *  E o acervo tinha o mesmo país escrito de quatro jeitos:
 *
 *      Brasil (778)   ·   Brasileira (11)
 *      Portugal (522) ·   Reino de Portugal
 *      Unido (8)      ·   Reino Unido        ← este era um bug MEU
 *      Clarice Lispector: "Socialista Soviética Ucraniana"   ← e este também
 *
 *  ═══ OS DOIS BUGS, E O QUE ELES ENSINAM ═══
 *
 *  A primeira versão disto era uma regex esperta dentro do script de backfill: tirava
 *  "Reino de", "República de", "Império de" do começo do nome.
 *
 *  Ela transformou **"Reino Unido" em "Unido"** (não tem "de", e a regex tinha um ramo
 *  sem preposição), e **"República Socialista Soviética Ucraniana" em "Socialista
 *  Soviética Ucraniana"**.
 *
 *  A lição, e ela é velha: **uma regex que remove um prefixo não sabe o que sobra.**
 *  Um MAPA sabe. Onde os nomes são poucos e conhecidos, escreve-se a lista.
 *
 *  Só se normaliza o que está na lista. O que não está passa inteiro — porque inventar
 *  um país é muito pior do que ter um país escrito de um jeito estranho.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * O que a fonte diz → o que o leitor lê.
 *
 * Três tipos de conserto, e todos pela mesma razão (é o MESMO país):
 *
 *   · o ADJETIVO, que veio de uma fonte antiga: "Brasileira" é o Brasil.
 *   · a ENTIDADE HISTÓRICA: Camões é cidadão do Reino de Portugal, e Pessoa é de
 *     Portugal. A tela pergunta de que PAÍS é o autor, e ninguém responde "do Reino
 *     de Portugal".
 *   · o NOME LONGO: "Estados Unidos da América" é os Estados Unidos.
 *
 * A chave é minúscula e sem acento — ver `normaliza()` embaixo.
 */
const MESMO_PAIS: Record<string, string> = {
  // adjetivos, de uma fonte antiga
  brasileira: "Brasil",
  brasileiro: "Brasil",
  portuguesa: "Portugal",
  portugues: "Portugal",
  britanica: "Reino Unido",
  britanico: "Reino Unido",
  inglesa: "Reino Unido",
  americana: "Estados Unidos",
  americano: "Estados Unidos",
  francesa: "França",
  frances: "França",
  alema: "Alemanha",
  alemao: "Alemanha",
  italiana: "Itália",
  italiano: "Itália",
  japonesa: "Japão",
  japones: "Japão",
  espanhola: "Espanha",
  espanhol: "Espanha",
  argentina: "Argentina",
  russa: "Rússia",
  russo: "Rússia",
  indiana: "Índia",
  angolana: "Angola",
  mocambicana: "Moçambique",

  // o estrago das minhas próprias regex, consertado na origem e aqui
  unido: "Reino Unido",
  "socialista sovietica ucraniana": "Ucrânia",

  // entidades históricas: são o mesmo lugar, e a pessoa que lê pensa no país de hoje
  "reino de portugal": "Portugal",
  "portugal continental": "Portugal",
  "imperio do brasil": "Brasil",
  "brasil colonial": "Brasil",
  "reino unido da gra-bretanha e irlanda": "Reino Unido",
  "reino unido da gra-bretanha e irlanda do norte": "Reino Unido",
  "gra-bretanha": "Reino Unido",
  inglaterra: "Reino Unido",
  escocia: "Reino Unido",
  "pais de gales": "Reino Unido",
  "reino da gra-bretanha": "Reino Unido",
  prussia: "Alemanha",
  "alemanha nazista": "Alemanha",
  "alemanha oriental": "Alemanha",
  "alemanha ocidental": "Alemanha",
  "republica de weimar": "Alemanha",
  "uniao sovietica": "Rússia",
  "republica socialista federativa sovietica da russia": "Rússia",
  "imperio russo": "Rússia",
  "republica socialista sovietica ucraniana": "Ucrânia",
  tchecoslovaquia: "República Tcheca",
  iugoslavia: "Sérvia",
  "austria-hungria": "Áustria",
  "imperio austro-hungaro": "Áustria",
  "imperio otomano": "Turquia",
  "estados unidos da america": "Estados Unidos",
  "republica francesa": "França",
  "reino de espanha": "Espanha",
  "reino da espanha": "Espanha",
  "republica italiana": "Itália",
  "republica portuguesa": "Portugal",
  "republica federativa do brasil": "Brasil",
};

/** minúscula, sem acento, sem espaço sobrando. Só para procurar no mapa. */
function normaliza(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * O nome de um país, como o leitor o conhece.
 *
 * O que não está no mapa **volta inteiro**, e é de propósito: inventar um país é muito
 * pior do que ter um país escrito de um jeito estranho. Se aparecer um nome novo e
 * torto, ele aparece na tela, alguém vê, e a lista ganha uma linha.
 */
export function paisDe(bruto: string | null | undefined): string | null {
  if (!bruto) return null;

  const limpo = bruto.replace(/\s*\(.*?\)\s*$/, "").trim();
  if (!limpo) return null;

  return MESMO_PAIS[normaliza(limpo)] ?? limpo;
}

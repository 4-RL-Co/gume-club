/**
 * ════════════════════════════════════════════════════════════════════
 *  O PORTÃO DO CAMPO DE AUTOR. Um lugar só, e toda escrita passa por ele.
 *
 *  Mesma filosofia do lib/authz.ts: uma função, escrita a mão, e o
 *  `pnpm audit:security` quebra o build se alguém escrever em `authors` por
 *  fora dela.
 *
 *  ═══ POR QUE ELE NÃO PODE MORAR DENTRO DO IMPORT ═══
 *
 *  A lista de sentinelas nasceu dentro do `scripts/import-openlibrary.mjs`,
 *  porque foi lá que o lixo entrou. Mas o lixo não vem de UMA porta:
 *
 *    - o dump da Open Library, que guarda "Portugal." no campo de autor;
 *    - o Google Books, quando alguém cadastra um livro que não achamos;
 *    - o cadastro a mão, onde um leitor pode digitar "desconhecido";
 *    - a AniList, quando o mangá entrar;
 *    - e a próxima fonte, que ninguém imaginou ainda.
 *
 *  Uma regra que mora numa das portas é uma regra que as outras não conhecem.
 *
 *  ═══ POR QUE A ETIQUETA É PIOR QUE O NULO ═══
 *
 *  `[author not identified]` não é um autor desconhecido: é um autor
 *  DISFARÇADO. Um nulo a gente conta, vê e conserta. A etiqueta passa por
 *  pessoa em toda contagem, em toda busca e em toda poda.
 *
 *  Foi ela que fez a poda achar que Madame Bovary tinha autor — e por pouco
 *  não apagou Madame Bovary por não reconhecer o Flaubert.
 *
 *  E ela chega na TELA: existe uma página `/autor/portugal` no ar, e "Brazil"
 *  conta como um autor que você leu na página de estatísticas.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Etiquetas que ocupam o campo de autor sem serem uma pessoa.
 *
 * Comparadas em minúscula, sem acento e sem pontuação no fim — porque a Open Library
 * guarda "Portugal" e "Portugal." como duas coisas, e as duas são a mesma não-pessoa.
 */
const ETIQUETAS = new Set([
  // O que a Open Library põe quando não sabe
  "author not identified",
  "publisher not identified",
  "invalid author id",
  "not avail",
  "unknown",
  "unknown author",
  "no author",

  // O anônimo, que É uma resposta, mas não é uma PESSOA. Um livro anônimo tem autor
  // nulo, e não um autor chamado "Anônimo" com uma página de autor e uma estante.
  "anonymous",
  "anonimo",
  "autor desconhecido",
  "desconhecido",

  // Antologia. "Vários autores" não é o nome de ninguém, e uma página de autor para
  // ele juntaria mil livros que não têm nada a ver uns com os outros.
  "various",
  "various authors",
  "diversos",
  "diversos autores",
  "varios",
  "varios autores",
  "vv aa",
  "vvaa",
  "aa vv",

  // Editora e catalogação, que a Open Library às vezes enfia no campo de autor
  "s n",
  "sn",
  "n a",
  "na",
  "sine nomine",
]);

/**
 * Países e instituições que aparecem como "autor" de documento oficial.
 *
 * O acervo tem 1.462 obras assinadas por "Brazil" e 1.652 por "Portugal" / "Portugal.".
 * São diários oficiais, constituições e coletâneas de lei — e o campo de autor delas
 * devia estar vazio.
 *
 * É um PREFIXO, e não igualdade: a Open Library escreve
 * "Portugal. Sovereign (1777-1816 : Maria I)" e "Brazil. Ministério da Justiça".
 */
const INSTITUICOES = [
  "portugal",
  "brazil",
  "brasil",
  "estados unidos",
  "united states",
  "great britain",
];

function canonico(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[.,;:'"\[\]()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ISTO É NOME DE AUTOR DE VERDADE?
 *
 * A pergunta única. Toda escrita em `authors` passa por aqui: o import, o backfill, o
 * cadastro a mão, o Google Books, a AniList, e o que vier depois.
 *
 * Ela recusa:
 *   - vazio, espaço em branco, só pontuação, só número
 *   - as etiquetas da Open Library (`[author not identified]`, `invalid author ID`)
 *   - país e instituição ("Brazil", "Portugal. Sovereign (1777-1816 : Maria I)")
 *   - "anônimo" e "vários autores" como se fossem pessoas
 *
 * Ela NÃO recusa um nome esquisito. "Machado de Machado de Assis" é um nome sujo, e é
 * um nome de gente sujo: ele passa, e vira trabalho de bibliotecário. Este portão
 * separa GENTE de ETIQUETA, e não nome limpo de nome sujo — misturar as duas coisas
 * faria um portão que recusa autor de verdade, e esse é o erro caro.
 */
export function ehNomeDeAutor(bruto: unknown): boolean {
  if (typeof bruto !== "string") return false;

  const nome = bruto.trim();
  if (!nome) return false;

  // Precisa ter uma letra. "---", "1950", "[]", "???" não são nomes.
  if (!/\p{L}/u.test(nome)) return false;

  // Uma letra só não é um nome. "A." é uma inicial órfã, e não uma pessoa.
  if (nome.replace(/[^\p{L}]/gu, "").length < 2) return false;

  const chave = canonico(nome);
  if (!chave) return false;

  if (ETIQUETAS.has(chave)) return false;

  for (const inst of INSTITUICOES) {
    // Igual ("Brazil") ou prefixo seguido de fim/pontuação ("Portugal. Sovereign…").
    // "Alberto Portugal" NÃO casa, e não pode casar: ele é gente.
    if (chave === inst || chave.startsWith(`${inst} `)) return false;
  }

  return true;
}

/**
 * O nome, limpo, ou nada.
 *
 * Devolve `null` no lugar de uma etiqueta — e é isso que faz o autor virar NULO em vez
 * de virar um autor falso. Quem chama escolhe o que fazer com o nulo; ninguém escolhe
 * o que fazer com uma etiqueta, porque ninguém percebe que ela é uma.
 */
export function limparNomeDeAutor(bruto: unknown): string | null {
  if (!ehNomeDeAutor(bruto)) return null;
  return String(bruto).trim().replace(/\s+/g, " ");
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE A TELA ESCREVE QUANDO NÃO SE SABE QUEM ESCREVEU.
 *
 *  ═══ POR QUE ISTO EXISTE ═══
 *
 *  Obra sem autor desenhava NADA — o espaço do nome ficava vazio, e vazio lê como
 *  "faltou preencher". Para a Saga de Njáll ou a Vida de Esopo isso é falso: elas
 *  não têm autor porque são anônimas, e a ficha está completa.
 *
 *  ═══ POR QUE NÃO É UM AUTOR CHAMADO "DESCONHECIDO" ═══
 *
 *  A saída óbvia seria criar uma linha em `authors` com esse nome. Ela recriaria
 *  exatamente o registro-lixo que este projeto acabou de apagar: "Jonathan C. Young"
 *  tinha 53 obras sem relação nenhuma, com página de perfil, nome clicável e lugar na
 *  busca de autores. Um "Desconhecido" com centenas de obras seria a mesma coisa, só
 *  que criada de propósito.
 *
 *  Então a palavra mora na TELA, e o banco continua dizendo a verdade: `null`, que é
 *  "não sei". A diferença importa na hora de consertar — dá para listar o que falta
 *  atribuir; não daria se estivesse tudo pendurado num autor de mentira.
 *
 *  E ela nunca é link: não há para onde ir, e um nome sublinhado que não leva a
 *  lugar nenhum é a promessa quebrada que a página do autor já tinha consertado uma
 *  vez.
 * ════════════════════════════════════════════════════════════════════
 */
export const AUTOR_DESCONHECIDO = "Desconhecido";

export function nomeDoAutor(nome: string | null | undefined): string {
  return nome?.trim() ? nome : AUTOR_DESCONHECIDO;
}

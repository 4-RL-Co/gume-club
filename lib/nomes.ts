/**
 * O caminho é RELATIVO, e com a extensão, de propósito: este módulo é importado tanto
 * pelo Next (que entende o "@/") quanto pelos scripts do dump, que rodam no Node puro e
 * não entendem. Um "@/" aqui quebraria o backfill de autores em silêncio.
 */
import { ehNomeDeAutor as ehGente } from "./autores.ts";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O NOME DO AUTOR: um para a TELA, os outros para a BUSCA.
 *
 *  A Open Library guarda Tolstói como **Лев Толстой**. Em cirílico. E guarda
 *  o mangaká em kanji: **三浦建太郎**.
 *
 *  Recarregar o autor sem resolver isto trocaria um problema por outro. Em vez
 *  de o Gume não saber quem escreveu Guerra e Paz, ele mostraria "Лев Толстой"
 *  na estante de um leitor brasileiro — e a busca por "Tolstói" continuaria
 *  devolvendo nada.
 *
 *  Um conserto que só aparece no banco não é um conserto.
 *
 *  ═══ A REGRA ═══
 *
 *  A Open Library dá três candidatos para o mesmo autor:
 *
 *      name            "Лев Толстой"
 *      personal_name   "Толстой, Лев Николаевич"
 *      alternate_names ["Leo Tolstoy", "Lev Tolstoi", "León Tolstói", …]
 *
 *  Para a TELA: o primeiro candidato em alfabeto latino. Um leitor brasileiro
 *  lê "Leo Tolstoy" e sabe quem é; ele olha "Лев Толстой" e vê um borrão.
 *
 *  Para a BUSCA: TODOS os outros, guardados como sinônimo. O cirílico entra. O
 *  kanji entra. É o que faz "Толстой", "Tolstoy" e "Tolstói" acharem o mesmo
 *  livro.
 *
 *  ═══ E QUANDO NÃO EXISTE NENHUM EM LATINO? ═══
 *
 *  Fica o que a Open Library deu, em kanji ou em cirílico mesmo. Não se inventa
 *  transliteração: um "Tolstoi" chutado por um algoritmo é pior que um cirílico
 *  honesto, porque o errado a gente não sabe que está errado.
 *
 *  Quando isso acontecer, é uma TAREFA de bibliotecário, e não um defeito
 *  escondido. Ver .github/ISSUE_DRAFTS/11.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Isto é alfabeto latino?
 *
 * Aceita acento, cedilha, hífen, apóstrofo e ponto — "Eça de Queirós",
 * "Saint-Exupéry" e "J. R. R. Tolkien" são latinos. Recusa cirílico, grego, kanji,
 * kana, hangul, árabe e hebraico.
 *
 * `\p{Script=Latin}` é a pergunta certa, e não `[a-z]`: "Tolstói" tem um "ó" que não
 * está em [a-z], e é latino do mesmo jeito.
 */
export function ehLatino(nome: string): boolean {
  const texto = nome.trim();
  if (!texto) return false;

  // Precisa ter PELO MENOS uma letra latina. Um nome só de pontuação não é um nome.
  if (!/\p{Script=Latin}/u.test(texto)) return false;

  // E não pode ter NENHUMA letra de outro alfabeto. "三浦建太郎 (Kentaro Miura)" tem as
  // duas coisas, e ele não serve para a tela como está: o kanji fica na frente.
  return !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Hebrew}]/u.test(
    texto,
  );
}

/** "Sobrenome, Nome" é como a biblioteca escreve, e não como a pessoa se chama. */
function desinverte(nome: string): string {
  const m = nome.match(/^([^,]+),\s*(.+)$/);
  if (!m) return nome;

  // Só desinverte quando o que vem depois da vírgula parece um nome, e não um sufixo
  // ("Jr.", "1828-1910", "ed."). Uma data depois da vírgula não é um primeiro nome.
  const depois = m[2]!.trim();
  if (/^\d|^(jr|júnior|junior|ed|org|comp)\b/i.test(depois)) return nome;

  return `${depois} ${m[1]!.trim()}`;
}

export type NomeDeAutor = {
  /** O que vai para a tela. */
  nome: string;
  /** Os outros, por que ele é procurado. Nunca aparecem; só fazem a busca achar. */
  sinonimos: string[];
};

/**
 * Escolhe o nome de exibição e junta os sinônimos.
 *
 * A ordem de preferência para a TELA:
 *   1. o `name`, se já for latino  ← e esta ordem já esteve ERRADA
 *   2. o `personal_name`, se for latino
 *   3. um `alternate_names` em latino, DESINVERTIDO ("Leo Tolstoy")
 *   4. o `name` como veio (cirílico, kanji), porque chutar transliteração é pior
 *
 * ═══ O ERRO QUE ESTA ORDEM CONSERTA ═══
 *
 * A primeira versão punha `alternate_names` NA FRENTE, para fugir do cirílico do
 * Tolstói. E funcionava para o Tolstói — e quebrava todo o resto: Albert Einstein, cujo
 * `name` já é latino e perfeito, virou **"Einstein"**, porque foi essa a primeira
 * grafia que apareceu na lista de apelidos.
 *
 * `alternate_names` é uma sacola: ela tem "Albert Einstein Ph.D.", "Professor Albert
 * Einstein" e "Einstein", em ordem arbitrária. Ela é ótima como PLANO B, e péssima como
 * primeira escolha.
 *
 * O `name` só é um borrão quando NÃO é latino. Aí, e só aí, a sacola vale.
 */
export function nomeDeAutor(bruto: {
  name?: string | null;
  personal_name?: string | null;
  alternate_names?: string[] | null;
}): NomeDeAutor | null {
  const name = (bruto.name ?? "").trim();
  const personal = (bruto.personal_name ?? "").trim();
  const alternos = (bruto.alternate_names ?? []).map((a) => String(a ?? "").trim()).filter(Boolean);

  const candidatos = [name, personal, ...alternos].filter(Boolean);
  if (candidatos.length === 0) return null;

  // A ordem importa, e ela já esteve errada. Ver o cabeçalho.
  const preferidos = [name, personal, ...alternos].filter(Boolean);

  const latino = preferidos
    .map(desinverte)
    .filter(ehGente)
    .find(ehLatino);

  const nome = latino ?? (ehGente(name) ? name : null) ?? preferidos.find(ehGente) ?? null;
  if (!nome) return null;

  // Sinônimos: TODO o resto, incluindo o cirílico e o kanji, e incluindo as formas
  // invertidas — porque tem gente que digita "Tolstoy, Leo".
  const todos = new Set<string>();
  for (const c of candidatos) {
    todos.add(c);
    todos.add(desinverte(c));
  }
  todos.delete(nome);

  return {
    nome,
    // Um limite, porque a Open Library às vezes traz cinquenta grafias de um nome, e
    // cinquenta sinônimos numa linha é um índice de trigrama que ninguém sustenta.
    sinonimos: [...todos].filter(Boolean).slice(0, 12),
  };
}

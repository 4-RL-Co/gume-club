/**
 * ════════════════════════════════════════════════════════════════════
 *  O HANDLE. O endereço público de uma pessoa.
 *
 *  A DEFESA DE VERDADE NÃO MORA AQUI: mora no gatilho do banco (ver a
 *  migration 0027). Código se contorna — um script, um seed, um caminho
 *  novo que alguém escreveu sem saber que este arquivo existia. Gatilho
 *  não se contorna.
 *
 *  Este arquivo existe para o cadastro CONTORNAR o handle reservado em
 *  silêncio, em vez de estourar na cara de quem está entrando. Alguém que
 *  se chama "Gabriel" não pode receber um erro de banco de dados na tela
 *  de cadastro: ele recebe `@gabriel-2` e nem fica sabendo.
 *
 *  As duas regras são a MESMA regra, e por isso a forma canônica está
 *  escrita nos dois lugares, com o mesmo mapa. Se você mudar um, mude o
 *  outro: há um teste que compara os dois contra o Postgres de verdade.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Os homóglifos que gente de verdade usa.
 *
 * "Adm1n" com UM, "l1vro" com UM, "4dmin" com QUATRO. Todos LEEM como a palavra
 * original, e nenhum É a palavra original. Uma lista de palavras proibidas comparada
 * letra a letra não pega nenhum deles, e é por isso que a comparação é sobre a forma
 * CANÔNICA, e nunca sobre o que a pessoa digitou.
 *
 * Quem escreve "l1vro" não está sendo criativo: está tentando passar por "livro".
 */
const HOMOGLIFOS: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
};

/** A mesma forma canônica de `handle_canonico()` no Postgres. Os dois têm que casar. */
export function canonico(handle: string): string {
  return handle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira o acento: "ádmin" vira "admin"
    .split("")
    .map((c) => HOMOGLIFOS[c] ?? c)
    .join("")
    .replace(/[^a-z]/g, ""); // fora traço, ponto, sublinhado e o que sobrar
}

/**
 * Um handle que uma pessoa de verdade poderia querer.
 *
 * Nunca começa com número: um handle assim finge ser outra coisa (um id, uma data,
 * uma rota), e não serve a nada que alguém queira de verdade.
 */
export function pareceHandle(handle: string): boolean {
  return /^[a-z][a-z0-9-]{1,29}$/.test(handle);
}

/** O handle derivado de um nome ou de um e-mail. O que sobra depois da limpeza. */
export function handleDe(fonte: string): string {
  const base = fonte
    .split("@")[0]!
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^[0-9]+/, "") // nunca começa com número
    .slice(0, 30);

  // Sobrou nada (um nome só de emoji, um e-mail só de dígitos)? "leitor" é honesto, e
  // o sufixo numérico que vem depois torna ele único.
  return base.length >= 2 ? base : "leitor";
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O TEXTO DE FORA, LIMPO PARA A TELA.
 *
 *  A sinopse da Open Library vem em markdown. Na tela, sem tratamento, o leitor lê:
 *
 *      **Dom Casmurro**, publicado pela primeira vez em 1899, é um dos romances…
 *      [Purloined Letter](https://openlibrary.org/works/OL41065W)
 *
 *  São 264 obras com asterisco, 86 com link e 39 com HTML no meio da frase. Ninguém
 *  fora daqui sabe o que significa um asterisco duplo.
 *
 *  ═══ POR QUE LIMPAR NA TELA, E NÃO NO BANCO ═══
 *
 *  O Gume promete publicar um dataset CC0 com o dado da Open Library. Um dataset é
 *  uma cópia FIEL — e o markdown É o formato original do texto lá. Reescrever o
 *  texto no banco seria publicar a nossa versão dele e chamar de fonte.
 *
 *  Então o banco guarda o que a fonte publicou, e a tela mostra o que uma pessoa lê.
 *  A limpeza é uma decisão de APRESENTAÇÃO, e ela mora aqui.
 *
 *  ═══ O TEXTO É TEXTO, NUNCA HTML ═══
 *
 *  Esta função devolve string, e a tela renderiza como texto. Não existe, e não vai
 *  existir, um `dangerouslySetInnerHTML` com sinopse de terceiro: é dado que entrou
 *  no banco por um dump, e dado de fora nunca vira marcação executável.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Tira a marcação e devolve a frase.
 *
 * O que sobra é o que a pessoa queria ler: o nome do livro sem os asteriscos, o título
 * do link sem o endereço, o texto sem as tags.
 */
export function limparMarcacao(texto: string | null): string | null {
  if (!texto) return null;

  const limpo = texto
    // [Purloined Letter](https://…) → Purloined Letter. O TÍTULO é o que interessa; o
    // endereço é encanamento, e ele não vai para o meio de uma frase.
    .replace(/\[([^\]]+)\]\((?:[^)]*)\)/g, "$1")
    // <i>, <br>, <p>. Vira nada: o que estiver dentro fica.
    .replace(/<[^>]{0,200}>/g, "")
    // **negrito**, *itálico*, __, _. O ênfase morre; a palavra fica.
    .replace(/(\*{1,3}|_{1,3})(?=\S)([^*_]*?\S)\1/g, "$2")
    // ### Título, > citação, --- régua: começos de linha que só fazem sentido em markdown.
    // `[ \t]`, e nunca `\s`: `\s` casa com a quebra de linha, e a limpeza comeria o
    // parágrafo em vez da marcação. Um espaço não é uma linha em branco.
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, "")
    .replace(/^[ \t]{0,3}>[ \t]?/gm, "")
    .replace(/^[ \t]{0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/gm, "")
    // `código` — raro, mas aparece.
    .replace(/`([^`]+)`/g, "$1")
    // O que a limpeza deixou: asterisco solto, e três linhas em branco viram uma.
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return limpo.length > 0 ? limpo : null;
}


/**
 * Sem acento, sem caixa. É o que a busca da estante usa para "principe" achar "O
 * Príncipe".
 *
 * O mesmo que o `immutable_unaccent(lower(...))` faz no Postgres para a busca do
 * catálogo (ver lib/catalog.ts): quem digita rápido não põe acento, e uma busca que
 * exige acento responde "não achei" sobre um livro que está na tela.
 */
export function semAcento(texto: string | null | undefined): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  ISBN-10 E ISBN-13 SÃO O MESMO NÚMERO, EM DOIS FORMATOS.
 *
 *  ═══ O BUG ═══
 *
 *  "Quando coloco o ISBN10, ele aparece que salvou, mas o campo do ISBN
 *  continua em branco." `editions.isbn13` (lib/db/schema.ts) é a ÚNICA
 *  coluna que este catálogo guarda, e o formulário só aceitava um número
 *  de treze dígitos — um de dez (o que está impresso na contracapa de
 *  qualquer edição de antes de 2007) virava `null` em silêncio. A tela
 *  dizia "salvo" porque tecnicamente salvou: salvou um branco.
 *
 *  ═══ A CONVERSÃO NÃO É UMA APROXIMAÇÃO ═══
 *
 *  É aritmética, e sempre foi: um ISBN-13 é o ISBN-10 com "978" na frente
 *  e o dígito verificador recalculado (o mesmo checksum do código de
 *  barras EAN-13). Os nove primeiros dígitos do de dez são os mesmos nove
 *  dígitos do de treze — não são "livros diferentes com números parecidos",
 *  são o mesmo livro, e um catálogo que trata os dois como coisas
 *  diferentes obriga quem edita a digitar duas vezes o que já tinha na mão
 *  uma vez.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Normaliza qualquer ISBN digitado (dez ou treze dígitos, com ou sem
 * hífen/espaço) para o formato de treze que `editions.isbn13` guarda.
 *
 * `null` quer dizer "não é um ISBN válido nesse tamanho" — quem chama
 * decide o que fazer: um campo vazio é "limpar o ISBN", um campo com
 * texto que não bate em nenhum dos dois formatos é um erro para avisar,
 * não um branco para gravar calado.
 */
export function paraIsbn13(bruto: string): string | null {
  const limpo = bruto.toUpperCase().replace(/[^0-9X]/g, "");

  if (limpo.length === 13) return /^\d{13}$/.test(limpo) ? limpo : null;
  if (limpo.length !== 10 || !/^\d{9}[\dX]$/.test(limpo)) return null;

  // Os nove primeiros dígitos do ISBN-10 (o décimo é o próprio verificador
  // dele, e não entra na conta de novo) ganham o prefixo "978" e um
  // verificador novo — o do EAN-13, peso 1/3 alternado.
  const doze = "978" + limpo.slice(0, 9);
  let soma = 0;
  for (let i = 0; i < 12; i++) soma += Number(doze[i]) * (i % 2 === 0 ? 1 : 3);
  const verificador = (10 - (soma % 10)) % 10;
  return doze + verificador;
}

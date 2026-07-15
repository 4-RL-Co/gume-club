/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE FALTA NO APP, DITO PARA LEITORES.
 *
 *  ═══ ESTA LISTA É DE FALTA BÁSICA, E NÃO DE AMBIÇÃO ═══
 *
 *  A primeira versão dela estava errada, e vale saber por quê: ela
 *  listava câmera para código de barras (isto é um app WEB), o Gume em
 *  outras línguas (isto é escala, e o app não está pronto para escalar) e
 *  o nome do tradutor (isto é firula).
 *
 *  Nada daquilo era o que falta. Aquilo era o que a gente GOSTARIA de ter
 *  um dia, e uma lista de desejos numa tela de "o que falta" é uma lista
 *  que envelhece mal e não convida ninguém a nada.
 *
 *  A régua desta lista, e ela é dura:
 *
 *    · É COISA BÁSICA que o app já devia fazer e não faz?
 *    · Um amigo usando isto hoje TROPEÇA nela?
 *    · Se sim, ela entra. Se é "seria legal ter", ela NÃO entra.
 *
 *  ═══ ELA MORA NUM ARQUIVO, E NÃO SOLTA NA TELA ═══
 *
 *  Porque a tela é varrida por um teste (lib/voice.test.ts) que quebra o
 *  build se ela falar como desenvolvedor. "Endpoint", "migration",
 *  "schema", "repositório", "Fase 4": nada disso pode chegar num leitor.
 *  Uma lista num arquivo é onde a gente escreve isso com cuidado UMA vez,
 *  em vez de escorregar toda vez que alguém acrescenta um item.
 *
 *  É o espelho do docs/O-QUE-FALTA-NO-CODIGO.md, e nunca a tradução dele:
 *  lá se fala em coluna e formato; aqui se fala no que a pessoa ganha.
 *  A mesma falta, vista do outro lado.
 *
 *  ═══ E "BAIXAR OS SEUS LIVROS NUM ARQUIVO" SAIU DAQUI ═══
 *
 *  Porque foi construído. Uma lista de "o que falta" que continua pedindo
 *  desculpa por uma coisa que o app FAZ é uma lista que ninguém acredita
 *  mais — e ela leva junto a credibilidade dos itens que ainda são
 *  verdade. A lista só vale enquanto cada linha dela dói.
 * ════════════════════════════════════════════════════════════════════
 */
export type FaltaNoApp = {
  /** O que a pessoa vai poder fazer, e nunca como isso vai ser construído. */
  o_que: string;
  /** A dor que ela sente HOJE por isso não existir. Nunca um argumento técnico. */
  por_que: string;
};

export const FALTA_NO_APP: FaltaNoApp[] = [
  /**
   * A DATA DE LEITURA SAIU DAQUI, e ela era o primeiro item da lista.
   *
   * Era um BUG, e o mais grave que o app teve: `shelveAndRead` gravava `new Date()`
   * como o dia em que a pessoa terminou o livro, e não havia tela para corrigir.
   *
   * Consertado em 13 de julho de 2026 (lib/datas.ts, lib/leituras.ts,
   * components/leituras.tsx). As três datas são do leitor, editáveis na hora e
   * corrigíveis depois.
   *
   * O item foi REMOVIDO em vez de ser marcado como feito, e isso é regra: uma tela que
   * promete consertar o que já foi consertado mente para quem lê, e um leitor que vê a
   * lista de faltas listando uma coisa que funciona para de acreditar na lista inteira.
   */
  {
    o_que: "Ser avisado quando um amigo te recomenda um livro",
    por_que:
      "Recomendar um livro para uma pessoa é o coração daqui, e hoje a recomendação chega em silêncio: você só descobre se abrir a tela certa por acaso.",
  },
  {
    o_que: "Procurar um livro dentro da sua própria estante",
    por_que:
      "Com quarenta livros dá para rolar a tela. Com quatrocentos, não dá, e hoje não existe onde digitar o nome do que você está procurando.",
  },
  {
    o_que: "Clube do livro",
    por_que:
      "Um grupo de gente lendo a mesma coisa ao mesmo tempo, e um lugar para dizer o que achou. É o que faz um livro virar conversa.",
  },
];

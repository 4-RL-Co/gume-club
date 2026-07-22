/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE MUDOU, DITO PARA LEITORES.
 *
 *  ═══ ESTA LISTA É DE COISA GRANDE, E NÃO DE DIÁRIO ═══
 *
 *  Cada entrada é uma funcionalidade que mudou como se usa o Gume. Conserto
 *  pequeno, ajuste de tela e arrumação interna NÃO entram: um registro que
 *  anota tudo vira um diário que ninguém lê, e a entrada que importava afunda
 *  no meio.
 *
 *  A régua de entrada:
 *
 *    · Um leitor que voltou depois de duas semanas notaria isso sozinho?
 *    · Se sim, entra, com data e em linguagem de leitor.
 *    · Se é detalhe por baixo do capim, NÃO entra.
 *
 *  ═══ ELA MORA NUM ARQUIVO, E NÃO SOLTA NA TELA ═══
 *
 *  Pelo mesmo motivo do "o que falta" (lib/falta-no-app.ts): a tela é varrida
 *  por lib/voice.test.ts, que quebra o build se ela falar como desenvolvedor.
 *  Aqui a gente escreve com cuidado UMA vez. A mais nova fica em cima.
 * ════════════════════════════════════════════════════════════════════
 */

export type Mudanca = {
  /** O dia em que chegou, YYYY-MM-DD. */
  quando: string;
  titulo: string;
  texto: string;
};

export const MUDANCAS: Mudanca[] = [
  {
    quando: "2026-07-21",
    titulo: "Coleções, com ordem, capa e o gesto de guardar",
    texto:
      "As estantes que você inventa viraram coleções de verdade: têm descrição, uma capa (um livro dela, ou uma foto sua), e ordem numerada quando a ordem é o ponto, com 1º, 2º e 3º. A coleção boa de outra pessoa você guarda, e ela aparece no seu perfil com o crédito de quem montou. Ninguém conta quantos guardaram, e isso é de propósito.",
  },
  {
    quando: "2026-07-21",
    titulo: "Top 100: os queridinhos do Gume",
    texto:
      "Uma lista que ninguém edita: os cem livros que a comunidade mais adorou, na ordem do amor recebido, refeita a cada veredito novo. O livro que entra no top 100 ganha uma coroa na própria página, com a posição. É pódio de livro, e nunca de gente.",
  },
  {
    quando: "2026-07-21",
    titulo: "O Explorar virou uma galeria com corredores",
    texto:
      "Agora dá para explorar por vitrine: pessoas, coleções, autores, gêneros e editoras, cada uma no seu corredor. Autores vêm dos mais lidos para baixo; as obras dentro de um gênero continuam sorteadas, porque vitrine que não muda vira papel de parede.",
  },
  {
    quando: "2026-07-21",
    titulo: "O ano basta para dizer quando você leu",
    texto:
      "Quem terminou um livro em 2019 raramente lembra o dia. Agora a pergunta pede só o ano, e quem lembra a data completa abre o calendário. O Gume não inventa um dia que você não disse: ele guarda que foi só o ano, e as contas respeitam isso.",
  },
  {
    quando: "2026-07-20",
    titulo: "Quem indicou o livro aparece na capa",
    texto:
      "Um livro que chegou por indicação agora carrega o rosto de quem indicou, na capa, na estante de quem recebeu. Quem visita a estante também vê: a recomendação de uma pessoa é a parte mais bonita de uma estante, e ela estava invisível.",
  },
  {
    quando: "2026-07-20",
    titulo: "O convite ficou fácil de achar, e a porta diz quem chamou",
    texto:
      "O seu link de convite mora no perfil e na aba de amigos, com botão de copiar e de compartilhar pelo celular. Quem entra por ele é recebido pelo nome de quem chamou, e você vê no seu perfil quem entrou pelo seu link. Nomes, e nunca um número.",
  },
  {
    quando: "2026-07-20",
    titulo: "A aba de amigos mostra as suas conexões",
    texto:
      "Quem você segue e quem segue você, com rosto e nome, cada lista numa gaveta que só você abre. Só você vê as suas: a lista de conexões de alguém não é vitrine, e não existe contador de seguidores em lugar nenhum.",
  },
  {
    quando: "2026-07-20",
    titulo: "A insígnia de construtor se prova sozinha",
    texto:
      "Quem escreveu parte do Gume conecta a própria conta do GitHub no perfil, e a insígnia de construtor aparece sem pedir nada a ninguém: o Gume confere o trabalho aceito e reconhece. Ela nunca é autodeclarada.",
  },
];

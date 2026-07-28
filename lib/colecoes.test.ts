import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS DUAS PORTAS DA ESTANTE INVENTADA. E ELAS SOMEM COM FACILIDADE.
 *
 *  ═══ O MESMO RELATO, DUAS VEZES, POR CAUSAS DIFERENTES ═══
 *
 *  "Estou testando como usuário e não sei como colocar um livro na estante
 *   personalizada."
 *
 *  "Tava tentando criar uma coleção aqui, mas não entendi como é a dinâmica de
 *   colar um livro ali."
 *
 *  Duas pessoas, meses de distância, mesma frase. E as duas vezes o recurso
 *  EXISTIA e funcionava: o que faltava era o caminho até ele.
 *
 *  Na primeira, o controle estava no rodapé da página do livro, na gaveta de
 *  ferramentas de catálogo. Foi movido para o cartão principal.
 *
 *  Na segunda, ele estava no cartão principal e **envolto num `mine.status &&`**:
 *  só era desenhado se o livro JÁ estivesse na prateleira da pessoa. Quem abria
 *  um livro ainda não marcado não via nada, e a instrução da estante vazia
 *  ("abra um livro e coloque ele aqui") virava mentira.
 *
 *  Um recurso que ninguém encontra é um recurso que não existe, e a única
 *  diferença é que ele custou o mesmo para construir.
 *
 *  ═══ POR QUE UM TESTE DE ESTRUTURA, E NÃO DE COMPORTAMENTO ═══
 *
 *  O que quebra aqui não é a lógica: é alguém envolver o controle numa condição
 *  nova, num refactor, com a melhor das intenções ("só faz sentido se o livro
 *  estiver na estante"). Nenhum teste de unidade pega isso, porque a função
 *  continua correta. O que se perde é o CAMINHO, e caminho se defende lendo a
 *  tela.
 * ════════════════════════════════════════════════════════════════════
 */

const fonte = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("pôr um livro numa estante inventada tem duas portas", () => {
  /**
   * ═══ A PORTA DA PÁGINA DO LIVRO ═══
   *
   * A régua é o que vem ANTES do controle: se houver uma condição sobre o
   * estado da prateleira coladinha nele, ele volta a sumir para quem ainda não
   * marcou o livro, que é justamente quem está descobrindo o app.
   */
  it("na página do livro, o controle não depende de o livro já estar na prateleira", () => {
    const src = fonte("components/book-panel.tsx");

    const i = src.indexOf("<Estantes");
    expect(i, "o controle de estantes sumiu de components/book-panel.tsx").toBeGreaterThan(-1);

    // A vizinhança imediata, sem comentário: o cabeçalho acima do controle
    // EXPLICA a trava antiga, e um teste que lesse o texto cru se acusaria sozinho.
    const antes = src
      .slice(Math.max(0, i - 400), i)
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ");

    expect(
      /mine\.status\s*&&/.test(antes),
      "o controle de estantes voltou a ser escondido atrás do estado da prateleira. " +
        "Quem abre um livro que ainda não marcou deixa de ter como guardá-lo numa " +
        "estante, e a instrução da estante vazia vira mentira.",
    ).toBe(false);
  });

  /**
   * ═══ A PORTA DE DENTRO DA ESTANTE ═══
   *
   * Quem abre uma estante vazia quer encher AQUELA estante. Mandar procurar a
   * porta em outra tela foi o que gerou o segundo relato.
   */
  it("a página da estante tem o campo de pôr um livro", () => {
    const src = fonte("app/estante/[slug]/page.tsx");

    expect(
      src.includes("<PorNaEstante"),
      "a página da estante perdeu o campo de adicionar livro. Quem abre uma estante " +
        "vazia volta a não ter o que fazer nela.",
    ).toBe(true);
  });

  /**
   * ═══ E O ESTADO VAZIO NÃO MANDA MAIS A PESSOA EMBORA ═══
   *
   * A frase antiga ("abra um livro e coloque ele aqui") era a instrução que não
   * funcionava. Se ela voltar, é sinal de que o campo saiu junto.
   */
  it("o estado vazio não manda a pessoa procurar a porta em outra tela", () => {
    // Sem comentário de nenhuma das duas formas: o comentário ao lado do estado
    // vazio CITA a frase antiga para explicar por que ela saiu, e um teste que
    // lesse o arquivo cru acusaria a própria documentação do conserto.
    const src = fonte("app/estante/[slug]/page.tsx")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ");

    expect(
      /Abra um livro e coloque ele aqui/i.test(src),
      "a frase antiga do estado vazio voltou. Ela manda a pessoa para outra tela " +
        "sem dizer o que fazer lá, e foi o que gerou a reclamação.",
    ).toBe(false);
  });

  /**
   * ═══ A REGRA DA POSIÇÃO MORA NUM LUGAR SÓ ═══
   *
   * `toggleInCollection` (a porta do livro) tinha o próprio insert, sem
   * `position`, e o padrão da coluna é zero: o livro guardado por ali PULAVA
   * para o primeiro lugar da estante ordenada. Duas portas com duas regras de
   * ordem é uma estante que se ordena de dois jeitos.
   */
  it("as duas portas usam a mesma regra de posição", () => {
    const curation = fonte("lib/curation.ts");

    expect(
      curation.includes("porNaLista("),
      "lib/curation.ts parou de usar porNaLista(). Se ele voltou a inserir em " +
        "collection_items por conta própria, o livro entra com posição zero e pula " +
        "para o topo da estante de quem ordenou a mão.",
    ).toBe(true);

    const semComentario = curation
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");

    expect(
      /insert\s*\(\s*collectionItems\s*\)/.test(semComentario),
      "voltou um insert direto em collectionItems dentro de lib/curation.ts.",
    ).toBe(false);
  });
});

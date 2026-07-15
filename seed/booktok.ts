/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE SE LÊ HOJE. A lista que o dump da Open Library não tinha como ter.
 *
 *  ═══ POR QUE ESTA LISTA EXISTE ═══
 *
 *  O acervo do Gume nasceu de um dump da Open Library: um arquivo grande, velho, e com um
 *  viés que ninguém escolheu. Ele tem Machado trezentas e cinquenta e cinco vezes e não tem
 *  Tolstói uma. Ele tem anais de congresso do INPE de 1994. E ele NÃO TEM a Colleen Hoover,
 *  a Rebecca Yarros, a Carla Madeira, o Itamar Vieira Junior.
 *
 *  Ou seja: ele tem o que uma biblioteca americana catalogou até certo ano, e não tem o que
 *  as pessoas para quem o Gume existe estão lendo AGORA, neste mês, no ônibus.
 *
 *  Um leitor novo entra, procura o livro que ele acabou de ver no celular, não acha, e vai
 *  embora. Ele não conclui "esse catálogo é curado": conclui "esse app é vazio". E ele está
 *  certo, porque a tela não lhe deu nada melhor para pensar.
 *
 *  ═══ ISTO NÃO SUBSTITUI A TORNEIRA. AS DUAS SÃO A MESMA APOSTA ═══
 *
 *  A torneira (lib/torneira.ts) faz o catálogo crescer pelo que os leitores procuram. É o
 *  mecanismo certo, e ele é REATIVO: alguém precisa procurar e não achar primeiro.
 *
 *  Esta lista é a parte PROATIVA da mesma aposta. Ela cobre o primeiro dia, quando ainda
 *  não há ninguém para procurar — e o primeiro dia é o único em que uma pessoa decide se
 *  volta.
 *
 *  ═══ POR AUTOR, E NÃO POR TÍTULO ═══
 *
 *  Uma lista de títulos envelhece em seis meses: sai um livro novo da Colleen Hoover e a
 *  lista está desatualizada. Uma lista de AUTORES envelhece em anos, e o Google Books
 *  devolve a obra inteira de cada um, inclusive o que ainda vai sair.
 *
 *  E ela é uma ESCOLHA, e não uma medição. Está escrita à mão, com o nome de quem escolheu
 *  em cima, exatamente como seed/canone.ts. Ninguém aqui entrou por algoritmo.
 *
 *  ═══ O QUE ELA NÃO FAZ ═══
 *
 *  Ela NÃO ordena a busca. Um autor não sobe no resultado por estar aqui. Ela decide o que
 *  EXISTE no acervo, e nunca o que aparece primeiro — que é a diferença entre um catálogo e
 *  um algoritmo, e é a promessa da home.
 * ════════════════════════════════════════════════════════════════════
 */

export type Origem =
  /** O romance contemporâneo que domina o feed: Hoover, Yarros, Maas, Hazelwood. */
  | "romance"
  /** Suspense e thriller de bancada de supermercado, que é onde muita gente volta a ler. */
  | "suspense"
  /** Fantasia e distopia, a porta de entrada de quem tem menos de vinte e cinco. */
  | "fantasia"
  /** O Brasil de agora. É a metade da lista que o mercado estrangeiro não cobre. */
  | "brasil"
  /** Não ficção que vira conversa: Harari, Matt Haig, ensaio. */
  | "ensaio";

export type AutorDoAgora = {
  /** Como se escreve no Brasil. É o nome que vai para a tela. */
  nome: string;
  origem: Origem;
  /** Uma linha de por quê. Se você não consegue escrever, o autor não devia estar aqui. */
  porque: string;
};

/* ─────────────────────────────────────────────────────────────────────
 *  O ROMANCE CONTEMPORÂNEO
 *
 *  É a parte da lista mais fácil de torcer o nariz e a mais importante de ter. O Gume não é
 *  um clube de quem já lê: ele é para quem PAROU de ler e quer voltar. Quase ninguém volta
 *  pela "Crítica da Razão Pura". Volta por um livro que a irmã mandou no zap.
 * ───────────────────────────────────────────────────────────────────── */
const ROMANCE: AutorDoAgora[] = [
  { nome: "Colleen Hoover", origem: "romance", porque: "o nome mais procurado da década no Brasil" },
  { nome: "Rebecca Yarros", origem: "romance", porque: "Fourth Wing: a torneira já registrou o pedido" },
  { nome: "Sarah J. Maas", origem: "romance", porque: "Corte de Espinhos e Rosas, a porta da fantasia romântica" },
  { nome: "Ali Hazelwood", origem: "romance", porque: "A Hipótese do Amor" },
  { nome: "Taylor Jenkins Reid", origem: "romance", porque: "Os Sete Maridos de Evelyn Hugo" },
  { nome: "Emily Henry", origem: "romance", porque: "romance de verão, e vende como água" },
  { nome: "Casey McQuiston", origem: "romance", porque: "Vermelho, Branco e Sangue Azul" },
  { nome: "Jenny Han", origem: "romance", porque: "O Verão Que Mudou Minha Vida" },
  { nome: "Alice Oseman", origem: "romance", porque: "Heartstopper: entra muito adolescente por aqui" },
  { nome: "Beth O'Leary", origem: "romance", porque: "romance britânico de grande circulação" },
  { nome: "Abby Jimenez", origem: "romance", porque: "romance contemporâneo, catálogo Arqueiro" },
  { nome: "Christina Lauren", origem: "romance", porque: "dupla de larga circulação no Brasil" },
];

/* ─────────────────────────────────────────────────────────────────────
 *  SUSPENSE E THRILLER
 * ───────────────────────────────────────────────────────────────────── */
const SUSPENSE: AutorDoAgora[] = [
  { nome: "Freida McFadden", origem: "suspense", porque: "A Empregada: fenômeno de 2023 para cá" },
  { nome: "Alex Michaelides", origem: "suspense", porque: "A Paciente Silenciosa" },
  { nome: "Holly Jackson", origem: "suspense", porque: "Boa Garota, Bom Sangue" },
  { nome: "Gillian Flynn", origem: "suspense", porque: "Garota Exemplar, o avô do gênero atual" },
  { nome: "Paula Hawkins", origem: "suspense", porque: "A Garota no Trem" },
  { nome: "Lucy Foley", origem: "suspense", porque: "suspense de casa fechada, catálogo Record" },
  { nome: "Raphael Montes", origem: "suspense", porque: "o suspense brasileiro que virou série" },
  { nome: "Ilana Casoy", origem: "suspense", porque: "true crime brasileiro" },
];

/* ─────────────────────────────────────────────────────────────────────
 *  FANTASIA E DISTOPIA
 * ───────────────────────────────────────────────────────────────────── */
const FANTASIA: AutorDoAgora[] = [
  { nome: "Leigh Bardugo", origem: "fantasia", porque: "Sombra e Ossos, Seis de Corvos" },
  { nome: "Suzanne Collins", origem: "fantasia", porque: "Jogos Vorazes, e ela voltou a publicar" },
  { nome: "V. E. Schwab", origem: "fantasia", porque: "A Vida Invisível de Addie LaRue" },
  { nome: "Brandon Sanderson", origem: "fantasia", porque: "o maior nome vivo da fantasia" },
  { nome: "Neil Gaiman", origem: "fantasia", porque: "Deuses Americanos, Sandman" },
  { nome: "Rick Riordan", origem: "fantasia", porque: "Percy Jackson: onde muita criança começa" },
  { nome: "Holly Black", origem: "fantasia", porque: "O Povo do Ar" },
  { nome: "Madeline Miller", origem: "fantasia", porque: "Circe, A Canção de Aquiles" },
  { nome: "Rebecca Kuang", origem: "fantasia", porque: "Babel, Yellowface" },
];

/* ─────────────────────────────────────────────────────────────────────
 *  O BRASIL DE AGORA
 *
 *  Esta é a metade da lista que nenhum catálogo estrangeiro vai trazer, e é a razão de o
 *  Gume existir em português. Se ela ficar curta, o app vira um Goodreads traduzido.
 * ───────────────────────────────────────────────────────────────────── */
const BRASIL: AutorDoAgora[] = [
  { nome: "Itamar Vieira Junior", origem: "brasil", porque: "Torto Arado: o livro brasileiro da década" },
  { nome: "Carla Madeira", origem: "brasil", porque: "Tudo é Rio: vendeu sozinho, no boca a boca" },
  { nome: "Jeferson Tenório", origem: "brasil", porque: "O Avesso da Pele" },
  { nome: "Conceição Evaristo", origem: "brasil", porque: "Becos da Memória, Ponciá Vicêncio" },
  { nome: "Djamila Ribeiro", origem: "brasil", porque: "Pequeno Manual Antirracista" },
  { nome: "Socorro Acioli", origem: "brasil", porque: "A Cabeça do Santo" },
  { nome: "Ana Paula Maia", origem: "brasil", porque: "De Gados e Homens" },
  { nome: "Eliana Alves Cruz", origem: "brasil", porque: "Solitária, Água de Barrela" },
  { nome: "Aline Bei", origem: "brasil", porque: "O Peso do Pássaro Morto" },
  { nome: "Ryane Leão", origem: "brasil", porque: "poesia que entrou por rede social e virou livro" },
  { nome: "Martha Batalha", origem: "brasil", porque: "A Vida Invisível de Eurídice Gusmão" },
  { nome: "Chico Buarque", origem: "brasil", porque: "romancista, e não só o que todo mundo pensa" },
  { nome: "Fernanda Torres", origem: "brasil", porque: "Fim, e o cinema trouxe leitor novo" },
  { nome: "Geovani Martins", origem: "brasil", porque: "O Sol na Cabeça" },
  { nome: "Paulo Scott", origem: "brasil", porque: "Marrom e Amarelo" },
  { nome: "Maria Valéria Rezende", origem: "brasil", porque: "Quarenta Dias" },
  { nome: "Natalia Timerman", origem: "brasil", porque: "Copo Vazio" },
  { nome: "Jarid Arraes", origem: "brasil", porque: "Redemoinho em Dia Quente" },
];

/* ─────────────────────────────────────────────────────────────────────
 *  ENSAIO E NÃO FICÇÃO
 * ───────────────────────────────────────────────────────────────────── */
const ENSAIO: AutorDoAgora[] = [
  { nome: "Yuval Noah Harari", origem: "ensaio", porque: "Sapiens: a torneira já registrou o pedido" },
  { nome: "Matt Haig", origem: "ensaio", porque: "A Biblioteca da Meia-Noite" },
  { nome: "James Clear", origem: "ensaio", porque: "Hábitos Atômicos" },
  { nome: "Michelle Obama", origem: "ensaio", porque: "Minha História" },
  { nome: "Chimamanda Ngozi Adichie", origem: "ensaio", porque: "Sejamos Todos Feministas" },
  { nome: "Silvio Almeida", origem: "ensaio", porque: "Racismo Estrutural" },
  { nome: "Ailton Krenak", origem: "ensaio", porque: "Ideias para Adiar o Fim do Mundo" },
  { nome: "Fredrik Backman", origem: "ensaio", porque: "Um Homem Chamado Ove" },
];

export const AGORA: AutorDoAgora[] = [
  ...ROMANCE,
  ...SUSPENSE,
  ...FANTASIA,
  ...BRASIL,
  ...ENSAIO,
];

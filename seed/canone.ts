/**
 * ════════════════════════════════════════════════════════════════════
 *  O CÂNONE. Os autores que o acervo do Gume tem, escolhidos a mão.
 *
 *  O catálogo do Gume tinha 414 mil edições vindas do dump da Open
 *  Library, e 336 mil livros SEM CAPA. Um catálogo grande não é um
 *  catálogo bom: é um armário onde o livro que você quer está atrás de
 *  duzentos que ninguém quis. Catálogo cresce fácil e encolhe difícil, e
 *  a hora de escolher é agora, enquanto encolher ainda é barato.
 *
 *  A aposta: começar com 300 autores, e abrir a torneira POR DEMANDA
 *  (ver lib/torneira.ts). Toda busca que não acha nada vira um pedido, e
 *  o pedido vira o próximo autor importado. Assim, todo livro que existir
 *  no Gume vai ter sido QUERIDO por alguém — ou por mim, aqui nesta
 *  lista, com o meu nome em cima; ou por um leitor, que procurou e não
 *  achou.
 *
 *  ═══ O QUE ESTA LISTA NÃO PODE FAZER ═══
 *
 *  Ela NÃO ordena a busca. Um autor não sobe no resultado por estar aqui:
 *  isso seria algoritmo de popularidade com outro nome, e é exatamente o
 *  que o Gume recusa. Ela NÃO vira grade de "livros populares" no
 *  Explorar — o Explorar é tela de GENTE. E ela não tem contador, nem
 *  posição, nem "mais lido": é uma escolha editorial assinada, e não uma
 *  métrica.
 *
 *  O cânone manda em TRÊS coisas, e só três:
 *    1. a prioridade do backfill de capa;
 *    2. as estantes curadas, feitas a mão;
 *    3. a parede da home deslogada.
 *
 *  (A regra está registrada em ai/DECISIONS.md e travada por teste em
 *  seed/canone.test.ts.)
 *
 *  ═══ POR QUE CADA UM TEM APELIDO ═══
 *
 *  O dump da Open Library é anglófono. Ele não conhece "Fiódor
 *  Dostoiévski": conhece "Fyodor Dostoevsky". Não conhece "Maquiavel":
 *  conhece "Niccolò Machiavelli". E o nome japonês vem em qualquer ordem,
 *  em qualquer romanização, às vezes em kanji.
 *
 *  Procurar o catálogo pelo nome que o BRASILEIRO escreve, num catálogo
 *  que guarda o nome que o AMERICANO escreveu, devolve zero — e um zero
 *  aqui não é "o autor não existe", é "eu não sei procurar". Os apelidos
 *  são o que impede a gente de confundir as duas coisas.
 * ════════════════════════════════════════════════════════════════════
 */

/** De onde este nome veio. Serve para o relatório, e para saber a quem cobrar. */
export type Origem =
  /** Escolha editorial: a lista que o idealizador escreveu a mão. */
  | "escolhido"
  /** Filosofia. O README promete um clube de filosofia, e a lista original não tinha um filósofo. */
  | "filosofia"
  /** O Brasil de rabo longo: o que a Antofágica, a 34 e a Martin Claret publicam. */
  | "brasil"
  /** Verdade de campo: já está na estante de alguém. Estes NUNCA saem. */
  | "estante"
  /** Literatura mundial, ciência, história e ensaio, para fechar os 300. */
  | "mundo"
  /**
   * A lusofonia que o acervo TEM e que a lista não tinha. Este bloco não foi
   * escolhido: ele foi DESCOBERTO, medindo o que a poda apagaria. Ver o bloco
   * LUSOFONIA lá embaixo — é a parte mais importante deste arquivo.
   */
  | "lusofonia";

export type AutorDoCanone = {
  /** Como se escreve no Brasil. É o nome que vai para a tela. */
  nome: string;
  /**
   * As outras grafias com que ele vai ser PROCURADO. Nome invertido, romanização,
   * transliteração, e sobretudo o INGLÊS — que é a língua do dump.
   */
  alias?: string[];
  origem: Origem;
  /**
   * Nome curto ou comum demais para casar sozinho ("ONE", "CLAMP", "Homero").
   * O casamento por similaridade daria falso positivo em cima de meio catálogo,
   * então estes exigem casamento EXATO. Ver seed/cobertura.mjs.
   */
  exato?: boolean;
};

/* ─────────────────────────────────────────────────────────────────────
 *  A. OS CLÁSSICOS
 * ───────────────────────────────────────────────────────────────────── */

const CLASSICOS: AutorDoCanone[] = [
  { nome: "Machado de Assis", alias: ["Joaquim Maria Machado de Assis"], origem: "escolhido" },
  { nome: "Clarice Lispector", origem: "escolhido" },
  {
    nome: "Jorge Amado",
    /**
     * "Jorge Leal Amado de Faria" é o nome de registro dele, e o acervo guarda 111
     * obras sob ESSE nome — contra 25 sob "Jorge Amado". A poda ia apagar as 111 e
     * salvar as 25, porque o casamento por nome não os reconhecia como a mesma pessoa.
     *
     * É o retrato da dívida dos 10.386 autores duplicados: o mesmo autor, várias
     * linhas, nenhuma delas sabendo das outras.
     */
    alias: ["Jorge Leal Amado de Faria", "Jorge Amado de Faria"],
    origem: "escolhido",
  },
  { nome: "Graciliano Ramos", origem: "escolhido" },
  { nome: "José de Alencar", origem: "escolhido" },
  { nome: "Aluísio Azevedo", alias: ["Aluisio Azevedo"], origem: "escolhido" },
  { nome: "Lima Barreto", alias: ["Afonso Henriques de Lima Barreto"], origem: "escolhido" },
  { nome: "João Guimarães Rosa", alias: ["Guimarães Rosa", "Joao Guimaraes Rosa"], origem: "escolhido" },
  { nome: "Carolina Maria de Jesus", origem: "escolhido" },
  { nome: "Monteiro Lobato", alias: ["José Bento Monteiro Lobato"], origem: "escolhido" },
  { nome: "Ariano Suassuna", origem: "escolhido" },
  { nome: "Rachel de Queiroz", alias: ["Raquel de Queiroz"], origem: "escolhido" },
  { nome: "Carlos Drummond de Andrade", alias: ["Drummond de Andrade"], origem: "escolhido" },
  { nome: "Cecília Meireles", alias: ["Cecilia Meireles"], origem: "escolhido" },
  { nome: "Fernando Pessoa", alias: ["Ricardo Reis", "Álvaro de Campos", "Alberto Caeiro"], origem: "escolhido" },
  { nome: "Eça de Queirós", alias: ["Eça de Queiroz", "Eca de Queiros", "José Maria de Eça de Queirós"], origem: "escolhido" },
  { nome: "José Saramago", alias: ["Jose Saramago"], origem: "escolhido" },
  { nome: "J. R. R. Tolkien", alias: ["J.R.R. Tolkien", "JRR Tolkien", "John Ronald Reuel Tolkien", "Tolkien"], origem: "escolhido" },
  { nome: "George Orwell", alias: ["Eric Arthur Blair"], origem: "escolhido" },
  { nome: "Agatha Christie", origem: "escolhido" },
  { nome: "Antoine de Saint-Exupéry", alias: ["Antoine de Saint Exupery", "Saint-Exupéry"], origem: "escolhido" },
  { nome: "Franz Kafka", origem: "escolhido" },
  { nome: "Jane Austen", origem: "escolhido" },
  { nome: "Fiódor Dostoiévski", alias: ["Fyodor Dostoevsky", "Fyodor Dostoyevsky", "Dostoiévski", "Dostoevskii", "Fedor Dostoievski"], origem: "escolhido" },
  { nome: "Liev Tolstói", alias: ["Leo Tolstoy", "Lev Tolstoy", "Tolstói", "Lev Nikolayevich Tolstoy"], origem: "escolhido" },
  { nome: "William Shakespeare", alias: ["Shakespeare"], origem: "escolhido" },
  { nome: "Edgar Allan Poe", alias: ["Edgar Alan Poe"], origem: "escolhido" },
  { nome: "Arthur Conan Doyle", alias: ["Sir Arthur Conan Doyle", "Conan Doyle"], origem: "escolhido" },
  { nome: "Oscar Wilde", origem: "escolhido" },
  { nome: "Mary Shelley", alias: ["Mary Wollstonecraft Shelley"], origem: "escolhido" },
  { nome: "Bram Stoker", alias: ["Abraham Stoker"], origem: "escolhido" },
  { nome: "Victor Hugo", origem: "escolhido" },
  { nome: "Alexandre Dumas", alias: ["Alexandre Dumas pai", "Alexandre Dumas père"], origem: "escolhido" },
  { nome: "Charles Dickens", origem: "escolhido" },
  { nome: "Lewis Carroll", alias: ["Charles Lutwidge Dodgson"], origem: "escolhido" },
  { nome: "Jules Verne", alias: ["Júlio Verne"], origem: "escolhido" },
  { nome: "Aldous Huxley", origem: "escolhido" },
  { nome: "Ray Bradbury", origem: "escolhido" },
  { nome: "C. S. Lewis", alias: ["C.S. Lewis", "Clive Staples Lewis", "CS Lewis"], origem: "escolhido" },
  { nome: "Gabriel García Márquez", alias: ["Gabriel Garcia Marquez", "García Márquez"], origem: "escolhido" },
  { nome: "Ernest Hemingway", origem: "escolhido" },
  { nome: "F. Scott Fitzgerald", alias: ["Francis Scott Fitzgerald", "Scott Fitzgerald"], origem: "escolhido" },
  { nome: "Albert Camus", origem: "escolhido" },
  { nome: "Virginia Woolf", origem: "escolhido" },
  { nome: "Miguel de Cervantes", alias: ["Cervantes", "Miguel de Cervantes Saavedra"], origem: "escolhido" },
  { nome: "Dante Alighieri", alias: ["Dante"], origem: "escolhido" },
  { nome: "Emily Brontë", alias: ["Emily Bronte"], origem: "escolhido" },
  { nome: "Harper Lee", alias: ["Nelle Harper Lee"], origem: "escolhido" },
  { nome: "J. D. Salinger", alias: ["J.D. Salinger", "Jerome David Salinger"], origem: "escolhido" },
  { nome: "Anne Frank", alias: ["Annelies Marie Frank"], origem: "escolhido" },
];

/* ─────────────────────────────────────────────────────────────────────
 *  A. OS CONTEMPORÂNEOS
 * ───────────────────────────────────────────────────────────────────── */

const CONTEMPORANEOS: AutorDoCanone[] = [
  { nome: "J. K. Rowling", alias: ["J.K. Rowling", "JK Rowling", "Joanne Rowling", "Robert Galbraith"], origem: "escolhido" },
  { nome: "Paulo Coelho", origem: "escolhido" },
  { nome: "Stephen King", alias: ["Richard Bachman"], origem: "escolhido" },
  { nome: "George R. R. Martin", alias: ["George R.R. Martin", "George RR Martin"], origem: "escolhido" },
  { nome: "Rick Riordan", origem: "escolhido" },
  { nome: "Suzanne Collins", origem: "escolhido" },
  { nome: "Stephenie Meyer", origem: "escolhido" },
  { nome: "Cassandra Clare", origem: "escolhido" },
  { nome: "John Green", origem: "escolhido" },
  { nome: "Nicholas Sparks", origem: "escolhido" },
  { nome: "Dan Brown", origem: "escolhido" },
  { nome: "Colleen Hoover", origem: "escolhido" },
  { nome: "Freida McFadden", origem: "escolhido" },
  { nome: "Taylor Jenkins Reid", origem: "escolhido" },
  { nome: "Sarah J. Maas", alias: ["Sarah J Maas", "Sarah Janet Maas"], origem: "escolhido" },
  { nome: "Rebecca Yarros", origem: "escolhido" },
  { nome: "Ali Hazelwood", origem: "escolhido" },
  { nome: "Emily Henry", origem: "escolhido" },
  { nome: "Jojo Moyes", alias: ["Pauline Sara Jo Moyes"], origem: "escolhido" },
  { nome: "Holly Black", origem: "escolhido" },
  { nome: "Leigh Bardugo", origem: "escolhido" },
  { nome: "Jenny Han", origem: "escolhido" },
  { nome: "Julia Quinn", origem: "escolhido" },
  { nome: "R. F. Kuang", alias: ["R.F. Kuang", "Rebecca F. Kuang", "Rebecca Kuang"], origem: "escolhido" },
  { nome: "Brandon Sanderson", origem: "escolhido" },
  { nome: "Neil Gaiman", origem: "escolhido" },
  { nome: "Haruki Murakami", alias: ["Murakami Haruki", "村上春樹"], origem: "escolhido" },
  { nome: "Elena Ferrante", origem: "escolhido" },
  { nome: "Chimamanda Ngozi Adichie", alias: ["Chimamanda Adichie"], origem: "escolhido" },
  { nome: "Khaled Hosseini", origem: "escolhido" },
  { nome: "Raphael Montes", origem: "escolhido" },
  { nome: "Itamar Vieira Junior", alias: ["Itamar Vieira Júnior"], origem: "escolhido" },
  { nome: "Carla Madeira", origem: "escolhido" },
  { nome: "Aline Bei", origem: "escolhido" },
  { nome: "Jeferson Tenório", alias: ["Jeferson Tenorio"], origem: "escolhido" },
  { nome: "Conceição Evaristo", alias: ["Conceicao Evaristo"], origem: "escolhido" },
  { nome: "Thalita Rebouças", alias: ["Thalita Reboucas"], origem: "escolhido" },
  { nome: "Paula Pimenta", origem: "escolhido" },
  { nome: "Eduardo Spohr", origem: "escolhido" },
  { nome: "Vitor Martins", origem: "escolhido" },
  { nome: "Augusto Cury", origem: "escolhido" },
  { nome: "Morgan Housel", origem: "escolhido" },
  { nome: "Robert Greene", origem: "escolhido" },
  { nome: "James Clear", origem: "escolhido" },
  { nome: "Yuval Noah Harari", alias: ["Yuval Harari"], origem: "escolhido" },
  { nome: "Brené Brown", alias: ["Brene Brown"], origem: "escolhido" },
  { nome: "Mark Manson", origem: "escolhido" },
  { nome: "Greg McKeown", origem: "escolhido" },
  { nome: "Ana Claudia Quintana Arantes", alias: ["Ana Cláudia Quintana Arantes"], origem: "escolhido" },
  { nome: "Junior Rostirola", alias: ["Júnior Rostirola"], origem: "escolhido" },
];

/* ─────────────────────────────────────────────────────────────────────
 *  A. O MANGÁ
 *
 *  Aqui o casamento vai ser SUJO, e a gente sabe disso antes de começar.
 *  O nome japonês vem em qualquer ordem (Oda Eiichiro / Eiichiro Oda), em
 *  qualquer romanização (Gotouge / Gotōge / Gotoge), e às vezes em kanji.
 *  Cada um leva o nome invertido e a romanização sem macron.
 *
 *  A aposta declarada: o dump da Open Library em português quase não tem
 *  mangá, e estes 50 vão dar quase zero. Se der, o número não é um
 *  fracasso — é o tamanho medido do buraco que o AniList preencheria.
 * ───────────────────────────────────────────────────────────────────── */

const MANGA: AutorDoCanone[] = [
  { nome: "Akira Toriyama", alias: ["Toriyama Akira", "鳥山明"], origem: "escolhido" },
  { nome: "Eiichiro Oda", alias: ["Oda Eiichiro", "Eiichirō Oda", "尾田栄一郎"], origem: "escolhido" },
  { nome: "Masashi Kishimoto", alias: ["Kishimoto Masashi", "岸本斉史"], origem: "escolhido" },
  { nome: "Tite Kubo", alias: ["Kubo Tite", "Noriaki Kubo", "久保帯人"], origem: "escolhido" },
  { nome: "Masami Kurumada", alias: ["Kurumada Masami", "車田正美"], origem: "escolhido" },
  { nome: "Kazuki Takahashi", alias: ["Takahashi Kazuki", "高橋和希"], origem: "escolhido" },
  { nome: "Yoshihiro Togashi", alias: ["Togashi Yoshihiro", "冨樫義博"], origem: "escolhido" },
  { nome: "Hirohiko Araki", alias: ["Araki Hirohiko", "荒木飛呂彦"], origem: "escolhido" },
  { nome: "Kentaro Miura", alias: ["Miura Kentaro", "Kentarō Miura", "三浦建太郎"], origem: "escolhido" },
  { nome: "Takehiko Inoue", alias: ["Inoue Takehiko", "井上雄彦"], origem: "escolhido" },
  { nome: "Naoki Urasawa", alias: ["Urasawa Naoki", "浦沢直樹"], origem: "escolhido" },
  { nome: "Osamu Tezuka", alias: ["Tezuka Osamu", "手塚治虫"], origem: "escolhido" },
  { nome: "Rumiko Takahashi", alias: ["Takahashi Rumiko", "高橋留美子"], origem: "escolhido" },
  { nome: "CLAMP", alias: ["Clamp"], origem: "escolhido", exato: true },
  { nome: "Naoko Takeuchi", alias: ["Takeuchi Naoko", "武内直子"], origem: "escolhido" },
  { nome: "Hiromu Arakawa", alias: ["Arakawa Hiromu", "荒川弘"], origem: "escolhido" },
  { nome: "Tsugumi Ohba", alias: ["Ohba Tsugumi", "大場つぐみ"], origem: "escolhido" },
  { nome: "Takeshi Obata", alias: ["Obata Takeshi", "小畑健"], origem: "escolhido" },
  { nome: "Hajime Isayama", alias: ["Isayama Hajime", "諫山創"], origem: "escolhido" },
  { nome: "Koyoharu Gotouge", alias: ["Gotouge Koyoharu", "Koyoharu Gotōge", "Koyoharu Gotoge", "吾峠呼世晴"], origem: "escolhido" },
  { nome: "Gege Akutami", alias: ["Akutami Gege", "芥見下々"], origem: "escolhido" },
  { nome: "Tatsuki Fujimoto", alias: ["Fujimoto Tatsuki", "藤本タツキ"], origem: "escolhido" },
  { nome: "Kōhei Horikoshi", alias: ["Kohei Horikoshi", "Horikoshi Kohei", "堀越耕平"], origem: "escolhido" },
  { nome: "Sui Ishida", alias: ["Ishida Sui", "石田スイ"], origem: "escolhido" },
  { nome: "ONE", alias: ["One"], origem: "escolhido", exato: true },
  { nome: "Yusuke Murata", alias: ["Murata Yusuke", "Yūsuke Murata", "村田雄介"], origem: "escolhido" },
  { nome: "Makoto Yukimura", alias: ["Yukimura Makoto", "幸村誠"], origem: "escolhido" },
  { nome: "Junji Ito", alias: ["Ito Junji", "Itō Junji", "伊藤潤二"], origem: "escolhido" },
  { nome: "Inio Asano", alias: ["Asano Inio", "浅野いにお"], origem: "escolhido" },
  { nome: "Haruichi Furudate", alias: ["Furudate Haruichi", "古舘春一"], origem: "escolhido" },
  { nome: "Muneyuki Kaneshiro", alias: ["Kaneshiro Muneyuki", "金城宗幸"], origem: "escolhido" },
  { nome: "Yusuke Nomura", alias: ["Nomura Yusuke", "Yūsuke Nomura", "ノ村優介"], origem: "escolhido" },
  { nome: "Yukinobu Tatsu", alias: ["Tatsu Yukinobu", "龍幸伸"], origem: "escolhido" },
  { nome: "Naoya Matsumoto", alias: ["Matsumoto Naoya", "松本直也"], origem: "escolhido" },
  { nome: "Tatsuya Endo", alias: ["Endo Tatsuya", "Tatsuya Endō", "遠藤達哉"], origem: "escolhido" },
  { nome: "Aka Akasaka", alias: ["Akasaka Aka", "赤坂アカ"], origem: "escolhido" },
  { nome: "Mengo Yokoyari", alias: ["Yokoyari Mengo", "横槍メンゴ"], origem: "escolhido" },
  { nome: "Ken Wakui", alias: ["Wakui Ken", "和久井健"], origem: "escolhido" },
  { nome: "Nakaba Suzuki", alias: ["Suzuki Nakaba", "鈴木央"], origem: "escolhido" },
  { nome: "Hiro Mashima", alias: ["Mashima Hiro", "真島ヒロ"], origem: "escolhido" },
  { nome: "Yūki Tabata", alias: ["Yuki Tabata", "Tabata Yuki", "田畠裕基"], origem: "escolhido" },
  { nome: "Kazue Kato", alias: ["Kato Kazue", "Kazue Katō", "加藤和恵"], origem: "escolhido" },
  { nome: "Ai Yazawa", alias: ["Yazawa Ai", "矢沢あい"], origem: "escolhido" },
  { nome: "Natsuki Takaya", alias: ["Takaya Natsuki", "高屋奈月"], origem: "escolhido" },
  { nome: "Paru Itagaki", alias: ["Itagaki Paru", "板垣巴留"], origem: "escolhido" },
  { nome: "Kamome Shirahama", alias: ["Shirahama Kamome", "白浜鴎"], origem: "escolhido" },
  { nome: "Kanehito Yamada", alias: ["Yamada Kanehito", "山田鐘人"], origem: "escolhido" },
  { nome: "Tsukasa Abe", alias: ["Abe Tsukasa", "アベツカサ"], origem: "escolhido" },
  { nome: "Yoshitoki Ōima", alias: ["Yoshitoki Oima", "Oima Yoshitoki", "大今良時"], origem: "escolhido" },
  { nome: "Sumiko Arai", alias: ["Arai Sumiko", "荒井すみこ"], origem: "escolhido" },
];

/* ─────────────────────────────────────────────────────────────────────
 *  B. FILOSOFIA
 *
 *  A lista original não tinha UM filósofo, e o README promete um clube de
 *  filosofia. Um clube de filosofia num catálogo sem Platão é uma sala
 *  vazia com uma placa na porta.
 *
 *  Todo mundo aqui leva o nome em inglês/latim como apelido, porque é
 *  assim que o dump os guarda.
 * ───────────────────────────────────────────────────────────────────── */

const FILOSOFIA: AutorDoCanone[] = [
  { nome: "Platão", alias: ["Plato", "Platao", "Pláton"], origem: "filosofia" },
  { nome: "Aristóteles", alias: ["Aristotle", "Aristoteles"], origem: "filosofia" },
  { nome: "Sêneca", alias: ["Seneca", "Seneca the Younger", "Lucius Annaeus Seneca", "Lúcio Aneu Sêneca"], origem: "filosofia" },
  { nome: "Marco Aurélio", alias: ["Marcus Aurelius", "Marco Aurelio"], origem: "filosofia" },
  { nome: "Epicteto", alias: ["Epictetus"], origem: "filosofia" },
  { nome: "René Descartes", alias: ["Descartes", "Rene Descartes"], origem: "filosofia" },
  { nome: "Immanuel Kant", alias: ["Kant"], origem: "filosofia" },
  { nome: "G. W. F. Hegel", alias: ["Hegel", "Georg Wilhelm Friedrich Hegel"], origem: "filosofia" },
  { nome: "Karl Marx", alias: ["Marx"], origem: "filosofia" },
  { nome: "Friedrich Nietzsche", alias: ["Nietzsche"], origem: "filosofia" },
  { nome: "Arthur Schopenhauer", alias: ["Schopenhauer"], origem: "filosofia" },
  { nome: "Søren Kierkegaard", alias: ["Soren Kierkegaard", "Kierkegaard"], origem: "filosofia" },
  { nome: "Jean-Paul Sartre", alias: ["Sartre", "Jean Paul Sartre"], origem: "filosofia" },
  { nome: "Simone de Beauvoir", alias: ["Beauvoir"], origem: "filosofia" },
  { nome: "Hannah Arendt", alias: ["Arendt"], origem: "filosofia" },
  { nome: "Michel Foucault", alias: ["Foucault"], origem: "filosofia" },
  { nome: "Byung-Chul Han", alias: ["Byung Chul Han", "Han Byung-Chul"], origem: "filosofia" },
  { nome: "Bertrand Russell", alias: ["Russell"], origem: "filosofia" },
  { nome: "Baruch Espinosa", alias: ["Baruch Spinoza", "Spinoza", "Espinosa", "Benedictus de Spinoza"], origem: "filosofia" },
  { nome: "Nicolau Maquiavel", alias: ["Niccolò Machiavelli", "Machiavelli", "Maquiavel", "Niccolo Machiavelli"], origem: "filosofia" },
  { nome: "Sun Tzu", alias: ["Sunzi", "Sun Tsu", "Sun-tzu", "孫子"], origem: "filosofia" },
  { nome: "Confúcio", alias: ["Confucius", "Confucio", "Kong Fuzi"], origem: "filosofia" },
];

/* ─────────────────────────────────────────────────────────────────────
 *  B. O BRASIL RABO-LONGO
 *
 *  O que a Antofágica, a 34 e a Martin Claret publicam: o Brasil que não
 *  está na lista de mais vendidos, mas que está na estante de todo mundo
 *  que lê a sério. Se o Gume não tiver isto, ele é uma livraria de
 *  aeroporto.
 * ───────────────────────────────────────────────────────────────────── */

const BRASIL: AutorDoCanone[] = [
  { nome: "Euclides da Cunha", origem: "brasil" },
  { nome: "Manuel Bandeira", origem: "brasil" },
  { nome: "Mário de Andrade", alias: ["Mario de Andrade"], origem: "brasil" },
  { nome: "Oswald de Andrade", origem: "brasil" },
  { nome: "Nelson Rodrigues", origem: "brasil" },
  { nome: "Rubem Braga", origem: "brasil" },
  { nome: "Rubem Fonseca", alias: ["Rubem Fonseca", "José Rubem Fonseca"], origem: "brasil" },
  { nome: "Hilda Hilst", origem: "brasil" },
  { nome: "Adélia Prado", alias: ["Adelia Prado"], origem: "brasil" },
  { nome: "Ferreira Gullar", alias: ["José Ribamar Ferreira"], origem: "brasil" },
  { nome: "Paulo Leminski", origem: "brasil" },
  { nome: "Cora Coralina", alias: ["Ana Lins dos Guimarães Peixoto Bretas"], origem: "brasil" },
  { nome: "Mia Couto", alias: ["António Emílio Leite Couto"], origem: "brasil" },
  { nome: "Luiz Ruffato", origem: "brasil" },
  { nome: "Milton Hatoum", origem: "brasil" },
  { nome: "Chico Buarque", alias: ["Francisco Buarque de Hollanda"], origem: "brasil" },
  { nome: "Caio Fernando Abreu", origem: "brasil" },
  { nome: "Silviano Santiago", origem: "brasil" },
];

/* ─────────────────────────────────────────────────────────────────────
 *  C. A ESTANTE — verdade de campo
 *
 *  Estes não são uma lista que alguém inventou: são gosto REAL, já
 *  registrado em seed/olegas-shelf.csv. Nenhum fica de fora, e o teste
 *  quebra o build se algum sair.
 *
 *  (Os que já apareciam nos grupos acima — Machado, Orwell, Tolkien,
 *  Jane Austen, Graciliano, Anne Frank, Saint-Exupéry, Marx, Maquiavel,
 *  Sun Tzu, Euclides — não se repetem aqui. O teste confere a lista
 *  inteira, e não este bloco.)
 * ───────────────────────────────────────────────────────────────────── */

const ESTANTE: AutorDoCanone[] = [
  { nome: "Aimé Césaire", alias: ["Aime Cesaire"], origem: "estante" },
  { nome: "Ale Santos", alias: ["Alexandre Santos"], origem: "estante" },
  { nome: "Aleister Crowley", origem: "estante" },
  { nome: "Arthur Rufino", origem: "estante" },
  { nome: "Austin Osman Spare", origem: "estante" },
  { nome: "Cornelia Funke", origem: "estante" },
  { nome: "Djamila Ribeiro", origem: "estante" },
  { nome: "Eduardo Bueno", origem: "estante" },
  { nome: "Fressin François", alias: ["François Fressin", "Fressin Francois"], origem: "estante" },
  { nome: "Gustavo Cerbasi", origem: "estante" },
  { nome: "Ian McEwan", origem: "estante" },
  { nome: "Ilana Casoy", origem: "estante" },
  { nome: "Johann Wolfgang von Goethe", alias: ["Goethe", "Johann Wolfgang Goethe"], origem: "estante" },
  { nome: "Krishna-Dwaipayana Vyasa", alias: ["Vyasa", "Vyasadeva", "Krishna Dwaipayana Vyasa"], origem: "estante" },
  { nome: "Lao She", alias: ["Shu Qingchun", "老舍"], origem: "estante" },
  { nome: "Marcelo Del Debbio", origem: "estante" },
  { nome: "Monja Coen", alias: ["Monja Cohen", "Coen Roshi"], origem: "estante" },
  { nome: "Patañjali", alias: ["Patanjali"], origem: "estante" },
  { nome: "Sarah M. Broom", alias: ["Sarah Broom"], origem: "estante" },
  { nome: "Swatmarama", alias: ["Svatmarama"], origem: "estante" },
  { nome: "Victoria Aveyard", origem: "estante" },
];

/* ─────────────────────────────────────────────────────────────────────
 *  D. O MUNDO — literatura, ciência, história e ensaio
 *
 *  O que faltava para fechar os 300. Aqui a régua foi: o autor que uma
 *  pessoa que lê a sério vai procurar no PRIMEIRO mês, e cuja ausência
 *  faria o catálogo parecer quebrado.
 * ───────────────────────────────────────────────────────────────────── */

const MUNDO: AutorDoCanone[] = [
  // ── Literatura mundial
  { nome: "Homero", alias: ["Homer"], origem: "mundo", exato: true },
  { nome: "Virgílio", alias: ["Virgil", "Publius Vergilius Maro", "Virgilio"], origem: "mundo" },
  { nome: "Sófocles", alias: ["Sophocles", "Sofocles"], origem: "mundo" },
  { nome: "Charlotte Brontë", alias: ["Charlotte Bronte"], origem: "mundo" },
  { nome: "Herman Melville", alias: ["Melville"], origem: "mundo" },
  { nome: "Mark Twain", alias: ["Samuel Clemens", "Samuel Langhorne Clemens"], origem: "mundo" },
  { nome: "Gustave Flaubert", alias: ["Flaubert"], origem: "mundo" },
  { nome: "Honoré de Balzac", alias: ["Balzac", "Honore de Balzac"], origem: "mundo" },
  { nome: "Marcel Proust", alias: ["Proust"], origem: "mundo" },
  { nome: "Anton Tchékhov", alias: ["Anton Chekhov", "Chekhov", "Tchekhov"], origem: "mundo" },
  { nome: "Mikhail Bulgákov", alias: ["Mikhail Bulgakov", "Bulgakov"], origem: "mundo" },
  { nome: "Thomas Mann", origem: "mundo" },
  { nome: "Hermann Hesse", alias: ["Herman Hesse"], origem: "mundo" },
  { nome: "Stefan Zweig", alias: ["Zweig"], origem: "mundo" },
  { nome: "James Joyce", origem: "mundo" },
  { nome: "Kazuo Ishiguro", alias: ["Ishiguro Kazuo"], origem: "mundo" },
  { nome: "Toni Morrison", alias: ["Chloe Ardelia Wofford"], origem: "mundo" },
  { nome: "James Baldwin", origem: "mundo" },
  { nome: "Maya Angelou", origem: "mundo" },
  { nome: "Octavia E. Butler", alias: ["Octavia Butler", "Octavia Estelle Butler"], origem: "mundo" },
  { nome: "Ursula K. Le Guin", alias: ["Ursula Le Guin", "Ursula K Le Guin"], origem: "mundo" },
  { nome: "Isaac Asimov", alias: ["Asimov"], origem: "mundo" },
  { nome: "Arthur C. Clarke", alias: ["Arthur Clarke", "Arthur C Clarke"], origem: "mundo" },
  { nome: "Philip K. Dick", alias: ["Philip K Dick", "Philip Kindred Dick"], origem: "mundo" },
  { nome: "Frank Herbert", origem: "mundo" },
  { nome: "H. G. Wells", alias: ["H.G. Wells", "Herbert George Wells", "HG Wells"], origem: "mundo" },
  { nome: "H. P. Lovecraft", alias: ["H.P. Lovecraft", "Howard Phillips Lovecraft", "HP Lovecraft"], origem: "mundo" },
  { nome: "Jorge Luis Borges", alias: ["Borges"], origem: "mundo" },
  { nome: "Julio Cortázar", alias: ["Julio Cortazar", "Cortázar"], origem: "mundo" },
  { nome: "Pablo Neruda", alias: ["Neruda"], origem: "mundo" },
  { nome: "Mario Vargas Llosa", alias: ["Vargas Llosa"], origem: "mundo" },
  { nome: "Isabel Allende", alias: ["Allende"], origem: "mundo" },
  { nome: "Juan Rulfo", origem: "mundo" },
  { nome: "Roberto Bolaño", alias: ["Roberto Bolano", "Bolaño"], origem: "mundo" },
  { nome: "Yukio Mishima", alias: ["Mishima Yukio", "三島由紀夫"], origem: "mundo" },
  { nome: "Yasunari Kawabata", alias: ["Kawabata Yasunari", "川端康成"], origem: "mundo" },
  { nome: "Natsume Sōseki", alias: ["Natsume Soseki", "Soseki Natsume", "夏目漱石"], origem: "mundo" },
  { nome: "Banana Yoshimoto", alias: ["Yoshimoto Banana", "吉本ばなな"], origem: "mundo" },
  { nome: "Chinua Achebe", alias: ["Achebe"], origem: "mundo" },
  { nome: "Orhan Pamuk", alias: ["Pamuk"], origem: "mundo" },
  { nome: "Umberto Eco", alias: ["Eco"], origem: "mundo" },
  { nome: "Italo Calvino", alias: ["Calvino"], origem: "mundo" },
  { nome: "Primo Levi", origem: "mundo" },
  { nome: "Milan Kundera", alias: ["Kundera"], origem: "mundo" },
  { nome: "Fernando Sabino", alias: ["Fernando Tavares Sabino"], origem: "mundo" },
  { nome: "Lygia Fagundes Telles", alias: ["Lygia Fagundes"], origem: "mundo" },
  { nome: "Érico Veríssimo", alias: ["Erico Verissimo"], origem: "mundo" },
  { nome: "Raduan Nassar", origem: "mundo" },

  // ── Ciência
  { nome: "Charles Darwin", alias: ["Darwin"], origem: "mundo" },
  { nome: "Carl Sagan", alias: ["Sagan"], origem: "mundo" },
  { nome: "Stephen Hawking", alias: ["Hawking"], origem: "mundo" },
  { nome: "Richard Dawkins", alias: ["Dawkins"], origem: "mundo" },
  { nome: "Richard Feynman", alias: ["Feynman"], origem: "mundo" },
  { nome: "Albert Einstein", alias: ["Einstein"], origem: "mundo" },
  { nome: "Oliver Sacks", origem: "mundo" },
  { nome: "Daniel Kahneman", alias: ["Kahneman"], origem: "mundo" },
  { nome: "Marcelo Gleiser", origem: "mundo" },
  { nome: "Jared Diamond", origem: "mundo" },
  { nome: "Sigmund Freud", alias: ["Freud"], origem: "mundo" },
  { nome: "Carl Gustav Jung", alias: ["Carl Jung", "C. G. Jung", "Jung"], origem: "mundo" },
  { nome: "Viktor Frankl", alias: ["Viktor E. Frankl"], origem: "mundo" },
  { nome: "Nise da Silveira", origem: "mundo" },

  // ── História
  { nome: "Heródoto", alias: ["Herodotus", "Herodoto"], origem: "mundo" },
  { nome: "Eric Hobsbawm", alias: ["Hobsbawm"], origem: "mundo" },
  { nome: "Sérgio Buarque de Holanda", alias: ["Sergio Buarque de Holanda"], origem: "mundo" },
  { nome: "Gilberto Freyre", origem: "mundo" },
  { nome: "Caio Prado Júnior", alias: ["Caio Prado Junior"], origem: "mundo" },
  { nome: "Darcy Ribeiro", origem: "mundo" },
  { nome: "Lilia Moritz Schwarcz", alias: ["Lilia Schwarcz"], origem: "mundo" },
  { nome: "Laurentino Gomes", origem: "mundo" },
  { nome: "Leandro Karnal", origem: "mundo" },

  // ── Ensaio e pensamento
  { nome: "Susan Sontag", alias: ["Sontag"], origem: "mundo" },
  { nome: "Walter Benjamin", origem: "mundo" },
  { nome: "Zygmunt Bauman", alias: ["Bauman"], origem: "mundo" },
  { nome: "Paulo Freire", origem: "mundo" },
  { nome: "bell hooks", alias: ["Bell Hooks", "Gloria Jean Watkins"], origem: "mundo" },
  { nome: "Angela Davis", alias: ["Angela Y. Davis"], origem: "mundo" },
  { nome: "Frantz Fanon", alias: ["Fanon"], origem: "mundo" },
  { nome: "Edward Said", alias: ["Edward W. Said"], origem: "mundo" },
  { nome: "Judith Butler", origem: "mundo" },
  { nome: "Silvio Almeida", alias: ["Sílvio Almeida", "Silvio Luiz de Almeida"], origem: "mundo" },
  { nome: "Sueli Carneiro", origem: "mundo" },
  { nome: "Lélia Gonzalez", alias: ["Lelia Gonzalez"], origem: "mundo" },
  { nome: "Ailton Krenak", alias: ["Krenak"], origem: "mundo" },
  { nome: "Davi Kopenawa", alias: ["Davi Kopenawa Yanomami"], origem: "mundo" },
  { nome: "Antonio Candido", alias: ["Antônio Cândido"], origem: "mundo" },
  { nome: "Marilena Chaui", alias: ["Marilena Chauí"], origem: "mundo" },
  { nome: "Milton Santos", origem: "mundo" },
  { nome: "Florestan Fernandes", origem: "mundo" },
];

/* ─────────────────────────────────────────────────────────────────────
 *  E. A LUSOFONIA — o bloco que a MEDIÇÃO exigiu
 *
 *  Este bloco não estava no plano. Ele existe porque a medição da poda
 *  (docs/poda.md) mostrou uma coisa que ninguém tinha visto:
 *
 *  A FORÇA DO ACERVO É EXATAMENTE A LITERATURA LUSÓFONA, e o cânone —
 *  montado a partir de best-seller, mangá e clássico internacional — não
 *  tinha quase nada dela.
 *
 *  A poda, como estava, teria apagado:
 *
 *      Luís de Camões ................ 213 obras
 *      Aquilino Ribeiro .............. 132
 *      Gil Vicente ................... 122
 *      Agustina Bessa-Luís ............ 99
 *      Camilo Castelo Branco .......... 98
 *      Antero de Quental .............. 94
 *      Joaquim Manuel de Macedo ....... 85
 *      José Lins do Rego .............. 76
 *      Padre António Vieira ........... 63
 *      Miguel Torga ................... 54
 *      António Lobo Antunes ........... 49
 *      Sophia de Mello Breyner ........ 47
 *      Vinícius de Moraes ............. 44
 *      Castro Alves ................... 42
 *
 *  …e mais uns quarenta. Um acervo de leitura em português que apaga
 *  Camões e guarda os cinquenta mangakás que ele não tem é um acervo que
 *  não entendeu o que ele é.
 *
 *  Isto é o que acontece quando a lista vem da cabeça e a poda vem do
 *  banco: a cabeça lembra do que ela lê, e o banco sabe do que ele tem.
 *  A lista só ficou boa depois de a medição contradizê-la.
 * ───────────────────────────────────────────────────────────────────── */

const LUSOFONIA: AutorDoCanone[] = [
  // ── Portugal
  { nome: "Luís de Camões", alias: ["Luis de Camoes", "Camões", "Luís Vaz de Camões"], origem: "lusofonia" },
  { nome: "Gil Vicente", origem: "lusofonia" },
  { nome: "Padre António Vieira", alias: ["António Vieira", "Antonio Vieira", "Antônio Vieira"], origem: "lusofonia" },
  { nome: "Camilo Castelo Branco", alias: ["Camilo Ferreira Botelho Castelo Branco"], origem: "lusofonia" },
  { nome: "Almeida Garrett", alias: ["João Baptista da Silva Leitão de Almeida Garrett"], origem: "lusofonia" },
  { nome: "Alexandre Herculano", origem: "lusofonia" },
  { nome: "Antero de Quental", origem: "lusofonia" },
  { nome: "Cesário Verde", alias: ["Cesario Verde", "José Joaquim Cesário Verde"], origem: "lusofonia" },
  { nome: "Bocage", alias: ["Manuel Maria Barbosa du Bocage"], origem: "lusofonia" },
  { nome: "Florbela Espanca", origem: "lusofonia" },
  { nome: "Mário de Sá-Carneiro", alias: ["Mario de Sa-Carneiro", "Mário de Sá Carneiro"], origem: "lusofonia" },
  { nome: "António Nobre", alias: ["Antonio Nobre"], origem: "lusofonia" },
  { nome: "José de Almada Negreiros", alias: ["Almada Negreiros"], origem: "lusofonia" },
  { nome: "Sophia de Mello Breyner Andresen", alias: ["Sophia de Mello Breyner", "Sophia Andresen"], origem: "lusofonia" },
  { nome: "Miguel Torga", alias: ["Adolfo Correia da Rocha"], origem: "lusofonia" },
  { nome: "Aquilino Ribeiro", origem: "lusofonia" },
  { nome: "Agustina Bessa-Luís", alias: ["Agustina Bessa Luís", "Agustina Bessa-Luis"], origem: "lusofonia" },
  { nome: "António Lobo Antunes", alias: ["Antonio Lobo Antunes", "Lobo Antunes"], origem: "lusofonia" },
  { nome: "Ferreira de Castro", alias: ["José Maria Ferreira de Castro"], origem: "lusofonia" },
  { nome: "Vergílio Ferreira", alias: ["Vergilio Ferreira"], origem: "lusofonia" },
  { nome: "José Cardoso Pires", alias: ["Jose Cardoso Pires"], origem: "lusofonia" },
  { nome: "Lídia Jorge", alias: ["Lidia Jorge"], origem: "lusofonia" },
  { nome: "Fialho de Almeida", origem: "lusofonia" },
  { nome: "Teófilo Braga", alias: ["Teofilo Braga"], origem: "lusofonia" },
  { nome: "Eugénio de Andrade", alias: ["Eugenio de Andrade"], origem: "lusofonia" },
  { nome: "Herberto Helder", origem: "lusofonia" },

  // ── Brasil, o que o acervo tem e a lista não tinha
  { nome: "Castro Alves", alias: ["Antônio Frederico de Castro Alves"], origem: "lusofonia" },
  { nome: "Gonçalves Dias", alias: ["Antônio Gonçalves Dias", "Antonio Goncalves Dias"], origem: "lusofonia" },
  { nome: "Olavo Bilac", origem: "lusofonia" },
  { nome: "Cruz e Sousa", alias: ["João da Cruz e Sousa"], origem: "lusofonia" },
  { nome: "Augusto dos Anjos", origem: "lusofonia" },
  { nome: "Casimiro de Abreu", origem: "lusofonia" },
  { nome: "Gregório de Matos", alias: ["Gregorio de Matos", "Gregório de Mattos"], origem: "lusofonia" },
  { nome: "Tomás Antônio Gonzaga", alias: ["Tomas Antonio Gonzaga"], origem: "lusofonia" },
  { nome: "Bernardo Guimarães", alias: ["Bernardo Guimaraes"], origem: "lusofonia" },
  { nome: "Joaquim Manuel de Macedo", origem: "lusofonia" },
  { nome: "Manuel Antônio de Almeida", alias: ["Manuel Antonio de Almeida"], origem: "lusofonia" },
  { nome: "Raul Pompeia", alias: ["Raul Pompéia"], origem: "lusofonia" },
  { nome: "Visconde de Taunay", alias: ["Alfredo d'Escragnolle Taunay", "Alfredo de Taunay"], origem: "lusofonia" },
  { nome: "Coelho Netto", alias: ["Henrique Coelho Netto"], origem: "lusofonia" },
  { nome: "José Lins do Rego", alias: ["José Lins do Rêgo", "Jose Lins do Rego"], origem: "lusofonia" },
  { nome: "Vinícius de Moraes", alias: ["Vinicius de Moraes", "Vinícius de Morais"], origem: "lusofonia" },
  { nome: "Mário Quintana", alias: ["Mario Quintana"], origem: "lusofonia" },
  { nome: "Manoel de Barros", origem: "lusofonia" },
  { nome: "Millôr Fernandes", alias: ["Millor Fernandes"], origem: "lusofonia" },
  { nome: "Paulo Mendes Campos", origem: "lusofonia" },
  { nome: "Otto Lara Resende", origem: "lusofonia" },
  { nome: "Rubem Alves", alias: ["Rubem A. Alves", "Rubem Azevedo Alves"], origem: "lusofonia" },
  { nome: "Leonardo Boff", origem: "lusofonia" },
  { nome: "Moacyr Scliar", origem: "lusofonia" },
  { nome: "Luis Fernando Verissimo", alias: ["Luís Fernando Veríssimo", "Luis Fernando Veríssimo"], origem: "lusofonia" },
  { nome: "Ana Maria Machado", origem: "lusofonia" },
  { nome: "Lygia Bojunga", alias: ["Lygia Bojunga Nunes"], origem: "lusofonia" },
  { nome: "Ruy Castro", alias: ["Rui Castro"], origem: "lusofonia" },
  { nome: "Carlos Heitor Cony", origem: "lusofonia" },
  { nome: "Dias Gomes", alias: ["Alfredo Dias Gomes"], origem: "lusofonia" },
  { nome: "Rui Barbosa", alias: ["Ruy Barbosa"], origem: "lusofonia" },
  { nome: "Sílvio Romero", alias: ["Silvio Romero"], origem: "lusofonia" },
  { nome: "Zélia Gattai", alias: ["Zelia Gattai"], origem: "lusofonia" },
  { nome: "Autran Dourado", origem: "lusofonia" },

  // ── África de língua portuguesa
  { nome: "Pepetela", alias: ["Artur Carlos Maurício Pestana dos Santos"], origem: "lusofonia" },
  { nome: "José Eduardo Agualusa", alias: ["Jose Eduardo Agualusa", "Agualusa"], origem: "lusofonia" },
  { nome: "Ondjaki", alias: ["Ndalu de Almeida"], origem: "lusofonia" },
  { nome: "Luandino Vieira", alias: ["José Luandino Vieira"], origem: "lusofonia" },
  { nome: "Paulina Chiziane", origem: "lusofonia" },
  { nome: "Germano Almeida", origem: "lusofonia" },
  { nome: "José Craveirinha", alias: ["Jose Craveirinha", "Craveirinha"], origem: "lusofonia" },
];

/**
 * O CÂNONE.
 *
 * O número é uma ESCOLHA, e o teste quebra o build se ele mudar sozinho — não porque
 * um número seja mágico, mas porque um número que ninguém defende vira três mil em
 * seis meses, e aí a gente está de volta ao armário de meio milhão de fichas que este
 * trabalho existe para desfazer.
 *
 * Ele já mudou uma vez: 300 → 367, quando a medição da poda mostrou que a lista dos
 * 300 apagaria Camões, Gil Vicente, Vieira, Camilo, Lobo Antunes, Sophia, Vinícius e
 * Castro Alves. Ver o bloco LUSOFONIA acima, e ai/DECISIONS.md.
 */
export const CANONE: AutorDoCanone[] = [
  ...CLASSICOS,
  ...CONTEMPORANEOS,
  ...MANGA,
  ...FILOSOFIA,
  ...BRASIL,
  ...ESTANTE,
  ...MUNDO,
  ...LUSOFONIA,
];

/** Todos os nomes pelos quais um autor pode ser procurado: o nome e os apelidos. */
export function grafias(a: AutorDoCanone): string[] {
  return [a.nome, ...(a.alias ?? [])];
}

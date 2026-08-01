import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O CELULAR ALCANÇA O APP INTEIRO.
 *
 *  ═══ O BUG QUE ESTE ARQUIVO EXISTE POR CAUSA DE ═══
 *
 *  A busca morava em dois lugares, e os dois eram do desktop: o campo dentro da coluna
 *  de vidro (`hidden … sm:flex`) e o atalho ⌘K — um atalho de TECLADO, num aparelho que
 *  não tem teclado.
 *
 *  Resultado: passada a tela de boas-vindas, quem estava no telefone não tinha NENHUM
 *  caminho até a busca. Nem para achar um livro, nem para cadastrar o que não existe no
 *  acervo. Achar um livro e pôr na estante é o app inteiro, e ele estava fora do alcance
 *  de metade das pessoas.
 *
 *  E não havia como perceber olhando: **não havia botão quebrado, havia botão nenhum.**
 *  Um bug que não deixa rastro na tela é um bug que só o usuário descobre — e ele não
 *  reclama, ele fecha o app.
 *
 *  ═══ POR QUE UM TESTE, E NÃO UM COMENTÁRIO ═══
 *
 *  Porque a regra é invisível. Quem mexer na barra de baixo amanhã vê quatro links e uma
 *  lupa, e a lupa parece a mais dispensável das cinco — ela não leva a lugar nenhum, ela
 *  dispara um evento. Sem este teste, ela sai num "limpei a navegação" e o buraco volta
 *  em silêncio, exatamente como ele nasceu.
 * ════════════════════════════════════════════════════════════════════
 */
/**
 * Fora os comentários.
 *
 * ═══ E ISTO NÃO É ZELO: A PRIMEIRA VERSÃO DESTE TESTE PASSOU SEM A LUPA ═══
 *
 * A lupa foi removida de propósito para conferir se o teste acusava, e ele ficou VERDE:
 * a palavra `abrirBusca` continuava na barra... dentro de um COMENTÁRIO que dizia "ver
 * abrirBusca()". O teste estava lendo a prosa que promete a trava, e não a trava.
 *
 * É o mesmo erro que `honras.regras.test.ts` já tinha documentado, cometido de novo uma
 * feature depois. Comentário não é código, e um teste que não sabe a diferença é um
 * teste que só serve para dar sossego.
 */
function semComentario(texto: string): string {
  return texto
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");
}

describe("o celular chega na busca", () => {
  const fonte = semComentario(readFileSync("components/sidebar.tsx", "utf8"));

  /** A barra de baixo é a única `<GlassBar as="nav">`, e ela é `sm:hidden`. */
  function barraDoCelular(): string {
    const inicio = fonte.indexOf('as="nav"');
    // A TRAVA DA TRAVA: um indexOf que não acha devolve -1, o slice sai torto, e o teste
    // passa sem ter olhado para nada. Teste que não sabe falhar é pior que teste nenhum.
    expect(inicio, "não achei a barra de baixo do celular: este teste está cego").toBeGreaterThan(0);

    const fim = fonte.indexOf("</GlassBar>", inicio);
    expect(fim, "não achei o fim da barra do celular: este teste está cego").toBeGreaterThan(inicio);

    return fonte.slice(inicio, fim);
  }

  it("a barra que o teste olha é mesmo a do celular", () => {
    expect(barraDoCelular(), "a barra de baixo deixou de ser só do celular").toContain("sm:hidden");
  });

  /**
   * O coração da coisa: um jeito de abrir a busca COM O DEDO. O ⌘K continua existindo
   * para quem tem teclado, e não substitui isto.
   */
  it("a barra de baixo abre a busca sem teclado", () => {
    expect(
      barraDoCelular(),
      "a busca sumiu do celular. Sem ela, quem está no telefone não tem como achar um " +
        "livro nem cadastrar o que falta, e o ⌘K não salva ninguém: celular não tem ⌘.",
    ).toContain("abrirBusca");
  });

  /**
   * E ela é uma função só, chamada pelos dois (o campo do desktop e a lupa do celular).
   * Duas cópias de "como se abre a busca" divergem no dia em que o atalho mudar, e aí uma
   * das duas para de abrir sem ninguém perceber.
   */
  it("desktop e celular abrem a busca pela mesma porta", () => {
    const chamadas = fonte.match(/abrirBusca/g) ?? [];
    expect(
      chamadas.length,
      "abrirBusca tem que ser declarada uma vez e chamada por dois: o campo do desktop e " +
        "a lupa do celular",
    ).toBeGreaterThanOrEqual(3); // a declaração + as duas chamadas
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  O MENU DO CELULAR NÃO MORA DENTRO DO VIDRO.
 *
 *  ═══ O SEGUNDO BUG SEM RASTRO, E ELE É PIOR QUE O DA BUSCA ═══
 *
 *  O menu era desenhado DENTRO da barra de vidro e subia para fora dela
 *  (`absolute bottom-full`). No WebKit — o Safari, e todo app que se instala pela
 *  tela de início do iPhone — um elemento com `backdrop-filter` RECORTA os filhos
 *  que passam das bordas dele. O menu abria e era cortado inteiro.
 *
 *  Levava junto tudo o que só se alcança por ali: o perfil, o sobre, o cuidar do
 *  acervo, o sair. Metade do app dependia de um menu invisível.
 *
 *  E o bug era invisível para quem escrevia o código: no Chrome do computador o
 *  menu aparece. Ele só existia para quem estava no telefone — que foi quem
 *  descobriu. De novo.
 *
 *  ═══ POR QUE UM TESTE ═══
 *
 *  Porque pôr o menu junto do botão que o abre é o que qualquer pessoa faria, e é
 *  exatamente o que quebra. A regra ("o painel é IRMÃO da barra, nunca filho") não
 *  se lê no lugar onde ela é violada, então ela tem que ser lida aqui.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o menu do celular escapa do vidro", () => {
  const fonte = semComentario(readFileSync("components/sidebar.tsx", "utf8"));

  /** Onde a barra de baixo termina. Tudo depois disto está FORA do vidro. */
  function fimDaBarraDoCelular(): number {
    const inicio = fonte.indexOf('as="nav"');
    expect(inicio, "não achei a barra de baixo do celular: este teste está cego").toBeGreaterThan(0);

    const fim = fonte.indexOf("</GlassBar>", inicio);
    expect(fim, "não achei o fim da barra do celular: este teste está cego").toBeGreaterThan(inicio);

    return fim;
  }

  /**
   * O corpo do MenuCelular: dali até a próxima declaração de função.
   *
   * Cortar no primeiro `\n}` foi a primeira tentativa, e ela parava no fecha-chaves do
   * TIPO das props — o teste lia meia assinatura e chamava aquilo de painel. Um recorte
   * torto não acusa nada: ele só concorda com o que sobrou.
   */
  function corpoDoMenu(inicio: number): string {
    const fim = fonte.indexOf("\nfunction ", inicio + 1);
    return fonte.slice(inicio, fim > inicio ? fim : fonte.length);
  }

  it("o painel existe, e é desenhado fora da barra de vidro", () => {
    const fim = fimDaBarraDoCelular();
    const usos = [...fonte.matchAll(/<MenuCelular/g)].map((m) => m.index ?? -1);

    expect(usos.length, "o menu do celular sumiu: sem ele não há perfil, sobre nem sair no telefone").toBe(1);
    expect(
      usos[0],
      "o menu do celular voltou para dentro da <GlassBar>. No iPhone o backdrop-filter " +
        "recorta os filhos que passam da borda, e ele abre invisível: o botão parece " +
        "quebrado e o app parece não ter perfil, sobre, nem sair.",
    ).toBeGreaterThan(fim);
  });

  /**
   * `fixed`, e não `absolute`: um painel posicionado em relação a um pai é um painel
   * que depende do pai, e é assim que ele volta para dentro do vidro sem ninguém notar.
   */
  it("o painel se posiciona sozinho, sem depender de um pai", () => {
    const inicio = fonte.indexOf("function MenuCelular");
    expect(inicio, "não achei o MenuCelular: este teste está cego").toBeGreaterThan(0);

    const painel = corpoDoMenu(inicio);
    expect(
      painel,
      "o menu do celular voltou a ser `absolute`: aí ele se pendura em quem o contém, " +
        "e basta esse alguém ser de vidro para ele sumir no iPhone.",
    ).toContain("fixed");
  });

  /**
   * As portas. Este menu é o ÚNICO teto delas no celular: no desktop elas são itens da
   * coluna, e no telefone a coluna não existe. Uma que caia daqui não cai para outro
   * lugar — ela some do aparelho inteiro.
   */
  it("o menu leva a tudo que só existe nele", () => {
    const inicio = fonte.indexOf("function MenuCelular");
    expect(inicio, "não achei o MenuCelular: este teste está cego").toBeGreaterThan(0);
    const painel = corpoDoMenu(inicio);

    for (const porta of ["/eu", "/sobre", "/contribuidores", "/apoiar"]) {
      expect(
        painel,
        `${porta} saiu do menu do celular, e o celular não tem outro caminho até lá`,
      ).toContain(`href="${porta}"`);
    }
  });

  /**
   * Tocar fora fecha. Sem isso o menu só fecha pelo próprio botão — que agora está
   * debaixo dele — e a pessoa fica presa num painel que não sabe dispensar.
   */
  it("dá para fechar o menu tocando fora dele", () => {
    expect(
      fonte,
      "o apanhador de toque sumiu: o menu do celular flutua solto e não fecha por fora",
    ).toContain("Fechar o menu");
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  A BARRA NÃO PERGUNTA AO NAVEGADOR QUEM ESTÁ LOGADO.
 *
 *  ═══ O BUG: "ENTRAR" PARA QUEM JÁ TINHA ENTRADO ═══
 *
 *  Ela descobria isso com `useSession()`, um hook que vai ao servidor DEPOIS que a
 *  tela apareceu. Até a resposta voltar, a barra desenhava a versão de visitante:
 *  sem Perfil (no lugar dele, "Entrar"), sem sino, sem as estantes inventadas.
 *
 *  Conserta sozinha um instante depois — e é isso que faz o bug parecer impressão
 *  de quem viu. No telefone, na primeira tela do app instalado (que abre frio toda
 *  vez, numa rede de celular), o instante dura o bastante para a pessoa olhar, não
 *  achar o perfil, e concluir que ele não existe.
 *
 *  ═══ POR QUE MORA NESTE ARQUIVO ═══
 *
 *  A regra vale para o app inteiro, mas o buraco é sempre o mesmo: o celular chega
 *  primeiro, com a rede pior, e vê o app num estado que o computador atravessa
 *  rápido demais para alguém notar. Este arquivo é a casa disso.
 *
 *  E o servidor JÁ SABIA: o layout nem renderiza esta barra para quem não entrou.
 *  Oferecer "Entrar" a quem está dentro não é lentidão, é a barra mentindo sobre
 *  quem está dentro.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a barra sabe quem entrou sem perguntar ao navegador", () => {
  const fonte = semComentario(readFileSync("components/sidebar.tsx", "utf8"));

  it("não existe hook de sessão na barra", () => {
    expect(
      fonte,
      "a barra voltou a descobrir quem está logado pelo navegador. Enquanto a resposta " +
        "não chega ela desenha a versão de visitante, e quem abre o app no telefone não " +
        "acha o próprio perfil na primeira tela.",
    ).not.toContain("useSession");
  });

  /**
   * A trava da trava: se o `eu` sumir da assinatura, o teste de cima continua verde
   * (não ter `useSession` é fácil: basta não ter identidade nenhuma). Um teste que só
   * proíbe não garante que sobrou o certo no lugar.
   */
  it("a identidade chega pronta, pela porta da frente", () => {
    expect(
      fonte,
      "a barra parou de receber quem está dentro pelo servidor: sem isso ela não tem " +
        "como saber, e vai acabar perguntando de novo ao navegador",
    ).toMatch(/eu:\s*QuemEntrou\s*\|\s*null/);
  });

  /** E o layout tem que passar de verdade, senão a prop existe e chega vazia sempre. */
  it("o layout diz à barra quem entrou", () => {
    const layout = semComentario(readFileSync("app/layout.tsx", "utf8"));
    expect(layout, "o layout parou de dizer à barra quem entrou").toMatch(/<Sidebar[\s\S]*?\beu=\{/);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  A BARRA DE BAIXO REPARTE A LARGURA, E POR ISSO NUNCA TRANSBORDA.
 *
 *  ═══ O BUG: O PERFIL FICAVA DEPOIS DA BORDA DA TELA ═══
 *
 *  Os seis itens tinham largura própria e a barra distribuía o que sobrasse. Numa
 *  tela de 390pt não sobrava: os seis pediam cerca de 460pt, e o último — o PERFIL
 *  — caía para fora. Quem estava no telefone via cinco e concluía que o perfil não
 *  existe. Aparecia dando zoom para trás, porque aí a barra inteira cabe no olho.
 *
 *  ═══ POR QUE ESTE TESTE NÃO MEDE PIXEL ═══
 *
 *  Medir largura de texto num teste exigiria fonte, motor de layout e um aparelho
 *  concreto — e amarraria a trava ao telefone de hoje, que é exatamente o erro que
 *  produziu o bug. O que dá para garantir sem nada disso é mais forte: que nenhum
 *  item peça mais do que lhe cabe. Com `flex-1 min-w-0` a conta não pode estourar,
 *  em nenhuma largura, porque não existe sobra a transbordar.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a barra de baixo cabe na tela", () => {
  const fonte = semComentario(readFileSync("components/sidebar.tsx", "utf8"));

  function barraDoCelular(): string {
    const inicio = fonte.indexOf('as="nav"');
    expect(inicio, "não achei a barra de baixo do celular: este teste está cego").toBeGreaterThan(0);
    const fim = fonte.indexOf("</GlassBar>", inicio);
    expect(fim, "não achei o fim da barra do celular: este teste está cego").toBeGreaterThan(inicio);
    return fonte.slice(inicio, fim);
  }

  it("nenhum item pede mais largura do que lhe cabe", () => {
    const medida = fonte.match(/const ITEM_DO_CELULAR =\s*\n?\s*"([^"]*)"/)?.[1];
    expect(medida, "a medida única dos itens da barra sumiu").toBeTruthy();
    expect(
      medida,
      "os itens da barra voltaram a ter largura própria. Numa tela estreita eles " +
        "somam mais que a barra e o último cai para fora — foi assim que o PERFIL " +
        "sumiu do telefone.",
    ).toContain("flex-1");
    // Sem `min-w-0` o conteúdo segura o item aberto e o `flex-1` não encolhe nada:
    // é a metade da trava que ninguém lembra, e sozinha a outra não funciona.
    expect(medida, "sem min-w-0 o flex-1 não consegue encolher o item").toContain("min-w-0");
  });

  /**
   * E TODOS usam ela. Um item escrito à mão no meio dos outros volta a ter largura
   * própria, e basta um para a conta estourar de novo.
   *
   * São QUATRO usos no código para seis itens na tela: os quatro lugares saem de um
   * `.map` e dividem uma linha só, e o perfil e o entrar são o mesmo lugar da barra
   * visto por quem entrou e por quem não entrou. Contar seis aqui é contar a tela e
   * não o código — foi o que a primeira versão deste teste fez, e ela quebrou na
   * própria barra que estava certa.
   */
  it("todos os itens usam a mesma medida", () => {
    const usos = barraDoCelular().match(/ITEM_DO_CELULAR/g) ?? [];
    expect(
      usos.length,
      "algum item da barra de baixo deixou de usar a medida comum: os quatro lugares " +
        "(num map), a busca, e o perfil ou o entrar",
    ).toBe(4);
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  TODO ITEM DA BARRA TEM NOME, E AGORA ELE É O ÚNICO QUE EXISTE.
   *
   *  Aqui morava "o rótulo corta em vez de vazar", que protegia a palavra embaixo do
   *  ícone. **A palavra saiu** — o dono escolheu ícone sem rótulo, contra a minha
   *  recomendação, e está registrado em ai/DECISIONS.md. Uma trava cujo alvo deixou
   *  de existir não pode ser apagada e esquecida: ela troca de alvo, e o alvo novo é
   *  mais duro que o velho.
   *
   *  Sem texto na tela, o `aria-label` deixou de ser reforço e virou O ÚNICO NOME de
   *  cada item. Sem ele, quem usa leitor de tela ouve "link, link, link" seis vezes e
   *  o app deixa de ter navegação — e ninguém que enxerga a tela jamais perceberia,
   *  porque para o olho continua tudo no lugar. É o mesmo feitio dos outros bugs
   *  deste arquivo: o que não deixa rastro.
   * ════════════════════════════════════════════════════════════════════
   */
  it("todo item da barra tem nome, mesmo sem palavra na tela", () => {
    const barra = barraDoCelular();

    // Nenhum rótulo na tela: é a decisão, e se ela voltar atrás este teste é o lugar
    // de contar isso, e não um `span` que reaparece sozinho num commit de outra coisa.
    expect(
      barra,
      "voltou rótulo à barra do celular. Se foi de propósito, mude esta trava junto e " +
        "diga por quê — a decisão de tirar está em ai/DECISIONS.md.",
    ).not.toContain("uppercase");

    const nomes = barra.match(/aria-label=/g) ?? [];
    expect(
      nomes.length,
      "algum item da barra ficou sem aria-label. Sem palavra na tela, ele é o único " +
        "nome que o item tem: quem usa leitor de tela ouve 'link' e mais nada.",
    ).toBe(4); // os quatro lugares (num map), a busca, e o perfil ou o entrar
  });
});

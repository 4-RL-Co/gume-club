/**
 * ════════════════════════════════════════════════════════════════════
 *  O VOCABULÁRIO DAS INSÍGNIAS. Sem banco de dados dentro.
 *
 *  ═══ A REGRA QUE FAZ O DESENHO FUNCIONAR ═══
 *
 *  As oito têm LUMINOSIDADE IDÊNTICA e SATURAÇÃO IDÊNTICA. Só o MATIZ
 *  muda. Em OKLCH: mesmo L, mesmo C, e só o H gira.
 *
 *  Isso torna MATEMATICAMENTE IMPOSSÍVEL uma parecer mais preciosa que a
 *  outra. Cor aqui é IDENTIDADE, e nunca hierarquia.
 *
 *  Não é preciosismo: é a única forma de garantir a promessa. "A gente
 *  vai tomar cuidado para nenhuma parecer melhor" é uma intenção, e
 *  intenção não sobrevive à quarta pessoa que mexe no CSS. Um L e um C
 *  travados sobrevivem, e o teste em lib/badges.sql.test.ts quebra o
 *  build se alguém mover qualquer um dos dois.
 *
 *  ═══ PROIBIDO, e não é gosto: é SEMÂNTICA ═══
 *
 *  - OURO, PRATA e BRONZE. Isso é um pódio, e todo mundo lê como pódio.
 *  - A paleta de raridade de jogo (cinza → verde → azul → roxo →
 *    laranja). Quem já jogou qualquer coisa decodifica essa escala
 *    instantaneamente, e passa a querer a laranja.
 *  - Glow animado, pulsante, gradiente arco-íris, holográfico, brilho
 *    "lendário".
 *  - Qualquer insígnia maior, mais brilhante ou mais saturada que as
 *    outras. Se uma brilhar mais forte, você criou um ranking sem
 *    perceber.
 * ════════════════════════════════════════════════════════════════════
 */

/** Mesma luminosidade, mesma saturação, para as oito. Só o H gira. */
export const L = 0.74;
export const C = 0.13;

/** O glow: MESMO raio e MESMO alpha para TODAS. */
export const GLOW_RAIO = 16;
export const GLOW_ALPHA = 0.26;

/**
 * ════════════════════════════════════════════════════════════════════
 *  O ACABAMENTO. Igual para as nove, e por isso ele pode ser caro.
 *
 *  "Os badges não estão tão premium quanto o acabamento das molduras."
 *
 *  Estava certo. E a saída NÃO podia ser dar mais brilho a uma que a outra — ouro
 *  contra prata é pódio, todo mundo lê pódio, e no instante em que uma placa parecer
 *  mais rica que a outra, a pessoa passa a QUERER aquela e o sistema inteiro cai.
 *
 *  Então o piso sobe para as nove ao mesmo tempo. Três coisas, e as três são de
 *  MATERIAL, e não de hierarquia:
 *
 *    · o BISEL — uma luz fina em cima e uma sombra fina embaixo. É o que faz uma
 *      superfície parecer ter espessura em vez de ser um retângulo pintado.
 *    · o VERNIZ — um degradê de cima para baixo, de 12% a 4%. Cor chapada é adesivo;
 *      cor com queda é objeto.
 *    · o GLOW, um pouco maior e um pouco mais fundo (12→16px, 0.22→0.26).
 *
 *  Nenhuma delas cria uma escada. Todas as nove ficam mais caras, juntas, e a regra
 *  matemática continua de pé: mesmo L, mesmo C, mesmo glow, e só o matiz girando.
 * ════════════════════════════════════════════════════════════════════
 */
export const VERNIZ_TOPO = 0.13;
export const VERNIZ_BASE = 0.04;
/** A luz do bisel, em cima. Branca, e não colorida: luz não tem matiz. */
export const BISEL_LUZ = 0.13;
/** A sombra do bisel, embaixo. */
export const BISEL_SOMBRA = 0.35;

export type Insignia =
  | "bibliotecario"
  | "moderador"
  | "zelador"
  | "apoiador"
  | "construtor"
  | "arauto"
  | "fundador"
  | "idealizador";

/**
 * ════════════════════════════════════════════════════════════════════
 *  `sobre`  é o que a insígnia É, em uma linha (aparece no perfil).
 *  `como`   é COMO SE GANHA, e ele é obrigatório.
 *
 *  Uma insígnia que ninguém sabe como conseguir não reconhece ninguém:
 *  ela vira um enfeite misterioso, e enfeite misterioso vira boato ("acho
 *  que é pra quem lê muito"). O próprio dono do projeto não lembrava mais
 *  a diferença entre bibliotecário e zelador, e isso era um sintoma.
 *
 *  ═══ TODAS SE GANHAM SOZINHAS ═══
 *
 *  Nenhuma depende de alguém lembrar de dá-la. Um cargo distribuído à mão
 *  faz do dono um gargalo, e depois um porteiro.
 *
 *  A ÚNICA exceção é o IDEALIZADOR, e ela é honesta: ninguém pode
 *  "conseguir" ter imaginado uma coisa. Não há o que desbloquear, logo
 *  não há por que ser automática.
 * ════════════════════════════════════════════════════════════════════
 */
export const INSIGNIAS: Record<
  Insignia,
  { label: string; sobre: string; como: string; matiz: number; icone: string }
> = {
  bibliotecario: {
    label: "bibliotecário",
    // NUNCA "passou no curso": o curso não existe, e uma insígnia que promete uma
    // porta que não existe é uma insígnia que mente. O critério real está em
    // lib/librarian.ts, e a tela /insignias o explica em português de gente.
    sobre: "cuida do acervo: aprova capa, arruma ficha errada e desfaz estrago",
    como:
      "É o zelador que continuou. Confere as capas que as pessoas propõem, conserta ficha com editora, ano ou autor errado, e desfaz o que alguém estragou de propósito. Ela chega sozinha em quem já fez cinquenta correções que ficaram de pé e tem conta há mais de trinta dias, e toma o lugar da de zelador: é a mesma insígnia, um degrau acima. Ninguém precisa te dar.",
    matiz: 265, // índigo
    icone: "Stamp",
  },
  /**
   * MODERADOR. A segunda concedida, e pelo mesmo motivo da primeira.
   *
   * Ela não é DESBLOQUEÁVEL: ninguém "consegue" a confiança de outra pessoa fazendo
   * mais alguma coisa. Poder sobre livro se ganha por trabalho; poder sobre GENTE se
   * ganha por confiança, e confiança não é uma consulta.
   *
   * Por isso ela não precisa ser automática, e não tem barra: não existe "68% de ser
   * confiável". Ver lib/moderacao.ts.
   *
   * ═══ O TEXTO DIZ O QUE A PESSOA FAZ, E NÃO COMO ELA É ESCOLHIDA ═══
   *
   * A primeira versão dizia "não se conquista; isso não se destrava fazendo mais
   * alguma coisa". Estava correta e não servia para nada: ela explicava a REGRA
   * ANTI-FARM, que é uma preocupação de quem construiu o app, e não uma informação de
   * quem lê. Quem chega nesta tela quer saber o que essa pessoa FAZ aqui dentro.
   */
  moderador: {
    label: "moderador",
    sobre: "cuida da convivência daqui: das pessoas, e não do catálogo",
    como:
      "É quem cuida da comunidade: acolhe quem chega, ajuda a manter a conversa boa entre os leitores, olha as denúncias e tira do ar quem veio para atrapalhar. É trabalho de convivência, e não de ficha de livro. Quem imaginou o Gume é quem convida.",
    matiz: 220, // azul. 45° de folga do índigo (265°) e 44° do construtor (176°): nenhuma cor colide.
    icone: "ShieldCheck",
  },
  /**
   * ═══ ZELADOR É O PRIMEIRO DEGRAU DE BIBLIOTECÁRIO, E NÃO OUTRA INSÍGNIA ═══
   *
   * As duas são o MESMO trabalho — consertar o catálogo — e a única diferença entre elas
   * é quantas correções: dez, e cinquenta.
   *
   * No perfil elas apareciam LADO A LADO, e diziam a mesma coisa duas vezes. Duas
   * insígnias para um trabalho só não reconhecem o dobro: elas dividem o reconhecimento e
   * enchem o perfil de quem mais trabalhou — o oposto do que a insígnia existe para
   * fazer.
   *
   * Agora ela EVOLUI: quem chega a bibliotecário não ganha mais uma, sobe. A troca
   * acontece em `getBadgesOf` (lib/badges.ts), e o texto abaixo diz isso em voz alta —
   * senão a pessoa vê a sua insígnia SUMIR e acha que perdeu alguma coisa.
   */
  zelador: {
    label: "zelador",
    sobre: "arruma o que está errado nos livros, sem que ninguém peça",
    como:
      "Achou uma editora trocada, um ano errado, um nome de autor escrito torto, e consertou. Dez correções que ficaram de pé, e ela é sua. É o primeiro degrau de quem cuida do acervo: às cinquenta, ela vira bibliotecário.",
    /**
     * 340°, rosa-carmim. Era **175° (verde-água), e teve que sair**.
     *
     * O accent do Gume virou a LÂMINA — #7DD3C0, verde-água, matiz 167°. Uma insígnia a
     * 175° fica a OITO GRAUS da cor da marca: são a mesma cor.
     *
     * E aí a cor para de dizer qualquer coisa. O accent quer dizer "o app está falando
     * com você"; a insígnia quer dizer "esta pessoa cuida do acervo". O olho não aprende
     * duas coisas com a mesma cor — ele desiste das duas.
     *
     * ═══ E ELA SAIU DO ROSA TAMBÉM ═══
     *
     * O rosa (340°) passou a ser do APOIADOR, e só dele. Duas insígnias rosas seriam
     * "quem cuida do catálogo" e "quem paga a conta" com a mesma cara — e essas duas são
     * exatamente as que o Gume mais precisa que ninguém confunda.
     *
     * 133° é o vão que sobrou: 33° do oliva (100°) e 34° do accent (167°). Verde, que é
     * a cor de quem cuida de uma coisa viva.
     */
    matiz: 133, // verde
    icone: "Brush",
  },
  construtor: {
    label: "construtor",
    // O nome é largo, o critério é ESTREITO: PR mesclado, e só. Nunca "ajudou de
    // alguma forma", porque "de alguma forma" é o começo de toda insígnia inflada.
    sobre: "construiu um pedaço do Gume, e ele está no ar",
    como:
      "Você fez uma parte do Gume (uma tela, um conserto, uma melhoria) e ela entrou no app que todo mundo usa. O Gume é aberto: qualquer pessoa pode propor uma mudança, e o que for bom fica. Ela chega sozinha quando a sua conta do GitHub estiver ligada aqui.",
    /**
     * 176°, ciano-esverdeado. Era 300° (violeta) — e o accent do Gume virou
     * lilás, matiz 308° (era verde-água, 178°). A 8° de distância, violeta
     * e o novo accent seriam a mesma cor: o accent quer dizer "o app está
     * falando com você", e a insígnia quer dizer "esta pessoa construiu uma
     * parte do Gume". Ver ai/DECISIONS.md.
     *
     * 176° é o vão que o accent deixou vago ao se mudar: 43° do verde
     * (133°) e 44° do azul (220°). Nenhuma cor colide.
     */
    matiz: 176,
    icone: "Hammer",
  },
  arauto: {
    label: "arauto",
    sobre: "trouxe gente para cá, e essa gente ficou",
    como:
      "Cinco pessoas entraram no Gume por sua causa, e cada uma delas tem pelo menos dez livros na estante. Não vale convidar por convidar: só conta quem veio e ficou de verdade.",
    matiz: 65, // âmbar
    icone: "Megaphone",
  },
  fundador: {
    label: "membro fundador",
    sobre: "estava aqui quando isto ainda era quase nada",
    como:
      "Você está entre as cem primeiras pessoas do Gume, e o seu número de chegada fica na insígnia. Chegou quando a estante estava vazia e ainda não dava para saber se ia dar certo. Não tem como conquistar depois: ou você chegou cedo, ou não chegou.",
    matiz: 25, // terracota
    icone: "Flag",
  },
  /**
   * A NONA, e ela é única em QUEM a tem, e nunca em como ela BRILHA.
   *
   * Só uma pessoa imaginou o Gume, e isso é um fato, não um mérito acumulável: não
   * dá para farmar "ter tido a ideia". Por isso ela cabe aqui sem quebrar nada.
   *
   * Ela tem o MESMO L, o MESMO C, o MESMO glow e o MESMO glifo de traço que as
   * outras oito. Se um dia ela brilhar mais forte, o sistema inteiro cai junto: a
   * promessa não é "todo mundo tem as mesmas insígnias", é "nenhuma insígnia vale
   * mais que outra". Ver ai/DECISIONS.md.
   */
  /**
   * ════════════════════════════════════════════════════════════════════
   *  O APOIADOR. E ela contradiz uma regra escrita deste repo.
   *
   *  O docs/design.md dizia, com todas as letras:
   *
   *      "Quem apoia COMPROU um selo; quem tem uma insígnia DOOU trabalho. Se os dois
   *       se parecerem, a mensagem que sobra é 'dá para comprar mérito', e isso mata a
   *       página de contribuidores inteira: a partir daí ninguém mais sabe, olhando,
   *       quem trabalhou e quem pagou."
   *
   *  O dono do produto decidiu que o apoiador tem insígnia. A decisão é dele, e o medo
   *  daquela regra continua certo — então o que ela protegia foi guardado em outro lugar:
   *
   *    1. **A insígnia DIZ que se paga.** Está escrito no `sobre` e no `como`, e aparece
   *       na tela que explica as insígnias. Ninguém vai olhar para ela achando que a
   *       pessoa doou trabalho, porque a própria insígnia conta o que ela é.
   *
   *    2. **Ela NÃO entra em /contribuidores.** Aquela página é sobre TRABALHO — quem
   *       escreveu código e quem consertou ficha — e ela é a única do app com número.
   *       Pagar não põe ninguém naquela lista, e nunca vai pôr.
   *
   *  A honestidade sobre o que a insígnia é vale mais do que escondê-la. Um selo cinza
   *  discreto que ninguém entende protege menos do que uma insígnia que diz, na cara:
   *  "esta pessoa paga a conta do servidor".
   * ════════════════════════════════════════════════════════════════════
   */
  apoiador: {
    label: "apoiador",
    sobre: "paga a conta do servidor, para o Gume existir de graça para os outros",
    como:
      "Esta não se conquista: ela se paga. Quem apoia o Gume mantém o servidor no ar e o app sem anúncio, e isso é uma forma de contribuir como qualquer outra. Ela não vale mais nem menos que as outras, e ela não entra na página de quem faz: aquela lista é sobre trabalho.",
    matiz: 340, // rosa. A mesma cor de "quem faz" e da moldura de apoiador: apoiar é contribuir.
    icone: "HeartHandshake",
  },

  idealizador: {
    label: "idealizador",
    sobre: "teve a ideia do Gume e começou a construir",
    como:
      "É de quem imaginou este lugar e começou a fazê-lo existir. Não tem como conquistar, e nem deveria: ter tido uma ideia não é mérito que se acumula. É só um fato, e ele é de uma pessoa só.",
    matiz: 100, // oliva. 35° de folga do âmbar e 35° do verde: nenhuma cor colide.
    icone: "Compass",
  },
};

/**
 * A ORDEM DE EXIBIÇÃO, e ela é SEMPRE esta.
 *
 * Nunca por raridade, nunca por data, nunca por quantas a pessoa tem. Ordem fixa é
 * o que impede o olho de ler hierarquia: se ela mudasse por raridade, a primeira
 * posição viraria um prêmio, e a última, um consolo.
 */
export const ORDEM: Insignia[] = [
  "bibliotecario",
  // O MODERADOR entra logo depois do bibliotecário, e não numa das pontas: a primeira
  // posição é lida como prêmio e a última como consolo, e as duas continuam travadas.
  "moderador",
  "zelador",
  "construtor",
  /*
   * O APOIADOR fica no MEIO, junto com o idealizador, e pela mesma razão: as pontas são
   * onde o olho lê hierarquia. A insígnia de quem PAGA numa ponta seria a pior de todas
   * — a primeira posição diria "isto é o que mais vale", e é exatamente a leitura que
   * este sistema existe para não permitir.
   */
  "apoiador",
  /*
   * O IDEALIZADOR fica no MEIO, e isso é deliberado. A PRIMEIRA posição é lida como
   * prêmio e a ÚLTIMA como consolo: as duas pontas são onde o olho lê hierarquia, e uma
   * insígnia única numa delas criaria exatamente a escada que este sistema não tem.
   *
   * Ele foi PARAR na última quando o semeador saiu (migration 0046, doar/trocar/emprestar
   * removidos), e teve que voltar para o meio. Uma remoção que reordena a lista sem
   * ninguém olhar é como uma hierarquia nasce por acidente.
   */
  "idealizador",
  "arauto",
  "fundador",
];

/** A cor de uma insígnia. Uma função só, para não existir uma segunda verdade. */
export function cor(i: Insignia, alpha = 1): string {
  return `oklch(${L} ${C} ${INSIGNIAS[i].matiz} / ${alpha})`;
}

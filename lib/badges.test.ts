import { readFileSync } from "node:fs";
import { META } from "@/lib/badges";
import { describe, it, expect } from "vitest";
import { INSIGNIAS, ORDEM, L, C, GLOW_RAIO, GLOW_ALPHA, cor } from "@/lib/badges-view";

/**
 * ════════════════════════════════════════════════════════════════════
 *  Este arquivo não testa uma função. Ele trava uma PROMESSA.
 *
 *  A promessa é: nenhuma insígnia parece mais preciosa que outra. E ela
 *  não sobrevive como intenção — "a gente vai tomar cuidado" não passa
 *  pela quarta pessoa que mexe no CSS. Ela sobrevive como aritmética:
 *  mesmo L, mesmo C, mesmo glow, e só o matiz girando.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * O CÓDIGO, sem os comentários.
 *
 * Sem isto, este arquivo se autossabota: o comentário que PROÍBE ouro, prata e
 * bronze contém as palavras "ouro", "prata" e "bronze", e o comentário que proíbe o
 * círculo no selo de apoiador contém "rounded-full". Uma varredura de texto cru
 * acusaria a própria regra de violar a regra. O que vale é o que executa.
 */
const CODIGO = readFileSync(new URL("../components/badges.tsx", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("são OITO, e são estas oito", () => {
  it("nem mais, nem menos", () => {
    /**
     * ═══ ERAM OITO, E O SEMEADOR SAIU ═══
     *
     * O semeador era dado a quem passava um exemplar adiante — e ele era lindo, porque
     * quem dava a insígnia não era quem DOOU: era a estante de quem RECEBEU, dizendo de
     * onde o livro veio. Ninguém se declarava semeador.
     *
     * Doar, trocar e emprestar saíram do Gume (migration 0046): aquilo empurrava o app
     * para ser um lugar de transação entre pessoas, e trazia um peso de moderação mesmo
     * quando dava certo.
     *
     * **Ninguém mais recebe um livro de ninguém, então ninguém mais pode ser semeador.**
     * Uma insígnia que não tem mais como ser conquistada não fica de enfeite no catálogo:
     * ela sai, ou vira uma promessa que o app não cumpre.
     *
     * A promessa nunca foi "todo mundo tem as mesmas insígnias" (bibliotecário também
     * não é de todo mundo): foi "NENHUMA VALE MAIS QUE OUTRA", e é isso que os testes
     * abaixo continuam travando.
     */
    expect(Object.keys(INSIGNIAS)).toHaveLength(8);
    expect(ORDEM).toHaveLength(8);
  });

  it("a ordem de exibição é FIXA, e cobre todas", () => {
    // Nunca por raridade, nunca por data, nunca por quantas a pessoa tem. Ordem fixa é
    // o que impede o olho de ler hierarquia: se ela mudasse por raridade, a primeira
    // posição viraria prêmio e a última, consolo.
    expect([...ORDEM].sort()).toEqual(Object.keys(INSIGNIAS).sort());
    /**
     * As PONTAS não se mexem, e isso é o que segura a nona insígnia.
     *
     * A primeira posição é lida como prêmio e a última como consolo. Uma insígnia
     * nova que chegasse numa das duas pontas criaria a hierarquia que este sistema
     * inteiro existe para não ter. O idealizador entrou no MEIO, de propósito.
     */
    /**
     * As PONTAS são as posições que o olho lê como hierarquia: a primeira vira
     * prêmio, a última vira consolo. Elas ficam travadas para que uma insígnia nova
     * (ou a saída de uma velha) não crie essa escada sem ninguém perceber.
     *
     * A última era "semeador", que saiu junto com doar/trocar/emprestar. Quando ele
     * saiu, o IDEALIZADOR caiu na última posição sozinho — e a última é lida como
     * consolo. Ele voltou para o meio, e a ponta virou o fundador.
     *
     * Uma remoção que reordena a lista sem ninguém olhar é como uma hierarquia nasce
     * por acidente.
     */
    expect(ORDEM[0], "a ordem mudou").toBe("bibliotecario");
    expect(ORDEM.at(-1), "a ordem mudou").toBe("fundador");

    // E o idealizador nunca numa ponta.
    expect(ORDEM.indexOf("idealizador")).toBeGreaterThan(0);
    expect(ORDEM.indexOf("idealizador")).toBeLessThan(ORDEM.length - 1);
  });
});

describe("nenhuma pode parecer mais preciosa que outra", () => {
  it("as oito têm LUMINOSIDADE e SATURAÇÃO idênticas: só o matiz gira", () => {
    for (const chave of ORDEM) {
      const c = cor(chave);
      expect(
        c,
        `a insígnia "${chave}" saiu da paleta. As oito têm o mesmo L (${L}) e o mesmo C (${C}); ` +
          "só o H muda. É assim que fica MATEMATICAMENTE IMPOSSÍVEL uma parecer mais " +
          "valiosa. Cor aqui é identidade, nunca hierarquia.",
      ).toContain(`oklch(${L} ${C} `);
    }
  });

  it("os oito matizes são distintos, e bem separados", () => {
    // Se dois matizes ficarem colados, duas insígnias viram a mesma cor, e a cor deixa
    // de identificar coisa alguma.
    const matizes = ORDEM.map((i) => INSIGNIAS[i].matiz).sort((a, b) => a - b);
    expect(new Set(matizes).size).toBe(8);

    for (let i = 1; i < matizes.length; i++) {
      const [antes, agora] = [matizes[i - 1]!, matizes[i]!];
      expect(
        agora - antes,
        `dois matizes ficaram a menos de 30° um do outro (${antes}° e ${agora}°): ` +
          "as duas insígnias viram a mesma cor.",
      ).toBeGreaterThanOrEqual(30);
    }
  });

  /**
   * ═══ E NENHUMA DELAS PODE SER A COR DA MARCA ═══
   *
   * O accent do Gume é a LÂMINA: #7DD3C0, verde-água, matiz **167°**.
   *
   * A insígnia de zelador era 175° — oito graus. São a mesma cor. E aí a cor para de
   * dizer qualquer coisa: o accent quer dizer "o app está falando com você", e a
   * insígnia quer dizer "esta pessoa cuida do acervo". O olho não aprende duas coisas
   * com a mesma cor; ele desiste das duas.
   *
   * Isso não estava em teste nenhum, e só apareceu no dia em que o accent mudou. Agora
   * está: se alguém trocar o accent de novo, ou puxar uma insígnia para perto dele, a
   * build quebra.
   */
  it("nenhuma insígnia tem a cor do accent", () => {
    // #7DD3C0. Se o accent mudar, este número muda com ele — de propósito: é o teste que
    // obriga a pessoa a olhar para as oito insígnias antes de trocar a cor do app.
    const ACCENT = 167;

    for (const nome of ORDEM) {
      const matiz = INSIGNIAS[nome].matiz;

      // A distância no CÍRCULO: 350° e 10° estão a vinte graus, e não a trezentos e quarenta.
      const bruta = Math.abs(matiz - ACCENT);
      const distancia = Math.min(bruta, 360 - bruta);

      expect(
        distancia,
        `a insígnia "${nome}" está a ${distancia}° do accent (${matiz}° contra ${ACCENT}°): ` +
          "ela vira a cor da marca, e a cor deixa de identificar as duas.",
      ).toBeGreaterThanOrEqual(30);
    }
  });

  it("o glow tem o MESMO raio e o MESMO alpha para todas", () => {
    // Uma só função desenha a placa, então o raio e o alpha são literalmente os mesmos
    // objetos. O que este teste protege é a tentação de escrever o segundo.
    expect(CODIGO, "o glow sumiu de components/badges.tsx").toContain("GLOW_RAIO");
    expect(CODIGO).toContain("GLOW_ALPHA");

    // Um só `boxShadow` no arquivo inteiro: dois seriam duas placas diferentes.
    expect(CODIGO.match(/boxShadow:/g) ?? []).toHaveLength(1);

    // E o valor é UM. Se alguém quiser mexer, mexe para as nove de uma vez.
    expect(GLOW_RAIO).toBe(16);
    expect(GLOW_ALPHA).toBe(0.26);
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  ═══ ESTE TESTE PROIBIA A PALAVRA "GRADIENT", E ISSO ERA GROSSO DEMAIS ═══
   *
   *  Ele existia para impedir glow holográfico, arco-íris e pulsante — e barrava, junto,
   *  um degradê **do mesmo matiz**, com alpha fixo, igual nas nove placas. Isso não é
   *  raridade: é acabamento. Cor chapada é adesivo; cor com queda é objeto.
   *
   *  O que faz uma insígnia virar pódio nunca foi o degradê: é o degradê DIFERENTE. E é
   *  isso que este teste passa a proibir, em vez de proibir a técnica.
   *
   *  Um teste que proíbe a ferramenta em vez do estrago obriga a próxima pessoa a fazer
   *  a coisa certa por um caminho pior — ou a apagar o teste.
   * ════════════════════════════════════════════════════════════════════
   */
  it("nenhum brilho animado, pulsante, arco-íris ou holográfico", () => {
    expect(
      /animate-|@keyframes|pulse|holograph|shimmer|rainbow|conic-gradient|radial-gradient/i.test(CODIGO),
      "uma insígnia ganhou animação ou brilho especial. Brilho a mais é ranking a menos disfarçado.",
    ).toBe(false);
  });

  it("o degradê é do MESMO matiz, e é UM só para as nove", () => {
    /**
     * A LINHA inteira, e não um `linear-gradient\([^)]*\)`.
     *
     * A primeira versão disto parava no primeiro parêntese fechado — que está DENTRO de
     * `cor(badge, VERNIZ_TOPO)`. Ela cortava o degradê ao meio e acusava a placa de ter
     * uma parada só.
     *
     * Uma regex que não sabe contar parênteses não deve tentar.
     */
    const degrades = (CODIGO.split("\n").filter((l) => l.includes("linear-gradient")));

    // Um só degradê no arquivo. Dois seriam duas placas com acabamentos diferentes.
    expect(degrades.length, "apareceu um segundo degradê: duas placas, dois acabamentos").toBeLessThanOrEqual(1);

    for (const d of degrades) {
      /**
       * As duas paradas do degradê vêm da MESMA função `cor(badge, …)` — ou seja, do
       * mesmo matiz, com dois alphas. Uma segunda cor ali dentro (um `#`, um `rgb`, um
       * segundo `cor(` de outra insígnia) seria um degradê bicolor, e degradê bicolor é
       * a porta de entrada do holográfico.
       */
      expect(d, "o degradê ganhou uma segunda cor").not.toMatch(/#[0-9a-f]{3,8}|rgb\(|hsl\(/i);
      expect((d.match(/cor\(badge/g) ?? []).length, "o degradê tem que ser do matiz da própria insígnia").toBe(2);
    }
  });

  it("nem OURO, nem PRATA, nem BRONZE, nem paleta de raridade de jogo", () => {
    // Não é gosto: é semântica. Ouro/prata/bronze é um pódio, e todo mundo lê pódio.
    // Cinza → verde → azul → roxo → laranja é a escala de raridade de qualquer jogo, e
    // quem já jogou decodifica na hora — e passa a querer a laranja.
    const proibido = /gold|silver|bronze|ouro|prata|legendary|lendári|épic|epic|rare|raridade|tier|comum/i;
    const texto = JSON.stringify(INSIGNIAS) + CODIGO;
    expect(proibido.test(texto), "a paleta de pódio ou de raridade entrou").toBe(false);
  });

  it("o glifo é sempre um traço fino de 1.5px", () => {
    const traços = CODIGO.match(/strokeWidth=\{([\d.]+)\}/g) ?? [];
    expect(traços.length).toBeGreaterThan(0);
    for (const t of traços) expect(t, "um glifo engrossou. Medalha é cheia; insígnia é traço.").toBe("strokeWidth={1.5}");
  });
});

describe("insígnia é BINÁRIA: você é, ou não é", () => {
  it("nenhuma tem nível, tier, XP, meta ou barra de progresso", () => {
    // ESCADA PRODUZ FARM: quem precisa de 500 correções para subir de degrau faz 500
    // correções RUINS. Uma insígnia binária não tem degrau, então não há o que farmar.
    const escada = /sênior|senior|júnior|junior|nível|nivel|level|\bxp\b|pontos?\b|progresso|meta\b|streak/i;
    for (const [chave, i] of Object.entries(INSIGNIAS)) {
      expect(
        escada.test(`${chave} ${i.label} ${i.sobre}`),
        `a insígnia "${chave}" virou uma escada. Escada produz farm.`,
      ).toBe(false);
    }
  });

  it("nenhum rótulo carrega um número", () => {
    // O NÚMERO NÃO VIAJA. A INSÍGNIA VIAJA. Número é placar, e placar fica preso em
    // /contribuidores.
    for (const i of Object.values(INSIGNIAS)) {
      expect(i.label, `"${i.label}" tem um número dentro`).not.toMatch(/\d/);
    }
  });
});

describe("nenhuma insígnia é ganha por LER, e RESENHISTA não existe", () => {
  it("não existe Resenhista, nem Leitor Voraz, nem parente", () => {
    /**
     * Esta é a recusa mais importante da lista, e ela é deliberada: resenha é
     * produzida POR leitura, e premiar quem resenha corrompe justamente a coisa cuja
     * honestidade mais importa neste app. Uma resenha escrita para ganhar uma insígnia
     * não é uma resenha: é uma performance.
     *
     * Se alguém propuser, FECHE O PR E CITE ESTA LINHA.
     */
    const porLer =
      /resenhista|voraz|maratona|leitor do (mês|ano)|colecionador|assíduo|páginas lidas|livros lidos/i;

    for (const [chave, i] of Object.entries(INSIGNIAS)) {
      expect(
        porLer.test(`${chave} ${i.label} ${i.sobre}`),
        `a insígnia "${chave}" é ganha por LER. Insígnia honra DOAÇÃO à comunidade, nunca leitura.`,
      ).toBe(false);
    }
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM PAGA TEM INSÍGNIA. E ELA DIZ QUE SE PAGA.
 *
 *  ═══ ESTE BLOCO DIZIA O CONTRÁRIO, E FOI REESCRITO ═══
 *
 *  Ele se chamava "o selo de apoiador não pode parecer com uma insígnia", e travava
 *  exatamente o que agora existe. A regra do docs/design.md era:
 *
 *      "Quem apoia COMPROU um selo; quem tem uma insígnia DOOU trabalho. Se os dois se
 *       parecerem, a mensagem que sobra é 'dá para comprar mérito', e isso mata a página
 *       de contribuidores inteira."
 *
 *  O dono do produto decidiu que o apoiador tem insígnia. O medo daquela regra continua
 *  certo — e o que ela protegia **não some, muda de lugar**:
 *
 *    ANTES  o selo era feio de propósito, para ninguém confundir.
 *    AGORA  a insígnia é bonita como as outras, e **diz o que ela é**.
 *
 *  Um selo cinza que ninguém entende protege MENOS do que uma insígnia que conta, na
 *  cara, "esta pessoa paga a conta do servidor". A honestidade sobre o que a coisa é
 *  vale mais do que escondê-la.
 *
 *  E a trava que continua valendo — a que sempre foi a de verdade — é esta: **pagar não
 *  põe ninguém na página de quem faz.** Aquela lista é sobre TRABALHO, e é a única do app
 *  com número.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a insígnia de quem paga", () => {
  it("existe, e ela DIZ que se paga", () => {
    expect(INSIGNIAS.apoiador).toBeTruthy();

    const conta = (INSIGNIAS.apoiador.sobre + " " + INSIGNIAS.apoiador.como).toLowerCase();

    // Ela não pode ser vaga. Se ela não disser que é paga, ela vira mérito comprado em
    // silêncio — que é exatamente o que a regra antiga temia, e com razão.
    expect(
      /paga|apoia|conta do servidor/.test(conta),
      "a insígnia de apoiador não diz que ela se paga. Aí ela vira mérito comprado.",
    ).toBe(true);

    expect(
      /não se conquista|se paga/.test(conta),
      "ela precisa dizer, com todas as letras, que não se conquista.",
    ).toBe(true);
  });

  /**
   * ═══ A TRAVA MUDOU DE LUGAR ═══
   *
   * Este teste dizia "pagar não põe ninguém na página de quem faz". Os apoiadores agora
   * aparecem lá — numa seção própria, sem número, em ordem de chegada.
   *
   * **Apoiar financeiramente é importante, e esconder isso não honra ninguém.** Sem quem
   * paga a conta, o servidor cai e as listas de trabalho param de existir.
   *
   * O que continua proibido está em lib/contributors.sql.test.ts: misturar quem paga na
   * lista de quem trabalha, e ordenar apoiadores por valor. O medo era de CONFUSÃO, e não
   * de reconhecimento.
   */

  /**
   * ═══ E ELA É VIVA ═══
   *
   * Ela sai sozinha no dia em que a pessoa para de apoiar, porque ela é lida direto de
   * `is_supporter` — e não concedida numa tabela que alguém teria que lembrar de limpar.
   *
   * Uma insígnia de apoiador que fica para sempre depois de a pessoa cancelar é uma
   * mentira que o app conta todo dia.
   */
  /**
   * ═══ E O TESTE FICOU MAIS DURO, E NÃO MAIS FROUXO ═══
   *
   * Ele exigia `is_supporter`, um BOOLEANO GRAVADO, e essa coluna não conseguia cumprir
   * a promessa que este mesmo teste defende. O apoio avulso vale 30 dias, e no dia 31 o
   * Stripe não manda evento nenhum, porque não aconteceu nada: um booleano ficaria
   * `true` para sempre, e a insígnia viraria exatamente a mentira que o teste existe para
   * impedir.
   *
   * Agora a exigência é a oposta e mais forte: a insígnia tem que vir de ehApoiador(),
   * que PERGUNTA na hora (assinatura viva, ou avulso no prazo), e o arquivo não pode
   * voltar a ler um booleano guardado. A promessa é a mesma; o que mudou é que agora ela
   * é cumprível.
   */
  it("ela é lida do apoio de HOJE, e não concedida à mão", () => {
    const badges = readFileSync(new URL("../lib/badges.ts", import.meta.url), "utf8");

    expect(badges, "o apoiador tem que sair de ehApoiador(), e não de uma concessão").toMatch(
      /ehApoiador\(sql`u`\)\}[\s\S]{0,20}as apoiador/,
    );

    // Sem comentários: a proibição é sobre o que a consulta LÊ, e a explicação histórica
    // acima cita o nome da coluna de propósito.
    const semComentario = badges.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
    expect(
      /is_supporter/.test(semComentario),
      "a insígnia voltou a sair de um booleano guardado. Ele mente no dia em que o apoio " +
        "vence, porque ninguém manda aviso quando o tempo simplesmente passa.",
    ).toBe(false);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  A PLACA DO PERFIL: UMA MOLDURA PARA AS NOVE.
 *
 *  A estética de RPG entrou (o dono pediu, e ela é bonita). O veneno
 *  dela NÃO entrou, e é isto que este teste guarda.
 *
 *  O que faz um jogo virar farm não é a moldura: é a moldura DIFERENTE.
 *  Ouro contra prata, épico contra comum. No instante em que uma placa
 *  tiver moldura mais rica que a outra, a pessoa passa a QUERER aquela.
 *
 *  Uma geometria só, um glow só, e o matiz é a única coisa que gira.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a placa do perfil tem UMA moldura, e não uma escada", () => {
  const src = readFileSync("components/badges.tsx", "utf8");
  const semComentario = src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  it("existe UMA geometria de placa, e ela não é função da insígnia", () => {
    // Um `corte: raro ? 12 : 7` seria uma raridade desenhada.
    expect(src).toMatch(/const PLACA = \{/);
    expect(semComentario).not.toMatch(/corte:\s*[^,\n]*\?/);
    expect(semComentario).not.toMatch(/borda:\s*[^,\n]*\?/);
  });

  it("nenhuma insígnia tem tier, raridade, ou metal", () => {
    expect(semComentario).not.toMatch(/tier|raridade|rarity|lend[áa]rio|[ée]pico|comum/i);
    expect(semComentario).not.toMatch(/\b(ouro|prata|bronze|gold|silver)\b/i);
  });

  it("o glow é o MESMO para todas: nada de brilho por insígnia", () => {
    // GLOW_RAIO e GLOW_ALPHA são constantes importadas. Se alguém escrever um raio
    // literal diferente numa placa, criou uma insígnia mais preciosa que as outras.
    expect(semComentario).toMatch(/GLOW_RAIO/);
    expect(semComentario).toMatch(/GLOW_ALPHA/);
    expect(semComentario).not.toMatch(/animate-|animation:|@keyframes/);
  });

  /**
   * ═══ AQUI HAVIA UM TESTE QUE PASSAVA POR ACIDENTE ═══
   *
   * Ele se chamava "o SELO DE APOIADOR não tem moldura, nem glow, nem matiz" e fazia isto:
   *
   *     const selo = CODIGO.slice(CODIGO.indexOf("export function SeloApoiador"));
   *
   * O `SeloApoiador` foi apagado. `indexOf` passou a devolver **-1**, e `slice(-1)` pega
   * o ÚLTIMO CARACTERE do arquivo — que não casa com nada. O teste ficou verde para
   * sempre, sem olhar para coisa nenhuma.
   *
   * É a mesma família do bug que já apareceu três vezes neste repo: **o teste que passa
   * porque não achou nada.** Um `indexOf` sem checar o -1 é uma mentira esperando para
   * acontecer.
   *
   * O que ele protegia agora vive em "a insígnia de quem paga", mais acima: a insígnia de
   * apoiador DIZ que se paga, e pagar não põe ninguém na página de quem faz.
   */
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  A BARRA DE PROGRESSO: PODE EM CONTRIBUIÇÃO, NUNCA EM LEITURA.
 *
 *  A regra antiga proibia barra em tudo, e ela confundia duas coisas.
 *  A distinção que vale, e que este teste guarda:
 *
 *    contribuição (correções, catálogo) → PODE
 *    leitura (livro lido, página, meta, ofensiva) → NUNCA
 *
 *  Ler é íntimo, e uma barra enchendo ao lado de "livros lidos"
 *  transforma leitura em meta, meta em cobrança, e cobrança é a mesma
 *  família da ofensiva. Consertar o catálogo é mutirão, e mutirão anda
 *  melhor quando dá para ver o quanto falta.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a barra mede contribuição, e jamais leitura", () => {
  const tela = readFileSync("app/insignias/page.tsx", "utf8");
  const semComentario = tela
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  it("só as insígnias de CORREÇÃO têm meta: as outras são fatos, e fato não tem barra", () => {
    // Um fato acontece ou não acontece. Não existe "68% de ter tido a ideia do Gume",
    // e não existe "80% de ter chegado entre os cem primeiros".
    expect(META.zelador).toBeGreaterThan(0);
    expect(META.bibliotecario).toBeGreaterThan(0);

    for (const fato of [
      "construtor", "arauto", "fundador", "idealizador",
      // Apoiar é sim ou não. Não existe "68% de apoiar".
      "apoiador",
      // Confiança não tem barra: não existe "68% de ser confiável".
      "moderador",
    ] as const) {
      expect(META[fato], `${fato} ganhou uma meta. Ela é um FATO, e fato não tem barra.`).toBeNull();
    }
  });

  it("a barra do bibliotecário é MAIS ALTA que a do zelador: a porta é mais cara", () => {
    expect(META.bibliotecario!).toBeGreaterThan(META.zelador!);
  });

  it("a tela das insígnias NUNCA mede leitura", () => {
    /**
     * Se um dia alguém puxar para cá o número de livros lidos, páginas, meta do ano
     * ou ofensiva, o build quebra. É a única coisa que esta reversão não pode virar.
     */
    expect(semComentario).not.toMatch(/livros?\s*lidos|p[áa]ginas?\s*lidas|streak|ofensiva|meta do ano/i);
    expect(semComentario).not.toMatch(/getStats|readings|library_entries/);
  });

  it("a insígnia continua BINÁRIA: a barra mostra a distância, e nunca um nível", () => {
    /**
     * "zelador nível 2" é uma escada, e escada produz farm. A barra diz quanto falta
     * para a porta, e a porta abre uma vez só.
     *
     * Os limites de palavra (\b) não são preciosismo: sem eles, `/XP/i` casa com o
     * "xp" de `export`, e o teste passa a acusar todo arquivo que exporta qualquer
     * coisa. Um teste que grita por engano é um teste que a gente aprende a ignorar.
     */
    expect(semComentario).not.toMatch(/\bn[íi]ve(l|is)\b|\btier\b|\bXP\b|\blevel\b/i);
  });
});

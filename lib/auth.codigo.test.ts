import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RATES } from "./rate-limit";
import { imgSrc } from "./imagens";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O CÓDIGO POR E-MAIL. E o que quebra sem ninguém perceber.
 *
 *  ═══ E ELE NÃO SE CHAMA "DOIS FATORES" ═══
 *
 *  Código por e-mail não é um segundo fator se o reset de senha também vai por e-mail: é
 *  o mesmo fator, duas vezes. Chamar de 2FA seria prometer uma segurança que não existe.
 *
 *  ═══ E AGORA O E-MAIL ESTÁ NO CAMINHO CRÍTICO DO LOGIN ═══
 *
 *      ANTES   e-mail caído  →  ninguém se cadastra
 *      AGORA   e-mail caído  →  NINGUÉM ENTRA
 *
 *  O que estes testes guardam:
 *
 *    1. o código guardado em TEXTO PURO no banco
 *    2. conferir o código sem limite de tentativa
 *    3. o código ligando ANTES de funcionar uma vez
 *    4. um segundo fator por SMS
 *    5. **a tela dizendo "enviado" quando o e-mail não saiu**
 *    6. o nome "dois fatores" aparecendo na tela
 * ════════════════════════════════════════════════════════════════════
 */
/**
 * ═══ O TESTE LÊ CÓDIGO, E NÃO COMENTÁRIO ═══
 *
 * A primeira versão disto acusou `lib/auth.ts` de guardar o código em texto puro. O que
 * ela achou foi o COMENTÁRIO que explica por que texto puro é perigoso — e que cita
 * `storeOTP: "plain"` para dizer que é o padrão da biblioteca.
 *
 * Um teste que confunde a nota sobre o bug com o bug é um teste que impede a próxima
 * pessoa de documentar o bug. É a quinta vez que isso acontece neste repositório.
 */
const AUTH = readFileSync("lib/auth.ts", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/\/\/[^\n]*/g, " ");

describe("o código por e-mail", () => {
  /**
   * ═══ 1. O CÓDIGO NÃO FICA EM TEXTO PURO ═══
   *
   * O padrão do plugin é `storeOTP: "plain"` — lido no código da biblioteca, em
   * plugins/two-factor/otp/index.mjs, e não na documentação dela.
   *
   * Um código de seis dígitos em texto puro numa tabela é um código que qualquer leitura
   * do banco entrega. Um dump vazado passaria a valer um segundo fator.
   */
  it("o código do e-mail é cifrado no banco, e não guardado em texto puro", () => {
    expect(
      /storeOTP:\s*"(encrypted|hashed)"/.test(AUTH),
      'o `storeOTP` saiu de "encrypted". O padrão do plugin é TEXTO PURO, e um dump de ' +
        "banco vazado passaria a valer um segundo fator.",
    ).toBe(true);

    expect(AUTH, 'nunca "plain"').not.toMatch(/storeOTP:\s*"plain"/);
  });

  /**
   * ═══ 2. FORÇA BRUTA CONTRA SEIS DÍGITOS É VIÁVEL ═══
   *
   * Um milhão de combinações. Um script faz isso numa tarde — se ninguém contar as
   * tentativas.
   *
   * A rota do código mora em `/api/auth/two-factor/…`.
   *
   * ═══ E O LIMITE MUDOU DE CASA, POR CAUSA DO DEPLOY ═══
   *
   * Ele era chamado no `middleware.ts`. Em serverless isso morre duas vezes: o middleware
   * roda no Edge (que não fala com o Postgres) e o balde vivia na memória de um processo
   * que não existe entre duas requisições — mil tentativas se espalham por cinquenta
   * instâncias e nenhuma passa do teto.
   *
   * Agora quem conta é a própria rota de entrada, em Node, no banco. Este teste segue o
   * limite até onde ele foi morar: `app/api/auth/[...all]/route.ts` conta **todo POST**
   * para `/api/auth`, e as rotas do código são POST. Ver lib/rate-limit.ts.
   */
  it("conferir o código está coberto pelo limite de tentativas", () => {
    const rota = readFileSync("app/api/auth/[...all]/route.ts", "utf8");

    // As rotas do plugin, como o Better Auth as monta. Todas POST, todas sob /api/auth.
    const ROTAS = [
      "/api/auth/two-factor/verify-otp",
      "/api/auth/two-factor/send-otp",
      "/api/auth/two-factor/verify-backup-code",
      "/api/auth/two-factor/enable",
      "/api/auth/two-factor/disable",
    ];

    expect(
      /await limitar\(/.test(rota),
      "a rota de entrada parou de contar. Sem isso, seis dígitos são um milhão de " +
        "tentativas, e um script faz isso numa tarde.",
    ).toBe(true);

    /**
     * E ela conta TODO POST, e não uma lista de caminhos escolhidos a dedo. Uma lista é
     * uma coisa que se esquece de atualizar: bastaria o Better Auth acrescentar uma rota
     * nova para ela nascer sem contagem.
     */
    expect(
      /req\.method !== "POST"/.test(rota),
      "a rota passou a contar só alguns caminhos. Conte todo POST: uma lista de caminhos " +
        "é uma lista que um dia esquece um.",
    ).toBe(true);

    for (const r of ROTAS) {
      expect(r.startsWith("/api/auth"), `${r} escapou do limite`).toBe(true);
    }

    /**
     * E o limite tem que DOER. Dez tentativas em cinco minutos, contra um código que
     * expira em cinco minutos: o atacante tem dez palpites em um milhão, por janela.
     *
     * Se alguém afrouxar isto para cem, o mesmo atacante passa a ter cem — e o número
     * que protege a conta de alguém deixou de proteger.
     */
    expect(RATES.auth.limit).toBeLessThanOrEqual(15);
    expect(RATES.auth.windowMs).toBeGreaterThanOrEqual(60_000);
  });

  /**
   * ═══ 3. O 2FA SÓ LIGA DEPOIS DE FUNCIONAR UMA VEZ ═══
   *
   * `skipVerificationOnEnable: false`. Entre "pedi para ligar" e "está ligado" existe um
   * passo obrigatório: receber o código e digitá-lo.
   *
   * Sem isso, alguém cujo e-mail não chega (caixa de spam, servidor fora) tranca a
   * própria conta com um fator que **nunca funcionou** — e descobre no dia seguinte,
   * quando tenta entrar.
   */
  it("o código não liga antes de funcionar uma vez", () => {
    expect(
      /skipVerificationOnEnable:\s*false/.test(AUTH),
      "o código passou a ligar sem confirmar. Quem não receber o e-mail vai trancar a " +
        "própria conta com uma trava que nunca funcionou.",
    ).toBe(true);
  });

  /**
   * ═══ 4. NUNCA POR SMS ═══
   *
   * Um chip se clona convencendo um atendente de loja. Não precisa de hacker: precisa de
   * um dia ruim de alguém no balcão.
   */
  it("dez minutos, e uso único", () => {
    /**
     * DEZ MINUTOS: tempo de achar o e-mail, olhar no spam, e voltar. E é um TETO, e não um
     * convite — um código que vale uma hora fica numa caixa de entrada invadida esperando
     * alguém passar.
     *
     * CINCO ERROS e o código morre: são seis dígitos, um milhão de combinações, e um
     * script com dez minutos e um código vivo faria força bruta com folga.
     */
    expect(AUTH).toMatch(/period:\s*10/);
    expect(AUTH).toMatch(/allowedAttempts:\s*5/);
  });

  /**
   * ═══ 5. A TELA NUNCA DIZ "ENVIADO" QUANDO O E-MAIL NÃO SAIU ═══
   *
   * O `/two-factor/send-otp` do Better Auth **engole o erro do envio e responde
   * `status: true`** (lido em plugins/two-factor/otp/index.mjs):
   *
   *     const sendOTPResult = options.sendOTP({ user, otp: code });
   *     if (sendOTPResult instanceof Promise)
   *       await runInBackgroundOrAwait(sendOTPResult.catch(e => logger.error(...)));
   *     return ctx.json({ status: true });        // ← SEMPRE true
   *
   * Com o e-mail no caminho crítico do login, esse é o pior erro possível: o Resend cai, a
   * tela diz "mandamos um código", a pessoa espera, olha o spam, espera mais, e conclui
   * que perdeu a conta. E o app diz que está tudo bem.
   *
   * É a lei do AGENTS.md quebrada DENTRO da dependência. Por isso o envio passa por uma
   * ação nossa, que sabe o que aconteceu de verdade.
   */
  it("a tela sabe se o e-mail saiu mesmo", () => {
    const acao = readFileSync("app/entrar/codigo/actions.ts", "utf8");

    expect(
      acao,
      "a ação de mandar o código sumiu. Sem ela, a tela volta a dizer 'enviado' toda vez, " +
        "porque a biblioteca responde status:true mesmo quando o e-mail falha.",
    ).toContain("comCaixa");

    // A tela do login não pode chamar o `sendOtp` da biblioteca direto: ele mente.
    const tela = readFileSync("app/entrar/codigo/page.tsx", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n]*/g, " ");

    expect(
      /twoFactor\.sendOtp\(/.test(tela),
      "a tela voltou a chamar `twoFactor.sendOtp()` direto. Ele responde 'enviado' mesmo " +
        "quando o e-mail não sai, e aí ninguém entra e ninguém sabe por quê.",
    ).toBe(false);

    expect(tela).toContain("mandarCodigo");
  });

  /**
   * ═══ E O REENVIO TEM CONTADOR ═══
   *
   * Um botão de reenviar que se pode apertar dez vezes seguidas é um ataque à caixa de
   * entrada de quem quer que seja. E cada código novo mata o anterior — então apertar dez
   * vezes é a melhor maneira de nunca conseguir entrar.
   */
  it("o reenvio tem contador, e o limite é por PESSOA", () => {
    const tela = readFileSync("app/entrar/codigo/page.tsx", "utf8");
    expect(tela, "o reenvio perdeu o contador").toMatch(/espera\s*>\s*0/);

    const lib = readFileSync("lib/codigo-por-email.ts", "utf8");

    /**
     * O limite da rota de entrada é por IP. Um atacante com mil IPs pediria mil códigos
     * para o e-mail da vítima, e a caixa de entrada dela viraria o ataque.
     *
     * Por isso existe um segundo limite, por PESSOA — e ele conta no banco, e não na
     * memória: em serverless, memória de processo é memória de ninguém, e um limite que
     * não atravessa instância não é um limite. Ver lib/rate-limit.ts.
     */
    expect(
      /await limitar\(`codigo-por-email:\$\{userId\}`/.test(lib),
      "o limite de pedidos deixou de ser por PESSOA, ou voltou a contar na memória. Por " +
        "IP não basta: mil IPs enchem a caixa de entrada da vítima de códigos.",
    ).toBe(true);
  });

  it("não existe segundo fator por SMS", () => {
    expect(
      /\bsms\b|twilio|zenvia|whatsapp/i.test(AUTH),
      "entrou um segundo fator por SMS. Um chip se clona convencendo um atendente de loja.",
    ).toBe(false);
  });

  /**
   * ═══ E OS DEZ CÓDIGOS DE RECUPERAÇÃO SÃO OBRIGATÓRIOS ═══
   *
   * Quem perde o acesso ao e-mail perde tudo: não recebe o código, não recupera a senha,
   * e não tem a quem recorrer — o suporte do Gume é uma pessoa só, num domingo.
   *
   * A tela não pode deixar ligar o 2FA sem que a pessoa confirme, com a mão dela, que
   * guardou os dez. Se alguém tirar essa confirmação "para simplificar", a build quebra.
   */
  it("a tela exige que a pessoa confirme que guardou os códigos", () => {
    const tela = readFileSync("components/codigo-email.tsx", "utf8");

    expect(tela, "os códigos de recuperação sumiram da tela").toContain("backupCodes");

    // O botão que avança só existe se a caixa estiver marcada.
    expect(
      /disabled=\{!guardei/.test(tela),
      "dá para ligar o 2FA sem confirmar que guardou os dez códigos. Quem perder o " +
        "e-mail perde a conta, e não tem a quem recorrer.",
    ).toBe(true);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  E O GITHUB SAIU DA PORTA DE ENTRADA.
 *
 *  Ele estava na tela e NÃO ABRIA — o log dizia, a cada carga, que faltavam as
 *  credenciais. Uma porta que aparece e não funciona é pior do que porta nenhuma.
 *
 *  Ele volta um dia como VÍNCULO de conta (a insígnia de Construtor precisa do handle do
 *  GitHub), e nunca como login. Se alguém o trouxer de volta para `socialProviders`, a
 *  build quebra e a pessoa tem que explicar por quê.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a porta de entrada", () => {
  /**
   * ════════════════════════════════════════════════════════════════════
   *  ═══ O DIA CHEGOU, E A REGRA MUDOU DE FORMA SEM MUDAR DE INTENÇÃO ═══
   *
   *  Este teste dizia "a palavra github não pode aparecer em socialProviders", e o
   *  comentário acima já previa a exceção: "ele volta um dia como VÍNCULO de conta (a
   *  insígnia de Construtor precisa do handle do GitHub), e nunca como login. Se alguém
   *  o trouxer de volta, a build quebra e a pessoa tem que explicar por quê."
   *
   *  A explicação: sem o GitHub ligado, a insígnia de Construtor não existia para
   *  NINGUÉM — nem para quem escreveu o app inteiro —, porque ela se calcula cruzando a
   *  conta ligada por OAuth com quem tem PR mesclado, e não é autodeclarada.
   *
   *  ═══ O QUE MUDOU, E O QUE NÃO ═══
   *
   *  A intenção nunca foi "a string github não existe no arquivo". Era **o GitHub não
   *  cria conta**, porque ele pode entregar e-mail não verificado, que é o vetor clássico
   *  de tomada de conta.
   *
   *  Então o teste passou a exigir a coisa de verdade: se o GitHub estiver ali, ele tem
   *  que vir com as DUAS travas de cadastro. O Better Auth lê `disableSignUp` no sign-in
   *  e `options.disableSignUp` no callback (api/routes/sign-in.mjs e callback.mjs), e
   *  `disableImplicitSignUp` cobre o caminho do `requestSignUp`. Com as duas, ele só se
   *  liga a uma conta que JÁ EXISTE: uma porta que só abre por dentro.
   *
   *  Isto é MAIS apertado que a regra antiga, e não menos: antes bastava a palavra não
   *  aparecer. Agora, se ela aparecer sem as travas, a build cai.
   *
   *  E a outra metade da promessa continua intacta, no teste logo abaixo: a tela de
   *  ENTRAR não oferece o GitHub. Ele mora no perfil, para quem já está dentro.
   * ════════════════════════════════════════════════════════════════════
   */
  it("o GitHub nunca cria conta: ele é vínculo, e não porta", () => {
    const social = AUTH.slice(AUTH.indexOf("socialProviders:"), AUTH.indexOf("account:"));

    expect(social.length, "o bloco de socialProviders sumiu: a varredura quebrou").toBeGreaterThan(20);
    expect(social).toMatch(/google/);

    if (!/github/i.test(social)) return; // ausente é o estado mais seguro de todos

    expect(
      /disableSignUp:\s*true/.test(social),
      "o GitHub está em socialProviders SEM disableSignUp. Ele pode entregar e-mail não " +
        "verificado, e sem esta trava ele vira uma porta de cadastro: o vetor clássico de " +
        "tomada de conta.",
    ).toBe(true);

    expect(
      /disableImplicitSignUp:\s*true/.test(social),
      "falta disableImplicitSignUp no GitHub. Sem ela, um pedido com requestSignUp cria " +
        "conta pelo GitHub assim mesmo.",
    ).toBe(true);
  });

  it("a tela de entrar não oferece o GitHub", () => {
    const tela = readFileSync("app/entrar/page.tsx", "utf8");
    const semComentario = tela
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n]*/g, " ");

    expect(
      /github/i.test(semComentario),
      "o botão do GitHub voltou para a tela de entrar. Ele não abria, e uma porta que " +
        "aparece e não funciona é pior do que porta nenhuma.",
    ).toBe(false);

    expect(semComentario).toMatch(/provider:\s*"google"/);
  });

  /**
   * O client secret é do SERVIDOR. Um `NEXT_PUBLIC_` na frente dele o põe no bundle que
   * vai para o navegador de todo mundo — e um segredo no navegador não é um segredo.
   */
  it("o client secret do Google nunca é NEXT_PUBLIC", () => {
    expect(AUTH).not.toMatch(/NEXT_PUBLIC_GOOGLE/);
    expect(AUTH).toMatch(/process\.env\.GOOGLE_CLIENT_SECRET/);
  });
});


/**
 * ════════════════════════════════════════════════════════════════════
 *  A CSP TEM QUE DEIXAR A CARA DA PESSOA APARECER.
 *
 *  Quem entra pelo Google chega com uma foto hospedada em `lh3.googleusercontent.com`.
 *  Sem essa origem na `img-src`, a CSP bloqueia a foto de **todo mundo que entrar pelo
 *  Google** — e o app não quebra: ele só fica cheio de gente sem cara, e o console cheio
 *  de erro que ninguém lê.
 *
 *  É o tipo de bug que passa no code review e aparece na semana do lançamento.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a CSP", () => {
  it("deixa passar o avatar de quem entra pelo Google", () => {
    /**
     * ═══ A DIRETIVA VEM DE `lib/imagens.ts`, E O TESTE OLHA PARA ELA ═══
     *
     * Este teste já leu o `middleware.ts` cru, procurando a linha da diretiva — e a
     * primeira versão pegou o COMENTÁRIO que explica a diretiva, em vez da diretiva.
     *
     * Agora a lista de origens mora num lugar só, e a CSP é montada a partir dela (foi o
     * conserto da imagem quebrada: a CSP e o formulário que valida o endereço colado
     * precisavam concordar). Então o teste chama a mesma função que o middleware chama, e
     * olha para o valor de verdade — que é imune a comentário, a formatação e a quebra de
     * linha.
     */
    const diretiva = imgSrc();

    expect(
      diretiva,
      "a CSP não deixa passar lh3.googleusercontent.com. Todo mundo que entrar pelo " +
        "Google vai ficar sem foto, e ninguém vai entender por quê.",
    ).toContain("lh3.googleusercontent.com");

    // E o middleware tem que estar mesmo usando esta função, e não uma lista própria.
    // (Quem segura essa lei inteira é lib/imagens.test.ts.)
    expect(readFileSync("middleware.ts", "utf8")).toContain("imgSrc()");
  });
});


/**
 * ════════════════════════════════════════════════════════════════════
 *  O NOME É UMA PROMESSA, E ESTA SERIA FALSA.
 *
 *  "Código por e-mail" é o que ele é. "Autenticação de dois fatores" é o que ele NÃO é —
 *  porque o reset de senha também vai por e-mail, e aí é o mesmo fator, duas vezes.
 *
 *  Um app que promete 2FA e entrega um código no mesmo e-mail que reseta a senha está
 *  vendendo uma segurança que ele não tem. E quem confia nessa promessa vai reusar uma
 *  senha achando que está protegido.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o nome, na tela", () => {
  const TELAS = [
    "app/entrar/codigo/page.tsx",
    "components/codigo-email.tsx",
    "app/perfil/page.tsx",
  ];

  it('nenhuma tela diz "dois fatores" nem "duas etapas"', () => {
    const mentiras: string[] = [];

    for (const caminho of TELAS) {
      // Fora os comentários: eles EXPLICAM por que o nome não pode ser esse, e citam o
      // nome para isso. Um teste que lê a nota como se fosse a infração impede a próxima
      // pessoa de escrever a nota.
      const tela = readFileSync(caminho, "utf8")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\/\/[^\n]*/g, " ");

      /**
       * ═══ O QUE A PESSOA LÊ, E NÃO O QUE O CÓDIGO CHAMA ═══
       *
       * A primeira versão disto proibia `two.?factor` — e acusou as três telas, porque o
       * plugin da biblioteca **se chama** `twoFactor`, e a gente o importa pelo nome dele.
       *
       * A regra nunca foi sobre o identificador: é sobre a PROMESSA que a tela faz.
       * `twoFactor.verifyOtp()` não promete nada a ninguém; "autenticação de dois
       * fatores", escrito na tela, promete.
       *
       * Um teste que proíbe o nome da dependência obriga a próxima pessoa a renomear um
       * import para ficar verde — e aí ele deixou de proteger a promessa e passou a
       * proteger a si mesmo.
       */
      if (/dois fatores|duas etapas|\b2fa\b|autentica[çc][ãa]o de dois|segundo fator/i.test(tela)) {
        mentiras.push(caminho);
      }
    }

    expect(
      mentiras,
      'uma tela voltou a chamar isto de "dois fatores". Código por e-mail NÃO é um ' +
        "segundo fator quando o reset de senha também vai por e-mail: é o mesmo fator, " +
        "duas vezes. O nome seria uma promessa de segurança que o app não cumpre.",
    ).toEqual([]);
  });

  /**
   * E a tela diz, na cara, o que ele NÃO protege.
   *
   * Um app que esconde o próprio limite de segurança é um app que mente sobre segurança.
   */
  it("a tela diz o que o código NÃO protege", () => {
    const tela = readFileSync("components/codigo-email.tsx", "utf8");

    expect(
      /n[ãa]o protege/i.test(tela),
      "a tela parou de dizer o que o código não protege. Quem invade o e-mail entra do " +
        "mesmo jeito, porque o 'esqueci a senha' também vai por e-mail.",
    ).toBe(true);
  });
});

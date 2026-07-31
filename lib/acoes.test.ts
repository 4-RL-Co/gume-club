import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ════════════════════════════════════════════════════════════════════
 *  TODA AÇÃO DE SERVIDOR PERGUNTA QUEM ESTÁ CHAMANDO.
 *
 *  ═══ O BUG QUE ESTE TESTE EXISTE PARA IMPEDIR ═══
 *
 *  Não é a função de autorização errada. `lib/authz.ts` é escrito à mão, tem teste, e
 *  está certo.
 *
 *  É a AÇÃO QUE ESQUECEU DE PERGUNTAR.
 *
 *  Uma `"use server"` exportada é um **endpoint público**. Qualquer pessoa na internet
 *  pode chamá-la, com qualquer argumento, sem nunca abrir a tela que a desenhou. Se ela
 *  não pergunta quem está do outro lado, ela obedece a qualquer um.
 *
 *  Esconder o botão não protege nada. O botão é uma sugestão; a ação é a porta.
 *
 *  ═══ POR QUE UMA VARREDURA, E NÃO CONFIANÇA ═══
 *
 *  Hoje as doze ações do app checam, e isso é verdade **por sorte**: alguém lembrou, doze
 *  vezes. A décima terceira vai ser escrita numa sexta-feira, e é ela que vai vazar.
 *
 *  Este teste transforma a sorte em regra.
 * ════════════════════════════════════════════════════════════════════
 */

/** As portas que a autorização deste repo abre. Ver lib/authz.ts e SECURITY.md. */
const PORTEIROS = [
  "getActor(",
  "getActorOrNull(",
  "getViewer(",
  "assertAuthenticated(",
  "assertOwner(",
  "assertCan",
  "souBibliotecario(",
  "souModerador(",
  "souIdealizador(",
];

/**
 * ═══ A ÚNICA EXCEÇÃO, E ELA PRECISA DE UM MOTIVO ESCRITO ═══
 *
 * `rememberInviter` grava um cookie no navegador de QUEM ESTÁ CHAMANDO, e nada mais. Ela
 * roda antes de a pessoa ter conta (é a tela de entrar), e não toca em dado de ninguém.
 *
 * Uma ação que só escreve no próprio cookie de quem chama não tem a quem perguntar: a
 * resposta seria sempre "esta pessoa", e ela já é essa pessoa.
 *
 * Qualquer nova entrada nesta lista tem que vir com uma frase dizendo por que ela não
 * toca em dado de outra pessoa. Se a frase for difícil de escrever, a exceção está errada.
 */
const SEM_PORTEIRO: Record<string, string> = {
  rememberInviter:
    "grava um cookie no navegador de quem chama, e nada mais. Roda antes de existir conta.",

  /**
   * ═══ A SEGUNDA EXCEÇÃO, E ELA PRECISOU DE UMA TRAVA PRÓPRIA ═══
   *
   * `mandarCodigo` é chamada NO MEIO do login: a senha já foi conferida, e a sessão ainda
   * não existe. Não há ator a quem perguntar — `getActor()` levantaria, sempre.
   *
   * Quem autoriza é o **Better Auth**, pelo cookie de segundo passo que ele mesmo emitiu
   * um instante antes: `sendTwoFactorOTP` recusa sem esse cookie. A ação repassa os
   * cabeçalhos e deixa a biblioteca decidir de quem é.
   *
   * E a exceção não é um cheque em branco: o teste logo abaixo prova que ela REPASSA os
   * cabeçalhos. Uma ação que não repassasse estaria mandando código para qualquer um que
   * pedisse.
   */
  mandarCodigo:
    "roda no meio do login, quando a sessão ainda não existe. Quem autoriza é o cookie de " +
    "segundo passo do Better Auth, e a ação repassa os cabeçalhos para ele decidir.",

  /**
   * ═══ A BUSCA DE PESSOAS CONTA, MAS NO OUTRO BALDE ═══
   *
   * Ela é POR TECLA — a pessoa digita um nome e cada pausa dispara uma consulta. Contar
   * isso no balde de ESCRITA (120/min) esgotaria o teto do dono no meio de uma palavra, e
   * ele veria "espere um minuto" só por ter procurado a esposa.
   *
   * Então ela conta no balde de BUSCA (RATES.search, 300/min), o mesmo da busca de livros.
   * É contada — só não pelo porteiro da escrita. Ver app/pessoas/actions.ts.
   */
  procurarPessoas:
    "é busca por tecla, e conta no balde de BUSCA (RATES.search), não no de escrita: " +
    "contar tecla a tecla no balde de escrita esgotaria o teto do dono numa palavra.",
};

/** Todo arquivo que declara `"use server"`. */
function acoes(): { caminho: string; texto: string }[] {
  const achados: { caminho: string; texto: string }[] = [];

  const andar = (pasta: string) => {
    for (const nome of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = join(pasta, nome.name);
      if (nome.isDirectory()) {
        andar(caminho);
        continue;
      }
      if (!/\.ts$/.test(nome.name) || nome.name.includes(".test.")) continue;

      const texto = readFileSync(caminho, "utf8");
      if (/^\s*["']use server["']/m.test(texto)) achados.push({ caminho, texto });
    }
  };

  for (const raiz of ["app", "lib"]) andar(raiz);
  return achados;
}

describe("as ações de servidor", () => {
  it("existem, e o teste está mesmo olhando para elas", () => {
    // Um teste que não acha nada passa sorrindo. Se a varredura quebrar, ele grita.
    expect(acoes().length).toBeGreaterThanOrEqual(10);
  });

  /**
   * ═══ CADA FUNÇÃO EXPORTADA, UMA A UMA ═══
   *
   * E não "o arquivo menciona getActor em algum lugar": um arquivo com oito ações e um
   * getActor() protege uma, e deixa sete abertas. O teste olha para o CORPO de cada uma.
   */
  it("cada uma pergunta quem está chamando", () => {
    const desprotegidas: string[] = [];

    for (const { caminho, texto } of acoes()) {
      // Corta o arquivo em funções exportadas. O corpo de cada uma vai até a próxima.
      const marcas = [...texto.matchAll(/export\s+async\s+function\s+(\w+)/g)];

      for (let i = 0; i < marcas.length; i++) {
        const nome = marcas[i]![1]!;
        const inicio = marcas[i]!.index!;
        const fim = i + 1 < marcas.length ? marcas[i + 1]!.index! : texto.length;
        const corpo = texto.slice(inicio, fim);

        if (SEM_PORTEIRO[nome]) continue;

        const perguntou = PORTEIROS.some((p) => corpo.includes(p));

        if (!perguntou) {
          desprotegidas.push(
            `${caminho} → ${nome}() não pergunta quem está chamando. ` +
              "Uma ação exportada é um endpoint público: esconder o botão não protege nada.",
          );
        }
      }
    }

    expect(desprotegidas).toEqual([]);
  });

  /**
   * ═══ E A LISTA DE EXCEÇÕES NÃO PODE APODRECER ═══
   *
   * Uma exceção para uma função que não existe mais é uma exceção esperando para pegar
   * carona numa função nova com o mesmo nome.
   */
  /**
   * ═══ A EXCEÇÃO DO CÓDIGO POR E-MAIL TEM QUE REPASSAR OS CABEÇALHOS ═══
   *
   * É o cookie de segundo passo do Better Auth que diz de quem é o pedido. Uma ação que
   * chamasse `sendTwoFactorOTP()` sem os cabeçalhos estaria mandando código de login para
   * quem quer que pedisse — e o pedido é anônimo, porque a sessão ainda não existe.
   */
  it("mandarCodigo repassa os cabeçalhos, que são a autorização dela", () => {
    const acao = readFileSync("app/entrar/codigo/actions.ts", "utf8");

    expect(acao, "a ação não lê os cabeçalhos da requisição").toMatch(/await headers\(\)/);
    expect(
      /sendTwoFactorOTP\(\s*\{\s*headers/.test(acao),
      "a ação chama o Better Auth SEM os cabeçalhos. Sem eles não há cookie, sem cookie " +
        "não há dono, e o app passa a mandar código de login para quem quer que peça.",
    ).toBe(true);
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  E TODA AÇÃO É CONTADA.
   *
   *  ═══ O QUE SE PERDEU NO DEPLOY, E COMO ELE VOLTOU ═══
   *
   *  O limite de escrita morava no `middleware.ts`, e cobria TODA ação de uma vez —
   *  porque toda ação de servidor do Next é um POST. Era estrutura fazendo o trabalho:
   *  uma ação nova nascia protegida sem ninguém lembrar.
   *
   *  Isso morre duas vezes: o middleware roda no runtime Edge (que não fala com o
   *  Postgres) e o balde vivia na memória de um processo só, que não conta nada assim que
   *  existe mais de uma réplica.
   *
   *  O limite desceu para `getActor()` — o portão por onde toda mutação já passava. As
   *  poucas ações que precisam do `Viewer` inteiro (as de papel: moderar, curar, corrigir)
   *  chamam `limitarEscrita()` na mão.
   *
   *  E este teste é o que impede a próxima ação de nascer sem contagem. Sem ele, a
   *  propriedade voltaria a ser verdade POR SORTE — que é como ela era antes de existir
   *  um middleware, e é o motivo de ele ter existido.
   * ════════════════════════════════════════════════════════════════════
   */
  it("cada uma é contada, e uma ação nova nasce contada", () => {
    const soltas: string[] = [];

    for (const { caminho, texto } of acoes()) {
      const marcas = [...texto.matchAll(/export\s+async\s+function\s+(\w+)/g)];

      for (let i = 0; i < marcas.length; i++) {
        const nome = marcas[i]![1]!;
        const inicio = marcas[i]!.index!;
        const fim = i + 1 < marcas.length ? marcas[i + 1]!.index! : texto.length;
        const corpo = texto.slice(inicio, fim);

        if (SEM_PORTEIRO[nome]) continue;

        /**
         * `getActor()` conta por dentro (ver lib/actor.ts). Quem não passa por ele conta
         * na mão. As duas formas valem; não contar não vale.
         */
        const contou = corpo.includes("getActor(") || corpo.includes("limitarEscrita(");

        if (!contou) {
          soltas.push(
            `${caminho} → ${nome}() não é contada. Chame getActor() (que conta por dentro) ` +
              "ou limitarEscrita(viewer.id). Uma escrita sem teto é um formulário de spam.",
          );
        }
      }
    }

    expect(soltas).toEqual([]);
  });

  it("toda exceção ainda existe, e tem um motivo escrito", () => {
    const todo = acoes().map((a) => a.texto).join("\n");

    for (const [nome, motivo] of Object.entries(SEM_PORTEIRO)) {
      expect(todo, `a exceção "${nome}" é de uma função que não existe mais`).toContain(
        `function ${nome}`,
      );
      expect(motivo.length, `a exceção "${nome}" não tem motivo escrito`).toBeGreaterThan(30);
    }
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FONTES_DE_IMAGEM, imgSrc, porQueNaoAceita } from "@/lib/imagens";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A IMAGEM QUEBRADA, E A LISTA QUE NÃO PODE DIVERGIR.
 *
 *  ═══ O BUG ═══
 *
 *  "Não consigo colocar foto no autor dos livros: eu colo o link e vai a imagem
 *  quebrada."
 *
 *  A CSP só deixa passar imagem de uma lista de origens. O formulário não conferia nada:
 *  aceitava qualquer endereço, gravava, assinava a revisão com o nome de quem fez — e o
 *  navegador bloqueava na hora de mostrar. Imagem quebrada, para todo mundo, sem uma
 *  palavra de explicação.
 *
 *  ═══ E A ARMADILHA QUE ESTE TESTE FECHA ═══
 *
 *  O conserto foi fazer o formulário conferir a origem. Só que agora existem DUAS coisas
 *  que precisam concordar sobre o que é uma origem aceita: a CSP e o formulário.
 *
 *  Duas listas sobre a mesma coisa divergem — é uma questão de tempo. E o dia em que
 *  divergirem, o bug volta com outra roupa: o formulário aprova, e a CSP bloqueia.
 *
 *  Então: existe UMA lista, e a CSP é MONTADA a partir dela.
 * ════════════════════════════════════════════════════════════════════
 */

describe("de onde uma imagem pode vir", () => {
  it("as origens conhecidas passam", () => {
    for (const url of [
      "https://upload.wikimedia.org/wikipedia/commons/a/a1/Machado.jpg",
      "https://commons.wikimedia.org/foo.jpg",
      "https://covers.openlibrary.org/b/id/123-L.jpg",
      "https://archive.org/x.jpg",
      "https://ia800.us.archive.org/x.jpg", // subdomínio, pelo curinga
      "https://s4.anilist.co/file/x.jpg",
      // Amazon: "as melhores capas estão lá", pedido do dono. Os quatro hosts
      // que a Amazon já usou pra imagem de produto, cada um por extenso.
      "https://m.media-amazon.com/images/I/x.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/x.jpg",
      "https://images-eu.ssl-images-amazon.com/images/I/x.jpg",
      "https://ecx.images-amazon.com/images/I/x.jpg",
      // Pinterest: a URL exata que o dono mandou como exemplo.
      "https://i.pinimg.com/1200x/d3/a7/98/d3a7983c1a90b3551de075d94264ff6a.jpg",
    ]) {
      expect(porQueNaoAceita(url), `${url} devia passar`).toBeNull();
    }
  });

  /** Vazio é APAGAR o retrato, e apagar é permitido. */
  it("vazio passa, porque vazio é apagar", () => {
    expect(porQueNaoAceita("")).toBeNull();
    expect(porQueNaoAceita("   ")).toBeNull();
  });

  it("um host de fora é recusado, e a recusa DIZ de onde o app aceita", () => {
    const recusa = porQueNaoAceita("https://meu-site-qualquer.com/foto.jpg");

    expect(recusa).not.toBeNull();
    // A recusa nomeia o host que a pessoa colou. "Endereço inválido" não ajuda ninguém.
    expect(recusa).toContain("meu-site-qualquer.com");
    // E ela diz para onde ir.
    expect(recusa!.toLowerCase()).toContain("wikimedia");
  });

  it("http é recusado, porque o navegador o bloquearia em silêncio", () => {
    expect(porQueNaoAceita("http://upload.wikimedia.org/x.jpg")).toContain("https");
  });

  it("o que não é endereço nenhum é recusado", () => {
    expect(porQueNaoAceita("foto do machado.jpg")).not.toBeNull();
    expect(porQueNaoAceita("javascript:alert(1)")).not.toBeNull();
  });

  /**
   * ═══ O CURINGA NÃO PODE SER UM `includes` ═══
   *
   * `*.archive.org` tem que casar `ia800.us.archive.org` e RECUSAR `naoarchive.org` e
   * `archive.org.pirata.com`. Um curinga escrito com `includes()` aceita os três — e aí a
   * lista de origens vira decoração, porque qualquer domínio que contenha o nosso passa.
   *
   * É o tipo de erro que um teste de caso feliz nunca pega.
   */
  it("o curinga não deixa um domínio impostor entrar", () => {
    for (const impostor of [
      "https://naoarchive.org/x.jpg",
      "https://archive.org.pirata.com/x.jpg",
      "https://malgstatic.com/x.jpg",
      "https://upload.wikimedia.org.pirata.com/x.jpg",
    ]) {
      expect(porQueNaoAceita(impostor), `${impostor} NÃO devia passar`).not.toBeNull();
    }
  });
});

describe("a CSP e o formulário leem a mesma lista", () => {
  it("a lista não está vazia, e o teste está mesmo olhando para ela", () => {
    // Um teste que não acha nada passa sorrindo.
    expect(FONTES_DE_IMAGEM.length).toBeGreaterThanOrEqual(8);
  });

  it("a diretiva é montada da lista, e cobre todas as origens", () => {
    const diretiva = imgSrc();

    expect(diretiva.startsWith("img-src ")).toBe(true);

    for (const { host } of FONTES_DE_IMAGEM) {
      expect(diretiva, `${host} sumiu da CSP`).toContain(`https://${host}`);
    }
  });

  /**
   * ═══ O MIDDLEWARE NÃO PODE TER UMA LISTA PRÓPRIA ═══
   *
   * Se alguém voltar a escrever os hosts à mão na CSP, o formulário continua conferindo a
   * lista de `lib/imagens.ts`, as duas divergem, e a imagem quebrada volta.
   *
   * O teste lê o `middleware.ts` e exige que ele CHAME `imgSrc()`, e que não exista um
   * `img-src` escrito à mão com host nenhum dentro.
   */
  it("o middleware chama imgSrc(), e não escreve os hosts à mão", () => {
    const mw = readFileSync("middleware.ts", "utf8");

    expect(mw, "o middleware não chama imgSrc()").toContain("imgSrc()");

    /**
     * E aqui o cuidado que este repo já pagou caro para aprender: NÃO OLHAR PARA
     * COMENTÁRIO. O comentário acima da CSP fala de `img-src` para explicar por que ele
     * vem de fora — e um teste que lesse o arquivo cru acusaria o próprio comentário que
     * documenta o conserto.
     */
    const codigo = mw
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");

    const listaNaMao = /["'`]img-src[^"'`]*https:\/\//.test(codigo);

    expect(
      listaNaMao,
      "o middleware voltou a escrever os hosts da CSP à mão. Duas listas divergem, e no " +
        "dia em que divergirem o formulário vai aprovar uma imagem que o navegador bloqueia.",
    ).toBe(false);
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  A PRÉVIA DA FOTO, E A CSP QUE A BLOQUEAVA EM SILÊNCIO.
   *
   *  ═══ O BUG ═══
   *
   *  Quem escolhia uma foto de perfil via um retângulo cinza. Sem erro na tela, sem erro
   *  no servidor, sem teste vermelho: só o cinza.
   *
   *  O seletor trocou `readAsDataURL` por `createObjectURL` — troca certa, porque uma foto
   *  de seis megabytes vira oito de base64 e trava a aba. E `createObjectURL` devolve um
   *  endereço `blob:`, que a CSP não permitia. O navegador bloqueou, calado.
   *
   *  ═══ POR QUE ESTE TESTE E NÃO OUTRO ═══
   *
   *  Nenhum dos dois arquivos estava errado sozinho. O erro morava ENTRE eles: uma decisão
   *  de desempenho de um lado mudou o que o outro lado precisava permitir, e eles não se
   *  conheciam. É o formato de bug que teste de unidade nunca pega, porque não há unidade
   *  culpada.
   *
   *  Então o teste amarra a ponta: se a prévia constrói um `blob:`, a CSP diz `blob:`.
   * ════════════════════════════════════════════════════════════════════
   */
  it("se a prévia usa createObjectURL, a CSP permite blob:", () => {
    const seletor = readFileSync("components/avatar-picker.tsx", "utf8");
    const usaBlob = /createObjectURL/.test(
      seletor.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1"),
    );

    if (!usaBlob) return;

    expect(
      imgSrc(),
      "a prévia da foto de perfil monta um endereço blob:, e a CSP não permite blob:. " +
        "O navegador vai bloquear a imagem SEM DIZER NADA, e a pessoa vê um retângulo " +
        "cinza no lugar do próprio rosto. Foi exatamente este bug.",
    ).toContain("blob:");
  });
});

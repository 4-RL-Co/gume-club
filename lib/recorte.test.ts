import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { JANELA, cobrir, retangulo, travar } from "@/lib/recorte";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE VOCÊ VÊ É O QUE VOCÊ LEVA.
 *
 *  ═══ O BUG ═══
 *
 *  O recorte da foto de perfil tinha DUAS contas: uma desenhava a prévia na tela, outra
 *  desenhava o quadrado que ia para o servidor. Elas discordavam.
 *
 *  A prévia punha a foto no tamanho natural (uma foto de celular tem 3024 pixels de
 *  largura, e a janela tem 256: a pessoa via um pedaço ampliado doze vezes, e não tinha
 *  como afastar). O salvamento enquadrava para cobrir o quadrado.
 *
 *  Resultado: a pessoa ajustava um enquadramento e recebia OUTRO. E ninguém percebia,
 *  porque a foto que voltava era uma foto plausível — só não era a que ela escolheu.
 *
 *  ═══ A LEI ═══
 *
 *  O retângulo da prévia e o retângulo do canvas são a MESMA COISA, em duas escalas. O
 *  canvas tem o dobro do lado da janela, então tudo nele tem o dobro do tamanho — e nada
 *  mais muda. Se um dia deixar de ser assim, o recorte volta a ser um sorteio.
 * ════════════════════════════════════════════════════════════════════
 */

/** Fotos de verdade: retrato de celular, paisagem, quadrada, e uma minúscula. */
const FOTOS = [
  { w: 3024, h: 4032 }, // iPhone em pé
  { w: 4032, h: 3024 }, // iPhone deitado
  { w: 1000, h: 1000 }, // já quadrada
  { w: 6000, h: 2000 }, // panorâmica
  { w: 96, h: 120 }, // menor que a janela
];

describe("o recorte da foto", () => {
  /**
   * ═══ UM TESTE QUE EU ESCREVI ERRADO, E O QUE ELE ENSINA ═══
   *
   * A primeira versão deste arquivo comparava `retangulo(JANELA, ...)` com
   * `retangulo(SIZE, ...)` e conferia que um era o dobro do outro. Ele passava — e não
   * podia fazer outra coisa: as duas chamadas são a MESMA função, e `retangulo` é linear
   * no alvo por construção. O teste provava a si mesmo.
   *
   * É a sétima vez que este repositório escreve um teste que passa por acidente, e sempre
   * pela mesma raiz: conferir uma coisa que não tem como ser falsa.
   *
   * A lei de verdade não é "as duas contas concordam". É **"não existem duas contas"** — e
   * quem segura isso é o teste estrutural lá embaixo, que lê o componente e exige que a
   * prévia e o canvas chamem esta função, em vez de refazerem a fórmula em CSS.
   *
   * O que sobra aqui é o que `retangulo` tem que fazer, e que pode muito bem estar errado.
   */

  /**
   * ═══ O ZOOM 1 É A FOTO INTEIRA, E NÃO UM PEDAÇO DELA ═══
   *
   * É o item que a pessoa reclamou: "a foto já começa com muuito zoom e fica ruim de
   * ajustar, tem que começar mais de longe".
   *
   * "De longe" tem um significado exato: no zoom 1, o lado MENOR da foto encosta na borda
   * do quadrado. É o mais longe que dá para ir sem deixar fundo aparecendo.
   */
  it("no zoom 1 a foto cobre o quadrado, e nem um pixel a mais", () => {
    for (const foto of FOTOS) {
      const r = retangulo(JANELA, foto, 1, { x: 0, y: 0 });

      // Cobre: nenhum dos lados fica menor que a janela.
      expect(r.w, `${foto.w}x${foto.h}: a largura não cobre`).toBeGreaterThanOrEqual(JANELA - 1e-6);
      expect(r.h, `${foto.w}x${foto.h}: a altura não cobre`).toBeGreaterThanOrEqual(JANELA - 1e-6);

      // E não sobra: um dos dois lados encosta exatamente na borda. Se os dois sobrassem,
      // a foto estaria mais perto do que precisa — que é o bug de novo, mais discreto.
      const encosta = Math.abs(r.w - JANELA) < 1e-6 || Math.abs(r.h - JANELA) < 1e-6;
      expect(encosta, `${foto.w}x${foto.h}: no zoom 1 a foto está mais perto do que precisa`).toBe(
        true,
      );
    }
  });

  /**
   * ═══ E O ZOOM 1 NÃO É "TAMANHO NATURAL" ═══
   *
   * Este é o teste que teria pegado o bug. No código antigo, a prévia desenhava a foto no
   * tamanho natural: uma foto de 3024 pixels ocupava 3024 pixels dentro de uma janela de
   * 256.
   */
  it("uma foto de celular não entra na janela com doze vezes o tamanho dela", () => {
    const celular = { w: 3024, h: 4032 };
    const r = retangulo(JANELA, celular, 1, { x: 0, y: 0 });

    // O certo é 256 de largura (o lado menor encosta). O bug dava 3024.
    expect(r.w).toBeCloseTo(JANELA, 6);
    expect(r.w).toBeLessThan(celular.w / 10);
  });

  it("não dá para arrastar a foto para fora e gravar um quadrado meio vazio", () => {
    const foto = { w: 3024, h: 4032 };

    // Um arrasto absurdo é travado na borda, e não aceito.
    const p = travar(foto, 1, { x: 9999, y: -9999 });

    const r = retangulo(JANELA, foto, 1, p);

    // A foto continua cobrindo a janela inteira: nenhuma borda dela entrou no quadrado.
    expect(r.x).toBeLessThanOrEqual(1e-6);
    expect(r.y).toBeLessThanOrEqual(1e-6);
    expect(r.x + r.w).toBeGreaterThanOrEqual(JANELA - 1e-6);
    expect(r.y + r.h).toBeGreaterThanOrEqual(JANELA - 1e-6);
  });

  it("uma foto já quadrada não anda, porque não tem para onde", () => {
    expect(travar({ w: 800, h: 800 }, 1, { x: 50, y: 50 })).toEqual({ x: 0, y: 0 });
  });

  it("cobrir usa o lado que falta, e não o que sobra", () => {
    // Uma panorâmica precisa crescer pela ALTURA, que é o lado curto.
    expect(cobrir(256, { w: 6000, h: 2000 })).toBeCloseTo(256 / 2000, 9);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  E ESTE É O TESTE QUE PEGA O BUG DE VERDADE.
 *
 *  O bug não foi uma conta errada: foi uma conta ESCRITA DUAS VEZES, em duas linguagens.
 *  A prévia enquadrava com `transform: scale(...)`, em CSS. O canvas enquadrava com
 *  `Math.max(...)`, em JavaScript. Elas divergiram, e a pessoa passou a ajustar um
 *  enquadramento e receber outro.
 *
 *  Nenhum teste de função pura pega isso — a função pura estava certa. O que estava errado
 *  era existir uma SEGUNDA fórmula fora dela.
 * ════════════════════════════════════════════════════════════════════
 */
describe("não existem duas contas", () => {
  const componente = readFileSync("components/avatar-picker.tsx", "utf8");

  /**
   * Sem os comentários. Eles FALAM da fórmula antiga para explicar o conserto, e um teste
   * que lesse o arquivo cru acusaria a própria nota que documenta o conserto — armadilha
   * em que este repositório já caiu meia dúzia de vezes.
   */
  const codigo = componente
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("o teste está mesmo olhando para o componente", () => {
    expect(codigo).toContain("AvatarPicker");
    expect(codigo).toContain("drawImage");
  });

  it("a prévia e o canvas chamam a mesma função", () => {
    expect(codigo, "o componente não importa a conta do recorte").toContain('from "@/lib/recorte"');

    // Uma chamada para desenhar a prévia, outra para desenhar o quadrado que vai embora.
    const chamadas = [...codigo.matchAll(/\bretangulo\s*\(/g)].length;

    expect(
      chamadas,
      "a prévia e o canvas têm que ser DUAS chamadas da mesma função. Se só há uma, um " +
        "dos dois voltou a enquadrar por conta própria.",
    ).toBeGreaterThanOrEqual(2);
  });

  it("o enquadramento não é refeito em CSS", () => {
    /**
     * Era assim que a prévia enquadrava: um `scale()` no `transform`. É essa a segunda
     * fórmula, e é ela que não pode voltar — o canvas nunca vai saber que ela existe.
     */
    /**
     * A primeira versão desta linha era `/transform:[^;`"']*scale\(/` — e ela NÃO pegou o
     * bug quando eu o reintroduzi de propósito para conferir. O valor mora dentro de um
     * template literal, a expressão excluía a crase, e ela parava de casar antes de chegar
     * no `scale(`.
     *
     * Um teste que eu nunca vi FALHAR não é um teste: é uma linha verde. Este eu vi.
     */
    expect(
      /transform:[^\n]*scale\(/.test(codigo),
      "a prévia voltou a enquadrar com transform: scale(). É a segunda fórmula do bug: o " +
        "canvas não a enxerga, e o que a pessoa vê deixa de ser o que ela leva.",
    ).toBe(false);
  });

  it("o enquadramento não é refeito na mão", () => {
    expect(
      /Math\.max\s*\(\s*\w+\s*\/\s*\w/.test(codigo),
      "o componente voltou a calcular o enquadramento na mão, em vez de chamar cobrir().",
    ).toBe(false);
  });
});

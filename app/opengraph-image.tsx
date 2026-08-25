import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Gume: a mente leitora nunca perde o fio.";

/**
 * A imagem que aparece quando alguém cola um link do Gume em qualquer lugar.
 *
 * É a primeira coisa que um estranho vê do produto, e quase sempre a única: ela
 * aparece no meio de uma conversa, ao lado de vinte outras que gritam. Então ela
 * NÃO grita. Fundo preto, a marca em branco, o nome, a frase, e mais nada. Sem
 * captura de tela, sem grade de recursos, sem "junte-se a nós".
 *
 * Nada de gradiente, nada de cor: a única cor deste produto é a capa de um livro,
 * e aqui não tem livro nenhum. Ver docs/design.md.
 *
 * A marca é desenhada com o path SOLID, e não com o fino: a miniatura que o
 * WhatsApp e o Slack geram desta imagem é pequena, e o fio fino desaparece nela.
 * É o mesmo motivo de a versão sólida existir na interface.
 */
const SOLID =
  "M10.6 17.1L23.6 24L23.6 46.2L26.2 47.9L29.7 57.9Q21.4 54.2 10.6 48.1Z " +
  "M53.4 17.1L40.4 24L40.4 46.2L37.8 47.9L34.3 57.9Q42.6 54.2 53.4 48.1Z " +
  "M31.1 6.2L25.9 14.6L25.9 47L29.7 57.9Z " +
  "M32.9 6.2L38.1 14.6L38.1 47L34.3 57.9Z";

/**
 * As fontes vão EMBUTIDAS, e não pedidas por nome.
 *
 * O runtime que desenha esta imagem não é o navegador: ele não tem a Fraunces nem a
 * Newsreader instaladas, e um `font-family` por nome ali cai num fallback qualquer.
 * A imagem sairia com a marca escrita em Times, que é exatamente a marca errada.
 *
 * Os dois arquivos são SUBSETADOS: só as letras que esta imagem escreve. Quatro
 * quilobytes e cinco, em vez de duzentos. Ver scripts/brand.mjs.
 */
const fonte = (nome: string) => readFileSync(join(process.cwd(), "assets/fonts", nome));

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <svg width="150" height="150" viewBox="0 0 64 64">
          <path fill="#fafafa" fillRule="nonzero" d={SOLID} />
        </svg>

        {/* A marca. Entreletra apertada: espaçada, a palavra se espalha e o símbolo
            acima dela vira um estranho. Os dois têm que ler como um objeto só. */}
        <div
          style={{
            marginTop: 46,
            fontSize: 80,
            fontFamily: "Marca",
            fontWeight: 700,
            letterSpacing: 1,
            color: "#fafafa",
            display: "flex",
          }}
        >
          Gume
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 31,
            fontFamily: "Voz",
            color: "#8a8a8a",
            display: "flex",
          }}
        >
          A mente leitora nunca perde o fio.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Marca", data: fonte("Fraunces-700.ttf"), weight: 700, style: "normal" },
        { name: "Voz", data: fonte("Newsreader-400.ttf"), weight: 400, style: "normal" },
      ],
    },
  );
}

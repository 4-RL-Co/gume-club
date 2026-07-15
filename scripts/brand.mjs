#!/usr/bin/env node
/**
 * OS ASSETS DA MARCA, gerados a partir de uma fonte só.
 *
 *   node scripts/brand.mjs
 *
 * A geometria da marca mora em components/mark.tsx, e é DE LÁ que este script a
 * lê: um `d=` copiado à mão para cá seria uma segunda cópia da marca, e no dia em
 * que alguém ajustasse uma, a outra ficaria para trás em silêncio. Uma fonte, uma
 * marca.
 *
 * O ÍCONE (com grão) NÃO é gerado: ele vem pronto, em duas peles, e este script só
 * recorta e redimensiona. Regerar o grão seria imitar de memória uma coisa que já
 * existe, e imitar sai pior.
 *
 *   assets/logoiconpreto.png   grafite, marca branca. É O PRINCIPAL: a pedra de amolar.
 *   assets/logoiconbranco.png  osso, marca preta. Para fundo claro e para papel.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

// ── a marca, lida de components/mark.tsx: uma fonte só, nunca duas ──────────
const src = readFileSync("components/mark.tsx", "utf8");
const pega = (nome) => {
  const bloco = src.match(new RegExp(`const ${nome} =([\\s\\S]*?);\\n`))?.[1];
  if (!bloco) throw new Error(`não achei o path ${nome} em components/mark.tsx`);
  return [...bloco.matchAll(/"([^"]+)"/g)].map((m) => m[1]).join("");
};
const FINE = pega("FINE");
const SOLID = pega("SOLID");

const marca = (d, cor, tam) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${tam}" height="${tam}">` +
  `<path fill="${cor}" fill-rule="nonzero" d="${d}"/></svg>`;

const png = (svg, tam) =>
  sharp(Buffer.from(svg), { density: 1600 }).resize(tam, tam).png().toBuffer();

mkdirSync("public/logo", { recursive: true });

// ── 1. app/icon.svg: a marca CHAPADA, e ela se vira nos dois temas ──────────
//
// A aba do navegador pode ser clara ou escura, e um favicon branco fixo some numa
// e um preto some na outra. `prefers-color-scheme` DENTRO do SVG resolve, e é o
// único jeito de a marca ser chapada e sobreviver aos dois.
writeFileSync(
  "app/icon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <style>
    path { fill: #0d0d0d }
    @media (prefers-color-scheme: dark) { path { fill: #fafafa } }
  </style>
  <path fill-rule="nonzero" d="${SOLID}"/>
</svg>
`,
);

// ── 2. o ÍCONE: recortado do original, nunca regerado ───────────────────────
//
// Os dois PNGs vêm com o quadrado arredondado FLUTUANDO num campo preto. Para o
// launcher, o quadrado É o ícone: o campo em volta faria o Gume aparecer menor que
// todos os vizinhos na mesma tela do celular, e um ícone que parece menor parece
// mais barato.
//
// O recorte é MEDIDO, e não chutado em pixels fixos: os dois arquivos não têm
// exatamente a mesma margem, e um número mágico aqui quebraria em silêncio no dia
// em que alguém reexportasse a arte.
async function recorte(arquivo) {
  const { data, info } = await sharp(arquivo).greyscale().raw()
    .toBuffer({ resolveWithObject: true });

  let x0 = info.width, x1 = 0, y0 = info.height, y1 = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      // o quadrado (grafite ou osso) é bem mais claro que o campo preto em volta
      if (data[y * info.width + x] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }

  const lado = Math.min(x1 - x0, y1 - y0);
  return () => sharp(arquivo).extract({ left: x0, top: y0, width: lado, height: lado });
}

const grafite = await recorte("assets/logoiconpreto.png");
const claro = await recorte("assets/logoiconbranco.png");

// O grafite é o ícone do produto. O claro existe, e não é o padrão em lugar nenhum:
// duas marcas com o mesmo peso é não ter marca nenhuma.
const icone = grafite;

await icone().resize(180, 180).png().toFile("app/apple-icon.png");

// ── 3. favicon.ico: 16 + 32 + 48, com o ÍCONE (grafite) ─────────────────────
//
// Um .ico é um cabeçalho e uma lista de imagens, e cada uma pode ser um PNG
// inteiro. Escrevemos o container à mão: é meia página de bytes, e não vale uma
// dependência nova num repo que tem oito.
const lados = [16, 32, 48];
const imgs = await Promise.all(
  lados.map((s) => icone().resize(s, s).png().toBuffer()),
);
const cab = Buffer.alloc(6 + 16 * lados.length);
cab.writeUInt16LE(0, 0);              // reservado
cab.writeUInt16LE(1, 2);              // tipo 1 = ícone
cab.writeUInt16LE(lados.length, 4);   // quantas imagens
let desloc = cab.length;
lados.forEach((s, i) => {
  const o = 6 + i * 16;
  cab.writeUInt8(s === 256 ? 0 : s, o);      // largura (0 = 256)
  cab.writeUInt8(s === 256 ? 0 : s, o + 1);  // altura
  cab.writeUInt8(0, o + 2);                  // paleta
  cab.writeUInt8(0, o + 3);                  // reservado
  cab.writeUInt16LE(1, o + 4);               // planos
  cab.writeUInt16LE(32, o + 6);              // bits por pixel
  cab.writeUInt32LE(imgs[i].length, o + 8);  // tamanho
  cab.writeUInt32LE(desloc, o + 12);         // onde começa
  desloc += imgs[i].length;
});
writeFileSync("public/favicon.ico", Buffer.concat([cab, ...imgs]));

// ── 4. public/logo: a marca e os lockups, para quem for usar fora do app ────
const PRETO = "#0d0d0d";
const BRANCO = "#fafafa";

/**
 * A PALAVRA, em contorno. Fraunces 700, Caixa e Baixa, entreletra apertada.
 *
 * Vem de assets/wordmark.json, que é geometria pura: nenhuma máquina que abrir um
 * lockup nosso precisa ter a fonte instalada. Um <text> ali renderizaria em Times
 * no slide de outra pessoa, e Times não é a nossa marca.
 *
 * A escolha da fonte está explicada em docs/design.md e em components/mark.tsx: o
 * ícone é MASSA, e a serifada de texto do app lia como um fio ao lado dele.
 */
const W = JSON.parse(readFileSync("assets/wordmark.json", "utf8"));
const PALAVRA = W.d;

/**
 * A palavra é dimensionada e alinhada PELA marca, e nunca solta.
 *
 * O ALINHAMENTO É PELO PESO, E NÃO PELA CAIXA. A marca ocupa y 6..58, então o centro
 * da caixa dela é 32 — mas o centro de TINTA é 35,4, porque a cauda da lâmina desce
 * fina e quase não pesa, enquanto a massa (as asas) fica mais em cima. Centrada em
 * 32, a palavra flutuava acima da marca. É a armadilha clássica do alinhamento
 * óptico: a caixa mente sempre que a forma não é simétrica no eixo.
 */
const CENTRO_DE_PESO = 35.4;                 // medido varrendo o pixel, não estimado
const CAP = 26;                              // altura de caixa alta, no viewBox de 64

/**
 * O UPM VEM DO ARQUIVO, e não de um 1000 escrito na mão.
 *
 * Isto já quebrou: a Vollkorn usa 1000 unidades por em e a Fraunces usa 2000. Com o
 * 1000 fixo aqui, a escala saía pela metade, o viewBox nascia com metade da largura
 * que precisava, e o lockup saía com a palavra CORTADA no meio ("Gu"). Um número
 * mágico que funciona por coincidência é pior que um bug: ele espera.
 */
const UPM = W.upm;
const PALAVRA_S = CAP / (W.capEm * UPM);     // a escala, das unidades da fonte para cá
const PALAVRA_W = W.widthEm * UPM;           // largura em unidades da fonte
const PALAVRA_X = 62;                        // logo depois da marca (que acaba em 52.5)
const PALAVRA_Y = CENTRO_DE_PESO + CAP / 2;  // linha de base: a caixa alta assenta no peso
const LOCK_W = Math.round(PALAVRA_X + PALAVRA_W * PALAVRA_S + 4);

const VERT_S = 22 / (W.capEm * UPM);
const VERT_W = Math.round(Math.max(64, PALAVRA_W * VERT_S) + 16);

for (const [nome, cor] of [["preto", PRETO], ["branco", BRANCO]]) {
  writeFileSync(`public/logo/marca-${nome}.svg`, marca(FINE, cor, 64) + "\n");
  writeFileSync(`public/logo/marca-solida-${nome}.svg`, marca(SOLID, cor, 64) + "\n");
  writeFileSync(`public/logo/marca-${nome}.png`, await png(marca(FINE, cor, 512), 512));

  /**
   * O lockup, e a palavra vai como PATH, nunca como <text>.
   *
   * Um <text> num SVG solto depende de a máquina que abrir o arquivo TER a fonte.
   * Ela não tem: o arquivo vai parar num slide, numa camiseta, num crachá, e ali a
   * marca renderiza em Times, que é a marca errada. Embutir a fonte inteira faria
   * do asset um arquivo de 200 KB por uma palavra de quatro letras.
   *
   * Convertida em contorno, a palavra É geometria, como o símbolo ao lado dela.
   * O arquivo é autossuficiente e pesa nada. Ver PALAVRA, no topo.
   */
  writeFileSync(
    `public/logo/lockup-horizontal-${nome}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOCK_W} 64" width="${LOCK_W}" height="64">
  <path fill="${cor}" fill-rule="nonzero" d="${FINE}"/>
  <g transform="translate(${PALAVRA_X} ${PALAVRA_Y}) scale(${PALAVRA_S})">
    <path fill="${cor}" d="${PALAVRA}"/>
  </g>
</svg>
`,
  );

  writeFileSync(
    `public/logo/lockup-vertical-${nome}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VERT_W} 108" width="${VERT_W}" height="108">
  <g transform="translate(${(VERT_W - 64) / 2} 0)"><path fill="${cor}" fill-rule="nonzero" d="${FINE}"/></g>
  <g transform="translate(${(VERT_W - PALAVRA_W * VERT_S) / 2} 100) scale(${VERT_S})">
    <path fill="${cor}" d="${PALAVRA}"/>
  </g>
</svg>
`,
  );

  for (const lock of ["horizontal", "vertical"]) {
    const svg = readFileSync(`public/logo/lockup-${lock}-${nome}.svg`, "utf8");
    await sharp(Buffer.from(svg), { density: 900 }).resize({ width: 1200 }).png()
      .toFile(`public/logo/lockup-${lock}-${nome}.png`);
  }
}

// Os dois ícones, no tamanho que a loja pede. 1024 é o que a App Store e a Play
// Store exigem, e é o único lugar onde o ícone com grão sai daqui.
await grafite().resize(1024, 1024).png().toFile("public/logo/icone-grafite-1024.png");
await claro().resize(1024, 1024).png().toFile("public/logo/icone-claro-1024.png");

console.log("✓ app/icon.svg              a marca chapada, e ela vira nos dois temas");
console.log("✓ app/apple-icon.png        180, o ícone grafite");
console.log("✓ public/favicon.ico        16, 32, 48");
console.log("✓ public/logo/              marca, lockups (h e v), preto e branco, svg e png");
console.log("✓ public/logo/icone-*-1024  os dois ícones, para a loja");

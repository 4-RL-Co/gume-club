/**
 * ════════════════════════════════════════════════════════════════════
 *  A MATEMÁTICA DO RECORTE DA FOTO DE PERFIL.
 *
 *  ═══ POR QUE ELA SAIU DO COMPONENTE ═══
 *
 *  Ela estava escrita DUAS VEZES: uma para desenhar a prévia na tela, outra para desenhar
 *  o quadrado que vai para o servidor. E as duas discordavam.
 *
 *  A prévia punha a foto no TAMANHO NATURAL dentro de uma janela de 256 pixels — uma foto
 *  de celular tem 3024 de largura, então a pessoa via o miolo de um pedaço, ampliado doze
 *  vezes, sem como afastar. Era o "muito zoom" que ela reclamou.
 *
 *  Mas o bug de verdade era o outro: a função que SALVA já enquadrava a foto para COBRIR
 *  o quadrado. Ou seja, **a pessoa ajustava um enquadramento e recebia outro**. Um recorte
 *  em que o que se vê não é o que se leva não é um recorte: é um sorteio.
 *
 *  Aqui a conta é uma só, e ela é PURA — sem canvas, sem DOM, sem navegador. Por isso ela
 *  pode ser medida, e é medida em lib/recorte.test.ts: o teste prova que o retângulo da
 *  prévia e o retângulo do canvas são a MESMA COISA, em escalas diferentes.
 *
 *  Uma conta em dois lugares é uma conta que um dia diverge. Esta divergiu.
 * ════════════════════════════════════════════════════════════════════
 */

/** O quadrado que vai para o servidor, em pixels. */
export const SIZE = 512;

/** A janela de corte na tela, em pixels de CSS. */
export const JANELA = 256;

export type Tamanho = { w: number; h: number };
export type Ponto = { x: number; y: number };

/** O retângulo onde a foto é desenhada, na escala de quem pediu. */
export type Retangulo = { x: number; y: number; w: number; h: number };

/**
 * O fator que faz a foto COBRIR um quadrado — a foto inteira, no menor tamanho em que ela
 * ainda não deixa fundo aparecendo.
 *
 * É o zoom 1. Daí para cima é escolha de quem está enquadrando; daí para baixo apareceria
 * fundo, e um avatar meio vazio não é um enquadramento: é um acidente.
 */
export function cobrir(alvo: number, foto: Tamanho): number {
  return Math.max(alvo / foto.w, alvo / foto.h);
}

/**
 * Onde a foto é desenhada dentro de um quadrado de lado `alvo`.
 *
 * `arrasto` está sempre em pixels DA TELA (é onde o dedo mexeu), e por isso ele é
 * convertido para a escala do alvo. Foi isso que o código antigo fez errado.
 */
export function retangulo(alvo: number, foto: Tamanho, zoom: number, arrasto: Ponto): Retangulo {
  const escala = alvo / JANELA;
  const s = cobrir(alvo, foto) * zoom;

  const w = foto.w * s;
  const h = foto.h * s;

  return {
    x: (alvo - w) / 2 + arrasto.x * escala,
    y: (alvo - h) / 2 + arrasto.y * escala,
    w,
    h,
  };
}

/**
 * O quanto a foto pode andar sem deixar fundo aparecer.
 *
 * Sem esta trava dá para arrastar a foto até só sobrar fundo — e o app gravava isso sem
 * reclamar: um avatar de um quadrado quase vazio, que a pessoa só via depois.
 */
export function travar(foto: Tamanho, zoom: number, p: Ponto): Ponto {
  const s = cobrir(JANELA, foto) * zoom;

  const folgaX = Math.max(0, (foto.w * s - JANELA) / 2);
  const folgaY = Math.max(0, (foto.h * s - JANELA) / 2);

  return {
    x: Math.min(folgaX, Math.max(-folgaX, p.x)),
    y: Math.min(folgaY, Math.max(-folgaY, p.y)),
  };
}

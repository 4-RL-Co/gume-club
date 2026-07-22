/**
 * O QUE A IMAGEM É POR DENTRO, pelos primeiros bytes. Nunca pelo nome.
 *
 * ═══ O BUG QUE ESTE ARQUIVO CONSERTA ═══
 *
 * Um leitor não conseguia subir a foto de perfil: "a imagem já tá em png",
 * "converti pra jpeg e mesma coisa". O arquivo dele DIZIA .png no nome e era
 * HEIC por dentro — conversor que só renomeia, e o compartilhar do iPhone,
 * fazem isso o tempo todo. A detecção de HEIC olhava só o `file.type` e a
 * extensão, então a conversão era pulada, o navegador não decodificava, e a
 * tela mandava a pessoa fazer exatamente o que ela achava que já tinha feito.
 *
 * O servidor já decide tipo por assinatura (o sniff() da rota de upload). O
 * cliente agora decide igual: um arquivo é o que os bytes dele dizem.
 *
 * Assinaturas:
 *   PNG   89 50 4E 47
 *   JPEG  FF D8 FF
 *   WEBP  "RIFF" ... "WEBP"
 *   HEIC  caixa "ftyp" no offset 4, marca heic/heix/hevc/heif/mif1/msf1
 */
export type TipoDeImagem = "png" | "jpeg" | "webp" | "heic" | "desconhecido";

const MARCAS_HEIC = new Set(["heic", "heix", "hevc", "heif", "mif1", "msf1"]);

export function tipoDeImagem(bytes: Uint8Array): TipoDeImagem {
  const ascii = (de: number, ate: number) =>
    Array.from(bytes.slice(de, ate), (b) => String.fromCharCode(b)).join("");

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return "webp";
  }
  if (ascii(4, 8) === "ftyp" && MARCAS_HEIC.has(ascii(8, 12).toLowerCase())) {
    return "heic";
  }
  return "desconhecido";
}

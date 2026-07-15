/**
 * ════════════════════════════════════════════════════════════════════
 *  UM ZIP, ESCRITO À MÃO, EM STREAMING.
 *
 *  ═══ POR QUE NÃO UMA DEPENDÊNCIA ═══
 *
 *  Porque um zip sem compressão é um formato de quarenta linhas, e as bibliotecas que
 *  fazem isso trazem junto um mundo (deflate, criptografia, zip64, streams próprios) do
 *  qual a gente usaria nada. Uma dependência nova é uma superfície de ataque nova, um
 *  `pnpm audit` novo, e um dia um mantenedor cansado.
 *
 *  ═══ POR QUE SEM COMPRESSÃO ═══
 *
 *  Porque o conteúdo já é texto, e porque **comprimir exige saber o tamanho antes de
 *  escrever** — o que obrigaria a montar o arquivo inteiro na memória. É exatamente o que
 *  a exportação não pode fazer: quem tem cinco mil livros é quem mais precisa dela, e é
 *  quem estouraria a memória.
 *
 *  O truque que permite escrever sem saber o tamanho é o **descritor de dados**: o
 *  cabeçalho local vai com os tamanhos zerados e um bit ligado dizendo "os números vêm
 *  DEPOIS", e o CRC e os tamanhos são escritos assim que o arquivo termina. É assim que
 *  todo zip de streaming do mundo funciona, e todo descompactador entende.
 *
 *  Um `.zip` de uma estante de cinco mil livros dá uns dois megabytes. Comprimir economiza
 *  banda que ninguém está pagando e custa uma memória que a gente não tem.
 * ════════════════════════════════════════════════════════════════════
 */

/** CRC-32, o mesmo do zip e do PNG. A tabela é gerada uma vez. */
const TABELA = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array, anterior = 0): number {
  let c = ~anterior >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    c = TABELA[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  }
  return ~c >>> 0;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0, true);
  return b;
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n & 0xffff, true);
  return b;
}

function juntar(pedacos: Uint8Array[]): Uint8Array {
  const total = pedacos.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let i = 0;
  for (const p of pedacos) {
    out.set(p, i);
    i += p.length;
  }
  return out;
}

/** Um arquivo dentro do zip. O conteúdo chega em pedaços, e nunca inteiro. */
export type Arquivo = {
  nome: string;
  /** Os pedaços do conteúdo, na ordem. Um gerador, para a memória ficar constante. */
  pedacos: AsyncIterable<Uint8Array> | Iterable<Uint8Array>;
};

/**
 * Monta o zip e devolve um stream. Nada do conteúdo fica na memória além do pedaço atual.
 *
 * A DATA é fixa (1º de janeiro de 1980, o zero do formato zip), e é DE PROPÓSITO: a data
 * de modificação de um arquivo dentro do zip não diz nada de útil para ninguém, e uma data
 * de verdade faria dois exports do mesmo dado gerarem bytes diferentes — o que impede
 * qualquer teste de comparar arquivos, e é uma dor de cabeça em troca de nada.
 */
export function zip(arquivos: Arquivo[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      /** O que o índice do fim do zip (o "diretório central") precisa saber de cada arquivo. */
      const indice: {
        nome: Uint8Array;
        crc: number;
        tamanho: number;
        offset: number;
      }[] = [];

      let escrito = 0;

      const empurrar = (b: Uint8Array) => {
        controller.enqueue(b);
        escrito += b.length;
      };

      for (const arquivo of arquivos) {
        const nome = enc.encode(arquivo.nome);
        const offset = escrito;

        /**
         * O cabeçalho local, com os tamanhos ZERADOS.
         *
         * O bit 3 do flag (0x08) diz ao descompactador: "os números de verdade vêm num
         * descritor depois dos dados". É o que torna possível escrever sem saber o
         * tamanho — e é a razão de este arquivo caber em quarenta linhas.
         */
        empurrar(
          juntar([
            u32(0x04034b50), // assinatura
            u16(20), // versão mínima
            u16(0x08), // flag: os tamanhos vêm depois
            u16(0), // método: 0 = guardado, sem compressão
            u16(0), // hora (1980)
            u16(0x21), // data (1º de janeiro de 1980)
            u32(0), // crc — depois
            u32(0), // tamanho comprimido — depois
            u32(0), // tamanho real — depois
            u16(nome.length),
            u16(0), // sem campos extras
            nome,
          ]),
        );

        let crc = 0;
        let tamanho = 0;

        for await (const pedaco of arquivo.pedacos) {
          if (pedaco.length === 0) continue;
          crc = crc32(pedaco, crc);
          tamanho += pedaco.length;
          empurrar(pedaco);
        }

        // O descritor de dados: agora a gente SABE os números.
        empurrar(juntar([u32(0x08074b50), u32(crc), u32(tamanho), u32(tamanho)]));

        indice.push({ nome, crc, tamanho, offset });
      }

      // ── o diretório central: o índice, no fim ────────────────────────
      const inicioDoIndice = escrito;

      for (const a of indice) {
        empurrar(
          juntar([
            u32(0x02014b50),
            u16(20), // feito por
            u16(20), // versão mínima
            u16(0x08),
            u16(0),
            u16(0),
            u16(0x21),
            u32(a.crc),
            u32(a.tamanho),
            u32(a.tamanho),
            u16(a.nome.length),
            u16(0), // extras
            u16(0), // comentário
            u16(0), // disco
            u16(0), // atributos internos
            u32(0), // atributos externos
            u32(a.offset),
            a.nome,
          ]),
        );
      }

      // ── e o fim do fim ───────────────────────────────────────────────
      empurrar(
        juntar([
          u32(0x06054b50),
          u16(0), // disco
          u16(0), // disco do índice
          u16(indice.length),
          u16(indice.length),
          u32(escrito - inicioDoIndice),
          u32(inicioDoIndice),
          u16(0), // sem comentário
        ]),
      );

      controller.close();
    },
  });
}

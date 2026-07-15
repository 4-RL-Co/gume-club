/**
 * ════════════════════════════════════════════════════════════════════
 *  O VOLUME BRASILEIRO. Panini e JBC, pelo dado estruturado que elas publicam.
 *
 *  ═══ POR QUE ISTO EXISTE ═══
 *
 *  As séries EM PUBLICAÇÃO são as que as pessoas leem: One Piece, Jujutsu Kaisen,
 *  Chainsaw Man, Dandadan, Blue Lock. E a AniList devolve `volumes: null` para
 *  todas elas — então elas entraram no acervo com UM volume.
 *
 *  Berserk com um volume significa que não dá para registrar Berserk. Que é o
 *  motivo de o mangá existir neste app.
 *
 *  ═══ A CONDIÇÃO 4 DO ai/PRD.md, E ELA FOI PROVADA ═══
 *
 *  A Política de catálogo manda tentar as fontes em ordem, e só raspar metadado
 *  factual quando as três primeiras falharem. Elas falharam, e está medido:
 *
 *    · o dump da Open Library não tem mangá. Zero.
 *    · a AniList sabe a série, e não sabe o volume BRASILEIRO.
 *    · o Google Books devolveu ZERO ISBN brasileiro em 80 resultados de Berserk e
 *      100 de Chainsaw Man. Onde tem, tem migalha: 9 volumes de One Piece de ~110.
 *    · a CBL (agência nacional de ISBN) não tem API pública de consulta.
 *    · a Biblioteca Nacional devolve 403. E um 403 é o site dizendo NÃO — contornar
 *      seria pior que raspar: seria raspar sabendo que pediram para não.
 *
 *  ═══ E ISTO NEM É RASPAR HTML ═══
 *
 *  A Panini publica JSON-LD (`<script type="application/ld+json">`) com
 *  `@type: Product`, `name`, `isbn` e `image`. É dado estruturado, posto ali DE
 *  PROPÓSITO para ser lido por máquina — é assim que o Google monta o resultado
 *  de busca dela.
 *
 *  Ler o que o site OFERECE não é o mesmo que arrancar o que ele esconde.
 *
 *  ═══ A CERCA ═══
 *
 *  PODE:   título · número do volume · ISBN · data · URL da capa (referência)
 *  NUNCA:  sinopse · orelha · resenha · preço · dado de usuário · imagem baixada
 *
 *  A sinopse fica de fora mesmo tendo sido autorizada, e a razão é o item 3 do
 *  próprio PRD: ela não é fato, é OBRA. O Gume promete um dataset CC0, e pôr texto
 *  protegido de terceiro num dataset CC0 é relicenciar o que não é nosso.
 *
 *  O Gume não raspa para GUARDAR. Raspa para DEVOLVER: o ISBN foi atribuído pela
 *  CBL, que é registro nacional. A Panini não é dona dele — ela é só o único lugar
 *  onde ele está visível, e isso é uma falha da infraestrutura do livro no Brasil,
 *  não um direito dela.
 *
 *  `lib/lojas.test.ts` quebra o build se alguém cruzar a linha.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * O raspador DIZ QUEM É, e onde mora.
 *
 * Um raspador anônimo tira da editora até a escolha de pedir para parar. Se a Panini não
 * quiser, ela escreve para este endereço e a gente para — e ela só consegue fazer isso se
 * souber quem somos.
 */
const QUEM_SOMOS = "Gume/1.0 (registro de leitura aberto; gume.club; contato@gume.club)";

/** Uma requisição por segundo. Ninguém está com pressa, e a loja de outra pessoa não é um recurso a espremer. */
const PAUSA_MS = 1100;
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * ═══ UMA OBRA, VÁRIAS EDIÇÕES — E OS NÚMEROS COLIDEM ═══
 *
 * A Panini publica Berserk em duas edições:
 *
 *     Berserk — Edição de Luxo     41 volumes
 *     Berserk (a antiga)           passa de 80
 *
 * O "volume 25" da Luxo e o "volume 25" da antiga são LIVROS DIFERENTES, com conteúdo
 * diferente e ISBN diferente. Jogar os dois na mesma prateleira faz a lacuna em cinza
 * apontar para o buraco errado: o leitor olha o vazio no 25, vai comprar, e já tem.
 *
 * O nome da edição é o que separa as duas, e ele está no título do produto. Não é uma
 * heurística bonita — mas é a única coisa que a loja diz, e ela diz de forma consistente.
 */
const EDICOES = [
  { rx: /edi[çc][ãa]o\s+de\s+luxo|deluxe/i, nome: "Edição de Luxo" },
  { rx: /edi[çc][ãa]o\s+definitiva/i, nome: "Edição Definitiva" },
  { rx: /\bomnibus\b/i, nome: "Omnibus" },
  { rx: /\bfull\s*colou?r\b|colorid[ao]/i, nome: "Colorida" },
  { rx: /\bbig\b/i, nome: "Big" },
  { rx: /\bpocket\b|\bbolso\b/i, nome: "Pocket" },
  { rx: /\bkanzenban\b/i, nome: "Kanzenban" },
  { rx: /\bespecial\b|special edition/i, nome: "Especial" },
];

/** Qual edição é esta, pelo título do produto. `null` = a edição padrão da editora. */
export function edicaoDoTitulo(titulo: string): string | null {
  for (const e of EDICOES) if (e.rx.test(titulo)) return e.nome;
  return null;
}

/**
 * ═══ O QUE NÃO É UM VOLUME ═══
 *
 * "Kit Berserk — Edição de Luxo Vol. 6 ao 10" virou "volume 6" na primeira amostra. É um
 * PACOTE de cinco livros, e ele nunca vai para a prateleira de ninguém como um volume.
 *
 * Box, kit, caixa, combo: são embalagem, e não obra. Se entrassem, a lacuna em cinza
 * mostraria buracos que não existem.
 */
const NAO_E_VOLUME = /^\s*(kit|box|caixa|combo|pack)\b|\bcolecao completa\b|\bvol\.?\s*\d+\s*(ao|a|-)\s*\d+/i;

export type VolumeBR = {
  /** O título como a editora o imprime. "Berserk - 81". */
  titulo: string;
  /** O número do volume, extraído do título. É o que liga o volume à COLEÇÃO. */
  volume: number | null;
  /**
   * QUAL EDIÇÃO. "Edição de Luxo", "Pocket", ou `null` para a edição padrão da editora.
   *
   * É isto que separa as duas coleções de Berserk que uma pessoa pode ter na estante.
   */
  edicao: string | null;
  isbn13: string | null;
  /** A URL. Nunca o arquivo. A capa mora na origem; a gente guarda a referência. */
  capaUrl: string | null;
  /** O endereço na loja. O Gume é canal, não parasita: a página do livro linka de volta. */
  ondeComprar: string;
};

export class LojaRecusou extends Error {}

/**
 * Uma página, com prazo e com insistência — mas NUNCA traduzindo recusa em ausência.
 *
 * Um 429 ou um 503 não querem dizer "este volume não existe": querem dizer "não consegui
 * perguntar". Ver AGENTS.md, e as cinco vezes em que este projeto confundiu as duas.
 */
async function pagina(url: string, tentativas = 3): Promise<string | null> {
  for (let i = 0; i < tentativas; i++) {
    /**
     * O TEMPO ESGOTADO NÃO TEM CÓDIGO DE STATUS: ele LANÇA.
     *
     * Sem este try, a rede piscando derrubava a raspagem inteira no meio — e o pior é
     * que ela morreria ANTES de gravar o que já tinha achado. Rede caída é a mesma
     * coisa que um 503: a loja não respondeu. Volta para o laço. Ver AGENTS.md.
     */
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": QUEM_SOMOS, Accept: "text/html" },
        signal: AbortSignal.timeout(20_000),
        redirect: "follow",
      });
    } catch {
      await espera(2000 * 2 ** i);
      continue;
    }

    if (res.status === 404) return null; // uma RESPOSTA: a loja não tem esta página
    if (res.status === 429 || res.status >= 500) {
      await espera(2000 * 2 ** i);
      continue;
    }
    if (!res.ok) return null;

    return res.text();
  }

  throw new LojaRecusou(`a loja recusou até o fim: ${url}`);
}

/**
 * O JSON-LD que a loja publica. É a porta educada: dado estruturado, posto ali para ser
 * lido por máquina, e é dele que o Google monta o resultado de busca dela.
 */
function produtoDe(html: string): Record<string, unknown> | null {
  const blocos = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const b of blocos) {
    let json: unknown;
    try {
      json = JSON.parse(b[1]!);
    } catch {
      continue; // um bloco quebrado não derruba a página inteira
    }

    const itens = Array.isArray(json) ? json : [json];
    for (const it of itens) {
      if (it && typeof it === "object" && (it as { "@type"?: string })["@type"] === "Product") {
        return it as Record<string, unknown>;
      }
    }
  }
  return null;
}

/**
 * O NÚMERO DO VOLUME, tirado do título.
 *
 * "Berserk - 81" → 81. "One Piece Vol. 105" → 105. "Berserk Edição de Luxo Vol. 6" → 6.
 *
 * E quando não dá para ler um número, devolve `null` — e o volume NÃO entra. Um número
 * chutado aqui põe o volume 12 na posição do 21, e o leitor descobre isso quando for
 * comprar o que já tem. Campo vazio é honesto; campo chutado vira fato na prateleira.
 */
export function volumeDoTitulo(titulo: string): number | null {
  const t = titulo.replace(/\s+/g, " ").trim();

  // "vol. 12", "volume 12", "- 12", "nº 12", ou o número solto no fim.
  const m =
    t.match(/\b(?:vol\.?|volume|n[ºo°]\.?)\s*(\d{1,3})\b/i) ??
    t.match(/[-–—]\s*(\d{1,3})\s*$/) ??
    t.match(/\s(\d{1,3})\s*$/);

  if (!m) return null;

  const n = Number(m[1]);
  return Number.isInteger(n) && n > 0 && n < 1000 ? n : null;
}

/** Um ISBN-13 de verdade, e só os brasileiros importam aqui (978-85 e 978-65 são a agência nacional). */
function isbnBrasileiro(bruto: unknown): string | null {
  const d = String(bruto ?? "").replace(/[^0-9X]/gi, "");
  if (d.length !== 13) return null;
  return d.startsWith("97885") || d.startsWith("97865") ? d : null;
}

/**
 * O que a gente guarda desta página — e SÓ isto.
 *
 * Repare no que NÃO está aqui: `description`, `offers.price`, `review`, `aggregateRating`.
 * Eles estão no JSON-LD, à mão. E ficam lá. Ver a cerca no cabeçalho, e o teste que a
 * defende.
 */
function soOFato(p: Record<string, unknown>, url: string): VolumeBR | null {
  const titulo = String(p.name ?? "").trim();
  if (!titulo) return null;

  // Kit, box, caixa: embalagem, e não obra. Ver o cabeçalho de NAO_E_VOLUME.
  if (NAO_E_VOLUME.test(titulo)) return null;

  const img = p.image;

  /**
   * `image[0]`: a lista de imagens de um produto tem a PRINCIPAL primeiro — é assim que
   * o schema.org a define, e é assim que a loja a monta para o Google. Aqui a ordem
   * SIGNIFICA alguma coisa, e a fonte declara isso. Ver AGENTS.md.
   */
  const capa = Array.isArray(img) ? img[0] : img;

  return {
    titulo,
    volume: volumeDoTitulo(titulo),
    edicao: edicaoDoTitulo(titulo),
    isbn13: isbnBrasileiro(p.isbn ?? p.gtin13 ?? p.sku),
    capaUrl: typeof capa === "string" && capa.startsWith("http") ? capa : null,
    ondeComprar: url,
  };
}

/** Um volume, pela página dele na loja. */
export async function volumeDaLoja(url: string): Promise<VolumeBR | null> {
  const html = await pagina(url);
  if (!html) return null;

  const p = produtoDe(html);
  if (!p) return null;

  await espera(PAUSA_MS);
  return soOFato(p, url);
}

/**
 * Os endereços de produto de uma loja, pelo SITEMAP.
 *
 * Pelo sitemap, e não varrendo o site: o sitemap é o mapa que a própria loja publica
 * dizendo "estas são as minhas páginas". Seguir o mapa é a diferença entre uma visita e
 * uma invasão.
 */
export async function enderecosDoSitemap(sitemap: string, filtro: RegExp): Promise<string[]> {
  // O sitemap não respondendo é `LojaRecusou`, e nunca uma lista vazia: uma lista vazia
  // aqui diria "a loja não publica livro nenhum", e a raspagem terminaria sorrindo.
  let res: Response;
  try {
    res = await fetch(sitemap, {
      headers: { "User-Agent": QUEM_SOMOS },
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new LojaRecusou(
      `a loja não respondeu ao sitemap (${sitemap}). Isso NÃO quer dizer que ela não ` +
        "publica livro nenhum: quer dizer que não deu para perguntar.",
    );
  }

  if (res.status === 429 || res.status >= 500) {
    throw new LojaRecusou(`a loja recusou o sitemap (${res.status})`);
  }
  if (!res.ok) return [];

  const xml = await res.text();

  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1]!.trim())
    .filter((u) => filtro.test(u));
}

export const PANINI = {
  nome: "Panini",
  sitemap: "https://panini.com.br/sitemap.xml",
};

export const JBC = {
  nome: "JBC",
  sitemap: "https://editorajbc.com.br/wp-sitemap.xml",
};

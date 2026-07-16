/**
 * ════════════════════════════════════════════════════════════════════
 *  AS FONTES DO CATÁLOGO. Open Library primeiro, Google Books como reserva.
 *
 *  ═══ ESTE CABEÇALHO JÁ MENTIU ═══
 *
 *  Ele dizia "We do not scrape anybody", e isso NUNCA foi a regra do projeto —
 *  era uma frase que alguém escreveu com boa intenção e que passou a contradizer
 *  o ai/PRD.md sem ninguém notar.
 *
 *  A regra de verdade, e ela é melhor:
 *
 *      "A linha é entre FATO e OBRA DE TERCEIRO, não entre raspar e não raspar."
 *
 *  Metadado factual (ISBN, título, volume, editora, data, páginas) pode vir de
 *  qualquer fonte: não existe propriedade sobre "este livro tem 320 páginas".
 *  Capa, SÓ POR REFERÊNCIA — a URL, nunca o arquivo. E NUNCA sinopse, resenha,
 *  nota, preço ou qualquer texto de terceiro.
 *
 *  A ordem das fontes é: dump/API aberta → API pública → importação de usuário →
 *  e só então, quando as três falharem, o metadado factual raspado.
 *
 *  Uma frase que sobrevive à decisão que ela descrevia não é um descuido: é uma
 *  mentira educada, e ela mina tudo o que o arquivo diz depois. Ver ai/PRD.md.
 *
 *  Server only: GOOGLE_BOOKS_API_KEY nunca pode chegar num componente de cliente.
 * ════════════════════════════════════════════════════════════════════
 */

export type Hit = {
  source: "openlibrary" | "google_books" | "gume";
  title: string;
  author: string | null;
  isbn13: string | null;
  isbn10: string | null;
  publisher: string | null;
  /** O ano em que ESTA EDIÇÃO foi impressa. */
  publishedYear: number | null;
  /**
   * O ano em que a OBRA foi escrita, que é outro fato.
   *
   * Existe separado de `publishedYear` porque a página de estatísticas inteira
   * gira em torno dele: a distância entre quando a obra nasceu e hoje é o retrato
   * do gosto do leitor, e o ano da reimpressão de 2016 não diz nada sobre isso.
   *
   * Sem este campo, um livro vindo do NOSSO catálogo entrava na estante com o ano
   * da obra nulo (o `hitToWork` só o copiava quando o resultado vinha da Open
   * Library ao vivo), e a página de estatísticas ficava vazia para quem chegasse
   * depois. Ver o backfill em scripts/backfill-work-years.mjs.
   */
  firstPublished: number | null;
  pageCount: number | null;
  coverUrl: string | null;
  openlibraryWorkKey: string | null;
  openlibraryEditionKey: string | null;
  /** Already in our catalogue: the book has an address, so link to it. */
  slug?: string;
};

/**
 * Seis segundos era o teto de uma fonte externa, e seis segundos na frente de
 * alguém digitando é uma eternidade. Duas e meia é o máximo que uma fonte de
 * fora tem para responder antes de a gente devolver o que já temos: melhor um
 * resultado incompleto agora do que o certo depois que a pessoa foi embora.
 */
const TIMEOUT_MS = 2500;

/** An ISBN, hyphens and spaces and all. The reader is holding the book: the ISBN is on the back. */
export function asIsbn(query: string): string | null {
  const digits = query.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{13}$/.test(digits)) return digits;
  if (/^\d{9}[\dX]$/.test(digits)) return digits;
  return null;
}

function year(value: unknown): number | null {
  const found = String(value ?? "").match(/\b(1[45-9]\d{2}|20\d{2})\b/);
  return found ? Number(found[1]) : null;
}

/** A source that is down must degrade to "no results", never to a 500. */
/**
 * Uma resposta, ou nada. NUNCA uma exceção que vire 500 na cara do leitor: se o
 * Google está fora do ar, a busca devolve o que a nossa base tem, e a pessoa nem
 * fica sabendo. Fonte externa que cai não pode derrubar a nossa tela.
 *
 * Ela INSISTE em 429 e 503, e a insistência não é preciosismo: medido, o Google
 * Books devolve 503 em cerca de dois terços das chamadas, de forma intermitente,
 * e responde bem na segunda ou na terceira. Desistir na primeira era o mesmo que
 * não ter fonte nenhuma. A espera dobra a cada tentativa, para não empurrar um
 * serviço que já está pedindo socorro.
 */
async function getJson(
  url: string,
  { tentativas = 1, headers = {} }: { tentativas?: number; headers?: Record<string, string> } = {},
): Promise<unknown | null> {
  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "User-Agent": "Gume (gume.club)", ...headers },
        next: { revalidate: 3600 },
      });

      if (res.ok) return await res.json();

      // 429 (cota) e 503 (indisponível) são transitórios. Todo o resto é resposta.
      if (res.status !== 429 && res.status !== 503) return null;

      // ATENÇÃO: `tentativas` é 1 por padrão, e é de propósito.
      //
      // Insistir é certo no script de capas, que roda de madrugada e tem a noite
      // inteira. É ERRADO no caminho de uma tecla: com três tentativas e espera
      // dobrando, uma busca sem resultado local levava SETE SEGUNDOS, porque o
      // Google responde 503 na maioria das chamadas. Quem digita não espera sete
      // segundos: quem digita desiste. Ver ai/DECISIONS.md.
      await new Promise((r) => setTimeout(r, 300 * 2 ** i));
    } catch {
      return null; // tempo esgotado ou rede caída: a busca segue sem esta fonte
    }
  }
  return null;
}

// ───────────────────────────────────────────────────────────── open library

type OlDoc = {
  title?: string;
  author_name?: string[];
  isbn?: string[];
  publisher?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
  key?: string;
  cover_edition_key?: string;
};

function fromOpenLibrary(doc: OlDoc): Hit | null {
  const title = (doc.title ?? "").trim();
  if (!title) return null;

  const isbns = doc.isbn ?? [];
  return {
    source: "openlibrary",
    title,
    author: doc.author_name?.[0] ?? null,
    isbn13: isbns.find((i) => /^\d{13}$/.test(i)) ?? null,
    isbn10: isbns.find((i) => /^\d{9}[\dX]$/i.test(i)) ?? null,
    /**
     * `publisher[0]` é BENIGNO, e vale saber por quê para não "consertá-lo" e piorar.
     *
     * A lista existe porque um livro pode ser co-publicado. Ninguém entra nela por ter
     * passado perto do livro — não há o equivalente do tradutor. A diferença com o
     * `authors[0]`, que custou 47 mil autores, é essa: lá o primeiro da lista podia ser
     * QUEM NÃO ESCREVEU O LIVRO. Aqui, não. Ver AGENTS.md.
     */
    publisher: doc.publisher?.[0] ?? null,
    publishedYear: doc.first_publish_year ?? null,
    // A OL chama isto de "first publish year": é o ano da OBRA, e é exatamente o
    // dado que a página de estatísticas precisa.
    firstPublished: doc.first_publish_year ?? null,
    pageCount: doc.number_of_pages_median ?? null,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
    openlibraryWorkKey: doc.key ?? null,
    openlibraryEditionKey: doc.cover_edition_key ? `/books/${doc.cover_edition_key}` : null,
  };
}

async function searchOpenLibrary(query: string, isbn: string | null): Promise<Hit[]> {
  const fields = "key,title,author_name,isbn,publisher,first_publish_year,number_of_pages_median,cover_i,cover_edition_key";
  const url = isbn
    // ═══ PELO ISBN, NENHUM FILTRO DE IDIOMA ═══
    //
    // O código é definitivo, e é a única porta para um livro que NÃO está em português:
    // quem tem o volume em inglês na mão escaneia a contracapa e ele entra. Filtrar aqui
    // fecharia essa porta sem ganhar nada — um ISBN não devolve lixo.
    ? `https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&limit=5&fields=${fields}`
    : `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&language=por&limit=20&fields=${fields}`;

  const data = (await getJson(url)) as { docs?: OlDoc[] } | null;
  return (data?.docs ?? []).map(fromOpenLibrary).filter((h): h is Hit => h !== null);
}

// ───────────────────────────────────────────────────────────── google books

type GoogleVolume = {
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    imageLinks?: { thumbnail?: string };
    industryIdentifiers?: { type?: string; identifier?: string }[];
  };
};

function fromGoogle(vol: GoogleVolume): Hit | null {
  const info = vol.volumeInfo;
  const title = (info?.title ?? "").trim();
  if (!info || !title) return null;

  const ids = info.industryIdentifiers ?? [];
  const pick = (type: string) => ids.find((i) => i.type === type)?.identifier ?? null;

  return {
    source: "google_books",
    title: info.subtitle ? `${title}: ${info.subtitle.trim()}` : title,
    /**
     * ⚠ POSIÇÃO NÃO É PAPEL, e o Google Books NÃO declara papel nenhum: ele devolve
     * `authors` como uma lista chapada, sem dizer quem escreveu e quem traduziu.
     *
     * Ou seja: não dá para filtrar aqui, porque não há o que filtrar. Pegar o primeiro é
     * o melhor que a fonte permite — e é por isso que o livro entra com `needs_review`,
     * e é por isso que o autor pode ser corrigido na página do livro.
     *
     * Esta é a única exceção do projeto onde a posição decide sem a fonte declarar que
     * ela decide, e ela está aqui à vista, e não escondida. Ver AGENTS.md.
     */
    author: info.authors?.[0] ?? null,
    isbn13: pick("ISBN_13"),
    isbn10: pick("ISBN_10"),
    publisher: info.publisher ?? null,
    publishedYear: year(info.publishedDate),
    // O Google devolve a data DAQUELA impressão, e não o ano da obra. Fingir que
    // são a mesma coisa faria Dom Casmurro nascer em 2016.
    firstPublished: null,
    pageCount: info.pageCount ?? null,
    // Google serves http and a curl=1 zoom by default; https and no curl reads better on a wall.
    coverUrl: info.imageLinks?.thumbnail?.replace(/^http:/, "https:").replace(/&edge=curl/, "") ?? null,
    openlibraryWorkKey: null,
    openlibraryEditionKey: null,
  };
}

/**
 * O Google Books.
 *
 * A chave vive SÓ no servidor (`process.env`, num módulo que nenhum componente
 * cliente importa), e é isso que o `pnpm audit:security` verifica. Sem chave, a
 * API responde 429 na primeira chamada: a cota anônima é praticamente zero, e foi
 * por isso que este fallback passou meses parecendo "sem resultados".
 *
 * Por ISBN quando existe um ISBN, e por título quando não: são consultas
 * diferentes, e a por ISBN é exata.
 */
async function searchGoogleBooks(query: string, isbn: string | null): Promise<Hit[]> {
  const q = isbn ? `isbn:${isbn}` : query;
  // Pelo ISBN, sem restrição de idioma: o código é definitivo, e é a porta do livro que
  // não está em português. Por título, só português. Ver searchOpenLibrary(), acima.
  const idioma = isbn ? "" : "&langRestrict=pt";
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}${idioma}&maxResults=20&printType=books`;

  const data = (await getJson(url, { headers: googleKey() })) as { items?: GoogleVolume[] } | null;
  return (data?.items ?? []).map(fromGoogle).filter((h): h is Hit => h !== null);
}

/**
 * A chave vai no CABEÇALHO, e não na URL.
 *
 * Na URL ela entra na chave do cache de fetch do Next, e acaba escrita em disco
 * dentro de .next/cache. É servidor, e não vaza para o navegador, mas um segredo
 * copiado para um lugar onde ninguém espera encontrá-lo é um segredo que um dia
 * sai num log, num backup, ou num artefato de build que alguém publica.
 */
function googleKey(): Record<string, string> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  return key ? { "X-Goog-Api-Key": key } : {};
}

/**
 * A capa de um livro que já está no nosso catálogo, procurada lá fora.
 *
 * Usada pelo backfill de capas, e a ordem é a que vale para tudo: primeiro por
 * ISBN (exato), depois por título e autor (aproximado, e só quando não há ISBN ou
 * quando o ISBN não deu em nada).
 *
 * Devolve o ENDEREÇO da capa, e nunca o arquivo. A capa mora na fonte, e a gente
 * guarda a referência: baixar a imagem seria copiar o acervo de outra pessoa para
 * dentro do nosso, e não é isso que a gente pediu emprestado. Ver ai/DECISIONS.md.
 */
export async function findCover(
  isbn: string | null,
  title: string,
  author: string | null,
): Promise<string | null> {
  if (!process.env.GOOGLE_BOOKS_API_KEY) return null;

  const consulta = async (q: string): Promise<string | null> => {
    const url =
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}` +
      `&maxResults=3&printType=books`;

    const data = (await getJson(url, { headers: googleKey() })) as { items?: GoogleVolume[] } | null;

    for (const item of data?.items ?? []) {
      const capa = item.volumeInfo?.imageLinks?.thumbnail;
      if (capa) {
        // https, e sem a dobra de página falsa que o Google desenha na miniatura.
        return capa.replace(/^http:/, "https:").replace(/&edge=curl/, "");
      }
    }
    return null;
  };

  if (isbn) {
    const porIsbn = await consulta(`isbn:${isbn}`);
    if (porIsbn) return porIsbn;
  }

  const limpo = title.trim().slice(0, 80);
  if (!limpo) return null;

  const q = author
    ? `intitle:"${limpo}" inauthor:"${author.trim().slice(0, 50)}"`
    : `intitle:"${limpo}"`;

  return consulta(q);
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  ENRIQUECER UM LIVRO CADASTRADO À MÃO.
 *
 *  Quando ninguém tem o livro, o leitor digita TÍTULO e AUTOR, e mais nada.
 *  Quinze segundos, e o livro está na estante. Editora, ano, páginas, ISBN e
 *  capa são trabalho de máquina, e é a máquina que vai atrás — não a pessoa
 *  que só queria registrar que leu um livro.
 *
 *  ═══ ELA É DESCONFIADA, E TEM QUE SER ═══
 *
 *  Um casamento errado aqui não é um resultado ruim de busca: é a capa de
 *  OUTRO livro escrita na estante de alguém, com a editora de outro livro e o
 *  ISBN de outro livro. E ninguém vai perceber, porque o leitor não pediu nada
 *  disso — ele digitou um título e foi cuidar da vida.
 *
 *  Então o portão é alto: o título que voltou precisa CONTER todas as palavras
 *  significativas do título que a pessoa digitou. "O Cortiço" casa com "O
 *  Cortiço - edição comentada". Não casa com "Cortiço e favela", que é outro
 *  livro. E se a pessoa deu o autor, o autor também tem que bater.
 *
 *  Na dúvida, não enriquece. Um livro com título e autor só é um livro
 *  perfeitamente utilizável; um livro com a capa errada é uma mentira.
 * ════════════════════════════════════════════════════════════════════
 */
export type Enriquecido = {
  isbn13: string | null;
  isbn10: string | null;
  publisher: string | null;
  publishedYear: number | null;
  firstPublished: number | null;
  pageCount: number | null;
  coverUrl: string | null;
};

/** Palavras que não distinguem livro nenhum, e que não valem como prova de casamento. */
const VAZIAS = new Set(["o", "a", "os", "as", "um", "uma", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "the", "of"]);

export function palavras(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((p) => p.length > 1 && !VAZIAS.has(p));
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O ACERVO TEM MESMO ESTE LIVRO?
 *
 *  Parece uma pergunta boba, e não é: `searchLocal` usa trigrama, e trigrama
 *  PERDOA. É por isso que "clarise" acha Clarice — e é ótimo que ache.
 *
 *  Mas o mesmo perdão faz "berserk" devolver SETE livros do nosso acervo,
 *  sendo que não temos um. São títulos que se parecem, e mais nada.
 *
 *  Para MOSTRAR na busca, isso é aceitável: a pessoa olha e descarta. Para
 *  DECIDIR se o acervo tem o livro, é veneno — porque quem decide isso é a
 *  torneira (lib/torneira.ts), e um falso positivo aqui faz o Gume concluir
 *  "já temos" e não anotar o pedido. O leitor sai sem o livro, e ninguém
 *  fica sabendo.
 *
 *  Então aqui a régua é dura: TODAS as palavras que a pessoa digitou têm que
 *  aparecer no título ou no autor de algum livro NOSSO. "sapiens harari" não
 *  casa com nada nosso; "dom casmurro" casa com o Machado que a gente tem.
 *
 *  Perdoar na hora de MOSTRAR, e não perdoar na hora de CONCLUIR. São duas
 *  perguntas diferentes, e elas mereciam duas réguas diferentes.
 * ════════════════════════════════════════════════════════════════════
 */
export function oAcervoTem(consulta: string, livros: Hit[]): boolean {
  const alvo = palavras(consulta);
  if (alvo.length === 0) return false;

  return livros.some((h) => {
    if (h.source !== "gume") return false;
    const nele = new Set(palavras(`${h.title} ${h.author ?? ""}`));
    return alvo.every((p) => nele.has(p));
  });
}

/** Todas as palavras que a pessoa digitou aparecem no que voltou? Senão, é outro livro. */
function bate(digitado: string, veio: string): boolean {
  const alvo = palavras(digitado);
  if (alvo.length === 0) return false;

  const encontrado = new Set(palavras(veio));
  return alvo.every((p) => encontrado.has(p));
}

export async function enriquecer(
  titulo: string,
  autor: string | null,
  /**
   * O ISBN, quando a pessoa deu um.
   *
   * ═══ O FURO QUE ESTE PARÂMETRO FECHA ═══
   *
   * O ISBN era GUARDADO e nunca USADO: a máquina saía procurando por "título autor"
   * mesmo quando tinha o código de barras na mão. E título é justamente o que falha na
   * edição brasileira, que é o caso em que alguém cadastra um livro à mão.
   *
   * O identificador mais preciso que existe estava sendo jogado fora na hora exata da
   * consulta. Agora ele vem primeiro.
   */
  isbn?: string | null,
): Promise<Enriquecido | null> {
  const t = titulo.trim();
  const codigo = asIsbn(isbn ?? "");
  if (!codigo && t.length < 2) return null;

  let hits: Hit[];
  try {
    hits = await search(codigo ?? (autor ? `${t} ${autor}` : t));
  } catch {
    // Uma fonte fora do ar não pode impedir alguém de cadastrar o próprio livro.
    return null;
  }

  for (const hit of hits) {
    /**
     * ═══ O ISBN DISPENSA A CONFERÊNCIA DO TÍTULO ═══
     *
     * Quando a busca foi POR CÓDIGO, o que voltou É o livro: um ISBN é uma edição só.
     * Exigir que o título "bata" rejeitaria a edição certa porque ela traz um subtítulo,
     * ou o nome em outra língua. E quem digitou o código está com o livro na mão, que é
     * a melhor prova que existe.
     */
    if (!codigo) {
      if (!bate(t, hit.title)) continue;
      // Se a pessoa deu o autor, ele é prova, e ela não pode ser ignorada.
      if (autor && !(hit.author && bate(autor, hit.author))) continue;
    }

    return {
      isbn13: hit.isbn13,
      isbn10: hit.isbn10,
      publisher: hit.publisher,
      publishedYear: hit.publishedYear,
      firstPublished: hit.firstPublished,
      pageCount: hit.pageCount,
      coverUrl: hit.coverUrl ?? (await findCover(hit.isbn13, hit.title, hit.author)),
    };
  }

  // Não achou com confiança. O livro entra assim mesmo, e um bibliotecário completa
  // depois: `needs_review` existe exatamente para isto.
  return null;
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O LIVRO INTEIRO, PELO CÓDIGO DE BARRAS.
 *
 *  É o que o cadastro à mão usa: quem está com o livro na mão digita o ISBN, e a ficha
 *  se preenche sozinha — título, autor, editora, ano, páginas e capa.
 *
 *  Isto existe porque a alternativa é pior: um humano cansado preenchendo seis campos no
 *  fim de uma busca que já falhou digita menos e erra mais do que a fonte. A ficha
 *  completa vem do código, e não do esforço.
 *
 *  Diferente de `enriquecer`, devolve o Hit INTEIRO: o formulário precisa do título e do
 *  autor para se preencher, e não só dos complementos.
 * ════════════════════════════════════════════════════════════════════
 */
export async function porIsbn(bruto: string): Promise<Hit | null> {
  const isbn = asIsbn(bruto);
  if (!isbn) return null;

  let hits: Hit[];
  try {
    hits = await search(isbn);
  } catch {
    // Fonte fora do ar devolve "não achei", e nunca um 500 na cara de quem cadastra.
    return null;
  }

  /**
   * O PRIMEIRO, e aqui a ordem SIGNIFICA alguma coisa: a busca foi por ISBN, e um ISBN é
   * uma edição só. Todo hit que voltou é o MESMO livro (a Open Library e o Google
   * respondem sobre a mesma edição), então não há papel nenhum a escolher entre eles.
   * Não é o `[0]` cego que o AGENTS.md proíbe: é uma lista sem papéis.
   */
  const hit = hits[0];
  if (!hit) return null;

  // A capa é o campo que mais falta, e a que vem no hit nem sempre existe: se não veio,
  // procura pelo código antes de desistir. Ver findCover().
  return { ...hit, coverUrl: hit.coverUrl ?? (await findCover(hit.isbn13 ?? isbn, hit.title, hit.author)) };
}

// ─────────────────────────────────────────────────────────────────── search

/**
 * Search by title or by ISBN. Open Library is primary; Google Books answers only
 * when Open Library found nothing, which is often for Brazilian editions.
 *
 * The fallback is sequential on purpose: firing both every time would double the
 * traffic we put on two free services to improve the rare query.
 */
export async function search(rawQuery: string): Promise<Hit[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const isbn = asIsbn(query);
  const hits = await searchOpenLibrary(query, isbn);
  if (hits.length > 0) return dedupe(semIngles(hits, isbn));

  return dedupe(semIngles(await searchGoogleBooks(query, isbn), isbn));
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A SEGUNDA TRAVA, PORQUE A PRIMEIRA É DE OUTRA PESSOA.
 *
 *  O `language=por` é uma promessa da Open Library, e ela é cumprida por uma etiqueta que
 *  alguém pôs lá — e etiqueta errada existe. "Blank Sudoku Grids 12x12", "All 2004-2009
 *  Cadillac XLR Colors" e "Czech Catholic Union of Texas" chegaram à busca de um app
 *  brasileiro porque a busca pedia o mundo inteiro; quando ela parar de pedir, quase tudo
 *  isso morre na fonte. O que escapar por etiqueta errada morre aqui.
 *
 *  ═══ E ELA NÃO CHUTA ═══
 *
 *  `ehIngles` só derruba o que ele AFIRMA ser inglês. "Berserk", "Xlr8" e "Frankenstein"
 *  são `null` — ele não sabe —, e o que ele não sabe passa. Um filtro que chuta some com
 *  o livro certo, e sumir com o livro certo é pior que mostrar um errado: o errado a
 *  pessoa ignora, o certo ela nunca descobre que existiu. Ver lib/idioma.ts.
 *
 *  Pelo ISBN não filtra nada: o código é definitivo, e é a porta do livro em inglês.
 * ════════════════════════════════════════════════════════════════════
 */
function semIngles(hits: Hit[], isbn: string | null): Hit[] {
  if (isbn) return hits;
  return hits.filter((h) => !ehIngles(h.title));
}

/** The same book twice is worse than one fewer result. Match on ISBN, else title + author. */
export function dedupe(hits: Hit[]): Hit[] {
  const seen = new Set<string>();
  return hits.filter((h) => {
    const key = h.isbn13 ?? `${h.title.toLowerCase()}|${(h.author ?? "").toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─────────────────────────────────────────────── our own catalogue, first

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
// A trava do inglês na busca de fora. Ele nunca chuta: ver semIngles(), acima.
import { ehIngles } from "@/lib/idioma";

/**
 * The catalogue we already have. 414k Portuguese editions came in from the Open
 * Library dump, and asking the internet for a book that is sitting in our own
 * database is slow, rude to two free services, and gives a worse answer.
 *
 * Trigrams, not ILIKE: a reader types "memorias postumas" without accents, or
 * "dom casmuro" with a typo, and a catalogue that answers "nothing found" to
 * that is a catalogue that lies. `immutable_unaccent` lets the index do the work.
 *
 * An ISBN wins outright: it is the only identifier a reader can hold in their
 * hand, and it is exact.
 */
/**
 * ════════════════════════════════════════════════════════════════════
 *  "MEMORIAS POSTUMAS BRAS CUBAS ANTOFAGICA" SÃO DUAS PERGUNTAS.
 *
 *  Esta função acha a editora dentro da frase e a separa do resto. Devolve a editora
 *  (para escolher a edição) e a frase SEM ela (para procurar o livro).
 *
 *  ═══ POR QUE UM SÓ NOME, E NÃO UMA LISTA ═══
 *
 *  Só o melhor casamento, e só se ele for FORTE (0.8). Uma editora que "quase" casa é
 *  uma editora que a pessoa não digitou — e tirar da busca do título uma palavra que
 *  ela quis dizer é pior do que não ter reconhecido editora nenhuma.
 *
 *  O limiar é alto de propósito. Na dúvida, a frase fica inteira, e a busca funciona
 *  como funcionava.
 *
 *  ═══ E POR QUE ISSO NÃO CUSTA CARO ═══
 *
 *  São 74.625 editoras distintas. Sem índice, isto seria uma varredura completa a cada
 *  tecla. O índice de trigrama da migration 0040 faz o `<%` responder em milissegundos.
 * ════════════════════════════════════════════════════════════════════
 */
async function separarEditora(bruto: string): Promise<{ editora: string | null; query: string }> {
  // Uma palavra só não é "livro + editora": é o nome de um livro, ou de uma editora.
  // Separar aqui deixaria a busca do título VAZIA, e a pessoa veria o catálogo inteiro.
  const palavras = bruto.split(/\s+/).filter(Boolean);
  if (palavras.length < 3) return { editora: null, query: bruto };

  const [achada] = await db.execute<{ publisher: string; score: number }>(sql`
    select e.publisher,
           word_similarity(immutable_unaccent(lower(e.publisher)),
                           immutable_unaccent(lower(${bruto}))) as score
      from editions e
     where e.publisher is not null
       -- O operador <% usa o índice GIN da 0040. É a mesma pergunta do word_similarity
       -- acima, só que respondida pelo índice em vez de linha a linha.
       and immutable_unaccent(lower(e.publisher)) <% immutable_unaccent(lower(${bruto}))
     order by score desc
     limit 1`);

  // 0.8 é ALTO, e é de propósito: tirar da busca do título uma palavra que a pessoa
  // quis dizer é pior do que não ter reconhecido editora nenhuma.
  if (!achada || Number(achada.score) < 0.8) return { editora: null, query: bruto };

  /**
   * A palavra da frase que casou com a editora, e só ela.
   *
   * "Companhia das Letras" tem três palavras, e "das" está em meio mundo de título. O
   * que sai da busca do título é a palavra que a pessoa digitou e que casa com o nome
   * da editora — cada uma julgada por si.
   */
  const restantes = palavras.filter(
    (p) => p.length < 4 || !casaComEditora(p, achada.publisher),
  );

  // Se sobrou nada, a frase ERA o nome da editora. Aí não há livro a procurar, e a
  // busca de título continua com a frase inteira: melhor um resultado ruim que nenhum.
  if (restantes.length === 0) return { editora: null, query: bruto };

  /**
   * ════════════════════════════════════════════════════════════════════
   *  A EDITORA VEM NO FIM DA FRASE. E ESTA REGRA É O CONSERTO DE UM BUG SÉRIO.
   *
   *  ═══ O QUE ESTAVA ACONTECENDO ═══
   *
   *  Quem digitava **"machado de assis"** não achava os livros do Machado.
   *
   *  Existe uma editora chamada **"Machado"** no acervo. O `word_similarity` de um nome de
   *  editora de UMA palavra contra uma frase que contém essa palavra dá **1,0** — o teto.
   *  Passava folgado pelo limiar de 0,8, que existia justamente para ser rigoroso.
   *
   *  Aí a busca ARRANCAVA "machado" da frase, procurava o título "de assis", e ordenava
   *  tudo pela editora "Machado" — que é a primeira chave da ordenação. O resultado: livros
   *  de uma editora obscura, e nenhum livro do maior escritor brasileiro.
   *
   *  O mesmo com "revolucao dos bixos": existe uma editora "Revolução", e a busca virava
   *  "dos bixos".
   *
   *  ═══ POR QUE "NO FIM" É A REGRA CERTA ═══
   *
   *  Porque é como gente escreve. Ninguém digita "antofagica dom casmurro": digita
   *  **"dom casmurro antofagica"** — o livro primeiro, e a editora como um qualificador no
   *  fim, do jeito que a gente fala ("o Dom Casmurro da Antofágica").
   *
   *  Uma editora reconhecida no MEIO ou no COMEÇO da frase quase nunca é uma editora: é uma
   *  palavra do título ou o nome do autor, que por azar também é o nome de uma editora.
   *
   *  E o custo do erro é assimétrico. Não reconhecer uma editora custa uma edição errada na
   *  capa. Reconhecer uma que não existe **arranca uma palavra da busca da pessoa** — e ela
   *  não acha o livro que procurava, sem nunca saber por quê.
   * ════════════════════════════════════════════════════════════════════
   */
  const ultima = palavras[palavras.length - 1]!;

  if (!casaComEditora(ultima, achada.publisher)) {
    return { editora: null, query: bruto };
  }

  return { editora: achada.publisher, query: restantes.join(" ") };
}

/** Sem acento, sem caixa: "antofagica" tem que achar "Antofágica". */
const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** A palavra é uma das palavras do nome desta editora? */
function casaComEditora(palavra: string, editora: string): boolean {
  return semAcento(editora).split(/\s+/).includes(semAcento(palavra));
}

export async function searchLocal(rawQuery: string): Promise<Hit[]> {
  const bruto = rawQuery.trim();
  if (bruto.length < 2) return [];

  const isbn = asIsbn(bruto);

  /**
   * ═══ A EDITORA SAI DA BUSCA DO TÍTULO, E VIRA UM FILTRO ═══
   *
   * "memorias postumas bras cubas antofagica" é UMA frase, e uma pessoa lê nela DUAS
   * coisas: o livro, e a editora. A busca lia uma só, e por isso errava duas vezes.
   *
   *   1. "antofagica" entrava na comparação do TÍTULO e derrubava a nota — "Memórias
   *      Póstumas de Brás Cubas" casa mal com uma frase que tem uma palavra a mais que
   *      não está nele. O primeiro resultado virava um estudo crítico SOBRE o livro,
   *      que tem "Memórias Póstumas" no título e casa melhor.
   *
   *   2. E, mesmo achando o livro, o app mostrava uma edição qualquer — quando a
   *      pessoa tinha DITO qual queria.
   *
   * Agora a editora é reconhecida, tirada da busca do título, e usada para escolher.
   */
  const { editora, query } = isbn
    ? { editora: null, query: bruto }
    : await separarEditora(bruto);

  /**
   * O limiar do trigrama (0.45) já vem fixado na conexão, em lib/db/index.ts:
   * toda conexão do pool nasce com ele, então a busca não paga nem um BEGIN por
   * tecla, e o resultado é o mesmo em qualquer conexão que ela caia.
   */
  const rows = await db.execute<{
    title: string; author: string | null; isbn13: string | null;
    publisher: string | null; published_year: number | null;
    page_count: number | null; cover_url: string | null;
    openlibrary_key: string | null; slug: string; first_published: number | null;
  }>(
    isbn
      ? sql`
          select w.title, a.name as author, e.isbn13, e.publisher, e.published_year,
                 e.page_count, e.cover_url, w.openlibrary_key, w.slug, w.first_published
          from editions e
          join works w on w.id = e.work_id
          left join authors a on a.id = w.author_id
          where e.isbn13 = ${isbn}
          limit 5`
      : sql`
          -- A UNION, not an OR. An OR spanning two joined tables cannot use
          -- either GIN index, and Postgres falls back to a sequential scan over
          -- 373k works: 1.8 seconds per keystroke. Split in two, each half hits
          -- its own trigram index, and the whole thing lands in milliseconds.
          -- O TÍTULO casa por semelhança de nome inteiro OU de melhor palavra, e
          -- a segunda é a que salva a consulta curta.
          --
          -- "vagabundo" contra "O vagabundo das mãos de oiro" marca 0.37 de
          -- semelhança de nome inteiro, e some abaixo de qualquer limiar decente.
          -- Pela melhor PALAVRA do título, marca 1.00. Uma palavra é o que a
          -- pessoa digita; o título inteiro é o que ela está procurando, e exigir
          -- que ela digite o título inteiro é o oposto de perdoar.
          --
          -- É o mesmo erro que eu já tinha corrigido no ramo do AUTOR e que ficou
          -- de pé no ramo do título. Achado por um teste rodando num banco vazio.
          with hit as (
            select w.id,
                   greatest(
                     similarity(immutable_unaccent(lower(w.title)),
                                immutable_unaccent(lower(${query}))),
                     word_similarity(immutable_unaccent(lower(${query})),
                                     immutable_unaccent(lower(w.title)))
                   ) as score,
                   -- O título É a busca, e não apenas a contém. Ver a nota longa mais abaixo.
                   -- O subtítulo não conta: "Dom Casmurro: romance" é Dom Casmurro.
                   --
                   -- ═══ E O ARTIGO NÃO CONTA, PORQUE NINGUÉM O DIGITA ═══
                   --
                   -- Quem procura O Príncipe digita "principe". Quem procura A Metamorfose
                   -- digita "metamorfose". O artigo é a primeira coisa que a pessoa corta,
                   -- e era a única coisa que separava a busca dela do título exato.
                   --
                   -- Sem isto, "principe" NÃO casava exato com "O Príncipe" — e o livro
                   -- caía para o meio da lista, atrás de "Memória sobre a reforma dos
                   -- alambiques: ou de hum príncipe...", que é onde um leitor de verdade
                   -- decide que a busca não funciona.
                   --
                   -- ═══ E O QUE EU TENTEI ANTES DISTO, E QUEBROU ═══
                   --
                   -- Um desempate por COBERTURA: quanto do título a busca cobre. A ideia era
                   -- boa (o word_similarity dá 1.0 a qualquer título que CONTENHA a palavra,
                   -- então um livro de setenta caracteres empata com "O Príncipe"), e ela
                   -- derrubou dois testes que existem há meses.
                   --
                   -- O motivo: quando a busca reconhece uma EDITORA no meio da frase, ela
                   -- ENCURTA a consulta. "revolucao dos bixos" vira "dos bixos" (a editora
                   -- "Revolução" existe, e casa 1.0). Aí a cobertura passa a punir o título
                   -- longo — e "A revolução dos bichos" cai fora da lista, que é exatamente
                   -- o livro procurado.
                   --
                   -- Uma métrica que só é justa quando a consulta está inteira não pode ser
                   -- um desempate global. O artigo, sozinho, resolve o caso do relatório, e
                   -- não mexe em mais nada. NÃO reintroduza a cobertura sem ler isto.
                   regexp_replace(
                     immutable_unaccent(lower(split_part(w.title, ':', 1))),
                     '^(o|a|os|as|um|uma|the)\\s+', ''
                   ) = regexp_replace(
                     immutable_unaccent(lower(${query})),
                     '^(o|a|os|as|um|uma|the)\\s+', ''
                   ) as titulo_exato,

                   (w.author_id is not null) as assinada
            from works w
            where immutable_unaccent(lower(w.title)) % immutable_unaccent(lower(${query}))
               or immutable_unaccent(lower(${query})) <% immutable_unaccent(lower(w.title))
            union all
            -- O ramo do AUTOR leva a semelhança DE VERDADE, e não uma nota fixa.
            --
            -- Com 0.35 fixo, quem digitava "machado de assis" recebia os livros
            -- ESCRITOS SOBRE o Machado (cujo título casa quase perfeito com a
            -- busca, nota 0.9) e nunca os livros DELE, que ficavam empatados lá
            -- embaixo com todos os outros 281. Quem digita o nome de um autor
            -- quer o que ele ESCREVEU: a nota do ramo do autor é a semelhança do
            -- nome, que para "machado de assiz" dá 0.85 e disputa de igual.
            -- E o ramo do AUTOR casa pela MELHOR PALAVRA do nome, como a seção de
            -- autores já fazia. "nietzche" contra "Friedrich Nietzsche" marca 0.32
            -- de semelhança de nome inteiro (e some) e 0.58 de melhor palavra.
            --
            -- Este mesmo erro apareceu três vezes: no título, no ramo do autor
            -- dentro da busca de obras, e na seção de autores. A lição, escrita
            -- aqui para a próxima pessoa: comparar o que a pessoa digitou com o
            -- NOME INTEIRO exige que ela saiba o nome inteiro, e ninguém sabe.
            select w.id,
                   greatest(
                     similarity(immutable_unaccent(lower(a.name)),
                                immutable_unaccent(lower(${query}))),
                     word_similarity(immutable_unaccent(lower(${query})),
                                     immutable_unaccent(lower(a.name)))
                   ) as score,
                   -- Casou pelo AUTOR: o título não é a busca. Falso, e não nulo — um
                   -- nulo aqui envenenaria o bool_or e mataria o desempate do outro ramo.
                   false as titulo_exato,
                   -- Casou pelo autor: por definição, ela tem autor.
                   true as assinada
            from authors a
            join works w on w.author_id = a.id
            where immutable_unaccent(lower(a.name)) % immutable_unaccent(lower(${query}))
               or immutable_unaccent(lower(${query})) <% immutable_unaccent(lower(a.name))
          ),
          -- O DESEMPATE, e ele é o que faz a busca por AUTOR prestar.
          --
          -- Machado tem 282 obras no catálogo, e o ramo do autor dá a todas a
          -- mesma nota (0.35). Empatadas, as vinte que sobravam eram um corte
          -- arbitrário, e caíam em livros SOBRE o Machado, sem capa: quem
          -- buscava "machado de assis" não via Dom Casmurro em lugar nenhum.
          --
          -- Ter capa é o melhor sinal barato de que a obra é uma EDIÇÃO de
          -- verdade, que alguém publicou e alguém reconhece, e não uma ficha
          -- solta do dump. Então, no empate, quem tem capa vem primeiro.
          best as (
            select h.id,
                   max(h.score) as score,
                   -- ═══ O TÍTULO QUE **É** O QUE A PESSOA DIGITOU GANHA DE QUEM SÓ O CONTÉM ═══
                   --
                   -- Buscar "dom casmurro" devolvia, em primeiro, "Ciumento de carteirinha:
                   -- uma aventura com Dom Casmurro". E não era um erro de nota: o título
                   -- desse livro CONTÉM "Dom Casmurro" inteiro, então a semelhança de
                   -- melhor palavra dá 1.00 — exatamente igual à do livro de verdade.
                   --
                   -- Empatados em 1.00, o desempate caía na capa, e o livro sobre o livro
                   -- ganhava. Todo clássico brasileiro tem uma prateleira de estudos
                   -- críticos com o nome dele no título, e essa prateleira estava
                   -- enterrando o original.
                   --
                   -- SER o que a pessoa digitou é mais forte do que conter. Não é peso:
                   -- é uma pergunta de sim ou não, e ela vem antes da nota.
                   bool_or(h.titulo_exato) as titulo_exato,
                   -- ═══ UMA FICHA ASSINADA GANHA DE UMA FICHA SEM AUTOR ═══
                   --
                   -- Buscar "memorias postumas de bras cubas" trazia a obra de Machado E
                   -- uma ficha idêntica assinada por ninguém. Duas linhas, o mesmo livro,
                   -- e uma delas dizendo na cara de quem procura um clássico que o Gume
                   -- não sabe quem escreveu o clássico.
                   --
                   -- Fundir as duas seria o certo, e nem sempre dá: nesse caso existe uma
                   -- ADAPTAÇÃO com o mesmo título, de outro autor, e fundir por título
                   -- entregaria a obra de Machado para o adaptador. Ver
                   -- scripts/autor-desconhecido.mjs — 302 fichas se fundiram, e 83 ficaram
                   -- órfãs de propósito, porque o título é ambíguo.
                   --
                   -- Não dá para PROVAR de quem é a ficha órfã. Mas não é preciso provar
                   -- nada para ordenar: uma ficha assinada é uma ficha melhor. Isto é
                   -- ordem, e não adivinhação — a órfã continua lá, embaixo, e ninguém
                   -- perde livro nenhum.
                   bool_or(h.assinada) as assinada,
                   exists (
                     select 1 from editions e
                      where e.work_id = h.id and e.cover_url is not null
                   ) as tem_capa,
                   -- ═══ A EDITORA QUE A PESSOA PEDIU ═══
                   --
                   -- Quem digita "bras cubas antofagica" quer O LIVRO DA ANTOFÁGICA. Se
                   -- esta obra tem uma edição dessa editora, ela vem antes de tudo — de
                   -- um estudo crítico com título parecido, e das outras vinte edições.
                   --
                   -- Isto é DESEMPATE, e não peso: só entra quando a pessoa nomeou uma
                   -- editora, e só sobe quem realmente tem edição dela. Quando ninguém
                   -- nomeou editora, o parâmetro é nulo e esta coluna é falsa para todo
                   -- mundo — a ordem é exatamente a que era antes.
                   exists (
                     select 1 from editions e
                      where e.work_id = h.id
                        and ${editora}::text is not null
                        and e.publisher = ${editora}
                   ) as e_a_editora
              from hit h
             group by h.id
             order by e_a_editora desc, bool_or(h.titulo_exato) desc,
                      max(h.score) desc, bool_or(h.assinada) desc, tem_capa desc
             limit 20
          )
          select w.title, a.name as author, e.isbn13, e.publisher, e.published_year,
                 e.page_count, e.cover_url, w.openlibrary_key, w.slug, w.first_published
          from best
          join works w on w.id = best.id
          left join authors a on a.id = w.author_id
          -- A EDIÇÃO QUE APARECE É A QUE A PESSOA PEDIU.
          -- Antes, o app escolhia uma edição qualquer (a primeira com capa) mesmo quando
          -- a pessoa tinha DITO qual queria. Mostrar a capa da Ática para quem escreveu
          -- "antofagica" é ouvir metade da frase.
          left join lateral (
            select e2.* from editions e2
            where e2.work_id = w.id
            order by (${editora}::text is null or e2.publisher is distinct from ${editora}),
                     (e2.cover_url is null),
                     e2.created_at
            limit 1
          ) e on true
          order by best.e_a_editora desc, best.titulo_exato desc, best.score desc,
                   best.assinada desc, best.tem_capa desc, (e.cover_url is null)`,
  );

  return rows.map((r) => ({
    source: "gume" as const,
    title: r.title,
    author: r.author,
    isbn13: r.isbn13,
    isbn10: null,
    publisher: r.publisher,
    publishedYear: r.published_year,
    firstPublished: r.first_published,
    pageCount: r.page_count,
    coverUrl: r.cover_url,
    openlibraryWorkKey: r.openlibrary_key,
    openlibraryEditionKey: null,
    slug: r.slug,
  }));
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A BUSCA RESPONDE EM SEÇÕES, e não numa lista única.
 *
 *  Quem digita o nome de um autor quer o AUTOR. Numa lista só, os livros
 *  ESCRITOS SOBRE ele (que têm o nome dele no título, e portanto casam
 *  quase perfeito) esmagam os livros DELE. Dá para consertar com peso de
 *  nota, e a gente consertou, e isso é gato e rato: todo autor canônico
 *  tem biografia e estudo crítico com o nome no título, e o nosso
 *  catálogo é de clássicos. O caso volta em Nietzsche, Clarice,
 *  Shakespeare, Dostoiévski, Kafka.
 *
 *  A saída não é ranking mais esperto: é a busca parar de fingir que
 *  autor e obra são a mesma coisa. Duas seções, e a de autores só
 *  aparece quando o casamento de nome é FORTE.
 * ════════════════════════════════════════════════════════════════════
 */
export type Autor = {
  slug: string;
  name: string;
  nationality: string | null;
  /** Quantas obras dele o catálogo tem. Não é placar: é o tamanho da estante. */
  works: number;
  /** Uma capa de um livro dele, para o autor ter cara. */
  coverUrl: string | null;
};

/**
 * Autores cujo NOME casa forte com o que a pessoa digitou.
 *
 * A métrica é `word_similarity`, e não `similarity`, e a diferença é toda: ela
 * compara a busca com a MELHOR PALAVRA do nome, e não com o nome inteiro.
 *
 * Quase ninguém digita "Franz Kafka". As pessoas digitam "kafka", "orwell",
 * "clarice", "nietzsche". Contra o nome inteiro, "kafka" dá 0.50 de semelhança e
 * some abaixo de qualquer limiar decente; contra a melhor palavra, dá 1.00. Um
 * limiar sobre o nome inteiro estava, na prática, exigindo que a pessoa soubesse
 * o nome completo do autor para achá-lo, o que é o oposto de perdoar.
 *
 * O limiar (0.55) é alto de propósito: a seção de autores só aparece quando a
 * busca é claramente sobre uma pessoa. Numa busca por título ela não aparece, e a
 * tela não fica pedindo desculpa por uma seção vazia.
 */
export async function searchAuthors(rawQuery: string): Promise<Autor[]> {
  const query = rawQuery.trim();
  if (query.length < 3) return [];

  /**
   * O `distinct on (nome normalizado)` é um CURATIVO, e a nota é honesta.
   *
   * O dump da Open Library traz o mesmo autor escrito de quatro jeitos ("Machado
   * de Assis", "Machado De Assis", "Machado De ASSIS"), e o unique do nome é
   * sensível a maiúscula, então eles viraram quatro linhas de autor, com as obras
   * repartidas entre elas. Sem isto, a seção de autores mostrava quatro Machados.
   *
   * Aqui a busca mostra só o mais completo de cada nome. O conserto DE VERDADE é
   * fundir as linhas duplicadas no catálogo, e isso é uma mudança de dado que não
   * volta atrás: dois homônimos de verdade seriam fundidos junto. Fica anotado no
   * ai/PLAN.md, para uma decisão tomada acordado, e não no meio de outra coisa.
   */
  const rows = await db.execute<{
    slug: string; name: string; nationality: string | null;
    works: number; cover_url: string | null; score: number;
  }>(sql`
    -- Duas etapas, e a ordem entre elas é o que faz funcionar.
    --
    -- Dentro: o distinct on colapsa o mesmo autor escrito de quatro jeitos, e ele
    -- OBRIGA o order by a começar pelo nome normalizado. Ou seja, a ordem que sai
    -- daqui é alfabética, que não quer dizer nada.
    --
    -- Fora: a ordem que VALE, por semelhança de palavra e por tamanho de obra.
    -- Cortar o limite antes disso era cortar alfabeticamente: buscar "machado de
    -- assiz" trazia "António Machado de Faria" e nunca chegava no Machado.
    -- Os SINÔNIMOS entram aqui, e é o que faz o conserto do autor aparecer na tela.
    --
    -- A Open Library guarda Tolstói como "Лев Толстой", e o mangaká em kanji. O nome
    -- de EXIBIÇÃO é normalizado para o alfabeto latino (lib/nomes.ts), e as outras
    -- grafias — o cirílico, o kanji, o inglês, a forma invertida — ficam em
    -- alt_names, só para serem procuradas.
    --
    -- Sem isto, quem digitasse "Tolstoy", "Толстой" ou "Lev" não acharia nada, e o
    -- conserto de 47 mil autores existiria só no banco. Um conserto que não aparece na
    -- tela não é um conserto.
    with candidatos as (
      select distinct on (immutable_unaccent(lower(a.name)))
             a.id, a.slug, a.name, a.nationality,
             greatest(
               word_similarity(immutable_unaccent(lower(${query})),
                               immutable_unaccent(lower(a.name))),
               word_similarity(immutable_unaccent(lower(${query})),
                               immutable_unaccent(lower(alt_texto(a.alt_names))))
             ) as score,
             (select count(*)::int from works w2 where w2.author_id = a.id) as works
        from authors a
       where (immutable_unaccent(lower(${query})) <% immutable_unaccent(lower(a.name))
              or immutable_unaccent(lower(${query}))
                 <% immutable_unaccent(lower(alt_texto(a.alt_names))))
         and exists (select 1 from works w where w.author_id = a.id)
       order by immutable_unaccent(lower(a.name)),
                (select count(*) from works w2 where w2.author_id = a.id) desc
    )
    select c.slug, c.name, c.nationality, c.works, c.score,
           (select e.cover_url
              from works w3
              join editions e on e.work_id = w3.id
             where w3.author_id = c.id and e.cover_url is not null
             order by e.created_at
             limit 1) as cover_url
      from candidatos c
     order by c.score desc, c.works desc
     limit 4`);

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    nationality: r.nationality,
    works: r.works,
    coverUrl: r.cover_url,
  }));
}

/**
 * A busca, de verdade. O nosso catálogo primeiro, e a internet só quando ele vem
 * curto. Isso não é otimização: é a razão de o import existir. Um livro que a
 * gente já tem não pode fazer o leitor esperar na API de outra pessoa.
 *
 * ═══ E A INTERNET NUNCA BLOQUEIA UMA TECLA ═══
 *
 * `fora: false` (o padrão) responde SÓ com o que é nosso, e responde em
 * milissegundos. Foi assim que a busca deixou de levar quatro a sete segundos
 * quando a pessoa digitava um livro que a gente não tinha: a resposta esperava a
 * Open Library e o Google, um atrás do outro, no meio do caminho da tecla.
 *
 * Quem quer a internet pede em SEGUNDA chamada (`fora: true`), depois de a tela
 * já ter mostrado o que temos. Assim a espera é do complemento, e não da
 * resposta: a tela nunca fica parada esperando um serviço que não é nosso.
 */
export async function searchAll(
  rawQuery: string,
  { fora = false }: { fora?: boolean } = {},
): Promise<Hit[]> {
  const mine = await searchLocal(rawQuery);
  if (!fora) return mine;
  if (mine.length >= 5) return mine;

  const outside = await search(rawQuery);
  return dedupe([...mine, ...outside]);
}

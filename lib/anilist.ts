import { ehLatino } from "./nomes.ts";
import { limparNomeDeAutor } from "./autores.ts";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A ANILIST. API GraphQL pública, oficial e gratuita. NÃO é raspagem.
 *
 *  O acervo tem SETE obras entre os cinquenta mangakás do cânone, e três
 *  delas são volumes de Berserk. O dump da Open Library não tem mangá, e
 *  nenhum backfill conserta isso: o dado precisa vir de outro lugar.
 *
 *  ═══ ELA É DE SÉRIE, E NÃO DE VOLUME ═══
 *
 *  A AniList sabe que Vagabond tem 37 volumes. Ela NÃO sabe a capa do volume
 *  12, nem o ISBN dele, nem a data em que ele saiu no Brasil.
 *
 *  Isso não é uma falha: é a forma do dado, e o desenho tem que assumi-la. O
 *  volume é um NÚMERO pendurado numa série — não é um objeto com capa própria.
 *  Fingir o contrário criaria 37 fichas vazias por série, que é exatamente o
 *  entulho que a poda acabou de tirar do acervo.
 * ════════════════════════════════════════════════════════════════════
 */

const ENDERECO = "https://graphql.anilist.co";

export type Serie = {
  anilistId: number;
  /** O que vai para a TELA. */
  titulo: string;
  /** Todos os outros nomes, só para serem procurados. É o que faz "Ataque dos Titãs" achar. */
  sinonimos: string[];
  /** O mangaká. Já passou pelo portão e pela escolha de grafia latina. */
  autor: string | null;
  /** Quem desenha, quando é outra pessoa (Death Note: Ohba escreve, Obata desenha). */
  ilustrador: string | null;
  volumes: number | null;
  status: "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown";
  ano: number | null;
  capa: string | null;
};

/**
 * ═══ O PAPEL DO STAFF. O BUG DO TRADUTOR, PELA TERCEIRA VEZ ═══
 *
 * A lista de `staff` da AniList para Berserk tem DEZOITO pessoas:
 *
 *     Story & Art (vols 1-41)   → Kentarou Miura     ← é ele
 *     Supervisor (vols 41- )    → Kouji Mori
 *     Translator (Portuguese)   → Drik Sada          ← não é ele
 *     Lettering (Portuguese)    → Diógenes Dih       ← nem ele
 *     Editing (Portuguese)      → Diego Rodeguero    ← nem ele
 *
 * Pegar `staff[0]` funcionaria em Berserk por SORTE — e é exatamente a forma do
 * erro que já custou 47 mil autores neste projeto (o import lia o autor do
 * registro de EDIÇÃO, e pegava o tradutor) e que assinou "A Morte de Ivan Ilitch"
 * com o nome de quem a traduziu.
 *
 * Terceira vez na mesma semana. Aqui o papel é FILTRADO, e não ordenado.
 */
/**
 * ═══ "ORIGINAL CREATOR" NÃO É AUTOR DESTE LIVRO ═══
 *
 * E é este papel — e não o número de volumes — que separa a obra do spin-off.
 *
 *     Dragon Ball                      Story & Art       ← ele desenhou
 *     Dragon Ball Super                Original Creator  ← ele emprestou o mundo
 *     Super Dragon Ball Heroes         Original Creator
 *     Koisuru ONE PIECE                Original Creator
 *
 * "Original Creator" quer dizer que outra pessoa escreveu e desenhou aquele livro, em
 * cima do universo dele. É um livro de verdade, mas NÃO é um livro dele — e semeá-lo
 * como se fosse encheria o acervo com vinte "séries do Toriyama" que o Toriyama não fez.
 *
 * ⚠ A PRIMEIRA VERSÃO FILTRAVA POR NÚMERO DE VOLUMES, e isso matou ONE PIECE e BERSERK:
 * série EM PUBLICAÇÃO tem `volumes: null` na AniList. O filtro apagava exatamente as
 * duas maiores obras do acervo que a gente estava tentando trazer.
 *
 * O papel diz a verdade; a contagem de volumes só diz se a série acabou.
 */
const ESCREVE = ["story & art", "story"];
const DESENHA = ["story & art", "art"];

/**
 * ═══ O QUE NÃO É A OBRA ═══
 *
 * Databook, artbook, guia oficial, antologia, omake, 4-koma, "log book", edição
 * colorida. Eles existem, são livros de verdade — e ninguém os procura. Semeá-los
 * repetiria no mangá o entulho que a poda acabou de tirar do acervo.
 *
 * A régua é a MESMA da poda do catálogo: corte por REGRA, e não por teto. Um teto de
 * "3 séries por mangaká" mataria Pluto e 20th Century Boys (Urasawa), Black Jack e
 * Fênix (Tezuka), Fire Punch (Fujimoto) — e deixaria entrar três porcarias de um
 * mangaká que só tem uma obra boa.
 *
 * O que a regra não pegar, a TORNEIRA pega: a fila de buscas sem resultado já existe, e
 * é ela que diz o que importar em seguida. Curadoria por regra + demanda, nunca por
 * número mágico.
 */
const NAO_E_OBRA =
  /\b(omake|4-?koma|yonkoma|log ?book|data ?book|art ?book|fan ?book|guide ?book|guidebook|illustrations?|artworks?|anthology|antologia|official|color edition|full colou?r|character book|profiles?|encyclopedia|magazine|calendar|sticker)\b/i;

/** O papel vem como "Story & Art (vols 1-41)". O parêntese não muda quem é a pessoa. */
function papel(bruto: string): string {
  return bruto.toLowerCase().split("(")[0]!.trim();
}

type StaffEdge = {
  role?: string;
  node?: { name?: { full?: string; native?: string; alternative?: string[] } };
};

/**
 * O nome do mangaká, em alfabeto latino.
 *
 * A AniList devolve `full` já romanizado ("Kentarou Miura") e `native` em kanji
 * ("三浦建太郎"). Reusa `lib/nomes.ts`, que é o MESMO problema do Tolstói: o nome nativo
 * é um borrão numa tela brasileira, e ele vira sinônimo de busca em vez de sumir.
 */
function nomeDoStaff(node: StaffEdge["node"]): string | null {
  const full = node?.name?.full?.trim() ?? "";
  const native = node?.name?.native?.trim() ?? "";

  const escolhido = ehLatino(full) ? full : ehLatino(native) ? native : full || native;
  return limparNomeDeAutor(escolhido);
}

/**
 * ═══ O TÍTULO, E O QUE EU **NÃO** CONSIGO FAZER ═══
 *
 * No Brasil, Shingeki no Kyojin é "Ataque dos Titãs". E "Ataque dos Titãs" ESTÁ nos
 * sinônimos da AniList — junto com "Ataque a los Titanes", "L'Attacco dei Giganti",
 * "Atak Tytanów" e "Útok titánů".
 *
 * **A AniList não diz qual sinônimo é de qual idioma.** São vinte línguas numa sacola,
 * sem etiqueta. Adivinhar o português pelo acento pegaria o espanhol e o italiano do
 * mesmo jeito — e o Kimetsu no Yaiba não tem sinônimo em português nenhum.
 *
 * Então a regra é a mesma do nome do autor, e pela mesma razão: **não se inventa.**
 *
 *   TELA:  o inglês, depois o romaji. NUNCA o kanji sozinho.
 *   BUSCA: TODOS os sinônimos, incluindo o português. Quem digita "Ataque dos
 *          Titãs" acha, mesmo que a tela diga "Attack on Titan".
 *
 * O título brasileiro OFICIAL (o que a Panini imprime na capa) é uma escolha
 * editorial, e ela é feita a mão — como o cânone. Ver `seed/manga-pt.ts`. O que não
 * estiver lá fica em inglês, e vira tarefa de bibliotecário.
 *
 * Um título chutado é pior que um título honesto em inglês: o errado ninguém sabe que
 * está errado.
 */
function tituloDe(t: { romaji?: string; english?: string; native?: string }): {
  titulo: string;
  nativos: string[];
} {
  const romaji = t.romaji?.trim() ?? "";
  const english = t.english?.trim() ?? "";
  const native = t.native?.trim() ?? "";

  const titulo = [english, romaji, native].find((x) => x && ehLatino(x)) ?? native ?? romaji;

  return {
    titulo,
    nativos: [romaji, english, native].filter((x) => x && x !== titulo),
  };
}

const STATUS: Record<string, Serie["status"]> = {
  RELEASING: "ongoing",
  FINISHED: "completed",
  HIATUS: "hiatus",
  CANCELLED: "cancelled",
  NOT_YET_RELEASED: "unknown",
};

/**
 * ═══ PROCURA-SE O AUTOR, E NÃO O TÍTULO ═══
 *
 * A primeira versão usava `Media(search: "Akira Toriyama")`. E a AniList obedeceu ao pé
 * da letra: ela procurou "Akira Toriyama" NO TÍTULO dos mangás, e devolveu
 *
 *     Akira Toriyama's Manga Theater
 *     Toriyama Akira Mankanzenseki
 *     Wanted! Eiichiro Oda Before One Piece
 *
 * Nenhum Dragon Ball. Nenhum One Piece. Nenhum Naruto. Trinta e seis séries, e nenhuma
 * delas era A série. Treze mangakás voltaram vazios.
 *
 * O bug não foi pego por teste: foi pego OLHANDO A AMOSTRA antes de gravar. É o quarto
 * da semana a cair desse jeito.
 *
 * `Staff(search:)` procura a PESSOA, e `staffMedia` devolve o que ela fez. Que é a
 * pergunta que a gente estava tentando fazer desde o começo.
 */
const CONSULTA = `
query ($nome: String) {
  Staff(search: $nome) {
    name { full native }
    staffMedia(type: MANGA, sort: POPULARITY_DESC, perPage: 25) {
      edges {
        staffRole
        node {
          id
          title { romaji english native }
          synonyms
          volumes
          status
          format
          startDate { year }
          coverImage { large }
        }
      }
    }
  }
}`;

type Bruto = {
  id: number;
  title: { romaji?: string; english?: string; native?: string };
  synonyms?: string[];
  volumes?: number | null;
  status?: string;
  format?: string;
  startDate?: { year?: number | null };
  coverImage?: { large?: string | null };
  staff?: { edges?: StaffEdge[] };
};

/**
 * ═══ O ENTULHO DA ANILIST, E POR QUE ELE É RECUSADO ═══
 *
 * `staffMedia` devolve TUDO que a pessoa tocou. Para o Toriyama, isso é 23 "séries":
 *
 *     Dragon Ball                              42 vol   ← é isto que a gente quer
 *     Super Dragon Ball Heroes: Ultra God…      4 vol
 *     Dragon Ball: Heya! Son Goku and His…      1 vol
 *     Cross Epoch                               ? vol
 *     Mario                                     ? vol
 *
 * Spin-off promocional, one-shot de revista, crossover, capítulo avulso. Semear isso
 * seria repetir no mangá exatamente o entulho que a poda acabou de tirar do acervo — e
 * pior: entupindo a PAREDE DE CAPAS, que é a tela que carrega o produto.
 *
 * A régua: número de volumes CONHECIDO. Uma obra sem volumes ou é promocional, ou nem
 * saiu, ou é um capítulo solto. Nenhum dos três é uma coleção que alguém compra.
 *
 * (E o teto por mangaká mora no seed, e não aqui: quem chama decide quanto quer.)
 */
function daAniList(m: Bruto, autor: string | null, funcao: string): Serie | null {
  const { titulo, nativos } = tituloDe(m.title);
  if (!titulo) return null;

  // Só MANGA. Fora: ONE_SHOT, NOVEL, e material que não é a obra. A `format_in` não
  // vale em `staffMedia`, então o filtro é aqui.
  if (m.format !== "MANGA") return null;

  // O TÍTULO denuncia o que não é obra: databook, artbook, guia, antologia, omake,
  // 4-koma, edição colorida. São produtos DERIVADOS — existem, e ninguém procura por
  // eles. É o mesmo entulho que a poda tirou do acervo, com outra roupa.
  if (NAO_E_OBRA.test(titulo)) return null;

  // O número de volumes pode ser NULO, e isso é legítimo: série em publicação não tem
  // um total. One Piece e Berserk são exatamente esse caso, e um filtro por volumes
  // apagava os dois. Ver o cabeçalho de ESCREVE.

  const p = papel(funcao);
  const escreveu = ESCREVE.includes(p);
  const desenhou = DESENHA.includes(p);

  // Nem escreveu nem desenhou? Então ele passou por ali. Tradutor, letrista, editor,
  // assistente. É o mesmo bug que assinou "A Morte de Ivan Ilitch" com o nome de quem
  // a traduziu, e ele NÃO entra aqui.
  if (!escreveu && !desenhou) return null;

  const sinonimos = [...new Set([...nativos, ...(m.synonyms ?? [])])]
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 20);

  return {
    anilistId: m.id,
    titulo,
    sinonimos,
    // Provisórios: quem MANDA é `autoriaDasSeries`, que lê o staff completo. Aqui só
    // se sabe o papel de quem foi procurado — e foi isso que fez Hikaru no Go voltar
    // "sem autor" quando o Obata é só o ilustrador dela.
    autor: escreveu ? autor : null,
    ilustrador: desenhou ? autor : null,
    volumes: m.volumes ?? null,
    status: STATUS[m.status ?? ""] ?? "unknown",
    ano: m.startDate?.year ?? null,
    capa: m.coverImage?.large ?? null,
  };
}

/**
 * As séries de um mangaká.
 *
 * A AniList limita a 90 requisições por minuto e não pede chave. Ela é mantida por
 * doação, como a Open Library: quem semear o acervo inteiro numa tarde vai levar um
 * 429 merecido.
 */
/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM ESCREVEU E QUEM DESENHOU. Duas pessoas, dois campos.
 *
 *  A `Staff(search:)` devolve o papel DA PESSOA QUE VOCÊ PROCUROU, e mais nada.
 *  Procurando "Takeshi Obata", ela diz "Art" — e a série volta SEM AUTOR.
 *
 *  Mas Hikaru no Go tem autor: é a Yumi Hotta. O Obata desenha.
 *
 *      Hikaru no Go   história: Yumi Hotta        arte: Takeshi Obata
 *      Eyeshield 21   história: Riichiro Inagaki  arte: Yusuke Murata
 *      Death Note     história: Tsugumi Ohba      arte: Takeshi Obata
 *
 *  "Sem autor" não era sem autor: era PAPEL ERRADO — o mesmo bug do tradutor
 *  gravado como autor, com outro chapéu. Terceira vez esta semana.
 *
 *  Por isso o staff COMPLETO da série é buscado à parte. Quem escreveu vira o
 *  AUTOR do volume; quem desenhou vira o ILUSTRADOR, num campo próprio — gravado,
 *  exibido e BUSCÁVEL. Quem digita "Takeshi Obata" acha Death Note.
 *
 *  Quando a mesma pessoa faz história E arte (Toriyama, Miura, Oda), os dois
 *  campos apontam para ela. Isso é `Story & Art`, e não é redundância: é a verdade.
 * ════════════════════════════════════════════════════════════════════
 */
const STAFF_COMPLETO = `
query ($ids: [Int]) {
  Page(perPage: 50) {
    media(id_in: $ids, type: MANGA) {
      id
      staff { edges { role node { name { full native } } } }
    }
  }
}`;

const PERSONAGEM_PRINCIPAL = `
query ($ids: [Int]) {
  Page(perPage: 50) {
    media(id_in: $ids, type: MANGA) {
      id
      characters(sort: [ROLE, FAVOURITES_DESC], perPage: 1) {
        nodes { image { large } }
      }
    }
  }
}`;

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PERSONAGEM MAIS IMPORTANTE DE CADA SÉRIE. Pra ser a cara da coleção.
 *
 *  O dono pediu: "os logos que estão aí são feios; pra mangá, coloca a foto do
 *  personagem mais importante". `characters(sort: [ROLE, FAVOURITES_DESC])`
 *  faz exatamente essa pergunta — primeiro os PROTAGONISTAS (role: MAIN), e
 *  entre eles o mais favoritado pela comunidade da AniList. Testado à mão:
 *  Vagabond devolve Musashi Miyamoto (9.840 favoritos), não um coadjuvante.
 *
 *  ═══ POR QUE ISTO É UM BACKFILL, E NUNCA UMA CHAMADA NA HORA ═══
 *
 *  A AniList dá 90 requisições por minuto pro app INTEIRO, compartilhadas com
 *  toda busca de série. Chamar isto a cada visita à coleção estouraria esse
 *  teto na primeira dúzia de pessoas olhando a própria estante ao mesmo tempo.
 *  Por isso o endereço da imagem é BUSCADO UMA VEZ e GRAVADO em
 *  `colecoes.emblema_url` — a mesma coluna do emblema, por referência, nunca
 *  uma cópia do arquivo. Ver scripts/personagens-da-colecao.mjs.
 * ════════════════════════════════════════════════════════════════════
 */
export async function personagensDasSeries(ids: number[]): Promise<Map<number, string | null>> {
  const fora = new Map<number, string | null>();

  for (let i = 0; i < ids.length; i += 50) {
    const lote = ids.slice(i, i + 50);

    // Mesma defesa de autoriaDasSeries: tempo esgotado LANÇA, e nunca vira "sem
    // personagem" — um lote perdido gravaria null sobre 50 séries de uma vez.
    let res: Response;
    try {
      res = await fetch(ENDERECO, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: PERSONAGEM_PRINCIPAL, variables: { ids: lote } }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new AniListRecusou(
        "a AniList não respondeu ao pedido de personagens — a rede caiu, ou ela demorou " +
          "demais. Isso NÃO quer dizer que estas séries não têm personagem principal.",
      );
    }

    if (res.status === 429 || res.status >= 500) {
      throw new AniListRecusou(`a AniList recusou o pedido de personagens (${res.status}).`);
    }
    if (!res.ok) continue;

    const json = (await res.json()) as {
      data?: { Page?: { media?: { id: number; characters?: { nodes?: { image?: { large?: string } }[] } }[] } };
    };

    for (const m of json.data?.Page?.media ?? []) {
      const imagem = m.characters?.nodes?.[0]?.image?.large ?? null;
      fora.set(m.id, imagem);
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  return fora;
}

export type Autoria = { autor: string | null; ilustrador: string | null };

/** O staff completo de várias séries de uma vez. Em lotes: 50 por chamada. */
export async function autoriaDasSeries(ids: number[]): Promise<Map<number, Autoria>> {
  const fora = new Map<number, Autoria>();

  for (let i = 0; i < ids.length; i += 50) {
    const lote = ids.slice(i, i + 50);

    /**
     * O tempo esgotado LANÇA — ele não devolve `res.status`. Sem este try, a rede
     * piscando derrubava a função inteira no meio de um seed de horas.
     *
     * E ele vira `AniListRecusou`, e nunca um `continue`: pular o lote em silêncio
     * gravaria "essas séries não têm autor" sobre 50 séries de uma vez. Ver AGENTS.md.
     */
    let res: Response;
    try {
      res = await fetch(ENDERECO, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: STAFF_COMPLETO, variables: { ids: lote } }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new AniListRecusou(
        "a AniList não respondeu ao pedido de staff — a rede caiu, ou ela demorou demais. " +
          "Isso NÃO quer dizer que estas séries não têm autor.",
      );
    }

    // Um 429 aqui NÃO pode virar "essas séries não têm autor". Ver AGENTS.md.
    if (res.status === 429 || res.status >= 500) {
      throw new AniListRecusou(`a AniList recusou o staff (${res.status}).`);
    }
    if (!res.ok) continue;

    const json = (await res.json()) as {
      data?: { Page?: { media?: { id: number; staff?: { edges?: StaffEdge[] } }[] } };
    };

    for (const m of json.data?.Page?.media ?? []) {
      const edges = m.staff?.edges ?? [];

      const nomesCom = (papeis: string[]) =>
        edges
          .filter((e) => papeis.includes(papel(e.role ?? "")))
          .map((e) => nomeDoStaff(e.node))
          .find(Boolean) ?? null;

      /**
       * ═══ A ADAPTAÇÃO DE ROMANCE, E POR QUE ELA PRECISA DE UM SEGUNDO DEGRAU ═══
       *
       * Bakemonogatari é mangá do Oh!great (Ito Oogure) — mas a HISTÓRIA é do NISIOISIN,
       * que escreveu o romance. Na AniList, ele aparece como `Original Story`.
       *
       * Sem este degrau, o desenhista virava o autor, e o escritor sumia. É o bug do
       * tradutor, de novo, invertido: dar o crédito da história a quem fez a arte.
       *
       * E isto NÃO reabre a porta do spin-off: o spin-off é recusado pelo papel de QUEM
       * FOI PROCURADO (o Toriyama é `Original Creator` em Dragon Ball Super, e por isso
       * a série nem chega aqui). Este degrau só decide QUEM ASSINA o que já entrou.
       */
      const autor = nomesCom(ESCREVE) ?? nomesCom(["original story", "original creator"]);

      /**
       * ═══ `illustration` É O CONVIDADO, E NÃO O DESENHISTA DA OBRA ═══
       *
       * Bakemonogatari lista, além do `Story & Art` do Oh!great, três `Illustration
       * (ch 22)`, `(ch 1)`, `(ch 13)` — Hiromu Arakawa, Hiro Mashima, Ken Akamatsu.
       * São ilustradores CONVIDADOS de capítulos avulsos.
       *
       * Pegar o primeiro da lista dava a arte de Bakemonogatari à Arakawa, que desenhou
       * uma capa. É o bug do `[0]`, de novo, com o quinto chapéu da semana.
       *
       * A ordem é a resposta: quem assina a OBRA (`Story & Art`, `Art`) vem primeiro. O
       * convidado só entra se não houver ninguém assinando.
       */
      const ilustrador = nomesCom(["story & art", "art"]) ?? nomesCom(["illustration"]);

      fora.set(m.id, { autor, ilustrador });
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  return fora;
}

/**
 * As séries de um mangaká, tentando as GRAFIAS dele, e não só o nome.
 *
 * A AniList chama o Oda de "Eiichirou Oda". Procurar por "Eiichiro Oda" devolve ZERO —
 * e o resultado seria um acervo sem One Piece, com um relatório dizendo "o Oda não
 * existe". É o falso buraco do Kentaro Miura, de novo, com outra roupa.
 *
 * O cânone já guarda as grafias (seed/canone.ts). Aqui elas são TENTADAS, uma a uma, e
 * a primeira que responder ganha.
 */
export async function seriesDeQualquerGrafia(grafias: string[]): Promise<Serie[]> {
  for (const g of grafias) {
    const s = await seriesDe(g);
    if (s.length > 0) return s;
    await new Promise((r) => setTimeout(r, 700));
  }
  return [];
}

/**
 * ═══ UM 429 NÃO É UM VEREDITO SOBRE O ACERVO ═══
 *
 * A AniList dá 90 requisições por minuto. Ao estourar, ela responde 429 — e a primeira
 * versão deste cliente traduzia isso para `[]`, que o seed imprimia como **"nada"**.
 *
 * O resultado: vinte mangakás em fila apareceram como "não existem na AniList", e depois
 * os últimos quatro voltaram a funcionar. Era rate limit, e o relatório chamava de
 * ausência.
 *
 * É o MESMO erro que quase matou este projeto: testar na fonte errada e concluir que o
 * dado não existe. É a quinta vez esta semana que "não achei" e "não consegui perguntar"
 * se confundem — e é por isso que aqui elas são coisas diferentes, e o 429 LEVANTA.
 *
 * Um script que insiste é lento. Um script que mente é caro.
 */
export class AniListRecusou extends Error {}

export async function seriesDe(mangaka: string, tentativas = 5): Promise<Serie[]> {
  let res: Response | null = null;

  for (let i = 0; i < tentativas; i++) {
    /**
     * A REDE CAINDO NÃO É UM CÓDIGO DE STATUS.
     *
     * `AbortSignal.timeout` não devolve `res.status`: ele LANÇA. Sem este try, um
     * tempo esgotado atravessa o laço de tentativas e derruba tudo — foi exatamente
     * assim que o backfill da Wikipédia morreu no autor 1.120 de 1.200, jogando fora
     * 959 sinopses que ele já tinha achado.
     *
     * Rede caída, DNS mudo e socket fechado são a mesma coisa que um 503: a fonte não
     * respondeu. Entram no mesmo laço, e nunca viram "não existe". Ver AGENTS.md.
     */
    try {
      res = await fetch(ENDERECO, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: CONSULTA, variables: { nome: mangaka } }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // Tempo esgotado, rede caída. Tenta de novo, e nunca devolve "não existe".
      res = null;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** i));
      continue;
    }

    if (res.status !== 429 && res.status < 500) break;

    // `Retry-After` vem em segundos, e a AniList costuma mandar 60. Obedecer é o certo:
    // ela é mantida por doação, e insistir mais rápido é empurrar quem está pedindo calma.
    //
    // Um `retry-after: 0` é uma resposta legítima, e não a ausência do cabeçalho — por
    // isso a checagem é `!== null`, e não um `||`. Com o `||`, um zero virava 2 segundos,
    // e o teste desta função estourava o próprio tempo limite.
    const bruto = res.headers.get("retry-after");
    const espera = bruto !== null ? Number(bruto) * 1000 : 2000 * 2 ** i;
    await new Promise((r) => setTimeout(r, espera));
  }

  /**
   * ═══ NENHUMA RESPOSTA NÃO É UMA LISTA VAZIA ═══
   *
   * Esta linha era `if (!res) return []`, e ela é a LEI DO AGENTS.md quebrada em duas
   * palavras: com a rede fora, a AniList não respondeu nada — e a função dizia, com
   * toda a confiança, que o mangaká não tem obra nenhuma.
   *
   * O seed apagaria Berserk do acervo achando que a fonte tinha dito que ele não
   * existe. Recusa não é ausência, e silêncio não é resposta.
   */
  if (!res) {
    throw new AniListRecusou(
      `a AniList não respondeu para "${mangaka}" — a rede caiu, ou ela demorou demais. ` +
        "Isso NÃO quer dizer que ele não tem obra: quer dizer que não deu para perguntar.",
    );
  }

  // 404: a AniList não conhece esta pessoa. É uma RESPOSTA, e uma tarefa.
  if (res.status === 404) return [];

  // 429 até o fim: ela não respondeu. Isso NÃO é "o mangaká não existe".
  if (res.status === 429 || res.status >= 500) {
    throw new AniListRecusou(
      `a AniList recusou até o fim (${res.status}) para "${mangaka}". ` +
        "Isso NÃO quer dizer que ele não existe: quer dizer que ela não respondeu.",
    );
  }

  if (!res.ok) return [];

  const json = (await res.json()) as {
    data?: {
      Staff?: {
        name?: { full?: string; native?: string };
        staffMedia?: { edges?: { staffRole?: string; node?: Bruto }[] };
      };
    };
  };

  const staff = json.data?.Staff;
  if (!staff) return [];

  const autor = nomeDoStaff({ name: staff.name });
  const edges = staff.staffMedia?.edges ?? [];

  const series: Serie[] = [];
  for (const e of edges) {
    if (!e.node) continue;
    const s = daAniList(e.node, autor, e.staffRole ?? "");
    if (s) series.push(s);
  }
  return series;
}

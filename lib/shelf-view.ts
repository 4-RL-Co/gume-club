/**
 * The shelf's vocabulary: the shelves, the sorts, the two views, and the labels.
 *
 * Deliberately free of any database import. Components render from this, and a
 * unit test can read it without a live Postgres. The queries live in lib/shelf.ts;
 * importing them from a component would drag the db client along for the ride.
 */

/** The five shelves. `tudo` is not a status, it is the absence of a filter. */
export const FILTERS = [
  { key: "tudo", label: "tudo", status: null },
  { key: "lendo", label: "lendo", status: "reading" },
  { key: "lidos", label: "lidos", status: "read" },
  { key: "esperando", label: "esperando", status: "want_to_read" },
  { key: "abandonados", label: "abandonados", status: "did_not_finish" },
] as const;

export const SORTS = [
  { key: "adicionado", label: "adicionado" },
  { key: "titulo", label: "título" },
  { key: "autor", label: "autor" },
  { key: "ano", label: "ano da obra" },
] as const;

export const VIEWS = ["parede", "lista"] as const;

/**
 * A DIREÇÃO da ordenação, e ela precisa ser DITA.
 *
 * "Ordenar por título" não diz nada sozinho: A a Z ou Z a A? A ordem existia, e a
 * direção era um palpite do código que a pessoa tinha que descobrir olhando a lista.
 * Cada critério tem um padrão que faz sentido (título começa em A; adicionado começa
 * pelo mais recente), e a pessoa pode inverter.
 */
export const DIRECOES = ["asc", "desc"] as const;
export type Direcao = (typeof DIRECOES)[number];

/**
 * O rótulo da direção MUDA COM O CRITÉRIO, e isso não é firula.
 *
 * "crescente" não quer dizer nada para uma data, e "A a Z" não quer dizer nada para
 * um ano. A palavra certa é a que descreve o que a pessoa vai ver.
 */
export const DIRECAO_LABEL: Record<SortKey, { asc: string; desc: string }> = {
  adicionado: { asc: "os mais antigos", desc: "os mais novos" },
  titulo: { asc: "A a Z", desc: "Z a A" },
  autor: { asc: "A a Z", desc: "Z a A" },
  ano: { asc: "as mais antigas", desc: "as mais recentes" },
};

/** O padrão de cada critério. Título começa em A; adicionado começa pelo mais recente. */
export const DIRECAO_PADRAO: Record<SortKey, Direcao> = {
  adicionado: "desc",
  titulo: "asc",
  autor: "asc",
  ano: "desc",
};

export type FilterKey = (typeof FILTERS)[number]["key"];
export type SortKey = (typeof SORTS)[number]["key"];
export type View = (typeof VIEWS)[number];

/**
 * Where a book came from is the most interesting thing about it, and nobody
 * records it. It used to be a dropdown, which was a form pretending to be a
 * memory: nobody acquired a book "subscription_box". Now it is the reader's own
 * words, or nothing at all, and it lives only on the book page.
 */

export const STATUS_LABEL: Record<string, string> = {
  want_to_read: "esperando", reading: "lendo", read: "lido", did_not_finish: "abandonado",
};

export const FORMAT_LABEL: Record<string, string> = {
  hardcover: "capa dura", paperback: "brochura", ebook: "e-book",
  audiobook: "audiolivro", other: "outro",
};

export type ShelfBook = {
  workId: string;
  slug: string;
  title: string;
  author: string | null;
  nationality: string | null;
  publisher: string | null;
  format: string | null;
  editionYear: number | null;
  firstPublished: number | null;
  pageCount: number | null;
  coverUrl: string | null;
  status: string;
  /** The owner's own star, 1..10. Null when unrated, or when it is not yours to see. */
  rating: number | null;
  acquiredNote: string | null;
  addedAt: Date;
  /**
   * A honra em que este livro fez a pessoa ENTRAR, quando ele fez. Nula em quase toda
   * linha: uma estante de duzentos livros tem uns dez marcos, e é isso que os torna
   * marcos. Ver lib/honras.ts.
   */
  honra: string | null;
  /**
   * QUEM RECOMENDOU este livro para o dono da estante, se alguém recomendou.
   *
   * Aparece na capa, e também para quem visita: um livro que veio de alguém é diferente
   * de um livro que a pessoa achou sozinha. Nulo na esmagadora maioria das linhas, e é
   * isso que faz a fotinha significar alguma coisa quando ela aparece.
   */
  recomendadoPor: string | null;
  recomendadoPorNome: string | null;
  recomendadoPorFoto: string | null;
};

/** Parses whatever came in on the query string. An unknown value falls back, never throws. */
export function readParams(params: Record<string, string | string[] | undefined>) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const filter = (FILTERS.find((f) => f.key === one(params.filtro))?.key ?? "tudo") as FilterKey;
  const sort = (SORTS.find((s) => s.key === one(params.ordem))?.key ?? "adicionado") as SortKey;
  const view = VIEWS.find((v) => v === one(params.vista)) ?? "parede";

  // Sem direção na URL, cada critério cai no padrão que faz sentido para ELE.
  const direcao = (DIRECOES.find((d) => d === one(params.dir)) ?? DIRECAO_PADRAO[sort]) as Direcao;

  /**
   * O ANO. Só vale para "lidos" e "abandonados", e é de propósito.
   *
   * "Livros que eu quero ler em 2024" não quer dizer nada: um livro esperando na
   * estante não aconteceu em ano nenhum. Já um livro LIDO ou LARGADO aconteceu num
   * ano, e esse ano é um fato sobre a sua vida.
   */
  const anoBruto = Number(one(params.ano));
  const ano =
    Number.isInteger(anoBruto) && anoBruto >= 1900 && anoBruto <= new Date().getFullYear() + 1
      ? anoBruto
      : null;

  return { filter, sort, view, direcao, ano };
}

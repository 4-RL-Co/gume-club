/**
 * O vocabulário da correção. SEM banco de dados dentro.
 *
 * Componente cliente lê daqui. Importar o lib/corrections.ts (que fala com o
 * Postgres) de dentro de um "use client" arrasta o driver do banco para o
 * navegador inteiro — e o build quebra, que é o comportamento certo. Mesmo
 * desenho do lib/shelf-view.ts.
 */

/** Os campos da EDIÇÃO que qualquer leitor logado corrige e aplica na hora. */
export const CAMPOS = {
  pageCount: { label: "páginas", tipo: "numero" },
  publishedYear: { label: "ano desta edição", tipo: "numero" },
  publisher: { label: "editora", tipo: "texto" },
  isbn13: { label: "ISBN", tipo: "texto" },
  translator: { label: "tradutor", tipo: "texto" },
  format: { label: "formato", tipo: "texto" },
  language: { label: "idioma", tipo: "texto" },
} as const;

export type Campo = keyof typeof CAMPOS;

/**
 * OS CAMPOS DO AUTOR. Uma lista SEPARADA, e não uma mistura com os da edição.
 *
 * São duas fichas diferentes: uma edição tem editora e ISBN; uma pessoa tem
 * nacionalidade e biografia. Uma lista só, com um `if` dentro, seria a porta para
 * alguém "corrigir o ISBN de um autor" e o app não ter como dizer não.
 *
 * O RETRATO não está aqui, e é de propósito: ele é imagem, e imagem passa por
 * bibliotecário, pela mesma razão que a capa passa. Ver lib/corrections.ts.
 */
export const CAMPOS_AUTOR = {
  name: { label: "nome", tipo: "texto" },
  nationality: { label: "nacionalidade", tipo: "texto" },
  bio: { label: "quem é", tipo: "texto" },
} as const;

export type CampoAutor = keyof typeof CAMPOS_AUTOR;

/** Uma linha do histórico. A capa NÃO está em CAMPOS: ela passa por fila. */
export type Correcao = {
  id: string;
  campo: string;
  de: string | null;
  para: string | null;
  handle: string | null;
  name: string | null;
  image: string | null;
  /** Insígnia de PAPEL, e nunca um número: saber quem fez a correção é útil. */
  librarian: boolean;
  createdAt: Date;
  revertedAt: Date | null;
  revertedByHandle: string | null;
};

/** Uma capa esperando um bibliotecário. A capa é o único campo que passa por fila. */
export type Proposta = {
  id: string;
  coverUrl: string;
  note: string | null;
  createdAt: Date;
  handle: string | null;
  name: string | null;
  workTitle: string;
  workSlug: string;
  /** A capa que está lá hoje. Julgar sem ver as duas é julgar no escuro. */
  atual: string | null;
};

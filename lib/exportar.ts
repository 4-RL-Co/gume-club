import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { mine as palavraDaNota } from "@/lib/veredito";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A PORTA DE SAÍDA.
 *
 *  ═══ POR QUE ELA É BLOQUEIO DE LANÇAMENTO, E NÃO UMA FEATURE ═══
 *
 *  O README promete, na PRIMEIRA DOBRA, antes de qualquer funcionalidade: "Arquivos que
 *  você pode levar embora. Sair deveria ser fácil. É isso que faz ficar significar alguma
 *  coisa." E o "Como isso se paga" fecha com: "a saída é o ponto: é ela que torna as
 *  promessas reais, em vez de só bonitas."
 *
 *  **O argumento de confiança inteiro do Gume repousa na porta de saída.** Lançar sem ela
 *  é lançar com a tese do projeto falsa — e a primeira pessoa cínica que abrir o repo nota
 *  em trinta segundos.
 *
 *  ═══ A REGRA QUE DECIDE O FORMATO ═══
 *
 *  **Uma exportação só é uma saída se OUTRO APP CONSEGUIR LER.**
 *
 *  Um JSON proprietário que ninguém importa é um bilhete de sequestro em fonte bonita:
 *  parece uma saída, tem a forma de uma saída, e não abre porta nenhuma.
 *
 *  Por isso o CSV espelha as colunas do **export do Goodreads** — que é o formato que o
 *  Skoob, o StoryGraph, o Oku e o Fable sabem importar. Não porque o Goodreads seja bom,
 *  mas porque ele é o que o mundo lê. Onde o Gume não tem o campo, a coluna vai vazia.
 *  Onde o Gume tem MAIS (procedência, série, volume, a palavra da nota), vai em colunas
 *  extras no fim: quem não entende ignora, e quem entende ganha.
 *
 *  ═══ A NOTA, E A ÚNICA TRADUÇÃO QUE DÓI ═══
 *
 *  No Gume a nota é uma PALAVRA ("adorei"). No CSV do mundo ela é um número de 1 a 5.
 *
 *  Vão os DOIS. `My Rating` leva o número, porque sem ele a saída não abre porta nenhuma.
 *  E `Gume Nota` leva a palavra, porque perder a palavra na tradução seria trair o produto.
 *
 *  Mandar só a palavra seria trair a saída. Mandar só o número seria trair o produto. As
 *  duas colunas custam catorze caracteres.
 *
 *  ═══ O QUE NÃO SAI ═══
 *
 *  **Dado de outra pessoa.** Toda consulta aqui filtra por `user_id`, e nenhuma delas lê a
 *  linha de ninguém mais.
 *
 *  **Estado DERIVADO não é dado: é cálculo.** A honra, a contagem de livros, a posição na
 *  escada — nada disso é exportado, porque nada disso é seu no sentido de ter sido escrito
 *  por você. É a soma de coisas que já estão no arquivo, e uma soma que viaja junto vira
 *  uma soma que um dia discorda do que a gerou.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * As colunas do Goodreads, na ordem dele, seguidas das nossas.
 *
 * A ORDEM importa menos que os NOMES (o importador normaliza cabeçalho), mas manter a
 * ordem dele faz o arquivo abrir familiar no Excel de quem já viu um export de livro.
 */
export const COLUNAS = [
  // ── o que o mundo espera ──────────────────────────────────────────
  "Title",
  "Author",
  "ISBN",
  "ISBN13",
  "My Rating",
  "Average Rating",
  "Publisher",
  "Number of Pages",
  "Year Published",
  "Original Publication Year",
  /**
   * CAPA DURA, BROCHURA, E-BOOK. O Goodreads chama de "Binding", e ela estava faltando
   * dos DOIS lados: o importador não a lia, e a exportação não a escrevia.
   *
   * Numa estante de verdade isso não é detalhe: a planilha que virou este produto tinha 29
   * capas duras de 44 livros. Essa pessoa coleciona OBJETOS, e não arquivos.
   */
  "Binding",
  "Date Read",
  "Date Added",
  "Bookshelves",
  "Exclusive Shelf",
  "My Review",
  "Read Count",

  // ── o que o Gume tem a mais. Quem não entende, ignora ─────────────
  /** A palavra. É a nota de verdade; o número acima é a tradução dela. */
  "Gume Nota",
  /** Quando você COMEÇOU. O Goodreads exporta, mas fora da lista canônica. */
  "Date Started",
  /** Quando você ABANDONOU. O Goodreads não tem essa ideia. */
  "Date Abandoned",
  /** Todas as datas de término, para quem releu. Separadas por ponto e vírgula. */
  "Dates Read",
  /** "presente da minha irmã", "sebo da Praça XI". A memória do exemplar. */
  "Gume Procedencia",
  "Owned",
  "Private Notes",
  "Series",
  "Volume",
  /** Quem indicou este livro para você. */
  "Gume Indicado Por",
  /** A sua resenha é pública, de amigos, ou só sua? */
  "Gume Visibilidade",
] as const;

/** Uma linha do CSV, já pronta. */
export type LinhaCsv = (string | number | null)[];

/**
 * ═══ O CSV É ESCRITO À MÃO, E É QUINZE LINHAS ═══
 *
 * Uma resenha tem vírgula, aspas e quebra de linha — as três coisas que quebram um CSV. A
 * regra do formato (RFC 4180) é uma só: se o campo tem qualquer uma delas, ele vai entre
 * aspas, e cada aspa dentro dele vira duas.
 *
 * Escrever isso à mão é mais honesto que trazer uma dependência para quinze linhas — e um
 * CSV mal escapado é a forma mais comum de uma exportação parecer completa e chegar
 * quebrada do outro lado.
 */
export function celula(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";

  const s = String(v);
  if (!/[",\n\r]/.test(s)) return s;

  return `"${s.replace(/"/g, '""')}"`;
}

export function linhaCsv(valores: LinhaCsv): string {
  return valores.map(celula).join(",") + "\r\n";
}

/**
 * O formato, no vocabulário do Goodreads.
 *
 * A gente lê o dele ("Mass Market Paperback", "Kindle Edition") e escreve o dele de volta:
 * uma exportação que cospe `hardcover` numa coluna chamada `Binding` fala uma língua que
 * só ela entende, e o Skoob não vai saber o que fazer com aquilo.
 */
const BINDING: Record<string, string> = {
  hardcover: "Hardcover",
  paperback: "Paperback",
  ebook: "Kindle Edition",
  audiobook: "Audiobook",
  other: "Unknown Binding",
};

/** O status, no vocabulário que os outros apps leem. */
const PRATELEIRA: Record<string, string> = {
  want_to_read: "to-read",
  reading: "currently-reading",
  read: "read",
  did_not_finish: "did-not-finish",
};

type Linha = {
  title: string;
  author: string | null;
  isbn10: string | null;
  isbn13: string | null;
  rating: number | null;
  publisher: string | null;
  page_count: number | null;
  edition_year: number | null;
  work_year: number | null;
  status: string;
  format: string | null;
  added_on: string;
  shelves: string[] | null;
  review: string | null;
  private_note: string | null;
  review_visibility: string | null;
  started: string[] | null;
  finished: string[] | null;
  abandoned: string[] | null;
  acquired_note: string | null;
  owned: boolean;
  series: string | null;
  volume: number | null;
  recommended_by: string | null;
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  A ESTANTE INTEIRA, EM LOTES.
 *
 *  ═══ POR QUE UM GERADOR, E NÃO UM ARRAY ═══
 *
 *  Alguém com cinco mil livros não pode montar o arquivo inteiro na memória de um processo
 *  serverless: ele estoura, e estoura JUSTAMENTE para quem mais precisa da exportação —
 *  quem tem uma vida de leitura ali dentro.
 *
 *  O gerador entrega um lote por vez, e quem escreve o arquivo já empurrou o lote anterior
 *  para a rede. A memória fica constante, e não cresce com a estante.
 *
 *  A paginação é por CHAVE (`added_at`, `id`), e não por `offset`: com `offset`, o banco
 *  relê e joga fora as N primeiras linhas a cada lote, e a última página de uma estante
 *  grande custa mais que a primeira inteira.
 * ════════════════════════════════════════════════════════════════════
 */
export async function* estanteEmLotes(
  userId: string,
  tamanho = 500,
): AsyncGenerator<Linha[]> {
  let cursor: { addedAt: string; id: string } | null = null;

  for (;;) {
    const linhas = await db.execute<Linha>(sql`
      select
        w.title,
        a.name as author,
        -- O ISBN-13 mora na edicao; o ISBN-10 mora na tabela identifiers, porque uma edicao
        -- pode ter vários identificadores (OL, Google Books, ASIN) e um só é o "o" ISBN.
        (select i.value from identifiers i
          where i.edition_id = e.id and i.kind = 'isbn10' limit 1) as isbn10,
        e.isbn13,
        r.value as rating,
        e.publisher,
        e.page_count,
        e.published_year as edition_year,
        w.first_published as work_year,
        le.status::text as status,
        e.format::text as format,

        /**
         * O DIA em que ela pôs o livro na estante, e quem o calcula é o POSTGRES.
         *
         * A primeira versão fazia new Date(added_at).toISOString().slice(0, 10) no
         * JavaScript — que devolve o dia em UTC. Um livro guardado às 21h no Brasil vira o
         * dia SEGUINTE, e a exportação passa a mentir sobre um dia da vida da pessoa.
         *
         * Este repositório já tinha uma lei contra isso, e um teste que a defende
         * (lib/datas.test.ts). Ele me pegou.
         */
        le.added_at::date::text as added_on,

        /**
         * ═══ O CURSOR VAI EM TEXTO, E ISSO NÃO É FRESCURA ═══
         *
         * A primeira versão paginava com new Date(added_at).toISOString(), que trunca em
         * MILISSEGUNDOS. O Postgres guarda timestamptz em MICROSSEGUNDOS.
         *
         * O cursor ficava atrás da última linha lida por até 999 microssegundos. A linha
         * casava de novo no lote seguinte, o lote voltava idêntico, e o laço NUNCA TERMINAVA:
         * a exportação de qualquer estante rodava para sempre, escrevendo as mesmas linhas
         * até a memória acabar.
         *
         * Em texto, o Postgres devolve a precisão que ele mesmo guarda, e a compara consigo
         * mesma. O teste de ida e volta pegou isto porque exportou de verdade — nenhuma
         * leitura de código pegaria.
         */
        le.added_at::text as cursor_at,
        le.id,

        -- AS ESTANTES QUE ELA INVENTOU. Um array, e o CSV as junta com vírgula.
        (select array_agg(c.name order by c.name)
           from collection_items ci
           join collections c on c.id = ci.collection_id
          where ci.work_id = w.id and c.user_id = ${userId}::uuid) as shelves,

        rv.body as review,
        rv.private_note,
        rv.visibility::text as review_visibility,

        -- AS LEITURAS. Três arrays alinhados: uma posição por leitura.
        (select array_agg(rd.started_on::text order by rd.created_at)
           from readings rd where rd.entry_id = le.id) as started,
        (select array_agg(rd.finished_on::text order by rd.created_at)
           from readings rd where rd.entry_id = le.id) as finished,
        (select array_agg(rd.abandoned_on::text order by rd.created_at)
           from readings rd where rd.entry_id = le.id) as abandoned,

        oc.acquired_note,
        (oc.id is not null) as owned,

        s.title as series,
        w.volume,

        (select u2.handle from users u2 where u2.id = le.recommended_by) as recommended_by

      from library_entries le
      join works w on w.id = le.work_id
      left join authors a on a.id = w.author_id
      left join editions e on e.id = le.edition_id
      left join series s on s.id = w.series_id
      left join ratings r on r.user_id = le.user_id and r.work_id = le.work_id

      -- A RESENHA APAGADA NÃO VOLTA. O deleted_at é a pessoa dizendo "não quero mais
      -- isso", e uma exportação que ressuscita o que ela apagou é uma exportação que
      -- não respeita a única coisa que ela pediu.
      left join reviews rv
        on rv.user_id = le.user_id and rv.work_id = le.work_id and rv.deleted_at is null

      left join owned_copies oc on oc.user_id = le.user_id and oc.work_id = le.work_id

      where le.user_id = ${userId}::uuid
        ${
          cursor
            ? sql`and (le.added_at, le.id) > (${cursor.addedAt}::timestamptz, ${cursor.id}::uuid)`
            : sql``
        }

      order by le.added_at, le.id
      limit ${tamanho}`);

    if (linhas.length === 0) return;

    yield linhas;

    const ultima = linhas[linhas.length - 1] as Linha & { cursor_at: string; id: string };
    cursor = { addedAt: ultima.cursor_at, id: ultima.id };
  }
}

/** Uma linha do banco vira uma linha do CSV. */
export function paraCsv(l: Linha): LinhaCsv {
  const terminadas = (l.finished ?? []).filter(Boolean);
  const comecadas = (l.started ?? []).filter(Boolean);
  const abandonadas = (l.abandoned ?? []).filter(Boolean);

  /**
   * `Read Count` é quantas VEZES ela leu, e não quantas datas a gente tem.
   *
   * Quem leu três vezes e só anotou a data de uma leu três vezes. Contar as datas jogaria
   * duas leituras fora — que é exatamente a perda que o nosso importador se recusa a
   * cometer quando LÊ um arquivo do Goodreads. A exportação não pode cometer a perda que
   * a importação corrige.
   */
  const vezes = Math.max((l.started ?? []).length, terminadas.length, 0);

  return [
    l.title,
    l.author,
    l.isbn10,
    l.isbn13,
    l.rating, // 1..5, e é o que o resto do mundo lê
    "", // Average Rating: o Gume NÃO TEM média, e nunca vai ter. A coluna vai vazia.
    l.publisher,
    l.page_count,
    l.edition_year,
    l.work_year,
    l.format ? BINDING[l.format] ?? "" : "",
    terminadas[terminadas.length - 1] ?? "", // Date Read: a mais recente
    l.added_on,
    (l.shelves ?? []).join(", "),
    PRATELEIRA[l.status] ?? l.status,
    l.review,
    vezes || "",

    // ── as nossas ───────────────────────────────────────────────────
    l.rating ? palavraDaNota(l.rating) : "",
    comecadas[comecadas.length - 1] ?? "",
    abandonadas[abandonadas.length - 1] ?? "",

    /**
     * ═══ "Dates Read" SÓ APARECE NUMA RELEITURA, E ISSO CUSTOU UM BUG ═══
     *
     * É o campo do StoryGraph: várias datas de término, separadas por ponto e vírgula. E o
     * nosso importador, ao VER esse campo, entende "foram N leituras" e monta uma leitura
     * por data — cada uma só com o término, porque é tudo o que o StoryGraph dá.
     *
     * Emitindo-o sempre, uma leitura única saía com a data de término e PERDIA A DATA DE
     * INÍCIO na volta: o importador ignorava o "Date Started" que estava logo ali, na
     * coluna do lado.
     *
     * Com uma leitura, "Date Started" e "Date Read" carregam as duas datas, e nada se
     * perde. Com uma releitura, o formato do mundo não sabe guardar o início de cada uma —
     * e aí vale mais salvar todos os términos do que fingir que só houve uma leitura.
     *
     * O tudo.json não tem essa limitação: lá as leituras vão inteiras, uma a uma.
     */
    terminadas.length > 1 ? terminadas.join("; ") : "",
    l.acquired_note,
    l.owned ? "true" : "",
    l.private_note,
    l.series,
    l.volume,
    l.recommended_by ? `@${l.recommended_by}` : "",
    l.review_visibility,
  ];
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE NÃO CABE NUMA LINHA DE LIVRO.
 *
 *  Quem você segue, quem te indicou o quê, o que você consertou no catálogo. Nada disso é
 *  uma coluna de estante, e nada disso pode ficar de fora: é trabalho seu, e é memória sua.
 *
 *  Vai no JSON, que é o formato SEM PERDAS. O CSV é a porta para os outros apps; o JSON é
 *  o retrato inteiro.
 * ════════════════════════════════════════════════════════════════════
 */
export async function oResto(userId: string) {
  const [seguindo, indicacoesFeitas, indicacoesRecebidas, correcoes, estantes, eu] =
    await Promise.all([
      db.execute<{ handle: string; desde: Date }>(sql`
        select u.handle, f.created_at as desde
          from follows f join users u on u.id = f.followee_id
         where f.follower_id = ${userId}::uuid and f.state = 'accepted'
         order by f.created_at`),

      db.execute<{ para: string; livro: string; porque: string | null; quando: Date }>(sql`
        select u.handle as para, w.title as livro, rc.note as porque, rc.created_at as quando
          from recommendations rc
          join users u on u.id = rc.to_user_id
          join works w on w.id = rc.work_id
         where rc.from_user_id = ${userId}::uuid
         order by rc.created_at`),

      db.execute<{ de: string; livro: string; porque: string | null; quando: Date }>(sql`
        select u.handle as de, w.title as livro, rc.note as porque, rc.created_at as quando
          from recommendations rc
          join users u on u.id = rc.from_user_id
          join works w on w.id = rc.work_id
         where rc.to_user_id = ${userId}::uuid
         order by rc.created_at`),

      /**
       * AS CORREÇÕES QUE ELA FEZ NO CATÁLOGO.
       *
       * É trabalho doado, e é dela. Uma exportação que não o carrega diz para a pessoa que
       * o trabalho dela pertence ao app — que é exatamente a coisa que este app existe para
       * não fazer.
       */
      db.execute<{ o_que: string; alvo: string; mudou: unknown; porque: string | null; quando: Date; desfeita: boolean }>(sql`
        select rv.target_type as o_que,
               rv.target_id::text as alvo,
               rv.patch as mudou,
               rv.reason as porque,
               rv.created_at as quando,
               (rv.reverted_at is not null) as desfeita
          from revisions rv
         where rv.user_id = ${userId}::uuid
         order by rv.created_at`),

      db.execute<{ nome: string; visibilidade: string; criada: Date }>(sql`
        select name as nome, visibility::text as visibilidade, created_at as criada
          from collections where user_id = ${userId}::uuid order by created_at`),

      db.execute<{ handle: string; nome: string | null; bio: string | null; convidada_por: string | null; entrou: Date }>(sql`
        select u.handle,
               u.display_name as nome,
               u.bio,
               (select c.handle from users c where c.id = u.invited_by) as convidada_por,
               u.created_at as entrou
          from users u where u.id = ${userId}::uuid`),
    ]);

  return {
    voce: eu[0] ?? null,
    estantesQueVoceInventou: estantes,
    quemVoceSegue: seguindo,
    indicacoesQueVoceFez: indicacoesFeitas,
    indicacoesQueVoceRecebeu: indicacoesRecebidas,
    correcoesQueVoceFezNoCatalogo: correcoes,
  };
}

/**
 * O README que vai DENTRO do arquivo.
 *
 * Um arquivo que precisa de você para ser entendido não é um arquivo que a pessoa levou
 * embora: é um arquivo que ela vai ter que trazer de volta para perguntar o que é. Ele se
 * explica sozinho, e explica como reimportar em outro lugar.
 */
export function leiaMe(handle: string, quando: string): string {
  return `A sua estante do Gume
=====================

Exportado em ${quando}, da conta @${handle}.

Tem dois arquivos aqui, e eles têm as mesmas coisas dentro:


estante.csv
-----------
As colunas são as do export do Goodreads, de propósito: é o formato que o Skoob, o
StoryGraph, o Oku e o Fable sabem importar. Você abre o importador de qualquer um deles,
manda este arquivo, e a sua estante vai junto.

Se ele pedir "o arquivo do Goodreads", é este.

A NOTA vai duas vezes. "My Rating" tem o número de 1 a 5, que é o que os outros apps leem.
"Gume Nota" tem a palavra que você escolheu ("adorei", "achei ok"), que é a nota de
verdade. O número é a tradução dela.

As colunas depois de "Read Count" são coisas que o Gume guarda e o Goodreads não tem:
de onde veio o seu exemplar, quando você abandonou um livro, quem te indicou. Um app que
não as entenda vai ignorá-las, e nada se perde no caminho.

A ÚNICA PERDA, e ela é do formato, não sua: se você leu um livro mais de uma vez, o CSV
guarda TODAS as datas de término, e só a data de início da última. O formato do Goodreads
não sabe guardar o começo de cada releitura, e inventar uma coluna que ninguém lê seria
fingir que resolvemos.

O tudo.json não tem essa limitação: lá cada leitura vai inteira, com começo e fim.


tudo.json
---------
O retrato inteiro, sem perdas: a estante, as leituras com as datas, as resenhas
(inclusive as privadas), quem você segue, as indicações que você fez e recebeu, e as
correções que você fez no catálogo.

É o arquivo para guardar. O CSV é o arquivo para levar a outro lugar.


O que NÃO está aqui
-------------------
Dado de outra pessoa, porque não é seu.

E a sua honra, e a contagem de livros: elas não são um dado, são uma conta feita a partir
do que já está aí. Levar a conta junto seria levar uma resposta que um dia discorda da
pergunta.
`;
}

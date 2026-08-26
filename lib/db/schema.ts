import { sql } from "drizzle-orm";
import {
  pgEnum, pgTable, text, timestamp, uuid, boolean, smallint, integer,
  numeric, date, jsonb, uniqueIndex, unique, index, customType, check, primaryKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/** Case-insensitive text. Requires: create extension citext. */
const citext = customType<{ data: string }>({ dataType: () => "citext" });

/**
 * Lands slice by slice. The full target model is in docs/schema.md.
 * Phase 1: people, the catalog, the shelf, and owning-is-not-reading.
 */

export const visibility = pgEnum("visibility", ["public", "followers", "private"]);
export const shelfStatus = pgEnum("shelf_status", ["want_to_read", "reading", "read", "did_not_finish"]);
export const ownState = pgEnum("own_state", ["owned", "wanted", "lent_out", "gone"]);
export const editionFormat = pgEnum("edition_format", ["hardcover", "paperback", "ebook", "audiobook", "other"]);
/**
 * O status de um item de "o que vem por aí" (lib/roadmap.ts). "ideia" é o mais
 * cedo; "lancado" tira o item de lá e o põe em "o que chegou" — ver
 * `roadmapItems.lancadoEm`.
 */
export const roadmapStatus = pgEnum("roadmap_status", ["ideia", "planejado", "em_andamento", "lancado"]);

/**
 * O que você faria com essa cópia. NÃO É UM MERCADO: é disponibilidade. O app não
 * intermedeia, e não existe "vender" nesta lista de propósito.
 */

/** UM canal por pessoa. Um só, e não uma lista: lista de canais é superfície de contato. */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  handle: text("handle").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  locale: text("locale").notNull().default("pt-BR"),
  isPrivate: boolean("is_private").notNull().default(false),
  librarianTier: smallint("librarian_tier").notNull().default(0),
  /**
   * Who brought whom. Filled at signup and never again, because that is the only
   * moment it is knowable. There is no invite screen yet: this column exists now
   * so the lineage of the first ten readers is not lost forever while we build it.
   */
  invitedBy: uuid("invited_by").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  /** The reader's own face and words. Uploaded by them, never by us. */
  image: text("image"),
  bio: text("bio"),
  /**
   * O canal de contato do leitor. NUNCA público: só aparece para quem tem SEGUIR
   * MÚTUO com ele. Nunca em URL, nunca numa API pública, nunca raspável.
   */
  /**
   * Supporter cosmetics, and cosmetics is ALL they will ever be: never privacy,
   * never reach, never a feature somebody else does not get. See the README.
   */
  coverUrl: text("cover_url"),
  accentColor: text("accent_color"),
  /**
   * O cliente no Stripe. Não é segredo, e não autoriza nada sozinho: é o vínculo entre
   * uma pessoa daqui e um `cus_...` de lá, para o checkout não criar um cliente novo a
   * cada apoio. Único, porque dois leitores no mesmo cliente seria um pagando a insígnia
   * do outro.
   */
  stripeCustomerId: text("stripe_customer_id"),
  /**
   * APARECER NA LISTA DE APOIADORES. Nasce MARCADA, e quem não quiser desmarca.
   *
   * Nasceu opt-in (migration 0055) e virou opt-out por decisão do dono (0056): uma lista
   * que existe para agradecer não agradece ninguém se estiver sempre vazia, e com opt-in
   * o caso comum era a pessoa nunca descobrir que a caixa existia.
   *
   * A caixa mora em /perfil, só aparece para quem apoia, e desmarcar tira o nome na hora.
   * O que a lista mostra é nome e arroba, que já são públicos no perfil. Ela nunca mostra
   * valor, e nunca ordena por nada que se leia como "este apoia mais".
   */
  supporterPublic: boolean("supporter_public").notNull().default(true),
  /**
   * Até quando o apoio AVULSO vale. Cada pagamento empurra 30 dias para frente, e eles
   * somam em vez de se sobrescrever. Ver ehApoiador() e estenderAvulso(), em lib/apoio.ts.
   *
   * Não existe `is_supporter`: quem apoia é CALCULADO desta data e das assinaturas vivas.
   * Um booleano guardado mentiria no dia 31, quando o avulso vence e ninguém manda
   * webhook nenhum porque não aconteceu nada.
   */
  avulsoBadgeUntil: timestamp("avulso_badge_until", { withTimezone: true }),
  /**
   * O e-mail foi verificado.
   *
   * Não é um detalhe de auth: é o que separa uma conta de uma FAZENDA DE SPAM. Sem
   * verificação, o perfil é `noindex` e não aparece no explorar nem na busca de
   * pessoas. A pessoa usa o app inteiro, e o Google não vê nada. Ver lib/authz.ts.
   */
  emailVerified: boolean("email_verified").notNull().default(false),
  /**
   * OS LINKS DO PERFIL. Até 5 URLs, na ordem que a pessoa escolheu — o
   * teto é aplicado em app/perfil/actions.ts, não aqui. Sem rótulo, sem
   * "plataforma": o ícone e o nome se decidem olhando o domínio, na tela
   * (components/links-do-perfil.tsx). Um enum de plataformas seria um
   * formulário fingindo saber tudo que existe. Ver a migration 0065.
   */
  socialLinks: text("social_links").array().notNull().default([]),
  /**
   * BANIDO. Uma data, e nunca um DELETE.
   *
   * Erro de moderação acontece (quem modera é uma pessoa cansada), e um banimento
   * que apaga é um erro que não volta atrás. E o dado é DELE, mesmo de quem se
   * comportou mal: apagar a estante de alguém porque ele escreveu uma bobagem é
   * desproporcional, e a licença deste projeto promete o contrário.
   *
   * `deleted_at` é outra coisa: é a pessoa PEDINDO para sair. Ser expulso e ir
   * embora não são a mesma coisa, e por isso são duas colunas.
   */
  /**
   * MODERADOR. Um cargo SEPARADO do bibliotecário, e a separação é o ponto.
   *
   * Bibliotecário se ganha sozinho, cruzando um número. É a regra certa para mexer em
   * FICHA DE LIVRO (erro de catálogo é revertível, e tem o nome de quem fez no log) e
   * a regra ERRADA para mexer em GENTE.
   *
   * Poder sobre livro se ganha por trabalho. Poder sobre PESSOA se ganha por
   * CONFIANÇA, e confiança não é uma consulta: é alguém dizendo sim.
   *
   * Só o IDEALIZADOR concede, e ele é único no mundo por índice do banco.
   */
  moderatorAt: timestamp("moderator_at", { withTimezone: true }),
  moderatorBy: uuid("moderator_by").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  bannedAt: timestamp("banned_at", { withTimezone: true }),
  bannedReason: text("banned_reason"),
  bannedBy: uuid("banned_by").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  /**
   * O último dia em que a pessoa apareceu. Uma DATA, e não um relógio, e é a decisão.
   *
   * Ela responde UMA pergunta: a pessoa voltou? Ativos na semana, ativos no mês, e a
   * retenção (quem se cadastrou e ainda aparece). Não guarda a hora, não guarda a página,
   * não guarda o que a pessoa fez: só que ela esteve aqui, no dia. É a fronteira entre
   * saber se o projeto está vivo e vigiar leitor, e ela fica do lado de cá de propósito.
   *
   * Escrita no máximo uma vez por dia, no funil por onde tudo passa (getViewer). Ver
   * lib/viewer.ts, e o painel privado em lib/painel.ts.
   */
  lastSeenOn: date("last_seen_on"),
});

export const follows = pgTable("follows", {
  followerId: uuid("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followeeId: uuid("followee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  state: text("state").notNull().default("accepted"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("follows_pk").on(t.followerId, t.followeeId)]);

export const authors = pgTable("authors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /**
   * O endereço público do autor. Gerado do nome, e imutável depois disso: corrigir
   * um acento no nome não pode quebrar um link que alguém guardou.
   */
  slug: citext("slug").notNull(),
  /** "Brasileira", "Martinicana". The reader supplies the lens; the app only counts. */
  nationality: text("nationality"),
  /**
   * Quem é essa pessoa, em um parágrafo, escrito por um LEITOR.
   *
   * Nunca gerada por IA. Não é uma feature que falta: é uma recusa, e ela está no
   * README. O que a gente sabe sobre um autor é o que alguém se deu ao trabalho de
   * escrever.
   */
  bio: text("bio"),
  /**
   * O retrato, POR REFERÊNCIA: a URL da fonte, e nunca uma cópia do arquivo. Mesma
   * política da capa. Passa por bibliotecário, também como a capa: imagem é o único
   * campo que aparece na tela de todo mundo, e é onde o vandalismo tem plateia.
   */
  /**
   * DE ONDE VEIO A BIO, e sob qual licença. Ver lib/licenca.ts e a migration 0039.
   *
   * O Gume promete publicar um dataset CC0, e uma promessa que ninguém pode conferir é
   * propaganda. A Open Library e o Wikidata são CC0 e entram; a Wikipédia é CC-BY-SA,
   * aparece na tela com crédito, e fica FORA.
   */
  bioSource: text("bio_source"),
  /**
   * O retrato, POR REFERÊNCIA: a URL da fonte, e nunca uma cópia do arquivo.
   */
  imageUrl: text("image_url"),
  imageSource: text("image_source"),
  /**
   * O QID do Wikidata. A ponte para o país, a foto e a descrição em português — e o que
   * torna a nacionalidade possível de preencher.
   */
  wikidataId: text("wikidata_id"),
  openlibraryKey: text("openlibrary_key").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("authors_name_key").on(t.name),
  uniqueIndex("authors_slug_key").on(t.slug),
]);

/** A series: manga, and any multi-volume work. */
export const series = pgTable("series", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().unique(),
  kind: text("kind").notNull().default("series"),
  status: text("status").notNull().default("unknown"),
  anilistId: integer("anilist_id").unique(),
  totalVolumes: integer("total_volumes"),
});

/** The book as an idea. */
export const works = pgTable("works", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** The book's public address. Generated from title + author, then immutable. */
  slug: citext("slug").notNull().unique(),
  title: text("title").notNull(),
  authorId: uuid("author_id").references(() => authors.id, { onDelete: "set null" }),
  seriesId: uuid("series_id").references(() => series.id, { onDelete: "set null" }),
  /**
   * QUEM TROUXE ESTE LIVRO para o acervo.
   *
   * A página de contribuidores contava só CORREÇÕES, e quem cria a ficha de um livro
   * que faltava — o trabalho mais valioso para um catálogo — era invisível. Não por
   * esquecimento da tela: o dado não era gravado.
   *
   * `set null` e nunca cascade: quem apaga a conta leva os próprios dados, e não o
   * livro que trouxe. A ficha serve todo mundo, e apagá-la tiraria o livro da estante
   * de terceiros. O nome sai; o livro fica.
   */
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  /**
   * A POSIÇÃO desta obra dentro de uma série (o volume 3 de Vagabond). Nasceu
   * ligado à extinta `colecoes` (a "edição editorial" que um conjunto
   * representava — ver a migration 0062), mas sobreviveu à saída do
   * colecionador: `lib/corrections.ts` usa `(title, author, volume)` como parte
   * da identidade de uma obra ao fundir duplicatas, e o `unique` logo abaixo
   * depende dele.
   */
  volume: numeric("volume", { precision: 6, scale: 1 }),
  /** The year it was WRITTEN. Not the year this edition was printed. */
  firstPublished: integer("first_published"),
  genre: text("genre"),
  subject: text("subject"),
  /**
   * A SINOPSE. O que o livro é, em um parágrafo.
   *
   * Não é resenha: resenha é o que o LEITOR escreve, e é o produto deste app. A sinopse
   * apresenta a obra, e existe para quem ainda não decidiu se quer ler.
   */
  description: text("description"),
  /**
   * DE ONDE VEIO O TEXTO, e sob qual licença.
   *
   * O Gume promete publicar um dataset CC0, e uma promessa dessas só vale se der para
   * AUDITAR. Sem esta coluna, o dataset seria uma promessa que ninguém pode conferir — e
   * uma promessa que ninguém pode conferir é a definição de propaganda.
   *
   *   'openlibrary' e 'wikidata'  → CC0. Entram no dataset.
   *   'wikipedia'                 → CC-BY-SA. Aparece na tela com crédito, e FICA FORA.
   *   'gume'                      → escrito por um bibliotecário daqui. É nosso.
   */
  descriptionSource: text("description_source"),
  /**
   * The Open Library work key ("/works/OL45804W"). What makes a re-import an
   * upsert instead of a second copy of the catalog: OL titles drift between
   * editions, so (title, author) alone cannot recognise a work we already have.
   */
  openlibraryKey: text("openlibrary_key").unique(),
  /**
   * A reader typed this book in by hand because no source had it. It is a real
   * book on their shelf immediately; it just waits for a librarian to check the
   * metadata. Never a reason to hide it from the person who owns it.
   */
  needsReview: boolean("needs_review").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // works_title_idx SAIU (migration 0030): 47 MB de btree em título, usado 4 vezes na
  // vida. Quem responde a busca é o trigrama (works_title_trgm), porque quem procura
  // livro digita errado e sem acento, e btree não perdoa nada. Um índice que ninguém
  // lê custa disco e custa em toda escrita.
  // One work per (title, author, volume). volume/author can be null (a classic
  // has no volume), so NULLS NOT DISTINCT is required or the unique never fires.
  unique("works_title_author_volume").on(t.title, t.authorId, t.volume).nullsNotDistinct(),
]);

/** The object on the shelf. Page counts differ, so progress must know which one. */
/**
 * ════════════════════════════════════════════════════════════════════
 *  OS ENDEREÇOS QUE UMA OBRA JÁ TEVE. UM LINK COMPARTILHADO NÃO MORRE.
 *
 *  ═══ POR QUE ISTO EXISTE ═══
 *
 *  O endereço de uma obra carrega o nome do autor: `metamorfose-sheila-koerich`.
 *  Quando o autor está ERRADO — e estava, era a tradutora —, corrigir a ficha não
 *  conserta o endereço, e o endereço é a parte que as pessoas veem, copiam e mandam
 *  uma para a outra.
 *
 *  Trocar o endereço sem mais nada troca uma verruga visível por uma perda
 *  silenciosa: todo link já compartilhado passa a dar "não encontrado", e quem
 *  clicou não faz ideia do que aconteceu. **Um link quebrado é pior que um link
 *  feio**, porque o feio ainda leva ao livro.
 *
 *  Então o endereço velho não é apagado: ele vira uma linha aqui, e a página do
 *  livro redireciona. O link antigo continua chegando no lugar certo, para sempre.
 *
 *  ═══ POR QUE UMA TABELA, E NÃO UMA COLUNA ═══
 *
 *  Uma obra pode ser renomeada mais de uma vez (o autor errado hoje, o título
 *  bagunçado amanhã), e cada endereço que ela já teve tem que continuar chegando.
 *  Uma coluna `slug_antigo` guardaria só o penúltimo, e o antepenúltimo — que
 *  também está no histórico de alguém — morreria.
 *
 *  A chave primária é o slug: dois endereços iguais não podem apontar para obras
 *  diferentes, ou o redirecionamento passa a ser um sorteio.
 * ════════════════════════════════════════════════════════════════════
 */
export const workOldSlugs = pgTable("work_old_slugs", {
  slug: text("slug").primaryKey(),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("work_old_slugs_work_idx").on(t.workId)]);

export const editions = pgTable("editions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  isbn13: text("isbn13").unique(),
  publisher: text("publisher"),
  publishedYear: integer("published_year"),
  language: text("language").notNull().default("pt-BR"),
  /** Numa tradução, quem traduz é metade do livro que você tem na mão. */
  translator: text("translator"),
  pageCount: integer("page_count"),
  format: editionFormat("format").notNull().default("paperback"),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("editions_work_idx").on(t.workId)]);

/**
 * Every external name a single edition answers to. The import matcher reads
 * this first: an ISBN is the only identifier a reader can hold in their hand.
 * Primary key is (kind, value), so the same ISBN can never point at two rows.
 */
export const identifierKind = pgEnum("identifier_kind", [
  "isbn13", "isbn10", "openlibrary", "google_books", "oclc", "asin",
]);

export const identifiers = pgTable("identifiers", {
  editionId: uuid("edition_id").notNull().references(() => editions.id, { onDelete: "cascade" }),
  kind: identifierKind("kind").notNull(),
  value: text("value").notNull(),
}, (t) => [
  uniqueIndex("identifiers_pk").on(t.kind, t.value),
  index("identifiers_edition_idx").on(t.editionId),
]);

/** "This book is in my library." One row per (user, work). */
export const libraryEntries = pgTable("library_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  status: shelfStatus("status").notNull().default("want_to_read"),
  visibility: visibility("visibility").notNull().default("public"),
  /** This book came from a PERSON, not from an algorithm. The whole mechanic. */
  recommendedBy: uuid("recommended_by").references(() => users.id, { onDelete: "set null" }),
  /**
   * WHICH copy you are reading. A work has many editions (Memórias Póstumas has
   * 100), page counts differ between them, and the cover the shelf shows depends
   * on it. It lives here, not on owned_copies: you can read a book you do not own.
   */
  editionId: uuid("edition_id").references(() => editions.id, { onDelete: "set null" }),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  statusAt: timestamp("status_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("library_entries_user_work").on(t.userId, t.workId)]);

/**
 * The physical shelf. Owning is not reading: two thirds of a real collector's
 * shelf is unread, and where a book came from is the most interesting thing
 * about it. No other tracker records this.
 */
export const ownedCopies = pgTable("owned_copies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  editionId: uuid("edition_id").references(() => editions.id, { onDelete: "set null" }),
  state: ownState("state").notNull().default("owned"),
  acquiredOn: date("acquired_on"),
  /**
   * Where it came from, in the reader's own words. Free text, never a dropdown.
   * "presente da minha irmã", "sebo da Praça XI", "caixa do Clube de Filosofia".
   * A fixed enum was a form pretending to be a memory. Never required.
   */
  acquiredNote: text("acquired_note"),

  /*
   * ═══ O MERCADO SAIU DAQUI ═══
   *
   * `available_for` (doar / trocar / emprestar) e `came_from` (a corrente de quem passou
   * o exemplar para quem) foram removidos na migration 0046.
   *
   * Aquilo empurrava o Gume para ser um lugar de TRANSAÇÃO entre pessoas — com contato,
   * combinado e encontro — e trazia um peso de moderação **mesmo quando dava certo**.
   *
   * O que sobrou é `acquired_note`: "ganhei da minha irmã em 2019". Isso não é um
   * anúncio, é a HISTÓRIA de um exemplar, e nunca dependeu de o livro estar à disposição
   * de ninguém.
   */
  visibility: visibility("visibility").notNull().default("public"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("owned_copies_user_work").on(t.userId, t.workId)]);

/**
 * One row per time you actually read it. Rereads and DNFs are first class, not
 * an edge case: a book you abandoned is a fact about your year.
 *
 * The dates the reader chose are `date`, never `timestamptz`. A timestamp here
 * creates off-by-one-year bugs in the year screen for anyone not living in UTC.
 */
export const readings = pgTable("readings", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id").notNull().references(() => libraryEntries.id, { onDelete: "cascade" }),
  editionId: uuid("edition_id").references(() => editions.id, { onDelete: "set null" }),
  startedOn: date("started_on"),
  finishedOn: date("finished_on"),
  abandonedOn: date("abandoned_on"),
  /**
   * A PRECISÃO das datas acima. 'day' ou 'year', e nada mais.
   *
   * Quem leu em 2019 e não lembra o dia marca só o ano: a data vira 2019-01-01 e a
   * precisão vira 'year'. Sem esta coluna, o app não saberia a diferença entre "li em
   * 2019" e "terminei em 1º de janeiro", e a estatística da paciência (quantos dias o
   * livro esperou na estante) contaria um dia inventado. Com ela, a conta ignora o que
   * é só ano em vez de mentir. Ver a migration 0051 e lib/datas.ts.
   *
   * Duas colunas porque as duas pontas são independentes: dá para saber o dia em que
   * começou e só o ano em que terminou. O fim é um só (terminado OU abandonado), então
   * `endedPrecision` cobre os dois.
   */
  startedPrecision: text("started_precision").notNull().default("day"),
  endedPrecision: text("ended_precision").notNull().default("day"),
  visibility: visibility("visibility").notNull().default("public"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("readings_entry_idx").on(t.entryId, t.startedOn),
  // you cannot both finish and abandon the same reading
  check("readings_one_ending", sql`num_nonnulls(${t.finishedOn}, ${t.abandonedOn}) <= 1`),
]);

/**
 * There is no reading_progress table, and that is a product decision, not an
 * omission. A progress bar is not a field, it is a demand: it only works if you
 * come back every night to move it, and on the night you do not, the number sits
 * there lying to you. It is a streak wearing another name. See ai/DECISIONS.md.
 *
 * The year's page count sums page_count across the editions you FINISHED, so
 * nothing of value was lost. Do not add this table back.
 */

/**
 * A nota é uma PALAVRA, guardada como smallint 1..5 para ordenar, filtrar e
 * importar. Nunca um float, nunca meia estrela, e na tela nunca um dígito.
 *
 * 1 detestei · 2 não gostei · 3 achei ok · 4 gostei · 5 adorei
 *
 * Estrela é escala, escala vira média, média vira placar. Palavra não soma. Ver
 * lib/veredito.ts e a entrada em ai/DECISIONS.md.
 */
/**
 * QUANDO EXISTIR PAGAMENTO: dinheiro é INTEIRO, em centavos (`integer` ou
 * `bigint`), nunca `numeric` com casa decimal e jamais um float. Float não
 * representa 0,10, e o erro se acumula em toda soma até o caixa não fechar. Não
 * existe tabela de dinheiro aqui ainda, e é justamente por isso que a regra está
 * escrita antes. Ver lib/authz.ts e SECURITY-AUDIT.md.
 */

export const ratings = pgTable("ratings", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  value: smallint("value").notNull(),
  visibility: visibility("visibility").notNull().default("public"),
  ratedAt: timestamp("rated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("ratings_pk").on(t.userId, t.workId),
  index("ratings_work_idx").on(t.workId),
  check("ratings_words", sql`${t.value} between 1 and 5`),
]);

/** Rendered by uuidv7() in Postgres: the feed pages by cursor, so ids must sort by time. */
const uuidv7 = sql`uuidv7()`;

/**
 * The feed. Denormalised on purpose and queried on read: no fan-out-on-write, no
 * per-user inbox. At the scale of a chronological friends-only feed, selecting
 * where actor_id = ANY(followees) ORDER BY id DESC over a good index is correct
 * and boring. Revisit only when it actually hurts.
 *
 * `visibility` MIRRORS the row the activity is about. Shelving a private book
 * writes a private activity. Get this wrong and the feed becomes the leak: the
 * shelf row stays hidden while the activity announces it to everyone.
 */
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().default(uuidv7),
  actorId: uuid("actor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  verb: text("verb").notNull(),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "cascade" }),
  rating: smallint("rating"),
  /** Deleting a review takes its activity with it, so the feed never renders a headstone. */
  reviewId: uuid("review_id").references(() => reviews.id, { onDelete: "cascade" }),
  note: text("note"),
  visibility: visibility("visibility").notNull().default("public"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  /**
   * A honra em que a pessoa ENTROU ao terminar este livro. Nula em quase toda linha:
   * subir de degrau é raro, e tem que continuar sendo.
   *
   * Guarda a CHAVE ('prata', 'gume+3'), e nunca o nome de tela: o nome muda, e já mudou.
   * Uma linha de feed de março não pode envelhecer errado. Ver a migration 0044/0045.
   */
  honra: text("honra"),
}, (t) => [
  index("activities_actor_idx").on(t.actorId, t.id),
  index("activities_feed_idx").on(t.id),
]);

/**
 * One book, one person, one line of why. It lands on their shelf marked as having
 * come from a PERSON. This is the mechanic no competitor has, and it is the reason
 * somebody opens the app tomorrow.
 */
export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().default(uuidv7),
  fromUserId: uuid("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: uuid("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // the same person cannot recommend the same book twice: a nudge, never a nag
  uniqueIndex("recommendations_once").on(t.fromUserId, t.toUserId, t.workId),
  index("recommendations_to_idx").on(t.toUserId, t.id),
]);

/**
 * A review. The default is PRIVATE, deliberately: most reading notes are written
 * for yourself, and a tracker that publishes them by default teaches you to
 * write for an audience. Private reviews are free, forever. See ai/PRD.md.
 */
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  readingId: uuid("reading_id").references(() => readings.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  /**
   * O que a pessoa escreveu PARA SI, e não para o mundo.
   *
   * Existe porque a régua "sem perdas" tem dente: o Goodreads exporta `My Review`
   * E `Private Notes`, e sem esta coluna uma das duas se perderia em silêncio na
   * importação, que é exatamente a perda que o importador existe para impedir.
   *
   * Nunca é pública. Ela não tem visibilidade própria de propósito: uma nota
   * privada que pudesse virar pública seria uma armadilha esperando um clique.
   */
  privateNote: text("private_note"),
  language: text("language").notNull().default("pt-BR"),
  hasSpoilers: boolean("has_spoilers").notNull().default(false),
  visibility: visibility("visibility").notNull().default("private"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => [
  uniqueIndex("reviews_user_work").on(t.userId, t.workId),
  index("reviews_work_idx").on(t.workId, t.createdAt),
]);

/**
 * ════════════════════════════════════════════════════════════════════
 *  O UPVOTE. Um número, e nada mais — nunca um comentário.
 *
 *  "eu acho que deve ter upvote e comentário no gume... vai funcionar como
 *  ferramenta de socialização" — o dono, sabendo que reabre uma decisão
 *  antiga (README: "sem curtida"; ai/DECISIONS.md, 11 de julho: "sem
 *  comentários, nunca"). O upvote entra; o comentário livre fica para
 *  depois — a razão OPERACIONAL da decisão antiga ("uma pessoa só modera
 *  isto") é sobre TEXTO NOVO de estranho, e um upvote não escreve nada.
 *
 *  Vota em RESENHA, nunca em pessoa: é o mesmo limite que "queridinhos" já
 *  desenha (lib/queridinhos.ts) — ordenar LIVROS pelo carinho que
 *  receberam é permitido, ordenar GENTE não é.
 * ════════════════════════════════════════════════════════════════════
 */
export const reviewUpvotes = pgTable("review_upvotes", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reviewId: uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.reviewId] }),
  index("review_upvotes_review_idx").on(t.reviewId),
]);

/** A shelf the reader invented. Public or private, theirs either way. */
export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: citext("slug").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  visibility: visibility("visibility").notNull().default("public"),
  /**
   * A estante NUMERADA: 1º, 2º, 3º. Escolha de quem monta, estante por estante:
   * "meus dez favoritos" tem ordem, "terror brasileiro" é um conjunto. Obrigar toda
   * estante a ter números faria de toda coleção um pódio. Ver a migration 0052.
   */
  ranked: boolean("ranked").notNull().default(false),
  /**
   * A CARA da estante: um livro DELA, escolhido por quem montou, por referência ao
   * catálogo. Nunca upload solto: a capa de catálogo já foi curada, e apontar para
   * ela não abre superfície de vandalismo na vitrine. Ver a migration 0053.
   */
  coverWorkId: uuid("cover_work_id").references(() => works.id, { onDelete: "set null" }),
  /**
   * A FOTO da estante, subida por quem montou pelo mesmo funil do retrato de perfil
   * (/api/upload). Vira o pano de fundo da página da estante. Ver a migration 0054.
   */
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("collections_user_slug").on(t.userId, t.slug)]);

/**
 * QUEM GUARDOU A ESTANTE DE QUEM. Uma pergunta só ("quais você guardou?"), e nunca a
 * outra ("quantos guardaram esta?"): guardar é endosso, e endosso contado é curtida
 * com outro nome, que é a linha que o README não cruza. Nenhuma consulta conta por
 * aqui, e um teste varre isso. Ver lib/listas.ts e a migration 0052.
 */
export const collectionSaves = pgTable("collection_saves", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  collectionId: uuid("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("collection_saves_pk").on(t.userId, t.collectionId),
  index("collection_saves_col_idx").on(t.collectionId),
]);

/**
 * ════════════════════════════════════════════════════════════════════
 *  GUARDAR A CURADORIA DA CASA. O Top 100 não é uma coleção.
 *
 *  `collection_saves` aponta para `collections`, e a curadoria da casa não tem linha
 *  em tabela nenhuma: ela é CALCULADA a cada visita, e é isso que garante que ninguém
 *  a edita e que ela se refaz quando a comunidade muda de gosto.
 *
 *  Fazê-la virar uma coleção só para caber no mecanismo antigo seria mudar o que a
 *  coisa É para caber no jeito de guardar. A lista continua calculada; o que se guarda
 *  é o ponteiro para ela.
 *
 *  A chave é o NOME da lista, e não um id: uma lista editorial nova é uma linha, e não
 *  uma migration. Sem chave estrangeira, porque não há para onde apontar — ver
 *  lib/curadoria-guardada.ts, onde mora a lista de chaves que o app reconhece.
 * ════════════════════════════════════════════════════════════════════
 */
export const curationSaves = pgTable("curation_saves", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  chave: text("chave").notNull(),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ name: "curation_saves_pk", columns: [t.userId, t.chave] })]);

export const collectionItems = pgTable("collection_items", {
  collectionId: uuid("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("collection_items_pk").on(t.collectionId, t.workId),
  index("collection_items_work_idx").on(t.workId),
]);

/**
 * O UPVOTE, NAS LISTAS. Mesma forma de reviewUpvotes, tabela própria — não
 * uma FK polimórfica. NÃO é o mesmo gesto de "guardar" (collectionSaves):
 * guardar é comprometer (a curadoria de alguém dentro do seu próprio
 * perfil); upvote é mais leve. Ver a migration 0066.
 */
export const listUpvotes = pgTable("list_upvotes", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  collectionId: uuid("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.collectionId] }),
  index("list_upvotes_collection_idx").on(t.collectionId),
]);


/**
 * Anyone may edit any book in the catalogue. That only works because every edit
 * is append-only history with a name on it: what changed, what it was before, and
 * who did it. Nothing is ever overwritten in silence, and a bad edit is trivially
 * revertable, because `previous` is sitting right there.
 */
export const revisions = pgTable("revisions", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  patch: jsonb("patch").notNull(),
  previous: jsonb("previous").notNull(),
  reason: text("reason"),
  /**
   * Reverter é ação de bibliotecário, e a reversão TAMBÉM entra no log: ela é uma
   * revisão nova, e aponta para a que desfez.
   *
   * O que conta, na página de contribuidores, é o que SOBREVIVEU. Contar correção
   * feita produz correção lixo: a pessoa enche o contador com edição trivial ou
   * errada, que é problema documentado na Wikipédia.
   */
  revertedAt: timestamp("reverted_at", { withTimezone: true }),
  revertedBy: uuid("reverted_by").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  revertedIn: uuid("reverted_in").references((): AnyPgColumn => revisions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("revisions_target_idx").on(t.targetType, t.targetId, t.createdAt),
  index("revisions_user_idx").on(t.userId, t.revertedAt),
]);

/**
 * A fila da capa. A capa é a ÚNICA exceção à correção livre.
 *
 * Todo o resto (páginas, ano, editora, ISBN, tradutor, formato, idioma) qualquer
 * leitor logado corrige e aplica na hora, porque toda correção grava uma revisão
 * com o nome dele, e é isso que torna vandalismo caro: o nome fica, para sempre.
 *
 * A capa é diferente porque ela aparece na tela de todo mundo: é o único campo
 * onde o vandalismo tem plateia. Então o leitor PROPÕE e o bibliotecário aplica.
 */
export const coverProposals = pgTable("cover_proposals", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  editionId: uuid("edition_id").notNull().references(() => editions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  /** Por REFERÊNCIA, sempre: a URL da fonte, nunca uma cópia do arquivo. */
  coverUrl: text("cover_url").notNull(),
  note: text("note"),
  state: text("state").notNull().default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("cover_proposals_fila").on(t.state, t.createdAt),
  check("cover_proposals_state", sql`${t.state} in ('pending', 'applied', 'refused')`),
]);

/**
 * As duas insígnias que uma CONSULTA NÃO SABE RESPONDER.
 *
 * Seis das oito o banco calcula sozinho. Duas não:
 *
 *   CAÇADOR   apontou um erro que virou correção. Ligar uma issue escrita em
 *             português a um conserto no catálogo é julgamento humano, e nenhuma
 *             consulta faz isso. É a porta de quem não programa, e é justamente por
 *             isso que ela não pode ser automática.
 *
 *   TRADUTOR  traduziu o Gume. A contribuição chega por fora do banco.
 *
 * Elas são CONCEDIDAS, com nome, data e motivo. Append-only, como toda revisão deste
 * projeto: conceder é um ato público, e retirar também. Retirar não apaga a linha,
 * marca — um histórico que se apaga não é histórico.
 */
export const badgeGrants = pgTable("badge_grants", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badge: text("badge").notNull(),
  grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason"),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedBy: uuid("revoked_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("badge_grants_uma_por_pessoa").on(t.userId, t.badge).where(sql`${t.revokedAt} is null`),
  check("badge_grants_badge", sql`${t.badge} = 'idealizador'`),
]);

/**
 * ════════════════════════════════════════════════════════════════════
 *  O APOIO. Três tabelas, e NENHUM booleano dizendo "esta pessoa apoia".
 *
 *  Quem apoia é uma PERGUNTA, respondida na hora por ehApoiador() em lib/apoio.ts:
 *  existe assinatura viva, ou o avulso ainda não venceu. Nada guardado, nada para
 *  ficar velho, nada para alguém lembrar de limpar.
 *
 *  E o que está aqui é ESPELHO do Stripe, nunca fonte. A fonte é o Stripe, e o webhook
 *  reconfirma com ele antes de gravar: um POST que chega pela internet dizendo "fulano
 *  pagou" é uma campainha, e não uma prova.
 * ════════════════════════════════════════════════════════════════════
 */

export const stripeSubscription = pgTable("stripe_subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  priceId: text("price_id").notNull(),
  /**
   * Marcador, Lombada, Capa Dura. Os três dão a MESMA insígnia: o tier existe só para a
   * pessoa saber o que assinou. Nada lê isto para decidir o que alguém pode fazer, e
   * nada pode passar a ler. Apoio não destrava função nenhuma.
   */
  tier: text("tier").notNull(),
  /** O status cru do Stripe. Quais valem insígnia é regra de lib/apoio.ts, e só de lá. */
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("stripe_subscription_user").on(t.userId, t.status),
  check("stripe_subscription_tier", sql`${t.tier} in ('marcador', 'lombada', 'capadura')`),
]);

/**
 * Um apoio de valor livre. O valor é guardado por honestidade contábil, e NUNCA aparece
 * para ninguém além de quem pagou: a lista de apoiadores não mostra, não ordena e não
 * soma. Não existe apoiar mais, é sim ou não.
 */
export const stripeOneTimeSupport = pgTable("stripe_one_time_support", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").notNull().unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("brl"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("stripe_one_time_support_user").on(t.userId, t.createdAt),
  check("stripe_one_time_support_amount", sql`${t.amountCents} > 0`),
]);

/**
 * A trava contra o evento repetido.
 *
 * O Stripe REENVIA, e está certo em reenviar: uma resposta que se perdeu na volta, um
 * deploy no meio. Sem isto, um avulso reenviado daria 60 dias de insígnia por um
 * pagamento de 30.
 *
 * A linha entra DEPOIS de o efeito ter sido aplicado, e junto com ele. Marcar antes
 * seria pior que não marcar: um erro no meio perderia o pagamento em silêncio.
 */
export const stripeProcessedEvent = pgTable("stripe_processed_event", {
  eventId: text("event_id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("stripe_processed_event_created_at").on(t.createdAt),
]);

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS FAVORITOS. Até cinco, e o primeiro é o coroado.
 *
 *  "O que eu adorei" mostrava TODOS os 5 estrelas, sem limite — quem tem trinta
 *  virava uma vitrine que não escolhe nada. Favorito é curadoria: cinco no
 *  máximo, e um deles é O favorito, não só "mais um dos cinco".
 *
 *  `position` é 1 a 5 NA PRÁTICA — mas sem CHECK travando o intervalo, de
 *  propósito: coroar() (lib/favoritos.ts) reordena em duas fases, com um
 *  offset NEGATIVO temporário dentro da transação (é o jeito seguro de
 *  reescrever várias posições sem colidir com o unique abaixo, já que um
 *  CHECK nunca pode ser DEFERRABLE no Postgres — só UNIQUE pode). Quem
 *  escreve aqui é só lib/favoritos.ts, e ele garante o intervalo sozinho.
 *
 *  A posição 1 É a coroa — nunca um booleano à parte (`crowned`) que pudesse
 *  discordar da posição: duas fontes da mesma verdade são duas fontes que um
 *  dia divergem. Coroar É virar posição 1.
 * ════════════════════════════════════════════════════════════════════
 */
export const favoriteBooks = pgTable("favorite_books", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  position: smallint("position").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.workId] }),
  uniqueIndex("favorite_books_user_position").on(t.userId, t.position),
]);

/**
 * ════════════════════════════════════════════════════════════════════
 *  "O QUE VEM POR AÍ". Um item por vez, escrito pelo dono, votado pelo leitor.
 *
 *  Reabre a decisão de 2026-07-11 ("o roadmap mora no GitHub Discussions") —
 *  ver ai/DECISIONS.md pela entrada nova. Um item nasce "ideia", o dono sobe o
 *  status à mão até "lancado" — e é a transição PARA "lancado" que grava
 *  `lancadoEm`, o que ordena `getChangelog()` (lib/roadmap.ts). Não existe
 *  status pra "recusado": o dono apaga o que não vai construir, e não escreve
 *  um obituário público de ideia de leitor.
 *
 *  `position` é solto, sem unique constraint — o molde de `collectionItems`,
 *  e não o de `favoriteBooks`: só o dono escreve aqui (via /painel), sem
 *  disputa concorrente entre leitores votando ao mesmo tempo em quem manda na
 *  ORDEM da lista.
 * ════════════════════════════════════════════════════════════════════
 */
export const roadmapItems = pgTable("roadmap_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  /** Pode ficar sem descrição: uma ideia às vezes é só um título. */
  description: text("description"),
  status: roadmapStatus("status").notNull().default("ideia"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lancadoEm: timestamp("lancado_em", { withTimezone: true }),
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  O VOTO NUM ITEM DE "O QUE VEM POR AÍ". Três por ANO, e o ano mora na chave.
 *
 *  "cada usuario tem 3 upvotes por ano para gatar nessses itens" — o dono. Sem
 *  fila de reset (não existe cron neste repo): `ano` faz parte da chave
 *  primária, então a MESMA pessoa pode votar no MESMO item de novo num ano
 *  seguinte — o interesse persiste, e o histórico nunca é apagado — mas nunca
 *  duas vezes no mesmo item dentro do mesmo ano. O teto de 3 é contado em
 *  lib/roadmap.ts (`count(*) where user_id = ... and ano = ano_atual`), do
 *  mesmo jeito que `favoritar()` conta os 5 antes de inserir o 6º.
 *
 *  Quem votou é PRIVADO — mesmo padrão de review_upvotes/list_upvotes: só o
 *  NÚMERO é público.
 * ════════════════════════════════════════════════════════════════════
 */
export const roadmapVotes = pgTable("roadmap_votes", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").notNull().references(() => roadmapItems.id, { onDelete: "cascade" }),
  ano: smallint("ano").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.itemId, t.ano] }),
  index("roadmap_votes_item_idx").on(t.itemId),
]);

import { sql } from "drizzle-orm";
import {
  pgEnum, pgTable, text, timestamp, uuid, boolean, smallint, integer,
  numeric, date, jsonb, uniqueIndex, unique, index, customType, check,
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
  isSupporter: boolean("is_supporter").notNull().default(false),
  /**
   * O e-mail foi verificado.
   *
   * Não é um detalhe de auth: é o que separa uma conta de uma FAZENDA DE SPAM. Sem
   * verificação, o perfil é `noindex` e não aparece no explorar nem na busca de
   * pessoas. A pessoa usa o app inteiro, e o Google não vê nada. Ver lib/authz.ts.
   */
  emailVerified: boolean("email_verified").notNull().default(false),
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
   * A COLEÇÃO de que esta obra é volume. É da EDIÇÃO, e não da série: a Panini publica
   * Berserk em duas edições, e o "volume 25" de uma não é o "volume 25" da outra.
   * Ver a migration 0038.
   */
  colecaoId: uuid("colecao_id"),
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
 * 1 não terminei · 2 não gostei · 3 achei ok · 4 gostei · 5 adorei
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

/** A shelf the reader invented. Public or private, theirs either way. */
export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: citext("slug").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  visibility: visibility("visibility").notNull().default("public"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("collections_user_slug").on(t.userId, t.slug)]);

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

# Schema

> Este documento é o MODELO-ALVO, não a fonte da verdade. A verdade é lib/db/schema.ts e as migrations do Drizzle. As tabelas chegam fatia por fatia, conforme o ai/PLAN.md. Se o DDL desta página divergir do código, o código está certo.

Postgres 16. Chaves primárias UUIDv7 (ordenáveis por tempo, então `id` serve também como uma ordem de inserção aproximada e chave de paginação). Timestamps são `timestamptz`, sempre UTC.

## As sete decisões que este schema trava

1. **`works` e `editions` são separadas.** Uma obra é o livro como ideia (*Austerlitz*); uma edição é um objeto (capa dura da Hamish Hamilton de 2001, 416pp, ISBN 978-0241141021, trad. Anthea Bell). O Goodreads confundiu as duas por anos e o banco dele nunca se recuperou. Notas e resenhas se ligam à **obra**. Leituras e progresso se ligam à **edição**, porque a contagem de páginas muda.

2. **Ler é um log, não um status.** Um `library_entry` é "este livro está na minha biblioteca". Uma `reading` é "esta vez específica em que eu li". Releituras são de primeira classe, DNFs são de primeira classe, e a sua leitura de 2019 de um livro não é sobrescrita quando você o pega de novo em 2027.

3. **Toda edição de metadado é uma revisão append-only.** `revisions` guarda o ator, o JSON patch e o motivo. Nada é sobrescrito em silêncio; qualquer coisa pode ser revertida; a confiança do bibliotecário é conquistável e revogável. Essa é a tabela que decide se os dados de livro continuam bons.

4. **O feed é uma tabela `activities`, consultada na leitura.** Sem fan-out-on-write, sem caixa de entrada por usuário. Na escala de um feed cronológico só de amigos, `SELECT ... WHERE actor_id = ANY(followees) ORDER BY id DESC` sobre um bom índice é correto e sem graça. Revisite só quando doer de verdade.

5. **Ter um livro e ler um livro são fatos separados.** A estante de um colecionador de verdade é dois terços não lida, e um livro que foi herdado não é o mesmo objeto que um livro da Amazon. `owned_copies` carrega a procedência como **texto livre** (`acquired_note`: "ganhei da minha irmã em 2019", "box 14 do Clube de Filosofia") — e não como uma lista fechada, porque um enum fixo era um formulário fingindo ser memória. Nenhum outro tracker registra isso. É a feature mais física, mais brasileira do produto.

6. **Privacidade é por linha, não por conta.** Todo entry, reading, review e highlight carrega o seu próprio `visibility`. Uma conta privada é só um padrão, não um muro.

7. **Dados da comunidade (climas, avisos, tags) são guardados como votos individuais, não como agregados.** Agregados são materialized views. É isso que torna o dataset aberto (CC0) publicável e auditável, em vez de uma caixa-preta como a da StoryGraph. E todo texto de catálogo que não é do leitor — sinopse, biografia, retrato — carrega a **fonte** de onde veio (`description_source`, `bio_source`, `image_source`, com valores `openlibrary`, `wikidata`, `wikipedia` ou `gume`), porque um dataset auditável precisa dizer não só o que afirma, mas de onde tirou.

---

## Diagrama

```
authors ──< work_contributors >── works ──< editions ──< identifiers
                                    │           │
                                    │
              library_entries >─────┤ (user × work)
                     │              │
                     └──< readings ─┘ (edition, started_at, finished_at)
                                    │
                            ratings │ reviews │ highlights
                                    │
                     work_moods · work_warnings · work_tags  (votes → matviews)

users ──< follows ──> users
users ──< activities  (the feed)
users ──< collections ──< collection_items
users ──< imports
users ──< revisions   (librarian audit trail, targets works/editions/authors)
```

---

## DDL

```sql
create extension if not exists "pg_uuidv7";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

-- ─────────────────────────────────────────── people

create table users (
  id            uuid primary key default uuid_generate_v7(),
  handle        citext not null unique check (handle ~ '^[a-z0-9_]{2,30}$'),
  email         citext not null unique,
  display_name  text,
  bio           text,
  avatar_url    text,
  locale        text not null default 'pt-BR',
  is_private    boolean not null default false,   -- default visibility for new rows
  librarian_tier smallint not null default 0,     -- 0 none, 1 trusted, 2 moderator
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table follows (
  follower_id  uuid not null references users(id) on delete cascade,
  followee_id  uuid not null references users(id) on delete cascade,
  state        text not null default 'accepted'   -- 'pending' | 'accepted'
               check (state in ('pending','accepted')),
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index on follows (followee_id) where state = 'accepted';

-- ─────────────────────────────────────────── books

-- de onde veio um texto de catálogo (sinopse, bio, retrato). ver decisão 7.
create type texto_fonte as enum ('openlibrary','wikidata','wikipedia','gume');

create table authors (
  id           uuid primary key default uuid_generate_v7(),
  name         text not null,
  slug         citext not null,        -- endereço público, gerado do nome e imutável
  bio          text,                   -- nunca gerada por IA. é uma recusa. ver ai/DECISIONS.md.
  bio_source   texto_fonte,
  image_url    text,                   -- o retrato, POR REFERÊNCIA (a URL da fonte), como a capa
  image_source texto_fonte,
  nationality  text,          -- "Brasileira", "Martinicana". readers curate by this; the year screen shows it.
  wikidata_id  text,
  openlibrary_key text unique,
  created_at   timestamptz not null default now()
);
create index on authors using gin (name gin_trgm_ops);

create table works (
  id                uuid primary key default uuid_generate_v7(),
  slug              citext not null unique,
  title             text not null,
  subtitle          text,
  original_language text,                    -- BCP-47
  first_published   integer,                 -- year only; precision is a lie here
  description        text,                    -- a sinopse. NÃO é resenha (resenha é do leitor).
  description_source texto_fonte,
  openlibrary_key   text unique,
  canonical_id      uuid references works(id), -- set when merged into another work
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on works using gin (title gin_trgm_ops);
create index on works (canonical_id) where canonical_id is not null;

create table work_contributors (
  work_id    uuid not null references works(id) on delete cascade,
  author_id  uuid not null references authors(id) on delete cascade,
  role       text not null default 'author'
             check (role in ('author','editor','illustrator','contributor')),
  position   smallint not null default 0,
  primary key (work_id, author_id, role)
);

create table editions (
  id            uuid primary key default uuid_generate_v7(),
  work_id       uuid not null references works(id) on delete cascade,
  title         text,                        -- null = inherit from work
  language      text not null default 'pt-BR',
  publisher     text,
  published_on  date,
  page_count    integer check (page_count > 0),
  duration_sec  integer check (duration_sec > 0),   -- audiobooks
  format        text not null default 'paperback'
                check (format in ('hardcover','paperback','ebook','audiobook','other')),
  cover_url     text,
  cover_blurhash text,                       -- so the shelf never flashes gray
  translator_id uuid references authors(id), -- translation is an edition property
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on editions (work_id);

create table identifiers (
  edition_id uuid not null references editions(id) on delete cascade,
  kind       text not null
             check (kind in ('isbn13','isbn10','openlibrary','google_books','oclc','asin')),
  value      text not null,
  primary key (kind, value)
);
create index on identifiers (edition_id);

-- ─────────────────────────────────────────── series and volumes (manga, and any multi-volume work)

create table series (
  id            uuid primary key default uuid_generate_v7(),
  slug          citext not null unique,
  title         text not null,
  original_title text,
  kind          text not null default 'series'
                check (kind in ('series','manga','light_novel','comic')),
  status        text not null default 'unknown'
                check (status in ('ongoing','completed','hiatus','cancelled','unknown')),
  anilist_id    integer unique,      -- AniList public GraphQL API. an official API, not a scrape.
  total_volumes integer,
  created_at    timestamptz not null default now()
);

alter table works
  add column series_id uuid references series(id) on delete set null,
  add column volume    numeric(6,1);   -- 1, 2, 7.5 for side volumes

create index on works (series_id, volume);

-- a reader shelves a series and reads volumes. progress on a series =
-- count of its works marked read. compute it, never store it.

-- ─────────────────────────────────────────── the physical shelf: owning is not reading
-- 2/3 of a real collector's shelf is unread. owning a book is its own fact, with its own story.

create table owned_copies (
  id           uuid primary key default uuid_generate_v7(),
  user_id      uuid not null references users(id) on delete cascade,
  edition_id   uuid references editions(id) on delete set null,
  work_id      uuid not null references works(id) on delete cascade,
  state        text not null default 'owned'
               check (state in ('owned','wanted','lent_out','gone')),
  -- de onde veio. nenhum outro tracker registra isso, e é a alma de uma estante física.
  -- TEXTO LIVRE, e não um enum: um enum fixo era um formulário fingindo ser memória.
  acquired_on  date,
  acquired_note text,          -- "box 14 do Clube de Filosofia", "ganhei da minha irmã"
  visibility   visibility not null default 'public',
  created_at   timestamptz not null default now(),
  unique (user_id, work_id, edition_id)
);
create index on owned_copies (user_id, state);

-- ─────────────────────────────────────────── reading

create type visibility as enum ('public','followers','private');
create type shelf_status as enum ('want_to_read','reading','read','did_not_finish');

-- one row per (user, work): "this book is in my library"
create table library_entries (
  id           uuid primary key default uuid_generate_v7(),
  user_id      uuid not null references users(id) on delete cascade,
  work_id      uuid not null references works(id) on delete cascade,
  status       shelf_status not null default 'want_to_read',
  visibility   visibility not null default 'public',
  added_at     timestamptz not null default now(),
  status_at    timestamptz not null default now(),  -- when status last changed
  unique (user_id, work_id)
);
create index on library_entries (user_id, status, status_at desc);

-- one row per time you actually read it. rereads and DNFs are first-class.
create table readings (
  id           uuid primary key default uuid_generate_v7(),
  entry_id     uuid not null references library_entries(id) on delete cascade,
  edition_id   uuid references editions(id) on delete set null,
  started_on   date,
  finished_on  date,
  abandoned_on date,
  visibility   visibility not null default 'public',
  created_at   timestamptz not null default now(),
  check (num_nonnulls(finished_on, abandoned_on) <= 1)
);
create index on readings (entry_id, started_on desc);

-- Não existe reading_progress, e isso é decisão de produto, não esquecimento.
-- Barra de progresso não é um campo, é uma cobrança: ela só funciona se você
-- voltar toda noite para mexer nela, e na noite em que você não voltar, o número
-- fica mentindo na tela. É streak com outro nome. Ver ai/DECISIONS.md.
--
-- A contagem de páginas do ano soma page_count das edições TERMINADAS, então
-- nada de valor se perdeu. Não traga esta tabela de volta.

-- A nota é uma PALAVRA, guardada como smallint 1..5 para ordenar, filtrar e
-- importar. Na tela nunca aparece um dígito.
--
--   1 não terminei · 2 não gostei · 3 achei ok · 4 gostei · 5 adorei
--
-- Estrela é escala, escala vira média, média vira placar. Palavra não soma: não
-- existe "a média entre gostei e adorei", e é por isso que a palavra é a forma
-- certa. Ela torna o placar impossível por construção, e não apenas proibido por
-- regra. Ver lib/veredito.ts e ai/DECISIONS.md.
create table ratings (
  user_id    uuid not null references users(id) on delete cascade,
  work_id    uuid not null references works(id) on delete cascade,
  value      smallint not null check (value between 1 and 5),
  visibility visibility not null default 'public',
  rated_at   timestamptz not null default now(),
  primary key (user_id, work_id)
);
create index on ratings (work_id);

create table reviews (
  id          uuid primary key default uuid_generate_v7(),
  user_id     uuid not null references users(id) on delete cascade,
  work_id     uuid not null references works(id) on delete cascade,
  reading_id  uuid references readings(id) on delete set null,
  body        text not null,
  language    text not null default 'pt-BR',
  has_spoilers boolean not null default false,
  -- PRIVADA por padrão. A maior parte das anotações de leitura é escrita para si
  -- mesmo, e um tracker que publica por padrão ensina, em silêncio, a escrever
  -- para uma plateia. Resenha privada é de graça, para sempre. Ver ai/DECISIONS.md.
  visibility  visibility not null default 'private',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (user_id, work_id)
);
create index on reviews (work_id, created_at desc) where deleted_at is null;

-- v2 feature, v1 schema. importers write straight into this.
create table highlights (
  id          uuid primary key default uuid_generate_v7(),
  user_id     uuid not null references users(id) on delete cascade,
  work_id     uuid not null references works(id) on delete cascade,
  edition_id  uuid references editions(id) on delete set null,
  body        text not null,
  note        text,
  page        integer,
  location    text,                 -- kindle location, epub cfi, timestamp
  visibility  visibility not null default 'private',   -- quotes default private
  source      text,                 -- 'manual' | 'kindle' | 'kobo' | 'ocr'
  created_at  timestamptz not null default now()
);
create index on highlights (user_id, work_id);

-- ─────────────────────────────────────────── collections

create table collections (
  id          uuid primary key default uuid_generate_v7(),
  user_id     uuid not null references users(id) on delete cascade,
  slug        citext not null,
  name        text not null,
  description text,
  visibility  visibility not null default 'public',
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);

create table collection_items (
  collection_id uuid not null references collections(id) on delete cascade,
  work_id       uuid not null references works(id) on delete cascade,
  position      integer not null default 0,
  note          text,
  added_at      timestamptz not null default now(),
  primary key (collection_id, work_id)
);

-- ─────────────────────────────────────────── the open book graph
-- individual votes. aggregates are matviews. the whole thing publishes as CC0.

create table work_moods (
  user_id  uuid not null references users(id) on delete cascade,
  work_id  uuid not null references works(id) on delete cascade,
  mood     text not null,          -- 'dark','tense','hopeful','funny','reflective'...
  primary key (user_id, work_id, mood)
);

create table work_pace (
  user_id uuid not null references users(id) on delete cascade,
  work_id uuid not null references works(id) on delete cascade,
  pace    text not null check (pace in ('slow','medium','fast')),
  primary key (user_id, work_id)
);

create table work_warnings (
  user_id  uuid not null references users(id) on delete cascade,
  work_id  uuid not null references works(id) on delete cascade,
  warning  text not null,
  degree   text not null default 'moderate'
           check (degree in ('minor','moderate','graphic')),
  primary key (user_id, work_id, warning)
);

create materialized view work_signals as
select w.id as work_id,
       (select avg(value)::numeric(3,1) from ratings r where r.work_id = w.id) as avg_rating,
       (select count(*) from ratings r where r.work_id = w.id)                 as rating_count,
       (select jsonb_object_agg(mood, n) from (
          select mood, count(*) n from work_moods m where m.work_id = w.id group by mood
        ) x)                                                                   as moods,
       (select jsonb_object_agg(warning, n) from (
          select warning, count(*) n from work_warnings c where c.work_id = w.id group by warning
        ) y)                                                                   as warnings
from works w;
create unique index on work_signals (work_id);

-- ─────────────────────────────────────────── the feed

create table activities (
  id          uuid primary key default uuid_generate_v7(),   -- time-sortable: this IS the cursor
  actor_id    uuid not null references users(id) on delete cascade,
  verb        text not null
              check (verb in ('shelved','started','finished','abandoned','rated',
                              'reviewed','highlighted','progressed','collected')),
  work_id     uuid references works(id) on delete cascade,
  object_type text,        -- 'reading' | 'review' | 'highlight' | 'collection'
  object_id   uuid,
  visibility  visibility not null default 'public',
  created_at  timestamptz not null default now()
);
create index on activities (actor_id, id desc);

-- friends feed:
--   select * from activities
--   where actor_id in (select followee_id from follows
--                      where follower_id = $me and state = 'accepted')
--     and visibility <> 'private'
--     and id < $cursor
--   order by id desc limit 30;

-- ─────────────────────────────────────────── reading clubs

create table clubs (
  id          uuid primary key default uuid_generate_v7(),
  slug        citext not null unique,
  name        text not null,
  description text,
  owner_id    uuid not null references users(id) on delete cascade,  -- a creator runs their own club
  visibility  visibility not null default 'public',
  join_policy text not null default 'open'
              check (join_policy in ('open','invite','approval')),
  created_at  timestamptz not null default now()
);

create table club_members (
  club_id   uuid not null references clubs(id) on delete cascade,
  user_id   uuid not null references users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','moderator','member')),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

-- what the club is reading, and when
create table club_reads (
  id         uuid primary key default uuid_generate_v7(),
  club_id    uuid not null references clubs(id) on delete cascade,
  work_id    uuid not null references works(id) on delete cascade,
  starts_on  date,
  ends_on    date,
  created_at timestamptz not null default now()
);
create index on club_reads (club_id, starts_on desc);

-- ─────────────────────────────────────────── invites, recommendations, support

create table invites (
  id          uuid primary key default uuid_generate_v7(),
  inviter_id  uuid not null references users(id) on delete cascade,
  code        citext not null unique,
  invitee_id  uuid references users(id) on delete set null,  -- filled when redeemed
  created_at  timestamptz not null default now(),
  redeemed_at timestamptz
);
create index on invites (inviter_id);
-- the lineage: users.invited_by is the graph. see below.
alter table users add column invited_by uuid references users(id) on delete set null;

create table recommendations (
  id         uuid primary key default uuid_generate_v7(),
  from_id    uuid not null references users(id) on delete cascade,
  to_id      uuid not null references users(id) on delete cascade,
  work_id    uuid not null references works(id) on delete cascade,
  note       text,          -- one line of why. from a person, not an algorithm.
  created_at timestamptz not null default now(),
  read_at    timestamptz,
  unique (from_id, to_id, work_id),
  check (from_id <> to_id)
);
create index on recommendations (to_id, created_at desc);

-- cosmetics only. never privacy, never the core. see PRD.
create table supporters (
  user_id       uuid primary key references users(id) on delete cascade,
  tier          text not null check (tier in ('supporter','patron')),
  started_on    date not null default current_date,
  expires_on    date,
  profile_cover text,        -- the cosmetic they bought
  badge         text
);

-- ─────────────────────────────────────────── librarian audit trail

create table revisions (
  id           uuid primary key default uuid_generate_v7(),
  user_id      uuid references users(id) on delete set null,
  target_type  text not null check (target_type in ('work','edition','author')),
  target_id    uuid not null,
  patch        jsonb not null,     -- json merge patch: what changed
  previous     jsonb not null,     -- the fields as they were, so revert is trivial
  reason       text,
  reverted_by  uuid references revisions(id),
  created_at   timestamptz not null default now()
);
create index on revisions (target_type, target_id, created_at desc);

-- ─────────────────────────────────────────── imports & export

create table imports (
  id          uuid primary key default uuid_generate_v7(),
  user_id     uuid not null references users(id) on delete cascade,
  source      text not null
              check (source in ('goodreads','storygraph','skoob','librarything',
                                'kindle_clippings','kobo','csv')),
  state       text not null default 'pending'
              check (state in ('pending','matching','review','done','failed')),
  raw_key     text,          -- object storage key for the original file. we keep it.
  total       integer not null default 0,
  matched     integer not null default 0,
  unmatched   jsonb not null default '[]',   -- rows the matcher wasn't sure about
  created_at  timestamptz not null default now(),
  finished_at timestamptz
);
```

---

## Notas sobre as partes que vão morder

**Casar (matching) na importação é o jogo inteiro.** Um CSV do Goodreads te dá um título, um autor e talvez um ISBN. Case por ISBN primeiro (via `identifiers`), depois por título + autor normalizados com similaridade de trigramas, depois entregue qualquer coisa abaixo do limiar de confiança para o usuário num passo de revisão. Nunca chute em silêncio: um casamento errado é pior que uma linha não casada, porque o usuário não vai notar por dois anos. Guarde o arquivo original (`imports.raw_key`) para que um matcher melhor possa ser rodado de novo depois.

**Obras duplicadas são inevitáveis.** O merge seta `works.canonical_id` na perdedora em vez de apagá-la, para que links antigos e foreign keys antigas continuem resolvendo. Todo caminho de leitura resolve através de `coalesce(canonical_id, id)`.

**`activities` é desnormalizada de propósito e mente com o tempo.** Se um usuário apaga uma resenha, a linha de activity tem que ir junto. Faça isso na mesma transação, não num job de limpeza, ou o feed vai renderizar lápides.

**A nota é uma PALAVRA, guardada como `smallint` 1..5**, e nunca um float. Não existe estrela em lugar nenhum do produto, nem meia estrela, nem "4,5".

Estrela é escala, escala vira média, média vira placar. **Palavra não soma**: não existe "a média entre gostei e adorei". Isso não proíbe o placar por regra, torna ele **impossível por construção** — e a diferença entre as duas coisas é a diferença entre uma promessa e uma garantia.

**Fusos horários.** `finished_on` é uma `date`, não um timestamp. Leitores dizem "terminei na terça", não "terminei às 03:14 UTC". Guardar um timestamp aqui cria um bug em que a sua retrospectiva do ano move um livro para o ano errado para qualquer pessoa a leste de Londres.

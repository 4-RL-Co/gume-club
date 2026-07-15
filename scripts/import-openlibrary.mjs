#!/usr/bin/env node
/**
 * Semeia o catálogo a partir do dump oficial da Open Library, filtrado para
 * português. A Open Library publica o próprio dump em domínio público: isto é
 * uma fonte, não uma raspagem. Ver ai/PRD.md e ai/DECISIONS.md.
 *
 *   node scripts/import-openlibrary.mjs            # filtra, resolve autores, carrega
 *   node scripts/import-openlibrary.mjs --limit 50000   # só as N primeiras linhas do dump
 *   node scripts/import-openlibrary.mjs --refresh       # ignora o cache e refiltra
 *   node scripts/import-openlibrary.mjs --filter-only   # não toca no banco
 *
 * O dump bruto NUNCA mora no repo. OPENLIBRARY_DUMP_DIR (.env) aponta para fora.
 *
 * O dump de edições tem ~12 GB comprimido e ~120 GB cru, então nada dele é
 * gravado em disco: o arquivo é lido em stream (HTTP -> gunzip -> linha a linha)
 * e só as linhas em português sobrevivem, num .jsonl de algumas centenas de MB.
 * Se você já tiver o .txt.gz baixado dentro de OPENLIBRARY_DUMP_DIR, ele é usado
 * no lugar da rede.
 *
 * Três estágios, cada um cacheado no seu artefato (dá para retomar de onde parou):
 *   1. edições  ol_dump_editions.txt.gz  -> por-editions.jsonl
 *   2. autores  ol_dump_authors.txt.gz   -> por-authors.jsonl  (só as chaves usadas)
 *   3. carga    os dois .jsonl           -> works/editions/authors/identifiers
 */
import { createReadStream, createWriteStream, existsSync, readFileSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import postgres from "postgres";
import { limparNomeDeAutor } from "../lib/autores.ts";

// ─────────────────────────────────────────────────────────── configuração

/** Lê do ambiente, caindo no .env. Nada de segredo daqui vai para o cliente. */
function env(key, fallback) {
  const fromEnv = process.env[key];
  if (fromEnv) return fromEnv;
  const dotenv = existsSync(".env") ? readFileSync(".env", "utf8") : "";
  return dotenv.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() || fallback;
}

const DUMP_DIR = env("OPENLIBRARY_DUMP_DIR", path.join(os.homedir(), "gume-data/dumps"));
const EDITIONS_URL = env("OPENLIBRARY_EDITIONS_URL", "https://openlibrary.org/data/ol_dump_editions_latest.txt.gz");
const AUTHORS_URL = env("OPENLIBRARY_AUTHORS_URL", "https://openlibrary.org/data/ol_dump_authors_latest.txt.gz");
const DATABASE_URL = env("DATABASE_URL");

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const LIMIT = Number(args[args.indexOf("--limit") + 1]) || Infinity;
const REFRESH = has("--refresh");
const FILTER_ONLY = has("--filter-only");

/** A língua que estamos semeando. O dump usa ISO 639-2/B. */
export const LANGUAGE_KEY = "/languages/por";

/** É português? O dump lista as línguas da edição; basta uma ser `por`. */
export function isPortuguese(rec) {
  return Boolean(rec?.languages?.some((l) => l?.key === LANGUAGE_KEY));
}

const EDITIONS_JSONL = path.join(DUMP_DIR, "por-editions.jsonl");
const AUTHORS_JSONL = path.join(DUMP_DIR, "por-authors.jsonl");

// ─────────────────────────────────────────────────────────── leitura do dump

/**
 * Abre o dump: o arquivo local, se existir; senão a rede, em stream. Nunca
 * gravamos o .gz em disco, porque ele não cabe.
 */
async function openDump(filename, url) {
  const local = path.join(DUMP_DIR, filename);
  if (existsSync(local)) {
    const gb = (statSync(local).size / 1e9).toFixed(1);
    console.log(`  lendo do disco: ${local} (${gb} GB)`);
    return createReadStream(local);
  }
  console.log(`  streaming de ${url}`);
  console.log(`  (nada é gravado em disco: só as linhas em português sobrevivem)`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Open Library respondeu ${res.status} para ${url}`);
  const total = Number(res.headers.get("content-length")) || 0;
  if (total) console.log(`  ${(total / 1e9).toFixed(1)} GB comprimidos a baixar`);
  return Readable.fromWeb(res.body);
}

/**
 * Percorre um dump da Open Library linha a linha. Cada linha é um TSV de cinco
 * colunas e a quinta é o JSON do registro. Uma linha corrompida é pulada, não
 * derruba um import de horas.
 */
async function* records(filename, url, label) {
  const source = await openDump(filename, url);
  const lines = createInterface({
    input: source.pipe(createGunzip()),
    crlfDelay: Infinity,
  });

  let seen = 0, broken = 0;
  const started = Date.now();
  for await (const line of lines) {
    if (++seen > LIMIT) break;
    if (seen % 1_000_000 === 0) {
      const min = ((Date.now() - started) / 60000).toFixed(1);
      console.log(`  ${label}: ${(seen / 1e6).toFixed(0)}M linhas em ${min} min`);
    }
    const json = line.split("\t")[4];
    if (!json) { broken++; continue; }
    try {
      yield JSON.parse(json);
    } catch {
      broken++;
    }
  }
  console.log(`  ${label}: ${seen.toLocaleString("pt-BR")} linhas lidas, ${broken} ilegíveis`);
}

// ─────────────────────────────────────────────────────────── normalização

const FORMAT = {
  hardcover: "hardcover", "hardback": "hardcover", "capa dura": "hardcover",
  paperback: "paperback", "brochura": "paperback", "mass market paperback": "paperback",
  "trade paperback": "paperback", "pocket book": "paperback",
  ebook: "ebook", "e-book": "ebook", electronic: "ebook",
  audio: "audiobook", "audio cd": "audiobook", audiobook: "audiobook",
};

/** "May 2005", "2005-04", "2005" -> 2005. Um ano fora de 1450..agora+1 é lixo. */
export function year(publishDate) {
  const found = String(publishDate ?? "").match(/\b(1[45-9]\d{2}|20\d{2}|21\d{2})\b/);
  if (!found) return null;
  const n = Number(found[1]);
  const max = new Date().getFullYear() + 1;
  return n >= 1450 && n <= max ? n : null;
}

/** Só os dígitos, e só se o tamanho fechar. Um ISBN torto é pior que nenhum. */
export function isbn(list, size) {
  for (const raw of list ?? []) {
    const digits = String(raw).replace(/[^0-9Xx]/g, "").toUpperCase();
    if (digits.length === size) return digits;
  }
  return null;
}

/** Registro da Open Library -> a linha que a gente de fato guarda. */
export function edition(rec) {
  const title = (rec.title ?? "").trim();
  if (!title || title.length > 500) return null;

  /**
   * `works[0]`: uma edição pertence a UMA obra. A lista tem um item em 99,9% dos casos, e
   * não tem papéis — não existe "obra tradutora". A posição não escolhe nada aqui.
   * Ver AGENTS.md.
   */
  const workKey = rec.works?.[0]?.key ?? null;
  if (!workKey) return null; // uma edição sem obra não tem onde morar

  const covers = (rec.covers ?? []).filter((c) => typeof c === "number" && c > 0);
  const physical = String(rec.physical_format ?? "").toLowerCase().trim();

  return {
    ol_edition: rec.key,
    ol_work: workKey,
    /**
     * ═══ ESTA LINHA CUSTOU 47 MIL AUTORES ═══
     *
     * Ela era `rec.authors?.[0]?.key ?? null`, e `rec` é um registro de EDIÇÃO.
     *
     * O registro de edição em português QUASE NUNCA traz autor: a ligação obra→autor
     * mora no registro de OBRA, e este import nunca abriu o dump de obras. Resultado
     * medido: 43.739 obras sem autor nenhum (11,7% do acervo), e a busca por "Tolstói"
     * não achando Guerra e Paz — que o Gume TEM.
     *
     * E quando a edição TINHA autor, o `[0]` pegava o primeiro da lista, que em livro
     * traduzido costuma ser o TRADUTOR. Daí "A Morte de Ivan Ilitch" assinada por
     * Roberto Algarte e o Drácula da Martin Claret por "jaime arbe".
     *
     * O autor da edição fica aqui apenas como PISTA, e marcado como tal. Quem manda é
     * o dump de obras, e quem o lê é scripts/backfill-authors.mjs — que também desempata
     * o tradutor por frequência. Ver .github/ISSUE_DRAFTS/11 e lib/acervo.sql.test.ts,
     * o canário que quebra o build se o acervo voltar a perder autor.
     */
    /**
     * ═══ ELA FOI EMBORA, E NÃO FOI JUSTIFICADA ═══
     *
     * Esta linha era `ol_author: rec.authors?.[0]?.key ?? null` — e ela custou 47 mil
     * autores. Não é uma exceção defensável à regra "posição não é papel": é o pecado
     * que originou a regra.
     *
     * O registro de EDIÇÃO em português quase nunca traz autor, e quando traz, o
     * primeiro da lista costuma ser o TRADUTOR. A autoria mora no registro de OBRA.
     *
     * Escrever `null` aqui não perde nada: quem preenche o autor é o
     * `scripts/backfill-authors.mjs`, que lê o dump de OBRAS e desempata o tradutor por
     * frequência. Deixar a linha "com um comentário explicando" seria pior que
     * removê-la — seria transformar um bug conhecido num hábito tolerado.
     *
     * Ver AGENTS.md, e lib/acervo.sql.test.ts, o canário que quebra o build se o acervo
     * voltar a perder autor.
     */
    ol_author: null,
    title: rec.subtitle ? `${title}: ${String(rec.subtitle).trim()}` : title,
    isbn13: isbn(rec.isbn_13, 13),
    isbn10: isbn(rec.isbn_10, 10),
    /**
     * O IRMÃO DO MESMO BUG, e ele é benigno — mas vale saber por quê, para não
     * "consertá-lo" um dia e piorar.
     *
     * `publishers` é uma lista porque uma edição pode ser co-publicada ("Companhia das
     * Letras" + "Penguin"). Aqui o primeiro é o certo: a Open Library lista a editora
     * principal primeiro, e não existe o equivalente do tradutor — ninguém entra nessa
     * lista por ter passado perto do livro.
     *
     * A diferença com o `authors[0]` é essa: lá, o primeiro da lista podia ser QUEM NÃO
     * ESCREVEU O LIVRO. Aqui, não.
     */
    publisher: (rec.publishers?.[0] ?? "").trim() || null,
    published_year: year(rec.publish_date),
    page_count: Number.isInteger(rec.number_of_pages) && rec.number_of_pages > 0 && rec.number_of_pages < 20000
      ? rec.number_of_pages
      : null,
    format: FORMAT[physical] ?? "other",
    cover_url: covers.length ? `https://covers.openlibrary.org/b/id/${covers[0]}-L.jpg` : null,
  };
}

// ─────────────────────────────────────────────────────── estágio 1: filtrar

/** Escreve as edições em português num .jsonl e devolve as chaves de autor usadas. */
async function filterEditions() {
  if (existsSync(EDITIONS_JSONL) && !REFRESH) {
    console.log(`\n1. edições: reusando ${EDITIONS_JSONL} (--refresh para refazer)`);
    return authorKeysFrom(EDITIONS_JSONL);
  }

  console.log(`\n1. edições: filtrando o dump para language = por`);
  const out = createWriteStream(`${EDITIONS_JSONL}.partial`);
  const authorKeys = new Set();
  let kept = 0;

  for await (const rec of records("ol_dump_editions.txt.gz", EDITIONS_URL, "edições")) {
    if (!isPortuguese(rec)) continue;
    const row = edition(rec);
    if (!row) continue;
    if (row.ol_author) authorKeys.add(row.ol_author);
    kept++;
    if (!out.write(JSON.stringify(row) + "\n")) {
      await new Promise((r) => out.once("drain", r));
    }
  }

  await new Promise((r) => out.end(r));
  // Só promove o parcial a definitivo no fim: um Ctrl-C não deixa um cache meia-boca.
  const { rename } = await import("node:fs/promises");
  await rename(`${EDITIONS_JSONL}.partial`, EDITIONS_JSONL);

  console.log(`  ✓ ${kept.toLocaleString("pt-BR")} edições em português, ${authorKeys.size.toLocaleString("pt-BR")} autores citados`);
  return authorKeys;
}

/** Relê o .jsonl cacheado só para recuperar as chaves de autor. */
async function authorKeysFrom(file) {
  const keys = new Set();
  let n = 0;
  const lines = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line) continue;
    n++;
    const key = JSON.parse(line).ol_author;
    if (key) keys.add(key);
  }
  console.log(`  ${n.toLocaleString("pt-BR")} edições, ${keys.size.toLocaleString("pt-BR")} autores citados`);
  return keys;
}

// ──────────────────────────────────────────────────── estágio 2: os autores

/**
 * O dump de edições traz só a CHAVE do autor ("/authors/OL26320A"), nunca o
 * nome. O nome mora no dump de autores, que a gente varre uma vez guardando
 * apenas as chaves que as edições em português citaram.
 */
async function resolveAuthors(wanted) {
  if (existsSync(AUTHORS_JSONL) && !REFRESH) {
    console.log(`\n2. autores: reusando ${AUTHORS_JSONL}`);
    return;
  }
  if (!wanted.size) {
    console.log(`\n2. autores: nenhuma chave citada, pulando`);
    await new Promise((r) => createWriteStream(AUTHORS_JSONL).end(r));
    return;
  }

  console.log(`\n2. autores: resolvendo ${wanted.size.toLocaleString("pt-BR")} nomes`);
  const out = createWriteStream(`${AUTHORS_JSONL}.partial`);
  let found = 0;

  for await (const rec of records("ol_dump_authors.txt.gz", AUTHORS_URL, "autores")) {
    if (!wanted.has(rec.key)) continue;

    /**
     * O PORTÃO (lib/autores.ts). A Open Library guarda "Portugal.", "Brazil" e
     * "[author not identified]" no campo de autor, e sem isto eles entram como GENTE:
     * viram uma página de autor, uma linha na busca e um autor lido na estatística.
     *
     * Uma etiqueta é PIOR que um nulo. O nulo a gente conta, vê e conserta; a etiqueta
     * passa por pessoa em toda contagem — e foi ela que fez a poda achar que Madame
     * Bovary tinha autor.
     */
    const name = limparNomeDeAutor(rec.name ?? rec.personal_name ?? "");
    if (!name || name.length > 300) continue;

    found++;
    out.write(JSON.stringify({ ol_author: rec.key, name }) + "\n");
  }

  await new Promise((r) => out.end(r));
  const { rename } = await import("node:fs/promises");
  await rename(`${AUTHORS_JSONL}.partial`, AUTHORS_JSONL);
  console.log(`  ✓ ${found.toLocaleString("pt-BR")} de ${wanted.size.toLocaleString("pt-BR")} autores resolvidos`);
}

// ───────────────────────────────────────────────────── estágio 3: a carga

/**
 * Carrega os dois .jsonl numa tabela de staging e faz o upsert em conjuntos, no
 * SQL. Meio milhão de ida-e-volta linha a linha levaria horas; isto leva minutos.
 */
async function load(sql) {
  console.log(`\n3. carga: staging -> works/editions/authors/identifiers`);

  await sql`drop table if exists stage_ol`;
  await sql`
    create unlogged table stage_ol (
      -- o id sai daqui, e não do insert, para que os identifiers possam
      -- referenciar a edição sem precisar de um RETURNING que case de volta
      edition_id     uuid not null default gen_random_uuid(),
      ol_edition     text not null,
      ol_work        text not null,
      ol_author      text,
      author_name    text,
      title          text not null,
      isbn13         text,
      isbn10         text,
      publisher      text,
      published_year integer,
      page_count     integer,
      format         text not null default 'other',
      cover_url      text
    )`;

  // nomes de autor: chave -> nome, para colar na edição no caminho
  const names = new Map();
  if (existsSync(AUTHORS_JSONL)) {
    const lines = createInterface({ input: createReadStream(AUTHORS_JSONL), crlfDelay: Infinity });
    for await (const line of lines) {
      if (!line) continue;
      const a = JSON.parse(line);
      names.set(a.ol_author, a.name);
    }
  }

  // COPY é a única forma sã de empurrar centenas de milhares de linhas
  const copy = await sql`copy stage_ol (
    ol_edition, ol_work, ol_author, author_name, title, isbn13, isbn10,
    publisher, published_year, page_count, format, cover_url
  ) from stdin with (format csv)`.writable();

  const cell = (v) => (v === null || v === undefined ? "" : `"${String(v).replace(/"/g, '""')}"`);
  let staged = 0;
  const lines = createInterface({ input: createReadStream(EDITIONS_JSONL), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line) continue;
    const e = JSON.parse(line);
    const row = [
      e.ol_edition, e.ol_work, e.ol_author, e.ol_author ? names.get(e.ol_author) ?? null : null,
      e.title, e.isbn13, e.isbn10, e.publisher, e.published_year, e.page_count, e.format, e.cover_url,
    ].map(cell).join(",") + "\n";
    if (!copy.write(row)) await new Promise((r) => copy.once("drain", r));
    staged++;
  }
  await new Promise((r) => copy.end(r));
  console.log(`  ${staged.toLocaleString("pt-BR")} edições em staging`);

  // O dump repete ISBN entre edições; um ISBN só pode apontar para uma linha.
  await sql`
    delete from stage_ol s
    using stage_ol t
    where s.isbn13 is not null and s.isbn13 = t.isbn13 and s.ctid > t.ctid`;

  const before = await counts(sql);

  // ── autores. on conflict sem alvo cobre tanto o unique de nome quanto o de chave.
  await sql`
    insert into authors (name, openlibrary_key, slug)
    select distinct on (author_name)
           author_name,
           ol_author,
           -- o mesmo desenho de slug da migration 0016. Homônimo colide no unique
           -- e cai no "do nothing": o segundo Silva não sobrescreve o primeiro.
           trim(both '-' from regexp_replace(lower(immutable_unaccent(author_name)), '[^a-z0-9]+', '-', 'g'))
    from stage_ol
    where author_name is not null
    order by author_name, ol_author
    on conflict do nothing`;

  // ── obras. Primeiro adota: uma obra que já temos (o seed da estante) e que
  // bate em título + autor recebe a chave da OL, em vez de virar uma segunda cópia.
  await sql`
    update works w
    set openlibrary_key = s.ol_work
    from (
      select distinct on (lower(title), author_name) ol_work, title, author_name
      from stage_ol where author_name is not null
      order by lower(title), author_name, ol_work
    ) s
    join authors a on a.name = s.author_name
    where w.openlibrary_key is null
      and w.author_id = a.id
      and lower(w.title) = lower(s.title)
      and not exists (select 1 from works x where x.openlibrary_key = s.ol_work)`;

  // Depois insere as novas. Uma obra tem muitas edições, então uma linha por
  // ol_work, com o título mais curto (o mais curto costuma ser o título limpo,
  // sem "edição de bolso revista e ampliada" grudado).
  //
  // O slug espelha lib/slug.ts. Colisão não vira contador: vira a chave da OL,
  // que é única por construção e estável entre execuções, então reimportar não
  // renumera o endereço público de ninguém.
  await sql`
    with picked as (
      select distinct on (ol_work) ol_work, title, author_name
      from stage_ol
      order by ol_work, length(title), title
    ),
    resolved as (
      select p.ol_work, p.title, a.id as author_id,
             coalesce(nullif(trim(both '-' from regexp_replace(
               lower(unaccent(p.title || '-' || coalesce(p.author_name, ''))),
               '[^a-z0-9]+', '-', 'g')), ''), 'obra') as base,
             lower(replace(p.ol_work, '/works/', '')) as olid
      from picked p
      left join authors a on a.name = p.author_name
    ),
    ranked as (
      select *, row_number() over (partition by base order by ol_work) as rn
      from resolved
    )
    insert into works (slug, title, author_id, openlibrary_key)
    select
      case
        when rn = 1 and not exists (select 1 from works x where x.slug = r.base)
        then r.base
        else r.base || '-' || r.olid
      end,
      r.title, r.author_id, r.ol_work
    from ranked r
    on conflict do nothing`;

  // ── edições. Pula o que já está lá: pela chave da OL (em identifiers) ou pelo
  // ISBN. Sem isso, uma segunda execução duplicaria toda edição sem ISBN.
  await sql`
    insert into editions (id, work_id, isbn13, publisher, published_year, language, page_count, format, cover_url)
    select s.edition_id, w.id, s.isbn13, s.publisher, s.published_year, 'por',
           s.page_count, s.format::edition_format, s.cover_url
    from stage_ol s
    join works w on w.openlibrary_key = s.ol_work
    where not exists (
            select 1 from identifiers i
            where i.kind = 'openlibrary' and i.value = s.ol_edition)
      and (s.isbn13 is null
           or not exists (select 1 from editions e where e.isbn13 = s.isbn13))
    on conflict do nothing`;

  // ── identifiers. O join contra editions garante que só a edição que de fato
  // entrou ganha identificador (o id foi sorteado na staging, lembra).
  for (const [kind, column] of [["openlibrary", "ol_edition"], ["isbn13", "isbn13"], ["isbn10", "isbn10"]]) {
    await sql`
      insert into identifiers (edition_id, kind, value)
      select e.id, ${kind}::identifier_kind, s.${sql(column)}
      from stage_ol s
      join editions e on e.id = s.edition_id
      where s.${sql(column)} is not null
      on conflict do nothing`;
  }

  await sql`drop table stage_ol`;

  // Meia dúzia de linhas viram meio milhão: as estatísticas do planejador ficaram
  // velhas, e um planejador cego escolhe sequential scan onde havia índice. Sem
  // isto, a busca no catálogo fica lenta e ninguém entende por quê.
  console.log(`  atualizando as estatísticas do banco (analyze)`);
  await sql`analyze works`;
  await sql`analyze editions`;
  await sql`analyze authors`;
  await sql`analyze identifiers`;

  return { before, after: await counts(sql) };
}

async function counts(sql) {
  const [row] = await sql`
    select (select count(*) from works)   as works,
           (select count(*) from editions) as editions,
           (select count(*) from authors)  as authors,
           (select count(*) from identifiers) as identifiers,
           (select count(*) from editions where language = 'por') as por`;
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
}

// ─────────────────────────────────────────────────────────────────── main

async function main() {
  await mkdir(DUMP_DIR, { recursive: true });
  console.log(`Open Library -> Gume`);
  console.log(`dump fora do repo: ${DUMP_DIR}`);
  if (LIMIT !== Infinity) console.log(`--limit ${LIMIT.toLocaleString("pt-BR")} linhas`);

  const authorKeys = await filterEditions();
  await resolveAuthors(authorKeys);

  if (FILTER_ONLY) {
    console.log(`\n--filter-only: o banco não foi tocado.`);
    return;
  }

  if (!DATABASE_URL) throw new Error("DATABASE_URL não encontrado");
  const sql = postgres(DATABASE_URL, { max: 1 });
  const { before, after } = await load(sql);
  await sql.end();

  const grew = (k) => (after[k] - before[k]).toLocaleString("pt-BR");
  console.log(`\n✓ importado`);
  console.log(`  edições em português  +${grew("editions")}  (total ${after.por.toLocaleString("pt-BR")})`);
  console.log(`  obras                 +${grew("works")}  (total ${after.works.toLocaleString("pt-BR")})`);
  console.log(`  autores               +${grew("authors")}  (total ${after.authors.toLocaleString("pt-BR")})`);
  console.log(`  identificadores       +${grew("identifiers")}  (total ${after.identifiers.toLocaleString("pt-BR")})`);
}

// Só roda quando chamado direto. Um teste que importe as funções puras deste
// arquivo não pode disparar um download de 12 GB como efeito colateral.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

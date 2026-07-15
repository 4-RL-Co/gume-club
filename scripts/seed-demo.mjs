#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  SEED DE DEMONSTRAÇÃO. NUNCA RODE ISTO EM PRODUÇÃO.
 *
 *  Existe para uma coisa só: encher as telas com gente e livro de
 *  verdade, para que dê para julgar o desenho olhando conteúdo, e não
 *  container vazio. Cinco leitores fictícios, um feed, recomendações,
 *  estantes e um ano com livros terminados.
 *
 *    pnpm db:seed:demo                 cria (para o leitor mais antigo)
 *    pnpm db:seed:demo --para fulano   cria para um leitor específico
 *    pnpm db:seed:demo --undo          apaga, e apaga SÓ o que ele criou
 *
 *  O undo é preciso porque a criação grava cada id num manifesto fora
 *  do repo (demo-seed.json). Ele nunca sai apagando por adivinhação:
 *  não encosta na sua estante, nas suas estantes inventadas, nem em
 *  nenhuma linha que você mesmo escreveu.
 *
 *  Ele se recusa a rodar com NODE_ENV=production.
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

if (process.env.NODE_ENV === "production") {
  console.error("✗ seed de demonstração não roda em produção. Nunca.");
  process.exit(1);
}

const url =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const sql = postgres(url);
const UNDO = process.argv.includes("--undo");

/** O manifesto: tudo que este script criou, para poder desfazer com precisão. */
const MANIFEST = path.join(process.cwd(), ".demo-seed.json");
const UPLOADS = path.join(process.cwd(), "public", "uploads");

/** O e-mail marca o leitor de demonstração. Ninguém real vai ter este domínio. */
const DEMO_DOMAIN = "@demo.gume.local";

// ─────────────────────────────────────────────────────────────── desfazer

if (UNDO) {
  if (!existsSync(MANIFEST)) {
    console.log("nada para desfazer: não existe .demo-seed.json");
    await sql.end();
    process.exit(0);
  }

  const m = JSON.parse(readFileSync(MANIFEST, "utf8"));

  // Os leitores fictícios saem por cascata, e levam junto o que eles escreveram:
  // as atividades deles, os follows, as recomendações que eles mandaram.
  await sql`delete from users where email like ${"%" + DEMO_DOMAIN}`;

  // O que o script escreveu NA SUA conta sai por id, um a um. Nunca por chute.
  if (m.collections?.length) {
    await sql`delete from collections where id = any(${m.collections}::uuid[])`;
  }
  if (m.readings?.length) {
    await sql`delete from readings where id = any(${m.readings}::uuid[])`;
  }
  if (m.ratingsRestored?.length) {
    // uma nota SUA que já existia e que o script sobrescreveu volta ao valor de antes.
    // Apagá-la seria destruir um dado que não é da demonstração.
    for (const [userId, workId, value] of m.ratingsRestored) {
      await sql`update ratings set value = ${value}
                where user_id = ${userId}::uuid and work_id = ${workId}::uuid`;
    }
  }
  if (m.ratings?.length) {
    for (const [userId, workId] of m.ratings) {
      await sql`delete from ratings where user_id = ${userId}::uuid and work_id = ${workId}::uuid`;
    }
  }
  if (m.entriesRestored?.length) {
    // as linhas da estante que o script MUDOU voltam ao status anterior
    for (const [userId, workId, status] of m.entriesRestored) {
      await sql`update library_entries set status = ${status}::shelf_status
                where user_id = ${userId}::uuid and work_id = ${workId}::uuid`;
    }
  }
  if (m.entriesCreated?.length) {
    for (const [userId, workId] of m.entriesCreated) {
      await sql`delete from library_entries where user_id = ${userId}::uuid and work_id = ${workId}::uuid`;
    }
  }
  for (const f of m.avatars ?? []) {
    const p = path.join(UPLOADS, path.basename(f));
    if (existsSync(p)) rmSync(p);
  }

  rmSync(MANIFEST);
  console.log("✓ demonstração desfeita. Sua estante ficou como estava.");
  await sql.end();
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────── criar

/** Para quem. Sem --para, o leitor mais antigo (você). */
const paraIdx = process.argv.indexOf("--para");
const paraHandle = paraIdx > -1 ? process.argv[paraIdx + 1] : null;

const [me] = paraHandle
  ? await sql`select id, handle from users where handle = ${paraHandle} and deleted_at is null`
  : await sql`select id, handle from users where deleted_at is null order by created_at limit 1`;
if (!me) {
  console.error(paraHandle
    ? `✗ não achei o leitor @${paraHandle}.`
    : "✗ não há nenhum leitor real ainda. Crie a sua conta antes.");
  await sql.end();
  process.exit(1);
}

console.log(`Demonstração para @${me.handle}`);

const manifest = {
  collections: [],
  readings: [],
  ratings: [],
  ratingsRestored: [],
  entriesCreated: [],
  entriesRestored: [],
  avatars: [],
};

/**
 * Um avatar GERADO, não uma foto de banco de imagem. Iniciais em versalete sobre
 * um bloco de tinta de impressão, exatamente como o painel do autor: o mesmo
 * material do resto do produto, e nenhum rosto de gente que não existe.
 */
const INKS = ["#242422", "#2E2E2B", "#3A1E22", "#1F2C43", "#1E332B", "#4A3620"];

function avatar(name, i) {
  const initials = name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="${INKS[i % INKS.length]}"/>
  <text x="64" y="76" text-anchor="middle" fill="#F0ECE4" fill-opacity="0.62"
        font-family="Georgia,serif" font-size="42" letter-spacing="4">${initials}</text>
</svg>`;

  mkdirSync(UPLOADS, { recursive: true });
  const file = `demo-${i}-${Date.now()}.svg`;
  writeFileSync(path.join(UPLOADS, file), svg);
  manifest.avatars.push(file);
  return `/uploads/${file}`;
}

const PESSOAS = [
  { nome: "Clara Bastos", handle: "clarabastos", bio: "Leio devagar e releio muito. Sebo é meu vício." },
  { nome: "Rui Damasceno", handle: "ruidamasceno", bio: "Ensaio, história e uns romances quando o ano permite." },
  { nome: "Tereza Lins", handle: "terezalins", bio: "Terminei mais livros abandonados do que gosto de admitir." },
  { nome: "Iuri Prado", handle: "iuriprado", bio: "Ficção científica e filosofia, na mesma estante." },
  { nome: "Nina Alcântara", handle: "ninaalcantara", bio: "Poesia brasileira. E café." },
];

const leitores = [];
for (const [i, p] of PESSOAS.entries()) {
  const [u] = await sql`
    insert into users (handle, email, display_name, bio, image, email_verified)
    values (${p.handle}, ${p.handle + DEMO_DOMAIN}, ${p.nome}, ${p.bio}, ${avatar(p.nome, i)}, true)
    on conflict (handle) do update set display_name = excluded.display_name
    returning id, handle, display_name`;
  leitores.push(u);

  /**
   * Eu sigo TRÊS dos cinco, e não os cinco.
   *
   * Os dois que sobram existem para a tela Explorar ter o que mostrar: ela só
   * sugere estantes de quem você AINDA NÃO segue, então uma demonstração que
   * segue todo mundo deixa o coração daquela tela vazio e ninguém percebe que
   * ele existe. Uma demonstração que não exercita a tela não está demonstrando.
   */
  if (i < 3) {
    await sql`
      insert into follows (follower_id, followee_id, state)
      values (${me.id}, ${u.id}, 'accepted') on conflict do nothing`;
  }
}
console.log(`  ${leitores.length} leitores, e você segue 3 deles (os outros 2 são para o Explorar)`);

/**
 * Livros de verdade, do catálogo de verdade, mas que PARECEM livros.
 *
 * O catálogo tem 373 mil obras, e sortear no meio dele devolve anais de congresso
 * e relatório de ministério. Numa demonstração isso não é honestidade, é ruído:
 * a tela passa a ser julgada pelo título estranho, e não pelo desenho. Então:
 * tem capa, tem autor, e o título cabe numa linha.
 */
const livros = await sql`
  -- Primeiro, os livros que alguém de verdade já pôs numa estante: são os que o
  -- Gabriel curou, e são reconhecíveis. Sortear no meio das 373 mil obras do dump
  -- devolve anais de congresso e digitalização com acento quebrado, e aí a tela
  -- passa a ser julgada pelo título estranho em vez de pelo desenho.
  with curados as (
    select distinct w.id, w.title, w.slug, 0 as ordem
    from works w
    join library_entries le on le.work_id = w.id
    join users u on u.id = le.user_id
    where u.email not like ${"%" + DEMO_DOMAIN}
      and exists (select 1 from editions e where e.work_id = w.id and e.cover_url is not null)
  ),
  resto as (
    select w.id, w.title, w.slug, 1 as ordem
    from works w
    join authors a on a.id = w.author_id
    where exists (select 1 from editions e where e.work_id = w.id and e.cover_url is not null)
      and length(w.title) between 4 and 40
      and w.title !~ '[0-9]{4}'
      and w.title not like '%\ufffd%'   -- acento quebrado no dump
  )
  select id, title, slug from (
    select * from curados union all select * from resto
  ) t
  order by ordem, random()
  limit 48`;

if (livros.length < 12) {
  console.error("✗ o catálogo está vazio demais. Rode o import antes.");
  await sql.end();
  process.exit(1);
}

/**
 * Cada leitor de demonstração tem uma ESTANTE PÚBLICA de verdade.
 *
 * Sem isto eles são fantasmas: aparecem no feed dizendo que terminaram um livro,
 * e quem clica no nome cai numa estante vazia. A home deslogada também depende
 * disto, porque a dobra "quem já está por aqui" mostra estante de gente, e gente
 * sem estante não tem o que mostrar.
 */
const STATUS = ["read", "read", "read", "reading", "want_to_read", "want_to_read"];
let prateleirados = 0;

for (const [i, leitor] of leitores.entries()) {
  // Um livro a cada cinco, começando em posições diferentes: assim as cinco
  // estantes NÃO se sobrepõem. Uma janela deslizante (slice(i, i+6)) parecia
  // resolver e não resolvia: as janelas se cruzavam quase inteiras, e a home
  // mostrava três estantes com as mesmas capas, o que lê como tela falsa.
  const meus = livros.filter((_, idx) => idx % leitores.length === i).slice(0, 6);

  for (const [j, livro] of meus.entries()) {
    await sql`
      insert into library_entries (user_id, work_id, status, visibility)
      values (${leitor.id}, ${livro.id}, ${STATUS[j % STATUS.length]}::shelf_status, 'public')
      on conflict (user_id, work_id) do nothing`;
    prateleirados++;

    // quem terminou o livro tem uma opinião sobre ele, e ela é uma palavra
    if (STATUS[j % STATUS.length] === "read") {
      await sql`
        insert into ratings (user_id, work_id, value, visibility)
        values (${leitor.id}, ${livro.id}, ${3 + ((i + j) % 3)}, 'public')
        on conflict (user_id, work_id) do nothing`;
    }
  }
}
console.log(`  ${prateleirados} livros nas estantes deles`);

// ── o feed: 12 atividades de verdade, com verbos de verdade
const VERBOS = ["finished", "started", "rated", "reviewed", "shelved"];
let n = 0;
for (let i = 0; i < 12; i++) {
  const leitor = leitores[i % leitores.length];
  const livro = livros[i];
  const verbo = VERBOS[i % VERBOS.length];

  await sql`
    insert into activities (actor_id, verb, work_id, visibility, rating, note, created_at)
    values (
      ${leitor.id}, ${verbo}, ${livro.id}, 'public',
      ${verbo === "rated" ? 3 + (i % 3) : null},
      ${verbo === "reviewed" ? "Me pegou pelo avesso. Não era o livro que eu esperava, e ainda bem." : null},
      now() - (${i} || ' days')::interval
    )`;
  n++;
}
console.log(`  ${n} atividades no feed`);

/**
 * Resenhas PÚBLICAS. Sem elas, a seção de resenhas do Explorar nunca aparece, e a
 * tela mais importante do produto para quem chega sozinho fica pela metade.
 */
const RESENHAS = [
  "Comecei achando que era sobre guerra e terminei entendendo que era sobre medo. Reli o último capítulo três vezes, e ainda não sei se concordo com o final.",
  "Um livro que envelheceu bem demais, e isso é uma coisa ruim de dizer sobre ele. Devia ter envelhecido mal.",
  "Não é o livro dele que eu mais gosto, mas é o que eu mais empresto. Toda vez que empresto, não volta.",
];

for (const [i, texto] of RESENHAS.entries()) {
  const leitor = leitores[i % leitores.length];
  const livro = livros[i];

  const [r] = await sql`
    insert into reviews (user_id, work_id, body, visibility)
    values (${leitor.id}, ${livro.id}, ${texto}, 'public')
    on conflict (user_id, work_id) do nothing
    returning id`;

  if (r) {
    await sql`
      insert into activities (actor_id, verb, work_id, review_id, visibility, created_at)
      values (${leitor.id}, 'reviewed', ${livro.id}, ${r.id}, 'public', now() - (${i} || ' days')::interval)`;
  }
}
console.log(`  ${RESENHAS.length} resenhas públicas`);

// ── 3 recomendações que EU recebi, com a linha de por quê
const PORQUES = [
  "Você precisa ler isto antes de continuar o Machado.",
  "Curto, e te muda o ano inteiro. Confia.",
  "Lembrei de você na primeira página e não parei de lembrar.",
];
for (let i = 0; i < 3; i++) {
  const de = leitores[i];
  const livro = livros[12 + i];

  await sql`
    insert into recommendations (from_user_id, to_user_id, work_id, note)
    values (${de.id}, ${me.id}, ${livro.id}, ${PORQUES[i]})
    on conflict do nothing`;

  await sql`
    insert into activities (actor_id, verb, work_id, target_user_id, note, visibility)
    values (${de.id}, 'recommended', ${livro.id}, ${me.id}, ${PORQUES[i]}, 'public')`;

  // cai na minha estante, vindo de uma PESSOA
  const [nova] = await sql`
    insert into library_entries (user_id, work_id, status, recommended_by)
    values (${me.id}, ${livro.id}, 'want_to_read', ${de.id})
    on conflict (user_id, work_id) do nothing
    returning work_id`;
  if (nova) manifest.entriesCreated.push([me.id, livro.id]);
}
console.log(`  3 recomendações para você`);

// ── 2 estantes minhas, com livros dentro
for (const [slug, nome, quantos] of [
  ["para-reler", "Para reler", 4],
  ["herdadas-do-meu-pai", "Herdadas do meu pai", 3],
]) {
  const [c] = await sql`
    insert into collections (user_id, slug, name, visibility)
    values (${me.id}, ${slug}, ${nome}, 'public')
    on conflict (user_id, slug) do nothing
    returning id`;
  if (!c) continue;
  manifest.collections.push(c.id);

  const escolhidos = livros.slice(0, quantos);
  for (const l of escolhidos) {
    await sql`
      insert into collection_items (collection_id, work_id)
      values (${c.id}, ${l.id}) on conflict do nothing`;
  }
}
console.log(`  2 estantes suas`);

// ── 4 livros MEUS terminados este ano, com nota, para a tela do ano falar
const ano = new Date().getFullYear();
for (let i = 0; i < 4; i++) {
  const livro = livros[i];

  const [antes] = await sql`
    select status from library_entries where user_id = ${me.id} and work_id = ${livro.id}`;

  if (antes) {
    manifest.entriesRestored.push([me.id, livro.id, antes.status]);
    await sql`
      update library_entries set status = 'read'
      where user_id = ${me.id} and work_id = ${livro.id}`;
  } else {
    await sql`
      insert into library_entries (user_id, work_id, status)
      values (${me.id}, ${livro.id}, 'read')`;
    manifest.entriesCreated.push([me.id, livro.id]);
  }

  const [entry] = await sql`
    select id from library_entries where user_id = ${me.id} and work_id = ${livro.id}`;

  const [r] = await sql`
    insert into readings (entry_id, started_on, finished_on)
    values (
      ${entry.id},
      ${`${ano}-0${2 + i}-05`}::date,
      ${`${ano}-0${3 + i}-1${i}`}::date
    )
    returning id`;
  manifest.readings.push(r.id);

  // Se você já tinha dado nota a este livro, o valor antigo vai para o manifesto e
  // volta no --undo. A demonstração não tem o direito de apagar o que você achou.
  const [notaAntiga] = await sql`
    select value from ratings where user_id = ${me.id} and work_id = ${livro.id}`;

  await sql`
    insert into ratings (user_id, work_id, value)
    values (${me.id}, ${livro.id}, ${3 + (i % 3)})
    on conflict (user_id, work_id) do update set value = excluded.value`;

  if (notaAntiga) manifest.ratingsRestored.push([me.id, livro.id, notaAntiga.value]);
  else manifest.ratings.push([me.id, livro.id]);
}
console.log(`  4 livros terminados em ${ano}, com nota`);

/**
 * Os amigos dão nota a livros que estão na SUA estante.
 *
 * Sem esta parte, a média dos amigos não tem o que mostrar: cada leitor lia os
 * seus próprios livros, ninguém coincidia com ninguém, e a tela ficava vazia
 * justamente onde ela precisa provar que funciona. Um leitor de verdade coincide
 * com os amigos o tempo todo, e é disso que a estante fala.
 */
const meus = await sql`
  select w.id, w.title
  from library_entries le
  join works w on w.id = le.work_id
  where le.user_id = ${me.id}
    and exists (select 1 from editions e where e.work_id = w.id and e.cover_url is not null)
  order by random()
  limit 6`;

let notas = 0;
for (let i = 0; i < meus.length; i++) {
  const quantos = 2 + (i % 2); // dois ou três amigos por livro
  for (let j = 0; j < quantos; j++) {
    const leitor = leitores[(i + j) % leitores.length];
    const valor = 2 + ((i * 2 + j) % 4); // de "não gostei" a "adorei"

    const [nova] = await sql`
      insert into ratings (user_id, work_id, value, visibility)
      values (${leitor.id}, ${meus[i].id}, ${valor}, 'public')
      on conflict (user_id, work_id) do nothing
      returning work_id`;

    if (nova) {
      manifest.ratings.push([leitor.id, meus[i].id]);
      notas++;
    }
  }
}
console.log(`  ${notas} notas de amigos em livros da sua estante`);

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS SEMEADOS TÊM QUE SER GENTE COMPLETA.
 *
 *  Um perfil de demonstração com o nome e mais nada é pior que nenhum:
 *  ele mostra o app VAZIO, e um app vazio parece morto. Quem chega tem
 *  que ver o que o produto FAZ, e o produto faz bio, foto, resenha,
 *  correção de catálogo, insígnia e canal de contato.
 *
 *  E o DONO da instância também é gente: ele estava sem foto e sem bio,
 *  que é justamente o perfil que todo visitante abre primeiro.
 * ════════════════════════════════════════════════════════════════════
 */

// `me` é o dono da instância, resolvido lá em cima (o leitor mais antigo, ou --para).
const dono = me;

if (dono) {
  await sql`
    update users set
      bio = coalesce(bio, ${"Publicitário. Não sou programador, e mesmo assim isto aqui existe: leia o que falta, e conserte um livro."}),
      image = coalesce(image, ${avatar("Gabriel Olegário", 5)}),
      contact_kind = coalesce(contact_kind, 'instagram'),
      contact_value = coalesce(contact_value, ${"@" + dono.handle})
    where id = ${dono.id}`;

  /**
   * A INSÍGNIA DE IDEALIZADOR. Só uma pessoa no mundo pode ter, e o BANCO garante
   * (índice único parcial, migration 0024): não é uma promessa do código.
   *
   * Ela é ÚNICA em QUEM a tem, e nunca em como BRILHA: mesmo L, mesmo C, mesmo glow
   * e mesmo glifo de traço que as outras oito. A promessa nunca foi "todo mundo tem
   * as mesmas insígnias" (bibliotecário também não é de todo mundo): foi "nenhuma
   * vale mais que outra".
   */
  await sql`
    insert into badge_grants (user_id, badge, granted_by, reason)
    values (${dono.id}, 'idealizador', ${dono.id}, ${"imaginou o Gume, e escreveu a primeira linha"})
    on conflict do nothing`;

  // Bibliotecário: sem ele, a fila de capas não tem quem julgue, e metade do produto
  // (a curadoria) fica invisível para quem abre a demonstração.
  await sql`update users set librarian_tier = 1 where id = ${dono.id} and librarian_tier = 0`;

  console.log(`  @${dono.handle}: foto, bio, contato, insígnia de idealizador, bibliotecário`);
}

/** Todo mundo com canal de contato: sem ele, a cópia de papel não tem por onde falar. */
const CONTATOS = [
  ["clarabastos", "instagram", "@clarabastos"],
  ["ruidamasceno", "email", "rui@exemplo.org"],
  ["terezalins", "instagram", "@terezalins"],
  ["iuriprado", "telegram", "@iuriprado"],
  ["ninaalcantara", "instagram", "@ninaalcantara"],
];

for (const [handle, tipo, valor] of CONTATOS) {
  await sql`
    update users set contact_kind = ${tipo}, contact_value = ${valor}
     where handle = ${handle} and contact_value is null`;
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

console.log(`\n✓ demonstração pronta.`);
console.log(`  para apagar tudo: pnpm db:seed:demo --undo`);
console.log(`  o que foi criado está em .demo-seed.json`);

await sql.end();

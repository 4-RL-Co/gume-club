#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  O PERFIL MODELO. Um leitor de mentira, para olhar um perfil de verdade.
 *
 *  Diferente de seed-demo.mjs (cinco leitores rasos, pra alimentar feed e
 *  recomendação), este é UM leitor só, e ele é FUNDO: estante grande, notas
 *  espalhadas, resenhas, listas montadas — tudo que um perfil pode ter, num
 *  perfil só, pra dar pra julgar o desenho da tela inteira sem esperar a
 *  própria conta crescer.
 *
 *  Já semeou "uma coleção fechada e outra pela metade" (colecionismo, selo
 *  dourado de completa) — saiu junto com o colecionador, migration 0062.
 *
 *  ═══ E ELE RODA EM PRODUÇÃO, DE PROPÓSITO ═══
 *
 *  seed-demo.mjs se recusa a rodar em produção porque cria CINCO contas que
 *  seguem a sua e mexem no seu feed. Este cria UMA conta pública, rotulada
 *  como o resto do app rotula gente (@perfil.gume.demo, óbvio no e-mail e no
 *  handle), e não segue ninguém nem mexe em nada que já existe. O pedido era
 *  ver isto na tela de verdade, e a tela de verdade é a de produção.
 *
 *      node --experimental-strip-types scripts/seed-perfil-modelo.mjs
 *      node --experimental-strip-types scripts/seed-perfil-modelo.mjs --undo
 *
 *  IDEMPOTENTE: rodar de nvo só acrescenta o que ainda falta (mais livros,
 *  se o catálogo cresceu). Nunca duplica uma linha.
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const sql = postgres(url);
const UNDO = process.argv.includes("--undo");

const HANDLE = "perfil-modelo";
const EMAIL = `${HANDLE}@perfil.gume.demo`;
const NOME = "Perfil Modelo";
const BIO =
  "Esta conta existe só para mostrar como um perfil fica com uma estante de verdade dentro. " +
  "Não é uma pessoa — é uma referência.";

if (UNDO) {
  const [u] = await sql`select id from users where email = ${EMAIL}`;
  if (!u) {
    console.log("nada para desfazer: o perfil modelo não existe.");
    await sql.end();
    process.exit(0);
  }
  await sql`delete from users where id = ${u.id}`;
  console.log("✓ perfil modelo apagado, com cascata (estante, notas, resenhas, coleções).");
  await sql.end();
  process.exit(0);
}

const [pessoa] = await sql`
  insert into users (handle, email, display_name, bio, email_verified)
  values (${HANDLE}, ${EMAIL}, ${NOME}, ${BIO}, true)
  on conflict (handle) do update set display_name = excluded.display_name, bio = excluded.bio
  returning id, handle`;
console.log(`Perfil modelo: @${pessoa.handle}`);

/**
 * Livros de verdade, com capa e autor — a mesma régua de honestidade visual
 * de seed-demo.mjs: sortear nas 373 mil obras do dump traz relatório de
 * ministério, e uma vitrine julgada pelo título estranho não está mostrando
 * o desenho, está mostrando o ruído do catálogo.
 */
const livros = await sql`
  select w.id, w.title, w.slug
    from works w
    join authors a on a.id = w.author_id
   where exists (select 1 from editions e where e.work_id = w.id and e.cover_url is not null)
     and length(w.title) between 4 and 40
     and w.title !~ '[0-9]{4}'
     and w.title not like '%�%'
   order by random()
   limit 90`;

if (livros.length < 30) {
  console.error("✗ o catálogo está vazio demais. Rode o import antes.");
  await sql.end();
  process.exit(1);
}

/**
 * A ESTANTE. Grande de propósito — "bastante livro" foi o pedido — misturando
 * os três estados que existem de verdade: lido (a maioria, é gente que lê há
 * tempo), lendo (um punhado) e quero ler (o resto, a lista de desejo de todo
 * leitor de verdade).
 */
const FATIAS = { read: livros.slice(0, 55), reading: livros.slice(55, 60), want_to_read: livros.slice(60, 78) };
let prateleirados = 0;
for (const [status, lote] of Object.entries(FATIAS)) {
  for (const livro of lote) {
    await sql`
      insert into library_entries (user_id, work_id, status, visibility)
      values (${pessoa.id}, ${livro.id}, ${status}::shelf_status, 'public')
      on conflict (user_id, work_id) do nothing`;
    prateleirados++;
  }
}
console.log(`  ${prateleirados} livros na estante (lidos, lendo, e quero ler)`);

/**
 * NOTAS espalhadas pelas cinco palavras — e várias "adorei", porque é a
 * pergunta que abre o perfil ("o que eu adorei" vem antes da estante). Sem
 * isto a vitrine mais visível da tela fica vazia num perfil que devia estar
 * cheio.
 */
const lidos = FATIAS.read;
let notas = 0;
for (const [i, livro] of lidos.entries()) {
  // Um em cada quatro é "adorei" (5): o suficiente pra encher o carrossel sem
  // parecer que todo livro é perfeito, o que leria falso.
  const valor = i % 4 === 0 ? 5 : 2 + (i % 4);
  await sql`
    insert into ratings (user_id, work_id, value, visibility)
    values (${pessoa.id}, ${livro.id}, ${valor}, 'public')
    on conflict (user_id, work_id) do nothing`;
  notas++;
}
console.log(`  ${notas} notas, ${lidos.filter((_, i) => i % 4 === 0).length} delas "adorei"`);

/**
 * RESENHAS. Não são geradas na hora nem por um modelo: são texto escrito uma
 * vez, aqui, pra este fixture — a mesma régua de seed-demo.mjs. Um parágrafo
 * de verdade, e não "ótimo livro, recomendo".
 */
const RESENHAS = [
  "Levei três tentativas pra passar do primeiro capítulo, e na quarta não consegui largar até o fim. Livro que exige paciência no começo e devolve isso em dobro depois.",
  "Reli pela segunda vez este ano, e percebi coisas que a primeira leitura tinha deixado passar. Alguns livros mudam porque a gente muda, não porque eles mudaram.",
  "Não é o tipo de livro que eu costumo pegar, e foi bom sair do lugar comum. A metade final derruba tudo que a primeira metade constrói, de propósito.",
  "Comprei porque a capa era bonita e fiquei pelo texto. Tem parágrafo que eu parei pra reler em voz alta, sozinho, só pra ouvir como soava.",
  "Um livro pequeno que carrega mais do que o tamanho promete. Terminei e fiquei olhando pro teto por uns bons minutos.",
];
let resenhas = 0;
for (const [i, texto] of RESENHAS.entries()) {
  const livro = lidos[i * 3];
  if (!livro) break;
  const [r] = await sql`
    insert into reviews (user_id, work_id, body, visibility)
    values (${pessoa.id}, ${livro.id}, ${texto}, 'public')
    on conflict (user_id, work_id) do nothing
    returning id`;
  if (r) resenhas++;
}
console.log(`  ${resenhas} resenhas públicas`);

/**
 * DUAS LISTAS MONTADAS À MÃO (o que já era "coleções" antes de virar "listas"
 * — ver ai/DECISIONS.md), uma delas numerada.
 */
for (const [slug, nome, desc, numerada, quantos] of [
  ["os-que-me-formaram", "Os que me formaram", "Não em ordem de importância. Em ordem de quando li.", true, 6],
  ["pra-quando-bater-a-preguica", "Pra quando bater a preguiça", "Curtos, leves, e nenhum compromisso com profundidade.", false, 5],
]) {
  const [c] = await sql`
    insert into collections (user_id, slug, name, description, ranked, visibility)
    values (${pessoa.id}, ${slug}, ${nome}, ${desc}, ${numerada}, 'public')
    on conflict (user_id, slug) do update set name = excluded.name
    returning id`;
  const escolhidos = lidos.slice(20 + (numerada ? 0 : 6), 20 + (numerada ? 0 : 6) + quantos);
  for (const [pos, l] of escolhidos.entries()) {
    await sql`
      insert into collection_items (collection_id, work_id, position)
      values (${c.id}, ${l.id}, ${pos})
      on conflict (collection_id, work_id) do nothing`;
  }
}
console.log(`  2 listas montadas`);

console.log(`\n✓ pronto: gume.club/@${pessoa.handle}`);
await sql.end();
process.exit(0);

#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  O PERFIL MODELO GANHA UMA COLEÇÃO QUE NÃO É MANGÁ.
 *
 *  As duas coleções que @perfil-modelo mostrava (seed-perfil-modelo.mjs)
 *  vieram de uma escolha DINÂMICA por tamanho ("a menor" / "a média" entre
 *  os `colecoes` que já existiam) — e, na hora em que aquele script rodou,
 *  as únicas duas que existiam no catálogo eram mangá. O dono pediu pra
 *  provar que o recurso não é só pra mangá: "talvez ter a coleção de dosto
 *  da martin claret".
 *
 *  ═══ NÃO É DADO INVENTADO ═══
 *
 *  Os quatro romances e as edições Martin Claret já existem no catálogo de
 *  produção, importados de verdade (com ISBN real cada um) — não fabriquei
 *  nada. São, pela cronologia de publicação: Crime e Castigo (1866), O
 *  Idiota (1869), Os Demônios (1872), Os Irmãos Karamázov (1880).
 *
 *  Este script cria o CONJUNTO ("Dostoiévski — Martin Claret") do mesmo
 *  jeito que `lib/conjuntos.ts` (`ligarAoConjunto`) cria um na hora — mesma
 *  forma de `series`+`colecoes`, mesmo slug — e depois dá a @perfil-modelo
 *  os quatro volumes, fechando a coleção (igual ao trecho "COMPLETA" de
 *  seed-perfil-modelo.mjs).
 *
 *  Sem log de revisão: como o resto dos scripts de seed deste repo, isto é
 *  dado de bootstrap, não uma contribuição simulada de um usuário de
 *  verdade — a mesma régua de seed-perfil-modelo.mjs, que também insere
 *  direto sem passar pelas ações do app.
 *
 *  IDEMPOTENTE: rodar de novo não duplica (on conflict em todo insert).
 *
 *      DATABASE_URL=... node scripts/perfil-modelo-colecao-livro.mjs
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const sql = postgres(url);

const HANDLE = "perfil-modelo";
const TITULO = "Dostoiévski — Martin Claret";
const SLUG = "dostoievski-martin-claret";
const EDITORA = "Martin Claret";

/** work_id real do catálogo, e o ano de publicação original — é a régua de
    ordenação do "volume" (não é sequência narrativa, é cronologia). */
const VOLUMES = [
  { id: "26b132ad-a1f2-4769-8bfb-b190c7c8df76", titulo: "Crime e Castigo", ano: 1866 },
  { id: "a7f9f8c5-7ed6-4e51-96a5-9953c63ee0cb", titulo: "O Idiota", ano: 1869 },
  { id: "c6e80004-729e-451e-b497-a8189fe2a84b", titulo: "Os Demônios", ano: 1872 },
  { id: "82e3a619-9ef5-4dbb-bd2e-8444dc54cdf2", titulo: "Os Irmãos Karamázov", ano: 1880 },
];

const [pessoa] = await sql`select id, handle from users where handle = ${HANDLE}`;
if (!pessoa) {
  console.error(`✗ @${HANDLE} não existe — rode scripts/seed-perfil-modelo.mjs primeiro.`);
  await sql.end();
  process.exit(1);
}

// Confere que os quatro works são o que a gente espera, e que nenhum já
// pertence a outro conjunto — não queremos sequestrar um vínculo real.
const achados = await sql`
  select w.id, w.title, w.colecao_id
    from works w
   where w.id = any(${VOLUMES.map((v) => v.id)}::uuid[])`;

if (achados.length !== VOLUMES.length) {
  console.error(`✗ só achei ${achados.length} de ${VOLUMES.length} volumes esperados — o catálogo mudou?`);
  await sql.end();
  process.exit(1);
}
const jaLigado = achados.find((w) => w.colecao_id);
if (jaLigado) {
  console.error(`✗ "${jaLigado.title}" já pertence a outro conjunto (${jaLigado.colecao_id}) — abortando.`);
  await sql.end();
  process.exit(1);
}

await sql.begin(async (tx) => {
  const [serie] = await tx`
    insert into series (title, slug, kind, total_volumes)
    values (${TITULO}, ${SLUG}, 'series', null)
    on conflict (slug) do update set title = excluded.title
    returning id`;

  const [conjunto] = await tx`
    insert into colecoes (series_id, slug, title, publisher, total_volumes)
    values (${serie.id}, ${SLUG}, ${TITULO}, ${EDITORA}, null)
    on conflict (slug) do update
      set title = excluded.title, publisher = excluded.publisher
    returning id`;

  for (const [i, v] of VOLUMES.entries()) {
    await tx`
      update works set colecao_id = ${conjunto.id}, volume = ${String(i + 1)}
       where id = ${v.id}::uuid`;

    await tx`
      insert into owned_copies (user_id, work_id, state, visibility)
      values (${pessoa.id}, ${v.id}::uuid, 'owned', 'public')
      on conflict (user_id, work_id) do update set state = 'owned'`;

    console.log(`  ${i + 1}. ${v.titulo} (${v.ano}) — ligado e marcado como tido`);
  }

  console.log(`\n✓ "${TITULO}" criada e completa (${VOLUMES.length} de ${VOLUMES.length}) para @${pessoa.handle}`);
});

await sql.end();
process.exit(0);

#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  DOSTOIÉVSKI EXISTIA COMO DOIS AUTORES. UM SÓ AGORA.
 *
 *  O dono pediu para ligar o "Crime e Castigo" dele ao conjunto
 *  "Dostoiévski — Martin Claret" (criado por scripts/perfil-modelo-colecao-livro.mjs)
 *  — e o Crime e Castigo dele estava numa ficha DUPLICADA: o catálogo tinha
 *  "Fyodor Dostoyevsky" (10 obras, é quem já está no conjunto) E "Fiódor
 *  Dostoiévski" (5 obras) como duas pessoas diferentes. A mesma pessoa,
 *  grafada duas vezes, exatamente o bug do "Frankenstein" que
 *  lib/corrections.ts já documenta — só que desta vez em quatro títulos ao
 *  mesmo tempo: Crime e Castigo, O Idiota, Noites Brancas, Os Irmãos
 *  Karamázov.
 *
 *  O dono, direto: "pode fazer conserto desde que esteja correto... são
 *  edições diferentes de editora diferente, não pode sumir." Confirmado
 *  ANTES de rodar: fundirObras() nunca apaga edição — ela move TODAS as
 *  edições da ficha que sai para a que fica. As sete edições das quatro
 *  obras (Martin Claret, Todavia, Clube de Literatura Clássica, entre
 *  outras) sobrevivem inteiras, só reagrupadas.
 *
 *  ═══ A ORDEM IMPORTA ═══
 *
 *  Cada obra funde PRIMEIRO (fundirObras, para as fichas com o mesmo
 *  título pararem de colidir), e só DEPOIS os dois autores fundem
 *  (fundirAutores) — na mesma ordem que fundirAutores() já exige: ela
 *  recusa fundir dois autores que ainda têm o mesmo livro duas vezes.
 *
 *  "Fyodor Dostoyevsky" sobrevive (mais obras já ligadas: 10 contra 5, e é
 *  quem já está no conjunto) — "Fiódor Dostoiévski" vira apelido dele,
 *  buscável do mesmo jeito.
 *
 *  Isto também arruma a estante de @alexssander-affonso-da-silva (O Idiota,
 *  lendo; Noites Brancas, lido) — a mesma obra, e ela também estava
 *  fragmentada para ele.
 *
 *  Por fim: o Crime e Castigo do dono vira "tenho" (owned_copies), porque
 *  foi isso que ele pediu ("eu já tenho crime e castigo") — sem isso o
 *  conjunto mostraria "0 de 4" mesmo depois do conserto.
 *
 *  IDEMPOTENTE: cada passo confere o estado atual antes de agir.
 *
 *      DATABASE_URL=... node scripts/dostoievski-desduplicado.mjs
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const sql = postgres(url);

const HANDLE_DONO = "olegas4real";
const AUTOR_PARA = "6e25fac5-f3da-47d1-ad0a-efeba1b9fd96"; // Fyodor Dostoyevsky — sobrevive
const AUTOR_DE = "3d2486dd-8338-475d-987a-10fd9aee4c11"; // Fiódor Dostoiévski — vira apelido

/** [de, para, rótulo] — a que sai, a que fica, para o log. */
const OBRAS = [
  ["a7366b09-00cd-465e-a3a7-229463a1dca9", "26b132ad-a1f2-4769-8bfb-b190c7c8df76", "Crime e Castigo"],
  ["cc1dbb64-f888-4561-a417-2cbc22974f93", "a7f9f8c5-7ed6-4e51-96a5-9953c63ee0cb", "O idiota"],
  ["50293b18-5810-46a5-9c81-0a6f38f15054", "3c0d96ca-e4cf-4c1c-80f1-a2bc0c90d4f1", "Noites Brancas"],
  ["1fdb1dc0-e3e8-467b-bebb-db51f04f2d5e", "82e3a619-9ef5-4dbb-bd2e-8444dc54cdf2", "Os Irmãos Karamázov"],
];

const CRIME_E_CASTIGO = "26b132ad-a1f2-4769-8bfb-b190c7c8df76";

const [dono] = await sql`select id, handle from users where handle = ${HANDLE_DONO}`;
if (!dono) throw new Error(`usuário "${HANDLE_DONO}" não encontrado`);

async function fundirObra(tx, deId, paraId, rotulo) {
  const [de] = await tx`select id, slug from works where id = ${deId}`;
  if (!de) {
    console.log(`· ${rotulo}: já estava fundida, nada a fazer`);
    return;
  }

  for (const tabela of [
    "editions", "library_entries", "ratings", "reviews",
    "activities", "owned_copies", "recommendations", "collection_items",
    "autor_conhecido_nao_gravado",
  ]) {
    await tx`update ${tx(tabela)} set work_id = ${paraId} where work_id = ${deId}`;
  }

  await tx`
    insert into revisions (user_id, target_type, target_id, patch, previous, reason)
    values (
      ${dono.id}, 'work', ${paraId},
      ${sql.json({ fundidaCom: rotulo, edicoesMovidas: true })},
      ${sql.json({ slug: de.slug })},
      'duas fichas do mesmo livro: o autor existia grafado de duas formas (Fyodor Dostoyevsky / Fiódor Dostoiévski)'
    )`;

  await tx`delete from works where id = ${deId}`;
  console.log(`✓ ${rotulo}: fundida`);
}

await sql.begin(async (tx) => {
  for (const [de, para, rotulo] of OBRAS) {
    await fundirObra(tx, de, para, rotulo);
  }
});

// ── o autor, só depois de nenhuma obra colidir mais ─────────────────────
const [aindaDuplicado] = await sql`select id, name from authors where id = ${AUTOR_DE}`;
if (aindaDuplicado) {
  const [choque] = await sql`
    select exists (
      select 1 from works a join works b
        on b.title = a.title and coalesce(b.volume, -1) = coalesce(a.volume, -1)
      where a.author_id = ${AUTOR_DE} and b.author_id = ${AUTOR_PARA}
    ) as existe`;
  if (choque.existe) {
    throw new Error("ainda há obra duplicada entre os dois autores — a fusão de obras não terminou certo");
  }

  await sql.begin(async (tx) => {
    const [para] = await tx`select name from authors where id = ${AUTOR_PARA}`;

    await tx`update works  set author_id = ${AUTOR_PARA} where author_id = ${AUTOR_DE}`;
    await tx`update series set author_id = ${AUTOR_PARA} where author_id = ${AUTOR_DE}`;
    await tx`update series set illustrator_id = ${AUTOR_PARA} where illustrator_id = ${AUTOR_DE}`;

    await tx`
      update authors p
         set alt_names = (
           select array(
             select distinct x
               from unnest(coalesce(p.alt_names, '{}'::text[]) || coalesce(d.alt_names, '{}'::text[]) || array[d.name]) as x
              where x is not null and x <> '' and x <> p.name
           ))
        from authors d
       where p.id = ${AUTOR_PARA} and d.id = ${AUTOR_DE}`;

    await tx`
      insert into revisions (user_id, target_type, target_id, patch, previous, reason)
      values (
        ${dono.id}, 'author', ${AUTOR_PARA},
        ${sql.json({ fundidoCom: aindaDuplicado.name, livrosMovidos: true })},
        ${sql.json({ name: para.name })},
        'a mesma pessoa, grafada de duas formas: Fyodor Dostoyevsky (original) e Fiódor Dostoiévski (tradução)'
      )`;

    await tx`delete from authors where id = ${AUTOR_DE}`;
  });
  console.log('✓ os dois "Dostoiévski" viraram um autor só — "Fiódor Dostoiévski" agora é apelido buscável');
} else {
  console.log("· os autores já estavam fundidos, nada a fazer");
}

// ── o exemplar do dono ───────────────────────────────────────────────────
const [jaTem] = await sql`
  select id from owned_copies where user_id = ${dono.id} and work_id = ${CRIME_E_CASTIGO}`;
if (!jaTem) {
  await sql`
    insert into owned_copies (user_id, work_id, state)
    values (${dono.id}, ${CRIME_E_CASTIGO}, 'owned')`;
  console.log('✓ "Crime e Castigo" marcado como "tenho" para @' + dono.handle);
} else {
  console.log('· "Crime e Castigo" já estava marcado como "tenho"');
}

await sql.end();

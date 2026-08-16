#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  A LISTA "CALHAMAÇOS MARTIN CLARET", na conta de verdade do dono.
 *
 *  "Estou pensando em criar a coleção calhamaços martin claret... crie e já
 *  coloque os que eu tenho no meu perfil: guerra e paz, ana kariênina, conde
 *  de monte cristo, dom quixote, os miseráveis, divina comédia."
 *
 *  ═══ LISTA, E NÃO CONJUNTO ═══
 *
 *  Seis autores diferentes (Tolstói, Dumas, Cervantes, Hugo, Dante) não são
 *  uma coleção editorial — não formam UMA obra em volumes, como a Dostoiévski
 *  da Martin Claret. É um agrupamento por GOSTO, e é exatamente para isso
 *  que `collections` existe (ver lib/curation.ts, createCollection).
 *
 *  ═══ ANNA KARIÊNINA FICOU DE FORA ═══
 *
 *  Não está na estante do dono — nenhuma ficha. Os outros cinco pedidos
 *  estavam lá, como "quero ler" (nenhum possuído/lido ainda), e entram do
 *  jeito que já estão: confirmado com o dono antes de rodar.
 *
 *  ═══ E UM CONSERTO DE CATÁLOGO NO CAMINHO ═══
 *
 *  "Os miseráveis" existia DUAS vezes: uma com Victor Hugo (o autor de
 *  verdade), outra com um autor chamado, literalmente, "invalid author ID"
 *  — resíduo de um import que falhou e gravou a mensagem de erro como se
 *  fosse um nome. A ficha quebrada era a que estava na estante do dono (o
 *  único leitor dela). Fundida na ficha certa com a MESMA operação que o
 *  catálogo já usa para duas fichas do mesmo livro (fundirObras, em
 *  lib/corrections.ts) — reescrita aqui em SQL cru pelo mesmo motivo de
 *  scripts/perfil-modelo-colecao-livro.mjs: script de bootstrap, não uma
 *  correção simulada de leitor (por isso a revisão é gravada com o próprio
 *  dono como autor, e não com um "sistema" anônimo — ele é quem pediu, e é
 *  quem o app já trata como o único operador desta instância).
 *
 *  IDEMPOTENTE: rodar de novo não duplica (on conflict em todo insert; a
 *  fusão do "Os miseráveis" quebrado só roda se a ficha quebrada ainda
 *  existir).
 *
 *      DATABASE_URL=... node scripts/calhamacos-martin-claret.mjs
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const sql = postgres(url);

const HANDLE = "olegas4real";
const NOME_LISTA = "Calhamaços Martin Claret";
const SLUG_LISTA = "calhamacos-martin-claret";

const OS_MISERAVEIS_QUEBRADO = "4de9296f-0eac-4c7e-b753-2f6b51ccafb7";
const OS_MISERAVEIS_CERTO = "54462c2d-f16f-4bf6-b93b-56f754b61bfa";
const AUTOR_QUEBRADO = "ce7b6510-c9d5-4b61-9dc5-3e51e714bbce"; // "invalid author ID"

/** Na ordem que o dono pediu (Anna Kariênina fora: não está na estante). */
const VOLUMES = [
  { id: "0d65b35d-d5f6-4a91-a9d4-fdef31a845c1", titulo: "Guerra e paz" },
  { id: "68b4f6b6-4f07-4781-b523-8a3a5e5dc60f", titulo: "O conde de Monte Cristo" },
  { id: "828eeb82-2579-428e-a171-7f1b01accf25", titulo: "Dom Quixote" },
  { id: OS_MISERAVEIS_CERTO, titulo: "Os miseráveis" },
  { id: "2720ca7a-e45f-425d-8687-01e79eced566", titulo: "A Divina comédia" },
];

const [dono] = await sql`select id, handle from users where handle = ${HANDLE}`;
if (!dono) throw new Error(`usuário "${HANDLE}" não encontrado`);

// ── 1. o conserto: fundir o "Os miseráveis" quebrado no certo ──────────────
const [aindaQuebrado] = await sql`select id from works where id = ${OS_MISERAVEIS_QUEBRADO}`;

if (aindaQuebrado) {
  await sql.begin(async (tx) => {
    for (const tabela of [
      "editions", "library_entries", "ratings", "reviews",
      "activities", "owned_copies", "recommendations", "collection_items",
      "autor_conhecido_nao_gravado",
    ]) {
      await tx`update ${tx(tabela)} set work_id = ${OS_MISERAVEIS_CERTO} where work_id = ${OS_MISERAVEIS_QUEBRADO}`;
    }

    await tx`
      insert into revisions (user_id, target_type, target_id, patch, previous, reason)
      values (
        ${dono.id}, 'work', ${OS_MISERAVEIS_CERTO},
        ${sql.json({ fundidaCom: "Os miseráveis (autor quebrado)", edicoesMovidas: true })},
        ${sql.json({})},
        'duas fichas do mesmo livro: uma delas tinha um autor chamado literalmente "invalid author ID", resíduo de um import que falhou'
      )`;

    await tx`delete from works where id = ${OS_MISERAVEIS_QUEBRADO}`;
  });
  console.log('✓ "Os miseráveis" fundido — a ficha com o autor quebrado saiu');
} else {
  console.log('· "Os miseráveis" já estava fundido, nada a fazer');
}

// A ficha de autor "invalid author ID" só sai se ninguém mais a usa — ela
// era exclusiva da obra quebrada, mas a checagem é feita de novo aqui, e
// não suposta, porque um script idempotente não pode confiar no que já
// verificou numa execução anterior.
const [aindaEmUso] = await sql`select count(*)::int as n from works where author_id = ${AUTOR_QUEBRADO}`;
if (aindaEmUso.n === 0) {
  await sql`delete from authors where id = ${AUTOR_QUEBRADO}`;
  console.log('✓ a ficha de autor "invalid author ID" (órfã) saiu do catálogo');
}

// ── 2. a lista ───────────────────────────────────────────────────────────
// Mesmo slug, mesma pessoa: se este script já rodou antes, a linha já existe
// e é a nossa mesma lista — não um slug tomado por outra coisa.
const [criada] = await sql`
  insert into collections (user_id, slug, name, visibility)
  values (${dono.id}, ${SLUG_LISTA}, ${NOME_LISTA}, 'public')
  on conflict (user_id, slug) do nothing
  returning id`;
const colecaoId = criada
  ? criada.id
  : (await sql`select id from collections where user_id = ${dono.id} and slug = ${SLUG_LISTA}`)[0]?.id;
if (!colecaoId) throw new Error("não consegui criar nem achar a lista");

for (let i = 0; i < VOLUMES.length; i++) {
  await sql`
    insert into collection_items (collection_id, work_id, position)
    values (${colecaoId}, ${VOLUMES[i].id}, ${i})
    on conflict (collection_id, work_id) do update set position = excluded.position`;
}

console.log(`✓ lista "${NOME_LISTA}" (${colecaoId}) com ${VOLUMES.length} livros:`);
for (const v of VOLUMES) console.log(`  - ${v.titulo}`);

await sql.end();

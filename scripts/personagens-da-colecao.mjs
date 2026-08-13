#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  O PERSONAGEM MAIS IMPORTANTE, EM VEZ DO LOGO. A imagem da coleção troca de cara.
 *
 *  "Os logos que estão aí são feios." O dono pediu foto de alta qualidade e boa
 *  visibilidade pra representar cada coleção de mangá — o personagem principal
 *  da série, não o logotipo dela. Este script troca `colecoes.emblema_url` pela
 *  imagem do protagonista mais favoritado na AniList, para todo conjunto ligado
 *  a uma série com `anilist_id` — e SOBRESCREVE o que já estava lá, de propósito:
 *  não é preencher o vazio, é substituir o feio.
 *
 *  ═══ POR REFERÊNCIA, NUNCA UMA CÓPIA ═══
 *
 *  Grava o ENDEREÇO da imagem, e nunca o arquivo — a mesma política de toda
 *  imagem deste app. `s4.anilist.co` já está na lista de origens aceitas
 *  (lib/imagens.ts), então não precisa mexer nela.
 *
 *      node --experimental-strip-types scripts/personagens-da-colecao.mjs [--so-vazios]
 *
 *  IDEMPOTENTE: rodar de novo busca a mesma imagem (a AniList não muda o
 *  personagem mais favoritado de uma obra de um dia para o outro) e regrava o
 *  mesmo valor. `--so-vazios` restringe a coleções sem emblema nenhum ainda,
 *  para quem quiser só completar em vez de substituir.
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

// lib/db/index.ts importa ./schema sem extensão, e o Node com
// --experimental-strip-types não resolve isso fora do bundler do Next — por
// isso este script fala com o banco por `postgres` cru, como seed-demo.mjs e
// os outros scripts de linha de comando já fazem. Só lib/anilist.ts (puro,
// sem import de banco) é reaproveitado da casa.
const url =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const sql = postgres(url);
const { personagensDasSeries, AniListRecusou } = await import("../lib/anilist.ts");

const SO_VAZIOS = process.argv.includes("--so-vazios");

const colecoes = SO_VAZIOS
  ? await sql`
      select c.id, c.title, s.anilist_id
        from colecoes c
        join series s on s.id = c.series_id
       where s.anilist_id is not null and c.emblema_url is null
       order by c.title asc`
  : await sql`
      select c.id, c.title, s.anilist_id
        from colecoes c
        join series s on s.id = c.series_id
       where s.anilist_id is not null
       order by c.title asc`;

console.log(`${colecoes.length} coleções de mangá ligadas à AniList.`);
if (colecoes.length === 0) {
  await sql.end();
  process.exit(0);
}

const porAnilistId = new Map();
for (const c of colecoes) {
  const lista = porAnilistId.get(c.anilist_id) ?? [];
  lista.push(c);
  porAnilistId.set(c.anilist_id, lista);
}
const ids = [...porAnilistId.keys()];

let personagens;
try {
  personagens = await personagensDasSeries(ids);
} catch (e) {
  if (e instanceof AniListRecusou) {
    console.error(`A AniList recusou: ${e.message}`);
    await sql.end();
    process.exit(1);
  }
  throw e;
}

let trocados = 0;
let semPersonagem = [];

for (const [anilistId, lista] of porAnilistId) {
  const imagem = personagens.get(anilistId);
  if (!imagem) {
    semPersonagem.push(lista[0].title);
    continue;
  }
  for (const c of lista) {
    await sql`update colecoes set emblema_url = ${imagem} where id = ${c.id}`;
    trocados++;
  }
}

console.log(`\n${trocados} coleções trocaram de imagem.`);
if (semPersonagem.length > 0) {
  console.log(`\nSem personagem principal na AniList (${semPersonagem.length}):`);
  for (const t of semPersonagem) console.log(`  - ${t}`);
}
await sql.end();
process.exit(0);

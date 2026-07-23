#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  AS DESCRIÇÕES DE AUTOR DA CASA, escritas à mão, entram no acervo.
 *
 *  Lê seed/autores-descricoes.csv (slug, nome, pais, descricao) e grava a
 *  bio de cada autor com `bio_source = 'gume'` (a fonte da casa, ver
 *  lib/licenca.ts). Substitui o que houver: as bios que existiam eram
 *  tocos do Wikidata ("escritor brasileiro (1839–1908)"), e um parágrafo
 *  escrito por gente ganha do toco sempre.
 *
 *  O casamento, na ordem da desconfiança:
 *   1. pelo SLUG, quando o CSV o conhece (exato);
 *   2. pelo NOME inteiro, sem acento e sem caixa;
 *   3. pelo nome como PREFIXO ("Miguel de Cervantes" acha "Miguel de
 *      Cervantes Saavedra"), desempatado por quem tem mais obras — e só
 *      quando existe UM candidato assim; ambiguidade não entra no chute.
 *
 *  O `pais` do CSV NÃO toca `nationality`: aquele campo usa o adjetivo
 *  ("Brasileira"), tem teste de variante (lib/paises.sql.test.ts), e
 *  misturar "Brasil" ali criaria exatamente o que o teste caça.
 *
 *  Idempotente: rodar duas vezes grava o mesmo texto duas vezes. Rodar
 *  contra a produção é o uso esperado:
 *
 *      DATABASE_URL=<a do Railway> node scripts/aplicar-descricoes-de-autor.mjs
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync, existsSync } from "node:fs";
import postgres from "postgres";

if (existsSync(".env")) {
  for (const linha of readFileSync(".env", "utf8").split("\n")) {
    const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não encontrado");
const sql = postgres(process.env.DATABASE_URL);

/** O mesmo parser de CSV da operação mais capas: vírgula dentro de aspas não separa. */
function parseCsv(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  const parse = (l) => {
    const campos = []; let atual = ""; let dentro = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (dentro) {
        if (c === '"' && l[i + 1] === '"') { atual += '"'; i++; }
        else if (c === '"') dentro = false;
        else atual += c;
      } else if (c === '"') dentro = true;
      else if (c === ",") { campos.push(atual); atual = ""; }
      else atual += c;
    }
    campos.push(atual);
    return campos;
  };
  const cab = parse(linhas[0]);
  return linhas.slice(1).map((l) => {
    const v = parse(l);
    return Object.fromEntries(cab.map((c, i) => [c, (v[i] ?? "").trim()]));
  });
}

const autores = parseCsv(readFileSync("seed/autores-descricoes.csv", "utf8"));
let gravados = 0, sobrescritos = 0;
const naoAchados = [], ambiguos = [];

for (const a of autores) {
  if (!a.descricao) continue;

  let alvo = null;
  if (a.slug) {
    [alvo] = await sql`select id, bio from authors where slug = ${a.slug} limit 1`;
  }
  if (!alvo) {
    [alvo] = await sql`
      select id, bio from authors
       where immutable_unaccent(lower(name)) = immutable_unaccent(lower(${a.nome}))
       limit 1`;
  }
  if (!alvo) {
    const candidatos = await sql`
      select a.id, a.bio, count(w.id)::int as obras
        from authors a
        left join works w on w.author_id = a.id
       where immutable_unaccent(lower(a.name)) like immutable_unaccent(lower(${a.nome})) || ' %'
       group by a.id, a.bio
       order by count(w.id) desc
       limit 2`;
    if (candidatos.length === 1) alvo = candidatos[0];
    else if (candidatos.length > 1) { ambiguos.push(a.nome); continue; }
  }
  if (!alvo) { naoAchados.push(a.nome); continue; }

  if (alvo.bio && alvo.bio.trim()) sobrescritos++;
  await sql`update authors set bio = ${a.descricao}, bio_source = 'gume' where id = ${alvo.id}::uuid`;
  gravados++;
}

console.log(`gravados: ${gravados}/${autores.length}  (${sobrescritos} tinham bio antiga, substituída)`);
if (naoAchados.length) console.log("não achados:", naoAchados.join(", "));
if (ambiguos.length) console.log("ambíguos (não tocados):", ambiguos.join(", "));
await sql.end();

#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  OPERAÇÃO MAIS CAPAS. A planilha de pesquisa vira catálogo.
 *
 *  Lê `seed/operacao-mais-capas.csv`
 *  (categoria, ordem, isbn, titulo, autor, editora, cover_url, origem_url) e:
 *
 *   - H1 EDITORA (completa: ISBN + capa exata): cria ou casa cada edição pelo
 *     ISBN. A capa entra POR REFERÊNCIA (o endereço da CDN da editora, agora nas
 *     origens aceitas de lib/imagens.ts), nunca como cópia.
 *
 *   - AS LISTAS (Clube de Literatura Clássica, Bravo, Jabuti, etc.: só título e
 *     autor): cada livro passa pelo `enriquecer()` da casa, que busca editora,
 *     ano, páginas, ISBN e capa no Google Books e na Open Library com a
 *     desconfiança de sempre (na dúvida, não preenche: capa errada é pior que
 *     capa nenhuma). O que o CSV afirma vence o que a máquina achou.
 *
 *  ═══ POR QUE ELE IMPORTA AS FUNÇÕES DO APP, E NÃO REIMPLEMENTA ═══
 *
 *  `findOrCreateWork` é quem sabe casar sem duplicar (ISBN-13 encerra a conversa,
 *  ISBN-10 depois, título+autor por último) e é quem passa pelo portão de autores
 *  (lib/autores.ts): um script que escrevesse `authors` por fora estaria recriando
 *  o bug que o portão existe para impedir. Rodar com:
 *
 *      node --experimental-strip-types scripts/operacao-mais-capas.mjs [--so-h1]
 *
 *  IDEMPOTENTE: rodar duas vezes não duplica nada (é o mesmo casamento do
 *  importador). Campos já preenchidos nunca são sobrescritos: só o vazio recebe.
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

// O .env primeiro, porque lib/db lê DATABASE_URL no import.
if (existsSync(".env")) {
  for (const linha of readFileSync(".env", "utf8").split("\n")) {
    const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não encontrado");

const { findOrCreateWork } = await import("../lib/library.ts");
const { enriquecer } = await import("../lib/catalog.ts");
const { db } = await import("../lib/db/index.ts");
const { sql } = await import("drizzle-orm");

const SO_H1 = process.argv.includes("--so-h1");
// A planilha da pesquisa mora em seed/: ela é dado de catálogo, e o material
// bruto da operação (imagens, rascunhos) não entra no repositório.
const CSV = "seed/operacao-mais-capas.csv";

/** Um parser de CSV pequeno e correto para aspas: vírgula dentro de aspas não separa. */
function parseCsv(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  const parse = (l) => {
    const campos = [];
    let atual = "";
    let dentro = false;
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

/** Preenche SÓ o que está vazio na edição. O que alguém já escreveu, fica. */
async function preencherVazios(editionId, dados) {
  if (!editionId) return;
  await db.execute(sql`
    update editions
       set publisher      = coalesce(publisher, ${dados.publisher ?? null}),
           published_year = coalesce(published_year, ${dados.publishedYear ?? null}),
           page_count     = coalesce(page_count, ${dados.pageCount ?? null}),
           cover_url      = coalesce(cover_url, ${dados.coverUrl ?? null})
     where id = ${editionId}::uuid`);
}

const linhas = parseCsv(readFileSync(CSV, "utf8"));
const relatorio = { criados: [], casados: [], enriquecidos: 0, semFicha: [], falhas: [] };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

let n = 0;
for (const linha of linhas) {
  const h1 = linha.categoria === "H1 Editora";
  if (SO_H1 && !h1) continue;
  n++;

  const titulo = linha.titulo;
  const autor = linha.autor || null;
  try {
    let dados = {
      title: titulo,
      author: autor,
      publisher: linha.editora || null,
      isbn13: linha.isbn && linha.isbn.length === 13 ? linha.isbn : null,
      isbn10: linha.isbn && linha.isbn.length === 10 ? linha.isbn : null,
      coverUrl: linha.cover_url || null,
      // Curadoria de gente grande, não cadastro às cegas: a ficha não espera revisão.
      needsReview: false,
    };

    // Sem ISBN e sem capa: a máquina completa, com a desconfiança da casa.
    if (!dados.isbn13 && !dados.coverUrl) {
      const extra = await enriquecer(titulo, autor, null);
      if (extra) {
        relatorio.enriquecidos++;
        dados = {
          ...dados,
          // O que o CSV AFIRMA vence; o vazio recebe o que a máquina achou.
          publisher: dados.publisher ?? extra.publisher ?? null,
          isbn13: extra.isbn13 ?? null,
          publishedYear: extra.publishedYear ?? null,
          pageCount: extra.pageCount ?? null,
          coverUrl: extra.coverUrl ?? null,
          firstPublished: extra.firstPublished ?? null,
        };
      }
      await pausa(250); // educação com o Google Books e a Open Library
    }

    const r = await findOrCreateWork(dados);
    await preencherVazios(r.editionId, dados);

    const rotulo = `${titulo}${autor ? ` (${autor})` : ""}`;
    if (r.como === "criado") relatorio.criados.push(`${linha.categoria} · ${rotulo}`);
    else relatorio.casados.push(`${linha.categoria} · ${rotulo} [${r.como}]`);
    if (!dados.coverUrl && !dados.isbn13) relatorio.semFicha.push(`${linha.categoria} · ${rotulo}`);
  } catch (e) {
    relatorio.falhas.push(`${linha.categoria} · ${titulo}: ${e?.message ?? e}`);
  }

  if (n % 20 === 0) console.log(`  … ${n} linhas (${relatorio.criados.length} criados, ${relatorio.casados.length} já existiam)`);
}

const resumo = [
  `# Operação mais capas — relatório`,
  ``,
  `Linhas processadas: ${n}`,
  `Criados: ${relatorio.criados.length}`,
  `Já existiam (casados sem duplicar): ${relatorio.casados.length}`,
  `Enriquecidos pela máquina: ${relatorio.enriquecidos}`,
  `Sem ISBN e sem capa mesmo depois da busca (conferir à mão): ${relatorio.semFicha.length}`,
  `Falhas: ${relatorio.falhas.length}`,
  ``,
  `## Criados`, ...relatorio.criados.map((x) => `- ${x}`),
  ``,
  `## Sem ficha completa (conferir à mão)`, ...relatorio.semFicha.map((x) => `- ${x}`),
  ``,
  `## Falhas`, ...relatorio.falhas.map((x) => `- ${x}`),
].join("\n");

writeFileSync("/tmp/operacao-mais-capas-relatorio.md", resumo);
console.log(resumo.split("\n").slice(0, 8).join("\n"));
console.log(`\nRelatório completo em /tmp/operacao-mais-capas-relatorio.md`);
process.exit(0);

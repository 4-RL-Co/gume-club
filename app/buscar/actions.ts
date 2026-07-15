"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { LIMITS, clamp, clampRequired } from "@/lib/limits";
import {
  findOrCreateWork, hitToWork, shelve, setProvenance,
  isStatus, type Status,
} from "@/lib/library";
import { searchAll, enriquecer, type Hit } from "@/lib/catalog";

/**
 * Adding a book, in one tap. The result carries the ids back so the page can
 * follow up with the provenance invitation without a second lookup.
 */
export type Added = { workId: string; editionId: string | null; title: string };

export async function addFromSearch(hit: Hit, status: Status): Promise<Added> {
  const actor = await getActor();
  if (!isStatus(status)) throw new Error("status inválido");

  const { workId, editionId } = await findOrCreateWork(hitToWork(hit));
  await shelve(actor, workId, status);

  revalidatePath("/");
  revalidatePath("/estante");
  return { workId, editionId, title: hit.title };
}

/**
 * The optional second question. An invitation, not a form: if the reader ignores
 * it, the book is already on the shelf and nothing is lost.
 */
export async function answerProvenance(
  workId: string,
  editionId: string | null,
  note: string,
): Promise<void> {
  const actor = await getActor();
  await setProvenance(actor, workId, editionId, note);
  revalidatePath("/");
  revalidatePath("/estante");
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  NINGUÉM TINHA O LIVRO. E isso vai acontecer TODO DIA.
 *
 *  O acervo do Gume é escolhido a mão — 300 autores —, e o dia em que ele
 *  deixou de ser meio milhão de fichas foi o dia em que esta tela virou
 *  crítica. Procurar um livro que o Gume não tem deixou de ser a exceção.
 *
 *  ═══ DUAS PERGUNTAS, E NÃO NOVE ═══
 *
 *  Isto pedia título, autor, editora, ISBN, ano da edição, ano da obra,
 *  páginas, formato e endereço da capa. Nove campos, e a única coisa que a
 *  pessoa queria era registrar que leu um livro.
 *
 *  Um formulário de nove campos, no fim de uma busca que já falhou, é um
 *  formulário que ninguém preenche. E quem não preenche não fica sem o
 *  livro: fica sem o app.
 *
 *  Agora são dois campos — TÍTULO e AUTOR — e o resto é trabalho de máquina.
 *  O `enriquecer()` (lib/catalog.ts) vai ao Google Books e à Open Library
 *  buscar editora, ano, páginas, ISBN e capa. Ele é desconfiado de propósito:
 *  na dúvida não preenche, porque a capa errada na estante de alguém é pior
 *  que capa nenhuma.
 *
 *  O que o leitor digitou SEMPRE ganha do que a máquina achou. Ele estava com
 *  o livro na mão; a máquina estava adivinhando.
 *
 *  E o livro entra NA HORA, com `needs_review`. Ninguém espera aprovação de
 *  ninguém para ter o próprio livro na própria estante.
 * ════════════════════════════════════════════════════════════════════
 */
export async function addByHand(form: {
  title: string;
  author: string;
  status: Status;
  /** Os opcionais. Ficam atrás de um "mais detalhes" que quase ninguém vai abrir. */
  publisher?: string;
  isbn?: string;
  year?: string;
  pageCount?: string;
}): Promise<Added> {
  const actor = await getActor();

  const title = clampRequired(form.title, LIMITS.title);
  if (!title) throw new Error("um livro precisa de um título");
  if (!isStatus(form.status)) throw new Error("status inválido");

  const author = clamp(form.author, LIMITS.author);

  const digits = (form.isbn ?? "").replace(/[^0-9X]/gi, "");
  const ano = Number(form.year);
  const paginas = Number(form.pageCount);

  const digitado = {
    isbn13: digits.length === 13 ? digits : null,
    isbn10: digits.length === 10 ? digits : null,
    publisher: clamp(form.publisher ?? "", LIMITS.publisher),
    publishedYear: Number.isInteger(ano) && ano > 1450 ? ano : null,
    pageCount: Number.isInteger(paginas) && paginas > 0 ? paginas : null,
  };

  // A máquina vai atrás do resto. Se ela não achar com confiança, devolve null, e o
  // livro entra com o que a pessoa deu — que já basta.
  const achado = await enriquecer(title, author);

  const { workId, editionId } = await findOrCreateWork({
    title,
    author,
    // O DIGITADO GANHA, sempre. Quem cadastrou estava com o livro na mão; o Google
    // estava adivinhando a partir de um título parecido.
    isbn13: digitado.isbn13 ?? achado?.isbn13 ?? null,
    isbn10: digitado.isbn10 ?? achado?.isbn10 ?? null,
    publisher: digitado.publisher ?? achado?.publisher ?? null,
    publishedYear: digitado.publishedYear ?? achado?.publishedYear ?? null,
    pageCount: digitado.pageCount ?? achado?.pageCount ?? null,
    // O ano da OBRA ninguém digita, e é dele que a página de estatísticas vive.
    firstPublished: achado?.firstPublished ?? null,
    coverUrl: achado?.coverUrl ?? null,
    needsReview: true, // é um livro de verdade na estante enquanto isso, e não um de segunda
  });

  await shelve(actor, workId, form.status);
  revalidatePath("/");
  revalidatePath("/estante");
  return { workId, editionId, title };
}

/**
 * Colar uma lista.
 *
 * Os seus amigos têm planilha, não têm arquivo de exportação. Eles têm um bloco de
 * notas com quarenta títulos, um por linha, e até hoje a única forma de trazer isso
 * para cá era digitar quarenta buscas. Agora é um "cole aqui".
 *
 * O casamento é UMA linha, UM livro, e o app mostra o que achou ANTES de escrever
 * qualquer coisa na sua estante: casar título em texto livre erra, e um erro que
 * entra sozinho na estante é um erro que ninguém percebe por dois anos. Você
 * confere e você confirma.
 *
 * "Título — Autor" e "Título - Autor" também funcionam, porque é assim que as
 * pessoas de verdade escrevem as listas delas.
 */
export type Match = { line: string; hit: Hit | null };

export async function matchList(text: string): Promise<Match[]> {
  await getActor();

  const lines = String(text ?? "")
    .split("\n")
    .map((l) => l.trim().slice(0, LIMITS.listLine))
    .filter(Boolean)
    .slice(0, LIMITS.listLines);

  const out: Match[] = [];
  for (const line of lines) {
    // uma busca boa é o título; o autor depois do travessão só atrapalha o trigrama
    const query = line.split(/\s+[—–-]\s+/)[0]?.trim() || line;
    const hits = await searchAll(query);
    out.push({ line, hit: hits[0] ?? null });
  }
  return out;
}

/** Põe na estante o que você conferiu, e devolve quantos entraram. */
export async function addMany(hits: Hit[], status: Status): Promise<number> {
  const actor = await getActor();
  if (!isStatus(status)) throw new Error("status inválido");

  let n = 0;
  for (const hit of hits.slice(0, 100)) {
    const { workId } = await findOrCreateWork(hitToWork(hit));
    await shelve(actor, workId, status);
    n++;
  }

  revalidatePath("/");
  revalidatePath("/estante");
  return n;
}

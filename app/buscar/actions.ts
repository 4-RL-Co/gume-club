"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { works } from "@/lib/db/schema";
import { LIMITS, clamp, clampRequired } from "@/lib/limits";
import {
  findOrCreateWork, hitToWork, shelve, setProvenance,
  isStatus, type Status,
} from "@/lib/library";
import { searchAll, enriquecer, porIsbn, type Hit } from "@/lib/catalog";
import { porQueNaoAceita } from "@/lib/imagens";

/**
 * Adding a book, in one tap. The result carries the ids back so the page can
 * follow up with the provenance invitation without a second lookup.
 */
export type Added = { workId: string; editionId: string | null; title: string };

export async function addFromSearch(hit: Hit, status: Status): Promise<Added> {
  const actor = await getActor();
  if (!isStatus(status)) throw new Error("status inválido");

  const { workId, editionId } = await findOrCreateWork({ ...hitToWork(hit), criadoPor: actor.id });
  // A edição vai junto: é a que o leitor acabou de identificar, e sem ela a página
  // do livro escolhe uma qualquer. Ver shelve(), em lib/library.ts.
  await shelve(actor, workId, status, editionId);

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
/**
 * A ficha inteira, pelo código de barras. É o que o cadastro à mão chama quando você
 * digita um ISBN: título, autor, editora, ano, páginas e capa voltam prontos.
 *
 * `getActor()` porque isto bate em API de terceiro (Open Library, Google Books): um
 * endereço anônimo que dispara busca externa é um amplificador de graça. Ele também
 * conta, e a conta é barata aqui — um ISBN só fica válido com 10 ou 13 dígitos, então
 * a tela dispara isto uma vez, e não a cada tecla.
 */
export async function puxarPorIsbn(bruto: string): Promise<{
  title: string;
  author: string | null;
  publisher: string | null;
  isbn13: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  coverUrl: string | null;
} | null> {
  await getActor();

  const hit = await porIsbn(bruto);
  if (!hit) return null;

  return {
    title: hit.title,
    author: hit.author,
    publisher: hit.publisher,
    isbn13: hit.isbn13,
    publishedYear: hit.publishedYear,
    pageCount: hit.pageCount,
    coverUrl: hit.coverUrl,
  };
}

export async function addByHand(form: {
  title: string;
  author: string;
  status: Status;
  publisher?: string;
  isbn?: string;
  year?: string;
  pageCount?: string;
  /** A capa: a que o ISBN trouxe, ou a que a pessoa subiu do computador. */
  coverUrl?: string;
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

  /**
   * A capa passa pelo mesmo porteiro do retrato de autor: ela vem por referência, e um
   * endereço fora da lista viraria uma capa quebrada na tela de todo mundo (a CSP a
   * bloqueia na hora de mostrar). Ver lib/imagens.ts.
   *
   * Na prática ela só chega daqui de dentro (o Blob do upload) ou da fonte que o ISBN
   * trouxe, e as duas já são aceitas: esta checagem é a trava, e não o caminho.
   */
  const capa = clamp(form.coverUrl ?? "", LIMITS.url);
  const naoAceita = porQueNaoAceita(capa ?? "");
  if (naoAceita) throw new Error(naoAceita);

  // A máquina vai atrás do resto, e agora ela usa o ISBN quando existe — que é o
  // identificador preciso, e não um título parecido. Ver enriquecer() em lib/catalog.ts.
  const achado = await enriquecer(title, author, digits);

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
    // A capa que a pessoa escolheu (ou confirmou) ganha da que a máquina adivinhou,
    // pela mesma razão de todos os outros campos: ela está com o livro na mão.
    coverUrl: capa ?? achado?.coverUrl ?? null,
    needsReview: true, // é um livro de verdade na estante enquanto isso, e não um de segunda
  });

  await shelve(actor, workId, form.status, editionId);
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
    const { workId, editionId } = await findOrCreateWork({ ...hitToWork(hit), criadoPor: actor.id });
    await shelve(actor, workId, status, editionId);
    n++;
  }

  revalidatePath("/");
  revalidatePath("/estante");
  return n;
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  ABRIR UM LIVRO DA BUSCA. E ABRIR NÃO É GUARDAR.
 *
 *  ═══ O BUG ═══
 *
 *  Clicar num resultado que JÁ estava no acervo abria a página do livro. Clicar num
 *  que veio de fora — que o Gume ainda não tinha — **punha o livro na estante**, como
 *  "quero ler", e nem avisava direito.
 *
 *  A razão era boa e o resultado era errado: sem estar no acervo, o livro não tem
 *  página, então a única forma de "ver" era criar a ficha, e criar estava amarrado a
 *  prateleirar. Quem só queria olhar saía com um livro na estante que não escolheu.
 *
 *  ═══ O CONSERTO É SEPARAR DUAS COISAS QUE NUNCA FORAM UMA ═══
 *
 *  Criar a ficha é do CATÁLOGO: um livro que existe passa a existir aqui, e isso é bom
 *  para todo mundo que buscar depois. Pôr na estante é da PESSOA, e é uma escolha dela.
 *
 *  Esta ação faz só a primeira, e devolve o endereço para a tela navegar. A estante
 *  continua a um clique de distância — na página do livro, que é onde ela sempre
 *  esteve.
 *
 *  Note que ela ESCREVE (cria obra e edição), e por isso passa por `getActor()`: uma
 *  escrita sem teto de uso é um formulário de spam.
 * ════════════════════════════════════════════════════════════════════
 */
export async function abrirDaBusca(hit: Hit): Promise<string | null> {
  const actor = await getActor();

  const { workId } = await findOrCreateWork({ ...hitToWork(hit), criadoPor: actor.id });

  const [obra] = await db
    .select({ slug: works.slug })
    .from(works)
    .where(eq(works.id, workId))
    .limit(1);

  return obra?.slug ?? null;
}

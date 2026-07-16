"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertOwner, type Viewer, type Visibility } from "@/lib/authz";
import { getActor } from "@/lib/actor";
import { LIMITS, clampRequired } from "@/lib/limits";
import { isStatus, shelveAndRead, setProvenance, type Status } from "@/lib/library";
import { degrauNovo } from "@/lib/escada";
import { record, recommend } from "@/lib/social";
import { getViewer } from "@/lib/viewer";
import { limitarEscrita } from "@/lib/escrita";
import { editarLeitura, apagarLeitura } from "@/lib/leituras";
import { ratings, reviews } from "@/lib/db/schema";

/**
 * Moving the status is also a reading event. Starting a book opens a reading;
 * finishing or abandoning it closes the one that is open. Rereads are first
 * class, so "read" twice opens a second reading rather than editing the first.
 */
export async function setStatus(
  slug: string,
  workId: string,
  status: Status,
  /**
   * QUANDO, e não "agora".
   *
   * Vazio vale HOJE, e é isso que mantém o clique único sendo um clique único: quem
   * aceita hoje não paga nada. Quem terminou o livro em março de 2019 diz março de
   * 2019, e o Gume acredita. Ver lib/datas.ts.
   */
  quando?: string,
): Promise<void> {
  const actor = await getActor();
  if (!isStatus(status)) throw new Error("status inválido");

  // Prateleirar e abrir/fechar a leitura acontecem juntos, numa transação com
  // trava: dois cliques em "lido" criavam duas leituras terminadas, e o ano
  // passava a contar dois livros onde havia um. Ver lib/library.ts.
  const entry = await shelveAndRead(actor, workId, status, quando ?? null);
  if (!entry) return;

  // A atividade herda a visibilidade da LINHA DA ESTANTE. Livro privado
  // prateleirado escreve atividade privada, ou o feed anuncia o que a estante
  // esconde.
  const verb = status === "reading" ? "started"
    : status === "read" ? "finished"
    : "shelved";

  /**
   * ═══ O DEGRAU PEGA CARONA NO LIVRO ═══
   *
   * Se este livro fez a pessoa subir de elo, o degrau vai na MESMA linha do feed:
   *
   *     "o Rui terminou Dom Casmurro · virou Prata"
   *
   * E não numa linha própria ("o Rui subiu para Prata"), que não diz o que ele leu, não
   * dá em que clicar, e no dia em que três amigos subirem vira um mural de parabéns.
   *
   * Só em "terminou": prateleirar não sobe elo, e começar a ler também não.
   */
  const honra = status === "read" ? await degrauNovo(actor.id) : null;

  await record(actor.id, verb, workId, {
    visibility: entry.visibility as Visibility,
    honra,
  });

  revalidatePath(`/livro/${slug}`);
  revalidatePath("/");
  revalidatePath("/estante");
  revalidatePath("/estatisticas");
}

/**
 * A nota é uma palavra: smallint 1..5, e nunca um float, em nenhuma camada.
 * 1 não terminei · 2 não gostei · 3 achei ok · 4 gostei · 5 adorei.
 * Dar nota de novo no mesmo livro substitui a nota. Ver lib/veredito.ts.
 */
export async function setRating(slug: string, workId: string, value: number): Promise<void> {
  const actor = await getActor();
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error("nota é smallint de 1 a 5");
  }
  assertOwner(actor as Viewer, { userId: actor.id });

  await db
    .insert(ratings)
    .values({ userId: actor.id, workId, value })
    .onConflictDoUpdate({
      target: [ratings.userId, ratings.workId],
      set: { value, ratedAt: new Date() },
    });

  await record(actor.id, "rated", workId, { rating: value, visibility: "public" });

  revalidatePath(`/livro/${slug}`);
  revalidatePath("/estante");
}

export async function clearRating(slug: string, workId: string): Promise<void> {
  const actor = await getActor();
  assertOwner(actor as Viewer, { userId: actor.id });

  await db.delete(ratings).where(and(eq(ratings.workId, workId), eq(ratings.userId, actor.id)));
  revalidatePath(`/livro/${slug}`);
}

/** Provenance, editable after the fact: readers remember where a book came from later. */
export async function updateProvenance(
  slug: string,
  workId: string,
  editionId: string | null,
  note: string,
): Promise<void> {
  const actor = await getActor();
  await setProvenance(actor, workId, editionId, note);
  revalidatePath(`/livro/${slug}`);
  revalidatePath("/");
  revalidatePath("/estante");
}

/**
 * A review. Private by default, and private reviews are free, forever. Most
 * reading notes are written for yourself, and a tracker that publishes them by
 * default quietly teaches you to write for an audience instead.
 */
export async function saveReview(
  slug: string,
  workId: string,
  body: string,
  visibility: Visibility,
): Promise<void> {
  const actor = await getActor();
  assertOwner(actor as Viewer, { userId: actor.id });

  if (!["public", "followers", "private"].includes(visibility)) {
    throw new Error("visibilidade inválida");
  }

  // Sem teto, uma requisição direta manda cinquenta megabytes de resenha e isso
  // chega no banco. O maxLength do formulário não protege quem não usa o
  // formulário. Ver lib/limits.ts.
  const text = clampRequired(body, LIMITS.review);
  if (!text) {
    await db.delete(reviews).where(and(eq(reviews.workId, workId), eq(reviews.userId, actor.id)));
    revalidatePath(`/livro/${slug}`);
    return;
  }

  const [saved] = await db
    .insert(reviews)
    .values({ userId: actor.id, workId, body: text, visibility })
    .onConflictDoUpdate({
      target: [reviews.userId, reviews.workId],
      set: { body: text, visibility, updatedAt: new Date(), deletedAt: null },
    })
    .returning({ id: reviews.id });

  // The activity carries the REVIEW's visibility. A private review must never
  // announce itself in a follower's feed. review_id is ON DELETE CASCADE, so
  // deleting the review takes its feed line with it, in the same statement.
  if (saved) {
    await record(actor.id, "reviewed", workId, { visibility, reviewId: saved.id });
  }

  revalidatePath(`/livro/${slug}`);
}

/**
 * Recommend this book to a friend. One book, one person, one line of why.
 *
 * The only write in the codebase that touches another person's shelf, authorised
 * by assertCanRecommendTo() in lib/authz.ts, which permits exactly this and
 * nothing else. See lib/social.ts.
 */
export async function recommendTo(
  slug: string,
  workId: string,
  toUserId: string,
  note: string,
): Promise<void> {
  const actor = await getActor();
  await recommend(actor, toUserId, workId, note);

  revalidatePath(`/livro/${slug}`);
  revalidatePath("/feed");
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  CORRIGIR A DATA DE UMA LEITURA JÁ REGISTRADA.
 *
 *  Até aqui isto era IMPOSSÍVEL, e a impossibilidade era cara: o app carimbava
 *  a data de hoje e nunca mais soltava. Se a data estava errada, ela ficava
 *  errada para sempre — e a única saída era apagar o livro da estante e pôr de
 *  novo, perdendo a nota e a resenha junto.
 *
 *  A autorização mora em lib/leituras.ts, no servidor: `readings` não tem dono
 *  próprio, o dono está em `library_entries`, e é lá que a checagem salta.
 * ════════════════════════════════════════════════════════════════════
 */
export async function salvarDatas(
  slug: string,
  readingId: string,
  datas: { comecou?: string; terminou?: string; abandonou?: string },
): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await editarLeitura(viewer, readingId, datas);

  revalidatePath(`/livro/${slug}`);
  revalidatePath("/");
  revalidatePath("/estante");
  revalidatePath("/estatisticas");
}

/** Apagar uma leitura registrada por engano. A linha da estante fica: some o capítulo, não o livro. */
export async function removerLeitura(slug: string, readingId: string): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await apagarLeitura(viewer, readingId);

  revalidatePath(`/livro/${slug}`);
  revalidatePath("/estatisticas");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/actor";
import { getViewer } from "@/lib/viewer";
import { limitarEscrita } from "@/lib/escrita";
import { porQueNaoAceita } from "@/lib/imagens";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { authors, works } from "@/lib/db/schema";
import { limparNomeDeAutor } from "@/lib/autores";
import { obraGemeaDe, fundirObras, type ObraGemea } from "@/lib/corrections";
import { Forbidden } from "@/lib/authz";
import { LIMITS, clamp, clampRequired } from "@/lib/limits";
import {
  removeFromShelf, removeManyFromShelf, editBook, setShelvesByName, setMyEdition, toggleInCollection,
  createCollection, renameCollection, deleteCollection, setCollectionVisibility,
  snapshotShelf, restoreShelf, setStatusMany, addManyToCollection,
  type BookEdit, type ShelfSnapshot,
} from "@/lib/curation";
import type { Visibility } from "@/lib/authz";

/** Take the book off your shelf. Everything you attached to it goes with it. */
export async function takeOffShelf(workId: string): Promise<void> {
  const actor = await getActor();
  await removeFromShelf(actor, workId);
  revalidatePath("/");
  revalidatePath("/estante");
  redirect("/estante");
}

const num = (v: string | undefined): number | null => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

/** Todo texto que entra tem teto, e o teto é do servidor. Ver lib/limits.ts. */
const str = (v: string | undefined, max: number = LIMITS.title): string | null => clamp(v, max);

/**
 * Fix a book in the catalogue. Anyone may, and every edit writes a revision with
 * a name on it: nothing is overwritten in silence. See lib/curation.ts.
 */
export async function saveBookEdit(
  slug: string,
  workId: string,
  editionId: string | null,
  form: Record<string, string>,
): Promise<{ erro: string | null; gemea?: ObraGemea }> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);

  /**
   * ═══ TROCAR O AUTOR É O QUE FAZ DUAS FICHAS COLIDIREM ═══
   *
   * O dump gravou o TRADUTOR como autor de um "Frankenstein", e a autora de verdade
   * ficou com outro. As duas fichas convivem em paz porque `works` é único em (título,
   * AUTOR, volume) — são autores diferentes. A colisão nasce no instante em que alguém
   * arruma o autor para o certo: aí as duas viram a mesma linha, e o unique recusa.
   *
   * Sem isto, essa correção estourava e a tela dizia "não deu para guardar" — a mesma
   * mentira genérica que a ficha do autor dava, e o mesmo beco: eram 793 livros sem
   * saída nenhuma.
   *
   * Não é erro: é uma PERGUNTA. "A Mary Shelley já tem um Frankenstein. É o mesmo
   * livro?" Ver fundirObras() em lib/corrections.ts.
   */
  const autorNovo = limparNomeDeAutor(form.author);
  if (autorNovo) {
    const [dono] = await db
      .select({ id: authors.id })
      .from(authors)
      .where(eq(authors.name, autorNovo))
      .limit(1);

    if (dono) {
      const [obra] = await db
        .select({ volume: works.volume, authorId: works.authorId })
        .from(works)
        .where(eq(works.id, workId))
        .limit(1);

      // Só quando o autor MUDA: reescrever o mesmo autor não colide com nada.
      if (obra && obra.authorId !== dono.id) {
        const gemea = await obraGemeaDe(
          workId,
          dono.id,
          clampRequired(form.title, LIMITS.title) ?? "",
          obra.volume,
        );

        if (gemea?.conflito) {
          return {
            erro:
              `${autorNovo} já tem uma ficha deste livro, e a mesma pessoa tem as duas na ` +
              "estante. Juntar teria que escolher qual nota e qual resenha sobrevivem, e isso " +
              "não é decisão de máquina.",
          };
        }
        if (gemea) return { erro: null, gemea };
      }
    }
  }

  /**
   * ═══ A CAPA ENTRA POR AQUI, E É O ÚNICO CAMPO COM PORTEIRO ═══
   *
   * A capa vem por referência: guardamos o endereço, e ele tem que ser de um acervo
   * público (ou do nosso Blob, onde a imagem que a própria pessoa subiu já mora). Um
   * endereço fora da lista viraria uma capa quebrada na tela de todo mundo, porque a
   * CSP a bloqueia na hora de mostrar. `porQueNaoAceita` é o mesmo porteiro do retrato
   * de autor; ver lib/imagens.ts.
   *
   * A recusa VOLTA COMO VALOR, e não como exceção: o Next apaga a mensagem de um erro
   * lançado numa ação de servidor em produção, e esta frase é uma instrução — a pessoa
   * precisa dela para acertar na segunda tentativa.
   */
  const capa = str(form.coverUrl, LIMITS.url);
  const naoAceita = porQueNaoAceita(capa ?? "");
  if (naoAceita) return { erro: naoAceita };

  const isbn = (form.isbn ?? "").replace(/[^0-9X]/gi, "");
  // A allow-list é esta, e ela é explícita: o que não está aqui não entra, venha
  // o campo que vier no corpo da requisição. Ver lib/limits.ts.
  const edit: BookEdit = {
    title: clampRequired(form.title, LIMITS.title),
    author: clampRequired(form.author, LIMITS.author),
    firstPublished: num(form.firstPublished),
    publisher: str(form.publisher, LIMITS.publisher),
    publishedYear: num(form.publishedYear),
    pageCount: num(form.pageCount),
    format: clampRequired(form.format, 20),
    isbn13: isbn.length === 13 ? isbn : null,
    coverUrl: capa,
  };

  await editBook(viewer, workId, editionId, edit, str(form.reason, LIMITS.note));

  revalidatePath(`/livro/${slug}`);
  revalidatePath("/");
  revalidatePath("/estante");
  return { erro: null };
}

/** Type "para reler, do meu pai" and be done. Creates the shelves that do not exist. */
export async function saveShelves(slug: string, workId: string, raw: string): Promise<void> {
  const actor = await getActor();
  await setShelvesByName(actor, workId, raw);
  revalidatePath(`/livro/${slug}`);
  revalidatePath("/estante");
}

/** Which copy am I reading. Page counts differ; the cover on the shelf depends on it. */
export async function escolherEdicao(slug: string, workId: string, editionId: string | null): Promise<void> {
  const actor = await getActor();
  await setMyEdition(actor, workId, editionId);
  revalidatePath(`/livro/${slug}`);
  revalidatePath("/estante");
}

/** Take several books off the shelf at once. One confirm, not twenty. */
/**
 * Tirar vários da estante, e devolver o RETRATO do que saiu.
 *
 * O retrato volta para a tela porque é ele que faz o "desfazer" ser verdadeiro: a
 * nota, a resenha e a procedência saem junto com o livro, e um desfazer que
 * devolvesse só a linha da estante seria um desfazer mentiroso.
 */
export async function tirarVarios(workIds: string[]): Promise<ShelfSnapshot> {
  const actor = await getActor();
  const snapshot = await snapshotShelf(actor, workIds);
  await removeManyFromShelf(actor, workIds);
  revalidatePath("/estante");
  revalidatePath("/");
  return snapshot;
}

/** Cinco segundos de arrependimento. É o que faz a pessoa se sentir livre para experimentar. */
export async function desfazerRemocao(snapshot: ShelfSnapshot): Promise<void> {
  const actor = await getActor();
  await restoreShelf(actor, snapshot);
  revalidatePath("/estante");
  revalidatePath("/");
}

/** Marcar vários de uma vez: lido, lendo, esperando, abandonado. */
export async function prateleirarVarios(workIds: string[], status: string): Promise<number> {
  const actor = await getActor();
  const n = await setStatusMany(actor, workIds, status);
  revalidatePath("/estante");
  revalidatePath("/");
  revalidatePath("/estatisticas");
  return n;
}

/** Jogar vários numa estante que você inventou. */
export async function moverVariosPara(collectionId: string, workIds: string[]): Promise<number> {
  const actor = await getActor();
  const n = await addManyToCollection(actor, collectionId, workIds);
  revalidatePath("/estante");
  return n;
}

export async function toggleCollection(
  slug: string, collectionId: string, workId: string, on: boolean,
): Promise<void> {
  const actor = await getActor();
  await toggleInCollection(actor, collectionId, workId, on);
  revalidatePath(`/livro/${slug}`);
  revalidatePath("/");
  revalidatePath("/estante");
}

export async function novaEstante(name: string, visibility: Visibility): Promise<void> {
  const actor = await getActor();
  await createCollection(actor, name, visibility);
  revalidatePath("/");
  revalidatePath("/estante");
}

export async function renomearEstante(id: string, name: string): Promise<void> {
  const actor = await getActor();
  await renameCollection(actor, id, name);
  revalidatePath("/");
  revalidatePath("/estante");
}

export async function apagarEstante(id: string): Promise<void> {
  const actor = await getActor();
  await deleteCollection(actor, id);
  revalidatePath("/");
  revalidatePath("/estante");
  redirect("/estante");
}

export async function visibilidadeEstante(id: string, visibility: Visibility): Promise<void> {
  const actor = await getActor();
  await setCollectionVisibility(actor, id, visibility);
  revalidatePath("/");
  revalidatePath("/estante");
}

/**
 * "São o mesmo livro": tudo do `de` passa para o `para`, e a ficha duplicada sai.
 *
 * Quem sobrevive é a ficha do autor CERTO, e o endereço dela é o que continua existindo.
 * O endereço da outra morre, e é o preço honesto de ter tido duas fichas para um livro
 * só. Ver fundirObras() em lib/corrections.ts.
 */
export async function fundirLivros(
  deId: string,
  paraId: string,
  motivo: string,
): Promise<{ erro: string | null; slug?: string }> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);

  try {
    await fundirObras(viewer, deId, paraId, motivo || null);
  } catch (e) {
    if (e instanceof Forbidden) {
      return { erro: "A mesma pessoa tem as duas fichas: a fusão não escolhe nota nem resenha." };
    }
    return { erro: "Não deu para juntar agora. O problema é nosso." };
  }

  const [viva] = await db.select({ slug: works.slug }).from(works).where(eq(works.id, paraId)).limit(1);

  revalidatePath("/");
  revalidatePath("/estante");
  if (viva) revalidatePath(`/livro/${viva.slug}`);

  return { erro: null, slug: viva?.slug };
}

"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getActor } from "@/lib/actor";
import { LIMITS, clamp } from "@/lib/limits";
import { assertOwner, type Viewer } from "@/lib/authz";
import { coroar, desfavoritar, favoritar } from "@/lib/favoritos";

/**
 * ════════════════════════════════════════════════════════════════════
 *  APARECER, OU NÃO, NA LISTA DE QUEM APOIA.
 *
 *  A caixa nasce MARCADA, e desmarcar tira o nome na hora. Quem apoia e desmarca apoia
 *  em silêncio, e o app não conta a ninguém.
 *
 *  Marcar não dá nada além de aparecer. A lista não tem valor, não tem ordem de
 *  grandeza e não tem posição: ela é por ordem de chegada, que é um fato sobre o
 *  tempo e não sobre o bolso. Ver lib/contributors.ts.
 * ════════════════════════════════════════════════════════════════════
 */
export async function salvarApoioPublico(
  aparecer: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await getActor();
  assertOwner(actor as Viewer, { userId: actor.id });

  await db.update(users).set({ supporterPublic: aparecer }).where(eq(users.id, actor.id));

  revalidatePath("/perfil");
  revalidatePath("/contribuidores");
  return { ok: true };
}

/** A handle is the reader's public address. Lowercase, no accents, no surprises. */
function cleanHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^@/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

/**
 * Save your own profile. The photo was already uploaded and cropped by the
 * browser; this only stores where it landed.
 */
export async function saveProfile(form: {
  displayName: string;
  handle: string;
  bio: string;
  image: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await getActor();
  assertOwner(actor as Viewer, { userId: actor.id });

  const handle = cleanHandle(form.handle);
  if (handle.length < 2) return { ok: false, error: "escolha um @ com pelo menos duas letras" };

  // A imagem tem que ser NOSSA: ou o disco de dev (`/uploads/`), ou o nosso Vercel Blob
  // (`*.public.blob.vercel-storage.com`, para onde `lib/guardar.ts` sobe em produção).
  // Uma url apontando para qualquer outro lugar é alguém pendurando um pixel de rastreio
  // em toda página que renderiza este leitor — ou a foto de perfil de outra pessoa.
  //
  // ═══ SEM ISTO, TODA FOTO SUMIA ═══
  // A checagem só aceitava `/uploads/`, o caminho do disco. Em produção o upload volta uma
  // URL do Blob, que não começa com `/uploads/`, então o save gravava `image = null`: a foto
  // subia, "salvava sem erro", e o perfil continuava sem rosto. Ver lib/guardar.ts.
  const daGente = Boolean(
    form.image?.startsWith("/uploads/") ||
      /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(form.image ?? ""),
  );
  const image = daGente ? form.image! : null;

  try {
    await db
      .update(users)
      .set({
        displayName: clamp(form.displayName, LIMITS.displayName),
        handle,
        bio: clamp(form.bio, LIMITS.bio),
        image,
      })
      .where(eq(users.id, actor.id));
  } catch (e) {
    /**
     * ═══ NÃO ENGULA TODO ERRO COMO "@ JÁ EXISTE" ═══
     *
     * Este catch dizia "esse @ já é de outra pessoa" para QUALQUER erro do banco. E o dono,
     * salvando o próprio perfil sem mexer no @, via essa mensagem: o gatilho de handle
     * reservado (migration 0027) barrava o update mesmo com o handle inalterado, e o catch
     * culpava o @. Duas coisas erradas de uma vez. O gatilho foi consertado (0049); aqui, a
     * mensagem passa a dizer a verdade, e um erro que não seja de handle sobe em vez de virar
     * uma mentira educada.
     */
    /**
     * O Drizzle EMBRULHA o erro do driver: o código do Postgres (23514, 23505) chega em
     * `err.cause.code`, não em `err.code`. Olhar só o nível de cima deixava o erro de handle
     * reservado escapar e virar um 500 na cara do dono. Aqui a gente olha os dois níveis.
     */
    const err = e as { code?: string; message?: string; cause?: { code?: string; message?: string } };
    const code = err.code ?? err.cause?.code;
    const message = err.message ?? err.cause?.message;
    if (code === "23505") return { ok: false, error: "esse @ já é de outra pessoa" };
    if (code === "23514") {
      return message?.includes("número")
        ? { ok: false, error: "o @ não pode começar com número" }
        : { ok: false, error: "esse @ é reservado, escolha outro" };
    }
    throw e;
  }

  revalidatePath("/perfil");
  revalidatePath(`/@${handle}`);
  return { ok: true };
}

/**
 * Favoritar direto da tela de configuração — sem sair pra ficha do livro.
 * Mesma trava de sempre (só quem já leu), agora alcançável de /perfil, do
 * jeito que o print do yourgamerprofile.com mostrou: a busca mora dentro da
 * própria edição do perfil.
 */
export async function favoritarDoPerfilAction(
  workId: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const actor = await getActor();
  const r = await favoritar(actor, workId);
  revalidatePath("/perfil");
  return r;
}

/** Coroar: mover um favorito para a posição 1. Ver lib/favoritos.ts. */
export async function coroarAction(workId: string): Promise<void> {
  const actor = await getActor();
  await coroar(actor, workId);
  revalidatePath("/perfil");
}

export async function tirarFavoritoAction(workId: string): Promise<void> {
  const actor = await getActor();
  await desfavoritar(actor, workId);
  revalidatePath("/perfil");
}

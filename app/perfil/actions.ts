"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getActor } from "@/lib/actor";
import { LIMITS, clamp } from "@/lib/limits";
import { assertOwner, type Viewer } from "@/lib/authz";

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

  // The image must be one of ours. A url pointing anywhere else is somebody
  // hotlinking a tracking pixel onto every page that renders this reader.
  const image = form.image?.startsWith("/uploads/") ? form.image : null;

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

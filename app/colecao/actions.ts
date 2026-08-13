"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getActor } from "@/lib/actor";
import { db } from "@/lib/db";
import { works } from "@/lib/db/schema";
import { porEmblema, ligarAoConjunto } from "@/lib/conjuntos";

/**
 * Pôr (ou tirar) o emblema de um conjunto. É contribuição de CATÁLOGO, como ligar um
 * volume: vale para todo mundo que tem aquela coleção, vai para o log com nome, e é
 * reversível. Ver lib/conjuntos.ts.
 *
 * ═══ POR QUE ESTA AÇÃO NÃO EXISTIA ═══
 *
 * `porEmblema()` foi escrita em 2026-08-06 e nunca ganhou uma porta na tela — nem
 * botão, nem formulário. A função funcionava (depois do conserto da migration 0061),
 * e continuava impossível de usar: ninguém tinha como chegar nela. Um recurso sem UI
 * não é um recurso incompleto, é um recurso que não existe para quem lê a tela.
 */
export async function porEmblemaAction(conjuntoId: string, url: string): Promise<void> {
  const actor = await getActor();
  await porEmblema(actor, conjuntoId, url);
  revalidatePath("/colecao");
}

/**
 * ADICIONAR UM VOLUME A UM CONJUNTO QUE JÁ EXISTE, DA PRÓPRIA PÁGINA DELE.
 *
 * `ligarAoConjunto` (lib/conjuntos.ts) já existia — a única porta era
 * components/conjunto-do-livro.tsx, na página do LIVRO ("este volume faz
 * parte de qual coleção?"). Quem está faltando um volume precisa navegar até
 * o livro certo pra descobrir que o app já sabia fazer isso. O pedido do
 * dono foi direto: "deixe que o usuário personalize sua coleção" — não uma
 * coleção pessoal solta (isso reabriria a decisão em lib/conjuntos.ts de
 * que um conjunto é FATO de edição, não opinião), mas a busca destravada
 * daqui, do lado de dentro da própria coleção.
 *
 * Recebe o SLUG do livro (o que a busca do catálogo devolve) e resolve o
 * workId aqui dentro — `Hit` (lib/catalog.ts) não carrega um id, só o
 * endereço público. Só livros JÁ no catálogo (com slug) podem ser ligados
 * assim; um resultado vindo de fora (OpenLibrary/Google ao vivo) precisa
 * primeiro ganhar uma ficha, do mesmo jeito que o Cmd+K já exige.
 */
export async function adicionarVolume(
  conjuntoId: string,
  conjuntoSlug: string,
  workSlug: string,
  volume: number,
): Promise<{ erro: string | null }> {
  const actor = await getActor();

  const [w] = await db.select({ id: works.id }).from(works).where(eq(works.slug, workSlug)).limit(1);
  if (!w) return { erro: "não achei esse livro no catálogo" };

  await ligarAoConjunto(actor, w.id, { conjuntoId }, volume);
  revalidatePath(`/colecao/${conjuntoSlug}`);
  revalidatePath("/colecao");
  return { erro: null };
}

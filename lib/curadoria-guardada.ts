import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { curationSaves } from "@/lib/db/schema";
import { assertAuthenticated, type Viewer } from "@/lib/authz";

/**
 * ════════════════════════════════════════════════════════════════════
 *  GUARDAR A CURADORIA DA CASA, COMO SE GUARDA A LISTA DE UMA PESSOA.
 *
 *  ═══ POR QUE ISTO NÃO É `guardarLista` ═══
 *
 *  Guardar a estante de alguém já existia, e aponta para uma linha em `collections`.
 *  A curadoria da casa NÃO É uma coleção: o Top 100 é CALCULADO a cada visita, sem
 *  linha em tabela nenhuma — e é isso que garante que ninguém a edita e que ela se
 *  refaz sozinha quando a comunidade muda de gosto.
 *
 *  Materializá-la numa coleção só para caber no mecanismo antigo seria mudar o que a
 *  coisa É para caber no jeito de guardar. A lista continua calculada; o que se guarda
 *  é o PONTEIRO para ela.
 *
 *  ═══ A LISTA DE CHAVES MORA AQUI, E É POR ISSO QUE ELA EXISTE ═══
 *
 *  A tabela não tem chave estrangeira: não há para onde apontar. O preço é que o banco
 *  aceitaria `chave = 'qualquer-coisa'`, e uma linha órfã vira uma entrada fantasma na
 *  tela de alguém — item guardado que não leva a lugar nenhum.
 *
 *  Então a validação é aqui, na única porta de escrita, e a LEITURA também filtra:
 *  chave que o app não conhece mais (uma lista editorial aposentada) simplesmente não
 *  volta, em vez de virar um card quebrado. As duas pontas, porque o dado sobrevive ao
 *  código que o escreveu.
 * ════════════════════════════════════════════════════════════════════
 */

export type Curadoria = {
  chave: string;
  titulo: string;
  href: string;
};

/**
 * As listas editoriais que dá para guardar. Hoje é uma.
 *
 * Uma lista nova aqui é uma LINHA, e não uma migration — foi para isso que a chave é o
 * nome da coisa em vez de um id.
 */
export const CURADORIAS: Curadoria[] = [
  { chave: "queridinhos", titulo: "Top 100: os queridinhos do Gume", href: "/queridinhos" },
];

export function ehCuradoria(chave: string): boolean {
  return CURADORIAS.some((c) => c.chave === chave);
}

/** Guardar. Chave desconhecida não grava, e não é erro: para quem tenta às cegas, silêncio. */
export async function guardarCuradoria(viewer: Viewer, chave: string): Promise<void> {
  assertAuthenticated(viewer);
  if (!ehCuradoria(chave)) return;

  await db
    .insert(curationSaves)
    .values({ userId: viewer!.id, chave })
    .onConflictDoNothing();
}

/** Esquecer. Some da sua tela, e ninguém é avisado: guardar nunca foi um evento social. */
export async function esquecerCuradoria(viewer: Viewer, chave: string): Promise<void> {
  assertAuthenticated(viewer);
  await db
    .delete(curationSaves)
    .where(and(eq(curationSaves.userId, viewer!.id), eq(curationSaves.chave, chave)));
}

/** A tela precisa saber se o botão diz "guardar" ou "guardada". */
export async function jaGuardei(viewer: Viewer, chave: string): Promise<boolean> {
  if (!viewer) return false;
  const [row] = await db
    .select({ chave: curationSaves.chave })
    .from(curationSaves)
    .where(and(eq(curationSaves.userId, viewer.id), eq(curationSaves.chave, chave)))
    .limit(1);
  return Boolean(row);
}

/**
 * As curadorias que ESTA pessoa guardou, para o perfil dela.
 *
 * O filtro por `ehCuradoria` é a segunda ponta da trava: uma lista editorial que o app
 * aposentou continua na tabela (o dado é da pessoa, e apagar em silêncio seria pior),
 * mas não vira um card que não abre.
 */
export async function getCuradoriasGuardadas(userId: string): Promise<Curadoria[]> {
  const rows = await db.execute<{ chave: string }>(sql`
    select chave from curation_saves where user_id = ${userId}::uuid order by saved_at desc`);

  return rows
    .map((r) => CURADORIAS.find((c) => c.chave === r.chave))
    .filter((c): c is Curadoria => c !== undefined);
}

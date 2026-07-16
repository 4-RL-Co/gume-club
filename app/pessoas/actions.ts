"use server";

import { getViewer } from "@/lib/viewer";
import { buscarPessoas } from "@/lib/social";
import { getCoroasPorHandle } from "@/lib/escada";
import { limitar, RATES } from "@/lib/rate-limit";
import type { Coroa } from "@/lib/honras";

export type PessoaNaBusca = {
  id: string;
  handle: string;
  name: string | null;
  image: string | null;
  isPrivate: boolean;
  following: boolean;
  /** A moldura da honra, para a cara aparecer igual ao resto do app. */
  coroa: Coroa | null;
};

/**
 * Buscar gente pelo nome ou @. Só para quem está logado: uma busca de pessoas aberta a
 * anônimo é um raspador de diretório. Ver lib/social.ts (buscarPessoas).
 *
 * A moldura vem junto, na mesma consulta agregada que o feed usa, para não fazer uma
 * consulta por avatar. Ver getCoroasPorHandle() em lib/escada.ts.
 */
export async function procurarPessoas(termo: string): Promise<PessoaNaBusca[]> {
  const viewer = await getViewer();
  if (!viewer) return [];

  /**
   * Esta busca é POR TECLA, então ela conta no balde de BUSCA (mais generoso), e não no de
   * escrita — exatamente como a busca de livros de /api/buscar. Contar por tecla no balde
   * de escrita esgotaria o teto do dono numa palavra. Ver lib/rate-limit.ts (RATES.search)
   * e a exceção anotada em lib/acoes.test.ts.
   *
   * Passou do teto: devolve vazio, sem quebrar a tela. Uma busca barrada não é um erro.
   */
  const veredito = await limitar(`busca-pessoas:${viewer.id}`, RATES.search);
  if (!veredito.ok) return [];

  const pessoas = await buscarPessoas(viewer, termo);
  if (pessoas.length === 0) return [];

  const coroas = await getCoroasPorHandle(pessoas.map((p) => p.handle));

  return pessoas.map((p) => ({ ...p, coroa: coroas[p.handle] ?? null }));
}

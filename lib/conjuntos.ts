import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { works, revisions } from "@/lib/db/schema";
import { assertAuthenticated, type Viewer } from "@/lib/authz";
import { slugify } from "@/lib/slug";
import { LIMITS, clamp } from "@/lib/limits";

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM MONTA UM CONJUNTO DE EDIÇÃO. E por que ele é do CATÁLOGO.
 *
 *  ═══ A PERGUNTA QUE O DONO FEZ ═══
 *
 *  Ele tinha três volumes de Hellsing Deluxe fora de conjunto, e disse: "acho que tem
 *  que ser possível a pessoa criar seus próprios conjuntos".
 *
 *  ═══ E POR QUE ELE NÃO É "PRÓPRIO" ═══
 *
 *  "Hellsing Deluxe Edition tem 10 volumes" é um FATO SOBRE O MUNDO, como o autor ou a
 *  editora de um livro. Não é opinião de ninguém.
 *
 *  Se o conjunto fosse pessoal, cada colecionador recadastraria os mesmos dez volumes
 *  por conta própria, e o app teria dez versões da mesma verdade — que é exatamente o
 *  tipo de duplicata que este acervo passou o dia consertando.
 *
 *  Agrupamento PESSOAL já existe e continua valendo: são as estantes que a pessoa
 *  monta ("meus livros de capa dura"). Aquilo é gosto; isto é ficha.
 *
 *  ═══ ENTÃO ELE É CONTRIBUIÇÃO, COM O MESMO PESO DE UMA CORREÇÃO ═══
 *
 *  Vai para o log de revisões, com o nome de quem fez, e é reversível. É o histórico
 *  público que torna vandalismo caro — a mesma defesa que protege a ficha do livro,
 *  e não uma permissão que faria do dono um porteiro.
 * ════════════════════════════════════════════════════════════════════
 */

export type ConjuntoConhecido = {
  id: string;
  titulo: string;
  publisher: string | null;
  total: number | null;
  /** Quantos volumes já estão ligados. A tela mostra para a pessoa reconhecer o certo. */
  volumes: number;
};

/** Conjuntos que já existem, para a pessoa ESCOLHER antes de inventar um novo. */
export async function buscarConjuntos(termo: string): Promise<ConjuntoConhecido[]> {
  const q = termo.trim();
  if (q.length < 2) return [];

  return db.execute<ConjuntoConhecido>(sql`
    select c.id, c.title as titulo, c.publisher, c.total_volumes as total,
           (select count(*)::int from works w where w.colecao_id = c.id) as volumes
      from colecoes c
     where immutable_unaccent(lower(c.title)) like '%' || immutable_unaccent(lower(${q})) || '%'
     order by (select count(*) from works w2 where w2.colecao_id = c.id) desc
     limit 8`);
}

/**
 * Liga um volume a um conjunto — criando o conjunto se ele ainda não existir.
 *
 * ═══ O `volume` VEM JUNTO, E É POR ISSO QUE ELE É UM PARÂMETRO ═══
 *
 * Um conjunto sem número de volume é uma pilha, e não uma coleção: sem ele a tela não
 * sabe ordenar nem dizer qual falta. Pedir o número aqui é o que evita "3 de 10" com
 * os três em ordem aleatória.
 */
export async function ligarAoConjunto(
  viewer: Viewer,
  workId: string,
  alvo: { conjuntoId: string } | { titulo: string; total: number; publisher: string | null },
  volume: number,
): Promise<void> {
  assertAuthenticated(viewer);

  await db.transaction(async (tx) => {
    let conjuntoId: string;

    if ("conjuntoId" in alvo) {
      conjuntoId = alvo.conjuntoId;
    } else {
      const titulo = clamp(alvo.titulo, LIMITS.shelfName);
      if (!titulo) throw new Error("o conjunto precisa de um nome");

      /**
       * A SÉRIE vem junto porque `colecoes.series_id` é obrigatório: um conjunto de
       * edição é sempre de ALGUMA obra. Sem uma série de verdade para apontar, a
       * própria edição vira a série — feio, e verdadeiro: é melhor que inventar um
       * vínculo com uma série que a pessoa não escolheu.
       */
      const base = slugify(titulo);

      /**
       * SQL cru, e não o construtor: `lib/db/schema.ts` NÃO descreve a coluna `slug`
       * de `series`, e a produção tem ela — com o índice único em cima dela, que é o
       * alvo deste `on conflict`. O arquivo derivou do banco em algum momento.
       *
       * Escrever pelo construtor daria um erro de tipo por uma coluna que existe de
       * verdade, e "consertar" removendo o slug faria o conflito bater no lugar errado.
       */
      const [s] = await tx.execute<{ id: string }>(sql`
        insert into series (title, slug, kind, total_volumes)
        values (${titulo}, ${base}, 'series', ${alvo.total})
        on conflict (slug) do update set total_volumes = excluded.total_volumes
        returning id`);

      const [c] = await tx.execute<{ id: string }>(sql`
        insert into colecoes (series_id, slug, title, publisher, total_volumes)
        values (${s!.id}::uuid, ${base}, ${titulo}, ${alvo.publisher}, ${alvo.total})
        on conflict (slug) do update
          set total_volumes = excluded.total_volumes,
              publisher     = coalesce(excluded.publisher, colecoes.publisher)
        returning id`);
      conjuntoId = c!.id;
    }

    const [antes] = await tx
      .select({ colecaoId: works.colecaoId, volume: works.volume })
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);

    await tx
      .update(works)
      .set({ colecaoId: conjuntoId, volume: String(volume) })
      .where(eq(works.id, workId));

    /**
     * NO LOG, com nome e reversível. Ligar um volume ao conjunto errado estraga a
     * coleção de quem coleciona, e a defesa contra isso é o histórico público — o
     * mesmo que protege a ficha do livro. Uma permissão faria do dono um porteiro.
     */
    await tx.insert(revisions).values({
      userId: viewer!.id,
      targetType: "work",
      targetId: workId,
      patch: { colecao_id: conjuntoId, volume },
      previous: { colecao_id: antes?.colecaoId ?? null, volume: antes?.volume ?? null },
      reason: "ligou o volume a um conjunto de edição",
    });
  });
}

/** Tirar do conjunto. Erra-se ao ligar, e desfazer não pode ser mais difícil que fazer. */
export async function soltarDoConjunto(viewer: Viewer, workId: string): Promise<void> {
  assertAuthenticated(viewer);

  await db.transaction(async (tx) => {
    const [antes] = await tx
      .select({ colecaoId: works.colecaoId, volume: works.volume })
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);
    if (!antes?.colecaoId) return;

    await tx.update(works).set({ colecaoId: null }).where(eq(works.id, workId));

    await tx.insert(revisions).values({
      userId: viewer!.id,
      targetType: "work",
      targetId: workId,
      patch: { colecao_id: null },
      previous: { colecao_id: antes.colecaoId, volume: antes.volume },
      reason: "soltou o volume do conjunto",
    });
  });
}

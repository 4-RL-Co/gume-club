import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS CAPAS QUE PODEM APARECER NUMA PAREDE.
 *
 *  ═══ POR QUE ISTO VIROU UM ARQUIVO ═══
 *
 *  A consulta morava dentro da home, e a tela de apoiar precisou das mesmas capas. Copiar
 *  sessenta linhas de SQL seria criar uma segunda regra sobre o que pode aparecer numa
 *  parede — e no dia em que uma das duas mudasse, a home e a tela de apoio mostrariam
 *  acervos diferentes, sem ninguém perceber qual das duas estava certa.
 *
 *  ═══ A PAREDE NUNCA É SORTEADA NO ACERVO CRU ═══
 *
 *  Sortear no meio de 262 mil obras devolve anais de congresso, relatório de ministério e
 *  digitalização com acento quebrado. Numa parede que é a primeira coisa que alguém vê na
 *  vida, isso não é honestidade: é ruído, e a pessoa passa a julgar o Gume pelo título
 *  estranho em vez de pelo que ele é.
 *
 *  A ordem é: primeiro o que está nas estantes das pessoas, depois o cânone como remendo.
 *  Toda capa aqui tem imagem de verdade, porque uma capa tipográfica gerada na parede diz
 *  "este catálogo está vazio", que é o contrário do que a parede está dizendo.
 *
 *  ═══ E ISTO NÃO É UM PLACAR ═══
 *
 *  Ordenar LIVRO por em quantas estantes ele está não ordena GENTE: ninguém sobe, ninguém
 *  desce, ninguém é comparado com ninguém. É uma prateleira dos mais lidos, e não um pódio
 *  de leitores. Nenhum número chega à tela: a contagem decide a ORDEM, e some.
 * ════════════════════════════════════════════════════════════════════
 */

export type CapaDaParede = {
  title: string;
  author: string | null;
  cover_url: string | null;
};

/**
 * O cânone da parede. Nomes como o dump da Open Library os escreve, e é por isso
 * que "Dostoyevsky" está aqui com y: a grafia é a do catálogo, não a nossa.
 *
 * Vagabond e Fullmetal Alchemist NÃO estão: eles não existem no dump em português,
 * e uma parede não pode mostrar um livro que o app não tem. No dia em que
 * entrarem no catálogo, entram aqui.
 */
const CANON = [
  "machado de assis", "clarice lispector", "graciliano ramos", "franz kafka",
  "dostoyevsky", "dostoiévski", "josé saramago", "carlos drummond",
  "lima barreto", "euclides da cunha", "gabriel garcía márquez",
  "j.r.r. tolkien", "george orwell", "jorge amado", "cecília meireles",
].join("|");

/** Mangá, por título: o autor vem grafado em japonês no dump, e o título não. */
const MANGA = "berserk|akira|vagabond|fullmetal";

/**
 * As capas, já na ordem certa e só as que têm imagem de verdade.
 *
 * `quantas` é quantas voltam para a tela. A consulta busca com folga por baixo, porque o
 * filtro de imagem acontece depois e comer o limite cedo deixaria a parede com buraco.
 */
export async function getCapasDaParede(quantas = 30): Promise<CapaDaParede[]> {
  const capas = await db.execute<{
    title: string; author: string | null; cover_url: string | null; ordem: number; n: number;
  }>(sql`
    with das_estantes as (
      select w.id, w.title, a.name as author,
             (select e.cover_url from editions e
               where e.work_id = w.id and e.cover_url is not null
               order by e.created_at limit 1) as cover_url,
             0 as ordem,
             count(*)::int as n
        from works w
        join library_entries le on le.work_id = w.id
        left join authors a on a.id = w.author_id
       where le.visibility = 'public'
         and exists (select 1 from editions e where e.work_id = w.id and e.cover_url is not null)
       group by w.id, w.title, a.name
    ),
    canone as (
      select w.id, w.title, a.name as author,
             (select e.cover_url from editions e
               where e.work_id = w.id and e.cover_url is not null
               order by e.created_at limit 1) as cover_url,
             1 as ordem, 0 as n
        from works w
        join authors a on a.id = w.author_id
       where a.name ~* ${CANON}
         and exists (select 1 from editions e where e.work_id = w.id and e.cover_url is not null)
    ),
    manga as (
      select w.id, w.title, a.name as author,
             (select e.cover_url from editions e
               where e.work_id = w.id and e.cover_url is not null
               order by e.created_at limit 1) as cover_url,
             1 as ordem, 0 as n
        from works w
        left join authors a on a.id = w.author_id
       where w.title ~* ${MANGA}
         and exists (select 1 from editions e where e.work_id = w.id and e.cover_url is not null)
    )
    select distinct on (id) title, author, cover_url, ordem, n
      from (select * from das_estantes union all select * from canone union all select * from manga) t
     where title !~ '�'
     order by id, ordem
     limit 200`);

  /**
   * O cânone entra DEPOIS das estantes, embaralhado, só para encher o que faltar. Conforme
   * as estantes crescerem, ele vai sendo empurrado para fora sozinho.
   */
  return capas
    .filter((c) => c.cover_url)
    .sort((a, b) => a.ordem - b.ordem || b.n - a.n || Math.random() - 0.5)
    .slice(0, quantas);
}

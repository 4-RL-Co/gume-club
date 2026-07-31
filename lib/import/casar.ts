import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Achado, LivroImportado } from "@/lib/import/tipos";
import type { Casamento } from "@/lib/library";

/**
 * ════════════════════════════════════════════════════════════════════
 *  PROCURAR NO CATÁLOGO, SEM ESCREVER NADA.
 *
 *  ═══ POR QUE ESTA FUNÇÃO EXISTE ═══
 *
 *  "Mostre antes de escrever" é a regra da casa, e ela já era obedecida: a tela mostrava o
 *  que o PARSER entendeu do arquivo.
 *
 *  Só que isso não é a pergunta que importa. A pessoa não precisa conferir se a gente leu
 *  "Dom Casmurro" na linha do CSV — ela precisa conferir **em que livro do catálogo aquilo
 *  foi parar**. E disso a tela não sabia nada, porque a prévia nunca tocava no catálogo.
 *
 *  ═══ CASAR POR ISBN É FATO. CASAR POR TÍTULO É PALPITE ═══
 *
 *  E a tela tem que mostrar a diferença, porque a pessoa precisa poder desconfiar do
 *  segundo sem ter que desconfiar do primeiro.
 *
 *  Um casamento errado é pior que nenhum casamento: o livro entra na estante com a capa de
 *  outro, e ninguém percebe por dois anos — a pessoa acha que o app é assim mesmo.
 *
 *  ═══ E ELA NÃO ESCREVE NADA ═══
 *
 *  Nenhum `insert`, nenhum `update`. É a mesma cascata de `findOrCreateWork` (ISBN-13,
 *  ISBN-10, título sem acento), só que ela para quando não acha, em vez de criar.
 *
 *  Duas cascatas para a mesma coisa é uma cascata que um dia diverge — e no dia em que
 *  divergir, a tela vai mostrar um casamento e o banco vai gravar outro. Por isso a ordem
 *  aqui é a MESMA, e `lib/import/casar.sql.test.ts` prova que elas concordam.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * ═══ O TIPO E O `ehFato` MORAM EM `tipos.ts`, E NÃO AQUI ═══
 *
 * Eles moravam neste arquivo, e a TELA os importava — arrastando o `postgres` inteiro para
 * dentro do bundle do navegador, porque este arquivo importa o banco.
 *
 * O Next quebrou na cara, e foi ele que pegou: o build e os 710 testes estavam verdes. Um
 * teste que importa o módulo direto nunca vê a fronteira entre cliente e servidor.
 *
 * A regra: o que a tela precisa ler é vocabulário, e vocabulário não tem banco dentro. É a
 * mesma razão de `lib/shelf-view.ts` e `lib/badges-view.ts` existirem separados.
 */
export type { Achado } from "@/lib/import/tipos";
export { ehFato } from "@/lib/import/tipos";

/**
 * Procura um livro do arquivo no catálogo. Não escreve nada.
 *
 * Um lote por vez, e o lote vem do cliente: quatrocentos livros são quatrocentas buscas, e
 * quatrocentas buscas não cabem numa requisição só: ela estoura o tempo, morre no meio, e
 * a pessoa vê "erro" depois de esperar dois minutos.
 */
export async function procurarNoCatalogo(livros: LivroImportado[]): Promise<Achado[]> {
  const achados: Achado[] = [];

  for (const livro of livros) {
    achados.push(await procurarUm(livro));
  }

  return achados;
}

async function procurarUm(livro: LivroImportado): Promise<Achado> {
  const base = {
    titulo: livro.titulo,
    autor: livro.autor,
    slug: null,
    tituloNoCatalogo: null,
    autorNoCatalogo: null,
    coverUrl: null,
  };

  /** O que a tela precisa mostrar de uma obra que já existe. */
  const daObra = async (workId: string, como: Casamento): Promise<Achado> => {
    const [w] = await db.execute<{
      slug: string;
      title: string;
      author: string | null;
      cover_url: string | null;
    }>(sql`
      select w.slug, w.title, a.name as author,
             (select e.cover_url from editions e
               where e.work_id = w.id and e.cover_url is not null
               order by e.created_at asc limit 1) as cover_url
        from works w
        left join authors a on a.id = w.author_id
       where w.id = ${workId}::uuid`);

    return {
      ...base,
      como,
      slug: w?.slug ?? null,
      tituloNoCatalogo: w?.title ?? null,
      autorNoCatalogo: w?.author ?? null,
      coverUrl: w?.cover_url ?? null,
    };
  };

  // 1. ISBN-13. Um fato.
  if (livro.isbn13) {
    const [e] = await db.execute<{ work_id: string }>(sql`
      select work_id from editions where isbn13 = ${livro.isbn13} limit 1`);
    if (e) return daObra(e.work_id, "isbn13");
  }

  /**
   * 2. ISBN-10. Outro fato, e o que faltava.
   *
   * Livro brasileiro de antes de 2007 só tem ISBN-10, e é a metade da estante de quem
   * compra em sebo — que é o leitor que este app existe para servir.
   */
  if (livro.isbn10) {
    const [e] = await db.execute<{ work_id: string }>(sql`
      select e.work_id
        from identifiers i join editions e on e.id = i.edition_id
       where i.kind = 'isbn10' and i.value = ${livro.isbn10}
       limit 1`);
    if (e) return daObra(e.work_id, "isbn10");
  }

  /**
   * 3. Título + autor, sem acento e sem caixa. É um PALPITE, e ele se declara.
   *
   * O autor entra na conta quando existe: "Dom Casmurro" de Machado e "Dom Casmurro" de um
   * professor que escreveu um estudo sobre ele são dois livros, e casar os dois pelo título
   * é o erro que apodrece um catálogo.
   */
  const [w] = await db.execute<{ id: string }>(sql`
    select w.id
      from works w
      left join authors a on a.id = w.author_id
     where immutable_unaccent(lower(w.title)) = immutable_unaccent(lower(${livro.titulo}))
       ${
         livro.autor
           ? sql`and a.name is not null
                 and immutable_unaccent(lower(a.name)) = immutable_unaccent(lower(${livro.autor}))`
           : sql``
       }
     limit 1`);

  if (w) return daObra(w.id, "titulo");

  // 4. Não achou. A obra vai ser CRIADA, e a linha nunca é descartada.
  return { ...base, como: "novo" };
}

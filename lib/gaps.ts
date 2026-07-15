import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Viewer } from "@/lib/authz";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE FALTA. E o recorte é UM SÓ: a sua estante.
 *
 *  Esta função já devolveu os totais do catálogo inteiro ("336.448 sem
 *  capa"), e eles saíram da tela. A intenção era honestidade: mostrar o
 *  tamanho real do trabalho, em vez de uma barra de progresso fingindo
 *  que está quase lá. O efeito era o contrário. Um número que ninguém
 *  consegue imaginar não é um pedido, é um muro: ele diz "isto nunca vai
 *  ficar pronto, e você não faz diferença".
 *
 *  E o pior deles era mentira útil de outra pessoa: 100% das obras estão
 *  sem `first_published`, porque o import trouxe o ano DA EDIÇÃO e nunca
 *  o ano DA OBRA. Pedir a 373 mil leitores que digitem à mão um ano que
 *  a Open Library já tem é pedir trabalho humano para tapar um buraco de
 *  máquina. Aquilo não era uma tarefa da comunidade: era uma tarefa
 *  nossa, com a roupa errada. Está anotada em docs/O-QUE-FALTA-NO-CODIGO.md.
 *
 *  ═══ POR QUE A SUA ESTANTE BASTA ═══
 *
 *  NÃO é porque as pessoas leem livros parecidos. Chegamos a escrever isso
 *  na tela, e era chute: a única medida que temos é de dados semeados, onde
 *  o script deu os mesmos livros a todo mundo. Não sabemos o tamanho da
 *  sobreposição entre estantes de verdade, e a tela não pode afirmar o que
 *  a gente não mediu.
 *
 *  A razão de verdade não depende de sobreposição nenhuma, e é mais forte
 *  por isso: as estantes são DIFERENTES. Cada pessoa que entra traz dezenas
 *  de livros que ninguém aqui tinha, e arruma os dela. O buraco não fecha
 *  porque todo mundo conserta o mesmo livro: fecha porque quase ninguém
 *  conserta o mesmo livro. É cobertura, e não coincidência.
 *
 *  E o que faz valer a pena é a permanência: o catálogo é compartilhado, e
 *  o conserto é para sempre. O livro que você arruma hoje já chega arrumado
 *  para a próxima pessoa que o pegar, mesmo que ela só apareça daqui a um
 *  ano. Isso é verdade com dez leitores e com dez mil.
 *
 *  Some-se a isso o acesso: esse livro está na sua mão, na sua casa. Você é
 *  a única pessoa no mundo que pode consertar aquilo agora, porque basta
 *  virar o livro e olhar a lombada.
 * ════════════════════════════════════════════════════════════════════
 */

export type Falta = {
  slug: string;
  title: string;
  author: string | null;
  /**
   * A capa, quando ela existe.
   *
   * Parece contraditório numa lista de "livros sem capa", e não é: um livro pode entrar
   * nesta lista por FALTAR A EDITORA e ter capa. E os que não têm capa nenhuma renderizam
   * a capa tipográfica do Gume — que é justamente o ponto. Numa grade de capas, o buraco
   * fica VISÍVEL, em vez de ser descrito por uma etiqueta cinza.
   *
   * Ver a nota no topo de app/o-que-falta/page.tsx.
   */
  coverUrl: string | null;
  /** O que falta nesta obra. Uma lista, porque pode faltar mais de uma coisa. */
  faltando: string[];
};

/**
 * Os livros DA SUA ESTANTE cuja ficha está incompleta.
 *
 * Capa e editora, e nada além disso: são os dois campos que se resolvem virando
 * o livro na mão. O ano da obra NÃO entra aqui, e a ausência dele é de propósito
 * (ver o comentário acima). Enquanto ele entrava, todo livro da estante caía
 * nesta lista, e o sinal de verdade afogava no ruído.
 */
export async function getOQueFalta(viewer: Viewer): Promise<Falta[]> {
  if (!viewer) return [];

  const meus = await db.execute<{
    slug: string; title: string; author: string | null; cover_url: string | null;
    sem_capa: boolean; sem_editora: boolean;
  }>(sql`
    select w.slug, w.title, a.name as author,
           (select e.cover_url from editions e
             where e.work_id = w.id and e.cover_url is not null
             order by e.created_at asc limit 1) as cover_url,
           not exists (select 1 from editions e
                        where e.work_id = w.id and e.cover_url is not null) as sem_capa,
           not exists (select 1 from editions e
                        where e.work_id = w.id and e.publisher is not null) as sem_editora
      from library_entries
      join works w on w.id = library_entries.work_id
      left join authors a on a.id = w.author_id
     where library_entries.user_id = ${viewer.id}::uuid
       and (
         not exists (select 1 from editions e
                      where e.work_id = w.id and e.cover_url is not null)
         or not exists (select 1 from editions e
                         where e.work_id = w.id and e.publisher is not null)
       )
     -- sem capa primeiro: é a falta que mais dói na tela, e a que só quem tem
     -- o livro na mão pode resolver de verdade
     order by (exists (select 1 from editions e
                        where e.work_id = w.id and e.cover_url is not null)),
              library_entries.added_at desc
     limit 40`);

  return meus.map((m) => ({
    slug: m.slug,
    title: m.title,
    author: m.author,
    coverUrl: m.cover_url,
    faltando: [
      m.sem_capa && "capa",
      m.sem_editora && "editora",
    ].filter(Boolean) as string[],
  }));
}

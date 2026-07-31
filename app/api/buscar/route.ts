import { NextResponse } from "next/server";
import { getViewer } from "@/lib/viewer";
import { RATES, limitar, quem, varrer } from "@/lib/rate-limit";
import { searchAll, searchAuthors, oAcervoTem } from "@/lib/catalog";
import { searchPeople } from "@/lib/people";
import { registrarBuscaVazia } from "@/lib/torneira";

/**
 * Search, as you type.
 *
 * Books AND people, in one answer, because a reader looking for a friend and a
 * reader looking for a book both start by typing a name. Making them choose a tab
 * first is making them answer a question the app should be able to work out.
 */
/**
 * Node, e não Edge: o limitador fala com o Postgres, e a busca fala com o Postgres. As
 * duas coisas morrem no Edge.
 */
export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 2) return NextResponse.json({ autores: [], livros: [], pessoas: [] });

  /**
   * ═══ O LIMITE DA BUSCA VEIO PARA CÁ ═══
   *
   * Ele morava no middleware, na memória do processo, que não conta nada com réplicas
   * (ver lib/rate-limit.ts), e a busca é a rota mais cara que existe aqui: cada tecla vira
   * um trigrama sobre 414 mil edições, e qualquer pessoa, sem conta nenhuma, pode
   * dispará-la num laço.
   *
   * É a porta mais barata de derrubar o app, e a que mais precisa de uma contagem que
   * atravesse instância.
   */
  const veredito = await limitar(`busca:${quem(req)}`, RATES.search);
  void varrer();

  if (!veredito.ok) {
    return NextResponse.json(
      { autores: [], livros: [], pessoas: [], demais: true },
      { status: 429, headers: { "retry-after": String(veredito.retryAfter) } },
    );
  }

  const viewer = await getViewer();

  // `?fora=1` é a SEGUNDA chamada, a que sai para a internet. A primeira devolve
  // só o nosso catálogo, em milissegundos, e é ela que aparece enquanto a pessoa
  // digita. Fonte externa não bloqueia tecla. Ver lib/catalog.ts.
  const fora = new URL(req.url).searchParams.get("fora") === "1";

  const [autores, livros, pessoas] = await Promise.all([
    // AUTORES é a primeira seção, e ela só existe quando o nome casa forte. Quem
    // digita "machado de assis" quer o autor, e não a biografia dele.
    fora ? Promise.resolve([]) : searchAuthors(q),
    searchAll(q, { fora }),
    // PESSOAS. Trigrama com unaccent, o mesmo do catálogo: perdoa acento E erro
    // de digitação. Antes era um LIKE, que perdoava só acento e varria a tabela
    // inteira a cada tecla. Ver lib/people.ts.
    searchPeople(viewer, q),
  ]);

  /**
   * ═══ A TORNEIRA ═══
   *
   * O pedido é anotado quando O NOSSO ACERVO não tem o livro — e NÃO só quando o
   * mundo inteiro não tem.
   *
   * A diferença é a razão de a fila existir. Alguém procura Harari; o Gume não tem
   * uma linha dele; o Google mostra vinte livros; a pessoa põe um na estante e vai
   * embora contente. Se a gente só anotasse o que ninguém tem, esse pedido sumiria —
   * e nunca ficaríamos sabendo que falta o Harari INTEIRO aqui dentro.
   *
   * A fila não é uma lista de livros que não existem. É a lista de autores que faltam
   * no acervo, e é dela que sai a ordem de qual trazer em seguida.
   *
   * `oAcervoTem` é a régua DURA (ver lib/catalog.ts): o trigrama perdoa demais, e
   * "berserk" devolve sete livros nossos sendo que não temos um. Perdoar é certo na
   * hora de MOSTRAR; na hora de CONCLUIR "já temos", é veneno — o leitor sai sem o
   * livro, e ninguém fica sabendo.
   *
   * E só a busca deliberada (`fora=1`) conta: "t", "to", "tol" voltam vazias no
   * caminho de "tolstoi", e a fila viraria um monte de pedaço de palavra.
   */
  if (fora && !oAcervoTem(q, livros)) {
    await registrarBuscaVazia(q);
  }

  return NextResponse.json({ autores, livros: livros.slice(0, 20), pessoas });
}

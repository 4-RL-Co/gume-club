import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, editions } from "@/lib/db/schema";
import { marcarPosse, getColecao, contarColecao, getMinhaCopia } from "@/lib/copies";
import { shelve } from "@/lib/library";

/**
 * ════════════════════════════════════════════════════════════════════
 *  TER NÃO É LER. Os dois eixos se cruzam, e nenhum contém o outro.
 *
 *  ═══ O QUE ISTO EXISTE PARA IMPEDIR ═══
 *
 *  O dono coleciona, e disse a frase que faltava: *"tem livros que eu li e não tenho
 *  na estante"*. O contrário também: livros que ele tem e não leu.
 *
 *  A tabela sempre separou as duas coisas. O que faltava era um jeito de dizer "eu
 *  tenho" — a única forma de nascer um exemplar era como efeito colateral de escrever
 *  a nota "de onde veio", e quem não contasse a história nunca registrava a posse.
 *
 *  ═══ O ERRO QUE ESTES TESTES BARRAM ═══
 *
 *  Amarrar um eixo no outro. Se marcar "tenho" mexesse na prateleira, um livro
 *  comprado e nunca aberto viraria "esperando" — uma INTENÇÃO DE LER que a pessoa
 *  nunca teve. É o que o app fazia antes, por não ter onde pôr a posse.
 *
 *  E o contrário é pior: se prateleirar mexesse na posse, o app afirmaria que a
 *  pessoa TEM um livro que ela leu emprestado. Inventar posse é inventar patrimônio.
 *
 *  Precisa de banco. O CI sobe um.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let leitor: string;
let outro: string;
let obraTenho: string;
let obraLi: string;
let edicao: string;

beforeAll(async () => {
  const mk = async (h: string) => {
    const [u] = await db.insert(users)
      .values({ handle: `${h}-${marca}`, email: `${h}-${marca}@col.test` })
      .returning({ id: users.id });
    return u!.id;
  };
  leitor = await mk("col-leitor");
  outro = await mk("col-outro");

  const obra = async (t: string) => {
    const [w] = await db.insert(works)
      .values({ slug: `col-${t}-${marca}`, title: `zz col ${t} ${marca}` })
      .returning({ id: works.id });
    return w!.id;
  };
  obraTenho = await obra("tenho");
  obraLi = await obra("li");

  const [e] = await db.insert(editions)
    .values({ workId: obraTenho, publisher: "Editora do Teste", publishedYear: 2020 })
    .returning({ id: editions.id });
  edicao = e!.id;
});

afterAll(async () => {
  for (const id of [leitor, outro]) await db.execute(sql`delete from users where id = ${id}::uuid`);
  await db.execute(sql`delete from works where slug like ${`col-%-${marca}`}`);
});

describe("a coleção é um eixo à parte da estante", () => {
  /** O caso do colecionador: o livro é meu e eu nunca o abri. */
  it("dá para TER um livro sem ele estar na prateleira", async () => {
    await marcarPosse({ id: leitor }, obraTenho, edicao, "owned");

    const [linha] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from library_entries
       where user_id = ${leitor}::uuid and work_id = ${obraTenho}::uuid`);
    expect(
      linha?.n,
      "marcar 'tenho' mexeu na prateleira: um livro comprado e nunca aberto vira uma " +
        "intenção de ler que a pessoa nunca teve.",
    ).toBe(0);

    const colecao = await getColecao({ id: leitor });
    expect(colecao.map((c) => c.slug)).toContain(`col-tenho-${marca}`);
  });

  /** E o oposto: li emprestado, não é meu. Inventar posse é inventar patrimônio. */
  it("dá para LER um livro sem tê-lo na coleção", async () => {
    await shelve({ id: leitor }, obraLi, "read");

    expect(
      await getMinhaCopia({ id: leitor }, obraLi),
      "prateleirar criou um exemplar: o app passa a afirmar que a pessoa TEM um livro " +
        "que ela leu emprestado.",
    ).toBeNull();
  });

  it("a tela sabe quantos você tem e ainda não leu", async () => {
    const contas = await contarColecao({ id: leitor });
    expect(contas.tenho).toBe(1);
    expect(contas.tenhoENaoLi, "a contagem que dá sentido à tela").toBe(1);

    // E quando o livro que eu tenho passa a ser lido, ele sai dessa conta.
    await shelve({ id: leitor }, obraTenho, "read");
    const depois = await contarColecao({ id: leitor });
    expect(depois.tenho, "ler um livro seu não pode tirá-lo da coleção").toBe(1);
    expect(depois.tenhoENaoLi, "o livro lido continuou contando como não lido").toBe(0);
  });

  /** Desmarcar APAGA: a ausência já diz "não tenho", e um terceiro estado seria uma
      linha por livro que ninguém tem, no acervo inteiro. */
  it("desmarcar apaga a linha em vez de gravar 'não tenho'", async () => {
    await marcarPosse({ id: leitor }, obraTenho, edicao, null);
    expect(await getMinhaCopia({ id: leitor }, obraTenho)).toBeNull();
    await marcarPosse({ id: leitor }, obraTenho, edicao, "owned");
  });

  /**
   * ═══ A COLEÇÃO É SUA, E DE MAIS NINGUÉM ═══
   *
   * A coluna `visibility` da tabela tem `public` como padrão, e nenhuma consulta a lê.
   * Se alguém "consertar" isso ligando a coluna, o app passa a publicar o que as
   * pessoas têm em casa sem ninguém ter escolhido.
   */
  it("ninguém vê a coleção de outra pessoa", async () => {
    const doOutro = await getColecao({ id: outro });
    expect(
      doOutro.length,
      "a coleção de um vazou para outra conta: 'o que eu tenho guardado' não é " +
        "'o que eu li', e nunca foi escolha de ninguém publicar isso.",
    ).toBe(0);
  });
});

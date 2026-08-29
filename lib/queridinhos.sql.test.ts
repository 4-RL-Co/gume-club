import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, ratings, editions, libraryEntries } from "@/lib/db/schema";
import { getQueridinhos } from "@/lib/queridinhos";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O TOP 100 CONTA O VEREDITO PRIVADO. E AS DUAS TELAS TÊM QUE CONCORDAR.
 *
 *  ═══ O BUG QUE ESTE ARQUIVO NASCE PARA IMPEDIR ═══
 *
 *  A lista contava só nota pública, e saía errada: a Saga de Njáll tinha dois
 *  "adorei", um deles privado, valia UM, e caía no desempate por título, atrás
 *  de livros com menos amor que ela. Quem viu não viu um bug: viu uma lista que
 *  parecia aleatória, que é como um ranking errado sempre se parece.
 *
 *  ═══ E A COROA TEM QUE BATER COM A LISTA ═══
 *
 *  A mesma conta existe em DOIS lugares: aqui e na página do livro
 *  (app/livro/[slug]/page.tsx), que desenha a coroa e a posição. São consultas
 *  de formatos diferentes (uma devolve a lista inteira, a outra um livro só com
 *  a posição), então não dá para ter uma função só sem piorar as duas.
 *
 *  O que dá é AMARRAR AS PONTAS: este teste lê o código da página e exige que a
 *  régua de visibilidade seja a mesma. No dia em que alguém "consertar" uma das
 *  duas, o build quebra em vez de o app passar a discordar de si mesmo em
 *  silêncio, que foi exatamente o que aconteceu aqui.
 *
 *  Precisa de banco. O CI sobe um.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados: string[] = [];
let obraAmada: string;
let obraMista: string;
let obraMorna: string;

beforeAll(async () => {
  const mk = async (h: string) => {
    const [u] = await db
      .insert(users)
      .values({ handle: `${h}-${marca}`, email: `${h}-${marca}@quer.test` })
      .returning({ id: users.id });
    criados.push(u!.id);
    return u!.id;
  };

  const ana = await mk("quer-ana");
  const bruno = await mk("quer-bruno");

  // Um título que começa com "zz" para os dois: assim, se a contagem empatar, o
  // desempate por título os joga para o FIM da lista, e um teste que dependesse
  // da ordem alfabética falharia de forma óbvia em vez de passar por sorte.
  const [amada] = await db
    .insert(works)
    .values({ slug: `quer-amada-${marca}`, title: `zz amada ${marca}` })
    .returning({ id: works.id });
  const [mista] = await db
    .insert(works)
    .values({ slug: `quer-mista-${marca}`, title: `zz mista ${marca}` })
    .returning({ id: works.id });
  const [morna] = await db
    .insert(works)
    .values({ slug: `quer-morna-${marca}`, title: `zz morna ${marca}` })
    .returning({ id: works.id });
  obraAmada = amada!.id;
  obraMista = mista!.id;
  obraMorna = morna!.id;

  await db.insert(ratings).values([
    // A AMADA tem dois "adorei", e UM DELES É PRIVADO. É o caso da Saga de Njáll.
    { userId: ana, workId: obraAmada, value: 5, visibility: "public" },
    { userId: bruno, workId: obraAmada, value: 5, visibility: "private" },
    /**
     * A MISTA tem um "adorei" e um "gostei", e é O CASO QUE O DONO VIU NA TELA:
     * o coração dela marcava DOIS e ela aparecia embaixo de livros com o coração
     * marcando UM, porque a ordem contava só os "adorei". Dois vereditos de 4 ou 5
     * valem dois votos, e ela passa na frente de quem tem um.
     */
    { userId: ana, workId: obraMista, value: 5, visibility: "public" },
    { userId: bruno, workId: obraMista, value: 4, visibility: "public" },
    // A MORNA tem um só, público.
    { userId: ana, workId: obraMorna, value: 5, visibility: "public" },
  ]);
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
  await db.execute(sql`delete from works where slug like ${`quer-%${marca}`}`);
});

describe("o veredito privado conta no Top 100", () => {
  it("um livro com dois adorei, um deles privado, vale DOIS", async () => {
    const lista = await getQueridinhos(1000);
    const amada = lista.find((l) => l.slug === `quer-amada-${marca}`);

    expect(amada, "a obra amada sumiu do top").toBeTruthy();
    expect(
      amada!.gostaram,
      "o adorei privado não foi contado: é o bug da Saga de Njáll de volta",
    ).toBe(2);
  });

  it("e ele fica ACIMA de um livro com um adorei só", async () => {
    const lista = await getQueridinhos(1000);
    const pos = (slug: string) => lista.findIndex((l) => l.slug === slug);

    const amada = pos(`quer-amada-${marca}`);
    const morna = pos(`quer-morna-${marca}`);

    expect(amada).toBeGreaterThan(-1);
    expect(morna).toBeGreaterThan(-1);
    expect(
      amada < morna,
      "o livro com dois adorei ficou abaixo do com um. A ordenação está por título, " +
        "e não por amor: é exatamente o sintoma que o leitor relatou.",
    ).toBe(true);
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  O NÚMERO DO CORAÇÃO É O NÚMERO QUE ORDENA.
   *
   *  A lista ordenava por "adorei" (5) e o card imprimia "gostaram ou adoraram"
   *  (4 ou 5). Ordenava por um número que não mostrava, e mostrava um que não
   *  ordenava nada. Um livro com um "adorei" e um "gostei" aparecia com o coração
   *  marcando DOIS, embaixo de livros com o coração marcando UM.
   *
   *  Estava certo pela régua velha e era ilegível para qualquer pessoa — inclusive
   *  para o dono, que escreveu a régua e mesmo assim leu a tela como todo mundo
   *  leria. Ninguém abre o código para entender uma lista: conclui que o app não
   *  sabe contar.
   *
   *  Este teste amarra as duas pontas de uma vez: o número exibido E a posição.
   * ════════════════════════════════════════════════════════════════════
   */
  it("um livro com um adorei e um gostei vale DOIS, e passa na frente de quem tem um", async () => {
    const lista = await getQueridinhos(1000);
    const mista = lista.find((l) => l.slug === `quer-mista-${marca}`);

    expect(mista, "a obra mista sumiu do top").toBeTruthy();
    expect(
      mista!.gostaram,
      "o 'gostei' não virou voto: o coração vai marcar dois e a posição valer um, " +
        "que é exatamente o que o dono viu na tela.",
    ).toBe(2);

    const pos = (slug: string) => lista.findIndex((l) => l.slug === slug);
    expect(
      pos(`quer-mista-${marca}`) < pos(`quer-morna-${marca}`),
      "o livro com dois votos ficou abaixo do com um voto. É o sintoma relatado: " +
        "coração 2 embaixo de coração 1.",
    ).toBe(true);
  });

  /**
   * ═══ ESTANTE NÃO SEGUIU O VEREDITO ═══
   *
   * A linha da decisão: veredito conta sempre, estante só se for pública. Se
   * alguém tirar o filtro das contagens de estante junto, passa a contar quantas
   * pessoas têm o livro numa estante PRIVADA, e isso é outra coisa: estante é um
   * lugar que pertence a alguém, e não uma opinião sobre o livro.
   */
  it("as contagens de ESTANTE continuam só sobre o que é público", () => {
    const src = readFileSync("lib/queridinhos.ts", "utf8");

    // O parêntese faz parte da busca de propósito: sem ele, "as estantes" casa
    // com a PROSA de um comentário ("em quantas estantes mora"), o teste examina
    // o pedaço errado do arquivo e falha por um motivo que não é o dele.
    for (const trecho of [") as leram", ") as estantes"]) {
      const fim = src.indexOf(trecho);
      expect(fim, `não achei a contagem que termina em "${trecho}"`).toBeGreaterThan(-1);
      const consulta = src.slice(Math.max(0, fim - 700), fim);
      expect(
        /visibility = 'public'/.test(consulta),
        `a contagem de "${trecho}" perdeu o filtro de visibilidade. Veredito conta ` +
          "sempre; estante é um lugar de alguém, e só entra se for pública.",
      ).toBe(true);
    }
  });

  /**
   * ═══ E A PÁGINA DO LIVRO USA A MESMA RÉGUA ═══
   *
   * A coroa e a posição são calculadas lá, numa consulta de outro formato. Duas
   * réguas diferentes fazem o app discordar de si mesmo: a lista põe o livro em
   * quinto, a página dele diz outra coisa, e o leitor conclui que os números são
   * inventados.
   */
  it("a página do livro não voltou a filtrar veredito por visibilidade", () => {
    const src = readFileSync("app/livro/[slug]/page.tsx", "utf8");

    const abre = src.indexOf("with publico as");
    const fecha = src.indexOf("group by r.work_id");
    // A TRAVA DA TRAVA: um indexOf que não acha devolve -1, o slice sai torto e o
    // teste aprova o que não leu. Já aconteceu neste repo mais de uma vez.
    expect(abre, "não achei a consulta da coroa: este teste está cego").toBeGreaterThan(-1);
    expect(fecha, "não achei o fim da consulta da coroa: este teste está cego").toBeGreaterThan(abre);

    expect(
      /r\.visibility = 'public'/.test(src.slice(abre, fecha)),
      "a página do livro voltou a contar só veredito público. A coroa dela vai " +
        "discordar da lista de /queridinhos, e ninguém vai entender por quê.",
    ).toBe(false);
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  AS DUAS TELAS ORDENAM PELO MESMO VOTO, E O VOTO É O NÚMERO EXIBIDO.
   *
   *  Aqui morava uma trava sobre "adoraram" e "gostaram" serem duas contagens que
   *  não podiam divergir em visibilidade. **Elas deixaram de ser duas.** O voto
   *  virou um número só (gostei ou adorei), justamente porque ter dois — um que
   *  ordenava e outro que aparecia — foi o que produziu o bug.
   *
   *  A trava troca de alvo em vez de ser apagada, e fica mais dura: as duas telas
   *  têm que usar o MESMO limiar, e nenhuma delas pode voltar a ordenar por
   *  "adorei" sozinho. Se uma voltar, a coroa da página do livro diz um número e a
   *  lista põe o livro noutro lugar.
   * ════════════════════════════════════════════════════════════════════
   */
  it("as duas telas contam o mesmo voto: gostei OU adorei", () => {
    const lista = readFileSync("lib/queridinhos.ts", "utf8");
    const pagina = readFileSync("app/livro/[slug]/page.tsx", "utf8");

    expect(
      /where r\.value >= 4/.test(lista),
      "a lista deixou de contar 'gostei ou adorei'. O card mostra esse número: se a " +
        "ordem usar outro, volta o coração 2 embaixo do coração 1.",
    ).toBe(true);

    expect(
      /count\(\*\) filter \(where r\.value >= 4\)/.test(pagina),
      "a página do livro deixou de contar 'gostei ou adorei'. A coroa e a posição " +
        "dela vão discordar da lista de /queridinhos.",
    ).toBe(true);

    // E ninguém voltou a ordenar por "adorei" sozinho, dos dois lados.
    for (const [nome, src] of [["a lista", lista], ["a página do livro", pagina]] as const) {
      expect(
        /r\.value = 5/.test(src),
        `${nome} voltou a contar só "adorei". O número impresso na tela é "gostaram ou ` +
          `adoraram": ordenar por outro faz a tela discordar de si mesma.`,
      ).toBe(false);
    }
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  A CAPA DO TOP 100 TAMBÉM É A DA EDIÇÃO MAIS TIDA. Mesma régua de
 *  lib/listas.ts, e o mesmo bug real que a motivou: "eu clico em romeu e
 *  julieta e aparece do clube de literatura clássica (CLC) [...] mas na
 *  lista aparecem outras capas" — o dono, ao ver /queridinhos.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a capa do Top 100 é a da edição mais tida, não a mais antiga", () => {
  const marcaCapa = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const gente: string[] = [];
  let obra: string;

  beforeAll(async () => {
    const mk = async (handle: string) => {
      const [u] = await db
        .insert(users)
        .values({ handle, email: `${handle}@queridinhos.test`, emailVerified: true })
        .returning({ id: users.id });
      gente.push(u!.id);
      return u!.id;
    };

    const quemAdora = await mk(`queridinhos-capa-adora-${marcaCapa}`);

    const [w] = await db
      .insert(works)
      .values({ slug: `queridinhos-capa-${marcaCapa}`, title: `A obra da capa disputada ${marcaCapa}` })
      .returning({ id: works.id });
    obra = w!.id;

    await db.insert(ratings).values({ userId: quemAdora, workId: obra, value: 5, visibility: "public" });

    // A ANTIGA entrou primeiro no catálogo, e é a que a régua velha escolheria —
    // mas ninguém tem ela na estante.
    const [ea] = await db
      .insert(editions)
      .values({ workId: obra, coverUrl: "https://covers.test/antiga.jpg", createdAt: new Date("2020-01-01") })
      .returning({ id: editions.id });

    // A POPULAR entrou depois, mas é a que duas pessoas têm.
    const [ep] = await db
      .insert(editions)
      .values({ workId: obra, coverUrl: "https://covers.test/popular.jpg", createdAt: new Date("2024-01-01") })
      .returning({ id: editions.id });

    for (let i = 0; i < 2; i++) {
      const leitor = await mk(`queridinhos-capa-leitor-${i}-${marcaCapa}`);
      await db.insert(libraryEntries).values({ userId: leitor, workId: obra, editionId: ep!.id });
    }
    // Referencia a ANTIGA só para o TypeScript não achar a variável morta —
    // ninguém a possui de propósito, e é esse o ponto do teste.
    expect(ea).toBeDefined();
  });

  afterAll(async () => {
    for (const id of gente) await db.execute(sql`delete from users where id = ${id}::uuid`);
    await db.execute(sql`delete from works where id = ${obra}::uuid`);
  });

  it("o Top 100 mostra a capa da edição mais tida, mesmo sendo a mais nova no catálogo", async () => {
    const [querido] = await getQueridinhos(100).then((lista) => lista.filter((q) => q.slug === `queridinhos-capa-${marcaCapa}`));
    expect(querido!.coverUrl).toBe("https://covers.test/popular.jpg");
  });
});

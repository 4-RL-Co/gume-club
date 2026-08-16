import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, collections, collectionItems } from "@/lib/db/schema";
import {
  getListasDe, getListasGuardadas, guardarLista, esquecerLista, jaGuardei,
  moverNaLista, numerarLista, descreverLista, getListasParaExplorar,
  porNaLista, tirarDaLista, quemGuardou,
} from "@/lib/listas";

/**
 * ════════════════════════════════════════════════════════════════════
 *  RED TEAM: A ESTANTE MONTADA, GUARDADA E ORDENADA. Contra Postgres de verdade.
 *
 *  Três promessas moram aqui:
 *
 *  1. VISIBILIDADE. Guardar uma estante privada de outra pessoa não guarda nada
 *     (o insert carrega o filtro dentro), e uma estante que ficou privada DEPOIS
 *     some da tela de quem guardou.
 *
 *  2. DONO. Só quem montou reordena, numera e descreve. O atacante que troca o
 *     UUID não mexe em nada, e nada é dito.
 *
 *  3. A LINHA DO CONTADOR, que MUDOU em 2026-07-28. Contar quem guardou uma
 *     estante passou a ser permitido (guardar não é curtir: ver lib/listas.ts);
 *     contar gente em volta de LEITURA continua proibido, e é o que o teste lá
 *     embaixo defende.
 * ════════════════════════════════════════════════════════════════════
 */

let atacante: { id: string };
let vitima: { id: string };
let obraA: string;
let obraB: string;
let listaPublica: string;
let listaPrivada: string;

const criados: string[] = [];
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

beforeAll(async () => {
  const mk = async (handle: string) => {
    const [u] = await db
      .insert(users)
      .values({ handle, email: `${handle}@listas.test`, emailVerified: true })
      .returning({ id: users.id });
    criados.push(u!.id);
    return { id: u!.id };
  };

  atacante = await mk(`listas-atacante-${marca}`);
  vitima = await mk(`listas-vitima-${marca}`);

  const [wa] = await db
    .insert(works)
    .values({ slug: `listas-a-${marca}`, title: `O primeiro da lista ${marca}` })
    .returning({ id: works.id });
  const [wb] = await db
    .insert(works)
    .values({ slug: `listas-b-${marca}`, title: `O segundo da lista ${marca}` })
    .returning({ id: works.id });
  obraA = wa!.id;
  obraB = wb!.id;

  const [pub] = await db
    .insert(collections)
    .values({ userId: vitima.id, slug: `boas-${marca}`, name: "As boas", visibility: "public" })
    .returning({ id: collections.id });
  const [priv] = await db
    .insert(collections)
    .values({ userId: vitima.id, slug: `secretas-${marca}`, name: "As secretas", visibility: "private" })
    .returning({ id: collections.id });
  listaPublica = pub!.id;
  listaPrivada = priv!.id;

  await db.insert(collectionItems).values([
    { collectionId: listaPublica, workId: obraA, position: 1 },
    { collectionId: listaPublica, workId: obraB, position: 2 },
    { collectionId: listaPrivada, workId: obraA, position: 1 },
  ]);
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
  await db.execute(sql`delete from works where id = any(${sql.param([obraA, obraB])}::uuid[])`);
});

// ─────────────────────────────────────────────── visibilidade: o que se guarda

describe("guardar respeita a visibilidade, no SQL", () => {
  it("guardar a estante PÚBLICA de outra pessoa funciona, e aparece no perfil de quem guardou", async () => {
    await guardarLista(atacante, listaPublica);
    expect(await jaGuardei(atacante, listaPublica)).toBe(true);

    const guardadas = await getListasGuardadas(null, atacante.id);
    expect(guardadas.map((l) => l.id)).toContain(listaPublica);
    // O crédito é de quem montou, pelo nome.
    expect(guardadas[0]!.dono.handle).toBe(`listas-vitima-${marca}`);
  });

  it("guardar a estante PRIVADA de outra pessoa não guarda nada, e nada é dito", async () => {
    await guardarLista(atacante, listaPrivada);
    expect(await jaGuardei(atacante, listaPrivada)).toBe(false);
  });

  it("uma estante que ficou privada DEPOIS de guardada some da tela de quem guardou", async () => {
    await db.execute(sql`
      update collections set visibility = 'private' where id = ${listaPublica}::uuid`);

    const guardadas = await getListasGuardadas(null, atacante.id);
    expect(
      guardadas.map((l) => l.id),
      "a estante privada continuou na tela de quem guardou: o vínculo venceu a visibilidade",
    ).not.toContain(listaPublica);

    // De volta ao público para os próximos testes.
    await db.execute(sql`
      update collections set visibility = 'public' where id = ${listaPublica}::uuid`);
  });

  it("um estranho vê só as estantes públicas de alguém; o dono vê todas", async () => {
    const deFora = await getListasDe(atacante, vitima.id);
    expect(deFora.map((l) => l.id)).toContain(listaPublica);
    expect(deFora.map((l) => l.id)).not.toContain(listaPrivada);

    const deDentro = await getListasDe(vitima, vitima.id);
    expect(deDentro.map((l) => l.id)).toContain(listaPrivada);
  });

  it("esquecer apaga o gesto, e só o gesto", async () => {
    await esquecerLista(atacante, listaPublica);
    expect(await jaGuardei(atacante, listaPublica)).toBe(false);
  });
});

// ─────────────────────────────────────────────── dono: quem mexe na ordem

describe("IDOR: o atacante tenta mexer na estante da vítima", () => {
  it("não reordena a estante de outra pessoa", async () => {
    await moverNaLista(atacante, listaPublica, obraB, "subir");

    const [primeiro] = await db.execute<{ work_id: string }>(sql`
      select work_id from collection_items
       where collection_id = ${listaPublica}::uuid
       order by position asc limit 1`);
    expect(primeiro!.work_id, "o atacante reordenou a lista da vítima").toBe(obraA);
  });

  it("não numera nem descreve a estante de outra pessoa", async () => {
    await numerarLista(atacante, listaPublica, true);
    await descreverLista(atacante, listaPublica, "vandalismo");

    const [l] = await db.execute<{ ranked: boolean; description: string | null }>(sql`
      select ranked, description from collections where id = ${listaPublica}::uuid`);
    expect(l!.ranked).toBe(false);
    expect(l!.description).toBeNull();
  });

  it("e o dono reordena a própria: o segundo sobe para primeiro", async () => {
    await moverNaLista(vitima, listaPublica, obraB, "subir");

    const [primeiro] = await db.execute<{ work_id: string }>(sql`
      select work_id from collection_items
       where collection_id = ${listaPublica}::uuid
       order by position asc limit 1`);
    expect(primeiro!.work_id).toBe(obraB);
  });
});

// ──────────────────────────────── a contagem existe, e a LISTA continua sendo do dono

/**
 * ════════════════════════════════════════════════════════════════════
 *  A REGRA MUDOU, E O TESTE MUDOU DE ALVO EM VEZ DE SUMIR.
 *
 *  Aqui morava "guardar nunca vira número": nenhuma consulta podia contar
 *  `collection_saves`. O dono reverteu em 2026-07-28, e o argumento está no
 *  cabeçalho de lib/listas.ts: guardar não é curtir, e curadoria é o que este
 *  produto quer incentivar.
 *
 *  ═══ APAGAR O TESTE SERIA O ERRO ═══
 *
 *  Uma trava que some numa reversão deixa a regra NOVA sem defesa nenhuma, e a
 *  regra nova é mais difícil de acertar do que a antiga, porque ela tem uma
 *  linha no meio em vez de um "não" inteiro:
 *
 *      contar QUEM GUARDOU uma estante  → pode (curadoria é pública por natureza)
 *      contar gente em volta de LEITURA → não  (resenha, seguidor, quem leu o quê)
 *
 *  Então o teste virou a defesa dessa linha, e ele é mais útil agora do que era.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a linha entre contar curadoria e contar leitura", () => {
  it("o card carrega a contagem de quem guardou", async () => {
    const listas = await getListasDe(vitima, vitima.id);
    expect(listas.length).toBeGreaterThan(0);
    for (const l of listas) {
      expect(Object.keys(l).sort()).toEqual(
        ["capas", "description", "dono", "guardadas", "id", "livros", "name", "ranked", "slug"],
      );
      expect(typeof l.guardadas).toBe("number");
    }
  });

  /**
   * O teste guarda e desguarda DENTRO dele.
   *
   * A primeira versão se apoiava no gesto de um teste lá de cima ("o atacante
   * guardou a pública"), e outro teste no meio do caminho desfaz esse gesto. Um
   * teste que depende da ordem em que os vizinhos rodam falha por um motivo que
   * não é o dele, e treina a pessoa a ignorar o vermelho.
   */
  it("a contagem é a verdade: um gesto entra, e ela sobe", async () => {
    const antes = (await getListasDe(vitima, vitima.id))
      .find((l) => l.id === listaPublica)!.guardadas;

    await guardarLista(atacante, listaPublica);

    const depois = (await getListasDe(vitima, vitima.id))
      .find((l) => l.id === listaPublica)!.guardadas;
    expect(depois).toBe(antes + 1);

    await esquecerLista(atacante, listaPublica);
    const voltou = (await getListasDe(vitima, vitima.id))
      .find((l) => l.id === listaPublica)!.guardadas;
    expect(voltou).toBe(antes);
  });

  /**
   * E O QUE CONTINUA PROIBIDO. A lista é de tabelas de LEITURA: contar gente em
   * volta delas é o contador de curtida que o README recusa, e ele recusa até
   * hoje. Se um count sobre uma destas nascer neste módulo, o build quebra.
   */
  it("nenhuma consulta deste módulo conta gente em volta de leitura", () => {
    const src = readFileSync("lib/listas.ts", "utf8");
    const DE_LEITURA = ["reviews", "ratings", "follows", "library_entries", "readings"];

    for (const bloco of src.split(/\bsql`/).slice(1)) {
      const consulta = bloco.split("`")[0] ?? "";
      for (const tabela of DE_LEITURA) {
        if (!new RegExp(`\\b${tabela}\\b`).test(consulta)) continue;
        expect(
          /count\s*\(/i.test(consulta),
          `uma consulta conta em volta de ${tabela}. Curadoria contada é sinal; ` +
            "leitura contada é curtida com outro nome, e essa recusa continua de pé.",
        ).toBe(false);
      }
    }
  });

  /**
   * O FORMATO do que o explorar devolve, exercitando a função de verdade.
   *
   * Ele existia antes e saiu junto com a regra antiga na primeira versão desta
   * reescrita. Apagar cobertura de tabela junto com uma regra revertida é como
   * se perde teste sem ninguém decidir perder: a estante da vítima pode nem
   * aparecer (o corte é três livros), e o que se afirma é a forma, seja de quem for.
   */
  it("o explorar devolve estantes com capas, dono e a contagem", async () => {
    const listas = await getListasParaExplorar(null, 6);
    for (const l of listas) {
      expect(Object.keys(l).sort()).toEqual(
        ["capas", "description", "dono", "guardadas", "id", "livros", "name", "ranked", "slug"],
      );
    }
  });

  it("o explorar não ordena por popularidade, mesmo agora que o número existe", () => {
    const src = readFileSync("lib/listas.ts", "utf8");
    const explorar = src.slice(src.indexOf("getListasParaExplorar"));
    const consulta = explorar.slice(0, explorar.indexOf("}"));

    expect(
      /order by[^`]*guardadas|order by[^`]*collection_saves/i.test(consulta),
      "o explorar passou a ordenar por quantos guardaram. Contar é uma coisa; " +
        "RANQUEAR gente por popularidade é a corrida que o produto recusa. O sorteio " +
        "existe para dar vez a todo mundo.",
    ).toBe(false);
  });
});

// ──────────────────────────────────────────── pôr um livro: o dono, e o FIM da fila

/**
 * ════════════════════════════════════════════════════════════════════
 *  PÔR UM LIVRO NA ESTANTE.
 *
 *  ═══ O TESTE QUE IMPORTA AQUI É O DA POSIÇÃO ═══
 *
 *  A estante é lida em `position asc, added_at asc`, e a coluna nasce ZERO por
 *  padrão. Quem ordena a mão fica com 1, 2, 3. Então um insert que aceitasse o
 *  padrão poria o livro novo em ZERO, e ele PULARIA PARA O PRIMEIRO LUGAR, por
 *  cima da curadoria, sem nada na tela dizendo isso.
 *
 *  Era exatamente o que `toggleInCollection` fazia (a porta da página do livro),
 *  e ninguém tinha percebido porque a ordenação só fica visível numa estante
 *  numerada com três livros ou mais.
 *
 *  Um teste de "entrou na estante?" passaria feliz com o bug inteiro de pé. É a
 *  ORDEM que precisa ser afirmada.
 * ════════════════════════════════════════════════════════════════════
 */
describe("pôr um livro na estante", () => {
  it("o livro novo entra no FIM, e não por cima da ordem de quem montou", async () => {
    const [nova] = await db
      .insert(works)
      .values({ slug: `listas-c-${marca}`, title: `O terceiro da lista ${marca}` })
      .returning({ id: works.id });

    /**
     * A ordem de ANTES é lida, e não suposta: um teste acima neste arquivo
     * reordena esta mesma estante, e cravar `[obraA, obraB]` aqui amarraria este
     * teste à ordem em que o vitest resolve rodar os outros. O que se afirma é a
     * PROPRIEDADE ("o novo vai para o fim"), e ela não depende de qual era o fim.
     */
    const ordemDe = async () =>
      (await db.execute<{ work_id: string; position: number }>(sql`
        select work_id, position from collection_items
         where collection_id = ${listaPublica}::uuid
         order by position asc, added_at asc`));

    const antes = await ordemDe();
    expect(await porNaLista(vitima, listaPublica, nova!.id)).toBe(true);
    const depois = await ordemDe();

    expect(depois.map((o) => o.work_id)).toEqual([
      ...antes.map((o) => o.work_id),
      nova!.id,
    ]);
    // E a posição é a próxima de verdade, e não um zero que se disfarça de ordem.
    expect(depois.at(-1)!.position).toBe(Math.max(...antes.map((o) => o.position)) + 1);

    await db.execute(sql`delete from works where id = ${nova!.id}::uuid`);
  });

  it("pôr duas vezes não duplica, e a segunda diz que já estava lá", async () => {
    expect(await porNaLista(vitima, listaPublica, obraA)).toBe(false);

    const quantas = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from collection_items
       where collection_id = ${listaPublica}::uuid and work_id = ${obraA}::uuid`);
    expect(quantas[0]!.n).toBe(1);
  });

  /**
   * O CAMINHO DO ATACANTE, e ele é o de sempre: trocar o UUID da estante no
   * corpo da requisição pela estante de outra pessoa. Nada acontece, e nada é
   * dito (contar que a estante existe já seria contar demais).
   */
  it("pôr um livro na estante de OUTRA pessoa não põe nada", async () => {
    const antes = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from collection_items where collection_id = ${listaPublica}::uuid`);

    expect(await porNaLista(atacante, listaPublica, obraB)).toBe(false);

    const depois = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from collection_items where collection_id = ${listaPublica}::uuid`);
    expect(depois[0]!.n).toBe(antes[0]!.n);
  });

  it("uma obra que não existe não vira linha na estante", async () => {
    const fantasma = "00000000-0000-4000-8000-000000000000";
    expect(await porNaLista(vitima, listaPublica, fantasma)).toBe(false);
  });
});

// ────────────────────────────── tirar um livro: o dono, e só dele fica de fato fora

/**
 * ════════════════════════════════════════════════════════════════════
 *  TIRAR UM LIVRO DA ESTANTE. "Não achei como tirar um livro da minha
 *  lista por dentro da página da lista" — só dava pela ficha do livro.
 * ════════════════════════════════════════════════════════════════════
 */
describe("tirar um livro da estante", () => {
  it("o atacante não tira nada da lista da vítima", async () => {
    await tirarDaLista(atacante, listaPublica, obraA);

    const quantas = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from collection_items
       where collection_id = ${listaPublica}::uuid and work_id = ${obraA}::uuid`);
    expect(quantas[0]!.n, "o atacante tirou um livro da lista de outra pessoa").toBe(1);
  });

  it("o dono tira, e o livro some da lista", async () => {
    await tirarDaLista(vitima, listaPrivada, obraA);

    const quantas = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from collection_items
       where collection_id = ${listaPrivada}::uuid and work_id = ${obraA}::uuid`);
    expect(quantas[0]!.n).toBe(0);
  });

  it("tirar de novo não quebra: já não estava lá", async () => {
    await expect(tirarDaLista(vitima, listaPrivada, obraA)).resolves.toBeUndefined();
  });
});

// ───────────────────────────────── quem guardou: o número é de todos, a lista não

/**
 * ════════════════════════════════════════════════════════════════════
 *  A LISTA DE QUEM GUARDOU É SÓ DE QUEM MONTOU. E É AQUI QUE SE PROVA.
 *
 *  O número virou público em 2026-07-28. A LISTA não, e a diferença não é
 *  capricho: guardar é um gesto público no perfil de QUEM GUARDA (a estante
 *  aparece lá, com crédito de quem fez). Virar linha numa lista de "quem endossa
 *  a curadoria de fulano", na tela de fulano, é outra coisa, e ninguém
 *  consentiu com ela ao clicar em guardar.
 *
 *  É o mesmo desenho de "quem entrou pelo seu link", no perfil: rostos, e só
 *  para você.
 *
 *  A falha que este teste existe para pegar é a de sempre: alguém troca o UUID
 *  da estante no corpo da requisição pela estante de outra pessoa e recebe a
 *  lista de quem a guardou. A defesa é no SQL, e devolve VAZIO em vez de erro:
 *  um erro contaria que a estante existe e tem gente dentro.
 * ════════════════════════════════════════════════════════════════════
 */
describe("quem guardou", () => {
  it("quem montou vê os rostos", async () => {
    await guardarLista(atacante, listaPublica);

    const quem = await quemGuardou(vitima, listaPublica);
    expect(quem.map((q) => q.handle)).toContain(`listas-atacante-${marca}`);
  });

  it("IDOR: quem NÃO montou recebe lista vazia, e não um erro", async () => {
    // O atacante pede a lista da estante da vítima, que ele mesmo guardou.
    expect(await quemGuardou(atacante, listaPublica)).toEqual([]);
  });

  it("anônimo não recebe nada", async () => {
    expect(await quemGuardou(null, listaPublica)).toEqual([]);

    await esquecerLista(atacante, listaPublica);
  });

  /**
   * E QUEM SUMIU DO GUME SOME DAQUI. Banido ou conta apagada não aparece na
   * lista de ninguém, como em toda leitura de gente deste projeto.
   */
  it("banido não aparece entre os rostos", async () => {
    await guardarLista(atacante, listaPublica);
    await db.execute(sql`
      update users set banned_at = now() where id = ${atacante.id}::uuid`);

    expect(await quemGuardou(vitima, listaPublica)).toEqual([]);

    await db.execute(sql`update users set banned_at = null where id = ${atacante.id}::uuid`);
    await esquecerLista(atacante, listaPublica);
  });
});

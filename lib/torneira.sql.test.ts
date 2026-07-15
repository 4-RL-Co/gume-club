import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Forbidden } from "@/lib/authz";
import {
  registrarBuscaVazia, getFila, atender, reabrir, podeVerAFila, quantosPedidosAbertos,
} from "@/lib/torneira";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A TORNEIRA. Contra o Postgres de verdade.
 *
 *  O acervo do Gume é escolhido a mão, e isso só é honesto se ele puder
 *  crescer quando alguém quiser um livro que ele não tem. A fila de pedidos
 *  é essa promessa virada trabalho — e ela tem duas formas de apodrecer:
 *
 *  1. VIRAR RUÍDO. Se "Tolstói", "tolstoi" e "TOLSTOI " forem três pedidos
 *     em vez de um, a fila enche de repetição e o pedido de verdade afunda.
 *
 *  2. VIRAR VIGILÂNCIA. A tabela não tem `user_id`, e a falta dele é a
 *     decisão. Este arquivo confere que ela continua não tendo: uma coluna
 *     que não existe não vaza, e é a única garantia que não depende de
 *     alguém lembrar.
 * ════════════════════════════════════════════════════════════════════
 */

const criados: string[] = [];
const marca = Date.now().toString(36);

let leitor: { id: string };
let biblio: { id: string };
let mod: { id: string };

async function criar(handle: string) {
  const [u] = await db
    .insert(users)
    .values({ handle: `${handle}-${marca}`, email: `${handle}-${marca}@teste.local` })
    .returning({ id: users.id });
  criados.push(u!.id);
  return { id: u!.id };
}

beforeAll(async () => {
  leitor = await criar("torn-leitor");
  biblio = await criar("torn-biblio");
  mod = await criar("torn-mod");

  await db.execute(sql`update users set librarian_tier = 1 where id = ${biblio.id}::uuid`);
  await db.execute(sql`update users set moderator_at = now() where id = ${mod.id}::uuid`);
});

afterAll(async () => {
  await db.execute(sql`delete from buscas_vazias where texto like ${"%" + marca + "%"}`);
  await db.execute(sql`delete from buscas_vazias where canonico like ${marca.toLowerCase() + "%"}`);
  for (const id of criados) {
    await db.execute(sql`delete from users where id = ${id}::uuid`);
  }
  await db.execute(sql`delete from users where email like '%@teste.local'`);
});

describe("o mesmo pedido, escrito de três jeitos, é UM pedido", () => {
  it("acento, maiúscula e espaço sobrando não criam pedido novo", async () => {
    const nome = `Tolstói ${marca}`;

    await registrarBuscaVazia(nome);
    await registrarBuscaVazia(nome.toUpperCase());
    await registrarBuscaVazia(`  tolstoi   ${marca}  `);

    const [r] = await db.execute<{ n: number; quantas: number }>(sql`
      select count(*)::int as n, max(quantas)::int as quantas
        from buscas_vazias
       where canonico like ${"%" + marca.toLowerCase() + "%"}`);

    expect(
      r!.n,
      "o mesmo pedido virou mais de uma linha. A fila vai encher de repetição, e o " +
        "pedido de verdade afunda no meio.",
    ).toBe(1);
    expect(r!.quantas, "o contador não somou os três pedidos").toBe(3);
  });

  it("um pedido curto demais não é um pedido", async () => {
    await registrarBuscaVazia("de");
    await registrarBuscaVazia("o");

    const [r] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from buscas_vazias where canonico in ('de', 'o')`);

    expect(r!.n, '"de" e "o" não são livros').toBe(0);
  });

  it("anotar um pedido NUNCA derruba a busca de quem está procurando", async () => {
    /**
     * Texto vazio, texto gigante, lixo. Nada disto pode levantar: a pessoa está
     * tentando achar um livro, e o nosso caderninho é problema nosso.
     *
     * O texto gigante leva a MARCA do teste dentro dele. Sem isso, ele não casa com o
     * `delete` do afterAll e VAZA para o banco de desenvolvimento — foi o que
     * aconteceu, e cinco mil letras "x" foram parar na fila de pedidos de verdade.
     * Um teste que suja o banco de quem está trabalhando é um teste que ninguém
     * confia.
     */
    await expect(registrarBuscaVazia("")).resolves.toBeUndefined();
    await expect(registrarBuscaVazia(`${marca} ${"x".repeat(5000)}`)).resolves.toBeUndefined();
  });
});

describe("a fila é de quem cuida do acervo", () => {
  it("o bibliotecário vê", async () => {
    expect(await podeVerAFila(biblio)).toBe(true);
    await expect(getFila(biblio)).resolves.toBeInstanceOf(Array);
  });

  it("o moderador vê", async () => {
    expect(await podeVerAFila(mod)).toBe(true);
  });

  it("o leitor comum NÃO vê, e o deslogado também não", async () => {
    /**
     * Não é segredo: é que "os livros que o Gume não tem" é uma lista que não ajuda
     * ninguém a ler. Numa tela de leitor ela só faria uma coisa — virar vitrine de
     * mais procurados, que é exatamente o que ela não é.
     */
    expect(await podeVerAFila(leitor)).toBe(false);
    await expect(getFila(leitor)).rejects.toThrow(Forbidden);
    await expect(getFila(null)).rejects.toThrow();

    expect(await quantosPedidosAbertos(leitor)).toBe(0);
    expect(await quantosPedidosAbertos(null)).toBe(0);
  });

  it("um leitor comum não fecha nem reabre pedido", async () => {
    await registrarBuscaVazia(`Kentaro Miura ${marca}`);
    const [p] = await getFila(biblio);
    expect(p).toBeDefined();

    await expect(atender(leitor, p!.id)).rejects.toThrow(Forbidden);
    await expect(reabrir(leitor, p!.id)).rejects.toThrow(Forbidden);
  });
});

describe("o pedido atendido não é apagado: ele vira uma data", () => {
  it("atender tira da fila, e reabrir devolve", async () => {
    const texto = `Vagabond ${marca}`;
    await registrarBuscaVazia(texto);

    const antes = (await getFila(biblio)).find((p) => p.texto === texto);
    expect(antes, "o pedido não entrou na fila").toBeDefined();

    await atender(biblio, antes!.id);
    expect(
      (await getFila(biblio)).find((p) => p.id === antes!.id),
      "o pedido atendido continua na fila",
    ).toBeUndefined();

    // Não foi apagado. A fila resolvida é a única memória de como o acervo cresceu.
    const [ainda] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from buscas_vazias where id = ${antes!.id}::uuid`);
    expect(ainda!.n, "atender APAGOU o pedido. Ele devia virar uma data.").toBe(1);

    await reabrir(biblio, antes!.id);
    expect(
      (await getFila(biblio)).find((p) => p.id === antes!.id),
      "reabrir não devolveu o pedido para a fila",
    ).toBeDefined();
  });

  it("pedir de novo o que foi atendido REABRE o pedido", async () => {
    /**
     * Se o livro que a gente importou fosse o que a pessoa queria, ela não estaria
     * procurando de novo. Um pedido que volta é um pedido que não foi atendido.
     */
    const texto = `Berserk ${marca}`;
    await registrarBuscaVazia(texto);

    const p = (await getFila(biblio)).find((x) => x.texto === texto)!;
    await atender(biblio, p.id);

    await registrarBuscaVazia(texto);

    expect(
      (await getFila(biblio)).find((x) => x.id === p.id),
      "alguém procurou de novo e o pedido continuou marcado como atendido",
    ).toBeDefined();
  });
});

describe("a fila não guarda quem procurou", () => {
  it("a tabela não tem coluna de usuário, e não pode ganhar uma", async () => {
    /**
     * Para escolher o próximo autor a importar basta saber O QUE pediram e QUANTAS
     * VEZES. Saber QUEM pediu não muda a escolha — e cria, de graça, um histórico de
     * busca por pessoa: a coisa que ninguém pediu e que todo mundo odeia descobrir
     * que existe.
     *
     * `atendida_por` é outra coisa: é quem FECHOU o pedido, e é um registro de
     * trabalho, não de leitura.
     */
    const cols = await db.execute<{ column_name: string }>(sql`
      select column_name from information_schema.columns
       where table_name = 'buscas_vazias'`);

    const nomes = cols.map((c) => c.column_name);
    const suspeitos = nomes.filter(
      (n) => /user|usuario|viewer|leitor|quem|ip|session/i.test(n) && n !== "atendida_por",
    );

    expect(
      suspeitos,
      `a tabela de buscas vazias ganhou uma coluna que aponta para uma PESSOA: ` +
        `${suspeitos.join(", ")}. Isso transforma a lista de compras do acervo num ` +
        "histórico de busca por leitor. Uma coluna que não existe não vaza.",
    ).toEqual([]);
  });
});

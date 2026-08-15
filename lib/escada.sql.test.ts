import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, authors, editions, libraryEntries } from "@/lib/db/schema";
import { getEscadas, degrauNovo, getCoroasDe } from "@/lib/escada";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A ESCADA, COM PÁGINAS DE VERDADE.
 *
 *  "A honra é a coisa mais pública que o Gume mostra sobre uma pessoa" — o mesmo
 *  motivo de lib/fundir-obras.sql.test.ts existir contra o Postgres de verdade, e
 *  não contra uma ideia de Postgres: a soma de páginas atravessa duas tabelas
 *  (library_entries, editions) com um coalesce de três níveis, e é exatamente o
 *  tipo de conta que passa limpa contra um mock e quebra em produção.
 * ════════════════════════════════════════════════════════════════════
 */
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const lixo = { obras: [] as string[], gente: [] as string[] };
let autor: string;
let n = 0;

const novoLivro = async (paginas: number | null) => {
  const [w] = await db
    .insert(works)
    .values({ title: `Escada ${marca} ${++n}`, authorId: autor, slug: `escada-${marca}-${n}` })
    .returning({ id: works.id });
  lixo.obras.push(w!.id);
  await db.insert(editions).values({ workId: w!.id, pageCount: paginas });
  return w!.id;
};

const novoLeitor = async (apelido: string) => {
  const [u] = await db
    .insert(users)
    .values({ handle: `${apelido}-${marca}`, email: `${apelido}-${marca}@es.test` })
    .returning({ id: users.id });
  lixo.gente.push(u!.id);
  return u!.id;
};

const marcarLido = (userId: string, workId: string) =>
  db.insert(libraryEntries).values({ userId, workId, status: "read" });

beforeAll(async () => {
  const [a] = await db
    .insert(authors)
    .values({ name: `Autor Escada ${marca}`, slug: `autor-escada-${marca}` })
    .returning({ id: authors.id });
  autor = a!.id;
});

afterAll(async () => {
  if (lixo.obras.length) await db.execute(sql`delete from works where id = any(${sql.param(lixo.obras)}::uuid[])`);
  if (lixo.gente.length) await db.execute(sql`delete from users where id = any(${sql.param(lixo.gente)}::uuid[])`);
  await db.execute(sql`delete from authors where id = ${autor}::uuid`);
});

describe("getEscadas soma páginas de verdade, e escolhe o caminho melhor", () => {
  it("cinco livros pequenos e um piso batido pelas duas réguas ao mesmo tempo", async () => {
    const leitor = await novoLeitor("gordo");

    // Quatro livros de 50 páginas: 4 leituras, 200 páginas — nem perto do Bronze
    // (piso: 5 leituras, ou 1.500 páginas) por nenhuma das duas réguas.
    for (let i = 0; i < 4; i++) {
      await marcarLido(leitor, await novoLivro(50));
    }
    // O quinto fecha as DUAS réguas ao mesmo tempo: a quinta leitura bate o piso
    // de livros, e as 4.000 páginas dele sozinho já passam o piso de páginas.
    await marcarLido(leitor, await novoLivro(4000));

    const { posicao } = await getEscadas(leitor);
    expect(posicao.livros).toBe(5);
    expect(posicao.paginas).toBe(4200);
    expect(posicao.honra).toBe("bronze");
  });

  it("dois livros gigantes sobem mais que catorze pequenos — só a página levou até lá", async () => {
    const leitor = await novoLeitor("tijolo");

    // Só DOIS livros: livros=2 nem chega perto do Bronze (piso: 5). Mas
    // 4.000 + 4.000 = 8.000 páginas já passa o piso de Prata (4.500) inteiro.
    await marcarLido(leitor, await novoLivro(4000));
    await marcarLido(leitor, await novoLivro(4000));

    const { posicao } = await getEscadas(leitor);
    expect(posicao.livros).toBe(2);
    expect(posicao.paginas).toBe(8000);
    expect(posicao.via, "a régua de livros nem chegou ao Bronze — só a página venceu").toBe("paginas");
    expect(posicao.honra).toBe("prata");
  });

  it("edição sem página cadastrada soma zero, e não derruba a conta", async () => {
    const leitor = await novoLeitor("semdados");
    await marcarLido(leitor, await novoLivro(null));
    await marcarLido(leitor, await novoLivro(300));

    const { posicao } = await getEscadas(leitor);
    expect(posicao.livros).toBe(2);
    expect(posicao.paginas).toBe(300);
  });
});

describe("degrauNovo detecta a subida pela página, não só pelo livro", () => {
  it("um livro gigante sobe de degrau mesmo sem completar o piso de leituras", async () => {
    const leitor = await novoLeitor("monte-cristo");

    // Duas leituras pequenas: livros=2, páginas=100. Nem perto do Bronze por
    // nenhuma régua.
    await marcarLido(leitor, await novoLivro(50));
    await marcarLido(leitor, await novoLivro(50));
    expect((await getEscadas(leitor)).posicao.honra).toBe("ferro");

    // A terceira é o Conde de Monte Cristo: 1.400 páginas. livros vira 3 (Bronze
    // pede 5: continua Ferro por essa régua) — mas páginas vira 1.500, exatamente
    // o piso do Bronze.
    const grande = await novoLivro(1400);
    await marcarLido(leitor, grande);

    const honra = await degrauNovo(leitor, grande);
    expect(honra, "devia anunciar a subida para bronze, pela página").toBe("bronze");

    const depois = await getEscadas(leitor);
    expect(depois.posicao.honra).toBe("bronze");
    expect(depois.posicao.via).toBe("paginas");
  });

  it("livro sem página não quebra a detecção, e não sobe sozinho", async () => {
    const leitor = await novoLeitor("sem-pagina-2");
    const livro = await novoLivro(null);
    await marcarLido(leitor, livro);

    await expect(degrauNovo(leitor, livro)).resolves.toBeNull();
  });
});

describe("getCoroasDe também soma páginas, no caminho em lote", () => {
  it("a coroa em lote bate com a coroa individual", async () => {
    const leitor = await novoLeitor("lote");
    await marcarLido(leitor, await novoLivro(4000));
    await marcarLido(leitor, await novoLivro(4000));

    const individual = await getEscadas(leitor);
    const lote = await getCoroasDe([leitor]);

    expect(lote[leitor]).toEqual(individual.coroa);
  });
});

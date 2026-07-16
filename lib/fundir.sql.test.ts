import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, authors } from "@/lib/db/schema";
import { fundirAutores, homonimoDe } from "@/lib/corrections";
import { Forbidden } from "@/lib/authz";

/**
 * ════════════════════════════════════════════════════════════════════
 *  DOIS AUTORES QUE SÃO A MESMA PESSOA.
 *
 *  O dump guarda a mesma pessoa escrita de seis jeitos ("Oswaldo França Júnior",
 *  "Oswaldo Franca Junior", "Oswaldo Franc̦a Júnior"), e `authors.name` é único. São
 *  7.887 nomes assim.
 *
 *  Fundir MOVE LIVRO: os livros de um autor passam a ser de outro, e isso aparece na
 *  estante de gente de verdade. É a operação mais destrutiva que um leitor comum pode
 *  disparar neste app, e por isso ela é testada contra o Postgres, e não contra uma
 *  ideia de Postgres.
 *
 *  As três coisas que estes testes seguram:
 *    1. o livro CHEGA do outro lado (e não fica órfão: works.author_id é SET NULL)
 *    2. o nome que sai vira APELIDO (quem procura pela grafia velha ainda acha)
 *    3. quando os dois têm o MESMO livro, ela RECUSA em vez de estourar o unique
 * ════════════════════════════════════════════════════════════════════
 */
let leitor: { id: string };
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const autoresCriados: string[] = [];
const obrasCriadas: string[] = [];
let userId: string;

/**
 * O slug é único e NÃO diferencia caixa (é citext). "Machado De ASSIS" e "Machado de
 * Assis" geram o mesmo slug — que é justamente o par que estes testes precisam montar.
 * O código real resolve isso com `freeAuthorSlug()`; aqui um contador basta.
 */
let s = 0;
const novoAutor = async (nome: string) => {
  const [a] = await db
    .insert(authors)
    .values({ name: nome, slug: `autor-${marca}-${++s}` })
    .returning({ id: authors.id });
  autoresCriados.push(a!.id);
  return a!.id;
};

/**
 * O slug é único por OBRA, e o título não: duas obras com o mesmo título é exatamente o
 * caso que o teste da recusa precisa montar. Um contador garante que o `works_slug_unique`
 * não derrube o teste antes de ele chegar na regra que ele veio provar.
 */
let n = 0;
const novaObra = async (titulo: string, autorId: string) => {
  const [w] = await db
    .insert(works)
    .values({ title: titulo, authorId: autorId, slug: `obra-${marca}-${++n}` })
    .returning({ id: works.id });
  obrasCriadas.push(w!.id);
  return w!.id;
};

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ handle: `fundir-${marca}`, email: `fundir-${marca}@fundir.test` })
    .returning({ id: users.id });
  userId = u!.id;
  leitor = { id: u!.id };
});

afterAll(async () => {
  // sql.param, e não a lista solta: sem ele o Drizzle expande em $1,$2,$3 e o `any(...)`
  // recebe uma tupla em vez de um array. Ver o mesmo padrão em lib/social.ts.
  if (obrasCriadas.length) {
    await db.execute(sql`delete from works where id = any(${sql.param(obrasCriadas)}::uuid[])`);
  }
  if (autoresCriados.length) {
    await db.execute(sql`delete from authors where id = any(${sql.param(autoresCriados)}::uuid[])`);
  }
  await db.delete(users).where(eq(users.id, userId));
});

describe("fundir dois autores", () => {
  it("o livro muda de dono, e o duplicado some", async () => {
    const errado = await novoAutor(`Oswaldo Franca Junior ${marca}`);
    const certo = await novoAutor(`Oswaldo França Júnior ${marca}`);
    const livro = await novaObra(`Jorge um brasileiro ${marca}`, errado);

    await fundirAutores(leitor, errado, certo, "são a mesma pessoa");

    const [w] = await db.select({ a: works.authorId }).from(works).where(eq(works.id, livro));
    expect(w?.a, "o livro tinha que ter mudado de dono").toBe(certo);

    const sobrou = await db.select().from(authors).where(eq(authors.id, errado));
    expect(sobrou.length, "o duplicado tinha que ter saído").toBe(0);
  });

  /**
   * O nome que sai não pode levar a busca junto: quem procurar pela grafia do dump
   * ("Oswaldo Franca Junior") tem que continuar achando o homem. Ver lib/catalog.ts,
   * que procura dentro de alt_names.
   */
  it("o nome que sai vira apelido", async () => {
    const errado = await novoAutor(`Machado De ASSIS ${marca}`);
    const certo = await novoAutor(`Machado de Assis ${marca}`);
    await novaObra(`Dom Casmurro ${marca}`, errado);

    await fundirAutores(leitor, errado, certo, null);

    const [row] = await db.execute<{ apelidos: string[] }>(
      sql`select alt_names as apelidos from authors where id = ${certo}::uuid`,
    );
    expect(row?.apelidos ?? [], "a grafia antiga tinha que virar apelido").toContain(
      `Machado De ASSIS ${marca}`,
    );
  });

  /**
   * ═══ A RECUSA, E POR QUE ELA É A PARTE IMPORTANTE ═══
   *
   * `works` tem unique em (title, author_id, volume). Se os dois autores têm o MESMO
   * livro, mover faria duas linhas idênticas caírem no mesmo dono, e o unique estouraria
   * NO MEIO da transação — que é exatamente o "não deu para arrumar agora" que este
   * código veio matar, com outra roupa.
   *
   * São 793 dos 7.887 casos. Ela recusa, e diz por quê.
   */
  it("recusa quando os dois têm o mesmo livro, em vez de estourar", async () => {
    const a = await novoAutor(`Antonio Cabral ${marca}`);
    const b = await novoAutor(`António Cabral ${marca}`);
    await novaObra(`O mesmo livro ${marca}`, a);
    await novaObra(`O mesmo livro ${marca}`, b);

    await expect(fundirAutores(leitor, a, b, null)).rejects.toThrow(Forbidden);

    // E não pode ter deixado nada pela metade: o livro do `a` continua com o `a`.
    const [w] = await db
      .select({ a: works.authorId })
      .from(works)
      .where(sql`${works.title} = ${`O mesmo livro ${marca}`} and ${works.authorId} = ${a}::uuid`);
    expect(w?.a, "a transação tinha que ter voltado inteira").toBe(a);
  });
});

describe("homonimoDe", () => {
  it("acha quem já tem o nome, e conta os livros dele", async () => {
    const eu = await novoAutor(`Flavio Moreira ${marca}`);
    const outro = await novoAutor(`Flávio Moreira ${marca}`);
    await novaObra(`Um livro do Flavio ${marca}`, outro);

    const h = await homonimoDe(`Flávio Moreira ${marca}`, eu);
    expect(h?.id).toBe(outro);
    expect(h?.livros).toBe(1);
    expect(h?.colide, "não têm livro em comum: dá para juntar").toBe(false);
  });

  it("avisa quando os dois têm o mesmo livro", async () => {
    const eu = await novoAutor(`Mario Garcia ${marca}`);
    const outro = await novoAutor(`Mário García ${marca}`);
    await novaObra(`Livro repetido ${marca}`, eu);
    await novaObra(`Livro repetido ${marca}`, outro);

    const h = await homonimoDe(`Mário García ${marca}`, eu);
    expect(h?.colide, "têm livro em comum: a fusão não pode").toBe(true);
  });

  it("nome livre não tem homônimo", async () => {
    const eu = await novoAutor(`Ninguem Se Chama Assim ${marca}`);
    expect(await homonimoDe(`Nome Vago ${marca}`, eu)).toBeNull();
  });
});

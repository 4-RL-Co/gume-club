import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { works, authors, editions } from "@/lib/db/schema";
import { searchLocal, searchAuthors } from "@/lib/catalog";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O TESTE CRIA O PRÓPRIO MUNDO.
 *
 *  Estes testes nasceram apoiados no catálogo de 373 mil obras que mora
 *  na minha máquina, e passavam aqui e falhavam no CI, onde o banco
 *  nasce vazio: não havia Dom Casmurro nenhum para achar. Um teste que
 *  depende de um banco que só existe na máquina de uma pessoa não é um
 *  teste, é uma coincidência.
 *
 *  Agora ele semeia as obras de que precisa, com ON CONFLICT DO NOTHING
 *  (para conviver com o catálogo de verdade quando ele existe), e apaga
 *  no fim só o que ELE criou.
 * ════════════════════════════════════════════════════════════════════
 */

/** As obras de que o perdão precisa. Títulos reais: é a grafia certa que a busca tem que achar. */
const SEMENTE: { titulo: string; autor: string }[] = [
  { titulo: "Dom Casmurro", autor: "Machado de Assis" },
  { titulo: "Memórias Póstumas de Brás Cubas", autor: "Machado de Assis" },
  { titulo: "Quincas Borba", autor: "Machado de Assis" },
  { titulo: "Grande Sertão: Veredas", autor: "João Guimarães Rosa" },
  { titulo: "A Revolução dos Bichos", autor: "George Orwell" },
  { titulo: "O Senhor dos Anéis", autor: "J.R.R. Tolkien" },
  { titulo: "Assim Falou Zaratustra", autor: "Friedrich Nietzsche" },
  { titulo: "O Vagabundo das Estrelas", autor: "Jack London" },
  { titulo: "A Hora da Estrela", autor: "Clarice Lispector" },
  { titulo: "Metamorfose", autor: "Franz Kafka" },
];

const obrasCriadas: string[] = [];
const autoresCriados: string[] = [];

beforeAll(async () => {
  for (const { titulo, autor } of SEMENTE) {
    const slugAutor = autor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const [a] = await db
      .insert(authors)
      .values({ name: autor, slug: slugAutor })
      .onConflictDoNothing()
      .returning({ id: authors.id });

    if (a) autoresCriados.push(a.id);

    // Procura pelo SLUG, e não pelo nome: o conflito acontece no slug, e quando ele
    // acontece o autor que já existe pode ter o nome grafado um tiquinho diferente
    // ("J.R.R. Tolkien" contra "J. R. R. Tolkien"). Procurar pelo nome devolvia
    // vazio, e o teste morria no setup em vez de dizer o que estava errado.
    const [autorRow] = await db
      .select({ id: authors.id })
      .from(authors)
      .where(sql`${authors.slug} = ${slugAutor}`)
      .limit(1);

    if (!autorRow) continue;

    const slugObra = titulo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const [w] = await db
      .insert(works)
      .values({ slug: slugObra, title: titulo, authorId: autorRow.id })
      .onConflictDoNothing()
      .returning({ id: works.id });

    if (w) {
      obrasCriadas.push(w.id);
      // uma edição com capa: o desempate da busca prefere obra com capa, e sem
      // edição nenhuma a obra não aparece com editora nem ano
      await db.insert(editions).values({
        workId: w.id,
        publisher: "Edição de teste",
        coverUrl: "https://covers.openlibrary.org/b/id/1-L.jpg",
      });
    }
  }
});

afterAll(async () => {
  // Só o que ESTE teste criou. Se a obra já existia (o catálogo de verdade), ela fica.
  if (obrasCriadas.length) {
    await db.execute(sql`delete from works where id = any(${sql.param(obrasCriadas)}::uuid[])`);
  }
  if (autoresCriados.length) {
    await db.execute(sql`delete from authors where id = any(${sql.param(autoresCriados)}::uuid[])`);
  }
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PERDÃO. É a razão de o trigrama existir.
 *
 *  O leitor digita sem acento, com o dedo torto, e com o nome do autor
 *  escrito errado. Um catálogo que responde "não achamos nada" para
 *  "dom casmuro" é um catálogo que mente: o livro está lá.
 *
 *  Subir o limiar de semelhança deixa a busca mais RÁPIDA e mais
 *  EXIGENTE, e a exigência come exatamente essa cauda. Este teste existe
 *  para que ninguém troque perdão por velocidade sem que o build caia.
 *
 *  Se você subir o pg_trgm.similarity_threshold em lib/db/index.ts e um
 *  destes falhar, você foi longe demais. Volte.
 * ════════════════════════════════════════════════════════════════════
 */

/** Sem acento e em minúscula, que é como a gente compara aqui. */
function sem(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const PERDOA: { consulta: string; precisaAchar: string; porque: string }[] = [
  { consulta: "memorias postumas", precisaAchar: "postumas", porque: "sem acento nenhum" },
  { consulta: "dom casmuro", precisaAchar: "casmurro", porque: "erro de digitação" },
  { consulta: "grande sertao veredas", precisaAchar: "sertao", porque: "sem acento e sem os dois pontos" },
  { consulta: "nietzche", precisaAchar: "nietzsche", porque: "o nome mais errado do Brasil" },
  { consulta: "revolucao dos bixos", precisaAchar: "bichos", porque: "erro de digitação e sem acento" },
  { consulta: "senhor dos aneis", precisaAchar: "aneis", porque: "sem acento" },
  {
    consulta: "machado de assiz",
    precisaAchar: "casmurro",
    porque:
      "buscar o AUTOR tem que trazer o que ele ESCREVEU, e não os livros escritos SOBRE ele",
  },
];

/**
 * A SEÇÃO DE AUTORES.
 *
 * Quem digita o nome de um autor quer o AUTOR. Numa lista única, os livros
 * escritos SOBRE ele esmagam os livros DELE, porque o nome dele está no título
 * deles, e casa quase perfeito. Consertar isso por peso de nota é gato e rato: o
 * caso volta em Nietzsche, Clarice, Shakespeare, Dostoiévski, Kafka.
 *
 * A resposta estrutural é a busca parar de fingir que autor e obra são a mesma
 * coisa. Estes testes travam o comportamento nos dois sentidos: a seção APARECE
 * quando a busca é sobre gente, e SOME quando não é.
 */
const AUTORES: { consulta: string; precisaAchar: string }[] = [
  { consulta: "machado de assiz", precisaAchar: "machado de assis" },
  { consulta: "clarice lispector", precisaAchar: "clarice lispector" },
  { consulta: "kafka", precisaAchar: "kafka" },
  { consulta: "nietzche", precisaAchar: "nietzsche" },
];

describe("a busca perdoa o acento errado e o dedo torto", () => {
  for (const { consulta, precisaAchar, porque } of PERDOA) {
    it(`"${consulta}" acha "${precisaAchar}" (${porque})`, async () => {
      const hits = await searchLocal(consulta);

      /**
       * Olha o título E o autor.
       *
       * Quem digita "nietzche" quer os livros DELE, e o livro dele se chama "Assim
       * Falou Zaratustra": o nome do autor não está no título. A primeira versão
       * deste teste só olhava o título, e reprovava uma busca que estava CERTA.
       */
      const achou = hits.some(
        (h) => sem(h.title).includes(precisaAchar) || sem(h.author ?? "").includes(precisaAchar),
      );

      expect(
        achou,
        `"${consulta}" não achou "${precisaAchar}". Se você subiu o limiar do trigrama, ` +
          `você trocou perdão por velocidade: volte. Os resultados foram: ` +
          hits.slice(0, 5).map((h) => h.title).join(" | "),
      ).toBe(true);
    });
  }

  it("uma palavra que PARECE outra acha alguma coisa, e não o nada", async () => {
    // "vagabundo" não é "Vagabond". O certo é achar livros com "vagabundo" no
    // título, e não devolver uma tela vazia porque a busca não entendeu a piada.
    const hits = await searchLocal("vagabundo");
    expect(hits.length, "'vagabundo' não achou nada, e devia achar").toBeGreaterThan(0);
    expect(hits.some((h) => sem(h.title).includes("vagabundo"))).toBe(true);
  });
});

describe("a busca responde em seções: o autor vem antes das obras", () => {
  for (const { consulta, precisaAchar } of AUTORES) {
    it(`"${consulta}" traz o autor na primeira seção`, async () => {
      const autores = await searchAuthors(consulta);

      expect(
        autores.some((a) => sem(a.name).includes(precisaAchar)),
        `"${consulta}" não trouxe "${precisaAchar}" na seção de autores. ` +
          `Sem essa seção, os livros escritos SOBRE ele voltam a esmagar os livros DELE. ` +
          `Veio: ${autores.map((a) => a.name).join(" | ") || "nada"}`,
      ).toBe(true);
    });
  }

  it("uma busca por TÍTULO não inventa uma seção de autores", async () => {
    const autores = await searchAuthors("dom casmurro");
    expect(
      autores,
      "a seção de autores apareceu numa busca por título: ela só existe quando o nome casa forte",
    ).toHaveLength(0);
  });

  it("o autor tem endereço público, e ele não é vazio", async () => {
    const [machado] = await searchAuthors("machado de assis");
    expect(machado?.slug).toBe("machado-de-assis");
    // Duas obras bastam para provar que o endereço leva a algum lugar. Exigir cem
    // era exigir o catálogo inteiro, e foi assim que este teste passou a mentir:
    // verde na minha máquina, vermelho no CI, onde o banco nasce vazio.
    expect(machado!.works).toBeGreaterThanOrEqual(2);
  });
});

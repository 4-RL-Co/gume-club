import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Forbidden } from "@/lib/authz";
import { DataInvalida } from "@/lib/datas";
import { findOrCreateWork, shelveAndRead } from "@/lib/library";
import { getLeituras, editarLeitura, apagarLeitura } from "@/lib/leituras";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A DATA DE LEITURA. Contra o Postgres de verdade.
 *
 *  O pior bug que este app teve: `new Date()` gravado como o dia em que a pessoa
 *  terminou o livro. Sempre hoje, sem tela para corrigir. O Gume não sabia
 *  QUANDO ninguém tinha lido nada, e a página de estatísticas e a retrospectiva
 *  do ano são construídas inteiras em cima disso.
 *
 *  Este arquivo é a prova de que a data agora é do LEITOR — e de que ela
 *  SOBREVIVE, que é a parte que importa. Escrever a data certa e perdê-la na
 *  volta do banco seria o mesmo bug com outra roupa.
 * ════════════════════════════════════════════════════════════════════
 */

const criados: string[] = [];
const marca = Date.now().toString(36);

let leitor: { id: string };
let estranho: { id: string };
let obra: string;

async function criar(handle: string) {
  const [u] = await db
    .insert(users)
    .values({ handle: `${handle}-${marca}`, email: `${handle}-${marca}@teste.local` })
    .returning({ id: users.id });
  criados.push(u!.id);
  return { id: u!.id };
}

beforeAll(async () => {
  leitor = await criar("data-leitor");
  estranho = await criar("data-estranho");

  const { workId } = await findOrCreateWork({
    title: `O livro das datas ${marca}`,
    author: `Autor de teste ${marca}`,
  });
  obra = workId;
});

afterAll(async () => {
  for (const id of criados) {
    await db.execute(sql`delete from users where id = ${id}::uuid`);
  }
  await db.execute(sql`delete from users where email like '%@teste.local'`);
  await db.execute(sql`delete from works where title like ${"%" + marca}`);
  await db.execute(sql`delete from authors where name like ${"%" + marca}`);
});

describe("marcar como lido em 12 de março de 2019, e a data FICAR", () => {
  it("a data que o leitor deu é a data que o banco guarda", async () => {
    /**
     * A prova que o dono do projeto pediu, e ela é literal: marque um livro como lido
     * em 12/03/2019, feche, reabra, e prove que continua 12/03/2019.
     *
     * O "feche e reabra" aqui é a volta ao banco: `getLeituras` relê a linha, e é
     * exatamente onde a data morreria se alguém a convertesse para `timestamptz` no
     * caminho.
     */
    await shelveAndRead(leitor, obra, "read", "2019-03-12");

    const [l] = await getLeituras(leitor, leitor.id, obra);

    expect(l, "a leitura não foi registrada").toBeDefined();
    expect(
      l!.terminou,
      "a data virou outra coisa na volta do banco. O `date` do Postgres não pode " +
        "encostar em fuso horário: quem terminou às 22h de 31 de dezembro em Brasília " +
        "terminou em 31 de dezembro, e não em 1º de janeiro em UTC.",
    ).toBe("2019-03-12");
  });

  it("e o ano dela é 2019, que é o que a retrospectiva vai contar", async () => {
    const [r] = await db.execute<{ ano: number }>(sql`
      select extract(year from r.finished_on)::int as ano
        from readings r
        join library_entries le on le.id = r.entry_id
       where le.user_id = ${leitor.id}::uuid and le.work_id = ${obra}::uuid`);

    expect(r!.ano, "a retrospectiva contaria este livro no ano errado").toBe(2019);
  });
});

describe("corrigir a data de uma leitura já registrada", () => {
  it("mudar a data guarda a data nova, e ela sobrevive à releitura do banco", async () => {
    const [antes] = await getLeituras(leitor, leitor.id, obra);

    await editarLeitura(leitor, antes!.id, {
      comecou: "2019-02-01",
      terminou: "2019-03-12",
    });

    const [depois] = await getLeituras(leitor, leitor.id, obra);
    expect(depois!.comecou).toBe("2019-02-01");
    expect(depois!.terminou).toBe("2019-03-12");
  });

  it("uma data no futuro não entra", async () => {
    const [l] = await getLeituras(leitor, leitor.id, obra);
    const amanha = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

    await expect(editarLeitura(leitor, l!.id, { terminou: amanha })).rejects.toThrow(
      DataInvalida,
    );

    // E não escreveu nada pela metade: a data velha continua lá.
    const [ainda] = await getLeituras(leitor, leitor.id, obra);
    expect(ainda!.terminou).toBe("2019-03-12");
  });

  it("terminar antes de começar não entra", async () => {
    const [l] = await getLeituras(leitor, leitor.id, obra);
    await expect(
      editarLeitura(leitor, l!.id, { comecou: "2019-05-01", terminou: "2019-03-12" }),
    ).rejects.toThrow(DataInvalida);
  });
});

describe("a data de leitura de alguém é de ALGUÉM", () => {
  it("um estranho não reescreve a história de leitura de outra pessoa", async () => {
    /**
     * `readings` não tem `user_id`: o dono mora em `library_entries`, e a checagem tem
     * que SALTAR até lá. Sem esse salto, quem tivesse o id de uma leitura reescreveria
     * a data de leitura de qualquer um, e a tela nem piscaria.
     */
    const [l] = await getLeituras(leitor, leitor.id, obra);

    await expect(
      editarLeitura(estranho, l!.id, { terminou: "1999-01-01" }),
      "um estranho reescreveu a data de leitura de outra pessoa",
    ).rejects.toThrow(Forbidden);

    await expect(apagarLeitura(estranho, l!.id)).rejects.toThrow(Forbidden);
    await expect(editarLeitura(null, l!.id, { terminou: "1999-01-01" })).rejects.toThrow();

    const [intacta] = await getLeituras(leitor, leitor.id, obra);
    expect(intacta!.terminou).toBe("2019-03-12");
  });
});

describe("releitura: cada leitura tem as SUAS datas", () => {
  it("mexer numa não toca na outra", async () => {
    /**
     * Ler O Hobbit em 2009 e de novo em 2024 são duas leituras. Uma tabela que só
     * guardasse "a última vez que você leu" apagaria a sua história, e a história é o
     * produto.
     */
    const [entry] = await db.execute<{ id: string }>(sql`
      select id from library_entries
       where user_id = ${leitor.id}::uuid and work_id = ${obra}::uuid`);

    await db.execute(sql`
      insert into readings (entry_id, started_on, finished_on)
      values (${entry!.id}::uuid, '2024-01-05'::date, '2024-02-20'::date)`);

    const leituras = await getLeituras(leitor, leitor.id, obra);
    expect(leituras.length).toBe(2);

    // Ordenadas pela data do fim: a de 2019 vem antes da de 2024.
    expect(leituras[0]!.terminou).toBe("2019-03-12");
    expect(leituras[1]!.terminou).toBe("2024-02-20");

    await editarLeitura(leitor, leituras[1]!.id, {
      comecou: "2024-01-05",
      terminou: "2024-03-01",
    });

    const depois = await getLeituras(leitor, leitor.id, obra);
    expect(depois[0]!.terminou, "editar a releitura mexeu na leitura antiga").toBe(
      "2019-03-12",
    );
    expect(depois[1]!.terminou).toBe("2024-03-01");
  });

  it("apagar uma leitura some com o capítulo, e não com o livro", async () => {
    const leituras = await getLeituras(leitor, leitor.id, obra);
    await apagarLeitura(leitor, leituras[1]!.id);

    const depois = await getLeituras(leitor, leitor.id, obra);
    expect(depois.length).toBe(1);
    expect(depois[0]!.terminou).toBe("2019-03-12");

    // A linha da estante FICA. Apagar uma leitura não é tirar o livro da estante.
    const [entry] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from library_entries
       where user_id = ${leitor.id}::uuid and work_id = ${obra}::uuid`);
    expect(entry!.n, "apagar a leitura apagou o livro da estante").toBe(1);
  });
});

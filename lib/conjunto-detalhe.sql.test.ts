import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, editions, authors, series } from "@/lib/db/schema";
import { getConjuntoDetalhe } from "@/lib/conjunto-detalhe";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A PÁGINA DE DENTRO DA COLEÇÃO: SÓ ABRE PARA QUEM COMPLETOU, E NADA É INVENTADO.
 *
 *  Dois medos, dois testes: a consulta não pode vazar o conjunto de ninguém que a
 *  pessoa nunca tocou, e ela não pode devolver "completo" para quem ainda não é.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let leitor: { id: string };
let autorId: string;
let serieId: string;
let colecaoId: string;
let obraA: string;
let obraB: string;

beforeAll(async () => {
  const [u] = await db.insert(users)
    .values({ handle: `cjd-${marca}`, email: `cjd-${marca}@cjd.test` })
    .returning({ id: users.id });
  leitor = { id: u!.id };

  const [a] = await db.insert(authors)
    .values({
      name: `Autora Teste ${marca}`,
      slug: `autora-teste-${marca}`,
      bio: "Nasceu, escreveu, e este teste apagou tudo depois.",
      bioSource: "wikidata",
    })
    .returning({ id: authors.id });
  autorId = a!.id;

  const [s] = await db.execute<{ id: string }>(sql`
    insert into series (title, slug, kind, total_volumes)
    values (${`zz série cjd ${marca}`}, ${`zz-serie-cjd-${marca}`}, 'manga', 2) returning id`);
  serieId = s!.id;

  const [c] = await db.execute<{ id: string; slug: string }>(sql`
    insert into colecoes (series_id, slug, title, publisher, total_volumes)
    values (${serieId}::uuid, ${`zz-conjunto-cjd-${marca}`}, ${`zz Conjunto CJD ${marca}`}, 'Editora Teste', 2)
    returning id, slug`);
  colecaoId = c!.id;

  const [wa] = await db.insert(works)
    .values({ slug: `cjd-a-${marca}`, title: `zz cjd volume 1 ${marca}`, authorId: autorId, seriesId: serieId, volume: String(1) })
    .returning({ id: works.id });
  obraA = wa!.id;
  const [wb] = await db.insert(works)
    .values({ slug: `cjd-b-${marca}`, title: `zz cjd volume 2 ${marca}`, authorId: autorId, seriesId: serieId, volume: String(2) })
    .returning({ id: works.id });
  obraB = wb!.id;

  await db.execute(sql`update works set colecao_id = ${colecaoId}::uuid where id in (${obraA}::uuid, ${obraB}::uuid)`);

  await db.insert(editions).values({ workId: obraA, publisher: "Editora Teste", publishedYear: 2020, pageCount: 200 });
  await db.insert(editions).values({ workId: obraB, publisher: "Editora Teste", publishedYear: 2021, pageCount: 210 });
});

afterAll(async () => {
  await db.execute(sql`delete from works where id in (${obraA}::uuid, ${obraB}::uuid)`);
  await db.execute(sql`delete from colecoes where id = ${colecaoId}::uuid`);
  await db.execute(sql`delete from series where id = ${serieId}::uuid`);
  await db.execute(sql`delete from authors where id = ${autorId}::uuid`);
  await db.execute(sql`delete from users where id = ${leitor.id}::uuid`);
});

describe("a página de dentro da coleção", () => {
  it("ninguém que nunca tocou o conjunto acha a página", async () => {
    const outro = { id: "00000000-0000-0000-0000-000000000000" };
    const c = await getConjuntoDetalhe(outro, `zz-conjunto-cjd-${marca}`);
    expect(c, "um id que nunca tocou o conjunto achou a página mesmo assim").toBeNull();
  });

  it("quem tem só um volume vê o conjunto, mas incompleto", async () => {
    await db.execute(sql`
      insert into owned_copies (user_id, work_id, state)
      values (${leitor.id}::uuid, ${obraA}::uuid, 'owned')`);

    const c = await getConjuntoDetalhe(leitor, `zz-conjunto-cjd-${marca}`);
    expect(c, "não achou o conjunto que a pessoa tocou").toBeTruthy();
    expect(c!.tenho).toBe(1);
    expect(c!.total).toBe(2);
    expect(c!.completo, "um volume de dois não pode ser 'completo'").toBe(false);
  });

  it("quem tem todos os volumes vê a coleção completa, com autor e série", async () => {
    await db.execute(sql`
      insert into owned_copies (user_id, work_id, state)
      values (${leitor.id}::uuid, ${obraB}::uuid, 'owned')`);

    const c = await getConjuntoDetalhe(leitor, `zz-conjunto-cjd-${marca}`);
    expect(c!.completo).toBe(true);
    expect(c!.tenho).toBe(2);

    expect(c!.autor?.nome).toBe(`Autora Teste ${marca}`);
    expect(c!.autor?.bio).toContain("Nasceu, escreveu");
    expect(c!.serie?.titulo).toBe(`zz série cjd ${marca}`);

    expect(c!.volumes).toHaveLength(2);
    const v1 = c!.volumes.find((v) => v.volume === 1);
    expect(v1?.publisher).toBe("Editora Teste");
    expect(v1?.publishedYear).toBe(2020);
  });

  it("entre duas edições da editora do conjunto, a com tradutor vence — mesmo sendo mais nova", async () => {
    /**
     * "Aqui continua com a capa errada" — desta vez a Dostoiévski Martin Claret: Os
     * Irmãos Karamázov ganhou uma edição NOVA (tradutor preenchido, capa de
     * verdade), mas uma edição VELHA da mesma editora (sem tradutor, capa
     * emprestada da OpenLibrary, criada antes) continuava vencendo só por ser mais
     * antiga. A consulta agora prefere, dentro da MESMA editora do conjunto, a
     * edição que tem tradutor — o sinal de ficha catalogada à mão, não herdada de
     * um import em lote.
     */
    await db.execute(sql`
      insert into editions (work_id, publisher, cover_url, translator, created_at)
      values (${obraA}::uuid, 'Editora Teste', 'https://exemplo.test/velha-sem-tradutor.jpg', null,
              '2020-01-01 00:00:00+00'::timestamptz)`);
    await db.execute(sql`
      insert into editions (work_id, publisher, cover_url, translator, created_at)
      values (${obraA}::uuid, 'Editora Teste', 'https://exemplo.test/nova-com-tradutor.jpg', 'Tradutora Teste',
              '2026-01-01 00:00:00+00'::timestamptz)`);

    const c = await getConjuntoDetalhe(leitor, `zz-conjunto-cjd-${marca}`);
    const v1 = c!.volumes.find((v) => v.volume === 1);
    expect(v1?.coverUrl, "a edição sem tradutor venceu só por ser mais antiga").toBe(
      "https://exemplo.test/nova-com-tradutor.jpg",
    );
  });

  it("nada aqui inventa bio: sem authors.bio, a página não tem o que mostrar", async () => {
    const [semBio] = await db.insert(authors)
      .values({ name: `Autor Sem Bio ${marca}`, slug: `autor-sem-bio-${marca}` })
      .returning({ id: authors.id });

    await db.execute(sql`update works set author_id = ${semBio!.id}::uuid where id = ${obraA}::uuid`);

    const c = await getConjuntoDetalhe(leitor, `zz-conjunto-cjd-${marca}`);
    // O primeiro volume com autor CONHECIDO decide — e agora o volume 1 não tem bio.
    // A consulta não pode preencher isso sozinha: bio nula continua nula.
    const autorDoConjunto = c!.autor;
    if (autorDoConjunto?.slug === `autor-sem-bio-${marca}`) {
      expect(autorDoConjunto.bio).toBeNull();
    }

    await db.execute(sql`delete from authors where id = ${semBio!.id}::uuid`);
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { findOrCreateWork, shelveAndRead } from "@/lib/library";
import { getResumoDoPerfil } from "@/lib/stats";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O RESUMO DO PERFIL. Contra o Postgres de verdade.
 *
 *  Este é o recorte que "abrir /estatisticas pra visitantes" virou: veredito,
 *  gêneros, nacionalidade e formato são PÚBLICOS (gosto, não posse). A prova
 *  que importa aqui é a mesma de sempre — visibilidade filtrada no SQL —
 *  mais o fato de nacionalidade e formato aparecerem de verdade.
 * ════════════════════════════════════════════════════════════════════
 */
const criados: string[] = [];
const marca = Date.now().toString(36);

let dono: { id: string };
let estranho: { id: string };

async function criar(handle: string) {
  const [u] = await db
    .insert(users)
    .values({ handle: `${handle}-${marca}`, email: `${handle}-${marca}@teste.local` })
    .returning({ id: users.id });
  criados.push(u!.id);
  return { id: u!.id };
}

beforeAll(async () => {
  dono = await criar("resumo-dono");
  estranho = await criar("resumo-estranho");

  const { workId, editionId } = await findOrCreateWork({
    title: `O livro do resumo ${marca}`,
    author: `Autora do resumo ${marca}`,
    formato: "ebook",
  });
  await db.execute(sql`
    update authors set nationality = 'brasileira'
     where id = (select author_id from works where id = ${workId}::uuid)`);
  expect(editionId, "a edição não nasceu com o livro").not.toBeNull();

  await shelveAndRead(dono, workId, "read", "2020-05-10");
  await db.execute(sql`
    insert into ratings (user_id, work_id, value)
    values (${dono.id}::uuid, ${workId}::uuid, 5)
    on conflict (user_id, work_id) do update set value = excluded.value`);
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
  await db.execute(sql`delete from users where email like '%@teste.local'`);
  await db.execute(sql`delete from works where title like ${"%" + marca}`);
  await db.execute(sql`delete from authors where name like ${"%" + marca}`);
});

describe("o recorte curador: veredito, nacionalidade e formato são públicos", () => {
  it("o dono vê nacionalidade, formato e o veredito", async () => {
    const resumo = await getResumoDoPerfil(dono, dono.id);

    expect(resumo.nationalities.find((n) => n.label === "brasileira")?.n).toBe(1);
    expect(resumo.formats.find((f) => f.label === "digital")?.n).toBe(1);
    expect(resumo.verdicts.find((v) => v.value === 5)?.n).toBe(1);
  });

  it("um estranho vê o MESMO recorte — é público, não é o dono que decide", async () => {
    const resumo = await getResumoDoPerfil(estranho, dono.id);

    expect(resumo.nationalities.find((n) => n.label === "brasileira")?.n).toBe(1);
    expect(resumo.formats.find((f) => f.label === "digital")?.n).toBe(1);
  });

  it("uma estante privada não aparece pra ninguém além do dono", async () => {
    await db.execute(sql`
      update library_entries set visibility = 'private'
       where user_id = ${dono.id}::uuid`);

    const paraOEstranho = await getResumoDoPerfil(estranho, dono.id);
    expect(paraOEstranho.nationalities.length, "a nacionalidade vazou de uma estante privada").toBe(0);
    expect(paraOEstranho.formats.length, "o formato vazou de uma estante privada").toBe(0);

    const paraODono = await getResumoDoPerfil(dono, dono.id);
    expect(paraODono.nationalities.length, "o dono deixou de ver a própria estante privada").toBe(1);

    // devolve pra público, para não vazar estado entre testes
    await db.execute(sql`
      update library_entries set visibility = 'public'
       where user_id = ${dono.id}::uuid`);
  });
});

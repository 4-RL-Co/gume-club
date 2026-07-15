import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { setShelvesByName, getShelvesOf } from "@/lib/curation";

/**
 * ════════════════════════════════════════════════════════════════════
 *  DUAS ESTANTES COM O MESMO NOME NÃO NASCEM. NEM COM ACENTO A MENOS.
 *
 *  ═══ O BUG QUE ESTE TESTE EXISTE PARA IMPEDIR ═══
 *
 *  A tela pedia os nomes das estantes num campo de texto livre, separados por vírgula. E o
 *  dono do Gume viu o buraco antes de qualquer teste:
 *
 *      "Ser assim pode fazer a pessoa digitar errado."
 *
 *  Digitar o nome de uma coisa que JÁ EXISTE é uma máquina de fazer duplicata. "para
 *  reler" e "pra reler" viram duas estantes. "Do meu pai" e "do meu paí" viram duas. O app
 *  não reclama, porque para ele são dois nomes diferentes: ele obedece.
 *
 *  E ninguém descobre na hora. Descobre semanas depois, com a barra lateral cheia de
 *  quase-iguais e os livros espalhados entre elas — e juntar é trabalho manual.
 *
 *  ═══ A TELA CONSERTA O CAMINHO. ESTE TESTE CONSERTA A PORTA ═══
 *
 *  A tela agora OFERECE as estantes que existem, como botões. Mas tela é sugestão: um POST
 *  direto, um app futuro ou uma planilha importada continuam entrando pelo servidor.
 *
 *  Quem tem que garantir que a estante é uma só é `setShelvesByName`, e é ela que este
 *  teste aperta — contra o Postgres de verdade, porque é lá que a duplicata nasceria.
 * ════════════════════════════════════════════════════════════════════
 */

let userId: string;
let workId: string;

beforeAll(async () => {
  const [u] = await db.execute<{ id: string }>(sql`
    insert into users (handle, email, display_name, email_verified)
    values (${"teste-estantes-" + Math.random().toString(36).slice(2, 8)},
            ${"estantes-" + Math.random().toString(36).slice(2, 8) + "@teste.local"},
            'Teste das Estantes', true)
    returning id`);
  userId = u!.id;

  const [w] = await db.execute<{ id: string }>(sql`select id from works limit 1`);
  workId = w!.id;
});

afterAll(async () => {
  // O teste leva o próprio lixo embora. Um teste que suja o banco é um teste que o
  // próximo desenvolvedor aprende a temer.
  await db.execute(sql`delete from users where id = ${userId}::uuid`);
});

describe("as estantes que a pessoa inventa", () => {
  it("o mesmo nome escrito de quatro jeitos é UMA estante, e não quatro", async () => {
    const actor = { id: userId };

    await setShelvesByName(actor, workId, "Para Reler");
    await setShelvesByName(actor, workId, "para reler");
    await setShelvesByName(actor, workId, "  PARA RELER  ");
    await setShelvesByName(actor, workId, "pára reler");

    const [linha] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from collections where user_id = ${userId}::uuid`);

    const n = linha?.n ?? 0;

    expect(
      n,
      `nasceram ${n} estantes com o mesmo nome. A pessoa vai ver a barra lateral cheia de ` +
        "quase-iguais, com os livros espalhados entre elas, e não vai entender por quê.",
    ).toBe(1);
  });

  /**
   * ═══ E O NOME GRAVADO É O QUE A PESSOA ESCREVEU ═══
   *
   * Casar ignorando acento não pode virar GRAVAR sem acento. "Mães" é o nome da estante, e
   * a pessoa escolheu esse nome. Quem casa é a chave; quem aparece na tela é o rótulo.
   */
  it("o acento da pessoa não é comido na hora de gravar", async () => {
    const actor = { id: userId };

    await setShelvesByName(actor, workId, "Livros da minha mãe");

    const [linha] = await db.execute<{ name: string }>(sql`
      select name from collections
       where user_id = ${userId}::uuid and name ilike '%mãe%'`);

    expect(linha?.name, "o app comeu o acento do nome que a pessoa escolheu").toBe(
      "Livros da minha mãe",
    );
  });

  it("tirar o livro de uma estante tira mesmo", async () => {
    const actor = { id: userId };

    await setShelvesByName(actor, workId, "para reler, do meu pai");
    expect((await getShelvesOf(userId, workId)).length).toBe(2);

    await setShelvesByName(actor, workId, "para reler");
    const restantes = await getShelvesOf(userId, workId);

    expect(restantes.length).toBe(1);
    expect(restantes[0]?.toLowerCase()).toContain("reler");
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { searchPeople } from "@/lib/people";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ACHAR UMA PESSOA, CONTRA O POSTGRES DE VERDADE.
 *
 *  Este teste não pode ser um mock, e a razão é o assunto dele: o que
 *  está sendo testado É o Postgres. Trigrama, unaccent e word_similarity
 *  são do banco, e um mock deles testaria a minha opinião sobre o que
 *  eles fazem, que é exatamente o que já estava errado.
 *
 *  Se ninguém acha ninguém, o Gume é uma planilha. Este teste é o que
 *  garante que não é.
 * ════════════════════════════════════════════════════════════════════
 */

const eu = { id: "" };
const criados: string[] = [];

async function criar(
  handle: string,
  displayName: string | null,
  extra: { isPrivate?: boolean; emailVerified?: boolean } = {},
) {
  const [u] = await db
    .insert(users)
    .values({
      handle,
      email: `${handle}@teste.local`,
      displayName,
      isPrivate: extra.isPrivate ?? false,
      // Verificado por padrão: o portão anti-spam tem um teste só dele, abaixo.
      emailVerified: extra.emailVerified ?? true,
    })
    .returning({ id: users.id });
  criados.push(u!.id);
  return u!.id;
}

beforeAll(async () => {
  const marca = Date.now().toString(36);
  eu.id = await criar(`quem-busca-${marca}`, "Quem Busca");

  await criar(`vitoria-${marca}`, "Maria Vitória Alcântara");
  await criar(`clarice-${marca}`, "Clarice Lispector");
  await criar(`joaopedro-${marca}`, "João Pedro");
  await criar(`escondida-${marca}`, "Vitória Escondida", { isPrivate: true }); // conta privada

  // O PORTÃO ANTI-SPAM: cadastrou, não verificou o e-mail. Usa o app inteiro, e não
  // é DESCOBERTO por ninguém.
  await criar(`naoverificada-${marca}`, "Vitória Não Verificada", { emailVerified: false });

  // BANIDO. Some de tudo.
  const banido = await criar(`banida-${marca}`, "Vitória Banida");
  await db.execute(sql`update users set banned_at = now() where id = ${banido}::uuid`);
});

afterAll(async () => {
  /**
   * A limpeza varre pelo E-MAIL, e não só pelos ids desta rodada.
   *
   * Já vazou: quando o arquivo de teste falha ANTES do afterAll (e ele falhou, por
   * um erro de sintaxe de SQL na primeira versão), as linhas ficam no banco. E
   * usuário de teste no banco de desenvolvimento não é lixo inofensivo: ele APARECE
   * na busca de pessoas e na página /pessoas do app, como se fosse gente.
   *
   * Uma rede que só pega o que ela mesma jogou não pega o que a rodada anterior
   * deixou cair.
   */
  // Um a um, de propósito. O drizzle interpola uma lista como uma TUPLA (record),
  // e o Postgres recusa converter record em uuid[]: um `= any($1::uuid[])` com um
  // array de JS não é a mesma coisa que um array do Postgres.
  for (const id of criados) {
    await db.execute(sql`delete from users where id = ${id}::uuid`);
  }

  // E a rede larga: qualquer sobra de uma rodada que morreu no meio.
  await db.execute(sql`delete from users where email like '%@teste.local'`);
});

const achou = (rows: { handle: string }[], parte: string) =>
  rows.some((r) => r.handle.startsWith(parte));

describe("a busca de pessoas perdoa", () => {
  it("acha sem acento: 'vitoria' encontra 'Vitória'", async () => {
    const r = await searchPeople(eu, "vitoria");
    expect(achou(r, "vitoria-"), "quem digita sem acento não achou o amigo").toBe(true);
  });

  it("acha COM erro de digitação: 'clarise' encontra 'Clarice'", async () => {
    const r = await searchPeople(eu, "clarise");
    expect(
      achou(r, "clarice-"),
      "o LIKE antigo falhava exatamente aqui: ninguém digita certo na primeira vez",
    ).toBe(true);
  });

  it("acha pela MELHOR PALAVRA do nome, e não pelo nome inteiro", async () => {
    // Ninguém digita "Maria Vitória Alcântara". Digita "alcantara".
    const r = await searchPeople(eu, "alcantara");
    expect(achou(r, "vitoria-")).toBe(true);
  });

  it("acha pelo handle", async () => {
    const r = await searchPeople(eu, "joaopedro");
    expect(achou(r, "joaopedro-")).toBe(true);
  });
});

describe("a busca de pessoas respeita quem não quer ser achado", () => {
  it("uma conta privada NÃO é um resultado escondido: ela não é um resultado", async () => {
    const r = await searchPeople(eu, "vitoria");
    expect(
      achou(r, "escondida-"),
      "uma conta privada apareceu na busca de um estranho",
    ).toBe(false);
  });

  it("eu não apareço na minha própria busca", async () => {
    const r = await searchPeople(eu, "quem-busca");
    expect(r.some((p) => p.id === eu.id)).toBe(false);
  });
});

describe("o portão anti-spam: cadastro aberto não é vitrine aberta", () => {
  /**
   * ════════════════════════════════════════════════════════════════════
   *  Com cadastro ABERTO, /@handle indexável é uma FAZENDA DE SEO à espera
   *  de acontecer. Não é um risco teórico: é o que SEMPRE acontece.
   *
   *  A verificação de e-mail não bloqueia NADA do produto: quem não
   *  verificou usa o app inteiro, com a estante inteira. O que ele não tem
   *  é DESCOBERTA — não é achado aqui, não aparece no explorar, e o perfil
   *  dele é noindex.
   *
   *  Uma conta que ninguém acha e que o Google não indexa não serve para
   *  spam nenhum. O portão está na SAÍDA, e nunca na entrada: trancar a
   *  porta de entrada machuca a pessoa de verdade e não machuca o script.
   * ════════════════════════════════════════════════════════════════════
   */
  it("quem NÃO verificou o e-mail não é achado por ninguém", async () => {
    const r = await searchPeople(eu, "vitoria");
    expect(
      achou(r, "naoverificada-"),
      "uma conta sem e-mail verificado apareceu na busca. É assim que a fazenda de spam nasce.",
    ).toBe(false);
  });

  it("um BANIDO não é um resultado", async () => {
    const r = await searchPeople(eu, "vitoria");
    expect(achou(r, "banida-"), "um banido apareceu na busca").toBe(false);
  });

  it("mas quem verificou continua sendo achado: o portão não tranca a porta", async () => {
    const r = await searchPeople(eu, "vitoria");
    expect(achou(r, "vitoria-")).toBe(true);
  });
});

describe("a busca de pessoas não responde a lixo", () => {
  it("uma letra só não busca nada: trigrama com uma letra devolve o mundo", async () => {
    expect(await searchPeople(eu, "a")).toEqual([]);
  });

  it("uma busca que não casa com ninguém devolve vazio, e não estoura", async () => {
    expect(await searchPeople(eu, "zzzqwertyuiop")).toEqual([]);
  });
});

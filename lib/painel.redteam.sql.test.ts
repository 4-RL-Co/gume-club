import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getPainel, coletarPainel, painelEmMarkdown } from "@/lib/painel";
import { souIdealizador, assertIdealizador, tokenDePainelValido, Forbidden } from "@/lib/authz";

/**
 * ════════════════════════════════════════════════════════════════════
 *  RED TEAM: O PAINEL PRIVADO. Só o idealizador entra.
 *
 *  A propriedade que importa é a RECUSA, e ela é dupla:
 *
 *   1. A página responde 404 (não 403) para um usuário comum logado. 404
 *      porque 403 confessa que a página existe. A página usa souIdealizador()
 *      e chama notFound(); aqui a gente prova que souIdealizador() é false
 *      para quem não é o idealizador, que é o que dispara o 404.
 *
 *   2. A função de dado (getPainel) recusa por dentro, com Forbidden, mesmo
 *      que alguém apague o 404 da página. A defesa não depende de uma tela.
 *
 *  O idealizador é ÚNICO no mundo por índice do banco (migration 0024), então
 *  este teste não cria um segundo: para o caminho feliz (provar que as
 *  agregações rodam sem erro de SQL), ele reusa o idealizador que já existe,
 *  em leitura. Se não houver nenhum (banco novo), esse trecho se abstém.
 * ════════════════════════════════════════════════════════════════════
 */

let comum: { id: string };
const criados: string[] = [];
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ handle: `painel-comum-${marca}`, email: `painel-comum-${marca}@painel.test` })
    .returning({ id: users.id });
  criados.push(u!.id);
  comum = { id: u!.id };
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
});

describe("um usuário comum não abre o painel, e nem sabe que ele existe", () => {
  it("souIdealizador é false para um usuário comum logado (é o que vira o 404)", async () => {
    expect(await souIdealizador(comum)).toBe(false);
  });

  it("souIdealizador é false para um visitante sem sessão", async () => {
    expect(await souIdealizador(null)).toBe(false);
  });

  it("getPainel recusa o usuário comum com Forbidden, por dentro", async () => {
    await expect(getPainel(comum)).rejects.toBeInstanceOf(Forbidden);
  });

  it("getPainel recusa o visitante sem sessão", async () => {
    await expect(getPainel(null)).rejects.toBeInstanceOf(Forbidden);
  });

  it("assertIdealizador também recusa o usuário comum", async () => {
    await expect(assertIdealizador(comum)).rejects.toBeInstanceOf(Forbidden);
  });
});

describe("o idealizador abre o painel, e as agregações rodam", () => {
  it("getPainel devolve os cinco blocos, sem erro de SQL", async () => {
    const [ideal] = await db.execute<{ user_id: string }>(sql`
      select user_id from badge_grants
       where badge = 'idealizador' and revoked_at is null
       limit 1
    `);

    if (!ideal) {
      // Banco sem idealizador: nada a provar sobre o caminho feliz aqui.
      expect(true).toBe(true);
      return;
    }

    const painel = await getPainel({ id: ideal.user_id });

    // O contrato inteiro está presente, e os números são números (o SQL rodou de verdade).
    expect(painel.gente.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(painel.gente.porDia)).toBe(true);
    expect(Array.isArray(painel.gente.log)).toBe(true);
    expect(painel.uso.notas).toHaveLength(5);
    expect(painel.uso.medianaLivros).toBeGreaterThanOrEqual(0);
    expect(painel.contribuicao.contribuintes).toBeGreaterThanOrEqual(0);
    expect(painel.convite.porConvite + painel.convite.sozinhos).toBe(painel.gente.total);
    expect(painel.catalogo.obras).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(painel.catalogo.buscasVazias)).toBe(true);
    expect(painel.gente.ativos1).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────── o arquivo que sai não leva e-mail

describe("o markdown do painel não leva e-mail de ninguém", () => {
  it("um arquivo que viaja não pode carregar dado pessoal", async () => {
    const dados = await coletarPainel();
    const md = painelEmMarkdown(dados, "20/07/2026 12:00");

    // Nenhum @ de e-mail no texto. O log leva handle, dia, método e procedência, e nada
    // do que dói se vazar. Se algum e-mail entrar aqui, este teste quebra.
    expect(md, "um e-mail vazou para o markdown do painel").not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    // E o markdown tem substância: não é uma casca vazia que passa por acidente.
    expect(md).toContain("# O Gume, por dentro");
    expect(md).toContain("## Gente");
  });
});

// ───────────────────────────────────────────────── o token da porta do agente

describe("o token do painel: a segunda porta, e as travas dela", () => {
  const ORIGINAL = process.env.PAINEL_TOKEN;
  afterAll(() => {
    if (ORIGINAL === undefined) delete process.env.PAINEL_TOKEN;
    else process.env.PAINEL_TOKEN = ORIGINAL;
  });

  it("sem PAINEL_TOKEN no ambiente, a porta do token não existe", () => {
    delete process.env.PAINEL_TOKEN;
    expect(tokenDePainelValido("qualquer-coisa")).toBe(false);
    expect(tokenDePainelValido("")).toBe(false);
    expect(tokenDePainelValido(null)).toBe(false);
  });

  it("um token curto demais no ambiente é recusado: ninguém se protege com '123'", () => {
    process.env.PAINEL_TOKEN = "curto";
    expect(tokenDePainelValido("curto")).toBe(false);
  });

  it("com um token forte, só o valor exato passa", () => {
    const bom = "a".repeat(40);
    process.env.PAINEL_TOKEN = bom;
    expect(tokenDePainelValido(bom)).toBe(true);
    expect(tokenDePainelValido(bom + "x")).toBe(false);
    expect(tokenDePainelValido("b".repeat(40))).toBe(false);
    expect(tokenDePainelValido(null)).toBe(false);
  });
});

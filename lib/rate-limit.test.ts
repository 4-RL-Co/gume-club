import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { RATES, limitar } from "@/lib/rate-limit";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O LIMITE CONTA NO BANCO, E NÃO NA MEMÓRIA DE UM PROCESSO.
 *
 *  ═══ O BUG QUE ESTE TESTE EXISTE PARA IMPEDIR ═══
 *
 *  O limitador era um `Map` na memória. Num servidor só, isso está certo.
 *
 *  Com mais de uma instância, o balde vira um balde POR INSTÂNCIA. Um script que tenta
 *  mil senhas se espalha entre as réplicas, cada uma conta o seu punhado, nenhuma passa
 *  do teto de dez, e **as mil tentativas de senha passam**.
 *
 *  O limite não afrouxa: ele deixa de existir, e continua PARECENDO que existe.
 *
 *  ═══ POR QUE ESTE TESTE FALA COM O POSTGRES DE VERDADE ═══
 *
 *  Um teste com o banco fingido provaria que o código chama o banco, e não que a CONTA
 *  está certa. E a conta é o ponto inteiro: ela tem que ser atômica, a janela não pode
 *  reiniciar a cada tentativa, e uma chave não pode gastar o balde da outra.
 *
 *  Nada disso um `Map` fingido consegue mostrar.
 * ════════════════════════════════════════════════════════════════════
 */

/** Uma chave nova por teste: dois testes que dividem um balde medem um ao outro. */
const nova = (p: string) => `teste:${p}:${Math.random().toString(36).slice(2)}`;

describe("o limite", () => {
  it("deixa passar até o teto e barra o que vem depois", async () => {
    const chave = nova("teto");
    const regra = { limit: 3, windowMs: 60_000 };

    expect((await limitar(chave, regra)).ok).toBe(true);
    expect((await limitar(chave, regra)).ok).toBe(true);
    expect((await limitar(chave, regra)).ok).toBe(true);

    const barrado = await limitar(chave, regra);
    expect(barrado.ok, "o quarto passou: não existe teto").toBe(false);
    if (!barrado.ok) expect(barrado.retryAfter).toBeGreaterThan(0);
  });

  it("uma chave não gasta o balde da outra", async () => {
    const regra = { limit: 1, windowMs: 60_000 };
    const a = nova("a");
    const b = nova("b");

    expect((await limitar(a, regra)).ok).toBe(true);
    expect((await limitar(a, regra)).ok).toBe(false);
    expect(
      (await limitar(b, regra)).ok,
      "o balde é global: uma pessoa barra todas as outras",
    ).toBe(true);
  });

  it("a janela abre de novo depois que ela vence", async () => {
    const chave = nova("janela");
    const regra = { limit: 1, windowMs: 1_000 };

    expect((await limitar(chave, regra)).ok).toBe(true);
    expect((await limitar(chave, regra)).ok).toBe(false);

    // Em vez de esperar um segundo de relógio, envelhece o balde no banco: o teste mede a
    // REGRA, e não a paciência de quem o roda.
    await db.execute(sql`update rate_limits set reset_at = now() - interval '1 second'
                          where key = ${chave}`);

    expect((await limitar(chave, regra)).ok, "a janela nunca reabriu").toBe(true);
  });

  /**
   * ═══ A JANELA NÃO PODE ESCORREGAR PARA A FRENTE ═══
   *
   * Se cada tentativa empurrasse o fim da janela, um script batendo sem parar manteria o
   * balde travado PARA SEMPRE — inclusive contra ele mesmo, mas principalmente contra a
   * pessoa de verdade que dividisse aquele IP. O castigo viraria perpétuo.
   *
   * A janela nasce na primeira tentativa e morre na hora marcada, doa a quem doer.
   */
  it("bater mais não empurra o fim da janela para a frente", async () => {
    const chave = nova("escorrega");
    const regra = { limit: 2, windowMs: 60_000 };

    await limitar(chave, regra);

    const [antes] = await db.execute<{ reset_at: Date }>(
      sql`select reset_at from rate_limits where key = ${chave}`,
    );

    for (let i = 0; i < 5; i++) await limitar(chave, regra);

    const [depois] = await db.execute<{ reset_at: Date }>(
      sql`select reset_at from rate_limits where key = ${chave}`,
    );

    expect(
      new Date(depois!.reset_at).getTime(),
      "cada tentativa empurrou a janela: quem apanha nunca é solto",
    ).toBe(new Date(antes!.reset_at).getTime());
  });

  /**
   * ═══ A CONTA É ATÔMICA ═══
   *
   * Ler, somar um e gravar em três comandos é uma corrida: duas instâncias leem "9", as
   * duas gravam "10", e passaram onze. Num limite de força bruta, isso é a diferença
   * entre limitar e fingir que limita.
   *
   * Vinte pedidos AO MESMO TEMPO, num teto de cinco: exatamente cinco podem passar.
   */
  it("vinte tentativas ao mesmo tempo não furam o teto", async () => {
    const chave = nova("corrida");
    const regra = { limit: 5, windowMs: 60_000 };

    const vereditos = await Promise.all(
      Array.from({ length: 20 }, () => limitar(chave, regra)),
    );

    const passaram = vereditos.filter((v) => v.ok).length;

    expect(
      passaram,
      `${passaram} passaram, e o teto é 5. A soma não é atômica: duas conexões leram o ` +
        "mesmo número e escreveram o mesmo número.",
    ).toBe(5);
  });

  it("o login é o mais apertado dos três", () => {
    expect(RATES.auth.limit).toBeLessThan(RATES.search.limit);
    expect(RATES.auth.limit).toBeLessThan(RATES.write.limit);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  E ELE NÃO PODE VOLTAR PARA A MEMÓRIA, NEM PARA O EDGE.
 *
 *  Estes dois testes não olham para uma função: olham para ONDE o limite mora. Foi o
 *  lugar, e não a conta, que estava errado.
 * ════════════════════════════════════════════════════════════════════
 */
describe("onde o limite mora", () => {
  /** Sem os comentários: eles explicam o bug antigo, e um teste que lesse o arquivo cru
      acusaria a própria nota que documenta o conserto. */
  const semComentarios = (t: string) =>
    t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("o middleware não conta mais nada: no Edge ele não alcança o banco", () => {
    const mw = semComentarios(readFileSync("middleware.ts", "utf8"));

    expect(
      /\blimitar\s*\(|\bhit\s*\(/.test(mw),
      "o limite voltou para o middleware. Ele roda no runtime Edge, que não fala com o " +
        "Postgres: ou ele quebra, ou alguém o 'conserta' com um Map na memória e o limite " +
        "silenciosamente para de existir de novo.",
    ).toBe(false);
  });

  it("a rota de entrada conta, e roda em Node", () => {
    const rota = readFileSync("app/api/auth/[...all]/route.ts", "utf8");
    const codigo = semComentarios(rota);

    expect(codigo, "a rota de entrada não conta ninguém: a força bruta está de graça").toContain(
      "limitar(",
    );

    expect(
      codigo,
      'a rota de entrada precisa de runtime = "nodejs". No Edge o limitador não alcança o ' +
        "Postgres, e o limite de força bruta some sem quebrar nada.",
    ).toMatch(/runtime\s*=\s*"nodejs"/);
  });
});

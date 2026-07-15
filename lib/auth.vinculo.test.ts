import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ⚠️  O ATAQUE DE TOMADA DE CONTA. Rodado de verdade, e ele TEM que falhar.
 *
 *  ═══ O ATAQUE ═══
 *
 *  1. O atacante se cadastra com SENHA usando `victima@gmail.com`, e **nunca verifica**
 *     o e-mail. O Gume deixa: verificar não é obrigatório para usar o app.
 *  2. Meses depois, a vítima entra com o Google dela — o mesmo e-mail.
 *  3. Se o app vincular automaticamente, **ela cai dentro da conta do atacante.** E ele
 *     sabe a senha.
 *
 *  Ela não vai perceber. O e-mail é o dela, o nome é o dela, e a estante está vazia — ela
 *  vai achar que é um bug do app, e vai ficar. E o atacante entra quando quiser, para
 *  sempre.
 *
 *  ═══ POR QUE ESTE TESTE NÃO É UM TESTE DE CONFIGURAÇÃO ═══
 *
 *  Dava para escrever `expect(config.requireLocalEmailVerified).toBe(true)` e ir dormir.
 *  Isso provaria que a gente escreveu uma linha, e não que ela FUNCIONA.
 *
 *  Aqui o ataque acontece inteiro: uma conta de senha não verificada é criada no banco, e
 *  um login do Google com o mesmo e-mail é executado **pelo Better Auth de verdade**,
 *  passando pelo mesmo `handleOAuthUserInfo` que roda em produção.
 *
 *  ═══ COMO O GOOGLE ENTRA SEM O GOOGLE ═══
 *
 *  O Better Auth aceita login por `idToken`, e deixa sobrescrever `verifyIdToken` e
 *  `getUserInfo`. Então o teste devolve o perfil que o Google devolveria — e-mail
 *  verificado e tudo — sem depender de rede, de conta de teste, ou de um navegador.
 *
 *  O caminho do código é o MESMO. O que muda é só quem responde.
 * ════════════════════════════════════════════════════════════════════
 */

const url = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString: url, max: 2 });

const marca = randomUUID().slice(0, 8);
const EMAIL = `vitima-${marca}@gmail.com`;
const SENHA_DO_ATACANTE = "senha-do-atacante-bem-comprida";

/** O perfil que o Google devolveria. E-mail verificado, como o Google sempre faz. */
const PERFIL_DO_GOOGLE = {
  id: `google-${marca}`,
  email: EMAIL,
  emailVerified: true,
  name: "A Vítima",
  image: undefined,
};

/**
 * O MESMO Better Auth do app, com uma única diferença: o Google responde daqui, e não da
 * internet. Tudo o mais — a trava do vínculo, o adaptador, o banco — é o de produção.
 */
function autenticador(opcoes: { requireLocalEmailVerified: boolean }) {
  return betterAuth({
    database: pool,
    secret: process.env.AUTH_SECRET ?? "um-segredo-de-teste-bem-comprido",
    baseURL: "http://localhost:3000",

    emailAndPassword: { enabled: true, minPasswordLength: 12 },

    socialProviders: {
      google: {
        clientId: "id-de-teste",
        clientSecret: "segredo-de-teste",
        // É aqui que o Google entra sem o Google.
        verifyIdToken: async () => true,
        getUserInfo: async () => ({
          user: PERFIL_DO_GOOGLE,
          data: PERFIL_DO_GOOGLE as never,
        }),
      },
    },

    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
        requireLocalEmailVerified: opcoes.requireLocalEmailVerified,
      },
    },

    advanced: {
      database: { generateId: () => randomUUID() },
    },

    user: {
      modelName: "users",
      fields: {
        name: "display_name",
        emailVerified: "email_verified",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      additionalFields: {
        handle: { type: "string", required: false, input: false },
      },
    },

    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: { ...user, handle: `t-${randomUUID().slice(0, 10)}` },
          }),
        },
      },
    },
  });
}

/** O atacante: cadastra com senha, e NUNCA verifica o e-mail. */
async function oAtacanteSeCadastra(auth: ReturnType<typeof autenticador>) {
  await auth.api.signUpEmail({
    body: { email: EMAIL, password: SENHA_DO_ATACANTE, name: "Atacante" },
  });

  const [u] = await db.execute<{ id: string; email_verified: boolean }>(sql`
    select id, email_verified from users where email = ${EMAIL}`);

  // O ataque só existe porque a conta NÃO está verificada. Se este expect falhar, o
  // cenário mudou, e o teste está medindo outra coisa.
  expect(u?.email_verified, "o cenário do ataque exige uma conta NÃO verificada").toBe(false);

  return u!.id;
}

/** A vítima entra com o Google dela. Mesmo e-mail. */
async function aVitimaEntraComGoogle(auth: ReturnType<typeof autenticador>) {
  try {
    return await auth.api.signInSocial({
      body: {
        provider: "google",
        idToken: { token: "um-id-token-que-o-google-teria-assinado" },
      },
    });
  } catch (e) {
    return { erro: e instanceof Error ? e.message : String(e) };
  }
}

async function limpar() {
  await db.execute(sql`delete from users where email = ${EMAIL}`);
}

beforeAll(limpar);
afterAll(async () => {
  await limpar();
  await pool.end();
});

describe("⚠️ tomada de conta pelo vínculo automático", () => {
  /**
   * ═══ O TESTE QUE IMPORTA ═══
   *
   * Com a defesa ligada (que é como o app roda), o Google **não** entra na conta do
   * atacante. Nenhuma linha de `account` do Google aparece pendurada nela.
   */
  it("uma conta de senha NÃO VERIFICADA nunca recebe o Google", async () => {
    const auth = autenticador({ requireLocalEmailVerified: true });

    const idDoAtacante = await oAtacanteSeCadastra(auth);
    await aVitimaEntraComGoogle(auth);

    const [vinculo] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n
        from account
       where "userId" = ${idDoAtacante}::uuid
         and "providerId" = 'google'`);

    expect(
      Number(vinculo?.n ?? 0),
      "O GOOGLE ENTROU NA CONTA DO ATACANTE. A vítima acabou de perder a conta dela, e " +
        "o atacante sabe a senha. Ver requireLocalEmailVerified em lib/auth.ts.",
    ).toBe(0);

    // E a conta do atacante continua não verificada: o login do Google não pode ter
    // "verificado" o e-mail dele de brinde.
    const [u] = await db.execute<{ email_verified: boolean }>(sql`
      select email_verified from users where id = ${idDoAtacante}::uuid`);

    expect(
      u?.email_verified,
      "o login do Google verificou o e-mail da conta do atacante de graça",
    ).toBe(false);
  }, 30_000);

  /**
   * ═══ E O TESTE QUE PROVA QUE O PRIMEIRO NÃO PASSA POR ACIDENTE ═══
   *
   * Um teste de segurança que passaria mesmo com a defesa desligada não está testando a
   * defesa: está testando outra coisa, e ninguém sabe o quê.
   *
   * Aqui a defesa é DESLIGADA de propósito, e o ataque **funciona**. É essa a prova de
   * que o teste de cima está olhando para o lugar certo.
   *
   * Este é o único lugar do repositório onde `requireLocalEmailVerified: false` aparece,
   * e ele existe para mostrar o estrago.
   */
  it("e com a defesa DESLIGADA, o ataque funciona (é por isso que ela existe)", async () => {
    await limpar();

    const auth = autenticador({ requireLocalEmailVerified: false });

    const idDoAtacante = await oAtacanteSeCadastra(auth);
    await aVitimaEntraComGoogle(auth);

    const [vinculo] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n
        from account
       where "userId" = ${idDoAtacante}::uuid
         and "providerId" = 'google'`);

    expect(
      Number(vinculo?.n ?? 0),
      "com a defesa desligada, o ataque DEVERIA funcionar. Se ele não funciona nem assim, " +
        "o teste de cima está passando por outro motivo, e não por causa da defesa.",
    ).toBe(1);
  }, 30_000);
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  E O CANÁRIO DA DEPENDÊNCIA.
 *
 *  A defesa mora numa biblioteca, e o padrão dela pode mudar numa versão menor. Este
 *  teste lê o CÓDIGO instalado e quebra a build se a trava sumir de lá.
 *
 *  Não é paranoia: `requireLocalEmailVerified` não existia antes da 1.6, e uma versão que
 *  a remova ou inverta o padrão passaria por um `pnpm update` sem ninguém notar.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o canário da biblioteca", () => {
  it("o Better Auth ainda tem a trava do e-mail local", async () => {
    const { readFileSync } = await import("node:fs");
    const { globSync } = await import("node:fs");

    const [caminho] = globSync(
      "node_modules/.pnpm/better-auth@*/node_modules/better-auth/dist/oauth2/link-account.mjs",
    );

    expect(caminho, "não achei o link-account.mjs: a varredura quebrou").toBeTruthy();

    const fonte = readFileSync(caminho!, "utf8");

    expect(
      fonte,
      "a trava `requireLocalEmailVerified` sumiu do Better Auth. NÃO ATUALIZE sem ler " +
        "oauth2/link-account.mjs: é ela que impede a tomada de conta.",
    ).toContain("requireLocalEmailVerified");

    // E o padrão dela continua sendo TRUE.
    expect(fonte).toMatch(/requireLocalEmailVerified\s*\?\?\s*true/);
  });
});

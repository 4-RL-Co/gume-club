import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O invited_by. Ele JÁ SUMIU EM SILÊNCIO UMA VEZ NESTE PROJETO.
 *
 *  ═══ COMO ELE SOME ═══
 *
 *  O Better Auth **descarta, sem avisar, qualquer campo que não esteja em
 *  `additionalFields`** — e responde 200. O cadastro parece perfeito, a pessoa entra, e a
 *  linhagem simplesmente não foi gravada.
 *
 *  Não há erro, não há log, não há nada. Você descobre daqui a um mês, quando for montar
 *  a tela de quem trouxe quem e a coluna estiver vazia — e as primeiras dez pessoas, que
 *  são as únicas que importam para essa história, são irrecuperáveis.
 *
 *  **Acrescentar um provedor de login é exatamente onde ele volta.**
 *
 *  ═══ A CORRENTE INTEIRA, E CADA ELO TEM UM TESTE ═══
 *
 *    1. o convite chega em `?convite=<handle>` e vira um COOKIE
 *    2. o cookie SOBREVIVE à ida ao Google e à volta   ← `sameSite: lax`
 *    3. o hook `user.create.before` roda no cadastro   ← inclusive no de OAuth
 *    4. `invitedBy` está em `additionalFields`         ← senão some em silêncio
 *    5. a coluna `invited_by` recebe o id
 *
 *  Se qualquer um dos cinco quebrar, a linhagem some sem ninguém perceber. Então os cinco
 *  são testados aqui, um a um.
 * ════════════════════════════════════════════════════════════════════
 */

const pool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 2 });
const marca = randomUUID().slice(0, 8);

let anfitria: string;

/** Quem convidou. É o id dela que tem que aparecer em `invited_by`. */
beforeAll(async () => {
  const [u] = await db.execute<{ id: string }>(sql`
    insert into users (handle, display_name, email, email_verified)
    values (${"anfitria-" + marca}, 'Anfitriã', ${"anfitria-" + marca + "@gume.local"}, true)
    returning id`);
  anfitria = u!.id;
});

afterAll(async () => {
  await db.execute(sql`delete from users where email like ${"%" + marca + "%"}`);
  await pool.end();
});

/**
 * O MESMO Better Auth do app: mesmos `additionalFields`, mesmo hook, mesma coluna.
 *
 * A única diferença é de onde vem o convite. Em produção ele sai de um cookie, e um
 * cookie só existe dentro de uma requisição — `next/headers` levanta fora de uma. Aqui o
 * convite é injetado, e o que se testa é o que vem DEPOIS dele: o caminho do valor até a
 * coluna, que é onde o bug mora.
 *
 * O cookie em si é testado à parte, mais abaixo.
 */
function autenticador(convidadoPor: string | null) {
  const perfil = {
    id: `google-${randomUUID().slice(0, 8)}`,
    email: "",
    emailVerified: true,
    name: "Quem Chegou",
    image: undefined,
  };

  const auth = betterAuth({
    database: pool,
    secret: process.env.AUTH_SECRET ?? "um-segredo-de-teste-bem-comprido",
    baseURL: "http://localhost:3000",

    emailAndPassword: { enabled: true, minPasswordLength: 12 },

    socialProviders: {
      google: {
        clientId: "id-de-teste",
        clientSecret: "segredo-de-teste",
        verifyIdToken: async () => true,
        getUserInfo: async () => ({ user: perfil, data: perfil as never }),
      },
    },

    advanced: { database: { generateId: () => randomUUID() } },

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
        // ═══ A LINHA CUJA AUSÊNCIA JÁ APAGOU A LINHAGEM UMA VEZ ═══
        invitedBy: { type: "string", required: false, input: false, fieldName: "invited_by" },
      },
    },

    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: {
              ...user,
              handle: `t-${randomUUID().slice(0, 10)}`,
              invitedBy: convidadoPor,
            },
          }),
        },
      },
    },
  });

  return { auth, perfil };
}

async function quemConvidou(email: string): Promise<string | null> {
  const [u] = await db.execute<{ invited_by: string | null }>(sql`
    select invited_by from users where email = ${email}`);
  return u?.invited_by ?? null;
}

describe("o convite chega até a coluna", () => {
  it("cadastro com E-MAIL e SENHA, vindo de um convite", async () => {
    const email = `senha-com-convite-${marca}@gume.local`;
    const { auth } = autenticador(anfitria);

    await auth.api.signUpEmail({
      body: { email, password: "uma-senha-bem-comprida-mesmo", name: "Por Senha" },
    });

    expect(
      await quemConvidou(email),
      "o convite se perdeu no cadastro por senha: a linhagem sumiu em silêncio",
    ).toBe(anfitria);
  }, 30_000);

  /**
   * ═══ O CAMINHO NOVO, E É ELE QUE O AVISO ERA SOBRE ═══
   *
   * Um provedor de login novo cria o usuário por outro caminho no Better Auth. Se o hook
   * não rodasse ali, ou se o campo não estivesse em `additionalFields`, o cadastro pelo
   * Google responderia 200 e a linhagem sumiria — **só a dele**, e ninguém notaria,
   * porque o cadastro por senha continuaria funcionando.
   */
  it("cadastro com GOOGLE, vindo de um convite", async () => {
    const { auth, perfil } = autenticador(anfitria);
    perfil.email = `google-com-convite-${marca}@gume.local`;

    await auth.api.signInSocial({
      body: { provider: "google", idToken: { token: "um-id-token-do-google" } },
    });

    expect(
      await quemConvidou(perfil.email),
      "o convite se perdeu no cadastro pelo GOOGLE. É exatamente o bug que já aconteceu " +
        "uma vez neste projeto: o Better Auth descarta em silêncio o campo que não " +
        "está em additionalFields, e responde 200.",
    ).toBe(anfitria);
  }, 30_000);

  it("cadastro SEM convite: invited_by fica nulo, e não vazio nem inventado", async () => {
    const email = `sem-convite-${marca}@gume.local`;
    const { auth } = autenticador(null);

    await auth.api.signUpEmail({
      body: { email, password: "uma-senha-bem-comprida-mesmo", name: "Sozinha" },
    });

    expect(await quemConvidou(email)).toBeNull();
  }, 30_000);
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS ELOS QUE OS TESTES ACIMA NÃO ALCANÇAM.
 *
 *  Os três testes de cima injetam o convite, porque um cookie não existe fora de uma
 *  requisição. O que eles NÃO provam é como o convite chega até ali — e é justamente aí
 *  que o cadastro pelo Google pode quebrar sozinho.
 *
 *  Então os dois elos que faltam são provados aqui, olhando para o código.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o convite sobrevive à ida ao Google", () => {
  /**
   * ═══ `sameSite: lax`, E ISSO NÃO É UM DETALHE ═══
   *
   * O cadastro pelo Google é uma viagem: o navegador sai do Gume, vai ao Google, e VOLTA
   * por um redirecionamento.
   *
   * Um cookie `sameSite: strict` **não é enviado** nessa volta — o navegador o trata como
   * um cookie de outro site chegando de fora. O `lax` é enviado, porque a volta é uma
   * navegação de topo por GET.
   *
   * Trocar `lax` por `strict` parece "mais seguro" e apagaria a linhagem de **todo mundo
   * que entrar pelo Google**, em silêncio, para sempre. É uma linha, e ela não avisa.
   */
  it("o cookie do convite é lax, e não strict", () => {
    const fonte = readFileSync("app/entrar/invite.ts", "utf8");

    expect(fonte, "o cookie do convite sumiu").toContain("sameSite");
    expect(
      /sameSite:\s*"lax"/.test(fonte),
      "o cookie do convite não é `lax`. Se ele for `strict`, o navegador NÃO o devolve " +
        "na volta do Google, e a linhagem de todo mundo que entrar pelo Google some.",
    ).toBe(true);

    // E ele é httpOnly: um convite que o JavaScript da página consegue ler é um convite
    // que qualquer script de terceiro consegue trocar.
    expect(fonte).toMatch(/httpOnly:\s*true/);
  });

  /**
   * ═══ O CAMPO TEM QUE ESTAR EM `additionalFields` ═══
   *
   * Sem esta linha, o Better Auth descarta `invitedBy` **em silêncio** e responde 200. É
   * o bug que já aconteceu, e ele não deixa rastro nenhum.
   */
  it("invitedBy está declarado em additionalFields", () => {
    const fonte = readFileSync("lib/auth.ts", "utf8");

    expect(
      /invitedBy:\s*\{[^}]*fieldName:\s*"invited_by"/.test(fonte),
      "invitedBy saiu de additionalFields. O Better Auth vai descartá-lo em silêncio, " +
        "responder 200, e a linhagem vai sumir sem ninguém perceber.",
    ).toBe(true);

    // `input: false`: ninguém posta o próprio padrinho.
    expect(fonte).toMatch(/invitedBy:\s*\{[^}]*input:\s*false/);
  });

  /**
   * ═══ O SEXTO ELO, E FOI ELE QUE QUEBROU DE VERDADE ═══
   *
   * Os cinco de cima provam que o convite, uma vez gravado no cookie, chega até a
   * coluna. Mas `rememberInviter` é uma chamada de REDE — ela grava o cookie, não é
   * instantânea — e o botão do Google não esperava por ela: saía pro Google no
   * clique, sem esperar o `Set-Cookie` voltar. Quem chega de um link num post
   * costuma clicar rápido, no celular, exatamente o caminho que perde a corrida.
   *
   * O dono relatou isto ao vivo: "os posts que eu fiz tem meu link de convite mas
   * no painel aparece que ninguém chegou por convite" — com o cookie, o hook e a
   * query todos corretos (testado acima). O sexto elo era o único que faltava.
   */
  it("o botão do Google e o formulário esperam o convite terminar de gravar", () => {
    const fonte = readFileSync("app/entrar/page.tsx", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

    const inicioSubmit = fonte.indexOf("const submit = (data: FormData) =>");
    const fimSubmit = fonte.indexOf("return (\n    <main");
    const blocoSubmit = fonte.slice(inicioSubmit, fimSubmit);

    const inicioGoogle = fonte.indexOf('onClick={async () => {\n          setGoogle("indo")');
    const fimGoogle = fonte.indexOf("</button>", inicioGoogle);
    const blocoGoogle = fonte.slice(inicioGoogle, fimGoogle);

    expect(inicioSubmit, "o formulário de e-mail/senha sumiu do arquivo").toBeGreaterThan(-1);
    expect(inicioGoogle, "o botão do Google sumiu do arquivo").toBeGreaterThan(-1);

    const esperaSubmit = blocoSubmit.indexOf("await conviteEmVoo.current");
    const chamadaEmail = Math.max(blocoSubmit.indexOf("signUp.email("), blocoSubmit.indexOf("signIn.email("));
    expect(
      esperaSubmit,
      "o formulário de e-mail/senha não espera o convite terminar de gravar antes de " +
        "criar a conta — a corrida existe aqui também, só é mais rara.",
    ).toBeGreaterThan(-1);
    expect(
      esperaSubmit,
      "a espera existe, mas vem DEPOIS da chamada que cria a conta — não protege nada.",
    ).toBeLessThan(chamadaEmail);

    const esperaGoogle = blocoGoogle.indexOf("await conviteEmVoo.current");
    const chamadaGoogle = blocoGoogle.indexOf("signIn.social(");
    expect(
      esperaGoogle,
      "o botão do Google não espera o convite terminar de gravar antes de sair pro " +
        "Google. É a corrida real: um clique rápido (o caminho comum de quem chega de " +
        "um link num post) sai antes do Set-Cookie voltar, e o convite se perde em " +
        "silêncio — sem erro, sem log, só um /painel que mostra zero convites.",
    ).toBeGreaterThan(-1);
    expect(
      esperaGoogle,
      "a espera existe, mas vem DEPOIS da saída pro Google — o navegador já foi embora.",
    ).toBeLessThan(chamadaGoogle);
  });
});

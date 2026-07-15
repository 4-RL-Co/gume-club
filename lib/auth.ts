import { randomUUID } from "node:crypto";
import { handleDe } from "@/lib/handles";
import { enviar } from "@/lib/email";
import { mandar } from "@/lib/codigo-por-email";
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { Pool } from "pg";

/**
 * ════════════════════════════════════════════════════════════════════
 *  Auth. Hand-written, and reviewed by a human. See SECURITY.md and
 *  AGENTS.md: auth flows and session management are not vibe-coded.
 *
 *  This module answers ONE question: who is this. That is authentication.
 *  It decides nothing about what they may see or touch: that is
 *  authorization, it lives in lib/authz.ts, and it is a separate file on
 *  purpose. Being logged in means nothing on its own.
 *
 *  Password hashing is Better Auth's, never hand-rolled.
 * ════════════════════════════════════════════════════════════════════
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const secret = process.env.AUTH_SECRET;
if (!secret) throw new Error("AUTH_SECRET is not set");

/** "Ana Souza" -> "ana-souza". A handle is the reader's public address. */
/**
 * O handle derivado do nome ou do e-mail. A regra mora em lib/handles.ts, e não aqui:
 * a mesma limpeza é usada em mais de um lugar, e duas cópias dela divergem.
 */
function handleFrom(seed: string): string {
  return handleDe(seed);
}

/**
 * Cached across hot reloads, for the same reason as lib/db/index.ts: Next
 * re-evaluates this module on every edit in dev, and a fresh Pool per reload
 * exhausts Postgres max_connections within an afternoon. In production the
 * module is evaluated once and this is a no-op.
 */
const globalForAuth = globalThis as unknown as { __gumePool?: Pool };

const pool = globalForAuth.__gumePool ?? new Pool({ connectionString: url, max: 10 });
if (process.env.NODE_ENV !== "production") globalForAuth.__gumePool = pool;

export const auth = betterAuth({
  database: pool,
  secret,
  baseURL: process.env.APP_URL ?? "http://localhost:3000",

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
  },

  /**
   * ════════════════════════════════════════════════════════════════════
   *  VERIFICAR O E-MAIL. É o portão anti-spam, e não um detalhe de auth.
   *
   *  Com cadastro ABERTO, /@handle indexável é uma fazenda de SEO à espera
   *  de acontecer. É o que SEMPRE acontece: mil contas, mil bios com link,
   *  e o Google indexando todas.
   *
   *  A verificação é o que separa uma pessoa de um script. E ela NÃO
   *  BLOQUEIA NADA do produto: quem não verificou usa o app inteiro, com a
   *  estante inteira. O que ele não tem é PERFIL PÚBLICO e INDEXÁVEL, e um
   *  perfil que o Google não vê não vale nada para um spammer.
   *
   *  `requireEmailVerification: false` é DELIBERADO. Trancar a porta de
   *  entrada machuca a pessoa de verdade (que não achou o e-mail, que caiu
   *  no spam) e não machuca o script, que verifica e segue. O portão está
   *  na SAÍDA (a indexação), e não na entrada.
   * ════════════════════════════════════════════════════════════════════
   */
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await enviar({
        para: user.email,
        assunto: "Confirme o seu e-mail no Gume",
        texto:
          `Oi.\n\n` +
          `Clique aqui para confirmar o seu e-mail:\n${url}\n\n` +
          `Enquanto você não confirmar, o Gume funciona igual: a sua estante é sua, e ` +
          `está tudo lá. O que muda é que o seu perfil não aparece para quem não te ` +
          `conhece, e não é indexado.\n\n` +
          `Se não foi você quem se cadastrou, é só ignorar este e-mail.\n`,
      });
    },
  },

  /**
   * ════════════════════════════════════════════════════════════════════
   *  O GOOGLE ENTRA. O GITHUB SAI.
   *
   *  ═══ POR QUE O GITHUB SAIU ═══
   *
   *  1. Ele **não funcionava**. O log dizia, a cada carga:
   *
   *         WARN [Better Auth]: Social provider github is missing clientId or clientSecret
   *
   *     O botão estava na tela de entrar e não abria. **Uma porta que aparece e não
   *     funciona é pior do que porta nenhuma:** a pessoa clica, nada acontece, e ela
   *     conclui que o app está quebrado antes de ter uma conta.
   *
   *  2. "Entrar com GitHub" num app de LEITURA confunde leitor. O público do Gume não
   *     sabe o que é GitHub, e não deveria precisar saber.
   *
   *  3. E ele traz uma vulnerabilidade de graça: o GitHub pode entregar e-mail **não
   *     verificado**, e e-mail não verificado é o vetor clássico de tomada de conta.
   *     O Google sempre verifica. Com Google + senha, essa vulnerabilidade não nasce.
   *
   *  ═══ O GITHUB NUNCA FOI SOBRE LOGIN ═══
   *
   *  É sobre IDENTIDADE. A insígnia de Construtor precisa do handle do GitHub para casar
   *  com quem tem PR mesclado — e isso é uma ação de CONFIGURAÇÕES ("conectar o GitHub"),
   *  feita por quem já está dentro, depois do lançamento. Não é uma porta de entrada.
   * ════════════════════════════════════════════════════════════════════
   */
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },

  /**
   * ════════════════════════════════════════════════════════════════════
   *  ⚠️  O VÍNCULO DE CONTA. É AQUI QUE UMA CONTA É ROUBADA.
   *
   *  ═══ O ATAQUE ═══
   *
   *  1. Eu me cadastro com SENHA usando `victima@gmail.com`, e **nunca verifico** o
   *     e-mail. O Gume deixa: verificar não é obrigatório para usar o app.
   *  2. Meses depois, a vítima entra com o Google dela — o mesmo e-mail.
   *  3. Se o app vincular automaticamente, **ela cai dentro da minha conta.** E eu sei a
   *     senha.
   *
   *  Ela não vai perceber: o e-mail é o dela, o nome é o dela, e a estante… é a minha,
   *  vazia. Ela vai achar que é um bug e vai ficar. E eu entro quando quiser.
   *
   *  ═══ A DEFESA, E ELA É EXPLÍCITA ═══
   *
   *  `requireLocalEmailVerified: true`. Uma conta de senha com e-mail **não verificado**
   *  nunca recebe vínculo automático de OAuth nenhum. Sem exceção.
   *
   *  Este é o padrão do Better Auth 1.6, e ele está escrito aqui **mesmo assim** — porque
   *  depender de um padrão é depender de ninguém mudá-lo. Um `?? true` numa dependência é
   *  uma promessa que a próxima versão menor pode desfazer em silêncio.
   *
   *  `lib/auth.vinculo.test.ts` roda o ataque inteiro e prova que ele falha.
   *
   *  ═══ E O `trustedProviders` NÃO É UMA EXCEÇÃO A ISSO ═══
   *
   *  Lendo o código da biblioteca (oauth2/link-account.mjs), ele só dispensa a checagem
   *  do e-mail **do lado do provedor** — e o Google sempre verifica, então ele não muda
   *  nada aqui. A trava do e-mail **local** continua valendo para todo mundo.
   * ════════════════════════════════════════════════════════════════════
   */
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: true,
    },
  },

  /**
   * ════════════════════════════════════════════════════════════════════
   *  O CÓDIGO POR E-MAIL. E ele NÃO é um segundo fator.
   *
   *  ═══ O NOME IMPORTA, E ELE NÃO É "2FA" ═══
   *
   *  **Código por e-mail não é um segundo fator se o reset de senha também vai por
   *  e-mail: é o mesmo fator, duas vezes.**
   *
   *  Ele protege contra senha vazada e reusada — que é o ataque real num app deste
   *  tamanho — e não protege contra invasão do e-mail. Chamar de "2FA" seria prometer
   *  uma segurança que não existe.
   *
   *  Na tela ele se chama **"código por e-mail"**, e em lugar nenhum "autenticação de
   *  dois fatores" nem "verificação em duas etapas". O plugin do Better Auth se chama
   *  `twoFactor` porque é o nome dele; a PROMESSA que o app faz é outra.
   *
   *  ═══ O QUE MUDA, E É SÉRIO ═══
   *
   *  O e-mail passa a estar no CAMINHO CRÍTICO DO LOGIN.
   *
   *      ANTES   e-mail caído  →  ninguém se cadastra
   *      AGORA   e-mail caído  →  NINGUÉM ENTRA
   *
   *  Por isso o envio de verdade passa por lib/codigo-por-email.ts, que é quem sabe
   *  dizer à tela se o e-mail **saiu mesmo**. O Better Auth não sabe: ele engole o erro
   *  do envio e responde "enviado". Ver a nota lá.
   * ════════════════════════════════════════════════════════════════════
   */
  /**
   * ════════════════════════════════════════════════════════════════════
   *  Opcional, e NUNCA por SMS.
   *
   *  ═══ POR QUE O E-MAIL, E NÃO UM APP AUTENTICADOR ═══
   *
   *  Porque o app autenticador é um degrau que quase ninguém sobe. Ele exige instalar um
   *  aplicativo, escanear um QR code, entender o que é um "segredo TOTP", e guardar dez
   *  códigos de recuperação — tudo isso ANTES de ganhar qualquer proteção.
   *
   *  Um 2FA que a pessoa não liga não protege ninguém. E o Gume é um app de leitura, e
   *  não um banco: o público dele não vai instalar o Authy para guardar uma estante.
   *
   *  O código no e-mail é mais fraco que o TOTP, e é honesto dizer isso. Mas ele é um
   *  segundo fator DE VERDADE para quem entra com senha: quem descobre a senha ainda
   *  precisa da caixa de entrada. E ele é ligado com dois cliques, o que quer dizer que
   *  ele vai ser ligado.
   *
   *  ═══ O QUE ELE NÃO PROTEGE, E ISSO PRECISA ESTAR ESCRITO ═══
   *
   *  Quem entra pelo **Google** já tem o e-mail como fator. Um código enviado para o
   *  mesmo Gmail que acabou de autenticar a pessoa não acrescenta nada — e por isso o
   *  2FA é oferecido, e nunca imposto: para quem usa Google, ele é teatro.
   *
   *  A proteção real dele é para quem entra com SENHA.
   *
   *  ═══ SMS, NUNCA ═══
   *
   *  Um chip se clona convencendo um atendente de loja. Não precisa de hacker: precisa de
   *  um dia ruim de alguém no balcão.
   *
   *  ═══ OS CÓDIGOS DE RECUPERAÇÃO CONTINUAM OBRIGATÓRIOS ═══
   *
   *  Alguém diria que com o e-mail eles perdem o sentido. Não perdem: **quem perde o
   *  acesso ao e-mail perde tudo** — não recebe o código, não recupera a senha, e não tem
   *  a quem recorrer, porque o suporte do Gume é uma pessoa só, num domingo.
   *
   *  Os dez códigos são a única porta que sobra. A tela mostra uma vez, e exige que a
   *  pessoa confirme que guardou. Ver components/codigo-email.tsx.
   *
   *  ═══ E O CÓDIGO NÃO FICA EM TEXTO PURO NO BANCO ═══
   *
   *  O padrão do plugin é `storeOTP: "plain"` (lido no código, em plugins/two-factor/
   *  otp/index.mjs). Um código de seis dígitos em texto puro numa tabela é um código que
   *  qualquer leitura do banco entrega — e um dump de banco vazado passa a valer um
   *  segundo fator.
   *
   *  Aqui ele é **cifrado**, com o AUTH_SECRET.
   * ════════════════════════════════════════════════════════════════════
   */
  plugins: [
    twoFactor({
      issuer: "Gume",

      /**
       * O 2FA só liga DEPOIS de funcionar uma vez. Entre "pedi para ligar" e "está
       * ligado" existe um passo obrigatório: receber o código e digitá-lo.
       *
       * Sem isso, alguém cujo e-mail não chega (caixa de spam, servidor fora) tranca a
       * própria conta com um fator que nunca funcionou, e descobre no dia seguinte.
       */
      skipVerificationOnEnable: false,

      otpOptions: {
        /**
         * DEZ MINUTOS. Tempo de achar o e-mail, olhar no spam, e voltar — sem ter que
         * pedir outro código e recomeçar.
         *
         * E é um TETO, e não um convite: um código que vale uma hora é um código que fica
         * numa caixa de entrada invadida, esperando alguém passar.
         */
        period: 10,

        /**
         * CIFRADO. O padrão do plugin é `plain` — texto puro. Um dump de banco vazado
         * passaria a valer um código de entrada.
         */
        storeOTP: "encrypted",

        /**
         * CINCO ERROS, e o código morre.
         *
         * São seis dígitos: um milhão de combinações. Sem teto de tentativa, um script com
         * dez minutos e um código vivo faz força bruta com folga.
         *
         * E o `consumeVerificationValue` do plugin garante o USO ÚNICO: um código que
         * funcionou não funciona de novo, nem para quem estava olhando por cima do ombro.
         */
        allowedAttempts: 5,

        /**
         * ═══ O ENVIO DE VERDADE, E A VERDADE SOBRE ELE ═══
         *
         * O Better Auth chama isto e **joga fora o resultado**: se o e-mail falhar, ele
         * responde `status: true` mesmo assim, e a tela diz "código enviado" quando nada
         * saiu.
         *
         * `mandar()` (lib/codigo-por-email.ts) grava o que aconteceu de verdade numa caixa
         * por requisição, e a ação de servidor lê essa caixa. É assim que a tela consegue
         * dizer "não deu" quando não deu.
         *
         * Ele também limita os pedidos POR PESSOA: o limite do middleware é por IP, e um
         * atacante com mil IPs encheria a caixa de entrada da vítima de códigos.
         */
        sendOTP: async ({ user, otp }) => {
          await mandar(user.id, () =>
            enviar({
              para: user.email,
              assunto: `${otp} é o seu código de entrada no Gume`,
              texto:
                "Oi.\n\n" +
                "O seu código para entrar no Gume é:\n\n" +
                `    ${otp}\n\n` +
                "Ele vale por dez minutos, e só serve uma vez.\n\n" +
                "Se não foi você quem pediu, alguém tem a sua senha. Troque a senha " +
                "agora, e o código acima não serve para nada.\n",
            }),
          );
        },
      },
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  // Cookies: secure, httpOnly, sameSite. The pre-launch checklist in SECURITY.md.
  advanced: {
    // users.id is a uuid, so every id Better Auth mints has to be one too.
    // The default is a random string, which a uuid column rejects outright.
    database: { generateId: () => randomUUID() },
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
  },

  // Our own users table, not a second one alongside it. A reader is one row.
  user: {
    modelName: "users",
    fields: {
      name: "display_name",
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      // Never `input: true`: a user must not be able to POST their own
      // librarian_tier and promote themselves.
      handle: { type: "string", required: false, input: false },
      locale: { type: "string", required: false, input: false },
      librarianTier: { type: "number", required: false, input: false, fieldName: "librarian_tier" },
      /**
       * Better Auth silently DROPS any field it was not told about. Without this
       * line the hook set invitedBy and it never reached the table: signups looked
       * perfectly healthy and the lineage vanished. That is exactly the failure we
       * would have found in a fortnight, with the first ten readers already
       * unrecoverable. `input: false`: nobody gets to POST their own inviter.
       */
      invitedBy: { type: "string", required: false, input: false, fieldName: "invited_by" },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // users.handle is NOT NULL and unique, and Better Auth does not know
          // about it. Derive one, then walk suffixes until it is free.
          /**
           * O handle LIVRE, e ele contorna o RESERVADO em silêncio.
           *
           * O banco tem um gatilho que recusa handle reservado (migration 0027), e é
           * ele a defesa de verdade. Mas quem se chama "Gabriel" não pode receber um
           * erro de banco na cara, no meio do cadastro: ele recebe `@gabriel-2` e nem
           * fica sabendo que houve uma decisão.
           *
           * A consulta pergunta as duas coisas de uma vez (já existe? é reservado?),
           * e a comparação do reservado é sobre a forma CANÔNICA: "adm1n" e "ádmin"
           * são "admin", e nenhum dos dois passa.
           */
          const base = handleFrom(user.name || user.email);
          let handle = base;
          for (let n = 2; ; n++) {
            const { rows } = await pool.query(
              `select 1
                 from (select 1) _
                where exists (select 1 from users where handle = $1)
                   or exists (select 1 from handles_reservados
                               where canonico = handle_canonico($1))
                limit 1`,
              [handle],
            );
            if (rows.length === 0) break;
            handle = `${base}-${n}`;
          }
          // Lineage, captured at the only moment it is knowable.
          return { data: { ...user, handle, invitedBy: await inviterId() } };
        },
        after: async (user) => {
          await adoptSeededShelf(user.id);
        },
      },
    },
  },
});

/**
 * Who invited this person.
 *
 * There is no invite screen, and none is being built right now. But who brought
 * whom is knowable ONLY at signup: build the screen in a fortnight and the
 * lineage of the first ten readers is gone forever. So it is captured now, in one
 * function, and simply stored.
 *
 * The invite arrives as ?convite=<handle>, which /entrar puts into a short-lived
 * cookie so it survives the OAuth round trip to GitHub and back. An unknown or
 * missing handle is null, never an error: nobody is turned away for a bad link.
 */
async function inviterId(): Promise<string | null> {
  try {
    const { cookies } = await import("next/headers");
    const handle = (await cookies()).get(INVITE_COOKIE)?.value?.trim();
    if (!handle) return null;

    const { rows } = await pool.query(
      "select id from users where handle = $1 and deleted_at is null limit 1",
      [handle],
    );
    return rows[0]?.id ?? null;
  } catch {
    // next/headers throws outside a request scope. A signup without a request is
    // not a thing, but a lineage lookup must never be what breaks a signup.
    return null;
  }
}

export const INVITE_COOKIE = "gume_convite";

/**
 * The seeded shelf belongs to a placeholder reader with no way to log in. The
 * first real reader to sign up inherits it, once, and the placeholder is deleted
 * so the second reader inherits nothing.
 *
 * All in one transaction: a half-adopted shelf, with the books moved but the
 * placeholder still standing, would hand the next signup somebody else's books.
 */
const SEED_HANDLE = "olegas";
const SEED_EMAIL = "olegas@gume.local";

async function adoptSeededShelf(newUserId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");

    // Locked, so two simultaneous signups cannot both inherit it.
    const { rows } = await client.query(
      `select id from users
        where handle = $1 and email = $2 and id <> $3
        for update skip locked`,
      [SEED_HANDLE, SEED_EMAIL, newUserId],
    );
    const seed = rows[0];
    if (!seed) {
      await client.query("commit");
      return;
    }

    for (const table of ["library_entries", "owned_copies", "ratings", "reviews"]) {
      // Table names are from this literal list, never from user input.
      await client.query(`update ${table} set user_id = $1 where user_id = $2`, [newUserId, seed.id]);
    }
    // readings hang off library_entries, so they follow.

    await client.query("delete from users where id = $1", [seed.id]);
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, editions, libraryEntries } from "@/lib/db/schema";
import { podeSerDescoberto, LIVROS_QUE_PROVAM } from "@/lib/descoberta";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A ESTANTE TAMBÉM PROVA QUE TEM GENTE AQUI.
 *
 *  ═══ O BUG QUE ISTO CONSERTA ═══
 *
 *  Ser descoberto exigia e-mail verificado, e só. Quem entra por Google ou GitHub
 *  ganha isso de graça; quem entra por e-mail e senha precisa clicar num link — e em
 *  produção quatro dos sete nunca clicaram.
 *
 *  Um deles tinha a MAIOR ESTANTE DO SITE, 503 livros, e estava fora do explorar, das
 *  listas, do "pessoas" e dos buscadores. Nenhuma tela dizia isso a ele. O único
 *  sintoma era ninguém nunca segui-lo, e não havia como ligar uma coisa à outra.
 *
 *  ═══ O QUE ESTE TESTE PROTEGE DOS DOIS LADOS ═══
 *
 *  Para BAIXO: o portão não pode cair. Uma vitrine sem portão vira fazenda de spam no
 *  dia em que o cadastro abrir, e aí o estrago é irreversível e público.
 *
 *  Para CIMA: uma estante de verdade tem que abrir a porta. Senão voltamos a esconder
 *  quem mais tem o que mostrar.
 *
 *  Precisa de banco. O CI sobe um.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados: string[] = [];
let comEmail: string;
let semEmailComEstante: string;
let semEmailSemEstante: string;

async function pessoa(h: string, verificado: boolean): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ handle: `${h}-${marca}`, email: `${h}-${marca}@desc.test`, emailVerified: verificado })
    .returning({ id: users.id });
  criados.push(u!.id);
  return u!.id;
}

/** Põe `quantos` livros públicos COM CAPA na estante da pessoa. */
async function encherEstante(userId: string, quantos: number) {
  for (let i = 0; i < quantos; i++) {
    const [w] = await db
      .insert(works)
      .values({ slug: `desc-${marca}-${userId.slice(0, 8)}-${i}`, title: `zz desc ${marca} ${userId.slice(0, 8)} ${i}` })
      .returning({ id: works.id });
    await db.insert(editions).values({ workId: w!.id, coverUrl: "https://covers.openlibrary.org/b/id/1-L.jpg" });
    await db.insert(libraryEntries).values({
      userId, workId: w!.id, status: "read", visibility: "public",
    });
  }
}

beforeAll(async () => {
  comEmail = await pessoa("desc-com-email", true);
  semEmailComEstante = await pessoa("desc-sem-email-cheia", false);
  semEmailSemEstante = await pessoa("desc-sem-email-vazia", false);

  await encherEstante(comEmail, 1);
  // Exatamente o corte: é o caso do leitor dos 503 livros, em miniatura.
  await encherEstante(semEmailComEstante, LIVROS_QUE_PROVAM);
  // Dois livros não distinguem uma pessoa de um ruído.
  await encherEstante(semEmailSemEstante, 2);
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
  await db.execute(sql`delete from works where slug like ${`desc-${marca}-%`}`);
});

/** Roda a regra de verdade, do jeito que as quatro consultas a usam: alias `u`. */
async function podeAparecer(userId: string): Promise<boolean> {
  const [row] = await db.execute<{ pode: boolean }>(sql`
    select ${podeSerDescoberto} as pode from users u where u.id = ${userId}::uuid`);
  return row?.pode ?? false;
}

describe("quem pode ser descoberto", () => {
  it("quem confirmou o e-mail aparece, mesmo com um livro só", async () => {
    expect(await podeAparecer(comEmail)).toBe(true);
  });

  /** O caso que motivou tudo: 503 livros invisíveis por um link não clicado. */
  it("uma estante pública de verdade abre a porta sem o e-mail", async () => {
    expect(
      await podeAparecer(semEmailComEstante),
      "quem montou uma estante inteira continua invisível. É o leitor dos 503 livros " +
        "sumido do explorar, das listas e dos buscadores, sem nenhuma tela dizer nada.",
    ).toBe(true);
  });

  /** E o portão continua de pé: é ele que impede a vitrine de virar fazenda de spam. */
  it("dois livros e nenhum e-mail não bastam", async () => {
    expect(
      await podeAparecer(semEmailSemEstante),
      "o portão caiu: qualquer cadastro com dois livros passa a aparecer na vitrine, " +
        "e no dia em que o cadastro abrir isso vira fazenda de spam.",
    ).toBe(false);
  });

  /**
   * ═══ AS QUATRO CONSULTAS USAM A MESMA REGRA, E O MESMO ALIAS ═══
   *
   * A regra era escrita à mão em quatro lugares, e foi por isso que ninguém percebeu
   * o tamanho do buraco: consertar um não consertava os outros três. Agora é uma só —
   * e como ela é SQL solto, ela depende do alias `u` existir em quem a usa. Um alias
   * diferente não dá erro de tipo: dá erro no banco, em produção, na tela de alguém.
   *
   * ═══ O QUE ESTE TESTE ALCANÇA, E O QUE NÃO ═══
   *
   * A primeira versão procurava "users u" nos 1200 caracteres antes de cada uso, e
   * REPROVOU o código correto: em `lib/listas.ts` o join mora dentro de `cardSelect()`,
   * um helper compartilhado, e o texto em volta do uso não o contém.
   *
   * Fingir que uma busca de texto entende o SQL montado por funções seria uma trava
   * que reprova o certo e, mais cedo ou mais tarde, é afrouxada por irritação — que é
   * como travas morrem. Então ela verifica o que consegue ver de verdade: que cada
   * arquivo junta `users` sob `u` em algum lugar, e que ninguém voltou a escrever a
   * regra à mão. **Quem prova que a regra roda são os três testes acima**, contra o
   * banco, com o mesmo alias que as consultas usam.
   */
  it("as quatro superfícies usam a regra única, e ninguém a reescreveu à mão", () => {
    const arquivos = ["lib/explore.ts", "lib/listas.ts", "lib/people.ts"];
    let usos = 0;

    for (const f of arquivos) {
      const src = readFileSync(f, "utf8");

      expect(
        /u\.email_verified = true/.test(src),
        `${f} voltou a escrever a regra à mão. Corrigir uma cópia não corrige as outras, ` +
          "e foi exatamente assim que a maior estante do site ficou invisível.",
      ).toBe(false);

      const meus = [...src.matchAll(/\$\{podeSerDescoberto\}/g)].length;
      if (meus > 0) {
        usos += meus;
        expect(
          /users u\b|users as u\b/.test(src),
          `${f} usa a regra mas não junta "users u" em lugar nenhum: ela cita ` +
            "u.email_verified e vai quebrar no banco, na tela de alguém.",
        ).toBe(true);
      }
    }

    expect(usos, "sumiu alguma das quatro superfícies que decidem quem é descoberto").toBe(4);
  });
});

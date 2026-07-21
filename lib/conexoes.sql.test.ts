import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, follows } from "@/lib/db/schema";
import { getConexoes, getConvidados } from "@/lib/conexoes";
import { Forbidden } from "@/lib/authz";
import { readFileSync } from "node:fs";

/**
 * ════════════════════════════════════════════════════════════════════
 *  RED TEAM: A LISTA DE CONEXÕES DA VÍTIMA.
 *
 *  O atacante está logado de verdade (autenticação não é autorização) e
 *  troca o UUID para pedir a lista de outra pessoa. É um IDOR de leitura,
 *  e o alvo é o mapa social de alguém: quem ela segue e quem a segue.
 *
 *  Contra Postgres de verdade, e não um espelho da regra em JavaScript:
 *  um espelho concorda com o bug.
 *
 *  O segundo bloco guarda a outra promessa, que não é de segurança e sim
 *  de produto: estas funções devolvem GENTE, e nunca um total. Ver o
 *  cabeçalho de lib/conexoes.ts.
 * ════════════════════════════════════════════════════════════════════
 */

let atacante: { id: string };
let vitima: { id: string };
let amigoDaVitima: { id: string };
let seguidorDaVitima: { id: string };
let banido: { id: string };

const criados: string[] = [];
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

beforeAll(async () => {
  const mk = async (handle: string) => {
    const [u] = await db
      .insert(users)
      .values({ handle, email: `${handle}@conexoes.test` })
      .returning({ id: users.id });
    criados.push(u!.id);
    return { id: u!.id };
  };

  atacante = await mk(`conex-atacante-${marca}`);
  vitima = await mk(`conex-vitima-${marca}`);
  amigoDaVitima = await mk(`conex-amigo-${marca}`);
  seguidorDaVitima = await mk(`conex-seguidor-${marca}`);
  banido = await mk(`conex-banido-${marca}`);

  // Alguém que entrou pelo link da vítima.
  const [c] = await db
    .insert(users)
    .values({
      handle: `conex-convidado-${marca}`,
      email: `conex-convidado-${marca}@conexoes.test`,
      invitedBy: vitima.id,
    })
    .returning({ id: users.id });
  criados.push(c!.id);

  await db.insert(follows).values([
    // a vítima segue o amigo, e o banido
    { followerId: vitima.id, followeeId: amigoDaVitima.id, state: "accepted" },
    { followerId: vitima.id, followeeId: banido.id, state: "accepted" },
    // o seguidor e o banido seguem a vítima
    { followerId: seguidorDaVitima.id, followeeId: vitima.id, state: "accepted" },
    { followerId: banido.id, followeeId: vitima.id, state: "accepted" },
  ]);

  await db.execute(
    sql`update users set banned_at = now() where id = ${banido.id}::uuid`,
  );
});

afterAll(async () => {
  for (const id of criados) {
    await db.execute(sql`delete from users where id = ${id}::uuid`);
  }
});

// ──────────────────────────────────────────────── IDOR: o mapa social de alguém

describe("IDOR: o atacante troca o UUID e pede a lista de conexões da vítima", () => {
  it("não lê quem a vítima segue, nem quem segue a vítima", async () => {
    await expect(getConexoes(atacante, vitima.id)).rejects.toBeInstanceOf(Forbidden);
  });

  it("um visitante sem sessão também não lê", async () => {
    await expect(getConexoes(null, vitima.id)).rejects.toBeInstanceOf(Forbidden);
  });

  /**
   * Seguir a pessoa não te dá a lista dela. É a confusão mais fácil de cometer:
   * "eu sigo o fulano, então eu posso ver os amigos do fulano". Não pode. Seguir é
   * um gesto entre duas pessoas, e a soma dos gestos dela não é sua.
   */
  it("nem quem SEGUE a vítima consegue ler a lista dela", async () => {
    await expect(getConexoes(seguidorDaVitima, vitima.id)).rejects.toBeInstanceOf(Forbidden);
  });

  it("e a dona vê a própria lista, porque o dado é dela", async () => {
    const { seguindo, seguidores } = await getConexoes(vitima, vitima.id);

    expect(seguindo.map((p) => p.handle)).toContain(`conex-amigo-${marca}`);
    expect(seguidores.map((p) => p.handle)).toContain(`conex-seguidor-${marca}`);
  });
});

// ──────────────────────────────────────────── IDOR: quem entrou pelo meu link

describe("IDOR: o atacante tenta ler quem entrou pelo link da vítima", () => {
  it("não lê a lista de convidados de outra pessoa", async () => {
    await expect(getConvidados(atacante, vitima.id)).rejects.toBeInstanceOf(Forbidden);
  });

  it("um visitante sem sessão também não lê", async () => {
    await expect(getConvidados(null, vitima.id)).rejects.toBeInstanceOf(Forbidden);
  });

  it("a dona vê quem entrou pelo link dela, com nome e sem número", async () => {
    const convidados = await getConvidados(vitima, vitima.id);

    expect(convidados.map((p) => p.handle)).toContain(`conex-convidado-${marca}`);
    for (const p of convidados) {
      expect(Object.keys(p).sort()).toEqual(["handle", "image", "name"]);
    }
  });
});

describe("um banido some das duas listas", () => {
  it("ele não aparece em quem a vítima segue, nem em quem a segue", async () => {
    const { seguindo, seguidores } = await getConexoes(vitima, vitima.id);
    const banidoHandle = `conex-banido-${marca}`;

    expect(seguindo.map((p) => p.handle)).not.toContain(banidoHandle);
    expect(seguidores.map((p) => p.handle)).not.toContain(banidoHandle);
  });
});

// ───────────────────────────────────────────────────── a promessa do contador

describe("a lista devolve gente, e nunca um total", () => {
  /**
   * O README promete não ter contador de seguidores, e a promessa não se quebra de
   * uma vez: ela se quebra no dia em que esta função devolve um número porque uma
   * tela achou conveniente. Aí o número está do lado de um nome, e leitura virou
   * posição social.
   *
   * Este teste trava o FORMATO do retorno, que é onde a decisão mora.
   */
  it("nenhuma pessoa carrega número, e o retorno não tem campo de total", async () => {
    const conexoes = await getConexoes(vitima, vitima.id);

    expect(Object.keys(conexoes).sort()).toEqual(["seguidores", "seguindo"]);

    for (const pessoa of [...conexoes.seguindo, ...conexoes.seguidores]) {
      expect(
        Object.keys(pessoa).sort(),
        "uma conexão veio com campo a mais. Se for um número, ele vai parar do lado do nome.",
      ).toEqual(["handle", "image", "name"]);
    }
  });

  it("nenhuma tela pede o tamanho das listas de conexão", async () => {
    const tela = readFileSync("components/conexoes.tsx", "utf8");

    /**
     * `.length` continua permitido para decidir SE a lista está vazia (o estado vazio
     * precisa disso). O que se proíbe é o tamanho virar TEXTO na tela: interpolado em
     * JSX, ele é o contador que o README recusa.
     */
    expect(
      /\{[^{}]*\.length[^{}]*\}/.test(tela.replace(/\.length === 0/g, " ")),
      "components/conexoes.tsx põe o tamanho de uma lista na tela. Isso é o contador de seguidores.",
    ).toBe(false);
  });
});

// ────────────────────────────────────────────────── uma honra, uma régua, um lugar

describe("o arauto tem UMA definição, e ela mora em lib/badges.ts", () => {
  /**
   * ════════════════════════════════════════════════════════════════════
   *  HAVIA DUAS DEFINIÇÕES DO ARAUTO, E ELAS DISCORDAVAM.
   *
   *  lib/invite.ts tinha uma isHerald(): UM convidado, UM livro. lib/badges.ts
   *  tinha a régua de verdade: CINCO leitores que ficaram, cada um com dez livros.
   *  O perfil lia a primeira e mostrava o selo; a página de insígnias lia a segunda
   *  e não reconhecia a pessoa. O mesmo leitor era arauto numa tela e não era na
   *  outra.
   *
   *  Uma honra com duas réguas não é uma honra, são duas. Este teste trava a régua
   *  única: só lib/badges.ts decide arauto, e isHerald() não volta.
   * ════════════════════════════════════════════════════════════════════
   */
  it("isHerald() não existe mais em lib/invite.ts", () => {
    const invite = readFileSync("lib/invite.ts", "utf8").replace(/\/\*[\s\S]*?\*\//g, " ");
    expect(
      /export\s+(async\s+)?function\s+isHerald/.test(invite),
      "isHerald() voltou. O arauto tem uma régua só, e ela mora em lib/badges.ts.",
    ).toBe(false);
  });

  it("o perfil deriva o selo de arauto de getBadges, e não de uma segunda regra", () => {
    const perfil = readFileSync("app/perfil/page.tsx", "utf8");
    expect(perfil).not.toMatch(/isHerald/);
    // O selo sai da insígnia, que é a fonte única.
    expect(perfil).toMatch(/getBadges/);
    expect(perfil).toMatch(/includes\(["']arauto["']\)/);
  });
});

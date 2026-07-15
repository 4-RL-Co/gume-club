import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, editions } from "@/lib/db/schema";
import { corrigirEdicao, reverter } from "@/lib/corrections";
import { getCatalogo } from "@/lib/contributors";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O NÚMERO NÃO VIAJA. A INSÍGNIA VIAJA.
 *
 *  Número é placar, e fica preso em /contribuidores. Nunca no perfil,
 *  nunca no feed. Insígnia é PAPEL: diz o que a pessoa É, não quanto ela
 *  FEZ, e por isso pode andar junto com o nome.
 *
 *  Estes testes travam as três regras que impedem o número de apodrecer:
 *  ele conta só o que sobreviveu, não ordena a lista, e não sai da tela.
 * ════════════════════════════════════════════════════════════════════
 */

let velho: { id: string };
let novo: { id: string };
let bibliotecario: { id: string };
let edicaoA: string;
let edicaoB: string;
let obra: string;

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados: string[] = [];

beforeAll(async () => {
  const mk = async (handle: string, tier: number, quandoChegou: Date) => {
    const [u] = await db
      .insert(users)
      .values({
        handle,
        email: `${handle}@contrib.test`,
        librarianTier: tier,
        createdAt: quandoChegou,
      })
      .returning({ id: users.id });
    criados.push(u!.id);
    return { id: u!.id };
  };

  // O VELHO chegou antes e fez UMA correção. O NOVO chegou depois e fez DUAS.
  // Numa lista ordenada por quantidade, o novo vem na frente. Aqui, não.
  velho = await mk(`contrib-velho-${marca}`, 0, new Date("2020-01-01"));
  novo = await mk(`contrib-novo-${marca}`, 0, new Date("2026-01-01"));
  bibliotecario = await mk(`contrib-biblio-${marca}`, 1, new Date("2027-01-01"));

  const [w] = await db
    .insert(works)
    .values({ slug: `contrib-${marca}`, title: `A obra do contribuidor ${marca}` })
    .returning({ id: works.id });
  obra = w!.id;

  const [a] = await db
    .insert(editions)
    .values({ workId: obra, publisher: "A", pageCount: 100 })
    .returning({ id: editions.id });
  const [b] = await db
    .insert(editions)
    .values({ workId: obra, publisher: "B", pageCount: 200 })
    .returning({ id: editions.id });

  edicaoA = a!.id;
  edicaoB = b!.id;

  await corrigirEdicao(velho, edicaoA, "pageCount", "111", null);
  await corrigirEdicao(novo, edicaoB, "pageCount", "222", null);
  await corrigirEdicao(novo, edicaoB, "publisher", "Editora Nova", null);
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
  if (obra) await db.execute(sql`delete from works where id = ${obra}::uuid`);
});

describe("a lista é ORDENADA por quem fez mais, e não PREMIADA", () => {
  /**
   * ════════════════════════════════════════════════════════════════════
   *  ESTE TESTE VIROU DO AVESSO EM 2026-07-12, E ISSO ESTÁ CERTO.
   *
   *  Ele exigia ordem de CHEGADA, e o motivo era real: um placar produz
   *  farm. O motivo continua real, e o custo foi aceito de olhos abertos.
   *
   *  O que virou a decisão: ordem de chegada não é neutra, é só outra
   *  ordem — e com cem pessoas ela ENTERRA quem mais cuidou do catálogo.
   *  Reconhecimento que ninguém consegue ver não é reconhecimento.
   *
   *  Mas a fronteira SÓ SE MOVEU UM PASSO, e este teste é o que garante
   *  que ela não ande de novo sozinha: a lista é ordenada, e nunca
   *  premiada. Sem posição, sem pódio, sem medalha, e o número continua
   *  preso a esta página.
   * ════════════════════════════════════════════════════════════════════
   */
  it("quem fez mais vem primeiro", async () => {
    const lista = await getCatalogo();
    const nossos = lista.filter((p) => p.handle.includes(marca));

    const velhoIdx = nossos.findIndex((p) => p.handle.includes("velho"));
    const novoIdx = nossos.findIndex((p) => p.handle.includes("novo"));

    expect(velhoIdx).toBeGreaterThanOrEqual(0);
    expect(novoIdx).toBeGreaterThanOrEqual(0);

    // O "novo" chegou depois E fez mais. Ele vem primeiro.
    expect(nossos[novoIdx]!.correcoes).toBeGreaterThan(nossos[velhoIdx]!.correcoes);
    expect(
      novoIdx,
      "quem mais cuidou do catálogo ficou enterrado embaixo de quem chegou antes",
    ).toBeLessThan(velhoIdx);
  });

  it("o EMPATE é desfeito pela chegada: o valor antigo virou o desempate", async () => {
    const lista = await getCatalogo();

    // Entre duas pessoas com o MESMO número, quem chegou primeiro vem primeiro.
    for (let i = 1; i < lista.length; i++) {
      const antes = lista[i - 1]!;
      const depois = lista[i]!;
      if (antes.correcoes === depois.correcoes) {
        expect(
          new Date(antes.desde).getTime(),
          "empate desfeito por outra coisa que não a ordem de chegada",
        ).toBeLessThanOrEqual(new Date(depois.desde).getTime());
      }
    }
  });

  it("a lista é ordenada, e NUNCA premiada: sem posição, sem pódio, sem medalha", () => {
    /**
     * A fronteira que sobrou. Ordenar é uma coisa; premiar é outra, e é ela que
     * transforma o topo num prêmio permanente pelo qual vale a pena farmar.
     *
     * Proibido, e o build quebra: número de posição (#1, 1º), pódio, medalha,
     * ouro/prata/bronze, coroa, troféu.
     */
    const tela = readFileSync("app/contribuidores/page.tsx", "utf8");
    const semComentario = tela
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ");

    expect(semComentario).not.toMatch(/p[óo]dio|medalha|troféu|trofeu|coroa|ranking|placar/i);
    expect(semComentario).not.toMatch(/\b(ouro|prata|bronze)\b/i);
    // Uma posição ordinal renderizada ao lado do nome: "1º", "#1", "1." 
    expect(semComentario).not.toMatch(/index\s*\+\s*1|i\s*\+\s*1/);
  });

  it("conta só o que SOBREVIVEU: correção revertida não vale ponto", async () => {
    const antes = (await getCatalogo()).find((p) => p.handle.includes("novo"))!;
    expect(antes.correcoes).toBe(2);

    const [rev] = await db.execute<{ id: string }>(sql`
      select r.id from revisions r
       join users u on u.id = r.user_id
      where u.handle like ${`contrib-novo-${marca}`}
        and r.reverted_at is null
      limit 1`);

    await reverter(bibliotecario, rev!.id);

    const depois = (await getCatalogo()).find((p) => p.handle.includes("novo"))!;

    expect(
      depois.correcoes,
      "a correção revertida continuou contando. Contar edição FEITA, e não a que SOBREVIVEU, " +
        "premia quem faz errado depressa: é problema documentado na Wikipédia.",
    ).toBe(1);
  });
});

/**
 * A varredura. Estrutura, não vigilância.
 *
 * O número de contribuição vive numa tela só. Se alguém importar essa contagem em
 * qualquer outro lugar (o perfil, o feed, um card), este teste quebra, e quebrar é
 * o ponto: a regra vira código em vez de virar boa intenção.
 */
describe("o número não sai de /contribuidores", () => {
  const raiz = process.cwd();

  function arquivos(dir: string, out: string[] = []): string[] {
    for (const nome of readdirSync(dir)) {
      const full = join(dir, nome);
      if (statSync(full).isDirectory()) arquivos(full, out);
      else if ([".ts", ".tsx"].includes(extname(nome)) && !nome.endsWith(".test.ts")) out.push(full);
    }
    return out;
  }

  it("só a página de contribuidores conhece a contagem", () => {
    const permitido = [
      "app/contribuidores/page.tsx",
      "lib/contributors.ts",
      /**
       * O lib/badges.ts importa daqui, e é o único que pode: ele usa a lista do
       * GitHub para responder uma pergunta BINÁRIA ("esta pessoa escreveu código?")
       * e nunca leva a contagem junto. O teste logo abaixo prova isso.
       */
      "lib/badges.ts",
    ];
    const infratores: string[] = [];

    for (const dir of ["app", "components", "lib"]) {
      for (const arquivo of arquivos(join(raiz, dir))) {
        const rel = arquivo.slice(raiz.length + 1);
        if (permitido.includes(rel)) continue;

        const src = readFileSync(arquivo, "utf8");
        if (/@\/lib\/contributors/.test(src)) infratores.push(rel);
      }
    }

    expect(
      infratores,
      `contagem de contribuição fora de /contribuidores:\n${infratores.join("\n")}\n\n` +
        "O NÚMERO NÃO VIAJA. A insígnia viaja, porque insígnia é papel: ela diz o que a pessoa É, " +
        "e não quanto ela FEZ.",
    ).toEqual([]);
  });
});

describe("insígnia é binária: ela não carrega número nenhum", () => {
  it("getBadges devolve só rótulos, e nunca uma contagem", async () => {
    const { getBadges } = await import("@/lib/badges");
    const insignias = await getBadges(novo.id);

    // O tipo já garante isto, e o teste garante que o TIPO não mude sem alguém ver:
    // no dia em que alguém devolver { insignia, quantas }, o número vai para o lado
    // do nome, e aí virou placar.
    for (const i of insignias) {
      expect(typeof i, "uma insígnia veio com estrutura, e não como rótulo").toBe("string");
      expect(String(i)).not.toMatch(/\d/);
    }
  });

  it("nenhuma insígnia é GANHA POR LER", async () => {
    const { INSIGNIAS } = await import("@/lib/badges");

    /**
     * O que é proibido é a insígnia ser GANHA por ler, avaliar ou seguir. Não é a
     * palavra "leitor" aparecer no texto: o ARAUTO diz "trouxe leitores que
     * ficaram", e ele é sobre HOSPITALIDADE, não sobre leitura — ele honra trazer
     * gente, e a pessoa que ele trouxe pode nunca ter aberto um livro.
     *
     * A diferença é o VERBO. Ler, avaliar, seguir, terminar, colecionar: proibidos.
     * Trazer, corrigir, escrever, aprovar: doação.
     */
    const ganhaPorLer =
      /voraz|maratona|livros lidos|páginas lidas|leitor do (mês|ano)|resenhista|colecionador|assíduo|avaliou|seguiu|terminou \d/i;

    for (const [chave, i] of Object.entries(INSIGNIAS)) {
      const texto = `${chave} ${i.label} ${i.sobre}`;
      expect(
        ganhaPorLer.test(texto),
        `a insígnia "${chave}" é ganha por LER. Insígnia honra DOAÇÃO, nunca leitura. ` +
          `Se alguém propuser "Leitor Voraz", feche o PR e cite esta linha.`,
      ).toBe(false);
    }
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  ═══ ESTE TESTE PROIBIA A LISTA DE APOIADORES. FOI REESCRITO. ═══
   *
   *  Ele dizia "pagar não põe ninguém na lista de quem trabalhou", e o medo era:
   *
   *      "Se os dois se parecerem, a mensagem que sobra é 'dá para comprar mérito', e a
   *       partir daí ninguém mais sabe, olhando, quem trabalhou e quem pagou."
   *
   *  **Apoiar financeiramente é importante, e esconder isso não honra ninguém.** Sem quem
   *  paga a conta, o servidor cai e as outras duas listas param de existir.
   *
   *  O medo era de CONFUSÃO, e não de reconhecimento. Então a trava muda de lugar, e vai
   *  para onde ela sempre deveria ter estado:
   *
   *    ANTES  os apoiadores não aparecem.
   *    AGORA  os apoiadores aparecem numa seção PRÓPRIA, e **sem número**.
   *
   *  O que continua proibido, e é o que sempre importou:
   *
   *    · misturar quem paga na lista de quem trabalha
   *    · ordenar apoiadores por VALOR, ou por qualquer coisa que se leia como "este
   *      apoia mais". Uma lista de apoiadores ordenada por dinheiro é exatamente a coisa
   *      que a regra antiga temia.
   * ════════════════════════════════════════════════════════════════════
   */
  it("os apoiadores não entram nas listas de trabalho, e não têm número", () => {
    const codigo = readFileSync(new URL("../lib/contributors.ts", import.meta.url), "utf8");

    // Cada consulta, por si. O apoio tem a consulta DELE, e não pode encostar nas outras.
    for (const consulta of codigo.split(/\bsql`/).slice(1)) {
      const q = (consulta.split("`")[0] ?? "").replace(/^[ \t]*--[^\n]*/gm, " ");

      const olhaApoio = /is_supporter/i.test(q);
      const contaTrabalho = /revisions|count\(/i.test(q);

      expect(
        olhaApoio && contaTrabalho,
        "uma consulta juntou quem PAGA com quem TRABALHA. As duas listas são de coisas " +
          "diferentes, e misturá-las é dizer que dá para comprar mérito.",
      ).toBe(false);

      // E a lista de apoio nunca é ordenada por valor, ou por qualquer proxy de valor.
      if (olhaApoio) {
        expect(
          /order by[^\n]*(valor|amount|total|count|apoio|tier|plano)/i.test(q),
          "a lista de apoiadores foi ordenada por quanto cada um paga. Não existe apoiar " +
            "mais: é sim ou não.",
        ).toBe(false);
      }
    }
  });

  /**
   * E a insígnia de apoiador continua existindo, e continua dizendo o que ela é.
   *
   * Se alguém apagar a frase que conta que ela se paga, ela vira mérito comprado em
   * silêncio — e aí a regra antiga estava certa o tempo todo.
   */
  it("a insígnia de apoiador diz, escrito, que ela se paga", async () => {
    const { INSIGNIAS } = await import("@/lib/badges-view");
    const conta = (INSIGNIAS.apoiador.sobre + " " + INSIGNIAS.apoiador.como).toLowerCase();

    expect(/não se conquista|se paga/.test(conta)).toBe(true);
  });
});

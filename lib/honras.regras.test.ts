import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { posicaoDe } from "./honras";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A GAMIFICAÇÃO ENTROU POR UMA PORTA, E NÃO PELA CASA TODA.
 *
 *  Existe uma diferença enorme entre **uma escada** e **uma esteira**, e este arquivo é
 *  a linha entre as duas.
 *
 *  ═══ POR QUE ELE EXISTE ═══
 *
 *  O `docs/design.md` já dizia, com todas as letras, que barra de progresso em leitura
 *  era "proibida, para sempre, **e há teste**".
 *
 *  Não havia. O teste que ele citava olhava para UM arquivo, e nunca teria pego uma barra
 *  no perfil. Uma barra de leitura foi para o perfil de todo mundo e **a suíte inteira
 *  passou verde**.
 *
 *  Um documento que promete uma trava que não existe é pior do que um que não promete
 *  nada: ele faz todo mundo parar de olhar.
 * ════════════════════════════════════════════════════════════════════
 */

/** Todo o código que decide, mostra ou calcula honra. */
function codigo(): { caminho: string; texto: string }[] {
  const achados: { caminho: string; texto: string }[] = [];

  const andar = (pasta: string) => {
    for (const nome of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = join(pasta, nome.name);
      if (nome.isDirectory()) andar(caminho);
      else if (/\.(ts|tsx)$/.test(nome.name) && !nome.name.includes(".test.")) {
        achados.push({ caminho, texto: readFileSync(caminho, "utf8") });
      }
    }
  };

  for (const raiz of ["lib", "components", "app"]) andar(raiz);
  return achados;
}

/**
 * Fora os comentários — os de JS **e os de SQL**.
 *
 * Uma versão anterior disto só tirava os de JS, e acusou `lib/badges.ts` de conter um
 * ranking. O que ela achou foi a NOTA, dentro de um template de SQL, que proíbe o
 * ranking. Um teste que confunde a proibição com a infração impede a próxima pessoa de
 * escrever a proibição.
 */
function semComentario(texto: string): string {
  return texto
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/^[ \t]*--[^\n]*/gm, " ");
}

describe("a honra é uma escada, e não uma esteira", () => {
  /**
   * ═══ 1. NÃO OLHA PARA O RELÓGIO ═══
   *
   * Sem ofensiva, sem meta do ano, sem temporada, e a honra NUNCA cai.
   *
   * Um app que faz o número descer quando você para de ler pune quem está de luto,
   * doente ou com um filho recém-nascido — e faz a pessoa abrir um livro fino de que não
   * gosta só para não perder o que já era dela. Vida não tem temporada.
   */
  it("a conta da honra não tem tempo dentro dela", () => {
    for (const arquivo of ["lib/escada.ts", "lib/honras.ts"]) {
      const texto = semComentario(readFileSync(arquivo, "utf8"));
      expect(texto, `${arquivo}: a honra não pode olhar para data nenhuma`).not.toMatch(
        /now\(\)|current_date|interval\s|date_trunc|extract\s*\(\s*year|this_?month|streak|ofensiva/i,
      );
    }
  });

  it("a honra de quem parou de ler é a mesma de ontem", () => {
    // A função é PURA e só recebe um número. Ela não tem como saber que dia é hoje — e é
    // essa incapacidade que garante que a honra nunca cai.
    expect(posicaoDe(225).honra).toBe("lamina");
  });

  /**
   * ═══ 2. NÃO EXISTE PLACAR ═══
   *
   * A honra mora no perfil e na moldura. Nenhuma lista ordena gente por quanto leu —
   * isso é uma máquina de fazer gente mentir que leu, e a resenha honesta (que é o
   * produto inteiro do Gume) não sobrevive num lugar onde marcar "lido" vale posição.
   */
  it("nenhuma tela ordena pessoas por quanto elas leram", () => {
    const placares: string[] = [];

    for (const { caminho, texto } of codigo()) {
      const limpo = semComentario(texto);

      /**
       * ═══ CONSULTA POR CONSULTA, E NUNCA ARQUIVO POR ARQUIVO ═══
       *
       * Uma versão anterior olhava o arquivo inteiro, e acusou `lib/explore.ts` — que tem
       * várias consultas. Ela pegou o `group by u.id` de uma e o `count(` de outra, e
       * juntou as duas num crime que não existia.
       */
      for (const consulta of limpo.split(/\bsql`/).slice(1)) {
        const q = consulta.split("`")[0] ?? "";

        /**
         * O que está proibido é a CONJUNÇÃO EXATA: agrupar por PESSOA e ordenar por uma
         * contagem de LEITURA. Isso é um placar de leitores, e só isso.
         *
         * O que NÃO está proibido, e cada um por um motivo:
         *
         *   ordenar LIVROS por quantas pessoas leram   (lib/stats.ts, lib/explore.ts)
         *     um livro no topo de uma lista não sente nada; uma pessoa, sim.
         *
         *   ordenar GENTE por CORREÇÕES feitas          (lib/contributors.ts)
         *     isso é contribuição, e não consumo — e é a única tela do app com número.
         */
        const agrupaPorPessoa = /group by[^\n]*\b(u\.id|users\.id|user_id)\b/i.test(q);
        const contaLeitura = /library_entries|\breadings\b/i.test(q);

        /**
         * O `order by` que importa é o ÚLTIMO. Uma consulta tem `order by` dentro de
         * subconsulta e dentro de `array_agg`, e nenhum deles ordena o RESULTADO.
         */
        const ordens = [...q.matchAll(/order by([^\n]*)/gi)];
        const ultima = ordens[ordens.length - 1]?.[1] ?? "";

        const apelidos = [...q.matchAll(/count\([^)]*\)(?:::\w+)?\s+as\s+(\w+)/gi)].map((m) => m[1]!);
        const ordenaPorContagem =
          /\bcount\(/i.test(ultima) ||
          apelidos.some((a) => new RegExp(`\\b${a}\\b`, "i").test(ultima));

        if (agrupaPorPessoa && ordenaPorContagem && contaLeitura) {
          placares.push(`${caminho} — agrupa por pessoa e ordena por contagem de leitura`);
        }
      }

      if (/\b(ranking|leaderboard|top\s*\d+\s*leitores|maiores leitores|quem leu mais)\b/i.test(limpo)) {
        placares.push(`${caminho} — a palavra`);
      }
    }

    expect(placares).toEqual([]);
  });

  /**
   * ═══ 3. A NOTA NÃO CONTA ═══
   *
   * Ler e ODIAR vale o mesmo que ler e adorar. No momento em que "adorei" valesse mais
   * honra, o app estaria comprando elogio — e a resenha honesta morreria no dia seguinte.
   */
  it("a nota não vale honra", () => {
    const escada = semComentario(readFileSync("lib/escada.ts", "utf8"));
    expect(escada, "a consulta da honra não pode nem MENCIONAR nota").not.toMatch(
      /\brating\b|\bratings\b|verdict/i,
    );
  });

  /**
   * ═══ 4. ABANDONAR NÃO PUNE ═══
   *
   * Um livro abandonado não conta, e também não tira nada. Se abandonar custasse honra,
   * ninguém mais largaria um livro ruim — e terminar um livro de que você já não gosta é
   * a coisa mais triste que um app de leitura pode fazer alguém fazer.
   */
  it("abandonar não subtrai", () => {
    const escada = semComentario(readFileSync("lib/escada.ts", "utf8"));

    expect(escada).toContain("'read'");
    expect(escada, "abandonar não pode aparecer na conta da honra").not.toMatch(
      /did_not_finish|abandonad/i,
    );

    expect(posicaoDe(0).honra).toBe("ferro");
  });

  /**
   * ═══ E A INSÍGNIA CONTINUA SENDO OUTRA COISA ═══
   *
   * Insígnia honra **doação à comunidade**. A honra mede **leitura**. Se uma insígnia
   * passar a depender de quantos livros a pessoa leu, as duas viram a mesma coisa — e o
   * trabalho de quem conserta o catálogo passa a valer menos que o de quem lê rápido.
   */
  it("nenhuma insígnia depende de quanto a pessoa leu", () => {
    const badges = semComentario(readFileSync("lib/badges.ts", "utf8"));
    expect(badges, "uma insígnia começou a medir leitura").not.toMatch(
      /posicaoDe|getEscadas|forma\s*=\s*'(livro|quadrinho)'/i,
    );
  });
});

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM DOCUMENTO QUE CITA UM ARQUIVO QUE NÃO EXISTE ESTÁ MENTINDO.
 *
 *  ═══ O QUE ACONTECEU, DUAS VEZES ═══
 *
 *  1. `docs/design.md` prometia que a barra de progresso de leitura era "proibida, para
 *     sempre, e há teste". O teste que ela citava olhava para UMA tela, e nunca teria
 *     pego uma barra no perfil. A proibição não existia, e o documento a garantia.
 *
 *  2. Depois de renomear "elo" para "honra", o mesmo documento continuou apontando para
 *     `lib/elo.regras.test.ts` — um arquivo que não existe mais. Quem fosse conferir a
 *     trava encontraria o nada, e teria que decidir sozinho se a regra ainda vale.
 *
 *  ═══ POR QUE ISSO É PIOR QUE UM DOCUMENTO CALADO ═══
 *
 *  Um documento que não promete nada não engana ninguém. Um que promete uma trava
 *  inexistente faz a próxima pessoa (ou a próxima IA) construir em cima de uma garantia
 *  que não está lá — e ela não vai conferir, porque está escrito.
 *
 *  Este teste é barato e mecânico: todo caminho de arquivo citado num documento tem que
 *  existir no disco.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * ═══ E OS COMENTÁRIOS DO CÓDIGO TAMBÉM CITAM ARQUIVO ═══
 *
 * Este teste varria só os `.md`. E o apodrecimento estava no código: depois de renomear
 * "elo" para "honra", CINCO comentários continuaram apontando para `lib/elo.ts` e
 * `lib/elo.regras.test.ts` — arquivos que não existem mais.
 *
 * Um comentário que cita um arquivo morto é uma pista falsa deixada para a próxima pessoa,
 * e ela custa exatamente o mesmo que uma linha errada de código: alguém vai procurar, não
 * vai achar, e vai ter que reconstruir sozinha uma regra que já estava escrita.
 */
function codigo(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const full = join(dir, nome);
    if (statSync(full).isDirectory()) codigo(full, out);
    else if (/\.tsx?$/.test(nome)) out.push(full);
  }
  return out;
}

/** Os documentos que mandam neste repositório. */
function documentos(): string[] {
  const raiz = ["README.md", "AGENTS.md", "CLAUDE.md", "SECURITY.md"].filter(existsSync);

  const pastas = ["docs", "ai"].flatMap((d) =>
    existsSync(d)
      ? readdirSync(d)
          .filter((n) => n.endsWith(".md"))
          .map((n) => join(d, n))
      : [],
  );

  return [...raiz, ...pastas];
}

/**
 * Um caminho de arquivo do repositório, citado entre crases ou num link de markdown.
 *
 * Só o que é inequivocamente um arquivo NOSSO: começa por uma das pastas do projeto e
 * termina numa extensão que a gente escreve. Um `package.json` genérico, uma variável de
 * ambiente ou uma frase entre crases não entram — o teste tem que acusar arquivo morto, e
 * não inventar trabalho.
 */
const CAMINHO =
  /(?:^|[\s`("'[])((?:lib|app|components|scripts|docs|ai)\/[\w./[\]-]+\.(?:tsx|ts|sql|mjs|md|css|json))/g;
//                                                                        ↑↑↑
// `tsx` ANTES de `ts`, e não é frescura: a alternância do JavaScript para no PRIMEIRO
// que casa. Com `ts|tsx`, o arquivo `components/mark.tsx` casava como `components/mark.ts`
// (o `x` ficava de fora), e o teste acusava seis arquivos mortos que estavam vivos.
//
// Um teste que inventa erro é tão ruim quanto um que não acha nenhum: nos dois casos, a
// próxima pessoa aprende a ignorá-lo.

describe("os documentos não citam arquivo que não existe", () => {
  const docs = [...documentos(), ...codigo("lib"), ...codigo("app"), ...codigo("components")];

  it("há documentos para varrer", () => {
    // Um teste que não acha nada passa sorrindo.
    expect(docs.length).toBeGreaterThanOrEqual(5);
  });

  it("todo arquivo citado existe mesmo", () => {
    const mortos: string[] = [];

    for (const doc of docs) {
      /**
       * ═══ ARQUIVO DE TESTE NÃO ENTRA, E ISSO NÃO É UMA BRECHA ═══
       *
       * Um teste CITA DE PROPÓSITO arquivos que não devem existir. `quatrocentoequatro.test.ts`
       * nomeia `app/estante/loading.tsx` porque é exatamente esse arquivo que ele proíbe: se
       * ele existisse, o teste falharia.
       *
       * Varrer os testes seria acusar a própria armadilha de estar armada. Foi o que aconteceu
       * na primeira execução desta regra, e o resultado eram cinco "erros" que eram acertos.
       */
      if (doc.includes(".test.")) continue;

      const texto = readFileSync(doc, "utf8");

      for (const m of texto.matchAll(CAMINHO)) {
        const caminho = m[1]!;

        // Um link de markdown escreve `../ai/DECISIONS.md` a partir da pasta do documento.
        // O caminho já vem sem o `../` por causa da expressão, então basta conferir na raiz.
        if (existsSync(caminho)) continue;

        mortos.push(`${doc} cita "${caminho}", que não existe`);
      }
    }

    expect(
      mortos,
      "um documento que cita um arquivo que não existe está prometendo uma coisa que " +
        "ninguém pode conferir:\n" + mortos.map((x) => `  ${x}`).join("\n"),
    ).toEqual([]);
  });
});


/**
 * ════════════════════════════════════════════════════════════════════
 *  UMA PROMESSA DE TRAVA TEM QUE DIZER QUAL TESTE A SEGURA.
 *
 *  ═══ O BUG ═══
 *
 *  Estava escrito, em dois arquivos:
 *
 *      "Uma barra enchendo ao lado de 'livros lidos' transforma leitura em meta.
 *       Isso continua proibido, para sempre, e há teste."
 *
 *  Não continuava, e não havia. As HONRAS são exatamente isso — uma escada por livro
 *  lido, com uma barra dizendo quanto falta —, e uma delas era desenhada na MESMA TELA,
 *  vinte linhas abaixo da frase que jurava que aquilo era proibido.
 *
 *  A frase foi escrita antes das honras e ficou de pé mentindo.
 *
 *  ═══ POR QUE ISSO É PIOR QUE UM COMENTÁRIO DESATUALIZADO ═══
 *
 *  Porque ela é **infalsificável**. "Há teste" não diz QUAL teste, então não há como
 *  conferir sem procurar no repositório inteiro — e ninguém procura. A pessoa lê, acredita,
 *  e constrói em cima de uma garantia que não existe.
 *
 *  Um comentário que promete uma trava sem nomeá-la não está documentando uma trava: está
 *  pedindo confiança. E confiança é exatamente o que este repositório se recusa a usar como
 *  mecanismo de defesa (ver AGENTS.md: "nenhuma proteção pode depender de o dono revisar
 *  o código").
 *
 *  ═══ A LEI ═══
 *
 *  Quem disser "há teste" tem que dizer o NOME do arquivo de teste, na mesma frase. Aí a
 *  promessa vira verificável — e o teste logo acima já garante que o arquivo citado existe.
 * ════════════════════════════════════════════════════════════════════
 */
describe("quem promete uma trava, nomeia o teste", () => {
  /**
   * ═══ O REGISTRO DE DECISÕES FICA DE FORA, E ISSO NÃO É UMA BRECHA ═══
   *
   * `ai/DECISIONS.md` é HISTÓRICO, e é append-only por contrato (ver CLAUDE.md). Cada
   * entrada é o que se decidiu NAQUELE DIA, com o que se sabia naquele dia.
   *
   * Exigir que uma entrada de três meses atrás nomeie um teste que só passou a existir
   * depois seria reescrever o passado — e um registro que se reescreve para continuar
   * bonito não é um registro, é uma propaganda. A entrada errada é corrigida por uma
   * entrada NOVA, que a supera, e não por uma borracha.
   *
   * A regra vale para o que está VIVO: o código, e os documentos que mandam.
   */
  const alvos = [
    ...documentos().filter((d) => !d.includes("DECISIONS.md")),
    ...codigo("lib"),
    ...codigo("app"),
    ...codigo("components"),
  ];

  it("há alvos para varrer", () => {
    expect(alvos.length).toBeGreaterThan(50);
  });

  it("nenhuma promessa de teste é anônima", () => {
    /** "há teste", "tem teste", "e há um teste". O que NÃO vale é não dizer qual. */
    const PROMESSA = /\b(h[áa]|tem|existe|e h[áa] um)\s+testes?\b/gi;

    const anonimas: string[] = [];

    for (const arquivo of alvos) {
      if (arquivo.includes(".test.")) continue; // um teste não precisa se citar

      const texto = readFileSync(arquivo, "utf8");

      for (const m of texto.matchAll(PROMESSA)) {
        /**
         * A frase inteira em volta da promessa. Se o nome do teste está nela, a promessa é
         * verificável — e o teste lá de cima já conferiu que o arquivo existe.
         */
        const i = m.index!;
        const trecho = texto.slice(Math.max(0, i - 260), i + 260);

        if (/\w+\.test\.ts/.test(trecho)) continue;

        anonimas.push(
          `${arquivo.replace(process.cwd() + "/", "")} promete "${m[0]}" e não diz qual. ` +
            "Uma trava sem nome é infalsificável: ninguém confere, e um dia ela deixa de existir " +
            "sem que a frase mude.",
        );
      }
    }

    expect(anonimas).toEqual([]);
  });
});

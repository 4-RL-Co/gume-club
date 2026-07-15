import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RATES } from "@/lib/rate-limit";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A BUSCA NUNCA MOSTRA SILÊNCIO.
 *
 *  ═══ O MOMENTO EM QUE O LEITOR FECHARIA A ABA ═══
 *
 *  Um leitor testou o Gume pela primeira vez, buscou três livros, e viu uma caixa vazia:
 *  sem resultado, e sem uma palavra. Ele concluiu que a busca estava quebrada e fecharia a
 *  aba. E ele estava certo em concluir isso — a tela não lhe deu nada melhor para pensar.
 *
 *  Eram DOIS bugs, e o segundo é meu:
 *
 *  1. **NÃO EXISTIA "NÃO ACHEI".** Uma lista vazia era desenhada como nada. A pessoa
 *     digita o nome de um livro que ela ama, erra uma letra, e não recebe nem um "não
 *     achei". Ela não conclui "errei a digitação": conclui "o app é vazio".
 *
 *  2. **O 429 ERA DESENHADO COMO "NENHUM RESULTADO".** A rota devolvia listas vazias com
 *     status 429, e o cliente fazia `res.json()` sem olhar o `res.ok`. Falha de rede virava
 *     ausência de dado — que é a lei que este repositório mais repete, quebrada dentro da
 *     nossa própria tela.
 *
 *  E o limite era de sessenta buscas por minuto, numa busca POR TECLA: uma palavra custa de
 *  seis a dez requisições. Sessenta por minuto é seis palavras. **Um limite que a pessoa de
 *  verdade esbarra antes do script não é um limite: é um pedágio.**
 * ════════════════════════════════════════════════════════════════════
 */

const palheta = readFileSync("components/command.tsx", "utf8");

/** Sem comentários: eles FALAM do bug para explicar o conserto. */
const codigo = palheta
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("a busca diz o que aconteceu", () => {
  it("o cliente confere o res.ok antes de ler o corpo", () => {
    expect(
      /if\s*\(\s*!res\.ok\s*\)/.test(codigo),
      "a busca voltou a ler o corpo da resposta sem olhar o status. Um 429 devolve listas " +
        "vazias, e a tela vai desenhar isso como 'nenhum resultado' — traduzindo uma falha " +
        "de comunicação em ausência de dado, que é a lei que este repo mais repete.",
    ).toBe(true);
  });

  it("existe um estado de 'não achei', e ele é diferente do de falha", () => {
    expect(
      codigo,
      "a tela não tem mais o estado de falha. As três coisas — não achei, buscou demais, " +
        "caiu — voltam a ser desenhadas como a mesma: nada.",
    ).toContain("falha");

    expect(palheta, "sumiu a frase que diz que não achou nada").toMatch(/Não achei nada com/);
  });

  /**
   * ═══ O LIMITE NÃO PODE MIRAR NA PESSOA ═══
   *
   * A busca dispara uma requisição por pausa de digitação, e uma segunda quando o catálogo
   * devolve pouco. Uma palavra custa de seis a dez.
   *
   * Cento e vinte por minuto seriam doze palavras: um leitor curioso passa disso no primeiro
   * minuto. Trezentos é inalcançável digitando, e continua ridículo para um script.
   */
  it("o teto da busca é generoso para quem digita, e apertado para quem não digita", () => {
    expect(
      RATES.search.limit,
      "o teto da busca desceu. Ela é POR TECLA: uma palavra custa de seis a dez requisições, " +
        "e um teto baixo castiga exatamente quem está conhecendo o app — e é invisível para " +
        "quem roda um laço com sleep.",
    ).toBeGreaterThanOrEqual(240);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  E A CRASE DENTRO DO SQL — O TESTE QUE EU NÃO VOU ESCREVER.
 *
 *  Eu escrevi uma crase dentro de um template `sql\`...\`` QUATRO VEZES hoje, em quatro
 *  arquivos. Uma crase ali FECHA a string, o código para de compilar, e o TypeScript cospe
 *  um "',' expected" apontando para uma linha inocente.
 *
 *  A primeira coisa que eu fiz foi escrever um teste estrutural contra isso. E ele NÃO
 *  PODIA FALHAR: a expressão que procura o bloco de SQL para na primeira crase — que é
 *  exatamente o que o JavaScript faz —, então ela nunca enxerga a crase do meio. Era uma
 *  linha verde para sempre, olhando para o nada.
 *
 *  É a armadilha mais frequente deste repositório, e eu ia cair nela de novo, escrevendo o
 *  teste que existia justamente para me proteger de mim.
 *
 *  ═══ E A TRAVA JÁ EXISTE ═══
 *
 *  É o compilador. O `tsc` quebrou nas quatro vezes, na hora, sem eu pedir. Um teste que
 *  duplica o compilador não acrescenta segurança nenhuma: acrescenta uma linha verde a
 *  mais, e uma linha verde a mais é ruído.
 *
 *  A lição, que é a única coisa que vale a pena guardar aqui: **quando a mesma pessoa
 *  comete o mesmo erro quatro vezes num dia, não é distração — é armadilha do material.**
 *  E a pergunta certa é "quem já pega isso?", e não "que teste eu escrevo?".
 * ════════════════════════════════════════════════════════════════════
 */

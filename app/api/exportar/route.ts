import { getViewer } from "@/lib/viewer";
import { hoje } from "@/lib/datas";
import { limitar, varrer } from "@/lib/rate-limit";
import { zip } from "@/lib/zip";
import {
  COLUNAS,
  estanteEmLotes,
  linhaCsv,
  oResto,
  paraCsv,
  leiaMe,
} from "@/lib/exportar";

/**
 * ════════════════════════════════════════════════════════════════════
 *  BAIXAR A SUA ESTANTE. Um clique, e o arquivo começa a descer.
 *
 *  ═══ SEM FILA, SEM E-MAIL, SEM "ESTAMOS PREPARANDO O SEU ARQUIVO" ═══
 *
 *  Isso é atrito disfarçado de cuidado, e é exatamente como as plataformas dificultam a
 *  saída sem parecer que dificultam: elas não dizem não, elas dizem "em breve". Aí mandam
 *  um e-mail em 48 horas, com um link que expira, e a pessoa desiste no meio.
 *
 *  Aqui o arquivo começa a descer no clique. Não porque seja mais fácil de programar —
 *  streaming é MAIS difícil que montar um arquivo e mandar —, mas porque a demora não pode
 *  existir: ela é a mensagem.
 *
 *  ═══ POR QUE STREAMING, E NÃO UM BUFFER ═══
 *
 *  Alguém com cinco mil livros não pode montar o arquivo inteiro na memória de um processo
 *  serverless. Ele estoura — e estoura JUSTAMENTE para quem tem uma vida de leitura ali
 *  dentro, que é quem mais precisa de levar embora.
 *
 *  A estante sai do banco em lotes, cada lote vira linhas de CSV, e cada linha vai para a
 *  rede antes de a próxima ser lida. A memória fica constante, e não cresce com a estante.
 *
 *  ═══ E É A ROTA MAIS CARA DO APP ═══
 *
 *  Ela lê a estante inteira de uma pessoa. Um botão que se pode apertar em laço é uma
 *  negação de serviço com o nome de "exportar". Três por hora é generoso para gente
 *  (ninguém baixa a própria estante quatro vezes numa tarde) e é ridículo para um script.
 * ════════════════════════════════════════════════════════════════════
 */

/** Node, e não Edge: o banco e o limitador não existem no Edge. */
export const runtime = "nodejs";

/**
 * Três por hora. Ver o cabeçalho: esta é a rota mais cara que existe aqui, e é a única que
 * lê a estante inteira de uma pessoa de uma vez.
 */
const LIMITE = { limit: 3, windowMs: 60 * 60_000 };

export async function GET() {
  const viewer = await getViewer();

  if (!viewer) {
    return new Response("Entre para baixar a sua estante.", { status: 401 });
  }

  const veredito = await limitar(`exportar:${viewer.id}`, LIMITE);
  void varrer();

  if (!veredito.ok) {
    return new Response(
      "Você já baixou a sua estante algumas vezes agora há pouco. Espere um pouco e tente de novo.",
      { status: 429, headers: { "retry-after": String(veredito.retryAfter) } },
    );
  }

  const enc = new TextEncoder();
  const agora = new Date();

  /**
   * O dia vem de `hoje()`, e não de `toISOString().slice(0, 10)`.
   *
   * O `toISOString` devolve o dia em UTC: um arquivo baixado às 21h no Brasil sairia com a
   * data de AMANHÃ no nome. É uma lei deste repositório, e lib/datas.test.ts a defende —
   * ela me pegou escrevendo exatamente isso, aqui.
   */
  const dia = hoje();

  /**
   * O handle vem do banco, e não da sessão: o nome do arquivo é o único pedaço da resposta
   * que a pessoa vai ver antes de abrir, e ele tem que estar certo.
   */
  const resto = await oResto(viewer.id);
  const handle = resto.voce?.handle ?? "voce";

  /** O CSV, linha a linha, sem nunca ter a estante inteira na memória. */
  async function* csv() {
    yield enc.encode(linhaCsv([...COLUNAS]));

    for await (const lote of estanteEmLotes(viewer!.id)) {
      // Um lote inteiro numa string só: quinhentas linhas de texto é kilobytes, e mil
      // `enqueue` de uma linha cada custa mais que a memória que economizam.
      let bloco = "";
      for (const linha of lote) bloco += linhaCsv(paraCsv(linha));
      yield enc.encode(bloco);
    }
  }

  /**
   * O JSON. Ele é o retrato SEM PERDAS, e também é escrito em pedaços: um array de cinco
   * mil livros montado com `JSON.stringify` é o array inteiro na memória, duas vezes.
   */
  async function* json() {
    yield enc.encode('{\n  "gume": "a sua estante, sem perdas",\n  "exportado_em": ');
    yield enc.encode(JSON.stringify(agora.toISOString()));
    yield enc.encode(',\n  "estante": [\n');

    let primeiro = true;
    for await (const lote of estanteEmLotes(viewer!.id)) {
      let bloco = "";
      for (const l of lote) {
        bloco += (primeiro ? "    " : ",\n    ") + JSON.stringify(l);
        primeiro = false;
      }
      yield enc.encode(bloco);
    }

    yield enc.encode("\n  ],\n");

    // O resto (quem você segue, as indicações, as correções) é pequeno, e cabe de uma vez.
    const cauda = JSON.stringify(resto, null, 2).slice(1); // sem a chave de abertura
    yield enc.encode(cauda.replace(/^\n?/, "  "));
    yield enc.encode("\n");
  }

  const arquivo = zip([
    { nome: "LEIA-ME.txt", pedacos: [enc.encode(leiaMe(handle, dia))] },
    { nome: "estante.csv", pedacos: csv() },
    { nome: "tudo.json", pedacos: json() },
  ]);

  return new Response(arquivo, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="gume-${handle}-${dia}.zip"`,
      // Um arquivo com os dados de alguém não fica guardado em cache de proxy nenhum.
      "cache-control": "no-store",
    },
  });
}

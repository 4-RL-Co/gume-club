import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A VOZ. O Gume fala com leitores, não com desenvolvedores.
 *
 *  Estrutura, não vigilância. A regra está escrita no AGENTS.md, mas
 *  regra escrita é regra que a próxima tela esquece. Este teste varre
 *  tudo que o leitor lê (página, botão, estado vazio, mensagem de erro)
 *  e quebra o build se o jargão voltar.
 *
 *  Comentário de código e mensagem de commit são outra conversa: ali
 *  pode citar arquivo interno à vontade, porque quem lê é quem constrói.
 *  Por isso o comentário é removido antes da varredura.
 * ════════════════════════════════════════════════════════════════════
 */

const PROIBIDO: { termo: RegExp; porque: string }[] = [
  /**
   * TRAVESSÃO E EMOJI. A regra está na seção "A voz" do AGENTS.md desde sempre
   * ("sentence case, sem em-dash, sem emoji"), e este teste não a defendia — então ela
   * não existia. Uma regra que só está escrita é uma regra que a próxima tela esquece,
   * e foi exatamente o que aconteceu: os textos das insígnias nasceram cheios de
   * travessão, e nada quebrou.
   *
   * O travessão é uma pontuação de ensaio, e o Gume não é um ensaio: ele é um app que
   * fala baixo. Onde cabe um travessão quase sempre cabe um ponto, e o texto fica mais
   * curto. Em comentário de código ele é livre, porque quem lê ali é quem constrói.
   */
  { termo: /[—–]/, porque: "travessão: use ponto, vírgula ou parêntese" },
  { termo: /\p{Extended_Pictographic}/u, porque: "emoji" },
  { termo: /ai\/PLAN|PLAN\.md|DECISIONS|schema\.md|AGENTS\.md/i, porque: "arquivo interno" },
  { termo: /\bFase \d/i, porque: "fase de projeto: diga 'em breve'" },
  { termo: /\broadmap\b|\bv0\.\d/i, porque: "linguagem de projeto" },
  { termo: /\bpnpm\b|db:seed|\bnpm run\b/i, porque: "comando de terminal" },
  { termo: /\bmigration\b|\bendpoint\b|\bschema\b/i, porque: "jargão de dev" },
  { termo: /\bAGPL\b|self-host/i, porque: "licença e infra: só em /sobre" },
  { termo: /\brepositório\b|\bcommit\b|\bpull request\b/i, porque: "jargão de dev" },
  { termo: /na mesma transação/i, porque: "jargão de banco de dados" },

  /**
   * ═══ O NOME ANTIGO DA ESCADA ═══
   *
   * A escada de leitura se chamou "elo" por uma semana, e virou "honra" para não copiar
   * o League of Legends. O código foi renomeado inteiro, e DUAS TELAS não: a página Sobre
   * continuou dizendo "existe um elo, e não existe lista dos maiores", enquanto o perfil,
   * ao lado, dizia "honra".
   *
   * Um produto com dois nomes para a mesma coisa não parece um produto com dois nomes:
   * parece um produto com duas coisas. A pessoa procura o "elo" no perfil e não acha.
   *
   * Renomear é fácil. Renomear e não esquecer de nenhuma tela é o que precisa de teste.
   *
   * (O sentido comum da palavra continua livre em COMENTÁRIO, e "elo da corrente" nunca
   * foi problema: este teste só olha para o que o leitor lê.)
   */
  { termo: /\belos?\b/i, porque: "a escada se chama HONRA. 'Elo' é o nome antigo" },

  /**
   * ════════════════════════════════════════════════════════════════════
   *  A LEGENDA DIZ O QUE É. NÃO O QUE A GENTE SE RECUSOU A FAZER.
   *
   *  ═══ O QUE ESTAVA ACONTECENDO ═══
   *
   *  O manifesto vazou para dentro dos rótulos. Quase toda seção do app explicava uma
   *  RECUSA em vez de dizer o que a pessoa estava vendo:
   *
   *      "Só as capas. Sem nome, sem contagem, sem nada em alta."
   *      "Gente que você ainda não segue. Em ordem de acontecer, e nada mais."
   *      "Não existe primeiro lugar aqui. Existe uma lista, e o nome de quem fez."
   *
   *  E o dono do Gume leu isso como o que era: **pedante**.
   *
   *  Ele tem razão, e não porque as recusas estejam erradas — elas são o produto. É que
   *  quem chega numa seção quer saber O QUE É AQUILO. Uma legenda que gasta as três linhas
   *  dela explicando o que o app não faz é uma legenda que não informa nada, e ainda dá
   *  sermão. Repetida em oito telas, ela vira um tique.
   *
   *  ═══ ONDE AS RECUSAS MORAM ═══
   *
   *  Na página /sobre, que é o manifesto e tem o direito de sê-lo. Lá elas são o assunto.
   *  Na legenda de uma seção, elas são ruído com pose.
   *
   *  ═══ O QUE ESTE TESTE PEGA, E O QUE ELE APRENDEU A NÃO PEGAR ═══
   *
   *  A primeira versão proibia três "sem" na mesma frase. E ela acusou isto:
   *
   *      "Os livros sem capa, sem autor, sem ano. É por onde se começa."
   *
   *  Que não é sermão nenhum: é a informação mais útil da tela. São os DADOS que faltam
   *  nos livros, ditos um a um.
   *
   *  A forma é a mesma; o assunto é que muda. "Sem capa, sem autor, sem ano" descreve o
   *  mundo. "Sem contagem, sem placar, sem nada em alta" descreve as nossas escolhas — e
   *  ninguém abriu aquela tela para ouvir as nossas escolhas.
   *
   *  Então a regra precisa do VOCABULÁRIO da recusa, e não só da forma dela. Três negações
   *  em cima de coisas que a gente se recusou a construir (placar, curtida, contagem,
   *  algoritmo) é sermão. Três negações em cima de dados que faltam é uma legenda.
   *
   *  Personalidade continua obrigatória: "ou a capa te chama, ou não te chama" fica.
   * ════════════════════════════════════════════════════════════════════
   */
  {
    termo:
      /\bsem\b[^.!?]*\bsem\b[^.!?]*\bsem\b[^.!?]*\b(placar|ranking|curtida|contagem|seguidor|algoritmo|ofensiva|em alta|número)/i,
    porque: "sermão: uma lista de recusas não é uma legenda. O manifesto mora em /sobre",
  },
  { termo: /,\s*e nada mais\b/i, porque: "tique: 'e nada mais' não informa nada" },
];

/**
 * As telas que NÃO falam com o leitor, e por isso não caem sob esta regra.
 *
 * A regra global (sentence case, sem jargão, sem travessão) continua valendo para todo o
 * resto do app, e não afrouxou. Aqui moram só as duas telas cujo leitor É o dono:
 *
 *  - /sobre pode dizer, em uma frase, que o código é aberto (é o manifesto).
 *
 *  - O PAINEL PRIVADO (a página e o seu componente) fala com o idealizador, e só com ele.
 *    Ele usa palavras que uma tela de leitor não pode usar (retenção, coorte, mediana,
 *    cadastros), porque quem lê ali é quem construiu o Gume. A rota inteira é privada e
 *    responde 404 para qualquer outra pessoa (ver app/painel/page.tsx), então nenhuma
 *    dessas palavras chega a um leitor. A exceção é DESTAS telas, e de mais nenhuma: um
 *    jargão que vaze para qualquer outra continua quebrando o build.
 */
const EXCECAO = new Set([
  "app/sobre/page.tsx",
  "app/painel/page.tsx",
  "components/painel.tsx",
  "components/painel-grafico.tsx",
]);

function arquivos(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const full = join(dir, nome);
    if (statSync(full).isDirectory()) arquivos(full, out);
    else if ([".tsx", ".ts"].includes(extname(nome)) && !nome.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

/** Só o que o leitor vê: texto de JSX e string de prosa. Sem comentário, sem import. */
function textoDeTela(src: string): string[] {
  const semComentario = src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
    .replace(/^\s*import .*$/gm, " ");

  const achados: string[] = [];

  // texto solto dentro de JSX: >  aqui  <
  for (const m of semComentario.matchAll(/>([^<>{}]{4,})</g)) achados.push(m[1]!);

  /**
   * ═══ AS ASPAS TÊM QUE FECHAR NA LINHA, E ISSO ERA UM BUG DE VERDADE ═══
   *
   * Isto era `/"([^"\\]{6,})"/`: pegava a string SE ela tivesse seis caracteres ou
   * mais. E aí, ao topar com uma string curta — `"Stamp"`, o nome de um ícone, cinco
   * letras —, o casamento falhava, e a aspa que FECHA a string curta se emparelhava
   * com a aspa que ABRE a próxima. O alinhamento desandava, e a partir dali strings de
   * prosa inteiras ficavam invisíveis para a varredura.
   *
   * Foi assim que o texto da insígnia de moderador passou com travessão e ninguém viu:
   * o teste não estava sendo permissivo, ele estava sendo CEGO.
   *
   * Agora casa qualquer string, de qualquer tamanho, mas proibida de atravessar a
   * quebra de linha — que é como uma string de verdade se comporta. Com isso o
   * emparelhamento nunca mais escorrega. O filtro de tamanho vem DEPOIS, e não dentro
   * do casamento.
   */
  for (const m of semComentario.matchAll(/"([^"\\\n]*)"|'([^'\\\n]*)'/g)) {
    const s = (m[1] ?? m[2])!;
    if (s.length < 6) continue;
    if (/\s/.test(s) && /[a-zA-ZÀ-ú]/.test(s) && !s.includes("/") && !/^[a-z-]+ [a-z-]+$/.test(s)) {
      achados.push(s);
    }
  }
  return achados;
}

/**
 * O texto de tela NÃO mora só em `app/` e `components/`.
 *
 * A prosa das insígnias mora em `lib/badges-view.ts`, e este teste nunca a olhou: ele
 * varria só as telas. Foi assim que oito textos cheios de travessão entraram sem que
 * nada quebrasse — e seriam oito textos de jargão, com a mesma facilidade.
 *
 * Se o leitor lê, o teste varre. Onde o arquivo mora é problema nosso, e não dele.
 */
const PROSA_FORA_DAS_TELAS = [
  "lib/badges-view.ts",
  // O resumo da gaveta de "quando você leu" é texto que o leitor lê, e mora aqui
  // justamente para esta varredura alcançá-lo.
  "lib/leituras-view.ts",
  "lib/falta-no-app.ts",
  "lib/shelf-view.ts",
  "lib/corrections-view.ts",
  "lib/veredito.ts",
].filter((f) => existsSync(f));

describe("a voz do produto", () => {
  const alvos = [...arquivos("app"), ...arquivos("components"), ...PROSA_FORA_DAS_TELAS];

  it("varre todas as telas, e há telas para varrer", () => {
    expect(alvos.length).toBeGreaterThan(10);
  });

  it.each(alvos)("%s não fala com desenvolvedor", (arquivo) => {
    const rel = arquivo.replace(process.cwd() + "/", "");
    if (EXCECAO.has(rel)) return;

    const violacoes: string[] = [];
    for (const texto of textoDeTela(readFileSync(arquivo, "utf8"))) {
      for (const { termo, porque } of PROIBIDO) {
        if (termo.test(texto)) {
          violacoes.push(`"${texto.trim().slice(0, 70)}" (${porque})`);
        }
      }
    }

    expect(violacoes, `${rel} fala com desenvolvedor, não com leitor`).toEqual([]);
  });
});

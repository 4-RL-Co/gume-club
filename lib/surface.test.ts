import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O MANIFESTO DE SUPERFÍCIE. Estrutura, não vigilância.
 *
 *  Este teste varre TODA superfície pela qual uma requisição entra (as
 *  rotas de API e toda função exportada de um arquivo "use server") e
 *  exige que ela resolva quem está falando, por getActor() ou
 *  getViewer(). Sem isso, ela é pública.
 *
 *  É o teste que pega o modo de falha que vaza banco de dados: a rota
 *  que era pública um dia, e continuou pública depois que a página foi
 *  apagada. Ninguém lembra dela; o teste lembra.
 *
 *  O que é público de propósito está na lista PUBLICO, com o porquê
 *  escrito ao lado. Nada entra nessa lista sem uma frase.
 * ════════════════════════════════════════════════════════════════════
 */

/** Público de propósito. Cada linha precisa de um motivo, e o motivo é lido por gente. */
const PUBLICO: Record<string, string> = {
  "app/api/auth/[...all]/route.ts":
    "é o próprio login: exigir sessão aqui seria exigir sessão para poder ter sessão",
  "app/api/buscar/route.ts":
    "buscar livro no catálogo é público, como a vitrine de uma livraria. A busca de PESSOAS que ela devolve só traz o que é público, e isso é provado em lib/redteam.sql.test.ts",
  "app/entrar/invite.ts":
    "guarda o convite num cookie ANTES de a pessoa existir, e lê o NOME de quem convidou para a porta saudar. A leitura é só de dado público (handle e nome de exibição), nunca de linha de leitor, e não há sessão a quem perguntar porque a pessoa ainda não existe",

  /*
   * O CÓDIGO POR E-MAIL, no meio do login.
   *
   * A senha já foi conferida, e a sessão AINDA NÃO EXISTE — `getActor()` levantaria,
   * sempre. Não há ator a quem perguntar, e é por isso que ela não pergunta.
   *
   * Quem autoriza é o Better Auth, pelo cookie de segundo passo que ele mesmo emitiu um
   * instante antes: `sendTwoFactorOTP` recusa sem esse cookie, e a ação repassa os
   * cabeçalhos para ele decidir de quem é.
   *
   * A exceção não é um cheque em branco: lib/acoes.test.ts prova que ela REPASSA os
   * cabeçalhos. Uma ação que não repassasse estaria mandando código de login para quem
   * quer que pedisse.
   */
  "app/entrar/codigo/actions.ts":
    "roda no meio do login, quando a sessão ainda não existe. Quem autoriza é o cookie de segundo passo do Better Auth, e a ação repassa os cabeçalhos para ele decidir. lib/acoes.test.ts prova o repasse",

  // ── OS PÔSTERES ────────────────────────────────────────────────────────────
  // Quem abre estes é o robô do WhatsApp, e ele NUNCA vai ter sessão. Eles são
  // obrigatoriamente públicos, e por isso são a superfície mais perigosa do app:
  // um vazamento aqui não fica numa tela, ele vai parar num grupo de WhatsApp.
  //
  // O que os segura é o visibleTo(null, ...): a MESMA regra de visibilidade do
  // resto do app, com um estranho no lugar do leitor. É por isso que o teste
  // abaixo exige que eles a chamem.
  "app/opengraph-image.tsx":
    "o pôster da home. Não lê o banco: é a marca e a frase, e mais nada",
  "app/livro/[slug]/opengraph-image.tsx":
    "o pôster de um livro. Lê só a FICHA (título, autor, capa), que é o catálogo, e o catálogo é de todo mundo. Nenhum dado de leitor entra",
  "app/[handle]/opengraph-image.tsx":
    "o pôster de um perfil. Lê linha de leitor, e por isso filtra com visibleTo(null, ...): só o que um estranho já podia ver na página",
  "app/estante/[slug]/opengraph-image.tsx":
    "o pôster de uma estante. Idem: visibleTo(null, ...), e uma estante privada não vira pôster nenhum",

  /*
   * O AVISO DO STRIPE, e ele é a superfície mais estranha do app: a única em que uma
   * requisição SEM SESSÃO pode mudar dado de leitor.
   *
   * Quem bate aqui é um servidor do Stripe, e ele nunca vai ter cookie: getViewer()
   * devolveria null sempre, e exigi-lo tornaria o webhook impossível de existir.
   *
   * Quem autoriza é a ASSINATURA HMAC sobre o corpo cru, conferida com o segredo do
   * endpoint antes de a rota olhar para o conteúdo. Sem segredo no ambiente, a rota
   * responde 404 e não processa nada.
   *
   * E a autorização não para na assinatura: para dados de assinatura, a rota vai buscar
   * o estado atual na API do Stripe antes de gravar, porque um evento assinado ainda pode
   * estar descrevendo um estado que já mudou. lib/stripe.webhook.test.ts prova que corpo
   * sem assinatura válida é recusado, e que o mesmo evento duas vezes só conta uma.
   */
  "app/api/webhooks/stripe/route.ts":
    "é o aviso de pagamento do Stripe, que nunca tem sessão. Quem autoriza é o HMAC sobre o corpo cru, conferido com STRIPE_WEBHOOK_SECRET antes de qualquer leitura do conteúdo, e o efeito é idempotente por id de evento. Ver lib/stripe.webhook.test.ts",

  "app/relatar/actions.ts":
    "de propósito aberto a quem não tem conta: um bug pode ser justo o motivo de não conseguir se cadastrar. Não lê nem escreve dado de ninguém, só encaminha o texto pra caixa da moderação, e é limitada por IP (RATES.relatarProblema), não por usuário. Ver lib/acoes.test.ts (SEM_PORTEIRO) e lib/relatar.ts",
  "app/api/eventos/route.ts":
    "grava evento anônimo do funil de entrada (visita na home, clique, chegada em /entrar, cadastro): quem visita a home ainda não tem conta, então não há ator a resolver. Limitada por IP (RATES.eventosFunil), e o corpo aceito nunca guarda e-mail, IP ou qualquer identificador de pessoa — ver lib/funil.ts e lib/eventos-funil.sql.test.ts",
};

function arquivos(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const full = join(dir, nome);
    if (statSync(full).isDirectory()) arquivos(full, out);
    else if ([".ts", ".tsx"].includes(extname(nome)) && !nome.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

const raiz = process.cwd();
const todos = arquivos(join(raiz, "app")).map((f) => f.slice(raiz.length + 1));

/** Uma superfície resolve o ator se chama getActor() ou getViewer() em algum ponto. */
function resolveOAtor(src: string): boolean {
  return /getActor\s*\(|getViewer\s*\(|getActorOrNull\s*\(/.test(src);
}

describe("toda rota de API resolve quem está falando", () => {
  const rotas = todos.filter((f) => f.endsWith("route.ts"));

  it("existe pelo menos uma rota para varrer", () => {
    expect(rotas.length).toBeGreaterThan(0);
  });

  for (const rota of rotas) {
    it(`${rota}`, () => {
      if (PUBLICO[rota]) {
        expect(PUBLICO[rota].length, "público sem motivo escrito").toBeGreaterThan(20);
        return;
      }
      const src = readFileSync(join(raiz, rota), "utf8");
      expect(
        resolveOAtor(src),
        `${rota} não chama getActor() nem getViewer(): ela é pública, e ninguém decidiu isso`,
      ).toBe(true);
    });
  }
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS PÔSTERES SÃO A SUPERFÍCIE MAIS PÚBLICA QUE EXISTE.
 *
 *  Um opengraph-image é lido por um robô sem sessão, e o resultado dele
 *  cai num grupo de WhatsApp. Ele NÃO PODE exigir login (ninguém logaria
 *  o robô), então a única defesa é a visibilidade.
 *
 *  Regra: um pôster que toca uma tabela DE LEITOR tem que chamar
 *  visibleTo(). O CATÁLOGO (obra, autor, edição) não precisa: ele é
 *  público por definição, e é a vitrine da livraria.
 *
 *  A distinção é a lista abaixo, e ela é o que separa "esta imagem
 *  mostra Dom Casmurro" de "esta imagem mostra o que a Maria leu".
 *
 *  Este teste nasceu junto com os pôsteres, e não depois de um vazamento.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * As tabelas que guardam a linha de ALGUÉM. Tocar uma delas sem visibleTo() é
 * publicar a linha de outra pessoa, e num pôster isso vai para um grupo de
 * WhatsApp. `works`, `authors` e `editions` NÃO estão aqui de propósito: o
 * catálogo é de todo mundo.
 */
const DE_LEITOR = [
  "users", "library_entries", "collections", "collection_items",
  "readings", "ratings", "reviews", "owned_copies", "activities",
  "libraryEntries", "collectionItems", "ownedCopies",
];

describe("todo pôster que lê linha de leitor filtra visibilidade", () => {
  const posteres = todos.filter((f) => f.endsWith("opengraph-image.tsx"));

  it("existe pelo menos um pôster para varrer", () => {
    expect(posteres.length).toBeGreaterThan(0);
  });

  for (const poster of posteres) {
    it(`${poster}`, () => {
      expect(
        PUBLICO[poster],
        `${poster} é uma imagem que um robô sem sessão abre, e ninguém escreveu por que ela é pública`,
      ).toBeTruthy();
      expect(PUBLICO[poster]!.length, "público sem motivo escrito").toBeGreaterThan(20);

      const src = readFileSync(join(raiz, poster), "utf8");
      const tocadas = DE_LEITOR.filter((t) => new RegExp(`\\b${t}\\b`).test(src));
      if (tocadas.length === 0) return;

      expect(
        /visibleTo\s*\(/.test(src),
        `${poster} toca ${tocadas.join(", ")} e NUNCA chama visibleTo(): ela pode virar um pôster de uma linha privada, e um pôster vaza para um grupo de WhatsApp`,
      ).toBe(true);
    });
  }
});

describe("toda ação de servidor resolve quem está falando", () => {
  const acoes = todos.filter((f) => {
    if (f.endsWith("route.ts")) return false;
    const src = readFileSync(join(raiz, f), "utf8");
    return /^\s*["']use server["']/m.test(src);
  });

  it("existe pelo menos uma ação para varrer", () => {
    expect(acoes.length).toBeGreaterThan(0);
  });

  for (const acao of acoes) {
    it(`${acao}`, () => {
      if (PUBLICO[acao]) return;

      const src = readFileSync(join(raiz, acao), "utf8");
      const exportadas = [...src.matchAll(/export\s+async\s+function\s+(\w+)/g)].map((m) => m[1]!);

      expect(exportadas.length, `${acao} é "use server" e não exporta nada`).toBeGreaterThan(0);
      expect(
        resolveOAtor(src),
        `${acao} exporta ${exportadas.join(", ")} e nunca resolve o ator: qualquer um na internet pode chamar isso`,
      ).toBe(true);
    });
  }
});

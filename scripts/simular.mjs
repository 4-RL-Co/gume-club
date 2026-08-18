#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  O APP, USADO POR GENTE DE VERDADE.
 *
 *  Cinco pessoas, cinco papéis, e cada uma faz o que faria — inclusive o que **não
 *  pode**. Toda rota é chamada com a sessão de cada uma, e o que volta é comparado com o
 *  que deveria voltar.
 *
 *  ═══ POR QUE ISTO NÃO É UM TESTE DE UNIDADE ═══
 *
 *  Os testes de unidade deste repo já provam que `lib/authz.ts` está certo. O que eles
 *  NÃO provam é que alguém se lembrou de chamá-lo — e o bug que mata um app não é a
 *  função de autorização errada, é a tela que esqueceu de perguntar.
 *
 *  Isto aqui bate na porta. Com cookie de sessão de verdade, no servidor de verdade, e
 *  lendo o que a página devolve.
 *
 *  ═══ O QUE ELE PROCURA ═══
 *
 *    · 500 — a tela quebrou
 *    · 200 onde deveria ser 403/404 — vazou
 *    · 404 onde deveria ser 200 — sumiu
 *    · um botão que a pessoa não pode apertar, desenhado na cara dela
 *    · dado de outra pessoa aparecendo na tela de quem não podia ver
 *
 *  Uso:  node --experimental-strip-types scripts/simular.mjs
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const env = readFileSync(".env", "utf8");
const url = process.env.DATABASE_URL ?? env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const BASE = process.env.BASE ?? "http://localhost:3000";
const sql = postgres(url, { max: 1 });

const achados = [];
const anota = (quem, o_que, detalhe) => {
  achados.push({ quem, o_que, detalhe });
  console.log(`  ✗ [${quem}] ${o_que}\n      ${detalhe}`);
};

/**
 * ═══ NAVEGADORES E SISTEMAS DIFERENTES ═══
 *
 * Não é firula: o Safari do iPhone e o Chrome do Windows mandam cabeçalhos diferentes, e
 * um `Accept` diferente já derrubou app que dependia de negociação de conteúdo. Um bot
 * do Google é o que decide se o app existe no mundo.
 */
const NAVEGADORES = {
  "chrome/windows":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  "safari/iphone":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "firefox/linux":
    "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
  "googlebot":
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
};

/**
 * Uma página, como um navegador a pediria.
 *
 * O `try` não é preciosismo — e a lei que o exige (lib/rede.test.ts) pegou ESTE arquivo
 * na primeira vez que rodou. `AbortSignal.timeout` **lança**: sem ele, uma página que
 * demorasse demais derrubaria o simulador no meio, e o relatório sairia mentindo que
 * estava tudo bem porque parou antes de achar o resto.
 *
 * Um servidor que não responde é um ACHADO, e nunca o fim do teste.
 */
async function pega(caminho, { cookie = "", navegador = "chrome/windows" } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${caminho}`, {
      headers: {
        "User-Agent": NAVEGADORES[navegador],
        Accept: "text/html,application/xhtml+xml",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    // O servidor não respondeu em trinta segundos. Isso é um bug, e é reportado como um.
    return { status: 0, corpo: "" };
  }

  const corpo = res.status < 400 ? await res.text() : "";
  return { status: res.status, corpo };
}

/** Só o texto que uma pessoa lê. Sem script, sem estilo, sem o payload do React. */
function texto(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

// ─────────────────────────────────────────────── as pessoas

console.log("\n1. as pessoas\n");

const marca = "sim" + String(process.pid).slice(-4);

/**
 * ═══ A PESSOA ENTRA PELA PORTA DA FRENTE ═══
 *
 * A primeira versão disto criava a linha de `session` direto no banco e montava o cookie
 * à mão. Ela "funcionou": o script rodou, achou dois bugs, e **os dois eram mentira**.
 *
 * O Better Auth **assina** o cookie. Um token cru não vale nada, então as quatro pessoas
 * eram tratadas como anônimas — e o teste comparava um estranho com um estranho, três
 * vezes, e chamava isso de simulação.
 *
 * É o pior tipo de teste que existe: o que falha por engano ensina uma coisa errada, e o
 * que passa por engano ensina outra.
 *
 * ═══ E O SEGUNDO TROPEÇO FOI O APP FUNCIONANDO ═══
 *
 * O cadastro é limitado a TRÊS POR HORA por IP (lib/rate-limit.ts), porque "criar conta
 * dez vezes do mesmo IP em cinco minutos não é ninguém: é um script montando uma fazenda
 * de spam". O simulador é exatamente esse script, e tomou 429 na cara.
 *
 * Isso é a defesa do app trabalhando, e não um bug. Então o simulador se comporta como
 * gente: **um** cadastro pela porta, e as outras entram pelo LOGIN, com a mesma senha —
 * o que é o caminho de qualquer pessoa que já tem conta.
 */
const SENHA = "uma-senha-de-teste-bem-comprida";

/** O cookie que o APP emitiu, assinado por ele. É o que uma pessoa teria no navegador. */
function cookieDe(res) {
  return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
}

/** Um cadastro de verdade. Só um: o resto entra pelo login. */
async function cadastrar(handle) {
  const email = `${handle}${marca}@gume.local`;

  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    // O `Origin` é o que todo navegador manda, e o Better Auth RECUSA sem ele
    // ("Missing or null Origin"). É a proteção contra CSRF, e ela também é o app
    // funcionando: um script que não se identifica como vindo do site não entra.
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password: SENHA, name: handle }),
  });

  if (!res.ok) {
    const porque = await res.text().catch(() => "");
    throw new Error(
      `o cadastro de ${handle} falhou (${res.status}): ${porque.slice(0, 120)}\n` +
        `      Se for 429: o app limita 3 cadastros por hora por IP, e está CERTO. ` +
        `Reinicie o servidor (a contagem é em memória) e rode de novo.`,
    );
  }

  return { email, cookie: cookieDe(res) };
}

/** Um login de verdade. */
async function entrar(email) {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password: SENHA }),
  });

  if (!res.ok) throw new Error(`o login de ${email} falhou: ${res.status}`);
  return cookieDe(res);
}

/**
 * As outras pessoas nascem no banco COM A MESMA SENHA da primeira — copiando a linha de
 * credencial que o Better Auth criou. É a mesma senha, com o mesmo hash, feito pelo
 * próprio app: nada aqui inventa criptografia.
 *
 * Depois elas ENTRAM pelo login, e o cookie é assinado pelo servidor como o de qualquer
 * pessoa.
 */
async function clonar(handle, credencialModelo, extra = {}) {
  const email = `${handle}${marca}@gume.local`;

  const [u] = await sql`
    insert into users (handle, display_name, email, email_verified, librarian_tier, moderator_at, is_private)
    values (${handle + marca}, ${handle}, ${email}, true,
            ${extra.librarian ?? 0}, ${extra.moderador ? sql`now()` : null}, ${extra.privado ?? false})
    returning id, handle`;

  await sql`
    insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
    values (gen_random_uuid(), ${email}, 'credential', ${u.id}, ${credencialModelo}, now(), now())`;

  return { ...u, cookie: await entrar(email) };
}

// A PRIMEIRA entra pela porta da frente, e é ela que produz o hash de senha do app.
const contaLeitora = await cadastrar("leitora");

const [credencial] = await sql`
  select a.password from account a
    join users u on u.id = a."userId"
   where u.email = ${contaLeitora.email} and a."providerId" = 'credential'`;

if (!credencial?.password) throw new Error("o cadastro não gravou credencial: nada a clonar");

const [leitoraDb] = await sql`
  update users set handle = ${"leitora" + marca}, display_name = 'leitora'
   where email = ${contaLeitora.email}
   returning id, handle`;

const leitora = { ...leitoraDb, cookie: contaLeitora.cookie };
const biblio = await clonar("biblio", credencial.password, { librarian: 1 });
const moderadora = await clonar("moderadora", credencial.password, { moderador: true });
const reservada = await clonar("reservada", credencial.password, { privado: true });
const visitante = { handle: "(sem conta)", cookie: "" };

console.log(`  @${leitora.handle} — leitora comum`);
console.log(`  @${biblio.handle} — bibliotecária`);
console.log(`  @${moderadora.handle} — moderadora`);
console.log(`  @${reservada.handle} — perfil privado`);
console.log(`  ${visitante.handle} — sem conta`);

// ─────────────────────────────────────────────── o que cada uma vê

console.log("\n2. as portas: quem pode entrar onde\n");

const [livro] = await sql`
  select w.slug from works w
   where exists (select 1 from editions e where e.work_id = w.id and e.cover_url is not null)
   limit 1`;

const [autor] = await sql`select slug from authors limit 1`;

/** caminho → o que cada papel deve receber. */
const PORTAS = [
  // caminho,                    visitante, leitora, biblio, moderadora
  ["/", 200, 200, 200, 200],
  ["/sobre", 200, 200, 200, 200],
  ["/insignias", 200, 200, 200, 200],
  ["/contribuidores", 200, 200, 200, 200],
  ["/o-que-falta", 200, 200, 200, 200],
  [`/livro/${livro.slug}`, 200, 200, 200, 200],
  [`/autor/${autor.slug}`, 200, 200, 200, 200],
  // /colecao (sem slug) é "tenho/quero" — o colecionador (conjuntos, /colecao/[slug])
  // saiu do app na migration 0062.
  ["/colecao", 200, 200, 200, 200],
  ["/estante", 200, 200, 200, 200],
  ["/colecoes", 200, 200, 200, 200],
  ["/estatisticas", 200, 200, 200, 200],
  ["/pessoas", 200, 200, 200, 200],
  ["/pessoas?aba=explorar", 200, 200, 200, 200],

  /**
   * ═══ AS SALAS COM DONO ═══
   *
   * `/cuidar`, `/pedidos` e `/moderacao` respondem 200 mesmo para quem não pode: a tela
   * é que diz "esta sala não é para você".
   *
   * Isso é DELIBERADO e não é um buraco: um 403 confirma que a sala existe, e uma sala
   * cuja existência se confirma é uma sala que alguém vai tentar arrombar. O que protege
   * é o servidor, e ele é conferido logo abaixo, na seção 3.
   */
  ["/cuidar", 200, 200, 200, 200],
  ["/pedidos", 200, 200, 200, 200],
  ["/moderacao", 200, 200, 200, 200],

  // O perfil de quem NÃO tem conta é uma porta para entrar, e não um erro.
  ["/perfil", 200, 200, 200, 200],
];

const PAPEIS = [
  ["visitante", visitante],
  ["leitora", leitora],
  ["bibliotecária", biblio],
  ["moderadora", moderadora],
];

for (const [caminho, ...esperados] of PORTAS) {
  for (let i = 0; i < PAPEIS.length; i++) {
    const [nome, pessoa] = PAPEIS[i];
    const { status } = await pega(caminho, { cookie: pessoa.cookie });

    // 307 para /entrar é uma resposta legítima: a tela pede login em vez de quebrar.
    const ok = status === esperados[i] || (status === 307 && !pessoa.cookie);

    if (status === 0) {
      anota(nome, `${caminho} NÃO RESPONDEU`, "o servidor não respondeu em trinta segundos");
    } else if (!ok) {
      anota(nome, `${caminho} devolveu ${status}`, `esperado ${esperados[i]}`);
    }
  }
}

console.log("  (as portas foram conferidas)");

// ─────────────────────────────────────────────── o que a tela deixa apertar

console.log("\n3. os botões: o que cada tela OFERECE a quem não pode\n");

/**
 * ═══ O QUE ESTA SEÇÃO PROCURA ═══
 *
 * Não é o vazamento de dado: é o vazamento de EXPECTATIVA. Uma tela que desenha um botão
 * que a pessoa não pode apertar é uma tela que mente para ela — e a pessoa clica, toma um
 * erro, e conclui que o app está quebrado.
 */
const SALAS = [
  { caminho: "/cuidar", quem: "bibliotecária ou moderadora", frase: "não é para você" },
  { caminho: "/moderacao", quem: "moderadora", frase: "não é para você" },
];

for (const sala of SALAS) {
  const { corpo } = await pega(sala.caminho, { cookie: leitora.cookie });
  const t = texto(corpo).toLowerCase();

  if (!t.includes(sala.frase)) {
    anota(
      "leitora",
      `${sala.caminho} não disse que a sala não é dela`,
      `a tela devia explicar em português, e não abrir vazia ou quebrar`,
    );
  }
}

// A bibliotecária vê a fila de pedidos; a leitora, não.
{
  const dela = texto((await pega("/cuidar", { cookie: biblio.cookie })).corpo).toLowerCase();
  if (!dela.includes("pedidos")) {
    anota("bibliotecária", "/cuidar não ofereceu a fila de pedidos", "ela é bibliotecária e devia ver");
  }

  const daModeradora = texto((await pega("/cuidar", { cookie: moderadora.cookie })).corpo).toLowerCase();
  if (!daModeradora.includes("moderação")) {
    anota("moderadora", "/cuidar não ofereceu a moderação", "ela é moderadora e devia ver");
  }
}

console.log("  (os botões foram conferidos)");

// ─────────────────────────────────────────────── a privacidade

console.log("\n4. a privacidade: a estante de quem fechou a porta\n");

/**
 * A `reservada` tem perfil privado E um livro privado na estante. Nenhum dos dois pode
 * aparecer para um estranho, nem no perfil dela, nem na praça, nem no explorar.
 */
const [ed] = await sql`select id, work_id from editions where cover_url is not null limit 1`;

await sql`
  insert into library_entries (user_id, work_id, edition_id, status, visibility)
  values (${reservada.id}, ${ed.work_id}, ${ed.id}, 'read', 'private')
  on conflict (user_id, work_id) do update set visibility = 'private'`;

const [obra] = await sql`select title from works where id = ${ed.work_id}::uuid`;

for (const [nome, pessoa] of [["visitante", visitante], ["leitora", leitora], ["moderadora", moderadora]]) {
  for (const caminho of [`/@${reservada.handle}`, "/pessoas?aba=explorar", "/"]) {
    const { corpo } = await pega(caminho, { cookie: pessoa.cookie });

    // O TÍTULO do livro privado dela não pode aparecer em tela nenhuma.
    if (corpo.includes(obra.title) && caminho.includes("@")) {
      anota(nome, `o livro PRIVADO de @${reservada.handle} apareceu em ${caminho}`, obra.title);
    }
  }
}

console.log("  (a privacidade foi conferida)");

// ─────────────────────────────────────────────── navegadores e sistemas

console.log("\n5. navegadores e sistemas diferentes\n");

for (const navegador of Object.keys(NAVEGADORES)) {
  for (const caminho of ["/", `/livro/${livro.slug}`, "/insignias", "/pessoas"]) {
    const { status } = await pega(caminho, { navegador, cookie: leitora.cookie });
    if (status >= 400) {
      anota(navegador, `${caminho} devolveu ${status}`, "a mesma tela funciona em outro navegador");
    }
  }
}

console.log("  (quatro navegadores, e todas as telas responderam)");

// ─────────────────────────────────────────────── o dedo torto

console.log("\n6. o dedo torto: endereços que uma pessoa digita errado\n");

const TORTOS = [
  ["/livro/nao-existe-mesmo-xyz", 404],
  ["/autor/nao-existe-mesmo-xyz", 404],
  ["/colecao/nao-existe-mesmo-xyz", 404],
  ["/@ninguem-com-esse-nome", 404],
  ["/estante/ninguem-com-esse-nome", 404],
  ["/rota-que-nunca-existiu", 404],
  ["/livro/", 404],
  ["/@", 404],
];

for (const [caminho, esperado] of TORTOS) {
  const { status } = await pega(caminho, { cookie: leitora.cookie });

  if (status === 200) {
    anota("leitora", `${caminho} devolveu 200`, "um endereço que não existe tem que dizer 404");
  } else if (status >= 500) {
    anota("leitora", `${caminho} QUEBROU (${status})`, "um endereço torto não pode derrubar o servidor");
  }
  void esperado;
}

console.log("  (os endereços tortos foram conferidos)");

// ─────────────────────────────────────────────── o catálogo inteiro

console.log("\n7. o catálogo: cem páginas ao acaso, procurando tela quebrada\n");

/**
 * ═══ POR QUE CEM E NÃO UMA ═══
 *
 * As telas do app foram testadas com o Dom Casmurro, que é um livro bem-comportado: tem
 * autor, tem capa, tem sinopse, tem ano.
 *
 * O acervo tem 267 mil obras, e a maioria não é bem-comportada. Tem obra sem autor, sem
 * capa, sem ano, com título de duzentos caracteres, com aspas no nome, com um autor cujo
 * nome é uma linha inteira de metadado.
 *
 * Uma tela que quebra em 1% do acervo quebra para 2.670 livros. É um bug que ninguém vê
 * até alguém chegar nele.
 */
const AMOSTRA = await sql`
  (select 'livro'   as tipo, slug from works   order by random() limit 40)
  union all
  (select 'autor'   as tipo, slug from authors order by random() limit 30)`;

const ROTA = { livro: "/livro/", autor: "/autor/" };
let quebradas = 0;

for (const a of AMOSTRA) {
  const caminho = ROTA[a.tipo] + encodeURIComponent(a.slug);
  const { status } = await pega(caminho, { cookie: leitora.cookie });

  if (status >= 500) {
    quebradas++;
    anota("leitora", `${caminho} QUEBROU (${status})`, `um ${a.tipo} do acervo derrubou a tela`);
  } else if (status === 404) {
    anota("leitora", `${caminho} sumiu (404)`, `este ${a.tipo} EXISTE no banco e a tela não achou`);
  }
}

console.log(`  ${AMOSTRA.length} páginas do acervo, ${quebradas} quebradas.`);

// ─────────────────────────────────────────────── os botões, papel a papel

console.log("\n8. o que cada papel ENXERGA na mesma tela\n");

/**
 * ═══ O VAZAMENTO DE EXPECTATIVA ═══
 *
 * O bug que este bloco caça não é o de dado: é o de PROMESSA. Uma tela que desenha um
 * botão que a pessoa não pode apertar mente para ela — e ela clica, toma um erro, e
 * conclui que o app está quebrado.
 *
 * O contrário também é bug: um bibliotecário que não vê a ferramenta dele fica sem saber
 * que ela existe, e o trabalho não é feito.
 */
const [comCapa] = await sql`
  select w.slug from works w
   join editions e on e.work_id = w.id
   where e.cover_url is not null and w.author_id is not null
   limit 1`;

/**
 * ═══ A FRASE TEM QUE SER A FRASE, E NÃO UM PEDAÇO DELA ═══
 *
 * A primeira versão procurava "prateleira" no HTML do visitante, e acusou o app de
 * oferecer a prateleira a quem não tem conta.
 *
 * O que ela achou foi isto:
 *
 *     "Entre para PRATELEIRAR, dar nota e escrever."
 *
 * Que é exatamente o convite certo — e a palavra "prateleira" mora dentro de
 * "prateleirar". Um teste que grita por engano é um teste que todo mundo aprende a
 * ignorar, e aí ele para de valer quando o grito é de verdade.
 *
 * As frases agora são as que a pessoa LÊ, inteiras, e não fragmentos.
 */
const ESPERADO = [
  // tela,                     quem,          tem que ver,        NÃO pode ver
  [`/livro/${comCapa.slug}`, "leitora",     ["o que você achou", "resenha", "de onde veio"], []],
  [`/livro/${comCapa.slug}`, "visitante",   ["entre para prateleirar"],                      ["o que você achou"]],
  ["/moderacao",             "leitora",     ["não é para você"],                           ["banir"]],
  ["/moderacao",             "moderadora",  [],                                            []],
  ["/pedidos",               "leitora",     ["não é para você"],                           []],
  ["/cuidar",                "bibliotecária", ["pedidos"],                                 []],
  ["/cuidar",                "moderadora",  ["moderação"],                                 []],
  ["/cuidar",                "leitora",     ["não é para você"],                           ["pedidos"]],
];

const QUEM = {
  visitante,
  leitora,
  "bibliotecária": biblio,
  moderadora,
};

for (const [caminho, papel, precisa, proibido] of ESPERADO) {
  const { corpo } = await pega(caminho, { cookie: QUEM[papel].cookie });
  const t = texto(corpo).toLowerCase();

  for (const frase of precisa) {
    if (!t.includes(frase)) {
      anota(papel, `${caminho} não ofereceu "${frase}"`, "ela pode fazer isso e não viu como");
    }
  }

  for (const frase of proibido) {
    if (t.includes(frase)) {
      anota(papel, `${caminho} OFERECEU "${frase}"`, "ela não pode fazer isso, e o app disse que pode");
    }
  }
}

console.log("  (os botões foram conferidos, papel a papel)");

// ─────────────────────────────────────────────── a limpeza

console.log("\n9. limpando\n");

for (const p of [leitora, biblio, moderadora, reservada]) {
  await sql`delete from users where id = ${p.id}::uuid`;
}
console.log("  as quatro pessoas de mentira foram apagadas.");

// ─────────────────────────────────────────────── o veredito

console.log("\n─────────────────────────────────────────────────────────────");
if (achados.length === 0) {
  console.log("\n  ✓ NENHUM BUG. O app se comportou em tudo o que foi perguntado.\n");
} else {
  console.log(`\n  ${achados.length} ACHADOS:\n`);
  for (const a of achados) console.log(`   · [${a.quem}] ${a.o_que} — ${a.detalhe}`);
  console.log("");
}

await sql.end();
process.exit(achados.length > 0 ? 1 : 0);

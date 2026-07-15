#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  O CÓDIGO DE LOGIN CHEGA NA CAIXA DE ENTRADA?
 *
 *  ═══ POR QUE ISTO É A COISA MAIS IMPORTANTE DESTA RODADA ═══
 *
 *  O código por e-mail está no CAMINHO CRÍTICO DO LOGIN.
 *
 *      ANTES   e-mail no spam  →  a pessoa não verifica a conta, e usa o app assim mesmo
 *      AGORA   e-mail no spam  →  **NINGUÉM ENTRA**
 *
 *  E o pior: você não fica sabendo. Não há erro, não há log, não há 500. O e-mail sai do
 *  Resend com status 200, o Gmail o põe na pasta de spam, e a pessoa desiste em silêncio.
 *
 *  ═══ O QUE DECIDE ENTRE A CAIXA DE ENTRADA E O SPAM ═══
 *
 *  Três registros de DNS, e não a beleza do e-mail:
 *
 *      SPF    quem tem permissão de mandar e-mail em nome de gume.club
 *      DKIM   a assinatura que prova que o e-mail não foi forjado
 *      DMARC  o que fazer quando os dois falham
 *
 *  Desde fevereiro de 2024, o Gmail e o Outlook **exigem** os três. Sem eles, e-mail
 *  novo de domínio novo vai para o spam por padrão — e é exatamente o nosso caso.
 *
 *  ═══ E ELE MANDA UM E-MAIL DE VERDADE ═══
 *
 *  Configuração certa não é entrega garantida. Passe endereços de verdade e ele manda:
 *
 *      node --experimental-strip-types scripts/entregabilidade.mjs \
 *        seu@gmail.com seu@outlook.com seu@icloud.com
 *
 *  Aí você abre as três caixas e olha ONDE o e-mail caiu. **Isso um script não consegue
 *  fazer por você**, e fingir que consegue seria a pior mentira desta rodada.
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import { resolveTxt, resolveMx } from "node:dns/promises";

const env = readFileSync(".env", "utf8");
const doEnv = (k) => process.env[k] ?? env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim().replace(/^"|"$/g, "");

const DE = doEnv("EMAIL_FROM") ?? "Gume <ola@gume.club>";
const CHAVE = doEnv("RESEND_API_KEY");

const DOMINIO = (DE.match(/@([^\s>]+)/)?.[1] ?? "gume.club").toLowerCase();

const problemas = [];
const ok = (t) => console.log(`  ✓ ${t}`);
const nao = (t, conserto) => {
  problemas.push({ t, conserto });
  console.log(`  ✗ ${t}`);
};

async function txt(nome) {
  try {
    return (await resolveTxt(nome)).map((p) => p.join(""));
  } catch {
    return [];
  }
}

console.log(`\n  O e-mail sai de: ${DE}`);
console.log(`  O domínio é:     ${DOMINIO}\n`);

// ─────────────────────────────────────────────── 1. SPF

console.log("1. SPF — quem pode mandar e-mail em nome deste domínio\n");

/**
 * ═══ O SPF DO RESEND NÃO MORA NA RAIZ, E ESTE SCRIPT DEU ALARME FALSO POR ISSO ═══
 *
 * A primeira versão procurava `v=spf1` só em `gume.club`, não achava, e gritava "não
 * existe SPF" — com o SPF publicado e funcionando o tempo todo.
 *
 * O SPF valida o **Return-Path** (o remetente do envelope), e não o "De:" que a pessoa lê.
 * O Resend usa um subdomínio para o Return-Path — `send.gume.club` — e é LÁ que o SPF e o
 * MX dele têm que estar. É o desenho certo: o domínio principal não passa a autorizar a
 * Amazon a mandar e-mail em nome dele.
 *
 * Um alarme falso é pior que nenhum alarme: ele ensina quem lê a ignorar o script. Este
 * aqui gritou por três dias sobre um problema que não existia.
 */
const SUBDOMINIOS = [`send.${DOMINIO}`, DOMINIO];

let spf = null;
let ondeSpf = null;

for (const host of SUBDOMINIOS) {
  const achado = (await txt(host)).find((r) => r.toLowerCase().startsWith("v=spf1"));
  if (achado) {
    spf = achado;
    ondeSpf = host;
    break;
  }
}

if (!spf) {
  nao(
    "não existe SPF",
    `TXT  send.${DOMINIO}  →  "v=spf1 include:amazonses.com ~all"\n` +
      `        (o Resend manda pela Amazon SES, e o SPF dele mora no SUBDOMÍNIO do\n` +
      `         Return-Path, e não na raiz. O valor exato está no painel do Resend,\n` +
      `         em Domains → ${DOMINIO}. Não invente: copie de lá.)`,
  );
} else {
  ok(`SPF existe, em ${ondeSpf}: ${spf}`);
  if (!/-all|~all/.test(spf)) {
    nao(
      "o SPF não termina em `~all` nem `-all`",
      "Sem isso ele não diz o que fazer com quem NÃO está na lista, e vale pouco.",
    );
  }
}

// ─────────────────────────────────────────────── 2. DKIM

console.log("\n2. DKIM — a assinatura que prova que o e-mail não foi forjado\n");

/**
 * O Resend publica a chave num seletor. O nome dele sai do painel — normalmente
 * `resend._domainkey`, mas ele muda por conta, e por isso o script tenta os que existem
 * e NÃO CHUTA que está tudo bem quando não acha nenhum.
 */
const SELETORES = ["resend._domainkey", "send._domainkey", "default._domainkey"];

let dkim = null;
for (const s of SELETORES) {
  const r = await txt(`${s}.${DOMINIO}`);
  if (r.some((x) => /p=/.test(x))) {
    dkim = s;
    break;
  }
}

if (!dkim) {
  nao(
    "não existe DKIM",
    `TXT  <seletor>._domainkey.${DOMINIO}  →  a chave pública\n` +
      `        (o seletor e a chave estão no painel do Resend, em Domains → ${DOMINIO}.\n` +
      `         Sem DKIM, o Gmail trata o e-mail como não assinado.)`,
  );
} else {
  ok(`DKIM existe, no seletor ${dkim}`);
}

// ─────────────────────────────────────────────── 3. DMARC

console.log("\n3. DMARC — o que fazer quando SPF e DKIM falham\n");

const dmarc = (await txt(`_dmarc.${DOMINIO}`)).find((r) => r.toLowerCase().startsWith("v=dmarc1"));

if (!dmarc) {
  nao(
    "não existe DMARC",
    `TXT  _dmarc.${DOMINIO}  →  "v=DMARC1; p=none; rua=mailto:dmarc@${DOMINIO}"\n` +
      `        Comece com p=none: ele NÃO rejeita nada, e só manda relatório. Depois de\n` +
      `        uma semana lendo os relatórios, suba para p=quarantine.\n` +
      `        Sem DMARC, o Gmail e o Outlook tratam o domínio como não confiável.`,
  );
} else {
  ok(`DMARC existe: ${dmarc}`);
  if (/p=none/.test(dmarc)) {
    console.log(
      "     (está em p=none: ele só observa. É o começo certo. Suba para p=quarantine\n" +
        "      depois de uma semana lendo os relatórios.)",
    );
  }
}

// ─────────────────────────────────────────────── 4. MX

console.log("\n4. MX — quem recebe as devoluções?\n");

/**
 * O MX que o Resend exige também mora no subdomínio do Return-Path: é para lá que voltam
 * as devoluções (bounces) e as reclamações de spam. Sem ele, o Resend não fica sabendo
 * que um e-mail não chegou, e continua mandando para uma caixa morta — o que estraga a
 * reputação do domínio inteiro.
 *
 * Um MX na RAIZ é outra coisa: é o domínio receber e-mail de gente. É desejável (quem
 * responde ao código de login fala com alguém), e não é isto que o Resend pede.
 */
let mxOk = false;

for (const host of SUBDOMINIOS) {
  try {
    const mx = await resolveMx(host);
    if (mx.length > 0) {
      ok(`as devoluções voltam para ${host} (${mx[0].exchange})`);
      mxOk = true;
      break;
    }
  } catch {
    // tenta o próximo
  }
}

if (!mxOk) {
  nao(
    `${DOMINIO} não tem MX (nem na raiz, nem em send.${DOMINIO})`,
    "Sem MX, as devoluções somem: o Resend não fica sabendo que o e-mail não chegou,\n" +
      "        continua mandando para caixa morta, e a reputação do domínio afunda junto.",
  );
}

/**
 * E a raiz? Um domínio que MANDA e não RECEBE parece uma fazenda de spam para os filtros,
 * e quem responder ao e-mail de login fala com o vazio. Não é fatal, e é um aviso.
 */
try {
  const raizMx = await resolveMx(DOMINIO);
  if (raizMx.length === 0) throw new Error("vazio");
} catch {
  console.log(
    `     (aviso: ${DOMINIO} não RECEBE e-mail. Quem responder ao código de login fala\n` +
      "      com o vazio. Não impede a entrega, e é um sinal ruim para os filtros.)",
  );
}

// ─────────────────────────────────────────────── 5. a chave

console.log("\n5. A chave do Resend\n");

if (!CHAVE) {
  nao(
    "RESEND_API_KEY não está no ambiente",
    "Sem ela, em produção o app LEVANTA na hora de mandar o e-mail — e com o código no\n" +
      "        caminho crítico do login, isso quer dizer que ninguém entra.",
  );
} else {
  ok("a chave está no ambiente");
}

// ─────────────────────────────────────────────── 6. o e-mail de verdade

const destinos = process.argv.slice(2).filter((a) => a.includes("@"));

if (destinos.length > 0 && CHAVE) {
  console.log("\n6. Mandando um e-mail de verdade\n");

  for (const para of destinos) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${CHAVE}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: DE,
        to: para,
        subject: "123456 é o seu código de entrada no Gume",
        text:
          "Oi.\n\n" +
          "Este é um teste de entrega. O seu código para entrar no Gume seria:\n\n" +
          "    123456\n\n" +
          "Se este e-mail caiu no spam, ninguém consegue entrar no app.\n",
      }),
    });

    const corpo = await res.json().catch(() => ({}));

    if (res.ok) console.log(`  ✓ ${para} — o Resend aceitou (id ${corpo.id ?? "?"})`);
    else nao(`${para} — o Resend recusou (${res.status}): ${corpo.message ?? ""}`, "");
  }

  console.log(
    "\n  ⚠️  O RESEND ACEITAR NÃO QUER DIZER QUE CHEGOU NA CAIXA DE ENTRADA.\n" +
      "\n  Abra as caixas agora e veja ONDE o e-mail caiu. Se ele estiver no spam, o\n" +
      "  problema não é o app: é o DNS, e está acima.\n" +
      "\n  Um script não consegue olhar na sua caixa de entrada, e fingir que consegue\n" +
      "  seria a pior mentira possível.",
  );
} else if (destinos.length > 0 && !CHAVE) {
  console.log("\n6. Não dá para mandar e-mail de verdade sem a RESEND_API_KEY.\n");
}

// ─────────────────────────────────────────────── o veredito

console.log("\n─────────────────────────────────────────────────────────────\n");

if (problemas.length === 0) {
  console.log("  ✓ A configuração está de pé.\n");
  console.log("  Ainda assim: mande um e-mail para um Gmail, um Outlook e um iCloud DE");
  console.log("  VERDADE, e olhe em qual pasta ele caiu.\n");
  process.exit(0);
}

console.log(`  ${problemas.length} PROBLEMA(S). Com o código de login no caminho crítico,`);
console.log("  cada um destes quer dizer que alguém não vai conseguir entrar.\n");

for (const p of problemas) {
  console.log(`  ✗ ${p.t}`);
  if (p.conserto) console.log(`        ${p.conserto}\n`);
}

console.log(
  "  E o pior deles é o silêncio: o e-mail sai com status 200, o Gmail o põe no spam,\n" +
    "  e a pessoa desiste sem reclamar. Nada aparece em log nenhum.\n",
);

process.exit(1);

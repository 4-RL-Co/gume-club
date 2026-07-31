#!/usr/bin/env node
/**
 * Structure over vigilance. See SECURITY.md.
 *
 * Nobody can review 10k lines of agent-written code a day, so we don't try.
 * Instead: a small number of mechanical checks that catch the failure modes
 * that actually leak databases. This runs in CI and must pass before deploy.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname, relative } from "node:path";

const ROOT = process.cwd();
const SKIP = new Set(["node_modules", ".next", ".git", "lib/db/migrations", "seed"]);
const failures = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = full.slice(ROOT.length + 1);
    if (SKIP.has(name) || SKIP.has(rel)) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if ([".ts", ".tsx", ".js", ".mjs"].includes(extname(name))) out.push(full);
  }
  return out;
}

const files = walk(ROOT);

for (const file of files) {
  const rel = file.slice(ROOT.length + 1);
  const src = readFileSync(file, "utf8");
  const isClient = /^\s*["']use client["']/m.test(src);

  // 1. secrets must never reach the client
  if (isClient) {
    if (/process\.env\.(?!NEXT_PUBLIC_)[A-Z_]+/.test(src))
      failures.push(`${rel}: reads a server env var inside a client component`);
    if (/from\s+["']@\/lib\/db/.test(src))
      failures.push(`${rel}: imports the database from a client component`);
  }

  // 2. a hardcoded secret is a secret. inclui as chaves do Stripe (apoio): elas moram
  //    no env, e uma chave de pagamento colada num arquivo rastreado é pública para
  //    sempre no dia em que o repo é público. Ver .env.example.
  //
  //    ═══ O PADRÃO DO STRIPE NÃO ERA PEGO POR ACIDENTE ═══
  //    A regra tinha `sk-`, com HÍFEN, que é o formato da OpenAI. O Stripe usa
  //    `sk_live_` e `sk_test_`, com UNDERLINE, e passava batido: a varredura parecia
  //    proteger a chave de pagamento e não protegia nenhuma. `whsec_` é o segredo do
  //    webhook, e vazá-lo é deixar qualquer um forjar "fulano pagou".
  if (/(sk-[a-zA-Z0-9]{20,}|(?:sk|rk)_(?:live|test)_[a-zA-Z0-9]{16,}|whsec_[a-zA-Z0-9]{16,}|ghp_[a-zA-Z0-9]{20,}|postgres:\/\/[^"'\s]*:[^"'@\s]+@)/.test(src))
    failures.push(`${rel}: looks like a hardcoded credential`);

  // 3. never build SQL by concatenation. drizzle's sql`` template is fine.
  if (/sql\.raw\(|execute\(\s*[`"'].*\$\{/.test(src))
    failures.push(`${rel}: builds SQL from an interpolated string. use parameters.`);

  // 4. authorization lives in exactly one place
  if (rel !== "lib/authz.ts" && rel !== "lib/authz.test.ts") {
    if (/if\s*\(\s*\w+\.userId\s*!==|if\s*\(\s*\w+\.user_id\s*!==/.test(src))
      failures.push(`${rel}: an inline ownership check. move it into lib/authz.ts.`);
  }
}

/**
 * 5. TODA ESCRITA EM `authors` PASSA PELO PORTÃO (lib/autores.ts).
 *
 * O acervo tem 1.462 obras assinadas por "Brazil", 1.652 por "Portugal", e 554 por
 * "[author not identified]". Isso não é lixo nosso: é lixo que a Open Library guarda no
 * campo de autor, e que o import escreveu sem perguntar.
 *
 * Uma etiqueta é PIOR que um nulo. O nulo a gente conta, vê e conserta. A etiqueta
 * passa por PESSOA em toda contagem, em toda busca e em toda poda — e chega na tela:
 * existe uma página /autor/portugal no ar, e "Brazil" conta como um autor que você leu
 * na página de estatísticas.
 *
 * E o lixo não vem de uma porta só. Vem do dump, do Google Books, do cadastro a mão, e
 * amanhã da AniList. Uma regra que mora numa das portas é uma regra que as outras não
 * conhecem — por isso ela mora num módulo, e por isso este audit existe.
 *
 * Mesma disciplina do lib/authz.ts: um lugar, escrito a mão, e o build cai se alguém
 * escrever por fora.
 */
const ESCREVE_AUTOR = /insert\s+into\s+authors\b|\.insert\(\s*authors\s*\)/i;

for (const file of files) {
  const rel = relative(ROOT, file);

  // O próprio portão, e os scripts do dump que já o importam, estão liberados.
  if (rel === "lib/autores.ts" || rel.endsWith(".test.ts") || rel.endsWith(".sql")) continue;

  const src = readFileSync(file, "utf8");
  if (!ESCREVE_AUTOR.test(src)) continue;

  if (!/from ["'](@\/lib\/autores|\.\.?\/lib\/autores\.ts|\.\/autores\.ts)["']/.test(src)) {
    failures.push(
      `${rel}: escreve em \`authors\` sem passar pelo portão. ` +
        "Use limparNomeDeAutor() de lib/autores.ts — senão 'Portugal.' vira um autor.",
    );
  }
}

// 6. os módulos que decidem quem vê o quê, e quem É gente, precisam existir e ter teste
if (!existsSync(join(ROOT, "lib/authz.ts"))) failures.push("lib/authz.ts is missing");
if (!existsSync(join(ROOT, "lib/authz.test.ts"))) failures.push("lib/authz.test.ts is missing");
if (!existsSync(join(ROOT, "lib/autores.ts"))) failures.push("lib/autores.ts is missing");
if (!existsSync(join(ROOT, "lib/autores.test.ts"))) failures.push("lib/autores.test.ts is missing");

if (failures.length) {
  console.error("\n✗ security audit failed\n");
  for (const f of failures) console.error("  - " + f);
  console.error("\nSee SECURITY.md.\n");
  process.exit(1);
}

console.log("✓ security audit passed (" + files.length + " files)");

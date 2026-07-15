import { defineConfig } from "vitest/config";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * The authz SQL test asks a real Postgres, so the run needs DATABASE_URL.
 * Locally that comes from .env; in CI it is already in the environment and wins.
 * Not worth a dotenv dependency for six lines of parsing.
 */
function dotenv(): Record<string, string> {
  if (!existsSync(".env")) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) out[m[1]!] = m[2]!.trim();
  }
  return out;
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    env: dotenv(),
    // The SQL tests share one database and clean up after themselves, so they
    // must not race each other across worker processes.
    fileParallelism: false,
    /**
     * Avisa (e não quebra) quando o `pnpm dev` está de pé, porque ele disputa o
     * mesmo Postgres e produz VERMELHO FALSO nos testes de SQL. Um teste que falha
     * por um motivo que não é o dele treina a pessoa a ignorar o vermelho, e o
     * vermelho é a sentinela deste repo. Ver lib/test-setup.ts.
     */
    globalSetup: ["./lib/test-setup.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});

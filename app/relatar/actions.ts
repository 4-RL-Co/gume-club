"use server";

import { headers } from "next/headers";
import { relatarProblema } from "@/lib/relatar";

/**
 * O mesmo IP que lib/rate-limit.ts (`quem()`) extrai pra uma API route — só
 * que uma ação de servidor não recebe um `Request`, recebe `next/headers`.
 * A lógica é a mesma de propósito: uma segunda cópia que divergisse do
 * `IP_HEADER` documentado em .env.example seria a régua errada aplicada
 * calada num dos dois lugares.
 */
async function meuIp(): Promise<string> {
  const h = await headers();
  const primeiroDaLista = () => h.get("x-forwarded-for")?.split(",")[0]?.trim() || "";

  if (process.env.IP_HEADER?.trim().toLowerCase() === "x-forwarded-for") {
    return primeiroDaLista() || "sem-ip";
  }

  const real = h.get("x-real-ip")?.trim();
  if (real) return real;

  return primeiroDaLista() || "sem-ip";
}

export async function relatarProblemaAction(
  mensagem: string,
  pagina: string,
): Promise<{ erro: string | null }> {
  const ip = await meuIp();
  try {
    return await relatarProblema(mensagem, pagina, ip);
  } catch {
    return { erro: "não deu pra enviar agora" };
  }
}

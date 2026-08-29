import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { RATES, limitar, quem, varrer } from "@/lib/rate-limit";
import {
  registrarEventoFunil, normalizarOrigem, ehTipoDeEvento, ehModoInicial,
  SESSAO_ANON_COOKIE, SESSAO_ANON_MAX_AGE,
} from "@/lib/funil";

/**
 * O escritor do funil de entrada. Ver lib/funil.ts e a migration 0069.
 *
 * Node, e não Edge: o limitador fala com o Postgres, e o Postgres não fala
 * com o Edge. Ver app/api/buscar/route.ts para o mesmo motivo.
 */
export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const veredito = await limitar(`eventos:${quem(req)}`, RATES.eventosFunil);
  void varrer();

  if (!veredito.ok) {
    return NextResponse.json(
      { ok: false },
      { status: 429, headers: { "retry-after": String(veredito.retryAfter) } },
    );
  }

  // O corpo não é confiável: quem chama pode não ser o nosso próprio site.
  // Um `tipo` fora da lista fechada, ou um `origem`/`modoInicial` mal
  // formado, nunca chegam ao banco — a inserção grava um `null` no lugar,
  // ela nunca inventa dado nem lança por causa de um corpo estranho.
  let corpo: unknown = null;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const tipo = (corpo as Record<string, unknown> | null)?.tipo;
  if (!ehTipoDeEvento(tipo)) return NextResponse.json({ ok: false }, { status: 400 });

  const origemBruta = (corpo as Record<string, unknown>).origem;
  const modoBruto = (corpo as Record<string, unknown>).modoInicial;

  const sessaoAnon = lerOuCriarSessaoAnon(req);

  await registrarEventoFunil({
    tipo,
    origem: normalizarOrigem(origemBruta),
    // modo_inicial só faz sentido em "viu_entrar" — em qualquer outro tipo,
    // um valor mandado por engano é ignorado, e não gravado por acidente.
    modoInicial: tipo === "viu_entrar" && ehModoInicial(modoBruto) ? modoBruto : null,
    sessaoAnon: sessaoAnon.valor,
  });

  const res = NextResponse.json({ ok: true });
  // Sempre reescreve: cada evento renova os 30 minutos, como uma sessão de
  // verdade — uma pessoa navegando sem parar não perde a própria origem no
  // meio do caminho.
  res.cookies.set(SESSAO_ANON_COOKIE, sessaoAnon.valor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSAO_ANON_MAX_AGE,
    path: "/",
  });
  return res;
}

/**
 * O cookie de sessão anônima. Mesmo formato do `gume_convite`
 * (app/entrar/invite.ts), minerado aqui dentro e não no middleware: é aqui
 * que já se fala com o Postgres, e é bom que a mineração e o registro
 * fiquem no mesmo arquivo, para quem audita não precisar caçar em dois.
 */
function lerOuCriarSessaoAnon(req: Request): { valor: string; novo: boolean } {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const existente = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSAO_ANON_COOKIE}=`))
    ?.slice(SESSAO_ANON_COOKIE.length + 1);

  // Um valor que não é um UUID de verdade (cookie adulterado, ou de uma
  // versão antiga) não vira a chave de uma sessão: uma sessão nova é mais
  // barata do que confiar em texto de fora sem checar a forma.
  const valido = existente && /^[0-9a-f-]{36}$/i.test(existente);
  return { valor: valido ? existente : randomUUID(), novo: !valido };
}

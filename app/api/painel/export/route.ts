import { NextResponse } from "next/server";
import { getViewer } from "@/lib/viewer";
import { souIdealizador, tokenDePainelValido } from "@/lib/authz";
import { coletarPainel, filtroDaUrl, painelEmMarkdown } from "@/lib/painel";
import { FUSO } from "@/lib/datas";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PAINEL, PARA UM AGENTE LER. Markdown ou JSON.
 *
 *  Duas portas, e as duas passam por lib/authz.ts:
 *   1. A SESSÃO do idealizador (o dono, no navegador dele). É o mesmo
 *      souIdealizador da página.
 *   2. Um TOKEN no cabeçalho Authorization, para o Claude do dono ler sem
 *      cookie. Só existe se PAINEL_TOKEN estiver no ambiente. Ver o token
 *      em lib/authz.ts.
 *
 *  Quem não passa por nenhuma das duas leva 404, e não 403: a rota não
 *  confessa que existe, igual à página.
 *
 *  O markdown NÃO leva e-mail: ele é um arquivo, e arquivo viaja. Ver
 *  painelEmMarkdown em lib/painel.ts.
 * ════════════════════════════════════════════════════════════════════
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenDoCabecalho(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1]!.trim() : null;
}

export async function GET(req: Request) {
  // getViewer() é chamado sempre: é ele que resolve o dono no caminho da sessão, e é o que
  // lib/surface.test.ts exige de toda rota. No caminho do token, ele devolve null, e quem
  // autoriza é o token.
  const viewer = await getViewer();
  const porSessao = await souIdealizador(viewer);
  const porToken = tokenDePainelValido(tokenDoCabecalho(req));

  if (!porSessao && !porToken) {
    // 404, e não 403: a rota não existe para quem não pode.
    return new NextResponse("não encontrado", { status: 404 });
  }

  const url = new URL(req.url);
  const filtro = filtroDaUrl(Object.fromEntries(url.searchParams));
  const dados = await coletarPainel(filtro);

  // O E-MAIL NÃO SAI NUM ARQUIVO, em NENHUM formato. Ele existe só na tela, que só o dono
  // abre. O que sai (markdown ou json) leva o log SEM e-mail: handle, dia, método e
  // procedência, que é o que um agente precisa e nada do que dói se vazar.
  const semEmail = {
    ...dados,
    gente: {
      ...dados.gente,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      log: dados.gente.log.map(({ email: _descartado, ...resto }) => resto),
    },
  };

  const formato = url.searchParams.get("formato") ?? "md";

  if (formato === "json") {
    return NextResponse.json(semEmail);
  }

  const geradoEm = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: FUSO,
  }).format(new Date());

  const md = painelEmMarkdown(dados, geradoEm);

  return new NextResponse(md, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      // Um nome de arquivo estável, para quando o dono clica em baixar.
      "content-disposition": `inline; filename="gume-painel.md"`,
    },
  });
}

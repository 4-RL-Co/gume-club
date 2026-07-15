import { NextResponse, type NextRequest } from "next/server";
import { imgSrc } from "@/lib/imagens";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A porta. Toda requisição passa aqui, e ela faz UMA coisa:
 *  CABEÇALHOS DE SEGURANÇA, em toda resposta.
 *
 *  ═══ O RATE LIMIT MORAVA AQUI, E ELE SAIU. É O CONSERTO, E NÃO UMA PERDA ═══
 *
 *  Ele era chamado daqui, e era uma coisa linda:
 *
 *      "Uma ação de servidor do Next é um POST para a própria página, então limitar
 *       POST cobre todas elas de uma vez, inclusive as que ainda não foram escritas.
 *       Uma ação nova nasce protegida sem ninguém lembrar."
 *
 *  Só que o balde vivia na MEMÓRIA DO PROCESSO, e o deploy vai ser em serverless. Lá não
 *  existe "o processo": existe um processo novo, ou um de uma dúzia mornos, a cada
 *  requisição. Mil tentativas de senha se espalham por cinquenta instâncias, cada uma
 *  conta vinte, nenhuma passa do teto de dez, e **as mil passam**.
 *
 *  O limite não afrouxava. Ele deixava de existir, e continuava parecendo que existia —
 *  que é a pior das duas coisas, porque ninguém vai conferir o que já está escrito.
 *
 *  E não dava para só trocar o Map pelo Postgres AQUI: na Vercel, o middleware roda no
 *  runtime **Edge**, que não abre conexão com banco. O limite não podia ficar.
 *
 *  ═══ PARA ONDE ELE FOI ═══
 *
 *      /api/auth/*   → app/api/auth/[...all]/route.ts   (Node, e conta no Postgres)
 *      /api/buscar   → app/api/buscar/route.ts          (Node, e conta no Postgres)
 *      toda escrita  → lib/actor.ts, dentro de getActor()
 *
 *  E a propriedade que valia ouro está de pé: `getActor()` é o portão por onde toda
 *  mutação já passava ("who is writing", diz o arquivo desde sempre), então **uma ação
 *  nova continua nascendo contada sem ninguém lembrar** — e `lib/acoes.test.ts` quebra o
 *  build se alguma escapar. Ver lib/rate-limit.ts e lib/escrita.ts.
 * ════════════════════════════════════════════════════════════════════
 */

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();

  /**
   * Os cabeçalhos.
   *
   * A CSP é a peça que importa: sem ela, um XSS em qualquer campo de texto vira
   * roubo de sessão. `unsafe-inline` no script é o preço do Next (ele injeta o
   * bootstrap inline), e ele está anotado no SECURITY-AUDIT.md como a próxima
   * coisa a apertar, com nonce.
   *
   * ═══ `img-src` VEM DE `lib/imagens.ts`, E NÃO DAQUI ═══
   *
   * A lista de origens de imagem viva em DOIS lugares — aqui, e no formulário que
   * valida o endereço colado — é uma lista que diverge. Alguém acrescenta uma origem
   * de um lado, esquece do outro, e o formulário passa a recusar uma imagem que
   * funcionaria (ou, pior, a aceitar uma que o navegador vai bloquear em silêncio).
   *
   * É uma lista só, e ela mora em `lib/imagens.ts`, junto do motivo de cada origem
   * estar nela.
   *
   * `connect-src 'self'` porque o app não fala com ninguém de fora do navegador: quem
   * busca no Open Library é o servidor, e não o cliente.
   */
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    /**
     * A CSP vale para a CADEIA do redirect, e não só para o primeiro host.
     * covers.openlibrary.org responde 302 para archive.org, então liberar apenas
     * o primeiro fazia a capa chegar até a porta e morrer nela: a parede da home
     * aparecia com metade dos livros quebrados. Sintoma de CSP quase sempre é
     * isto, e nunca o host que você digitou.
     */
    imgSrc(),
    "font-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

  res.headers.set("content-security-policy", csp);
  res.headers.set("x-content-type-options", "nosniff");
  res.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  res.headers.set("x-frame-options", "DENY");
  res.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");

  // HSTS só quando existir HTTPS de verdade. Ligado em desenvolvimento, ele
  // prenderia o localhost de todo mundo em https por um ano.
  if (process.env.NODE_ENV === "production") {
    res.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  }

  return res;
}

export const config = {
  // Tudo, menos o que o Next serve de estático. As capas e os avatares enviados
  // passam por aqui de propósito: eles também levam os cabeçalhos.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

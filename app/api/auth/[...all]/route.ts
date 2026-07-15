import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { RATES, limitar, quem, varrer } from "@/lib/rate-limit";

/**
 * ════════════════════════════════════════════════════════════════════
 *  TODA ROTA DE ENTRADA PASSA POR AQUI. E AGORA ELA É CONTADA.
 *
 *  O Better Auth é dono de toda rota de autenticação. A gente não escreve nenhuma. O que
 *  a gente faz é contar quem bate, ANTES de deixar a biblioteca responder.
 *
 *  ═══ POR QUE A CONTAGEM MUDOU DE LUGAR ═══
 *
 *  Ela morava no `middleware.ts`, num `Map` na memória do processo. Isso funcionava num
 *  servidor só. Em serverless, cada requisição pode cair num processo diferente, e um
 *  balde por processo é um balde que não conta nada: mil tentativas espalhadas por
 *  cinquenta instâncias viram cinquenta baldes de vinte, nenhum passa do teto de dez, e
 *  **as mil tentativas passam**.
 *
 *  E não dava para só trocar o Map pelo banco lá: na Vercel o middleware roda no runtime
 *  Edge, que não fala com o Postgres. Então o limite veio para cá, que roda em Node, é
 *  dono do risco, e é o único caminho por onde uma senha pode ser adivinhada.
 *
 *  Ver lib/rate-limit.ts.
 *
 *  ═══ E O CADASTRO É CONTADO À PARTE ═══
 *
 *  Entrar errado dez vezes é gente que esqueceu a senha. Criar dez contas em cinco
 *  minutos do mesmo IP não é ninguém: é um script montando uma fazenda de spam, e é o que
 *  SEMPRE acontece quando o cadastro abre.
 * ════════════════════════════════════════════════════════════════════
 */

const { GET: betterGet, POST: betterPost } = toNextJsHandler(auth);

/**
 * O runtime é Node, e é DE PROPÓSITO: o limitador fala com o Postgres, e o Edge não fala
 * com o Postgres. Deixar isto virar Edge um dia é apagar o limite de força bruta inteiro,
 * em silêncio.
 */
export const runtime = "nodejs";

async function contar(req: Request): Promise<Response | null> {
  /**
   * Só o que MUTA a autenticação. Um GET de sessão acontece em toda navegação de toda
   * pessoa logada, e contá-lo faria o app expulsar quem só está usando o app.
   */
  if (req.method !== "POST") return null;

  const { pathname } = new URL(req.url);

  const criandoConta = pathname.includes("/sign-up");
  const regra = criandoConta ? RATES.signup : RATES.auth;
  const chave = `${criandoConta ? "signup" : "auth"}:${quem(req)}`;

  const veredito = await limitar(chave, regra);
  void varrer();

  if (veredito.ok) return null;

  return Response.json(
    {
      // A mensagem é para gente, e não para o console de ninguém.
      message: criandoConta
        ? "Muitas contas criadas deste lugar em pouco tempo. Tente daqui a pouco."
        : "Muitas tentativas. Espere alguns minutos e tente de novo.",
    },
    { status: 429, headers: { "retry-after": String(veredito.retryAfter) } },
  );
}

export async function POST(req: Request): Promise<Response> {
  const barrado = await contar(req);
  if (barrado) return barrado;

  return betterPost(req);
}

export const GET = betterGet;

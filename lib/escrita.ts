import { Forbidden } from "@/lib/authz";
import { RATES, limitar, varrer } from "@/lib/rate-limit";

/**
 * ════════════════════════════════════════════════════════════════════
 *  TODA ESCRITA É CONTADA, E A CONTAGEM É POR PESSOA.
 *
 *  ═══ O QUE SE PERDEU, E POR QUÊ ═══
 *
 *  O limite de escrita morava no `middleware.ts`, e era uma coisa linda:
 *
 *      "Uma ação de servidor do Next é um POST para a própria página, então limitar
 *       POST cobre todas elas de uma vez, inclusive as que ainda não foram escritas.
 *       Uma ação nova nasce protegida sem ninguém lembrar."
 *
 *  Isso morreu no deploy em serverless, por dois motivos ao mesmo tempo: o middleware
 *  roda no Edge (que não fala com o Postgres), e um balde na memória de um processo
 *  efêmero não conta nada. Ver lib/rate-limit.ts.
 *
 *  ═══ E COMO ELE FOI RECUPERADO ═══
 *
 *  Não dá para interceptar toda ação de servidor de fora. Então o limite desceu para
 *  DENTRO do portão por onde toda mutação já passa: `getActor()`, que é literalmente
 *  "quem está escrevendo".
 *
 *  A propriedade continua de pé: uma ação nova que chame `getActor()` nasce contada, sem
 *  ninguém lembrar. E as poucas que não chamam (as que precisam do `Viewer` inteiro, com
 *  papel e permissão) chamam esta função na mão — e `lib/acoes.test.ts` quebra o build se
 *  alguma esquecer.
 *
 *  ═══ POR PESSOA, E NÃO POR IP ═══
 *
 *  Quem escreve tem conta. Contar por IP colocaria uma família inteira, ou um escritório
 *  atrás de um NAT, no mesmo balde — e o vizinho de mesa pagaria pelo spam do outro.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Cento e vinte escritas por minuto é generoso para gente (ninguém prateleira dois livros
 * por segundo por uma hora) e é apertado para um script.
 *
 * Estourar não é um erro do app: é o app funcionando. Por isso a mensagem fala com gente.
 */
export async function limitarEscrita(actorId: string): Promise<void> {
  const veredito = await limitar(`escrita:${actorId}`, RATES.write);
  void varrer();

  if (!veredito.ok) {
    throw new Forbidden(
      "Você fez muita coisa em pouco tempo. Espere um minuto e continue.",
    );
  }
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  MANDAR UM E-MAIL. O mínimo, e nada além.
 *
 *  O app não sabia mandar e-mail, e isso quebrava duas coisas de uma vez:
 *
 *  1. NINGUÉM VERIFICAVA O E-MAIL, e a verificação é o que separa uma
 *     conta de uma FAZENDA DE SPAM. Sem ela, o portão anti-spam viraria um
 *     portão fechado para todo mundo: ninguém verificaria nunca, e nenhum
 *     perfil seria público jamais.
 *
 *  2. A DENÚNCIA não teria para onde ir.
 *
 *  ═══ SEM DEPENDÊNCIA NOVA ═══
 *
 *  Uma chamada HTTP para a API do Resend, com `fetch`. Um cliente de SMTP
 *  seria uma dependência a mais num repo que tem oito, para fazer um POST.
 *
 *  ═══ SEM CHAVE, ELE NÃO FINGE QUE MANDOU ═══
 *
 *  Em desenvolvimento, ele ESCREVE o e-mail no terminal, e devolve `true`:
 *  dá para testar o fluxo inteiro sem conta em serviço nenhum, e o link de
 *  verificação aparece ali para você clicar.
 *
 *  Em produção, sem chave, ele LEVANTA. Não devolve `false` em silêncio, e
 *  não engole: um app em produção que acha que mandou um e-mail e não
 *  mandou é um app onde ninguém consegue entrar e ninguém sabe por quê.
 *  Melhor quebrar alto no primeiro minuto.
 * ════════════════════════════════════════════════════════════════════
 */

const CHAVE = () => process.env.RESEND_API_KEY;
const DE = () => process.env.EMAIL_FROM ?? "Gume <ola@gume.club>";

/** Para onde vão as denúncias. UMA pessoa modera, e a caixa dela é o painel. */
export const CAIXA_DA_MODERACAO = () => process.env.EMAIL_MODERACAO ?? process.env.EMAIL_FROM;

export async function enviar({
  para,
  assunto,
  texto,
}: {
  para: string;
  assunto: string;
  /** TEXTO PURO, sempre. Nada de HTML: um e-mail com HTML é um e-mail com injeção. */
  texto: string;
}): Promise<boolean> {
  const chave = CHAVE();

  if (!chave) {
    if (process.env.NODE_ENV === "production") {
      // Alto, e no primeiro minuto. Ver o cabeçalho.
      throw new Error(
        "RESEND_API_KEY não está no ambiente. Sem ela ninguém verifica o e-mail, " +
          "nenhum perfil vira público, e nenhuma denúncia chega em ninguém.",
      );
    }

    // Em desenvolvimento o terminal É a caixa de entrada. O link de verificação sai
    // aqui, e dá para clicar nele.
    console.log(
      `\n\x1b[36m── e-mail (não enviado: sem RESEND_API_KEY) ──\x1b[0m\n` +
        `para: ${para}\nassunto: ${assunto}\n\n${texto}\n` +
        `\x1b[36m──────────────────────────────────────────────\x1b[0m\n`,
    );
    return true;
  }

  /**
   * ═══ 429 E 5xx SÃO "TENTE DE NOVO", E NÃO "NÃO DEU" ═══
   *
   * Este cliente não produz dado, então ele não pode traduzir falha em ausência de dado
   * — o bug do AGENTS.md. Mas ele tem a mesma FORMA do erro, com outra consequência:
   *
   * Um 429 do Resend quer dizer "espere um pouco", e não "este e-mail é inentregável".
   * Devolver `false` na primeira recusa faz o app dizer à pessoa que o e-mail de
   * verificação não pôde ser enviado — quando bastava esperar dois segundos.
   *
   * E sem e-mail verificado o perfil não vira público, não aparece na busca, e o portão
   * anti-spam vira um portão fechado para todo mundo.
   */
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${chave}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: DE(), to: para, subject: assunto, text: texto }),
        signal: AbortSignal.timeout(8000),
      });

      // Recusa transitória: espera e insiste. 4xx que não seja 429 é uma resposta
      // definitiva ("esse endereço não existe"), e insistir nela é teimosia.
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 800 * 2 ** i));
        continue;
      }

      return res.ok;
    } catch {
      // Rede caída. Vale a mesma insistência.
      await new Promise((r) => setTimeout(r, 800 * 2 ** i));
    }
  }

  try {
    // Uma última, depois de ter esperado. Se ela também falhar, aí sim é `false`.
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: DE(), to: para, subject: assunto, text: texto }),
      signal: AbortSignal.timeout(8000),
    });

    return res.ok;
  } catch {
    // Um serviço de e-mail fora do ar não pode derrubar um cadastro. A pessoa entra,
    // e pede o e-mail de novo depois.
    return false;
  }
}

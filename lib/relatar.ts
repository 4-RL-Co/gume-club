import { enviar, CAIXA_DA_MODERACAO } from "@/lib/email";
import { limitar, RATES } from "@/lib/rate-limit";
import { clamp, LIMITS } from "@/lib/limits";

/**
 * ════════════════════════════════════════════════════════════════════
 *  RELATAR UM PROBLEMA. Um botão em toda tela, sem precisar de conta.
 *
 *  "Denunciar" (components/report.tsx) já existia, mas é sobre uma PESSOA —
 *  faz sentido exigir estar logado pra apontar alguém. Um bug no app é
 *  outra coisa: quem topa com um erro pode nem ter conta ainda (é
 *  frequentemente QUEM MAIS precisa de um jeito de avisar), então este
 *  caminho fica aberto e é limitado por IP, não por usuário.
 *
 *  Vai pra mesma caixa da moderação (CAIXA_DA_MODERACAO) — uma pessoa cuida
 *  do Gume, e a caixa dela já é o painel, de propósito. Ver lib/email.ts.
 * ════════════════════════════════════════════════════════════════════
 */
export async function relatarProblema(
  mensagem: string,
  pagina: string,
  ip: string,
): Promise<{ erro: string | null }> {
  const veredito = await limitar(`relatar:${ip}`, RATES.relatarProblema);
  if (!veredito.ok) return { erro: "Muitos relatos em pouco tempo. Tenta de novo daqui a pouco." };

  const texto = clamp(mensagem, LIMITS.note);
  if (!texto) return { erro: "conta o que aconteceu" };

  const caixa = CAIXA_DA_MODERACAO();
  if (!caixa) return { erro: "não deu pra enviar agora" };

  const enviou = await enviar({
    para: caixa,
    assunto: "Relato de problema no Gume",
    texto: `${texto}\n\n---\nPágina: ${clamp(pagina, LIMITS.url) ?? "?"}\n`,
  });

  return { erro: enviou ? null : "não deu pra enviar agora" };
}

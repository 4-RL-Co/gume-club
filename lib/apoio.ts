import { sql, type SQL } from "drizzle-orm";

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM APOIA O GUME. Uma regra, um arquivo, e nenhuma cópia.
 *
 *  A insígnia de apoiador existe desde cedo, e ela é a única que não se conquista: ela
 *  se paga. Este arquivo é o que decide, e a decisão aparece em três lugares (a
 *  insígnia, a moldura do perfil e a lista de apoiadores). Os três chamam a MESMA
 *  função, e é de propósito: uma regra de produto escrita três vezes é uma regra que vai
 *  divergir, e o dia em que divergir a mesma pessoa aparece com insígnia numa tela e sem
 *  insígnia na outra.
 *
 *  ═══ APOIO NÃO DESTRAVA NADA ═══
 *
 *  Nenhuma função do Gume depende de apoiar. Nem privacidade, nem alcance, nem limite
 *  maior, nem tela extra. A insígnia e a moldura são cosméticas, e é tudo que elas
 *  sempre vão ser. Se um dia uma checagem de permissão chamar este arquivo, ela está
 *  errada: quem decide o que alguém pode fazer é lib/authz.ts, e ele não sabe que
 *  dinheiro existe.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Os três planos. Mesmo preço da insígnia para todos: ela é a mesma.
 *
 * O `price` vem do ambiente porque ele é da INSTÂNCIA, e não do código: quem
 * auto-hospeda o Gume não tem os preços do gume.club, e não deveria ter.
 */
export const TIERS = ["marcador", "lombada", "capadura"] as const;
export type Tier = (typeof TIERS)[number];

export function ehTier(v: unknown): v is Tier {
  return typeof v === "string" && (TIERS as readonly string[]).includes(v);
}

/**
 * Quais status do Stripe valem insígnia.
 *
 * `trialing` conta porque um teste é um apoio começando, e `past_due` NÃO conta: um
 * cartão que falhou é um apoio que parou, mesmo que o Stripe ainda esteja tentando.
 * Na dúvida a insígnia sai, e volta sozinha quando o pagamento entrar. Insígnia a mais
 * é o app mentindo; insígnia a menos é o app esperando.
 */
export const STATUS_VIVOS = ["active", "trialing"] as const;

/**
 * ═══ O MÍNIMO, E POR QUE ELE EXISTE ═══
 *
 * Cinco reais. Abaixo disso a taxa do Stripe come quase tudo, e o Gume receberia
 * centavos por uma cobrança que custa uma linha no extrato de quem pagou.
 *
 * E o teto existe pelo motivo oposto: um campo de valor livre sem teto é um jeito de
 * alguém digitar 50000 por engano (o campo é em REAIS, e o erro clássico é a pessoa
 * pensar em centavos) e descobrir depois. Cinco mil reais é muito acima de qualquer
 * apoio real, e muito abaixo de um acidente que estragaria o mês de alguém.
 */
export const MINIMO_CENTAVOS = 500;
export const MAXIMO_CENTAVOS = 500_000;

export type ValorRecusado = { ok: false; porque: string };
export type ValorAceito = { ok: true; centavos: number };

/**
 * O valor do apoio avulso, conferido NO SERVIDOR.
 *
 * O campo da tela também confere, e isso não é redundância: a tela confere para a pessoa
 * não errar, e o servidor confere porque a tela é do atacante. Quem manda o POST direto
 * não passa por tela nenhuma.
 */
export function validarValor(bruto: unknown): ValorAceito | ValorRecusado {
  const n = typeof bruto === "number" ? bruto : Number(bruto);

  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { ok: false, porque: "o valor precisa ser um número inteiro de centavos" };
  }
  if (n < MINIMO_CENTAVOS) {
    return { ok: false, porque: `o apoio mínimo é de ${reais(MINIMO_CENTAVOS)}` };
  }
  if (n > MAXIMO_CENTAVOS) {
    return { ok: false, porque: `o apoio máximo por vez é de ${reais(MAXIMO_CENTAVOS)}` };
  }
  return { ok: true, centavos: n };
}

/** Centavos em dinheiro de gente. "R$ 5,00". */
export function reais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  ehApoiador(): a pergunta, em SQL, sobre a tabela `users` que a consulta já tem.
 *
 *  Recebe o apelido da tabela de usuários (`sql\`u\``) e devolve um booleano. É o mesmo
 *  formato de ehBibliotecario(), em lib/librarian.ts, e pelo mesmo motivo: a regra vive
 *  num lugar só, e cada consulta a encaixa onde precisa.
 *
 *  ═══ POR QUE ISTO NÃO É UMA COLUNA ═══
 *
 *  Porque uma coluna ficaria velha, e o buraco tem data marcada: o apoio avulso vale 30
 *  dias, e no dia 31 o Stripe não manda webhook nenhum, porque não aconteceu nada. Um
 *  booleano guardado ficaria `true` para sempre.
 *
 *  Calculado, não existe instante em que o banco discorde da verdade. A insígnia sai
 *  sozinha no dia em que o apoio acaba, e ninguém precisa passar limpando nada. Era
 *  exatamente o que a decisão de criar a insígnia prometeu.
 * ════════════════════════════════════════════════════════════════════
 */
export function ehApoiador(u: SQL): SQL {
  return sql`(
    exists (
      select 1 from stripe_subscription s
       where s.user_id = ${u}.id
         and s.status = any(${sql.param(STATUS_VIVOS as unknown as string[])}::text[])
    )
    or ${u}.avulso_badge_until > now()
  )`;
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  estenderAvulso(): +30 dias, e eles SOMAM.
 *
 *      avulso_badge_until = max(coalesce(avulso_badge_until, now()), now()) + 30 dias
 *
 *  O `max(..., now())` é o que faz um apoio antigo não puxar a data para trás: quem
 *  apoiou em janeiro e de novo em julho começa a contar de julho, e não de fevereiro.
 *  E o `coalesce` é para quem nunca apoiou avulso, que tem a coluna nula.
 *
 *  Quem apoiou duas vezes na mesma semana fica com 60 dias, e é o certo: ele pagou dois
 *  meses. Sobrescrever seria cobrar dois e entregar um.
 *
 *  A janela mora AQUI, num lugar só, para o dia em que ela mudar ser uma linha.
 * ════════════════════════════════════════════════════════════════════
 */
export const DIAS_DE_AVULSO = 30;

export function novaValidadeAvulso(): SQL {
  return sql`greatest(coalesce(users.avulso_badge_until, now()), now())
             + ${`${DIAS_DE_AVULSO} days`}::interval`;
}

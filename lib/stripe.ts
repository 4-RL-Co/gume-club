import Stripe from "stripe";
import type { Tier } from "@/lib/apoio";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O CLIENTE DO STRIPE. Server-only, e um só.
 *
 *  ═══ ELE É OPCIONAL, E ISSO É DE PROPÓSITO ═══
 *
 *  O apoio é da INSTÂNCIA HOSPEDADA, e não do Gume. Quem roda o próprio Gume não tem
 *  conta no Stripe, não deveria precisar de uma, e não vai receber erro nenhum por isso:
 *  sem `STRIPE_SECRET_KEY` a tela de apoiar some, e todo o resto do app roda igual.
 *
 *  Por isso a chave é lida numa função, e não no topo do módulo. Lida no topo, o app
 *  inteiro deixaria de subir na máquina de quem só quer ler livros.
 *
 *  ═══ NUNCA `NEXT_PUBLIC_` ═══
 *
 *  A secret key vive só aqui, e este arquivo nunca é importado por um "use client".
 *  Uma chave num bundle de cliente é uma chave pública, e o `pnpm audit:security` quebra
 *  a build se ela vazar para lá.
 *
 *  E apoio não destrava função nenhuma, então nenhum cliente precisa falar com o Stripe:
 *  o navegador só recebe uma URL de checkout que o servidor criou.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * A versão da API, FIXADA.
 *
 * Sem fixar, o Stripe pode mudar o formato de uma resposta debaixo do app numa
 * terça-feira qualquer, e a primeira notícia seria um apoio que não virou insígnia.
 * Subir de versão passa a ser uma decisão, com um diff, e não um acidente.
 */
const API_VERSION = "2026-07-29.dahlia" as const;

let cliente: Stripe | null = null;

/**
 * O cliente, ou `null` se esta instância não tem apoio configurado.
 *
 * Devolve `null` em vez de levantar porque "não configurado" é um estado LEGÍTIMO aqui,
 * e não uma falha. Quem chama distingue: a tela esconde o botão, e a rota responde 404.
 */
export function stripe(): Stripe | null {
  const chave = process.env.STRIPE_SECRET_KEY;
  if (!chave) return null;

  if (!cliente) {
    cliente = new Stripe(chave, {
      apiVersion: API_VERSION,
      // Aparece no dashboard do Stripe, e ajuda a saber de onde veio a cobrança.
      appInfo: { name: "Gume", url: "https://gume.club" },
    });
  }
  return cliente;
}

/** Esta instância aceita apoio? A tela pergunta isso antes de desenhar qualquer botão. */
export function apoioLigado(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * O preço de cada plano, vindo do ambiente.
 *
 * São ids (`price_...`), e não segredos: eles aparecem no checkout. Mas moram no
 * ambiente do mesmo jeito, porque são da INSTÂNCIA: os preços do gume.club não são os de
 * quem hospeda o próprio Gume, e um id chumbado no código seria a conta de outra pessoa.
 */
export function precoDo(tier: Tier): string | undefined {
  const mapa: Record<Tier, string | undefined> = {
    marcador: process.env.STRIPE_PRICE_MARCADOR,
    lombada: process.env.STRIPE_PRICE_LOMBADA,
    capadura: process.env.STRIPE_PRICE_CAPADURA,
  };
  return mapa[tier];
}

/** Qual plano é este preço. O caminho de volta, para o webhook saber o que gravar. */
export function tierDoPreco(priceId: string): Tier | null {
  if (priceId && priceId === process.env.STRIPE_PRICE_MARCADOR) return "marcador";
  if (priceId && priceId === process.env.STRIPE_PRICE_LOMBADA) return "lombada";
  if (priceId && priceId === process.env.STRIPE_PRICE_CAPADURA) return "capadura";
  return null;
}

/**
 * Para onde o Stripe manda a pessoa de volta.
 *
 * `APP_URL` já existe no ambiente deste projeto (o OAuth do GitHub usa a mesma), então
 * não há variável nova aqui.
 */
export function urlDoApp(caminho: string): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${caminho}`;
}

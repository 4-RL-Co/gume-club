import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O FUNIL DE ENTRADA. Ver a migration 0069 para o porquê da tabela.
 *
 *  Este módulo é a ÚNICA porta de escrita em `eventos_funil`, e ela nunca
 *  aceita texto livre: `tipo` é uma lista fechada, e `origem` sempre passa
 *  por `normalizarOrigem()` antes de tocar o banco. A URL de referrer ou o
 *  utm_source crus NUNCA chegam ao SQL — só o balde em que caem, ou nada.
 * ════════════════════════════════════════════════════════════════════
 */

export const SESSAO_ANON_COOKIE = "gume_sessao_anon";

/** 30 minutos: o "expira" do pedido. Ajustável, não é sagrado. */
export const SESSAO_ANON_MAX_AGE = 60 * 30;

export const TIPOS_DE_EVENTO = ["visita_home", "clique_criar", "viu_entrar", "cadastro_ok"] as const;
export type TipoDeEvento = (typeof TIPOS_DE_EVENTO)[number];

const MODOS = ["entrar", "criar"] as const;
export type ModoInicial = (typeof MODOS)[number];

/**
 * Os buckets conhecidos. Um nome fora desta lista vira "outro": a URL de
 * referrer (que pode identificar — um link mandado numa DM é um link só)
 * nunca é gravada, só o balde.
 */
const BUCKETS = ["reddit", "facebook", "instagram", "twitter", "whatsapp", "google", "direto"] as const;
type Bucket = (typeof BUCKETS)[number] | "outro";

/**
 * Normaliza um referrer ou um utm_source num balde conhecido. Aceita
 * qualquer coisa (o corpo da requisição não é confiável) e nunca lança.
 */
export function normalizarOrigem(bruto: unknown): Bucket | null {
  if (typeof bruto !== "string") return null;
  const limpo = bruto.trim().toLowerCase();
  if (!limpo) return null;

  for (const nome of BUCKETS) {
    if (limpo.includes(nome)) return nome;
  }
  // Hostname de referrer bate por domínio, para pegar "l.facebook.com",
  // "old.reddit.com" etc. sem precisar listar cada subdomínio.
  if (/facebook\.|fb\.com/.test(limpo)) return "facebook";
  if (/reddit\./.test(limpo)) return "reddit";
  if (/instagram\./.test(limpo)) return "instagram";
  if (/(twitter\.|x\.com)/.test(limpo)) return "twitter";
  if (/whatsapp\./.test(limpo)) return "whatsapp";
  if (/google\./.test(limpo)) return "google";

  return "outro";
}

export function ehTipoDeEvento(v: unknown): v is TipoDeEvento {
  return typeof v === "string" && (TIPOS_DE_EVENTO as readonly string[]).includes(v);
}

export function ehModoInicial(v: unknown): v is ModoInicial {
  return typeof v === "string" && (MODOS as readonly string[]).includes(v);
}

/**
 * Grava uma linha. Nunca lança: quem visita a home ou está tentando criar
 * conta não pode ver a própria página cair porque o caderninho de medição
 * falhou. Mesma filosofia de `registrarBuscaVazia` (lib/torneira.ts).
 */
export async function registrarEventoFunil(dados: {
  tipo: TipoDeEvento;
  origem: Bucket | null;
  modoInicial: ModoInicial | null;
  sessaoAnon: string;
}): Promise<void> {
  try {
    await db.execute(sql`
      insert into eventos_funil (tipo, origem, modo_inicial, sessao_anon)
      values (${dados.tipo}, ${dados.origem}, ${dados.modoInicial}, ${dados.sessaoAnon}::uuid)
    `);
  } catch {
    // Ver o cabeçalho: o caderninho é problema nosso, nunca da pessoa navegando.
  }
}

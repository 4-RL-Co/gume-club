"use client";

// Tipos só, apagados na compilação: nada de lib/funil.ts (que fala com o
// Postgres) entra no pacote do navegador.
import type { TipoDeEvento, ModoInicial } from "@/lib/funil";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O LADO DO NAVEGADOR DO FUNIL. Ver lib/funil.ts e app/api/eventos/route.ts.
 *
 *  `sendBeacon`, e não `fetch` esperado: um clique que já navega embora (o CTA
 *  de "criar conta" leva pra /entrar na hora) não pode depender de uma rede
 *  terminando antes — é a MESMA lição que este repo já aprendeu com
 *  `conviteEmVoo` (app/entrar/page.tsx), só que ali a saída é esperar; aqui,
 *  como o evento é só medição e nunca pode atrasar quem está navegando, a
 *  saída é não esperar nada.
 * ════════════════════════════════════════════════════════════════════
 */
export function registrarEvento(
  tipo: TipoDeEvento,
  dados: { origem?: string | null; modoInicial?: ModoInicial | null } = {},
): void {
  try {
    const corpo = JSON.stringify({
      tipo,
      origem: dados.origem ?? null,
      modoInicial: dados.modoInicial ?? null,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/eventos", new Blob([corpo], { type: "application/json" }));
    } else {
      // Navegador antigo sem sendBeacon: melhor um fetch que não é esperado
      // por ninguém do que nenhuma medição.
      void fetch("/api/eventos", {
        method: "POST",
        body: corpo,
        headers: { "content-type": "application/json" },
        keepalive: true,
      });
    }
  } catch {
    // Medir nunca pode quebrar a navegação de quem só está de passagem.
  }
}

/**
 * A origem, do jeito que o navegador enxerga: primeiro o que a própria URL diz
 * (`?utm_source=`), depois de onde a pessoa veio (`document.referrer`), e por
 * último "direto" — nunca vazio. O servidor (`normalizarOrigem`, lib/funil.ts)
 * é quem decide se isso vira um balde conhecido ou "outro"; aqui só se lê o
 * que o navegador sabe, sem julgar.
 */
export function origemAtual(): string | null {
  try {
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    if (utm) return utm;
    if (document.referrer) return document.referrer;
    return "direto";
  } catch {
    return null;
  }
}

/**
 * Carrega o `?utm_source=` que a home recebeu até o destino do clique — a
 * redundância pedida no item 6: cobre quem abre `/entrar` direto (sem o
 * cookie de sessão vivo) e ainda assim carrega de onde veio.
 */
export function hrefComUtm(base: string): string {
  if (typeof window === "undefined") return base;
  try {
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    if (!utm) return base;
    const separador = base.includes("?") ? "&" : "?";
    return `${base}${separador}utm_source=${encodeURIComponent(utm)}`;
  } catch {
    return base;
  }
}

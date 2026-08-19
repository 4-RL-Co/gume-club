/**
 * ════════════════════════════════════════════════════════════════════
 *  O RÓTULO DE UM LINK. Olhando o domínio, nunca perguntado.
 *
 *  "não achei onde colocar rede social" — o dono. Um campo "qual rede?"
 *  seria um enum fingindo saber toda rede que existe (a mesma lição de
 *  `owned_copies.acquired_note`: texto livre, não lista fechada). Guarda-se
 *  só a URL; o nome bonito se decide aqui, olhando o domínio — e o que não
 *  reconhece mostra o próprio domínio, nunca "site" genérico.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * `slug` é o nome do ícone lá no simple-icons (components/icone-rede-social.tsx
 * importa por ele) — `null` quando o Gume reconhece o NOME da rede, mas não tem
 * o desenho dela: Mastodon é federado ("mastodon.social" é só UMA instância
 * entre milhares), e o LinkedIn saiu do simple-icons por pedido da própria
 * empresa. Nos dois casos o rótulo continua certo, só sem ícone próprio.
 */
const CONHECIDOS: Record<string, { label: string; slug: string | null }> = {
  "instagram.com": { label: "Instagram", slug: "instagram" },
  "x.com": { label: "X", slug: "x" },
  "twitter.com": { label: "X", slug: "x" },
  "bsky.app": { label: "Bluesky", slug: "bluesky" },
  "threads.net": { label: "Threads", slug: "threads" },
  "youtube.com": { label: "YouTube", slug: "youtube" },
  "youtu.be": { label: "YouTube", slug: "youtube" },
  "tiktok.com": { label: "TikTok", slug: "tiktok" },
  "github.com": { label: "GitHub", slug: "github" },
  "goodreads.com": { label: "Goodreads", slug: "goodreads" },
  "letterboxd.com": { label: "Letterboxd", slug: "letterboxd" },
  "linkedin.com": { label: "LinkedIn", slug: null },
  "facebook.com": { label: "Facebook", slug: "facebook" },
  "twitch.tv": { label: "Twitch", slug: "twitch" },
  "discord.gg": { label: "Discord", slug: "discord" },
  "discord.com": { label: "Discord", slug: "discord" },
  "mastodon.social": { label: "Mastodon", slug: null },
  "pinterest.com": { label: "Pinterest", slug: "pinterest" },
  "reddit.com": { label: "Reddit", slug: "reddit" },
  "medium.com": { label: "Medium", slug: "medium" },
  "substack.com": { label: "Substack", slug: "substack" },
};

/** Só http/https, e uma URL de verdade — nunca `javascript:`, nunca lixo. */
export function urlValida(bruta: string): URL | null {
  try {
    const u = new URL(bruta.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

/** "Instagram", "GitHub", ou o domínio nu quando ninguém aqui conhece. */
export function rotuloDoLink(bruta: string): string {
  const u = urlValida(bruta);
  if (!u) return bruta;
  const host = u.hostname.replace(/^www\./, "");
  return CONHECIDOS[host]?.label ?? host;
}

/**
 * O ícone da rede, quando o Gume tem o desenho dela — `null` pro domínio nu
 * (mostra `Link2` genérico) e pra rede federada sem instância única (Mastodon).
 */
export function slugDoLink(bruta: string): string | null {
  const u = urlValida(bruta);
  if (!u) return null;
  const host = u.hostname.replace(/^www\./, "");
  return CONHECIDOS[host]?.slug ?? null;
}

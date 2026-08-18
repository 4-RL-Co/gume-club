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

const CONHECIDOS: Record<string, string> = {
  "instagram.com": "Instagram",
  "x.com": "X",
  "twitter.com": "X",
  "bsky.app": "Bluesky",
  "threads.net": "Threads",
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "tiktok.com": "TikTok",
  "github.com": "GitHub",
  "goodreads.com": "Goodreads",
  "letterboxd.com": "Letterboxd",
  "linkedin.com": "LinkedIn",
  "facebook.com": "Facebook",
  "twitch.tv": "Twitch",
  "discord.gg": "Discord",
  "discord.com": "Discord",
  "mastodon.social": "Mastodon",
  "pinterest.com": "Pinterest",
  "reddit.com": "Reddit",
  "medium.com": "Medium",
  "substack.com": "Substack",
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
  return CONHECIDOS[host] ?? host;
}

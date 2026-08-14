import type { MetadataRoute } from "next";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O MANIFESTO DO APP. Sem ele, "instalar" é um atalho pobre.
 *
 *  app/apple-icon.png já cobria o Safari/iOS (Adicionar à Tela de Início usa
 *  esse arquivo por convenção própria da Apple, sem manifesto nenhum). Mas o
 *  Chrome/Android só oferece a instalação DE VERDADE — ícone redondo do
 *  sistema, tela cheia sem barra de endereço, nome próprio no app switcher —
 *  quando existe um `manifest.webmanifest` para ler. Sem isto, "usar como
 *  app" no Android era só um atalho da web salvo na tela, com a barra do
 *  navegador ainda visível.
 *
 *  Next serve este arquivo em /manifest.webmanifest e já linka o <head>
 *  sozinho: nada a mais para escrever em app/layout.tsx.
 *
 *  Os ícones vêm de scripts/brand.mjs (pnpm brand) — a mesma arte-fonte do
 *  favicon e do apple-icon, nunca uma terceira cópia. Ver docs/design.md.
 * ════════════════════════════════════════════════════════════════════
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gume",
    short_name: "Gume",
    description: "A mente nunca perde o fio.",
    start_url: "/",
    display: "standalone",
    // O canvas escuro é a casa: a marca nasceu para ele, e é o tema que o
    // dono trouxe como o principal nesta rodada de redesign. Ver app/globals.css.
    background_color: "#17151d",
    theme_color: "#17151d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

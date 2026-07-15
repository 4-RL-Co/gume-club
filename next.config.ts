import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    // book covers. add hosts as catalog sources are added.
    remotePatterns: [
      { protocol: "https", hostname: "covers.openlibrary.org" },
      // A Open Library REDIRECIONA a capa para o archive.org. Sem este host, a
      // imagem chega até a porta e morre nela.
      { protocol: "https", hostname: "archive.org" },
      { protocol: "https", hostname: "**.archive.org" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "s4.anilist.co" },
      // a cara de quem escreve o código, na página de contribuidores
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default config;

import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Newsreader, Fraunces } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { Command } from "@/components/command";
import { ToastHost } from "@/components/toast-host";
import { PublicHeader } from "@/components/public-header";
import { getViewer } from "@/lib/viewer";
import { getCollections } from "@/lib/curation";
import { souModerador } from "@/lib/moderacao";
import { podeVerAFila } from "@/lib/torneira";
import "./globals.css";

/**
 * Geist for the interface, Newsreader for the voice.
 *
 * Inter is good and it is generic, and generic is what was holding this at
 * "nice". Geist has a colder, more mechanical skeleton that reads as software
 * without reading as a template, and it sits beside a high-contrast serif without
 * competing with it.
 */
const chrome = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const voice = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap" });

/**
 * A fonte da MARCA, e ela existe só para a palavra "Gume". Quatro letras.
 *
 * NÃO é a Newsreader da voz. A Newsreader é uma serifada de TEXTO, e ao lado deste
 * ícone, que é MASSA (sólido, denso, geométrico), ela lia como um FIO: não era
 * contraste, era descasamento.
 *
 * A Fraunces é moderna, tem serifa desenhada e traço de verdade, sem cair na
 * didone (grossa-fininha), cujo hairline morre no tamanho pequeno. Ela lê como
 * projetada, e não como fonte de sistema, e é contemporânea como a Newsreader: não
 * destoa das telas.
 *
 * (A Cinzel foi a candidata óbvia, por ser romana inscricional, literalmente
 * talhada em pedra. Foi recusada no teste: mesmo em 900 ela era a mais leve das
 * candidatas e tem serifa fina. Conceito não sobrevive ao pixel. Ver docs/design.md.)
 */
const mark = Fraunces({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gume",
  description: "A mente nunca perde o fio.",
};

/**
 * Two chromes, and which one you get depends on whether you are a reader here.
 *
 * Logged in: the glass sidebar, with your shelves, your invented shelves, your
 * profile. Logged out: the mark and one door. Showing a visitor a rail full of
 * "minhas estantes" is a lobby of locked doors, and it turns the landing, which
 * is a manifesto, into a product tour.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <html lang="pt-BR" className={`${chrome.variable} ${voice.variable} ${mark.variable}`}>
        <body className="min-h-dvh">
          <PublicHeader />
          {children}
        </body>
      </html>
    );
  }

  // A barra não recebe mais contagem: contagem é de FILTRO, e filtro mora na
  // tela que ele filtra. Ela só precisa das estantes que você inventou.
  const [shelves, moderador, fila] = await Promise.all([
    getCollections(viewer, viewer.id),
    // MODERADOR, e não bibliotecário: bibliotecário mexe em ficha de livro, moderador
    // mexe em gente, e os dois cargos deixaram de ser o mesmo. Ver lib/moderacao.ts.
    souModerador(viewer),
    // A FILA DE PEDIDOS é de BIBLIOTECÁRIO ou moderador: ela é trabalho de catálogo.
    // Ver lib/torneira.ts.
    podeVerAFila(viewer),
  ]);

  return (
    <html lang="pt-BR" className={`${chrome.variable} ${voice.variable} ${mark.variable}`}>
      <body className="min-h-dvh">
        {/* useSearchParams needs a suspense boundary at the layout level */}
        <Suspense fallback={null}>
          <Sidebar shelves={shelves} moderador={moderador} fila={fila} />
        </Suspense>

        {/* Cmd+K de qualquer tela: achar um livro e pôr na estante é a ação mais
            repetida do app, e ela custava uma navegação inteira. */}
        <Command />

        {/* Cinco segundos de arrependimento em toda ação destrutiva. */}
        <ToastHost />

        {/* Room for the fixed column on desktop, and for the bottom bar on a phone. */}
        <div className="pb-24 sm:pb-0 sm:pl-[254px]">{children}</div>
      </body>
    </html>
  );
}

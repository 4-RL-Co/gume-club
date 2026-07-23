import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Newsreader, Fraunces } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { SCRIPT_DO_TEMA } from "@/components/tema";
import { Command } from "@/components/command";
import { ToastHost } from "@/components/toast-host";
import { VoltarAoTopo } from "@/components/voltar-ao-topo";
import { PublicHeader } from "@/components/public-header";
import { Medicao } from "@/components/medicao";
import { getViewer } from "@/lib/viewer";
import { souIdealizador } from "@/lib/authz";
import { getCollections } from "@/lib/curation";
import { souModerador } from "@/lib/moderacao";
import { podeVerAFila } from "@/lib/torneira";
import { getNovidades } from "@/lib/novidades";
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
  // A base das URLs absolutas (Open Graph, Twitter). Sem ela, o Next usa localhost
  // e as imagens de compartilhamento quebram fora da máquina. Vem do APP_URL.
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
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
      <html lang="pt-BR" suppressHydrationWarning className={`${chrome.variable} ${voice.variable} ${mark.variable}`}>
        <head><script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} /></head>
        <body className="min-h-dvh">
          <PublicHeader />
          {children}
          <Medicao />
        </body>
      </html>
    );
  }

  // A barra não recebe mais contagem: contagem é de FILTRO, e filtro mora na
  // tela que ele filtra. Ela só precisa das estantes que você inventou.
  const [shelves, moderador, fila, idealizador, novidades] = await Promise.all([
    getCollections(viewer, viewer.id),
    // MODERADOR, e não bibliotecário: bibliotecário mexe em ficha de livro, moderador
    // mexe em gente, e os dois cargos deixaram de ser o mesmo. Ver lib/moderacao.ts.
    souModerador(viewer),
    // A FILA DE PEDIDOS é de BIBLIOTECÁRIO ou moderador: ela é trabalho de catálogo.
    // Ver lib/torneira.ts.
    podeVerAFila(viewer),
    // Só o idealizador vê a porta do painel privado. A defesa é no servidor; isto é só
    // sobre não desenhar um link que dá 404 para todo mundo menos uma pessoa.
    souIdealizador(viewer),
    // As três novidades do sino: te seguiram, seu convidado entrou, te recomendaram um
    // livro. Ver lib/novidades.ts.
    getNovidades(viewer),
  ]);

  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${chrome.variable} ${voice.variable} ${mark.variable}`}>
      {/* Antes do primeiro pixel: sem isto, quem escolheu escuro num computador claro
          leva um flash branco toda vez que abre uma página. Ver components/tema.tsx. */}
      <head><script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} /></head>
      <body className="min-h-dvh">
        {/* useSearchParams needs a suspense boundary at the layout level */}
        <Suspense fallback={null}>
          <Sidebar shelves={shelves} moderador={moderador} fila={fila} idealizador={idealizador} novidades={novidades} />
        </Suspense>

        {/* Cmd+K de qualquer tela: achar um livro e pôr na estante é a ação mais
            repetida do app, e ela custava uma navegação inteira. */}
        <Command />

        {/* O elevador: some no topo, aparece depois de duas telas. */}
        <VoltarAoTopo />

        {/* Cinco segundos de arrependimento em toda ação destrutiva. */}
        <ToastHost />

        {/* Room for the fixed column on desktop, and for the bottom bar on a phone. */}
        <div className="pb-24 sm:pb-0 sm:pl-[254px]">{children}</div>
        <Medicao />
      </body>
    </html>
  );
}

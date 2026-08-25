import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Newsreader, Fraunces } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { SCRIPT_DO_TEMA } from "@/components/tema";
import { Command } from "@/components/command";
import { ToastHost } from "@/components/toast-host";
import { VoltarAoTopo } from "@/components/voltar-ao-topo";
import { RelatarProblema } from "@/components/relatar-problema";
import { PublicHeader } from "@/components/public-header";
import { Medicao } from "@/components/medicao";
import { getViewer, getUser } from "@/lib/viewer";
import { souIdealizador } from "@/lib/authz";
import { apoioLigado } from "@/lib/stripe";
import { getCollections } from "@/lib/curation";
import { getNovidades } from "@/lib/novidades";
import "./globals.css";

/**
 * Inter for the interface, Newsreader for the voice.
 *
 * Era Geist ("Inter é bom e genérico, e genérico é o que mantinha isto em
 * 'bonitinho'" — ver a entrada anterior em ai/DECISIONS.md, que continua lá,
 * intacta). O dono viu o oku.club e pediu Inter de volta, explicitamente, duas
 * vezes — decisão nova, registrada em ai/DECISIONS.md, não uma reversão
 * silenciosa desta aqui.
 */
const chrome = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
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
  description: "A mente leitora nunca perde o fio.",
};

/**
 * A cor da barra de endereço (Android) e do fundo atrás do teclado/notch
 * (iOS), nos dois temas — não só no app instalado (isso é o manifest.ts),
 * mas em toda visita, dentro do navegador. Os dois hex são os mesmos
 * --color-canvas de app/globals.css: a barra do sistema é o canvas, mais
 * um pixel.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2efe8" },
    { media: "(prefers-color-scheme: dark)", color: "#17151d" },
  ],
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
          {/* Um bug pode chegar antes de uma conta — quem topa com um erro é
              bem capaz de ser justo quem não conseguiu se cadastrar. Ver
              components/relatar-problema.tsx e lib/relatar.ts. */}
          <RelatarProblema />
          <ToastHost />
          <Medicao />
        </body>
      </html>
    );
  }

  // A barra não recebe mais contagem: contagem é de FILTRO, e filtro mora na
  // tela que ele filtra. Ela só precisa das estantes que você inventou.
  //
  // souModerador()/podeVerAFila() saíram daqui: eram buscados em TODA página do
  // app só para acender "Cuidar do acervo" no menu do avatar, e esse link saiu
  // de lá — "eu quero que esteja no painel e não no meu menu do avatar", o
  // dono. O atalho pra /cuidar já mora dentro de /painel (aba moderação); as
  // duas funções continuam de pé, só não rodam mais em toda visita de todo
  // mundo por causa de um link que não existe mais aqui.
  const [eu, shelves, idealizador, novidades] = await Promise.all([
    // QUEM ESTÁ DENTRO, dito aqui. A barra não pergunta isso ao navegador: enquanto a
    // resposta do `useSession()` não chegava, ela desenhava a versão de visitante e
    // oferecia "Entrar" a quem já tinha entrado. Ver a nota em components/sidebar.tsx.
    getUser(viewer.id),
    getCollections(viewer, viewer.id),
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
          <Sidebar
            eu={eu && { nome: eu.displayName, handle: eu.handle, image: eu.image }}
            shelves={shelves}
            idealizador={idealizador}
            novidades={novidades}
            apoio={apoioLigado()}
          />
        </Suspense>

        {/* Cmd+K de qualquer tela: achar um livro e pôr na estante é a ação mais
            repetida do app, e ela custava uma navegação inteira. */}
        <Command />

        {/* O elevador: some no topo, aparece depois de duas telas. */}
        <VoltarAoTopo />

        {/* Mesmo canto do elevador, um degrau acima — este sempre visível, o
            elevador só depois de rolar. Ver components/relatar-problema.tsx. */}
        <RelatarProblema />

        {/* Cinco segundos de arrependimento em toda ação destrutiva. */}
        <ToastHost />

        {/* Room for the fixed column on desktop, and for the bottom bar on a phone. */}
        <div className="pb-24 sm:pb-0 sm:pl-[254px]">{children}</div>
        <Medicao />
      </body>
    </html>
  );
}

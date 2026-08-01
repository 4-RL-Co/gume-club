"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Library, Users, Search, LogIn, LogOut, Info, UserRound, HeartHandshake,
  MessagesSquare, ArrowUpRight, ChevronUp, BarChart3, Compass,
} from "lucide-react";
import { CONVERSA } from "@/lib/onde";
import { GlassBar } from "@/components/glass-bar";
import { Logo, Mark } from "@/components/logo";
import { MyShelves, type Shelf } from "@/components/my-shelves";
import { Sino } from "@/components/sino";
import { Tema } from "@/components/tema";
import type { Novidade } from "@/lib/novidades";
import { Avatar } from "@/components/avatar";
import { signOut } from "@/lib/auth-client";

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM ESTÁ DENTRO É O SERVIDOR QUE DIZ.
 *
 *  ═══ O BUG: A BARRA OFERECIA "ENTRAR" A QUEM JÁ TINHA ENTRADO ═══
 *
 *  A barra descobria quem estava logado com `useSession()`, um hook que faz uma
 *  ida ao servidor DEPOIS que a tela já apareceu. Enquanto a resposta não voltava,
 *  `session` era nulo, e a barra desenhava a versão de visitante: sem Perfil (no
 *  lugar dele, "Entrar"), sem sino, sem as estantes que a pessoa inventou.
 *
 *  Ela CONSERTAVA sozinha um instante depois, e é justamente isso que fazia o bug
 *  parecer imaginação de quem viu. Num telefone, na primeira tela do app instalado
 *  (que abre frio toda vez, e numa rede de celular), o instante é longo o bastante
 *  para a pessoa olhar, não achar o perfil, e concluir que ele não existe.
 *
 *  ═══ E ELE ERA UMA MENTIRA, NÃO SÓ UMA DEMORA ═══
 *
 *  O layout NÃO RENDERIZA esta barra para quem não entrou: quem está deslogado leva
 *  o PublicHeader. Se este componente existe na tela, a pessoa está logada — o
 *  servidor já sabia disso, com certeza, e ainda assim a tela perguntava de novo
 *  para o navegador e acreditava mais na resposta que ainda não chegou.
 *
 *  Oferecer "Entrar" a quem está dentro é a mesma mentira que o `sair` mais abaixo
 *  se recusa a contar quando a rede cai. Uma barra que mente sobre quem está dentro
 *  não é uma barra lenta: é uma barra errada.
 *
 *  Por isso a identidade CHEGA PRONTA, do servidor, junto com o resto. Não há
 *  estado de carregando, porque não há nada a carregar.
 * ════════════════════════════════════════════════════════════════════
 */
export type QuemEntrou = {
  /** Como a pessoa se chama, para a barra escrever. */
  nome: string | null;
  /** O endereço dela, que é o que dá a inicial quando não há foto. */
  handle: string;
  image: string | null;
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  A BARRA RESPONDE "ONDE ESTOU". SÓ ISSO.
 *
 *  Ela tinha catorze linhas e misturava duas coisas que não são a mesma:
 *  navegação (onde estou) e filtro (que recorte da minha estante). "Lendo"
 *  não é um lugar: é um recorte. E recorte mora na tela que ele filtra.
 *
 *  O que saiu, e para onde foi:
 *   - tudo / lendo / lidos / esperando / abandonados → abas dentro de /estante
 *   - Estatísticas → aba dentro de /estante: é uma VISTA dos seus livros, e
 *     não um destino paralelo
 *   - Amigos + Recomendações → /pessoas, com duas abas (o Explorar voltou à barra
 *     quando cresceu em galeria; ver a nota abaixo)
 *   - Buscar → campo aqui em cima, e ⌘K de qualquer tela. Busca é AÇÃO, e
 *     ação não é item de menu.
 *
 *  O que ficou: quatro destinos, as estantes que VOCÊ inventou (a única lista
 *  daqui que você criou com as próprias mãos, e a única que você quer alcançar
 *  de qualquer tela), e a sua cara no rodapé. Ver ai/DECISIONS.md.
 * ════════════════════════════════════════════════════════════════════
 */
/**
 * AMIGOS e EXPLORAR são dois lugares, e a divisão é a frase que sempre esteve no
 * código: amigos é quem você já escolheu; explorar é como você escolhe. O explorar
 * saiu da barra uma vez (virou aba de /pessoas) e voltou quando cresceu em galeria:
 * estantes montadas, queridinhos, curadores. Ver ai/DECISIONS.md.
 */
const LUGARES = [
  { href: "/", label: "Início", Icon: Home },
  { href: "/estante", label: "Estante", Icon: Library },
  { href: "/pessoas", label: "Amigos", Icon: Users },
  { href: "/explorar", label: "Explorar", Icon: Compass },
];

/**
 * ════════════════════════════════════════════════════════════════════
 *  CONSTRUIR O GUME É UM LUGAR, e não um rodapé.
 *
 *  Isto morava só dentro do /sobre, num parágrafo, e ninguém abre o
 *  /sobre. O app inteiro se descreve como "um app que se constrói", a
 *  página de contribuidores põe quem conserta uma capa ao lado de quem
 *  faz um commit, e mesmo assim não havia UMA PORTA para nada disso.
 *
 *  Um convite que ninguém encontra não é um convite: é uma frase bonita
 *  num arquivo que a gente escreveu para nós mesmos.
 *
 *  Fica embaixo, separado dos lugares de LER, porque ler é o produto e
 *  construir é o convite. Mas fica na barra, sempre visível, porque a
 *  única forma de alguém contribuir é ver que dá.
 * ════════════════════════════════════════════════════════════════════
 */
/**
 * ═══ UMA PORTA, E NÃO TRÊS ═══
 *
 * "O que falta", "Quem faz" e "As insígnias" eram três itens na barra, e são o mesmo
 * assunto: quem constrói o Gume. Três portas para um cômodo só não dão três caminhos —
 * dão a impressão de que há três cômodos, e fazem a pessoa abrir todas para descobrir
 * que não havia.
 *
 * A barra tem um item. As outras duas telas continuam existindo, e moram dentro dela.
 */
const CONSTRUIR = [
  { href: "/contribuidores", label: "Quem faz", Icon: HeartHandshake },
];

const ICON = { size: 18, strokeWidth: 1.5 } as const;

/**
 * ════════════════════════════════════════════════════════════════════
 *  A BARRA DE BAIXO REPARTE A LARGURA. ELA NUNCA TRANSBORDA.
 *
 *  ═══ O BUG: O PERFIL CAÍA PARA FORA DA TELA ═══
 *
 *  Os seis itens tinham largura própria (`px-3` e o rótulo inteiro) e a barra
 *  distribuía o que sobrasse. Numa tela de 390pt não sobrava: os seis pediam
 *  cerca de 460pt, e o último — o PERFIL — ficava DEPOIS da borda direita.
 *
 *  Quem estava no telefone via cinco itens e concluía que o perfil não existe.
 *  Dava para achar dando zoom para trás, porque aí a tela inteira cabe no olho e
 *  a barra aparece completa. Um item que só existe com zoom não existe.
 *
 *  ═══ POR QUE `flex-1`, E NÃO UM RÓTULO MENOR ═══
 *
 *  Encolher a letra até caber conserta o telefone que está na mão hoje e quebra no
 *  telefone menor de amanhã, em silêncio, exatamente como este quebrou. Com
 *  `flex-1 min-w-0` cada item ganha um sexto EXATO do que existe: não há largura a
 *  transbordar, porque não há item que peça mais do que lhe cabe. Se a tela for
 *  estreita demais para a palavra, o rótulo corta com reticências — o item continua
 *  ali, tocável, visível, e o pior caso vira "EXPLORA…" em vez de nada.
 *
 *  ═══ E POR QUE UMA MEDIDA SÓ ═══
 *
 *  Os seis itens são três coisas diferentes no código (um link de lugar, o botão da
 *  busca, o do perfil ou o de entrar). Escritos separados, eles divergem: bastou um
 *  ganhar um `px` a mais para a conta estourar sem ninguém somar. A medida mora
 *  aqui, uma vez, e quem entrar na barra amanhã herda ela.
 * ════════════════════════════════════════════════════════════════════
 */
const ITEM_DO_CELULAR =
  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[var(--radius-control)] px-0.5 py-2 transition-colors";

/** O rótulo cabe no item, e quando não cabe ele corta em vez de escapar. */
const ROTULO_DO_CELULAR = "w-full truncate text-center text-[9px] uppercase tracking-[0.08em]";

export function Sidebar({
  eu,
  shelves,
  moderador = false,
  fila = false,
  idealizador = false,
  novidades = [],
  apoio = false,
}: {
  /**
   * Quem está dentro, dito pelo servidor. Nunca perguntado ao navegador: ver a nota
   * lá em cima. `null` só existe para o caso de a linha do leitor ter sumido embaixo
   * da sessão (apagou a conta noutra aba), e aí a barra vira a de visitante — que é
   * a verdade, e não um estado de carregando.
   */
  eu: QuemEntrou | null;
  shelves: Shelf[];
  moderador?: boolean;
  /** Bibliotecário ou moderador: quem cuida do acervo vê a fila de pedidos. */
  fila?: boolean;
  /** Só o idealizador vê a porta do painel privado. Esconder o link não é a defesa
      (quem protege é lib/authz.ts, no servidor): é não pôr na cara de todo mundo um
      botão que dá 404 para a maioria. */
  idealizador?: boolean;
  /** Te seguiram, seu convidado entrou, te recomendaram: o que o sino mostra. */
  novidades?: Novidade[];
  /**
   * Esta instância aceita apoio? Quem hospeda o próprio Gume não tem conta de pagamento,
   * e para ele a /apoiar responde "não encontrado". Um item de menu que leva a um 404 é
   * pior que item nenhum, então ele só existe onde a porta abre. Ver lib/stripe.ts.
   */
  apoio?: boolean;
}) {
  const path = usePathname();
  const router = useRouter();

  /**
   * O menu do celular mora AQUI, e não lá dentro do botão que o abre, porque ele
   * precisa ser desenhado FORA da barra de vidro. Ver MenuCelular, embaixo.
   */
  const [menu, setMenu] = useState(false);

  /**
   * Estatística é uma vista da estante, então "Estante" continua aceso quando
   * você está nela. Um item de navegação que apaga enquanto você ainda está no
   * mesmo assunto faz a pessoa achar que se perdeu.
   */
  const aceso = (href: string) =>
    href === "/"
      ? path === "/"
      : href === "/estante"
        ? path.startsWith("/estante") || path.startsWith("/estatisticas")
        : path.startsWith(href);

  /**
   * SAIR, NUM LUGAR SÓ, E COM O CASO DA REDE CAINDO.
   *
   * Ele estava escrito duas vezes, uma no rodapé do desktop e outra no menu do
   * celular, e as duas eram `signOut().then(...)` sem rede de proteção. Quando a
   * chamada falha (e ela falha: conexão de celular no elevador, aba que perde o
   * sinal), a promessa morre sozinha e vira alarme sem dono, do mesmo feitio do
   * que o botão do Google produziu em /entrar.
   *
   * E o que fazer quando falha importa. Não é mandar para a home: a sessão
   * CONTINUA de pé, e levar a pessoa embora fingindo que ela saiu é a pior das
   * mentiras deste app. É recarregar, e a barra volta a dizer a verdade sobre
   * quem está dentro.
   */
  const sair = () =>
    signOut()
      .then(() => {
        router.push("/");
        router.refresh();
      })
      .catch(() => router.refresh());

  return (
    <>
      {/* ── desktop: a coluna de vidro ──────────────────────────────── */}
      <GlassBar
        as="aside"
        className="fixed left-3 top-3 bottom-3 z-40 hidden w-[230px] flex-col overflow-y-auto px-4 py-6 sm:flex"
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/">
            <Logo />
          </Link>
          {eu && <Sino novidades={novidades} />}
        </div>

        <BuscaFalsa />

        <nav className="mt-4 flex flex-col gap-0.5">
          {LUGARES.map(({ href, label, Icon }) => (
            <Item key={href} href={href} active={aceso(href)} icon={<Icon {...ICON} />}>
              {label}
            </Item>
          ))}
        </nav>

        {eu && <MyShelves shelves={shelves} />}

        {/* O convite. Separado dos lugares de LER por um filete: ler é o produto,
            construir é o convite, e misturar os dois transforma o app numa
            campanha. */}
        <div className="mt-8 border-t border-[var(--color-rule)] pt-5">
          <h2 className="mb-2 px-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            construir
          </h2>
          {/* ═══ O ROSA ═══
              Contribuir é a parte mais importante do Gume, e ela era um ícone cinza igual
              a todos os outros. A cor não é enfeite: é a única coisa que faz o olho parar
              ali no meio de uma coluna de itens iguais. Ver --color-colaborar. */}
          {CONSTRUIR.map(({ href, label, Icon }) => (
            <Item
              key={href}
              href={href}
              active={aceso(href)}
              icon={<Icon {...ICON} style={{ color: "var(--color-colaborar)" }} />}
            >
              {label}
            </Item>
          ))}

          {/* ═══ A CONVERSA, E POR QUE ELA SUBIU ATÉ AQUI ═══

              É onde se decide o que o Gume vai ser. Ela existia em três telas, e nas três
              era um link solto no fim de um parágrafo, lá embaixo: estar no app e ser
              encontrável no app são coisas diferentes.

              É o único item da barra que leva para FORA, e ele diz isso (a setinha, e a
              aba nova). Um link que muda de site sem avisar é um empurrão, e o Gume não
              empurra ninguém. */}
          <Fora href={CONVERSA} icon={<MessagesSquare {...ICON} style={{ color: "var(--color-colaborar)" }} />}>
            A conversa
          </Fora>
        </div>

        <div className="mt-auto pt-8">
          {/* ═══ O QUE SAIU DAQUI, E POR QUÊ ═══

              "Trazer a estante" desceu para DENTRO da Estante. Importar não é um lugar:
              é uma coisa que se faz com a estante, e ela pertence à tela vazia que a
              pessoa está olhando quando precisa dela.

              "Pedidos" e "Moderação" saíram da barra e viraram uma sala só — /cuidar.
              Eles não são lugares de LER: são um papel. Quem tem o papel entra pelo
              próprio nome, no rodapé. Quem não tem nunca precisou ver a porta.

              Esconder o link nunca protegeu nada: quem protege é lib/moderacao.ts, no
              servidor. Isto é sobre não pôr na cara de todo mundo três botões que a
              maioria não pode apertar. */}
          {/* A porta do painel privado. Só aparece para o idealizador, pela mesma razão
              que os links de papel: quem não pode nunca precisou ver a porta. */}
          {idealizador && (
            <Item href="/painel" active={aceso("/painel")} icon={<BarChart3 {...ICON} />}>
              Painel
            </Item>
          )}

          {/* A /apoiar era alcançável só de dentro da /contribuidores, aqui e no
              celular. Uma porta atrás de outra porta é uma porta que a maioria não abre,
              e esta é a única do app que pede dinheiro. */}
          {apoio && (
            <Item href="/apoiar" active={aceso("/apoiar")} icon={<HeartHandshake {...ICON} />}>
              Apoiar o Gume
            </Item>
          )}

          <Item href="/sobre" active={aceso("/sobre")} icon={<Info {...ICON} />}>
            Sobre
          </Item>

          {/* O TEMA. Três estados, e o do meio é o padrão: seguir o sistema é um bom
              padrão e uma péssima prisão. Ver components/tema.tsx. */}
          <Tema />

          {eu ? (
            <Eu
              image={eu.image}
              name={eu.nome}
              handle={eu.handle}
              cuidar={fila || moderador}
              onSair={sair}
            />
          ) : (
            <Item href="/entrar" active={aceso("/entrar")} icon={<LogIn {...ICON} />}>
              Entrar
            </Item>
          )}
        </div>
      </GlassBar>

      {/* ── celular: a coluna vira barra de baixo. Mesma regra, mesmo material. ── */}
      <GlassBar
        as="nav"
        className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-center px-1 sm:hidden"
      >
        {LUGARES.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={aceso(href) ? "page" : undefined}
            aria-label={label}
            className={[
              ITEM_DO_CELULAR,
              aceso(href) ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]",
            ].join(" ")}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className={ROTULO_DO_CELULAR}>{label}</span>
          </Link>
        ))}

        {/* ════════════════════════════════════════════════════════════
            ═══ A BUSCA, QUE NO CELULAR NÃO EXISTIA ═══

            O campo de busca morava só na coluna do desktop (`hidden … sm:flex`), e a
            paleta só abria por ⌘K — um atalho de teclado, num aparelho que não tem
            teclado. Passada a tela de boas-vindas, quem estava no telefone não tinha
            NENHUM caminho até a busca: nem para achar um livro, nem para cadastrar o
            que não existe.

            Achar um livro e pôr na estante é o app inteiro. Ele estava fora do alcance
            de metade das pessoas, e nada na tela dizia isso: não havia botão quebrado,
            havia botão nenhum. É o pior tipo de bug — o que não deixa rastro.

            Ela é um BOTÃO, e não um link: abre a mesma paleta do ⌘K, com o mesmo
            evento que o atalho dispara. Ver abrirBusca(), abaixo.
            ════════════════════════════════════════════════════════════ */}
        <button
          onClick={abrirBusca}
          aria-label="Buscar"
          className={`${ITEM_DO_CELULAR} text-[var(--color-ink-faint)] active:text-[var(--color-ink)]`}
        >
          <Search size={20} strokeWidth={1.5} />
          <span className={ROTULO_DO_CELULAR}>Buscar</span>
        </button>

        {/* ═══ O PERFIL DO CELULAR ABRE UM MENU, e não só uma página ═══

            Sair, o tema, o Sobre e o "cuidar do acervo" moravam SÓ na coluna do
            desktop. No telefone, que é metade das pessoas, não existia caminho:
            quem entrou no celular de outra pessoa ficava logado para sempre, e um
            bibliotecário não chegava na própria sala. O menu é o MESMO do rodapé
            do desktop (ver Eu, abaixo), servido pelo único item que já era seu. */}
        {eu ? (
          <button
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-controls="menu-do-celular"
            aria-label="Perfil"
            className={[
              ITEM_DO_CELULAR,
              aceso("/eu") || aceso("/perfil") || menu
                ? "text-[var(--color-ink)]"
                : "text-[var(--color-ink-faint)]",
            ].join(" ")}
          >
            <UserRound size={20} strokeWidth={1.5} />
            <span className={ROTULO_DO_CELULAR}>Perfil</span>
          </button>
        ) : (
          <Link
            href="/entrar"
            aria-current={aceso("/entrar") ? "page" : undefined}
            aria-label="Entrar"
            className={[
              ITEM_DO_CELULAR,
              aceso("/entrar") ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]",
            ].join(" ")}
          >
            <LogIn size={20} strokeWidth={1.5} />
            <span className={ROTULO_DO_CELULAR}>Entrar</span>
          </Link>
        )}
      </GlassBar>

      {/* ════════════════════════════════════════════════════════════
          ═══ O MENU FICA FORA DA BARRA, E ISSO NÃO É ARRUMAÇÃO ═══

          Ele era desenhado DENTRO da barra de vidro e subia para fora dela. No
          WebKit — o Safari, e todo app que se instala pela tela de início do
          iPhone — um elemento com `backdrop-filter` RECORTA os filhos que passam
          das bordas dele. O menu abria e era cortado inteiro.

          No computador funcionava, então o bug não existia para quem escrevia o
          código: existia para quem estava no telefone. E não havia botão
          quebrado — havia botão que abre o nada, que é pior, porque a pessoa
          conclui que o app não tem aquilo.

          Levava junto TUDO o que só se alcança por aqui: o perfil, o sobre, o
          cuidar do acervo, e o sair. Metade do app dependia de um menu invisível.

          Por isso ele é irmão da barra, e não filho: nenhum menu deste app pode
          depender de escapar de uma caixa de vidro.
          ════════════════════════════════════════════════════════════ */}
      {eu && menu && (
        <>
          {/* O apanhador de toque. Invisível de propósito: ele não escurece nada,
              só devolve o gesto que todo mundo já tem no dedo — tocar fora fecha.
              Sem ele, o menu só fechava pelo próprio botão, e ninguém adivinha isso. */}
          <button
            aria-label="Fechar o menu"
            onClick={() => setMenu(false)}
            className="fixed inset-0 z-40 cursor-default sm:hidden"
          />
          <MenuCelular
            cuidar={fila || moderador}
            idealizador={idealizador}
            apoio={apoio}
            fecha={() => setMenu(false)}
            onSair={sair}
          />
        </>
      )}

      {/* o fio no topo, para o celular saber de quem é o app, e o sino ao lado */}
      <div className="flex items-center justify-between px-6 pt-6 sm:hidden">
        <Link href="/" aria-label="Gume">
          <Mark size={22} />
        </Link>
        {eu && <Sino novidades={novidades} />}
      </div>
    </>
  );
}

/**
 * O campo de busca da barra não busca: ele ABRE a paleta do ⌘K.
 *
 * Busca é AÇÃO, e ação não é item de menu. Mas um atalho que ninguém descobre
 * sozinho é um atalho que não existe, então ele ganha uma porta visível.
 *
 * E é só uma porta: um segundo campo, com a própria caixa de resultados, seria
 * uma segunda busca para manter, e as duas divergiriam em um mês. Mesmo teclado,
 * mesmo resultado, uma implementação só.
 */
/**
 * Abre a paleta de busca sem teclado: dispara o MESMO evento que o ⌘K dispara.
 *
 * Mora aqui fora porque quem chama são dois: o campo do desktop e a lupa da barra de
 * baixo do celular. Duas cópias de "como se abre a busca" divergem no dia em que o
 * atalho mudar, e aí uma das duas para de abrir sem ninguém perceber.
 */
function abrirBusca() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

function BuscaFalsa() {
  return (
    <button
      onClick={abrirBusca}
      className="surface-2 mt-6 flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:ring-1 hover:ring-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]"
    >
      <Search size={16} strokeWidth={1.5} className="shrink-0 text-[var(--color-ink-faint)]" />
      <span className="flex-1 text-[14px] text-[var(--color-ink-faint)]">Buscar</span>
      <span className="tabular text-[11px] text-[var(--color-ink-faint)]">⌘K</span>
    </button>
  );
}

/** A sua cara, no rodapé. Perfil, o acervo (se for seu papel) e sair moram debaixo dela. */
function Eu({
  image, name, handle, cuidar, onSair,
}: {
  image: string | null;
  name: string | null;
  /**
   * O ENDEREÇO da pessoa, e não o nome dela outra vez.
   *
   * Isto vinha `handle={name ?? "eu"}`, porque o hook do navegador não trazia handle
   * nenhum e o nome era o que havia à mão. Quem não tem nome nem foto ganhava a
   * inicial de "eu" — um "E" que não é dele. Agora o handle vem do servidor, junto
   * com o resto, e a inicial é a certa.
   */
  handle: string;
  /** Bibliotecário ou moderador. O papel abre uma porta a mais, e só para quem o tem. */
  cuidar: boolean;
  onSair: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const path = usePathname();

  return (
    <div className="relative">
      {aberto && (
        <div className="surface absolute bottom-14 left-0 z-50 w-full overflow-hidden p-2">
          {/* Vai para o seu perfil PÚBLICO, e não para o formulário. Ver, e depois
              editar: o formulário aparecia antes de a pessoa ter olhado para o que
              ela ia mudar. Ver app/eu/page.tsx. */}
          <Link
            href="/eu"
            onClick={() => setAberto(false)}
            className="block rounded-[var(--radius-2)] px-3 py-2 text-[14px] text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] hover:text-[var(--color-ink)]"
          >
            Perfil
          </Link>

          {/* CUIDAR DO ACERVO. A fila de pedidos e a moderação, numa sala só.
              Mora aqui, debaixo do seu nome, porque é um PAPEL e não um lugar: quem
              cuida do acervo faz isso além de ler, e não em vez de ler. */}
          {cuidar && (
            <Link
              href="/cuidar"
              onClick={() => setAberto(false)}
              className="block rounded-[var(--radius-2)] px-3 py-2 text-[14px] text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] hover:text-[var(--color-ink)]"
            >
              Cuidar do acervo
            </Link>
          )}

          <button
            onClick={onSair}
            className="flex w-full items-center gap-2 rounded-[var(--radius-2)] px-3 py-2 text-left text-[14px] text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] hover:text-[var(--color-ink)]"
          >
            <LogOut size={15} strokeWidth={1.5} />
            Sair
          </button>
        </div>
      )}

      <button
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className={[
          "pill mt-1 flex w-full items-center gap-2.5 px-2 py-2 text-left text-[14px] transition-colors",
          path.startsWith("/perfil") || path.startsWith("/eu")
            ? "afiado font-medium text-[var(--color-ink)]"
            : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]",
        ].join(" ")}
      >
        <Avatar src={image} name={name} handle={handle} size={26} />
        <span className="truncate">{name ?? "Você"}</span>

        {/* ═══ A SETA. Sem ela, ninguém sabia que dá para clicar ═══

            Um leitor de fora não achou o "sair": ele está aqui dentro, atrás do seu nome,
            e o chip não tinha NENHUM sinal de que abria alguma coisa. Um rosto e um nome
            parados no rodapé parecem um rótulo, e não um botão.

            Uma seta é o menor sinal possível de "tem mais aqui embaixo", e ela gira quando
            abre — o que confirma, no primeiro clique, que a pessoa entendeu certo. */}
        <ChevronUp
          size={14}
          strokeWidth={1.5}
          aria-hidden
          className={[
            "ml-auto shrink-0 text-[var(--color-ink-faint)] transition-transform duration-200",
            aberto ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

/**
 * O MESMO menu do Eu, no celular: sobe de cima do item "Perfil" da barra de baixo.
 *
 * Ele tem duas portas a mais que o do desktop (Sobre e o Tema), porque no desktop
 * elas são itens da coluna, e no celular a coluna não existe: este menu é o único
 * teto que sobrou para elas. O rodapé da barra de baixo é apertado demais para
 * itens novos, e cada ícone a mais ali rouba área de toque de todos os outros.
 *
 * ═══ ELE NÃO SABE ABRIR E FECHAR, E É DE PROPÓSITO ═══
 *
 * Quem guarda o "aberto" é a Sidebar, porque o botão que abre mora DENTRO da barra
 * de vidro e o painel tem que morar FORA dela. Um componente só não consegue estar
 * nos dois lugares, e tentar isso foi exatamente o que deixou o menu invisível no
 * iPhone. Ver a nota na Sidebar.
 *
 * A altura: a barra é `bottom-3` e tem 64px, então o topo dela está a 76px do pé da
 * tela. O menu encosta 12px acima disso — o mesmo respiro que o vidro tem da borda.
 */
function MenuCelular({
  cuidar, idealizador, apoio, fecha, onSair,
}: {
  cuidar: boolean;
  idealizador: boolean;
  apoio: boolean;
  fecha: () => void;
  onSair: () => void;
}) {
  const linha =
    "block rounded-[var(--radius-2)] px-3 py-2.5 text-[14px] text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] hover:text-[var(--color-ink)]";

  return (
    <div
      id="menu-do-celular"
      className="surface fixed bottom-[88px] right-3 z-50 w-56 overflow-hidden p-2 sm:hidden"
    >
      <Link href="/eu" onClick={fecha} className={linha}>
        Perfil
      </Link>

      {cuidar && (
        <Link href="/cuidar" onClick={fecha} className={linha}>
          Cuidar do acervo
        </Link>
      )}

      {/* ════════════════════════════════════════════════════════════
          ═══ ESTAS DUAS NÃO EXISTIAM NO CELULAR ═══

          "Quem faz" morava só na coluna do desktop, e a /apoiar só era linkada de
          DENTRO dela. No telefone, que é metade das pessoas, a ala inteira de quem
          constrói o Gume (quem faz, o que falta, as insígnias) e o único lugar que
          pede apoio não tinham caminho nenhum. Não havia botão quebrado: havia
          botão nenhum, que é o bug que não deixa rastro.

          Quem descobriu foi o dono, usando o app no telefone dele.
          ════════════════════════════════════════════════════════════ */}
      <Link href="/contribuidores" onClick={fecha} className={linha}>
        Quem faz
      </Link>

      {apoio && (
        <Link href="/apoiar" onClick={fecha} className={linha}>
          Apoiar o Gume
        </Link>
      )}

      {idealizador && (
        <Link href="/painel" onClick={fecha} className={linha}>
          Painel
        </Link>
      )}

      <Link href="/sobre" onClick={fecha} className={linha}>
        Sobre
      </Link>

      <Tema />

      <button
        onClick={onSair}
        className="flex w-full items-center gap-2 rounded-[var(--radius-2)] px-3 py-2.5 text-left text-[14px] text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] hover:text-[var(--color-ink)]"
      >
        <LogOut size={15} strokeWidth={1.5} />
        Sair
      </button>
    </div>
  );
}

/**
 * Uma linha da barra.
 *
 * O item ativo não é uma pílula chapada: é uma superfície ELEVADA, com um fio de
 * luz na aresta direita que vaza um brilho para fora. O Gume é o fio da lâmina, e
 * o lugar onde você está é o que está afiado: a marca virou o comportamento da
 * interface, em vez de ser um logo parado num canto. Ver .afiado em globals.css.
 */
/**
 * Um item que leva para FORA do Gume.
 *
 * Ele não pode parecer um item comum: quem clica num item de menu espera continuar dentro
 * do app, e quem é jogado num site diferente sem aviso perde o lugar onde estava. A
 * setinha e a aba nova são o aviso.
 */
function Fora({
  href, icon, children,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="pill group flex items-center gap-2.5 px-3 py-2 text-[14px] text-[var(--color-ink-soft)] transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]"
    >
      {icon}
      <span className="truncate">{children}</span>
      <ArrowUpRight
        size={14}
        strokeWidth={1.5}
        aria-hidden
        className="ml-auto shrink-0 text-[var(--color-ink-faint)] transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </a>
  );
}

function Item({
  href, active, icon, children,
}: {
  href: string;
  active: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "pill flex items-center gap-2.5 px-3 py-2 text-[14px] transition-colors duration-150",
        active
          ? "afiado font-medium text-[var(--color-ink)]"
          : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Library, Users, Search, LogIn, LogOut, Info, UserRound, HeartHandshake,
  MessagesSquare, ArrowUpRight, ChevronUp,
} from "lucide-react";
import { CONVERSA } from "@/lib/onde";
import { GlassBar } from "@/components/glass-bar";
import { Logo, Mark } from "@/components/logo";
import { MyShelves, type Shelf } from "@/components/my-shelves";
import { Sino } from "@/components/sino";
import { Tema } from "@/components/tema";
import type { Novidade } from "@/lib/novidades";
import { Avatar } from "@/components/avatar";
import { useSession, signOut } from "@/lib/auth-client";

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
 *   - Amigos + Explorar + Recomendações → /pessoas, com três abas
 *   - Buscar → campo aqui em cima, e ⌘K de qualquer tela. Busca é AÇÃO, e
 *     ação não é item de menu.
 *
 *  O que ficou: três destinos, as estantes que VOCÊ inventou (a única lista
 *  daqui que você criou com as próprias mãos, e a única que você quer alcançar
 *  de qualquer tela), e a sua cara no rodapé. Ver ai/DECISIONS.md.
 * ════════════════════════════════════════════════════════════════════
 */
const LUGARES = [
  { href: "/", label: "Início", Icon: Home },
  { href: "/estante", label: "Estante", Icon: Library },
  { href: "/pessoas", label: "Pessoas", Icon: Users },
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

export function Sidebar({
  shelves,
  moderador = false,
  fila = false,
  novidades = [],
}: {
  shelves: Shelf[];
  moderador?: boolean;
  /** Bibliotecário ou moderador: quem cuida do acervo vê a fila de pedidos. */
  fila?: boolean;
  /** Te seguiram, seu convidado entrou, te recomendaram: o que o sino mostra. */
  novidades?: Novidade[];
}) {
  const path = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

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
          {session && <Sino novidades={novidades} />}
        </div>

        <BuscaFalsa />

        <nav className="mt-4 flex flex-col gap-0.5">
          {LUGARES.map(({ href, label, Icon }) => (
            <Item key={href} href={href} active={aceso(href)} icon={<Icon {...ICON} />}>
              {label}
            </Item>
          ))}
        </nav>

        {session && <MyShelves shelves={shelves} />}

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
          <Item href="/sobre" active={aceso("/sobre")} icon={<Info {...ICON} />}>
            Sobre
          </Item>

          {/* O TEMA. Três estados, e o do meio é o padrão: seguir o sistema é um bom
              padrão e uma péssima prisão. Ver components/tema.tsx. */}
          <Tema />

          {session ? (
            <Eu
              image={session.user.image ?? null}
              name={session.user.name ?? null}
              cuidar={fila || moderador}
              onSair={() => signOut().then(() => { router.push("/"); router.refresh(); })}
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
        className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-center justify-around px-2 sm:hidden"
      >
        {LUGARES.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={aceso(href) ? "page" : undefined}
            aria-label={label}
            className={[
              "flex flex-col items-center gap-1 rounded-[var(--radius-control)] px-3 py-2 transition-colors",
              aceso(href) ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]",
            ].join(" ")}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.12em]">{label}</span>
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
          className="flex flex-col items-center gap-1 rounded-[var(--radius-control)] px-3 py-2 text-[var(--color-ink-faint)] transition-colors active:text-[var(--color-ink)]"
        >
          <Search size={20} strokeWidth={1.5} />
          <span className="text-[10px] uppercase tracking-[0.12em]">Buscar</span>
        </button>

        {(() => {
          const eu = session
            ? { href: "/eu", label: "Perfil", Icon: UserRound }
            : { href: "/entrar", label: "Entrar", Icon: LogIn };

          return (
            <Link
              href={eu.href}
              aria-current={aceso(eu.href) ? "page" : undefined}
              aria-label={eu.label}
              className={[
                "flex flex-col items-center gap-1 rounded-[var(--radius-control)] px-3 py-2 transition-colors",
                aceso(eu.href) ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]",
              ].join(" ")}
            >
              <eu.Icon size={20} strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.12em]">{eu.label}</span>
            </Link>
          );
        })()}
      </GlassBar>

      {/* o fio no topo, para o celular saber de quem é o app, e o sino ao lado */}
      <div className="flex items-center justify-between px-6 pt-6 sm:hidden">
        <Link href="/" aria-label="Gume">
          <Mark size={22} />
        </Link>
        {session && <Sino novidades={novidades} />}
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
      className="surface-2 mt-6 flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:ring-1 hover:ring-white/[0.10]"
    >
      <Search size={16} strokeWidth={1.5} className="shrink-0 text-[var(--color-ink-faint)]" />
      <span className="flex-1 text-[14px] text-[var(--color-ink-faint)]">Buscar</span>
      <span className="tabular text-[11px] text-[var(--color-ink-faint)]">⌘K</span>
    </button>
  );
}

/** A sua cara, no rodapé. Perfil, o acervo (se for seu papel) e sair moram debaixo dela. */
function Eu({
  image, name, cuidar, onSair,
}: {
  image: string | null;
  name: string | null;
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
            className="block rounded-[var(--radius-2)] px-3 py-2 text-[14px] text-[var(--color-ink-soft)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
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
              className="block rounded-[var(--radius-2)] px-3 py-2 text-[14px] text-[var(--color-ink-soft)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
            >
              Cuidar do acervo
            </Link>
          )}

          <button
            onClick={onSair}
            className="flex w-full items-center gap-2 rounded-[var(--radius-2)] px-3 py-2 text-left text-[14px] text-[var(--color-ink-soft)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
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
            : "text-[var(--color-ink-soft)] hover:bg-white/[0.03] hover:text-[var(--color-ink)]",
        ].join(" ")}
      >
        <Avatar src={image} name={name} handle={name ?? "eu"} size={26} />
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
      className="pill group flex items-center gap-2.5 px-3 py-2 text-[14px] text-[var(--color-ink-soft)] transition-colors duration-150 hover:bg-white/[0.03] hover:text-[var(--color-ink)]"
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
          : "text-[var(--color-ink-soft)] hover:bg-white/[0.03] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}

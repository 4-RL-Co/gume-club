"use client";

import { useState, useTransition } from "react";
import type { Book } from "@/lib/book";
import type { Status } from "@/lib/library";
import type { Visibility } from "@/lib/authz";
import { VERDICTS } from "@/lib/veredito";
import { GLIFO, TRACO } from "@/components/veredito";
import { FolderPlus } from "lucide-react";
import { Quando } from "@/components/quando";
import { Campo } from "@/components/campo";
import { LIMITS } from "@/lib/limits";
import {
  setStatus, setRating, clearRating, saveReview,
} from "@/app/livro/[slug]/actions";
import { saveShelves } from "@/app/livro/[slug]/curation-actions";

const SHELVES: { status: Status; label: string }[] = [
  { status: "want_to_read", label: "esperando" },
  { status: "reading", label: "lendo" },
  { status: "read", label: "lido" },
  { status: "did_not_finish", label: "abandonado" },
];

/** Everything the reader can do to this book. The only interactive surface on the page. */
export function BookPanel({
  book,
  slug,
  shelves,
  todas,
}: {
  book: Book;
  slug: string;
  /** As estantes suas em que este livro JÁ está. */
  shelves: string[];
  /** TODAS as suas estantes, para o painel oferecê-las em vez de pedir que você digite. */
  todas: string[];
}) {
  const [pending, start] = useTransition();

  /**
   * ═══ A DATA É PERGUNTADA NA HORA DE MARCAR, E NÃO DEPOIS ═══
   *
   * "lido" e "abandonado" abrem o campo. "lendo" e "esperando" não abrem nada: o Gume
   * não calcula quanto tempo você levou para terminar um livro, então a data em que
   * você COMEÇOU não muda nada, e perguntar por ela seria cobrar um pedágio à toa.
   *
   * Ver components/quando.tsx.
   */
  const [perguntando, setPerguntando] = useState<"read" | "did_not_finish" | null>(null);

  const mine = book.mine;
  if (!mine) return null;

  const act = (fn: () => Promise<void>) => start(() => fn());

  const marcar = (status: Status) => {
    if (status === "read" || status === "did_not_finish") {
      setPerguntando(status);
      return;
    }
    // "lendo" grava hoje e não pergunta nada. Um clique é um clique.
    act(() => setStatus(slug, book.workId, status));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* status, one tap */}
      <Section label="prateleira">
        <div className="flex flex-wrap gap-1.5">
          {SHELVES.map((s) => (
            <button
              key={s.status}
              disabled={pending}
              onClick={() => marcar(s.status)}
              aria-pressed={mine.status === s.status}
              className={[
                "pill border px-4 py-2 text-[14px] font-medium disabled:opacity-40",
                mine.status === s.status
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-canvas)]"
                  : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {s.label}
            </button>
          ))}
        </div>

        {perguntando && (
          <Quando
            status={perguntando}
            pending={pending}
            onCancelar={() => setPerguntando(null)}
            onConfirmar={(quando) => {
              act(async () => {
                await setStatus(slug, book.workId, perguntando, quando);
                setPerguntando(null);
              });
            }}
          />
        )}

        {/**
         * ════════════════════════════════════════════════════════════════════
         *  AS ESTANTES QUE VOCÊ INVENTOU MORAM AQUI, E NÃO NUMA CAIXA DE FERRAMENTAS.
         *
         *  "Estou testando como usuário e não sei como colocar um livro na estante
         *   personalizada."
         *
         *  Existia. Estava lá embaixo, no fim da página, num botão chamado **"minhas
         *  estantes"**, ao lado de "corrigir os dados" e "qual edição é a minha".
         *
         *  Dois erros ao mesmo tempo, e cada um bastaria:
         *
         *  1. O LUGAR. Aquela barra é de CURADORIA — mexer no catálogo, arrumar ficha,
         *     escolher edição. Pôr um livro numa estante não é curadoria: é a coisa mais
         *     básica que um leitor faz. Ela estava na gaveta das ferramentas quando devia
         *     estar em cima da mesa.
         *
         *  2. O NOME. "Minhas estantes" parece um LINK para as suas estantes, e não um
         *     lugar onde se PÕE alguma coisa. O nome descrevia o destino, e não a ação.
         *
         *  Agora ela é a continuação natural de "prateleira": esperando/lendo/lido é a
         *  prateleira que o Gume dá; "para reler", "do meu pai" é a que você inventa. São
         *  a mesma pergunta ("onde este livro fica?"), e agora estão no mesmo cartão.
         *
         *  ═══ E ELA VOLTOU A SUMIR, POR UMA TRAVA: `mine.status &&` ═══
         *
         *  O mesmo relato chegou de novo, quase com as mesmas palavras: "não entendi
         *  como é a dinâmica de colar um livro ali". A causa era outra, e pior.
         *
         *  A trava só desenhava isto quando o livro JÁ ESTAVA na sua prateleira. Num
         *  livro que a pessoa ainda não tinha marcado, não havia controle nenhum: ela
         *  seguia a instrução da estante vazia ("abra um livro e coloque ele aqui"),
         *  abria um livro, e não encontrava nada. A instrução virava mentira.
         *
         *  ═══ E TIRÁ-LA É UMA DECISÃO SOBRE O QUE UMA ESTANTE É ═══
         *
         *  Sem a trava, um livro pode estar numa estante inventada SEM estar na sua
         *  prateleira. É o certo, e é o que destrava "quero comprar", "presentes para
         *  dar" e "o cânone que ainda não li": estante inventada é CURADORIA, e a
         *  prateleira é o seu histórico de leitura. São perguntas diferentes, e
         *  responder uma nunca deveria exigir responder a outra antes.
         *
         *  Decisão do dono, registrada em ai/DECISIONS.md.
         * ════════════════════════════════════════════════════════════════════
         */}
        <Estantes slug={slug} workId={book.workId} minhas={shelves} todas={todas} />
      </Section>

      <Verdicts value={mine.rating} pending={pending} slug={slug} workId={book.workId} act={act} />

      {/* A PROCEDÊNCIA saiu daqui. Ela é sobre o EXEMPLAR, e não sobre a leitura:
          mora no cartão da coleção, e só depois de você dizer que tem o livro.
          Ver components/tenho.tsx. */}

      <Review book={book} slug={slug} pending={pending} act={act} />
    </div>
  );
}

/** Every subject is a card. Nothing floats loose on the page. */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="surface p-6 sm:p-7">
      <h2 className="mb-4 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {label}
      </h2>
      {children}
    </section>
  );
}

/**
 * A nota, em palavras. Cinco frases, e nenhum número em lugar nenhum.
 *
 * Estrela é escala; escala vira média; média vira placar. Uma frase não soma com
 * outra: não existe "a média entre gostei e adorei", e é por isso que a frase é a
 * forma certa. Guardada como smallint 1..5 para ordenar e filtrar, mas o dígito
 * morre no banco e nunca chega na tela.
 *
 * "Não terminei" é uma nota, e é das mais honestas que existem. "Odiei" não está
 * aqui de propósito: é performance, e ninguém usa.
 */
function Verdicts({
  value, pending, slug, workId, act,
}: {
  value: number | null;
  pending: boolean;
  slug: string;
  workId: string;
  act: (fn: () => Promise<void>) => void;
}) {
  return (
    <Section label="o que você achou">
      <div className="flex flex-wrap items-center gap-2">
        {VERDICTS.map((v) => {
          const on = value === v.value;

          /**
           * O MESMO GLIFO DE FORA. A chama de "adorei" no botão é a mesma chama de
           * "adorei" na estante, no feed e na página de outra pessoa.
           *
           * Antes, o botão era só a palavra, e a estante era palavra + ícone: a mesma
           * nota tinha duas caras, e a pessoa tinha que aprender duas linguagens para
           * uma coisa só. Ver components/veredito.tsx — os cinco glifos são
           * CATEGÓRICOS, e nunca graus da mesma forma.
           */
          const Icone = GLIFO[v.value as keyof typeof GLIFO];

          return (
            <button
              key={v.value}
              disabled={pending}
              aria-pressed={on}
              onClick={() =>
                act(() => (on ? clearRating(slug, workId) : setRating(slug, workId, v.value)))
              }
              className={[
                "pill flex items-center gap-1.5 border px-4 py-2 text-[14px] disabled:opacity-40",
                on
                  // `text-white` sobre o accent era legível com o vermelho-tijolo de
                  // antes, e é ILEGÍVEL com a lâmina: branco sobre verde-água não se lê.
                  // O que se escreve em cima do accent tem um token próprio.
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] font-medium text-[var(--color-on-accent)]"
                  : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {Icone && <Icone size={14} strokeWidth={TRACO} aria-hidden />}
              {v.mine}
            </button>
          );
        })}

        {value !== null && (
          <button
            disabled={pending}
            onClick={() => act(() => clearRating(slug, workId))}
            className="ml-1 text-[12px] text-[var(--color-ink-faint)] underline underline-offset-4 hover:text-[var(--color-ink)]"
          >
            tirar
          </button>
        )}
      </div>
    </Section>
  );
}


/** The review. Private is the default, and the default is the product. */
function Review({
  book, slug, pending, act,
}: {
  book: Book;
  slug: string;
  pending: boolean;
  act: (fn: () => Promise<void>) => void;
}) {
  const mine = book.mine!;
  const [visibility, setVisibility] = useState<Visibility>(
    (mine.review?.visibility as Visibility) ?? "private",
  );
  const [texto, setTexto] = useState(mine.review?.body ?? "");

  /**
   * ═══ UMA RESENHA SALVA FICA EM REPOUSO, E NÃO EM RASCUNHO ═══
   *
   * Ela era um campo de texto aberto, sempre, com um "Salvar" do lado. Quem já tinha
   * escrito e salvado voltava e via a mesma tela de antes de salvar: parecia que o
   * trabalho não tinha ido, ou que ainda devia alguma coisa ao botão. Um "salva" cinza
   * ao lado não desfaz isso — a FORMA da tela diz mais alto que a legenda.
   *
   * Agora o texto salvo se lê como texto: na serifa da voz, do jeito que ele aparece
   * para as outras pessoas. Editar é um clique, e é raro: a resenha é a coisa mais
   * demorada que alguém escreve aqui, e não é uma coisa que se ajusta toda hora.
   */
  /**
   * ═══ E A CAIXA NASCE FECHADA ═══
   *
   * Quem NÃO tem resenha via um campo de texto aberto ocupando meio painel, toda
   * visita, em todo livro. A maioria das visitas a um livro não é para escrever: a
   * caixa aberta era um formulário cobrando texto de quem só veio olhar. Agora ela
   * nasce fechada, com um convite de uma linha; quem quer escrever clica, e a caixa
   * abre. Quem JÁ escreveu continua vendo o texto como texto, na serifa.
   */
  const [editando, setEditando] = useState(false);

  const ROTULO: Record<Visibility, string> = {
    private: "só para você",
    followers: "para quem te segue",
    public: "pública",
  };

  // Sem resenha e sem estar escrevendo: só o convite, em uma linha.
  if (!editando && !(mine.review?.body ?? "").trim() && !texto.trim()) {
    return (
      <Section label="resenha">
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-[14px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 transition-colors hover:text-[var(--color-ink)]"
        >
          escrever uma resenha
        </button>
      </Section>
    );
  }

  if (!editando) {
    return (
      <Section label="resenha">
        {/* `whitespace-pre-wrap` porque os parágrafos são da pessoa: sem ele, o texto
            que ela separou vira um bloco só, e a resenha some dentro de si mesma. */}
        <div className="paper p-4 sm:p-5">
          <p className="voice whitespace-pre-wrap text-[16px] leading-relaxed text-[var(--color-ink)]">
            {texto}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <span className="text-[12px] text-[var(--color-ink-faint)]">{ROTULO[visibility]}</span>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="text-[13px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 transition-colors hover:text-[var(--color-ink)]"
          >
            editar
          </button>
        </div>
      </Section>
    );
  }

  return (
    <Section label="resenha">
      <form
        action={(data: FormData) => {
          act(async () => {
            const corpo = String(data.get("body") ?? "");
            await saveReview(slug, book.workId, corpo, visibility);
            // Salvou: a resenha volta ao repouso. Só continua aberta se ficou vazia,
            // porque um campo vazio fechado seria uma seção que não diz nada.
            if (corpo.trim()) setEditando(false);
          });
        }}
      >
        {/* A resenha é o texto mais longo que alguém escreve aqui, e o servidor a cortava
            em vinte mil caracteres SEM DIZER NADA. Quem escrevesse mais que isso — e é
            uma resenha longa, mas ela existe — salvava, via "guardado", e perdia o fim
            sem nunca saber. O contador aparece quando o texto se aproxima do teto. */}
        <Campo
          nome="body"
          valor={texto}
          aoMudar={setTexto}
          teto={LIMITS.review}
          linhas={6}
          placeholder="Para você. Publique só se quiser."
          className="w-full rounded-[var(--radius-paper)] border border-[var(--color-rule)] bg-[var(--color-paper)] p-4 text-[15px] leading-relaxed outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex rounded-[var(--radius-control)] border border-[var(--color-rule)] p-0.5">
            {([
              { v: "private", label: "privada" },
              { v: "followers", label: "quem me segue" },
              { v: "public", label: "pública" },
            ] as const).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setVisibility(o.v)}
                aria-pressed={visibility === o.v}
                className={[
                  "pill px-3 py-1.5 text-[13px]",
                  visibility === o.v
                    ? "bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] text-[var(--color-ink)]"
                    : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
                ].join(" ")}
              >
                {o.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-1.5 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
          >
            {pending ? "Salvando" : "Salvar"}
          </button>

          {!(mine.review?.body ?? "").trim() ? null : (
            <button
              type="button"
              onClick={() => {
                setTexto(mine.review?.body ?? "");
                setEditando(false);
              }}
              className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              deixa
            </button>
          )}
        </div>

        <p className="mt-2 text-[12px] text-[var(--color-ink-faint)]">
          Resenha privada é de graça, para sempre.
        </p>
      </form>
    </Section>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS ESTANTES QUE VOCÊ INVENTOU. E POR QUE NÃO SÃO UM CAMPO DE TEXTO.
 *
 *  A primeira versão pedia os nomes SEPARADOS POR VÍRGULA, num campo livre. E ela tinha
 *  um buraco que o dono do Gume viu antes de qualquer teste:
 *
 *      "Ser assim pode fazer a pessoa digitar errado."
 *
 *  Digitar o nome de uma coisa que JÁ EXISTE é uma máquina de fazer duplicata. "para
 *  reler" e "pra reler" viram duas estantes. "Do meu pai" e "do meu pai" viram duas. E o
 *  app não reclama, porque do ponto de vista dele são dois nomes diferentes — ele obedece.
 *
 *  A pessoa só descobre semanas depois, com a barra lateral cheia de quase-iguais, e aí o
 *  estrago já está feito: os livros estão espalhados entre as duas, e juntá-las é trabalho
 *  manual.
 *
 *  ═══ A REGRA ═══
 *
 *  **Nunca peça que alguém digite o nome de uma coisa que você já conhece.** Ofereça.
 *
 *  As estantes que existem são botões: clica, entra; clica de novo, sai. O campo de texto
 *  continua existindo — porque criar a primeira estante tem que ser possível —, mas ele
 *  fica atrás de um "criar uma nova", que é uma decisão consciente, e não o caminho padrão.
 *
 *  E o campo de criar avisa quando o nome que você está digitando já existe, em vez de
 *  criar a segunda "pra reler" caladinho.
 *
 *  ═══ E ELA COMEÇA FECHADA ═══
 *
 *  A maioria das pessoas não usa isto, e um campo aberto no meio do caminho é um cadastro
 *  pedindo para ser preenchido. Fechada, ela é uma frase — e quem já tem estantes lê os
 *  nomes delas sem abrir nada, que é a única informação que importa de passagem.
 * ════════════════════════════════════════════════════════════════════
 */
function Estantes({
  slug,
  workId,
  minhas,
  todas,
}: {
  slug: string;
  workId: string;
  /** As suas estantes em que este livro JÁ está. */
  minhas: string[];
  /** Todas as suas estantes, existam elas ou não neste livro. */
  todas: string[];
}) {
  const [aberto, setAberto] = useState(false);
  const [marcadas, setMarcadas] = useState<string[]>(minhas);
  const [criando, setCriando] = useState(false);
  const [nova, setNova] = useState("");
  const [pendente, comecar] = useTransition();
  const [salvo, setSalvo] = useState(false);

  /** As que existem, mais as que você acabou de criar sem ter salvado ainda. */
  const disponiveis = [...new Set([...todas, ...marcadas])];

  const igual = (a: string, b: string) =>
    a.trim().toLowerCase().localeCompare(b.trim().toLowerCase(), "pt-BR", {
      sensitivity: "base",
    }) === 0;

  /**
   * "pra reler" quando já existe "Pra Reler" é a MESMA estante. Comparar ignorando caixa e
   * acento é o que impede a duplicata de nascer — e é o mesmo cuidado que o servidor toma
   * ao casar o nome (lib/curation.ts).
   */
  const jaExiste = nova.trim() && disponiveis.some((e) => igual(e, nova));

  const mudou =
    marcadas.length !== minhas.length || marcadas.some((m) => !minhas.includes(m));

  function alternar(nome: string) {
    setSalvo(false);
    setMarcadas((atual) =>
      atual.some((e) => igual(e, nome))
        ? atual.filter((e) => !igual(e, nome))
        : [...atual, nome],
    );
  }

  function criar() {
    const nome = nova.trim();
    if (!nome) return;

    // Se ela já existe, isto não CRIA nada: só marca a que existe. É o conserto do bug.
    const existente = disponiveis.find((e) => igual(e, nome));

    setMarcadas((atual) => {
      const alvo = existente ?? nome;
      return atual.some((e) => igual(e, alvo)) ? atual : [...atual, alvo];
    });

    setNova("");
    setCriando(false);
    setSalvo(false);
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mt-4 flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
      >
        <FolderPlus size={15} strokeWidth={1.5} />
        {minhas.length > 0
          ? `nas suas estantes: ${minhas.join(", ")}`
          : "guardar numa estante sua"}
      </button>
    );
  }

  return (
    <div className="mt-5 border-t border-[var(--color-rule)] pt-5">
      <p className="text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
        As suas estantes, do seu jeito: <em>para reler</em>, <em>do meu pai</em>,{" "}
        <em>me deram medo</em>. Elas começam só suas.
      </p>

      {disponiveis.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {disponiveis.map((nome) => {
            const dentro = marcadas.some((e) => igual(e, nome));
            return (
              <button
                key={nome}
                onClick={() => alternar(nome)}
                aria-pressed={dentro}
                className={[
                  "pill border px-3.5 py-1.5 text-[13px] transition-colors",
                  dentro
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-canvas)]"
                    : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
                ].join(" ")}
              >
                {nome}
              </button>
            );
          })}
        </div>
      )}

      {criando ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              autoFocus
              value={nova}
              maxLength={LIMITS.shelfName}
              onChange={(e) => setNova(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  criar();
                }
                if (e.key === "Escape") setCriando(false);
              }}
              placeholder="o nome da estante nova"
              className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
            />
            <button
              onClick={criar}
              disabled={!nova.trim()}
              className="shrink-0 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-3 py-2 text-[13px] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
            >
              {jaExiste ? "usar essa" : "criar"}
            </button>
          </div>

          {/* O AVISO QUE MATA A DUPLICATA. Sem ele, "pra reler" nasceria ao lado de
              "Pra reler", e ninguém entenderia por que os livros sumiram. */}
          {jaExiste && (
            <p className="mt-2 text-[12px] text-[var(--color-ink-faint)]">
              Você já tem essa estante. Clicar em &ldquo;usar essa&rdquo; guarda o livro
              nela, em vez de criar uma segunda com o mesmo nome.
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={() => setCriando(true)}
          className="mt-4 flex items-center gap-1.5 text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
        >
          <FolderPlus size={14} strokeWidth={1.5} />
          criar uma estante nova
        </button>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          disabled={pendente || !mudou}
          onClick={() =>
            comecar(async () => {
              await saveShelves(slug, workId, marcadas.join(", "));
              setSalvo(true);
            })
          }
          className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pendente ? "guardando" : "Guardar"}
        </button>

        <button
          onClick={() => setAberto(false)}
          className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          {salvo ? "pronto" : "deixa"}
        </button>

        {salvo && !pendente && (
          <span className="text-[12px] text-[var(--color-ink-faint)]">
            Guardado. Elas aparecem na barra, do lado esquerdo.
          </span>
        )}
      </div>
    </div>
  );
}

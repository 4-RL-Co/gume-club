"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, Plus } from "lucide-react";
import { Cover } from "@/components/cover";
import { Avatar } from "@/components/avatar";
import { addFromSearch, abrirDaBusca } from "@/app/buscar/actions";
import { lastBook } from "@/lib/last-book";
import type { Hit, Autor } from "@/lib/catalog";

type Pessoa = { id: string; handle: string; displayName: string | null; image: string | null };

/**
 * A busca, de qualquer tela, sem sair do lugar. Cmd+K (ou Ctrl+K).
 *
 * É a ação mais repetida do app: achar um livro e pôr na estante. Ela custava uma
 * navegação até /buscar, digitar, achar, voltar. Agora custa duas teclas, e a
 * estante recebe o livro sem que a tela onde você estava vá embora.
 *
 * O teclado é o produto aqui: ↑↓ (ou j/k) anda, Enter abre, 1 2 3 põem na
 * prateleira sem tirar a mão do teclado, Esc fecha. Nada disso precisa de mouse.
 */
const SHELVES = [
  { key: "1", status: "want_to_read", label: "esperando" },
  { key: "2", status: "reading", label: "lendo" },
  { key: "3", status: "read", label: "lido" },
] as const;

export function Command() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  /** AUTORES é a primeira seção: quem digita um nome de gente quer a pessoa. */
  const [autores, setAutores] = useState<Autor[]>([]);
  const [livros, setLivros] = useState<Hit[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [cursor, setCursor] = useState(0);

  /**
   * ═══ O QUE ACONTECEU, E NÃO SÓ O QUE VEIO ═══
   *
   * A busca não tinha estado de "não achei". Uma lista vazia era desenhada como... nada:
   * a caixa ficava aberta, com a dica de teclado embaixo, como se a pessoa não tivesse
   * digitado.
   *
   * E o pior é que "nada" também era o que ela mostrava quando a busca FALHAVA — o limite
   * de requisições devolvia listas vazias com status 429, e o cliente lia aquilo como
   * "nenhum resultado". Um leitor testando o app por dois minutos estourava o limite,
   * passava a ver silêncio, e concluía que a busca estava quebrada.
   *
   * É a lei do AGENTS.md quebrada dentro da nossa própria tela: **nunca traduza falha de
   * comunicação em ausência de dado.** As duas coisas parecem iguais e não são, e a pessoa
   * não tem como saber qual das duas aconteceu.
   */
  const [falha, setFalha] = useState<"demais" | "caiu" | null>(null);
  const [busy, setBusy] = useState(false);
  /** A segunda chamada, a que sai para a internet. A tela já está cheia quando ela roda. */
  const [foraEmCurso, setForaEmCurso] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const aborter = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const resume = lastBook.read();

  // Cmd+K de qualquer lugar. Nunca sequestra o atalho quando a pessoa está
  // escrevendo uma resenha: aí o navegador é dela, não nosso.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 10);
    else {
      setQ("");
      setAutores([]);
      setLivros([]);
      setPessoas([]);
      setCursor(0);
      setDone(null);
      setFalha(null);
    }
  }, [open]);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setAutores([]);
      setLivros([]);
      setPessoas([]);
      setFalha(null);
      return;
    }

    const timer = setTimeout(async () => {
      aborter.current?.abort();
      const ctrl = new AbortController();
      aborter.current = ctrl;
      setBusy(true);
      try {
        // O nosso catálogo primeiro, em milissegundos.
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });

        /**
         * O `res.ok` NÃO existia aqui, e era o bug inteiro.
         *
         * A rota devolve `{livros: [], autores: [], pessoas: []}` quando barra por excesso
         * de pedidos — e o `res.json()` engolia aquilo feliz da vida, como se o catálogo
         * não tivesse nada. A tela mostrava silêncio, e o silêncio mente.
         */
        if (!res.ok) {
          setAutores([]);
          setLivros([]);
          setPessoas([]);
          setFalha(res.status === 429 ? "demais" : "caiu");
          return;
        }

        setFalha(null);

        const json = await res.json();
        setAutores((json.autores ?? []).slice(0, 2));
        setLivros((json.livros ?? []).slice(0, 6));
        setPessoas((json.pessoas ?? []).slice(0, 3));
        setCursor(0);

        // E a internet só depois, e só se o nosso veio curto: fonte externa não
        // bloqueia tecla. Ver lib/catalog.ts.
        if ((json.livros ?? []).length < 5) {
          setForaEmCurso(true);
          try {
            const fora = await fetch(`/api/buscar?q=${encodeURIComponent(query)}&fora=1`, {
              signal: ctrl.signal,
            });
            const extra = await fora.json();
            if (!ctrl.signal.aborted && (extra.livros ?? []).length) {
              setLivros(extra.livros.slice(0, 6));
            }
          } finally {
            if (!ctrl.signal.aborted) setForaEmCurso(false);
          }
        }
      } catch {
        /* abortada: a próxima tecla já pediu outra */
      } finally {
        setBusy(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [q]);

  const total = livros.length + pessoas.length;

  const shelve = useCallback(
    async (hit: Hit, status: (typeof SHELVES)[number]["status"]) => {
      setDone(`${hit.title} está na estante.`);
      await addFromSearch(hit, status);
      router.refresh();
      setTimeout(() => setOpen(false), 700);
    },
    [router],
  );

  /**
   * ════════════════════════════════════════════════════════════════════
   *  ABRIR UM LIVRO. E ABRIR NÃO É GUARDAR.
   *
   *  Um resultado que já está no acervo tem endereço, e ir para ele é imediato.
   *  Um que veio de fora ainda não tem ficha — e a versão antiga resolvia isso
   *  PRATELEIRANDO o livro como "quero ler". Quem só queria olhar saía com um livro
   *  na estante que não escolheu.
   *
   *  Agora a ficha é criada e a pessoa é levada para ela. Criar é do CATÁLOGO (o
   *  livro passa a existir para quem buscar depois); prateleirar é da PESSOA, e
   *  continua a um clique, na página do livro.
   * ════════════════════════════════════════════════════════════════════
   */
  const abrir = useCallback(
    async (hit: Hit) => {
      if (hit.slug) {
        router.push(`/livro/${hit.slug}`);
        setOpen(false);
        return;
      }

      setDone("abrindo…");
      const slug = await abrirDaBusca(hit);
      // Sem endereço, a ficha não nasceu: melhor a barra continuar aberta com o
      // resultado à vista do que fechar e deixar a pessoa sem nada e sem explicação.
      if (!slug) {
        setDone("não consegui abrir esse livro. Tente de novo.");
        return;
      }
      router.push(`/livro/${slug}`);
      setOpen(false);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const down = e.key === "ArrowDown" || (e.ctrlKey && e.key === "n");
    const up = e.key === "ArrowUp" || (e.ctrlKey && e.key === "p");

    if (down) {
      e.preventDefault();
      setCursor((c) => (total ? (c + 1) % total : 0));
    } else if (up) {
      e.preventDefault();
      setCursor((c) => (total ? (c - 1 + total) % total : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const livro = livros[cursor];
      const pessoa = pessoas[cursor - livros.length];
      // Enter ABRE, sempre. Prateleirar é o 1/2/3, que é uma tecla deliberada.
      if (livro) void abrir(livro);
      else if (pessoa) {
        router.push(`/@${pessoa.handle}`);
        setOpen(false);
      }
    } else if (["1", "2", "3"].includes(e.key) && livros[cursor]) {
      e.preventDefault();
      const shelf = SHELVES.find((s) => s.key === e.key)!;
      void shelve(livros[cursor], shelf.status);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-label="buscar"
        className="surface w-full max-w-2xl overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--color-rule)] px-6 py-5">
          <Search size={18} strokeWidth={1.5} className="shrink-0 text-[var(--color-ink-faint)]" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="buscar um livro ou uma pessoa"
            className="w-full bg-transparent text-[16px] outline-none placeholder:text-[var(--color-ink-faint)]"
          />
          {(busy || foraEmCurso) && (
            <span className="shrink-0 whitespace-nowrap text-[12px] text-[var(--color-ink-faint)]">
              {foraEmCurso ? "procurando lá fora" : "…"}
            </span>
          )}
        </div>

        {done && (
          <p className="px-6 py-5 text-[14px] text-[var(--color-ink-soft)]">{done}</p>
        )}

        {!done && q.trim().length < 2 && (
          <div className="px-6 py-6">
            {resume ? (
              <button
                onClick={() => {
                  router.push(`/livro/${resume.slug}`);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 text-left text-[14px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                <CornerDownLeft size={16} strokeWidth={1.5} />
                voltar para <span className="voice text-[16px] text-[var(--color-ink)]">{resume.title}</span>
              </button>
            ) : (
              <p className="text-[14px] text-[var(--color-ink-faint)]">
                Digite duas letras. O que não estiver aqui, o Gume vai buscar lá fora.
              </p>
            )}
          </div>
        )}

        {/**
         * ═══ A TELA DIZ O QUE HOUVE. As três coisas são diferentes ═══
         *
         * "Não achei" é um fato sobre o catálogo. "Você buscou demais" é um fato sobre o
         * app. "Não deu para buscar" é um fato sobre a rede. As três mostravam a MESMA
         * coisa — nada —, e a pessoa concluía a pior das três: "está quebrado".
         */}
        {!done && falha === "demais" && (
          <p className="px-6 py-6 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
            Você buscou muita coisa em pouco tempo, e o Gume pediu um respiro. Espere alguns
            segundos e digite de novo: não é você, e não sumiu nada.
          </p>
        )}

        {!done && falha === "caiu" && (
          <p className="px-6 py-6 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
            Não deu para buscar agora, e o problema é nosso. Tente de novo em um instante.
          </p>
        )}

        {/**
         * O "NÃO ACHEI". Ele não existia, e é a correção mais barata deste relatório.
         *
         * A pessoa digita o nome de um livro que ela ama, erra uma letra, e recebe uma
         * caixa vazia. Ela não conclui "errei a digitação": conclui "o app é vazio". E
         * fecha a aba, no primeiro minuto, sem ter motivo nenhum para dar uma segunda
         * chance a um site que acabou de conhecer.
         */}
        {!done && !falha && !busy && !foraEmCurso && q.trim().length >= 2 && total === 0 && autores.length === 0 && (
          <div className="px-6 py-6">
            <p className="text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
              Não achei nada com{" "}
              <span className="text-[var(--color-ink)]">&ldquo;{q.trim()}&rdquo;</span>.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
              Confira se não escapou uma letra. O acento não faz falta: &ldquo;principe&rdquo;
              acha &ldquo;O Príncipe&rdquo;.
            </p>

            {/**
             * ═══ E A SAÍDA, QUE NÃO EXISTIA ═══
             *
             * O acervo do Gume é escolhido a mão, então "o Gume não tem esse livro" é o
             * caso NORMAL, e não a exceção. Cadastrar na mão sempre foi possível, mas só
             * em /buscar — e quase todo mundo busca por aqui, pelo ⌘K. Quem não achava
             * lia "confira se não escapou uma letra" e acabava ali: a tela dizia que a
             * culpa era da digitação, quando o livro simplesmente não existia ainda.
             *
             * Um beco sem saída no minuto em que a pessoa quer DAR um livro ao catálogo é
             * o pior lugar possível para ter um beco sem saída.
             */}
            <button
              onClick={() => {
                router.push(`/buscar?q=${encodeURIComponent(q.trim())}`);
                setOpen(false);
              }}
              className="mt-4 flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)]"
            >
              <Plus size={15} strokeWidth={1.5} />
              Cadastrar este livro à mão
            </button>
          </div>
        )}

        {!done && (autores.length > 0 || total > 0) && (
          <ul className="max-h-[46vh] overflow-y-auto py-2">
            {/* AUTORES. Só aparece quando o nome casa forte, e some quando a busca
                é por título: a tela não fica pedindo desculpa por uma seção vazia. */}
            {autores.length > 0 && (
              <li className="px-6 pb-1 pt-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
                autores
              </li>
            )}
            {autores.map((a) => (
              <li key={a.slug}>
                <button
                  onClick={() => {
                    router.push(`/autor/${a.slug}`);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]"
                >
                  <span className="cover-lift w-8 shrink-0">
                    <Cover title={a.name} src={a.coverUrl} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-[var(--color-ink)]">{a.name}</span>
                    <span className="tabular block truncate text-[12px] text-[var(--color-ink-faint)]">
                      {a.works} {a.works === 1 ? "obra" : "obras"}
                      {a.nationality ? ` · ${a.nationality.toLowerCase()}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}

            {autores.length > 0 && livros.length > 0 && (
              <li className="px-6 pb-1 pt-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
                obras
              </li>
            )}

            {livros.map((h, i) => (
              <li key={`l${i}`}>
                <button
                  onMouseEnter={() => setCursor(i)}
                  /**
                   * ═══ ABRIR UM LIVRO FECHA A BARRA ═══
                   *
                   * Antes, não fechava. A página trocava ATRÁS da barra aberta, e a pessoa
                   * continuava olhando para a mesma lista de resultados: dava a impressão
                   * de que o livro não era clicável, e ela clicava de novo, e de novo.
                   *
                   * O autor fechava. A pessoa fechava. O livro, que é o que quase todo
                   * mundo clica, era o único que não fechava.
                   */
                  onClick={() => void abrir(h)}
                  className={[
                    "flex w-full cursor-pointer items-center gap-4 px-6 py-3 text-left transition-colors",
                    i === cursor ? "bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]" : "",
                  ].join(" ")}
                >
                  <span className="cover-lift w-8 shrink-0">
                    <Cover title={h.title} author={h.author} src={h.coverUrl} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="voice block truncate text-[15px]">{h.title}</span>
                    <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                      {h.author ?? "autor desconhecido"}
                    </span>
                  </span>

                  {i === cursor && (
                    <span className="hidden shrink-0 gap-1.5 sm:flex">
                      {SHELVES.map((s) => (
                        <span
                          key={s.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            void shelve(h, s.status);
                          }}
                          className="pill border border-[var(--color-rule)] px-2.5 py-1 text-[12px] text-[var(--color-ink-faint)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                        >
                          {s.key} {s.label}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              </li>
            ))}

            {pessoas.map((p, i) => {
              const idx = livros.length + i;
              return (
                <li key={p.id}>
                  <button
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => {
                      router.push(`/@${p.handle}`);
                      setOpen(false);
                    }}
                    className={[
                      "flex w-full items-center gap-4 px-6 py-3 text-left transition-colors",
                      idx === cursor ? "bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]" : "",
                    ].join(" ")}
                  >
                    <Avatar src={p.image} name={p.displayName} handle={p.handle} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-[var(--color-ink)]">
                        {p.displayName ?? p.handle}
                      </span>
                      <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                        @{p.handle}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}

            {/**
             * ═══ "NÃO É NENHUM DESSES" ═══
             *
             * Achar ALGUMA coisa não é achar O livro. A busca devolve três edições
             * parecidas, nenhuma é a da pessoa, e sem esta linha ela conclui que o jeito
             * é aceitar a errada — que é exatamente como um catálogo comum começa a
             * mentir. A saída fica ao lado do erro, e não numa tela que ela teria que
             * saber que existe.
             */}
            {livros.length > 0 && (
              <li className="mt-2 border-t border-[var(--color-rule)] pt-2">
                <button
                  onClick={() => {
                    router.push(`/buscar?q=${encodeURIComponent(q.trim())}`);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-6 py-3 text-left text-[13px] text-[var(--color-ink-faint)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] hover:text-[var(--color-ink)]"
                >
                  <Plus size={15} strokeWidth={1.5} className="shrink-0" />
                  Não é nenhum desses? Cadastre o livro à mão
                </button>
              </li>
            )}
          </ul>
        )}

        <p className="border-t border-[var(--color-rule)] px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          {/* A DICA DIZIA "1 2 3 prateleira", e ninguém entendia. Um leitor de fora: "não
              faço ideia do que os números fazem". Um atalho que precisa ser adivinhado não
              é um atalho: é um enigma. Agora ele diz o que os números FAZEM. */}
          ↑↓ anda · enter abre · esc fecha
          <span className="mx-1.5 opacity-40">|</span>
          1 esperando · 2 lendo · 3 lido
        </p>
      </div>
    </div>
  );
}

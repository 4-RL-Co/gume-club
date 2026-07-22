"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { semAcento } from "@/lib/texto";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { CheckSquare, Trash2, BookOpen, FolderInput } from "lucide-react";
import { BookCard } from "@/components/book-card";
import { Cover } from "@/components/cover";
import { DenseList } from "@/components/dense-list";
import {
  tirarVarios, desfazerRemocao, prateleirarVarios, moverVariosPara,
} from "@/app/livro/[slug]/curation-actions";
import { setRating } from "@/app/livro/[slug]/actions";
import { toast } from "@/lib/toast";
import { VERDICTS } from "@/lib/veredito";
import type { ShelfBook } from "@/lib/shelf-view";
import type { Opinion } from "@/lib/ratings";
import type { Shelf } from "@/components/my-shelves";

/**
 * A estante, e tudo que dá para fazer com ela sem sair dela.
 *
 * O "escolher vários" existia e só sabia apagar, que é uma faca só de ponta. Agora
 * ele prateleira, põe numa estante inventada e tira, e o tirar tem cinco segundos
 * de desfazer, com a nota, a resenha e a procedência voltando junto.
 *
 * O TECLADO: j e k andam, Enter abre, 1 a 5 dão nota no livro em foco, Esc sai.
 * Quem tem quatrocentos livros não quer arrastar um mouse por eles.
 */
export function ShelfSelect({
  books,
  view,
  mine,
  opinions = {},
  shelves = [],
  de,
}: {
  books: ShelfBook[];
  view: "parede" | "lista";
  mine: boolean;
  opinions?: Record<string, Opinion>;
  shelves?: Shelf[];
  /** O recorte da estante, para o livro saber para onde é "voltar". Ver BookCard. */
  de?: string;
}) {
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [armed, setArmed] = useState(false);
  const [moving, setMoving] = useState(false);
  const [pending, start] = useTransition();

  /** O livro em foco pelo teclado. -1 é ninguém, e é assim que a tela começa. */
  const [focus, setFocus] = useState(-1);
  /** A nota que a tela já mostra, antes de o servidor responder. */
  const [notas, setNotas] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!mine) return;

    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocus((f) => Math.min(f + 1, books.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocus((f) => Math.max(f - 1, 0));
      } else if (e.key === "Enter" && focus >= 0) {
        e.preventDefault();
        const b = books[focus];
        if (b) router.push(`/livro/${b.slug}`);
      } else if (e.key === "Escape") {
        setFocus(-1);
        setOn(false);
        setArmed(false);
        setPicked(new Set());
      } else if (/^[1-5]$/.test(e.key) && focus >= 0) {
        e.preventDefault();
        const b = books[focus];
        if (!b) return;
        const value = Number(e.key);

        // Otimista: a nota muda na tela agora. Se o servidor recusar, ela volta e
        // a pessoa fica sabendo. Esperar meio segundo por uma tecla é o que faz um
        // app parecer lento mesmo quando ele não é.
        setNotas((n) => ({ ...n, [b.workId]: value }));
        start(async () => {
          try {
            await setRating(b.slug, b.workId, value);
          } catch {
            setNotas((n) => {
              const next = { ...n };
              delete next[b.workId];
              return next;
            });
            toast("Não deu para guardar a nota. Tente de novo.");
          }
        });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [books, focus, mine, router, start]);

  // o livro em foco tem que estar visível
  useEffect(() => {
    if (focus < 0) return;
    document
      .getElementById(`livro-${books[focus]?.workId}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focus, books]);

  /** A estante que a tela mostra, com as notas otimistas por cima. */
  const todos: ShelfBook[] = books.map((b) => {
    const nota = notas[b.workId];
    return nota === undefined ? b : { ...b, rating: nota };
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  PROCURAR NA PRÓPRIA ESTANTE.
   *
   *  Os filtros respondem "que recorte" (lidos, lendo, por nota). Nenhum deles responde
   *  "cadê o Frankenstein" — e numa estante de cento e quarenta e seis livros, achar um
   *  pelo olho é varrer uma parede inteira. A busca do ⌘K procura o CATÁLOGO, que são
   *  duzentas e sessenta mil fichas: perguntar a ela por um livro que já é seu é
   *  atravessar o mundo para chegar em casa.
   *
   *  ═══ SEM IR AO SERVIDOR ═══
   *
   *  Os livros já estão todos aqui, nesta tela. Filtrar é uma volta no array, e ela
   *  acontece enquanto a pessoa digita: nenhuma requisição, nenhum "procurando", nenhum
   *  jeito de estar fora do ar.
   *
   *  ═══ E ELA IGNORA ACENTO, COMO O RESTO DO APP ═══
   *
   *  "principe" acha "O Príncipe". Quem digita rápido não põe acento, e uma busca que
   *  exige acento é uma busca que responde "não achei" sobre um livro que está na tela.
   * ════════════════════════════════════════════════════════════════════
   */
  const [busca, setBusca] = useState("");

  const shown = useMemo(() => {
    const q = semAcento(busca);
    if (!q) return todos;
    return todos.filter(
      (b) => semAcento(b.title).includes(q) || semAcento(b.author ?? "").includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, books, notas]);

  const campoDeBusca = (
    <div className="relative mt-8">
      <Search
        size={16}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
      />
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder={`procurar nos seus ${todos.length} livros`}
        aria-label="procurar na sua estante"
        className="w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent py-2.5 pl-11 pr-4 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
      />
    </div>
  );

  /** Achou nada: a tela DIZ isso, em vez de mostrar uma parede vazia sem explicação. */
  const vazio = busca.trim() && shown.length === 0 && (
    <p className="surface mt-6 p-7 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
      Nenhum livro seu casa com {busca.trim()}. Ele pode estar em outro recorte: a busca
      olha só o que esta tela está mostrando.
    </p>
  );

  if (!mine) {
    return (
      <>
        {campoDeBusca}
        {vazio}
        {view === "lista" ? (
          <DenseList books={shown} opinions={opinions} />
        ) : (
          <Wall books={shown} opinions={opinions} focus={-1} de={de} />
        )}
      </>
    );
  }

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const leave = () => {
    setOn(false);
    setArmed(false);
    setMoving(false);
    setPicked(new Set());
  };

  const chosen = [...picked];

  return (
    <>
      {campoDeBusca}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {!on ? (
          <>
            <button
              onClick={() => setOn(true)}
              className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
            >
              <CheckSquare size={16} strokeWidth={1.25} />
              escolher vários
            </button>

            {/* O teclado existe, e ninguém adivinha sozinho que existe. */}
            {books.length > 3 && (
              <span className="ml-auto hidden text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] sm:block">
                j k andam · enter abre · 1 a 5 dão nota
              </span>
            )}
          </>
        ) : (
          <>
            <span className="tabular text-[13px] text-[var(--color-ink-soft)]">
              {picked.size} {picked.size === 1 ? "escolhido" : "escolhidos"}
            </span>

            <button
              onClick={() => setPicked(new Set(books.map((b) => b.workId)))}
              className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              todos
            </button>

            {picked.size > 0 && !armed && (
              <>
                <button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const n = await prateleirarVarios(chosen, "read");
                      toast(`${n} ${n === 1 ? "livro marcado" : "livros marcados"} como lido.`);
                      leave();
                      router.refresh();
                    })
                  }
                  className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] disabled:opacity-40"
                >
                  <BookOpen size={16} strokeWidth={1.25} />
                  marcar como lido
                </button>

                {shelves.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setMoving((v) => !v)}
                      className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                    >
                      <FolderInput size={16} strokeWidth={1.25} />
                      pôr numa estante
                    </button>

                    {moving && (
                      <ul className="surface absolute left-0 top-8 z-20 w-56 overflow-hidden p-2">
                        {shelves.map((s) => (
                          <li key={s.id}>
                            <button
                              disabled={pending}
                              onClick={() =>
                                start(async () => {
                                  const n = await moverVariosPara(s.id, chosen);
                                  toast(
                                    `${n} ${n === 1 ? "livro foi" : "livros foram"} para ${s.name}.`,
                                  );
                                  leave();
                                  router.refresh();
                                })
                              }
                              className="w-full truncate rounded-[var(--radius-2)] px-3 py-2 text-left text-[14px] text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] hover:text-[var(--color-ink)]"
                            >
                              {s.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setArmed(true)}
                  className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-perigo)]"
                >
                  <Trash2 size={16} strokeWidth={1.25} />
                  tirar da estante
                </button>
              </>
            )}

            {picked.size > 0 && armed && (
              <span className="flex items-center gap-3 text-[13px]">
                <span className="text-[var(--color-ink-soft)]">
                  tirar {picked.size} {picked.size === 1 ? "livro" : "livros"} da estante?
                </span>
                <button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const snapshot = await tirarVarios(chosen);
                      const n = snapshot.length;
                      toast(
                        `${n} ${n === 1 ? "livro saiu" : "livros saíram"} da estante.`,
                        async () => {
                          await desfazerRemocao(snapshot);
                          router.refresh();
                        },
                      );
                      leave();
                      router.refresh();
                    })
                  }
                  className="font-medium text-[var(--color-perigo)] disabled:opacity-40"
                >
                  {pending ? "tirando" : "sim, tirar"}
                </button>
                <button onClick={() => setArmed(false)} className="text-[var(--color-ink-faint)]">
                  não
                </button>
              </span>
            )}

            <button onClick={leave} className="ml-auto text-[13px] text-[var(--color-ink-faint)]">
              sair
            </button>
          </>
        )}
      </div>

      {!on ? (
        view === "lista" ? (
          <DenseList
            books={shown}
            opinions={opinions}
            focus={focus >= 0 ? books[focus]?.workId : undefined}
            mine
          />
        ) : (
          <>{vazio}<Wall books={shown} opinions={opinions} focus={focus} de={de} /></>
        )
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {shown.map((b) => {
            const has = picked.has(b.workId);
            return (
              <li key={b.workId}>
                <button
                  onClick={() => toggle(b.workId)}
                  aria-pressed={has}
                  className="block w-full text-left"
                  style={{ opacity: has ? 1 : 0.55 }}
                >
                  <span
                    className="card group relative flex h-full flex-col items-center p-6 text-center sm:p-7"
                    style={{
                      borderColor: has
                        ? "color-mix(in srgb, var(--color-accent) 60%, transparent)"
                        : undefined,
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute right-3 top-3 h-3 w-3 rounded-[3px] border"
                      style={{
                        borderColor: has ? "var(--color-accent)" : "var(--color-rule)",
                        background: has ? "var(--color-accent)" : "transparent",
                      }}
                    />
                    <span className="cover-lift block w-[58%]">
                      <Cover title={b.title} author={b.author} src={b.coverUrl} />
                    </span>
                    <span className="voice mt-6 line-clamp-2 text-[15px] leading-snug">
                      {b.title}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* a legenda das notas, só quando alguém está de fato navegando pelo teclado */}
      {focus >= 0 && (
        <p className="mt-6 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          {VERDICTS.map((v, i) => `${i + 1} ${v.mine}`).join(" · ")}
        </p>
      )}
    </>
  );
}

function Wall({
  books,
  opinions,
  focus,
  de,
}: {
  books: ShelfBook[];
  opinions: Record<string, Opinion>;
  focus: number;
  /** O recorte da estante, que viaja até o livro para o "voltar". Ver BookCard. */
  de?: string;
}) {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {books.map((b, i) => (
        <BookCard key={b.workId} book={b} opinion={opinions[b.workId]} focused={i === focus} de={de} />
      ))}
    </ul>
  );
}

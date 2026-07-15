"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { SearchResults } from "@/components/search-results";
import { ManualBookForm } from "@/components/manual-book-form";
import type { Hit, Autor } from "@/lib/catalog";

type Pessoa = {
  id: string;
  handle: string;
  displayName: string | null;
  image: string | null;
  bio: string | null;
};

/**
 * Results while you type. Pressing enter to find out whether a book exists is a
 * round trip through your own patience.
 *
 * Debounced at 250ms, and every request aborts the one before it, so a fast typer
 * never sees the answer to a word they already finished changing. The catalogue is
 * ours now (414k Portuguese editions), so most of these never leave the building.
 *
 * Books AND people in one box: a reader looking for a friend and a reader looking
 * for a book both start by typing a name, and making them pick a tab first is
 * asking them a question the app can work out for itself.
 */
export function LiveSearch({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial);
  /** AUTORES é a primeira seção: quem digita um nome de gente quer a pessoa. */
  const [autores, setAutores] = useState<Autor[]>([]);
  const [livros, setLivros] = useState<Hit[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [busy, setBusy] = useState(false);
  /** A segunda chamada, a que sai para a internet, depois de a tela já ter o nosso. */
  const [foraEmCurso, setForaEmCurso] = useState(false);
  const [asked, setAsked] = useState(false);

  const aborter = useRef<AbortController | null>(null);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setAutores([]);
      setLivros([]);
      setPessoas([]);
      setAsked(false);
      return;
    }

    const timer = setTimeout(async () => {
      aborter.current?.abort();
      const ctrl = new AbortController();
      aborter.current = ctrl;

      setBusy(true);
      try {
        // 1. o NOSSO catálogo, que responde em milissegundos e aparece agora.
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        const json = await res.json();
        setAutores(json.autores ?? []);
        setLivros(json.livros ?? []);
        setPessoas(json.pessoas ?? []);

        // 2. e SÓ ENTÃO a internet, numa segunda chamada, se o que é nosso veio
        //    curto. A tela já está preenchida quando esta sai, então a espera é
        //    do complemento e não da resposta. Antes, a Open Library e o Google
        //    ficavam no caminho da tecla, e uma busca sem resultado local levava
        //    sete segundos.
        if ((json.livros ?? []).length < 5) {
          setForaEmCurso(true);
          try {
            const fora = await fetch(`/api/buscar?q=${encodeURIComponent(query)}&fora=1`, {
              signal: ctrl.signal,
            });
            const extra = await fora.json();
            if (!ctrl.signal.aborted) setLivros(extra.livros ?? json.livros ?? []);
          } finally {
            if (!ctrl.signal.aborted) setForaEmCurso(false);
          }
        }
        setAsked(true);
      } catch {
        // an aborted request is the point, not an error
      } finally {
        if (!ctrl.signal.aborted) setBusy(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [q]);

  return (
    <>
      <div className="mt-6">
        <label htmlFor="q" className="sr-only">
          Título, ISBN, ou o nome de alguém
        </label>
        <input
          id="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          autoComplete="off"
          placeholder="Título, ISBN, ou o nome de alguém"
          className="w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-4 py-3 text-[16px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
        />
        <p className="mt-2 h-4 text-[12px] text-[var(--color-ink-faint)]">
          {busy ? "procurando" : q.trim().length >= 2 ? "" : "O ISBN está na contracapa."}
        </p>
      </div>

      {pessoas.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            pessoas
          </h2>
          <ul className="mt-4 flex flex-col gap-1">
            {pessoas.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/@${p.handle}`}
                  className="flex items-center gap-4 rounded-[var(--radius-control)] px-2 py-2 transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]"
                >
                  <span
                    className="h-10 w-10 shrink-0 overflow-hidden bg-[var(--color-card)]"
                    style={{ borderRadius: "var(--radius-cover)" }}
                  >
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="voice block truncate text-[16px]">
                      {p.displayName ?? p.handle}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                      @{p.handle}
                      {p.bio ? ` · ${p.bio}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* AUTORES, a primeira seção. Quem digita o nome de um autor quer o AUTOR:
          numa lista única, os livros escritos SOBRE ele esmagam os livros DELE,
          porque o nome dele está no título deles. Ver lib/catalog.ts. */}
      {autores.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {autores.length === 1 ? "autor" : "autores"}
          </h2>

          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {autores.map((a) => (
              <li key={a.slug}>
                <Link href={`/autor/${a.slug}`} className="surface surface-hover flex items-center gap-4 p-5">
                  <span className="cover-lift w-12 shrink-0">
                    <Cover title={a.name} src={a.coverUrl} />
                  </span>
                  <span className="min-w-0">
                    <span className="voice block truncate text-[18px] leading-snug">{a.name}</span>
                    <span className="tabular block truncate text-[12px] text-[var(--color-ink-faint)]">
                      {a.works} {a.works === 1 ? "obra" : "obras"}
                      {a.nationality ? ` · ${a.nationality.toLowerCase()}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {livros.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-baseline gap-3 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            <span>{livros.length} {livros.length === 1 ? "livro" : "livros"}</span>
            {/* A tela já mostrou o que é NOSSO. Esta linha diz que ela ainda está
                completando lá fora, em vez de deixar a pessoa achando que acabou. */}
            {foraEmCurso && <span className="normal-case tracking-normal">procurando lá fora</span>}
          </h2>
          <SearchResults hits={livros} />
          <ManualBookForm initialTitle={q} />
        </section>
      )}

      {asked && !busy && !foraEmCurso && livros.length === 0 && pessoas.length === 0 && (
        <div className="mt-12">
          <p className="text-[var(--color-ink-soft)]">Não achamos nada para {q}.</p>
          <p className="mt-2 text-[13px] text-[var(--color-ink-faint)]">
            Acontece com edição brasileira. Não é beco sem saída: cadastre o livro na mão.
          </p>
          <ManualBookForm initialTitle={q} />
        </div>
      )}

      {/* a cover, quietly, so the empty search is not an empty room */}
      {!asked && q.trim().length < 2 && (
        <div aria-hidden className="mt-16 flex justify-center opacity-[0.06]">
          <div className="w-32">
            <Cover title="Gume" author={null} src={null} />
          </div>
        </div>
      )}
    </>
  );
}

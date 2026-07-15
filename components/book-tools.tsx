"use client";

import { useState, useTransition } from "react";
import { Pencil, BookOpen, Trash2 } from "lucide-react";
import {
  takeOffShelf, saveBookEdit, escolherEdicao,
} from "@/app/livro/[slug]/curation-actions";

const ICON = { size: 16, strokeWidth: 1.25 } as const;

export type Tool = {
  slug: string;
  workId: string;
  editionId: string | null;
  onShelf: boolean;
  shelves: string[];
  editions: { id: string; publisher: string | null; year: number | null; pages: number | null; isbn: string | null }[];
  myEditionId: string | null;
  book: {
    title: string;
    author: string | null;
    firstPublished: number | null;
    publisher: string | null;
    publishedYear: number | null;
    pageCount: number | null;
    format: string | null;
    isbn13: string | null;
    coverUrl: string | null;
  };
};

/**
 * Everything else you can do to a book: fix it, tag it, put it on a shelf you
 * invented, take it off your shelf.
 *
 * All of it is folded away behind a quiet row of links. These are the actions you
 * reach for once in a while, and a book page should be about the book, not about
 * its own controls.
 */
export function BookTools(t: Tool) {
  const [open, setOpen] = useState<"editar" | "edicao" | null>(null);

  return (
    <section className="surface p-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Toggle icon={<Pencil {...ICON} />} on={open === "editar"} onClick={() => setOpen(open === "editar" ? null : "editar")}>
          corrigir os dados
        </Toggle>
        {/* ═══ "MINHAS ESTANTES" SAIU DAQUI ═══

            Ela morava nesta barra, ao lado de "corrigir os dados" e "qual edição é a
            minha" — e ninguém a achava. Duas coisas estavam erradas ao mesmo tempo:

            O LUGAR. Esta barra é de CURADORIA: mexer no catálogo, arrumar ficha, escolher
            edição. Pôr um livro numa estante não é curadoria, é a coisa mais básica que um
            leitor faz. Estava na gaveta das ferramentas quando devia estar na mesa.

            O NOME. "Minhas estantes" parece um LINK para as suas estantes, e não um lugar
            onde se PÕE alguma coisa. O nome descrevia o destino, e não a ação.

            Agora ela é a continuação natural de "prateleira", dentro do painel do livro.
            Ver components/book-panel.tsx. */}
        {t.onShelf && t.editions.length > 1 && (
          <Toggle icon={<BookOpen {...ICON} />} on={open === "edicao"} onClick={() => setOpen(open === "edicao" ? null : "edicao")}>
            qual edição é a minha
          </Toggle>
        )}
        {t.onShelf && <Remove workId={t.workId} />}
      </div>

      {open === "editar" && <Editar {...t} />}
      {open === "edicao" && <Edicao {...t} />}
    </section>
  );
}

function Toggle({
  icon, on, onClick, children,
}: { icon: React.ReactNode; on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-2 text-[13px] transition-colors",
        on ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

/** Removing is quiet: one confirm, no modal, no drama, no "are you sure?!". */
function Remove({ workId }: { workId: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  if (!armed) {
    return (
      <button
        onClick={() => setArmed(true)}
        className="ml-auto flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-perigo)]"
      >
        <Trash2 {...ICON} />
        tirar da estante
      </button>
    );
  }

  return (
    <span className="ml-auto flex items-center gap-3 text-[13px]">
      <span className="text-[var(--color-ink-soft)]">tirar da estante?</span>
      <button
        disabled={pending}
        onClick={() => start(() => takeOffShelf(workId))}
        className="font-medium text-[var(--color-perigo)] disabled:opacity-40"
      >
        {pending ? "tirando" : "sim, tirar"}
      </button>
      <button onClick={() => setArmed(false)} className="text-[var(--color-ink-faint)]">
        não
      </button>
    </span>
  );
}

const FORMATS = [
  ["paperback", "brochura"],
  ["hardcover", "capa dura"],
  ["ebook", "e-book"],
  ["audiobook", "audiolivro"],
  ["other", "outro"],
] as const;

/** Anyone can fix any book. Every change is recorded with a name on it. */
function Editar(t: Tool) {
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const b = t.book;

  return (
    <form
      className="paper mt-6 p-5"
      action={(data: FormData) =>
        start(async () => {
          const form = Object.fromEntries(
            [...data.entries()].map(([k, v]) => [k, String(v)]),
          ) as Record<string, string>;
          await saveBookEdit(t.slug, t.workId, t.editionId, form);
          setSaved(true);
        })
      }
    >
      <p className="text-[13px] text-[var(--color-ink-soft)]">
        Qualquer pessoa pode corrigir um livro. Toda mudança fica registrada com o nome de quem
        fez, e dá para voltar atrás.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field name="title" label="título" defaultValue={b.title} required />
        <Field name="author" label="autor" defaultValue={b.author ?? ""} />
        <Field name="publisher" label="editora" defaultValue={b.publisher ?? ""} />
        <Field name="firstPublished" label="ano da obra" defaultValue={b.firstPublished ?? ""} inputMode="numeric" />
        <Field name="publishedYear" label="ano da edição" defaultValue={b.publishedYear ?? ""} inputMode="numeric" />
        <Field name="pageCount" label="páginas" defaultValue={b.pageCount ?? ""} inputMode="numeric" />
        <Field name="isbn" label="ISBN" defaultValue={b.isbn13 ?? ""} inputMode="numeric" />
        <label className="block">
          <Label>formato</Label>
          <select
            name="format"
            defaultValue={b.format ?? "paperback"}
            className="mt-1.5 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px]"
          >
            {FORMATS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <Field name="coverUrl" label="endereço da capa" defaultValue={b.coverUrl ?? ""} placeholder="https://..." />
        </div>
        <div className="sm:col-span-2">
          <Field name="reason" label="o que você mudou (opcional)" placeholder="a editora estava errada" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pending ? "Salvando" : "Salvar correção"}
        </button>
        {saved && !pending && <span className="text-[12px] text-[var(--color-ink-faint)]">salvo</span>}
      </div>
    </form>
  );
}

/**
 * WHICH copy is yours.
 *
 * Memórias Póstumas has a hundred editions in the catalogue now, and until this
 * existed the app simply picked one for you. Page counts differ between editions
 * and so does the cover on your shelf, so guessing was never good enough.
 */
function Edicao(t: Tool) {
  const [pending, start] = useTransition();
  const [mine, setMine] = useState(t.myEditionId);

  return (
    <ul className="paper mt-6 divide-y divide-[var(--color-rule)] p-2">
      {t.editions.map((e) => {
        const on = mine === e.id;
        return (
          <li key={e.id}>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const next = on ? null : e.id;
                  await escolherEdicao(t.slug, t.workId, next);
                  setMine(next);
                })
              }
              className={[
                "tabular flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-[13px] transition-colors disabled:opacity-40",
                on ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]",
              ].join(" ")}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: on ? "var(--color-accent)" : "var(--color-rule)" }}
              />
              <span className="flex-1 truncate">
                {e.publisher ?? "editora desconhecida"}
                {e.year ? `, ${e.year}` : ""}
              </span>
              {e.pages && <span className="shrink-0 text-[var(--color-ink-faint)]">{e.pages} p.</span>}
              {on && <span className="shrink-0 text-[11px] uppercase tracking-[0.12em]">a minha</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
      {children}
    </span>
  );
}

function Field({
  name, label, ...rest
}: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        name={name}
        {...rest}
        className="mt-1.5 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
      />
    </label>
  );
}

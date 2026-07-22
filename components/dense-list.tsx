"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cover } from "@/components/cover";
import { Verdict } from "@/components/veredito";
import { AvatarStack } from "@/components/avatar";
import { saveBookEdit } from "@/app/livro/[slug]/curation-actions";
import { setRating, clearRating } from "@/app/livro/[slug]/actions";
import { toast } from "@/lib/toast";
import { VERDICTS, theirs } from "@/lib/veredito";
import { FORMAT_LABEL, STATUS_LABEL, type ShelfBook } from "@/lib/shelf-view";
import type { Opinion } from "@/lib/ratings";

/**
 * A lista densa. Ficha de biblioteca, não tabela de painel: um fio de 1px entre as
 * linhas em vez de caixa com borda, número tabular para os anos formarem uma coluna
 * que o olho desce, e nada de zebra. Zebra é o que se usa quando o alinhamento não
 * está fazendo o trabalho dele.
 *
 * As capas vêm junto: você acha um livro que é seu pela LOMBADA, não lendo o nome.
 *
 * E dá para EDITAR AQUI: clicar no título, no autor ou na editora abre o campo na
 * própria linha, e a nota abre as cinco palavras. Abrir a página inteira do livro
 * para corrigir uma editora era o caminho mais longo entre você e um erro de uma
 * letra. A correção é gravada com o seu nome, como toda correção no Gume.
 */
export function DenseList({
  books,
  opinions = {},
  focus,
  mine = false,
}: {
  books: ShelfBook[];
  opinions?: Record<string, Opinion>;
  /** O workId em foco pelo teclado. */
  focus?: string;
  /** Só o dono dá nota. O catálogo, qualquer pessoa logada corrige. */
  mine?: boolean;
}) {
  return (
    <div className="surface mt-8 px-6 py-3 sm:px-7">
      <div className="hidden grid-cols-12 gap-4 border-b border-[var(--color-rule)] py-3 pl-[52px] text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] sm:grid">
        <span className="col-span-4">título</span>
        <span className="col-span-2">autor</span>
        <span className="col-span-2">editora</span>
        <span className="col-span-2">nota</span>
        <span className="col-span-2 text-right">obra</span>
      </div>

      <ul>
        {books.map((b) => (
          <Row
            key={b.workId}
            book={b}
            opinion={opinions[b.workId]}
            focused={focus === b.workId}
            mine={mine}
          />
        ))}
      </ul>
    </div>
  );
}

function Row({
  book, opinion, focused, mine,
}: {
  book: ShelfBook;
  opinion?: Opinion;
  focused: boolean;
  mine: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  /** Qual campo está aberto, se algum. */
  const [editing, setEditing] = useState<null | "title" | "author" | "publisher" | "rating">(null);

  /** O que a tela já mostra, antes de o servidor responder. */
  const [shown, setShown] = useState(book);

  const save = (field: "title" | "author" | "publisher", value: string) => {
    const clean = value.trim();
    setEditing(null);
    if (!clean || clean === (shown[field] ?? "")) return;

    const before = shown;
    setShown({ ...shown, [field]: clean });

    start(async () => {
      try {
        await saveBookEdit(shown.slug, shown.workId, null, {
          title: field === "title" ? clean : shown.title,
          author: field === "author" ? clean : shown.author ?? "",
          publisher: field === "publisher" ? clean : shown.publisher ?? "",
        });
        router.refresh();
      } catch {
        setShown(before);
        toast("Não deu para guardar a correção.");
      }
    });
  };

  const rate = (value: number | null) => {
    const before = shown;
    setEditing(null);
    setShown({ ...shown, rating: value });

    start(async () => {
      try {
        if (value === null) await clearRating(shown.slug, shown.workId);
        else await setRating(shown.slug, shown.workId, value);
        router.refresh();
      } catch {
        setShown(before);
        toast("Não deu para guardar a nota.");
      }
    });
  };

  return (
    <li
      id={`livro-${book.workId}`}
      className={[
        "group border-b border-[var(--color-rule)] last:border-b-0",
        focused ? "bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]" : "",
        pending ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-4 rounded-[var(--radius-2)] px-2 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]">
        <Link href={`/livro/${shown.slug}`} className="cover-lift w-9 shrink-0">
          <Cover title={shown.title} author={shown.author} src={shown.coverUrl} />
        </Link>

        <div className="grid min-w-0 flex-1 grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-12">
          {/* título */}
          <div className="min-w-0 sm:col-span-4">
            {editing === "title" ? (
              <Field defaultValue={shown.title} onDone={(v) => save("title", v)} />
            ) : (
              <span className="flex items-center gap-2">
                <Link
                  href={`/livro/${shown.slug}`}
                  className="voice truncate text-[15px] leading-snug hover:underline"
                >
                  {shown.title}
                </Link>
                <Pencil onClick={() => setEditing("title")} />
                <span className="text-[11px] text-[var(--color-ink-faint)] sm:hidden">
                  {STATUS_LABEL[shown.status] ?? shown.status}
                </span>
              </span>
            )}
          </div>

          {/* autor */}
          <div className="min-w-0 sm:col-span-2">
            {editing === "author" ? (
              <Field defaultValue={shown.author ?? ""} onDone={(v) => save("author", v)} />
            ) : (
              <button
                onClick={() => setEditing("author")}
                className="w-full truncate text-left text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                {shown.author ?? "—"}
              </button>
            )}
          </div>

          {/* no celular o metadado vira uma linha honesta em vez de tabela que rola de lado */}
          <span className="flex flex-wrap items-center gap-x-2 text-[12px] text-[var(--color-ink-faint)] sm:hidden">
            {[
              shown.publisher,
              shown.format ? FORMAT_LABEL[shown.format] ?? shown.format : null,
              shown.firstPublished ? String(shown.firstPublished) : null,
            ]
              .filter(Boolean)
              .map((bit, i) => (
                <span key={i} className="tabular">{bit}</span>
              ))}
            {shown.rating !== null && <Verdict value={shown.rating} />}
          </span>

          {/* editora */}
          <div className="hidden min-w-0 sm:col-span-2 sm:block">
            {editing === "publisher" ? (
              <Field defaultValue={shown.publisher ?? ""} onDone={(v) => save("publisher", v)} />
            ) : (
              <button
                onClick={() => setEditing("publisher")}
                className="w-full truncate text-left text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                {shown.publisher ?? "—"}
              </button>
            )}
          </div>

          {/* a nota, em palavras */}
          <div className="hidden items-center gap-2 sm:col-span-2 sm:flex">
            {editing === "rating" ? (
              <span className="flex flex-wrap items-center gap-1">
                {VERDICTS.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => rate(v.value)}
                    title={v.mine}
                    className="pill border border-[var(--color-rule)] px-2 py-0.5 text-[11px] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
                  >
                    {v.value}
                  </button>
                ))}
                {shown.rating !== null && (
                  <button
                    onClick={() => rate(null)}
                    className="text-[11px] text-[var(--color-ink-faint)] underline underline-offset-2"
                  >
                    tirar
                  </button>
                )}
              </span>
            ) : (
              <button
                disabled={!mine}
                onClick={() => setEditing("rating")}
                className="text-left disabled:cursor-default"
              >
                {shown.rating !== null ? (
                  <Verdict value={shown.rating} />
                ) : (
                  <span className="text-[13px] text-[var(--color-ink-faint)]">—</span>
                )}
              </button>
            )}

            {opinion && (
              <span
                title={opinion.friends
                  .map((f) => `${f.name ?? f.handle} ${theirs(f.value)}`)
                  .join(" · ")}
              >
                <AvatarStack people={opinion.friends} size={16} max={3} />
              </span>
            )}
          </div>

          {/* o ano da OBRA, nunca o da edição */}
          <span className="tabular hidden text-right text-[13px] text-[var(--color-ink-soft)] sm:col-span-2 sm:block">
            {shown.firstPublished ?? "—"}
          </span>
        </div>
      </div>
    </li>
  );
}

/** Um campo que abre no lugar. Enter grava, Esc desiste, sair do campo grava. */
function Field({ defaultValue, onDone }: { defaultValue: string; onDone: (value: string) => void }) {
  return (
    <input
      autoFocus
      defaultValue={defaultValue}
      onBlur={(e) => onDone(e.currentTarget.value)}
      onKeyDown={(e) => {
        // j e k são letras aqui dentro, e não atalhos de navegação
        e.stopPropagation();
        if (e.key === "Enter") onDone(e.currentTarget.value);
        if (e.key === "Escape") onDone(defaultValue);
      }}
      className="w-full rounded-[var(--radius-2)] border border-[var(--color-ink)] bg-[var(--surface-2)] px-2 py-1 text-[14px] outline-none"
    />
  );
}

/** O lápis só aparece no hover: uma linha cheia de lápis é uma barra de ferramentas. */
function Pencil({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="corrigir"
      className="shrink-0 text-[11px] text-[var(--color-ink-faint)] opacity-0 transition-opacity hover:text-[var(--color-ink)] focus:opacity-100 group-hover:opacity-100"
    >
      ✎
    </button>
  );
}

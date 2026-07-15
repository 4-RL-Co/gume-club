"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addByHand } from "@/app/buscar/actions";
import type { Status } from "@/lib/library";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "NÃO ACHEI MEU LIVRO." Quinze segundos, e acabou.
 *
 *  O acervo do Gume é escolhido a mão, e não varrido da internet. Isso quer
 *  dizer que procurar um livro que ele não tem deixou de ser exceção: vai
 *  acontecer todo dia, e esta tela virou a rede de proteção do app inteiro.
 *
 *  Ela pedia NOVE CAMPOS: título, autor, editora, ISBN, ano da edição, ano da
 *  obra, páginas, formato e endereço da capa. Um formulário de nove campos, no
 *  fim de uma busca que JÁ FALHOU, é um formulário que ninguém preenche — e
 *  quem não preenche não fica sem o livro, fica sem o app.
 *
 *  Agora são dois: TÍTULO e AUTOR. O resto o Gume vai buscar sozinho (Google
 *  Books e Open Library), e o que ele não achar fica em branco mesmo, esperando
 *  um bibliotecário. O livro entra na estante NA HORA.
 *
 *  Os campos antigos não sumiram: ficaram atrás de um "mais detalhes" fechado,
 *  para quem está com o livro na mão e quer dar o ISBN. Quase ninguém vai abrir,
 *  e é essa a intenção.
 * ════════════════════════════════════════════════════════════════════
 */

const PRATELEIRAS = [
  { status: "want_to_read", label: "esperando" },
  { status: "reading", label: "lendo" },
  { status: "read", label: "lido" },
  { status: "did_not_finish", label: "abandonado" },
] as const;

export function ManualBookForm({ initialTitle = "" }: { initialTitle?: string }) {
  const [open, setOpen] = useState(false);
  const [detalhes, setDetalhes] = useState(false);
  const [prateleira, setPrateleira] = useState<Status>("want_to_read");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <div className="paper mt-8 p-5">
        <p className="voice text-[16px] leading-snug">{done} entrou na sua estante.</p>
        <p className="mt-1.5 text-[13px] text-[var(--color-ink-soft)]">
          Se a gente achar a capa e a editora, elas aparecem sozinhas.{" "}
          <Link href="/estante" className="underline decoration-[var(--color-ink)] underline-offset-4">
            ver estante
          </Link>
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-8 text-[13px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
      >
        Não achei meu livro. Quero cadastrar.
      </button>
    );
  }

  return (
    <form
      className="paper mt-8 p-5"
      action={(data: FormData) =>
        start(async () => {
          setError(null);
          try {
            const added = await addByHand({
              title: String(data.get("title") ?? ""),
              author: String(data.get("author") ?? ""),
              status: prateleira,
              publisher: String(data.get("publisher") ?? ""),
              isbn: String(data.get("isbn") ?? ""),
              year: String(data.get("year") ?? ""),
              pageCount: String(data.get("pageCount") ?? ""),
            });
            setDone(added.title);
          } catch {
            setError("Não deu para salvar. Confira o título e tente de novo.");
          }
        })
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="title" label="título" required autoFocus defaultValue={initialTitle} />
        <Field name="author" label="autor" />
      </div>

      {/* A prateleira é um botão, e não um menu: escolher entre quatro coisas visíveis
          é mais rápido que abrir uma lista para escolher entre as mesmas quatro. */}
      <div className="mt-4">
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          onde ele vai
        </span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {PRATELEIRAS.map((p) => (
            <button
              key={p.status}
              type="button"
              onClick={() => setPrateleira(p.status)}
              aria-pressed={prateleira === p.status}
              className="rounded-[var(--radius-control)] border px-3 py-1.5 text-[13px] font-medium transition-colors"
              style={
                prateleira === p.status
                  ? {
                      borderColor: "var(--color-ink)",
                      background: "var(--color-ink)",
                      color: "var(--color-canvas)",
                    }
                  : { borderColor: "var(--color-rule)", color: "var(--color-ink-soft)" }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fechado, e é para ficar fechado. Quem está com o livro na mão e quer dar o
          ISBN abre; todo mundo mais nem vê que existe. */}
      {!detalhes ? (
        <button
          type="button"
          onClick={() => setDetalhes(true)}
          className="mt-4 text-[12px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
        >
          mais detalhes
        </button>
      ) : (
        <div className="mt-4 grid gap-3 border-t border-[var(--color-rule)] pt-4 sm:grid-cols-2">
          <Field name="publisher" label="editora" />
          <Field name="isbn" label="ISBN" inputMode="numeric" />
          <Field name="year" label="ano da edição" inputMode="numeric" />
          <Field name="pageCount" label="páginas" inputMode="numeric" />
        </div>
      )}

      {error && <p className="mt-3 text-[13px] text-[var(--color-perigo)]">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pending ? "Procurando o resto" : "Pôr na estante"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          cancelar
        </button>
      </div>

      <p className="mt-3 text-[12px] text-[var(--color-ink-faint)]">
        Capa, editora e ano a gente procura sozinho. Você não precisa saber.
      </p>
    </form>
  );
}

function Field({
  name, label, ...rest
}: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {label}
      </span>
      <input
        name={name}
        {...rest}
        className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)]"
      />
    </label>
  );
}

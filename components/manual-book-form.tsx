"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addByHand, puxarPorIsbn } from "@/app/buscar/actions";
import type { Status } from "@/lib/library";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "NÃO ACHEI MEU LIVRO." A ficha inteira, e o código de barras faz o trabalho.
 *
 *  O acervo do Gume é escolhido a mão, e não varrido da internet. Procurar um livro que
 *  ele não tem não é exceção: acontece todo dia, e esta tela é a rede de proteção do app.
 *
 *  ═══ A HISTÓRIA DESTE FORMULÁRIO, EM DUAS VIRADAS ═══
 *
 *  Ele pediu NOVE campos. Ninguém preenchia — um formulário longo no fim de uma busca que
 *  já falhou é um formulário abandonado —, então ele foi cortado para DOIS (título e
 *  autor), com a máquina buscando o resto.
 *
 *  Só que a máquina buscava por TÍTULO, que é exatamente o que falha na edição brasileira
 *  obscura, que é exatamente o caso de quem chega aqui. O livro entrava magro: sem capa,
 *  sem editora, sem páginas. O corte resolveu o abandono e criou a ficha pela metade.
 *
 *  Agora a ficha é inteira E fácil, porque quem preenche não é a pessoa: é o **ISBN**.
 *  Digitou o código, a ficha se preenche na frente dela (título, autor, editora, ano,
 *  páginas e capa) e ela só confere e corrige. Um campo, e não seis.
 *
 *  Sem ISBN nada trava: título e autor continuam bastando, a máquina ainda tenta, e o que
 *  ela não achar fica em branco esperando um bibliotecário. O livro entra na hora.
 * ════════════════════════════════════════════════════════════════════
 */

const PRATELEIRAS = [
  { status: "want_to_read", label: "esperando" },
  { status: "reading", label: "lendo" },
  { status: "read", label: "lido" },
  { status: "did_not_finish", label: "abandonado" },
] as const;

/** O mesmo teste do servidor (asIsbn), aqui, porque lib/catalog fala com o banco. */
function ehIsbn(v: string): boolean {
  const d = v.replace(/[\s-]/g, "").toUpperCase();
  return /^\d{13}$/.test(d) || /^\d{9}[\dX]$/.test(d);
}

type Campos = {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  year: string;
  pageCount: string;
};

export function ManualBookForm({ initialTitle = "" }: { initialTitle?: string }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Campos>({
    title: initialTitle,
    author: "",
    isbn: "",
    publisher: "",
    year: "",
    pageCount: "",
  });
  const [capa, setCapa] = useState("");
  const [prateleira, setPrateleira] = useState<Status>("want_to_read");
  const [puxando, setPuxando] = useState(false);
  const [subindo, setSubindo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = (k: keyof Campos, v: string) => setF((p) => ({ ...p, [k]: v }));

  /**
   * O ISBN preenche a ficha. Dispara sozinho quando o código fica válido (10 ou 13
   * dígitos), então a pessoa não precisa descobrir que existe um botão.
   */
  const puxar = async (isbn: string) => {
    setPuxando(true);
    setAviso(null);
    try {
      const achado = await puxarPorIsbn(isbn);
      if (!achado) {
        setAviso("Não achei esse ISBN nas fontes. Pode preencher o resto na mão.");
        return;
      }
      setF((p) => ({
        ...p,
        title: achado.title || p.title,
        author: achado.author ?? p.author,
        publisher: achado.publisher ?? p.publisher,
        year: achado.publishedYear ? String(achado.publishedYear) : p.year,
        pageCount: achado.pageCount ? String(achado.pageCount) : p.pageCount,
        isbn: achado.isbn13 ?? p.isbn,
      }));
      if (achado.coverUrl) setCapa(achado.coverUrl);
      setAviso("Achei. Confira e corrija o que estiver errado.");
    } catch {
      setAviso("Não deu para consultar o ISBN agora. Pode preencher na mão.");
    } finally {
      setPuxando(false);
    }
  };

  const subirCapa = async (arquivo: File) => {
    setSubindo(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", arquivo);
      body.append("para", "capas");
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(typeof json.error === "string" ? json.error : "Não deu para subir a imagem.");
        return;
      }
      setCapa(json.url as string);
    } catch {
      setError("Não deu para subir a imagem. Tente outra.");
    } finally {
      setSubindo(false);
    }
  };

  if (done) {
    return (
      <div className="paper mt-8 p-5">
        <p className="voice text-[16px] leading-snug">{done} entrou na sua estante.</p>
        <p className="mt-1.5 text-[13px] text-[var(--color-ink-soft)]">
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
      action={() =>
        start(async () => {
          setError(null);
          try {
            const added = await addByHand({
              title: f.title,
              author: f.author,
              status: prateleira,
              publisher: f.publisher,
              isbn: f.isbn,
              year: f.year,
              pageCount: f.pageCount,
              coverUrl: capa,
            });
            setDone(added.title);
          } catch {
            setError("Não deu para salvar. Confira o título e tente de novo.");
          }
        })
      }
    >
      {/* ── O ISBN VEM PRIMEIRO, porque é ele que preenche o resto ──── */}
      <label className="block">
        <Rotulo>ISBN</Rotulo>
        <span className="mt-1 flex items-center gap-2">
          <input
            value={f.isbn}
            inputMode="numeric"
            placeholder="o código de barras da contracapa"
            onChange={(e) => {
              const v = e.target.value;
              set("isbn", v);
              if (ehIsbn(v)) void puxar(v);
            }}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)]"
          />
          {puxando && (
            <span className="shrink-0 text-[12px] text-[var(--color-ink-faint)]">procurando</span>
          )}
        </span>
        <span className="mt-1.5 block text-[12px] leading-relaxed text-[var(--color-ink-faint)]">
          Tem o livro na mão? Digite o ISBN e o resto se preenche sozinho. Se não tiver, é só
          preencher abaixo.
        </span>
      </label>

      {aviso && (
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-ink-soft)]" aria-live="polite">
          {aviso}
        </p>
      )}

      {/* ── A CAPA ─────────────────────────────────────────────────── */}
      <div className="mt-5 flex items-start gap-4">
        {capa.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={capa}
            src={capa.trim()}
            alt=""
            className="h-28 w-20 shrink-0 rounded-[var(--radius-2)] border border-[var(--color-rule)] object-cover"
          />
        ) : (
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-[var(--radius-2)] border border-dashed border-[var(--color-rule)] text-[11px] text-[var(--color-ink-faint)]">
            sem capa
          </div>
        )}

        <div className="min-w-0 flex-1">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-3 py-2 text-[13px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]">
            {subindo ? "subindo a imagem" : capa.trim() ? "trocar a capa" : "subir uma capa"}
            <input
              type="file"
              accept="image/*"
              disabled={subindo}
              onChange={(e) => {
                const a = e.target.files?.[0];
                if (a) void subirCapa(a);
              }}
              className="hidden"
            />
          </label>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-ink-faint)]">
            Se o ISBN achou a capa, ela já está aí. Pode trocar pela foto do seu exemplar.
          </p>
        </div>
      </div>

      {/* ── OS DADOS ───────────────────────────────────────────────── */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Campo label="título" value={f.title} onChange={(v) => set("title", v)} required autoFocus={!initialTitle} />
        <Campo label="autor" value={f.author} onChange={(v) => set("author", v)} />
        <Campo label="editora" value={f.publisher} onChange={(v) => set("publisher", v)} />
        <Campo label="ano da edição" value={f.year} onChange={(v) => set("year", v)} inputMode="numeric" />
        <Campo label="páginas" value={f.pageCount} onChange={(v) => set("pageCount", v)} inputMode="numeric" />
      </div>

      {/* A prateleira é um botão, e não um menu: escolher entre quatro coisas visíveis
          é mais rápido que abrir uma lista para escolher entre as mesmas quatro. */}
      <div className="mt-5">
        <Rotulo>onde ele vai</Rotulo>
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

      {error && <p className="mt-3 text-[13px] text-[var(--color-perigo)]">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || subindo || !f.title.trim()}
          className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pending ? "Pondo na estante" : "Pôr na estante"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          cancelar
        </button>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-ink-faint)]">
        O que ficar em branco, o Gume ainda tenta achar sozinho. Só o título é obrigatório.
      </p>
    </form>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
      {children}
    </span>
  );
}

function Campo({
  label, value, onChange, ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <Rotulo>{label}</Rotulo>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
        className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)]"
      />
    </label>
  );
}

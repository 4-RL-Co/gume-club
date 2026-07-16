"use client";

import { useState, useTransition } from "react";
import { saveBookEdit } from "@/app/livro/[slug]/curation-actions";
import { toast } from "@/lib/toast";
import { LIMITS } from "@/lib/limits";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ARRUMAR UM LIVRO: UM LUGAR SÓ, E A CAPA MORA COM OS OUTROS CAMPOS.
 *
 *  Antes havia DUAS telas para corrigir a mesma ficha, e elas se contradiziam: uma
 *  perguntava "o que está errado?" e mandava a capa para uma FILA; a outra era um
 *  formulário que trocava tudo na hora, a capa por um link colado. A pessoa achava as
 *  duas, não sabia qual usar, e a capa que ela "sugeria" sumia numa fila que só o
 *  bibliotecário via — num app onde o bibliotecário é ela mesma.
 *
 *  Agora é um formulário só. A capa é um campo como os outros: você sobe a imagem, e ela
 *  entra na hora, para todo mundo, com o seu nome no histórico. Sem fila. A fila de
 *  moderação continua no código, engatilhada, para o dia em que aparecer gente demais
 *  mexendo — mas esse dia não é hoje. Ver ai/DECISIONS.md ("sem fila de moderação agora").
 *
 *  ═══ O QUE A CAPA AINDA PROTEGE ═══
 *
 *  Trocar a capa muda a ficha COMPARTILHADA desta edição. Se a sua cópia só tem a capa
 *  diferente, ela não é uma correção: é OUTRA edição. O aviso mora ao lado do botão de
 *  capa, no exato momento em que a pessoa vai trocar a foto de todo mundo — é ali que ele
 *  serve para alguma coisa. Foi assim que o catálogo do Goodreads virou lixo: cada leitor
 *  ajustou a ficha comum até ela não descrever livro nenhum.
 * ════════════════════════════════════════════════════════════════════
 */
type Livro = {
  title: string;
  author: string | null;
  publisher: string | null;
  firstPublished: number | null;
  publishedYear: number | null;
  pageCount: number | null;
  format: string | null;
  isbn13: string | null;
  coverUrl: string | null;
};

const FORMATS = [
  ["paperback", "brochura"],
  ["hardcover", "capa dura"],
  ["ebook", "e-book"],
  ["audiobook", "audiolivro"],
  ["other", "outro"],
] as const;

export function Correcao({
  slug,
  workId,
  editionId,
  livro,
  temOutrasEdicoes,
}: {
  slug: string;
  workId: string;
  editionId: string | null;
  livro: Livro;
  temOutrasEdicoes: boolean;
}) {
  const [capa, setCapa] = useState(livro.coverUrl ?? "");
  const [subindo, setSubindo] = useState(false);
  const [recusa, setRecusa] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pending, start] = useTransition();

  // Subir a capa do computador. Vai para o nosso Blob, que já é uma origem aceita, então
  // o endereço volta pronto para entrar na ficha pela mesma porta dos outros campos.
  const subirCapa = async (arquivo: File) => {
    setSubindo(true);
    setRecusa(null);
    try {
      const body = new FormData();
      body.append("file", arquivo);
      body.append("para", "capas");
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setRecusa(typeof json.error === "string" ? json.error : "Não deu para subir a imagem. Tente outra.");
        return;
      }
      setCapa(json.url as string);
      setSalvo(false);
    } catch {
      setRecusa("Não deu para subir a imagem. Tente outra.");
    } finally {
      setSubindo(false);
    }
  };

  return (
    <form
      action={(data: FormData) =>
        start(async () => {
          setRecusa(null);
          const form = {
            title: String(data.get("title") ?? ""),
            author: String(data.get("author") ?? ""),
            publisher: String(data.get("publisher") ?? ""),
            firstPublished: String(data.get("firstPublished") ?? ""),
            publishedYear: String(data.get("publishedYear") ?? ""),
            pageCount: String(data.get("pageCount") ?? ""),
            format: String(data.get("format") ?? ""),
            isbn: String(data.get("isbn") ?? ""),
            coverUrl: capa,
            reason: String(data.get("reason") ?? ""),
          };
          try {
            const { erro } = await saveBookEdit(slug, workId, editionId, form);
            if (erro) {
              setRecusa(erro);
              return;
            }
            setSalvo(true);
            toast("Pronto. A sua correção vale para todo mundo, e fica com o seu nome.");
          } catch {
            setRecusa("Não deu para guardar a correção agora. O problema é nosso, e não seu.");
          }
        })
      }
    >
      <h3 className="text-[15px] text-[var(--color-ink)]">Arrumar este livro</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
        Você tem o livro na mão? Arrume o que estiver errado. Vale na hora, para todo mundo, e fica
        gravado com o seu nome. Dá para voltar atrás.
      </p>

      {/* ── A CAPA, COM O AVISO ONDE ELE SERVE ──────────────────────── */}
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
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2.5 text-[14px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]">
            {subindo ? "subindo a imagem" : capa.trim() ? "trocar a capa" : "subir uma capa"}
            <input
              type="file"
              accept="image/*"
              disabled={subindo}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void subirCapa(f);
              }}
              className="hidden"
            />
          </label>

          <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-ink-faint)]">
            Trocar a capa muda a ficha desta edição para todo mundo. Se a sua cópia só tem a capa
            diferente, ela é outra edição, e não uma correção.
            {temOutrasEdicoes && (
              <>
                {" "}
                <a href="#edicoes" className="underline decoration-[var(--color-rule)] underline-offset-2 hover:text-[var(--color-ink)]">
                  veja as outras edições
                </a>
                .
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── OS DADOS ─────────────────────────────────────────────────── */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Campo name="title" label="título" defaultValue={livro.title} required maxLength={LIMITS.title} />
        <Campo name="author" label="autor" defaultValue={livro.author ?? ""} maxLength={LIMITS.author} />
        <Campo name="publisher" label="editora" defaultValue={livro.publisher ?? ""} maxLength={LIMITS.publisher} />
        <Campo name="firstPublished" label="ano da obra" defaultValue={livro.firstPublished ?? ""} inputMode="numeric" />
        <Campo name="publishedYear" label="ano da edição" defaultValue={livro.publishedYear ?? ""} inputMode="numeric" />
        <Campo name="pageCount" label="páginas" defaultValue={livro.pageCount ?? ""} inputMode="numeric" />
        <Campo name="isbn" label="ISBN" defaultValue={livro.isbn13 ?? ""} inputMode="numeric" />
        <label className="block">
          <Rotulo>formato</Rotulo>
          <select
            name="format"
            defaultValue={livro.format ?? "paperback"}
            className="mt-1.5 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px]"
          >
            {FORMATS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <Campo name="reason" label="o que você mudou (opcional)" placeholder="a editora estava errada" maxLength={LIMITS.note} />
        </div>
      </div>

      {recusa && (
        <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-perigo)]" aria-live="polite">
          {recusa}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || subindo}
          className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pending ? "salvando" : "salvar"}
        </button>
        {salvo && !pending && <span className="text-[12px] text-[var(--color-ink-faint)]">salvo</span>}
      </div>
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
  name, label, ...rest
}: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <Rotulo>{label}</Rotulo>
      <input
        name={name}
        {...rest}
        className="mt-1.5 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
      />
    </label>
  );
}

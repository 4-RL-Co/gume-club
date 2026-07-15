"use client";

import { useState, useTransition } from "react";
import { ClipboardList } from "lucide-react";
import { Cover } from "@/components/cover";
import { matchList, addMany, type Match } from "@/app/buscar/actions";
import { LIMITS } from "@/lib/limits";
import { toast } from "@/lib/toast";
import type { Status } from "@/lib/library";

const SHELVES: { status: Status; label: string }[] = [
  { status: "want_to_read", label: "esperando" },
  { status: "reading", label: "lendo" },
  { status: "read", label: "lido" },
];

/**
 * Cole uma lista. Um título por linha.
 *
 * Seus amigos têm planilha, não têm arquivo de exportação: eles têm um bloco de
 * notas com quarenta títulos, e digitar quarenta buscas é o que fazia essa lista
 * nunca sair do bloco de notas.
 *
 * O app mostra o que achou ANTES de escrever qualquer coisa na sua estante, e você
 * desmarca o que ele errou. Casar título em texto livre erra, e um erro que entra
 * sozinho na estante é um erro que ninguém percebe por dois anos.
 */
export function PasteList() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [off, setOff] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();

  /** As mesmas linhas que o servidor vai contar: aparadas, e sem as vazias. */
  const linhas = text.split("\n").filter((l) => l.trim().length > 0).length;
  const sobra = linhas - LIMITS.listLines;

  const found = (matches ?? []).filter((m) => m.hit);
  const missed = (matches ?? []).filter((m) => !m.hit);
  const chosen = (matches ?? [])
    .map((m, i) => ({ m, i }))
    .filter(({ m, i }) => m.hit && !off.has(i))
    .map(({ m }) => m.hit!);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-8 flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
      >
        <ClipboardList size={16} strokeWidth={1.25} />
        colar uma lista de títulos
      </button>
    );
  }

  return (
    <section className="surface mt-8 p-6 sm:p-7">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        colar uma lista
      </h2>

      {!matches ? (
        <>
          <p className="mt-4 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
            Um título por linha. Se você tiver o autor, escreva depois de um traço.
          </p>

          {/* O teto de verdade deste campo é de LINHAS (o aviso logo abaixo cuida disso),
              e o de caracteres existe do mesmo jeito: cem linhas de duzentos caracteres.
              Ele trava, em vez de deixar o servidor cortar calado. */}
          <textarea
            autoFocus
            rows={8}
            value={text}
            maxLength={LIMITS.listLines * LIMITS.listLine}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Dom Casmurro — Machado de Assis\nGrande Sertão: Veredas\nA hora da estrela"}
            className="mt-4 w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-4 text-[15px] leading-relaxed outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
          />

          {/**
           * ═══ O TETO É DE LINHAS, E ELE ERA MUDO ═══
           *
           * O servidor fica com as cem primeiras linhas e joga o resto fora. Quem colasse
           * uma lista de duzentos livros procurava, via cem, e ia embora achando que os
           * outros cem não estavam no acervo — quando a verdade é que ninguém procurou por
           * eles.
           *
           * Aqui não dá para travar a digitação (o teto não é de caracteres), então o
           * campo AVISA, e diz o que fazer: colar o resto numa segunda vez.
           */}
          {sobra > 0 && (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-perigo)]">
              São {linhas} linhas, e o Gume procura {LIMITS.listLines} por vez. As últimas {sobra}{" "}
              ficam de fora — cole o resto numa segunda leva.
            </p>
          )}

          <div className="mt-4 flex items-center gap-4">
            <button
              disabled={pending || text.trim().length === 0}
              onClick={() => start(async () => setMatches(await matchList(text)))}
              className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
            >
              {pending ? "procurando" : "procurar todos"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              deixa
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 text-[14px] text-[var(--color-ink-soft)]">
            {found.length} {found.length === 1 ? "achado" : "achados"}
            {missed.length > 0 && `, ${missed.length} sem resposta`}. Desmarque o que estiver errado.
          </p>

          <ul className="mt-5 flex flex-col gap-2">
            {matches.map((m, i) => {
              const on = m.hit && !off.has(i);
              return (
                <li key={i}>
                  <button
                    disabled={!m.hit}
                    onClick={() =>
                      setOff((prev) => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        return next;
                      })
                    }
                    className="surface-2 flex w-full items-center gap-4 p-3 text-left disabled:opacity-50"
                    style={{
                      borderColor: on ? "color-mix(in srgb, var(--color-accent) 50%, transparent)" : undefined,
                    }}
                  >
                    {m.hit ? (
                      <>
                        <span className="cover-lift w-8 shrink-0">
                          <Cover title={m.hit.title} author={m.hit.author} src={m.hit.coverUrl} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="voice block truncate text-[15px]">{m.hit.title}</span>
                          <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                            {m.hit.author ?? "autor desconhecido"} · você escreveu &ldquo;{m.line}&rdquo;
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                          {on ? "entra" : "fora"}
                        </span>
                      </>
                    ) : (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-[var(--color-ink-soft)]">
                          {m.line}
                        </span>
                        <span className="block text-[12px] text-[var(--color-ink-faint)]">
                          não achei em lugar nenhum
                        </span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {chosen.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-2 text-[13px] text-[var(--color-ink-soft)]">
                pôr {chosen.length} {chosen.length === 1 ? "livro" : "livros"} em
              </span>
              {SHELVES.map((s) => (
                <button
                  key={s.status}
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const n = await addMany(chosen, s.status);
                      toast(`${n} ${n === 1 ? "livro entrou" : "livros entraram"} na estante.`);
                      setMatches(null);
                      setText("");
                      setOff(new Set());
                      setOpen(false);
                    })
                  }
                  className="pill border border-[var(--color-rule)] px-4 py-2 text-[14px] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

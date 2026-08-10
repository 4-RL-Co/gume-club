"use client";

import { useState, useTransition } from "react";
import { Layers, X } from "lucide-react";
import { ligarConjunto, procurarConjuntos, soltarConjunto } from "@/app/livro/[slug]/colecao-actions";
import { LIMITS } from "@/lib/limits";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "ESTE VOLUME FAZ PARTE DE QUAL COLEÇÃO?"
 *
 *  ═══ POR QUE ISTO EXISTE ═══
 *
 *  Os conjuntos vinham todos da AniList, e só cobriam mangá conhecido. O dono tinha
 *  três volumes de Hellsing Deluxe fora de conjunto — livros de verdade, na estante
 *  dele, e o app não sabia que eram uma coleção.
 *
 *  ═══ PROCURAR ANTES DE CRIAR, E ISSO É O DESENHO INTEIRO ═══
 *
 *  O campo procura o que já existe e só oferece "criar" depois. Sem isso, o segundo
 *  colecionador de Hellsing cadastra o mesmo conjunto de novo, e o app passa a ter
 *  duas versões da mesma verdade — a duplicata que este acervo passou o dia
 *  consertando.
 *
 *  ═══ O NÚMERO DO VOLUME NÃO É OPCIONAL ═══
 *
 *  Um conjunto sem número é uma pilha. Sem ele a tela não sabe ordenar nem dizer qual
 *  falta, e "3 de 10" apareceria com os três em ordem aleatória.
 * ════════════════════════════════════════════════════════════════════
 */
type Achado = { id: string; titulo: string; publisher: string | null; total: number | null; volumes: number };

export function ConjuntoDoLivro({
  slug, workId, atual, volumeAtual,
}: {
  slug: string;
  workId: string;
  /** O conjunto a que ele já pertence, se pertence. */
  atual: { titulo: string; total: number | null } | null;
  volumeAtual: number | null;
}) {
  const [abrindo, setAbrindo] = useState(false);
  const [termo, setTermo] = useState("");
  const [achados, setAchados] = useState<Achado[]>([]);
  const [volume, setVolume] = useState(String(volumeAtual ?? ""));
  const [total, setTotal] = useState("");
  const [pending, start] = useTransition();

  const procurar = (q: string) => {
    setTermo(q);
    if (q.trim().length < 2) { setAchados([]); return; }
    start(async () => setAchados(await procurarConjuntos(q)));
  };

  const ligar = (escolha: { conjuntoId: string } | { titulo: string; total: number; publisher: string | null }) => {
    const n = Number(volume);
    if (!Number.isFinite(n) || n < 1) return;
    start(async () => {
      await ligarConjunto(slug, workId, escolha, n);
      setAbrindo(false);
    });
  };

  if (atual && !abrindo) {
    return (
      <p className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-[var(--color-ink-soft)]">
        <Layers size={14} strokeWidth={1.5} aria-hidden className="text-[var(--color-ink-faint)]" />
        <span>
          {atual.titulo}
          {volumeAtual ? `, volume ${volumeAtual}` : ""}
          {atual.total ? ` · ${atual.total} volumes` : ""}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => { await soltarConjunto(slug, workId); })}
          className="text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-40"
        >
          tirar
        </button>
      </p>
    );
  }

  if (!abrindo) {
    return (
      <button
        type="button"
        onClick={() => setAbrindo(true)}
        className="mt-4 flex items-center gap-2 text-[13px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
      >
        <Layers size={14} strokeWidth={1.5} aria-hidden />
        este volume faz parte de uma coleção?
      </button>
    );
  }

  const podeCriar = termo.trim().length >= 2 && Number(volume) >= 1;

  return (
    <div className="mt-4 rounded-[var(--radius-2)] border border-[var(--color-rule)] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-[var(--color-ink-soft)]">
          Procure a coleção. Se ela ainda não existir, você pode criar.
        </p>
        <button type="button" onClick={() => setAbrindo(false)} aria-label="fechar">
          <X size={15} strokeWidth={1.5} className="text-[var(--color-ink-faint)]" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={termo}
          onChange={(e) => procurar(e.target.value)}
          maxLength={LIMITS.shelfName}
          placeholder="Hellsing Deluxe Edition"
          className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
        />
        <input
          value={volume}
          onChange={(e) => setVolume(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="vol."
          aria-label="número do volume"
          className="tabular w-20 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
        />
      </div>

      {/* O QUE JÁ EXISTE vem primeiro, sempre: criar é o último recurso, e não o
          primeiro botão. É isto que impede o segundo colecionador de Hellsing de
          cadastrar o mesmo conjunto de novo. */}
      {achados.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {achados.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                disabled={pending || Number(volume) < 1}
                onClick={() => ligar({ conjuntoId: a.id })}
                className="w-full rounded-[var(--radius-2)] px-3 py-2 text-left text-[14px] text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] hover:text-[var(--color-ink)] disabled:opacity-40"
              >
                {a.titulo}
                <span className="ml-2 text-[12px] text-[var(--color-ink-faint)]">
                  {a.total ? `${a.total} volumes` : `${a.volumes} cadastrados`}
                  {a.publisher ? ` · ${a.publisher}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {podeCriar && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-rule)] pt-3">
          <span className="text-[13px] text-[var(--color-ink-faint)]">não achou? crie</span>
          <input
            value={total}
            onChange={(e) => setTotal(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="total"
            aria-label="quantos volumes tem a coleção"
            className="tabular w-24 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
          />
          <button
            type="button"
            disabled={pending || Number(total) < 1}
            onClick={() => ligar({ titulo: termo.trim(), total: Number(total), publisher: null })}
            className="rounded-[var(--radius-control)] border border-[var(--color-rule)] px-3 py-2 text-[13px] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
          >
            criar “{termo.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}

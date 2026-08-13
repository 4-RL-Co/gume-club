"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Cover } from "@/components/cover";
import { LIMITS } from "@/lib/limits";
import { adicionarVolume } from "@/app/colecao/actions";
import type { Hit } from "@/lib/catalog";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "ADICIONAR UM VOLUME", DE DENTRO DA PRÓPRIA COLEÇÃO.
 *
 *  O pedido do dono: a coleção Dostoiévski/Martin Claret estava faltando
 *  livro, e ele queria "personalizar" — não uma coleção pessoal solta (o
 *  conjunto continua sendo FATO de edição, não opinião; ver lib/conjuntos.ts
 *  e app/colecao/actions.ts), mas uma porta pra completar o que falta sem
 *  precisar navegar até a página de cada livro.
 *
 *  ═══ SÓ O CATÁLOGO DA CASA, POR AGORA ═══
 *
 *  A busca aqui filtra pra `source === "gume"`: um resultado vindo de fora
 *  (OpenLibrary/Google ao vivo) ainda não tem `workId` — precisaria ganhar
 *  uma ficha primeiro, do jeito que o Cmd+K já faz em duas etapas. Achar o
 *  livro que falta, se ele ainda não está na casa, continua sendo abri-lo
 *  pela busca geral e depois usar "este volume faz parte de uma coleção?"
 *  na própria página dele (components/conjunto-do-livro.tsx) — este atalho
 *  cobre o caso comum (o livro já existe, só não está ligado ainda).
 * ════════════════════════════════════════════════════════════════════
 */
export function AdicionarVolume({
  conjuntoId, conjuntoSlug, proximoVolume,
}: {
  conjuntoId: string;
  conjuntoSlug: string;
  /** O próximo número sugerido — quantos volumes já existem, mais um. Editável. */
  proximoVolume: number;
}) {
  const [abrindo, setAbrindo] = useState(false);
  const [termo, setTermo] = useState("");
  const [achados, setAchados] = useState<Hit[]>([]);
  const [escolhido, setEscolhido] = useState<Hit | null>(null);
  const [volume, setVolume] = useState(String(proximoVolume));
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const procurar = (q: string) => {
    setTermo(q);
    setEscolhido(null);
    setErro(null);
    if (q.trim().length < 2) { setAchados([]); return; }
    start(async () => {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(q)}`);
      if (!res.ok) { setAchados([]); return; }
      const json = await res.json();
      // Só o que já está na casa: precisa de slug pra virar workId.
      const doCatalogo: Hit[] = (json.livros ?? []).filter(
        (h: Hit) => h.source === "gume" && h.slug,
      );
      setAchados(doCatalogo);
    });
  };

  const adicionar = () => {
    if (!escolhido?.slug) return;
    const n = Number(volume);
    if (!Number.isFinite(n) || n < 1) { setErro("o número do volume precisa ser 1 ou mais"); return; }

    start(async () => {
      const { erro } = await adicionarVolume(conjuntoId, conjuntoSlug, escolhido.slug!, n);
      if (erro) { setErro(erro); return; }
      setAbrindo(false);
      setTermo("");
      setAchados([]);
      setEscolhido(null);
    });
  };

  if (!abrindo) {
    return (
      <button
        type="button"
        onClick={() => setAbrindo(true)}
        className="mt-6 flex items-center gap-1.5 text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
      >
        <Plus size={13} strokeWidth={1.5} aria-hidden />
        adicionar um volume
      </button>
    );
  }

  return (
    <div className="mt-6 rounded-[var(--radius-2)] border border-[var(--color-rule)] p-4 text-left">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-[var(--color-ink-soft)]">
          Procure o livro que falta nesta coleção.
        </p>
        <button
          type="button"
          onClick={() => { setAbrindo(false); setTermo(""); setAchados([]); setEscolhido(null); setErro(null); }}
          aria-label="fechar"
        >
          <X size={15} strokeWidth={1.5} className="text-[var(--color-ink-faint)]" />
        </button>
      </div>

      {!escolhido ? (
        <>
          <input
            value={termo}
            onChange={(e) => procurar(e.target.value)}
            maxLength={LIMITS.title}
            placeholder="título ou autor"
            autoFocus
            className="mt-3 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
          />

          {achados.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {achados.map((a) => (
                <li key={a.slug}>
                  <button
                    type="button"
                    onClick={() => setEscolhido(a)}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-2)] px-2 py-2 text-left hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]"
                  >
                    <span className="w-8 shrink-0">
                      <Cover title={a.title} author={a.author} src={a.coverUrl} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-[var(--color-ink)]">{a.title}</span>
                      {a.author && (
                        <span className="block truncate text-[11px] text-[var(--color-ink-faint)]">{a.author}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {termo.trim().length >= 2 && achados.length === 0 && !pending && (
            <p className="mt-3 text-[12px] text-[var(--color-ink-faint)]">
              Nada com esse nome, ainda ligado a nenhuma coleção, já na casa. Se o livro nem
              está no catálogo, abra-o pela busca geral primeiro.
            </p>
          )}
        </>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="w-8 shrink-0">
            <Cover title={escolhido.title} author={escolhido.author} src={escolhido.coverUrl} />
          </span>
          <span className="min-w-0 flex-1 text-[13px] text-[var(--color-ink)]">{escolhido.title}</span>
          <input
            value={volume}
            onChange={(e) => setVolume(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            aria-label="número do volume"
            className="tabular w-16 shrink-0 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-2 py-2 text-center text-[14px] outline-none focus:border-[var(--color-ink)]"
          />
          <button
            type="button"
            disabled={pending}
            onClick={adicionar}
            className="shrink-0 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-3 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-50"
          >
            {pending ? "adicionando…" : "adicionar"}
          </button>
          <button
            type="button"
            onClick={() => setEscolhido(null)}
            className="shrink-0 text-[12px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            trocar
          </button>
        </div>
      )}

      {erro && <p className="mt-3 text-[13px] text-[var(--color-perigo)]">{erro}</p>}
    </div>
  );
}

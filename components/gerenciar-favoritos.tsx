"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Crown, X, Search } from "lucide-react";
import { Cover } from "@/components/cover";
import { coroarAction, tirarFavoritoAction, favoritarDoPerfilAction } from "@/app/perfil/actions";
import { semAcento } from "@/lib/texto";
import { toast } from "@/lib/toast";
import type { FavoritoBook } from "@/lib/favoritos";

/**
 * ════════════════════════════════════════════════════════════════════
 *  GERENCIAR OS FAVORITOS. Os cinco juntos, pra escolher entre eles — e
 *  também pra ACRESCENTAR, sem sair da tela de configuração.
 *
 *  "a parte de livros favoritos tem que ficar na edição do perfil pq é uma
 *  seção do perfil" — o print do yourgamerprofile.com mostrou o porquê: lá a
 *  busca mora DENTRO da própria tela de configuração ("Buscar jogos pelo
 *  nome..."), e não só na ficha de cada jogo. A primeira versão daqui só
 *  favoritava pela ficha do livro; agora dá pra fazer os dois.
 *
 *  Favoritar continua exigindo ter lido (lib/favoritos.ts) — a busca só
 *  oferece o que já pode virar favorito, então não existe like poder tentar e
 *  ouvir "não" aqui dentro.
 *
 *  Coroar precisa ver os cinco lado a lado: é uma escolha ENTRE eles, e só
 *  faz sentido aqui, nunca na ficha de um livro só.
 * ════════════════════════════════════════════════════════════════════
 */
export function GerenciarFavoritos({
  favoritos, favoritaveis,
}: {
  favoritos: FavoritoBook[];
  favoritaveis: FavoritoBook[];
}) {
  const [lista, setLista] = useState(favoritos);
  const [restam, setRestam] = useState(favoritaveis);
  const [busca, setBusca] = useState("");
  const [pending, start] = useTransition();

  const cheio = lista.length >= 5;

  const achados = useMemo(() => {
    const q = semAcento(busca);
    if (!q) return [];
    return restam
      .filter((f) => semAcento(f.title).includes(q) || semAcento(f.author ?? "").includes(q))
      .slice(0, 8);
  }, [busca, restam]);

  const coroar = (workId: string) => {
    setLista((prev) => {
      const alvo = prev.find((f) => f.workId === workId);
      if (!alvo) return prev;
      return [alvo, ...prev.filter((f) => f.workId !== workId)];
    });
    start(async () => {
      await coroarAction(workId);
    });
  };

  const tirar = (workId: string) => {
    const saiu = lista.find((f) => f.workId === workId);
    setLista((prev) => prev.filter((f) => f.workId !== workId));
    if (saiu) setRestam((prev) => [...prev, { ...saiu, position: 0 }]);
    start(async () => {
      await tirarFavoritoAction(workId);
    });
  };

  const adicionar = (livro: FavoritoBook) => {
    setLista((prev) => [...prev, { ...livro, position: prev.length + 1 }]);
    setRestam((prev) => prev.filter((f) => f.workId !== livro.workId));
    setBusca("");
    start(async () => {
      const r = await favoritarDoPerfilAction(livro.workId);
      if (!r.ok) {
        // Alguém favoritou pela ficha do livro entre a busca e o clique — o
        // otimista desfaz, e a pessoa sabe por quê.
        setLista((prev) => prev.filter((f) => f.workId !== livro.workId));
        setRestam((prev) => [...prev, livro]);
        toast(r.erro);
      }
    });
  };

  return (
    <div>
      {lista.length === 0 && (
        <p className="mb-5 text-[14px] text-[var(--color-ink-soft)]">
          Nenhum favorito ainda. Escolha até cinco livros que você já leu.
        </p>
      )}

      {lista.length > 0 && (
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {lista.map((f, i) => (
            <li key={f.slug} className="flex flex-col items-center gap-2">
              <div className="relative w-full">
                {/* A posição 1 É a coroa — nunca um selo à parte que pudesse
                    discordar dela. Ver lib/favoritos.ts. */}
                {i === 0 && (
                  <span
                    className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: "var(--color-accent)" }}
                    aria-label="o favorito"
                  >
                    <Crown size={13} strokeWidth={2} className="text-[var(--color-on-accent)]" />
                  </span>
                )}
                <Link
                  href={`/livro/${f.slug}`}
                  className="cover-lift block rounded-[var(--radius-2)]"
                  title={f.title}
                  style={i === 0 ? { boxShadow: `0 0 0 2px color-mix(in srgb, var(--color-accent) 55%, transparent)` } : undefined}
                >
                  <Cover title={f.title} author={f.author} src={f.coverUrl} />
                </Link>
              </div>

              <span className="line-clamp-2 text-center text-[12px] leading-snug text-[var(--color-ink-soft)]">
                {f.title}
              </span>

              <div className="flex items-center gap-2">
                {i !== 0 && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => coroar(f.workId)}
                    className="text-[11px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-40"
                  >
                    coroar
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`tirar ${f.title} dos favoritos`}
                  disabled={pending}
                  onClick={() => tirar(f.workId)}
                  className="text-[var(--color-ink-faint)] hover:text-[var(--color-perigo)] disabled:opacity-40"
                >
                  <X size={13} strokeWidth={1.75} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cheio ? (
        <p className="mt-4 text-[13px] text-[var(--color-ink-faint)]">
          Os cinco lugares estão ocupados. Tire um para pôr outro.
        </p>
      ) : (
        <div className="relative mt-5 max-w-sm">
          <Search
            size={15}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="buscar entre os livros que você já leu…"
            aria-label="buscar um livro para favoritar"
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent py-2.5 pl-10 pr-4 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
          />

          {busca.trim() && (
            <ul className="surface absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-72 overflow-y-auto p-2">
              {achados.length === 0 ? (
                <li className="px-3 py-2 text-[13px] text-[var(--color-ink-faint)]">
                  Nenhum livro lido casa com &quot;{busca.trim()}&quot;.
                </li>
              ) : (
                achados.map((f) => (
                  <li key={f.slug}>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => adicionar(f)}
                      className="flex w-full items-center gap-3 rounded-[var(--radius-2)] px-3 py-2 text-left hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] disabled:opacity-40"
                    >
                      <span className="w-8 shrink-0">
                        <Cover title={f.title} author={f.author} src={f.coverUrl} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-[var(--color-ink)]">{f.title}</span>
                        {f.author && (
                          <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">{f.author}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

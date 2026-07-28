"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, Search } from "lucide-react";
import { porLivroNaEstante } from "@/app/estante/[slug]/actions";

/**
 * ════════════════════════════════════════════════════════════════════
 *  PROCURAR UM LIVRO E PÔR NA ESTANTE, SEM SAIR DA ESTANTE.
 *
 *  ═══ O RELATO QUE FEZ ISTO EXISTIR ═══
 *
 *      "Tava tentando criar uma coleção aqui, mas não entendi como é a
 *       dinâmica de colar um livro ali."
 *
 *  Dava para pôr livro numa estante, e só de UM lugar: a página do livro. A
 *  estante vazia dizia "abra um livro e coloque ele aqui", em texto seco, sem
 *  link, e mandava a pessoa para longe da tela em que ela estava.
 *
 *  Quem abre uma estante vazia quer encher AQUELA estante. Mandar ela procurar
 *  a porta em outro cômodo é o mesmo erro que já tinha acontecido uma vez com
 *  este recurso (ver o comentário em components/book-panel.tsx), com outra
 *  roupa: a função existia, o caminho até ela não.
 *
 *  ═══ SÓ O NOSSO ACERVO, E ELE DIZ ISSO ═══
 *
 *  Esta busca não sai para a internet, e é decisão e não economia: só dá para
 *  guardar numa estante um livro que já existe no catálogo. Livro de fora entra
 *  pela busca principal, que sabe trazer da Open Library e criar a ficha, e essa
 *  é uma operação de catálogo, não de curadoria.
 *
 *  ═══ E ELA DISTINGUE "NÃO ACHEI" DE "NÃO CONSEGUI PERGUNTAR" ═══
 *
 *  A lei mais cara deste projeto (ver AGENTS.md). O limite de requisições
 *  devolve lista vazia com status 429, e ler aquilo como "nenhum resultado"
 *  ensina a pessoa que o acervo não tem o livro que ele tem. São três estados
 *  diferentes na tela, e nunca um silêncio só.
 * ════════════════════════════════════════════════════════════════════
 */

type Achado = { title: string; author: string | null; slug?: string };

export function PorNaEstante({
  slug,
  collectionId,
}: {
  slug: string;
  collectionId: string;
}) {
  const [q, setQ] = useState("");
  const [achados, setAchados] = useState<Achado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [falha, setFalha] = useState<"demais" | "caiu" | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const aborter = useRef<AbortController | null>(null);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setAchados([]);
      setFalha(null);
      return;
    }

    // Espera a pessoa parar de digitar. Sem isto, "tolstoi" são sete consultas,
    // e as seis primeiras são sobre palavras que ninguém quis procurar.
    const timer = setTimeout(async () => {
      aborter.current?.abort();
      const ctrl = new AbortController();
      aborter.current = ctrl;
      setBuscando(true);
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });

        // Ver o cabeçalho: uma lista vazia com 429 não é "não achei".
        if (!res.ok) {
          setAchados([]);
          setFalha(res.status === 429 ? "demais" : "caiu");
          return;
        }

        setFalha(null);
        const json = await res.json();
        setAchados((json.livros ?? []).filter((l: Achado) => l.slug).slice(0, 8));
      } catch (e) {
        // Abortar é o comportamento normal de quem continua digitando, e não uma falha.
        if ((e as Error)?.name !== "AbortError") setFalha("caiu");
      } finally {
        setBuscando(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [q]);

  const guardar = (livro: Achado) =>
    start(async () => {
      setRecado(null);
      const r = await porLivroNaEstante(slug, collectionId, livro.slug!);

      if (!r.ok) {
        setRecado("Não deu para guardar esse agora. Tente de novo.");
        return;
      }

      // "Guardei" e "já estava aqui" são fatos diferentes, e o segundo não é erro.
      // Dizer "guardado" para um livro que já estava faria a pessoa procurar duas
      // vezes o mesmo livro achando que a primeira não funcionou.
      setRecado(r.novo ? `${livro.title} entrou na estante.` : `${livro.title} já estava aqui.`);
      setQ("");
      setAchados([]);
    });

  return (
    <div className="mt-6">
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          pôr um livro nesta estante
        </span>
        <div className="relative mt-2 max-w-md">
          <Search
            size={15}
            strokeWidth={1.5}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="procure pelo título ou pelo autor"
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent py-2.5 pl-9 pr-3 text-[15px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
          />
        </div>
      </label>

      {recado && (
        <p className="mt-2 text-[13px] text-[var(--color-ink-soft)]">{recado}</p>
      )}

      {falha === "demais" && (
        <p className="mt-2 max-w-md text-[13px] text-[var(--color-ink-soft)]">
          Muitas buscas em pouco tempo. Espere um minuto e procure de novo.
        </p>
      )}
      {falha === "caiu" && (
        <p className="mt-2 max-w-md text-[13px] text-[var(--color-ink-soft)]">
          A busca não respondeu agora. Isso é do nosso lado, e tentar de novo costuma
          resolver.
        </p>
      )}

      {/* Nada encontrado, e a busca respondeu de verdade. É a única situação em que
          dizer "não temos" é honesto. */}
      {!falha && !buscando && q.trim().length >= 2 && achados.length === 0 && (
        <p className="mt-2 max-w-md text-[13px] text-[var(--color-ink-soft)]">
          Não achamos esse livro no acervo. Procure ele na busca lá de cima: de lá dá para
          trazer um livro novo para o Gume.
        </p>
      )}

      {achados.length > 0 && (
        <ul className="mt-3 flex max-w-md flex-col gap-0.5">
          {achados.map((livro) => (
            <li key={livro.slug}>
              <button
                onClick={() => guardar(livro)}
                disabled={pending}
                className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-2 py-2 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] disabled:opacity-40"
              >
                <Plus
                  size={15}
                  strokeWidth={1.5}
                  aria-hidden
                  className="shrink-0 text-[var(--color-ink-faint)]"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-[var(--color-ink)]">
                    {livro.title}
                  </span>
                  {livro.author && (
                    <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                      {livro.author}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

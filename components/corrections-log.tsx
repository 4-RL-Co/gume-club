"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { reverterCorrecao } from "@/app/livro/[slug]/correction-actions";
import { toast } from "@/lib/toast";
import type { Correcao } from "@/lib/corrections-view";

/**
 * O histórico de correções. PÚBLICO, com o nome de quem fez, para sempre.
 *
 * É isto, e não uma permissão, que torna o vandalismo caro: quem estraga uma ficha
 * comum assina embaixo, e a assinatura não sai mais. Foi por isso que a Wikipédia
 * conseguiu ser aberta sem virar terra de ninguém.
 *
 * A reversão é ação de bibliotecário, e ela TAMBÉM entra no log: um histórico que
 * se apaga não é histórico, é uma versão dos fatos.
 */
export function CorrectionsLog({
  slug,
  correcoes,
  souBibliotecario,
}: {
  slug: string;
  correcoes: Correcao[];
  souBibliotecario: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (correcoes.length === 0) {
    return (
      <p className="text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
        Ninguém corrigiu nada nesta ficha ainda. Se você tem o livro na mão e um dado está errado,
        você é a pessoa certa para arrumar.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {correcoes.map((c) => {
        const revisionId = c.id.split(":")[0]!;
        const quem = c.name ?? c.handle ?? "alguém";

        return (
          <li key={c.id} className="flex items-start gap-3">
            <Avatar src={c.image} name={c.name} handle={c.handle ?? "?"} size={28} />

            <div className="min-w-0 flex-1">
              <p
                className={[
                  "text-[14px] leading-relaxed",
                  c.revertedAt ? "text-[var(--color-ink-faint)] line-through" : "text-[var(--color-ink-soft)]",
                ].join(" ")}
              >
                {c.handle ? (
                  <Link href={`/@${c.handle}`} className="font-medium text-[var(--color-ink)] hover:underline">
                    {quem}
                  </Link>
                ) : (
                  <span className="text-[var(--color-ink)]">{quem}</span>
                )}

                {/* A insígnia de BIBLIOTECÁRIO viaja aqui, porque ela é um PAPEL: ela
                    diz o que a pessoa É, e saber quem fez a correção é útil. O NÚMERO
                    de contribuições nunca aparece aqui. Ver ai/DECISIONS.md. */}
                {c.librarian && (
                  <span className="ml-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                    bibliotecário
                  </span>
                )}{" "}
                {c.de ? (
                  <>
                    corrigiu {c.campo} de <span className="text-[var(--color-ink)]">{c.de}</span> para{" "}
                    <span className="text-[var(--color-ink)]">{c.para}</span>
                  </>
                ) : (
                  <>
                    adicionou {c.campo}
                    {c.para && c.para !== "uma imagem" ? (
                      <>
                        : <span className="text-[var(--color-ink)]">{c.para}</span>
                      </>
                    ) : null}
                  </>
                )}
              </p>

              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                {new Date(c.createdAt).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {c.revertedAt && c.revertedByHandle && ` · revertido por @${c.revertedByHandle}`}
              </p>
            </div>

            {souBibliotecario && !c.revertedAt && (
              <button
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    try {
                      await reverterCorrecao(slug, revisionId);
                      toast("Revertido. A reversão também fica no histórico.");
                      router.refresh();
                    } catch {
                      toast("Não deu para reverter.");
                    }
                  })
                }
                className="shrink-0 text-[12px] text-[var(--color-ink-faint)] underline underline-offset-4 hover:text-[var(--color-perigo)] disabled:opacity-40"
              >
                reverter
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Moldura } from "@/components/moldura";
import { FollowButton } from "@/components/follow-button";
import { procurarPessoas, type PessoaNaBusca } from "@/app/pessoas/actions";

/**
 * ════════════════════════════════════════════════════════════════════
 *  BUSCAR UMA PESSOA. Só gente, e pelo nome ou pelo @.
 *
 *  O "explorar" é para DESCOBRIR quem você não conhece. Isto é o contrário: você já sabe
 *  o nome (a esposa que acabou de entrar e te seguiu) e só quer chegar no perfil dela. As
 *  duas coisas moram na mesma aba porque são a mesma pergunta ("quem seguir"), feita de
 *  dois lados.
 *
 *  A busca espera você parar de digitar (300ms) antes de perguntar ao servidor, e uma
 *  resposta atrasada nunca sobrescreve uma mais nova (o `seq`): senão, apagar uma letra
 *  rápido faz o resultado antigo pousar em cima do novo.
 * ════════════════════════════════════════════════════════════════════
 */
export function BuscaPessoas() {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<PessoaNaBusca[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) {
      setResultados(null);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    const meu = ++seq.current;
    const id = setTimeout(async () => {
      const achados = await procurarPessoas(t);
      // Só aplica se ninguém digitou depois de mim.
      if (meu === seq.current) {
        setResultados(achados);
        setCarregando(false);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [q]);

  return (
    <div>
      <div className="relative">
        <Search
          size={17}
          strokeWidth={1.5}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="buscar uma pessoa pelo nome ou @"
          aria-label="buscar uma pessoa"
          className="w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent py-3 pl-11 pr-4 text-[15px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
        />
      </div>

      {resultados && (
        <div className="mt-4">
          {resultados.length === 0 ? (
            <p className="surface p-6 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
              {carregando
                ? "procurando"
                : "Ninguém com esse nome por aqui. Confira o @, ou pode ser que a pessoa ainda não tenha entrado no Gume."}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {resultados.map((p) => (
                <li
                  key={p.id}
                  className="surface flex items-center gap-4 p-4"
                >
                  <Link href={`/@${p.handle}`} aria-label={p.name ?? p.handle} className="shrink-0">
                    <Moldura coroa={p.coroa} src={p.image} name={p.name} handle={p.handle} size={44} />
                  </Link>

                  <Link href={`/@${p.handle}`} className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-[var(--color-ink)]">
                      {p.name ?? p.handle}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                      @{p.handle}
                      {p.isPrivate && " · estante fechada"}
                    </span>
                  </Link>

                  <FollowButton userId={p.id} handle={p.handle} following={p.following} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

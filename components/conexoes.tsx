import Link from "next/link";
import { Avatar } from "@/components/avatar";
import type { Conexao } from "@/lib/conexoes";

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS DUAS LISTAS: QUEM VOCÊ SEGUE, E QUEM SEGUE VOCÊ.
 *
 *  Rosto, nome, e o nome leva ao perfil. É a coisa mais simples que
 *  responde a pergunta, e a pergunta é "quem são essas pessoas", nunca
 *  "quantas são".
 *
 *  Repare no que NÃO tem aqui: nenhum número em lugar nenhum, nem no
 *  título da seção, nem depois do nome. O título diz "quem você segue" e
 *  não "quem você segue (12)". Se um dia alguém quiser pôr o total no
 *  cabeçalho, lib/conexoes.ts não sabe dizer qual é, de propósito.
 *
 *  A lista rola dentro da própria caixa quando fica longa. Rolar não
 *  conta; paginar com número de página contaria.
 * ════════════════════════════════════════════════════════════════════
 */
function Lista({
  titulo,
  vazio,
  pessoas,
}: {
  titulo: string;
  vazio: string;
  pessoas: Conexao[];
}) {
  return (
    <section>
      <h2 className="tabular text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {titulo}
      </h2>

      {pessoas.length === 0 ? (
        <p className="mt-4 text-[14px] text-[var(--color-ink-soft)]">{vazio}</p>
      ) : (
        <ul className="mt-4 max-h-[420px] overflow-y-auto pr-1">
          {pessoas.map((p) => (
            <li key={p.handle}>
              <Link
                href={`/@${p.handle}`}
                className="flex items-center gap-3 rounded-[var(--radius-control)] px-2 py-2 transition-colors hover:bg-white/[0.03]"
              >
                <Avatar src={p.image} name={p.name} handle={p.handle} size={36} />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-[var(--color-ink)]">
                    {p.name ?? p.handle}
                  </span>
                  <span className="block truncate text-[13px] text-[var(--color-ink-faint)]">
                    @{p.handle}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Conexoes({
  seguindo,
  seguidores,
}: {
  seguindo: Conexao[];
  seguidores: Conexao[];
}) {
  return (
    <div className="mt-8 grid gap-10 sm:grid-cols-2">
      <Lista
        titulo="quem você segue"
        vazio="você ainda não segue ninguém. Procure alguém em Explorar."
        pessoas={seguindo}
      />
      <Lista
        titulo="quem segue você"
        vazio="ninguém ainda. Chame quem você conhece pelo seu link."
        pessoas={seguidores}
      />
    </div>
  );
}

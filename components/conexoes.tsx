import Link from "next/link";
import { Gaveta } from "@/components/gaveta";
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
  vazio,
  pessoas,
}: {
  vazio: string;
  pessoas: Conexao[];
}) {
  return (
    <section>
      {pessoas.length === 0 ? (
        <p className="text-[14px] text-[var(--color-ink-soft)]">{vazio}</p>
      ) : (
        <ul className="max-h-[420px] overflow-y-auto pr-1">
          {pessoas.map((p) => (
            <li key={p.handle}>
              <Link
                href={`/@${p.handle}`}
                className="flex items-center gap-3 rounded-[var(--radius-control)] px-2 py-2 transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]"
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

/**
 * ═══ EM GAVETAS, E FECHADAS ═══
 *
 * As duas listas moravam abertas na página, e uma coluna de cem rostos empurrava o
 * feed para o fundo do poço: a resposta de "quem eu sigo" virava o custo de chegar
 * ao resto da tela. Agora cada lista é uma gaveta fechada, e quem quer os nomes abre.
 * O resumo NÃO diz quantos, de propósito: contador de seguidores é a linha que o
 * README não cruza, nem na própria página da pessoa.
 */
export function Conexoes({
  seguindo,
  seguidores,
}: {
  seguindo: Conexao[];
  seguidores: Conexao[];
}) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:items-start">
      <Gaveta titulo="quem você segue" resumo="abra para ver as pessoas">
        <Lista
          vazio="você ainda não segue ninguém. Procure alguém em Explorar."
          pessoas={seguindo}
        />
      </Gaveta>
      <Gaveta titulo="quem segue você" resumo="abra para ver as pessoas">
        <Lista
          vazio="ninguém ainda. Chame quem você conhece pelo seu link."
          pessoas={seguidores}
        />
      </Gaveta>
    </div>
  );
}

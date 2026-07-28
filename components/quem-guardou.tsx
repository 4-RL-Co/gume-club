"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Avatar } from "@/components/avatar";
import type { QuemGuardou } from "@/lib/listas";

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUANTOS GUARDARAM, E QUEM. O NÚMERO É DE TODO MUNDO; A LISTA É DE QUEM MONTOU.
 *
 *  ═══ POR QUE OS DOIS NÃO SÃO A MESMA COISA ═══
 *
 *  Guardar já é um gesto público do lado de quem guarda: a estante aparece no
 *  perfil dele, com o crédito de quem montou. Aparecer numa LISTA de "quem
 *  endossou a curadoria de fulano", na tela de fulano, é outra coisa, e ninguém
 *  consentiu com ela ao clicar em guardar.
 *
 *  É a mesma divisão que o convite já faz: a página do perfil mostra quem entrou
 *  pelo seu link **só para você**, com rostos, e nunca para visitante.
 *
 *  A defesa de verdade não é este componente: é `quemGuardou`, em lib/listas.ts,
 *  que devolve lista vazia para quem não é dono, no SQL. Aqui só se decide o que
 *  DESENHAR, e esconder botão nunca foi proteção.
 *
 *  ═══ E O ZERO NÃO APARECE ═══
 *
 *  Estante que ninguém guardou não mostra "0 guardaram". Quem acabou de montar a
 *  primeira estante da vida não precisa de um zero na cara para saber que ela é
 *  nova. Zero aqui não é informação: é um comentário.
 * ════════════════════════════════════════════════════════════════════
 */
export function QuemGuardouEsta({
  quantos,
  quem,
  souDono,
}: {
  quantos: number;
  /** Os rostos. Vem vazio para quem não é dono, e é o servidor que decide isso. */
  quem: QuemGuardou[];
  souDono: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  if (quantos === 0) return null;

  const rotulo = quantos === 1 ? "1 pessoa guardou" : `${quantos} pessoas guardaram`;

  // Para quem visita, é um fato na tela, e não um botão que não faz nada. Um
  // botão que não responde ao clique é pior do que texto.
  if (!souDono || quem.length === 0) {
    return (
      <p className="mt-6 flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)]">
        <Bookmark size={14} strokeWidth={1.5} aria-hidden />
        {rotulo}
      </p>
    );
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        className="flex items-center gap-2 text-[13px] text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
      >
        <Bookmark size={14} strokeWidth={1.5} aria-hidden />
        {rotulo}
        <span className="text-[var(--color-ink-faint)]">{aberto ? "esconder" : "ver quem"}</span>
      </button>

      {aberto && (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
          {quem.map((p) => (
            <li key={p.handle}>
              <Link
                href={`/@${p.handle}`}
                className="flex items-center gap-2 text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                <Avatar src={p.image} name={p.name} handle={p.handle} size={26} />
                <span className="truncate">{p.name ?? `@${p.handle}`}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { salvarApoioPublico } from "@/app/perfil/actions";

/**
 * ════════════════════════════════════════════════════════════════════
 *  APARECER NA LISTA DE QUEM APOIA.
 *
 *  Só existe para quem apoia. Quem não apoia não vê esta seção, porque uma caixa
 *  perguntando se você quer aparecer numa lista da qual você não faz parte não é uma
 *  opção: é uma cobrança educada.
 *
 *  Ela nasce MARCADA (ver a migration 0056), e é por isso que ela precisa ser fácil de
 *  achar: quem já está numa página pública tem que conseguir sair dela num clique, e no
 *  mesmo dia em que entrou.
 * ════════════════════════════════════════════════════════════════════
 */
export function ApoioPublico({ aparecendo }: { aparecendo: boolean }) {
  const [marcado, setMarcado] = useState(aparecendo);
  const [pendente, começar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function alternar(novo: boolean) {
    /**
     * A tela muda na hora, e volta atrás se o servidor recusar. Um interruptor que espera
     * a rede para se mexer parece quebrado, e quem clica clica de novo.
     */
    setMarcado(novo);
    setErro(null);

    começar(async () => {
      const r = await salvarApoioPublico(novo);
      if (!r.ok) {
        setMarcado(!novo);
        setErro("Não deu para salvar agora. Tente de novo daqui a pouco.");
      }
    });
  }

  return (
    <section className="surface mt-6 p-6">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        seu apoio
      </h2>

      <label className="mt-4 flex cursor-pointer items-start gap-3">
        {/* Rosa, e não verde-água: é a cor de "quem faz", e apoiar é contribuir. */}
        <input
          type="checkbox"
          checked={marcado}
          disabled={pendente}
          onChange={(e) => alternar(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-colaborar)] disabled:opacity-40"
        />
        <span className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          <span className="font-medium text-[var(--color-ink)]">
            Aparecer na lista de quem apoia.
          </span>{" "}
          Só o seu nome e o seu @, sem quanto você apoia e sem ordem nenhuma. Se desmarcar,
          você apoia em silêncio, e a sua insígnia continua igual.
        </span>
      </label>

      {erro && <p className="mt-3 text-[13px] text-[var(--color-perigo)]">{erro}</p>}
    </section>
  );
}

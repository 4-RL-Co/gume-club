"use client";

import { useState, useTransition } from "react";
import { MINIMO_CENTAVOS, reais, type Tier } from "@/lib/apoio";

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS BOTÕES DE APOIO.
 *
 *  Eles não sabem nada sobre dinheiro: pedem uma URL ao servidor e mandam o navegador
 *  para lá. Nenhum dado de cartão passa por este arquivo, e nenhuma chave do Stripe
 *  existe no cliente. Apoio não destrava nada, então o navegador não precisa falar com o
 *  Stripe, só ir até ele.
 * ════════════════════════════════════════════════════════════════════
 */

async function abrirCheckout(url: string, corpo: unknown): Promise<string> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });

  const dados = (await r.json().catch(() => null)) as { url?: string; error?: string } | null;

  if (!r.ok || !dados?.url) {
    /**
     * A mensagem do servidor quando ela é sobre o que a pessoa digitou (o valor mínimo),
     * e uma frase neutra quando é qualquer outra coisa. Repassar erro de servidor cru é
     * como um leitor acaba lendo o nome de uma variável na tela.
     */
    throw new Error(dados?.error ?? "Não deu para abrir o apoio agora. Tente de novo daqui a pouco.");
  }

  return dados.url;
}

export function AssinarBotao({ tier, rotulo, preco }: { tier: Tier; rotulo: string; preco: string }) {
  const [pendente, começar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      <button
        disabled={pendente}
        onClick={() =>
          começar(async () => {
            setErro(null);
            try {
              window.location.href = await abrirCheckout("/api/checkout/subscription", { tier });
            } catch (e) {
              setErro((e as Error).message);
            }
          })
        }
        className="rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-3 text-left transition-colors hover:border-[var(--color-colaborar)] disabled:opacity-40"
      >
        <span className="block text-[15px] font-medium text-[var(--color-ink)]">{rotulo}</span>
        <span className="mt-1 block text-[13px] text-[var(--color-ink-soft)]">
          {pendente ? "Um momento" : `${preco} por mês`}
        </span>
      </button>
      {erro && <p className="mt-2 text-[13px] text-[var(--color-perigo)]">{erro}</p>}
    </div>
  );
}

export function AvulsoForm() {
  /** Em REAIS na tela, e em centavos no servidor. Ninguém digita centavos. */
  const [valor, setValor] = useState("20");
  const [pendente, começar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const centavos = Math.round(Number(valor.replace(",", ".")) * 100);
  const valido = Number.isFinite(centavos) && centavos >= MINIMO_CENTAVOS;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        começar(async () => {
          setErro(null);
          try {
            window.location.href = await abrirCheckout("/api/checkout/avulso", {
              amount_cents: centavos,
            });
          } catch (err) {
            setErro((err as Error).message);
          }
        });
      }}
      className="mt-4"
    >
      <label className="flex items-center gap-2">
        <span className="text-[15px] text-[var(--color-ink-soft)]">R$</span>
        <input
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-28 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[15px] text-[var(--color-ink)]"
        />
      </label>

      <button
        type="submit"
        disabled={pendente || !valido}
        className="mt-4 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-colaborar)] disabled:opacity-40"
      >
        {pendente ? "Um momento" : "Apoiar uma vez"}
      </button>

      {/* A tela confere para a pessoa não errar. O servidor confere de novo, porque a
          tela é do atacante. As duas coisas precisam existir. */}
      {!valido && (
        <p className="mt-2 text-[13px] text-[var(--color-ink-faint)]">
          O mínimo é {reais(MINIMO_CENTAVOS)}.
        </p>
      )}
      {erro && <p className="mt-2 text-[13px] text-[var(--color-perigo)]">{erro}</p>}
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bookmark, Library, BookMarked, type LucideIcon } from "lucide-react";
import { MINIMO_CENTAVOS, reais, type Tier } from "@/lib/apoio";

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS BOTÕES DE APOIO.
 *
 *  Eles não sabem nada sobre dinheiro: pedem uma URL ao servidor e mandam o navegador
 *  para lá. Nenhum dado de cartão passa por este arquivo, e nenhuma chave do Stripe
 *  existe no cliente. Apoio não destrava função nenhuma, então o navegador não precisa
 *  falar com o Stripe, só ir até ele.
 *
 *  ═══ O PREÇO APARECE PARA QUEM NÃO ESTÁ LOGADO. O BOTÃO É QUE PEDE SESSÃO ═══
 *
 *  A tela inteira ficava atrás do login, e isso escondia o preço: para saber que custa
 *  R$ 4,90, a pessoa precisava criar uma conta. Ninguém cria conta para descobrir quanto
 *  custa uma coisa; ela fecha a aba.
 *
 *  A sessão continua obrigatória, e continua sendo o SERVIDOR que a exige: um `logado`
 *  mentiroso vindo do navegador só faria a pessoa dar de cara com um 401. Ver as rotas em
 *  app/api/checkout.
 *
 *  ═══ OS TRÊS PLANOS SÃO IGUAIS, E O DESENHO TAMBÉM ═══
 *
 *  Mesmo cartão, mesmo peso, mesma cor. Nenhum "mais popular", nenhum destaque no do
 *  meio, nenhuma etiqueta de recomendado: os três dão a MESMA insígnia, e empurrar um
 *  deles seria vender. O ícone muda só para a fileira não ser três retângulos iguais.
 * ════════════════════════════════════════════════════════════════════
 */

const GLIFOS: Record<Tier, LucideIcon> = {
  marcador: Bookmark,
  lombada: Library,
  capadura: BookMarked,
};

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

const CARTAO =
  "group flex h-full flex-col items-start rounded-[var(--radius-card)] border border-[var(--color-rule)] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-colaborar)] disabled:pointer-events-none disabled:opacity-40";

function Miolo({
  tier,
  rotulo,
  preco,
  pendente,
}: {
  tier: Tier;
  rotulo: string;
  preco: string;
  pendente: boolean;
}) {
  const Glifo = GLIFOS[tier];

  return (
    <>
      <span
        className="mb-4 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        style={{ background: "color-mix(in srgb, var(--color-colaborar) 14%, transparent)" }}
      >
        <Glifo size={17} strokeWidth={1.5} style={{ color: "var(--color-colaborar)" }} />
      </span>

      <span className="text-[14px] text-[var(--color-ink-soft)]">{rotulo}</span>

      <span className="voice mt-1 text-[24px] leading-none text-[var(--color-ink)]">
        {pendente ? "…" : preco}
      </span>

      <span className="mt-1 text-[13px] text-[var(--color-ink-faint)]">
        {pendente ? "um momento" : "por mês"}
      </span>
    </>
  );
}

export function AssinarBotao({
  tier,
  rotulo,
  preco,
  logado,
}: {
  tier: Tier;
  rotulo: string;
  preco: string;
  logado: boolean;
}) {
  const [pendente, começar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  if (!logado) {
    return (
      <Link href="/entrar" className={CARTAO} aria-label={`apoiar com ${preco} por mês`}>
        <Miolo tier={tier} rotulo={rotulo} preco={preco} pendente={false} />
      </Link>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        disabled={pendente}
        aria-label={`apoiar com ${preco} por mês`}
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
        className={CARTAO}
      >
        <Miolo tier={tier} rotulo={rotulo} preco={preco} pendente={pendente} />
      </button>
      {erro && <p className="mt-2 text-[13px] text-[var(--color-perigo)]">{erro}</p>}
    </div>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O APOIO DE UMA VEZ SÓ.
 *
 *  ═══ OS ATALHOS SÃO CONVENIÊNCIA, E NÃO SUGESTÃO ═══
 *
 *  Três valores prontos, e o campo continua livre e editável ao lado. Eles existem porque
 *  digitar um número num celular é a coisa mais chata desta tela, e não para ancorar
 *  ninguém: nenhum deles é "o recomendado", nenhum é destacado, e o do meio não é maior.
 *
 *  Um valor sugerido em negrito e dois apagados seria um empurrão, e empurrão é venda.
 * ════════════════════════════════════════════════════════════════════
 */
const ATALHOS = [1000, 2500, 5000];

export function AvulsoForm({ logado }: { logado: boolean }) {
  /** Em REAIS na tela, e em centavos no servidor. Ninguém digita centavos. */
  const [valor, setValor] = useState("20");
  const [pendente, começar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const centavos = Math.round(Number(valor.replace(",", ".")) * 100);
  const valido = Number.isFinite(centavos) && centavos >= MINIMO_CENTAVOS;

  const BOTAO =
    "inline-flex items-center rounded-[var(--radius-control)] px-5 py-2.5 text-[14px] font-medium transition-opacity hover:opacity-90 disabled:opacity-40";
  const ESTILO_BOTAO = {
    background: "var(--color-colaborar)",
    color: "#1a1a18",
  };

  const campo = (
    <div className="flex flex-wrap items-center gap-2">
      {ATALHOS.map((c) => {
        const ativo = centavos === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => setValor(String(c / 100))}
            aria-pressed={ativo}
            className="pill border px-3.5 py-1.5 text-[13px] transition-colors"
            style={{
              borderColor: ativo ? "var(--color-colaborar)" : "var(--color-rule)",
              color: ativo ? "var(--color-colaborar)" : "var(--color-ink-soft)",
            }}
          >
            {reais(c)}
          </button>
        );
      })}

      <label className="flex items-center gap-2">
        <span className="text-[14px] text-[var(--color-ink-faint)]">ou</span>
        <span className="flex items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-3 py-1.5 focus-within:border-[var(--color-colaborar)]">
          <span className="text-[14px] text-[var(--color-ink-soft)]">R$</span>
          <input
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            aria-label="quanto você quer apoiar, em reais"
            className="w-16 bg-transparent text-[15px] text-[var(--color-ink)] outline-none"
          />
        </span>
      </label>
    </div>
  );

  if (!logado) {
    return (
      <div className="mt-5">
        {campo}
        <Link href="/entrar" className={`${BOTAO} mt-5`} style={ESTILO_BOTAO}>
          Apoiar uma vez
        </Link>
      </div>
    );
  }

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
      className="mt-5"
    >
      {campo}

      <button type="submit" disabled={pendente || !valido} className={`${BOTAO} mt-5`} style={ESTILO_BOTAO}>
        {pendente ? "Um momento" : "Apoiar uma vez"}
      </button>

      {/* A tela confere para a pessoa não errar. O servidor confere de novo, porque a
          tela é do atacante. As duas coisas precisam existir. */}
      {!valido && (
        <p className="mt-3 text-[13px] text-[var(--color-ink-faint)]">
          O mínimo é {reais(MINIMO_CENTAVOS)}.
        </p>
      )}
      {erro && <p className="mt-3 text-[13px] text-[var(--color-perigo)]">{erro}</p>}
    </form>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar } from "@/components/avatar";
import type { Novidade } from "@/lib/novidades";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O SINO. Três coisas que aconteceram com você, e um pontinho quando há algo novo.
 *
 *  O "já vi" mora no navegador (a data da novidade mais nova que você já abriu), e não no
 *  banco: o deploy não roda migration sozinho, e "já vi isto" é uma coisa que o aparelho
 *  sabe. Ver lib/novidades.ts.
 *
 *  O contador só aparece DEPOIS de montar, e a lista só existe quando o sino abre: nada de
 *  hora nem de localStorage entra no HTML do servidor, então não há divergência de
 *  hidratação. Antes de montar, o sino é só um sino.
 * ════════════════════════════════════════════════════════════════════
 */
const CHAVE = "gume:novidades-visto";

export function Sino({ novidades }: { novidades: Novidade[] }) {
  const [montado, setMontado] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [visto, setVisto] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMontado(true);
    setVisto(localStorage.getItem(CHAVE));
  }, []);

  const naoVistas = useMemo(
    () => novidades.filter((n) => !visto || n.quando > visto).length,
    [novidades, visto],
  );

  // Fecha ao clicar fora, e ao apertar Esc.
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const abrir = () => {
    setAberto((v) => !v);
    // Abrir é ver: o mais novo passa a ser o "já vi", e o pontinho some.
    if (!aberto && novidades.length > 0) {
      const maisNovo = novidades[0]!.quando;
      localStorage.setItem(CHAVE, maisNovo);
      setVisto(maisNovo);
    }
  };

  return (
    <div ref={caixa} className="relative">
      <button
        onClick={abrir}
        aria-label={naoVistas > 0 ? `novidades, ${naoVistas} sem ver` : "novidades"}
        className={[
          "relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] transition-colors hover:bg-white/[0.06] hover:text-[var(--color-ink)]",
          aberto ? "bg-white/[0.06] text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]",
        ].join(" ")}
      >
        <Bell size={19} strokeWidth={1.5} />
        {montado && naoVistas > 0 && (
          <span className="tabular absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-medium text-[var(--color-canvas)]">
            {naoVistas > 9 ? "9+" : naoVistas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="surface absolute right-0 top-11 z-50 max-h-[70vh] w-[200px] max-w-[calc(100vw-2rem)] overflow-y-auto p-2 shadow-xl">
          <p className="px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
            novidades
          </p>

          {novidades.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
              Nada novo por aqui ainda. Quando alguém te seguir, entrar pelo seu convite ou te
              recomendar um livro, aparece aqui.
            </p>
          ) : (
            <ul className="flex flex-col">
              {novidades.map((n) => (
                <li key={n.id}>
                  <Item n={n} onIr={() => setAberto(false)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Item({ n, onIr }: { n: Novidade; onIr: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-2)] px-3 py-2.5 transition-colors hover:bg-white/[0.03]">
      <Link href={`/@${n.handle}`} onClick={onIr} aria-label={n.name ?? n.handle} className="shrink-0">
        <Avatar src={n.image} name={n.name} handle={n.handle} size={34} />
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-[var(--color-ink-soft)]">
          <Link href={`/@${n.handle}`} onClick={onIr} className="font-medium text-[var(--color-ink)] hover:underline">
            {n.name ?? `@${n.handle}`}
          </Link>{" "}
          {n.tipo === "seguiu" && "começou a te seguir"}
          {n.tipo === "convidado" && "entrou no Gume pelo seu convite"}
          {n.tipo === "recomendou" && (
            <>
              te recomendou{" "}
              {n.livroSlug ? (
                <Link
                  href={`/livro/${n.livroSlug}`}
                  onClick={onIr}
                  className="voice text-[14px] text-[var(--color-ink)] hover:underline"
                >
                  {n.livroTitulo}
                </Link>
              ) : (
                <span className="text-[var(--color-ink)]">um livro</span>
              )}
            </>
          )}
        </p>
        <p className="tabular mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{tempo(n.quando)}</p>
      </div>
    </div>
  );
}

/** Há quanto tempo, em português curto. Só roda no cliente (a lista só existe aberta). */
function tempo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  const min = Math.floor(s / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? "há 1 hora" : `há ${h} horas`;
  const d = Math.floor(h / 24);
  if (d < 7) return d === 1 ? "ontem" : `há ${d} dias`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

"use client";

import { useState, useTransition } from "react";
import { Search, Ban, Undo2, Lock, ShieldCheck, ShieldOff } from "lucide-react";
import {
  banirPessoa, desbanirPessoa, procurar, reservar, promover, rebaixar,
} from "@/app/moderacao/actions";
import { toast } from "@/lib/toast";

type Achado = { id: string; handle: string; name: string | null; banido: boolean };
type Moderador = { id: string; handle: string; name: string | null; ehDono: boolean };
type Banido = {
  id: string; handle: string; name: string | null;
  reason: string | null; quando: Date; porQuem: string | null;
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  MODERAR. Achar, banir, desbanir, e guardar um handle.
 *
 *  ═══ BANIR NÃO APAGA, E VOLTA ATRÁS ═══
 *
 *  A tela diz isso em voz alta, e não é conforto: é o que faz uma pessoa
 *  cansada conseguir banir sem medo. Um botão irreversível na mão de
 *  alguém cansado é um botão que ninguém aperta, e a moderação que ninguém
 *  faz não protege ninguém.
 *
 *  ═══ O MOTIVO É OBRIGATÓRIO ═══
 *
 *  Um banimento sem motivo escrito é um banimento que ninguém consegue
 *  revisar daqui a seis meses, nem explicar para a pessoa banida. Quem
 *  bane tem que dizer por quê, nem que seja para si mesmo.
 * ════════════════════════════════════════════════════════════════════
 */
export function Moderacao({
  banidos,
  reservados,
  moderadores,
  dono,
}: {
  banidos: Banido[];
  reservados: { handle: string; motivo: string }[];
  moderadores: Moderador[];
  /** Quem está olhando é o idealizador? Só ele promove e rebaixa. */
  dono: boolean;
}) {
  const [q, setQ] = useState("");
  const [achados, setAchados] = useState<Achado[]>([]);
  const [alvo, setAlvo] = useState<Achado | null>(null);
  const [motivo, setMotivo] = useState("");
  const [handle, setHandle] = useState("");
  const [porque, setPorque] = useState("");
  const [pendente, comecar] = useTransition();

  return (
    <div className="mt-10 flex flex-col gap-12">
      {/* ── achar alguém ─────────────────────────────────────────────── */}
      <section className="surface p-7">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          achar alguém
        </h2>

        <div className="mt-5 flex items-center gap-3">
          <Search size={16} strokeWidth={1.5} className="shrink-0 text-[var(--color-ink-faint)]" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              comecar(async () => setAchados(await procurar(e.target.value)));
            }}
            placeholder="handle ou nome"
            className="w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-3 text-[15px] outline-none focus:border-[var(--color-ink)]"
          />
        </div>

        {achados.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2">
            {achados.map((p) => (
              <li key={p.id} className="surface-2 flex flex-wrap items-center gap-4 p-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{p.name ?? p.handle}</span>
                  <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                    @{p.handle}
                  </span>
                </span>

                {dono && !p.banido && (
                  <button
                    disabled={pendente}
                    onClick={() =>
                      comecar(async () => {
                        await promover(p.id);
                        toast(`@${p.handle} agora modera.`);
                      })
                    }
                    className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                  >
                    <ShieldCheck size={14} strokeWidth={1.5} />
                    tornar moderador
                  </button>
                )}

                {p.banido ? (
                  <button
                    disabled={pendente}
                    onClick={() =>
                      comecar(async () => {
                        await desbanirPessoa(p.id);
                        toast(`@${p.handle} voltou.`);
                        setAchados(await procurar(q));
                      })
                    }
                    className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                  >
                    <Undo2 size={14} strokeWidth={1.5} />
                    desbanir
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAlvo(p);
                      setMotivo("");
                    }}
                    className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-perigo)]"
                  >
                    <Ban size={14} strokeWidth={1.5} />
                    banir
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* O motivo, e ele é obrigatório. Ver o cabeçalho. */}
        {alvo && (
          <div className="mt-6 border-t border-[var(--color-rule)] pt-6">
            <p className="text-[15px] text-[var(--color-ink-soft)]">
              Banir <span className="text-[var(--color-ink)]">@{alvo.handle}</span>. Isso não apaga
              nada, e você pode desfazer a qualquer momento.
            </p>

            <input
              autoFocus
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="o que aconteceu? (obrigatório)"
              className="mt-4 w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-3 text-[15px] outline-none focus:border-[var(--color-ink)]"
            />

            <div className="mt-4 flex flex-wrap items-center gap-5">
              <button
                disabled={pendente || motivo.trim().length === 0}
                onClick={() =>
                  comecar(async () => {
                    try {
                      await banirPessoa(alvo.id, motivo);
                      toast(`@${alvo.handle} foi banido. Dá para desfazer.`);
                      setAlvo(null);
                      setAchados(await procurar(q));
                    } catch {
                      toast("Não deu para banir.");
                    }
                  })
                }
                className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
              >
                {pendente ? "banindo" : "Banir"}
              </button>

              <button
                onClick={() => setAlvo(null)}
                className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
              >
                deixa
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── guardar um handle ────────────────────────────────────────── */}
      <section className="surface p-7">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          guardar um handle
        </h2>

        <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
          Guarde os handles dos amigos antes de a porta abrir. Depois não tem conserto: tirar o
          handle de quem já tem é uma coisa que a gente não vai querer fazer.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="handle"
            className="w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-3 text-[15px] outline-none focus:border-[var(--color-ink)] sm:w-1/3"
          />
          <input
            value={porque}
            onChange={(e) => setPorque(e.target.value)}
            placeholder="para quem, e por quê"
            className="w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-3 text-[15px] outline-none focus:border-[var(--color-ink)]"
          />
        </div>

        <button
          disabled={pendente || !handle.trim() || !porque.trim()}
          onClick={() =>
            comecar(async () => {
              try {
                await reservar(handle, porque);
                toast(`@${handle} está guardado.`);
                setHandle("");
                setPorque("");
              } catch (e) {
                toast(e instanceof Error ? e.message : "Não deu para guardar.");
              }
            })
          }
          className="mt-4 flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2 text-[13px] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
        >
          <Lock size={14} strokeWidth={1.5} />
          guardar
        </button>

        <ul className="mt-7 flex flex-wrap gap-2">
          {reservados.map((r) => (
            <li
              key={r.handle}
              title={r.motivo}
              className="pill border border-[var(--color-rule)] px-3 py-1 text-[12px] text-[var(--color-ink-faint)]"
            >
              @{r.handle}
            </li>
          ))}
        </ul>
      </section>

      {/* ── quem modera ──────────────────────────────────────────────────
          Só o IDEALIZADOR promove. Bibliotecário se ganha sozinho, cruzando um
          número; moderador mexe em GENTE, e poder sobre pessoa se ganha por
          confiança. Confiança não é uma consulta: é alguém dizendo sim. */}
      <section className="surface p-7">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          quem modera
        </h2>

        <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
          {dono
            ? "Moderador não é bibliotecário. Bibliotecário se ganha sozinho, cuidando do catálogo; moderador tira gente do ar, e isso só se dá na mão."
            : "Moderador só é promovido por quem imaginou o Gume."}
        </p>

        <ul className="mt-5 flex flex-col gap-2">
          {moderadores.map((m) => (
            <li key={m.id} className="surface-2 flex flex-wrap items-center gap-4 p-3">
              <ShieldCheck size={15} strokeWidth={1.5} className="shrink-0 text-[var(--color-ink-faint)]" />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px]">{m.name ?? m.handle}</span>
                <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                  @{m.handle}
                  {m.ehDono && " · quem imaginou o Gume"}
                </span>
              </span>

              {/* O dono não se rebaixa: ninguém sobraria para promover, e o sistema
                  ficaria trancado por fora. */}
              {dono && !m.ehDono && (
                <button
                  disabled={pendente}
                  onClick={() =>
                    comecar(async () => {
                      await rebaixar(m.id);
                      toast(`@${m.handle} não modera mais.`);
                    })
                  }
                  className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                >
                  <ShieldOff size={14} strokeWidth={1.5} />
                  tirar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ── quem está banido ─────────────────────────────────────────── */}
      {banidos.length > 0 && (
        <section className="surface p-7">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            quem está banido
          </h2>

          <ul className="mt-5 flex flex-col gap-3">
            {banidos.map((b) => (
              <li key={b.id} className="surface-2 flex flex-wrap items-center gap-4 p-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">@{b.handle}</span>
                  <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                    {b.reason ?? "sem motivo escrito"}
                    {b.porQuem && ` · por @${b.porQuem}`}
                  </span>
                </span>

                <button
                  disabled={pendente}
                  onClick={() =>
                    comecar(async () => {
                      await desbanirPessoa(b.id);
                      toast(`@${b.handle} voltou.`);
                    })
                  }
                  className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                >
                  <Undo2 size={14} strokeWidth={1.5} />
                  desbanir
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { salvarDatas, removerLeitura } from "@/app/livro/[slug]/actions";
import { hoje } from "@/lib/datas";

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUANDO VOCÊ LEU. As datas são suas, e não do relógio do servidor.
 *
 *  O app carimbava a data de HOJE e nunca mais soltava. Quem terminou o livro
 *  em março de 2019 e o marcava como lido hoje ficava registrado como tendo
 *  terminado hoje, e não existia nenhuma tela para corrigir.
 *
 *  A mentira era silenciosa, que é o pior tipo: ninguém abre um chamado dizendo
 *  "a data do meu livro está errada", porque ninguém olha. O erro só aparece em
 *  dezembro, quando a retrospectiva do ano fica estranha e ninguém sabe por quê.
 *
 *  ═══ UM CAMPO, E NÃO UM FORMULÁRIO ═══
 *
 *  Marcar como lido continua sendo UM TOQUE. A data já vem preenchida com hoje,
 *  e quem aceita hoje não paga nada por isso — nem um clique a mais.
 *
 *  Quem terminou em março mexe no campo, e pronto. O peso fica com quem precisa
 *  dele, e não com todo mundo.
 *
 *  ═══ CADA LEITURA TEM AS SUAS PRÓPRIAS DATAS ═══
 *
 *  Ler O Hobbit em 2009 e de novo em 2024 são DUAS leituras, cada uma com o seu
 *  começo e o seu fim. Mexer numa não toca na outra.
 * ════════════════════════════════════════════════════════════════════
 */

export type Leitura = {
  id: string;
  comecou: string | null;
  terminou: string | null;
  abandonou: string | null;
};

export function Leituras({ leituras, slug }: { leituras: Leitura[]; slug: string }) {
  if (leituras.length === 0) return null;

  return (
    <section className="surface p-6 sm:p-7">
      <h2 className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        quando você leu
      </h2>

      <ul className="mt-5 flex flex-col gap-5">
        {leituras.map((l, i) => (
          <Uma
            key={l.id}
            leitura={l}
            slug={slug}
            /* Só numera quando há mais de uma: "1ª leitura" num livro lido uma vez
               é uma pergunta que ninguém fez. */
            ordem={leituras.length > 1 ? i + 1 : null}
          />
        ))}
      </ul>
    </section>
  );
}

function Uma({
  leitura, slug, ordem,
}: { leitura: Leitura; slug: string; ordem: number | null }) {
  const [comecou, setComecou] = useState(leitura.comecou ?? "");
  const [terminou, setTerminou] = useState(leitura.terminou ?? "");
  const [abandonou, setAbandonou] = useState(leitura.abandonou ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [apagada, setApagada] = useState(false);
  const [pendente, start] = useTransition();

  if (apagada) return null;

  // O livro foi abandonado? Então o campo que importa é o de abandono, e não o de fim.
  // Mostrar os dois convida a preencher os dois, e uma leitura terminada E abandonada é
  // uma contradição que a página do ano teria que resolver no chute.
  const foiAbandonado = Boolean(leitura.abandonou);

  const salvar = () =>
    start(async () => {
      setErro(null);
      setSalvo(false);
      try {
        await salvarDatas(slug, leitura.id, { comecou, terminou, abandonou });
        setSalvo(true);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "não deu para salvar essa data");
      }
    });

  return (
    <li className="border-t border-[var(--color-rule)] pt-4 first:border-0 first:pt-0">
      {ordem && (
        <p className="mb-2 text-[12px] text-[var(--color-ink-faint)]">{ordem}ª vez</p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Campo
          rotulo="comecei"
          valor={comecou}
          onChange={setComecou}
          onBlur={salvar}
          disabled={pendente}
        />
        <Campo
          rotulo={foiAbandonado ? "abandonei" : "terminei"}
          valor={foiAbandonado ? abandonou : terminou}
          onChange={foiAbandonado ? setAbandonou : setTerminou}
          onBlur={salvar}
          disabled={pendente}
        />

        <button
          type="button"
          aria-label="apagar esta leitura"
          disabled={pendente}
          onClick={() =>
            start(async () => {
              await removerLeitura(slug, leitura.id);
              setApagada(true);
            })
          }
          className="mb-0.5 rounded-[var(--radius-control)] border border-[var(--color-rule)] p-2 text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>

      {erro && <p className="mt-2 text-[13px] text-[var(--color-perigo)]">{erro}</p>}
      {salvo && !erro && (
        <p className="mt-2 text-[12px] text-[var(--color-ink-faint)]">guardado</p>
      )}
    </li>
  );
}

function Campo({
  rotulo, valor, onChange, onBlur, disabled,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {rotulo}
      </span>
      <input
        type="date"
        value={valor}
        disabled={disabled}
        /* O `max` é o navegador dizendo "amanhã não existe" antes de o servidor
           precisar dizer. A regra de verdade mora em lib/datas.ts, no servidor: um
           `max` no HTML é uma gentileza, e não uma tranca.

           E ele usa `hoje()`, e não `toISOString()`. Este campo é o único lugar do app
           onde o leitor CONFERE a data com os próprios olhos: às 23h de 31 de dezembro
           em São Paulo, o `toISOString()` diria que o máximo é 1º de janeiro — e o
           campo ofereceria ao leitor um dia que, para ele, ainda não existe. */
        max={hoje()}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="tabular mt-1 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)] disabled:opacity-50"
      />
    </label>
  );
}

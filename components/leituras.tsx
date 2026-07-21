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

/**
 * ═══ ISTO MORA NUMA GAVETA, E A REGRA JÁ ESTAVA ESCRITA ═══
 *
 * A página do livro diz, nela mesma: fica ABERTO o que a pessoa faz toda vez
 * (prateleira, nota, resenha), e vai para a gaveta o que ela faz uma vez na vida.
 *
 * Corrigir a data de uma leitura é uma vez na vida, e passou a ser ainda mais raro
 * depois que marcar "lido" passou a perguntar o ano ali mesmo (components/quando.tsx).
 * Aberta o tempo todo, esta seção era um formulário de manutenção no meio de uma
 * página de leitura.
 *
 * Por isso este componente devolve só a LISTA: o título e a casca são da gaveta que o
 * envolve, e duas molduras em volta da mesma coisa é o peso que fez esta página já ter
 * tido doze cartões. O resumo da gaveta (lib/leituras-view.ts) já diz o ano, então
 * quase nunca há motivo para abrir.
 */
export function Leituras({ leituras, slug }: { leituras: Leitura[]; slug: string }) {
  if (leituras.length === 0) return null;

  return (
    <ul className="flex flex-col gap-5">
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

/**
 * O campo de uma ponta da leitura. ANO por padrão, dia para quem lembra.
 *
 * O FORMATO do valor diz o modo, e é a mesma convenção do servidor: "2019" é ano,
 * "2019-03-14" é dia. Não há um terceiro estado a sincronizar, e o que a tela devolve
 * volta com a precisão embutida. Ver lib/datas.ts.
 *
 * Trocar para o dia parte do 1º de janeiro daquele ano só como ponto de partida: a
 * pessoa está escolhendo pôr um dia, e vai mexer nele. Trocar de volta para o ano
 * descarta o dia, que é exatamente o que ela pediu ao trocar.
 */
function Campo({
  rotulo, valor, onChange, onBlur, disabled,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  disabled: boolean;
}) {
  const soAno = /^\d{4}$/.test(valor);
  // Vazio abre pedindo o ano: é a resposta mais provável, e a mais fácil de dar.
  const comDia = valor !== "" && !soAno;
  const anoDeHoje = hoje().slice(0, 4);

  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {rotulo}
      </span>

      <div className="mt-1 flex items-center gap-2">
        {comDia ? (
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
            className="tabular rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)] disabled:opacity-50"
          />
        ) : (
          <input
            type="number"
            inputMode="numeric"
            placeholder="ano"
            value={valor}
            disabled={disabled}
            min={1900}
            max={anoDeHoje}
            step={1}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className="tabular w-24 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)] disabled:opacity-50"
          />
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const proximo = comDia
              ? valor.slice(0, 4)
              : `${valor || anoDeHoje}-01-01`;
            onChange(proximo);
          }}
          className="text-[11px] text-[var(--color-ink-faint)] underline underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-40"
        >
          {comDia ? "só o ano" : "o dia"}
        </button>
      </div>
    </label>
  );
}

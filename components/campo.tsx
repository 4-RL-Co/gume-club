"use client";

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM CAMPO DE TEXTO QUE DIZ ONDE ACABA.
 *
 *  ═══ O BUG QUE ELE EXISTE PARA MATAR ═══
 *
 *  "A descrição eu colo inteira e ela vai cortada."
 *
 *  O campo não tinha teto nenhum na tela. A pessoa colava a biografia inteira de um
 *  autor, o formulário aceitava, o botão dizia "Arrumar", o app respondia "Arrumado.
 *  Obrigado." — e o servidor cortava no caractere 280 e gravava o toco.
 *
 *  Ela só descobria abrindo a página do autor e vendo a frase morrer no meio.
 *
 *  ═══ UM LIMITE QUE A PESSOA NÃO VÊ CHEGANDO NÃO É UM LIMITE ═══
 *
 *  É uma armadilha. E é uma armadilha que pune justamente quem se deu ao trabalho de
 *  escrever mais.
 *
 *  Então: a contagem fica à vista, o campo TRAVA no teto, e quando o texto colado não
 *  coube, o campo DIZ que não coube — em vez de deixar a pessoa achar que coube.
 *
 *  O `clamp()` do servidor continua lá, e continua cortando: ele é a defesa contra um
 *  POST que não passa por formulário nenhum. As duas coisas não são a mesma. Uma protege
 *  o banco; esta aqui protege a pessoa.
 * ════════════════════════════════════════════════════════════════════
 */

import { useState } from "react";

export function Campo({
  valor,
  aoMudar,
  teto,
  linhas,
  placeholder,
  nome,
  autoFocus,
  className,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  teto: number;
  /** Quantas linhas. Sem isto, é um `input` de uma linha. */
  linhas?: number;
  placeholder?: string;
  /** Quando o campo vive dentro de um `<form>` que envia pelo `name`. */
  nome?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  /**
   * Isto é o que separa "o campo travou" de "o campo comeu o seu texto em silêncio".
   *
   * Quando alguém cola um texto maior que o teto, o navegador aceita o começo e joga o
   * resto fora sem dizer nada: o `maxLength` é mudo. Aqui a gente percebe — o texto
   * encostou no teto vindo de um salto grande, e salto grande é colagem — e fala.
   */
  const [cortou, setCortou] = useState(false);

  const restam = teto - valor.length;
  const apertado = restam <= Math.max(20, Math.round(teto * 0.1));
  const noLimite = restam <= 0;

  /**
   * ═══ QUANDO O CONTADOR APARECE ═══
   *
   * Num campo curto — a linha de perfil, com 280 — a pessoa esbarra no teto escrevendo
   * normal, e o contador tem que estar lá desde a primeira tecla.
   *
   * Numa RESENHA, com vinte mil, um "0 / 20.000" fixo embaixo do campo é uma contagem
   * regressiva num lugar onde ninguém está com pressa: transforma escrever numa prova.
   * Lá ele aparece quando o texto passa de 60% do teto — cedo o bastante para não haver
   * surpresa, e tarde o bastante para não atrapalhar.
   *
   * E ele aparece SEMPRE que uma colagem foi cortada, em qualquer teto: aí a pessoa
   * precisa ver o número.
   */
  const mostrarContador = teto <= 300 || valor.length >= teto * 0.6 || cortou;

  function mudar(novo: string) {
    const colou = novo.length - valor.length > 1;
    setCortou(colou && novo.length >= teto);
    aoMudar(novo);
  }

  const estilo =
    "w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] " +
    "text-[15px] outline-none placeholder:text-[var(--color-ink-faint)] " +
    "focus:border-[var(--color-ink)]";

  return (
    <div>
      {linhas ? (
        <textarea
          name={nome}
          rows={linhas}
          value={valor}
          maxLength={teto}
          autoFocus={autoFocus}
          onChange={(e) => mudar(e.target.value)}
          placeholder={placeholder}
          className={className ?? `${estilo} p-4 leading-relaxed`}
        />
      ) : (
        <input
          name={nome}
          value={valor}
          maxLength={teto}
          autoFocus={autoFocus}
          onChange={(e) => mudar(e.target.value)}
          placeholder={placeholder}
          className={className ?? `${estilo} p-3`}
        />
      )}

      <div className="mt-2 flex items-baseline justify-between gap-4">
        {/* O aviso da colagem cortada. Ele some assim que a pessoa mexe no texto de novo,
            porque aí ela já está no controle, e continuar avisando viraria ruído. */}
        {cortou ? (
          <p className="text-[13px] leading-snug text-[var(--color-perigo)]" aria-live="polite">
            O texto era maior que o limite e não coube inteiro. Ajuste antes de salvar.
          </p>
        ) : (
          <span />
        )}

        {mostrarContador && (
          <p
            className={[
              "shrink-0 text-[13px] tabular-nums",
              noLimite
                ? "font-medium text-[var(--color-perigo)]"
                : apertado
                  ? "text-[var(--color-ink)]"
                  : "text-[var(--color-ink-faint)]",
            ].join(" ")}
          >
            {valor.length.toLocaleString("pt-BR")} / {teto.toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    </div>
  );
}

import { Flame, Check, Minus, X, Undo2 } from "lucide-react";
import { mine, theirs } from "@/lib/veredito";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A NOTA É UMA PALAVRA, e agora ela tem um GLIFO ao lado.
 *
 *  Numa lista, cinco palavras cinzas do mesmo tamanho viram uma mancha:
 *  a pessoa não distingue "gostei" de "achei ok" sem parar e ler. O
 *  glifo dá reconhecimento instantâneo, e a palavra continua sendo a nota.
 *
 *  ═══ O GLIFO NÃO PODE SER UMA RAMPA ═══
 *
 *  Esta é a regra que segura tudo. Os cinco glifos têm o MESMO tamanho, o
 *  MESMO traço e a MESMA cor. Nenhum é maior, mais forte ou mais opaco
 *  que outro.
 *
 *  Uma rampa (um risco, dois riscos, três riscos; opacidade subindo; um
 *  ícone que cresce) é uma ESCALA desenhada. Escala vira média, média
 *  vira placar, e placar é exatamente o que a nota-palavra foi criada
 *  para matar. Ver lib/veredito.ts e ai/DECISIONS.md.
 *
 *  Então os glifos são CATEGÓRICOS: formas diferentes, e nunca graus da
 *  mesma forma. Ninguém soma um X com uma chama.
 *
 *  ═══ E NÃO PODE SER COR ═══
 *
 *  Verde e vermelho seriam mais rápidos de ler, e estão proibidos: a
 *  ÚNICA coisa colorida no Gume é a capa de um livro. Uma nota colorida
 *  numa parede de capas rouba a atenção que é da capa.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Um por veredito. Formas distintas, e nunca graus da mesma forma.
 *
 * EXPORTADO porque o botão de dar nota (dentro do livro) tem que usar exatamente estes
 * — e não desenhar os seus. Se o botão diz "gostei" com um ícone e a estante diz
 * "gostei" com outro, a pessoa aprende duas linguagens para uma coisa só.
 */
export const GLIFO = {
  5: Flame, //  adorei        · queimou
  4: Check, //  gostei        · deu certo
  3: Minus, //  achei ok      · nem lá, nem cá
  2: X, //      não gostei    · não
  1: Undo2, //  não terminei  · dei meia-volta
} as const;

/** Mesmo tamanho e mesmo traço para os cinco. Mexeu em um, criou um placar. */
const TAMANHO = 13;
export const TRACO = 1.75;

export function Verdict({ value }: { value: number }) {
  const Icone = GLIFO[value as keyof typeof GLIFO];

  return (
    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
      {Icone && <Icone size={TAMANHO} strokeWidth={TRACO} aria-hidden />}
      {mine(value)}
    </span>
  );
}

/** O que a outra pessoa achou. "Rui adorou." Opinião de gente, nunca placar. */
export function VerdictOf({ name, value }: { name: string; value: number }) {
  const Icone = GLIFO[value as keyof typeof GLIFO];

  return (
    <span className="flex items-center gap-1.5 text-[14px] text-[var(--color-ink-soft)]">
      {Icone && (
        <Icone
          size={TAMANHO}
          strokeWidth={TRACO}
          aria-hidden
          className="shrink-0 text-[var(--color-ink-faint)]"
        />
      )}
      <span>
        <span className="text-[var(--color-ink)]">{name}</span> {theirs(value)}
      </span>
    </span>
  );
}

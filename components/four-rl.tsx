/**
 * ════════════════════════════════════════════════════════════════════
 *  "UM PROJETO DE 4/RL Co."  O selo de quem mantém isto de pé.
 *
 *  ═══ POR QUE A LIMA É PERMITIDA AQUI, E SÓ AQUI ═══
 *
 *  A regra do Gume é dura e não muda: a ÚNICA coisa colorida no produto é
 *  a capa de um livro. Gráfico, insígnia, botão e acento nunca competem
 *  com uma capa.
 *
 *  Este selo é a exceção, e ela é honesta: ele não é do Gume. É a marca de
 *  OUTRA empresa, e uma marca não se recolore para caber na paleta de quem
 *  a hospeda — recolorir a marca de alguém é desrespeitá-la.
 *
 *  A exceção só se sustenta porque ela é PEQUENA E ÚNICA. A lima aparece
 *  em exatamente dois lugares aqui dentro: o quadrado da marca e a barra
 *  do "/" no nome. Em nenhum outro pixel do rodapé, e em nenhum outro
 *  lugar do app. No dia em que essa lima escapar deste componente, ela
 *  vira o acento do Gume, e a regra morre.
 *
 *  ═══ E ELE É QUIETO ═══
 *
 *  Ele é uma assinatura, e assinatura não grita. Fica embaixo de tudo,
 *  separado do conteúdo do Gume por um filete, e o "um projeto de" vem em
 *  cinza fraco: quem chegou aqui veio pelos livros, e não pela empresa.
 * ════════════════════════════════════════════════════════════════════
 */

/** A lima da 4/RL. NÃO É um token do Gume, e não pode virar um: ela mora só aqui. */
const LIMA = "#C6FF3A";

export function FourRL({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://4real.ventures"
      target="_blank"
      rel="noopener"
      aria-label="Um projeto de 4/RL Co."
      className={[
        "group inline-flex items-center gap-3 rounded-[var(--radius-2)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[var(--color-canvas)]",
        className,
      ].join(" ")}
    >
      {/* O quadrado, com a barra RECORTADA: o `evenodd` faz o fundo do rodapé
          aparecer através dela, em vez de a barra ser desenhada por cima. */}
      <svg viewBox="0 0 100 100" width="24" height="24" aria-hidden className="shrink-0">
        <path
          fill={LIMA}
          fillRule="evenodd"
          d="M26 10 H74 A16 16 0 0 1 90 26 V74 A16 16 0 0 1 74 90 H26 A16 16 0 0 1 10 74 V26 A16 16 0 0 1 26 10 Z M55 28 L66 28 L45 72 L34 72 Z"
        />
      </svg>

      {/* HORIZONTAL, numa linha só.
          Empilhado em duas linhas ele virava um bloco alto no meio de um rodapé que é
          uma faixa baixa: ele chamava mais atenção do que o conteúdo, que é o oposto
          do que uma assinatura faz. Deitado, ele cabe na altura da linha e some. */}
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-none">
        <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-ink-faint)] [font-family:ui-monospace,SFMono-Regular,Menlo,monospace]">
          um projeto de
        </span>

        <span className="text-[15px] font-bold tracking-[-0.01em] text-[var(--color-ink-soft)] transition-colors group-hover:text-[var(--color-ink)]">
          {/* A barra tem a MESMA altura e o MESMO peso das letras: ela é uma letra do
              nome, e não um ornamento. Uma barra maior que as letras vira um logo
              dentro do logo. */}
          4<span style={{ color: LIMA }}>/</span>RL
          <span className="font-normal text-[var(--color-ink-faint)]"> Co.</span>
        </span>
      </span>
    </a>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A MARCA. Um livro aberto, e o miolo é a lâmina.
 *
 *  Duas asas de páginas, e entre elas um miolo que sobe, afina e desce
 *  até uma ponta. O vinco que corta o miolo ao meio é a dobra do livro E
 *  o fio da lâmina, ao mesmo tempo: é a mesma linha lendo as duas coisas,
 *  e é por isso que o símbolo fecha.
 *
 *  Desenhada à mão, em geometria medida no ícone. Nada de trace: um trace
 *  cospe trezentos pontos, não tem simetria, e não dá para engrossar quando
 *  a marca encolhe. Aqui são QUATRO subpaths de quatro pontos cada, e o
 *  lado direito é o espelho exato do esquerdo.
 *
 *  `fill-rule="nonzero"`: abaixo de Y≈47 a asa e a lâmina SE SOBREPÕEM, e a
 *  união é geométrica. Se fossem coladas na mão, a emenda apareceria como um
 *  fio de fundo entre as duas, e a 16px esse fio é a marca inteira.
 *
 *  ═══ DUAS VERSÕES, E NÃO É OPCIONAL ═══
 *
 *  MARK  (≥32px): o fio fino, fiel ao ícone.
 *  SOLID (<32px): mesma silhueta, mesma alma, mais robusta. Miolo mais grosso,
 *                 vinco mais largo, páginas mais afastadas.
 *
 *  A 16px o fio fino mede menos de meio pixel: ele SOME, e a marca vira duas
 *  manchas brancas sem leitura nenhuma. Medido, não suposto. O componente
 *  escolhe sozinho pelo `size`, para ninguém ter que lembrar disso.
 *
 *  ═══ O QUE NÃO FAZER ═══
 *
 *  Sempre `currentColor`, sempre chapada. O ícone grafite com grão existe, e
 *  ele NUNCA entra na interface: ele é para o launcher, para a aba e para a
 *  loja. Não recolorir, não girar, não contornar. Ver docs/design.md.
 * ════════════════════════════════════════════════════════════════════
 */

/** ≥32px. A fiel ao ícone. */
const FINE =
  "M11.5 16.7L26 23.6L26 46.4L27.7 47.8L30.8 57.9Q22.4 54.1 11.5 48.3Z " +
  "M52.5 16.7L38 23.6L38 46.4L36.3 47.8L33.2 57.9Q41.6 54.1 52.5 48.3Z " +
  "M31.85 6.2L27.4 14.2L27.4 47L30.8 57.9Z " +
  "M32.15 6.2L36.6 14.2L36.6 47L33.2 57.9Z";

/** <32px. O mesmo desenho, com carne suficiente para sobreviver ao pixel. */
const SOLID =
  "M10.6 17.1L23.6 24L23.6 46.2L26.2 47.9L29.7 57.9Q21.4 54.2 10.6 48.1Z " +
  "M53.4 17.1L40.4 24L40.4 46.2L37.8 47.9L34.3 57.9Q42.6 54.2 53.4 48.1Z " +
  "M31.1 6.2L25.9 14.6L25.9 47L29.7 57.9Z " +
  "M32.9 6.2L38.1 14.6L38.1 47L34.3 57.9Z";

/** O corte: abaixo dele, a marca sólida. Medido, e não escolhido por gosto. */
export const LIMIAR_SOLIDO = 32;

export function Mark({
  size = 26,
  className = "",
  title,
}: {
  size?: number;
  className?: string;
  /** Só quando a marca está sozinha e É o link. Dentro do lockup, ela é decorativa. */
  title?: string;
}) {
  const d = size < LIMIAR_SOLIDO ? SOLID : FINE;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      <path fill="currentColor" fillRule="nonzero" d={d} />
    </svg>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O LOCKUP: a marca e o nome, e eles são UM objeto.
 *
 *  ═══ O ALINHAMENTO É PELO PESO, E NÃO PELA CAIXA ═══
 *
 *  A marca ocupa y 6..58, então o centro da CAIXA dela é 32. Mas o centro do
 *  PESO é 35,4: a cauda da lâmina desce fina até 58 e quase não carrega tinta,
 *  enquanto a massa (as asas) fica mais em cima. Medido varrendo o pixel, e
 *  não estimado no olho.
 *
 *  Centrada em 32, a palavra parecia FLUTUAR ACIMA da marca, e era esse o bug.
 *  Ela desce 3,4 unidades (5,3% da altura da marca) e assenta.
 *
 *  É a armadilha clássica do alinhamento óptico: a caixa mente sempre que a
 *  forma não é simétrica no eixo, e quase nenhuma forma boa é.
 *
 *  ═══ A PALAVRA ═══
 *
 *  Fraunces 400, em Caixa e Baixa, entreletra apertada (`.mark-word`).
 *
 *  NÃO é a Newsreader da voz: uma serifada de TEXTO, ao lado deste ícone, que é
 *  MASSA (sólido, denso, geométrico), lia como um FIO. Não era contraste, era
 *  descasamento.
 *
 *  "Gume", e não "GUME": em caixa alta a palavra vira monumento, e em Caixa e
 *  Baixa ela vira NOME, que é o que uma marca quer ser.
 *
 *  A entreletra é apertada, e isso não é gosto: espaçamento largo espalha a
 *  palavra e empurra o símbolo para longe dela, e os dois param de ler como uma
 *  coisa só.
 *
 *  A tensão entre símbolo geométrico e tipo clássico é DELIBERADA e está certa.
 *  Ver docs/design.md.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * O centro de TINTA da marca, no viewBox de 64. Medido: 35,4, e não 32.
 * A palavra desce isto para assentar no peso, em vez de boiar no centro da caixa.
 */
const CENTRO_DE_PESO = 35.4;
const QUEDA = (CENTRO_DE_PESO - 32) / 64; // 5,3% da altura da marca

/** Deitado: a marca, e o nome ao lado. */
export function Logo({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: size * 0.2 }}>
      <Mark size={size} />
      <span
        className="mark-word leading-none"
        style={{ fontSize: size * 0.78, transform: `translateY(${size * QUEDA}px)` }}
      >
        Gume
      </span>
    </span>
  );
}

/** Empilhado: a marca em cima, o nome embaixo. Para quando há altura, e não largura. */
export function LogoStacked({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center ${className}`} style={{ gap: size * 0.16 }}>
      <Mark size={size} />
      <span className="mark-word leading-none" style={{ fontSize: size * 0.62 }}>
        Gume
      </span>
    </span>
  );
}

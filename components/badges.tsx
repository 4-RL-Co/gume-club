import {
  Stamp, Brush, Hammer, Megaphone, Flag, ShieldCheck, HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import {
  INSIGNIAS, GLOW_RAIO, GLOW_ALPHA, VERNIZ_TOPO, VERNIZ_BASE, BISEL_LUZ, BISEL_SOMBRA,
  cor, type Insignia,
} from "@/lib/badges-view";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A INSÍGNIA NA TELA.
 *
 *  ═══ MESMA LUZ, MESMA SATURAÇÃO. SÓ O MATIZ MUDA. ═══
 *
 *  As sete têm o MESMO L e o MESMO C em OKLCH, o MESMO raio de glow e o
 *  MESMO alpha. Só o H gira. Isso torna matematicamente impossível uma
 *  parecer mais preciosa que a outra: cor aqui é IDENTIDADE, e nunca
 *  hierarquia. Um teste quebra o build se alguém mover o L, o C, o raio
 *  ou o alpha de uma só delas.
 *
 *  PROIBIDO, e não é gosto, é semântica: ouro, prata e bronze (é um
 *  pódio, e todo mundo lê pódio); a paleta de raridade de jogo (cinza →
 *  verde → azul → roxo → laranja, que qualquer pessoa que já jogou
 *  decodifica na hora, e passa a querer a laranja); glow animado,
 *  pulsante, arco-íris, holográfico. Se uma brilhar mais forte que as
 *  outras, você criou um ranking sem perceber.
 *
 *  ═══ O NÚMERO NÃO VIAJA. A INSÍGNIA VIAJA. ═══
 *
 *  Ela anda junto com o nome porque é PAPEL: diz o que a pessoa É, e não
 *  quanto ela FEZ. Saber que foi um BIBLIOTECÁRIO que fez aquela
 *  correção é informação útil; saber que ele fez quarenta e sete é
 *  placar. O número fica em /contribuidores e não sai de lá.
 * ════════════════════════════════════════════════════════════════════
 */

/** Glifo de traço fino, 1.5px, sempre. Medalha é cheia; insígnia é um traço. */
const GLIFOS: Record<Insignia, LucideIcon> = {
  bibliotecario: Stamp,
  moderador: ShieldCheck,
  zelador: Brush,
  construtor: Hammer,
  // O MESMO glifo de "Quem faz" na barra lateral: apoiar é contribuir.
  apoiador: HeartHandshake,
  arauto: Megaphone,
  fundador: Flag,
};

/**
 * NO FEED: só o glifo, 14px, sem círculo.
 *
 * Trinta linhas de feed com sete medalhas cada viram um cassino. No feed a insígnia
 * é uma nota de rodapé ao lado do nome, e é só isso que ela precisa ser.
 */
export function Badges({ badges, className }: { badges: Insignia[]; className?: string }) {
  if (badges.length === 0) return null;

  return (
    <span className={["inline-flex items-center gap-1.5 align-middle", className ?? ""].join(" ")}>
      {badges.map((b) => {
        const Glifo = GLIFOS[b];
        return (
          <Glifo
            key={b}
            size={14}
            strokeWidth={1.5}
            aria-label={INSIGNIAS[b].label}
            style={{ color: cor(b) }}
          />
        );
      })}
    </span>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  NO PERFIL: A MEDALHA. Redonda, pequena, e ela não fala até você perguntar.
 *
 *  ═══ ELA ERA UMA PLACA COM O NOME ESCRITO ═══
 *
 *  Um retângulo chanfrado, com o glifo e a palavra ao lado: "BIBLIOTECÁRIO",
 *  "MODERADOR", "ZELADOR". Sete dessas embaixo do nome de alguém eram sete blocos de
 *  texto em versalete — e eles competiam com o nome da pessoa, que é a única coisa que
 *  aquele lugar existe para dizer.
 *
 *  Um perfil não é um crachá de congresso.
 *
 *  ═══ AGORA ELA É UMA MEDALHA, E ELA CALA A BOCA ═══
 *
 *  Um círculo de 34 px com o glifo dentro. Sete deles são uma fileira de sete pontinhos
 *  discretos: dá para ver que a pessoa tem coisas, e não dá para ler nada — até você
 *  passar o mouse.
 *
 *  **A palavra não sumiu: ela ficou guardada.** Quem quer saber o que é, passa o mouse e
 *  a insígnia se explica em duas linhas. Quem não quer, vê sete pontinhos bonitos.
 *
 *  ═══ E A REGRA DE FERRO CONTINUA ═══
 *
 *  Mesma geometria, mesma espessura, mesmo bisel, mesmo glow, mesmo L e mesmo C para as
 *  sete. **SÓ O MATIZ GIRA.**
 *
 *  É aqui que a estética de RPG entra sem trazer o veneno dela junto. O que faz um jogo
 *  virar farm não é a medalha: é a medalha DIFERENTE. Ouro contra prata, épico contra
 *  comum. No instante em que uma tiver moldura mais rica que a outra, a pessoa passa a
 *  QUERER aquela, e o sistema inteiro cai.
 * ════════════════════════════════════════════════════════════════════
 */

/** A geometria da medalha. UMA para as sete: se você duplicar isto, criou uma raridade. */
const PLACA = {
  /** O diâmetro. Grande o bastante para o glifo respirar, pequeno o bastante para calar. */
  tamanho: 34,
  borda: 1,
} as const;

/**
 * UMA medalha, sozinha. É a mesma peça que a fileira usa, e não uma segunda cópia dela.
 *
 * Existe porque a tela que EXPLICA as insígnias precisa mostrá-las ao lado de cada
 * explicação: uma insígnia descrita em palavras e nunca vista é uma insígnia que a pessoa
 * não reconhece quando encontra no perfil de alguém.
 *
 * Se você duplicar o desenho dela em outro lugar, criou uma segunda verdade sobre o que é
 * uma insígnia, e uma delas vai ficar para trás.
 */
export function Placa({
  badge,
  apagada = false,
  chegada = null,
  balao = true,
}: {
  badge: Insignia;
  apagada?: boolean;
  /**
   * O balão que explica, ao passar o mouse.
   *
   * A tela QUE EXPLICA as insígnias já tem a explicação escrita ao lado de cada uma, e
   * ali o balão repetiria o texto vizinho. Um balão que repete o que já está na tela não
   * é ajuda: é ruído.
   */
  balao?: boolean;
  /**
   * O número de chegada, só para o fundador. "membro fundador #7".
   *
   * É o ÚNICO número que uma insígnia carrega, e ele é a exceção honesta: não mede o que
   * a pessoa fez, mede QUANDO ela chegou. Ninguém pode fazer mais, ninguém pode fazer
   * menos, e ele não ordena ninguém contra ninguém. Ver lib/badges.ts.
   *
   * Ele mora DENTRO da explicação, e não em cima da medalha: um número desenhado na cara
   * de uma insígnia é a primeira coisa que o olho procura, e aí ele vira placar.
   */
  chegada?: number | null;
}) {
  const Glifo = GLIFOS[badge];
  const i = INSIGNIAS[badge];

  const nome = badge === "fundador" && chegada !== null ? `${i.label} #${chegada}` : i.label;

  return (
    <span
      className="group relative inline-flex shrink-0 items-center justify-center rounded-full align-middle"
      style={{
        width: PLACA.tamanho,
        height: PLACA.tamanho,

        /**
         * ═══ O VERNIZ ═══
         *
         * Um degradê de cima para baixo, e não uma cor chapada. Cor chapada é adesivo;
         * cor com queda é objeto. Igual para as sete.
         */
        background: `linear-gradient(180deg, ${cor(badge, VERNIZ_TOPO)}, ${cor(badge, VERNIZ_BASE)})`,

        /**
         * ═══ O BISEL, E ELE É O QUE FAZ A PEÇA TER ESPESSURA ═══
         *
         * Uma luz fina em cima, uma sombra fina embaixo, e o anel de sempre. São três
         * pixels de sombra que fazem a diferença entre um círculo pintado e uma medalha
         * — é o mesmo truque de uma tecla de teclado.
         *
         * A luz é BRANCA, e não colorida: luz não tem matiz. Se ela puxasse a cor da
         * insígnia, a medalha mais clara pareceria mais iluminada — e aí o matiz teria
         * virado hierarquia pela porta dos fundos.
         *
         * As medidas são as mesmas para as sete. Mexeu numa, criou um pódio.
         */
        boxShadow: [
          `inset 0 1px 0 rgb(255 255 255 / ${BISEL_LUZ})`,
          `inset 0 -1px 0 rgb(0 0 0 / ${BISEL_SOMBRA})`,
          `inset 0 0 0 ${PLACA.borda}px ${cor(badge, 0.32)}`,
          `0 0 ${GLOW_RAIO}px ${cor(badge, GLOW_ALPHA)}`,
        ].join(", "),

        /**
         * APAGADA: a que você ainda não tem, na tela que explica.
         *
         * Translúcida, e NUNCA cinza-com-cadeado. Cadeado é linguagem de jogo, e diz
         * "trabalhe para destravar isto". Aqui a insígnia não é uma recompensa que você
         * persegue: é uma coisa que acontece, ou não, e as duas respostas estão certas.
         */
        opacity: apagada ? 0.32 : 1,
      }}
      role="img"
      aria-label={nome}
    >
      <Glifo size={15} strokeWidth={1.5} style={{ color: cor(badge) }} aria-hidden />

      {/* ═══ A EXPLICAÇÃO, GUARDADA ═══

          A palavra não sumiu quando a placa virou medalha: ela ficou aqui, e aparece
          quando alguém pergunta.

          `title` do navegador não serve: ele demora um segundo, some sozinho, e não cabe
          duas linhas. Uma insígnia que a pessoa não consegue entender é uma insígnia que
          não reconhece ninguém.

          `pointer-events-none` para o balão não roubar o mouse da própria medalha. */}
      {balao && (
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-52 -translate-x-1/2 group-hover:block"
      >
        <span className="surface block px-3.5 py-2.5">
          <span
            className="block text-[11px] uppercase tracking-[0.12em]"
            style={{ color: cor(badge) }}
          >
            {nome}
          </span>
          <span className="mt-1 block text-[12px] leading-relaxed text-[var(--color-ink-soft)]">
            {i.sobre}
          </span>
        </span>
      </span>
      )}
    </span>
  );
}

/**
 * A fileira do perfil. Sete pontinhos discretos, e nenhuma palavra até alguém perguntar.
 */
export function BadgesExplicadas({
  badges,
  chegada = null,
}: {
  badges: Insignia[];
  chegada?: number | null;
}) {
  if (badges.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <li key={b}>
          <Placa badge={b} chegada={chegada} />
        </li>
      ))}
    </ul>
  );
}

/*
 * ═══ O SELO DE APOIADOR FOI EMBORA ═══
 *
 * Ele era um retângulo cinza chapado, sem glow e sem cor — feio DE PROPÓSITO, para que
 * ninguém confundisse quem paga com quem doa trabalho.
 *
 * Duas coisas o mataram. A primeira: **ele nunca foi usado em lugar nenhum.** Era um
 * componente com um teste, uma regra e um parágrafo no docs/design.md, e zero pixels na
 * tela. Uma proteção que não é desenhada não protege nada.
 *
 * A segunda: quem apoia agora tem INSÍGNIA (ver lib/badges-view.ts). E o medo da regra
 * antiga continua certo, então o que ela protegia mudou de lugar:
 *
 *   ANTES  o selo era feio, para ninguém confundir.
 *   AGORA  a insígnia é bonita como as outras, e **diz o que ela é**.
 *
 * Um selo cinza que ninguém entende protege MENOS do que uma insígnia que conta, na
 * cara, "esta pessoa paga a conta do servidor". E a trava de verdade continua de pé:
 * pagar não põe ninguém na página de quem faz.
 */

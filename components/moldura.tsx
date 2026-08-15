import { HONRAS, NOME, nomeCompleto, type Coroa, type PosicaoDupla } from "@/lib/honras";
import { APOIADOR, DEGRAU } from "@/lib/paleta";
import { Avatar } from "@/components/avatar";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A MOLDURA. Um anel, e não um brasão.
 *
 *  A referência é a moldura de avatar do League of Legends, e o que a gente pega dela
 *  é o **anel**. A gema, o louro, a asa e a espada ficam para trás — e não é preguiça:
 *  é o que separa "um app com um toque de jogo" de "um jogo de celular".
 *
 *  Uma moldura barroca de 300 px encolhida para 40 px vira uma bolota dourada. Um anel
 *  de 2 px encolhido para 40 px continua sendo um anel. O Gume mostra cara de gente em
 *  lista, em feed, em busca — e é lá, pequeno, que a moldura precisa funcionar.
 *
 *  ═══ COMO ELA É FEITA ═══
 *
 *  Um `conic-gradient` mascarado num anel: a cor do elo dá a volta, com um arco de
 *  brilho que atravessa. Sem imagem, sem SVG, sem arquivo — o que significa que ela
 *  carrega instantaneamente e é nítida em qualquer tela.
 *
 *  ═══ A REGRA DURA ═══
 *
 *  A moldura mostra em que ELO a pessoa está, ou que ela APOIA o Gume. E nada mais.
 *
 *  Ela nunca vai marcar "quem leu mais este mês", "quem tem a ofensiva mais longa" ou
 *  "quem escreveu mais resenha". Ver a lista de recusas no fim de lib/honras.ts.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * A cor de cada elo. As do LoL, e a escolha é deliberada: o público do Gume reconhece
 * essas cores sem que ninguém explique, e reconhecimento de graça é raro.
 *
 * `de` é a cor do anel; `brilho` é o arco que passa por cima. Dois tons da mesma cor,
 * e nunca duas cores diferentes: um anel bicolor vira um adesivo.
 */
/**
 * O que a moldura mostra: uma honra, ou o apoio.
 *
 * O TIPO mora em lib/honras.ts, junto com a REGRA que decide qual das duas honras vai
 * para o anel (`coroaDe`). Ele morava aqui também, e dois tipos com o mesmo nome sobre a
 * mesma coisa é como duas verdades começam a divergir.
 *
 * As estrelas do topo entram como um NÚMERO ao lado, e não como um anel diferente: "Gume
 * +3" continua sendo o anel do Gume. Um anel novo por estrela seria uma escada infinita
 * de molduras, e aí a moldura deixa de dizer "que altura" e passa a dizer "há quanto
 * tempo você está no topo".
 */

/** Que cor esta coroa usa. */
function tinta(coroa: Coroa) {
  if ("apoiador" in coroa) return APOIADOR;

  const i = (HONRAS as readonly string[]).indexOf(coroa.honra);
  return DEGRAU[i] ?? DEGRAU[0]!;
}

export function Moldura({
  coroa,
  src,
  name,
  handle,
  size = 72,
}: {
  /** O elo da pessoa, ou "apoiador". Sem coroa, a cara é só a cara. */
  coroa?: Coroa | null;
  src?: string | null;
  name?: string | null;
  handle: string;
  size?: number;
}) {
  // Sem moldura, o avatar de sempre. É assim que a esmagadora maioria do app se parece,
  // e ele tem que continuar bonito assim.
  if (!coroa) return <Avatar src={src} name={name} handle={handle} size={size} />;

  const { de, brilho, aura } = tinta(coroa);
  const nome = "apoiador" in coroa ? "apoia o Gume" : NOME[coroa.honra];

  // O anel come uma fatia do lado de fora; a cara ocupa o resto. Sem isto, a moldura
  // cresceria por cima do vizinho na lista.
  const anel = Math.max(2, Math.round(size * 0.035));
  const folga = Math.round(size * 0.07);
  const cara = size - (anel + folga) * 2;

  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      // A moldura é DECORATIVA. Quem usa leitor de tela ouve o nome da pessoa, e o elo
      // dela é dito por escrito no perfil — não por uma cor que ninguém descreve.
      aria-hidden
      title={nome}
    >
      {/**
       * ═══ A AURA. Só o último degrau tem, e é o que o separa da prata ═══
       *
       * O Gume e a Katana estavam lendo como prata: trinta e cinco pontos de luz entre os
       * dois, e não adiantava — num anel fino sobre fundo preto, dois ACROMÁTICOS são a
       * mesma coisa, porque o olho não tem matiz nenhum para segurar.
       *
       * Subir mais a luz era impossível (o Gume já era quase branco), então o topo deixou
       * de ser "o mais claro" e passou a ser **o que brilha**. Uma diferença de natureza, e
       * não de grau. Ver lib/paleta.ts.
       *
       * São duas camadas, e as duas são necessárias: um halo LARGO e fraco, que é o que dá
       * a impressão de luz caindo em volta, e um halo CURTO e forte colado no anel, que é o
       * que faz a linha parecer acesa em vez de apenas clara.
       */}
      {aura && (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            inset: -Math.round(size * 0.06),
            boxShadow:
              `0 0 ${Math.round(size * 0.30)}px ${Math.round(size * 0.06)}px ` +
              `color-mix(in srgb, ${aura} 42%, transparent), ` +
              `0 0 ${Math.round(size * 0.10)}px ${Math.round(size * 0.01)}px ` +
              `color-mix(in srgb, ${aura} 78%, transparent)`,
          }}
        />
      )}

      {/* O anel: a cor do elo dá a volta, e um arco claro atravessa. */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          padding: anel,
          /**
           * O anel do TOPO fecha a volta inteira; os outros nove desvanecem.
           *
           * Um anel que some em 300° parece um traço de luz PASSANDO pela cara — que é o
           * desenho certo para um degrau. Para o topo, ele parecia inacabado: um fio aceso
           * que apaga no meio do caminho não é um fio aceso.
           */
          background: aura
            ? `conic-gradient(from -60deg,
                ${de} 0deg,
                ${brilho} 130deg,
                ${de} 260deg,
                ${brilho} 360deg)`
            : `conic-gradient(from -60deg,
                transparent 0deg,
                color-mix(in srgb, ${de} 35%, transparent) 40deg,
                ${de} 110deg,
                ${brilho} 130deg,
                ${de} 150deg,
                color-mix(in srgb, ${de} 35%, transparent) 225deg,
                transparent 300deg)`,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
        }}
      />

      {/* O segundo anel, de fora. Quase invisível, e é ele que faz parecer caro. */}
      <span
        className="absolute rounded-full"
        style={{
          inset: -Math.round(size * 0.055),
          border: `1px solid color-mix(in srgb, ${de} 16%, transparent)`,
        }}
      />

      <Avatar src={src} name={name} handle={handle} size={cara} />
    </span>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A BARRA. Uma só, no perfil.
 *
 *  Uma escada só: livros, HQs e volumes de mangá contam juntos. E agora dois CAMINHOS
 *  pra subir nela — leituras ou páginas de livros terminados, o que levar mais longe
 *  (ver melhorPosicao() em lib/honras.ts). O CABEÇALHO mostra os dois números sempre
 *  ("12 leituras, 3.400 páginas"): é o retrato completo, não só quem está ganhando. O
 *  "faltam", que é sobre a BARRA em si, continua na régua que está de fato empurrando
 *  a pessoa pra frente — misturar as duas unidades ali confundiria o "faltam quanto".
 * ════════════════════════════════════════════════════════════════════
 */
export function Barra({ p }: { p: PosicaoDupla }) {
  const { de, brilho } = tinta({ honra: p.honra });
  const singular = p.via === "paginas" ? "página" : "leitura";
  const plural = p.via === "paginas" ? "páginas" : "leituras";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[11px] uppercase tracking-[0.12em]">
          <span style={{ color: de }}>{nomeCompleto(p)}</span>
          <span className="text-[var(--color-ink-faint)]">
            {" · "}
            <span className="tabular">{p.livros.toLocaleString("pt-BR")}</span>{" "}
            {p.livros === 1 ? "leitura" : "leituras"}
            {", "}
            <span className="tabular">{p.paginas.toLocaleString("pt-BR")}</span> páginas
          </span>
        </span>

        {/* No topo, o alvo é a próxima ESTRELA, e não um degrau que não existe. Uma barra
            cheia e parada para sempre é uma barra que zomba de quem chegou. */}
        <span className="tabular text-[12px] text-[var(--color-ink-faint)]">
          {p.faltam === 1 ? `falta 1 ${singular}` : `faltam ${p.faltam.toLocaleString("pt-BR")} ${plural}`}{" "}
          {p.proxima ? `para ${NOME[p.proxima]}` : "para a próxima estrela"}
        </span>
      </div>

      <div
        className="mt-2 h-[3px] w-full overflow-hidden rounded-full"
        style={{ background: "color-mix(in srgb, var(--color-ink) 8%, transparent)" }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${Math.round(p.fracao * 100)}%`,
            background: `linear-gradient(90deg, ${de}, ${brilho})`,
          }}
        />
      </div>
    </div>
  );
}

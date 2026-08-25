import Link from "next/link";
import { Mark } from "@/components/mark";
import { CODIGO, INSTAGRAM } from "@/lib/onde";

export const metadata = {
  title: "Sobre · Gume",
  description: "A mente leitora nunca perde o fio.",
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  A ÚNICA PÁGINA QUE PODE DIZER QUE O CÓDIGO É ABERTO.
 *
 *  Em uma frase, e em nenhum outro lugar do produto. O app fala com
 *  leitores; o GitHub fala com quem constrói. Ver AGENTS.md.
 *
 *  ═══ ELA É UM MANIFESTO, E NÃO UMA PÁGINA DE AJUDA ═══
 *
 *  Era uma coluna de parágrafos cinzas do mesmo tamanho, e uma coluna de
 *  parágrafos do mesmo tamanho não tem hierarquia: o olho não sabe onde
 *  parar, e a frase que carrega o produto inteiro ("livro é pedra de
 *  amolar") passava despercebida no meio das outras.
 *
 *  Agora ela tem RESPIRAÇÃO: a tese em serifa grande, a lista de recusas
 *  em bloco, e o convite no fim. É a mesma voz da home deslogada, e é de
 *  propósito: quem chega aqui está tentando entender a mesma coisa.
 *
 *  Sem ilustração, sem captura de tela, sem grade de recursos. A régua é
 *  o docs/design.md: vidro é chrome, papel é conteúdo, e a única cor
 *  deste produto é a capa de um livro.
 * ════════════════════════════════════════════════════════════════════
 */

/** O que o Gume recusa. É a parte que nenhum concorrente pode copiar: para eles, isto é receita. */
const RECUSAS = [
  "Sem ofensiva de sete dias para você manter.",
  "Sem algoritmo decidindo o que você vê.",
  /**
   * ═══ ESTA LINHA DIZIA "SEM NOTA MÉDIA, SEM PLACAR, SEM COMPETIÇÃO" ═══
   *
   * E ela virou MENTIRA no minuto em que o elo entrou. O Gume tem Ferro, Bronze, Prata,
   * tem moldura e tem barra de progresso — e uma home que promete o contrário na cara de
   * quem chega é propaganda enganosa, não importa quão bonita seja a frase.
   *
   * A frase foi trocada pela verdade, e a verdade continua sendo uma recusa forte: o elo
   * existe, e **o placar não**. Não há lista dos maiores leitores, não há posição, e o
   * número nunca cai. Ver lib/honras.ts e lib/honras.regras.test.ts.
   */
  "Sem nota média e sem placar: existe uma honra, e não existe lista dos maiores.",
  "A honra nunca cai. Parar de ler por um ano não custa nada.",
  "Sem anúncio, e o que você lê nunca está à venda.",
];

export default function Sobre() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 sm:px-10">
      {/* ── a tese ─────────────────────────────────────────────────── */}
      <section className="pt-20 sm:pt-28">
        <Mark size={30} className="text-[var(--color-ink-soft)]" />

        <h1 className="voice mt-10 max-w-2xl text-[40px] leading-[1.06] tracking-[-0.02em] sm:text-[58px]">
          A mente leitora nunca <em className="italic text-[var(--color-ink-soft)]">perde o fio</em>.
        </h1>
      </section>

      {/* ── a metáfora, e ela é o produto inteiro ──────────────────── */}
      <section className="mt-16 flex flex-col gap-6 text-[17px] leading-relaxed text-[var(--color-ink-soft)] sm:mt-20">
        <p className="max-w-xl">
          Uma lâmina que ninguém amola não enferruja de um dia para o outro. Ela vai perdendo o
          corte devagar, e continua parecendo uma lâmina. Você só descobre quando ela falha em
          cortar o que sempre cortou.
        </p>

        <p className="max-w-xl">
          Com a cabeça é igual. Ninguém percebe o dia em que parou de pensar direito. A perda é
          silenciosa, e o instrumento continua parecendo o mesmo.
        </p>
      </section>

      {/* A frase que carrega tudo. Sozinha, grande, com ar em volta: ela estava
          espremida entre dois parágrafos cinzas do mesmo tamanho, e ninguém a via. */}
      <p className="voice my-16 max-w-2xl text-[30px] leading-snug tracking-[-0.01em] text-[var(--color-ink)] sm:my-20 sm:text-[38px]">
        Livro é pedra de amolar. Quem passa na pedra não perde o fio.
      </p>

      {/* ── o que é ────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-6 text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
        <p className="max-w-xl">
          O Gume é um lugar para registrar o que você leu, o que está lendo e o que ainda está
          esperando na estante. Ter um livro e ler um livro são coisas diferentes, e aqui elas são
          contadas separadas.
        </p>

        <p className="max-w-xl">
          A nota é uma palavra, e nunca um número: estrela vira escala, escala vira média, e média
          vira placar. O que você escreve aqui é seu, e vai continuar sendo.
        </p>
      </section>

      {/* ── as recusas. É a dobra mais forte, e a única que ninguém copia ── */}
      <section className="mt-20 border-t border-[var(--color-rule)] pt-14 sm:mt-24">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          o que você não vai encontrar aqui
        </h2>

        <ul className="mt-10 flex flex-col gap-8 sm:gap-10">
          {RECUSAS.map((linha) => (
            <li key={linha} className="voice text-[24px] leading-[1.25] tracking-[-0.01em] sm:text-[32px]">
              {linha}
            </li>
          ))}
        </ul>

        <p className="mt-12 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Nada disso é esquecimento. Cada uma dessas coisas foi recusada de propósito, e é por
          isso que ler aqui é silencioso.
        </p>
      </section>

      {/* ── o convite ──────────────────────────────────────────────── */}
      <section className="mt-20 border-t border-[var(--color-rule)] pt-14 sm:mt-24">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          e ele não é feito só por nós
        </h2>

        <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
          Quem conserta uma ficha errada está construindo o Gume tanto quanto quem escreve uma
          linha de código. O catálogo chegou incompleto, e ele se arruma com quem tem o livro na
          mão.
        </p>

        <div className="mt-8">
          <Link
            href="/contribuidores"
            className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-canvas)]"
          >
            Ver quem faz
          </Link>
        </div>
      </section>

      {/* ── a frase que só pode ser dita aqui ──────────────────────── */}
      <section className="mt-20 border-t border-[var(--color-rule)] pt-14 sm:mt-24">
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-faint)]">
          O Gume é aberto: qualquer pessoa pode ver como ele é feito, ou rodar o seu próprio, em{" "}
          <a
            href={CODIGO}
            className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            {CODIGO.replace("https://", "")}
          </a>
          . Se você quiser opinar no que vem depois, ou avisar que alguma coisa quebrou, é no{" "}
          <a
            href={INSTAGRAM}
            className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            Instagram
          </a>
          .
        </p>

        <p className="mt-8">
          <Link
            href="/"
            className="text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            ir para a estante
          </Link>
        </p>
      </section>
    </main>
  );
}

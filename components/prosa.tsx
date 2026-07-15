import { ehIngles } from "@/lib/idioma";
import { FONTES, type Fonte } from "@/lib/licenca";
import { limparMarcacao } from "@/lib/texto";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A PROSA DE FORA: a sinopse de um livro, a descrição de um autor.
 *
 *  Um só componente porque as duas coisas obedecem às mesmas três regras:
 *
 *    1. Chega em markdown e sai como frase. Ver lib/texto.ts.
 *    2. Respeita o parágrafo. Um bloco de dez linhas sem respiro é um muro.
 *    3. **Diz de onde veio.** Sempre.
 *
 *  ═══ A TERCEIRA REGRA NÃO É ENFEITE ═══
 *
 *  O Gume promete publicar um dataset CC0. Uma promessa que ninguém pode conferir é
 *  propaganda — e conferir começa por saber, em cada texto, quem escreveu.
 *
 *  A Open Library e o Wikidata são CC0: o texto deles entra no dataset. A Wikipédia é
 *  CC-BY-SA: aparece na tela, com crédito, e fica FORA do dataset. O crédito é o que
 *  torna essa diferença visível em vez de ser uma nota de rodapé num arquivo.
 * ════════════════════════════════════════════════════════════════════
 */

/** O nome que o leitor conhece. Ninguém fora daqui sabe o que é `openlibrary`. */
const DE_ONDE: Record<Fonte, string> = {
  openlibrary: "da Open Library",
  wikidata: "do Wikidata",
  wikipedia: "da Wikipédia",
  gume: "escrito aqui no Gume",
};

/**
 * `Record<Fonte, …>`, e não `Record<string, …>`: se alguém abrir uma fonte nova em
 * lib/licenca.ts e esquecer de dar um nome a ela aqui, os tipos quebram a build. O
 * leitor nunca vai ver um crédito faltando porque um mapa ficou desatualizado.
 */
function nomeDaFonte(fonte: string | null): string | null {
  return FONTES.includes(fonte as Fonte) ? DE_ONDE[fonte as Fonte] : null;
}

export function Prosa({
  texto,
  fonte,
  className = "",
}: {
  texto: string | null;
  fonte: string | null;
  className?: string;
}) {
  const limpo = limparMarcacao(texto);
  if (!limpo) return null;

  /**
   * ═══ SINOPSE EM INGLÊS NÃO VAI PARA A TELA ═══
   *
   * A Open Library é um acervo anglófono, e boa parte do que ela tem sobre um livro
   * brasileiro está em inglês. A maioria de quem lê aqui não lê em inglês, e uma
   * sinopse que a pessoa não entende é PIOR do que nenhuma: ela ocupa o lugar onde a
   * sinopse certa apareceria, e faz o livro parecer estrangeiro.
   *
   * O texto continua no banco, e continua no dataset CC0 — ele é um dado válido, só
   * não é para esta tela. Quando a Wikipédia em português tiver a obra, a sinopse dela
   * entra no lugar. Até lá, o livro fica sem, e sem é honesto.
   */
  if (ehIngles(limpo)) return null;

  const paragrafos = limpo.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const credito = nomeDaFonte(fonte);

  return (
    <div className={`max-w-prose ${className}`}>
      {/* `{p}` — texto, e nunca `dangerouslySetInnerHTML`. Isto entrou no banco por um
          dump de terceiro, e dado de fora não vira marcação executável. */}
      {paragrafos.map((p, i) => (
        <p
          key={i}
          className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)] first:mt-0"
        >
          {p}
        </p>
      ))}

      {credito && (
        <p className="mt-3 text-[12px] text-[var(--color-ink-faint)]">{credito}</p>
      )}
    </div>
  );
}

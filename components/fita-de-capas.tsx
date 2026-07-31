import { Cover } from "@/components/cover";
import type { CapaDaParede } from "@/lib/parede";

/**
 * ════════════════════════════════════════════════════════════════════
 *  UMA FILEIRA DE CAPAS, QUIETA.
 *
 *  A parede da home é um fundo de três fileiras que andam, atrás de uma serifa gigante:
 *  ela é o rosto do app, e pode ser grande. Aqui a capa não é o assunto, é a razão. Ela
 *  responde a uma pergunta que o texto ao lado faz ("apoiar o quê?") e depois sai da
 *  frente.
 *
 *  Por isso: uma fileira só, parada, sem perspectiva e sem rodízio. Movimento aqui
 *  competiria com o que a pessoa veio ler, e a decisão de apoiar não é uma decisão que se
 *  toma olhando coisa andando.
 *
 *  ═══ ELA É DECORAÇÃO, E SE COMPORTA COMO TAL ═══
 *
 *  `aria-hidden` e sem link: quem usa leitor de tela não ganha nada ouvindo quinze
 *  títulos de livro no meio de uma explicação sobre custo de servidor, e quem clica numa
 *  capa aqui seria levado para longe da única coisa que esta tela pede.
 *
 *  As bordas somem num degradê para a fileira não terminar num corte seco: capa cortada
 *  no meio lê como imagem quebrada, e capa que desmaia lê como estante que continua.
 * ════════════════════════════════════════════════════════════════════
 */
export function FitaDeCapas({ capas }: { capas: CapaDaParede[] }) {
  if (capas.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none relative -mx-6 mt-12 overflow-hidden sm:-mx-10"
      style={{
        // O degradê é máscara, e não uma faixa preta por cima: por cima, ele pintaria uma
        // barra sólida em cima do fundo de quem estiver no tema claro.
        maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
      }}
    >
      <ul className="flex gap-3 px-6 sm:gap-4 sm:px-10">
        {capas.map((c, i) => (
          <li key={i} className="w-20 shrink-0 sm:w-24">
            <Cover title={c.title} author={c.author} src={c.cover_url} />
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";
import { Crown } from "lucide-react";
import { Cover } from "@/components/cover";
import { getQueridinhos } from "@/lib/queridinhos";
import { DOURADO } from "@/lib/dourado";

/**
 * O CARTÃO DA CURADORIA DO GUME: a coroa dourada, o título editorial, e o pódio
 * de verdade dentro (as cinco capas mais adoradas, a 1ª no trono). Um componente
 * só, porque ele aparece em três vitrines (explorar, /listas, e fixado no
 * perfil da casa) e três cópias divergiriam na primeira semana.
 *
 * Só existe quando já existe queridinho: cartão de vitrine vazio é promessa quebrada.
 */
export async function CuradoriaCard({ compacto = false }: { compacto?: boolean }) {
  const queridinhos = await getQueridinhos(8);
  if (queridinhos.length === 0) return null;

  return (
    <Link
      href="/queridinhos"
      className={`surface surface-hover block overflow-hidden ${compacto ? "p-5" : "p-7 sm:p-9"}`}
    >
      {/* Dourado, a assinatura da curadoria da casa: exceção de cor dirigida pelo
          dono (ai/DECISIONS.md). */}
      <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]" style={{ color: DOURADO }}>
        <Crown size={13} strokeWidth={1.75} aria-hidden />
        a curadoria do Gume
      </span>
      <span className={`voice mt-2 block leading-tight text-[var(--color-ink)] ${compacto ? "text-[19px]" : "text-[26px] sm:text-[30px]"}`}>
        Top 100: os queridinhos do Gume
      </span>
      {!compacto && (
        <span className="mt-2 block max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
          Os cem livros que a comunidade mais amou, na ordem do amor recebido.
          Ninguém edita: cada &quot;gostei&quot; e cada &quot;adorei&quot; conta um voto, e a
          lista se refaz sozinha.
        </span>
      )}

      {/* A FAIXA de capas, contígua e cheia, como as listas em destaque do
          Letterboxd: o card é a vitrine, e a vitrine se enche de livro. Cada capa
          se sobrepõe um dedo na anterior; a 1ª (o queridinho-mor) fica por cima. */}
      <span className={`flex items-stretch overflow-hidden rounded-[var(--radius-cover)] ${compacto ? "mt-4" : "mt-6"}`}>
        {queridinhos.map((q, i) => (
          <span
            key={q.slug}
            className="relative block shrink-0 overflow-hidden"
            style={{
              width: `${(100 + (queridinhos.length - 1) * 2) / queridinhos.length}%`,
              marginLeft: i === 0 ? 0 : "-2%",
              zIndex: queridinhos.length - i,
              borderRadius: "var(--radius-cover)",
              boxShadow: "3px 0 10px rgba(0,0,0,0.35)",
            }}
          >
            <Cover title={q.title} author={q.author} src={q.coverUrl} />
          </span>
        ))}
      </span>
    </Link>
  );
}

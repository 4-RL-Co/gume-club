import Link from "next/link";
import { Crown } from "lucide-react";
import { Cover } from "@/components/cover";
import { getQueridinhos } from "@/lib/queridinhos";

/**
 * O CARTÃO DA CURADORIA DO GUME: a coroa dourada, o título editorial, e o pódio
 * de verdade dentro (as cinco capas mais adoradas, a 1ª no trono). Um componente
 * só, porque ele aparece em três vitrines (explorar, /colecoes, e fixado no
 * perfil da casa) e três cópias divergiriam na primeira semana.
 *
 * Só existe quando já existe queridinho: cartão de vitrine vazio é promessa quebrada.
 */
export async function CuradoriaCard({ compacto = false }: { compacto?: boolean }) {
  const queridinhos = await getQueridinhos(5);
  if (queridinhos.length === 0) return null;

  return (
    <Link
      href="/queridinhos"
      className={`surface surface-hover block overflow-hidden ${compacto ? "p-5" : "p-7 sm:p-9"}`}
    >
      {/* Dourado, a assinatura da curadoria da casa: exceção de cor dirigida pelo
          dono (ai/DECISIONS.md). */}
      <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]" style={{ color: "#d9a520" }}>
        <Crown size={13} strokeWidth={1.75} aria-hidden />
        a curadoria do Gume
      </span>
      <span className={`voice mt-2 block leading-tight text-[var(--color-ink)] ${compacto ? "text-[19px]" : "text-[26px] sm:text-[30px]"}`}>
        Top 100: os queridinhos do Gume
      </span>
      {!compacto && (
        <span className="mt-2 block max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
          Os cem livros que a comunidade mais adorou, na ordem do amor recebido.
          Ninguém edita: cada veredito conta, e a lista se refaz sozinha.
        </span>
      )}

      <span className={`flex items-end gap-3 ${compacto ? "mt-4" : "mt-6"}`}>
        {queridinhos.map((q, i) => (
          <span
            key={q.slug}
            className="cover-lift block shrink-0"
            style={{ width: `${i === 0 ? 21 : 16 - i}%`, zIndex: 10 - i }}
          >
            <Cover title={q.title} author={q.author} src={q.coverUrl} />
          </span>
        ))}
      </span>
    </Link>
  );
}

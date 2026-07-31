import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/viewer";
import { apoioLigado, precoDo } from "@/lib/stripe";
import { ehApoiador } from "@/lib/apoio";
import { AssinarBotao, AvulsoForm } from "@/components/apoiar-botoes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apoiar o Gume",
  description: "Quem apoia paga a conta do servidor. E não ganha nada que os outros não tenham.",
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  APOIAR O GUME.
 *
 *  A tela inteira existe para dizer uma coisa que quase nenhum produto diz: apoiar NÃO
 *  destrava nada. Sem função extra, sem limite maior, sem tela escondida. Quem apoia
 *  paga a conta do servidor, e ganha uma insígnia que diz isso na cara.
 *
 *  Se um dia esta página listar uma vantagem, ela virou outra coisa.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function Apoiar({
  searchParams,
}: {
  searchParams: Promise<{ obrigado?: string }>;
}) {
  /**
   * Sem Stripe configurado, a página não existe. Quem hospeda o próprio Gume não tem
   * conta de pagamento, e não deveria ver uma tela de apoio que não leva a lugar nenhum.
   */
  if (!apoioLigado()) notFound();

  const { obrigado } = await searchParams;
  const viewer = await getViewer();

  const [me] = viewer
    ? await db.execute<{ apoia: boolean }>(sql`
        select ${ehApoiador(sql`u`)} as apoia from users u where u.id = ${viewer.id}::uuid limit 1`)
    : [];

  const planos = [
    { tier: "marcador" as const, rotulo: "Marcador", preco: "R$ 4,90" },
    { tier: "lombada" as const, rotulo: "Lombada", preco: "R$ 9,90" },
    { tier: "capadura" as const, rotulo: "Capa dura", preco: "R$ 19,90" },
  ].filter((p) => precoDo(p.tier));

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
      <h1 className="voice mt-16 text-[44px] leading-[1.02] tracking-[-0.015em] sm:mt-20 sm:text-[56px]">
        Apoiar o Gume
      </h1>

      {obrigado && (
        <p className="surface mt-8 p-6 text-[15px] leading-relaxed text-[var(--color-ink)]">
          Obrigado. O seu apoio já está valendo, e a insígnia aparece no seu perfil em
          instantes.
        </p>
      )}

      <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
        O Gume não tem anúncio, não vende o que você lê, e não guarda função nenhuma atrás
        de pagamento. Quem apoia paga a conta do servidor, e é só isso que acontece.
      </p>

      <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
        Você ganha uma insígnia no seu perfil, e ela diz o que é: esta não se conquista,
        ela se paga. Nada além disso muda. Ninguém que apoia enxerga uma tela a mais do que
        você enxerga hoje.
      </p>

      {!viewer && (
        <p className="mt-8 text-[15px] text-[var(--color-ink-soft)]">
          <Link
            href="/entrar"
            className="underline decoration-[var(--color-ink)] underline-offset-4"
          >
            Entre
          </Link>{" "}
          para apoiar, porque a insígnia precisa saber de quem ela é.
        </p>
      )}

      {viewer && me?.apoia && (
        <p className="surface mt-8 p-6 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          <span className="font-medium text-[var(--color-ink)]">Você já apoia o Gume.</span>{" "}
          Obrigado. Se quiser, dá para apoiar de novo aqui embaixo, e escolher se o seu nome
          aparece na lista lá em{" "}
          <Link href="/perfil" className="underline decoration-[var(--color-ink)] underline-offset-4">
            perfil
          </Link>
          .
        </p>
      )}

      {viewer && planos.length > 0 && (
        <section className="surface mt-8 p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            todo mês
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            Os três valem a mesma insígnia. A diferença é só quanto você quer ajudar, e dá
            para cancelar quando quiser.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {planos.map((p) => (
              <AssinarBotao key={p.tier} tier={p.tier} rotulo={p.rotulo} preco={p.preco} />
            ))}
          </div>
        </section>
      )}

      {viewer && (
        <section className="surface mt-6 p-6">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            uma vez só
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            Você escolhe o valor. A insígnia fica por um mês, e cada apoio novo soma mais um
            mês ao que já estava valendo.
          </p>
          <AvulsoForm />
        </section>
      )}

      <p className="mt-10 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-faint)]">
        O pagamento acontece fora do Gume, numa página do Stripe. Nenhum dado do seu cartão
        passa por aqui, nem fica guardado com a gente.
      </p>
    </main>
  );
}

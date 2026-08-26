import { getChangelog } from "@/lib/roadmap";
import { Cabecalho, Portas } from "@/components/casa-de-quem-faz";
import { Empty } from "@/components/empty";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "O que já chegou · Gume",
  description: "O que era ideia, virou planejado, e um dia saiu do ar direto pro app.",
};

/** "Chegou em agosto de 2026", nunca uma data técnica. */
function quando(data: Date): string {
  return new Date(data).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE JÁ CHEGOU. O par de /o-que-vem: cada item que saiu de lá acaba aqui.
 *
 *  Não é uma segunda lista escrita à mão — é o MESMO roadmap_items, filtrado por
 *  status = 'lancado', ordenado por quando saiu (lib/roadmap.ts, getChangelog()). O
 *  dono muda o status uma vez, na aba de /painel, e o item se move sozinho de uma
 *  tela pra outra.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function OQueChegou() {
  const itens = await getChangelog();

  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 sm:px-10">
      <Cabecalho
        eyebrow="o que já chegou"
        titulo={<>O que já <em className="italic text-[var(--color-ink-soft)]">chegou</em>.</>}
        linha="Cada linha aqui já foi uma ideia, num dia qualquer, em o que vem por aí."
      />

      {itens.length === 0 ? (
        <div className="mt-12">
          <Empty>Nada por aqui ainda. O primeiro item vai aparecer quando sair do ar.</Empty>
        </div>
      ) : (
        <ul className="mt-12 flex flex-col gap-8 border-l pl-6" style={{ borderColor: "var(--color-rule)" }}>
          {itens.map((item) => (
            <li key={item.id} className="relative">
              <span
                aria-hidden
                className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full"
                style={{ background: "var(--color-colaborar)" }}
              />
              <p className="text-[12px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                {quando(item.lancadoEm)}
              </p>
              <p className="voice mt-2 text-[19px] leading-snug text-[var(--color-ink)]">{item.title}</p>
              {item.description && (
                <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Portas aqui="o-que-chegou" />
    </main>
  );
}

import { Cabecalho, Portas } from "@/components/casa-de-quem-faz";
import { MUDANCAS } from "@/lib/mudancas";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  /o-que-mudou: o irmão do /o-que-falta, olhando para trás.
 *
 *  A casa de quem faz tinha o futuro (o que falta), as pessoas (quem faz) e o
 *  reconhecimento (as insígnias). Faltava o passado: um app que se constrói em
 *  voz alta precisa de um lugar onde quem volta depois de duas semanas descobre
 *  o que chegou, sem arqueologia.
 *
 *  Só coisa grande entra, e a régua mora em lib/mudancas.ts. A voz é de leitor,
 *  varrida por teste, como toda tela.
 * ════════════════════════════════════════════════════════════════════
 */
export default function OQueMudou() {
  // Agrupa por dia: duas mudanças do mesmo dia dividem a mesma data na margem.
  const porDia = new Map<string, typeof MUDANCAS>();
  for (const m of MUDANCAS) {
    porDia.set(m.quando, [...(porDia.get(m.quando) ?? []), m]);
  }

  const dataBonita = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
      <Cabecalho
        eyebrow="o que mudou"
        titulo="O Gume de hoje não é o de ontem."
        linha="As mudanças grandes, da mais nova para baixo. Coisa pequena não entra: isto é o que você notaria sozinho, voltando depois de um tempo fora."
      />

      <ol className="mt-14 flex flex-col gap-12">
        {[...porDia.entries()].map(([dia, mudancas]) => (
          <li key={dia} className="relative border-l pl-7" style={{ borderColor: "var(--color-rule)" }}>
            {/* O ponto na linha do tempo, na cor da casa. */}
            <span
              aria-hidden
              className="absolute -left-[5px] top-1.5 h-[9px] w-[9px] rounded-full"
              style={{ background: "var(--color-colaborar)" }}
            />
            <p className="tabular text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              {dataBonita(dia)}
            </p>

            <div className="mt-4 flex flex-col gap-8">
              {mudancas.map((m) => (
                <article key={m.titulo}>
                  <h2 className="voice text-[22px] leading-snug text-[var(--color-ink)]">
                    {m.titulo}
                  </h2>
                  <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                    {m.texto}
                  </p>
                </article>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <Portas aqui="o-que-mudou" />
    </main>
  );
}

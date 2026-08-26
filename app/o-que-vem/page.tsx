import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { getRoadmapAberto, votosRestantes } from "@/lib/roadmap";
import { STATUS_ABERTOS, STATUS_LABEL } from "@/lib/roadmap-view";
import { Cabecalho, Portas } from "@/components/casa-de-quem-faz";
import { Empty } from "@/components/empty";
import { RoadmapVote } from "@/components/roadmap-vote";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "O que vem por aí · Gume",
  description: "O que está planejado, em andamento, e as ideias. Vota quem quiser.",
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE VEM POR AÍ. Reabre a decisão de 2026-07-11 — ver ai/DECISIONS.md.
 *
 *  "crie uma pagina de roadmap onde eu vou colocar funcionalidades q estão
 *  planejadas, que estão em andamento e ideias" + "cada usuario tem 3 upvotes por
 *  ano para gatar nessses itens" — o dono.
 *
 *  ═══ VOTOS INFORMAM. ELES NÃO DECIDEM (ai/PRD.md) ═══
 *
 *  A ordem de cada item é escolha do dono, escrita à mão na aba de /painel — nunca um
 *  cálculo de popularidade. O número de votos aparece do lado de cada item porque é um
 *  sinal real de interesse, e a régua fica dita em voz alta na tela: sem prometer que o
 *  mais votado é o próximo a sair.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function OQueVem() {
  const viewer = await getViewer();
  const [porStatus, restantes] = await Promise.all([
    getRoadmapAberto(viewer),
    votosRestantes(viewer),
  ]);

  const vazio = STATUS_ABERTOS.every((s) => porStatus[s].length === 0);

  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 sm:px-10">
      <Cabecalho
        eyebrow="o que vem por aí"
        titulo={<>O que vem por <em className="italic text-[var(--color-ink-soft)]">aí</em>.</>}
        linha={
          <>
            O que está em andamento, o que está planejado, e as ideias que ainda nem
            começaram. {viewer
              ? `Você tem ${restantes} de 3 votos disponíveis este ano.`
              : "Entre para votar: são 3 votos por ano, e dá para trocar de item quando quiser."}
          </>
        }
      />

      <p className="mt-6 max-w-xl text-[14px] leading-relaxed text-[var(--color-ink-faint)]">
        Os votos ajudam a decidir, mas quem decide continua sendo a gente que constrói: um
        item muito votado não pula a fila sozinho. Ver{" "}
        <Link
          href="/o-que-chegou"
          className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
        >
          o que já chegou
        </Link>
        .
      </p>

      {vazio ? (
        <div className="mt-12">
          <Empty>Nada na lista ainda. Volte em breve.</Empty>
        </div>
      ) : (
        STATUS_ABERTOS.map((status) => {
          const itens = porStatus[status];
          if (itens.length === 0) return null;
          return (
            <section key={status} className="mt-14">
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
                {STATUS_LABEL[status]}
              </h2>

              <ul className="mt-5 flex flex-col gap-3">
                {itens.map((item) => (
                  <li
                    key={item.id}
                    className="surface flex items-start justify-between gap-4 p-5"
                  >
                    <div className="min-w-0">
                      <p className="voice text-[17px] leading-snug text-[var(--color-ink)]">{item.title}</p>
                      {item.description && (
                        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <RoadmapVote
                      itemId={item.id}
                      votei={item.viewerVotou}
                      votos={item.votos}
                      podeVotar={Boolean(viewer)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      <Portas aqui="o-que-vem" />
    </main>
  );
}

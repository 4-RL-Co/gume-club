import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { FeedList } from "@/components/feed-list";
import { Explore } from "@/components/explore";
import { Recomendacoes } from "@/components/recomendacoes";
import { AmigosLendo } from "@/components/amigos-lendo";
import { getAmigosLendo } from "@/lib/social";

export const dynamic = "force-dynamic";

/**
 * PESSOAS. Três abas: Amigos, Explorar, Recomendações.
 *
 * Eram três itens de barra lateral, e eram a mesma pergunta feita de três jeitos:
 * "o que a gente está fazendo com livros". Amigos é quem você já escolheu;
 * Explorar é como você escolhe; Recomendações é o que passou de mão em mão. Três
 * abas de uma tela, e não três destinos.
 *
 * A barra lateral responde ONDE ESTOU. Ela não responde "que recorte eu estou
 * olhando": isso é filtro, e filtro mora na tela que ele filtra.
 */
const ABAS = [
  { key: "amigos", label: "Amigos" },
  { key: "explorar", label: "Explorar" },
  { key: "recomendacoes", label: "Recomendações" },
] as const;

type Aba = (typeof ABAS)[number]["key"];

export default async function Pessoas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const aba: Aba = ABAS.find((a) => a.key === one(params.aba))?.key ?? "amigos";
  const viewer = await getViewer();

  // A tira de "lendo agora" só faz sentido na aba de amigos, e só para quem entrou.
  const lendo = viewer && aba === "amigos" ? await getAmigosLendo(viewer) : [];

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      <ScreenHeader
        title="Pessoas"
        meta={aba === "amigos" ? ["cronológico", "sem algoritmo"] : undefined}
      />

      <nav className="mt-8 flex flex-wrap gap-2">
        {ABAS.map((a) => {
          const on = a.key === aba;
          return (
            <Link
              key={a.key}
              href={`/pessoas?aba=${a.key}`}
              aria-current={on ? "page" : undefined}
              className={[
                "pill px-4 py-2 text-[14px] transition-colors",
                on
                  ? "afiado font-medium text-[var(--color-ink)]"
                  : "text-[var(--color-ink-soft)] hover:bg-white/[0.03] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {a.label}
            </Link>
          );
        })}
      </nav>

      {!viewer ? (
        <Empty>
          <Link href="/entrar" className="underline decoration-[var(--color-ink)] underline-offset-4">
            Entre
          </Link>{" "}
          para ver o que as pessoas que você segue andaram lendo.
        </Empty>
      ) : aba === "amigos" ? (
        <>
          <AmigosLendo amigos={lendo} />
          <FeedList viewer={viewer} cursor={one(params.antes) ?? null} />
        </>
      ) : aba === "explorar" ? (
        <Explore viewer={viewer} />
      ) : (
        <Recomendacoes viewerId={viewer.id} track={one(params.trilha)} />
      )}
    </main>
  );
}

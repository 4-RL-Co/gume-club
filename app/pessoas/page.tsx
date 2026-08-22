import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer, getUser } from "@/lib/viewer";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { FeedList } from "@/components/feed-list";
import { Recomendacoes } from "@/components/recomendacoes";
import { AmigosLendo } from "@/components/amigos-lendo";
import { Conexoes } from "@/components/conexoes";
import { InviteLink } from "@/components/invite-link";
import { getAmigosLendo } from "@/lib/social";
import { getConexoes } from "@/lib/conexoes";
import { inviteLink } from "@/lib/invite";

export const dynamic = "force-dynamic";

/**
 * AMIGOS. Duas abas: o feed de quem você segue, e as recomendações entre vocês.
 *
 * O EXPLORAR morou aqui como terceira aba por um tempo, e SAIU de volta para a
 * barra (ver app/explorar/page.tsx e o ai/DECISIONS.md): ele cresceu até virar
 * uma galeria, e galeria é destino. O que fica nesta tela é o que acontece ENTRE
 * amigos: quem você já escolheu, e o que passou de mão em mão entre vocês.
 */
const ABAS = [
  { key: "amigos", label: "Amigos" },
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

  // O link antigo da aba de explorar continua vivo: link salvo que quebra é o app
  // dizendo que o que a pessoa guardou não valia nada.
  if (one(params.aba) === "explorar") redirect("/explorar");

  const aba: Aba = ABAS.find((a) => a.key === one(params.aba))?.key ?? "amigos";
  const viewer = await getViewer();

  // A tira de "lendo agora" só faz sentido na aba de amigos, e só para quem entrou.
  const lendo = viewer && aba === "amigos" ? await getAmigosLendo(viewer) : [];

  /**
   * As duas listas de conexão. `getConexoes` recusa qualquer id que não seja o de
   * quem pediu, e aqui só existe um id possível: o do próprio viewer. Não há como
   * esta tela pedir a lista de outra pessoa, porque ela não aceita um alvo.
   */
  const conexoes = viewer && aba === "amigos" ? await getConexoes(viewer, viewer.id) : null;

  // O convite mora aqui também, e não só no perfil: a aba de amigos é onde você pensa em
  // quem conhece, e chamar alguém é a forma mais direta de ter um amigo aqui dentro.
  const eu = viewer && aba === "amigos" ? await getUser(viewer.id) : null;
  const appUrl = process.env.APP_URL ?? "";

  return (
    <main className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
      <ScreenHeader
        title="Amigos"
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
                  : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]",
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
          {eu && (
            <section className="surface mt-8 p-6">
              <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                chamar alguém
              </h2>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                Mande este link para quem você quer aqui dentro. Quem entrar por ele já
                chega vendo a sua estante, e não uma tela vazia.
              </p>
              <InviteLink url={inviteLink(eu.handle, appUrl)} />
            </section>
          )}
          <AmigosLendo amigos={lendo} />
          {conexoes && (
            <Conexoes seguindo={conexoes.seguindo} seguidores={conexoes.seguidores} />
          )}
          <FeedList viewer={viewer} cursor={one(params.antes) ?? null} />
        </>
      ) : (
        <Recomendacoes viewerId={viewer.id} track={one(params.trilha)} />
      )}
    </main>
  );
}

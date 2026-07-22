import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { ScreenHeader } from "@/components/screen-header";
import { Explore } from "@/components/explore";
import { Empty } from "@/components/empty";
import { Cover } from "@/components/cover";
import { Avatar } from "@/components/avatar";
import { ListaGrid } from "@/components/lista-card";
import { CuradoriaCard } from "@/components/curadoria-card";
import { getTodasAsListas } from "@/lib/listas";
import {
  getAutoresParaExplorar, getGeneros, getEditoras,
  getObrasPorGenero, getObrasPorEditora, type ObraVitrine, type Rotulo,
} from "@/lib/explorar-catalogo";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  EXPLORAR, COM UM MENU DE VITRINES. A galeria ganhou corredores.
 *
 *  A tela única virou seis vitrines: tudo (a mistura de sempre), pessoas,
 *  coleções, autores, gêneros e editoras. O menu é o mesmo padrão de pílulas
 *  das abas de /pessoas: recorte mora na tela que ele recorta.
 *
 *  As três últimas são CATÁLOGO puro (a vitrine da livraria, sem linha de
 *  leitor), e as vitrines de obra continuam sorteando: sem "em alta", sem
 *  mérito inventado. Ver lib/explorar-catalogo.ts.
 * ════════════════════════════════════════════════════════════════════
 */
const VITRINES = [
  { key: "tudo", label: "Tudo" },
  { key: "pessoas", label: "Pessoas" },
  { key: "colecoes", label: "Coleções" },
  { key: "autores", label: "Autores" },
  { key: "generos", label: "Gêneros" },
  { key: "editoras", label: "Editoras" },
] as const;

type Vitrine = (typeof VITRINES)[number]["key"];

export default async function Explorar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const ver: Vitrine = VITRINES.find((v) => v.key === one(params.ver))?.key ?? "tudo";
  const escolhido = (one(params.qual) ?? "").slice(0, 80);

  const viewer = await getViewer();

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      <ScreenHeader title="Explorar" meta={["sorteado", "sem algoritmo"]} />

      <nav className="mt-8 flex flex-wrap gap-2">
        {VITRINES.map((v) => {
          const on = v.key === ver;
          return (
            <Link
              key={v.key}
              href={`/explorar?ver=${v.key}`}
              aria-current={on ? "page" : undefined}
              className={[
                "pill px-4 py-2 text-[14px] transition-colors",
                on
                  ? "afiado font-medium text-[var(--color-ink)]"
                  : "text-[var(--color-ink-soft)] hover:bg-white/[0.03] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {v.label}
            </Link>
          );
        })}
      </nav>

      {ver === "tudo" && <Explore viewer={viewer} />}
      {ver === "pessoas" && <Pessoas viewer={viewer} />}
      {ver === "colecoes" && <Colecoes viewer={viewer} />}
      {ver === "autores" && <Autores />}
      {ver === "generos" && <PorRotulo tipo="generos" escolhido={escolhido} />}
      {ver === "editoras" && <PorRotulo tipo="editoras" escolhido={escolhido} />}
    </main>
  );
}

/** A vitrine de PESSOAS: a busca e as estantes de gente, que já moram no Explore. */
async function Pessoas({ viewer }: { viewer: Awaited<ReturnType<typeof getViewer>> }) {
  return <Explore viewer={viewer} soPessoas />;
}

/** A vitrine de COLEÇÕES: a curadoria da casa fixa, e todas as públicas embaixo. */
async function Colecoes({ viewer }: { viewer: Awaited<ReturnType<typeof getViewer>> }) {
  const listas = await getTodasAsListas(viewer);
  return (
    <div className="mt-8 flex flex-col gap-8">
      <CuradoriaCard />
      {listas.length === 0 ? (
        <Empty>Ninguém abriu uma coleção ainda. Monte a sua num livro qualquer.</Empty>
      ) : (
        <ListaGrid listas={listas} />
      )}
    </div>
  );
}

/** A vitrine de AUTORES: rostos e nomes, sorteados, cada um com a própria sala. */
async function Autores() {
  const autores = await getAutoresParaExplorar();
  if (autores.length === 0) return <div className="mt-8"><Empty>O acervo ainda não tem autor com obra.</Empty></div>;

  return (
    <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {autores.map((a) => (
        <li key={a.slug}>
          <Link href={`/autor/${a.slug}`} className="surface surface-hover flex h-full flex-col items-center gap-3 p-6 text-center">
            {a.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <Avatar name={a.name} handle={a.slug} size={80} />
            )}
            <span className="voice text-[16px] leading-snug text-[var(--color-ink)]">{a.name}</span>
            <span className="text-[12px] text-[var(--color-ink-faint)]">
              {[a.nationality, `${a.obras} ${a.obras === 1 ? "obra" : "obras"}`].filter(Boolean).join(" · ")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** GÊNEROS e EDITORAS: um mapa de rótulos e, escolhido um, a vitrine de obras dele. */
async function PorRotulo({ tipo, escolhido }: { tipo: "generos" | "editoras"; escolhido: string }) {
  const rotulos: Rotulo[] = tipo === "generos" ? await getGeneros() : await getEditoras();
  const obras: ObraVitrine[] = escolhido
    ? tipo === "generos"
      ? await getObrasPorGenero(escolhido)
      : await getObrasPorEditora(escolhido)
    : [];

  if (rotulos.length === 0) {
    return <div className="mt-8"><Empty>O acervo ainda não tem esse recorte preenchido.</Empty></div>;
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        {rotulos.map((r) => {
          const on = r.nome === escolhido;
          return (
            <Link
              key={r.nome}
              href={`/explorar?ver=${tipo}&qual=${encodeURIComponent(on ? "" : r.nome)}`}
              aria-current={on ? "page" : undefined}
              className={[
                "pill border px-3.5 py-1.5 text-[13px] transition-colors",
                on
                  ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                  : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {r.nome}
              <span className="tabular ml-1.5 text-[var(--color-ink-faint)]">{r.obras}</span>
            </Link>
          );
        })}
      </div>

      {escolhido && obras.length > 0 && (
        <ul className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {obras.map((o) => (
            <li key={o.slug}>
              <Link href={`/livro/${o.slug}`} className="cover-lift block" title={o.title}>
                <Cover title={o.title} author={o.author} src={o.coverUrl} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {escolhido && obras.length === 0 && (
        <p className="mt-8 text-[14px] text-[var(--color-ink-soft)]">Nada nesse recorte por ora.</p>
      )}
      {!escolhido && (
        <p className="mt-6 text-[13px] text-[var(--color-ink-faint)]">
          Escolha um {tipo === "generos" ? "gênero" : "selo"} para ver as obras dele.
        </p>
      )}
    </div>
  );
}

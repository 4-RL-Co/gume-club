import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { semAcento } from "@/lib/texto";
import { getViewer } from "@/lib/viewer";
import { ScreenHeader } from "@/components/screen-header";
import { Explore } from "@/components/explore";
import { Empty } from "@/components/empty";
import { Cover } from "@/components/cover";
import { Avatar } from "@/components/avatar";
import { ListaGrid } from "@/components/lista-card";
import { CuradoriaCard } from "@/components/curadoria-card";
import { origemAceita } from "@/lib/imagens";
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
  { key: "colecoes", label: "Listas" },
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
  const busca = (one(params.q) ?? "").slice(0, 80).trim();

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
                  : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {v.label}
            </Link>
          );
        })}
      </nav>

      {ver === "tudo" && <Explore viewer={viewer} />}
      {ver === "pessoas" && <Pessoas viewer={viewer} />}
      {ver === "colecoes" && <Colecoes viewer={viewer} busca={busca} />}
      {ver === "autores" && <Autores busca={busca} />}
      {ver === "generos" && <PorRotulo tipo="generos" escolhido={escolhido} busca={busca} />}
      {ver === "editoras" && <PorRotulo tipo="editoras" escolhido={escolhido} busca={busca} />}
    </main>
  );
}

/**
 * A BUSCA de uma vitrine: um formulário simples que recarrega a mesma tela com ?q=.
 *
 * Servidor de ponta a ponta de propósito: a vitrine já é renderizada no servidor, e
 * uma caixa que filtra por navegação não precisa carregar componente de cliente
 * nenhum. Sem acento e sem caixa, como toda busca da casa (lib/texto.ts).
 */
function Busca({ ver, valor, oQue }: { ver: string; valor: string; oQue: string }) {
  return (
    <form method="get" action="/explorar" className="relative mt-6 max-w-md">
      <input type="hidden" name="ver" value={ver} />
      <Search
        size={17}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
      />
      <input
        name="q"
        defaultValue={valor}
        placeholder={oQue}
        aria-label={oQue}
        className="w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent py-3 pl-11 pr-4 text-[15px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
      />
    </form>
  );
}

/** O filtro da busca: contém, sem acento e sem caixa. */
function bate(busca: string, ...textos: (string | null | undefined)[]): boolean {
  if (!busca) return true;
  const alvo = semAcento(busca);
  return textos.some((t) => semAcento(t).includes(alvo));
}

/** A vitrine de PESSOAS: a busca e as estantes de gente, que já moram no Explore. */
async function Pessoas({ viewer }: { viewer: Awaited<ReturnType<typeof getViewer>> }) {
  return <Explore viewer={viewer} soPessoas />;
}

/** A vitrine de COLEÇÕES: a curadoria da casa fixa, e todas as públicas embaixo. */
async function Colecoes({ viewer, busca }: { viewer: Awaited<ReturnType<typeof getViewer>>; busca: string }) {
  const todas = await getTodasAsListas(viewer);
  const listas = todas.filter((l) => bate(busca, l.name, l.description, l.dono.name, l.dono.handle));
  return (
    <div className="mt-2 flex flex-col gap-8">
      <Busca ver="colecoes" valor={busca} oQue="buscar uma coleção pelo nome" />
      {!busca && <CuradoriaCard />}
      {listas.length === 0 ? (
        <Empty>
          {busca
            ? "Nenhuma coleção com esse nome por aqui."
            : "Ninguém abriu uma coleção ainda. Monte a sua num livro qualquer."}
        </Empty>
      ) : (
        <ListaGrid listas={listas} />
      )}
    </div>
  );
}

/** A vitrine de AUTORES: rostos e nomes, sorteados, cada um com a própria sala. */
async function Autores({ busca }: { busca: string }) {
  const autores = await getAutoresParaExplorar(18, busca);
  if (!busca && autores.length === 0) return <div className="mt-8"><Empty>O acervo ainda não tem autor com obra.</Empty></div>;

  return (
    <>
    <Busca ver="autores" valor={busca} oQue="buscar um autor pelo nome" />
    {autores.length === 0 && <div className="mt-8"><Empty>Ninguém com esse nome nas prateleiras.</Empty></div>}
    <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {autores.map((a) => (
        <li key={a.slug}>
          <Link href={`/autor/${a.slug}`} className="surface surface-hover flex h-full flex-col items-center gap-3 p-6 text-center">
            {a.imageUrl && origemAceita(a.imageUrl) ? (
              <Image src={a.imageUrl} alt="" width={80} height={80} sizes="80px" className="h-20 w-20 rounded-full object-cover" />
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
    </>
  );
}

/** GÊNEROS e EDITORAS: um mapa de rótulos e, escolhido um, a vitrine de obras dele. */
async function PorRotulo({ tipo, escolhido, busca }: { tipo: "generos" | "editoras"; escolhido: string; busca: string }) {
  // A busca filtra os rótulos NO SQL (achar a editora pequena que está fora do
  // topo da vitrine). Ver lib/explorar-catalogo.ts.
  const rotulos: Rotulo[] = tipo === "generos" ? await getGeneros(24, busca) : await getEditoras(24, busca);
  const obras: ObraVitrine[] = escolhido
    ? tipo === "generos"
      ? await getObrasPorGenero(escolhido)
      : await getObrasPorEditora(escolhido)
    : [];

  if (!busca && rotulos.length === 0) {
    return <div className="mt-8"><Empty>O acervo ainda não tem esse recorte preenchido.</Empty></div>;
  }

  return (
    <div className="mt-2">
      <Busca
        ver={tipo}
        valor={busca}
        oQue={tipo === "generos" ? "buscar um gênero" : "buscar uma editora"}
      />
      {rotulos.length === 0 && (
        <p className="mt-6 text-[14px] text-[var(--color-ink-soft)]">
          {tipo === "generos" ? "Nenhum gênero com esse nome." : "Nenhum selo com esse nome."}
        </p>
      )}
      <div className="mt-8 flex flex-wrap gap-2">
        {rotulos.map((r) => {
          const on = r.nome === escolhido;
          return (
            <Link
              key={r.nome}
              href={`/explorar?ver=${tipo}&qual=${encodeURIComponent(on ? "" : r.nome)}${busca ? `&q=${encodeURIComponent(busca)}` : ""}`}
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

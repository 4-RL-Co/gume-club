import { getViewer } from "@/lib/viewer";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { ListaGrid } from "@/components/lista-card";
import { CuradoriaCard } from "@/components/curadoria-card";
import { getTodasAsListas } from "@/lib/listas";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  /colecoes: TODAS as coleções públicas, numa galeria só.
 *
 *  O explorar mostra um sorteio (seis, rotacionando); esta tela é o acervo
 *  inteiro, para quem quer garimpar. A ordem é cronológica, a mais nova
 *  primeiro, sem algoritmo: o mesmo costume do feed.
 *
 *  A CURADORIA DA CASA fica FIXA no topo, fora da ordem: o destaque dela é
 *  editorial, decidido pela casa, e não conquistado por métrica. É o mesmo
 *  gesto do Letterboxd com as listas oficiais.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function Colecoes() {
  const viewer = await getViewer();
  const listas = await getTodasAsListas(viewer);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      <ScreenHeader title="Listas" meta={["a mais nova primeiro", "sem algoritmo"]} />

      <div className="mt-8">
        <CuradoriaCard />
      </div>

      <h2 className="mt-10 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        as listas de quem lê por aqui
      </h2>

      {listas.length === 0 ? (
        <div className="mt-6">
          <Empty>
            Ninguém abriu uma lista ainda. Monte a sua num livro qualquer, e ela aparece aqui.
          </Empty>
        </div>
      ) : (
        <div className="mt-4">
          <ListaGrid listas={listas} />
        </div>
      )}
    </main>
  );
}

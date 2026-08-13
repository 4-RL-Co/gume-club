import { getViewer } from "@/lib/viewer";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { ListaGrid } from "@/components/lista-card";
import { CuradoriaCard } from "@/components/curadoria-card";
import { CriarLista } from "@/components/criar-lista";
import { getTodasAsListas } from "@/lib/listas";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  /listas: TODAS as listas públicas, numa galeria só.
 *
 *  Era /colecoes — e "coleção" também é o nome da tela /colecao (o que você TEM,
 *  os conjuntos/troféus). Duas coisas diferentes com quase o mesmo nome, lado a
 *  lado no mesmo perfil: quem chegava não sabia qual era qual. Esta é a
 *  funcionalidade estilo Letterboxd — estantes que um leitor monta com as
 *  próprias mãos — e "lista" é o nome que sobra sem colidir. Ver ai/DECISIONS.md.
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
export default async function Listas() {
  const viewer = await getViewer();
  const listas = await getTodasAsListas(viewer);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      <ScreenHeader title="Listas" meta={["a mais nova primeiro", "sem algoritmo"]}>
        {/* Segunda porta pra criar uma lista — a primeira (components/my-shelves.tsx)
            só existe na coluna de vidro do desktop. Ver components/criar-lista.tsx. */}
        {viewer && <CriarLista />}
      </ScreenHeader>

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

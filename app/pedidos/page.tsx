import { getViewer } from "@/lib/viewer";
import { getFila, podeVerAFila } from "@/lib/torneira";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { Pedidos } from "@/components/pedidos";

export const dynamic = "force-dynamic";

/**
 * A FILA DE PEDIDOS. O que as pessoas procuraram e não acharam.
 *
 * O catálogo do Gume é escolhido a mão, e não varrido da internet. Isso só é honesto
 * se ele puder crescer quando alguém quiser um livro que ele não tem — senão
 * "escolhido" vira um nome bonito para "faltando".
 *
 * Esta tela é essa promessa, virada trabalho. Cada linha aqui é uma pessoa de verdade
 * que quis um livro de verdade e foi embora de mãos vazias.
 *
 * ═══ POR QUE NÃO É PÚBLICA ═══
 *
 * Não é segredo: é que uma lista dos livros que o Gume NÃO tem não ajuda ninguém a
 * ler. A única coisa que ela faria numa tela de leitor é virar uma vitrine de "mais
 * procurados" — que é exatamente o que ela não é, e o que o Gume recusa ser.
 */
export default async function PedidosPage() {
  const viewer = await getViewer();

  if (!(await podeVerAFila(viewer))) {
    return (
      <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
        <ScreenHeader title="Pedidos" />
        <Empty>Esta tela não é para você.</Empty>
      </main>
    );
  }

  const fila = await getFila(viewer);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
      <ScreenHeader title="Pedidos" meta={[`${fila.length} esperando`]} />

      <p className="mt-6 max-w-prose text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
        Cada linha é alguém que procurou um livro e não achou. É a lista do que trazer
        para o acervo em seguida, e é a coisa mais útil que um leitor nos dá de graça.
      </p>

      {fila.length === 0 ? (
        <Empty>Ninguém saiu de mãos vazias por enquanto.</Empty>
      ) : (
        <Pedidos fila={fila.map((p) => ({ ...p, desde: p.desde.toISOString(), ultima: p.ultima.toISOString() }))} />
      )}
    </main>
  );
}

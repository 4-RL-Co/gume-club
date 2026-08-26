import { notFound } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { souIdealizador } from "@/lib/authz";
import { getPainel, filtroDaUrl } from "@/lib/painel";
import { getTodosOsItens } from "@/lib/roadmap";
import { Painel } from "@/components/painel";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PAINEL PRIVADO. Uma pessoa, e os números de verdade do projeto.
 *
 *  ═══ 404, E NÃO 403 ═══
 *
 *  Quem não é o idealizador não leva "acesso negado": leva "não existe".
 *  Um 403 confirma que a página existe, e uma página que só uma pessoa
 *  pode ver não confessa que existe para as outras. `souIdealizador` é a
 *  checagem, e ela mora em lib/authz.ts como toda autorização. O red team
 *  prova que um usuário comum logado leva 404. Ver lib/painel.redteam.sql.test.ts.
 *
 *  `getPainel` chama `assertIdealizador` de novo, por dentro: a defesa não
 *  depende de esta página lembrar de checar. Se um dia alguém apagar o
 *  notFound() daqui, o dado ainda não sai.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function PainelPrivado({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await getViewer();

  // A porta. Não é o idealizador, a página não existe.
  if (!(await souIdealizador(viewer))) notFound();

  // Os filtros vêm da URL: o período, a granularidade e os recortes do log. A barra de
  // filtros na tela só reescreve a URL, e a página busca de novo com eles. filtroDaUrl não
  // confia no formato: valor estranho cai no padrão.
  const filtro = filtroDaUrl(await searchParams);
  const [dados, itensRoadmap] = await Promise.all([
    getPainel(viewer, filtro),
    getTodosOsItens(viewer),
  ]);

  return <Painel dados={dados} itensRoadmap={itensRoadmap} />;
}

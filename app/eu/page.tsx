import { redirect } from "next/navigation";
import { getViewer, getUser } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * "/eu" leva você ao SEU PERFIL, o mesmo que os outros veem.
 *
 * Existe porque a sessão do cliente não carrega o handle, e espalhar o handle pelo
 * navegador só para montar um link seria guardar em três lugares uma coisa que o
 * servidor já sabe.
 *
 * E existe, principalmente, porque clicar no seu nome levava DIRETO para o
 * formulário de edição. Ninguém quer editar o perfil: as pessoas querem VER o
 * perfil. Ver o que os outros veem é o único jeito de saber se está bom, e o
 * formulário aparecia antes de a pessoa ter olhado para o que ela ia mudar.
 */
export default async function Eu() {
  const viewer = await getViewer();
  if (!viewer) redirect("/entrar");

  const me = await getUser(viewer.id);
  if (!me) redirect("/entrar");

  redirect(`/@${me.handle}`);
}

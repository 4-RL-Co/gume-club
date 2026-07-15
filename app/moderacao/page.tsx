import { getViewer } from "@/lib/viewer";
import {
  getBanidos, getReservados, getModeradores, souModerador, souIdealizador,
} from "@/lib/moderacao";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { Moderacao } from "@/components/moderacao";

export const dynamic = "force-dynamic";

/**
 * A tela de moderação. Só bibliotecário.
 *
 * Ela é pequena de propósito, e não é preguiça: um painel com fila, atribuição e
 * métricas, tocado por UMA pessoa, é um painel que ninguém abre. O que uma pessoa
 * precisa é achar alguém, banir, desbanir, e guardar um handle antes que alguém o
 * tome. Nada além disso.
 *
 * Esconder o link não protege nada: quem protege é lib/moderacao.ts, no servidor, que
 * exige bibliotecário antes de escrever qualquer coisa. Esta tela só decide se vale a
 * pena desenhar os botões.
 */
export default async function ModeracaoPage() {
  const viewer = await getViewer();

  /**
   * MODERADOR, e não bibliotecário.
   *
   * Bibliotecário se ganha SOZINHO, cruzando um número. É a regra certa para mexer em
   * ficha de livro, e a errada para banir gente: poder sobre livro se ganha por
   * trabalho, poder sobre PESSOA se ganha por confiança, e confiança não é uma
   * consulta.
   */
  const podeModerar = await souModerador(viewer);

  if (!podeModerar) {
    return (
      <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
        <ScreenHeader title="Moderação" />
        <Empty>Esta tela não é para você.</Empty>
      </main>
    );
  }

  const [banidos, reservados, moderadores, dono] = await Promise.all([
    getBanidos(viewer),
    getReservados(viewer),
    getModeradores(viewer),
    souIdealizador(viewer),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
      <ScreenHeader
        title="Moderação"
        meta={["banir é reversível", "e nunca apaga nada"]}
      />

      <Moderacao
        banidos={banidos}
        reservados={reservados}
        moderadores={moderadores}
        dono={dono}
      />
    </main>
  );
}

import { getViewer } from "@/lib/viewer";
import { ScreenHeader } from "@/components/screen-header";
import { Explore } from "@/components/explore";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  EXPLORAR, DE VOLTA COMO UM LUGAR. A galeria dos curadores.
 *
 *  Esta rota já foi uma tela, virou aba de /pessoas, e voltou a ser tela, e a
 *  reversão está registrada no ai/DECISIONS.md. O motivo de hoje: o explorar
 *  CRESCEU. Estantes de gente, estantes montadas à mão, os queridinhos, quem lê
 *  o que você lê, resenhas, o que está aberto agora. Isso deixou de ser um
 *  recorte de "pessoas" e virou uma galeria, e galeria é destino, não aba.
 *
 *  A divisão que ficou: AMIGOS é quem você já escolheu (o feed, as conexões, as
 *  recomendações entre vocês). EXPLORAR é como você escolhe. As duas frases
 *  sempre estiveram no código; agora a navegação diz o mesmo.
 *
 *  Aberta também para quem não entrou: tudo aqui já é público por construção
 *  (visibleTo com estranho no lugar do leitor), e a galeria é a melhor vitrine
 *  que o app tem para quem chegou por um link.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function Explorar() {
  const viewer = await getViewer();

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      <ScreenHeader title="Explorar" meta={["sorteado", "sem algoritmo"]} />
      <Explore viewer={viewer} />
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { HeartHandshake, Server, Sparkles, Users } from "lucide-react";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/viewer";
import { apoioLigado, precoDo } from "@/lib/stripe";
import { ehApoiador } from "@/lib/apoio";
import { getCapasDaParede } from "@/lib/parede";
import { FitaDeCapas } from "@/components/fita-de-capas";
import { Placa } from "@/components/badges";
import { AssinarBotao, AvulsoForm } from "@/components/apoiar-botoes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apoiar o Gume",
  description: "Quem apoia mantém o Gume no ar, sem anúncio, de graça para todo mundo.",
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  APOIAR O GUME.
 *
 *  ═══ A TELA DIZIA O QUE A PESSOA *NÃO* GANHAVA ═══
 *
 *  A primeira versão abria com "apoiar não destrava nada" e repetia isso três vezes. Era
 *  verdade, e era a leitura errada de uma regra boa: a regra proíbe **vantagem**, e não
 *  proíbe **reconhecimento**. Quem apoia ganha duas coisas reais, e escondê-las não é
 *  honestidade, é só uma tela triste que faz a pessoa se sentir boba por querer ajudar.
 *
 *  Agora ela diz o que a pessoa ganha (a insígnia, e o nome na lista se ela quiser) e
 *  mantém a promessa onde ela vale: nenhuma FUNÇÃO do app é comprável. As duas coisas
 *  convivem, e a diferença entre elas é a diferença entre um agradecimento e um pedágio.
 *
 *  ═══ COR, E POR QUÊ ROSA ═══
 *
 *  O rosa (--color-colaborar) é a cor de "quem faz", e a moldura e a insígnia de apoiador
 *  já são rosas: apoiar é contribuir. Usar o verde-água aqui diria "o app está falando
 *  com você", que é outra coisa. A cor não é enfeite: ela liga esta tela às outras duas
 *  onde a mesma ideia já mora.
 *
 *  ═══ O PREÇO APARECE ANTES DO LOGIN ═══
 *
 *  A tela inteira já esteve atrás da sessão, e escondia o preço junto: para saber que
 *  custa R$ 4,90, a pessoa tinha que criar conta. Ninguém cria conta para descobrir
 *  quanto custa uma coisa. Os valores aparecem para todo mundo; o clique é que pede o
 *  entrar.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function Apoiar({
  searchParams,
}: {
  searchParams: Promise<{ obrigado?: string }>;
}) {
  /**
   * Sem Stripe configurado, a página não existe. Quem hospeda o próprio Gume não tem
   * conta de pagamento, e não deveria ver uma tela de apoio que não leva a lugar nenhum.
   */
  if (!apoioLigado()) notFound();

  const { obrigado } = await searchParams;
  const viewer = await getViewer();

  const [capas, me] = await Promise.all([
    getCapasDaParede(16),
    viewer
      ? db
          .execute<{ apoia: boolean }>(
            sql`select ${ehApoiador(sql`u`)} as apoia from users u where u.id = ${viewer.id}::uuid limit 1`,
          )
          .then((r) => r[0])
      : Promise.resolve(undefined),
  ]);

  const logado = Boolean(viewer);

  /** Um plano sem preço no ambiente não vira botão quebrado: ele some. */
  const planos = [
    { tier: "marcador" as const, rotulo: "Marcador", preco: "R$ 4,90" },
    { tier: "lombada" as const, rotulo: "Lombada", preco: "R$ 9,90" },
    { tier: "capadura" as const, rotulo: "Capa dura", preco: "R$ 19,90" },
  ].filter((p) => precoDo(p.tier));

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
      <p className="mt-16 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] sm:mt-20">
        <HeartHandshake size={14} strokeWidth={1.5} style={{ color: "var(--color-colaborar)" }} />
        <span style={{ color: "var(--color-colaborar)" }}>apoiar</span>
      </p>

      <h1 className="voice mt-5 text-[44px] leading-[1.02] tracking-[-0.015em] sm:text-[56px]">
        Quem apoia mantém o Gume <em className="italic text-[var(--color-ink-soft)]">no ar</em>.
      </h1>

      <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
        Sem anúncio, sem vender o que você lê, e de graça para todo mundo. Isso tem uma
        conta no fim do mês, e é ela que o seu apoio paga.
      </p>

      {/* As capas respondem "apoiar o quê?" antes de a pergunta ser feita. São livros de
          verdade, das estantes de verdade. Ver lib/parede.ts. */}
      <FitaDeCapas capas={capas} />

      {obrigado && (
        <p className="surface mt-12 p-6 text-[15px] leading-relaxed text-[var(--color-ink)]">
          Obrigado. O seu apoio já está valendo, e a insígnia aparece no seu perfil em
          instantes.
        </p>
      )}

      {me?.apoia && !obrigado && (
        <p className="surface mt-12 p-6 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          <span className="font-medium text-[var(--color-ink)]">Você já apoia o Gume.</span>{" "}
          Obrigado, de verdade. Dá para apoiar de novo aqui embaixo, e escolher se o seu
          nome aparece na lista em{" "}
          <Link href="/perfil" className="underline decoration-[var(--color-ink)] underline-offset-4">
            perfil
          </Link>
          .
        </p>
      )}

      {/* ═══ O QUE VOCÊ GANHA ═══
          Duas coisas reais, ditas na cara. A insígnia mostrada aqui é a MESMA do perfil,
          renderizada pelo mesmo componente: uma imitação desenhada à mão nesta tela
          divergiria da de verdade no dia em que uma das duas mudasse. */}
      <section className="mt-16">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          o que você ganha
        </h2>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          <li className="surface flex gap-4 p-6">
            <span className="shrink-0 pt-0.5">
              <Placa badge="apoiador" balao={false} />
            </span>
            <span>
              <span className="block text-[15px] font-medium text-[var(--color-ink)]">
                A insígnia de apoiador
              </span>
              <span className="mt-1.5 block text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                Esta é ela, do jeitinho que vai aparecer no seu perfil. Ela diz o que é sem
                rodeio: não se conquista, se paga.
              </span>
            </span>
          </li>

          <li className="surface flex gap-4 p-6">
            <span className="shrink-0 pt-1">
              <Users size={20} strokeWidth={1.5} style={{ color: "var(--color-colaborar)" }} />
            </span>
            <span>
              <span className="block text-[15px] font-medium text-[var(--color-ink)]">
                Seu nome na lista de quem apoia
              </span>
              <span className="mt-1.5 block text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                Se você quiser: a caixa nasce desmarcada, e você marca quando der vontade.
                Sem valor ao lado do nome, e sem ordem de quem apoia mais.
              </span>
            </span>
          </li>
        </ul>

        <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-[var(--color-ink-faint)]">
          E só isso. Nenhuma função do Gume fica atrás de pagamento: quem nunca apoiar
          enxerga o app inteiro, do mesmo jeito, para sempre.
        </p>
      </section>

      {/* ═══ PARA ONDE VAI O DINHEIRO ═══
          Sem número inventado e sem barrinha de meta: o Gume não sabe quanto vai custar em
          dezembro, e uma meta é uma promessa que ninguém pode cumprir. */}
      <section className="mt-16 border-t border-[var(--color-rule)] pt-12">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          para onde vai
        </h2>

        <ul className="mt-6 space-y-6">
          <li className="flex gap-4">
            <span className="shrink-0 pt-1">
              <Server size={20} strokeWidth={1.5} style={{ color: "var(--color-colaborar)" }} />
            </span>
            <span className="text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
              <span className="font-medium text-[var(--color-ink)]">As contas do mês.</span> O
              servidor que responde quando você abre o app, o lugar onde os seus livros
              ficam guardados, as cópias de segurança, o endereço gume.club e os e-mails que
              o app manda. É o que não pode faltar, e é a primeira coisa que o apoio paga.
            </span>
          </li>

          <li className="flex gap-4">
            <span className="shrink-0 pt-1">
              <Sparkles size={20} strokeWidth={1.5} style={{ color: "var(--color-colaborar)" }} />
            </span>
            <span className="text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
              <span className="font-medium text-[var(--color-ink)]">O resto vira app.</span>{" "}
              O Gume não tem dono querendo lucrar com ele, não tem investidor esperando
              retorno, e não distribui dinheiro para ninguém. O que sobra volta para cá:
              catálogo mais completo, as capas que faltam, e o que ainda não existe.
            </span>
          </li>
        </ul>

        <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-faint)]">
          E o Gume é aberto: qualquer pessoa pode ver como ele é feito. É isso que torna
          esta página conferível, em vez de só uma promessa bonita.
        </p>
      </section>

      {planos.length > 0 && (
        <section className="mt-16">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            todo mês
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
            Os três valem exatamente a mesma coisa: a mesma insígnia, o mesmo app. A
            diferença é só quanto você quer ajudar, e dá para cancelar quando quiser.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {planos.map((p) => (
              <AssinarBotao
                key={p.tier}
                tier={p.tier}
                rotulo={p.rotulo}
                preco={p.preco}
                logado={logado}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          uma vez só
        </h2>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
          Você escolhe o valor. A insígnia fica por um mês, e cada apoio novo soma mais um
          mês ao que já estava valendo.
        </p>
        <AvulsoForm logado={logado} />
      </section>

      <p className="mt-16 max-w-xl border-t border-[var(--color-rule)] pt-8 text-[15px] leading-relaxed text-[var(--color-ink-faint)]">
        O pagamento acontece fora do Gume, numa página do Stripe. Nenhum dado do seu cartão
        passa por aqui, nem fica guardado com a gente.
      </p>
    </main>
  );
}

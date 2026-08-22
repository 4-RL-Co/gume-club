import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { getBadges, getProgresso, META } from "@/lib/badges";
import { INSIGNIAS, ORDEM } from "@/lib/badges-view";
import { Cabecalho, Portas } from "@/components/casa-de-quem-faz";
import { Moldura } from "@/components/moldura";
import { getEscadas } from "@/lib/escada";
import {
  HONRAS, NOME, piso, pisoEmPaginas, paragonEmLeituras, paragonEmPaginas, type Honra,
} from "@/lib/honras";
import { Placa } from "@/components/badges";
import { cor as matizDe } from "@/lib/badges-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "As insígnias · Gume",
  description: "O que cada uma é, e como se ganha.",
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS INSÍGNIAS, E COMO SE GANHA CADA UMA.
 *
 *  Esta página existe porque o próprio dono do projeto não lembrava mais
 *  a diferença entre bibliotecário e zelador. Isso não é falha de memória
 *  dele: é sintoma. Uma insígnia que ninguém sabe como conseguir não
 *  reconhece ninguém, e vira boato ("acho que é pra quem lê muito").
 *
 *  ═══ A BARRA DE PROGRESSO EXISTE, E SÓ PARA CONTRIBUIÇÃO ═══
 *
 *  Isto REVERTE uma regra que estava escrita em maiúsculas ("nada de
 *  'faltam 12 correções'. ESCADA PRODUZ FARM"), e a reversão tem dono e
 *  tem motivo.
 *
 *  O que este app existe para NÃO fazer é transformar leitura em COBRANÇA.
 *
 *  Esta frase dizia mais do que podia: "uma barra enchendo ao lado de
 *  'livros lidos' transforma leitura em meta. Isso continua proibido, para
 *  sempre, e há teste." Não continua, e não há — as HONRAS são exatamente
 *  isso, e esta mesma tela as desenha logo abaixo. A frase foi escrita
 *  antes delas e ficou de pé mentindo.
 *
 *  O que continua proibido, e tem teste (lib/honras.regras.test.ts), não é
 *  a barra: é o RELÓGIO (ofensiva, meta do ano, temporada), o PLACAR (lista
 *  de quem leu mais), a NOTA valendo honra, e o CASTIGO por abandonar. Uma
 *  barra que sobe e nunca desce, sem prazo e sem ninguém para comparar, não
 *  cobra nada de ninguém.
 *
 *  Contribuição é outra coisa: consertar o catálogo não é uma experiência
 *  íntima que uma barra corrompe. É um mutirão, e saber que faltam três
 *  correções para virar zelador não estraga nada: faz o mutirão andar.
 *
 *  O farm continua caro, e quem o segura não é a barra: é a MÉTRICA. Só
 *  conta o que sobreviveu, então correção lixo é revertida e a barra ANDA
 *  PARA TRÁS. Uma escada cujo degrau desaba quando você pisa errado não é
 *  uma escada que se sobe correndo.
 *
 *  Ver ai/DECISIONS.md e lib/badges.ts.
 *
 *  ═══ E O LAYOUT É UMA GRADE, E NÃO UM FLEX SOLTO ═══
 *
 *  A coluna da placa tem largura FIXA. Sem ela, cada placa empurrava o
 *  texto para uma posição diferente ("membro fundador" é o dobro de
 *  "arauto"), e a página inteira descia em escada.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function Insignias() {
  const viewer = await getViewer();

  const [minhas, progresso, escadas] = await Promise.all([
    viewer ? getBadges(viewer.id) : Promise.resolve([]),
    viewer ? getProgresso(viewer.id) : Promise.resolve(null),
    // A honra de quem está olhando, para acender o degrau em que ela está.
    viewer ? getEscadas(viewer.id) : Promise.resolve(null),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
      <Cabecalho
        eyebrow="insígnias e honras"
        titulo={<>As <em className="italic text-[var(--color-ink-soft)]">insígnias</em> e as honras.</>}
        linha={<>
          A honra é sobre o que você leu. A insígnia é sobre o que você fez pelos outros.
          Duas coisas diferentes, e nenhuma ganha da outra.
        </>}
      />

      {/* ═══ OS ELOS VÊM PRIMEIRO, E AS INSÍGNIAS DEPOIS ═══

          Porque a honra é o que quase todo mundo vai ter, e a insígnia é o que quase
          ninguém vai ter. Uma tela que abre com o raro e esconde o comum é uma tela
          escrita para quem já está dentro. */}
      <Honras escadas={escadas} />

      <h2 className="voice mt-20 text-[30px] leading-tight">As insígnias.</h2>

      <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
        Elas são outra coisa que a honra. <strong className="font-medium text-[var(--color-ink)]">A honra
        é sobre o que você leu; a insígnia é sobre o que você fez pelos outros.</strong> Nenhuma
        delas é sobre ler muito, e nenhuma nunca vai ser.
      </p>

      <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
        Quase todas chegam sozinhas: ninguém precisa te dar nada, e você não precisa pedir a
        ninguém. Todas são sobre alguma coisa que você fez pelos outros, e nenhuma é sobre ler
        muito.
      </p>

      <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
        Ninguém é obrigado a caçar nenhuma delas, e o Gume funciona igual sem elas. Mas cuidar do
        catálogo ajuda todo mundo que vier depois, e é justo que isso apareça em algum lugar.
      </p>

      <ul className="mt-14 flex flex-col">
        {ORDEM.map((chave) => {
          const i = INSIGNIAS[chave];
          const tenho = minhas.includes(chave);
          const meta = META[chave] ?? null;

          /**
           * A barra só existe onde EXISTE uma contagem.
           *
           * Insígnia que é um FATO (você escreveu código, alguém entrou por sua
           * causa, você chegou cedo) não tem barra, e desenhar uma seria mentir sobre
           * como ela funciona: não existe "68% de ter tido a ideia do Gume".
           */
          const mostrarBarra = !tenho && meta !== null && progresso !== null;
          const feitas = progresso?.correcoes ?? 0;
          const pct = meta ? Math.min(100, Math.round((feitas / meta) * 100)) : 0;

          return (
            <li
              key={chave}
              className="grid gap-x-8 gap-y-4 border-t border-[var(--color-rule)] py-8 sm:grid-cols-[15rem_1fr]"
            >
              <div className="flex flex-col items-start gap-3">
                <Placa badge={chave} apagada={!tenho} balao={false} />

                {tenho && (
                  <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                    você tem esta
                  </span>
                )}

                {mostrarBarra && (
                  <span className="flex w-full max-w-[11rem] flex-col gap-1.5">
                    <span className="tabular text-[11px] text-[var(--color-ink-faint)]">
                      {feitas} de {meta}
                    </span>

                    {/* O MESMO material das barras da tela de estatísticas: um volume
                        de luz baixa, com a aresta de cima acesa. Inline, e não numa
                        classe, pelo mesmo motivo de lá: um gráfico é conteúdo, e
                        conteúdo não pode depender de uma folha de estilo chegar. */}
                    <span className="flex h-1.5 w-full items-center bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]">
                      <span
                        className="block h-full"
                        style={{
                          width: `${pct}%`,
                          background: "color-mix(in srgb, var(--color-ink) 22%, transparent)",
                          borderTop: "1px solid var(--color-ink)",
                        }}
                      />
                    </span>
                  </span>
                )}
              </div>

              <div className="min-w-0">
                {/* ═══ O NOME E O QUE ELA É ═══

                    Eles moravam DENTRO da placa, e sumiram com ela quando a placa virou
                    uma medalha muda. No perfil isso é o que a gente queria (uma fileira
                    de pontinhos que não fala até você perguntar); nesta tela, não: esta é
                    justamente a tela que existe para explicar.

                    Uma insígnia descrita só pelo "como se ganha", sem dizer o que ela é,
                    é uma tarefa sem motivo. */}
                <h3 className="text-[15px] uppercase tracking-[0.1em]" style={{ color: matizDe(chave) }}>
                  {i.label}
                </h3>

                <p className="mt-2 text-[16px] leading-relaxed text-[var(--color-ink)]">
                  {i.sobre}
                </p>

                <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                  {i.como}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-14 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
        Quase tudo aqui começa no mesmo lugar:{" "}
        <Link
          href="/o-que-falta"
          className="underline decoration-[var(--color-ink)] underline-offset-4"
        >
          o que falta no catálogo
        </Link>
        . Um livro arrumado hoje já chega arrumado para a próxima pessoa que pegar ele.
      </p>
      <Portas aqui="insignias" />
    </main>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A ESCADA INTEIRA, COM OS NÚMEROS NA CARA.
 *
 *  Uma escada que ninguém sabe onde termina não é uma escada: é um corredor escuro. A
 *  pessoa tem direito de ver os dez degraus, os números de cada um, e a moldura que vem
 *  junto — antes de subir, e não depois.
 *
 *  ═══ E POR QUE A MOLDURA APARECE AQUI ═══
 *
 *  Porque uma moldura descrita em palavras e nunca vista é uma moldura que a pessoa não
 *  reconhece quando encontra no perfil de alguém. É a mesma razão pela qual a placa da
 *  insígnia aparece ao lado da explicação dela.
 *
 *  A que a pessoa ainda não tem fica APAGADA, e nunca cinza-com-cadeado: cadeado é
 *  linguagem de jogo e diz "trabalhe para destravar isto". Aqui o degrau é uma coisa que
 *  acontece enquanto você lê, e não uma coisa que você persegue.
 * ════════════════════════════════════════════════════════════════════
 */
function Honras({ escadas }: { escadas: Awaited<ReturnType<typeof getEscadas>> | null }) {
  return (
    <section className="mt-14">
      <h2 className="voice text-[30px] leading-tight">As honras.</h2>

      <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
        Pelo que você leu <strong className="font-medium text-[var(--color-ink)]">na vida
        inteira</strong>. Não é por ano, não é por mês, e ela{" "}
        <strong className="font-medium text-[var(--color-ink)]">nunca cai</strong>: parar de ler
        por um ano não custa nada. E não existe lista dos maiores: a honra fica no seu perfil, e
        em nenhum outro lugar.
      </p>

      <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
        É uma escada só. Um livro, uma HQ e{" "}
        <strong className="font-medium text-[var(--color-ink)]">cada volume de mangá</strong>{" "}
        contam a mesma coisa: uma leitura. Quem lê mangá sobe mais rápido, e tudo bem. Ler
        quinhentas obras, do tipo que for, é uma vida de leitor, e isso é o que a honra
        celebra.
      </p>

      <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
        E tem <strong className="font-medium text-[var(--color-ink)]">dois caminhos</strong>{" "}
        para cada degrau: quantidade de leituras, ou quantidade de páginas de livros que
        você terminou. Vale o que colocar você mais longe. Quem lê muitos livros curtos
        sobe por um lado; quem está há meses em Os Miseráveis sobe pelo outro assim que
        vira a última página — o tamanho do livro passa a valer alguma coisa.
      </p>

      {(() => {
        const onde = escadas ? (HONRAS as readonly string[]).indexOf(escadas.posicao.honra) : -1;

        return (
          <div className="mt-10">
            <ul className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
              {HONRAS.map((honra, i) => {
                const aqui = onde === i;
                const passei = onde >= i;

                return (
                  <li key={honra} className="flex items-center gap-3.5">
                    <span style={{ opacity: passei ? 1 : 0.3 }}>
                      <Moldura coroa={{ honra }} handle="_" name={NOME[honra as Honra]} size={34} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={[
                          "block text-[14px]",
                          aqui ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]",
                        ].join(" ")}
                      >
                        {NOME[honra as Honra]}
                        {aqui && (
                          <span className="ml-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                            você está aqui
                          </span>
                        )}
                      </span>

                      <span className="tabular block text-[12px] text-[var(--color-ink-faint)]">
                        {piso(honra as Honra) === 0
                          ? "de graça, desde o primeiro dia"
                          : `${piso(honra as Honra).toLocaleString("pt-BR")} leituras ` +
                            `— ou ${pisoEmPaginas(honra as Honra).toLocaleString("pt-BR")} páginas`}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* O TOPO NÃO É O FIM. Depois dele, uma estrela a cada vinte e cinco leituras
                (ou paragonEmPaginas() páginas — o número vem de lib/honras.ts, nunca chutado aqui). */}
            <p className="mt-6 text-[12px] leading-relaxed text-[var(--color-ink-faint)]">
              Depois do último degrau a escada não acaba: a cada {paragonEmLeituras()} leituras
              (ou {paragonEmPaginas().toLocaleString("pt-BR")} páginas) vem uma estrela. Gume +1,
              Gume +2, e assim por diante.
            </p>
          </div>
        );
      })()}

      {/* A verdade sobre a moldura de apoiador, dita aqui e não escondida numa página de
          preço: ela NÃO é um degrau, e não fica acima de nada. */}
      <p className="mt-10 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-faint)]">
        Quem apoia o Gume ganha uma moldura rosa, a mesma cor de quem constrói o app, e escolhe
        entre ela e a da honra. Ela não é melhor que o Gume nem que a Navalha: ela não diz
        quanto você leu, diz que você paga a conta do servidor. São duas coisas diferentes, e
        nenhuma ganha da outra.
      </p>
    </section>
  );
}

import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getViewer, getUser } from "@/lib/viewer";
import { getShelf, getShelfCounts } from "@/lib/shelf";
import { getFeed } from "@/lib/social";
import { getStats } from "@/lib/stats";
import { Cover } from "@/components/cover";
import { Mark } from "@/components/logo";
import { Avatar, AvatarLink } from "@/components/avatar";
import { Resume } from "@/components/resume";
import { CODIGO, CONVERSA } from "@/lib/onde";
import { getCapasDaParede } from "@/lib/parede";

export const dynamic = "force-dynamic";

export default async function Home() {
  const viewer = await getViewer();
  return viewer ? <Casa viewerId={viewer.id} /> : <Manifesto />;
}

// ══════════════════════════════════════════════════════ deslogado: o manifesto

/**
 * A home deslogada é o ROSTO do Gume, e ela é um manifesto, não um argumento de
 * venda. Um estranho abre gume.club e precisa entender em três segundos o que é
 * isto, querer entrar, e não sentir cheiro de landing page de startup.
 *
 * Quatro dobras, nesta ordem:
 *   1. a tese, em serifa gigante, com uma linha de contexto e duas portas;
 *   2. a parede de capas REAIS do catálogo, que é o argumento visual: os seus
 *      livros moram aqui, e eles são brasileiros;
 *   3. o que este app RECUSA, que é a parte que nenhum concorrente pode copiar,
 *      porque a recusa custa dinheiro a eles;
 *   4. gente de verdade, com estante de verdade. Sem contador de leitores: número
 *      de usuário na porta é vaidade, e a gente não tem.
 *
 * Nada de captura de tela do app, nada de ilustração, nada de grade de recursos.
 * Celular primeiro: metade das pessoas abre isso no ônibus.
 */
async function Manifesto() {
  /**
   * A parede NUNCA é sorteada no acervo cru, e a regra de o que pode aparecer nela mora
   * em lib/parede.ts: primeiro o que está nas estantes das pessoas, depois o cânone como
   * remendo, e só capa com imagem de verdade.
   *
   * Ela saiu daqui quando a tela de apoiar precisou das mesmas capas. Duas cópias da
   * consulta seriam duas respostas para "o que é o acervo do Gume", e um dia elas
   * discordariam sem ninguém saber qual estava certa.
   */
  const parede = await getCapasDaParede(30);

  /**
   * ═══ TRÊS ESTANTES PÚBLICAS, E NÃO AS TRÊS MAIORES ═══
   *
   * Esta consulta terminava em `order by n desc`: as três pessoas com MAIS livros
   * públicos apareciam na primeira página do site.
   *
   * Isso é um placar. Não tinha rótulo de ranking, não tinha número na tela, e era um
   * placar do mesmo jeito — e agora que o Gume tem ELO, ele vira o pior tipo de
   * incentivo: dá para chegar na home do app inflando a própria estante.
   *
   * Agora são três estantes AO ACASO, e a home não é a mesma duas vezes. O `having` de
   * três capas continua: uma estante bonita precisa de capa, e isso é sobre a foto, e
   * não sobre a pessoa.
   *
   * A regra que isto obedece está em lib/honras.regras.test.ts, e o teste é quem a defende:
   * **nada neste app ordena gente por quanto ela leu.**
   *
   * Só o que é público sai: o visitante é um estranho, e visibleTo() trata estranho
   * como estranho.
   */
  const pessoas = await db.execute<{
    handle: string; name: string | null; image: string | null; n: number; capas: string[];
  }>(sql`
    select u.handle,
           u.display_name as name,
           u.image,
           count(*)::int as n,
           (array_agg(e.cover_url order by le.added_at desc)
             filter (where e.cover_url is not null))[1:5] as capas
      from users u
      join library_entries le on le.user_id = u.id and le.visibility = 'public'
      join works w on w.id = le.work_id
      left join editions e on e.id = (
        select e2.id from editions e2 where e2.work_id = w.id and e2.cover_url is not null
        order by e2.created_at asc limit 1)
     where u.deleted_at is null and u.image is not null
     group by u.id
    having count(*) filter (where e.cover_url is not null) >= 3
     order by random()
     limit 3`);

  const vitrine = pessoas[0]?.handle;

  return (
    <main className="relative overflow-hidden">
      {/**
        * ════════════════════════════════════════════════════════════════
        *  DOBRA 1: A TESE, COM A ESTANTE ATRÁS DELA.
        *
        *  ═══ A PAREDE ERA UMA TIRA, E A TIRA ERA UM ENFEITE ═══
        *
        *  As capas são o ARGUMENTO desta página: elas dizem, sem uma palavra, "os seus
        *  livros moram aqui, e eles são brasileiros". É a coisa mais forte que o Gume tem
        *  para mostrar a quem chega — e ela aparecia como uma fita de 5% de altura, cortada
        *  no rodapé da primeira dobra, como um carrossel de logotipos de cliente.
        *
        *  Agora ela é o FUNDO: fileiras inteiras, capas inteiras, lidas como uma estante de
        *  verdade. O texto mora por cima, e o preto sobe do pé da tela para engolir a
        *  parede — o degradê não é enfeite, é o que faz a serifa continuar legível sem
        *  precisar de uma caixa atrás dela.
        *
        *  ═══ E O PRETO CONTINUA SENDO O PRETO ═══
        *
        *  Nenhuma cor nova entrou. A única cor desta página continua vindo das capas — só
        *  que agora tem capa o bastante para isso significar alguma coisa.
        * ════════════════════════════════════════════════════════════════
        */}
      {/**
        * ═══ O BURACO PRETO ═══
        *
        * Entre o botão "Entrar" e a primeira recusa havia CENTO E QUARENTA E QUATRO PIXELS de
        * nada no celular: o pé do herói (64) somado à cabeça da dobra seguinte (80). Duas
        * folgas legítimas, cada uma defensável sozinha, que se encontram e viram um vão do
        * tamanho de meia tela — e no celular, onde a tela é a unidade, meia tela de preto lê
        * como "acabou a página".
        *
        * A regra que vale para o resto desta home: **o espaço entre duas dobras é UMA folga,
        * e não a soma de duas.** Quem fecha o vão é o pé de cima; a dobra de baixo entra logo.
        */}
      <section className="relative overflow-hidden px-6 pb-10 pt-14 text-center sm:pb-16 sm:pt-20">
        <Parede capas={parede} />

        <div className="relative mx-auto max-w-4xl">
          {/* A marca faz parte da COMPOSIÇÃO, e não é um enfeite acima do título.
              A 26px ela era uma miudeza boiando no topo de uma serifa de 72px: lida
              como um ícone de aba que alguém esqueceu ali. Grande, ela vira a primeira
              batida da página, e o título responde a ela. */}
          <Mark size={72} className="mx-auto text-[var(--color-ink-soft)] sm:hidden" />
          <Mark size={104} className="mx-auto hidden text-[var(--color-ink-soft)] sm:block" />

          <h1 className="voice mx-auto mt-9 max-w-3xl sm:mt-12 text-[40px] leading-[1.06] tracking-[-0.02em] sm:text-[72px]">
            A mente leitora nunca <em className="italic text-[var(--color-ink-soft)]">perde o fio</em>.
          </h1>

          <p className="mx-auto mt-6 max-w-md text-[16px] leading-relaxed text-[var(--color-ink-soft)] sm:text-[17px]">
            Um registro de leitura aberto, construído com quem lê.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/entrar"
              className="w-full rounded-[var(--radius-control)] bg-[var(--color-ink)] px-7 py-3.5 text-[15px] font-medium text-[var(--color-canvas)] sm:w-auto"
            >
              Entrar
            </Link>

            {vitrine && (
              <Link
                href={`/@${vitrine}`}
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] px-7 py-3.5 text-[15px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] sm:w-auto"
              >
                Ver uma estante
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── dobra 2: o que este app recusa ───────────────────────────── */}
      {/* max-w-4xl → 5xl: as recusas e os cartões são duas dobras EMPILHADAS, e elas tinham
          larguras diferentes. No celular ninguém nota; no desktop, a margem esquerda pula
          sessenta pixels de uma para a outra, e o olho lê isso como desalinho antes de ler
          qualquer palavra. Uma coluna só, do herói ao rodapé. */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-12 sm:pb-20 sm:pt-16">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          o que você não vai encontrar aqui
        </h2>

        {/**
          * ═══ AS RECUSAS BATEM. ELAS NÃO ESCORREM ═══
          *
          * Cada linha ocupava uma tela: 38px de serifa, cinza, com quatorze de respiro entre
          * elas. Lido de cima a baixo, aquilo não era um manifesto — era um poema longo, e
          * na terceira linha o olho já tinha desistido.
          *
          * Um manifesto é uma SALVA: as frases empilhadas, perto uma da outra, e a tinta
          * cheia. Agora elas cabem numa tela, e a cor do texto subiu de `ink-soft` para
          * `ink` — que é o contraste que uma recusa precisa ter para soar como recusa.
          *
          * A tipografia é a mesma. O que mudou é a densidade, e é ela que faz a diferença
          * entre uma frase forte e uma frase bonita.
          */}
        {/* A COLUNA é 5xl; a MEDIDA de leitura, não. Uma serifa de 32px correndo até 1024px
            dá uma linha longa demais para o olho voltar sem se perder, e a dobra deixa de
            bater. A borda esquerda alinha com os cartões; o texto para antes. */}
        <ul className="mt-9 flex max-w-3xl flex-col gap-4 sm:mt-11 sm:gap-5">
          {RECUSAS.map((linha) => (
            <li
              key={linha}
              className="voice text-[24px] leading-[1.2] tracking-[-0.015em] text-[var(--color-ink)] sm:text-[32px]"
            >
              {linha}
            </li>
          ))}
        </ul>

        {/**
          * ═══ "SILENCIOSO" DESCREVIA UM APP MORTO ═══
          *
          * A palavra queria dizer "aqui ninguém grita com você". Só que ela é a MESMA palavra
          * que descreve um produto sem gente dentro — e é essa a leitura que um estranho faz,
          * porque ele ainda não tem motivo nenhum para nos dar o benefício da dúvida. A última
          * frase da dobra mais forte do site estava dizendo, sem querer, "não tem ninguém aqui".
          *
          * O que a gente recusou foi a COBRANÇA, e não a companhia. O Gume tem feed, tem
          * amigos, tem gente indicando livro. O que ele não tem é alguém te cutucando.
          */}
        <p className="mt-10 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Nada disso é esquecimento. Cada uma foi recusada de propósito, para que ler aqui nunca
          vire mais uma tarefa a cumprir.
        </p>
      </section>

      {/* ── dobra 4: as pessoas ──────────────────────────────────────── */}
      {pessoas.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pb-20 sm:pb-24">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            quem já está por aqui
          </h2>

          {/* mt-10 → mt-6: o título e os cartões eram duas coisas separadas por um vão, e
              um vão entre um rótulo e o que ele rotula lê como "faltou carregar". */}
          <ul className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {pessoas.map((p) => (
              <li key={p.handle}>
                <Link href={`/@${p.handle}`} className="surface surface-hover flex h-full flex-col p-5 sm:p-6">
                  <span className="flex items-center gap-3">
                    <Avatar src={p.image} name={p.name} handle={p.handle} size={44} />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] text-[var(--color-ink)]">
                        {p.name ?? p.handle}
                      </span>
                      <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                        @{p.handle}
                      </span>
                    </span>
                  </span>

                  {/* QUATRO capas, e não cinco. A quinta fazia cada uma caber em 20% da
                      largura do cartão — miniaturas, e miniatura de capa não é capa: é uma
                      mancha. As capas são o argumento desta página, e um argumento se mostra
                      grande. */}
                  <span className="mt-5 flex gap-2">
                    {(p.capas ?? []).slice(0, 4).map((c, i) => (
                      <span key={i} className="cover-lift block w-1/4">
                        <Cover title="" src={c} />
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── o rodapé ─────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-rule)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-[14px] leading-relaxed text-[var(--color-ink-faint)]">
            O Gume é aberto: qualquer pessoa pode ver como ele é feito, e ajudar a fazer.{" "}
            <a
              href={CODIGO}
              className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
            >
              Está tudo no GitHub.
            </a>{" "}
            <Link
              href="/contribuidores"
              className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
            >
              Veja quem faz.
            </Link>{" "}
            <a
              href={CONVERSA}
              className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
            >
              A conversa acontece aqui.
            </a>
          </p>

          <Mark size={20} className="text-[var(--color-ink-faint)]" />
        </div>

        {/* ── O SELO DE QUEM MANTINHA ISTO DE PÉ SAIU DAQUI ──────────────
            Havia uma assinatura de empresa neste rodapé, com a marca de outra
            companhia, e ela era o ÚNICO lugar do produto com cor que não era a capa
            de um livro. A marca guarda-chuva foi aposentada, e ela foi junto.

            E não entrou nada no lugar, de propósito: um rodapé de produto não
            precisa dizer quem paga a conta. Quem quiser saber tem a página /sobre,
            e quem apoia tem a /apoiar. Esta tela é sobre livros. */}
      </footer>
    </main>
  );
}


/**
 * O que o Gume recusa. É a dobra mais forte do manifesto, e é a única que os
 * concorrentes não podem copiar: para eles, cada uma dessas linhas é receita.
 */
const RECUSAS = [
  "Sem ofensiva de sete dias para você manter.",
  "Sem algoritmo decidindo o que você vê.",
  /**
   * ═══ ESTA LINHA DIZIA "SEM NOTA MÉDIA, SEM PLACAR, SEM COMPETIÇÃO" ═══
   *
   * E ela virou MENTIRA no minuto em que o elo entrou. O Gume tem Ferro, Bronze, Prata,
   * tem moldura e tem barra de progresso — e uma home que promete o contrário na cara de
   * quem chega é propaganda enganosa, não importa quão bonita seja a frase.
   *
   * A frase foi trocada pela verdade, e a verdade continua sendo uma recusa forte: o elo
   * existe, e **o placar não**. Não há lista dos maiores leitores, não há posição, e o
   * número nunca cai. Ver lib/honras.ts e lib/honras.regras.test.ts.
   */
  /**
   * ═══ DUAS LINHAS FALAVAM DE HONRA, NUMA LISTA DE RECUSAS ═══
   *
   * "existe uma honra, e não existe lista dos maiores" e "a honra nunca cai" estavam sob o
   * título "o que você NÃO vai encontrar aqui" — explicando uma coisa que o app TEM.
   *
   * O leitor que chega não sabe o que é honra no Gume. Ele lê a palavra pela primeira vez
   * numa lista de coisas que não existem, e sai sem entender se aquilo é bom, se é ruim, ou
   * se é uma coisa que a gente se recusou a fazer. A dobra perde a força justamente onde ela
   * tinha que bater mais.
   *
   * Uma lista de recusas só pode conter RECUSAS. O que a honra é fica para a hora em que ela
   * aparecer na tela dele, com nome e cor. A recusa que sobra aqui é a única que importa
   * agora: não existe placar, e parar de ler não custa nada.
   */
  /**
   * E esta linha já nasceu quebrando o teste, o que é a melhor coisa que podia ter
   * acontecido com ela.
   *
   * Ela dizia "a lista dos maiores leitores não existe aqui" — e `lib/honras.regras.test.ts`
   * proíbe a EXPRESSÃO "maiores leitores" em qualquer tela, mesmo dentro de uma negação. A
   * proibição está certa: uma expressão que circula no produto vira um conceito do produto,
   * e não importa que o verbo ao lado dela seja "não existe". Ninguém deve sair daqui com a
   * ideia de que existe algo assim para ser negado.
   *
   * A frase diz o mesmo, sem nomear o que a gente não quer que exista.
   */
  "Sem nota média e sem placar. Ninguém é classificado por quanto leu.",
  "Sem punição por sumir. Você volta em um ano e está exatamente onde parou.",
  "Seus livros são seus, e você pode levar embora quando quiser.",
];

/**
 * A parede. Capas de verdade, levemente inclinadas, andando devagar para a
 * esquerda. As capas são a ÚNICA cor da tela, e é isso que a dobra está dizendo:
 * os seus livros moram aqui, e eles são brasileiros.
 *
 * A fita é duplicada e anda 50% do próprio comprimento: o laço fecha sem emenda,
 * sem JavaScript e sem medir nada. Quem pediu menos movimento vê a parede parada,
 * e ela continua fazendo o mesmo trabalho.
 */
function Parede({ capas }: { capas: { title: string; author: string | null; cover_url: string | null }[] }) {
  /**
   * TRÊS FILEIRAS, e cada uma com um pedaço diferente do acervo.
   *
   * A fita única mostrava trinta capas em rodízio. Uma estante não é uma fita: é uma
   * PAREDE, e o que faz o olho ler "estante" é a fileira em cima da fileira.
   *
   * As três andam em velocidades diferentes e em sentidos alternados. Não é enfeite: fileiras
   * que andam juntas leem como uma imagem única deslizando, e o efeito vira o de um banner.
   * Em ritmos diferentes, elas leem como profundidade — que é o que uma estante tem.
   */
  const porFileira = Math.ceil(capas.length / 3);
  const fileiras = [
    capas.slice(0, porFileira),
    capas.slice(porFileira, porFileira * 2),
    capas.slice(porFileira * 2),
  ].filter((f) => f.length > 0);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 flex flex-col gap-3 sm:gap-4"
        style={{
          // A inclinação mora AQUI, e o movimento nos filhos: dividindo o mesmo elemento, o
          // transform da animação apagaria a perspectiva no primeiro quadro.
          transform: "rotateX(14deg) rotateZ(-1.2deg) scale(1.08)",
          transformOrigin: "top center",
          perspective: "1400px",
        }}
      >
        {fileiras.map((fileira, f) => {
          const fita = [...fileira, ...fileira];

          return (
            <div key={f} className="flex w-max gap-3 sm:gap-4" style={{ marginLeft: f * -60 }}>
              <div
                className={f % 2 === 1 ? "marquee-reverso flex gap-3 sm:gap-4" : "marquee flex gap-3 sm:gap-4"}
                style={{ animationDuration: `${90 + f * 25}s` }}
              >
                {fita.map((c, i) => (
                  <span key={i} className="block w-24 shrink-0 sm:w-36">
                    <Cover title={c.title} author={c.author} src={c.cover_url} />
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/**
       * ═══ O PRETO SOBE E ENGOLE A PAREDE ═══
       *
       * Não é um degradê decorativo: é o que faz a serifa continuar legível sem precisar de
       * uma caixa atrás dela. A parede vive no topo, o texto vive no meio, e o preto sobe do
       * pé até apagá-la — a leitura acontece na parte de baixo, onde só há preto.
       *
       * `--color-canvas` é o preto do app, e não uma cor nova. A única cor desta página
       * continua vindo das capas.
       */}
      <div
        className="absolute inset-0"
        style={{
          /**
           * SÃO DUAS CAMADAS, e a de cima é a que salva a frase.
           *
           * Só com o degradê vertical, a tese caía em cima da lombada de um livro qualquer:
           * a serifa branca sobre a mancha clara de uma capa clara, e a linha ficava ilegível
           * em metade das cargas — porque a parede é embaralhada, e qual capa vai parar atrás
           * do "perde o fio" muda a cada visita. Uma legibilidade que depende de sorteio não
           * é legibilidade.
           *
           * A elipse é o véu: preto no centro, transparente nas bordas, exatamente onde a
           * frase mora. Ela escurece a parede ATRÁS DO TEXTO e deixa as capas inteiras
           * respirando em volta, que é o contrário de uma caixa opaca atrás do título.
           */
          background:
            /**
             * O véu curto da MARCA. Ela é a primeira batida da página e mora acima do centro,
             * onde a elipse grande já enfraqueceu — e a parede é embaralhada, então metade das
             * cargas punha o glifo claro em cima de uma capa clara. Um disco pequeno, só atrás
             * dela, resolve sem apagar a fileira de cima, que é o argumento da dobra.
             */
            "radial-gradient(ellipse 30% 14% at 50% 17%, " +
            "color-mix(in srgb, var(--color-canvas) 78%, transparent) 0%, " +
            "transparent 100%), " +
            "radial-gradient(ellipse 76% 54% at 50% 46%, " +
            "color-mix(in srgb, var(--color-canvas) 82%, transparent) 0%, " +
            "transparent 100%), " +
            "linear-gradient(to bottom, " +
            "color-mix(in srgb, var(--color-canvas) 45%, transparent) 0%, " +
            "color-mix(in srgb, var(--color-canvas) 72%, transparent) 40%, " +
            "var(--color-canvas) 88%, var(--color-canvas) 100%)",
        }}
      />

      {/* E as duas pontas recuam para o escuro: a parede não é CORTADA, ela se afasta. */}
      <div
        className="absolute inset-y-0 left-0 w-20 sm:w-40"
        style={{ background: "linear-gradient(to right, var(--color-canvas), transparent)" }}
      />
      <div
        className="absolute inset-y-0 right-0 w-20 sm:w-40"
        style={{ background: "linear-gradient(to left, var(--color-canvas), transparent)" }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════ logado: a casa

/**
 * Your house, and it has an order of importance: the book in your hand, then the
 * year, then your friends.
 *
 * Before, the three sat at almost the same weight, and a screen where everything
 * is equally loud is a screen where the eye has nowhere to land. The book you are
 * reading is now the hero, in the only place a hero belongs: alone, big, with a
 * lot of nothing around it. Everything else is a step quieter than the thing
 * above it. Air is what makes an interface feel calm, not colour.
 */
async function Casa({ viewerId }: { viewerId: string }) {
  const viewer = { id: viewerId };
  const me = await getUser(viewerId);

  const [lendo, counts, feed, ano] = await Promise.all([
    getShelf(viewer, viewerId, { filter: "lendo" }),
    getShelfCounts(viewer, viewerId),
    getFeed(viewer),
    getStats(viewer, viewerId, new Date().getFullYear()),
  ]);

  const primeiro = me?.displayName?.split(" ")[0] ?? null;

  return (
    <main className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
      <header className="mt-20 sm:mt-28">
        <h1 className="voice text-[40px] leading-[1.02] tracking-[-0.015em] sm:text-[56px]">
          {primeiro ? <>Oi, {primeiro}.</> : <>A casa é sua.</>}
        </h1>

        {/* One line that says where the person actually IS. This is the difference
            between an app that speaks and an app that labels, and it is why there
            is no exclamation mark in it and no forced cheer. */}
        <p className="mt-5 text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
          {estado(lendo.length, counts.esperando ?? 0)}
        </p>

        {/* O último livro que você abriu. Some quando ele já é o herói ali embaixo:
            repetir a mesma capa duas vezes na mesma tela não é memória, é eco. */}
        <Resume hide={lendo[0]?.slug} />
      </header>

      {/* ── o herói: o livro na mão ──────────────────────────────────────
          Dois livros lado a lado preenchem a linha e ficam bonitos. UM livro
          centralizado num card da largura inteira não fica: a capa boia no meio
          de um vazio grande demais, e o vazio não está dizendo nada. Então com
          um só o card encolhe, a capa deita ao lado do título, e o herói continua
          sendo o herói sem precisar de metade da tela para provar isso. */}
      {lendo.length > 0 ? (
        <section
          className={[
            "mt-10 grid gap-4",
            lendo.length === 1 ? "max-w-2xl" : "sm:grid-cols-2",
          ].join(" ")}
        >
          {lendo.map((b) => (
            <Link
              key={b.workId}
              href={`/livro/${b.slug}`}
              className="surface surface-hover flex h-full items-center gap-7 p-7"
            >
              <span className="cover-lift block w-28 shrink-0 sm:w-32">
                <Cover title={b.title} author={b.author} src={b.coverUrl} />
              </span>

              <span className="min-w-0">
                <span className="voice block text-[22px] leading-tight sm:text-[26px]">
                  {b.title}
                </span>
                {b.author && (
                  <span className="mt-3 block text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                    {b.author}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </section>
      ) : (
        <section className="surface mt-10 flex flex-col items-center gap-6 px-7 py-14 text-center">
          <p className="voice max-w-md text-[22px] leading-snug text-[var(--color-ink-soft)]">
            Nenhum livro na mão. A estante está esperando.
          </p>
          <Link
            href="/estante?filtro=esperando"
            className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-canvas)]"
          >
            Escolher um livro
          </Link>
        </section>
      )}

      {/* ── o ano, em números largos e espaçados ─────────────────────── */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between px-1">
          <h2 className="tabular text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {new Date().getFullYear()}
          </h2>
          <Link href="/estatisticas" className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            ver as estatísticas
          </Link>
        </div>

        {/* A big zero is an accusation. If nothing was finished yet, we say what
            IS true, in a sentence, and never print a 0 in display type. */}
        {ano.books > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Livro e página no MESMO card: um quarto card sobrando, sozinho
                na segunda linha, ficava assimétrico — três cartões cheios lê
                melhor que quatro com um errante. `null` quando nenhuma edição
                do que você terminou tem página cadastrada — ver o cabeçalho
                de lib/stats.ts. Volume da vida inteira medido em páginas,
                nunca ritmo: sem meta, sem ofensiva. */}
            <Numero
              valor={ano.books}
              rotulo={ano.books === 1 ? "livro terminado" : "livros terminados"}
              extra={ano.pages !== null ? { valor: ano.pages, rotulo: "páginas" } : undefined}
            />
            {ano.nationalities.length > 0 && (
              <Numero
                valor={ano.nationalities.length}
                rotulo={ano.nationalities.length === 1 ? "nacionalidade" : "nacionalidades"}
              />
            )}
            {ano.publishers.length > 0 && (
              <Numero
                valor={ano.publishers.length}
                rotulo={ano.publishers.length === 1 ? "editora" : "editoras"}
              />
            )}
          </div>
        ) : (
          <p className="surface p-7 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            Nada terminado ainda este ano. O ano é longo.
          </p>
        )}
      </section>

      {/* ── os amigos, por último ────────────────────────────────────── */}
      <section className="surface mt-10 p-7">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            amigos
          </h2>
          <Link href="/feed" className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            ver tudo
          </Link>
        </div>

        {feed.items.length === 0 ? (
          <p className="mt-6 text-[15px] text-[var(--color-ink-soft)]">
            Ninguém por perto ainda. Siga alguém, e o que essa pessoa ler aparece aqui.
          </p>
        ) : (
          <ul className="mt-2">
            {feed.items.slice(0, 4).map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-4 border-b border-[var(--color-rule)] py-5 last:border-b-0 last:pb-0"
              >
                <AvatarLink src={it.actorImage} name={it.actorName} handle={it.actorHandle} size={36} />

                <Link href={`/livro/${it.workSlug}`} className="cover-lift w-10 shrink-0">
                  <Cover title={it.workTitle} author={it.author} src={it.coverUrl} />
                </Link>

                <p className="min-w-0 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                  <Link href={`/@${it.actorHandle}`} className="font-medium text-[var(--color-ink)] hover:underline">
                    {it.actorName ?? it.actorHandle}
                  </Link>{" "}
                  {VERBO[it.verb] ?? it.verb}{" "}
                  <Link href={`/livro/${it.workSlug}`} className="voice text-[16px] text-[var(--color-ink)] hover:underline">
                    {it.workTitle}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

/**
 * One number, alone in a wide card. A statistic crammed next to a label is a chip.
 *
 * `extra` é um segundo número, pequeno, dentro do MESMO card — não um card à parte.
 * Nasceu de livros+páginas: um quarto card sobrando sozinho numa segunda linha lia
 * pior que dois números que já andam juntos (você lê UM livro, não duas coisas)
 * dividindo o mesmo cartão.
 */
function Numero({
  valor, rotulo, extra,
}: {
  valor: number;
  rotulo: string;
  extra?: { valor: number; rotulo: string };
}) {
  return (
    <div className="surface flex flex-col items-center gap-2 px-6 py-8">
      <span className="voice tabular text-[40px] leading-none">
        {valor.toLocaleString("pt-BR")}
      </span>
      <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {rotulo}
      </span>
      {extra && (
        <span className="tabular mt-1 text-[13px] text-[var(--color-ink-faint)]">
          {extra.valor.toLocaleString("pt-BR")} {extra.rotulo}
        </span>
      )}
    </div>
  );
}

/**
 * Where the reader is, in one sentence. Not decoration: it is the line that makes
 * the app sound like it is talking to a person instead of labelling one. Small
 * numbers are spelled out, because "1 livro na mão" reads like a receipt.
 */
const NUMERO = ["nenhum", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];

function estado(lendo: number, esperando: number): string {
  const palavra = (n: number) => NUMERO[n] ?? String(n);

  if (lendo === 0 && esperando === 0) {
    return "A estante está vazia. Comece por um livro.";
  }
  if (lendo === 0) {
    return `Nenhum livro na mão, ${esperando} ${esperando === 1 ? "esperando" : "esperando"} na estante.`;
  }

  const mao =
    lendo === 1
      ? "Um livro na mão"
      : `${palavra(lendo).replace(/^./, (c) => c.toUpperCase())} livros na mão`;

  /**
   * "E a estante limpa" era AMBÍGUO, e um leitor de fora leu como cobrança.
   *
   * Ele não sabia se era um elogio ("você está em dia") ou um puxão de orelha ("você não
   * cadastrou nada"). Numa frase que a pessoa vê toda vez que abre o app, a dúvida é o pior
   * resultado possível: ela fica com a sensação de estar devendo alguma coisa, e não sabe o
   * quê.
   *
   * A frase agora diz o FATO, e o fato é bom: nada esperando.
   */
  if (esperando === 0) return `${mao}, e nada esperando na fila.`;
  return `${mao}, ${esperando} esperando na estante.`;
}

const VERBO: Record<string, string> = {
  started: "começou",
  finished: "terminou",
  shelved: "colocou na estante",
  rated: "avaliou",
  reviewed: "resenhou",
  recommended: "recomendou",
};

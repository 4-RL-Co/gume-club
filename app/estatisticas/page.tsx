import Link from "next/link";
import { getViewer, getUser } from "@/lib/viewer";
import {
  getStats, getCommunity, resumo, MINIMO_PARA_FALAR, MINIMO_DA_COMUNIDADE,
  type Slice, type Stats, type Community, type Extremo,
} from "@/lib/stats";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { ShelfTabs } from "@/components/shelf-tabs";
import { mine } from "@/lib/veredito";
import { Barras, Vereditos, Seculos } from "@/components/graficos-leitura";
import { MapaMundi } from "@/components/mapa-mundi";
import { empacotar } from "@/lib/masonry";
import { ApoieEAcompanhe } from "@/components/apoie-e-acompanhe";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ESTA PÁGINA NÃO TE DIZ QUANTO VOCÊ LEU. ELA TE DIZ QUEM VOCÊ É.
 *
 *  Curadoria, e não desempenho. Não tem página lida, não tem meta, não
 *  tem velocidade, não tem ritmo, e não vai ter.
 *
 *  ═══ A REGRA DA FRASE ═══
 *
 *  A frase de cada card entrega O QUE a estatística REVELOU, e nunca
 *  explica COMO ela foi calculada. "O ano em que a obra foi escrita,
 *  nunca o ano em que a edição foi impressa" é nota de rodapé sobre o
 *  modelo de dados, e ninguém liga. O que a pessoa quer ler é o fato:
 *  "as obras que você leu foram escritas entre 1857 e 2019, e metade
 *  delas antes de 1950."
 *
 *  Se a frase explica o cálculo, ela está errada. Ver ai/DECISIONS.md.
 *
 *  ═══ PRIVADA ═══
 *
 *  Nenhum número desta página aparece no perfil nem no feed. Ela é sua,
 *  e exige estar logado: não existe "ver as estatísticas de um estranho".
 * ════════════════════════════════════════════════════════════════════
 */
export default async function Estatisticas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.ano) ? params.ano[0] : params.ano;

  const viewer = await getViewer();
  if (!viewer) {
    return (
      <main className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
        <ScreenHeader title={<>O seu <em className="italic text-[var(--color-ink-soft)]">gosto</em>.</>} />
        <Empty>
          <Link href="/entrar" className="underline decoration-[var(--color-ink)] underline-offset-4">
            Entre
          </Link>{" "}
          para ver o retrato da sua leitura. Ele é só seu.
        </Empty>
      </main>
    );
  }

  const owner = await getUser(viewer.id);
  if (!owner) return <Empty>Ainda não tem ninguém por aqui.</Empty>;

  const now = new Date().getFullYear();
  const year = raw === "sempre" ? null : Number(raw) >= 1900 && Number(raw) <= now ? Number(raw) : now;

  const [s, c] = await Promise.all([
    getStats(viewer, owner.id, year),
    getCommunity(viewer, owner.id),
  ]);

  const frase = resumo(s);

  if (s.books === 0 && s.shelf === 0) {
    return (
      <main className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
        <ScreenHeader title={<>O seu <em className="italic text-[var(--color-ink-soft)]">gosto</em>.</>} />
        <ShelfTabs active="estatisticas" />
        <Empty>
          A estante está vazia. Termine um livro, e esta tela começa a falar sobre você.
        </Empty>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
      <ScreenHeader
        title={<>O seu <em className="italic text-[var(--color-ink-soft)]">gosto</em>.</>}
        meta={[year === null ? "a vida inteira" : String(year)]}
      />

      <ShelfTabs active="estatisticas" />

      {/* a lente do tempo. Um recorte, nunca o assunto. */}
      <nav className="mt-6 flex flex-wrap gap-2">
        {[...s.years.slice(0, 6), "sempre" as const].map((y) => {
          const on = y === "sempre" ? year === null : y === year;
          return (
            <Link
              key={String(y)}
              href={`/estatisticas?ano=${y}`}
              aria-current={on ? "page" : undefined}
              className={[
                "pill px-4 py-2 text-[14px] transition-colors",
                on
                  ? "afiado font-medium text-[var(--color-ink)]"
                  : "text-[var(--color-ink-soft)] hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              <span className="tabular">{y}</span>
            </Link>
          );
        })}
      </nav>

      {/* ══ 1. O TOPO: o número, sozinho, enorme ══════════════════════
          Ele é o único número grande da página, e é o único que NÃO é o
          assunto dela. Tudo o que vem depois fala de gosto; este fala de
          quantidade, e por isso ele fica aqui em cima e cala a boca. */}
      {/* O número RESPIRA, e é a primeira coisa que a pessoa vê.
          Estava com entrelinha 0.85, que é menor que o próprio glifo: a caixa de
          linha cortava o algarismo em cima e embaixo, e o número parecia espremido
          no enquadramento. Entrelinha 1 e ar em volta. */}
      {/* A home tem a regra escrita: "a big zero is an accusation". Esta tela imprimia
          um 0 de 132px para quem importou a estante e ainda não terminou nada NO ANO
          (que é o recorte padrão). Zero no recorte vira frase, e a frase aponta a
          lente da vida inteira. Ver app/page.tsx. */}
      {s.books === 0 ? (
        <section className="mt-16 sm:mt-20">
          <p className="voice max-w-2xl text-[28px] leading-snug sm:text-[36px]">
            Nada terminado {year === null ? "ainda" : `em ${year}`}. O ano é longo.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            <span className="tabular text-[var(--color-ink)]">{s.shelf}</span>{" "}
            {s.shelf === 1 ? "livro espera" : "livros esperam"} na estante.
            {year !== null && (
              <>
                {" "}
                <Link href="/estatisticas?ano=sempre" className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]">
                  Ver a vida inteira
                </Link>
                .
              </>
            )}
          </p>
        </section>
      ) : (
      <section className="mt-16 flex flex-wrap items-end gap-x-12 gap-y-6 sm:mt-20">
        <div>
          <span className="voice tabular block text-[96px] leading-none sm:text-[132px]">
            {s.books}
          </span>
          <span className="mt-5 block text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            {s.books === 1 ? "livro lido" : "livros lidos"}
          </span>
        </div>

        <div className="flex flex-col gap-2 pb-3 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
          {/* Volumes e séries contam separado: ler trinta volumes de Vagabond não é
              ler trinta livros, e uma estatística que finge o contrário é uma
              estatística em que ninguém confia, a começar pelo dono dela. */}
          {s.volumes > 0 && (
            <span>
              <span className="tabular text-[var(--color-ink)]">{s.volumes}</span>{" "}
              {s.volumes === 1 ? "volume" : "volumes"}
              {s.series > 0 && (
                <>
                  , em <span className="tabular text-[var(--color-ink)]">{s.series}</span>{" "}
                  {s.series === 1 ? "série" : "séries"}
                </>
              )}
            </span>
          )}

          {/* `null` quando NENHUMA edição do que você terminou tem página cadastrada
              — "sem contagem" não é "zero", e um zero aqui se leria como fato. Ver
              o cabeçalho de lib/stats.ts. */}
          {s.pages !== null && (
            <span>
              <span className="tabular text-[var(--color-ink)]">{s.pages.toLocaleString("pt-BR")}</span>{" "}
              páginas
            </span>
          )}

          {/* Ter e ler são coisas diferentes, e essa é a tensão que define o app. */}
          <span>
            de <span className="tabular text-[var(--color-ink)]">{s.shelf}</span> na estante
          </span>
        </div>
      </section>
      )}

      {/* A frase-resumo. Determinística, e calada quando não sabe. */}
      {frase ? (
        <p className="voice mt-10 max-w-2xl text-[26px] leading-snug sm:text-[32px]">{frase}</p>
      ) : (
        s.books > 0 && (
          <p className="mt-10 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-faint)]">
            Com {s.books} {s.books === 1 ? "livro" : "livros"}, ainda não dá para dizer nada sobre
            você sem inventar. A partir de {MINIMO_PARA_FALAR}, esta tela começa a falar.
          </p>
        )
      )}

      <div className="mt-12 flex flex-col gap-4">
        {/* ══ 2. A DISTÂNCIA: o coração da página ═══════════════════════
            A estatística que nenhum outro app do mundo tem, porque nenhum outro
            separa o ano da OBRA do ano da EDIÇÃO. */}
        {s.age && (
          <section className="surface p-7 sm:p-9">
            <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              a distância
            </h2>

            {/**
              * O RANGE, e não a mediana, é a manchete. Duas razões.
              *
              * 1. "Você lê livros com 41 anos de idade" se lê como "você, que tem 41
              *    anos, lê livros". A frase fala do LEITOR quando devia falar do LIVRO,
              *    e uma manchete ambígua é uma manchete quebrada.
              *
              * 2. Um número do meio não é ninguém. "2.427 anos" também não, sozinho:
              *    o que é alguém é A ARTE DA GUERRA com 2.427 anos ao lado do livro
              *    que saiu ano passado. O nome do livro é o que transforma a
              *    estatística em retrato, e o retrato é o produto desta página.
              *
              * A mediana não sumiu: ela virou a linha quieta embaixo, que é o lugar
              * dela. Extremo é o drama; mediana é a verdade. Os dois cabem, em ordem.
              */}
            <p className="voice mt-5 max-w-2xl text-[28px] leading-snug sm:text-[36px]">
              {s.oldest && s.newest && s.oldest.slug !== s.newest.slug ? (
                <>
                  O mais velho que você leu tem {idade(s.oldest.year)}{" "}
                  {idade(s.oldest.year) === 1 ? "ano" : "anos"}. O mais novo tem{" "}
                  {idade(s.newest.year)} {idade(s.newest.year) === 1 ? "ano" : "anos"}.
                </>
              ) : (
                <>
                  Metade do que você leu foi escrito antes de {ano(s.age.midpoint)}.
                </>
              )}
            </p>

            {/* A prova. Os dois livros, com nome: é o que faz a frase acima ser sobre
                VOCÊ, e não sobre uma média que poderia ser de qualquer um. */}
            {s.oldest && s.newest && s.oldest.slug !== s.newest.slug && (
              <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:gap-12">
                <Ponta livro={s.oldest} rotulo="o mais velho" />
                <Ponta livro={s.newest} rotulo="o mais novo" />
              </div>
            )}

            <p className="mt-8 max-w-2xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
              As obras que você leu foram escritas entre {ano(s.age.from)} e {ano(s.age.to)}, e
              metade delas antes de {ano(s.age.midpoint)}.
            </p>

            {s.centuries.length > 0 && (
              <div className="mt-9">
                <Seculos dados={s.centuries} />
              </div>
            )}
          </section>
        )}

        {/* ══ 3. A GRADE ═══════════════════════════════════════════════ */}
        <Grade s={s} year={year} />

        {/* ══ 4. A COMUNIDADE ═══════════════════════════════════════════
            E aqui está a linha que NÃO se cruza: a estatística da comunidade
            fala de GOSTO, e nunca de VOLUME. Nenhum número de livros lidos por
            outra pessoa aparece aqui. Nenhuma média, nenhum percentil, nenhuma
            posição. Comparar gosto é o produto; comparar esforço é o veneno. */}
        <Comunidade c={c} s={s} />

        {/* "falta CTA pra isso" — o dono. Aqui, e não em toda tela: é o momento em
            que a pessoa acabou de olhar a própria trajetória de leitura. Ver o
            cabeçalho de components/apoie-e-acompanhe.tsx. */}
        <ApoieEAcompanhe />
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════ grade

/**
 * ════════════════════════════════════════════════════════════════════
 *  "as boxes estão meio jogadas, não quero espaços vazios" — e depois,
 *  vendo o resultado: "olha essas boxes todas tortas" — o dono.
 *
 *  Um GRID de duas colunas estica todo cartão pra bater a altura do
 *  vizinho mais alto — o primeiro conserto. Só que `columns-2` (CSS puro,
 *  sem cálculo) empacota SOZINHO, e com meia dúzia de cartões de alturas
 *  bem diferentes o algoritmo de balanceamento do navegador erra: mede a
 *  altura total, divide por 2, e não sabe redistribuir quando um cartão
 *  sozinho já estoura essa média — sobrava uma coluna murcha do lado de
 *  uma torta. `lib/masonry.ts` (`empacotar()`) faz à mão o que o navegador
 *  fazia mal: cada cartão entra com um PESO (linhas que desenha), e o
 *  guloso bota cada um na coluna mais vazia no momento.
 *
 *  O mapa (e o card vazio que o substitui, sem dado) continua de fora do
 *  empacotamento — ele é largo por natureza, não uma coluna. Fica em cima,
 *  como sempre foi a segunda coisa da grade.
 *
 *  Tela estreita não tem coluna pra desequilibrar: os mesmos cartões
 *  aparecem de novo, empilhados em ORDEM NATURAL (`sm:hidden`), e o
 *  empacotado some (`hidden sm:grid`). Ver o mesmo par em
 *  components/resumo-do-perfil.tsx.
 * ════════════════════════════════════════════════════════════════════
 */
function Grade({ s, year }: { s: Stats; year: number | null }) {
  const mapa = s.nationalities.length > 0 ? (
    <Card key="mapa" titulo="de onde vêm os seus autores" frase={fraseNacoes(s.nationalities)}>
      <MapaMundi dados={s.nationalities} />
    </Card>
  ) : (
    year !== null && (
      <Card key="mapa" titulo="de onde vêm os seus autores">
        <p className="text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
          Nenhum autor com nacionalidade cadastrada entre os livros que você
          terminou em {year}.{" "}
          <Link href="/estatisticas?ano=sempre" className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]">
            Ver a vida inteira
          </Link>
          .
        </p>
      </Card>
    )
  );

  // Cada cartão entra com um PESO: aproximadamente quantas linhas ele desenha.
  const blocos: { key: string; peso: number; node: React.ReactNode }[] = [];

  // O que você achou do que leu. Pedido do dono: as palavras que você dá
  // também são um retrato, e elas não apareciam em lugar nenhum.
  if (s.verdicts.some((v) => v.n > 0)) {
    blocos.push({
      key: "verdicts",
      peso: 1 + s.verdicts.length, // os cinco degraus aparecem sempre
      node: (
        <Card key="verdicts" titulo="o que você achou" frase={fraseVeredito(s.verdicts)}>
          <Vereditos dados={s.verdicts} />
        </Card>
      ),
    });
  }

  if (s.publishers.length > 0) {
    blocos.push({
      key: "publishers",
      peso: 1 + s.publishers.length,
      node: (
        <Card key="publishers" titulo="quem publica o que você lê" frase={fraseEditoras(s.publishers)}>
          <Barras dados={s.publishers} cor="--grafico-editoras" />
        </Card>
      ),
    });
  }

  // Ninguém tem esse dado. É o mais bonito da página.
  if (s.origins.length > 0) {
    blocos.push({
      key: "origins",
      peso: 1 + s.origins.length,
      node: (
        <Card key="origins" titulo="de onde vieram os seus livros" frase={fraseOrigens(s.origins)}>
          <Barras dados={s.origins} cor="--grafico-origens" />
        </Card>
      ),
    });
  }

  if (s.formats.length > 0) {
    blocos.push({
      key: "formats",
      peso: 1 + s.formats.length,
      node: (
        <Card key="formats" titulo="papel ou tela" frase={fraseFormato(s.formats)}>
          <Barras dados={s.formats} cor="--grafico-formatos" />
        </Card>
      ),
    });
  }

  // O card "as suas pontas" morava aqui, e saiu: as duas pontas agora são a
  // manchete do card da distância, com nome e link. Mostrar os mesmos dois
  // livros de novo, três dedos abaixo, não é reforço: é eco.
  if (s.reread.length > 0) {
    blocos.push({
      key: "reread",
      peso: 1 + s.reread.length,
      node: (
        <Card
          key="reread"
          titulo="o que você releu"
          frase={
            s.reread.length === 1
              ? "Um livro você quis de novo."
              : `${s.reread.length} livros você quis de novo.`
          }
        >
          <ul className="flex flex-col gap-3">
            {s.reread.map((r) => (
              <li key={r.slug}>
                <Link href={`/livro/${r.slug}`} className="group flex items-baseline gap-3">
                  <span className="voice min-w-0 flex-1 truncate text-[16px] group-hover:underline">
                    {r.title}
                  </span>
                  <span className="tabular shrink-0 text-[12px] text-[var(--color-ink-faint)]">
                    {r.times}x
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ),
    });
  }

  // Sem julgamento, e sem "taxa de conclusão". É um fato sobre o seu ano.
  if (s.abandoned > 0) {
    blocos.push({
      key: "abandoned",
      peso: 3,
      node: (
        <Card key="abandoned" titulo="o que você largou">
          <p className="voice text-[24px] leading-snug">
            {s.abandoned === 1
              ? "Um livro você deixou pelo caminho."
              : `${s.abandoned} livros você deixou pelo caminho.`}
          </p>
          <p className="mt-5 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
            Largar um livro é uma escolha, e ela diz tanto sobre você quanto terminar.
          </p>
        </Card>
      ),
    });
  }

  const colunas = empacotar(blocos, (b) => b.peso, 2);

  return (
    <>
      {mapa}

      <div className="sm:hidden">
        {blocos.map((b) => b.node)}
      </div>

      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4">
        {colunas.map((coluna, i) => (
          <div key={i} className="flex flex-col">
            {coluna.map((b) => b.node)}
          </div>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════ comunidade

function Comunidade({ c, s }: { c: Community; s: Stats }) {
  /**
   * A COMUNIDADE É OS OUTROS, e ela só fala quando existe.
   *
   * Antes o agregado incluía o próprio leitor, e com poucos leitores ele É a
   * comunidade: a tela dizia "a comunidade lê autores de 4 países. Você leu de 4",
   * devolvendo o número dele para ele mesmo com cara de comparação. Uma comparação
   * em que os dois lados são a mesma pessoa não é uma lente, é uma piada.
   *
   * Agora a comunidade exclui você, e com menos de três outros leitores ela CALA A
   * BOCA. É a mesma regra da frase-resumo: não se inventa observação sobre o que
   * ainda não dá para saber.
   */
  if (c.leitores < MINIMO_DA_COMUNIDADE) return null;

  const temAlgo =
    c.countries > 0 || c.medianAge !== null || c.publishers.length > 0 || c.together.length > 0;
  if (!temAlgo) return null;

  return (
    <section className="surface mt-6 p-7 sm:p-9">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        e a comunidade
      </h2>

      <div className="mt-7 flex flex-col gap-7">
        {/**
          * A frase de países. Antes ela era "a comunidade lê autores de 4 países.
          * Você leu de 4", e era uma TAUTOLOGIA: o agregado incluía o próprio
          * leitor, então ele devolvia o número dele para ele mesmo.
          *
          * Corrigido o agregado, sobrava outro problema: comparar duas contagens é
          * um fato MORTO mesmo quando é verdade. Empatar em 4 não diz nada.
          *
          * O que diz alguma coisa é o que só VOCÊ leu. Isso nunca empata por acaso,
          * nunca é tautológico, e fala do seu gosto, que é o que esta página promete.
          * Zero é uma resposta legítima, e não uma falta.
          */}
        {c.countries > 0 && c.myCountries > 0 && (
          <p className="voice max-w-2xl text-[22px] leading-snug sm:text-[26px]">
            Você leu autores de {c.myCountries} {c.myCountries === 1 ? "país" : "países"}.
            <span className="text-[var(--color-ink-soft)]">
              {c.myOnly > 0 ? (
                <>
                  {" "}
                  {c.myOnly === 1
                    ? "Um deles ninguém mais aqui leu."
                    : `${c.myOnly} deles ninguém mais aqui leu.`}
                </>
              ) : (
                <> Todos eles alguém mais aqui também leu.</>
              )}
            </span>
          </p>
        )}

        {/* Mesma armadilha da manchete, e mesmo conserto: "a comunidade lê obras com
            61 anos" ainda escorrega para "a comunidade, que tem 61 anos". O sujeito da
            idade tem que ser A OBRA, e a frase tem que dizer isso sem depender de o
            leitor adivinhar. */}
        {c.medianAge !== null && s.age && (
          <p className="voice max-w-2xl text-[22px] leading-snug sm:text-[26px]">
            As obras que a comunidade lê têm {c.medianAge}{" "}
            {c.medianAge === 1 ? "ano" : "anos"}.
            <span className="text-[var(--color-ink-soft)]">
              {" "}As suas têm {s.age.median}.
            </span>
          </p>
        )}

        {c.oldest && (
          <p className="max-w-2xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
            A obra mais antiga que alguém por aqui leu é{" "}
            <Link href={`/livro/${c.oldest.slug}`} className="voice text-[var(--color-ink)] hover:underline">
              {c.oldest.title}
            </Link>
            , de {ano(c.oldest.year)}.
          </p>
        )}

        {/* "3 pessoas leram Grande Sertão este ano." FATO, e nunca ranking:
            o número é de PESSOAS que leram aquele livro, e jamais de livros que
            uma pessoa leu. A diferença entre as duas frases é a diferença entre
            este app e o outro. */}
        {c.together.length > 0 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              lidos junto, este ano
            </h3>
            <ul className="mt-5 flex flex-col gap-3">
              {c.together.map((t) => (
                <li key={t.slug} className="text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
                  <span className="tabular text-[var(--color-ink)]">{t.people}</span> pessoas leram{" "}
                  <Link href={`/livro/${t.slug}`} className="voice text-[var(--color-ink)] hover:underline">
                    {t.title}
                  </Link>
                  .
                </li>
              ))}
            </ul>
          </div>
        )}

        {c.publishers.length > 0 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              as editoras das estantes
            </h3>
            <div className="mt-5">
              <Barras dados={c.publishers} cor="--grafico-editoras" />
            </div>
          </div>
        )}
      </div>

      <p className="mt-9 max-w-xl text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
        Aqui se compara o que se lê, e nunca o quanto. Ninguém fica na frente de ninguém, e isso
        não é esquecimento: é o motivo de este lugar existir.
      </p>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════ peças

/** Um assunto, um card. Nada flutua solto na página. */
function Card({
  titulo, frase, children,
}: {
  titulo: string;
  frase?: string;
  children: React.ReactNode;
}) {
  // mb-4: os cartões empilham dentro de uma coluna calculada por
  // lib/masonry.ts (ver Grade(), acima) — sem `columns` do CSS, o `gap`
  // do container não existe mais, e o respiro entre cartões da MESMA
  // coluna volta a ser margem, como sempre foi antes do CSS ter `gap`.
  return (
    <section className="surface mb-4 flex flex-col p-7 sm:p-8">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {titulo}
      </h2>
      {frase && (
        <p className="voice mt-4 text-[19px] leading-snug text-[var(--color-ink)]">{frase}</p>
      )}
      <div className="mt-7">{children}</div>
    </section>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  OS GRÁFICOS. Uma linguagem só, e cada assunto tem a SUA COR.
 *
 *  Já foi tudo monocromático ("a única cor é a capa"), e o dono vetou:
 *  cinza sobre cinza era desinteressante e difícil de ler. A regra
 *  antiga protegia a capa, e esta é a única tela do app sem capa
 *  nenhuma; aqui o gráfico é o conteúdo. Então cada ASSUNTO tem uma cor
 *  fixa (--grafico-*, em globals.css, validadas para daltonismo e
 *  contraste nos dois temas), e dentro de um gráfico todas as barras
 *  são IGUAIS: quem compara é o comprimento, e cor por valor seria um
 *  ranking pintado. Ver ai/DECISIONS.md.
 *
 *  O resto do contraste vem da ARESTA SUPERIOR ACESA: a barra é um
 *  volume translúcido da cor com um filete de 1px na cor cheia no topo.
 *  E isso é a marca: o fio é onde a luz bate. A mesma ideia que desenha
 *  o símbolo desenha o gráfico. Ver .barra-item em globals.css.
 *
 *  Duas orientações, um material só. A COLUNA quando o eixo é o tempo (o
 *  olho lê da esquerda para a direita e vê a leitura andando pelos
 *  séculos). A LINHA quando o rótulo é uma palavra que precisa caber
 *  ("Companhia das Letras", "presente da minha irmã"): em coluna, esse
 *  rótulo teria que ser girado ou cortado, e um rótulo girado é um
 *  gráfico pedindo desculpa.
 * ════════════════════════════════════════════════════════════════════
 */

function Ponta({ livro, rotulo }: { livro: Extremo; rotulo: string }) {
  return (
    <Link href={`/livro/${livro.slug}`} className="group block">
      <span className="block text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {rotulo}
      </span>
      <span className="voice mt-2 block text-[20px] leading-snug group-hover:underline">
        {livro.title}
      </span>
      <span className="mt-1 block text-[13px] text-[var(--color-ink-soft)]">
        {livro.author ? `${livro.author}, ` : ""}
        {ano(livro.year)}
      </span>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════ as frases
//
// TODAS elas entregam o FATO, e nenhuma explica o cálculo. Se você for escrever
// "isto sai da tabela tal" ou "o ano da obra, nunca o da edição", pare: isso é
// nota de rodapé sobre o modelo de dados, e o leitor não liga. Ver ai/DECISIONS.md.

/** Um ano, e o a.C. quando ele é negativo. O Sun Tzu não pode virar "-401". */
function ano(n: number): string {
  return n < 0 ? `${Math.abs(n)} a.C.` : String(n);
}

/**
 * A idade de uma obra, em anos.
 *
 * O ano negativo é a.C., e a conta continua sendo uma subtração: 2026 menos (-401)
 * dá 2427, que é a idade da Arte da Guerra. Escrever `Math.abs()` aqui daria 1625,
 * e a obra mais velha da estante apareceria mais nova que Dom Casmurro.
 */
function idade(year: number): number {
  return new Date().getFullYear() - year;
}

/** "13 brasileiras, 9 britânicas e 1 martinicana." A frase, não a tabela. */
function fraseNacoes(dados: Slice[]): string {
  const bits = dados.slice(0, 3).map((d) => {
    const palavra = d.label.toLowerCase();
    return `${d.n} ${d.n > 1 && !palavra.endsWith("s") ? `${palavra}s` : palavra}`;
  });
  if (bits.length === 1) return `${bits[0]}.`;
  return `${bits.slice(0, -1).join(", ")} e ${bits[bits.length - 1]}.`;
}

/** "A 34 publica 6 dos seus livros." O fato, e não "sai da edição que é a sua". */
function fraseEditoras(dados: Slice[]): string {
  const primeira = dados[0]!;
  if (dados.length === 1) {
    return `Tudo o que você leu saiu da ${primeira.label}.`;
  }
  return `A ${primeira.label} publica ${primeira.n} dos seus livros, mais que qualquer outra.`;
}

/** "8 dos seus livros vieram de sebo." Nas palavras dele, e nunca numa categoria nossa. */
function fraseOrigens(dados: Slice[]): string {
  const primeira = dados[0]!;
  return `${primeira.n} ${primeira.n === 1 ? "livro seu veio" : "livros seus vieram"} de ${primeira.label.toLowerCase()}.`;
}

/** «"adorei" é a palavra que você mais diz.» O fato, e nunca uma conta. */
function fraseVeredito(dados: { value: number; n: number }[]): string | undefined {
  const total = dados.reduce((soma, d) => soma + d.n, 0);
  if (total === 0) return undefined;

  if (total === 1) {
    const unico = dados.find((d) => d.n === 1)!;
    return `Um livro julgado até agora: "${mine(unico.value)}".`;
  }

  const porUso = [...dados].sort((a, b) => b.n - a.n || b.value - a.value);
  if (porUso[0]!.n === porUso[1]!.n) {
    return `${total} livros julgados, e nenhuma palavra tomou a frente.`;
  }
  return `De ${total} livros julgados, "${mine(porUso[0]!.value)}" é a palavra que você mais diz.`;
}

function fraseFormato(dados: Slice[]): string {
  const papel = dados.find((d) => d.label === "físico")?.n ?? 0;
  const tela = dados.find((d) => d.label === "digital")?.n ?? 0;

  if (tela === 0) return "Você lê em papel, e só em papel.";
  if (papel === 0) return "Você lê na tela, e só na tela.";
  return papel >= tela
    ? `Você lê mais em papel: ${papel} contra ${tela}.`
    : `Você lê mais na tela: ${tela} contra ${papel}.`;
}

/** "Seus livros esperam, em média, oito meses." Nunca um dígito solto e frio. */

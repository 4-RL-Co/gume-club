import Link from "next/link";
import { getViewer, getUser } from "@/lib/viewer";
import {
  getStats, getCommunity, resumo, MINIMO_PARA_FALAR, MINIMO_DA_COMUNIDADE,
  type Slice, type Stats, type Community, type Extremo,
} from "@/lib/stats";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { ShelfTabs } from "@/components/shelf-tabs";

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
      <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
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
      <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
        <ScreenHeader title={<>O seu <em className="italic text-[var(--color-ink-soft)]">gosto</em>.</>} />
        <ShelfTabs active="estatisticas" />
        <Empty>
          A estante está vazia. Termine um livro, e esta tela começa a falar sobre você.
        </Empty>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
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
                  : "text-[var(--color-ink-soft)] hover:bg-white/[0.03] hover:text-[var(--color-ink)]",
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

          {/* Ter e ler são coisas diferentes, e essa é a tensão que define o app. */}
          <span>
            de <span className="tabular text-[var(--color-ink)]">{s.shelf}</span> na estante
          </span>
        </div>
      </section>

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

        {/* ══ 3. A GRADE ════════════════════════════════════════════════ */}
        <div className="grid gap-4 sm:grid-cols-2">
          {s.nationalities.length > 0 && (
            <Card titulo="de onde vêm os seus autores" frase={fraseNacoes(s.nationalities)}>
              <Barras dados={s.nationalities} />
            </Card>
          )}

          {s.publishers.length > 0 && (
            <Card titulo="quem publica o que você lê" frase={fraseEditoras(s.publishers)}>
              <Barras dados={s.publishers} />
            </Card>
          )}

          {/* Ninguém tem esse dado. É o mais bonito da página. */}
          {s.origins.length > 0 && (
            <Card titulo="de onde vieram os seus livros" frase={fraseOrigens(s.origins)}>
              <Barras dados={s.origins} />
            </Card>
          )}

          {s.formats.length > 0 && (
            <Card titulo="papel ou tela" frase={fraseFormato(s.formats)}>
              <Barras dados={s.formats} />
            </Card>
          )}

          {/* O card "as suas pontas" morava aqui, e saiu: as duas pontas agora são a
              manchete do card da distância, com nome e link. Mostrar os mesmos dois
              livros de novo, três dedos abaixo, não é reforço: é eco. */}

          {s.reread.length > 0 && (
            <Card
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
          )}

          {/* Sem julgamento, e sem "taxa de conclusão". É um fato sobre o seu ano. */}
          {s.abandoned > 0 && (
            <Card titulo="o que você largou">
              <p className="voice text-[24px] leading-snug">
                {s.abandoned === 1
                  ? "Um livro você deixou pelo caminho."
                  : `${s.abandoned} livros você deixou pelo caminho.`}
              </p>
              <p className="mt-5 text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                Largar um livro é uma escolha, e ela diz tanto sobre você quanto terminar.
              </p>
            </Card>
          )}

          {s.patienceMonths !== null && (
            <Card titulo="a paciência" frase={espera(s.patienceMonths)}>
              <p className="text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                É o tempo entre o livro chegar na estante e você abrir ele.
              </p>
            </Card>
          )}
        </div>

        {/* ══ 4. A COMUNIDADE ═══════════════════════════════════════════
            E aqui está a linha que NÃO se cruza: a estatística da comunidade
            fala de GOSTO, e nunca de VOLUME. Nenhum número de livros lidos por
            outra pessoa aparece aqui. Nenhuma média, nenhum percentil, nenhuma
            posição. Comparar gosto é o produto; comparar esforço é o veneno. */}
        <Comunidade c={c} s={s} />
      </div>
    </main>
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
              <Barras dados={c.publishers} />
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
  return (
    <section className="surface flex flex-col p-7 sm:p-8">
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
 *  OS GRÁFICOS. Uma linguagem só, e ela é MONOCROMÁTICA.
 *
 *  A única coisa colorida no Gume é a capa de um livro. O acento saiu
 *  daqui: ele era a única cor da tela e não pertencia a lugar nenhum do
 *  sistema, e uma barra colorida ao lado de uma parede de capas rouba
 *  exatamente a atenção que é da capa.
 *
 *  O contraste não vem de cor: vem da ARESTA SUPERIOR ACESA. A barra é
 *  um volume de luz baixa (14%) com um filete de 1px a 100% no topo. E
 *  isso é a marca: o fio é onde a luz bate. A mesma ideia que desenha o
 *  símbolo desenha o gráfico. Ver .barra em globals.css.
 *
 *  Duas orientações, um material só. A COLUNA quando o eixo é o tempo (o
 *  olho lê da esquerda para a direita e vê a leitura andando pelos
 *  séculos). A LINHA quando o rótulo é uma palavra que precisa caber
 *  ("Companhia das Letras", "presente da minha irmã"): em coluna, esse
 *  rótulo teria que ser girado ou cortado, e um rótulo girado é um
 *  gráfico pedindo desculpa.
 * ════════════════════════════════════════════════════════════════════
 */

/** A altura do gráfico é FIXA, e as barras escalam dentro dela. */
const ALTURA = 132;

/**
 * O MATERIAL DA BARRA, e ele vai no estilo inline.
 *
 * Um volume de luz baixa (14%) com a ARESTA SUPERIOR ACESA (1px a 100%). O topo
 * aceso é o que dá borda, contraste e vida a um gráfico sem cor, e ele É A MARCA:
 * o fio é onde a luz bate.
 *
 * Inline, e não numa classe, porque uma classe pode não chegar: em desenvolvimento
 * o Next injeta o CSS por JavaScript, e este gráfico já apareceu VAZIO por causa
 * disso, com as barras no HTML e invisíveis na tela. Um gráfico é conteúdo, e
 * conteúdo não pode depender de uma folha de estilo chegar.
 *
 * A luz vem de `--barra-luz`, que o hover do item muda. É assim que o hover
 * funciona sem precisar ganhar do inline, o que ele nunca ganharia.
 */
function material(zero: boolean): React.CSSProperties {
  return {
    // Valor zero: SÓ o filete, sem preenchimento. A barra existe, e é honesta:
    // sumir com a categoria que deu zero é a mentira mais fácil de um gráfico.
    background: zero
      ? "transparent"
      : "color-mix(in srgb, var(--color-ink) var(--barra-luz, 14%), transparent)",
    borderTop: "1px solid var(--color-ink)",
    transition: "background 160ms ease",
  };
}

/** Os séculos. O tempo é um eixo, então ele deita. */
function Seculos({ dados }: { dados: { century: number; label: string; n: number }[] }) {
  const maior = Math.max(...dados.map((d) => d.n), 1);

  return (
    <ul className="flex items-end gap-2 sm:gap-3">
      {dados.map((d) => (
        <li key={d.century} className="barra-item flex min-w-0 flex-1 flex-col items-center">
          {/* A área do gráfico: altura FIXA, e a coluna cresce de baixo para cima.
              A linha de base é a borda INFERIOR desta área, e não uma linha solta:
              assim ela nunca sai do lugar quando a coluna muda de altura. */}
          <span
            className="flex w-full flex-col justify-end border-b border-[var(--color-rule)]"
            style={{ height: ALTURA + 26 }}
          >
            {/* O número é REFERÊNCIA, e não manchete: pequeno e fraco. */}
            <span className="tabular mb-2 shrink-0 text-center text-[11px] text-[var(--color-ink-faint)]">
              {d.n}
            </span>

            {/* Largura ≈ 60% do passo: o respiro entre as colunas é o que faz o olho
                ler uma série, e não uma parede. `shrink-0` para o flex nunca comer a
                altura que a gente calculou. */}
            <span
              className="mx-auto block shrink-0"
              style={{
                // A largura também é inline, e pelo mesmo motivo do material: se a
                // classe não chegar, a coluna vira um bloco de largura inteira e o
                // respiro entre as colunas (que é o que faz o olho ler uma série)
                // desaparece.
                width: "60%",
                height: Math.round((d.n / maior) * ALTURA),
                ...material(d.n === 0),
              }}
            />
          </span>

          <span className="mt-3 w-full truncate text-center text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {d.label.replace("século ", "")}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Uma barra por linha, para quando o rótulo é uma palavra.
 *
 * Sem pizza, sem donut, sem legenda: a barra é a única forma em que o olho compara
 * tamanhos sem errar, e o rótulo fica do lado do dado, em vez de numa legenda que
 * obriga a ir e voltar.
 */
function Barras({ dados }: { dados: Slice[] }) {
  const maior = Math.max(...dados.map((d) => d.n), 1);

  return (
    <ul className="flex flex-col gap-3.5">
      {dados.map((d) => (
        <li key={d.label} className="barra-item flex items-center gap-4">
          <span className="w-32 shrink-0 truncate text-[13px] text-[var(--color-ink-soft)]">
            {d.label}
          </span>

          <span className="flex min-w-0 flex-1 items-center">
            <span
              className="block h-2 shrink-0"
              style={{
                width: `${Math.max((d.n / maior) * 100, 1.5)}%`,
                ...material(d.n === 0),
              }}
            />
          </span>

          <span className="tabular w-6 shrink-0 text-right text-[12px] text-[var(--color-ink-faint)]">
            {d.n}
          </span>
        </li>
      ))}
    </ul>
  );
}

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
function espera(meses: number): string {
  if (meses < 1) {
    const dias = Math.round(meses * 30.44);
    return `Seus livros esperam ${dias} ${dias === 1 ? "dia" : "dias"} antes de você abrir.`;
  }
  if (meses < 18) {
    const m = Math.round(meses);
    return `Seus livros esperam ${m} ${m === 1 ? "mês" : "meses"} antes de você abrir.`;
  }
  const anos = (meses / 12).toFixed(1).replace(".", ",");
  return `Seus livros esperam ${anos} anos antes de você abrir.`;
}

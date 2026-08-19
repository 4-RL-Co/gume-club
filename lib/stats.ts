import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { visibleTo, type Viewer } from "@/lib/authz";
import { libraryEntries } from "@/lib/db/schema";

/**
 * Server only. As estatísticas.
 *
 * ══════════════════════════════════════════════════════════════════════
 *  ESTA PÁGINA NÃO DIZ QUANTO VOCÊ LEU. ELA DIZ QUEM VOCÊ É.
 *
 *  É curadoria, e não desempenho. Ranking, percentil, posição, meta, ofensiva,
 *  velocidade, ritmo — nada disso mede quem você é, mede quanto você produziu, e
 *  produção vira cobrança. Essa linha continua de pé, sem exceção. Ver a seção
 *  seguinte, sobre a comunidade, que é onde ela mais importa.
 *
 *  ═══ PÁGINA LIDA ESTAVA NESSA LISTA, E SAIU DELA ═══
 *
 *  Até 2026-07-12 esta seção dizia, com essas palavras: "FORA, e não volta:
 *  página lida, meta, velocidade, ritmo, e qualquer número que meça produção."
 *  O motivo era real — meta vira cobrança — mas a frase juntou duas coisas que
 *  não são a mesma: RITMO (quão rápido, quão seguido — isso É cobrança) e VOLUME
 *  (quanto, na vida inteira — que é exatamente o que "livros lidos" já mede, ao
 *  lado, na mesma tela, sem que ninguém achasse isso opressivo).
 *
 *  O dono, direto: "imagina que eu estou lendo o Conde de Monte Cristo, levo
 *  meses pra terminar e não sinto que avancei — número de livros só beneficia
 *  volume de LIVROS; se eu quiser ler um livro longo, eu não sinto [orgulho de
 *  ter avançado]." Um livro de 1200 páginas conta "1", igual a uma novela de
 *  150 — a mesma injustiça que a escada de honra já tinha resolvido para
 *  mangá-vs-romance (ver lib/honras.ts) continuava aqui, ao contrário.
 *
 *  Página lida volta, e só ela: contada a partir de livros TERMINADOS, nunca de
 *  progresso dentro de uma leitura em curso (isso segue banido — ver
 *  lib/db/schema.ts). Meta, ofensiva, velocidade e ritmo continuam de fora, e
 *  continuam banidos para sempre. Ver ai/DECISIONS.md.
 *
 *  ═══ A COMUNIDADE, E A LINHA QUE NÃO SE CRUZA ═══
 *
 *  "Estatística da comunidade compara gostos, nunca desempenho. Média de
 *  livros lidos é o número que este app existe para não ter."
 *
 *  PODE: quantos países a comunidade lê, e quantos você leu. A idade das
 *  obras dela contra a das suas. As editoras mais presentes. A obra mais
 *  antiga que alguém leu. "3 pessoas leram Grande Sertão este ano."
 *
 *  NUNCA: média de livros lidos. Percentil. Posição. Ranking. Qualquer
 *  número seu ao lado do de outra pessoa PARA COMPARAR ESFORÇO. Comparar
 *  gosto é o produto; comparar esforço é o veneno. Ver ai/DECISIONS.md.
 *
 *  ═══ MEDIANA, NUNCA MÉDIA, PARA A IDADE DAS OBRAS ═══
 *
 *  Medido na estante real: a média dá 267 anos e a mediana dá 22. A
 *  diferença é UM Sun Tzu de 2.427 anos puxando a média sozinho. A média
 *  diria "você lê livros de 267 anos" a quem lê contemporâneo com alguns
 *  clássicos fundos. Numa página que promete dizer quem você é, uma
 *  estatística torta por um único ponto diz quem você NÃO é.
 * ══════════════════════════════════════════════════════════════════════
 */

export type Slice = { label: string; n: number };

/** Uma obra, com o ano em que foi escrita. Para as pontas: a mais antiga e a mais nova. */
export type Extremo = { slug: string; title: string; author: string | null; year: number };

export type Stats = {
  /** Quantos livros você terminou. É a única contagem, e ela não é meta de nada. */
  books: number;
  /** Volumes e séries contam SEPARADO: ler trinta volumes de Vagabond não é ler trinta livros. */
  volumes: number;
  series: number;
  /** Quantos livros existem na estante. Ter e ler são coisas diferentes, e essa é a tensão. */
  shelf: number;

  /**
   * Páginas de livros TERMINADOS. `null` quando NENHUMA edição do que você
   * terminou tem página cadastrada — "sem contagem" não é "zero": um zero se lê
   * como fato, e aqui seria mentira. Ver o cabeçalho deste arquivo.
   */
  pages: number | null;

  /**
   * A DISTÂNCIA. O coração da página, e a estatística que nenhum outro app tem,
   * porque nenhum outro separa o ano da OBRA do ano da EDIÇÃO.
   */
  age: {
    /** A MEDIANA da idade das obras que você leu. Nunca a média: ver o cabeçalho. */
    median: number;
    /** O intervalo: da obra mais antiga à mais nova, em ANO, não em idade. */
    from: number;
    to: number;
    /** A metade: metade das obras que você leu foi escrita antes deste ano. */
    midpoint: number;
  } | null;

  centuries: { century: number; label: string; n: number }[];
  nationalities: Slice[];
  /** Os gêneros mais lidos. Livro sem gênero cadastrado não entra — nunca um "outros". */
  genres: Slice[];
  publishers: Slice[];
  /** De onde vieram: sebo, feira, presente, herança. Nas palavras do leitor. */
  origins: Slice[];
  /** Físico ou digital. */
  formats: Slice[];

  /**
   * O QUE VOCÊ ACHOU: quantos livros ganharam cada palavra, do "adorei" ao
   * "detestei". São os cinco degraus SEMPRE, com os zeros dentro: sumir com a
   * palavra que ninguém usou é a mentira mais fácil de um gráfico. É contagem
   * por palavra, e nunca média: palavra não soma. Ver lib/veredito.ts.
   */
  verdicts: { value: number; n: number }[];

  /** As pontas da sua leitura. */
  oldest: Extremo | null;
  newest: Extremo | null;

  /** Quem você releu. Reler é escolha, e escolha é gosto. */
  reread: { slug: string; title: string; author: string | null; times: number }[];
  /** Abandonados. Sem julgamento, sem "taxa de conclusão": é um fato sobre o seu ano. */
  abandoned: number;

  /** A PACIÊNCIA: quanto tempo um livro espera na estante antes de ser lido. */
  patienceMonths: number | null;

  /** Só os anos que têm alguma leitura terminada. Ano vazio não é oferecido. */
  years: number[];
};

/**
 * A COMUNIDADE. Só gosto, e nunca esforço.
 *
 * Note o que NÃO está aqui, e nunca vai estar: nenhuma contagem de livros lidos
 * por outra pessoa, nem média, nem posição. O que se compara é o QUE se lê.
 */
export type Community = {
  /**
   * QUANTOS OUTROS leitores alimentam estes números. Você NÃO está aqui dentro.
   *
   * Existe para a página saber quando CALAR A BOCA. Com pouca gente, "a comunidade"
   * é você mesmo: o agregado devolve o seu próprio número, e a tela vira uma frase
   * que se congratula sozinha ("a comunidade lê autores de 4 países. Você leu de 4").
   * Isso não é uma coincidência infeliz: é uma TAUTOLOGIA, e ela desmoraliza a tela.
   */
  leitores: number;
  /** Quantos países OS OUTROS leem. Comparado com quantos você leu: é lente, não placar. */
  countries: number;
  myCountries: number;
  /**
   * Quantos países você leu que MAIS NINGUÉM aqui leu.
   *
   * É a única comparação de país que nunca fica chata: "os outros leem de 4 países,
   * você leu de 4" é um fato morto, mesmo quando é verdade. "Dois deles ninguém
   * mais leu" diz uma coisa sobre VOCÊ, que é o que esta página promete.
   *
   * E note o que ela NÃO é: não é um ponto, não é um mérito, não é raridade
   * premiada. É um fato sobre o seu gosto, e ele pode ser zero sem que isso seja
   * uma falta.
   */
  myOnly: number;
  /** A idade mediana das obras da comunidade, contra a sua. Gosto contra gosto. */
  medianAge: number | null;
  /** As editoras mais presentes nas estantes de todo mundo. */
  publishers: Slice[];
  /** A obra mais antiga que alguém por aqui leu. */
  oldest: Extremo | null;
  /** "3 pessoas leram Grande Sertão este ano." Fato, e nunca ranking. */
  together: { slug: string; title: string; author: string | null; people: number }[];
};

/**
 * Terminado no ano civil que o leitor escolheu. `null` é a vida inteira.
 *
 * ═══ NA VIDA INTEIRA, O STATUS TAMBÉM CONTA — NÃO SÓ A LEITURA COM DATA ═══
 *
 * "A quantidade de páginas no meu perfil e nas minhas estatísticas não está
 * batendo." A honra (lib/escada.ts) sempre contou por `status = 'read'` da
 * estante; esta tela sempre contou só por uma `readings` com `finished_on`.
 * As duas eram fatos diferentes disfarçados do mesmo nome, e ficaram
 * invisíveis até página virar um NÚMERO que dá pra comparar lado a lado.
 *
 * A causa real: um lote de import (Goodreads, entre outros) grava o status
 * "lido" vindo da prateleira de origem mesmo quando o arquivo não tinha data
 * de término — e insere uma `readings` vazia (as três datas nulas) em vez de
 * nenhuma. `status = 'read'` sabe que o livro foi lido; só não sabe QUANDO.
 *
 * Por ANO isso não muda: sem data não há como dizer "terminado em 2019", e
 * inventar uma mentiria. Mas "vida inteira" não pergunta quando — só se
 * aconteceu — e aí `status = 'read'` já é resposta suficiente, a mesma que a
 * honra sempre aceitou. Ver ai/DECISIONS.md.
 */
function finished(year: number | null) {
  return year === null
    ? sql`(
        ${libraryEntries.status} = 'read'
        or exists (select 1 from readings r
                   where r.entry_id = ${libraryEntries.id} and r.finished_on is not null)
      )`
    : sql`exists (select 1 from readings r
                  where r.entry_id = ${libraryEntries.id}
                    and r.finished_on is not null
                    and extract(year from r.finished_on) = ${year})`;
}

export async function getStats(
  viewer: Viewer,
  ownerId: string,
  year: number | null,
): Promise<Stats> {
  const mine = and(
    eq(libraryEntries.userId, ownerId),
    visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility),
  );

  /** A edição que É a sua: a que você escolheu, senão a que você tem, senão a primeira. */
  const edition = sql`(
    select e.id from editions e
    where e.id = coalesce(
      ${libraryEntries.editionId},
      (select oc.edition_id from owned_copies oc
       where oc.work_id = ${libraryEntries.workId} and oc.user_id = ${libraryEntries.userId}),
      (select e2.id from editions e2 where e2.work_id = ${libraryEntries.workId}
       order by e2.created_at asc, e2.id asc limit 1)
    )
  )`;

  const visible = visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility);

  /**
   * Livros, volumes e séries, contados SEPARADO.
   *
   * Ler trinta volumes de Vagabond não é ler trinta livros, e uma estatística que
   * finge o contrário é uma estatística em que ninguém confia, a começar pelo dono
   * dela. Um livro solto conta como livro; um volume de série conta como volume.
   */
  const [counted] = await db.execute<{ books: number; volumes: number; series: number }>(sql`
    select
      count(*) filter (where w.series_id is null)::int                as books,
      count(*) filter (where w.series_id is not null)::int            as volumes,
      count(distinct w.series_id)::int                                as series
    from library_entries
    join works w on w.id = library_entries.work_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and ${finished(year)}`);

  /**
   * PÁGINAS DE LIVROS TERMINADOS. A mesma edição resolvida de sempre (`edition`,
   * acima), somada — e a soma ignora, sozinha, quem não tem página cadastrada
   * (`sum` do SQL pula null). O que ela NÃO faz sozinha é distinguir "ninguém
   * tinha página" de "zero páginas": por isso `comPagina` conta separado, e
   * `pages` só vira número quando pelo menos uma edição respondeu. Ver o
   * cabeçalho deste arquivo.
   */
  const [paginas] = await db.execute<{ soma: number; comPagina: number }>(sql`
    select
      coalesce(sum(e.page_count), 0)::int             as soma,
      count(*) filter (where e.page_count is not null)::int as "comPagina"
    from library_entries
    join works w on w.id = library_entries.work_id
    left join editions e on e.id = ${edition}
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and ${finished(year)}`);

  const [shelfTotal] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(libraryEntries)
    .where(mine);

  /**
   * A DISTÂNCIA. Mediana, e as duas pontas.
   *
   * `percentile_cont` sobre a IDADE (hoje menos o ano da obra). O midpoint é o ano
   * abaixo do qual está metade das obras: é o que a frase da tela diz de verdade,
   * "metade delas antes de 1950".
   */
  const [age] = await db.execute<{
    median: number | null; from: number | null; to: number | null; midpoint: number | null;
  }>(sql`
    select
      percentile_cont(0.5) within group (
        order by extract(year from current_date) - w.first_published)::int as median,
      min(w.first_published)::int as from,
      max(w.first_published)::int as to,
      percentile_cont(0.5) within group (order by w.first_published)::int  as midpoint
    from library_entries
    join works w on w.id = library_entries.work_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and w.first_published is not null
      and ${finished(year)}`);

  const centuries = await db.execute<{ century: number; n: number }>(sql`
    select
      case when w.first_published > 0
           then ceil(w.first_published / 100.0)::int
           else -ceil(abs(w.first_published) / 100.0)::int
      end as century,
      count(*)::int as n
    from library_entries
    join works w on w.id = library_entries.work_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and w.first_published is not null
      and ${finished(year)}
    group by 1
    order by 1 asc`);

  const nat = await db.execute<{ label: string; n: number }>(sql`
    select a.nationality as label, count(*)::int as n
    from library_entries
    join works w on w.id = library_entries.work_id
    join authors a on a.id = w.author_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and a.nationality is not null
      and ${finished(year)}
    group by a.nationality
    order by n desc, label asc`);

  const publishers = await db.execute<{ label: string; n: number }>(sql`
    select e.publisher as label, count(*)::int as n
    from library_entries
    join editions e on e.id = ${edition}
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and e.publisher is not null
      and ${finished(year)}
    group by e.publisher
    order by n desc, label asc
    limit 12`);

  const genres = await db.execute<{ label: string; n: number }>(sql`
    select w.genre as label, count(*)::int as n
    from library_entries
    join works w on w.id = library_entries.work_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and w.genre is not null
      and ${finished(year)}
    group by w.genre
    order by n desc, label asc
    limit 8`);

  // Procedência é texto livre. A gente agrupa por texto normalizado e mostra o que
  // a pessoa escreveu. Nunca uma categoria que a gente inventou por ela.
  const origins = await db.execute<{ label: string; n: number }>(sql`
    select min(oc.acquired_note) as label, count(*)::int as n
    from library_entries
    join owned_copies oc
      on oc.work_id = library_entries.work_id and oc.user_id = library_entries.user_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and coalesce(trim(oc.acquired_note), '') <> ''
    group by lower(trim(oc.acquired_note))
    order by n desc, label asc
    limit 12`);

  /** Físico ou digital. O ebook e o audiolivro são digitais; o resto é papel na mão. */
  const formats = await db.execute<{ label: string; n: number }>(sql`
    select case when e.format in ('ebook', 'audiobook') then 'digital' else 'físico' end as label,
           count(*)::int as n
    from library_entries
    join editions e on e.id = ${edition}
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and ${finished(year)}
    group by 1
    order by n desc`);

  /**
   * A palavra de cada livro. No recorte de um ano, contam os livros TERMINADOS
   * naquele ano (a palavra é a de hoje: nota substituída é nota substituída).
   * Na vida inteira, conta todo livro julgado, terminado ou não: um "detestei"
   * num livro largado é um julgamento inteiro, e ele aparece.
   */
  const verdicts = await db.execute<{ value: number; n: number }>(sql`
    select rt.value::int as value, count(*)::int as n
    from library_entries
    join ratings rt
      on rt.work_id = library_entries.work_id and rt.user_id = library_entries.user_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and ${year === null ? sql`true` : finished(year)}
    group by rt.value`);

  const pontas = await db.execute<{
    slug: string; title: string; author: string | null; year: number; ponta: string;
  }>(sql`
    (select w.slug, w.title, a.name as author, w.first_published::int as year, 'antiga' as ponta
       from library_entries
       join works w on w.id = library_entries.work_id
       left join authors a on a.id = w.author_id
      where library_entries.user_id = ${ownerId}::uuid
        and ${visible} and w.first_published is not null and ${finished(year)}
      order by w.first_published asc limit 1)
    union all
    (select w.slug, w.title, a.name as author, w.first_published::int as year, 'nova' as ponta
       from library_entries
       join works w on w.id = library_entries.work_id
       left join authors a on a.id = w.author_id
      where library_entries.user_id = ${ownerId}::uuid
        and ${visible} and w.first_published is not null and ${finished(year)}
      order by w.first_published desc limit 1)`);

  /** Reler é escolha, e escolha é gosto. Duas leituras terminadas da mesma obra. */
  const reread = await db.execute<{
    slug: string; title: string; author: string | null; times: number;
  }>(sql`
    select w.slug, w.title, a.name as author, count(*)::int as times
    from library_entries
    join readings r on r.entry_id = library_entries.id
    join works w on w.id = library_entries.work_id
    left join authors a on a.id = w.author_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and r.finished_on is not null
    group by w.slug, w.title, a.name
    having count(*) > 1
    order by count(*) desc, w.title asc
    limit 6`);

  const [abandoned] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n
    from library_entries
    join readings r on r.entry_id = library_entries.id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and r.abandoned_on is not null
      ${year === null ? sql`` : sql`and extract(year from r.abandoned_on) = ${year}`}`);

  /**
   * A PACIÊNCIA. Quanto tempo um livro fica na estante antes de ser lido.
   * Não é cobrança: é autoconhecimento. Ninguém mais mede isso porque ninguém mais
   * guarda quando o livro entrou E quando ele foi terminado.
   *
   * ═══ QUEM MARCOU SÓ O ANO NÃO ENTRA NESTA CONTA ═══
   *
   * Esta é a ÚNICA estatística que faz conta com DIA, e é por isso que a precisão
   * existe. Quem marcou "li em 2019" tem 1º de janeiro no banco, e esse dia é um lugar
   * de pousar, não uma afirmação: usá-lo aqui inventaria uma espera de meses que
   * ninguém viveu. Então a leitura marcada só com o ano fica de fora, e a conta
   * continua dizendo a verdade sobre as que sobraram. Ver a migration 0051.
   */
  const [patience] = await db.execute<{ days: number | null }>(sql`
    select avg(r.finished_on - library_entries.added_at::date)::float as days
    from library_entries
    join readings r on r.entry_id = library_entries.id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and r.finished_on is not null
      and r.ended_precision = 'day'
      and r.finished_on >= library_entries.added_at::date
      ${year === null ? sql`` : sql`and extract(year from r.finished_on) = ${year}`}`);

  const years = await db.execute<{ year: number }>(sql`
    select distinct extract(year from r.finished_on)::int as year
    from library_entries
    join readings r on r.entry_id = library_entries.id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and r.finished_on is not null
    order by year desc`);

  const ponta = (qual: string): Extremo | null => {
    const r = pontas.find((p) => p.ponta === qual);
    return r ? { slug: r.slug, title: r.title, author: r.author, year: r.year } : null;
  };

  return {
    books: counted?.books ?? 0,
    volumes: counted?.volumes ?? 0,
    series: counted?.series ?? 0,
    shelf: shelfTotal?.n ?? 0,
    pages: paginas && paginas.comPagina > 0 ? paginas.soma : null,
    age:
      age?.median != null && age.from != null && age.to != null && age.midpoint != null
        ? { median: age.median, from: age.from, to: age.to, midpoint: age.midpoint }
        : null,
    centuries: centuries.map((r) => ({
      century: r.century,
      label: centuryLabel(r.century),
      n: r.n,
    })),
    nationalities: nat.map((r) => ({ label: r.label, n: r.n })),
    genres: genres.map((r) => ({ label: r.label, n: r.n })),
    publishers: publishers.map((r) => ({ label: r.label, n: r.n })),
    origins: origins.map((r) => ({ label: r.label, n: r.n })),
    formats: formats.map((r) => ({ label: r.label, n: r.n })),
    // Do "adorei" para baixo, e os cinco degraus sempre: o zero aparece.
    verdicts: [5, 4, 3, 2, 1].map((value) => ({
      value,
      n: verdicts.find((r) => r.value === value)?.n ?? 0,
    })),
    oldest: ponta("antiga"),
    newest: ponta("nova"),
    reread: reread.map((r) => ({ slug: r.slug, title: r.title, author: r.author, times: r.times })),
    abandoned: abandoned?.n ?? 0,
    patienceMonths: patience?.days ? patience.days / 30.44 : null,
    years: years.map((r) => r.year),
  };
}

export type ResumoDoPerfil = {
  /** Os cinco degraus SEMPRE, com os zeros dentro. Vida inteira. Ver Stats.verdicts. */
  verdicts: { value: number; n: number }[];
  /** Os gêneros mais lidos, vida inteira. Ver Stats.genres. */
  genres: Slice[];
  /** De onde vêm os autores, vida inteira. Ver Stats.nationalities. */
  nationalities: Slice[];
  /** Papel ou tela, vida inteira. Ver Stats.formats. */
  formats: Slice[];
  /** Os autores mais lidos, vida inteira. */
  authors: Slice[];
  /** Quem publica o que você lê, vida inteira. Ver Stats.publishers. */
  publishers: Slice[];
  /** Século da obra, vida inteira. Ver Stats.centuries. */
  centuries: { century: number; label: string; n: number }[];
  /** O ano corrente: livros terminados e páginas. `null` de página é "sem contagem". */
  anoCorrente: { ano: number; livros: number; paginas: number | null };
};

/**
 * A VERSÃO LEVE, pro PERFIL — inspirada no destaque do yourgamerprofile.com,
 * traduzido pelas regras de sempre: sem contador de seguidores, sem mapa de
 * atividade tipo streak (README, "o que não vai ser"), e o veredito continua
 * sem nenhum dígito de MÉDIA (só contagem por palavra — lib/veredito.ts).
 *
 * getStats() já calcula tudo isto e mais uma dúzia de coisas — pesado demais
 * pra rodar (duas vezes, vida inteira + ano) numa página vista bem mais que
 * /estatisticas. Esta função calcula só o que os cartões do perfil precisam.
 *
 * ═══ ISTO É PÚBLICO, E A ESCOLHA DO QUE ENTRA FOI DELIBERADA ═══
 *
 * /estatisticas continua estritamente sua ("não existe 'ver as estatísticas
 * de um estranho'") — ela fala em segunda pessoa, e tem números íntimos
 * demais para um estranho ver (quantos livros esperam na estante, a
 * paciência). Este resumo é outra coisa: um recorte pequeno e seguro,
 * pensado desde sempre para quem VISITA. Veredito, gêneros, nacionalidade,
 * autor, editora, século e formato entram porque são gosto, não volume nem
 * posse — a mesma linha que já separa "e a comunidade" (gosto) do resto de
 * /estatisticas (números).
 */
export async function getResumoDoPerfil(viewer: Viewer, ownerId: string): Promise<ResumoDoPerfil> {
  const visible = and(
    eq(libraryEntries.userId, ownerId),
    visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility),
  );

  /** A edição que É a sua — mesma régua de getStats(). */
  const edition = sql`(
    select e.id from editions e
    where e.id = coalesce(
      ${libraryEntries.editionId},
      (select oc.edition_id from owned_copies oc
       where oc.work_id = ${libraryEntries.workId} and oc.user_id = ${libraryEntries.userId}),
      (select e2.id from editions e2 where e2.work_id = ${libraryEntries.workId}
       order by e2.created_at asc, e2.id asc limit 1)
    )
  )`;

  const verdicts = await db.execute<{ value: number; n: number }>(sql`
    select rt.value::int as value, count(*)::int as n
    from library_entries
    join ratings rt
      on rt.work_id = library_entries.work_id and rt.user_id = library_entries.user_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
    group by rt.value`);

  const genres = await db.execute<{ label: string; n: number }>(sql`
    select w.genre as label, count(*)::int as n
    from library_entries
    join works w on w.id = library_entries.work_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and w.genre is not null
      and ${finished(null)}
    group by w.genre
    order by n desc, label asc
    limit 8`);

  /**
   * "Abrir /estatisticas pra visitantes — um recorte curador": veredito, gêneros,
   * países e formatos são seguros de mostrar a um estranho (o mesmo dado que
   * getStats() já calcula, sem o que é íntimo demais — quantos livros na estante,
   * a paciência). Nacionalidade e formato ficam LIFETIME, mesma régua de genres
   * acima, e não presas ao ano corrente.
   */
  const nationalities = await db.execute<{ label: string; n: number }>(sql`
    select a.nationality as label, count(*)::int as n
    from library_entries
    join works w on w.id = library_entries.work_id
    join authors a on a.id = w.author_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and a.nationality is not null
      and ${finished(null)}
    group by a.nationality
    order by n desc, label asc`);

  /**
   * "no perfil os stats... ainda falta coisa: autores mais lidos, editoras,
   * século/década" — o dono. Mesmas régua e limites de getStats().
   */
  const authors = await db.execute<{ label: string; n: number }>(sql`
    select a.name as label, count(*)::int as n
    from library_entries
    join works w on w.id = library_entries.work_id
    join authors a on a.id = w.author_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and ${finished(null)}
    group by a.name
    order by n desc, label asc
    limit 8`);

  const publishers = await db.execute<{ label: string; n: number }>(sql`
    select e.publisher as label, count(*)::int as n
    from library_entries
    join editions e on e.id = ${edition}
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and e.publisher is not null
      and ${finished(null)}
    group by e.publisher
    order by n desc, label asc
    limit 12`);

  const centuries = await db.execute<{ century: number; n: number }>(sql`
    select
      case when w.first_published > 0
           then ceil(w.first_published / 100.0)::int
           else -ceil(abs(w.first_published) / 100.0)::int
      end as century,
      count(*)::int as n
    from library_entries
    join works w on w.id = library_entries.work_id
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and w.first_published is not null
      and ${finished(null)}
    group by 1
    order by 1 asc`);

  const formats = await db.execute<{ label: string; n: number }>(sql`
    select case when e.format in ('ebook', 'audiobook') then 'digital' else 'físico' end as label,
           count(*)::int as n
    from library_entries
    join editions e on e.id = ${edition}
    where library_entries.user_id = ${ownerId}::uuid
      and ${visible}
      and ${finished(null)}
    group by 1
    order by n desc`);

  const ano = new Date().getFullYear();
  const [doAno] = await db.execute<{ livros: number; soma: number | null; com_pagina: number }>(sql`
    select count(*)::int as livros,
           sum(e.page_count)::int as soma,
           count(e.page_count)::int as com_pagina
      from library_entries
      join readings r on r.entry_id = library_entries.id
      left join editions e on e.id = coalesce(
        library_entries.edition_id,
        (select oc.edition_id from owned_copies oc
          where oc.work_id = library_entries.work_id and oc.user_id = library_entries.user_id),
        (select e2.id from editions e2 where e2.work_id = library_entries.work_id
          order by e2.created_at asc, e2.id asc limit 1))
     where library_entries.user_id = ${ownerId}::uuid
       and ${visible}
       and r.finished_on is not null
       and extract(year from r.finished_on) = ${ano}`);

  return {
    verdicts: [5, 4, 3, 2, 1].map((value) => ({
      value,
      n: verdicts.find((r) => r.value === value)?.n ?? 0,
    })),
    genres: genres.map((r) => ({ label: r.label, n: r.n })),
    nationalities: nationalities.map((r) => ({ label: r.label, n: r.n })),
    formats: formats.map((r) => ({ label: r.label, n: r.n })),
    authors: authors.map((r) => ({ label: r.label, n: r.n })),
    publishers: publishers.map((r) => ({ label: r.label, n: r.n })),
    centuries: centuries.map((r) => ({ century: r.century, label: centuryLabel(r.century), n: r.n })),
    anoCorrente: {
      ano,
      livros: doAno?.livros ?? 0,
      paginas: doAno && doAno.com_pagina > 0 ? doAno.soma : null,
    },
  };
}

/**
 * A COMUNIDADE. Gosto contra gosto, e nada mais.
 *
 * Toda leitura aqui atravessa linha de OUTRA pessoa, então toda uma delas passa
 * pelo `visibleTo()`: uma estante privada não entra em agregado nenhum, nem
 * "diluída". Diluir não é anonimizar: com poucos leitores, um agregado de dois é
 * uma janela para a estante do outro.
 */
export async function getCommunity(viewer: Viewer, ownerId: string): Promise<Community> {
  const visible = visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility);

  /**
   * A COMUNIDADE É OS OUTROS, e você não entra na conta dela.
   *
   * Isto já esteve errado, e o erro era visível na tela: o agregado incluía o
   * próprio leitor, e com poucos leitores ele É a comunidade. A tela dizia "a
   * comunidade lê autores de 4 países. Você leu de 4" — não como coincidência, mas
   * como TAUTOLOGIA: ela devolvia o número dele para ele mesmo, com cara de
   * comparação. Uma comparação em que os dois lados são a mesma pessoa não é uma
   * lente, é uma piada.
   */
  const outros = sql`library_entries.user_id <> ${ownerId}::uuid`;

  const [quantos] = await db.execute<{ n: number }>(sql`
    select count(distinct library_entries.user_id)::int as n
      from library_entries
      join readings r on r.entry_id = library_entries.id
     where ${visible} and ${outros} and r.finished_on is not null`);

  const [countries] = await db.execute<{ todos: number; meus: number; so_meus: number }>(sql`
    with lido as (
      select a.nationality as pais, library_entries.user_id as quem
        from library_entries
        join works w on w.id = library_entries.work_id
        join authors a on a.id = w.author_id
        join readings r on r.entry_id = library_entries.id
       where ${visible}
         and a.nationality is not null
         and r.finished_on is not null
    )
    select
      count(distinct pais) filter (where quem <> ${ownerId}::uuid)::int as todos,
      count(distinct pais) filter (where quem = ${ownerId}::uuid)::int  as meus,
      -- Os países que SÓ você leu: os seus, menos os de todo mundo.
      (select count(*)::int from (
         select pais from lido where quem = ${ownerId}::uuid
         except
         select pais from lido where quem <> ${ownerId}::uuid
       ) sozinho) as so_meus
    from lido`);

  const [age] = await db.execute<{ median: number | null }>(sql`
    select percentile_cont(0.5) within group (
             order by extract(year from current_date) - w.first_published)::int as median
    from library_entries
    join works w on w.id = library_entries.work_id
    join readings r on r.entry_id = library_entries.id
    where ${visible} and ${outros}
      and w.first_published is not null
      and r.finished_on is not null`);

  const publishers = await db.execute<{ label: string; n: number }>(sql`
    select e.publisher as label, count(*)::int as n
    from library_entries
    join editions e on e.work_id = library_entries.work_id
    where ${visible} and ${outros}
      and e.publisher is not null
    group by e.publisher
    order by n desc, label asc
    limit 8`);

  const [oldest] = await db.execute<{
    slug: string; title: string; author: string | null; year: number;
  }>(sql`
    select w.slug, w.title, a.name as author, w.first_published::int as year
    from library_entries
    join works w on w.id = library_entries.work_id
    left join authors a on a.id = w.author_id
    join readings r on r.entry_id = library_entries.id
    -- OUTRA pessoa: "a obra mais antiga que alguém por aqui leu" sendo o SEU
    -- próprio livro é a mesma tautologia dos países, com outra roupa.
    where ${visible} and ${outros}
      and w.first_published is not null
      and r.finished_on is not null
    order by w.first_published asc
    limit 1`);

  /**
   * "3 pessoas leram Grande Sertão este ano."
   *
   * É um FATO, e não um ranking: ninguém é primeiro, ninguém está acima de ninguém,
   * e o número é de PESSOAS que leram aquele livro, nunca de livros que uma pessoa
   * leu. A diferença entre as duas frases é a diferença entre este app e o outro.
   */
  const together = await db.execute<{
    slug: string; title: string; author: string | null; people: number;
  }>(sql`
    select w.slug, w.title, a.name as author, count(distinct library_entries.user_id)::int as people
    from library_entries
    join works w on w.id = library_entries.work_id
    left join authors a on a.id = w.author_id
    join readings r on r.entry_id = library_entries.id
    where ${visible}
      and r.finished_on is not null
      and extract(year from r.finished_on) = extract(year from current_date)
    group by w.slug, w.title, a.name
    having count(distinct library_entries.user_id) > 1
    order by count(distinct library_entries.user_id) desc, w.title asc
    limit 5`);

  return {
    leitores: quantos?.n ?? 0,
    countries: countries?.todos ?? 0,
    myCountries: countries?.meus ?? 0,
    myOnly: countries?.so_meus ?? 0,
    medianAge: age?.median ?? null,
    publishers: publishers.map((r) => ({ label: r.label, n: r.n })),
    oldest: oldest ?? null,
    together: together.map((r) => ({
      slug: r.slug, title: r.title, author: r.author, people: r.people,
    })),
  };
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A FRASE-RESUMO. Determinística, e CALADA quando não sabe.
 *
 *  Com menos de 5 livros lidos ela não fala. Não se inventa retrato de
 *  leitor em cima de 3 livros, e um app que arrisca um palpite sobre
 *  quem você é depois de dois livros é um app que você para de levar a
 *  sério no terceiro.
 *
 *  E ela NUNCA é gerada por IA. É uma regra escrita: a mesma entrada
 *  produz sempre a mesma frase, e a frase se explica. Ver o README.
 * ════════════════════════════════════════════════════════════════════
 */
export const MINIMO_PARA_FALAR = 5;

/**
 * E a COMUNIDADE só fala quando existe comunidade.
 *
 * Com menos de três outros leitores, "a comunidade" é um punhado de gente, e um
 * agregado de dois é uma janela para a estante do vizinho, além de ser uma
 * comparação sem sentido. A tela fica calada, e isso é honesto: ela não tem o que
 * dizer ainda.
 */
export const MINIMO_DA_COMUNIDADE = 3;

export function resumo(s: Stats): string | null {
  if (s.books < MINIMO_PARA_FALAR) return null;
  if (!s.age) return null;

  const idade = s.age.median;
  const pais = s.nationalities[0];

  // O eixo do tempo, que é o que esta página descobriu sobre a pessoa.
  const tempo =
    idade >= 100
      ? "Você lê os mortos, e lê fundo."
      : idade >= 40
        ? "Você lê o que já assentou, e não o que acabou de sair."
        : idade >= 15
          ? "Você lê o que é recente, sem correr atrás do lançamento."
          : "Você lê o que está saindo agora.";

  // O eixo do espaço, e só quando ele tem o que dizer.
  const espaco =
    s.nationalities.length >= 4
      ? ` Os seus autores vêm de ${s.nationalities.length} lugares.`
      : pais && pais.n >= Math.ceil(s.books * 0.6)
        ? ` Quase tudo o que você lê é ${pais.label.toLowerCase()}.`
        : "";

  return tempo + espaco;
}

const ROMAN: [number, string][] = [
  [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

/** "século XXI", "século V a.C.". O Sun Tzu sozinho na ponta esquerda. */
export function centuryLabel(century: number): string {
  const n = Math.abs(century);
  let left = n;
  let out = "";
  for (const [v, s] of ROMAN) {
    while (left >= v) {
      out += s;
      left -= v;
    }
  }
  return century < 0 ? `século ${out} a.C.` : `século ${out}`;
}

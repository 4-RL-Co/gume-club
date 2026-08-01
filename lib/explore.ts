import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { visibleTo, type Viewer } from "@/lib/authz";
import { libraryEntries, reviews } from "@/lib/db/schema";

/**
 * ════════════════════════════════════════════════════════════════════
 *  EXPLORAR. Uma livraria de PESSOAS, não um feed de atividade.
 *
 *  Existe para resolver um problema só: quem chega sozinho tem um feed
 *  vazio, e um feed vazio é um quarto escuro. A saída não é encher a
 *  tela com o que estranhos andaram fazendo: é mostrar ESTANTES, para
 *  a pessoa reconhecer um gosto e escolher quem seguir.
 *
 *  ═══ AS REGRAS, e elas não se negociam ═══
 *
 *  ZERO ordenação por engajamento, popularidade ou "em alta". Ou é
 *  cronológico, ou é afinidade de estante, e ponto.
 *
 *  Nenhum número de popularidade em lugar nenhum: sem "mais lidos da
 *  semana", sem contador de leitores, sem trending.
 *
 *  Nenhum "para você" gerado por modelo. Afinidade aqui é SOBREPOSIÇÃO
 *  DE ESTANTE: quantos livros a gente tem em comum. É aritmética, é
 *  determinística, e dá para explicar em uma frase para quem usa.
 *
 *  Toda leitura passa por visibleTo(), no SQL. Estante privada não
 *  aparece nunca, e resenha privada também não. Ver SECURITY.md.
 *
 *  ═══ POR QUE A REGRA ESTÁ ESCRITA AQUI ═══
 *
 *  "Explorar" é o nome que o feed algorítmico usa quando quer entrar.
 *  Ele começa cronológico e honesto, e em seis meses alguém olha uma
 *  métrica e o ordena por engajamento, com a melhor das intenções. Esta
 *  regra existe para quando essa tentação chegar, e ela vai chegar. Ver
 *  ai/DECISIONS.md.
 * ════════════════════════════════════════════════════════════════════
 */

export type Estante = {
  handle: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  capas: string[];
};

export type Afinidade = {
  slug: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  leitores: { handle: string; name: string | null; image: string | null }[];
};

export type Resenha = {
  id: string;
  body: string;
  createdAt: Date;
  handle: string;
  name: string | null;
  image: string | null;
  slug: string;
  title: string;
  coverUrl: string | null;
};

export type Lendo = { slug: string; title: string; author: string | null; coverUrl: string | null };

/**
 * A capa que representa uma obra quando NINGUÉM em particular está olhando: as
 * telas da comunidade (explorar, quem está lendo). A edição mais antiga com capa,
 * que é arbitrária mas estável — e estável importa, porque uma capa que muda a cada
 * visita faz a pessoa achar que abriu o livro errado.
 */
const capaDaObra = sql`(
  select e.cover_url from editions e
   where e.work_id = w.id and e.cover_url is not null
   order by e.created_at asc limit 1)`;

/**
 * ════════════════════════════════════════════════════════════════════
 *  A CAPA DE UMA RESENHA É O EXEMPLAR DE QUEM ESCREVEU.
 *
 *  ═══ O BUG ═══
 *
 *  O dono abriu o próprio perfil e viu o Frankenstein com DUAS capas: a verde da
 *  Antofágica em "o que eu adorei", e outra em "o que eu escrevi". Mesmo livro,
 *  mesma página, duas imagens.
 *
 *  Não era capa errada, era pergunta respondida duas vezes. A estante sabe QUAL
 *  edição é a sua e desenha ela. A resenha usava `capaDaObra` — "a edição mais
 *  antiga que alguém importou" —, que não tem relação nenhuma com o livro que a
 *  pessoa leu.
 *
 *  ═══ POR QUE A DA PESSOA, E NÃO UMA REGRA MELHOR ═══
 *
 *  Uma resenha não é sobre a obra em abstrato: é sobre o exemplar que a pessoa
 *  teve na mão, com aquela tradução e aquela capa. Ela escolheu a edição quando
 *  pôs na estante, e essa escolha é a resposta — não há regra global que acerte
 *  mais do que a pessoa já acertou.
 *
 *  O `left join` e o fallback existem porque a escolha pode faltar: quem resenhou
 *  sem pôr na estante, ou entrada antiga sem edição gravada (eram 41 em produção).
 *  Aí cai na regra da comunidade, que é o que ela sempre foi.
 * ════════════════════════════════════════════════════════════════════
 */
const capaDeQuemEscreveu = sql`coalesce(
  (select e.cover_url
     from library_entries le
     join editions e on e.id = le.edition_id
    where le.user_id = reviews.user_id
      and le.work_id = reviews.work_id
      and e.cover_url is not null
    limit 1),
  ${capaDaObra})`;

/**
 * ════════════════════════════════════════════════════════════════════
 *  1. ESTANTES PARA DESCOBRIR. O coração da tela.
 *
 *  Perfil público, com cara, bio e uma amostra das capas. A pessoa vê a estante, reconhece
 *  o gosto, e segue. Aí o feed dela enche, e enche de gente que ela ESCOLHEU.
 *
 *  Não é "quem tem mais livros" nem "quem tem mais seguidores": as duas coisas são placar.
 *
 *  ═══ POR QUE NÃO É SÓ CRONOLÓGICO ═══
 *
 *  Era: quem mexeu na estante mais recentemente aparecia antes. Parecia neutro, e não era.
 *
 *  **Ordenar por atividade premia quem cadastra livro toda semana.** Passando de doze
 *  pessoas, as mesmas caras ocupam a tela para sempre, e quem lê devagar nunca é
 *  descoberto — quando a estante de quem lê devagar costuma ser a mais interessante que
 *  existe. Uma ordenação "neutra" que sempre mostra os mesmos é um placar envergonhado.
 *
 *  ═══ O QUE ELA FAZ AGORA: SORTEIA DENTRO DE QUEM ESTÁ VIVO ═══
 *
 *  Pega as estantes que se mexeram em algum momento (o pool), e SORTEIA doze delas. Quem
 *  entrou ontem tem a mesma chance de quem entrou há um ano.
 *
 *  O corte de vida continua existindo, e é o que impede a tela de virar um cemitério: uma
 *  estante que nunca cresceu não é uma descoberta, é uma porta para um quarto vazio.
 *
 *  E a tela ROTACIONA a cada visita, o que é a única forma honesta de dar vez a todo mundo
 *  sem inventar um critério de mérito. O Gume não tem opinião sobre quem você devia seguir.
 *
 *  Quem você já segue não aparece: sugerir alguém que você já segue é ocupar a vitrine com
 *  uma coisa que já é sua.
 * ════════════════════════════════════════════════════════════════════
 */
export async function getEstantes(viewer: Viewer, limite = 12): Promise<Estante[]> {
  const rows = await db.execute<Estante & { ultima: Date }>(sql`
    select u.handle,
           u.display_name as name,
           u.image,
           u.bio,
           coalesce(
             (select array_agg(c.cover_url)
                from (
                  select ${capaDaObra} as cover_url
                    from library_entries
                    join works w on w.id = library_entries.work_id
                   where library_entries.user_id = u.id
                     and ${visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility)}
                     and ${capaDaObra} is not null
                   order by library_entries.added_at desc
                   limit 6
                ) c),
             '{}'
           ) as capas,
           max(library_entries.added_at) as ultima
      from users u
      join library_entries on library_entries.user_id = u.id
      join works w on w.id = library_entries.work_id
     where u.deleted_at is null
       -- BANIDO some, e quem não verificou o e-mail não é DESCOBERTO.
       -- Com cadastro aberto, o explorar é a vitrine, e uma vitrine sem portão vira
       -- fazenda de spam. Ver lib/people.ts e app/[handle]/page.tsx.
       and u.banned_at is null
       and u.email_verified = true
       and ${visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility)}
       ${viewer ? sql`and u.id <> ${viewer.id}::uuid
       and not exists (
         select 1 from follows f
          where f.follower_id = ${viewer.id}::uuid
            and f.followee_id = u.id
            and f.state = 'accepted')` : sql``}
     group by u.id
    having count(*) filter (where ${capaDaObra} is not null) >= 2
     -- SORTEIA, e não ordena por atividade. Ver a nota acima: ordenar por atividade
     -- premia quem cadastra livro toda semana, e some com quem lê devagar.
     order by random()
     limit ${limite}`);

  return rows.map((r) => ({
    handle: r.handle,
    name: r.name,
    image: r.image,
    bio: r.bio,
    capas: (r.capas ?? []).filter(Boolean),
  }));
}

/**
 * 2. QUEM LÊ O QUE VOCÊ LÊ.
 *
 * "Três leitores também têm Grande Sertão na estante."
 *
 * Afinidade por SOBREPOSIÇÃO DE ESTANTE: um livro que está na sua estante e na
 * de outra pessoa. Nada de modelo, nada de "leitores como você": é a interseção
 * de dois conjuntos, e dá para explicar para quem usa sem mentir.
 *
 * O número que aparece aqui não é popularidade: ele não ordena o mundo, não diz
 * o que é "mais lido", e não existe sem VOCÊ do outro lado. É afinidade, e ela
 * some no instante em que você tira o livro da estante.
 */
export async function getAfinidade(viewer: Viewer, limite = 5): Promise<Afinidade[]> {
  if (!viewer) return [];

  const rows = await db.execute<{
    slug: string;
    title: string;
    author: string | null;
    cover_url: string | null;
    leitores: { handle: string; name: string | null; image: string | null }[];
  }>(sql`
    -- A MINHA estante ganha apelido (minha); a do OUTRO fica sem apelido, porque
    -- é sobre ela que o visibleTo() filtra, e ele emite o nome real da tabela. A
    -- minha não precisa de filtro: você sempre pode ver o que é seu.
    select w.slug, w.title, a.name as author, ${capaDaObra} as cover_url,
           json_agg(json_build_object(
             'handle', u.handle, 'name', u.display_name, 'image', u.image
           ) order by library_entries.added_at desc) as leitores
      from library_entries minha
      join works w on w.id = minha.work_id
      left join authors a on a.id = w.author_id
      join library_entries
        on library_entries.work_id = minha.work_id
       and library_entries.user_id <> minha.user_id
      join users u on u.id = library_entries.user_id and u.deleted_at is null
     where minha.user_id = ${viewer.id}::uuid
       and ${visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility)}
     group by w.id, w.slug, w.title, a.name
     -- SORTEIA entre os livros em comum, como o resto do explorar: ordenar por
     -- "quantos leem" fazia a mesma meia dúzia de clássicos morar aqui para sempre,
     -- e a vitrine que não muda vira papel de parede. Cinco por visita, rodando.
     order by random()
     limit ${limite}`);

  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    author: r.author,
    coverUrl: r.cover_url,
    leitores: (r.leitores ?? []).slice(0, 30),
  }));
}

/**
 * 3. RESENHAS RECENTES. Públicas, cronológicas, e só resenha ESCRITA.
 *
 * Nunca "fulano prateleirou um livro" de um estranho: isso é ruído, e é
 * exatamente onde nasce a vontade de performar para desconhecidos. Se a pessoa
 * sentou e escreveu, ela quer ser lida. Essa é a diferença, e ela é toda.
 */
export async function getResenhas(viewer: Viewer, limite = 6): Promise<Resenha[]> {
  const rows = await db.execute<{
    id: string;
    body: string;
    created_at: Date;
    handle: string;
    name: string | null;
    image: string | null;
    slug: string;
    title: string;
    cover_url: string | null;
  }>(sql`
    -- Sem apelido em "reviews": o visibleTo() emite o nome real da tabela, e um
    -- apelido faz o Postgres não achar a coluna que a regra de visibilidade cita.
    select reviews.id, reviews.body, reviews.created_at,
           u.handle, u.display_name as name, u.image,
           w.slug, w.title, ${capaDaObra} as cover_url
      from reviews
      join users u on u.id = reviews.user_id and u.deleted_at is null
      join works w on w.id = reviews.work_id
     where reviews.deleted_at is null
       and ${visibleTo(viewer, reviews.userId, reviews.visibility)}
       ${viewer ? sql`and reviews.user_id <> ${viewer.id}::uuid` : sql``}
     order by reviews.created_at desc
     limit ${limite}`);

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
    handle: r.handle,
    name: r.name,
    image: r.image,
    slug: r.slug,
    title: r.title,
    coverUrl: r.cover_url,
  }));
}

/**
 * 4. O QUE ESTÃO LENDO AGORA. Só as capas.
 *
 * Sem nome de quem lê, sem contagem, sem "em alta". É uma VITRINE, e não um
 * ranking: você olha, e ou o livro te chama ou não te chama. No instante em que
 * aparecer um número do lado, isso vira placar, e placar muda o que as pessoas
 * põem na estante.
 */
export async function getLendoAgora(viewer: Viewer, limite = 18): Promise<Lendo[]> {
  const rows = await db.execute<{
    slug: string;
    title: string;
    author: string | null;
    cover_url: string | null;
    status_at: Date;
  }>(sql`
    select distinct on (w.id) w.slug, w.title, a.name as author, ${capaDaObra} as cover_url,
           library_entries.status_at
      from library_entries
      join works w on w.id = library_entries.work_id
      left join authors a on a.id = w.author_id
     where library_entries.status = 'reading'
       and ${visibleTo(viewer, libraryEntries.userId, libraryEntries.visibility)}
       and ${capaDaObra} is not null
     order by w.id, library_entries.status_at desc
     limit ${limite}`);

  // O `distinct on` OBRIGA o order by a começar pela obra, então a ordem que sai
  // do banco é por id, que não quer dizer nada. A ordem que vale é cronológica, e
  // ela é aplicada aqui: quem começou a ler mais recentemente aparece primeiro.
  // Nunca por quantidade de leitores: isso seria "em alta" com outro nome.
  return rows
    .sort((a, b) => new Date(b.status_at).getTime() - new Date(a.status_at).getTime())
    .map((r) => ({ slug: r.slug, title: r.title, author: r.author, coverUrl: r.cover_url }));
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  AS RESENHAS DE UMA PESSOA. No perfil dela.
 *
 *  A resenha é a coisa mais demorada que alguém escreve no Gume, e ela só existia em dois
 *  lugares: na página do livro (uma por vez) e no "resenhas recentes" do explorar (a de
 *  todo mundo, misturada). Não havia como ler o que UMA pessoa escreveu — que é
 *  exatamente o que se quer depois de gostar de uma resenha dela.
 *
 *  ═══ E A VISIBILIDADE NÃO É NEGOCIÁVEL ═══
 *
 *  Resenha nasce PRIVADA, de propósito (ai/DECISIONS.md): a maior parte é escrita para si
 *  mesmo, e um app que publica por padrão ensina, em silêncio, a escrever para uma
 *  plateia. Um perfil que listasse tudo transformaria um caderno em vitrine, sem ninguém
 *  ter pedido.
 *
 *  Então o filtro é o `visibleTo()`, NO SQL, como toda leitura de dado alheio neste repo:
 *  o dono vê as dele, quem segue vê as de "quem me segue", e um estranho vê só as
 *  públicas. A tela não decide nada disso — a consulta decide. Ver SECURITY.md.
 * ════════════════════════════════════════════════════════════════════
 */
export type ResenhaDaPessoa = {
  id: string;
  body: string;
  createdAt: Date;
  slug: string;
  title: string;
  coverUrl: string | null;
  /** Só o dono vê isto: é o que deixa ele saber o que está aberto e o que não está. */
  visibility: string;
};

export async function getResenhasDe(
  viewer: Viewer,
  donoId: string,
  limite = 20,
): Promise<ResenhaDaPessoa[]> {
  const rows = await db.execute<{
    id: string;
    body: string;
    created_at: Date;
    slug: string;
    title: string;
    cover_url: string | null;
    visibility: string;
  }>(sql`
    -- Sem apelido em "reviews": o visibleTo() emite o nome real da tabela, e um
    -- apelido faz o Postgres não achar a coluna que a regra de visibilidade cita.
    select reviews.id, reviews.body, reviews.created_at, reviews.visibility,
           w.slug, w.title, ${capaDeQuemEscreveu} as cover_url
      from reviews
      join works w on w.id = reviews.work_id
     where reviews.user_id = ${donoId}::uuid
       and reviews.deleted_at is null
       and ${visibleTo(viewer, reviews.userId, reviews.visibility)}
     order by reviews.created_at desc
     limit ${limite}`);

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
    slug: r.slug,
    title: r.title,
    coverUrl: r.cover_url,
    visibility: r.visibility,
  }));
}

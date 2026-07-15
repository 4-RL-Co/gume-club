-- ════════════════════════════════════════════════════════════════════
--  A COLEÇÃO É DA EDIÇÃO, E NÃO DA SÉRIE.
--
--  "Eu tenho vários volumes de edições diferentes, ou seja, tenho DUAS coleções
--  de Berserk."
--
--  Essa frase é a especificação inteira, e ela derruba o modelo anterior.
--
--  ═══ O QUE A LOJA MOSTROU ═══
--
--  A Panini publica Berserk em DUAS edições:
--
--      Berserk — Edição de Luxo     41 volumes
--      Berserk (edição antiga)      passa de 80 volumes
--
--  O "volume 25" da Luxo e o "volume 25" da antiga são LIVROS DIFERENTES, com
--  conteúdo diferente e ISBN diferente.
--
--  Jogar os dois na mesma prateleira faz a lacuna em cinza — que é o produto
--  inteiro daquela tela — apontar para o buraco errado. O leitor olharia o vazio
--  no 25, iria comprar, e já teria.
--
--  ═══ O MODELO ═══
--
--      series    A OBRA.        Berserk, de Kentaro Miura.
--      colecoes  A EDIÇÃO.      "Berserk — Edição de Luxo", Panini, 41 volumes.
--      works     O VOLUME.      Um livro. Nota, resenha, estante e leitura.
--
--  Uma pessoa pode ter DUAS coleções da mesma obra, e isso não é um caso de
--  borda: é o caso comum. Metade do público de mangá tem a edição antiga e barata,
--  a outra metade tem a de luxo, e quem gosta de verdade tem as duas.
--
--  ═══ E O PROGRESSO CONTINUA SEM EXISTIR ═══
--
--  Nenhuma coluna de percentual, de "completa" ou de progresso. Volumes lidos ÷
--  volumes que existem se COMPUTA. Uma coluna guardada é uma coluna que alguém vai
--  querer ordenar, comparar e pôr num ranking — e a coleção mostra a LACUNA, nunca
--  celebra o fechamento. Ver ai/DECISIONS.md.
-- ════════════════════════════════════════════════════════════════════

create table if not exists colecoes (
  id uuid primary key default gen_random_uuid(),

  -- A OBRA de que esta edição é uma edição.
  series_id uuid not null references series(id) on delete cascade,

  -- O endereço público. "berserk-edicao-de-luxo".
  slug citext not null unique,

  -- Como a editora a chama. "Berserk — Edição de Luxo".
  title text not null,

  /*
   * QUEM PUBLICOU. É isto que separa uma coleção da outra, e é o que o leitor
   * reconhece na lombada.
   *
   * Nulo quando a coleção é a serialização ORIGINAL (a japonesa, que a AniList conhece):
   * ela existe para o app saber quantos volumes a obra tem, e ninguém no Brasil tem
   * aquela edição na estante.
   */
  publisher text,

  /*
   * Quantos volumes ESTA edição tem.
   *
   * Nulo é legítimo, e é o caso de One Piece: a edição está em publicação, e ninguém
   * sabe o total. O acervo não inventa um número que a fonte não sabe — e a tela tem
   * "adicionar volume" para o dia em que sair o 106.
   */
  total_volumes integer,

  -- A capa da coleção. URL, nunca o arquivo: a capa mora na origem. Ver ai/PRD.md.
  cover_url text,

  /*
   * ONDE COMPRAR. O Gume é canal, não parasita.
   *
   * O metadado veio da loja da editora, e a página do livro linka de volta para ela.
   * Isso não é gentileza: é o que torna a raspagem de fato público defensável — a gente
   * não tira nada dela, a gente manda gente.
   */
  loja_url text,

  created_at timestamptz not null default now(),

  -- Uma editora não publica duas edições com o mesmo nome da mesma obra.
  unique (series_id, title)
);

create index if not exists colecoes_series_idx on colecoes (series_id);

/*
 * O VOLUME PERTENCE A UMA COLEÇÃO.
 *
 * `series_id` continua em `works` — a busca por "Berserk" tem que achar o volume, seja
 * qual for a edição. A coleção é a PRATELEIRA; a série é a OBRA.
 */
alter table works
  add column if not exists colecao_id uuid references colecoes(id) on delete set null;

create index if not exists works_colecao_idx on works (colecao_id, volume);

/*
 * O ISBN por volume, que é o que faz o LEITOR DE CÓDIGO DE BARRAS existir.
 *
 * É assim que um leitor de mangá de verdade cadastra a estante: pega a pilha e passa o
 * celular em cima. Sem ISBN por volume, o scanner não tem o que ler.
 *
 * Ele mora em `editions`, que é onde o ISBN sempre morou — o volume ganha UMA edição, a
 * brasileira, com o ISBN e a capa que a Panini publicou. Nada de novo no schema: o
 * modelo já previa isto.
 */

-- ─────────────────────────────────────────── a coleção original, dos volumes que já existem

/*
 * Os 2.797 volumes que a AniList semeou não têm editora: eles são a serialização
 * original. Cada série ganha UMA coleção para eles, e os volumes passam a apontar para
 * ela — senão eles ficariam órfãos de prateleira, e a tela da coleção não teria o que
 * mostrar.
 */
insert into colecoes (series_id, slug, title, publisher, total_volumes, cover_url)
select s.id,
       s.slug || '-original',
       s.title,
       null,
       s.total_volumes,
       s.cover_url
  from series s
 where exists (select 1 from works w where w.series_id = s.id)
   and not exists (select 1 from colecoes c where c.series_id = s.id and c.publisher is null)
on conflict do nothing;

update works w
   set colecao_id = c.id
  from colecoes c
 where c.series_id = w.series_id
   and c.publisher is null
   and w.colecao_id is null;

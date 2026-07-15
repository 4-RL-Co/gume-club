-- ════════════════════════════════════════════════════════════════════
--  A COLEÇÃO. Uma VISTA, e não um objeto que se avalia.
--
--  ═══ CADA VOLUME É UM LIVRO. Padrão, sem exceção. ═══
--
--  Nota, resenha, estante e leitura moram no VOLUME, como em qualquer livro.
--  Não existe "nota da série", e não vai existir: a série não é uma obra, e
--  fingir que é obrigaria `ratings` e `reviews` a apontarem para dois tipos de
--  coisa — uma flexibilidade que convida à corrupção e que não paga o que custa.
--
--  A série é uma PRATELEIRA: ela mostra quais volumes existem, quais você tem, e
--  quais faltam. É a resposta para a pergunta que todo leitor de mangá faz: qual
--  volume falta comprar.
--
--  ═══ A LINHA QUE NÃO SE CRUZA ═══
--
--  O volume que falta aparece em CINZA. Isso é um FATO sobre a sua estante —
--  igual a olhar a prateleira de casa e ver o buraco.
--
--  Não é uma barra de progresso. Não é "87% da coleção". Não é "faltam 3 para
--  completar". Não é troféu, medalha, selo, badge nem confete.
--
--  O cinza do LoL e a platina do PS5 existem para dar COCEIRA. Aqui ele existe
--  para MOSTRAR A LACUNA, e nada mais.
--
--  Por isso esta migration não tem — e nunca vai ter — uma coluna de progresso,
--  de percentual ou de "completa". Progresso se COMPUTA (volumes lidos / volumes
--  que existem), nunca se guarda: uma coluna guardada é uma coluna que alguém
--  vai querer ordenar, comparar e pôr num ranking.
-- ════════════════════════════════════════════════════════════════════

alter table series
  -- O endereço público da coleção. Sem ele não há para onde linkar, e o link é o produto.
  add column if not exists slug citext,

  -- A capa da SÉRIE (a AniList dá uma, e é a do volume 1). Ela é o tile único na
  -- parede de capas: 41 lombadas de Berserk em fila destroem a tela que carrega o
  -- produto inteiro.
  add column if not exists cover_url text,

  -- Quem escreveu. A série tem autor porque o VOLUME tem autor, e é o mesmo.
  add column if not exists author_id uuid references authors(id) on delete set null,

  -- Quem desenha, quando é outra pessoa. Death Note: Ohba escreve, Obata desenha.
  add column if not exists illustrator_id uuid references authors(id) on delete set null,

  add column if not exists first_published integer,

  /*
   * OS OUTROS NOMES DA SÉRIE. É o que faz "Ataque dos Titãs" achar Attack on Titan.
   *
   * No Brasil, Shingeki no Kyojin é "Ataque dos Titãs". Kimetsu no Yaiba é "Demon
   * Slayer". Alguém vai digitar o nome brasileiro, e tem que achar.
   *
   * A AniList tem "Ataque dos Titãs" nos sinônimos — junto com "Ataque a los Titanes",
   * "L'Attacco dei Giganti" e "Atak Tytanów", e SEM dizer qual é de qual idioma. São
   * vinte línguas numa sacola.
   *
   * Então a gente não adivinha o português: guarda a sacola inteira, e deixa a busca
   * achar. Mesma disciplina do `authors.alt_names` e do lib/nomes.ts: o nome que vai
   * para a TELA é um; os nomes por que se PROCURA são todos.
   */
  add column if not exists alt_titles text[] not null default '{}';

-- O slug é obrigatório depois de preenchido, e único: é um endereço público.
update series set slug = 'serie-' || id::text where slug is null;
alter table series alter column slug set not null;

create unique index if not exists series_slug_unique on series (slug);

/*
 * A busca por título alternativo. Sem o índice, procurar "Ataque dos Titãs" varreria
 * a tabela inteira a cada tecla.
 *
 * `alt_texto` é a função imutável da migration 0033 — `array_to_string` não é marcada
 * como IMMUTABLE pelo Postgres, e ele recusa indexar expressão que não seja.
 */
create index if not exists series_alt_titles_trgm
  on series using gin (
    immutable_unaccent(lower(alt_texto(alt_titles))) gin_trgm_ops
  );

create index if not exists series_title_trgm
  on series using gin (immutable_unaccent(lower(title)) gin_trgm_ops);

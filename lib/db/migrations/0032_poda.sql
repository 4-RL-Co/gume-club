-- ════════════════════════════════════════════════════════════════════
--  A PODA. O que esta migration faz, e o que ela DELIBERADAMENTE não faz.
--
--  Ela NÃO APAGA NADA. Nem uma linha.
--
--  Apagar 365 mil obras dentro de uma migration seria errado por duas
--  razões, e as duas são caras:
--
--  1. UMA TRANSAÇÃO SÓ. O `drizzle-kit migrate` roda cada arquivo dentro de
--     uma transação. Um DELETE de 365 mil obras, que cascateia para 402 mil
--     edições e 657 mil identificadores, numa transação única, faz o WAL
--     inchar até o disco acabar — e o rollback de um WAL desse tamanho leva
--     mais tempo que a poda inteira.
--
--  2. NINGUÉM ESTARIA OLHANDO. `pnpm db:migrate` é um comando que a gente
--     roda no automático, em CI, sem ler. Apagar 98% do acervo é a última
--     coisa que pode acontecer dentro de um comando que ninguém lê.
--
--  Então a poda de verdade mora em `scripts/poda.mjs`, em LOTES, com
--  transação por lote, e ela exige `--executar` para tocar em alguma coisa.
--  Sem esse argumento ela só MEDE e imprime. Ver docs/poda.md.
--
--  Esta migration cria duas coisas, e as duas são seguras:
--    a) o livro-caixa da poda (`poda_registro`), com a contagem antes e
--       depois — porque uma poda sem contagem gravada é uma poda que
--       ninguém consegue auditar seis meses depois;
--    b) a queda de um índice duplicado, que é ganho puro.
--
--  ═══ O DESFAZER ═══
--
--  Não existe `down` para esta poda, e não é descuido: o desfazer é
--  `scripts/import-openlibrary.mjs`. O dump da Open Library é público e
--  re-importa o acervo inteiro. A gente não está QUEIMANDO o dado — está
--  tirando ele de cima da mesa.
--
--  O que a poda nunca toca, e é isso que a torna reversível de verdade:
--  NENHUMA linha de gente. Nenhuma estante, nenhuma leitura, nenhuma nota,
--  nenhuma resenha, nenhuma correção de bibliotecário. O script confere isso
--  antes de apagar qualquer coisa, e se o número não der ZERO ele aborta.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────── o livro-caixa

create table if not exists poda_registro (
  id uuid primary key default gen_random_uuid(),
  quando timestamptz not null default now(),

  -- Quem mandou podar. Uma poda é um ato, e um ato tem dono.
  por uuid references users(id) on delete set null,

  -- Quantos autores tinha o cânone no dia. Se um dia alguém perguntar "por que
  -- este livro sumiu?", a resposta começa aqui.
  canone_autores integer not null,

  obras_antes integer not null,
  obras_depois integer not null,
  edicoes_antes integer not null,
  edicoes_depois integer not null,
  autores_antes integer not null,
  autores_depois integer not null,

  -- O tamanho do banco, medido de verdade, antes e depois. O VACUUM FULL vem
  -- depois e num comando separado: DELETE não devolve disco sozinho.
  bytes_antes bigint,
  bytes_depois bigint
);

-- ────────────────────────────────────────────────── o índice duplicado

/*
 * `editions_isbn13_idx` (6,4 MB) é um btree comum sobre a MESMA coluna que
 * `editions_isbn13_unique` já indexa — e o unique atende qualquer consulta que o
 * outro atenderia. Medido em produção: o unique foi usado 148.537 vezes; este, 174.
 *
 * Dois índices sobre a mesma coluna não são redundância útil: são duas escritas a
 * cada INSERT para uma leitura que já estava atendida.
 */
drop index if exists editions_isbn13_idx;

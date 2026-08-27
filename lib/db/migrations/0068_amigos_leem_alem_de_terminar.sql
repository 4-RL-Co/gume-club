-- ════════════════════════════════════════════════════════════════════
--  O FEED DE AMIGOS GANHA DUAS COISAS QUE JÁ EXISTIAM NO APP, E NÃO NO FEED.
--
--  "resenhou" já era um verbo do feed, mas a linha não mostrava a resenha: só a
--  frase. Quem quisesse ler tinha que ir atrás do livro sozinho. E criar uma
--  estante inventada não gerava linha NENHUMA — um amigo podia montar uma
--  curadoria inteira e ninguém que o segue ficava sabendo.
--
--  ═══ POR QUE work_id PRECISA DEIXAR DE SER NOT NULL ═══
--
--  Toda linha do feed, até hoje, era sobre um LIVRO. "criou uma estante" não é:
--  é sobre a estante. Forçar um work_id ali seria inventar um livro que não tem
--  nada a ver com o fato. A troca é NOT NULL por uma CHECK: toda linha continua
--  falando de alguma coisa, livro OU estante, nunca as duas faltando.
--
--  ═══ POR QUE UMA RESENHA GANHA UM ÍNDICE ÚNICO ═══
--
--  Sem isto, `record()` inseria uma linha nova a cada `saveReview()` — e
--  corrigir uma vírgula na resenha empilhava uma segunda linha idêntica no feed
--  de quem te segue. `activities_review_unique` deixa o banco garantir o que a
--  query já devia garantir sozinha: uma resenha, uma linha, sempre. lib/social.ts
--  passa a fazer UPSERT nessa chave.
-- ════════════════════════════════════════════════════════════════════

alter table activities
  alter column work_id drop not null;

alter table activities
  add column if not exists collection_id uuid references collections(id) on delete cascade;

alter table activities
  add constraint activities_sobre_algo check (work_id is not null or collection_id is not null);

-- "created_list" é verbo novo, e a CHECK da migration 0010 travava a lista antiga.
-- Migration é append-only por regra (AGENTS.md), mas a CHECK em si não é uma
-- migration: é uma restrição viva, e ela tem que aceitar o verbo novo para a
-- linha existir.
alter table activities
  drop constraint activities_verb_check;

alter table activities
  add constraint activities_verb_check
  check (verb in ('started','finished','shelved','rated','reviewed','recommended','created_list'));

create unique index if not exists activities_review_unique
  on activities (review_id)
  where review_id is not null;

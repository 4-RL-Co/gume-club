-- FATIA 1: o histórico de correções, e a fila da capa.
--
-- A tabela `revisions` já existia e já é append-only, com o nome de quem fez.
-- Faltavam duas coisas, e as duas são fundação das fatias seguintes.
--
-- 1. SABER O QUE SOBREVIVEU. Contar correção FEITA produz correção LIXO: a pessoa
--    enche o contador com edição trivial ou errada. É problema documentado na
--    Wikipédia. Então a reversão marca a revisão original, e o que conta é o que
--    ninguém precisou desfazer.
--
-- 2. A CAPA É A ÚNICA EXCEÇÃO. Todo o resto o leitor corrige e aplica na hora. A
--    capa aparece na tela de todo mundo, então é o único lugar onde vandalismo
--    tem plateia: usuário comum PROPÕE, bibliotecário aplica.

alter table revisions
  add column if not exists reverted_at  timestamptz,
  add column if not exists reverted_by  uuid references users(id) on delete set null,
  -- a revisão que DESFEZ esta. O log da reversão também é log.
  add column if not exists reverted_in  uuid references revisions(id) on delete set null;

create index if not exists revisions_user_idx on revisions (user_id, reverted_at);

-- A fila da capa. Uma proposta por vez, por pessoa e por edição.
create table if not exists cover_proposals (
  id          uuid primary key default uuidv7(),
  edition_id  uuid not null references editions(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  -- A capa do catálogo é por REFERÊNCIA, sempre: a URL da fonte, nunca uma cópia
  -- do arquivo. Copiar o acervo de outra pessoa para dentro do nosso não é o que
  -- a gente pediu emprestado. A foto da CÓPIA do leitor é outra coisa, e essa a
  -- gente hospeda: ela é fotografia dele.
  cover_url   text not null,
  note        text,
  state       text not null default 'pending',
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),

  constraint cover_proposals_state check (state in ('pending', 'applied', 'refused'))
);

create index if not exists cover_proposals_fila on cover_proposals (state, created_at);
create unique index if not exists cover_proposals_uma_por_pessoa
  on cover_proposals (edition_id, user_id) where state = 'pending';

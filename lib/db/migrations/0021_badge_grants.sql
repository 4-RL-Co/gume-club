-- As insígnias que uma CONSULTA NÃO SABE RESPONDER.
--
-- Seis das oito são calculáveis: o banco sabe quem tem correção que sobreviveu,
-- quem trouxe leitores que ficaram, quem passou uma cópia adiante, quem estava
-- aqui no começo, quem é bibliotecário, e quem tem PR mesclado (cruzando a conta
-- do GitHub ligada por OAuth com a lista de contribuidores do repositório).
--
-- Duas não são:
--
--   CAÇADOR   abriu uma issue que VIROU correção. Saber que uma issue virou uma
--             correção é julgamento humano: nenhuma consulta liga um texto em
--             português a um conserto no catálogo. É a porta de quem não programa,
--             e é justamente por isso que ela não pode ser automática.
--
--   TRADUTOR  contribuiu com a tradução do app para outro idioma. Não existe i18n
--             ainda, e quando existir a contribuição vai chegar por fora do banco.
--
-- Elas são CONCEDIDAS, e a concessão tem nome, data e motivo. Ela é append-only,
-- como toda revisão deste projeto: conceder é um ato público, e desconceder também.
create table if not exists badge_grants (
  id         uuid primary key default uuidv7(),
  user_id    uuid not null references users(id) on delete cascade,
  badge      text not null,
  granted_by uuid references users(id) on delete set null,
  reason     text,
  -- Retirar não apaga: marca. Um histórico que se apaga não é histórico.
  revoked_at timestamptz,
  revoked_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint badge_grants_badge check (badge in ('cacador', 'tradutor'))
);

create unique index if not exists badge_grants_uma_por_pessoa
  on badge_grants (user_id, badge) where revoked_at is null;

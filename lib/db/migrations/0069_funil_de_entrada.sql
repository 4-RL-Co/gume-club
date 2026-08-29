-- ════════════════════════════════════════════════════════════════════
--  O FUNIL DE ENTRADA. 1.217 visitas de divulgação, 2 cadastros. Sem medir
--  onde a pessoa cai, cada rodada de divulgação vira o mesmo relatório
--  inútil: um número de visualizações sem saber o que virou gente.
--
--  ═══ ELA NÃO GUARDA QUEM VISITOU ═══
--
--  Mesma lei de buscas_vazias (migration 0031): não há coluna que aponte
--  para uma pessoa, e a falta dela é DELIBERADA. Para responder "de onde
--  vêm os cadastros" basta saber O TIPO de evento, a ORIGEM (normalizada,
--  nunca a URL crua de referrer — ela mesma pode identificar, um link
--  mandado numa DM é um link só) e um id anônimo de SESSÃO, que expira em
--  30 minutos (o cookie que o carrega). Nada disso aponta para uma conta,
--  nem antes nem depois de ela existir.
--
--  Uma tabela que não tem a coluna não pode vazar a coluna. Por isso ela
--  fica FORA de lib/db/schema.ts, como buscas_vazias e rate_limits: SQL
--  cru, e não um .insert() que parece inofensivo e um dia ganha um
--  user_id "só para debugar".
-- ════════════════════════════════════════════════════════════════════

create table if not exists eventos_funil (
  id uuid primary key default gen_random_uuid(),

  -- 'visita_home' | 'clique_criar' | 'viu_entrar' | 'cadastro_ok'
  tipo text not null
    check (tipo in ('visita_home', 'clique_criar', 'viu_entrar', 'cadastro_ok')),

  -- Origem normalizada (bucket: reddit, facebook, organico, direto...), nunca
  -- a URL crua do referrer ou do utm_source. Nula quando não observada
  -- diretamente neste evento; a leitura reconstrói por sessão.
  origem text,

  -- Só em 'viu_entrar': o modo com que a porta abriu, ANTES de qualquer
  -- upgrade por convite.
  modo_inicial text check (modo_inicial in ('entrar', 'criar')),

  -- O cookie. Opaco, não referencia users, não é filtrável por "quem" fora
  -- desta tabela. Expira em 30 minutos no navegador.
  sessao_anon uuid not null,

  criado_em timestamptz not null default now()
);

create index if not exists eventos_funil_tipo_criado_idx on eventos_funil (tipo, criado_em);
create index if not exists eventos_funil_sessao_idx on eventos_funil (sessao_anon);

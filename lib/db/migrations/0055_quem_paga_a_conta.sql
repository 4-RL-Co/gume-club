-- ════════════════════════════════════════════════════════════════════
--  QUEM PAGA A CONTA DO SERVIDOR. E por que `is_supporter` deixa de ser uma coluna.
--
--  ═══ A INSÍGNIA JÁ EXISTIA. O PAGAMENTO É QUE NÃO ═══
--
--  A insígnia de apoiador está de pé desde a 0012: componente, cor, moldura rosa, lugar
--  na ordem, texto explicando que ela não se conquista, se paga. O que nunca existiu foi
--  o jeito de alguém apoiar. `users.is_supporter` era um booleano que SÓ o seed escrevia.
--
--  ═══ POR QUE A COLUNA MORRE ═══
--
--  A decisão que criou a insígnia diz, com todas as letras, que ela é VIVA: "sai sozinha
--  no dia em que a pessoa para de apoiar, e não é concedida numa tabela que alguém teria
--  que lembrar de limpar".
--
--  Um booleano gravado por webhook não cumpre isso, e o buraco não é teórico:
--
--    · o apoio avulso vale 30 dias. No dia 31 ninguém manda webhook nenhum, porque não
--      aconteceu nada. O Stripe não avisa que o tempo passou. A insígnia ficaria para
--      sempre, e seria exatamente a mentira que a decisão recusou.
--    · uma assinatura que vence por cartão recusado depende de o webhook chegar E de a
--      gravação dar certo. Se qualquer um dos dois falhar, a coluna mente até alguém
--      notar. Ninguém nota: é um booleano no perfil de outra pessoa.
--
--  A alternativa seria uma faxina noturna, que é a "tabela que alguém teria que lembrar
--  de limpar" com outro nome.
--
--  Agora a resposta é CALCULADA na hora, de duas coisas que são fatos com data:
--
--      existe assinatura ativa   OU   avulso_badge_until > now()
--
--  Não há instante em que o banco discorde da verdade, porque não há nada guardado para
--  discordar. A regra mora em ehApoiador(), em lib/apoio.ts, e é uma só: o mesmo
--  fragmento de SQL serve a insígnia, a moldura e a lista de apoiadores. Três cópias de
--  uma regra de produto é como três telas começam a divergir.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────── o vínculo com o Stripe

-- O id do cliente no Stripe. NÃO é segredo (é um `cus_...`, e ele não autoriza nada
-- sozinho), mas é único por pessoa: dois usuários apontando para o mesmo cliente seria
-- o apoio de um pagando a insígnia do outro.
alter table users
  add column if not exists stripe_customer_id text;

create unique index if not exists users_stripe_customer_id
  on users (stripe_customer_id)
  where stripe_customer_id is not null;

-- ═══ APARECER NA LISTA É OPT-IN, E O PADRÃO É `false` ═══
--
-- Pagar não é consentir em ser publicado. O resto do app já trata assim (resenha nasce
-- privada), e uma lista pública que nasce cheia põe o nome de alguém numa página que ele
-- não pediu, por ter apoiado.
--
-- Quem quiser aparecer marca a caixa em /perfil, e a lista de /contribuidores só mostra
-- quem marcou.
alter table users
  add column if not exists supporter_public boolean not null default false;

-- ═══ ATÉ QUANDO O APOIO AVULSO VALE ═══
--
-- Uma data, e não um contador. Cada pagamento avulso EMPURRA esta data 30 dias para
-- frente a partir do que for maior entre ela e agora, então dois apoios seguidos somam
-- 60 dias em vez de um sobrescrever o outro. Quem apoiou uma vez em janeiro e outra em
-- julho não perde nada, e quem apoiou duas vezes na mesma semana ganha os dois meses.
--
-- Nulo = nunca apoiou avulso. Passado = apoiou, e o tempo acabou. Ninguém precisa passar
-- limpando: a comparação com now() já responde.
alter table users
  add column if not exists avulso_badge_until timestamptz;

-- ─────────────────────────────────────────── as assinaturas

-- O espelho do que o Stripe diz sobre uma assinatura. É espelho, e não fonte: a fonte é
-- o Stripe, e o webhook reconfirma com ele antes de gravar aqui (ver a rota).
create table if not exists stripe_subscription (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references users(id) on delete cascade,

  -- O `sub_...`. Único: uma assinatura do Stripe é uma linha aqui, e reenviar o mesmo
  -- evento atualiza a linha em vez de criar outra.
  stripe_subscription_id text not null unique,

  price_id text not null,

  -- Marcador, Lombada, Capa Dura. Os três dão a MESMA insígnia, e o tier existe só para
  -- a pessoa saber o que ela assinou. Nada no app lê isto para decidir o que alguém pode
  -- fazer, e nada pode passar a ler: apoio não destrava função nenhuma.
  tier text not null check (tier in ('marcador','lombada','capadura')),

  -- O que o Stripe chama de status, cru. Só 'active' e 'trialing' valem insígnia, e essa
  -- regra mora em lib/apoio.ts, e não aqui: um check aqui viraria uma segunda cópia dela.
  status text not null,

  current_period_end timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A pergunta que a insígnia faz, e ela é feita em toda tela que mostra um nome:
-- "esta pessoa tem assinatura viva?"
create index if not exists stripe_subscription_user
  on stripe_subscription (user_id, status);

-- ─────────────────────────────────────────── os apoios avulsos

-- Um pagamento de valor livre. Guardado por HONESTIDADE contábil (quem pagou o quê, e
-- quando), e não para virar número em tela nenhuma.
--
-- O valor NUNCA aparece para ninguém além de quem pagou. A lista de apoiadores não o
-- mostra, não ordena por ele, e não soma. Não existe apoiar mais: é sim ou não.
create table if not exists stripe_one_time_support (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references users(id) on delete cascade,

  -- O `cs_...`. Único, e é ele que torna o webhook idempotente do lado do dado: mesmo
  -- que a trava de evento falhe, gravar a mesma sessão duas vezes esbarra aqui.
  stripe_checkout_session_id text not null unique,

  stripe_payment_intent_id text,

  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'brl',

  created_at timestamptz not null default now()
);

create index if not exists stripe_one_time_support_user
  on stripe_one_time_support (user_id, created_at desc);

-- ─────────────────────────────────────────── a trava contra o evento repetido

-- ═══ O STRIPE REENVIA. É PROJETADO PARA REENVIAR ═══
--
-- Um webhook que demora, uma resposta que se perde na volta, um deploy no meio: o Stripe
-- manda o MESMO evento de novo, e está certo em mandar. Sem esta tabela, um avulso
-- reenviado daria 60 dias de insígnia por um pagamento de 30.
--
-- A linha só entra DEPOIS de o efeito ter sido aplicado, e junto com ele: ou as duas
-- coisas acontecem, ou nenhuma. Marcar o evento antes de aplicar seria pior que não
-- marcar, porque um erro no meio perderia o pagamento para sempre, em silêncio.
create table if not exists stripe_processed_event (
  event_id text primary key,
  created_at timestamptz not null default now()
);

-- A varrida do que já é velho demais para ser reenviado. O Stripe tenta por três dias;
-- guardar por um mês é folgado. Sem isto a tabela cresce para sempre.
create index if not exists stripe_processed_event_created_at
  on stripe_processed_event (created_at);

-- ─────────────────────────────────────────── e a coluna morre

-- Por último, e de propósito: só depois de tudo que ela responde ter para onde ir.
-- Quem lia isto agora chama ehApoiador(), em lib/apoio.ts.
alter table users
  drop column if exists is_supporter;

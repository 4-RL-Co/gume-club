-- ════════════════════════════════════════════════════════════════════
--  A TORNEIRA. A busca vazia deixa de ser um fracasso e vira a lista de
--  compras do catálogo.
--
--  O catálogo do Gume passa a ser CURADO: 300 autores escolhidos a mão
--  (seed/canone.ts), e não meio milhão de fichas que ninguém quis. A conta
--  só fecha se existir um jeito de o catálogo CRESCER por demanda — senão
--  "curado" é só um nome bonito para "faltando".
--
--  Então: toda busca que não acha nada fica registrada aqui. Não é um log
--  de erro. É o pedido de um leitor, e é a fila de qual autor importar em
--  seguida. Um "não achei" é a coisa mais valiosa que um leitor pode nos
--  dizer, e até hoje a gente jogava fora.
--
--  ═══ ELA NÃO GUARDA QUEM PROCUROU ═══
--
--  Não há `user_id` nesta tabela, e a falta dele é DELIBERADA.
--
--  Para decidir qual autor importar em seguida, basta saber O QUE foi
--  procurado e QUANTAS VEZES. Saber QUEM procurou não adiciona nada a essa
--  decisão — e cria, de graça, um histórico de busca por pessoa: a coisa
--  que todo mundo odeia descobrir que existe, e que ninguém pediu.
--
--  Uma tabela que não tem a coluna não pode vazar a coluna. É a única
--  garantia que não depende de alguém lembrar.
--
--  ═══ O CONTADOR AQUI NÃO É RANKING ═══
--
--  `quantas` existe para o bibliotecário decidir a ordem do trabalho dele.
--  Ele NÃO aparece em tela de leitor, não ordena busca, e não vira "mais
--  procurados": isso seria algoritmo de popularidade, que é o que o Gume
--  recusa. A fila é ferramenta de quem trabalha, e não vitrine.
-- ════════════════════════════════════════════════════════════════════

create table if not exists buscas_vazias (
  id uuid primary key default gen_random_uuid(),

  -- O que a pessoa digitou, como digitou. É o que o bibliotecário vai LER.
  texto text not null,

  -- A mesma coisa sem acento, sem maiúscula e sem espaço sobrando. "Tolstói",
  -- "tolstoi" e "TOLSTOI  " são UM pedido, e não três: se fossem três, a fila
  -- encheria de repetição e o pedido de verdade afundaria no meio.
  canonico text not null,

  -- Quantas vezes pediram. Sem quem pediu. Ver o cabeçalho.
  quantas integer not null default 1,

  primeira_em timestamptz not null default now(),
  ultima_em timestamptz not null default now(),

  -- Quando alguém importou o autor / cadastrou o livro e fechou o pedido.
  -- É uma DATA, e não um delete: a fila resolvida é o histórico de como o
  -- catálogo cresceu, e apagá-la seria apagar a única prova de que a torneira
  -- funciona.
  atendida_em timestamptz,
  atendida_por uuid references users(id) on delete set null
);

-- Um pedido por texto. O `on conflict` do lib/torneira.ts depende deste índice:
-- é ele que transforma a segunda busca por "tolstoi" num +1, e não numa linha nova.
create unique index if not exists buscas_vazias_canonico_key
  on buscas_vazias (canonico);

-- A fila do bibliotecário: o que mais gente pediu, e ainda não foi atendido.
create index if not exists buscas_vazias_fila_idx
  on buscas_vazias (quantas desc, ultima_em desc)
  where atendida_em is null;

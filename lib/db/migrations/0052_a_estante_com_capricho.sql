-- A ESTANTE INVENTADA VIRA UMA PEÇA DE CURADORIA INTEIRA.
--
-- Ela já tinha nome, descrição e visibilidade; `collection_items` já tinha `position`
-- desde o começo, e nenhuma tela escrevia nele: as estantes eram desordenadas na
-- prática. Esta migration completa o que faltava para a estante ser uma LISTA de
-- verdade, do jeito que quem ama curadoria monta: com ordem quando a ordem é o ponto,
-- e guardável quando ela é boa.
--
-- ═══ NUMERADA É ESCOLHA POR ESTANTE ═══
--
-- "Meus dez favoritos" tem um 1º e um 2º; "terror brasileiro" é só um conjunto.
-- Obrigar toda estante a ter números transformaria toda coleção num pódio, inclusive
-- as que não são. Então a ordem numerada é uma escolha de quem monta, estante por
-- estante.
alter table collections
  add column if not exists ranked boolean not null default false;

-- ═══ GUARDAR A ESTANTE DE OUTRA PESSOA ═══
--
-- Guardar é endosso, e endosso vira placar no dia em que alguém conta. Esta tabela
-- existe para UMA pergunta ("quais estantes você guardou?") e NUNCA responde a outra
-- ("quantas pessoas guardaram esta?"). Não há contador em tela nenhuma, e um teste
-- varre o código para que nenhuma consulta conte por aqui. Ver lib/listas.ts.
create table if not exists collection_saves (
  user_id uuid not null references users(id) on delete cascade,
  collection_id uuid not null references collections(id) on delete cascade,
  saved_at timestamptz not null default now(),

  -- Guardar duas vezes é guardar uma: a chave é o par.
  primary key (user_id, collection_id)
);

-- Para o cascade e para "esquecer" serem baratos. NÃO existe índice pensado para
-- contagem, porque contagem não existe.
create index if not exists collection_saves_col_idx
  on collection_saves (collection_id);

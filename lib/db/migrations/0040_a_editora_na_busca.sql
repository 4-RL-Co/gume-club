-- ════════════════════════════════════════════════════════════════════
--  A EDITORA ENTRA NA BUSCA.
--
--  "memorias postumas bras cubas antofagica" não trazia a edição da Antofágica em
--  primeiro. Trazia um estudo crítico SOBRE o livro, e depois duas fichas sem autor.
--
--  Duas coisas estavam erradas, e as duas pela mesma razão: **a busca não sabia que
--  "antofagica" era uma editora.**
--
--    1. A palavra entrava na comparação do TÍTULO e derrubava a nota. "Memórias
--       Póstumas de Brás Cubas" casa mal com uma frase que tem uma palavra a mais
--       que não está nele.
--
--    2. E, mesmo achando o livro, o app escolhia uma edição qualquer para mostrar —
--       quando a pessoa tinha DITO qual queria.
--
--  Uma pessoa lê aquela frase como duas coisas: o livro, e a editora. A busca passa a
--  ler igual.
--
--  ═══ POR QUE UM ÍNDICE, E NÃO UM `LIKE` ═══
--
--  São 74.625 editoras distintas. Descobrir, a cada tecla, se alguma delas aparece no
--  que a pessoa digitou é uma varredura completa — e a busca responde a cada tecla.
--
--  O mesmo remédio do título e do autor: trigrama, GIN, e a função imutável que já
--  existe. Sem `immutable_unaccent`, "antofagica" não acha "Antofágica".
-- ════════════════════════════════════════════════════════════════════

create index if not exists editions_publisher_trgm_idx
  on editions using gin (immutable_unaccent(lower(publisher)) gin_trgm_ops)
  where publisher is not null;

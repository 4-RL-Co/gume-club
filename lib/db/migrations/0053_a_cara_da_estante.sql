-- A CARA DA ESTANTE É UM LIVRO DELA, escolhido por quem montou.
--
-- O card e a aura da estante usavam sempre o primeiro livro. Agora quem monta
-- escolhe qual capa representa a coleção, e a escolha é POR REFERÊNCIA a um livro
-- que está nela: sem upload de imagem solta. Uma imagem livre na vitrine do
-- explorar seria a única superfície do app onde qualquer um põe qualquer coisa na
-- tela de todo mundo sem passar por bibliotecário (a capa de edição passa, ver
-- cover_proposals). A capa de catálogo já foi curada; apontar para ela é seguro.
--
-- `on delete set null`: se o livro sair do catálogo, a estante volta ao primeiro.
alter table collections
  add column if not exists cover_work_id uuid references works(id) on delete set null;

-- A FOTO DA ESTANTE, subida por quem montou.
--
-- A migration 0053 deu à estante uma cara POR REFERÊNCIA (um livro dela), e o dono
-- do Gume pediu mais: uma imagem própria, como as listas do Letterboxd têm, para a
-- página da estante ser um espaço com a cara de quem montou.
--
-- A superfície de risco é a mesma que o retrato de perfil já abriu faz tempo: o
-- upload passa pelo MESMO funil (/api/upload: logado, tipo pelos primeiros bytes,
-- nome gerado no servidor, teto de tamanho), e quem sobe imagem imprópria é gente
-- com nome, denunciável e banível como em qualquer outra superfície.
alter table collections
  add column if not exists cover_url text;

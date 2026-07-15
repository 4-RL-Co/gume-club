-- ════════════════════════════════════════════════════════════════════
--  NINGUÉM CONSEGUE MARCAR UM VOLUME DE MANGÁ COMO LIDO.
--
--  Os 2.797 volumes de mangá do acervo têm **zero edições**. Nenhuma.
--
--  E a estante de uma pessoa não guarda uma OBRA: ela guarda a EDIÇÃO que a pessoa leu
--  — o exemplar, com a editora e o ISBN dele. Uma obra sem nenhuma edição não pode
--  entrar na estante de ninguém.
--
--  Ou seja: a tela de coleção existe, a prateleira desenha os 41 volumes de Berserk, o
--  botão de adicionar volume funciona… e **nenhum volume podia ser lido.** A coleção
--  inteira era decorativa.
--
--  ═══ COMO ISSO PASSOU ═══
--
--  Os volumes vieram do AniList, que sabe a SÉRIE e a lista de volumes — e não sabe
--  quem publica no Brasil, nem o ISBN, nem a capa da edição brasileira. O seed criou as
--  obras, e a edição ficou para a raspagem da Panini e da JBC, que ficou parada.
--
--  Só que uma obra sem edição não é "uma obra à espera de dado": é uma obra que não
--  funciona. O buraco só apareceu quando o ELO precisou contar quantos volumes alguém
--  leu, e a resposta foi zero para todo mundo, para sempre.
--
--  ═══ A EDIÇÃO QUE ISTO CRIA ═══
--
--  Uma por volume, com a editora da coleção (quando a coleção sabe) e **nada mais**.
--  Sem ISBN inventado, sem capa inventada, sem ano inventado.
--
--  Um ISBN falso seria muito pior do que um ISBN ausente: ele é o único identificador
--  que uma pessoa tem na mão, e um ISBN errado no acervo contamina toda importação e
--  toda busca por código de barras daqui para a frente. Campo vazio é um buraco; campo
--  errado é uma mentira.
--
--  Quando a raspagem da Panini e da JBC rodar, ela PREENCHE estas edições (ISBN, capa,
--  ano) em vez de criar outras. Ver lib/lojas.ts.
-- ════════════════════════════════════════════════════════════════════

insert into editions (work_id, publisher, format)
select w.id,
       -- A editora da coleção, quando a coleção tem uma. As coleções que vieram do
       -- AniList não têm — e `null` aqui é honesto: a gente não sabe.
       nullif(c.publisher, ''),
       'paperback'
  from works w
  join colecoes c on c.id = w.colecao_id
 where w.forma = 'quadrinho'
   -- Idempotente: quem já tem edição não ganha outra. Rodar duas vezes não duplica.
   and not exists (select 1 from editions e where e.work_id = w.id);

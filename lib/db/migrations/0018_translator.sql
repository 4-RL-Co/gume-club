-- O tradutor é um dado de EDIÇÃO, e ele faltava. Numa tradução, quem traduz é
-- metade do livro que você tem na mão, e o catálogo não sabia dizer quem era.
--
-- Esta coluna nasceu numa migration que JÁ TINHA SIDO APLICADA, e eu a editei em
-- vez de criar uma nova. O Drizzle não reaplica um arquivo já rodado, então a
-- coluna passou a existir no repositório e a não existir no banco: o teste
-- quebrou com "column translator does not exist", que é a forma mais barata de
-- descobrir isso. A forma cara é descobrir em produção.
--
-- Migration aplicada é história. História não se edita: se acrescenta.

alter table editions add column if not exists translator text;

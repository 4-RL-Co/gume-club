-- ════════════════════════════════════════════════════════════════════
--  O EMBLEMA NUNCA GRAVOU. A trava de target_type não sabia da coleção.
--
--  A migration 0011 travou "revisions.target_type" em ('work','edition','author'),
--  muito antes de coleção existir. A 0060 deu à coleção um emblema e um jeito de
--  qualquer leitor pô-lo — `porEmblema()`, em lib/conjuntos.ts — e essa função
--  grava a mudança em `revisions` com `target_type = 'colecao'`.
--
--  Nenhuma das duas olhou para a outra. O resultado: toda chamada a porEmblema()
--  quebra com uma violação de constraint, sempre, desde que a função nasceu — e
--  nenhum teste chamava porEmblema() contra um banco de verdade para acusar isso.
--  O comentário de 0060 descreve o emblema em detalhe e nunca imaginou que ele não
--  gravava: a mesma classe de bug do teto de caracteres, com outra roupa.
--
--  ligarAoConjunto()/soltarDoConjunto() gravam com target_type = 'work' e por isso
--  nunca bateram nesta trava — é por isso que "ligar um volume" sempre funcionou e
--  "pôr o emblema" nunca funcionou, e ninguém tinha como notar a diferença olhando
--  a tela: as duas ações moram no mesmo formulário.
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE "revisions" DROP CONSTRAINT IF EXISTS "revisions_target_type_check";
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_target_type_check"
  CHECK ("target_type" IN ('work','edition','author','colecao'));

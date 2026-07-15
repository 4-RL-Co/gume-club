-- ════════════════════════════════════════════════════════════════════
--  DOAR, TROCAR E EMPRESTAR SAEM DO GUME.
--
--  "Tire a função de doar, trocar e emprestar do app, acho que tá demais."
--
--  Está certo. O Gume é um registro de leitura, e essas três coisas o empurravam para
--  ser um lugar de **transação entre pessoas** — com contato pessoal, combinado, encontro
--  e tudo o que vem junto quando estranhos precisam se acertar sobre um objeto.
--
--  Isso traz um peso de moderação e de responsabilidade que nada no app estava pronto
--  para carregar. E o pior é que ele traz esse peso mesmo quando dá certo.
--
--  ═══ O QUE SAI ═══
--
--    available_for   o anúncio: "posso doar / trocar / emprestar este exemplar"
--    came_from       a corrente: "este livro veio da estante do Rui"
--    contact_kind    o canal para combinar (WhatsApp, Instagram, Telegram, e-mail).
--    contact_value   Ele existia SÓ para isto, e sem isto ele não protege ninguém:
--                    um campo de contato guardado sem motivo é um campo de contato
--                    esperando um vazamento.
--
--  E a insígnia de **semeador** morre junto: ela era dada por quem RECEBEU um livro, e
--  ninguém mais recebe. Insígnias vão de oito para sete.
--
--  ═══ O QUE FICA, E POR QUÊ ═══
--
--  A tabela `owned_copies` continua, com `state` e `acquired_note`.
--
--  "Tenho este livro em papel, e ganhei da minha irmã em 2019" não é um anúncio: é a
--  HISTÓRIA de um exemplar, e é uma das coisas mais bonitas que este app guarda. Ela
--  nunca dependeu de o livro estar à venda, à troca ou à disposição de ninguém.
-- ════════════════════════════════════════════════════════════════════

alter table owned_copies
  drop column if exists available_for,
  drop column if exists came_from;

alter table users
  drop column if exists contact_kind,
  drop column if exists contact_value;

-- O tipo do anúncio, e o do canal de contato. Sem coluna que os use, eles são lixo que
-- fica no banco parecendo uma promessa.
drop type if exists availability;
drop type if exists contact_kind;

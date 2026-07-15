-- FATIA 5: A LINHAGEM DA CÓPIA. É a parte que nenhum app tem.
--
-- Quando a cópia muda de mãos, o novo dono registra DE QUEM ela veio. A
-- procedência deixa de ser texto solto ("presente da minha irmã") e vira uma
-- CORRENTE: um exemplar que atravessa cinco estantes e carrega o nome de cada
-- uma é a comunidade virando literal.
--
-- O leitor já tinha linhagem (users.invited_by, quem trouxe quem). Agora o livro
-- tem também. Custa uma coluna, e não precisa de moderação nenhuma.
--
-- Respeita visibility: elo de estante privada não aparece, e a corrente para ali.

alter table owned_copies
  add column if not exists came_from uuid references users(id) on delete set null;

create index if not exists owned_copies_came_from on owned_copies (came_from);

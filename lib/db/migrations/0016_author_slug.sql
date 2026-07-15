-- O autor ganha endereço público.
--
-- Ele existia como uma linha do catálogo e um nome numa lista, e nunca como um
-- LUGAR. A busca precisa disso: quem digita "machado de assis" quer o autor, e
-- não uma lista de livros que por acaso têm o nome dele no título.
--
-- O slug é imutável depois de gerado, como o do livro: é o endereço público, e
-- corrigir um acento no nome não pode quebrar um link que alguém guardou.

alter table authors add column if not exists slug citext;

-- Gerado do nome: minúscula, sem acento, e o que não é letra nem número vira
-- hífen. Homônimo ganha sufixo, e o critério de desempate é a ordem de criação,
-- que é estável: rodar de novo não embaralha quem é quem.
with base as (
  select id,
         trim(both '-' from
           regexp_replace(
             lower(immutable_unaccent(name)),
             '[^a-z0-9]+', '-', 'g'
           )
         ) as raiz,
         row_number() over (
           partition by trim(both '-' from
             regexp_replace(lower(immutable_unaccent(name)), '[^a-z0-9]+', '-', 'g'))
           order by created_at, id
         ) as n
    from authors
)
update authors a
   set slug = case
     when base.raiz = '' then 'autor-' || left(a.id::text, 8)
     when base.n = 1 then base.raiz
     else base.raiz || '-' || base.n
   end
  from base
 where base.id = a.id
   and a.slug is null;

alter table authors alter column slug set not null;

create unique index if not exists authors_slug_key on authors (slug);

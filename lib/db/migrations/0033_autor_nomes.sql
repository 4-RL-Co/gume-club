-- ════════════════════════════════════════════════════════════════════
--  O NOME DO AUTOR NA TELA, E OS NOMES POR QUE ELE É PROCURADO.
--
--  A Open Library guarda "Лев Толстой". Em cirílico. E guarda o mangaká em
--  kanji: "三浦建太郎".
--
--  Recarregar o autor sem resolver isso trocaria um problema por outro: em
--  vez de o Gume não saber quem escreveu Guerra e Paz, ele mostraria
--  "Лев Толстой" na estante de um leitor brasileiro — e a busca por
--  "Tolstói" continuaria não achando nada.
--
--  Um conserto que só aparece no banco não é um conserto.
--
--  ═══ DUAS COISAS DIFERENTES, E POR ISSO DUAS COLUNAS ═══
--
--  `name` é o nome que vai para a TELA. Alfabeto latino, sempre que existir
--  um. A Open Library dá três candidatos (`name`, `personal_name`,
--  `alternate_names`), e a regra escolhe entre eles em lib/nomes.ts.
--
--  `alt_names` são os nomes por que ele é PROCURADO, e mais nada. O cirílico
--  entra aqui. O kanji entra aqui. A grafia inglesa ("Leo Tolstoy") entra
--  aqui. Ninguém os vê; eles só fazem a busca encontrar.
--
--  Separar as duas é o que permite mostrar "Liev Tolstói" para o leitor E
--  achar o livro quando ele digita "Tolstoy", "Толстой" ou "Lev".
-- ════════════════════════════════════════════════════════════════════

alter table authors
  add column if not exists alt_names text[] not null default '{}';

/*
 * O índice de trigrama sobre os sinônimos, achatados numa string só.
 *
 * `array_to_string` NÃO é marcada como IMMUTABLE pelo Postgres (ela aceita um
 * separador nulo, e isso a deixa STABLE), e o Postgres recusa indexar expressão que
 * não seja imutável. Daí o invólucro: uma função que faz exatamente a mesma coisa e
 * se declara imutável, porque para o nosso uso — separador fixo — ela é.
 *
 * Sem o índice, procurar "Tolstoy" varreria as 160 mil linhas de autor a cada tecla,
 * e a busca por autor já é a mais cara do app.
 */
create or replace function alt_texto(nomes text[])
returns text
language sql
immutable
parallel safe
as $$ select coalesce(array_to_string(nomes, ' '), '') $$;

create index if not exists authors_alt_names_trgm
  on authors using gin (
    immutable_unaccent(lower(alt_texto(alt_names))) gin_trgm_ops
  );

/*
 * De onde veio o autor desta obra.
 *
 * O import lia o autor do registro de EDIÇÃO, que em português quase nunca traz um —
 * e quando traz, traz o TRADUTOR. Daí 43.739 obras sem autor e o Drácula da Martin
 * Claret assinado por "jaime arbe".
 *
 * Esta coluna registra a procedência, para que o próximo bug do mesmo tipo seja
 * VISÍVEL: dá para contar quantas obras têm autor vindo da edição (suspeito) contra
 * quantas têm autor vindo da obra (confiável).
 */
do $$
begin
  if not exists (select 1 from pg_type where typname = 'author_source') then
    create type author_source as enum ('work', 'edition', 'manual', 'unknown');
  end if;
end $$;

alter table works
  add column if not exists author_source author_source not null default 'unknown';

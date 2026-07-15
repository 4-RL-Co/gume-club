-- ════════════════════════════════════════════════════════════════════
--  UM MANGÁ NÃO É UM ROMANCE, E O ELO PRECISA SABER DISSO.
--
--  O Gume vai ter ELO — Ferro, Bronze, Prata, e por aí — pelo número de livros
--  lidos na vida. E aí a aritmética da nossa própria regra vira um problema:
--
--      "cada volume é um LIVRO"        ← decisão já tomada, e ela está certa
--
--      Bleach ...... 74 volumes  =  74 livros
--      Naruto ...... 72 volumes  =  72 livros
--      Guerra e Paz ..........   =   1 livro
--
--  Quem lê mangá chega a Diamante enquanto quem lê Dostoiévski fica no Ferro. Não é
--  filosofia: é conta.
--
--  A saída não é punir ninguém — é **duas escadas**. Um elo de literatura e um elo de
--  quadrinhos, cada um com o seu ritmo e a sua moldura. É o que o LoL faz com filas
--  separadas: ninguém compara solo com flex.
--
--  ═══ POR QUE UMA COLUNA, E NÃO UM JOIN ═══
--
--  Dava para descobrir a forma de uma obra assim:
--
--      works → colecoes → series → series.kind = 'manga'
--
--  Três tabelas para responder "isto é um mangá?". Isso é caro no perfil de todo mundo,
--  e é FRÁGIL: no dia em que entrar uma HQ que não veio de uma coleção, ou uma série de
--  romances que veio, a cadeia dá a resposta errada em silêncio.
--
--  A forma de uma obra é um FATO sobre ela, e fato mora na linha dela.
-- ════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_type where typname = 'forma_da_obra') then
    /*
     * 'livro'      romance, ensaio, poesia, biografia. O padrão.
     * 'quadrinho'  mangá, HQ, graphic novel. Um volume, e não uma obra inteira.
     *
     * Duas formas, e não cinco. "Livro ilustrado", "light novel" e "revista em
     * quadrinhos" seriam categorias bonitas e inúteis: elas não mudam a resposta da
     * ÚNICA pergunta que esta coluna existe para responder — em qual escada esta
     * leitura conta.
     */
    create type forma_da_obra as enum ('livro', 'quadrinho');
  end if;
end $$;

alter table works
  add column if not exists forma forma_da_obra not null default 'livro';

/*
 * O que já está no acervo. Toda obra que pertence a uma coleção de uma série de
 * mangá é um quadrinho — é de lá que os 2.797 volumes vieram (AniList, Panini, JBC).
 */
update works w
   set forma = 'quadrinho'
  from colecoes c
  join series s on s.id = c.series_id
 where c.id = w.colecao_id
   and s.kind = 'manga'
   and w.forma <> 'quadrinho';

/*
 * O ÍNDICE. O perfil de cada pessoa vai perguntar "quantos livros e quantos quadrinhos
 * esta pessoa leu" — e essa pergunta roda em toda visita a um perfil, e no feed.
 */
create index if not exists works_forma_idx on works (forma) where forma = 'quadrinho';

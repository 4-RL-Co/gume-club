-- ════════════════════════════════════════════════════════════════════
--  A SINOPSE DA OBRA, E O ROSTO DO AUTOR.
--
--  O acervo tem 126.695 autores. ZERO com foto. ZERO com biografia. As colunas
--  existem desde a migration 0025 e nunca foram preenchidas.
--
--  E as obras não têm sinopse nenhuma: a página de um livro mostra título, autor e
--  capa, e mais nada. Um leitor que não conhece o livro não tem como decidir se
--  quer lê-lo.
--
--  ═══ DE ONDE VEM, E POR QUE ISSO PRECISA ESTAR GRAVADO ═══
--
--  O Gume promete publicar um dataset **CC0**. Uma promessa dessas só vale se der
--  para AUDITAR — e para auditar é preciso saber, campo a campo, de onde o texto
--  veio e sob qual licença.
--
--  Sem estas colunas, o dataset seria uma promessa que ninguém pode conferir. E
--  uma promessa que ninguém pode conferir é a definição de propaganda.
--
--    'openlibrary'  o dump da Open Library. O dado dela é CC0. Entra no dataset.
--    'wikidata'     descrição do Wikidata. CC0. Entra no dataset.
--    'wikipedia'    trecho da Wikipédia. **CC-BY-SA**, e não CC0: exige atribuição
--                   e obriga quem reusar a manter a mesma licença. Aparece na TELA,
--                   com crédito e link — e **fica FORA do dataset CC0**.
--    'gume'         escrito por um bibliotecário daqui. É nosso, e é CC0.
--
--  A licença não é burocracia: é a diferença entre um bem comum e um roubo educado.
--
--  ═══ O QUE NÃO ENTRA, E NÃO VAI ENTRAR ═══
--
--  Sinopse de loja (Panini, Amazon, Companhia das Letras). Ela é texto autoral, com
--  direito — e pôr texto protegido num dataset CC0 é relicenciar o que não é nosso.
--
--  É a mesma linha do ai/PRD.md, e ela não se move: **fato pode vir de qualquer
--  fonte; OBRA de terceiro, não.**
-- ════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_type where typname = 'texto_fonte') then
    create type texto_fonte as enum ('openlibrary', 'wikidata', 'wikipedia', 'gume');
  end if;
end $$;

-- ─────────────────────────────────────────────────────── a obra

alter table works
  /*
   * A SINOPSE. O que o livro é, em um parágrafo.
   *
   * Não é resenha, e não é opinião: resenha é o que o LEITOR escreve, e é o produto
   * deste app. A sinopse é a apresentação da obra, e ela existe para quem ainda não
   * decidiu se quer ler.
   */
  add column if not exists description text,
  add column if not exists description_source texto_fonte;

-- ─────────────────────────────────────────────────────── o autor

alter table authors
  add column if not exists bio_source texto_fonte,
  add column if not exists image_source texto_fonte,

  /*
   * O QID do Wikidata. É a ponte para o país, a foto e a descrição — e a Open Library
   * já o guarda em `remote_ids.wikidata`.
   *
   * Guardá-lo aqui poupa uma consulta por autor para sempre, e é o que torna a
   * nacionalidade (hoje nula em 100% das linhas) possível de preencher.
   */
  add column if not exists wikidata_id text;

create index if not exists authors_wikidata_idx on authors (wikidata_id)
  where wikidata_id is not null;

/*
 * A FOTO É POR REFERÊNCIA, como a capa. `image_url` guarda o ENDEREÇO.
 *
 * A foto de um autor é obra de um fotógrafo. A gente mostra da origem (Open Library ou
 * Wikimedia Commons) e nunca copia o arquivo — mostrar não é republicar. Ver ai/PRD.md.
 */

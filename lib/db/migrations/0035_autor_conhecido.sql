-- ════════════════════════════════════════════════════════════════════
--  OBRA COM AUTOR CONHECIDO E NÃO GRAVADO.
--
--  Não é a mesma coisa que obra sem autor, e a diferença é a diferença entre
--  podar entulho e apagar Madame Bovary.
--
--  ═══ COMO ELAS APARECEM ═══
--
--  `works_title_author_volume` é UNIQUE **NULLS NOT DISTINCT**. Quando o
--  backfill vai gravar "Flaubert" numa obra chamada "Madame Bovary", e o acervo
--  JÁ TEM outra "Madame Bovary" do Flaubert — porque o import duplicou a obra —,
--  a escrita colide, e o backfill pula.
--
--  A obra fica com `author_id` nulo. Mas a Open Library SABE de quem ela é: a
--  gente é que não conseguiu escrever.
--
--  ═══ POR QUE ISTO PRECISA DE UMA TABELA ═══
--
--  A régua da poda A é "sem autor E sem capa E sem ISBN". Uma obra que caiu na
--  colisão parece, para essa régua, uma obra sem autor — e seria apagada.
--
--  Seria o MESMO erro do Madame Bovary, voltando pela porta dos fundos: apagar um
--  livro que a Open Library sabe de quem é, porque a NOSSA ficha não sabe.
--
--  Autor conhecido, ainda que não gravado, é autor conhecido. A poda exclui todas
--  estas, sem exceção.
--
--  ═══ E ELA GUARDA O NOME, E NÃO SÓ A MARCA ═══
--
--  Porque isto não é só um marcador: é a LISTA DE TRABALHO da fusão de obras
--  duplicadas. Cada linha aqui diz "esta obra é do Flaubert, e existe outra igual
--  a ela no acervo". É exatamente o que quem for fundir precisa saber.
-- ════════════════════════════════════════════════════════════════════

create table if not exists autor_conhecido_nao_gravado (
  work_id uuid primary key references works(id) on delete cascade,

  -- Quem a Open Library diz que é o autor. O nome já passou pelo portão
  -- (lib/autores.ts) e pela escolha de grafia latina (lib/nomes.ts).
  nome text not null,

  -- Por que não deu para gravar. Hoje só existe um motivo, e escrever o motivo
  -- é o que impede que o segundo motivo entre aqui em silêncio.
  motivo text not null default 'colidiu com obra duplicada',

  quando timestamptz not null default now()
);

/*
 * A poda vai consultar esta tabela em toda linha, e uma poda que varre 373 mil obras
 * sem índice aqui vira uma poda que ninguém tem paciência de rodar.
 */
create index if not exists autor_conhecido_nome_idx
  on autor_conhecido_nao_gravado (nome);

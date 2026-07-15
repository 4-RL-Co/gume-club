-- ════════════════════════════════════════════════════════════════════
--  ETIQUETA NÃO É AUTOR. Ela vira NULO.
--
--  O acervo tem, AGORA, no ar:
--
--      Brazil                    1.462 obras
--      Portugal                    992 obras
--      Portugal.                   660 obras
--      [author not identified]     554 obras
--      invalid author ID           248 obras
--
--  Existe uma página /autor/portugal. "Brazil" conta como um autor que você leu
--  na página de estatísticas. A busca por autor devolve os dois.
--
--  ═══ POR QUE A ETIQUETA É PIOR QUE O NULO ═══
--
--  Um nulo a gente CONTA, VÊ e CONSERTA: ele aparece na medição, ele aparece no
--  canário (lib/acervo.sql.test.ts), e ele é uma tarefa.
--
--  A etiqueta se DISFARÇA de autor de verdade. Ela passa por pessoa em toda
--  contagem, em toda busca e em toda poda — e foi exatamente ela que fez a poda
--  achar que Madame Bovary tinha autor, e por pouco não apagou Madame Bovary por
--  não reconhecer o Flaubert.
--
--  ═══ O QUE ESTA MIGRATION FAZ, E O QUE ELA NÃO FAZ ═══
--
--  Ela NÃO apaga obra nenhuma. Ela tira a máscara: a obra continua lá, com o
--  autor NULO, e o `scripts/backfill-authors.mjs` vai procurar o autor de verdade
--  no dump de obras da Open Library.
--
--  A linha de autor em si é apagada, porque uma linha chamada "Portugal." sem
--  nenhuma obra é uma página de autor vazia com um endereço público.
--
--  O portão que impede isso de voltar é lib/autores.ts, e o `pnpm audit:security`
--  quebra o build se alguém escrever em `authors` por fora dele.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────── quem é etiqueta

create temp table etiquetas as
  select a.id, a.name
    from authors a
   where
     -- as etiquetas da Open Library
     lower(btrim(a.name, ' .')) in (
       'author not identified', '[author not identified]',
       'publisher not identified', '[publisher not identified]',
       'invalid author id', 'not avail', 'unknown', 'unknown author', 'no author',
       'anonymous', 'anonimo', 'anônimo', 'autor desconhecido', 'desconhecido',
       'various', 'various authors', 'diversos', 'diversos autores',
       'varios', 'varios autores', 'vários autores', 'vv aa', 'vvaa', 'aa vv',
       's n', 'sn', 'n a', 'sine nomine'
     )
     -- país e instituição. É PREFIXO: a Open Library escreve
     -- "Portugal. Sovereign (1777-1816 : Maria I)" e "Brazil. Ministério da Justiça".
     --
     -- E o prefixo exige um SEPARADOR depois, senão "Alberto Portugal" cairia junto —
     -- e ele é gente.
     or immutable_unaccent(lower(a.name)) in ('brazil', 'brasil', 'portugal')
     or immutable_unaccent(lower(a.name)) ~ '^(brazil|brasil|portugal)[.,: ]';

-- ─────────────────────────────────────────────────────── a máscara cai

/*
 * A obra FICA. Só o autor falso sai.
 *
 * Depois disto, o canário (lib/acervo.sql.test.ts) vai contar essas obras como órfãs —
 * e é isso que a gente quer: elas SEMPRE foram órfãs, e agora elas aparecem.
 *
 * ═══ AS 77 QUE NÃO DÁ PARA SOLTAR AGORA ═══
 *
 * `works_title_author_volume` é UNIQUE **NULLS NOT DISTINCT**: para o Postgres, dois
 * nulos são IGUAIS. Ou seja, duas obras com o mesmo título, ambas assinadas por
 * "Brazil", ao virarem autor-nulo passam a colidir entre si.
 *
 * São 77 grupos de título — quase todos documento oficial repetido ("Diário Oficial",
 * "Constituição"). Elas são, quase certamente, obras DUPLICADAS que deviam ser fundidas.
 *
 * Mas fundir obra é apagar obra, e esta migration não apaga obra nenhuma. Ela solta as
 * que dá para soltar, e deixa as 77 visíveis para uma decisão tomada acordado. O
 * `where not exists` abaixo é isso: ele pula o grupo em vez de o build morrer.
 */
update works w
   set author_id = null,
       author_source = 'unknown'
 where w.author_id in (select id from etiquetas)
   -- Só solta se NENHUMA outra obra já ocupar (título, nulo, volume). Senão, colide.
   and not exists (
     select 1 from works outra
      where outra.id <> w.id
        and outra.title = w.title
        and outra.volume is not distinct from w.volume
        and (outra.author_id is null or outra.author_id in (select id from etiquetas))
   );

-- ─────────────────────────────────────────────────────── e a página some

/*
 * A linha de autor vai embora — mas SÓ a que ficou sem nenhuma obra.
 *
 * Uma página /autor/portugal sem nenhuma obra é um endereço público que não devia
 * existir. E a que ainda segura uma das 77 obras que colidem fica de pé, visível, até
 * alguém decidir o que fazer com elas. Melhor uma etiqueta que a gente SABE que está lá
 * do que uma obra apagada em silêncio.
 *
 * `works.author_id` é `on delete set null`, então nenhuma obra seria levada junto de
 * qualquer jeito.
 */
delete from authors a
 where a.id in (select id from etiquetas)
   and not exists (select 1 from works w where w.author_id = a.id);

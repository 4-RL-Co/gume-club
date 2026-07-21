-- O ANO BASTA. Quem leu em 2019 não lembra o dia, e não devia ter que inventar um.
--
-- O campo de data pedia dia, mês e ano para uma pergunta que quase sempre se responde
-- com um número: "li em 2019". Quem não lembrava o dia escolhia um qualquer, e o banco
-- passava a guardar uma precisão que nunca existiu.
--
-- ═══ POR QUE UMA COLUNA DE PRECISÃO, E NÃO SÓ O 1º DE JANEIRO ═══
--
-- Guardar "2019" como 2019-01-01 sem mais nada faz o app perder a diferença entre
-- QUEM LEU EM 2019 e QUEM TERMINOU NO DIA 1º DE JANEIRO. São coisas diferentes, e a
-- segunda é uma afirmação que o leitor nunca fez.
--
-- E tem uma conta que depende disso: "a paciência" (lib/stats.ts) mede quantos dias um
-- livro esperou na estante antes de ser lido. Com um 1º de janeiro inventado, ela conta
-- errado e ninguém percebe. Com a precisão registrada, ela simplesmente IGNORA as
-- leituras marcadas só com o ano, em vez de mentir.
--
-- ═══ NADA SE PERDE ═══
--
-- As datas completas que o importador trouxe do Goodreads, do StoryGraph e do Skoob
-- continuam com dia e mês, e nascem com precisão 'day'. O README promete importar sem
-- perdas, e esta migration não tira nada de ninguém.
--
-- São DUAS colunas porque uma leitura tem duas pontas independentes: você pode saber o
-- dia em que começou e só o ano em que terminou. O fim é um só (terminado OU abandonado,
-- garantido pelo check readings_one_ending), então uma coluna cobre os dois.
alter table readings
  add column if not exists started_precision text not null default 'day',
  add column if not exists ended_precision   text not null default 'day';

-- Só dois valores existem, e o banco recusa qualquer outro: uma precisão inventada é
-- pior que precisão nenhuma, porque a tela passa a decidir no chute como exibir.
alter table readings
  drop constraint if exists readings_started_precision_ck;
alter table readings
  add constraint readings_started_precision_ck
  check (started_precision in ('day', 'year'));

alter table readings
  drop constraint if exists readings_ended_precision_ck;
alter table readings
  add constraint readings_ended_precision_ck
  check (ended_precision in ('day', 'year'));

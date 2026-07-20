-- O ÚLTIMO DIA EM QUE A PESSOA APARECEU.
--
-- Uma DATA, e não um relógio: ela responde "a pessoa voltou?", e nada mais. Ativos na
-- semana, ativos no mês, e a retenção (quem se cadastrou e ainda aparece). Não guarda a
-- hora, não guarda a página, não guarda o que a pessoa fez. É a fronteira entre saber se
-- o projeto está vivo e vigiar leitor, e ela fica do lado de cá de propósito.
--
-- Preenchida no máximo uma vez por dia, no funil por onde tudo passa (getViewer), na data
-- de São Paulo, e nunca em UTC: um "ativo hoje" agrupado no fuso errado erra na virada do
-- dia, que é o mesmo bug que a data de leitura já sofreu. Ver lib/viewer.ts e lib/datas.ts.
--
-- Nasce nula: quem já tinha conta antes desta coluna não tem um último dia registrado até
-- voltar. Contar retenção a partir de agora é honesto; inventar um passado não seria.
alter table users add column if not exists last_seen_on date;

-- A vista do painel privado pergunta "quem apareceu nos últimos 7 e 30 dias". Um índice
-- parcial (só quem tem a coluna preenchida) mantém isso barato conforme a base cresce, sem
-- pesar em quem nunca voltou.
create index if not exists users_last_seen_idx
  on users (last_seen_on)
  where last_seen_on is not null;

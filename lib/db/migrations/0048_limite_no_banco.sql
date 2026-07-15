-- ════════════════════════════════════════════════════════════════════
--  O LIMITE DE TENTATIVAS SAI DA MEMÓRIA E VAI PARA O BANCO.
--
--  ═══ POR QUE ELE NÃO PODIA FICAR ONDE ESTAVA ═══
--
--  O rate limit morava num `Map` na memória do processo. Isso estava CERTO enquanto o
--  Gume ia rodar num servidor só: um processo, um balde, uma contagem.
--
--  O deploy vai ser em serverless (Vercel). Lá não existe "o processo": existe um
--  processo NOVO, ou um de uma dúzia que estavam mornos, a cada requisição. O balde da
--  memória vira um balde POR INSTÂNCIA.
--
--  O estrago, em números: um script que tenta mil senhas cai em, digamos, cinquenta
--  instâncias. Cada uma conta vinte tentativas e nenhuma passa do teto de dez... exceto
--  que dez por instância vezes cinquenta instâncias é **quinhentas tentativas de senha
--  aceitas**. O limite não "afrouxa": ele para de existir, e continua parecendo que
--  existe, que é o pior dos dois mundos.
--
--  E não dava para consertar no lugar: na Vercel, o middleware roda no runtime Edge, que
--  **não fala com o Postgres**. Por isso o limite mudou de lugar, e não só de caixa. Ver
--  lib/rate-limit.ts.
--
--  ═══ POR QUE O POSTGRES, E NÃO O REDIS ═══
--
--  Porque o Postgres já está aqui, já é a fonte da verdade, e já é compartilhado por
--  todas as instâncias. Um Redis resolveria o mesmo problema, e cobraria uma dependência
--  nova, um serviço novo, uma conta nova e um segredo novo — por uma tabela de três
--  colunas.
--
--  O custo é uma consulta a mais por tentativa de login. Um login já faz várias.
-- ════════════════════════════════════════════════════════════════════

create table if not exists rate_limits (
  -- A chave é quem está sendo contado: "auth:1.2.3.4", "codigo-por-email:<uuid>".
  key text primary key,

  hits integer not null,

  -- Quando o balde vira. Passou disto, a contagem recomeça do zero.
  reset_at timestamptz not null
);

-- A varrida do que já venceu. Sem ela, um atacante com mil IPs deixa mil linhas mortas
-- para trás: não passa de limite nenhum, e enche a tabela devagar, para sempre.
create index if not exists rate_limits_reset_at on rate_limits (reset_at);

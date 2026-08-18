-- ════════════════════════════════════════════════════════════════════
--  OS LINKS DO PERFIL. Instagram, site, o que a pessoa quiser — sem
--  lista fechada de "plataformas aceitas".
--
--  Um enum de plataformas ("instagram" | "twitter" | "site") seria um
--  formulário fingindo saber tudo que existe — a mesma lição que
--  `owned_copies.acquired_note` já ensinou (migration antiga: "um enum fixo
--  era um formulário fingindo ser memória"). Aqui é só uma URL de cada vez;
--  o rótulo e o ícone se decidem OLHANDO o domínio, na tela
--  (components/links-do-perfil.tsx), nunca escritos à mão pela pessoa e
--  nunca travados no banco.
--
--  Até 5, na ordem que a pessoa escolheu — o teto é aplicado no código
--  (app/perfil/actions.ts), não aqui: uma CHECK de tamanho de array
--  precisaria ser reescrita toda vez que o número mudasse de ideia.
-- ════════════════════════════════════════════════════════════════════
alter table users
  add column if not exists social_links text[] not null default '{}';

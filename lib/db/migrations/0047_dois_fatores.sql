-- ════════════════════════════════════════════════════════════════════
--  2FA. Um segundo fator, opcional, com app autenticador.
--
--  ═══ NUNCA SMS ═══
--
--  SMS é interceptável por troca de chip, e uma troca de chip não precisa de hacker:
--  precisa de um atendente de loja convencido. Um app autenticador não tem esse buraco.
--
--  ═══ O SEGREDO E OS CÓDIGOS SÃO CIFRADOS ═══
--
--  O Better Auth cifra os dois com o AUTH_SECRET antes de escrever aqui, e marca os
--  dois campos como `returned: false` — eles nunca saem numa resposta de API.
--
--  Isso foi conferido LENDO o código da biblioteca (plugins/two-factor/index.mjs), e
--  não a documentação dela. Segurança que se confirma lendo documentação é segurança
--  que ninguém confirmou.
-- ════════════════════════════════════════════════════════════════════

create table if not exists "twoFactor" (
  id uuid primary key default gen_random_uuid(),

  /*
   * O segredo TOTP, CIFRADO. Ele é o que gera os seis dígitos, e quem o tem não precisa
   * do celular de ninguém.
   */
  secret text not null,

  /*
   * Os dez códigos de recuperação, CIFRADOS.
   *
   * Eles existem porque celular perdido não pode ser conta perdida — e o suporte do Gume
   * é uma pessoa só, num domingo. Sem eles, o 2FA transforma um celular quebrado numa
   * conta trancada para sempre.
   */
  "backupCodes" text not null,

  "userId" uuid not null references users(id) on delete cascade,

  /*
   * `verified` é falso entre "a pessoa pediu o QR code" e "a pessoa digitou o primeiro
   * código certo". É esse intervalo que impede alguém de trancar a própria conta com um
   * segredo que nunca funcionou.
   */
  verified boolean not null default true,

  /*
   * Força bruta contra seis dígitos é viável: um milhão de combinações, e um script faz
   * isso numa tarde. O plugin conta os erros e tranca.
   */
  "failedVerificationCount" integer not null default 0,
  "lockedUntil" timestamptz
);

create index if not exists two_factor_user_idx on "twoFactor" ("userId");
create index if not exists two_factor_secret_idx on "twoFactor" (secret);

alter table users
  add column if not exists "twoFactorEnabled" boolean not null default false;

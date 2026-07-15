-- FATIA 4: cópia disponível, e o canal de contato.
--
-- NÃO É UM MERCADO. É disponibilidade. O app não intermedeia: sem mensagem
-- privada, sem envio, sem endereço, sem custódia, sem disputa. O combinado
-- acontece fora do app.
--
-- O canal de contato NÃO é público. Ele só aparece para quem tem SEGUIR MÚTUO
-- com a pessoa (você segue e ela te segue de volta), e o filtro roda no SQL, via
-- lib/authz.ts. O seguir mútuo É o sistema de confiança, e ele já existia.

create type available_for as enum ('doar', 'trocar', 'emprestar');

alter table owned_copies
  add column if not exists available_for available_for;

create index if not exists owned_copies_disponivel
  on owned_copies (work_id) where available_for is not null;

-- UM canal por pessoa. Opcional, vazio por padrão.
--
-- Um só, e não uma lista: uma lista de canais é uma superfície de contato, e
-- superfície de contato é o que a gente está justamente recusando. O Gume faz a
-- apresentação e sai da sala.
create type contact_kind as enum ('whatsapp', 'instagram', 'telegram', 'email');

alter table users
  add column if not exists contact_kind  contact_kind,
  add column if not exists contact_value text;

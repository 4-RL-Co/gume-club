-- ACHAR UMA PESSOA. É o cano que decide se o Gume vira uma rede ou uma planilha.
--
-- Dez amigos se cadastram, nenhum acha o outro, e cada um fica sozinho numa
-- estante olhando um feed vazio. O app não parece quebrado: parece MORTO, que é
-- pior, porque ninguém abre um chamado sobre um app que parece morto. Ele só
-- desinstala.
--
-- A busca de pessoas já existia, e ela usava `LIKE '%texto%'` com unaccent. Isso
-- perdoa ACENTO ("vitoria" acha "Vitória") e não perdoa mais nada:
--
--   · "clarise" não achava "Clarice"
--   · "victoria" não achava "Vitória"
--   · "joao pedro" não achava "João  Pedro" (dois espaços, o que gente digita)
--
-- E `LIKE '%...%'` não usa índice NENHUM: é varredura sequencial na tabela de
-- usuários, a cada tecla. Funciona com dez amigos e morre com dez mil.
--
-- O catálogo já resolveu isso, em 0013: trigrama com unaccent. É a mesma solução,
-- pelo mesmo motivo, e agora ela vale para gente também. Um app que responde
-- "não achei ninguém" para quem digitou o nome do próprio amigo com uma letra
-- trocada é um app que mente.

CREATE INDEX IF NOT EXISTS "users_handle_trgm"
  ON "users" USING gin (immutable_unaccent(lower("handle")) gin_trgm_ops);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "users_display_name_trgm"
  ON "users" USING gin (immutable_unaccent(lower(coalesce("display_name", ''))) gin_trgm_ops);

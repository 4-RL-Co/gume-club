-- BANIR E SILENCIAR. Não existia, e cadastro aberto sem isto é um convite.
--
-- ═══ BANIR NÃO APAGA. É REVERSÍVEL, E ISSO É O DESENHO. ═══
--
-- `banned_at` é uma data, e não um DELETE. Duas razões, e as duas são caras:
--
-- 1. ERRO ACONTECE.  Quem modera é uma pessoa cansada, e uma pessoa cansada bane a
--    pessoa errada. Um banimento que apaga é um erro que não volta atrás; um
--    banimento que é uma data volta com um update.
--
-- 2. O DADO É DELE.  Mesmo de quem se comportou mal. Apagar a estante de alguém
--    porque ele escreveu uma bobagem é uma punição desproporcional, e a AGPL deste
--    projeto promete o contrário: os seus livros são seus.
--
-- `deleted_at` (que já existia) é outra coisa: é a pessoa PEDINDO para sair. As duas
-- colunas existem juntas porque são fatos diferentes, e confundi-las seria dizer que
-- ser expulso e ir embora são a mesma coisa.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned_at" timestamptz;
--> statement-breakpoint

-- O MOTIVO É OBRIGATÓRIO na prática, e a razão não é burocrática: um banimento sem
-- motivo escrito é um banimento que ninguém consegue revisar daqui a seis meses, nem
-- explicar para a pessoa banida. Quem bane tem que dizer por quê, nem que seja para
-- si mesmo.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned_reason" text;
--> statement-breakpoint

-- Quem baniu. Moderação sem nome vira arbítrio.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned_by" uuid REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint

-- A busca por gente banida (na tela de moderação) e o filtro de todo o resto passam
-- por aqui. Sem índice, o filtro `banned_at is null` varre a tabela em toda query.
CREATE INDEX IF NOT EXISTS "users_banned_idx" ON "users" ("banned_at") WHERE "banned_at" IS NOT NULL;

-- MODERADOR É UM CARGO SEPARADO, e a separação é o ponto.
--
-- Até aqui, quem moderava era BIBLIOTECÁRIO. E bibliotecário se ganha SOZINHO: 50
-- correções que sobreviveram, 30 dias de conta, e a porta abre. É a regra certa para
-- o que ele faz (aprovar capa, desfazer vandalismo no catálogo), e é a regra ERRADA
-- para banir gente.
--
-- ═══ POR QUE OS DOIS NÃO PODEM SER O MESMO CARGO ═══
--
-- Um bibliotecário mexe em FICHA DE LIVRO. O pior que ele faz é um erro de catálogo,
-- e todo erro dele é revertível por outro bibliotecário, com o nome dele no log.
--
-- Um moderador mexe em GENTE. Ele tira uma pessoa do ar. E ele chega ao cargo
-- automaticamente, cruzando um número, sem que ninguém tenha olhado para ele.
--
-- Poder sobre livro se ganha por trabalho. Poder sobre PESSOA se ganha por CONFIANÇA,
-- e confiança não é uma consulta: é alguém dizendo sim.
--
-- ═══ SÓ O IDEALIZADOR CONCEDE ═══
--
-- E ele é único no mundo, por índice do banco (migration 0024). Não é "o admin", não
-- é "um bibliotecário sênior": é UMA pessoa, e não dá para virar ela.
--
-- Isso não escala, e não escalar é a intenção: no dia em que precisar escalar, a
-- conversa é sobre o que se faz quando o dono some, e essa conversa não se resolve
-- com uma coluna.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "moderator_at" timestamptz;
--> statement-breakpoint

-- Quem promoveu. Cargo dado em silêncio vira favor, e favor vira fofoca.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "moderator_by" uuid
  REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint

-- ── O BOOTSTRAP ──────────────────────────────────────────────────────────────
--
-- Quem imaginou o Gume é moderador. Sem isto, ninguém no mundo poderia moderar, e
-- ninguém poderia promover ninguém: o sistema nasceria trancado por fora.
UPDATE "users" u
   SET "moderator_at" = now(), "moderator_by" = u.id
 WHERE EXISTS (
   SELECT 1 FROM "badge_grants" g
    WHERE g.user_id = u.id AND g.badge = 'idealizador' AND g.revoked_at IS NULL
 )
   AND u."moderator_at" IS NULL;

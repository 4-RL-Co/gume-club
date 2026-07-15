-- A NONA INSÍGNIA: idealizador.
--
-- Ela é ÚNICA em QUEM a tem, e nunca em como ela BRILHA. Mesmo L, mesmo C, mesmo
-- glow, mesmo glifo de traço que as outras oito. A promessa do sistema nunca foi
-- "todo mundo tem as mesmas insígnias" (bibliotecário também não é de todo mundo):
-- foi "nenhuma insígnia vale mais que outra", e essa continua de pé.
--
-- Ela é CONCEDIDA, como caçador e tradutor, e pelo mesmo motivo: nenhuma consulta
-- sabe quem imaginou uma coisa. Conceder é um ato público, com nome, data e motivo.
ALTER TABLE "badge_grants" DROP CONSTRAINT IF EXISTS "badge_grants_badge";
--> statement-breakpoint

ALTER TABLE "badge_grants" ADD CONSTRAINT "badge_grants_badge"
  CHECK ("badge" in ('cacador', 'tradutor', 'idealizador'));
--> statement-breakpoint

-- SÓ UMA PESSOA no mundo pode ter esta insígnia, e o banco é quem garante.
--
-- Sem isto, "único" seria uma intenção, e intenção não sobrevive à quarta pessoa que
-- mexe no código: bastaria um segundo insert. Um índice único parcial (só sobre as
-- não revogadas) faz o segundo insert falhar, e faz uma revogação liberar a vaga.
CREATE UNIQUE INDEX IF NOT EXISTS "badge_grants_um_idealizador_so"
  ON "badge_grants" (("badge"))
  WHERE "badge" = 'idealizador' AND "revoked_at" IS NULL;

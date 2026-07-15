-- AS INSÍGNIAS VOLTAM A SER SETE, E TODAS SE GANHAM SOZINHAS.
--
-- Saem CAÇADOR e TRADUTOR. As duas eram concedidas à mão por um bibliotecário, e o
-- problema com isso é do dono, e é bom: uma insígnia que a pessoa consegue
-- DESBLOQUEAR não pode depender de alguém lembrar de dá-la. Um cargo distribuído à
-- mão faz do dono um gargalo, e depois um porteiro.
--
-- Sobra UMA concedida: IDEALIZADOR. E ela é a exceção honesta, porque ninguém pode
-- "conseguir" ter imaginado uma coisa: não há o que desbloquear, logo não há por que
-- ser automática.
--
-- As concessões antigas de caçador e tradutor são APAGADAS, e não marcadas como
-- revogadas. Revogar diria "essa pessoa perdeu a insígnia", e não é isso que
-- aconteceu: a insígnia deixou de existir. Marcar como revogada seria escrever um
-- fato falso no histórico.
DELETE FROM "badge_grants" WHERE "badge" in ('cacador', 'tradutor');
--> statement-breakpoint

ALTER TABLE "badge_grants" DROP CONSTRAINT IF EXISTS "badge_grants_badge";
--> statement-breakpoint

ALTER TABLE "badge_grants" ADD CONSTRAINT "badge_grants_badge"
  CHECK ("badge" = 'idealizador');

-- ════════════════════════════════════════════════════════════════════
--  GUARDAR A CURADORIA DA CASA, COMO SE GUARDA A LISTA DE UMA PESSOA.
--
--  ═══ POR QUE NÃO DEU PARA USAR `collection_saves` ═══
--
--  Guardar a estante de alguém já existe, e a chave estrangeira dela aponta para
--  `collections`. A curadoria da casa NÃO É uma coleção: o Top 100 é calculado a cada
--  visita, sem linha em tabela nenhuma, e é isso que garante que ninguém edita a lista
--  e que ela se refaz sozinha quando a comunidade muda de gosto.
--
--  Forçá-la a virar uma linha em `collections` para caber no mecanismo antigo seria
--  inverter a ordem: mudar o que a coisa É para caber no jeito de guardar. A lista
--  continua calculada; o que se guarda é o PONTEIRO para ela.
--
--  ═══ POR QUE UMA CHAVE DE TEXTO, E NÃO UM BOOLEANO NO USUÁRIO ═══
--
--  `guardou_os_queridinhos boolean` resolveria hoje e travaria amanhã: a segunda lista
--  editorial exigiria outra coluna, e a terceira mais uma. A chave é o nome da lista
--  ('queridinhos'), então uma lista nova é uma linha, e não uma migration.
--
--  Ela NÃO tem chave estrangeira, de propósito: não há tabela para apontar. O preço é
--  que uma chave inventada não é recusada pelo banco — e quem lê decide o que faz com
--  uma chave que não conhece. Ver lib/curadoria-guardada.ts.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "curation_saves" (
	"user_id" uuid NOT NULL,
	"chave" text NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curation_saves_pk" PRIMARY KEY("user_id","chave")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "curation_saves" ADD CONSTRAINT "curation_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

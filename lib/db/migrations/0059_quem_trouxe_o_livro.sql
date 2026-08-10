-- ════════════════════════════════════════════════════════════════════
--  QUEM TROUXE O LIVRO. O acervo tinha 3.307 fichas de leitor e nenhum nome.
--
--  ═══ O BURACO ═══
--
--  A página de contribuidores existe para dar a ver que "quem conserta uma capa vale
--  o que vale quem faz um commit". Só que ela conta CORREÇÕES, e mais nada.
--
--  Quem CRIA a ficha de um livro que faltava no acervo — o trabalho mais valioso que
--  existe para um catálogo — era invisível. Não porque a página esquecesse de mostrar:
--  porque o dado **nunca foi gravado**. `works` não tinha coluna de autoria.
--
--  Medido em produção no dia desta migration: 3.307 obras com `needs_review`, ou seja,
--  criadas por leitor, e zero delas com dono.
--
--  ═══ AS 3.307 FICAM ÓRFÃS, E ISSO É DE PROPÓSITO ═══
--
--  Não dá para recuperar quem as criou: a informação não existe em lugar nenhum. Elas
--  continuam sendo do acervo, e a contagem começa honesta a partir de agora.
--
--  Atribuir retroativamente por palpite (o primeiro que pôs na estante, por exemplo)
--  seria pior que não ter: daria crédito errado a uma pessoa de verdade, numa página
--  cujo assunto é justamente reconhecer quem fez.
--
--  ═══ `on delete set null`, E NUNCA CASCADE ═══
--
--  Quem apaga a conta leva embora os PRÓPRIOS dados, e não o livro que trouxe para o
--  acervo: a ficha serve todo mundo, e apagar dela porque a pessoa saiu tiraria o
--  livro da estante de terceiros. O nome sai; o livro fica.
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE "works" ADD COLUMN IF NOT EXISTS "created_by" uuid;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "works" ADD CONSTRAINT "works_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "works_created_by_idx" ON "works" USING btree ("created_by");

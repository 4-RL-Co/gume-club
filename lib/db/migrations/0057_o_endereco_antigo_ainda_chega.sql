-- ════════════════════════════════════════════════════════════════════
--  O ENDEREÇO ANTIGO DE UMA OBRA CONTINUA CHEGANDO NELA.
--
--  ═══ O QUE ISSO CONSERTA ═══
--
--  O endereço de uma obra carrega o nome do autor: `metamorfose-sheila-koerich`.
--  Quando o autor está ERRADO — e estava: Sheila Koerich é a TRADUTORA da edição da
--  Antofágica, e a importação a gravou como autora —, corrigir a ficha não conserta o
--  endereço. E o endereço é a parte que as pessoas veem, copiam e mandam uma para a
--  outra.
--
--  Havia três obras assim em produção, e o mesmo lixo estava em 53 fichas do acervo.
--
--  ═══ POR QUE NÃO BASTAVA TROCAR O ENDEREÇO ═══
--
--  Trocar e pronto substitui uma verruga visível por uma perda silenciosa: todo link já
--  compartilhado passa a dar "não encontrado", e quem clicou não faz ideia do porquê.
--  Um link quebrado é PIOR que um link feio — o feio ainda leva ao livro.
--
--  Então o endereço velho não morre: ele vira uma linha aqui, e a página do livro
--  redireciona para o novo. O link antigo continua chegando no lugar certo, para sempre.
--
--  ═══ AS DUAS DECISÕES DESTA TABELA ═══
--
--  1. É TABELA, e não uma coluna `slug_antigo`. Uma obra pode ser renomeada mais de uma
--     vez (o autor errado hoje, o título bagunçado amanhã), e cada endereço que ela já
--     teve precisa continuar chegando. Uma coluna guardaria só o penúltimo, e o
--     antepenúltimo — que também está no histórico de alguém — morreria em silêncio.
--
--  2. A CHAVE PRIMÁRIA É O SLUG. Dois endereços iguais não podem apontar para obras
--     diferentes, ou o redirecionamento vira sorteio. O banco recusa antes de a gente
--     ter a chance de errar.
--
--  O `on delete cascade` acompanha a obra: obra fundida ou apagada leva os endereços
--  dela junto, senão sobra um redirecionamento apontando para o vazio.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "work_old_slugs" (
	"slug" text PRIMARY KEY NOT NULL,
	"work_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_old_slugs" ADD CONSTRAINT "work_old_slugs_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_old_slugs_work_idx" ON "work_old_slugs" USING btree ("work_id");

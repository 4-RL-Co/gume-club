-- ════════════════════════════════════════════════════════════════════
--  A LISTA DE APOIADORES PASSA A NASCER MARCADA.
--
--  ═══ O QUE MUDOU, E QUEM DECIDIU ═══
--
--  A 0055 criou `supporter_public` com padrão `false`, e o comentário dela defende isso:
--  pagar não é consentir em ser publicado. A recomendação foi apresentada ao dono, com o
--  argumento inteiro, e ele decidiu o contrário: a lista nasce marcada, e quem não quiser
--  aparecer desmarca.
--
--  A 0055 NÃO foi editada. Migration é história, e o que valia quando ela rodou continua
--  escrito lá. Esta aqui é o que vale agora.
--
--  ═══ O ARGUMENTO DELE, E ELE É BOM ═══
--
--  Uma lista de apoiadores existe para AGRADECER, e uma lista vazia não agradece ninguém.
--  Com opt-in, o caso comum era a pessoa pagar, ganhar a insígnia, e nunca descobrir que
--  existia uma caixa em outra tela: o efeito prático não era privacidade, era uma seção
--  permanentemente vazia numa página que fala sobre reconhecimento.
--
--  ═══ O QUE CONTINUA PROTEGIDO, E É O QUE SEMPRE IMPORTOU ═══
--
--  A caixa continua existindo, no mesmo lugar, e desmarcar tira o nome na hora. O que a
--  lista mostra continua sendo NOME e ARROBA, que já são públicos no perfil de quem
--  apoia. Ela nunca mostrou, e nunca vai mostrar:
--
--    · quanto cada pessoa paga
--    · qualquer ordem que se leia como "este apoia mais" (a ordem é de chegada)
--    · quem apoia e já parou (a lista lê ehApoiador(), que é calculado)
--
--  O risco que o opt-in protegia era publicar o NOME de alguém numa página que ele não
--  pediu. Ele não sumiu: ele virou uma escolha que a pessoa pode desfazer, num lugar que
--  ela vê no mesmo dia em que apoia, porque a seção só aparece para quem apoia.
--
--  ═══ AS LINHAS QUE JÁ EXISTEM ═══
--
--  Todas viram `true`. Isto é seguro HOJE, e não seria daqui a um mês: o apoio subiu
--  hoje, e nenhuma pessoa chegou a fazer uma escolha explícita nesta caixa. Não há
--  consentimento sendo sobrescrito porque não há consentimento registrado ainda.
--
--  No dia em que houver, um `update` assim seria inaceitável: ele apagaria a decisão de
--  quem desmarcou de propósito. Se esta regra mudar de novo, mude só o DEFAULT, e deixe
--  as linhas existentes em paz.
-- ════════════════════════════════════════════════════════════════════

alter table users
  alter column supporter_public set default true;

update users
   set supporter_public = true
 where supporter_public = false;

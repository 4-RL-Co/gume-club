# CLAUDE.md

Leia **[AGENTS.md](./AGENTS.md)** primeiro. É o contrato deste repo: stack, regras, o que não vibe-codar, e o workflow por feature.

Depois, na ordem, conforme a tarefa:

- **[ai/PLAN.md](./ai/PLAN.md)**: o que construir e em que ordem. Fatias verticais. Não pule fase. Marque os itens conforme terminar.
- **[ai/PRD.md](./ai/PRD.md)**: por que cada requisito existe (cada um vem de uma dor documentada de um concorrente).
- **[docs/schema.md](./docs/schema.md)**: o modelo de dados e as sete decisões que ele trava.
- **[docs/design.md](./docs/design.md)**: o sistema visual. Vidro é chrome, papel é conteúdo.
- **[SECURITY.md](./SECURITY.md)**: autorização mora em `lib/authz.ts`, escrito à mão. Leia antes de tocar em qualquer query.
- **[ai/DECISIONS.md](./ai/DECISIONS.md)**: decisões já tomadas. Não relitigue; se discordar, argumente e adicione uma entrada nova.

## Regras que valem em toda sessão

1. Uma fatia vertical por vez: migration → server → UI → teste. Nunca "todos os models primeiro".
2. Toda leitura de dado de outra pessoa filtra `visibility` **no SQL**. Toda escrita checa dono **antes** de mutar.
3. Nada de segredo em client component ou `NEXT_PUBLIC_*`.
4. Nada de IA generativa no produto. É promessa pública no README, não backlog.
5. Ao terminar uma fatia: marque no ai/PLAN.md e, se houve decisão real, registre em ai/DECISIONS.md.
6. Na dúvida, apresente 3 opções com trade-offs e uma recomendação. Não escolha em silêncio.
7. **O Gume fala com leitores, não com desenvolvedores.** Nenhuma tela cita arquivo interno (`ai/PLAN.md`, "Fase 4", "roadmap"), nem jargão de dev ("schema", "migration", "endpoint", "seed", "transação", "AGPL", "self-host"). O que ainda não existe é "em breve", nunca "chega na Fase 4". A única exceção é `/sobre`, que pode dizer em uma frase que o código é aberto. Ver a seção "A voz" no AGENTS.md.

Estado atual: **o v0.1 está de pé.** Catálogo, estante (ter e ler contados separados), coleções, veredito como palavra, honras e insígnias, perfil público, correções e curadoria, moderação, importação (Goodreads, StoryGraph, Skoob, Fable) e exportação — tudo existe. O que ainda falta antes de abrir ao público mora em ai/PLAN.md e docs/O-QUE-FALTA-NO-CODIGO.md (leitor de código de barras, exportar em Markdown, o deploy). Não relitigue o que já está em ai/DECISIONS.md.

# Auditoria de segurança

Rodada de 12 de julho de 2026. A IA atacou o próprio sistema.

O princípio é o do SECURITY.md, e ele não mudou: **segurança é estrutura, não vigilância.** Ninguém revisa dez mil linhas por dia atrás de uma checagem de dono que sumiu. Então a defesa não é a revisão: é um punhado de testes que atacam de verdade, contra Postgres de verdade, e que quebram o build no dia em que alguém apagar a checagem.

Cada achado abaixo tem: **o que era**, **como se explorava**, **como foi corrigido**, e **o teste que agora segura a linha**.

**Status, para quem lê num repositório aberto:** os oito achados numerados estão **corrigidos e sob teste**. O detalhe de exploração que aparece neles é história de um buraco que já foi fechado, mantido porque a transparência é o ponto deste projeto, e um exploit contra um teste verde não leva a lugar nenhum. **O que ainda está aberto** mora em "O que eu suspeito e não tive certeza", lá embaixo. Para o que está aberto, este documento diz **o que é** e **que está aberto**, e de propósito **não escreve o passo a passo** — honestidade não é mapa.

---

## O que estava certo, e vale dizer

O `lib/authz.ts` aguentou. Doze ataques de IDOR, um usuário logado de verdade trocando UUID para alcançar as linhas de outro, e **os doze foram bloqueados** sem nenhuma correção necessária: tirar livro da estante alheia, prateleirar em massa a estante de outro, renomear, apagar e tornar pública uma estante que não é sua, escrever dentro dela, escolher a edição de outra pessoa, e ler a estante alheia pelo retrato do desfazer.

Do lado da leitura, a linha privada não vazou em superfície nenhuma: nem na estante, nem nas estatísticas, nem nas estantes inventadas, nem na nota dos amigos, nem para quem segue a vítima.

Isso não é sorte: é o efeito de a autorização morar num módulo só, escrito à mão, e de toda query passar por ele.

Também estava certo: **mass assignment no cadastro**. O Better Auth está configurado com `input: false` em `librarianTier` e `invitedBy`, então ninguém se promove a bibliotecário mandando um campo a mais no corpo da requisição. **Enumeração de usuário**: login com e-mail que existe e com e-mail que não existe respondem exatamente igual, e o cadastro com e-mail já usado também.

---

## 1. Injeção de SQL na dependência que a gente usa em toda query

**Gravidade: alta.** O achado mais sério da rodada, e ele não estava no nosso código.

**O que era.** `drizzle-orm@0.36` tem uma injeção de SQL conhecida (GHSA, escapamento indevido). É a biblioteca por onde passa **toda** consulta do Gume.

**Como se explorava.** Pela falha da própria biblioteca, em construções que a gente usa todos os dias. Um repositório aberto piora isso: qualquer pessoa lê o `pnpm-lock.yaml`, vê a versão, e procura a falha conhecida que você ainda não fechou. A defesa não é esconder o lockfile. É fechar a falha antes de virar notícia.

**Correção.** `drizzle-orm` para `^0.45.2` e `drizzle-kit` para `^0.31.4`. Os 164 testes continuam verdes na versão nova.

**O que segura.** `pnpm audit` no CI, e o **Dependabot** (`.github/dependabot.yml`), com **automerge só para patch**: patch é correção, e o teste decide se entra; minor e major mudam comportamento e são decisão de gente.

**Sobra.** Cinco avisos de gravidade média e um alto, **todos em ferramenta de desenvolvimento** (`vite`, `esbuild`, `postcss`, via `vitest`, `drizzle-kit` e `next`). Nenhum deles roda em produção. Ficam anotados e sobem junto quando o `vitest` e o `next` subirem de major, o que é decisão sua, não minha.

---

## 2. Um duplo clique em "lido" contava seis livros

**Gravidade: média.** Corrupção silenciosa de dado, e a pior espécie: aquela que ninguém percebe porque o número fica *maior*.

**O que era.** Marcar um livro como lido era **ler e depois escrever, em dois passos**: procurar a leitura aberta, e então inserir uma. Entre os dois cabe outra requisição.

**Como se explorava.** Sem atacante nenhum: um duplo clique, uma aba repetida, o navegador reenviando o POST numa conexão ruim. O teste dispara vinte chamadas iguais em paralelo, e nasciam **seis leituras terminadas** para um livro. As estatísticas leem a leitura, não o status, então o ano passava a dizer que você leu seis livros onde havia um.

**Correção.** Tudo dentro de uma transação, com `select ... for update` na linha da estante: a segunda requisição espera a primeira e reavalia. Vale para o botão do livro (`shelveAndRead`, em `lib/library.ts`) e para a ação em lote (`setStatusMany`, em `lib/curation.ts`).

**O que segura.** `lib/concurrency.sql.test.ts`: seis testes que disparam **vinte escritas idênticas em paralelo** e exigem uma linha no fim. Cobrem prateleirar, seguir, recomendar, pôr numa estante inventada, e terminar um livro (no botão e em lote).

---

## 3. A resenha não tinha teto, e ia inteira para o banco

**Gravidade: média.**

**O que era.** `saveReview` gravava o texto sem limite de tamanho. O `maxLength` do formulário é conforto para quem digita e **não vale nada** contra quem não usa o formulário. Os mesmos campos sem teto: título, autor e editora na correção de catálogo e no cadastro à mão, e as linhas de uma lista colada.

**Como se explorava.** Uma requisição direta com cinquenta megabytes de resenha. Não precisa de atacante esperto: um "colar" errado basta. O texto chega ao banco, incha o backup, e a página do livro fica lenta para todo mundo que abrir.

**Correção.** `lib/limits.ts`: um lugar só, com o teto de todo texto que entra, validado **no servidor**. Aplicado em resenha, procedência, bio, nome, @, nome de estante, linha de recomendação, título, autor, editora, busca e lista colada.

**O que segura.** `lib/limits.test.ts`, e o fato de o teto morar num arquivo só, em vez de espalhado como `.slice(0, 280)` em oito lugares, onde o nono nasce esquecido.

---

## 4. Ações em lote quebradas (achado de brinde do red team)

**Gravidade: nenhuma, para segurança. Alta, para o produto.**

`any(${ids}::uuid[])` **não interpola um array de JavaScript** no Drizzle: ele tenta converter um `record` e estoura. Ou seja, "marcar como lido" em lote, "pôr numa estante" em lote e o retrato do desfazer **estavam quebrados no instante em que fossem chamados**. O red team encontrou porque ele chama tudo de verdade, contra o banco de verdade, e não contra um espelho da regra escrito em JavaScript. Um espelho concorda com o bug.

Corrigido com `sql.param()`. Coberto por `lib/redteam.sql.test.ts` e `lib/concurrency.sql.test.ts`.

---

## 5. Não havia rate limit em lugar nenhum

**Gravidade: média.**

**O que era.** Login, cadastro, busca e **toda escrita** aceitavam requisições sem limite.

**Como se explorava.** Força bruta no login, de graça. Negação de serviço na busca, de graça: cada tecla vira uma consulta de trigrama sobre 414 mil edições. Enchimento da estante de qualquer pessoa por script.

**Correção.** `middleware.ts` + `lib/rate-limit.ts`. Uma ação de servidor do Next é um `POST` para a própria página, então **limitar `POST` cobre todas elas de uma vez, inclusive as que ainda não foram escritas**. É a estrutura fazendo o trabalho: a ação nova nasce protegida sem ninguém lembrar. Os tetos: 10 tentativas de login por 5 minutos, 60 buscas por minuto, 120 escritas por minuto. A chave é IP **e** sessão, então um escritório inteiro atrás de um mesmo IP não divide o balde.

Verificado ao vivo: da décima primeira tentativa de login em diante, `429`.

**O que segura.** `lib/rate-limit.test.ts`.

**Limitação declarada.** O balde mora **na memória do processo**. Com duas instâncias atrás de um balanceador, cada uma conta o seu, e o limite efetivo dobra. Para uma instância (que é como o Gume roda hoje, e como quase todo mundo vai auto-hospedar) isso está correto e não custa uma dependência nova. Quando existir a segunda instância, esse arquivo troca o `Map` por Redis e mais nada muda.

---

## 6. Nenhum cabeçalho de segurança

**Gravidade: média.**

**O que era.** Nenhuma CSP, nenhum `nosniff`, nenhum `frame-ancestors`. Sem CSP, um XSS em qualquer campo de texto vira roubo de sessão.

**Correção.** No `middleware.ts`, em toda resposta: `content-security-policy`, `x-content-type-options: nosniff`, `referrer-policy`, `x-frame-options: DENY`, `permissions-policy`, e `strict-transport-security` **só em produção** (ligar HSTS em desenvolvimento prenderia o `localhost` de todo mundo em https por um ano).

**O que fica em aberto, e eu quero que você olhe acordado.** A CSP ainda permite `'unsafe-inline'` e `'unsafe-eval'` em `script-src`, porque o Next injeta o *bootstrap* inline. O certo é `nonce` por requisição. Não fiz nesta rodada porque mexer nisso sem poder testar em produção era a correção menos conservadora das duas, e você mandou escolher a conservadora. **É a próxima coisa a apertar.**

---

## 7. O manifesto de superfície

Não é um buraco: é a rede que pega o buraco **futuro**.

`lib/surface.test.ts` varre **toda** rota de API e **toda** função exportada de um arquivo `"use server"`, e exige que ela resolva quem está falando (`getActor` ou `getViewer`). O que é público de propósito está numa lista curta, **e cada linha dela precisa de um motivo escrito em português**, que o próprio teste verifica que existe.

É o teste que pega o modo de falha que vaza banco de dados: a rota que era pública um dia e continuou pública depois que a página foi apagada. Ninguém lembra dela. O teste lembra.

Hoje são três exceções: o próprio login (exigir sessão para poder ter sessão seria um laço), a busca de catálogo (é vitrine de livraria, e a parte de pessoas dela só devolve o que é público, provado no red team), e o cookie de convite (a única escrita que acontece antes de a pessoa existir, e ela não toca no banco).

---

## 8. Dinheiro, antes de existir dinheiro

Não há pagamento no Gume, e é exatamente por isso que a regra está escrita **agora**, em `lib/authz.ts` e no `lib/db/schema.ts`, ao lado das tabelas que ainda não existem:

**Dinheiro é inteiro, em centavos. Nunca float.** Float não representa 0,10, e o erro se acumula em toda soma até o caixa não fechar. Regra escrita depois da primeira linha de cobrança é regra escrita tarde demais.

---

## O que eu suspeito e não tive certeza

Para você revisar acordado, sem pressa.

1. **A CSP com `unsafe-inline`.** É a maior dívida que sobrou. Resolver com nonce.
2. **O cadastro com e-mail já existente responde `400` sem corpo.** Isso é bom para segurança (não enumera), e é **ruim de usar**: a pessoa não sabe por que falhou. Vale um texto genérico do tipo "não deu para criar a conta com esses dados", que não confirma nem nega a existência do e-mail.
3. **`editBook` deixa qualquer pessoa logada corrigir qualquer livro do catálogo.** Isso é **de propósito** (o catálogo é comum, e toda edição grava uma revisão com nome), mas é a maior superfície de vandalismo do app. Hoje a defesa é a revisão com nome e o rate limit. Se o Gume crescer, isso vai precisar de mais: um limite de correções por dia para conta nova, ou uma fila para as primeiras.
4. **Upload de imagem.** Ele exige sessão, checa os bytes mágicos e gera o nome do arquivo no servidor (nunca aceita o nome que veio). Não achei buraco, mas é a superfície que eu revisaria primeiro se fosse revisar de novo, porque é a única que aceita bytes crus.
5. **Não há bloqueio de conta após N tentativas de login**, só rate limit por IP e sessão. Achei suficiente para o tamanho de hoje, e um bloqueio mal feito vira arma: quem souber o seu e-mail tranca a sua conta. Se for fazer, que seja com atraso progressivo, e não com porta trancada.

---

## Como está o placar

```
pnpm typecheck        limpo
pnpm test             164 testes, 13 arquivos, verdes
pnpm audit:security   passou, 107 arquivos
pnpm audit            0 em produção; 6 em ferramenta de desenvolvimento
```

Os testes que agora seguram a linha:

| Arquivo | O que ele impede de voltar |
|---|---|
| `lib/redteam.sql.test.ts` | IDOR em estante, estante inventada, nota, resenha e retrato; vazamento de linha privada em cinco superfícies de leitura |
| `lib/concurrency.sql.test.ts` | escrita duplicada por duplo clique, aba repetida, POST reenviado |
| `lib/surface.test.ts` | rota ou ação nova que nasce pública sem ninguém decidir |
| `lib/authz.sql.test.ts` | o feed anunciando o que a estante esconde |
| `lib/limits.test.ts` | texto sem teto chegando ao banco |
| `lib/rate-limit.test.ts` | força bruta e negação de serviço de graça |

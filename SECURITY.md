# Segurança

A maior parte deste código é escrita com ajuda de IA. Essa é uma escolha deliberada, e ela muda o modelo de ameaça: o modo de falha não é um atacante esperto, é **uma linha de aparência plausível que remove em silêncio uma checagem de dono**. Varreduras recentes de apps feitos com IA encontraram segurança em nível de linha (row-level security) desligada em cerca de 70% de uma amostra de 1.600 apps, e centenas de segredos vivos parados em bundles de frontend. A gente parte do princípio de que cometeria os mesmos erros se dependesse de revisar cada linha.

Então a gente não depende disso. A gente depende de estrutura.

## As quatro regras

**1. A autorização mora em um módulo, escrito à mão, revisado por um humano.**

O `lib/authz.ts` é o único lugar que decide quem pode ver ou tocar uma linha. Toda query passa por ele. Ele é pequeno o bastante para ser lido por inteiro em cinco minutos, e toda mudança nele exige revisão humana, mesmo que um agente tenha escrito o resto do PR. Se você encontrar uma checagem de autorização inline num route handler, isso é um bug: mova para o módulo.

**A regra do apelido.**

O `visibleTo()` emite o **nome real da tabela**, de propósito. Se você apelidar a tabela na query, o Postgres recusa a instrução na cara:

```
invalid reference to FROM-clause entry for table "reviews"
```

**Isso não é limitação: é a garantia.** A regra de visibilidade não pode apontar para a tabela errada porque ela não sabe apontar para lugar nenhum além do nome verdadeiro.

**Nunca "conserte" isso fazendo o `visibleTo()` aceitar um apelido como parâmetro.** No dia em que ele aceitar, passar o apelido errado passa a compilar, a rodar, e a devolver linhas que não deveriam existir. Hoje o erro é **alto e imediato**; naquele dia ele vira **silencioso**. Um vazamento que não compila vale mais do que um vazamento que você tem que lembrar de procurar.

Se uma query precisa de apelido, **reescreva a query**: apelide a tabela que é SUA (as suas linhas não precisam de filtro, porque você sempre pode ver o que é seu) e deixe **sem apelido** a tabela da outra pessoa, que é justamente a que o `visibleTo()` está filtrando. O `lib/explore.ts` faz exatamente isso em `getAfinidade()`.

**2. Autenticação não é autorização.**

Estar logado não significa nada. Toda leitura de dado de outra pessoa filtra por `visibility` **no SQL**, e toda escrita checa o dono **antes** da mutação. Nas varreduras acima, cerca de 80% dos apps quebrados falhavam exatamente aqui: logado significava "pode ver tudo".

**3. Nada sensível pode chegar ao cliente.**

Qualquer coisa num arquivo `"use client"` ou numa variável de ambiente `NEXT_PUBLIC_*` é pública. Chaves de serviço, URLs de banco e segredos de API existem só no código de servidor. O `pnpm audit:security` faz grep no bundle buildado atrás de qualquer coisa parecida com uma chave e quebra o build.

**4. Todo endpoint de escrita tem rate limit.**

Por usuário e por IP. Sem isso, o endpoint de importação é uma negação de serviço de graça.

## Teste, não confie

Escrito antes da feature, não depois:

- Um `library_entry` privado **não** aparece no feed de um seguidor.
- Uma resenha com visibilidade `followers` **não** aparece para um estranho.
- O usuário A não consegue mutar a linha do usuário B chutando o UUID. (Tente isso no teste. De verdade, tente.)
- Uma requisição não autenticada para toda rota de API retorna 401, não dados.

Essa última é um único teste parametrizado sobre o manifesto de rotas. Ela pega exatamente o modo de falha que vaza um banco: uma rota que era pública um dia, e continuou pública depois que a página foi apagada.

## Checklist pré-lançamento

Nada sobe até que cada linha esteja verde.

- [ ] Toda rota de API: requisição não autenticada retorna 401 (automatizado, sobre o manifesto de rotas)
- [ ] Toda tabela com dado de usuário: um teste provando que leituras entre usuários falham
- [ ] `pnpm audit:security` passa: sem segredos no bundle do cliente, sem dependências vulneráveis
- [ ] Dependabot / Renovate ligado, com automerge só para releases de patch
- [ ] Todo SQL parametrizado (sem concatenação de string em lugar nenhum, verificado por regra de lint)
- [ ] Rate limit ligado em: login, cadastro, importação, todas as escritas
- [ ] HTTPS obrigatório, HSTS ligado, cookies com secure + httpOnly + sameSite
- [ ] Respostas de erro não vazam stack trace, nem SQL, nem caminhos internos
- [ ] Hash de senha via padrões do Better Auth, nunca feito à mão
- [ ] Passada manual: deslogue, cole URLs privadas na barra de endereço, confirme que nada renderiza
- [ ] Passada manual: DevTools, aba Network, clique por todo o app, procure chaves e PII de outras pessoas
- [ ] Backups rodando, e um restore testado pelo menos uma vez

## Como reportar

Achou algo? Escreva para security@gume.club (ou abra um security advisory privado no GitHub). Por favor, não abra uma issue pública. A gente dá o crédito a você, a não ser que você prefira que não.

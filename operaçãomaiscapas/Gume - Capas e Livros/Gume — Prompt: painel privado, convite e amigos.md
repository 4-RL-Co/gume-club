# Prompt para o Claude Code — painel privado, convite visível, aba de amigos

Cole isso inteiro no Claude Code, dentro do repo do Gume.

---

Três fatias verticais, nessa ordem, uma de cada vez. Não comece a próxima antes da anterior estar de pé, testada e com o CI verde. É a regra 1 do AGENTS.md e vale aqui.

**Antes de escrever qualquer código, leia e me diga o que encontrou:** `AGENTS.md`, `lib/authz.ts`, `SECURITY.md`, `ai/DECISIONS.md`, `lib/honras.ts` (ou o arquivo das insígnias), `docs/schema.md`, `docs/design.md`, e os testes estruturais que varrem o próprio código. Preciso saber o que já existe antes de você criar coisa nova. Especificamente me responda:

1. Existe alguma feature de convite hoje? (`convite`, `invite`, `arauto`, `indicacao`, `convidado_por`) Se existe, como a insígnia de **Arauto** é concedida hoje, em código, e como o usuário pega o link dele?
2. Existe conceito de papel/role (admin, bibliotecário)? Em qual coluna?
3. Existe seguir/seguidor no schema? Qual tabela e quais colunas?
4. Qual é exatamente o teste que impede um número de contribuição de vazar para fora da página de contribuidores, e qual o que impede uma tela de falar como desenvolvedor? Preciso do nome do arquivo e de como registrar uma exceção neles.
5. Existe registro de rota pública/privada que quebra o build se uma rota nascer pública sem decisão? Qual o formato exato do registro?

**Se em qualquer ponto você achar que eu estou pedindo algo que contradiz uma decisão do `ai/DECISIONS.md` ou uma regra do `AGENTS.md`, pare e me diga antes de implementar.** Eu prefiro descobrir isso agora.

---

## Fatia 1 — a aba de amigos (a mais simples, e me destrava hoje)

Hoje eu não consigo ver quem eu sigo nem quem me segue. Não consigo nem fuxicar o perfil de quem se conectou comigo, e isso é um buraco básico.

**O que fazer:** na aba de amigos, mostrar duas listas: **quem eu sigo** e **quem me segue**. Cada pessoa com avatar, nome, e link para o perfil dela. Clicável, para eu poder entrar e ver a estante.

**As restrições, e elas são o ponto:**

- **Isso é privado. Só eu vejo as minhas listas.** Ninguém consegue ver a lista de conexões de outra pessoa. Ir em `/perfil/fulano` não mostra quem o fulano segue nem quem segue ele.
- **Sem contador em lugar nenhum.** Nada de "128 seguidores". O manifesto recusa contador de seguidores no README, e um número grande ao lado do nome é exatamente a coisa que a gente recusou. Mostre as pessoas, não a quantidade. Se a lista for longa, pagine ou role, mas não conte.
- A autorização passa por `lib/authz.ts`, como tudo. E **escreva o teste que prova que o usuário errado não consegue ler a lista do outro**, com troca de UUID, no padrão do red team que já existe no repo.
- Cópia em sentence case, sem em-dash, sem jargão. O Gume fala com leitores.

Se seguir/seguidor ainda não existe no schema, você vai precisar da migration. Migrations são append-only.

---

## Fatia 2 — o convite, visível e com crédito

Eu não consegui achar como convidar alguém pelo meu link para virar Arauto. Se está escondido, está quebrado. Essa é a única alavanca de crescimento que o Gume tem, porque a gente recusou todas as outras.

**O que fazer:**

- Um **link de convite pessoal e estável** para cada pessoa, com um código curto. Ele não expira e não tem limite de uso.
- Ele precisa estar **fácil de achar**: no perfil da pessoa e em algum lugar óbvio da navegação. Não escondido em configurações.
- Um botão de **copiar** que dá retorno visual imediato ("copiado"). E **compartilhar pelo sistema operacional** (Web Share API) quando o navegador suportar, porque no celular isso é a diferença entre mandar no WhatsApp e desistir.
- Quando alguém entra por um link, o cadastro **grava quem convidou**, de forma permanente. É a procedência da conexão.
- Quem convidou vê, na própria página, **quem entrou pelo link dele.** Nomes, não número. E isso é privado, igual à fatia 1.
- A insígnia de **Arauto** passa a ser concedida por isso. Confira como ela é concedida hoje e me diga se muda alguma regra.

**As restrições:**

- **Convite não pode virar placar.** Nada de "você convidou 12 pessoas", nada de ranking de quem convidou mais, nada de meta. Nenhuma insígnia do Gume tem nível ou pontuação: você é, ou não é. Tem teste garantindo isso, e ele não pode quebrar.
- A landing de quem chega pelo convite deve dizer **quem convidou** ("fulano te chamou pro Gume"), porque a recomendação de pessoa é o produto. Mas sem pressão, sem contagem regressiva, sem "seu amigo está esperando".
- Um código de convite não pode ser adivinhável a ponto de alguém enumerar os códigos e mapear os usuários. Use algo aleatório o suficiente, e me explique a escolha.
- Se um convite for usado por alguém que já tem conta, não faz nada. Não reatribui, não duplica.

**Me proponha 3 opções com trade-offs para o formato do código de convite** (baseado no id, código curto aleatório, ou apelido escolhido pela pessoa) e uma recomendação, como manda a regra 12.

---

## Fatia 3 — o painel privado (só eu)

Uma página que só eu acesso, com os dados de verdade do projeto. Eu preciso saber se isso está crescendo ou não, e hoje eu não sei.

### O que a página mostra

**Gente**
- Total de contas.
- Cadastros por dia, semana e mês, com o gráfico de crescimento.
- **Um log de cadastros:** quem criou conta, quando, por qual método (Google ou código por e-mail), e **por qual convite, se veio de um.**
- Taxa de crescimento período contra período. Diga também quando o número é pequeno demais para significar coisa alguma, em vez de me mostrar "+300%" porque saiu de 1 para 4.
- Quantos estão ativos: entraram nos últimos 7 e 30 dias.
- **Retenção:** de quem se cadastrou, quantos voltaram depois da primeira semana. É a métrica que importa mais que crescimento, e é a que mais dói de olhar.

**Uso**
- Média e mediana de livros na estante por pessoa. **Mostre as duas**: se um usuário meu tem 142 livros e os outros têm 3, a média mente e a mediana não.
- Média e mediana de leituras concluídas.
- Quantas contas estão vazias (zero livros). É o número que diz se o cadastro está virando uso.
- Quantas resenhas escritas.
- Distribuição das notas em palavra.
- Quantas importações rodaram, e quantas exportações. Exportação é a promessa central do projeto: se ninguém usa, ou está escondida ou está quebrada.

**Contribuição**
- Quantas correções de catálogo, por período, e quantas pessoas distintas corrigiram.
- Quantas capas enviadas, e quantas ainda esperando conferência.
- Quantas edições e obras criadas por leitores.
- Quem contribuiu com código (você já tem `lib/contributors.ts` puxando PRs mergeados da API do GitHub, reuse).
- **Qual a fatia de gente que contribui pelo menos uma vez.** Essa é a métrica que diz se a tese do projeto está funcionando, mais do que qualquer outra da página.

**Convite**
- Quantas contas vieram por convite versus quantas chegaram sozinhas.
- Quantas pessoas já convidaram pelo menos uma pessoa.
- Quantos convites geraram cadastro de verdade.

**Catálogo**
- Total de obras e edições.
- Quantas edições sem capa (o número do README é quase 266 mil, quero ver ele cair).
- Quantas sem ano, sem editora, sem autor.
- Buscas que não acharam nada. **Essa é a lista mais valiosa da página inteira**, porque é o buraco do catálogo dito pelo próprio usuário. Se não existe registro disso hoje, me diga o custo de passar a registrar (só o termo e a data, sem ligar a pessoa).

### As restrições, e leia com atenção porque tem armadilha aqui

**Acesso.** Só eu. Me dê 3 opções com trade-offs (coluna de papel no banco, lista de e-mails em variável de ambiente, ou outra) e uma recomendação. Seja qual for, **a checagem passa por `lib/authz.ts` e por mais nenhum lugar**, e a rota tem que estar registrada como privada no registro que já existe. Se `scripts/audit-security.mjs` reclamar, o certo é ajustar o código, nunca o auditor.

**Escreva o teste de acesso negado.** Um usuário comum autenticado tentando abrir a rota tem que levar 404 (não 403: 403 confirma que a página existe). Isso entra no red team.

**Cuidado com o teste da voz.** O repo quebra o build se uma tela falar como desenvolvedor. Esse painel fala comigo, não com leitor, e vai usar palavras como retenção e coorte. Então: **registre a exceção explicitamente no teste, para essa rota só, e comente o porquê no próprio teste.** Não afrouxe a regra global, não renomeie coisa para escapar do matcher. A regra existe e continua valendo para o resto do app.

**Cuidado com o teste do número de contribuição.** Existe um teste que impede um número de contribuição de vazar para fora da página de contribuidores. Esse painel mostra esses números. **Mesma solução: exceção explícita e comentada, para essa rota só.** Se você precisar mudar o teste de um jeito que enfraqueça a garantia original, pare e me fale antes.

**Datas.** Todo agrupamento por dia usa a regra de fuso que já existe em `lib/datas.ts`. `new Date().toISOString()` é proibido fora do arquivo autorizado e tem teste banindo. Um painel de crescimento agrupando por dia em UTC me dá número errado, que é exatamente o bug que já aconteceu com data de leitura.

**Dado pessoal.** O log de cadastro tem e-mail. Ele nunca sai dessa página, nunca vai para log de servidor, nunca entra em URL ou query string. Se algum dia essa página tiver export, ele não existe agora.

**Desempenho.** Isso são muitas agregações. Não faça 30 queries em série no carregamento. Me diga qual a estratégia (uma query agregada, materialização, cache curto) e o custo de cada uma. Se ficar lento com o banco crescendo, é melhor eu saber agora.

**O visual.** Segue o `docs/design.md`: monocromático, bom contraste, sem cor de destaque. Eu já rejeitei laranja na página de estatísticas. Números grandes, rótulos pequenos. Nada de gradiente, nada de card colorido, nada de emoji. E prefira mostrar poucos números que eu vou olhar todo dia a mostrar todos os números possíveis.

### O que essa página NÃO é

- **Não é rastreamento de comportamento.** Nada de gravar cada clique, cada página vista, cada scroll. Eu quero saber se o projeto está vivo, não vigiar leitor. Se você estiver na dúvida se algo é métrica de saúde ou vigilância, é vigilância, pergunta antes.
- **Não é um placar.** Uma lista dos meus usuários ordenada por livros lidos é literalmente a coisa que o produto recusa, mesmo que só eu veja. Mostre distribuição e mediana, não ranking de gente com nome.
- Não é para virar página pública "nossos números" depois. Se um dia eu quiser isso, é outra decisão.

---

## Para as três fatias

- Testes junto, não depois. Se toca em quem-pode-ver-o-quê, tem teste provando que o usuário errado não consegue.
- Confira o CI depois de cada push. Verde na sua máquina não é verde.
- Registre no `ai/DECISIONS.md` as decisões duras que aparecerem: o formato do código de convite, o mecanismo de acesso ao painel, e as duas exceções nos testes estruturais, com o porquê de cada uma.
- Se alguma coisa aqui for uma má ideia, me diga. Você já me contradisse antes e estava certo.

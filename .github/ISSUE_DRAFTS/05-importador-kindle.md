---
title: "Importador: Kindle (a biblioteca, não os grifos)"
labels: good first issue, importador
---

## O que é

Trazer a biblioteca Kindle da pessoa: o que ela **tem** e o que ela **leu** na Amazon.

**Escopo, e leia isso antes de começar: essa issue é sobre os LIVROS, e não sobre os
GRIFOS.** O `My Clippings.txt` (os trechos que você marcou no aparelho) é uma issue
diferente, e ela ainda não existe **porque não existe tabela pra trechos**. Botar grifo no
schema é uma decisão de produto que está parqueada de propósito no plano, não um puxadinho
de importador.

Se você trouxer grifos nesse PR, ele não entra. Não é rigor: é que uma tabela nova
inventada no meio de um importador é uma decisão de schema tomada por acidente, e schema é
caro de mudar depois.

## Por que importa

Uma parte enorme do que as pessoas leram nos últimos dez anos foi lida no Kindle, e esse
histórico está trancado num lugar que **não é um app de leitura**: é uma loja. A Amazon
sabe o que você comprou, e ela não te dá isso de volta num formato que sirva pra outra
coisa.

E tem um detalhe que faz esse importador valer mais do que parece: quem lê no Kindle
**tem certeza de que leu**, mas quase nunca registrou em lugar nenhum. É a estante
invisível da pessoa. Trazê-la é devolver dez anos que ela achou que tinha perdido.

## Onde mexer, e por onde começar

O caminho oficial: **Amazon → "Solicitar os seus dados" (Request My Data)**. A Amazon
manda, por e-mail, um pacote com vários CSVs. Os que interessam são os de **conteúdo
digital**: o que foi adquirido, com ASIN, título, autor e data.

```
lib/import/kindle.ts            ← parse(texto: string): LivroImportado[]
lib/import/kindle.test.ts
lib/import/fixtures/kindle.csv  ← o CSV DE VERDADE, anonimizado
docs/kindle.md                  ← onde a pessoa pede os dados, com o passo a passo
```

**O `docs/kindle.md` não é enfeite: é metade da issue.** Ninguém sabe que esse pedido
existe, e ele demora dias pra chegar. Um importador que a pessoa não consegue alimentar é
um importador que não existe. Escreva o caminho, com os nomes dos botões, do jeito que
eles estão hoje.

**Você não precisa entender o app.** O tipo `LivroImportado` e o gravador vêm da issue do
Goodreads. Parser + fixture + testes já é um PR completo.

## As armadilhas

1. **O Kindle não tem ISBN. Ele tem ASIN.** E o schema **já esperava por isso**: dê uma
   olhada em `identifier_kind`, em `lib/db/schema.ts`. `asin` está lá.

   Então: grave o ASIN em `identifiers`, e case o livro por **título + autor**, que é o
   único caminho honesto. **Não converta ASIN em ISBN**: não dá, não existe tabela pública
   pra isso, e chutar um ISBN é envenenar o catálogo de todo mundo (o `editions.isbn13` é
   unique: um ISBN errado gruda no livro errado, pra sempre, pra todos os leitores).

   Gravar o ASIN tem um segundo efeito, e ele é o motivo de valer a pena: **na próxima vez
   que a pessoa importar, o casamento é exato.** O ASIN vira a chave que faz o reimport ser
   um upsert em vez de uma segunda cópia da biblioteca dela.

   > **Nota:** hoje o `findOrCreateWork()` casa por `isbn13`, depois pela chave da Open
   > Library, depois por título + autor. Ele **não consulta a tabela `identifiers`**. Fazer
   > ele consultar (e assim casar por ASIN) é a issue do **ISBN-10**, que mexe no mesmo
   > ponto. Se ela já estiver mergeada, você ganha isso de graça. Se não, **grave o ASIN
   > mesmo assim**: o dado fica certo, e o casamento melhora sozinho quando ela entrar.

2. **Todo livro do Kindle é `ebook`.** `editions.format = "ebook"`. É o único importador em
   que o formato é conhecido com certeza, e é bom que seja: o formato é o que distingue a
   sua cópia da cópia de outra pessoa.

3. **Comprar não é ler.** A Amazon te diz o que a pessoa **adquiriu**, e isso é
   `owned_copies`, não `library_entries.status = read`. **Marcar como lido tudo que ela
   comprou seria inventar leituras que não aconteceram**, e o app inteiro é construído em
   cima de "ter é separado de ler" (ver o comentário em `owned_copies`, em
   `lib/db/schema.ts`).

   O padrão, então, é `want_to_read`: o livro está na estante dela, e ela diz o que leu.
   Se o pacote de dados trouxer algum sinal de leitura de verdade (progresso de sincronia,
   última página lida, data de última abertura), **aí sim** vira `read` ou `reading`.
   Investigue e escreva no PR o que você encontrou.

4. **A data de aquisição é ouro, e ninguém guarda.** Ela vai em `owned_copies.acquired_on`,
   e a procedência em `owned_copies.acquired_note`, que é **texto livre** (o enum de opções
   fixas morreu de propósito, ver ai/DECISIONS.md). Escreva "Kindle" ali, e a pessoa vai
   saber, daqui a cinco anos, de onde veio aquele livro.

5. **O pacote da Amazon vem com dado que NÃO é de livro:** aparelho, endereço, pedido,
   cartão. **Não leia esses arquivos. Não os mande pro servidor.** O parser abre o CSV de
   conteúdo digital, e mais nada. Se a tela receber o pacote inteiro, ela escolhe o arquivo
   certo e **ignora o resto sem nunca ler o conteúdo dele**.

   Isso não é preciosismo de privacidade: é escopo de dado. Um servidor que aceita o
   histórico de compras da Amazon de alguém guarda o histórico de compras da Amazon de
   alguém, e ninguém pediu por isso.

## A régua: SEM PERDAS

Do que a Amazon dá: título, autor, ASIN, data de aquisição, formato. **Tudo isso chega.**

O que ela **não** dá (datas de leitura, nota, resenha): a perda é da fonte, não sua, e ela
tem que estar **escrita na tela** para a pessoa saber o que veio e o que não veio antes de
achar que a migração ficou pronta:

> Trouxemos 340 livros da sua biblioteca Kindle, com a data em que você comprou cada um.
> A Amazon não conta o que você leu, nem o que você achou. Isso é seu para preencher.

## Como testar que funcionou

```bash
pnpm test lib/import/kindle
```

Os testes que provam a issue:

- Um livro comprado chega com `owned_copies`, e **não** chega como lido.
- O ASIN é gravado em `identifiers` com `kind = "asin"`.
- Nenhum livro sai do parser com `isbn13` preenchido. **Nenhum.** Se um sair, você chutou.
- Um título com vírgula e aspas atravessa o parser inteiro.

E o teste que vale: peça os **seus** dados à Amazon, espere os dias que levar, importe, e
confira dez livros na tela.

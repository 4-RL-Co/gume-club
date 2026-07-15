---
title: "Importador: Skoob (a investigação vem antes do código)"
labels: good first issue, importador
---

## O que é

Trazer a estante do Skoob pra cá. **E essa issue começa diferente das outras cinco: ela
começa com uma pergunta em aberto, e a resposta honesta pode ser "não dá pra trazer
tudo".**

Entregar essa resposta, documentada, **é entregar a issue**. Não é consolação.

## Por que importa

O leitor brasileiro está preso. O Skoob é onde estão as estantes de quem lê em português,
há quinze anos, e ele não tem exportação. Isso não é um detalhe técnico: é o motivo de
essas pessoas não terem pra onde ir. Um registro de leitura que se diz aberto e que não
tem resposta pro Skoob não está falando com o Brasil.

O Gume é um app em português, primeiro. Se a gente resolve o Skoob, a gente resolve a
única migração que os outros não resolveram.

## O que fazer, em ordem

### 1. Investigue, e escreva o que achou

Antes de qualquer código, responda por escrito, em `docs/skoob.md`:

- Existe alguma exportação oficial hoje, mesmo escondida? (Confira a conta, as
  configurações, o Skoob Premium.)
- A API pública (`api.skoob.com.br`) ainda responde? Ela tem termos de uso? O que ela
  devolve da estante de quem está logado?
- A pessoa consegue tirar os **próprios** dados de alguma forma manual? (Selecionar a
  página da estante e copiar? Uma página de impressão?)

**Essa parte sozinha já é um PR mergeável**, e é a mais valiosa: hoje ninguém no projeto
sabe a resposta, e cada pessoa que tenta descobre do zero.

### 2. A linha que não se cruza: a gente não raspa ninguém

Está escrito em `lib/catalog.ts`, e vale aqui: **a gente não faz scraping.** Quebra os
termos dos outros, quebra toda vez que o HTML deles muda, e faria de um projeto
construído em cima de abertura um hipócrita.

**Mas existe uma distinção, e ela é a chave dessa issue:**

- Um robô nosso passando na casa do Skoob e levando os dados: **não.**
- **A pessoa** pegando os **próprios** dados da **própria** conta e trazendo pra cá:
  **sim, e isso é o direito dela.** É o que a AGPL faz por quem usa o Gume, e é a mesma
  régua que a gente cobra dos outros.

Então o caminho provável é: **a pessoa copia a própria estante, e a gente sabe ler o que
ela colou.**

### 3. O código, quando você souber o que é possível

O formato mais provável é um "cole aqui", e não um arquivo. Boa notícia: **metade disso
já existe.** Leia `components/paste-list.tsx` e `matchList()` em `app/buscar/actions.ts`:
o app já sabe receber uma lista colada, casar os livros contra o catálogo e mostrar o que
achou **antes** de escrever na estante.

O que falta é entender o **formato que sai do Skoob** e transformá-lo em `LivroImportado[]`:

```
lib/import/skoob.ts            ← parse(texto: string): LivroImportado[]
lib/import/skoob.test.ts
lib/import/fixtures/skoob.txt  ← o que sai de verdade quando você copia a sua estante
docs/skoob.md                  ← o que dá e o que não dá, e por quê
```

## As armadilhas

1. **O catálogo do Skoob é brasileiro, e o nosso também**, mas a Open Library é **fraca em
   ISBN brasileiro** (está escrito no AGENTS.md, em "Problemas conhecidos"). O casamento
   por título + autor vai ser mais usado aqui do que em qualquer outro importador. Ele
   erra. Por isso o app **mostra o que achou antes de gravar**, e a pessoa desmarca o que
   está errado. Não pule essa tela: um livro errado que entra sozinho na estante é um erro
   que ninguém percebe por dois anos.
2. **A nota do Skoob é meia estrela (0,5 a 5).** Aqui a nota é uma palavra. `fromStars()`
   em `lib/veredito.ts` faz a conversão, e a perda **é declarada na tela**.
3. **O Skoob tem resenha pública.** Se der pra trazer, ela é da pessoa e ela vem. Se não
   der, **diga isso na tela**, e não deixe a pessoa descobrir sozinha daqui a um mês.
4. **Não traga dado de OUTRAS pessoas.** Resenha alheia, nota alheia, estante alheia:
   nunca. A política do catálogo é "fato sim, obra de terceiro não" (ver ai/PRD.md). ISBN,
   título, autor, editora e ano são fato. A resenha que outra pessoa escreveu é obra dela.

## A régua: SEM PERDAS

A mesma das outras: datas, notas, texto de resenha, prateleiras, ISBN.

**Aqui, com um asterisco honesto:** se o Skoob simplesmente não deixa a pessoa levar as
datas de leitura embora, a perda é dele, não sua. **Mas ela tem que estar escrita em
`docs/skoob.md` e dita na tela**, para a pessoa saber o que ela está deixando pra trás
antes de decidir. Uma migração que mente sobre o que perdeu é pior do que uma que não
aconteceu.

## Como testar que funcionou

```bash
pnpm test lib/import/skoob
```

E o teste que vale mais que todos: **pegue a sua própria estante do Skoob e traga.**
Depois abra cinco livros e confira, na tela, se o que você vê é o que você tinha lá.

Se você não tem conta no Skoob, essa issue não é pra você. Ela precisa de quem tem os
dados na mão.

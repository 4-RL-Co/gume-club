---
title: "Importador: Kobo (e a decisão do sqlite)"
labels: good first issue, importador
---

## O que é

Trazer a biblioteca Kobo: o que a pessoa tem, o que ela leu, e quando.

**Como a issue do Skoob, essa começa com uma pergunta em aberto.** A Kobo não tem uma
exportação bonita esperando por você, e a primeira entrega dessa issue é **descobrir e
documentar qual é o caminho**, não escrever código.

## Por que importa

O Kobo é o leitor de quem **saiu da Amazon de propósito**. Essa pessoa já provou que se
importa com não ficar trancada, já pagou mais caro por isso, e é exatamente quem entende
o Gume sem precisar de explicação. Ela é a contribuidora mais provável desse repo.

E tem uma ironia que essa issue conserta: **o Kobo é o aparelho mais aberto do mercado, e
ainda assim quase ninguém consegue tirar a própria estante de lá.** O dado está lá, o
aparelho é seu, ele monta como um pen drive, e mesmo assim não existe um botão.

## O caminho: o aparelho é da pessoa, e o arquivo também

Quando você pluga um Kobo no computador, ele monta como um disco. Dentro dele existe um
arquivo chamado **`KoboReader.sqlite`** (na pasta oculta `.kobo/`), e ele tem tudo:

- a tabela `content`: título, autor, ISBN, editora, progresso de leitura, data da última
  leitura, se foi terminado
- a tabela `Bookmark`: os grifos e as notas (**fora do escopo dessa issue**, pelo mesmo
  motivo do Kindle: não existe tabela de trechos, e criar uma é uma decisão de produto que
  não se toma dentro de um importador)

**Isso não é scraping.** O `lib/catalog.ts` diz que a gente não raspa ninguém, e não raspa:
raspar é o nosso robô entrando na casa dos outros. Aqui é **a pessoa abrindo um arquivo do
próprio aparelho dela**. É o direito dela, é exatamente o que a AGPL garante pra quem usa o
Gume, e é a mesma régua que a gente cobra dos outros.

## A decisão que essa issue precisa tomar (e ela NÃO se toma sozinho)

Ler sqlite exige uma dependência nova, e esse repo tem **oito dependências no total**. Uma
dependência nova aqui é uma decisão, não um detalhe. Três saídas:

**(a) Ler o sqlite no navegador, com `sql.js`.**
O arquivo nunca sai do computador da pessoa: o parse acontece na aba, e só os livros
casados sobem pro servidor. É o mais privado dos três, de longe. Custa ~1 MB de WebAssembly
no bundle, carregado **só** na tela de importar, nunca no resto do app.

**(b) Mandar o `KoboReader.sqlite` pro servidor e ler lá.**
Bundle limpo. Mas o servidor passa a receber um banco de dados inteiro de um estranho, com
tudo que a pessoa leu dentro. É superfície de ataque nova, e é dado que ninguém pediu pra
guardar. `app/api/upload/route.ts` existe e é deliberadamente estreito (leia os comentários
dele): abrir ele pra aceitar sqlite é desfazer uma escolha que alguém fez com cuidado.

**(c) Pedir pra pessoa converter o sqlite em CSV antes.**
Zero dependência, zero risco. E zero pessoas vão fazer isso. Um importador que exige um
passo de linha de comando é um importador pra quem já sabe programar, e essas não são as
pessoas que estão presas.

**Recomendação: (a).** O dado de leitura de uma pessoa não precisa atravessar a rede pra ser
lido, e o custo (1 MB numa tela que ela abre uma vez na vida) é pequeno perto de "o servidor
nunca viu o seu Kobo". É também a única das três que a gente poderia explicar em voz alta e
sentir orgulho.

**Mas abra a issue e discuta antes de escrever o código.** Dependência nova é decisão de
repo, e a recomendação acima pode estar errada.

## Onde mexer, e por onde começar

```
lib/import/kobo.ts              ← parse(...): LivroImportado[]
lib/import/kobo.test.ts
lib/import/fixtures/kobo.*      ← um KoboReader.sqlite DE VERDADE, com pouca coisa dentro
docs/kobo.md                    ← como a pessoa acha o arquivo no aparelho dela
```

**O `docs/kobo.md` é metade da issue.** Ninguém sabe que esse arquivo existe, e ele está numa
pasta oculta. Escreva o passo a passo, com o caminho exato, no Windows, no Mac e no Linux.

**Você não precisa entender o app.** O tipo `LivroImportado` e o gravador vêm da issue do
Goodreads. Parser + fixture + testes já é um PR completo.

## As armadilhas

1. **`___PercentRead` é progresso, e o Gume NÃO TEM PROGRESSO. De propósito.**

   Isso não é uma coluna faltando: é uma decisão, e ela está escrita em
   `lib/db/schema.ts`, num comentário que vale a pena ler inteiro. Existe até uma migration
   (`0009_drop_reading_progress.sql`) que **arrancou** essa tabela. Uma barra de progresso não
   é um campo, é uma cobrança: ela só funciona se você voltar toda noite pra mover, e na noite
   em que você não volta, ela fica lá mentindo pra você. É uma ofensiva (streak) com outro nome.

   Então um livro em 47% no Kobo **vira `reading`**, e o 47% é **jogado fora**. Não guarde num
   campo novo, não guarde numa nota, não guarde "pra depois". **Isso não é perda: é a decisão
   do produto, e ela é anterior a você.** Se você discorda, o caminho está no AGENTS.md: abra
   uma entrada em ai/DECISIONS.md e argumente. Mas não contrabandeie a discordância pra dentro
   de um importador.

2. **`DateLastRead` é `timestamptz`, e `readings.finished_on` é `date`.** Converta com cuidado.
   Está escrito na regra 8 do AGENTS.md, e o motivo é concreto: um timestamp aqui faz um livro
   terminado em 31 de dezembro, por alguém que não vive em UTC, **cair no ano errado** na
   retrospectiva. O leitor escolheu um dia, não um instante.

3. **`IsDownloaded`, `ContentType`, `Accessibility`:** a tabela `content` do Kobo tem **uma
   linha por capítulo**, e não uma por livro. Se você não filtrar, uma pessoa com 40 livros
   importa 3 mil "livros". Descubra qual é o filtro certo (`ContentType = 6` é o palpite
   clássico, **confirme contra o seu aparelho**) e **escreva um teste que prova que ele filtra**.

4. **Livro comprado na loja Kobo e livro lateral (epub que a pessoa botou lá) se comportam
   diferente.** O segundo costuma vir sem ISBN e com metadado torto. Ele ainda é um livro da
   estante dela. Não descarte: manda pro casamento por título + autor, e deixa a pessoa
   conferir na tela, como o `components/paste-list.tsx` já faz.

## A régua: SEM PERDAS

Datas de leitura, ISBN, editora, título, autor, e **o que ela tem** (`owned_copies`).

Progresso é a única coisa que fica pra trás, e ela fica pra trás **de propósito e por escrito**,
que é a diferença entre uma decisão e um bug.

## Como testar que funcionou

```bash
pnpm test lib/import/kobo
```

Os testes que provam a issue:

- Um arquivo com 40 livros e 3 mil capítulos produz **40** `LivroImportado`. Esse é o teste
  central: escreva ele primeiro, e veja ele falhar.
- Um livro em 47% chega como `reading`, e **nenhum campo em lugar nenhum guarda o 47**.
- Um livro terminado em 31/12, num fuso a leste de UTC, cai em **31/12**, e não em 01/01.
- Um epub lateral, sem ISBN, **não é descartado**.

E o teste que vale: plugue o **seu** Kobo, importe, e confira dez livros na tela.

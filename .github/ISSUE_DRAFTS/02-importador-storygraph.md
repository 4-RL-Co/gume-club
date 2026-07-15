---
title: "Importador: CSV do StoryGraph, sem perdas"
labels: good first issue, importador
---

## O que é

Um parser que lê o CSV de exportação do StoryGraph e devolve uma lista de
`LivroImportado`. Uma função pura: texto entra, objetos saem.

## Por que importa

O StoryGraph é pra onde foi quem saiu do Goodreads na primeira onda, e é onde está a
leitora que mais se importa com os próprios dados: ela já migrou uma vez, já foi
queimada uma vez, e vai conferir se as datas chegaram. Se chegarem, ela fica, e ela
traz as amigas dela.

E o StoryGraph guarda uma coisa que o Goodreads não guarda: **as releituras, com data
cada uma**. Um importador que achata isso numa leitura só está jogando fora justamente
o dado mais difícil de reconstruir.

## Onde mexer, e por onde começar

```
lib/import/storygraph.ts            ← parse(texto: string): LivroImportado[]
lib/import/storygraph.test.ts
lib/import/fixtures/storygraph.csv  ← uma exportação DE VERDADE, anonimizada
```

**Você não precisa entender o app.** O tipo `LivroImportado` e o gravador
(`lib/import/aplicar.ts`) vêm da issue do Goodreads. Se ela ainda não foi mergeada, o
seu PR **continua completo e mergeável**: entregue o parser, o fixture e os testes. O
parser é a parte difícil, e é a parte que só você, que tem uma conta no StoryGraph,
consegue fazer direito.

Leia `lib/import/goodreads.ts` primeiro (se existir): a sua função tem a mesma forma.
E leia o parser de CSV em `scripts/seed-shelf.mjs`, que já sobrevive a vírgula dentro
de aspas. Se ele já tiver virado módulo compartilhado, use; se não, extraia, e isso é
melhoria pro repo inteiro.

## As armadilhas

1. **`Star Rating` é decimal.** O StoryGraph aceita 4.25, 3.5, 4.75. Aqui a nota é uma
   **palavra**, não um número (ver `lib/veredito.ts` e o README: estrela é escala, escala
   vira média, média vira placar). `fromStars()` já arredonda. **A perda é real e tem
   que ser declarada na tela**, não escondida.
2. **`Dates Read` pode trazer VÁRIAS leituras** num campo só. Cada uma vira uma linha em
   `readings`. Achatar em uma é o bug que essa issue existe pra evitar.
3. **Uma leitura pode ter começo sem fim** (está lendo agora) ou fim sem começo (ela
   registrou depois). `readings.started_on` e `finished_on` são anuláveis de propósito.
4. **`Read Status` mapeia pra `library_entries.status`**, e o StoryGraph tem `did-not-finish`
   de verdade, o que o Goodreads não tem. Aproveite: `did_not_finish` existe no schema e
   um livro abandonado é um fato sobre o seu ano.
5. **`Content Warnings` não tem onde morar hoje.** Não invente uma tabela nessa issue.
   Deixe o campo de fora, e **diga na descrição do PR que ele existe e foi deixado de
   fora**, pra virar uma issue própria. (Clima, ritmo e aviso de conteúdo estão no plano,
   e são um dataset aberto inteiro, não um puxadinho de importador.)
6. **`Tags` viram `collections`**, como as `Bookshelves` do Goodreads.
7. **`Owned?` vira `owned_copies`.** Ter é separado de ler, e quase nenhum app faz isso.

## A régua: SEM PERDAS

Datas (todas as leituras, não só a última), notas, texto de resenha, prateleiras (tags),
ISBN. Se a exportação carrega, a gente guarda. O que a gente decidir não guardar, a
pessoa fica sabendo na tela.

## Como testar que funcionou

```bash
pnpm test lib/import/storygraph
```

Os testes que provam a issue (escreva-os antes do parser):

- Um livro relido três vezes vira **três** linhas em `leituras`, com as três datas.
- `4.25` estrelas vira a palavra certa, e o teste diz **qual** e por quê.
- Uma linha com ISBN vazio não explode, e não vira ISBN `""`. É `null`.
- Uma resenha com vírgula, aspas e quebra de linha atravessa o parser inteira.
- Um `did-not-finish` chega como `did_not_finish`, e não como `read`.

O fixture é a prova. Pegue a **sua** exportação, troque os títulos por outros se quiser,
mas **mantenha a forma dos dados**: as aspas, os campos vazios, os acentos, o cabeçalho
exato. Um fixture que você inventou testa o parser que você imaginou, não o arquivo que
o StoryGraph gera de verdade.

Se os cabeçalhos que você encontrar forem diferentes dos que essa issue supõe, **a issue
está errada e o seu PR conserta ela também.** Diga no PR.

---
title: "Importador: LibraryThing, sem perdas"
labels: good first issue, importador
---

## O que é

Um parser que lê a exportação do LibraryThing (CSV, TSV ou JSON, o LT oferece os três) e
devolve uma lista de `LivroImportado`. Função pura: texto entra, objetos saem.

## Por que importa

O LibraryThing é onde estão os **colecionadores**. Não é quem lê muito: é quem **tem**
muito, quem catalogou a biblioteca inteira, quem sabe qual edição está na estante e de
onde ela veio.

E é a pessoa que o Gume modela melhor do que qualquer concorrente, porque aqui **ter é
separado de ler** (`owned_copies` é uma tabela própria, com procedência em texto livre).
Dois terços da estante de um colecionador de verdade não foram lidos, e todo outro app
trata isso como um erro a ser corrigido: uma barra de progresso parada, uma meta não
batida, uma pendência.

Aqui não é pendência. É a estante.

Quem sai do LibraryThing pro Goodreads perde metade do que catalogou. Quem sair do
LibraryThing pro Gume não pode perder nada, ou a gente não merece essa pessoa.

## Onde mexer, e por onde começar

```
lib/import/librarything.ts            ← parse(texto: string): LivroImportado[]
lib/import/librarything.test.ts
lib/import/fixtures/librarything.tsv  ← uma exportação DE VERDADE, anonimizada
```

**Você não precisa entender o app.** O tipo `LivroImportado` e o gravador
(`lib/import/aplicar.ts`) vêm da issue do Goodreads. Se ela ainda não foi mergeada, o seu
PR **continua completo e mergeável**: parser + fixture + testes.

O `LibraryThing` exporta em três formatos. **Escolha um** (o TSV é o mais limpo, e o JSON
é o mais completo), faça ele muito bem, e diga no PR qual você escolheu e por quê. Fazer
os três pela metade é pior.

## As armadilhas

1. **As datas do LT são bagunçadas, e essa é a dificuldade central dessa issue.** Elas vêm
   como `2019-01-05`, como `Jan 2019`, como `2019`, e às vezes como um **intervalo**
   (`Jan 2019 - Mar 2019`), que é começo **e** fim de uma leitura.

   O schema é seu amigo aqui: `readings.started_on` e `readings.finished_on` são colunas
   separadas, e as duas são anuláveis. Um intervalo vira **uma leitura com as duas datas**.
   Um `2019` sozinho vira uma leitura terminada... **em que dia?**

   **Não invente o dia.** Uma data que você chutou é uma mentira que a pessoa vai carregar
   pra sempre, e ela vai aparecer na retrospectiva do ano dela. Decida (e escreva no PR e
   no teste) o que fazer com uma data parcial. A resposta menos ruim costuma ser: uma
   leitura com data nula, e o ano guardado onde couber. **Uma leitura sem data ainda é um
   fato; uma leitura com a data errada é lixo.**

2. **`Collections` do LT (Your library, Wishlist, Read but unowned, Currently reading)
   NÃO são prateleiras. Elas são duas coisas ao mesmo tempo**, e desembaraçar isso é o que
   faz esse importador prestar:
   - `Wishlist` → `library_entries.status = want_to_read` **e** `owned_copies.state = wanted`
   - `Read but unowned` → status `read`, **e nenhuma linha em `owned_copies`**
   - `Your library` → tem `owned_copies`, e o status vem de outro lugar
   - `Currently reading` → status `reading`

   Enfiar tudo isso em `collections` como prateleiras de texto seria jogar fora a distinção
   que é a razão de essa pessoa estar migrando.

3. **`Tags`, sim, viram `collections`.** É o que a pessoa inventou, e ninguém decide por ela.

4. **`Rating` do LT é meia estrela (0 a 5).** Aqui a nota é uma **palavra**. `fromStars()`
   em `lib/veredito.ts` converte, e a perda **é declarada na tela**.

5. **`Review`, `Comments` e `Private Comments` são TRÊS campos de texto**, e `reviews` tem
   um `body` só, com um índice único em `(user_id, work_id)`. Isso é o mesmo nó da issue do
   Goodreads, e a saída provável é a mesma (uma coluna nova). **Não decida sozinho: fale na
   issue.** Se o PR do Goodreads já resolveu, use o que ele fez.

6. **O LT guarda a EDIÇÃO com carinho** (ISBN, editora, ano, número de páginas, encadernação).
   Traga tudo: é `editions`, e é exatamente o dado que o nosso catálogo mais precisa. O
   colecionador que migrar vai, sem querer, consertar o catálogo pra todo mundo.

## A régua: SEM PERDAS

Datas (inclusive os intervalos), notas, texto de resenha, prateleiras (tags), ISBN, **e o
que ele possui**, que aqui é um dado de primeira classe e não uma nota de rodapé.

## Como testar que funcionou

```bash
pnpm test lib/import/librarything
```

Os testes que provam a issue (escreva-os antes do parser):

- `Jan 2019 - Mar 2019` vira **uma** leitura, com começo **e** fim.
- `2019` sozinho **não inventa** dia nenhum.
- Um livro na `Wishlist` chega com status `want_to_read` **e** `owned_copies.state = wanted`.
- Um livro em `Read but unowned` chega como `read` e **sem** cópia possuída.
- Um campo com aspas, tabulação e quebra de linha atravessa o parser inteiro (é TSV: a
  tabulação dentro do campo é a armadilha clássica).

Depois, com o app de pé, importe a **sua** exportação e confira cinco livros na tela.

Se os cabeçalhos que você encontrar forem diferentes dos que essa issue supõe, **a issue
está errada e o seu PR conserta ela também.** Diga no PR.

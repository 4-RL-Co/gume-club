# O campo de autor está podre, e ele estraga quatro coisas de uma vez

**Tamanho:** grande. É a maior dívida de dado do projeto.
**Não é uma tarefa de primeiro PR.** É trabalho de quem já conhece o acervo.

---

## O que está errado

O acervo veio do dump da Open Library, e o campo `works.author_id` chegou torto de
quatro maneiras diferentes:

| defeito | quantas |
|---|---|
| **obras sem autor nenhum** (`author_id is null`) | **43.739** (11,7% do acervo) |
| **autores duplicados** (o mesmo nome, várias linhas) | 10.386 nomes, **11.858 linhas a mais** |
| **autores que não são pessoas** (`Brazil`, `Portugal`, `[author not identified]`, `invalid author ID`) | 5 linhas, **3.916 obras** |
| **tradutor gravado como autor** | não medido, e existe |
| **nome duplicado dentro dele mesmo** (`Machado de Machado de Assis`, `Platão Platão`) | não medido, e existe |

E o pior deles, porque é invisível:

**`authors.nationality` é nulo em 160.694 de 160.728 linhas. Cem por cento.**

---

## Os quatro lugares que isso estraga

### 1. A busca por autor

**47.655 obras são inalcançáveis por autor.** Elas existem, têm título, têm capa às
vezes, e nenhuma busca por nome de autor jamais as encontra.

Não é teoria. No acervo, hoje:

```
Madame Bovary            autor: [author not identified]
Guerra e Paz             autor: (vazio)
Anna Karenina            autor: (vazio)
Torto Arado              autor: (vazio)
A Morte de Ivan Ilitch   autor: Roberto Algarte     ← é o TRADUTOR
Drácula (Martin Claret)  autor: jaime arbe          ← é o TRADUTOR
```

Quem procura "Tolstói" no Gume não acha Guerra e Paz, e o Gume tem Guerra e Paz.

### 2. A página `/autor/[slug]`

**967 autores não têm nenhuma obra.** A página deles abre e está vazia.

E o inverso, que dói mais: os livros de Tolstói existem, mas não há uma página de
Tolstói para levar a eles. O autor mais lido do mundo não tem endereço aqui.

### 3. O cânone, e a PODA

O cânone (`seed/canone.ts`) casa por **nome de autor**. Uma obra cujo autor é nulo não
casa com ninguém — e a poda apaga o que não casa.

**A poda ia apagar Madame Bovary, Guerra e Paz, Anna Karenina, A Morte de Ivan Ilitch e
Torto Arado.** Não por eles não estarem no cânone: Flaubert, Tolstói e Itamar Vieira
Junior estão. Por a ficha não saber de quem é o livro.

E melhorar o casamento de nome **não resolve isto**, e é importante entender por quê:
não há nome errado para consertar. **Não existe uma linha de autor chamada Flaubert no
acervo. Nem Tchékhov. Nem Ishiguro. Nem Itamar Vieira Junior.** Os livros estão lá, com
o autor em branco. Não há o que casar.

### 4. A estatística de nacionalidade

`authors.nationality` é nulo em **100%** das linhas. A seção de países da
`/estatisticas` — "você leu autores de 7 países" — **não tem dado nenhum por trás**. Ela
é uma tela que não pode funcionar.

---

## O conserto, em três frentes

**1. Preencher o autor pelo ISBN.** As obras sem autor que têm ISBN podem ser
consertadas pelo Google Books e pela Open Library, que devolvem o autor. É o mesmo cano
do backfill de capa, e cai na mesma cota de mil consultas por dia.

**2. Fundir os duplicados.** `Machado de Assis` / `Machado Assis` / `J. Machado de
Assis` / `Machado de Machado de Assis` são a mesma pessoa. Fundir é escolher a linha
canônica, apontar as obras para ela e apagar as outras — com as correções de
bibliotecário (`revisions`) sobrevivendo, porque elas são contribuição de gente.

**3. Preencher a nacionalidade.** A Open Library tem o país do autor na API de autores
(`/authors/OL...json`), e ela **não tem cota**. São 929 autores no acervo depois da
poda: uma tarde. É o que faz a melhor tela do app existir.

---

## Como saber que consertou

Um teste que procura, **por título**, uma lista de livros que o acervo tem, e exige que
o autor esteja certo:

```
Madame Bovary          → Gustave Flaubert
Guerra e Paz           → Liev Tolstói
Torto Arado            → Itamar Vieira Junior
A Morte de Ivan Ilitch → Liev Tolstói   (e não Roberto Algarte, que traduziu)
```

Enquanto esse teste falhar, a busca por autor está quebrada, e a poda é perigosa.

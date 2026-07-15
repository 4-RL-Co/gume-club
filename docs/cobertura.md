# A cobertura dos 300

Medido em 15 de julho de 2026, contra o catálogo de desenvolvimento (262.569 obras,
298.839 edições).

Reproduzir: `pnpm cobertura` (só lê o banco; grava a medição num JSON ao lado, `cobertura.json`).

---

## O número

| | |
|---|---|
| no catálogo, e com capa em pelo menos uma obra | **316** |
| no catálogo, e sem **nenhuma** capa | **40** |
| **fora do catálogo — não existe uma linha sequer** | **11** |

Dos **367** autores do cânone. (Eram 300; a medição da poda obrigou a incluir a lusofonia — ver [poda.md](./poda.md).)

---

## O que mudou desde julho — os buracos fecharam

A primeira medição, de 12 de julho, encontrou **81 autores fora do catálogo** e um
acervo **torto**: enorme onde não precisava, vazio onde doía. Os buracos tinham forma
nítida — 45 dos 50 mangakás sem nada, os clássicos mundiais em tradução ausentes, a
ciência inteira faltando.

Quase tudo isso foi tapado, e não por acaso: o buraco era **uma tarefa, e não uma
exclusão**, e a tarefa foi feita. O import de mangá trouxe os mangakás; o backfill pelo
Google Books trouxe o contemporâneo e os clássicos. **Sobraram onze.** Tolstói, Flaubert,
Tchékhov, Ishiguro, os best-sellers — todos entraram.

---

## Os onze que ainda faltam

Um autor sem nada no catálogo **não é uma exclusão — é uma tarefa.** A poda
(`lib/db/migrations/0032_poda.sql`) mantém todos os 300, existam eles hoje ou não. Estes
são o que resta:

- **Seis do cânone escolhido:** Morgan Housel, Ana Claudia Quintana Arantes, Junior
  Rostirola — e três mangakás: **Yusuke Nomura, Kazue Kato, Tsukasa Abe.**
- **Cinco do mundo:** **Yasunari Kawabata**, Banana Yoshimoto, **Daniel Kahneman**,
  Heródoto, **Davi Kopenawa** — a ausência do Kopenawa é a que mais dói, porque *A Queda
  do Céu* é dos livros brasileiros vivos mais importantes.

Onze tarefas nomeadas. Cada uma entra pelo mesmo cano que trouxe as outras: o Google
Books para o contemporâneo, o import de mangá para os três que faltam.

---

## O buraco do mangá — quase fechado

| | |
|---|---|
| mangakás no cânone | 50 |
| **sem nada no catálogo** | **3** |
| obras somadas de todos eles | **2.633** |

Era **45 de 50** em julho, com **sete obras** somadas — três delas volumes de Berserk. O
import fechou quarenta e dois: agora são **2.633 obras** de mangá, e faltam só Yusuke
Nomura, Kazue Kato e Tsukasa Abe.

**Este era o argumento inteiro para importar do AniList** — não uma melhoria, a diferença
entre ter e não ter. Foi feito, e a medição é a prova.

---

## A capa ainda é a dívida

| | |
|---|---|
| obras dos 300 no catálogo | **12.193** |
| **delas, com capa** | **2.802 (23%)** |

O autor existe; a maioria das obras dele ainda entra sem capa. Dos 262.569 títulos do
acervo inteiro, só **33.142 têm capa** — o dump da Open Library é forte em ficha e fraco
em imagem. O backfill de capa (`scripts/backfill-covers.mjs`) é a tarefa longa que ainda
corre, e é por isso que o número da capa é o que menos avançou.

---

## Como a medição casa os nomes, e onde ela chuta

Três degraus, do seguro ao duvidoso, e cada casamento diz em qual entrou:

1. **exato** — o nome, sem acento e sem pontuação, é igual. Não tem como errar.
2. **invertido** — os mesmos tokens em outra ordem. "Oda Eiichiro" = "Eiichiro Oda".
   Isto resolve o nome japonês inteiro sem chutar: não é semelhança, é igualdade de
   conjunto.
3. **parecido** — trigrama acima de 0,75. É o único que chuta, e por isso ele sai
   listado no terminal com os dois nomes lado a lado, para olho humano conferir.

Nome curto demais (`ONE`, `CLAMP`, `Homero`) só casa no degrau 1 — por similaridade,
"ONE" casaria com meio catálogo.

**Um erro que já aconteceu, e que o código agora impede:** a consulta tinha um
`LIMIT` sem `ORDER BY`. Para um nome comum, o Postgres devolvia dezenas de parecidos
e o casamento **exato** ficava fora do corte — e o relatório dizia "não existe no
catálogo" sobre um autor que existia, escrito igualzinho. Foi assim que Mário de
Andrade e Sêneca apareceram como buraco na primeira medição. Um falso buraco é pior
que buraco nenhum: ele vira tarefa que não existe, e faz a poda apagar o que devia
ficar.

---

## Um quarto degrau, e o falso buraco que ele desfez

A primeira medição declarou que o acervo **não tinha Kentaro Miura**. Tinha: três
volumes de Berserk, guardados sob o autor `三浦建太郎 (Kentaro Miura)` — o kanji **e** o
nome romano, no mesmo campo.

Contra "Kentaro Miura", isso não é igual (degrau 1), não é o mesmo conjunto de palavras
(degrau 2, sobra o kanji), e a nota do trigrama afunda por causa do kanji (degrau 3).
Nenhum dos três pegava.

O degrau **contido** — *todas* as palavras do nome procurado aparecem no nome do
catálogo — resolve isso. E, de brinde, resolveu o `Jorge Leal Amado de Faria`.

**Ele é generoso, e isso é de propósito.** Procurando "Jorge Amado", ele também casa
`Paloma Jorge Amado` (a filha), a `Fundação Casa de Jorge Amado` e cinco colóquios
acadêmicos. Fica assim mesmo, porque quem usa este casamento é a **poda**: guardar por
engano os livros da Paloma custa algumas centenas de fichas; apagar por engano o
`Luís de 1524?-1580 Camões` custa Camões.

**Consequência, e ela precisa estar escrita:** a contagem de obras por autor deste
relatório é um **teto**, e não um número exato. "Jorge Amado, 152 obras" quer dizer "até
152 obras que têm alguma coisa a ver com Jorge Amado".

---
title: "Importador: CSV do Goodreads, sem perdas"
labels: good first issue, importador
---

> ✅ **JÁ ENTREGUE nesta rodada. NÃO ABRIR como issue.** O texto abaixo fica como registro
> da régua que foi seguida (o "sem perdas"), e não como trabalho a fazer.

> **Este é o primeiro dos seis importadores, e é o que abre caminho para os outros cinco.**
> Ele é maior que os outros de propósito: além do parser do Goodreads, ele cria a
> espinha que StoryGraph, Skoob, LibraryThing, Kindle e Kobo vão reusar. Se você quer
> algo menor para começar, pegue a issue do **ISBN-10** ou a do **leitor de código de
> barras**: as duas são de uma tarde.

## O que é

Uma tela onde a pessoa joga o `goodreads_library_export.csv` e a estante dela aparece
aqui inteira: datas de leitura, notas, texto de resenha, prateleiras, ISBN. Tudo.

## Por que importa

Quem tem dez anos de Goodreads não vai redigitar quatrocentos livros. Ela vai tentar
importar, ver que as datas de leitura sumiram, e voltar pro Goodreads. É isso que
acontece hoje na maioria dos concorrentes, e é o maior motivo isolado de as pessoas
nunca terminarem de migrar de uma plataforma que já superaram.

Uma migração pela metade é pior que nenhuma: ela consome o entusiasmo da pessoa e
entrega uma estante mutilada, que ela vai ter que consertar à mão para sempre.

## A régua: SEM PERDAS

Não é um objetivo, é a definição de pronto. O que a exportação do Goodreads carrega,
o Gume guarda:

| Coluna do Goodreads | Onde ela mora aqui |
|---|---|
| `Title`, `Author` | `works.title`, `authors.name` |
| `ISBN`, `ISBN13` | `editions.isbn13`, `identifiers` |
| `Publisher`, `Number of Pages`, `Year Published` | `editions` |
| `Original Publication Year` | `works.first_published` (o ano em que a OBRA foi escrita, e não o em que esta edição foi impressa: são fatos diferentes) |
| `Binding` | `editions.format` |
| `Exclusive Shelf` (`to-read` / `currently-reading` / `read`) | `library_entries.status` |
| `Bookshelves` (as prateleiras que ela inventou) | `collections` + `collection_items` |
| `Date Read`, `Date Added` | `readings.finished_on` (tipo `date`, nunca `timestamptz`), `library_entries.added_at` |
| `My Rating` (1 a 5) | `ratings.value`, via `fromStars()` em `lib/veredito.ts` |
| `My Review` | `reviews.body` |
| `Private Notes` | `reviews.private_note`. **Existe no schema, e o importador já grava.** |
| `Read Count` | uma linha em `readings` por leitura. Releitura é de primeira classe aqui. |
| `Owned Copies` | `owned_copies` (ter é separado de ler) |

## Onde mexer, e por onde começar

**Comece pelo parser, e ele é uma função pura.** Nada de banco, nada de tela, nada de
entender o app. Um texto entra, uma lista de objetos sai:

```
lib/import/goodreads.ts     ← parse(texto: string): LivroImportado[]
lib/import/goodreads.test.ts
lib/import/fixtures/goodreads.csv   ← uma exportação DE VERDADE, anonimizada
```

O tipo `LivroImportado` é o contrato que os outros cinco importadores vão preencher.
Crie-o em `lib/import/tipos.ts`:

```ts
export type LivroImportado = {
  titulo: string;
  autor: string | null;
  isbn13: string | null;
  isbn10: string | null;
  editora: string | null;
  anoEdicao: number | null;
  anoObra: number | null;
  paginas: number | null;
  formato: "hardcover" | "paperback" | "ebook" | "audiobook" | "other" | null;

  status: "want_to_read" | "reading" | "read" | "did_not_finish";
  prateleiras: string[];

  /** Uma por vez que leu. Datas em "YYYY-MM-DD", porque o schema usa `date`. */
  leituras: { comecou: string | null; terminou: string | null; abandonou: string | null }[];

  estrelas: number | null;      // 1..5, como a fonte guarda. Vira palavra na hora de gravar.
  resenha: string | null;
  notaPrivada: string | null;

  possui: boolean;
  obtidoEm: string | null;
  obtidoNota: string | null;
};
```

**Depois, o gravador**, em `lib/import/aplicar.ts`. Ele **não inventa casamento de
livro**: chama o `findOrCreateWork()` que já existe em `lib/library.ts`, que casa por
ISBN, depois pela chave da Open Library, depois por título + autor. Esse matcher é
escrito à mão e revisado à mão (ver AGENTS.md). Não escreva um segundo.

**Por último, a tela**, em `app/importar/`. Um `<input type="file">`, e o relatório
(abaixo). Copie o desenho de `components/paste-list.tsx`, que já faz a mesma dança:
mostra o que achou **antes** de escrever qualquer coisa na estante.

## As armadilhas que vão te pegar

Elas são o trabalho de verdade. Cada uma vira um teste:

1. **O ISBN vem blindado pro Excel:** `="9788535902775"`. Se você não tirar o `="` e o
   `"`, todo ISBN falha e todo livro vira duplicata.
2. **`My Rating` igual a `0` quer dizer "não avaliei"**, e não "zero estrelas". Gravar
   `0` estoura o check `ratings_words` (o banco só aceita 1..5), e é bem que estoure.
3. **`Date Read` guarda só a ÚLTIMA leitura**, mesmo com `Read Count` = 3. A perda é da
   FONTE, não sua. O certo: crie as 3 linhas em `readings`, a última com a data e as
   outras com data nula. Uma leitura sem data é um fato ("eu li, não sei quando"), e
   `readings.started_on` é anulável exatamente para isso. Jogar as outras duas fora
   seria apagar duas leituras que aconteceram.
4. **`My Review` vem com HTML** (`<br/>`, `<i>`). Vira texto limpo, e nunca HTML cru
   dentro do banco.
5. **1 e 2 estrelas caem na mesma palavra aqui** ("não gostei"). Isso é perda, e ela
   tem que ser **declarada na tela**. Ver `lib/veredito.ts`, que já diz isso e já tem a
   função pronta.
6. **`Bookshelves` é uma lista separada por vírgula**, e inclui as prateleiras
   exclusivas (`to-read`, `read`). Essas três não viram `collections`: elas já são o
   `status`. Criar uma estante chamada "read" com 300 livros dentro é ruído.
7. **Um CSV de 4 mil linhas não pode virar 4 mil consultas em série.** Ponha um teto
   (`lib/limits.ts` é o único lugar onde teto mora) e escreva em lote.

## ~~A decisão que essa issue esbarra~~ — RESOLVIDA. A issue estava desatualizada.

Esta seção dizia que a nota privada "não tem lugar hoje", e propunha três saídas, sendo
uma delas uma migration para criar a coluna.

**A coluna já existe.** `reviews.private_note` está no schema (`lib/db/schema.ts`), o
parser já lê a coluna `Private Notes` do Goodreads (`lib/import/parse.ts`), e o importador
já a grava (`lib/import/aplicar.ts`). A recomendação **(b)** foi feita, e o texto ficou de
pé descrevendo um mundo que não existe mais.

Um documento que sobrevive à decisão que ele descrevia é uma mentira educada: a próxima
pessoa lê, acredita, e ou refaz um trabalho que já está feito, ou pior — escolhe a saída
**(a)** e passa a grudar a nota privada no fim da resenha, misturando duas coisas que a
pessoa manteve separadas de propósito.

`lib/exportar.sql.test.ts` prova que a nota privada sobrevive à viagem de ida e volta.

## Como testar que funcionou

```bash
pnpm test lib/import          # o parser, sem banco nenhum
```

E, com o app de pé (`pnpm dev`), o teste que vale:

1. Exporte a sua estante de verdade do Goodreads (Perfil → My Books → Import and Export).
2. Importe aqui.
3. Abra três livros que você leu e confira, na tela: **a data em que você terminou, a
   sua nota, o texto da sua resenha, e as prateleiras que você tinha inventado.**
4. Importe o **mesmo arquivo de novo**. Nada pode duplicar: nem obra, nem edição, nem
   leitura. O segundo import é um upsert, e essa é a prova de que o casamento funciona.

O passo 4 é o que separa um importador de um gerador de lixo.

## O relatório: a perda é declarada, nunca silenciosa

Terminado o import, a tela diz o que aconteceu, em português de gente (sentence case,
sem jargão, sem em-dash. Ver a seção "A voz" no AGENTS.md):

> 412 livros entraram na sua estante.
> 38 notas viraram palavra: aqui, 1 e 2 estrelas são as duas "não gostei".
> 7 livros a gente não encontrou. Eles estão aqui embaixo, e você pode cadastrar na mão.

Perda declarada é honesta. Perda silenciosa é como o catálogo do concorrente virou lixo.

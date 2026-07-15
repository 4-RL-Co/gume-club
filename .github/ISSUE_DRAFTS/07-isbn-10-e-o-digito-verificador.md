---
title: "ISBN-10 vira ISBN-13, e um ISBN torto nunca entra"
labels: good first issue, dados de livro
---

> **Se você quer o menor primeiro PR desse repo, é esse.** É uma função pura, num arquivo
> novo, com teste, sem banco e sem tela. E ele multiplica o valor dos seis importadores.

## O que é

Um módulo `lib/isbn.ts` que faz duas coisas que o repo precisa e não tem:

1. **Converte ISBN-10 em ISBN-13.** É uma conta determinística, sem consultar nada.
2. **Confere o dígito verificador.** Um ISBN com um dígito trocado é detectável, e hoje ele
   passa direto.

E depois, uma mudança de duas linhas em `lib/library.ts` pra usar isso.

## Por que importa

Hoje, o casamento de livro tem um buraco. Olhe o `findOrCreateWork()`, em
[`lib/library.ts`](../../lib/library.ts), no passo 1:

```ts
// 1. an ISBN we already carry settles it outright
if (input.isbn13) {
  const [known] = await db.select(...).from(editions).where(eq(editions.isbn13, input.isbn13))
  ...
}
```

**Ele só casa por `isbn13`.** O `isbn10` é recebido, é gravado na tabela `identifiers`, e
**nunca é usado pra procurar nada**. A tabela `identifiers` (que existe justamente pra isso,
e cujo comentário diz "o matcher de importação lê isto primeiro") **não é consultada por
ninguém**.

Agora junte com o fato: **uma parte enorme das linhas de um CSV do Goodreads ou do
LibraryThing só tem ISBN-10.** Livro publicado antes de 2007 é ISBN-10, e é metade da estante
de qualquer leitor de verdade.

Resultado, hoje: **esses livros não casam com o catálogo.** Eles caem no casamento por título
+ autor (que erra com acento, com subtítulo, com "A" no começo) e, quando ele erra, **nasce
uma obra nova**. O catálogo tem 414 mil edições em português esperando por esses livros, e o
import passa reto por elas e cria duplicata.

É um bug de uma linha que estraga os seis importadores de uma vez. **Conserta ele, e os seis
melhoram juntos.**

O segundo motivo, o dígito verificador: `editions.isbn13` é **unique**. Um ISBN digitado
errado (e as pessoas digitam errado, e os CSVs vêm errados) gruda no livro errado, **pra
sempre, e pra todos os leitores**, porque o catálogo é compartilhado. O dígito verificador
pega isso de graça, antes de entrar.

## Onde mexer, e por onde começar

**Arquivo novo, `lib/isbn.ts`:**

```ts
/** 8535902775 → 9788535902775. Determinístico: prefixo 978, e recalcula o dígito. */
export function toIsbn13(isbn10: string): string | null

/** O dígito verificador fecha? Vale pros dois tamanhos. */
export function isValidIsbn(isbn: string): boolean
```

As duas contas são padrão e estão documentadas em qualquer lugar (a da Wikipedia serve). São
umas 20 linhas no total. **A parte difícil não é a conta: é a lista de casos que você vai
testar.**

Já existe um `asIsbn()` em [`lib/catalog.ts`](../../lib/catalog.ts), mas ele só confere o
**formato** (13 dígitos, ou 9 dígitos e um X). Ele não converte e não confere o dígito. Use-o
como vizinho, não o duplique.

**Depois, use.** Em `findOrCreateWork()`, no passo 1: se veio um `isbn10` e não veio um
`isbn13`, converta e procure com o resultado. São duas linhas.

> **Cuidado, e leia isso:** o casamento de importação está na lista de "não vibe-code" do
> [AGENTS.md](../../AGENTS.md). Isso não quer dizer "não mexa": quer dizer **diff pequeno,
> escrito à mão, com teste**. Não reescreva o `findOrCreateWork()`. Adicione o mínimo, e deixe
> o resto exatamente como está.

## Se você quiser ir um passo além (opcional, e separe em outro commit)

Faça o `findOrCreateWork()` consultar a tabela `identifiers` no casamento, e não só a coluna
`editions.isbn13`. Isso faz o **ASIN** (Kindle) e a chave do Google Books casarem também, e é
o que o comentário da tabela sempre prometeu. Se ficar grande, **abra uma issue separada**:
essa aqui já entrega valor sozinha.

## Como testar que funcionou

```bash
pnpm test lib/isbn
```

Os testes (escreva antes do código, e veja falhar):

- `toIsbn13("8535902775")` devolve `"9788535902775"`. Esse é o Dom Casmurro da Companhia das
  Letras, e ele está no nosso catálogo: dá pra conferir de verdade.
- Um ISBN-10 terminado em `X` converte certo. O `X` vale 10, e é o caso que quase todo mundo
  erra.
- `isValidIsbn("9788535902776")` é `false` (o último dígito está trocado).
- Um ISBN com hífen e com espaço funciona: `"978-85-359-0277-5"`. É assim que ele vem no CSV.
- Uma string vazia, um `null`, um texto qualquer: devolve `null` ou `false`, e **não estoura**.

E o teste que prova o porquê da issue, com o banco de pé:

1. Ache no catálogo uma edição que tenha `isbn13`.
2. Chame `findOrCreateWork()` passando **só o ISBN-10 equivalente**.
3. **Ele tem que achar a edição que já existe, e não criar uma obra nova.**

Esse teste falha hoje. É pra isso que a issue existe.

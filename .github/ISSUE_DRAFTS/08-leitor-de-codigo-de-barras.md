---
title: "Leitor de código de barras: aponte a câmera pra contracapa"
labels: good first issue, estante
---

## O que é

Um botão na busca que abre a câmera, lê o código de barras da contracapa do livro e cai
direto no resultado.

## Por que importa

A pessoa está **com o livro na mão**. Ela acabou de comprar no sebo, ou está montando a
estante dela num sábado à tarde, com trinta livros empilhados no chão.

Digitar "Memórias Póstumas de Brás Cubas" trinta vezes, com acento, é o que faz ela parar no
sétimo livro e nunca mais voltar. Apontar a câmera e ouvir um bip trinta vezes é outra coisa
completamente diferente: **vira jogo, e ela termina a estante.**

O ISBN está impresso na contracapa de todo livro desde 1970. É o único identificador que um
leitor pode **segurar**, e a gente está pedindo pra ele digitar o título.

## A boa notícia: metade já existe

A busca por ISBN **já funciona**. Está tudo pronto:

- `asIsbn()` em [`lib/catalog.ts`](../../lib/catalog.ts) reconhece um ISBN com hífen e espaço.
- `searchLocal()` já trata ISBN como caso exato, e ele ganha de tudo.
- O catálogo tem **414 mil edições em português** esperando.

**Falta a câmera.** Está no plano assim, com essas palavras: "a busca por ISBN já existe;
falta a câmera".

## Onde mexer, e por onde começar

Um componente cliente novo, e mais nada:

```
components/barcode.tsx      ← "use client"
```

E um botão pra ele em [`components/live-search.tsx`](../../components/live-search.tsx), que é
onde a busca mora hoje.

A API é a **`BarcodeDetector`, nativa do navegador**. Sem dependência nova, sem WebAssembly,
sem biblioteca:

```ts
const detector = new BarcodeDetector({ formats: ["ean_13"] });
const codigos = await detector.detect(video);
```

`ean_13` é o formato certo: **o código de barras de um livro É o ISBN-13.** Os números
impressos embaixo das barras são os mesmos que você digitaria. Não é uma conversão, é a mesma
coisa.

Quando ele achar, chame a busca que já existe. **Não escreva busca nova.**

## As armadilhas

1. **O Firefox e o Safari não têm `BarcodeDetector`** (confira o estado hoje, isso muda). Então:
   **teste se ela existe antes de mostrar o botão.** Se não existe, o botão não aparece, e a
   busca por texto continua ali, como sempre esteve. Ninguém vê um botão quebrado, e ninguém vê
   uma mensagem de erro explicando uma API de navegador pra uma pessoa que só queria cadastrar
   um livro.

   ```ts
   if (!("BarcodeDetector" in window)) return null;
   ```

2. **A permissão de câmera pode ser negada, e isso é normal, não é erro.** Se a pessoa disser
   não, feche e siga a vida. Nada de "você precisa permitir o acesso à câmera para continuar".
   Ela não precisa: ela pode digitar.

3. **Desligue a câmera.** Um `<video>` que continua rodando depois que o componente sumiu é uma
   luzinha acesa no computador da pessoa e a bateria do celular dela indo embora. Pare as
   tracks no cleanup do `useEffect`.

4. **Só sobre `https`** (ou `localhost`, que é onde você vai desenvolver). Não é bug.

5. **O livro pode não estar no catálogo.** Aí a tela mostra o caminho que já existe: cadastrar
   à mão ([`components/manual-book-form.tsx`](../../components/manual-book-form.tsx)), **já com o
   ISBN preenchido**, porque você acabou de ler ele. Não faça a pessoa digitar o número que a
   câmera acabou de ver.

6. **Alguns livros brasileiros trazem DOIS códigos de barras:** um é o ISBN, o outro é o preço.
   Se você ler o de preço, vai buscar um livro que não existe. O de preço costuma começar com
   `978` ou `979`... **não**: o do ISBN é que começa assim. Filtre por isso, e escreva um teste.

## A tela

Leia o [docs/design.md](../../docs/design.md) antes. E lembre da voz (AGENTS.md, seção "A voz"):
a tela fala com **leitores**, não com desenvolvedores. Sentence case, sem em-dash, sem jargão.

Errado:

> Erro: BarcodeDetector API não suportada neste browser.

Certo:

> Aponte para o código de barras, na contracapa.

Existe um teste que **quebra o build** se você escrever jargão numa tela: `lib/voice.test.ts`.
Ele é o revisor, e ele não perdoa.

## Como testar que funcionou

Com `pnpm dev` e o celular na mesma rede (ou o navegador do computador com uma webcam):

1. Pegue um livro de verdade da sua estante.
2. Aponte a câmera pra contracapa.
3. **O livro certo aparece.** Sem digitar nada.
4. Pegue um livro que não está no catálogo. A tela oferece o cadastro à mão, **com o ISBN já
   preenchido**.
5. Abra no Firefox. **O botão simplesmente não está lá, e nada está quebrado.**

O passo 5 é o que a maioria das pessoas esquece, e é o que separa isso de um PR que quebra o
app pra metade dos visitantes.

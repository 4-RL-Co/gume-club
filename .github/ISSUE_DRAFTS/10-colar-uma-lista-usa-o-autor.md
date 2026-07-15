---
title: "Colar uma lista: use o autor que a pessoa escreveu"
labels: good first issue, dados de livro
---

## O que é

Duas correções numa função de vinte linhas, `matchList()`, em
[`app/buscar/actions.ts`](../../app/buscar/actions.ts):

1. Ela **joga fora o autor** que a pessoa digitou. Use.
2. Ela faz **uma consulta por linha, em série**. Quarenta livros são quarenta idas ao banco,
   uma esperando a outra.

## Por que importa

"Colar uma lista" é o importador que já existe, e é o que os amigos da pessoa vão usar de
verdade, porque **eles não têm arquivo de exportação: eles têm um bloco de notas com quarenta
títulos.** Está escrito no comentário do [`components/paste-list.tsx`](../../components/paste-list.tsx),
e é a coisa mais certa desse repo.

E hoje ele funciona pela metade. A tela **pede** o autor:

> Um título por linha. Se você tiver o autor, escreva depois de um traço.

E a função **descarta** o autor na linha seguinte:

```ts
// uma busca boa é o título; o autor depois do travessão só atrapalha o trigrama
const query = line.split(/\s+[—–-]\s+/)[0]?.trim() || line;
const hits = await searchAll(query);
out.push({ line, hit: hits[0] ?? null });
```

O comentário está certo sobre o motivo (jogar a linha inteira no trigrama piora a busca) e
errado sobre a conclusão. **Pedir uma informação e não usar é pior do que não pedir**: a pessoa
escreveu "Dom Casmurro, Machado de Assis" achando que o autor ia ajudar, e ele foi pro lixo.

O estrago é concreto. O catálogo tem 414 mil edições, e um título como "Ensaio sobre a
cegueira" ou "A metamorfose" traz dezenas de candidatos: a obra, a adaptação, o estudo crítico,
o guia de leitura. **`hits[0]` pega o primeiro, que é um chute.** O autor, que estava ali na
mão, era exatamente o desempate, e a gente escolheu não olhar pra ele.

E um livro errado que entra sozinho na estante é um erro que ninguém percebe por dois anos.
O próprio comentário do arquivo diz isso.

## Onde mexer, e por onde começar

Um arquivo, uma função: `matchList()` em [`app/buscar/actions.ts`](../../app/buscar/actions.ts).

**Não mexa no SQL.** A busca (`searchLocal()`, em `lib/catalog.ts`) já é boa, e já devolve o
autor em cada resultado. Ela já perdoa acento e erro de digitação, e o comentário dela explica
por quê, em detalhe, três vezes. **Você não precisa entender aquele SQL pra fazer essa issue.**

### 1. Use o autor pra desempatar

A busca já devolve `hit.author`. Então:

```
"Ensaio sobre a cegueira — Saramago"
   ↓ separe
título: "Ensaio sobre a cegueira"    autor: "Saramago"
   ↓ busque pelo TÍTULO (como hoje, e é o certo)
   ↓ entre os candidatos, prefira aquele cujo autor casa com "Saramago"
```

O casamento do autor **tem que perdoar**, porque a pessoa escreve "Saramago" e o catálogo diz
"José Saramago". Compare por palavra, e não por nome inteiro: é o mesmo erro que já foi
consertado três vezes no SQL da busca, e o comentário do `lib/catalog.ts` conta a história e
diz a lição em voz alta: *"comparar o que a pessoa digitou com o NOME INTEIRO exige que ela
saiba o nome inteiro, e ninguém sabe."*

**Não jogue fora o candidato cujo autor não bate.** Se nenhum casar, devolva o primeiro,
como hoje. O autor **desempata**, ele não filtra: a pessoa pode ter escrito o autor errado, e
ela ainda quer o livro dela.

### 2. Pare de esperar quarenta vezes

O `for` com `await` dentro roda uma consulta por vez. Cem linhas (que é o teto em
`lib/limits.ts`) é cem idas ao banco, uma atrás da outra, com a pessoa olhando pra um botão
escrito "procurando".

Rode em paralelo, **com um limite** (umas 5 ou 10 por vez). Sem limite, cem consultas
simultâneas derrubam o pool de conexões e a página de todo mundo junto (existe até um teste do
pool: `lib/pool.sql.test.ts`).

## As armadilhas

1. **As pessoas escrevem o traço de quatro jeitos:** `-`, `–`, `—`, e às vezes `,` ou ` por `.
   O código de hoje já pega três. Não invente um formato: **leia o que as pessoas escrevem**, e
   escreva um teste por formato.
2. **Uma linha pode não ter autor nenhum.** É o caso mais comum. Nada pode piorar pra ela.
3. **O autor pode vir primeiro:** "Machado de Assis - Dom Casmurro". Vale detectar? Talvez, e
   talvez seja outra issue. **Se você não for resolver, não finja que resolveu.**
4. **O teto continua sendo o teto.** `LIMITS.listLines` é 100 e `LIMITS.listLine` é 200. Eles
   moram em `lib/limits.ts`, e esse é o único lugar onde teto mora. Não crie um segundo.

## Como testar que funcionou

```bash
pnpm test
```

Os testes (escreva antes, e veja falhar):

- `"Ensaio sobre a cegueira — Saramago"` acha o livro **do Saramago**, e não um estudo sobre
  ele.
- `"Dom Casmurro"` sozinho continua achando Dom Casmurro. **Nada pode piorar sem autor.**
- `"Saramago"` escrito por extenso (`"José Saramago"`) casa igual.
- Uma linha sem traço nenhum não estoura.
- Cem linhas não abrem cem conexões ao mesmo tempo.

E o teste que vale, com o app de pé: **cole uma lista de verdade.** Pegue vinte livros da sua
estante de verdade, escreva "título — autor" em cada linha, e veja quantos ele acerta. Depois
apague os autores e veja quantos ele acerta. **A diferença entre os dois números é essa issue.**

Ponha os dois números na descrição do PR. É a melhor prova que existe.

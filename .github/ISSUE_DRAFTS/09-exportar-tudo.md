---
title: "Exportar tudo: JSON, CSV e Markdown, num clique"
labels: good first issue, seus dados
---

> ⚠️ **PARCIALMENTE ENTREGUE.** O JSON e o CSV (com as colunas do Goodreads, sem perdas) já
> existem: `lib/exportar.ts` e `app/api/exportar/route.ts`. **O que continua aberto é só a
> exportação em Markdown** (um arquivo por livro, frontmatter YAML, pronto pro Obsidian).
> Se for pegar esta, o escopo é só o Markdown.

## O que é

Um botão no perfil que baixa a sua estante inteira. Sem pedir e-mail, sem "vamos preparar o
seu arquivo e te avisar", sem fila. Clicou, baixou.

## Por que importa

Essa é a issue que faz todas as outras significarem alguma coisa.

O Gume promete, no README, em voz alta: **"Arquivos que você pode levar embora. Sair deveria
ser fácil. É isso que faz ficar significar alguma coisa."**

Hoje isso é mentira. O perfil diz "em breve você vai poder baixar tudo num arquivo", e a porta
não existe. **Um projeto que promete a saída e não constrói a saída é exatamente o projeto do
qual ele está tentando ser a alternativa.** Cada dia que essa issue fica aberta, a promessa
central do produto é uma frase bonita e nada mais.

E tem o outro lado, o egoísta: **a saída é o que faz ficar ser uma escolha.** A pessoa que sabe
que pode ir embora a qualquer momento é a pessoa que fica sem ressentimento. É a mesma lógica
dos seis importadores, virada pro outro lado, e seria vergonhoso a gente exigir sem-perdas dos
concorrentes e entregar menos.

## Onde mexer, e por onde começar

```
lib/exportar.ts             ← as consultas e os três formatadores
app/api/exportar/route.ts   ← a rota que devolve o arquivo
```

E o botão em [`app/perfil/page.tsx`](../../app/perfil/page.tsx), onde já está a frase do "em
breve" esperando pra ser apagada.

**Comece pelos formatadores, que são funções puras.** Uma lista de livros entra, um texto sai.
Dá pra testar sem banco nenhum:

```ts
export function paraJson(livros: LivroExportado[]): string
export function paraCsv(livros: LivroExportado[]): string
export function paraMarkdown(livros: LivroExportado[]): string
```

## O que tem que sair. A mesma régua dos importadores: SEM PERDAS

Se está no banco e é seu, sai:

- o livro (título, autor, ISBN, editora, ano da edição, **ano da obra**, páginas, formato)
- a estante em que ele está (`want_to_read` / `reading` / `read` / `did_not_finish`)
- **todas** as suas leituras, com as datas (começou, terminou, abandonou). **Releitura é uma
  linha cada.**
- a sua nota (a **palavra**, e não um número. Ver abaixo.)
- o texto inteiro das suas resenhas, **inclusive as privadas**
- as prateleiras que **você** inventou (`collections`)
- as cópias que você tem, com a procedência que você escreveu ("sebo da Praça XI", "presente
  da minha irmã") e a linhagem, se ela existir
- a visibilidade de cada linha

**Aplique a mesma régua que a gente cobra dos outros seis.** Um export que perde as datas de
leitura é exatamente o export do Goodreads de que a gente reclama no README.

## Os três formatos, e por que são três

- **JSON:** o completo, o fiel, o que aguenta reimportar sem perder nada. É o formato do
  arquivo, não da leitura humana. **Se algum dos três tiver que ser perfeito, é esse.**
- **CSV:** o que abre na planilha. É como as pessoas de verdade mexem com listas de livros
  (leia `seed/olegas-shelf.csv`: uma estante real, numa planilha real). Ele achata, e tudo
  bem que ele achate.
- **Markdown:** o que vai pro Obsidian. Um bloco por livro, com frontmatter YAML em cima. É
  o formato de quem escreve sobre o que lê, e é a pessoa que mais se importa com o próprio
  arquivo.

## As armadilhas

1. **A nota é uma PALAVRA.** No banco ela é um `smallint` 1..5 (pra ordenar e filtrar), mas na
   saída ela é `"adorei"`, `"achei ok"`, `"não gostei"`. Está escrito, em maiúsculas, em
   [`lib/veredito.ts`](../../lib/veredito.ts): "na TELA nunca aparece um dígito. Nunca."

   Um arquivo que a pessoa abre é uma tela. **Exportar `4` é reintroduzir a estrela pela porta
   dos fundos**, e é o número que o produto inteiro passou meses tirando. Use `mine()`.

   *(No JSON, guarde os dois: o número, porque ele é o que faz o reimport ser exato, e a
   palavra, porque ela é o que a pessoa lê. No CSV e no Markdown, só a palavra.)*

2. **Você exporta os SEUS dados, e só os seus.** A rota chama `getActor()` e filtra por
   `user_id`. **Não** aceite um `?user=` na URL. Não existe "exportar a estante de outra
   pessoa", nem se ela for pública.

   Existe um teste que **quebra o build** se uma rota nova nascer sem resolver quem está
   falando: [`lib/surface.test.ts`](../../lib/surface.test.ts). Ele é o revisor, e ele está
   certo.

3. **Não passe pelo `lib/authz.ts` pra ler os seus próprios dados privados.** O `visibleTo()`
   filtra o que **os outros** podem ver. Aqui é você lendo você: a resenha privada **tem que
   sair**, senão o export não é o seu arquivo, é a sua vitrine. Filtre por `user_id = você`,
   e ponto.

4. **`Content-Disposition: attachment`**, com um nome de arquivo que faça sentido daqui a três
   anos: `gume-<handle>-2026-07-12.json`. Um arquivo chamado `export.json` na pasta de
   downloads de alguém está morto.

5. **Uma estante de 4 mil livros não cabe na memória de uma vez.** Se ficar grande, faça
   streaming. Mas **não otimize antes**: comece simples, e meça com uma estante de verdade.

6. **Um livro sem edição, sem autor ou sem data existe.** O catálogo veio incompleto (336 mil
   livros sem capa, e está no CONTRIBUTING). O export não pode estourar num campo nulo. Ele
   escreve o que tem, e deixa vazio o que não tem.

## Como testar que funcionou

```bash
pnpm test lib/exportar
```

Os testes (escreva antes):

- Um livro relido três vezes aparece com **as três** leituras, e as três datas.
- Uma resenha privada **está** no arquivo.
- Uma nota `5` vira `"adorei"`, e **nenhum dígito de nota aparece no CSV nem no Markdown**.
- Um título com vírgula e aspas atravessa o CSV inteiro e ainda abre na planilha.
- Um livro sem autor e sem ISBN não estoura.

E o teste que vale, com o app de pé:

1. Baixe o seu JSON.
2. Abra e **procure um livro que você leu duas vezes**. As duas leituras estão lá?
3. **Procure uma resenha privada sua.** Ela está lá?
4. Abra o CSV numa planilha. Ele abre certo, com acento?
5. Jogue o Markdown num vault do Obsidian. Ele vira notas de verdade?

E o teste final, o que fecha o círculo com os seis importadores:

6. **Importe o seu próprio JSON de volta, num usuário novo.** Nada pode faltar, e nada pode
   duplicar.

Se o passo 6 funcionar, a promessa do README virou verdade.

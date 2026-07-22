# Issues de primeiro PR, escritas pra abrir

Onze issues prontas. **Não são issues abertas ainda**: são o texto delas, pra copiar e colar no
GitHub com a label `good first issue`. Cada arquivo tem o título e as labels no cabeçalho.
Quatro já saíram do papel: a **01** (Goodreads), a **02** (StoryGraph) e a **03** (Skoob)
foram entregues e não se abrem mais, e a **09** (exportar) saiu pela metade — só o
Markdown continua aberto. Todas ficam na tabela como registro.

O README promete, em voz alta, que "issues marcadas com `good first issue` são de verdade".
Promessa vazia custa contribuidor: a pessoa chega, procura, não acha nada, e vai embora.
Estas existem pra que a promessa passe a ser verdade.

## O que toda issue daqui tem

Não por formalidade. Porque **uma issue sem isso não é um primeiro PR**, é um convite pra
pessoa ler o app inteiro antes de escrever uma linha:

- o que é, em uma frase
- por que importa, e a dor real que resolve
- **qual arquivo mexer, e por onde começar**
- as armadilhas que esperam por ela (cada uma vira um teste)
- como testar que funcionou
- a régua

## A régua dos importadores: SEM PERDAS

Datas de leitura, notas, texto de resenha, prateleiras, ISBN.

Metade dos concorrentes perde isso, **e é exatamente por isso que ninguém termina de migrar.**
A pessoa importa, vê que dez anos de datas sumiram, e volta pro app que ela já tinha decidido
abandonar. Um importador que perde metade é pior do que nenhum: ele gasta o entusiasmo da
pessoa e entrega uma estante mutilada.

Não é um objetivo. É a definição de pronto.

## A ordem

| # | Issue | Tamanho |
|---|---|---|
| [01](./01-importador-goodreads.md) | Goodreads. **Já entregue, não abrir.** Foi o maior e abriu caminho pros outros cinco: criou a espinha (`lib/import/`) que eles reusam. O texto fica como registro da régua. | ✅ entregue |
| [02](./02-importador-storygraph.md) | StoryGraph. **Já entregue, não abrir**: parser, fixture e as várias datas num campo só, em `lib/import/parse.ts`. | ✅ entregue |
| [03](./03-importador-skoob.md) | Skoob. **Já entregue, não abrir**: a investigação aconteceu e o parser detecta o CSV (`skoob_id`, `estante`). | ✅ entregue |
| [04](./04-importador-librarything.md) | LibraryThing. O importador de quem **coleciona**. | tarde |
| [05](./05-importador-kindle.md) | Kindle. A estante invisível de dez anos. | fim de semana |
| [06](./06-importador-kobo.md) | Kobo. E a decisão do sqlite. | fim de semana |
| [07](./07-isbn-10-e-o-digito-verificador.md) | **ISBN-10 vira ISBN-13.** A menor de todas, e ela melhora as seis de cima de uma vez. | tarde |
| [08](./08-leitor-de-codigo-de-barras.md) | Leitor de código de barras. A busca por ISBN já existe: falta a câmera. | tarde |
| [09](./09-exportar-tudo.md) | Exportar tudo: JSON, CSV, Markdown. **JSON e CSV já existem; falta só o Markdown.** | tarde |
| [10](./10-colar-uma-lista-usa-o-autor.md) | "Colar uma lista" joga fora o autor que a pessoa escreveu. | tarde |
| [11](./11-o-campo-de-autor-esta-podre.md) | O campo de autor está podre, e estraga quatro coisas de uma vez. Dívida de dado de quem já conhece o acervo — **não é primeiro PR.** | grande |

**Se você nunca viu esse repo: comece pela 07.** É uma função pura, num arquivo novo, com
teste. Sem banco, sem tela, sem precisar entender mais nada. E ela conserta um buraco real:
hoje todo livro publicado antes de 2007 passa reto pelo catálogo de quase 300 mil edições e vira
duplicata.

**A que mais importava, a 01 (Goodreads), já está entregue** — e foi ela que abriu a espinha
que os outros importadores reusam. O PR mais valioso que sobra é um dos importadores que
faltam: StoryGraph, Skoob, LibraryThing, Kindle, Kobo.

## As seis dos importadores dependem umas das outras?

Só um pouco, e **nunca a ponto de travar você**.

A issue 01 (Goodreads) já criou o tipo `LivroImportado` e o gravador que escreve no banco. As
outras cinco preenchem esse tipo. **E o seu PR é completo e mergeável por conta própria:**
entregue o parser, o fixture e os testes. O parser é a parte difícil, é a parte que só você
(que tem conta naquele app) consegue fazer direito, e ele é uma função pura que se testa sem
banco nenhum.

Nenhuma das seis exige entender o app inteiro. Se exigisse, não seria um primeiro PR.

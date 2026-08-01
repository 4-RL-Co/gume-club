# AGENTS.md

Contexto para qualquer agente de IA trabalhando neste repo (Claude Code, Cursor, Codex). Leia isto antes de escrever código. Mantenha atualizado **durante** o desenvolvimento, não depois: um AGENTS.md desatualizado é pior que nenhum.

Docs companheiros: [ai/PRD.md](./ai/PRD.md) (o quê) · [ai/PLAN.md](./ai/PLAN.md) (como, em ordem) · [docs/schema.md](./docs/schema.md) · [docs/design.md](./docs/design.md) · [SECURITY.md](./SECURITY.md) · [ai/DECISIONS.md](./ai/DECISIONS.md)

## O que é isto

Gume: um registro de leitura de código aberto. Web primeiro, PWA, auto-hospedável. AGPL-3.0. Instância hospedada em gume.club.

## Stack

- Next.js (App Router) + TypeScript, modo strict
- Postgres + Drizzle ORM. SQL cru onde o Drizzle atrapalha; sempre parametrizado.
- Better Auth (e-mail + OAuth)
- Tailwind + tokens do docs/design.md. Nenhuma biblioteca de componentes importada por inteiro.
- Vitest (unitário)
- pnpm

## Regras

1. **Fatias verticais, nunca horizontais.** Entregue uma feature de ponta a ponta (migration → server action → UI) antes de começar a próxima. Não "construa todos os models primeiro". Ver ai/PLAN.md para a ordem das fases e não pule à frente.
2. **A autorização é checada no servidor, em toda leitura e toda escrita, sem exceção.** Ver SECURITY.md. Uma checagem de dono faltando é um bug P0, não um detalhe.
3. **Nunca confie a filtragem de `visibility` ao cliente.** Toda query que retorna linhas de outro usuário filtra por visibility no SQL.
4. **Sem segredos em client components.** Qualquer coisa num arquivo `"use client"` ou em `NEXT_PUBLIC_*` é pública. Assuma que um atacante lê.
5. **Só queries parametrizadas.** Nunca monte SQL com concatenação de string, nem para um `WHERE` que você acha seguro.
6. **Migrations são append-only.** Nunca edite uma migration que já rodou. Escreva uma nova.
7. **A nota é uma PALAVRA, e no banco é `smallint` 1..5.** Cinco palavras (não terminei, não gostei, achei ok, gostei, adorei), nunca um float, nunca meio ponto, nunca uma escala. Ver lib/veredito.ts.
8. **Datas que o leitor escolheu (`started_on`, `finished_on`) são `date`, não `timestamptz`.** Timestamps aqui criam bugs de erro de um ano na retrospectiva do ano para quem não está em UTC.
9. **Sem em-dash em cópia voltada ao usuário.** Vírgula ou dois-pontos. Sentence case em tudo, incluindo botões.
10. **Vidro é chrome, papel é conteúdo.** Sem `backdrop-filter` em conteúdo que rola. Ver docs/design.md.
11. **Sem IA generativa escrevendo pelo leitor.** Nem resumo do gosto dele, nem resenha, nem recomendação gerada. É uma regra sobre as FEATURES do produto, e não sobre a ferramenta: o Gume é construído com IA, e o README diz isso. O que a gente não faz é pôr IA para falar no lugar de quem lê. Não proponha uma feature dessas. Ver ai/DECISIONS.md.
12. **Quando estiver em dúvida, peça 3 opções com trade-offs e uma recomendação.** Não escolha em silêncio.

## Quem é o dono do projeto, e o que isso exige de você

**Ele é publicitário. É entusiasta, e não programador.** Ele mesmo pediu que isso ficasse escrito aqui.

Três consequências, e nenhuma delas é opcional:

1. **Nenhuma proteção pode depender de "o dono revisa o código".** Ele não vai pegar um bug lendo um diff, e fingir que vai é teatro. A defesa tem que ser **automática**: teste, CI, `pnpm audit:security`, e os testes estruturais que quebram o build sozinhos. É por isso que este repo tem tanto teste que varre o próprio código: eles são o revisor.
2. **Confira o CI depois de todo push.** Verde na sua máquina não é verde. Já foram **nove commits seguidos** empurrados para o `main` com o CI vermelho, e quem descobriu foi ele, pelas notificações do GitHub. O CI é a sentinela dele: deixar o CI vermelho é desligar a sentinela.
3. **Explicar o porquê em português de gente é o trabalho, não gentileza.** Termo técnico só quando ele é o nome exato da coisa, e sempre com a consequência ao lado. Nunca esconda um erro seu atrás de jargão.

E o contrário também é verdade, e vale dizer: **ele julga a tela e o comportamento melhor do que a maioria de quem escreve código.** As melhores correções desta base saíram de observações dele: "o livro está boiando num container gigante", "capa diferente é edição diferente", "escada produz farm". Leve a sério.

## A voz: o Gume fala com leitores, não com desenvolvedores

**Regra permanente.** O app fala com quem lê. O GitHub fala com quem constrói. **Nunca misture.** Nenhuma tela nova pode nascer com esse vício.

**Na tela, jamais:**

- **Referência a arquivo ou processo interno:** `ai/PLAN.md`, `docs/schema.md`, `ai/DECISIONS.md`, "Fase 4", "roadmap", "v0.1", "commit", "issue", "repositório", "pnpm", "rode o seed".
- **Jargão de dev:** "schema", "migration", "endpoint", "cursor", "seed", "transação", "AGPL", "self-host", "open source".
- **Promessa datada em linguagem de projeto:** "chega na Fase 4". Se a coisa ainda não existe, ou não se fala dela, ou se fala **em português de gente**: "em breve".

Errado (era o texto do Perfil):

> Exportação em JSON, CSV e Markdown, com um clique, chega na Fase 4 do ai/PLAN.md.

Certo:

> Seus livros são seus. Em breve você vai poder baixar tudo num arquivo, quando quiser.

**A única exceção:** a página `/sobre` pode dizer, em **uma** frase humana, que o Gume é aberto e que o código está no GitHub, com um link. Só isso, e só ali.

Vale para tudo que o leitor lê: página, botão, rótulo, estado vazio, mensagem de erro, e-mail, texto de meta. Sentence case, sem em-dash, sem emoji. Comentário de código e mensagem de commit são outra conversa: ali pode citar arquivo interno à vontade, porque quem lê é quem constrói.


## NUNCA TRADUZA FALHA DE COMUNICAÇÃO EM AUSÊNCIA DE DADO

**Regra permanente, e é o bug mais caro deste projeto.** Ele já quase matou o catálogo
uma vez, e apareceu **cinco vezes** — sempre com uma roupa nova.

> **"Não achei" e "não consegui perguntar" são coisas OPOSTAS.**

Um `[]` devolvido por um timeout tem exatamente a mesma cara que um `[]` devolvido por
uma busca honesta. E quem lê o relatório não tem como saber a diferença — então acredita
na pior das duas.

### As cinco vezes

| o que aconteceu | o que a gente concluiu | a verdade |
|---|---|---|
| a API da Open Library devolveu **2 capas em 44 livros** | "o catálogo não tem capa" | era a API errada. O **dump** tinha 414 mil edições. **Quase matou o projeto.** |
| **81 autores do cânone** "não existiam" | "o acervo não tem Flaubert" | o **campo de autor** estava quebrado. Madame Bovary estava lá. |
| `[author not identified]` passou por autor | a poda achou que Madame Bovary **tinha** autor | uma etiqueta se disfarçou de pessoa |
| o **429** da AniList virou `[]` | "o mangaká não existe" | era **rate limit**. Vinte mangakás em fila. |
| um `LIMIT` sem `ORDER BY` | "Mário de Andrade não está no acervo" | ele estava lá **162 vezes** |

### A regra

**Todo cliente de API externa** — Open Library, Google Books, AniList, Wikidata, e a
próxima — **LEVANTA** em:

- erro de rede
- timeout
- **429** (cota, rate limit)
- **5xx**

**Nunca devolve lista vazia.** Lista vazia significa **uma coisa só**: a fonte respondeu,
e não tem o que você pediu.

**Quem chama distingue os dois casos na tela.** "Não encontrado" e "não consegui consultar
agora" são mensagens diferentes, e o leitor merece saber qual das duas é.

**Um teste prova isso para cada cliente** (`lib/fontes.test.ts`). Ele quebra o build se um
cliente novo nascer engolindo 429.

### E o irmão dela

Todo script que **mede** o acervo tem que separar as duas colunas: *não achei* e *não
consegui perguntar*. Um relatório que soma as duas é um relatório que mente com número.

### E o irmão que quase apagou o Berserk

Um **tempo esgotado não tem código de status: ele LANÇA.**

O backfill da Wikipédia rodou uma hora, achou **959 sinopses**, e morreu no autor 1.120
de 1.200 com um `DOMException [TimeoutError]`. Nada foi gravado. Ele *tinha* laço de
tentativas — tratava 429, tratava 500, tratava 404. Só que `AbortSignal.timeout` não
devolve `res.status`, e a exceção passou por cima de todo o cuidado.

Consertando os irmãos, apareceu esta linha em `lib/anilist.ts`:

```ts
if (!res) return [];
```

Com a rede fora, a AniList não respondia nada — e a função dizia, com toda a confiança,
que **o mangaká não tem obra nenhuma**. O seed apagaria Berserk do acervo achando que a
fonte tinha respondido. Três linhas acima disso havia um comentário em letras garrafais
dizendo que um 429 não pode virar "não existe".

**Documento não defende código.** `lib/rede.test.ts` defende: ele varre `lib/`,
`scripts/` e `seed/`, e quebra a build se aparecer um `fetch` com prazo fora de um
`try`, ou um caminho de falha que devolva lista vazia.



## UM SCRIPT QUE SÓ ESCREVE NO FIM APOSTA TUDO NA ÚLTIMA LINHA

**Regra permanente.** Todo backfill grava **à medida que acha**, e nunca acumula em
memória para gravar depois do último item.

Não é sobre desempenho: é sobre o que sobra quando dá errado. O backfill da Wikipédia
guardou 959 sinopses na memória por uma hora e morreu antes de escrever a primeira. Se
ele gravasse a cada autor, teria perdido um autor.

E o efeito colateral é de graça: um script que grava à medida pode ser interrompido,
retomado, e **continua de onde parou** — porque o banco já sabe o que ele achou.



## QUANDO UMA LISTA TEM PAPÉIS, NUNCA USE POSIÇÃO

**Regra permanente.** Cinco bugs desta semana são **o mesmo bug**:

| o que a gente pegou | quem era de verdade |
|---|---|
| `authors[0]` do registro de **edição** | o **TRADUTOR** (A Morte de Ivan Ilitch → "Roberto Algarte"; o Drácula da Martin Claret → "jaime arbe") |
| o autor da **série** | o **ILUSTRADOR** (Hikaru no Go é da Yumi Hotta; o Obata desenha) |
| o artista de **Bakemonogatari** | um **ILUSTRADOR CONVIDADO** de um capítulo (a Arakawa desenhou uma capa) |
| `publishers[0]` | a primeira de uma lista de co-editoras |
| o primeiro **nome de autor** que casou | um homônimo, uma instituição, uma etiqueta |

> **A forma do bug é sempre a mesma: usar POSIÇÃO como se fosse PAPEL. A lista tem
> papéis, e a ordem não é um deles.**

### A regra

**`[0]` só é válido quando a fonte DECLARA que a ordem significa alguma coisa.**

Se a lista tem papéis — `author`, `translator`, `illustrator`, `editor`, `letterer`,
`supervisor` — **filtre pelo PAPEL**. Nunca pegue o primeiro.

E se **nenhum papel serve**, **RECUSE o dado** e vire tarefa de bibliotecário. **Não
escolha um item ao acaso e chame de fato.**

### O corolário, e ele é o mais importante

**Campo vazio é honesto. Campo chutado vira fato na tela — e depois vira fato no
dataset CC0 que a gente publica.**

O NISIOISIN escreveu o romance Bakemonogatari, e a AniList **não o lista** no staff do
mangá. A tentação é inferir. A resposta certa é deixar como a fonte deixou, e marcar
como trabalho para uma pessoa.

Um dado errado que a gente inventou é pior que um dado que falta: **o que falta, a gente
vê. O que foi chutado, ninguém sabe que precisa conferir.**

`lib/posicao.test.ts` varre `lib/` e `scripts/` atrás de `[0]` em resultado de fonte
externa, e **exige um comentário justificando cada exceção**.


## Não vibe-code estes

Escreva na mão, revise cada linha: fluxos de auth, gerenciamento de sessão, a camada de autorização (`lib/authz.ts`), o matcher de importação, qualquer coisa que toque em pagamentos. Todo o resto (CRUD, UI, testes, docs, migrations, o código de parsing dos importadores) é livre para o agente.

## Como o código entra no `main`

**Nunca commite direto no `main`.** O `main` é a versão oficial do Gume, e ele tem um porteiro: o CI.

O caminho é sempre este:

```bash
git switch -c a-fatia-que-eu-estou-fazendo
# … trabalho, commits em inglês, cada pedaço que funciona …
git push -u origin a-fatia-que-eu-estou-fazendo
gh pr create --fill        # ou pela API, se o gh não estiver autenticado
# o CI roda no PR. VERDE → eu mesmo faço o merge. VERMELHO → conserto ANTES.
```

**O dono não revisa código** (ele é publicitário, ver acima), e por isso o PR exige **zero aprovações**: quem aprova é o CI. O PR não é burocracia, é a porta onde o teste pode dizer "não" **antes** de o `main` quebrar.

Isso existe porque já falhou: nove commits seguidos foram para o `main` com o CI vermelho, e quem descobriu foi ele, pelas notificações do GitHub. Com o porteiro, aquilo é impossível.

## Workflow por feature

1. Ache a fatia no ai/PLAN.md. Se não estiver lá, adicione e diga por quê.
2. Migration primeiro. Depois lógica de server. Depois UI. Depois teste.
3. Escreva o teste que falha antes da correção, para qualquer bug.
4. Commite sempre que algo funcionar. Commits pequenos, para que uma regressão possa ser bisectada.
5. Depois de terminar uma fatia, atualize o ai/PLAN.md (marque) e adicione ao ai/DECISIONS.md se uma decisão real foi tomada.

## Comandos

```
pnpm dev            # next dev
pnpm db:generate    # drizzle-kit generate
pnpm db:migrate
pnpm test           # vitest
pnpm lint && pnpm typecheck
pnpm audit:security # secret scan + dep audit + authz lint. tem que passar antes do deploy.

git config core.hooksPath .githooks   # uma vez por clone. barra arquivo > 10 MB.
```

**Dado bruto nunca entra no repo.** O `.gitignore` cobre zip, gz, tar, `*-data/`, `data/`, `datasets/`. Mas `.gitignore` não segura um `git add -f`, e uma vez que o blob existe já é tarde: ele fica no object store mesmo sem commit nenhum. Por isso o hook em `.githooks/pre-commit`. Ele é versionado, mas `core.hooksPath` é config local: **ligue no clone**, ou rode `scripts/setup-mac.sh`, que já liga.

## Problemas conhecidos

_(adicione conforme encontrar, para que o próximo agente não os redescubra)_

- **O fallback do Google Books está morto sem chave.** A API anônima devolve `429 quota exceeded`. O `lib/catalog.ts` degrada para "nenhum resultado" em vez de estourar um 500, o que é o comportamento certo, mas na prática só a Open Library está respondendo hoje. Preencha `GOOGLE_BOOKS_API_KEY` no `.env` e o fallback volta a existir.
- **A Open Library é fraca em ISBN brasileiro.** Buscar `9788535902775` (Dom Casmurro, Companhia das Letras) devolve zero, na OL *e* no Google. Não é bug do nosso código: é o buraco que o `scripts/import-openlibrary.mjs` e o cadastro manual existem para tapar.
- **O import rodou.** O `scripts/import-openlibrary.mjs` trouxe o dump da Open Library, e a poda + a deduplicação de autores (migrations 0032–0035) o encolheram para o acervo de hoje: ~262 mil obras, ~299 mil edições, ~123 mil autores. A busca no próprio catálogo é a primária; a Open Library e o Google Books são fallback. Ver `lib/catalog.ts`.
- **`pnpm test` precisa de um Postgres de pé.** O `lib/authz.sql.test.ts` pergunta ao banco de verdade, de propósito (ver SECURITY.md). A CI sobe um serviço; localmente, suba o docker-compose.

## O que o audit-security tranca

O esqueleto existe há muito, e o v0.1 está de pé em cima dele: Next.js + Tailwind v4 com os tokens do docs/design.md, Postgres via docker-compose, Drizzle, `lib/authz.ts`, e CI que roda typecheck, testes e `pnpm audit:security`.

O `scripts/audit-security.mjs` vai quebrar o build se você:
- ler uma env var de servidor, ou importar o banco, de um arquivo `"use client"`
- hardcodar qualquer coisa parecida com uma credencial
- montar SQL a partir de uma string interpolada
- escrever uma checagem de dono em qualquer lugar que não seja `lib/authz.ts`
- escrever em `authors` sem passar pelo portão de `lib/autores.ts`

Essa penúltima não é uma regra de estilo. É o modelo de segurança inteiro: um arquivo pequeno, escrito à mão, revisado por um humano. Não contorne.

O que falta antes de abrir ao público está no ai/PLAN.md e no docs/O-QUE-FALTA-NO-CODIGO.md.

## Onde as coisas estão

- `lib/authz.ts` decide **quem pode ver e tocar o quê**. `lib/auth.ts` decide **quem é**. São arquivos diferentes de propósito: estar logado não é permissão.
- `lib/shelf-view.ts` é vocabulário e rótulos, **sem import de banco**, para que um componente possa renderizar e um teste possa rodar sem Postgres. `lib/shelf.ts`, `lib/book.ts` e `lib/stats.ts` são as queries.
- Toda leitura que pode devolver linha de outra pessoa passa por `visibleTo()`. Se você se pegar reescrevendo a regra de visibilidade em SQL cru, pare: é uma segunda cópia da autorização fora do `lib/authz.ts`, e é exatamente o que o SECURITY.md proíbe.

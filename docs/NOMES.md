# Uma regra para os nomes

**Isto é uma proposta, e nada foi renomeado.** Renomear é a única arrumação deste repositório
que é barata hoje e cara depois: hoje é um `git mv` e um substituir-tudo; com trinta
contribuidores e cem PRs abertos, é um campo minado de conflitos. Então a decisão é do Gabriel,
tomada acordado. Este arquivo existe para que ela seja tomada com os fatos na mesa.

## O problema, medido

O repositório mistura português e inglês sem regra declarada, e isso é a primeira coisa que um
contribuidor vê antes de ler uma linha de lógica. Alguns exemplos reais, hoje:

| Português | Inglês | E são a mesma camada |
|---|---|---|
| `lib/exportar.ts`, `lib/honras.ts`, `lib/moderacao.ts`, `lib/nomes.ts` | `lib/shelf.ts`, `lib/viewer.ts`, `lib/social.ts`, `lib/stats.ts` | sim |
| `lib/falta-no-app.ts` (lista de features que faltam) | `lib/gaps.ts` (a consulta das lacunas do catálogo) | dois conceitos, e o de domínio está em EN |
| `components/gaveta.tsx`, `moldura.tsx`, `prosa.tsx` | `components/glass-bar.tsx`, `dense-list.tsx`, `live-search.tsx` | sim |
| `colecao_id` (coleção de volumes da editora) | `collection_id` (estante do usuário) | dois conceitos, nomes quase idênticos |

Não é que uma língua esteja errada. É que **não há uma regra**, e sem regra cada arquivo novo
é uma moeda jogada para o alto. O sinal que isso manda ("ninguém está no comando aqui") é pior
do que o custo real da inconsistência.

## O que já é verdade, e ninguém escreveu

O código, sozinho, já tende a uma regra, e só a aplica na metade das vezes:

- O **vocabulário do produto** puxa para o português, e com razão: `honra`, `estante`,
  `prateleira`, `insígnia`, `arauto`, `zelador`, `gaveta`, `moldura`, `prosa`. Essas palavras
  **são o produto**. `honra` não é `honor` (é um termo escolhido, com um significado que o app
  inventou); `arauto` não é `herald`. Traduzir isso para o inglês apaga a identidade que a home
  inteira defende.
- A **infraestrutura** puxa para o inglês, e também com razão: `authz`, `viewer`, `rate-limit`,
  `slug`, `zip`, `stats`, `catalog`. É o vocabulário que qualquer engenheiro do mundo lê sem
  tradução, e não tem nada de brasileiro nele.

Ou seja: a regra que resolve 90% dos casos já está latente no código. Falta declará-la e passar
o rodo nos 10% que a violam.

## As três opções

### A. Tudo em português

Renomeia `shelf.ts` → `estante.ts`, `viewer.ts` → `observador.ts`, `authz.ts` → `autorizacao.ts`.

- **A favor:** consistência total. O projeto é brasileiro, a cópia é PT, os comentários são PT.
- **Contra:** o público de contribuidores de open source lê inglês, e termos como `autorizacao`,
  `observador` ou `limitador-de-taxa` são mais longos e menos reconhecíveis que os de mercado.
  `slug`, `commit`, `stats` não têm tradução que alguém use de verdade. Força tradução onde não
  há palavra brasileira consagrada, e cria um segundo dialeto que o contribuidor tem que aprender.

### B. Tudo em inglês

Renomeia `honras.ts` → `honors.ts`, `arauto` → `herald`, `gaveta.tsx` → `drawer.tsx`.

- **A favor:** é o padrão de fato do open source; um contribuidor de fora entra sem atrito.
- **Contra:** **mata a identidade.** `honra`, `arauto`, `zelador`, `gume` são termos que o
  produto cunhou e defende em voz alta. Traduzi-los no código cria uma distância entre o que a
  tela diz (`honra`) e o que o código chama (`honor`), a mesma distância que a entrada
  "uma frase que sobrevive à decisão é uma mentira educada" manda evitar. E contradiz a decisão
  registrada de que o Gume é um projeto brasileiro.

### C. Domínio em português, infraestrutura em inglês  ·  **recomendada**

Uma linha divide as duas: **se a palavra aparece para o leitor ou nomeia um conceito que o Gume
inventou, é português. Se é engenharia genérica que qualquer app teria, é inglês.**

- **Domínio (PT):** `honras`, `estante`, `insígnia`, `arauto`, `zelador`, `moderacao`, `prateleira`,
  `gaveta`, `moldura`, `prosa`, `torneira`, `escada`, `lojas`, `paleta`.
- **Infra (EN):** `authz`, `viewer`, `actor`, `rate-limit`, `slug`, `zip`, `stats`, `catalog`,
  `library` (a camada de dados), `guardar`→`storage`? (ver a lista de violações).

- **A favor:** é a regra que o código já quase segue, então o custo de chegar lá é o menor das
  três. Preserva a identidade onde ela importa e usa o vocabulário universal onde ele não custa
  nada. A fronteira "o leitor vê?" é a mesma que o teste da voz (`lib/voice.test.ts`) já usa para
  decidir o que é PT.
- **Contra:** a fronteira tem casos de fronteira (`library.ts` é infra, mas `estante` é domínio;
  a nota era `verdict.ts`, domínio, e virou `veredito.ts`). Exige julgamento, e um
  arquivo por ano vai cair na linha divisória e precisar de uma decisão. É um custo pequeno e
  recorrente, em vez de um custo grande e único.

## Se for a opção C, o que muda (a lista de violações)

Para decidir com o tamanho real na mão. Estes são os arquivos que hoje estão do lado errado da
fronteira:

- `lib/gaps.ts` → `lacunas.ts` (ou outro nome PT). **NÃO fundir com `falta-no-app.ts`:** investiguei, e são conceitos diferentes: `gaps.ts` é a consulta das lacunas do CATÁLOGO (dado de livro faltando), `falta-no-app.ts` é a lista curada de features que faltam no APP. Coincidem só na palavra "falta".
- ~~`lib/veredito.ts` → `veredito.ts`, `components/veredito.tsx` → `veredito.tsx`~~ **feito** (a
  nota é domínio, e a tela já diz "veredito"). Foi a primeira violação corrigida.
- `colecao_id` (obra) e `collection_id` (item de estante) **não são a mesma coluna**, e não dá
  para "escolher uma": são a coleção-de-volumes-da-editora e a estante-do-usuário. O problema
  real é o oposto de duplicata: dois conceitos com nomes quase idênticos, um convite a confundir
  um pelo outro. Desambiguar (ex.: `series_collection_id` vs `shelf_id`) é migration, e é decisão
  de gente, não de faxina.
- decidir a borda de: `library.ts`, `book.ts`, `people.ts`, `copies.ts`, `curation.ts`,
  `contributors.ts` (infra ou domínio? cada um é uma linha de decisão).

## Comentários, mensagens de commit e colunas

Três decisões menores que andam junto:

- **Comentários: português.** Quem lê um comentário é quem está construindo, e o time é
  brasileiro. Já são PT na maioria, mas `lib/authz.ts` e `lib/viewer.ts` têm comentários em
  inglês, e isso devia alinhar. (O código dentro do comentário, os nomes de função e o SQL, fica
  como está.)
- **Mensagens de commit: português.** Já são, e a voz delas é parte de como este projeto pensa.
  Manter.
- **Colunas do banco: inglês**, com uma exceção declarada para o que é domínio puro sem tradução
  boa. Hoje é quase tudo EN (`added_at`, `author_id`, `abandoned_on`), com alguns vazamentos PT
  (`colecao_id`, `cover_proposals_fila`, `badge_grants_uma_por_pessoa`). Migração de coluna é a
  mais cara de todas (append-only, precisa de migration), então esta é a que menos vale mexer
  agora e a que mais vale **congelar a regra** para não piorar: **coluna nova nasce em inglês.**

## A recomendação, em uma frase

**Opção C, com a regra congelada hoje e a limpeza feita devagar:** todo arquivo, componente e
coluna NOVO segue "domínio em PT, infra em EN" a partir de agora (custo zero, e para a sangria),
e a lista de violações acima vira uma issue de faxina para quando não houver PR aberto colidindo.
Assim a inconsistência para de crescer imediatamente, e some sem um big-bang de renomeação que
quebraria todo mundo que estiver com um branch aberto.

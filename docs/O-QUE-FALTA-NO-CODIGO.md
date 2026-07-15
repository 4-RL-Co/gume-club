# O que falta no código

O [`/o-que-falta`](https://gume.club/o-que-falta) mostra o trabalho aberto do **catálogo**:
os livros sem capa, sem ano, sem editora. Este arquivo é o espelho dele, no **código**.

Mesma ideia, e ela é a do OpenStreetMap: **ninguém atende a um "contribua!" abstrato, e todo
mundo atende a um pedido concreto.** Um repositório que diz "PRs são bem-vindos" e não diz
quais está pedindo pra você adivinhar o que ele quer, e ninguém adivinha. Então aqui está a
lista, agrupada por quanto tempo ela toma, e sem maquiagem.

**As dez primeiras já estão escritas como issues**, em
[`.github/ISSUE_DRAFTS/`](../.github/ISSUE_DRAFTS/), cada uma com o arquivo que se mexe, a
armadilha que te espera e como testar que funcionou.

> **Já entrou** (2026-07-12): o importador de CSV (Goodreads, StoryGraph, Skoob, Fable, e um
> arquivo desconhecido também), a coluna `reviews.private_note` que a régua "sem perdas"
> exigiu, a busca de pessoas com trigrama, o compartilhar e as imagens de link, a correção da
> ficha do autor, e a ordenação da estante com direção e ano. As issues desses foram fechadas
> pelo código; o que sobrou nesta lista é o que **de fato** ainda falta.

O que **não** está aqui, e não vai estar nunca: curtidas, contador de seguidores, ofensivas
(streaks), feed algorítmico, IA generativa, links de afiliado. Não é backlog, é recusa. Está
no [README](../README.md), e é a razão de o resto existir.

---

## Uma tarde

Coisa pequena, isolada, com começo, meio e fim. Se é o seu primeiro PR aqui, é daqui que você
tira ele.

- **ISBN-10 vira ISBN-13, e um ISBN torto nunca entra.** Uma função pura num arquivo novo, e a
  maior alavanca do repo: hoje o `findOrCreateWork()` só casa por `isbn13`, então **todo livro
  publicado antes de 2007 (que é metade de qualquer estante de verdade) passa reto pelo
  catálogo de quase 300 mil edições e vira duplicata.** Conserta um, melhora os seis importadores de
  uma vez. → [issue 07](../.github/ISSUE_DRAFTS/07-isbn-10-e-o-digito-verificador.md)

- **Parser do LibraryThing.** O único dos seis importadores que ainda não existe. O CSV do
  Goodreads, do StoryGraph, do Skoob e do Fable já entram; o LibraryThing tem um formato próprio
  (e é o importador de quem **coleciona**, que é a pessoa que o Gume modela melhor que qualquer
  outro app). → [issue 04](../.github/ISSUE_DRAFTS/04-importador-librarything.md)

- **Leitor de código de barras.** A busca por ISBN já existe: falta a câmera. Um componente
  cliente, sem dependência nova (`BarcodeDetector` é do navegador). → [issue 08](../.github/ISSUE_DRAFTS/08-leitor-de-codigo-de-barras.md)

- **"Colar uma lista" usa o autor que a pessoa escreveu.** A tela pede o autor e a função joga
  fora, na linha seguinte. E faz uma consulta por linha, em série. → [issue 10](../.github/ISSUE_DRAFTS/10-colar-uma-lista-usa-o-autor.md)

- **Vidro acessível.** Auditar toda superfície de vidro por contraste sobre uma capa preta, e
  honrar `prefers-reduced-transparency`. A régua está no [docs/design.md](./design.md), e vidro
  é chrome, papel é conteúdo.

- **Três cards de `/estatisticas` não têm dado, e por isso não existem.** A página foi feita
  para dizer quem você é como leitor, e ela só mostra o que tem dado real: card vazio faz a
  tela parecer quebrada. Os três que ficaram de fora, e o que cada um precisa:

  - **Idioma original** ("quanto você lê traduzido, quanto no original"). **A coluna não
    existe.** O schema tem `editions.language`, que é o idioma DAQUELA edição, e não o da obra.
    Precisa de uma migration (`works.original_language`), e migration aqui é append-only: é uma
    decisão de schema, e não um detalhe de card.
  - **Tradutores.** A coluna `editions.translator` **existe e está vazia em 100% das edições**:
    o import da Open Library não trouxe esse campo. Ninguém rastreia tradutor, e leitor de
    clássico se importa: numa tradução, quem traduz é metade do livro que você tem na mão.
    Precisa de backfill.
  - **Volumes e séries.** A tela já conta separado (ler trinta volumes de Vagabond não é ler
    trinta livros), mas `works.series_id` está nulo em tudo: mangá é a Fase 1.5 do plano, e ela
    não chegou. O card aparece sozinho no dia em que a primeira série existir.

- **O ano da obra está nulo em quase todo o catálogo.** 259.674 das 262.569 obras têm
  `works.first_published` vazio, menos as poucas milhares que já ganharam o ano. O import trouxe o ano
  **da edição** (`editions.published_year`, que é quando aquela impressão saiu) e nunca o ano
  **da obra** (quando ela foi escrita), que são fatos diferentes e o schema separa de propósito.

  A Open Library **tem** esse dado (`first_publish_year`, que a busca já recebe hoje em
  `lib/catalog.ts`). Então isso é um backfill, e não trabalho humano: a página "o que falta"
  chegou a pedir esse ano aos leitores, e pedir a 373 mil pessoas que digitem à mão um número
  que a máquina pode buscar era a tarefa errada com a roupa errada. Saiu da tela e veio pra cá.
  O `scripts/backfill-covers.mjs` é o molde de como fazer.

- **A chave do Google Books não está preenchida.** Sem ela, a API anônima devolve `429` na
  primeira chamada, e o fallback do catálogo passou meses parecendo "sem resultados". Não é
  código: é uma linha no `.env`. Mas alguém precisa saber disso, e hoje só o `AGENTS.md` sabe.

---

## Um fim de semana

Uma fatia vertical de verdade: migration, servidor, tela, teste. Dá pra fazer num sábado, e no
domingo tem coisa nova de pé.

- **Importador do Kindle.** A estante invisível: o que a pessoa leu nos últimos dez anos e nunca
  registrou em lugar nenhum. O CSV genérico já entra; falta o ASIN casar com o catálogo.
  → [issue 05](../.github/ISSUE_DRAFTS/05-importador-kindle.md)

- **Importador do Kobo.** E a decisão do sqlite, que é uma dependência nova num repo com oito.
  → [issue 06](../.github/ISSUE_DRAFTS/06-importador-kobo.md)

- **Exportar em Markdown.** O JSON e o CSV já saem num clique (`lib/exportar.ts`, `app/api/exportar`),
  e o perfil já tem o botão "Baixar a minha estante". Falta só o formato Markdown legível — a porta
  de saída existe, e a promessa central do produto está cumprida.
  → [issue 09](../.github/ISSUE_DRAFTS/09-exportar-tudo.md)

- **Resenhas públicas, o resto.** A resenha já existe e já é privada por padrão (que é a decisão
  certa, e ela é de propósito). Falta o caminho de publicar uma, e ela aparecer na página do
  livro e no feed de quem te segue.

---

## Grande

Não é primeiro PR. É conversa antes de código: abra uma issue e discuta, ou o seu sábado vira
um PR que fica parado.

- **Mangá: séries e volumes.** A tabela `series` existe no schema e **nenhuma linha de código a
  usa**. Falta o cliente da AniList (API GraphQL pública e oficial, não é raspagem), e falta a
  série virar **um** tile na parede de capas, com os volumes dentro. Trinta lombadas quase
  idênticas de Vagabond em fila destruiriam a tela que carrega o produto inteiro. Está no plano
  como Fase 1.5, e "1.5" quer dizer: **não é depois, é agora**, porque é o que o primeiro
  usuário está lendo hoje.

- **Fundir os autores duplicados.** O dump da Open Library trouxe o mesmo autor escrito de
  quatro jeitos ("Machado de Assis", "Machado De Assis", "Machado De ASSIS"), e o unique do nome
  é sensível a maiúscula, então viraram quatro linhas, com as obras repartidas entre elas.

  Hoje existe um **curativo**, e ele está declarado como curativo no comentário do
  `lib/catalog.ts`: um `distinct on` esconde os duplicados **na busca**. O conserto de verdade é
  fundir as linhas, e ele **não volta atrás**: dois homônimos de verdade seriam fundidos junto,
  e não dá pra separar depois. É uma decisão que se toma acordado, e não no meio de outra coisa.

- **i18n.** Português primeiro e primeira classe, depois todas as outras. Hoje o texto está
  cravado nas telas. Isso é um trabalho grande e chato, e é o que decide se o Gume existe fora
  do Brasil.

- **O deploy.** O app **funciona** e **não está no ar**. Não há conta pra criar hoje, e não há
  nada pra alguém usar. Enquanto isso for verdade, todo o resto dessa lista é ensaio.

- **Trechos (highlights).** O `My Clippings.txt` do Kindle e a tabela `Bookmark` do Kobo têm
  tudo que a pessoa grifou em dez anos. **Não existe tabela pra isso**, e criar uma é uma
  decisão de produto, não um puxadinho de importador. Por isso os importadores do Kindle e do
  Kobo **excluem grifos do escopo, de propósito**.

- **Climas, ritmo, avisos de conteúdo, e o dataset CC0.** O grafo aberto de livros que o README
  promete devolver pro mundo. É o que sobrevive ao projeto se o projeto acabar.

- **Clubes, e notificações.** Estão no plano, e estão no "depois, se o v0.1 merecer". Só se as
  pessoas de fato usarem. Não antes.

---

---

## Débito técnico: o diagnóstico honesto

*Feito em 2026-07-12, a pedido, e com números medidos e não estimados.*

Primeiro o que **está bom**, porque isso também é informação e ninguém mede: **zero TODOs de verdade** no código (os cinco que o grep acha são a palavra "todo mundo"). **Um** escape de tipo em 131 arquivos. **Oito** dependências diretas. **47 arquivos de teste** para 131 de código, e os mais importantes varrem o próprio código em vez de testar funções.

**Isto não é um projeto endividado.** É um projeto de amigos com muito menos débito do que a média dos projetos pagos. O que segue é o que existe, em ordem de quanto dói.

### 1. O catálogo tem 10.386 autores duplicados. É o pior, e é o mais caro de consertar.

O dump da Open Library trouxe o mesmo autor escrito de vários jeitos ("Machado de Assis", "Machado De Assis", "Machado De ASSIS"), e o `unique` do nome é sensível a maiúscula. Resultado: **10.386 nomes existem em duas ou mais linhas**, com as obras repartidas entre elas.

Hoje existe um **curativo**, declarado como curativo no comentário do `lib/catalog.ts`: um `distinct on` esconde os duplicados **na busca**. Ele não conserta nada: o Machado continua sendo quatro pessoas no banco, as obras dele continuam divididas, e a página de autor mostra um pedaço do que ele escreveu.

**Por que ainda não foi feito:** o conserto **não volta atrás**. Fundir duas linhas de autor funde dois homônimos de verdade junto, e não dá para separar depois. É uma decisão que se toma acordado, com um plano de reversão, e não no meio de outra coisa.

### 2. O ano da obra está nulo em 100% do catálogo, e a página de estatísticas vive disso.

373.384 de 373.435 obras estão sem `first_published`. O `scripts/backfill-work-years.mjs` existe e resolve, escopado às obras que estão em alguma estante. **Ele nunca rodou no catálogo inteiro**, e enquanto isso a peça central da `/estatisticas` (a distância) funciona para quem tem a estante semeada e nasce vazia para quem chegar depois.

### 3. Não existe RLS, e o app conecta como SUPERUSUÁRIO do banco.

O papel `gume` é **superusuário e dono do banco**. Isso significa duas coisas:

1. **Ligar `ROW LEVEL SECURITY` hoje seria teatro.** Superusuário ignora RLS, e o dono da tabela também (a não ser com `FORCE ROW LEVEL SECURITY`). Daria falsa sensação de proteção e zero proteção.

2. **Uma injeção de SQL em qualquer lugar seria total.** Hoje ela não existe (o `pnpm audit:security` quebra o build se alguém montar SQL a partir de string), mas a defesa é única: se ela cair, cai tudo. Um papel de aplicação com privilégio mínimo seria a segunda camada.

**O conserto:** criar um papel `gume_app` sem superusuário, que não seja dono das tabelas, com `GRANT` só do que ele usa; ligar RLS + `FORCE` nas tabelas de leitor; e apontar o `DATABASE_URL` para ele. As migrations continuam rodando com o dono.

**A autorização de AÇÃO não depende disso**, e é bom deixar claro: "bibliotecário não pode banir" é autorização de ação, mora em `lib/authz.ts` e `lib/moderacao.ts`, e é provada contra o Postgres. RLS é sobre **quais linhas você enxerga**, e seria uma segunda camada, e não a primeira.

### 4. Os testes disputam o Postgres com o `pnpm dev`, e dão VERMELHO FALSO.

**Fato reproduzido seis vezes:** com o `pnpm dev` de pé, `lib/forgiveness.sql.test.ts` e `lib/pool.sql.test.ts` falham. Com ele desligado, passam. Sempre.

**A causa raiz é desconhecida**, e está escrito assim de propósito: os limiares do trigrama são por conexão, o pool é de dez e o Postgres aguenta cem, então **não é conexão esgotada**, e inventar uma explicação seria pior que admitir a ignorância.

**Por que isso é o débito mais perigoso desta lista**, mesmo sendo o menor: um teste que falha por um motivo que não é o dele **treina a pessoa a ignorar o vermelho**. E o vermelho é a sentinela deste repo. Já existe um aviso (`lib/test-setup.ts`) que grita quando o dev está de pé, mas aviso é curativo.

**O conserto de verdade:** um **banco de teste separado** (`DATABASE_URL_TEST`), que é o que todo projeto adulto faz e este ainda não faz. É uma tarde.

### 5. A fila de imagens não sabe guardar o retrato de um autor.

`cover_proposals.edition_id` é `NOT NULL`, então a fila só aceita capa de edição. Por isso o **retrato do autor** é aplicado direto por bibliotecário, em vez de o leitor propor e o bibliotecário aprovar (que é o desenho certo, e o que a capa já faz).

**O conserto:** uma migration (`edition_id` anulável, `author_id` novo, e um check de que exatamente um dos dois está preenchido) mais a tela da fila. Uma fila pela metade seria pior que nenhuma: o leitor propõe, a proposta cai num buraco, e ele nunca mais contribui.

### 6. Arquivos grandes demais para uma tela só.

`app/estatisticas/page.tsx` tem **693 linhas**. `lib/catalog.ts` tem 592, `lib/stats.ts` tem 574, `app/page.tsx` tem 569.

Não é urgente e não é bug: são arquivos longos porque são **densamente comentados**, e o comentário aqui é o que segura as decisões. Mas a página de estatísticas já mistura consulta, formatação e quatro componentes de gráfico, e o próximo card vai doer. **Fatiar os gráficos para `components/` é uma tarde**, e não muda comportamento nenhum.

### 7. O que o README promete e o código ainda não faz.

- **Exportar em Markdown.** JSON e CSV já saem, e o perfil já baixa a estante (`lib/exportar.ts`). Falta só o formato Markdown; a porta de saída não é mais uma promessa vazia.
- **Leitor de código de barras.** A busca por ISBN já existe: falta a câmera.
- **Tradutor.** A coluna existe e está vazia em **100%** das edições.
- **O deploy.** O app funciona e não está no ar.

### O que fazer primeiro, se você tiver uma tarde

O **banco de teste separado** (item 4). É o mais barato, e é o único que protege todos os outros: enquanto o vermelho puder mentir, nenhuma das outras defesas deste repo vale o que devia valer.

---

## Uma nota sobre os documentos

Os "Problemas conhecidos" do [AGENTS.md](../AGENTS.md) têm pelo menos duas entradas **vencidas**
(elas dizem que o import do catálogo nunca rodou, e ele rodou: são as 414 mil edições que a
busca usa hoje). Um documento desatualizado é pior que nenhum, porque ele mente com autoridade.

Se você tropeçar numa dessas, **conserta e manda o PR.** Isso é uma contribuição de verdade, e
das mais úteis: você é a única pessoa que acabou de perder tempo com aquilo, e por isso é a
única que sabe exatamente onde estava a pedra.

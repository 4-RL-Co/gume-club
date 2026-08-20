# Plano

**Este é um projeto de fim de semana.** O dono tem outros projetos. O escopo abaixo é implacável de propósito: tudo que não é necessário para dez amigos usarem felizes foi empurrado para fora.

Cada fase é uma **fatia vertical**: migration → server → UI → teste. Ela sobe, é demonstrável, é commitada. Nunca "constrói todos os models primeiro".

---

## v0.1: você e dez amigos

O produto inteiro. Se isso for tudo que um dia existir, ainda vale a pena ter.

### Fase 0: Fundação

- [x] Next.js + TS strict + Tailwind + tokens do docs/design.md
- [x] Postgres via docker-compose, Drizzle, uma migration roda
- [x] `lib/authz.ts`: o módulo único de autorização, escrito à mão. Ver SECURITY.md.
- [x] CI: typecheck, lint, test, secret scan

### Fase 1: A estante

- [x] Auth (e-mail + senha, e **Google**). Deleção de conta que apaga de verdade.
- [x] **O GitHub saiu da porta de entrada.** Ele não abria (faltavam as credenciais), confunde leitor num app de leitura, e pode entregar e-mail NÃO VERIFICADO — o vetor clássico de tomada de conta. Volta um dia como **vínculo** (a insígnia de Construtor precisa do handle), e nunca como login. Ver ai/DECISIONS.md.
- [x] **⚠️ Tomada de conta pelo vínculo automático: fechada.** `requireLocalEmailVerified: true`. Uma conta de senha com e-mail não verificado nunca recebe vínculo de OAuth. `lib/auth.vinculo.test.ts` **roda o ataque** e prova que falha — e um segundo teste desliga a defesa e prova que sem ela o ataque funciona.
- [x] **Código por e-mail** (opcional). E ele **não se chama 2FA**: código por e-mail não é um segundo fator se o reset de senha também vai por e-mail — é o mesmo fator, duas vezes. Protege contra senha vazada, e não contra e-mail invadido. Dez minutos, uso único, cinco erros e o código morre. Cifrado no banco (o padrão do plugin é texto puro). Limite de pedidos **por pessoa**, e não só por IP.
- [x] **A biblioteca mentia sobre o envio.** O `/two-factor/send-otp` do Better Auth engole o erro e responde `status: true` — a tela diria "código enviado" com o e-mail caído, e ninguém entraria. O envio passa por `lib/codigo-por-email.ts`, que sabe o que aconteceu de verdade.

### ⚠️ ANTES DE LANÇAR: o e-mail está no caminho crítico do LOGIN

**e-mail caído agora quer dizer que NINGUÉM ENTRA.** E o domínio não está pronto:

- [ ] **SPF** em `gume.club` (o valor exato está no painel do Resend)
- [ ] **DKIM** (`<seletor>._domainkey.gume.club`)
- [ ] **DMARC** (`_dmarc.gume.club`, comece com `p=none`)
- [ ] **MX** — um domínio que manda e não recebe parece fazenda de spam para os filtros
- [ ] **RESEND_API_KEY** no ambiente
- [ ] **Mandar um e-mail de verdade** para um Gmail, um Outlook e um iCloud, e olhar em qual PASTA ele caiu

`node --experimental-strip-types scripts/entregabilidade.mjs seu@gmail.com seu@outlook.com` confere os cinco primeiros e manda o e-mail. **O sexto só você pode fazer:** um script não consegue olhar na sua caixa de entrada.

Código de login no spam = ninguém entra, e **ninguém reclama**: o e-mail sai com status 200, o filtro o esconde, e a pessoa desiste em silêncio.
- [x] **O `invited_by` sobrevive ao provedor novo**, inclusive no cadastro pelo Google. O cookie do convite é `sameSite: lax` — com `strict`, o navegador não o devolve na volta do Google, e a linhagem sumiria de todo mundo, em silêncio.
- [x] `works` / `editions` / `authors` / `identifiers`
- [x] **Semear o catálogo** antes de qualquer um logar. Ver abaixo. Uma busca vazia no primeiro dia mata o usuário.
      _O import rodou (ver Fase 4). O dump da Open Library entrou, e a poda + a dedup de autores (migrations 0032–0035) o deixaram em ~262 mil obras / ~299 mil edições / ~123 mil autores._
- [x] Busca de livro + lookup por ISBN
- [ ] Leitura de código de barras (o leitor tem o livro físico na mão: o ISBN está na contracapa). A busca por ISBN já existe; falta a câmera.
- [x] `library_entries`: quero ler / lendo / lido / DNF, em um toque
- [x] `owned_copies`: **ter é separado de ler**, com procedência (sebo, feira, presente, herança, caixa do clube)
- [x] Parede de capas
- [x] Lista densa (ficha de biblioteca), filtros, ordenação, e o alternador entre as duas vistas
- [x] `/livro/[slug]`: capa grande, ano da obra × ano da edição, nota meia-estrela, procedência, resenha privada por padrão

### O acervo curado (12 de julho de 2026)

O acervo deixou de ser um depósito e virou uma escolha. Ver `docs/cobertura.md`,
`docs/poda.md` e a entrada em `ai/DECISIONS.md`.

- [x] **O cânone**: 367 autores escolhidos a mão (`seed/canone.ts`), com as grafias por que cada um é procurado. Teste que trava o tamanho, a verdade de campo e o "isto não é um ranking".
- [x] **A cobertura, medida**: dos 367, 239 estão no acervo com capa, 43 sem nenhuma capa, e 85 não existem. O buraco do mangá está medido: 46 dos 50 mangakás têm ZERO.
- [x] **"Não achei meu livro" em dois campos** (era nove). O Gume procura editora, ano, páginas, ISBN e capa sozinho.
- [x] **A torneira**: toda busca vazia vira um pedido, e a fila (`/pedidos`) é a lista de qual autor trazer em seguida. Ela não guarda quem procurou.
- [x] **A poda, PREPARADA**: `pnpm poda` mede, `pnpm podar` executa. 373.435 obras → 8.404. Não foi executada.
- [ ] **Rodar a poda** (`pnpm podar`, com o app fora do ar).
- [ ] **Terminar o backfill de capa do cânone**: faltam 6.766 obras. Bloqueado na cota de 1.000/dia do Google Books — pedir aumento de cota (grátis) resolve numa tarde. A Open Library não serve: testada em 30 ISBNs brasileiros, acertou zero.
- [x] **Trazer os que não existiam**: o import de mangá e o backfill pelo Google Books fecharam quase tudo. Dos 81 buracos de julho sobraram **onze** (ver docs/cobertura.md) — Tolstói, Flaubert, Harari, os mangakás, todos entraram.

### Fase 1.5: Mangá

No v0.1, não "depois". É o que o usuário fundador está lendo agora mesmo, e um app que não segura a leitura atual dele é um app que ele não abre.

- [x] `series` + `works.volume` (já em docs/schema.md)
- [x] **Cliente da AniList** (`lib/anilist.ts`, API GraphQL pública, oficial, gratuita): séries, volumes, capas, status de publicação. Não é scraping. E o volume **brasileiro** veio do dado estruturado da Panini e da JBC (ver ai/DECISIONS.md).
- [x] Uma série é **um tile** na parede de capas, com os volumes dentro. Trinta lombadas quase idênticas de Vagabond em fila destruiriam a tela que carrega o produto inteiro.
- [x] Prateleirar uma série, ler volumes. Progresso da série = volumes lidos. Compute, nunca guarde.

### Fase 2: Leitura

- [x] `readings` + releituras + DNF. **Sem progresso**: três estados e nada mais (ver ai/DECISIONS.md)
- [x] `ratings` (smallint 1..5, a palavra: adorei / gostei / achei ok / não gostei / não terminei)
- [x] **A tela do ano.** Capas lidas, páginas, autores, nacionalidades dos autores, o que você está lendo agora, e o que está na estante não lido. A tela que vende o produto. Se não for digna de print, não está pronta.
- [x] **Conte livros e volumes separadamente.** "12 livros, 30 volumes, 4 séries." Ler trinta volumes de Vagabond não é ler trinta livros, e uma estatística que finge o contrário é uma estatística em que ninguém confia, a começar pelo próprio dono.
      _As colunas existem, a contagem é separada, e a Fase 1.5 já povoou `works.series_id`: volumes e séries aparecem._
- [x] `reviews` (públicas e privadas) e o resto da Fase 3 — feito (ver Fase 3).

### Fase 3: Amigos — **subiu para o v0.1** (ver ai/DECISIONS.md)

Sem isto o Gume é uma planilha bonita: dez amigos entram, cadastram os livros e não voltam.

- [x] `follows` (unilateral, sem pedido de aprovação)
- [x] `activities` + feed cronológico de amigos, paginado por cursor no id uuidv7
- [x] Perfil público em `/@handle`, indexável
- [x] `visibility` por linha imposto no SQL, com um teste provando que uma linha privada nunca chega a um seguidor **nem pelo feed** (`lib/authz.sql.test.ts`, contra Postgres de verdade)
- [x] `reviews`, incluindo resenhas privadas (grátis, para sempre)
- [x] **Recomendar um livro a um amigo**: um livro, uma pessoa, uma linha de por quê. Cai na estante dela vindo de uma PESSOA.
- [x] **Linhagem**: `users.invited_by` é gravado no cadastro.
- [x] **A porta (o convite).** O handle **é** o convite: `/entrar?convite=<handle>`, sem tabela de códigos, sem escassez, sem fila. `/bem-vindo` saiu: todo mundo, com ou sem convite, cai direto em `/` depois do cadastro — a régua atual é "não relitigue" no que sobrou dela; "quem te trouxe" continua em `/perfil`. Ver ai/DECISIONS.md.
- [x] **Arauto**: quem trouxe leitores que ficaram. Frase no perfil, **sem número, sem ponto, sem ranking**.
- [ ] **Sem comentários.** Se um PR os adicionar, feche.

Fora, ainda: notificação, clube.

### Fase 4: Traga a sua estante

- [ ] Importação de CSV: a exportação do Goodreads/Fable/Skoob, sem perdas (datas, notas, texto de resenha, prateleiras, ISBN)
- [ ] Um importador de planilha que lida com uma estante como `seed/olegas-shelf.csv`: título, ISBN, editora, formato, obtenção, lido/não lido. É assim que pessoas normais de fato registram livros hoje.
- [ ] Exportação: JSON + CSV + Markdown, um clique

**O v0.1 está pronto quando dez amigos usarem por um mês sem serem cobrados duas vezes.**

---

## Semeadura do catálogo (faça isso antes de a Fase 1 acabar)

O catálogo não pode estar vazio no primeiro dia. Semeie, nesta ordem:

1. **Dump da Open Library**, filtrado para `language = por` mais os clássicos canônicos. Um script de importação, rodado uma vez.
2. **`seed/olegas-shelf.csv`** e as estantes dos primeiros dez amigos. Livros reais, de donos reais, com ISBNs reais.
3. Daí em diante ele cresce a partir de importações, leituras de código de barras e aprovação de bibliotecários.

Política de catálogo: **fato sim, obra de terceiro não, capa por referência.** Metadado factual (ISBN, título, autor, editora, ano, páginas) pode vir de qualquer fonte. Capa a gente guarda por URL, nunca copia o arquivo. Resenha e dado de usuário de outra plataforma, nunca. Ver ai/PRD.md e ai/DECISIONS.md.

- [x] **Fatia 0: dados idempotentes.** `works` ganhou unique `(title, author_id, volume)` NULLS NOT DISTINCT e o seed virou idempotente (upsert, nunca insert cego). Uma migration limpou as obras duplicadas por um seed rodado 2× (88 → 44), repontando `library_entries`/`owned_copies` para a obra sobrevivente.
- [x] **Slug: o endereço público do livro.** `works.slug` (citext, unique, not null), gerado de título + autor, imutável, com backfill dos 44 existentes. Habilita `/livro/[slug]`.
- [x] **`identifiers` + `works.openlibrary_key`.** Casar por ISBN é o jogo inteiro na importação; a chave da OL é o que faz um reimport ser upsert em vez de uma segunda cópia do catálogo.
- [x] **`scripts/import-openlibrary.mjs`.** Dump oficial da Open Library (domínio público, não é raspagem), filtrado para `language = por`. Streaming: o .gz de 12 GB nunca encosta no disco. Três estágios cacheados, dá para retomar. Testado ponta a ponta contra um fixture local.
- [x] **O import rodou.** **414.897 edições em português** entraram (de 426.467 filtradas do dump; as 11.570 restantes casaram por ISBN ou pela chave da OL, em vez de duplicar). 373.383 obras novas, 160.690 autores, 667.415 identificadores. As 44 obras da estante semeada **adotaram** a chave da OL em vez de virar cópia: Memórias Póstumas absorveu 100 edições, Dom Casmurro 43. Zero duplicatas.
- [x] **A busca usa o catálogo próprio.** Trigramas com unaccent: acha sem acento e com erro de digitação. A API externa virou reforço, não a fonte.

---

## Depois, se o v0.1 merecer

Só se as pessoas de fato usarem. Não antes.

- **Clubes**, tidos e tocados por criadores (o schema já está em docs/schema.md)
- Programa de bibliotecários com um curso curto
- Trechos (highlights), importação de Kindle/Kobo, sync com Obsidian
- Climas, ritmo, avisos de conteúdo, e o dataset CC0

_(Convites e linhagem, recomendar um livro, e a fila de moderação **subiram para o v0.1** e já estão feitos — ver Fase 3 e `app/moderacao`.)_

- ~~Cosméticos de apoiador (badge, capa de perfil)~~ — **o apoio está de pé** (2026-07-31): assinatura e apoio avulso pelo Stripe, insígnia e moldura vivas, e a lista de apoiadores em `/contribuidores`, que nasce marcada e tem como sair. Quem apoia é calculado, e não guardado: ver `lib/apoio.ts`, `docs/apoio.md` e a entrada no ai/DECISIONS.md. **A capa de perfil comprada continua não existindo**, e é a única parte desta linha que sobrou.

### Medir uso, sem trair o manifesto

- **Cloudflare Web Analytics.** Sem cookie, sem dado pessoal, sem banner de consentimento. É o que combina com este app: diz quantas pessoas vêm e por onde, e não quem elas são. Se for medir alguma coisa, é essa.

- ⚠️ **Microsoft Clarity, e a ressalva escrita ANTES da tentação.** O Clarity **grava a sessão**: captura o DOM, o mouse, o scroll, e manda para a Microsoft. Nas telas do Gume isso significa gravar **estante privada** e **resenha privada** de gente que não pediu, e mandar para um terceiro. O README promete, em voz alta, que "o seu histórico de leitura nunca está à venda", e uma gravação de sessão é exatamente isso, de graça. **Isto está escrito aqui agora para que a decisão não seja tomada em silêncio daqui a seis meses, por alguém olhando um mapa de calor.** Se um dia entrar, três condições, e nenhuma é opcional: (1) mascaramento agressivo de TODO conteúdo de usuário (o Clarity mascara texto, mas a configuração padrão vaza, então é máscara total, verificada tela a tela); (2) um aviso claro na página de privacidade; (3) uma entrada no ai/DECISIONS.md explicando por que, com as três condições, não fere o manifesto. Sem as três, a resposta é não, e o motivo é o mesmo de sempre: a confiança é a única coisa que este projeto tem para vender.

## Nunca

Curtidas, contador de seguidores, ofensivas (streaks). Feed algorítmico. IA generativa. Links de afiliado da Amazon. Anúncios. Privacidade paga.

## Comunidade

O Gume deixa de ser um app que se usa e vira um app que se constrói. Seis fatias, nesta ordem, porque a 1 é a fonte de dados da 2 e da 3.

- [x] **1. Histórico de correções.** Revisão append-only com o nome de quem fez, pública, para sempre. Qualquer leitor corrige um dado da edição e aplica na hora. A capa é a única exceção: entra numa fila, e só bibliotecário aplica. Reverter é de bibliotecário, e a reversão também entra no log. A tela pergunta primeiro "o que está errado?", e essa pergunta é a feature.
- [x] **2. Contribuidores.** Duas listas, mesmo peso visual: quem escreve o código (GitHub, cacheado) e quem cuida do catálogo. Com número, por ordem de chegada, nunca por quem fez mais. O número vive só ali.
- [x] **3. Insígnias.** Oito, todas binárias, todas sobre doação à comunidade, nenhuma sobre leitura: bibliotecário, zelador, construtor, tradutor, arauto, membro fundador, semeador, caçador. Seis o app calcula sozinho; caçador e tradutor são reconhecidas por um bibliotecário, com motivo. Discretas (um glifo, não uma medalha), no perfil e ao lado do nome no feed. Mesma luminosidade e mesma saturação para as oito: só o matiz muda, e um teste quebra o build se alguém brilhar mais que as outras. O selo de apoiador NÃO mora com elas, e nem se parece com elas.
- [x] **4. Cópia disponível.** Doar, trocar, emprestar. Não é mercado: o app não intermedeia. UM canal de contato por pessoa, que só aparece com SEGUIR MÚTUO, filtrado no SQL via mutuals() em lib/authz.ts.
- [x] **5. A linhagem da cópia.** "Veio da estante de @maria, que a recebeu de @joão." A corrente para no elo privado, e não pula por cima dele.
- [x] **6. "O que falta".** O trabalho aberto do catálogo, e o recorte que importa: os livros SEM CAPA que estão NA SUA estante. A fila de capas (que a fatia 1 deixou sem tela) mora aqui, e só bibliotecário a vê.

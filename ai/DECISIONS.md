# Decisões

Append-only. Mais nova por último. Uma entrada por decisão real: o que a gente escolheu, o que rejeitou, e por quê. Isto existe para que um agente (ou um humano) daqui a três meses não fique relitigando uma questão já resolvida.


## As regras que valem hoje

Dez linhas. Se você só tem um minuto, é isto que é verdade agora. O porquê de cada uma, e as
reversões que ensinaram, estão nas entradas abaixo, em ordem de data.

- **Contribuição conta; leitura, nunca.** Número de conserto pode; número de leitura, jamais. É a fronteira que não se move. *(entrada "Número de conserto, sim. Número de leitura, nunca.")*
- **A honra existe, o placar não.** Há uma escada pelo que você leu na vida, e não há lista dos maiores leitores. *(entradas "O Gume vai ter ELO" e "'Elo' vira HONRA")*
- **Insígnia é binária e é sobre doação.** Você é ou não é; ler nunca dá insígnia; a cor é identidade, não hierarquia. *(entrada "As oito insígnias")*
- **Estatística compara gosto, nunca esforço.** Curadoria diz quem você é; média de livros lidos é o número que este app existe para não ter. *(entradas "Ano virou Estatísticas" e "/estatisticas diz QUEM VOCÊ É")*
- **A nota é palavra, não estrela.** Palavra não soma, então o placar é impossível por construção. *(entrada "A nota virou palavra")*
- **Catálogo: fato sim, obra de terceiro não, capa por referência.** Raspa para devolver ao bem comum; nunca sinopse, nunca preço. *(entradas "Política de dados de catálogo" e "O volume brasileiro")*
- **O acervo é curado, e o buraco é o produto.** A poda é economia; a lacuna é o que se preenche por demanda, e ela aparece na tela de propósito. *(entradas "Acervo CURADO" e "Acervo curado por editora")*
- **Só um teste defende uma regra.** Documento não defende código; toda trava vira um `*.test.ts` que quebra a build. *(entrada "Datas de leitura são do LEITOR")*
- **Visibilidade filtra no SQL, sempre.** `visibleTo()` emite o nome real da tabela: um vazamento que não compila vale mais que um que você tem que lembrar de procurar. *(entrada "visibleTo() emite o nome real")*
- **Uma frase que sobrevive à decisão que descrevia é uma mentira educada.** Quando a regra muda, apague a frase antiga; não a deixe de pé. *(entrada "A praça: feed público")*

---
---


**2026-07-11: Licença: AGPL-3.0.**
Rejeitada a MIT. A gente roda uma instância hospedada e o pitch inteiro é "ninguém pode fechar isto e vender o seu histórico de leitura de volta para você". A MIT permitiria exatamente isso. Custo: alguns contribuidores corporativos não vão encostar em AGPL. Aceito.

**2026-07-11: EN primeiro, PT-BR de primeira classe.**

> **SUPERADA** pela decisão de 11/07 ("Este é um projeto brasileiro, em português"): a cópia é PT-BR, o código é EN. O raciocínio de mercado continua valendo, e é por isso que ela fica.

O público de contribuidores e o mercado de refugiados do Goodreads são o inglês. Mas o Skoob está em declínio visível (o próprio suporte dele cita "15 anos de problemas estruturais") e o Brasil não tem alternativa. Entregar PT-BR no lançamento custa pouco e abre um mercado sem disputa.

**2026-07-11: `works` e `editions` são tabelas separadas.**
O Goodreads confundiu as duas e o catálogo dele nunca se recuperou: usuários relatam o mesmo romance listado com oito edições. Você avalia uma obra; você lê uma edição. Custo: toda query fica um join mais pesada, e o casamento na importação fica mais difícil. Vale a pena.

**2026-07-11: Sem federação ActivityPub no v1.**
O BookWyrm é o único concorrente de fato aberto e a federação é exatamente o que torna impossível uma pessoa normal fazer o onboarding. Arquitete para a porta continuar aberta; não atravesse por ela ainda.

**2026-07-11: Sem algoritmo de recomendação. Nunca.**
Não é uma decisão de escopo, é uma promessa de produto. A reclamação mais repetida sobre o Goodreads é que as recomendações dele ignoram o que você já leu e avaliou. Em vez de construir uma melhor, a gente não está construindo nenhuma. As recomendações vêm de pessoas que você escolheu seguir.

**2026-07-11: Sem IA generativa no produto.**
O Fable lançou resumos de leitura por IA em dez/2024 que disseram a um leitor de autores negros para tentar "o ocasional autor branco". Eles pediram desculpas em vídeo e mataram três features. A categoria queimou o orçamento de confiança dela; não gastar o nosso é diferenciação de graça.

**2026-07-11: A autorização mora em um único módulo escrito à mão.**
A maior parte deste código vai ser escrita por um agente. Revisar 10 mil linhas por dia não é um plano. Em vez disso: `lib/authz.ts` é pequeno, escrito à mão, revisado por um humano, e toda query passa por ele. Estrutura acima de vigilância.

**2026-07-11: A importação sem perdas é a cunha, não uma feature.**
A exportação em CSV do Goodreads carrega datas de leitura, notas, prateleiras e corpos de resenha. A maioria dos concorrentes larga tudo isso na ingestão, e é por isso que migrações pela metade são a norma. Parsear tudo isso é o fosso mais barato possível.

**2026-07-11: O público é um círculo de leitores de clássicos, não o mercado do Goodreads.**
Sucesso em seis meses é 200 leitores fiéis. Isso mata todo argumento de "isso escala" no roadmap e faz do grafo de convites, dos clubes de leitura e das recomendações diretas features de v1 em vez de v2. Clássicos também tornam o problema de catálogo tratável: domínio público, bem catalogados, sem cauda longa.

**2026-07-11: O grafo de convites é a mecânica central.**
Cadastro aberto, mas todo mundo está conectado a quem o convidou, e a esse círculo. Embaixadores mantêm os círculos unidos. As recomendações viajam de pessoa para pessoa. Essa é a coisa que nenhum concorrente tem e a razão de o produto ser social sem ser uma rede social.

**2026-07-11: Sem comentários. Nunca.**
Resenhas e follows são os únicos canais, como no Oku. Razão de produto: o feed fica quieto. Razão operacional: uma pessoa só modera isto, e comentários são onde a moderação vai morrer.

**2026-07-11: Resenhas privadas são uma feature de primeira classe, e são grátis.**
Muitos leitores escrevem para si mesmos. Rejeitado: o modelo do Oku de cobrar por coleções privadas. Cobrar por privacidade transformaria o manifesto num discurso de venda. Planos pagos compram um badge, um Discord, acesso antecipado, gratidão. Nunca privacidade, nunca o núcleo.

**2026-07-11: A gente não faz scraping de outros serviços por dados de catálogo.**

> **SUPERADA** pela "Política de dados de catálogo" (11/07) e pela raspagem factual autorizada de Panini e JBC ("O volume brasileiro"): metadado factual, pela porta certa, pode; texto de terceiro, nunca. O princípio ficou mais fino, não caiu.

Considerado e rejeitado: fazer scraping do Goodreads/Skoob por ISBN para preencher edições brasileiras. Viola os termos deles, é frágil, e faz de um projeto construído sobre abertura um hipócrita. Em vez disso, o catálogo cresce a partir de Open Library + Google Books, de usuários importando as próprias exportações (que são legitimamente o dado deles e trazem edições reais junto), e de um programa aprovado de bibliotecários. As correções voltam para a Open Library. O dataset resultante é publicado em CC0.

**2026-07-11: Exatamente um tipo de notificação: um amigo terminou um livro que você leu.**
Todo o resto é silêncio. Esse único evento é o único em que uma conversa genuinamente quer acontecer.

**2026-07-16: O sino avisa três laços, e o "visto" mora no navegador.**
Estende a decisão acima. Ela nasceu antes de existir gente de verdade no app e mirava o RUÍDO (o mural de "fulano curtiu", a esteira de engajamento). Com amigos usando de verdade, apareceram três momentos em que alguém age SOBRE você e você não tem como saber sozinho: **te seguiram**, **alguém que você convidou entrou**, **te recomendaram um livro**. Some a esposa que criou conta e te seguiu; some o convite que deu certo. Não é ruído: é laço, e laço é o produto. Sem contador de likes, sem "em alta", nada para performar. Um sino no topo (escolha do dono sobre um item de menu), com um pontinho quando há algo novo. Os três eventos já têm dado no banco (`follows`, `users.invited_by`, `recommendations`); ver lib/novidades.ts e components/sino.tsx. Ficam de fora, por ora, a resenha de terceiro e o "amigo terminou um livro que você já leu" (esse é mais frequente; entra se pedirem). O estado de "já vi" mora no `localStorage` do navegador, e não numa coluna: o deploy não roda migration sozinho, e "já vi isto" é coisa que o aparelho sabe. Por aparelho, e tudo bem.

**2026-07-11: Este é um projeto brasileiro, em português.**
Reverte a decisão anterior de EN primeiro. O público é de leitores brasileiros de clássicos (Antofágica, Martin Claret, Editora 34), filosofia e mangá. O Skoob é o único incumbente e está apodrecendo. A cópia de produto é PT-BR; código, schema e commits ficam em inglês para manter o público de contribuidores aberto; o README é bilíngue, português primeiro.

**2026-07-11: Mangá está no escopo, então `series` e `volume` entram no schema.**
Um tracker que lida com um clássico da filosofia e o volume 14 de um mangá na mesma estante é algo que nenhum app brasileiro faz. Fonte de catálogo: a **API GraphQL pública da AniList**, que é oficial, gratuita, e cobre o que a Open Library nunca vai cobrir. Isto não é scraping.

**2026-07-11: Clubes são tidos e tocados por criadores.**
Um clube tem um dono. Booktubers e bookstagrammers tocam os seus próprios. Clubes nunca são pagos e um criador nunca paga para ter um: eles trazem os leitores, essa é a troca.

**2026-07-11: Apoio é cosmético apenas (modelo do Backloggd).**
Badge de apoiador, capa de perfil personalizada, nome colorido. Generosidade visível. Nunca compra privacidade, nunca compra features, nunca tranca o núcleo.


**2026-07-11: O roadmap mora no GitHub Discussions, com 👍 como o upvote.**
Zero código, funciona no primeiro dia, mantém a conversa perto de quem pode implementar. Uma página de roadmap dedicada é construída quando houver propostas suficientes para fazê-la parecer viva. A regra vale onde quer que ela more: upvotes informam, eles não decidem.

**2026-07-11: Ter um livro é um fato separado de lê-lo.**
A estante real do usuário fundador tem 44 livros, dos quais só 16 são lidos. `owned_copies` é a sua própria tabela, com **procedência**: sebo, feira do livro, presente, troca, herança, caixa do clube. Nenhum concorrente registra de onde um livro veio, e numa estante física essa é a coisa mais interessante sobre ele.

**2026-07-11: `authors.nationality` é um campo de primeira classe, mostrado na tela do ano.**
Leitores já curam ao longo desse eixo na mão. É a versão honesta do que o Fable tentou automatizar com um modelo de linguagem e se queimou: o leitor fornece a lente, o app só conta.

**2026-07-11: Sem contas de editora, sem parcerias, sem prospecção.**
Considerado: contas verificadas de editora (Antofágica, Editora 34, Logos) para preencher o catálogo brasileiro e alcançar os assinantes delas. Rejeitado por ora: adiciona um tipo de usuário, um fluxo de verificação e uma relação comercial para manter. Este é um projeto de fim de semana. O catálogo é semeado a partir de um dump PT-BR da Open Library mais estantes reais, e cresce a partir de leituras de código de barras.

**2026-07-11: Escopo cortado para v0.1: estante, tela do ano, feed de amigos, importação.**

> **SUPERADA:** o mangá voltou ("Mangá está no v0.1") e o social entrou ("O social entra no v0.1"). Mantida porque registra o que foi cortado, e por quê, antes de voltar.

Clubes, convites, embaixadores, recomendações, o curso de bibliotecário, a fila de moderação e mangá vão todos para "depois, se o v0.1 merecer". Dez amigos, convidados na mão, usando por um mês é a régua. Tudo que não serve a isso é adiado.

**2026-07-11: Mangá está no v0.1, não adiado.**
É o que o usuário fundador lê hoje, e um tracker que não segura a sua leitura atual é um que você não abre. Barato de adicionar: `series`/`volume` já estão no schema e a API GraphQL pública da AniList fornece séries, volumes, capas e status de graça.

Duas consequências, decididas agora em vez de descobertas depois:

- **Livros e volumes são contados separadamente.** "12 livros, 30 volumes, 4 séries." Trinta volumes de Vagabond não são trinta livros, e uma estatística que finge o contrário é uma em que o próprio dono para de confiar.
- **Uma série é um tile na parede de capas**, com os volumes dentro. Trinta lombadas quase idênticas em fila arruinariam a única tela de que o produto depende.

**2026-07-16: A honra é uma escada só. Livros, HQs e cada volume de mangá contam juntos.**
Antes eram duas escadas: literatura (Ferro → … → Gume) e quadrinhos (Aprendiz → … → Katana), cada uma com a régua dela, porque um volume de mangá se lê num quarto do tempo de um romance. Era honesto e era complicado: duas barras no perfil, dois vocabulários, e uma HQ marcada como "brochura" caindo na escada errada sem a pessoa entender por quê. A separação resolvia um problema de *justiça* que quase ninguém sentia e criava um problema de *clareza* que todo mundo via. Agora é uma escada só, a de metal e pedra que termina no fio (o Gume), e **cada volume de mangá vale uma leitura**, igual a um livro. Sim, isso deixa a honra mais fácil para quem lê mangá — e tudo bem: a honra é um retrato de *quanto* você leu, não um prêmio de dificuldade, e ler 500 obras, do tipo que for, é uma vida de leitor. Removeu-se a escada `quadrinho`, o tipo `Forma` e `altura()` de lib/honras.ts; `posicaoDe`/`coroaDe` perderam o parâmetro de forma; `getEscadas`/`degrauNovo` (lib/escada.ts) contam `status='read'` sem filtrar forma.

Isto vale **só para a honra**. A ESTATÍSTICA continua contando separado ("12 livros, 30 volumes, 4 séries"): lá a mentira de que trinta volumes de Vagabond são trinta livros faria o dono parar de confiar no número. Na honra, o que importa é o esforço de leitura acumulado, e volume lido é leitura.

**2026-07-11: A identidade de uma obra é `(title, author_id, volume)`, com unique NULLS NOT DISTINCT.**
Um seed rodado duas vezes duplicou as 44 obras para 88, porque `works` não tinha unique e o insert era cego. Rejeitado `(title, author_id)` puro: dois volumes de mangá com o mesmo título e autor colidiriam (o schema já tem `works.volume`). Rejeitado o `works.slug` único do modelo-alvo em docs/schema.md: o código real usa `author_id` (autor único) e ainda não tem slug; entra quando `/livro/[slug]` chegar. Como `volume` e `author_id` são nuláveis e um clássico tem `volume` nulo, um unique comum trataria cada nulo como distinto e não pegaria os duplicados: por isso **NULLS NOT DISTINCT** (Postgres 15+). O seed virou idempotente (upsert por essa constraint), e uma migration deduplicou os dados existentes preservando `library_entries` e `owned_copies`.

**2026-07-11: `works.slug` é o endereço público do livro, e é imutável.**
`works` ganhou `slug` (citext, unique, not null), gerado de título + autor ("A Arte da Guerra" de Sun Tzu vira `a-arte-da-guerra-sun-tzu`), com sufixo numérico curto na colisão (`-2`, `-3`). O slug é o endereço, não detalhe de rota: por isso entra agora, antes da tela de detalhe (`/livro/[slug]`), e não como um id. **Depois de criado, nunca muda:** se o título for corrigido, o slug fica, senão um link que alguém salvou quebraria. Isso é convenção imposta no código (nenhuma escrita atualiza `slug`; o upsert do seed não o toca), documentada aqui. citext torna a busca por slug case-insensitive. A regra de slugify vive em três lugares que precisam concordar: `lib/slug.ts` (app), o slugify inline do seed, e o backfill em SQL da migration (`unaccent` + `regexp_replace`).

**2026-07-11 — Política de dados de catálogo: fato sim, obra de terceiro não, capa por referência.**

Revisa e substitui a decisão anterior ("não raspamos outros serviços"), que era ampla demais e tornava o catálogo brasileiro inviável. A Open Library cobriu 2 de 44 livros brasileiros reais: sem uma política mais precisa, o app nasce sem catálogo, e um app de leitura sem catálogo não é nada.

A linha:

1. **Metadado factual: pode, de qualquer fonte.** ISBN, título, autor, editora, ano da obra, ano da edição, páginas, formato, idioma, série, volume. Não existe propriedade sobre "este livro tem 320 páginas". É o miolo do catálogo e é o que faz a busca funcionar.

2. **Capa: por referência, nunca por cópia.** A capa é obra gráfica com autor e direitos da editora. Guardamos a **URL** (`editions.cover_url`), servida da origem (Open Library, Google Books, AniList). Nunca baixamos, nunca re-hospedamos, nunca redistribuímos o arquivo. Mostrar não é republicar, e a diferença, jurídica e reputacional, é grande. Sem URL disponível: capa tipográfica gerada.

3. **Nunca: resenha, nota, comentário ou qualquer dado de usuário de outra plataforma.** Não é fato, é texto de uma pessoa, e não pertence nem a nós nem ao site de onde veio.

4. **Exceção que sempre valeu: o import do próprio usuário.** O export do Goodreads, Skoob ou Fable é dado *dele*, incluindo as resenhas *dele*. Ele traz o que quiser.

**Ordem de preferência das fontes**, sempre: (a) dumps e APIs oficiais e abertas (Open Library, AniList), (b) APIs públicas (Google Books), (c) scraping de metadado factual, apenas quando (a) e (b) falharem e apenas dentro dos limites acima.

**O que o dataset CC0 do Gume publica:** só o que é nosso ou factual. Nunca capas, nunca texto de terceiros.

**Descartado:** os dumps de Goodreads do Kaggle. Além da proveniência (raspagem de terceiro que nós republicaríamos como CC0), são catálogo americano congelado por volta de 2017, sem nenhuma editora brasileira. Dado errado, não só origem errada.

**2026-07-11: Os dumps do Goodreads/Kaggle saíram. O catálogo vem da Open Library.**
A pasta `endpaperdatasets/` (2,7 GB) tinha oito zips do Kaggle. Sete foram apagados. Seis eram raspagem do Goodreads: republicá-los como CC0 contradiz este arquivo, e é catálogo americano que não cobre editora brasileira nenhuma. O sétimo (`archive.zip`) era **do Skoob**, não do Goodreads: colunas `querem_ler`, `lendo`, `leram`, `relendo`, `abandonos`, com editoras brasileiras de verdade. O argumento "não cobre editora brasileira" não valia para ele, mas o de licença valia, e é o que decide: é raspagem de terceiro. O oitavo (`archive (1).zip`, obras completas de Machado de Assis, domínio público, 233 arquivos) **não foi apagado**: mora fora do repo, em `~/gume-data/`. Não tem conflito de licença nenhum e é catálogo brasileiro de verdade.

A fonte é o dump oficial da Open Library, que **eles** publicam em domínio público. Isso é uma fonte, não uma raspagem: não quebra os termos de ninguém e não quebra quando o HTML de alguém muda.

**2026-07-11: O dump bruto nunca encosta no disco, e o import é upsert.**
O `ol_dump_editions` tem ~12 GB comprimido e ~120 GB cru. O disco tinha 2,7 GB livres. Então `scripts/import-openlibrary.mjs` faz streaming (HTTP → gunzip → linha a linha) e só as linhas em português sobrevivem, num `.jsonl` de algumas centenas de MB. O caminho do dump é configurável (`OPENLIBRARY_DUMP_DIR`) e mora **fora** do repo. Três estágios cacheados: um Ctrl-C não recomeça do zero.

Reimportar é upsert, não uma segunda cópia do catálogo. Três decisões que fazem isso funcionar:
- **`works.openlibrary_key`**: os títulos da OL variam entre edições ("Dom Casmurro" vs "Dom Casmurro: edição comentada"), então `(título, autor)` sozinho não reconhece uma obra que já existe.
- **Adoção**: uma obra que já temos (do seed da estante) e que bate em título + autor **adota** a chave da OL em vez de virar uma segunda obra. Verificado: o Dom Casmurro semeado absorveu as duas edições da OL e manteve o slug original.
- **Edições desduplicam pela chave da OL** (via `identifiers`), não só pelo ISBN. Uma edição sem ISBN não colide sob um unique comum, e sem isso toda execução duplicaria todas elas.

Colisão de slug não vira contador (`-2`, `-3`): vira a chave da OL, que é única por construção e estável entre execuções. Um contador renumeraria o endereço público de alguém no segundo import.

**2026-07-11: A língua guardada é `por`, e não `pt-BR`.**
O dump diz `por` (ISO 639-2), sem região. Uma edição portuguesa impressa em Lisboa não é `pt-BR`, e inventar a região seria mentir sobre o que a fonte disse. `editions.language` guarda o que a fonte afirma.

**2026-07-11: A resenha nasce PRIVADA. Isso contradiz o docs/schema.md, de propósito.**
O DDL em docs/schema.md tem `reviews.visibility` com default `public`. O código faz o contrário: `private`. A maior parte das anotações de leitura é escrita para si mesmo, e um tracker que publica por padrão ensina, em silêncio, a escrever para uma plateia. Resenha privada é de graça, para sempre. O docs/schema.md foi corrigido para bater com o código.

**2026-07-11: Better Auth mapeia na nossa tabela `users`. Um leitor é UMA linha.**
Rejeitado o padrão de duas tabelas (a `user` do Better Auth ao lado da nossa `users`, ligadas por FK): ele cria a pergunta "de qual tabela é este id?" em todo lugar do código, e essa confusão é exatamente a que termina numa checagem de dono comparando os dois ids errados. O Better Auth mapeia direto em `users` (`modelName` + `fields` + `additionalFields`), e um hook `before` deriva o `handle`, que é NOT NULL e único e que ele não conhece.

O CLI do Better Auth gera ids `text` e uma FK `text`. Nosso `users.id` é `uuid`. Então os ids são gerados como uuid (`generateId: () => randomUUID()`) e a FK é uuid. Deixar o schema gerado passar teria tornado a foreign key incriável.

Nenhum campo sensível é `input: true`: sem isso, um usuário poderia mandar o próprio `librarian_tier` no cadastro e se promover.

**2026-07-11: A adoção do seed acontece uma vez, com a linha travada.**
A estante semeada pertence a um leitor de mentira que não consegue logar. O **primeiro** cadastro real a acontecer herda tudo, numa transação só, com `for update skip locked` e o leitor de mentira apagado no fim. Sem o lock, dois cadastros simultâneos herdariam os mesmos livros. Verificado pelo endpoint de verdade: o primeiro cadastro adota 44 livros, o segundo recebe 0.

**2026-07-11: O teste de visibilidade pergunta ao Postgres, e a CI sobe um.**
O SECURITY.md exige provar que uma linha privada não chega a um seguidor. O `canSee()` do `lib/authz.ts` é um espelho em memória da regra, e um teste contra ele só prova o espelho: a query é o que roda em produção. Então `lib/authz.sql.test.ts` semeia duas leitoras, um follow aceito e uma linha de cada visibilidade, e pergunta ao banco. A CI agora sobe um serviço de Postgres para que esse teste rode em todo push. Um dos casos prova que a suíte tem dente: sem o filtro, a mesma query devolve as três linhas.

**2026-07-11: A tela do ano não inventa número nenhum.**
Duas recusas concretas. Um livro lido antes do Gume existir não tem data de conclusão, então **não entra em ano nenhum**: o estado vazio explica isso em vez de pegar emprestada, caladinho, a data em que a linha foi criada. E "sem contagem de páginas" não é "zero páginas": quando nenhuma edição na estante registra páginas, o número é omitido, em vez de aparecer um 0 que se lê como fato.

**2026-07-11 — Moderação de catálogo: aberta por enquanto.**
Substitui o "livro novo passa por aprovação de bibliotecário".
- Qualquer usuário **adiciona e edita os próprios livros** sem moderação. Se o livro não existe no catálogo, ele entra.
- **Arautos** (os antigos "embaixadores") podem editar livro de qualquer um.
- Sem fila de aprovação, sem curso, sem programa de bibliotecário.
Motivo: com dez amigos, fila de moderação é cerimônia que ninguém usa e que trava o catálogo, que é o gargalo real. O `revisions` append-only já dá o que importa: nada some em silêncio e tudo é revertível. Quando o spam aparecer (e ele aparece), a gente aperta. Não antes.

**2026-07-15 — A capa também entra na hora, e há um lugar só para arrumar um livro.**
Estende a decisão acima ("moderação aberta por enquanto") para o último campo que ainda contrariava ela. A capa era o **único** campo com fila: propor uma capa mandava ela para uma fila que só o bibliotecário via, num app onde o bibliotecário é a própria pessoa. Agora a capa é um campo como os outros: sobe a imagem, entra na hora, com o nome no `revisions`. A fila (`proporCapa`/`julgarCapa`/`getFilaDeCapas`, `components/cover-queue.tsx`, a tela "o que falta") **continua no código, engatilhada**, para o dia em que apertar — mesma régua de todo o resto: aperta quando o spam vier, não antes.

Duas telas de correção que se sobrepunham viraram **uma só**, dentro da gaveta "arrumar este livro": um formulário com todos os campos, a capa no topo por **upload** (o campo de link colado saiu, gerava atrito e capa quebrada). O `saveBookEdit` passou a validar a origem da capa pelo mesmo porteiro do retrato de autor (`porQueNaoAceita`, lib/imagens.ts) e a devolver a recusa **como valor**, porque o Next apaga mensagem de exceção em produção. O aviso anti-lixo ("capa diferente é edição diferente") mora ao lado do botão de capa, no momento em que a pessoa vai trocar a foto de todo mundo.

**2026-07-11 — Direção visual: editorial de galeria, não dashboard.**
Referências: a grade de pôsteres do Milk & Bone, o site de arte e manuscritos, o Atelier, o Voyager2, e o Country Books.
- Preto quase absoluto, morno. A imagem (a capa) é a única cor.
- Serifa de display grande, com contraste alto, no cabeçalho de cada tela.
- Metadado em versalete pequeno e espaçado, no lugar de labels de UI.
- Composição de pôster, com assimetria e muito respiro. Nada de grade uniforme de dashboard.
- **A regra que o Milk & Bone ensina:** numa grade mista, as peças que são só tipografia são as mais QUIETAS, nunca as mais gritantes. É exatamente assim que a capa tipográfica gerada tem que se comportar em relação à capa real.
- Autor é entidade visual (retrato, painel próprio na página do livro), não uma linha de texto cinza. Ver Country Books.
Rejeitado: as referências de app de livro do Dribbble (pontos de recompensa, estrela em toda capa, ilustração de startup). São a lista do "nunca" do README, desenhada.

**2026-07-11 — Descrição de livro e de autor: buscar, não gerar.**
Refina a promessa "sem IA generativa". A distinção que importa: o erro da Fable foi a IA **opinar sobre o leitor** (os insights de fim de ano). Escrever a biografia de um autor é outra categoria de coisa.

Mesmo assim, não geramos. Não é escrúpulo, é integridade de dados:
- Alucinação num catálogo não é um erro pontual, é cárie. Vira linha no banco, aparece como fato na página do autor, e o leitor não tem como saber que é invenção.
- O dataset do Gume é publicado em **CC0**. Distribuir fato inventado como presente pro mundo, com a nossa assinatura, é pior que não ter o campo.
- E o texto **já existe e é livre**: Wikipédia e Wikidata (biografia de autor) e Open Library (descrição de obra). Escrito por humano, com fonte, atribuível, corrigível. Buscar é mais barato e mais rápido que gerar, e não alucina.

**A regra:** descrição de obra e biografia de autor vêm de fonte livre, com link para a fonte na tela. Sem fonte, o campo fica vazio, e um arauto escreve. Campo vazio é honesto; campo inventado, não.

**Único uso de IA que seria aceitável no futuro, e que não fazemos agora:** resumir uma fonte **citada**, sempre exibida com o link, marcada como derivada, substituível por um humano, e **nunca incluída no dump CC0**. Ou seja: ferramenta de bibliotecário, jamais voz do produto.

**2026-07-11 — Endpaper virou Gume. Esta é a última troca de nome.**
Endpaper saiu por duas razões. A primeira é prática: colide com o endpaper.org, e um nome que já é de outro projeto no mesmo assunto é um nome que a gente ia passar a vida explicando. A segunda é que a metáfora era fraca. A folha de guarda é a página em que você nunca escreve: bonita, mas é sobre o objeto livro, e não sobre o que ler faz com você.

**Gume é o fio da lâmina. A parte que corta.** Uma lâmina que ninguém amola não enferruja de um dia para o outro: ela vai perdendo o corte devagar, e continua parecendo uma lâmina. Você descobre quando ela falha em cortar o que sempre cortou. Com a cabeça é igual, e a perda é silenciosa. **Livro é pedra de amolar.** É por isso que a gente lê, e é exatamente por isso que ofensiva de sete dias, ponto de recompensa e feed algorítmico são a antítese deste produto: eles medem o movimento, não o fio.

A metáfora é nossa e é anterior a qualquer uso famoso dela. **Não citamos ninguém**, nem no produto nem nos docs.

Consequências que ficam travadas aqui:
- **A marca é uma LINHA.** A régua de 1px que atravessa o docs/design.md *é* o gume, e o símbolo é ela vista de perfil: um corpo reto que afina até virar fio. Sem espada, sem livro, sem ícone fofo. Preto e branco, em path (nunca `<text>`: um favicon não espera webfont), e tem que aguentar 16px.
- Motto: **"A mente nunca perde o fio."**
- gume.club · github.com/4-RL-Co/gume-club

O que **não** foi renomeado, de propósito: o usuário, a senha e o banco do Postgres (`endpaper`) no docker-compose e na CI. Renomear ali obrigaria a recriar o banco e resemear, e não vale o custo por um nome que só aparece numa connection string local. Quando alguém subir um ambiente novo do zero, troca lá.

**2026-07-11 — Sem progresso de leitura. Três estados, e só.**
Removido: `reading_progress`, página atual, porcentagem, barra.
Ficam: quero ler · lendo · lido · abandonado.

Barra de progresso não é um campo, é uma cobrança. Ela só faz sentido se a pessoa voltar toda noite para mexer nela, e no dia em que ela não voltar, o número fica mentindo na tela. É streak com outro nome, e streak está na lista do "nunca".

Nada de valor se perde: a contagem de páginas do ano sai da soma das edições terminadas. O que morre é a obrigação de dar satisfação ao app.

**2026-07-11 — O social entra no v0.1. Sem ele, o produto não existe.**
Reverte o adiamento da Fase 3.

O README promete "um feed de pessoas, não de conteúdo", e hoje isso não existe em linha nenhuma de código. Do jeito que está, o Gume é uma planilha bonita: dez amigos entram, cadastram os livros e não voltam, porque não há nada acontecendo. A estante sozinha não sustenta o retorno; a estante dos outros, sim.

Escopo mínimo, e nada além disso:
- **Seguir** (unilateral, sem pedido de aprovação para perfil público).
- **Feed cronológico** dos que você segue: fulano terminou, fulano começou, fulano avaliou, fulano resenhou. Sem algoritmo, sem curtida, sem contador.
- **Perfil público** em `/@handle`: a estante da pessoa, indexável, digna de link.
- **Recomendar um livro para um amigo**: um livro, uma pessoa, uma linha de por quê. Cai na estante dela vindo de uma pessoa, não de um algoritmo. É a mecânica que nenhum concorrente tem.

Fora, ainda: notificação, clube, grafo de convite, arauto. Chegam quando o v0.1 provar que alguém volta.

**2026-07-11 — O convite. Não é crescimento, é identidade, e é a solução da tela vazia.**

Um app em que qualquer um entra não tem dentro nem fora. Um app em que você chegou **por alguém** tem lastro: a sua estante nasce ligada à de quem te trouxe, e a primeira coisa que você vê não é o vazio, é o que aquela pessoa lê. O convite resolve, de uma vez, o problema de identidade e o problema de tela vazia, que sempre foram o mesmo problema.

Por isso o convite é **hospitalidade, não hype**:
- **Sem limite, sem escassez fabricada, sem fila de espera.** Qualquer pessoa gera o link dela, sempre. Escassez de convite é marketing se fingindo de exclusividade, e a gente não vende exclusividade.
- **Sem "convide 3 amigos e ganhe X".** Recompensa por convite transforma o gesto de apresentar um livro a alguém numa tarefa remunerada. É o oposto exato do projeto.
- **Cadastro aberto continua existindo.** Quem chega sozinho não pode cair no vazio: vê uma seleção de estantes para seguir, **curada à mão**, nunca por algoritmo. Ninguém entra num quarto escuro.

**Arauto:** quem trouxe leitores que ficaram. O fato aparece no perfil, dito por extenso e **sem número**: "trouxe leitores para o Gume". **Sem ponto, sem ranking, sem medalha, sem contador.** No instante em que virar placar, virou exatamente o que a gente jurou não construir, e a lista do "nunca" no README passa a ser mentira. Um número ao lado de uma pessoa transforma leitura em posição social. É um fato sobre hospitalidade, não uma pontuação.

Implementação: o **handle é o convite**. O link é `/entrar?convite=<handle>`. Não existe tabela de códigos, não existe convite que expira, não existe convite que acaba. `users.invited_by` já é gravado no cadastro (ver a entrada da linhagem), e é dele que sai tanto a tela de boas-vindas quanto o arauto.


**2026-07-12 — Tag e estante personalizada eram a mesma coisa com dois nomes. Sobrou a estante.**
As duas agrupavam livros. A única diferença real era que estante tinha página e podia ser pública, e tag era rápida de digitar. Isso é diferença de **input**, não de conceito, e não justifica obrigar o leitor a aprender dois vocabulários e escolher entre eles toda vez.

Ficou **um** conceito: a estante. Mas o que a tag tinha de bom foi roubado: na página do livro você digita `para reler, do meu pai` separado por vírgula e pronto, sem cerimônia de criar-depois-atribuir. A estante que não existir é criada na hora, e **nasce privada**, que é exatamente o que uma tag sempre foi. Você a torna pública na página dela, quando decidir que vale mostrar. Nenhum dado se perdeu na migração: cada tag virou uma estante privada com os livros que ela marcava.

"Tag" também é palavra de software, não de leitor, e o produto inteiro fala de estante e prateleira. Ver a regra de voz no AGENTS.md.

**2026-07-12 — Qual edição é a minha.**
Uma obra tem muitas edições (Memórias Póstumas tem cem, depois do import da Open Library), e o app escolhia uma por você. Isso nunca foi bom o bastante: a contagem de páginas muda entre edições, e a capa que aparece na sua estante também. Agora `library_entries.edition_id` guarda a que você escolheu, e a estante segue ela. Mora em `library_entries`, e não em `owned_copies`, porque **dá para ler um livro que você não tem**.

**2026-07-12 — A média de nota tem cara, ou não existe.**
A estante e a página do livro passaram a mostrar o que as pessoas **que você segue** deram a um livro: os rostos, a nota de cada um, e a média entre elas.

O que a gente **não** fez foi uma média global, sobre todo mundo que já tocou o livro. Esse número é a nota do Goodreads: ele chega antes de você ler a primeira página, ele diz o veredito, e **não tem ninguém atrás dele para você discordar**. Uma média de três pessoas que você escolheu seguir é um objeto completamente diferente: se você não gostou dela, você clica no rosto e vai discutir. É por isso que a média mora ao lado das caras, e nunca sozinha.

Consequência prática: com poucos leitores, muitos livros não terão nota nenhuma de amigo, e a linha simplesmente não aparece. Isso é honesto. Um número inventado para preencher o espaço seria pior que o espaço vazio.

**2026-07-12 — Recomendação tem duas trilhas, e elas não são a mesma coisa.**
O que você **deu** é o registro do que você colocou na mão de alguém: é o único lugar que lembra que você já deu este livro a esta pessoa. O que você **recebeu** é uma pilha de livros que alguém escolheu para você, com nome e motivo. Empilhadas numa coluna só, as duas viravam "atividade de recomendação", que é exatamente a papa que este app existe para recusar. Então são duas trilhas, e a tela abre naquela que tem alguma coisa dentro.

Nenhuma das duas é placar: sem "top recomendador", sem ranking, sem taxa de aceitação.

**2026-07-12 — A nota virou palavra. Era o último número do app, e ele saiu.**
Cinco frases, nesta ordem: **não terminei · não gostei · achei ok · gostei · adorei**. No banco continua um `smallint` 1..5, para ordenar, filtrar e importar. Na tela **nunca** aparece um dígito. Nem meia estrela, nem "4,5", nem média.

O raciocínio, em uma linha: **estrela é escala, escala vira média, média vira placar. Palavra não soma.** Não existe "a média entre gostei e adorei", e é exatamente por isso que a palavra é a forma certa: ela torna o placar impossível por construção, e não apenas proibido por regra. A média global já estava proibida; agora ela não tem como ser calculada.

"Odiei" não está na escala de propósito: é performance, e ninguém usa. "Não terminei" está, e é das notas mais honestas que existem.

Nota de amigo continua aparecendo, porque **opinião de gente não é placar**: "o Rui adorou, a Tereza gostou". Se você discordar, clica no rosto e vai discutir com a pessoa.

**O custo, declarado:** estrela de importação (Goodreads, Skoob, planilha) vira palavra, e uma e duas estrelas caem na mesma frase. As notas em meia-estrela que já existiam neste app foram convertidas na mesma migração. **A pessoa é avisada na tela**: "suas notas viraram palavras". Perda de precisão declarada é honesta; perda silenciosa não é. A tradução mora em `lib/veredito.ts`, num lugar só, e tem teste.

**2026-07-12 — A tela "Ano" virou "Estatísticas", e o eixo dela é CURADORIA, não esforço.**
A distinção é a coisa toda: **estatística de curadoria fala sobre GOSTO; estatística de esforço vira placar.**

**Fora, e não volta:** página lida, meta, velocidade, ritmo, e qualquer número que meça produção. Métrica de esforço vira meta, meta vira cobrança, e cobrança é a mesma família da streak. Fora também: nota média (a nota nem é número), ranking, e comparação com outro leitor.

**Dentro** (tudo já existia no schema; nenhum campo novo):
1. **A lente** — a nacionalidade dos autores que você leu, com peso. É a estatística que a Fable tentou fazer com IA e queimou o mercado. A gente faz **sem IA nenhuma**: o leitor preencheu a ficha, o app só conta.
2. **O tempo** — a distribuição dos anos das OBRAS (nunca das edições), por século. Você lê vivos ou lê mortos? O Sun Tzu, sozinho na ponta esquerda em -401, é a melhor imagem do app.
3. **As editoras** — quem publica o que você lê. Nenhum concorrente sabe isso, porque nenhum sabe qual EDIÇÃO é a sua.
4. **A origem** — de onde vieram os seus livros, no texto livre que você mesmo escreveu. É a planilha virando retrato.
5. **O que espera** — lidos contra esperando, sem julgamento.
6. **A paciência** — quanto tempo um livro fica na estante antes de ser lido, de `added_at` a `finished_on`. Não é cobrança, é autoconhecimento.

O recorte por ano continua existindo, mas como **lente**, não como assunto: 2026, 2025, ou a vida inteira.

**2026-07-12 — Desfazer é um contrato, não um botão.**
Toda ação destrutiva ganha cinco segundos de arrependimento, e o desfazer devolve **tudo** que saiu: tirar um livro da estante apaga também a nota, a resenha e a procedência, então o retrato é tirado ANTES de apagar e é ele que volta. Um desfazer que devolvesse só a linha da estante seria um desfazer mentiroso, e mentiroso é pior que inexistente: a pessoa confia, clica, e só descobre a perda meses depois.

O que isso compra não é conforto: é coragem. Sem desfazer, "tirar 37 livros" é uma decisão que dá medo, e uma decisão que dá medo é uma que ninguém toma.

**2026-07-12 — Explorar, e a regra existe para quando a tentação chegar.**
Quem chega sozinho tem um feed vazio, e feed vazio é quarto escuro. A saída **não** é encher a tela com o que estranhos andaram fazendo. O Explorar é uma **livraria de pessoas**: você vê uma estante, reconhece um gosto, e segue. Aí o seu feed enche, e enche de gente que **você** escolheu.

Quatro coisas, e só quatro: **estantes para descobrir** (o coração), **quem lê o que você lê**, **resenhas recentes** e **o que estão lendo agora**.

**As regras, que não se negociam:**
- **Zero ordenação por engajamento, popularidade ou "em alta".** Cronológico, ou afinidade de estante, e ponto.
- **Nenhum número de popularidade em lugar nenhum.** Sem "mais lidos da semana", sem contador de leitores, sem trending.
- **Nenhum "para você" gerado por modelo.** Afinidade aqui é **sobreposição de estante**: quantos livros vocês têm em comum. É aritmética, é determinística, e dá para explicar em uma frase para quem usa. O número que aparece ("dois leitores também têm este livro") não ordena o mundo e não existe sem VOCÊ do outro lado: ele some no instante em que você tira o livro da estante.
- **Só resenha ESCRITA**, nunca "fulano prateleirou um livro" de um estranho. Se a pessoa sentou e escreveu, ela quer ser lida. Essa é a diferença, e ela é toda.
- **"Lendo agora" são só as capas.** Sem nome de quem lê, sem contagem. É vitrine, não ranking: no instante em que aparecer um número do lado, isso muda o que as pessoas põem na estante.
- **Toda leitura filtra `visibility` no SQL**, via `lib/authz.ts`. É a tela onde o vazamento seria mais barato (ela lê a estante de todo mundo), e por isso ela tem quatro ataques dedicados em `lib/redteam.sql.test.ts`.

**Por que a regra está escrita:** "explorar" é o nome que o feed algorítmico usa quando quer entrar. Ele começa cronológico e honesto, e em seis meses alguém olha uma métrica e o ordena por engajamento, com a melhor das intenções do mundo. **Esta regra existe para quando essa tentação chegar, e ela vai chegar.**

Na barra, o Explorar fica **abaixo de Amigos**, e a ordem é a tese: o produto é o feed de quem você escolheu; o explorar é só a porta por onde você escolhe, e porta não fica na frente da casa.

**2026-07-12 — A barra responde "onde estou", não "o que estou filtrando".**
Ela tinha catorze linhas porque misturava duas coisas que não são a mesma: **navegação** (onde estou) e **filtro** (que recorte da minha estante). "Lendo" não é um lugar, é um recorte. E **recorte mora na tela que ele filtra**.

Sobraram três destinos: **Início**, **Estante**, **Pessoas**. Mais o campo de busca, as estantes que você inventou, e a sua cara no rodapé.

**Para onde foi o que saiu:**
- **tudo / lendo / lidos / esperando / abandonados** → abas dentro de `/estante`, com a contagem do lado. A aba ativa continua na URL (`?filtro=lendo`), que é o que faz um recorte ser um link que dá para mandar para alguém.
- **Estatísticas** → aba dentro de `/estante`. Estatística é uma **vista** dos seus livros, não um destino paralelo. Por isso "Estante" continua aceso na barra enquanto você olha as estatísticas: um item que apaga enquanto você ainda está no mesmo assunto faz a pessoa achar que se perdeu.
- **Amigos + Explorar + Recomendações** → `/pessoas`, com três abas. Eram a mesma pergunta feita de três jeitos: Amigos é quem você **já escolheu**, Explorar é **como você escolhe**, Recomendações é o que **passou de mão em mão**. As rotas antigas redirecionam, porque link salvo que quebra é o app dizendo que o que a pessoa guardou não valia nada.
- **Buscar** → um campo no topo da barra, que **abre a paleta do ⌘K**. Busca é **ação**, e ação não é item de menu. Mas atalho que ninguém descobre sozinho é atalho que não existe, então ele ganhou uma porta visível. E é só uma porta: um segundo campo, com a própria caixa de resultados, seria uma segunda busca para manter, e as duas divergiriam em um mês.

**Minhas estantes ficam.** É a única lista da barra que o leitor criou com as próprias mãos, e a única que ele quer alcançar de qualquer tela.

**Início e Amigos não eram a mesma tela**, e a pergunta valia a pena: Início é o **seu estado** (o livro na mão, onde você parou, o seu ano), e Amigos é o feed inteiro. As duas dividiam **uma** coisa: o recorte de quatro itens do feed no pé do Início. Ele fica, e é deliberado: é o único motivo de abrir o app num dia em que você não tem nada a registrar.

**2026-07-12 — O `visibleTo()` emite o nome real da tabela, e isso é a garantia.**
Se você apelidar a tabela na query, o Postgres recusa: `invalid reference to FROM-clause entry`. Parece um incômodo, e é o contrário: **a regra de visibilidade não pode apontar para a tabela errada porque ela não sabe apontar para lugar nenhum além do nome verdadeiro.**

**Nunca "conserte" isso fazendo o `visibleTo()` aceitar um apelido como parâmetro.** No dia em que ele aceitar, passar o apelido errado passa a compilar, a rodar, e a devolver linhas que não deveriam existir. Hoje o erro é alto e imediato; naquele dia ele vira silencioso, que é a única espécie que importa. **Um vazamento que não compila vale mais do que um vazamento que você tem que lembrar de procurar.**

Se uma query precisa de apelido, **reescreva a query**: apelide a tabela que é sua (as suas linhas não precisam de filtro, porque você sempre pode ver o que é seu) e deixe sem apelido a da outra pessoa, que é a que o `visibleTo()` está filtrando. É o que o `lib/explore.ts` faz em `getAfinidade()`.

Isto não é teoria: essa recusa do Postgres já pegou o erro **três vezes** enquanto o Explorar e as estatísticas eram escritos, e nas três o erro apareceu na primeira vez que a tela abriu, e não seis meses depois num vazamento.

**2026-07-12 — A busca: meça antes de otimizar, porque as duas hipóteses estavam erradas.**
A busca levava até 1,5s por tecla, e havia duas suspeitas: o SQL, ou falta de debounce. **Nenhuma das duas era.**

O que a medição mostrou:
- consulta que **acha no nosso catálogo** (`machado`, `orwell`): 30 a 360ms;
- consulta que **não acha nada aqui** (`xyzabc`): **quatro a sete segundos**.

O culpado era a **fonte externa no caminho da tecla**. Quando o catálogo vinha curto, a resposta ficava presa esperando a Open Library **e** o Google, um atrás do outro. E eu tinha **piorado isso** na rodada das capas: ensinei o cliente a insistir em 503 com espera dobrando, o que é certo para um script que roda de madrugada e é péssimo para quem está digitando.

**A regra que fica: fonte externa NUNCA bloqueia uma tecla.** A primeira chamada devolve só o que é nosso, em milissegundos. A internet vem numa **segunda** chamada, depois de a tela já estar preenchida, e a tela diz "procurando lá fora" enquanto isso. A espera passa a ser do complemento, e não da resposta.

Dois achados de brinde, e o segundo é um bug de verdade:
1. O limiar de semelhança do trigrama estava no padrão (0.3), e com ele o índice devolvia **27 mil candidatos** para "machado" e descartava quase todos na recheca. Com 0.45 a mesma busca custa um quarto do tempo e traz os mesmos livros no topo.
2. `set_limit()` é um ajuste **por conexão**. Rodá-lo solto antes da consulta, com um pool de dez conexões, é **sorteio**: a consulta cai numa conexão que não recebeu o ajuste. Deu para ver na medição: a MESMA busca devolvia 20 livros numa chamada e 14 na seguinte. O limiar agora viaja no handshake da conexão (`-c pg_trgm.similarity_threshold=0.45`), então toda conexão do pool nasce com ele, o resultado é sempre o mesmo, e a busca não paga um `BEGIN` por tecla.

**Resultado:** 20 a 150ms com resultado local, e 10 a 50ms quando não há nada aqui (antes: 4 a 7 segundos). O debounce (250ms) e o cancelamento da requisição anterior já existiam, e continuam.

**2026-07-12 — Determinismo sob pool, e o perdão da busca.**

**1. Nada de autorização depende de estado de sessão, e agora existe teste para impedir que passe a depender.**
O `set_limit()` do trigrama fez a mesma busca devolver 20 livros numa chamada e 14 na seguinte. Aquilo apareceu como bug de busca, mas **é a FORMA de um vazamento de segurança**: um ajuste por conexão, num pool, é sorteado.

Varri o repo inteiro atrás de tudo que é escopo de sessão (`SET`, `SET LOCAL`, `set_config`, `search_path`, `statement_timeout`, `SET ROLE`, variáveis `app.*`, `current_setting`, RLS). **Não existe nenhum**, além do limiar do trigrama, que hoje viaja no handshake da conexão. E o mais importante: o `visibleTo()` é um predicado puro, com o id do leitor indo como parâmetro na própria consulta. **Ele não lê variável de sessão.**

Se lesse, aquele mesmo sorteio decidiria *quem a query acha que você é*: numa conexão o filtro valeria, na seguinte não, e ninguém veria, porque a resposta parece plausível. O `lib/pool.sql.test.ts` fecha os dois lados: prova que dez consultas seguidas no mesmo pool devolvem o mesmo resultado, **e** varre o código para garantir que nada de servidor lê ou escreve variável de sessão. Se um dia a gente quiser RLS de propósito, o teste falha — e falhar é o ponto: a decisão passa por um humano acordado.

**2. O limiar 0.45 não matou o perdão, e a medição está no teste.**
Testadas as seis consultas torturadas mais quatro: recall **idêntico** em 0.30, 0.40 e 0.45. O que o limiar corta é ruído de cauda, não o livro certo. `lib/forgiveness.sql.test.ts` trava isso: se alguém subir o limiar e "dom casmuro" parar de achar Dom Casmurro, o build cai.

**3. Mas o teste do perdão achou um bug de ranking que não era do limiar.**
Buscar **"machado de assiz" não trazia Dom Casmurro**. Causa: o ramo do autor dava nota **fixa** (0.35) a todas as 282 obras do Machado, enquanto os livros *sobre* ele (com "Machado de Assis" no título) marcavam 0.9 e ocupavam a lista inteira. Quem digita o nome de um autor quer o que ele **escreveu**, não o que escreveram sobre ele.

Duas correções: o ramo do autor passou a levar a **semelhança de verdade** do nome (0.85 para "machado de assiz"), e o empate é desfeito por **ter capa** — que é o sinal barato de que a obra é uma edição de verdade, e não uma ficha solta do dump.

**2026-07-12 — A busca responde em SEÇÕES: autor não é obra.**
Buscar "machado de assis" trazia os livros escritos **sobre** o Machado, e nunca os livros **dele** — porque o nome dele está no título deles, e casa quase perfeito. Consertar isso por peso de nota é gato e rato: **todo autor canônico tem biografia e estudo crítico com o nome no título**, e o nosso catálogo é de clássicos. O caso voltaria em Nietzsche, Clarice, Shakespeare, Dostoiévski, Kafka.

A saída estrutural é a busca **parar de fingir que autor e obra são a mesma coisa**:

```
AUTORES
[capa]  Machado de Assis · 282 obras     → /autor/machado-de-assis

OBRAS
[capa]  Dom Casmurro
[capa]  Memórias Póstumas de Brás Cubas
```

A seção de autores **só aparece quando o nome casa forte**, e some numa busca por título. O autor ganhou endereço público (`authors.slug`, migration 0016), porque sem um lugar para onde mandar a pessoa, a busca só sabia devolver uma lista e torcer para o ranking acertar.

**Três coisas que a implementação ensinou:**

1. **`word_similarity`, e não `similarity`.** Quase ninguém digita "Franz Kafka": as pessoas digitam **"kafka"**. Contra o nome inteiro isso dá 0.50 de semelhança e some abaixo de qualquer limiar decente; contra a **melhor palavra do nome**, dá 1.00. Um limiar sobre o nome inteiro exigia, na prática, que a pessoa soubesse o nome completo do autor para achá-lo, o que é o oposto de perdoar. O operador `<%` usa o mesmo índice de trigrama e responde em 2ms sobre 160 mil autores.

2. **Deduplicar ANTES de ranquear é ordenar pela coisa errada.** O `distinct on` obriga o `order by` a começar pelo nome normalizado, ou seja, alfabeticamente. Cortar o limite ali dentro trazia "António Machado de Faria" e nunca chegava no Machado. A ordem que vale (semelhança, depois tamanho da obra) tem que ser aplicada **fora**, depois do colapso.

3. **"Tem capa" é uma HEURÍSTICA, não uma lei.** Ela desempata a busca e ordena a página do autor, e funciona porque **no dump da Open Library uma edição de verdade tem capa e uma ficha órfã não tem**. Isso pode mudar: se um dia a gente importar uma fonte sem capa nenhuma, o desempate para de significar o que significa hoje. Está anotado aqui para o dia em que alguém for depurar um ranking estranho.

**E uma coisa que eu NÃO fiz, de propósito:** o dump traz o mesmo autor escrito de quatro jeitos ("Machado de Assis", "Machado De Assis", "Machado De ASSIS"), porque o unique do nome é sensível a maiúscula. A busca **colapsa** essas linhas na exibição, mas elas continuam sendo quatro linhas no banco, com as obras repartidas entre elas. Fundir de verdade é uma mudança de dado que não volta atrás, e ela fundiria junto dois homônimos de verdade. Fica para uma decisão tomada acordado.

**2026-07-12 — O histórico de correções é público, e é ele que torna vandalismo caro.**
Nada é sobrescrito em silêncio. Toda correção grava uma revisão com o **nome de quem fez**, e o histórico fica na página do livro, para sempre. Não é uma permissão que protege a ficha comum: **é a assinatura.** Foi assim que a Wikipédia conseguiu ser aberta sem virar terra de ninguém.

**A capa é a única exceção.** Todo o resto (páginas, ano, editora, ISBN, tradutor, formato, idioma) qualquer leitor logado corrige e **aplica na hora**. A capa não, porque ela é o único campo que **aparece na tela de todo mundo**: é onde o vandalismo tem plateia. Nela, o leitor propõe e o bibliotecário aplica. E quando aplica, **a revisão leva o nome de quem PROPÔS**, não do bibliotecário que apertou o botão: o trabalho é de quem achou a capa.

**Reverter é ação de bibliotecário, e a reversão também entra no log.** A revisão original não é apagada: é marcada como revertida. Um histórico que se apaga não é histórico, é uma versão dos fatos. E é isso que sustenta a fatia 2: dá para contar o que **sobreviveu**.

**A tela pergunta primeiro, e a pergunta É a feature:**

> **O que está errado?**
> ( ) Um dado desta edição está errado → corrige
> ( ) A capa está errada → sugere, e um bibliotecário confere
> ( ) A minha edição é outra → escolhe ou cadastra outra edição
> ( ) Nada, eu só quero mostrar a minha cópia → foto do seu exemplar

**Sobrescrever a ficha compartilhada para ela bater com a sua cópia é proibido. Capa diferente é EDIÇÃO diferente.** Foi exatamente assim que o catálogo do Goodreads virou lixo: cada leitor foi ajustando a ficha comum até ela não descrever livro nenhum. Os outros apps não oferecem o caminho certo, então todo mundo estraga a ficha comum por falta de alternativa. Aqui a alternativa é a primeira coisa que a tela mostra.

**A capa do catálogo continua por REFERÊNCIA** (a URL da fonte, nunca uma cópia do arquivo). A foto da **sua cópia** é outra coisa: é fotografia sua, e essa a gente hospeda.

**2026-07-12 — Número de conserto, sim. Número de leitura, nunca.**

> Não existe número comparável entre pessoas **sobre leitura**. Ler não é competição. Manutenção do bem comum **não é leitura**: contar capas consertadas não mede o gosto de ninguém, não compara leitor com leitor, e não muda como ninguém lê. Mede **trabalho doado**. É o que a Wikipédia e o OpenStreetMap contam, e é por isso que eles existem. A fronteira não se move: número de conserto, sim. Número de leitura, nunca.

`/contribuidores` tem duas listas, na mesma página, com o **mesmo peso visual e a mesma tipografia**: quem escreve o código (API do GitHub, cacheada por uma hora) e quem cuida do catálogo. Sem hierarquia entre elas — e isso é decisão de desenho tanto quanto de ideia: se uma das duas ganhasse um título maior, uma borda, ou o topo da página, a página estaria dizendo qual trabalho vale mais. **Quem conserta uma capa vale o que vale quem faz um commit.**

**As três regras que impedem o número de apodrecer:**

1. **Conta só o que SOBREVIVEU** (correção não revertida). Contar edição **feita** produz edição **lixo**: a pessoa enche o contador com correção trivial ou errada, que é problema documentado na Wikipédia.
2. **Não ordena do maior para o menor.** Ordena por **quem chegou primeiro**. O número é um registro, não um placar — e no dia em que virar placar, alguém começa a farmar correção trivial para subir nele.
3. **Não sai desta tela.** Nunca no perfil, nunca no feed.

**A contradição, e como ela se resolve: O NÚMERO NÃO VIAJA. A INSÍGNIA VIAJA.** Número é placar, e fica preso em `/contribuidores`. Insígnia é **papel**: ela diz o que a pessoa **é**, não quanto ela **fez**, e por isso pode andar junto com o nome no perfil e no feed.

Isso não é boa intenção: é teste. `lib/contributors.sql.test.ts` varre `app/`, `components/` e `lib/`, e **quebra o build** se qualquer arquivo fora da página de contribuidores importar a contagem.

**2026-07-12 — Insígnia é binária, e é sobre doação. Escalonar é farmar. Ler nunca dá insígnia.**

**Você é, ou não é.** Nada de "Bibliotecário Sênior", nada de nível, de tier, de "faltam 12 correções". **Escada produz farm:** quem precisa de 500 correções para subir de degrau faz 500 correções **ruins**. Uma insígnia binária não tem degrau para subir, então não há o que farmar.

As cinco: **bibliotecário** (aprova capa e desfaz vandalismo), **catálogo** (tem correções que ficaram de pé), **código** (escreveu parte do Gume), **arauto** (trouxe leitores que ficaram) e **fundador** (estava aqui no começo, e um dia fecha para sempre).

**Nenhuma é sobre leitura.** Nenhuma se relaciona a quanto a pessoa leu, avaliou ou seguiu. Se alguém um dia propuser "Leitor Voraz", **feche o PR e cite esta linha**. Isso está travado em teste: a suíte varre os rótulos e quebra o build se uma insígnia for ganha por ler.

**A insígnia de CÓDIGO não é auto-declarada.** Ela cruza a conta do GitHub **ligada** à conta do Gume (OAuth) com a lista de contribuidores do repositório. Se a pessoa pudesse digitar o próprio login, a insígnia não diria nada sobre trabalho: diria sobre quem sabe digitar.

**O ARAUTO cita "leitores" e não é sobre leitura**, e a distinção vale escrever: ele honra **trazer gente**, e a pessoa que ele trouxe pode nunca ter aberto um livro. **A diferença é o verbo.** Ler, avaliar, seguir, terminar, colecionar: proibidos. Trazer, corrigir, escrever, aprovar: doação. (O primeiro teste que eu escrevi reprovou o arauto por causa da palavra "leitores", e o teste estava errado, não a insígnia.)

**Ela é um TRAÇO, não uma medalha.** Discreta de propósito: uma medalha colorida ao lado de um nome muda o que as pessoas fazem para conseguir uma, e a gente não quer que ninguém **faça** nada para conseguir uma. Quem consertar uma ficha errada porque ela estava errada ganha a insígnia sem ter pensado nela.

**E o selo de APOIADOR não mora aqui.** Dinheiro comprou um selo; não doou trabalho. Visual diferente, lugar diferente, nunca lado a lado. Confundir os dois é dizer que **se compra mérito** — e isso também está em teste.

**2026-07-12 — Cópia disponível não é mercado, e o seguir mútuo é o sistema de confiança.**

> **SUPERADA** por "Doar, trocar e emprestar saem do Gume": a troca de exemplares saiu inteira. Mantida porque `mutuals()` filtrando no SQL e "DM é a maior superfície de moderação que existe" seguem sendo lei aqui.

Uma cópia pode estar disponível para **doar, trocar ou emprestar**. "Vender" não está na lista, e nunca vai estar. O app **não intermedeia**: sem envio, sem endereço, sem frete, sem pagamento, sem custódia, sem disputa, sem reputação de trocador, sem estrela de vendedor. O combinado acontece **fora** do app.

**Como as pessoas se falam, sem sistema de mensagens:** cada leitor pode cadastrar **um** canal (WhatsApp, Instagram, Telegram, e-mail). Opcional, vazio por padrão. Ele **não é público**: só aparece para quem tem **seguir mútuo** com a pessoa, e o filtro roda **no SQL**, via `mutuals()` em `lib/authz.ts`. O botão "falar com fulana" abre o canal **dela**. O Gume faz a apresentação e sai da sala.

**Sem seguir mútuo, o botão não existe.** A cópia aparece como disponível, e não há como pedir. **Isso é o comportamento correto, não uma falta.**

**Por quê:** DM é a **maior superfície de moderação que existe**, e "sem comentários" foi decidido justamente para a moderação ser viável com **uma** pessoa. Um mercado contrabandeia mensagens, reputação e disputa para dentro de um projeto de fim de semana — cada uma dessas coisas chega sozinha, parecendo pequena, e junta vira um trabalho em tempo integral que ninguém tem. O seguir mútuo **é** um sistema de confiança, e ele **já existe**: não custa uma linha de moderação para manter.

**O custo, aceito de olho aberto:** a troca só acontece entre quem já se escolheu. Um estranho vê que a cópia está disponível e não tem como pedir.

**E o filtro é no SQL, não em JavaScript.** Se o contato fosse filtrado depois de buscar, o telefone de alguém já teria saído do banco e viajado até o servidor de renderização **para ser jogado fora ali**. Filtrar depois de buscar é como um contato vaza. O `mutuals()` faz o Postgres devolver **nulo** para quem não tem o mútuo, e sete testes provam isso.

**2026-07-12 — A linhagem da cópia. Um exemplar que atravessa cinco estantes carrega o nome de cada uma.**

> **SUPERADA** pela mesma decisão ("Doar, trocar e emprestar saem do Gume"): `came_from` saiu com o mercado. Mantida porque "a corrente para onde a visibilidade fecha" é a regra de vazamento que vale para toda linhagem, não só a de exemplar.

Quando a cópia muda de mãos, o novo dono registra de quem ela veio, e a procedência deixa de ser texto solto e vira uma **corrente**: *"veio da estante de @maria, que a recebeu de @joão"*.

O leitor já tinha linhagem (`users.invited_by`: quem trouxe quem). Agora o **livro** tem também. **Custa uma coluna e não precisa de moderação nenhuma** — e é a parte que nenhum outro app tem, porque nenhum outro app sabe qual **exemplar** é o seu.

**A corrente PARA onde a visibilidade fecha, e não pula por cima do elo privado.** Se a cópia da Maria é privada, a corrente termina nela: não avança para mostrar quem estava atrás. **Pular seria contar que existe alguém escondido no meio** — e quem tornou a própria estante privada não pediu para virar um espaço em branco na história de outra pessoa. O filtro é o `visibleTo()`, no SQL, e há um teste que prova exatamente isso.

**A linhagem é memória, não formulário.** Só se registra de quem você **segue**: ela é a lembrança de quem passou o livro na sua mão, e não um campo para digitar o nome de um desconhecido. E um livro **não vem da própria estante**.

Detalhe de implementação que vale a nota: a corrente é caminhada **um elo por consulta**, e não numa CTE recursiva. Uma CTE recursiva precisaria **apelidar** `owned_copies` em cada braço, e o `visibleTo()` emite o nome real da tabela (ver a regra do apelido). Reescrever a query foi a saída certa: custa oito consultas no pior caso, o que é barato por uma regra de visibilidade que **não dá para escrever errado**.

**2026-07-12 — "O que falta": o pedido concreto no lugar do "contribua!".**
Uma página com o trabalho aberto do catálogo: quantos livros estão sem capa, sem ano, sem editora. É como o OpenStreetMap cresce — **ninguém atende a um "contribua!" abstrato, e todo mundo atende a um pedido concreto.**

**O melhor recorte é o seu: os livros sem capa que estão NA SUA estante.** Esse livro está na sua mão, na sua casa. Você é a **única pessoa no mundo** que pode consertar aquilo agora, porque basta virar o livro e olhar a lombada. Ninguém mais tem esse acesso, e é por isso que este recorte funciona onde "ajude o catálogo" não funciona.

**Os números do catálogo inteiro são enormes, e ficam enormes.** 336 mil livros sem capa. Não vou escolher um subconjunto lisonjeiro nem desenhar uma barra de progresso fingindo que está quase lá: **é o tamanho honesto do trabalho**, e um número que mente para animar é a primeira peça de um app que mente.

E aqui mora a **fila de capas**, que a fatia 1 tinha deixado sem tela: ela existia no banco e não tinha onde ser julgada. Só bibliotecário a vê. A capa proposta aparece **ao lado da que está lá hoje**, porque julgar sem ver as duas é julgar no escuro.

**2026-07-12 — As oito insígnias. Todas binárias, todas sobre doação, e a cor não é hierarquia.**

> **PARCIALMENTE SUPERADA:** são SETE insígnias hoje (o semeador saiu junto com a doação de exemplar). As regras seguem inteiras: binária, sobre doação, OKLCH de mesmo L e C, e "não existe Resenhista".

Bibliotecário, zelador, construtor, tradutor, arauto, membro fundador, semeador, caçador. Nenhuma delas é sobre ler.

**Insígnia é BINÁRIA: você é, ou não é.** Nada de nível, tier, "Sênior", XP, meta ou barra de progresso. **Escada produz farm:** quem precisa de 500 correções para subir de degrau faz 500 correções **ruins**. Uma insígnia binária não tem degrau, então não há o que farmar.

**O número não viaja; a insígnia viaja.** Número é placar e fica preso em `/contribuidores`. Insígnia é **papel**: diz o que a pessoa **é**, não quanto ela **fez** — e é por isso que ela pode andar junto com o nome. Saber que foi um **bibliotecário** que fez aquela correção é informação útil; saber que ele fez quarenta e sete é placar.

**As oito têm a MESMA luminosidade e a MESMA saturação. Só o matiz gira.** Em OKLCH: mesmo L, mesmo C, mesmo raio de glow, mesmo alpha. Assim é **matematicamente impossível** uma parecer mais preciosa que a outra — cor aqui é **identidade**, nunca hierarquia. Isso não sobrevive como intenção ("a gente vai tomar cuidado" não passa pela quarta pessoa que mexe no CSS), então sobrevive como aritmética: `lib/badges.test.ts` quebra o build se alguém mover o L, o C, o raio ou o alpha de uma só. **Proibidos, e não é gosto, é semântica:** ouro/prata/bronze (é um pódio, e todo mundo lê pódio) e a paleta de raridade de jogo (cinza → verde → azul → roxo → laranja, que qualquer pessoa que já jogou decodifica na hora — e passa a querer a laranja).

**NÃO EXISTE "Resenhista", e a recusa é a mais importante da lista.** Resenha é produzida **por** leitura, e premiar quem resenha corrompe justamente a coisa cuja honestidade mais importa neste app: uma resenha escrita para ganhar uma insígnia não é uma resenha, é uma performance. **Se alguém propuser, feche o PR e cite esta linha.**

**Seis são calculadas, e duas são reconhecidas.** O banco sabe quem tem correção que sobreviveu (zelador), quem trouxe leitores que ficaram (arauto), quem estava aqui no começo (fundador, **corte fixo em 100, e corte que se move não é corte**), quem é bibliotecário, e quem tem PR mesclado (construtor, cruzando a conta do GitHub ligada por OAuth com os contribuidores do repositório — **nunca autodeclarado**). **Caçador** e **tradutor** ele não sabe: ligar um erro que alguém apontou ao conserto que veio depois é julgamento de gente. São concedidas por um bibliotecário, **com nome e com motivo** — insígnia dada em silêncio vira favor —, e a concessão é append-only: retirar **marca**, não apaga.

**O SEMEADOR é dado por quem RECEBEU.** Declarar um livro como "disponível para doar" **não** dá insígnia: isso é intenção, e intenção é grátis. A insígnia nasce quando a estante de **outra pessoa** diz que o livro veio de você (`owned_copies.came_from`, a linhagem da fatia 5). É por isso que ela não se falsifica sozinha.

**O selo de apoiador não é uma insígnia, e não pode parecer com uma.** Retângulo fino, sem glow, cinza neutro. Quem apoia **comprou** um selo; quem tem uma insígnia **doou** trabalho. Se os dois se parecerem, a mensagem que sobra é "dá para comprar mérito", e isso mata a página de contribuidores inteira — a partir daí ninguém mais sabe, olhando, quem trabalhou e quem pagou.


**2026-07-12 — /estatisticas diz QUEM VOCÊ É, e nunca QUANTO VOCÊ LEU. E a estatística da comunidade compara gosto, nunca esforço.**

A página não é desempenho, é **curadoria**. Ela não te diz quanto você leu: ela te diz **quem você é como leitor**. De que época são as obras que você escolhe, de onde vêm os autores, quem publica, de onde vieram os seus livros. Isso fala de **gosto**, e gosto não tem placar.

**A regra da comunidade, e ela não se cruza:**

> **Estatística da comunidade compara gostos, nunca desempenho. Média de livros lidos é o número que este app existe para não ter.**

**PODE:** "a comunidade lê autores de 22 países, você leu de 6." "A comunidade lê obras com 61 anos, em média; você lê com 87." As editoras mais presentes nas estantes. A obra mais antiga que alguém leu. "3 pessoas leram Grande Sertão este ano" (fato, não ranking).

**NUNCA, e feche o PR:** média de livros lidos, por mês, por ano, ou nunca. "Você está acima da média." Qualquer percentil, qualquer posição, qualquer ranking de leitor. Qualquer número seu ao lado do número de outra pessoa **para comparar esforço**. **Comparar gosto é o produto. Comparar esforço é o veneno**, e ele entra exatamente assim: uma comparação inocente de cada vez.

**A MEDIANA, e não a média, para a idade das obras.** Medido na estante real: a média dá **267 anos** e a mediana dá **22**. A diferença é **um** Sun Tzu de 2.427 anos puxando a média sozinho. A média diria "você lê livros de 267 anos" a alguém que lê contemporâneo com alguns clássicos fundos, e numa página que promete dizer quem você é, uma estatística torta por um único ponto **diz quem você não é**. Média é frágil a extremo, e uma estante de leitor **é** feita de extremos.

**A frase-resumo é DETERMINÍSTICA e CALA A BOCA quando não sabe.** Com menos de 5 livros lidos a página não arrisca observação nenhuma: não se inventa retrato de leitor em cima de 3 livros. E ela **nunca** é gerada por IA (ver a recusa no README): é uma regra escrita, e a mesma entrada produz sempre a mesma frase.

**A frase explica o que a estatística REVELOU, nunca como ela foi CALCULADA.** "O ano em que a obra foi escrita, nunca o ano em que a edição foi impressa" é nota de rodapé sobre o modelo de dados, e ninguém liga. O que a pessoa quer ler é o fato: "as obras que você leu foram escritas entre 1857 e 2019, e metade delas antes de 1950." **Se a frase explica o cálculo, ela está errada.**

**Nenhum número desta página aparece no perfil nem no feed.** Ela é sua, e é privada por padrão: exige estar logado, e mostra a **sua** estante, nunca a de um estranho.

**2026-07-12 — REVERSÃO: "Quem faz" passa a vir ordenada por quem fez mais.**

A entrada anterior dizia: *"Não ordena do maior para o menor. Ordena por quem chegou primeiro. O número é um registro, não um placar — e no dia em que virar placar, alguém começa a farmar correção trivial para subir nele."*

**Está revertido, a pedido do dono, e o motivo dele é bom:** ordem de chegada **não é neutra**, é só outra ordem. Com cem pessoas na lista, ela **enterra quem mais cuidou do catálogo** embaixo de quem simplesmente se cadastrou antes. Este projeto promete, em voz alta, que **quem conserta uma capa vale o que vale quem faz um commit** — e reconhecimento que ninguém consegue **ver** não é reconhecimento, é uma frase bonita num arquivo que a gente escreveu para si mesmo.

**O custo está aceito de olhos abertos, e ele é real.** Contar só o que **sobreviveu** (`reverted_at is null`) impede a correção **errada**, e **não impede a correção trivial**: uma correção minúscula e certa sobrevive e conta. Com a lista ordenada, a jogada ótima passa a ser **fazer quinhentas correções minúsculas e certas**. O medo antigo continua verdadeiro; a gente escolheu pagar por ele.

**A fronteira andou UM passo, e não dois. Continua proibido, e há teste:**

- **Posição ordinal.** Nada de "#1", "1º", "top 10". A lista é **ordenada**, e nunca **premiada**: é a premiação que transforma o topo num prêmio permanente pelo qual vale a pena farmar.
- **Pódio, medalha, troféu, coroa, ouro/prata/bronze.** Todo mundo lê pódio.
- **O número fora desta página.** Ele continua preso a `/contribuidores`, e um teste quebra o build se ele vazar para o perfil ou para o feed.
- **Número de leitura, nunca.** Essa fronteira não se moveu e não se move: número de **conserto**, sim; número de **livro lido**, jamais.

**O empate é desfeito pela chegada**, e isso não é detalhe: o valor antigo não foi jogado no lixo, virou o critério de desempate. Entre duas pessoas com o mesmo número, quem chegou primeiro vem primeiro.

Se um dia aparecer farm de correção trivial, o conserto **não é voltar à ordem de chegada**: é melhorar a métrica (peso por tipo de campo, ou uma janela de tempo). O problema seria da métrica, e não da ordem.

**2026-07-12 — REVERSÃO: barra de progresso EXISTE, e só para CONTRIBUIÇÃO.**

Estava escrito em maiúsculas, em dois documentos: *"nada de nível, de tier, de 'faltam 12 correções'. **ESCADA PRODUZ FARM**: quem precisa de 500 correções para subir de degrau faz 500 correções ruins."*

**Está revertido, a pedido do dono, e a distinção dele é a coisa boa desta entrada:**

> Gamificar **contribuição** não é ruim. O ponto do Gume é não gamificar **leitura**, e não comparar leitores.

**Ela está certa, e a regra antiga confundia as duas coisas.** Ler é uma experiência íntima, e uma barra enchendo ao lado de "livros lidos" transforma leitura em meta, meta em cobrança, e cobrança na mesma família da ofensiva. **Isso continua proibido, para sempre.**

Consertar o catálogo é outra coisa: é **mutirão**, e não intimidade. Saber que faltam três correções para virar zelador não corrompe nada — faz o mutirão andar. E os amigos que vão usar isto são nerds: a barra fala com eles.

**E o farm? Continua caro, e quem o segura NÃO é a barra: é a MÉTRICA.** Só conta o que **sobreviveu**. Quem enche o contador com correção lixo tem o lixo revertido, e **a barra anda para trás**. Uma escada cujo degrau desaba quando você pisa errado não é uma escada que se sobe correndo.

**A linha que não se cruza, e ela é a única que importa daqui em diante:**

| | barra de progresso |
|---|---|
| **contribuição** (correções, catálogo) | **pode** |
| **leitura** (livro lido, página, meta do ano, ofensiva) | **nunca** |

Barra só existe onde existe uma **contagem**. Insígnia que é um **fato** (você escreveu código, alguém entrou por sua causa, você chegou entre os cem primeiros) **não tem barra**, e desenhar uma seria mentir sobre como ela funciona: não existe "68% de ter tido a ideia do Gume".

E a insígnia continua **binária**: a barra mostra a distância, e o glifo continua sendo você é, ou não é. Não existe "zelador nível 2".

**2026-07-12 — Moderador é um cargo SEPARADO do bibliotecário, e só o idealizador concede.**

A moderação nasceu presa ao bibliotecário, e isso estava errado. O dono pegou: *"eles já têm muito poder"*.

**Bibliotecário SE GANHA SOZINHO:** 50 correções que sobreviveram, 30 dias de conta, e a porta abre. É a regra **certa** para o que ele faz (aprovar capa, desfazer vandalismo no catálogo): o pior erro dele é um erro de **ficha de livro**, revertível por outro bibliotecário, com o nome dele no log.

**Moderador mexe em GENTE.** Ele tira uma pessoa do ar.

> **Poder sobre LIVRO se ganha por trabalho. Poder sobre PESSOA se ganha por CONFIANÇA.** E confiança não é uma consulta: é alguém dizendo sim.

Um cargo que se destranca cruzando um número é um cargo que **um script paciente também destranca**. Cinquenta correções triviais e certas, trinta dias de espera, e o script vira moderador — e aí ele bane quem quiser.

**Só o IDEALIZADOR promove**, e ele é único no mundo por índice do banco (migration 0024). Não é "o admin", não é "um bibliotecário sênior": é **uma** pessoa, e não dá para virar ela.

**Um moderador NÃO promove outro.** Se pudesse, bastaria um erro de julgamento para o poder virar uma corrente que ninguém mais recolhe.

**Um moderador não bane outro moderador**, e o idealizador não se rebaixa. O primeiro evitaria uma guerra civil de banimentos em looping; o segundo evitaria o sistema ficar trancado por fora, sem ninguém que possa promover.

**Isso não escala, e não escalar é a intenção.** No dia em que precisar escalar, a conversa é sobre o que se faz quando o dono some, e essa conversa não se resolve com uma coluna.

---

**Sobre RLS (row-level security), que foi perguntado:** o app **não tem**, e ligar hoje seria **teatro**. A conexão usa o papel `gume`, que é **superusuário e dono do banco** — e superusuário **ignora RLS**, assim como o dono da tabela. Daria falsa sensação de proteção e zero proteção.

RLS de verdade exige o app conectar num papel **sem superusuário e sem ser dono**, com `FORCE ROW LEVEL SECURITY`. É defesa em profundidade real, e está anotado como débito em `docs/O-QUE-FALTA-NO-CODIGO.md`.

**Mas ela não resolveria o que foi perguntado, de todo jeito:** RLS decide **quais linhas você enxerga**, e não **quais ações você pode executar**. "Bibliotecário não pode banir" é autorização de **ação**, e mora em `lib/authz.ts` e `lib/moderacao.ts`, provada contra o Postgres em `lib/moderacao.sql.test.ts`.

---

## O acervo é CURADO, e o cânone manda em três coisas — e só três

**12 de julho de 2026.**

O acervo tinha **373.435 obras** e **414.949 edições** vindas do dump da Open Library, e
**336 mil livros sem capa**. Um acervo grande não é um acervo bom: é um armário onde o
livro que você quer está atrás de duzentos que ninguém quis.

**Decisão: o acervo passa a ser escolhido a mão.** Um cânone de autores
(`seed/canone.ts`), mais tudo que qualquer pessoa já tocou. E ele cresce **por demanda**:
toda busca que não acha nada vira um pedido (`lib/torneira.ts`, `/pedidos`), e o pedido
vira o próximo autor importado.

Assim, **todo livro no Gume vai ter sido querido por alguém** — ou pelo idealizador, na
lista, com o nome dele em cima; ou por um leitor, que procurou e não achou.

### O que o cânone NÃO pode fazer

1. **Não ordena a busca.** Autor famoso não sobe por ser famoso: isso é algoritmo de
   popularidade com outro nome, e é o que o Gume recusa.
2. **Não vira grade de "livros populares" no Explorar.** O Explorar é tela de **gente**.
3. **Nenhum contador, nenhuma posição, nenhum "mais lido".** É uma escolha editorial
   **assinada**, e não uma métrica. `seed/canone.test.ts` quebra o build se o tipo
   `AutorDoCanone` ganhar um campo de peso, posição ou popularidade.

Ele manda em **três** coisas: a prioridade do backfill de capa, as estantes curadas
feitas a mão, e a parede da home deslogada.

### O tamanho do cânone é uma escolha, e ela se defende

**300 → 367**, e a mudança foi obrigada pela medição, não pelo gosto.

O cânone original (300) foi montado de best-seller, mangá e clássico internacional. Ao
medir o que a poda apagaria, apareceu o que ninguém tinha visto: **a força do acervo é a
literatura lusófona, e o cânone não tinha quase nada dela.** A poda teria apagado
**Camões (213 obras), Gil Vicente (122), Camilo Castelo Branco (98), Padre Vieira (63),
Lobo Antunes (49), Sophia de Mello Breyner (47), Vinícius de Moraes (44), Castro
Alves (42)** — e mais uns quarenta.

E teria apagado **111 obras de Jorge Amado**, que o acervo guarda sob o nome de registro
dele ("Jorge Leal Amado de Faria"), guardando só as 25 que estão sob "Jorge Amado".

> **A lista vem da cabeça; a poda vem do banco.** A cabeça lembra do que ela lê, e o
> banco sabe do que ele tem. A lista só ficou boa depois de a medição contradizê-la.

O número está travado por teste. Mudá-lo exige mudar a constante **no mesmo commit** e
escrever aqui por quê — não porque um número seja mágico, mas porque um número que
ninguém defende vira três mil em seis meses.

### A fila de pedidos não guarda quem procurou

A tabela `buscas_vazias` **não tem `user_id`**, e a falta dele é a decisão.

Para escolher o próximo autor a importar basta saber **o quê** foi procurado e **quantas
vezes**. Saber **quem** procurou não muda a escolha — e cria, de graça, um histórico de
busca por pessoa: a coisa que ninguém pediu e que todo mundo odeia descobrir que existe.

**Uma coluna que não existe não vaza.** É a única garantia que não depende de alguém
lembrar, e `lib/torneira.sql.test.ts` quebra o build se alguém acrescentar uma.

O contador `quantas` existe para o bibliotecário ordenar o trabalho dele. Ele **não**
aparece em tela de leitor e **não** vira "mais procurados" — a fila é ferramenta de quem
trabalha, e não vitrine.

### "Não achei meu livro" são DOIS campos, e não nove

Com o acervo curado, procurar um livro que o Gume não tem deixou de ser exceção: vai
acontecer todo dia. O cadastro à mão pedia nove campos.

> **Um formulário de nove campos, no fim de uma busca que já falhou, é um formulário que
> ninguém preenche. E quem não preenche não fica sem o livro: fica sem o app.**

Agora são **título e autor**. O resto (`enriquecer()`, em `lib/catalog.ts`) o Gume procura
sozinho no Google Books e na Open Library. Ele é **desconfiado de propósito**: o título
que volta tem que conter todas as palavras significativas do que a pessoa digitou, e o
autor tem que bater. Na dúvida não preenche — **a capa errada na estante de alguém é pior
que capa nenhuma**, e ninguém perceberia, porque o leitor não pediu nada disso.

### 2026-07-16 — Revisado: a ficha é INTEIRA, e quem preenche é o ISBN

O corte para dois campos matou o abandono e criou outro problema: **a ficha pela metade**.
A máquina procurava por **título**, e título é exatamente o que falha na edição brasileira
obscura — que é exatamente o caso de quem chega ao cadastro à mão. O livro entrava magro:
sem capa, sem editora, sem páginas.

E havia um furo bobo no meio disso: **o ISBN era guardado e nunca usado**. A pessoa digitava
o código de barras, com o livro na mão, e a máquina saía procurando por título assim mesmo.
O identificador mais preciso que existe era jogado fora na hora da consulta.

Agora o formulário mostra **tudo** (título, autor, ISBN, editora, ano, páginas e capa), e o
**ISBN preenche o resto sozinho** (`porIsbn()` em `lib/catalog.ts`; `enriquecer()` passou a
receber o código e, quando ele existe, dispensa a conferência de título — um ISBN é uma
edição só). Medido em ISBN brasileiro real: `9788535914849` volta "1984, Companhia das
Letras", com capa. Dois de quatro não voltam nada — e é por isso que os campos ficam à
vista e a **capa aceita upload**: quando a fonte não sabe, quem está com o livro na mão
sabe.

Isto **não** ressuscita o formulário de nove campos: a diferença é que ninguém precisa
preencher seis coisas. Um campo (o código) faz o trabalho, e a pessoa só confere. O que
ficar em branco continua entrando, com `needs_review`, esperando um bibliotecário. Só o
título é obrigatório.

---

## As datas de leitura são do LEITOR, e não do relógio do servidor

**13 de julho de 2026.**

O app gravava `new Date()` como o dia em que a pessoa terminou o livro. Sempre hoje. E
não existia nenhuma tela para corrigir: se a data estava errada, ela ficava errada para
sempre, e a única saída era apagar o livro da estante e pôr de novo, perdendo a nota e a
resenha junto.

**O Gume não sabia quando ninguém tinha lido nada** — e a página de estatísticas e a
retrospectiva do ano são construídas inteiras em cima dessas três datas.

E era uma mentira **silenciosa**, que é o pior tipo. Ninguém abre um chamado dizendo "a
data do meu livro está errada", porque ninguém olha. O erro só aparece em dezembro,
quando a retrospectiva fica estranha e ninguém sabe explicar por quê.

### Um campo, e não um formulário

Marcar como lido continua sendo **um toque**. A data vem preenchida com hoje, e quem
aceita hoje não paga nada por isso — nem um clique a mais. Quem terminou em março mexe
no campo. **O peso fica com quem precisa dele, e não com todo mundo.**

As três datas (começou, terminou, abandonou) são editáveis na hora e corrigíveis depois,
na página do livro. Cada leitura tem as suas: reler é uma segunda leitura, e mexer numa
não toca na outra.

### O que a validação recusa, e por quê

Data no futuro (ninguém terminou amanhã um livro), data anterior a 1900 (quase sempre é
um dedo escorregado), **dia que não existe** (`new Date("2019-02-31")` não levanta: ele
rola para 3 de março, em silêncio), fim antes do começo (não é uma data errada, é uma
história errada) e terminado **e** abandonado ao mesmo tempo (são dois finais para a
mesma história, e guardar os dois é guardar uma contradição que a página do ano teria que
resolver no chute).

### `date`, e nunca `timestamptz`

Já estava aqui, e o motivo continua valendo. Quem termina um livro às 22h de 31 de
dezembro em Brasília terminou **em 31 de dezembro**. Um `timestamptz` guarda isso como 1º
de janeiro em UTC, e a retrospectiva joga o livro para o ano seguinte. "Que dia você
terminou" é uma pergunta de calendário, e não de relógio.

Por isso `hoje()` (lib/datas.ts) monta a data pelo calendário **local**, e não com
`new Date().toISOString()` — que era o que o app fazia, e que devolve o dia em UTC.

### Documento não defende código

E aqui está a lição que custou caro: **esta regra já estava escrita neste arquivo**, e
foi obedecida no banco (a coluna é `date`, e não `timestamptz`). O mesmo bug voltou pela
camada de JavaScript, por outra porta, sem que ninguém percebesse.

Uma regra que mora num arquivo de texto é uma regra que a próxima linha de código
esquece. `lib/fuso.test.ts` roda com `TZ=America/Sao_Paulo`, congela o relógio às **23h
de 31 de dezembro** e prova que um livro marcado como lido no padrão cai em **31/12**, e
não em 1º de janeiro. E varre o código atrás de `new Date().toISOString()`.

Se alguém reintroduzir o bug, **o build cai** — por comportamento e por estrutura. É a
única forma de uma decisão sobreviver a quem não leu o DECISIONS.md.

### Por que isto era pré-requisito do importador

A promessa do README é **"sem perdas: datas de leitura, notas, texto de resenha,
prateleiras"**. Se `finished_on` não aceitasse uma data arbitrária, o arquivo do Goodreads
entraria sem data nenhuma: dez anos de leitura virariam dez anos de "hoje". **O importador
nasceria quebrado.** Não dava para fazer um antes do outro.

---

## O acervo é CURADO por editora, e a régua é o PRAZER

**13 de julho de 2026.**

O Gume não quer ter todos os livros. Quer ter os **certos**.

Catálogo curado é a mesma escolha do feed sem algoritmo, aplicada ao acervo. O Goodreads
e o Skoob têm tudo, e têm mal.

> **A régua: fica o que alguém leria por PRAZER. Sai o que só se lê por OBRIGAÇÃO.**

### Catálogo não é disco: é SUPERFÍCIE DE CURADORIA

Este é o argumento de verdade, e ele não tem nada a ver com os 500 MB da Neon.

Tudo que fica no acervo entra no "o que falta", na fila de correção e na moderação. Uma
fila cheia de *"Manual de Direito Processual Penal, sem capa"* **ensina o contribuidor a
não acreditar na fila**. O custo do entulho não é o byte: é a confiança de quem trabalha
de graça.

### É LISTA DE EXCLUSÃO, NUNCA LISTA DE INCLUSÃO

Corta-se **só** o que está explicitamente na lista de corte. **Tudo o que não está lá
fica, por padrão.**

Tratar a lista de "fica" como allow-list apagaria Martin Claret, Antofágica, Aleph,
Alfaguara, HarperCollins, Intrínseca, Galera, Arqueiro, Suma, DarkSide, Sextante,
Planeta, Verus, Seguinte, Gutenberg, Todavia, Fósforo, Ubu — **justamente as editoras
que o público do Gume lê.** Elas quase não existem no acervo hoje (Antofágica: 10 obras)
não porque devam sair, mas porque o dump da Open Library é **velho**.

**Elas são o buraco a preencher, não a poda a executar.**

**Na dúvida sobre qualquer editora: ela FICA.** Apagar é irreversível na prática; deixar
uma editora a mais no acervo não custa nada.

### As duas travas, e elas valem sobre tudo

1. **O cânone é salvo-conduto.** Obra de autor dos 367 fica, seja qual for a editora. A
   UNESP publica Nietzsche; a Edusp publica Marx. Cortar editora universitária no atacado
   mataria os dois.
2. **Nada que esteja na estante, leitura, cópia, nota, resenha ou recomendação de
   qualquer pessoa sai. Nunca.** Provado por consulta, e o script aborta se não der zero.

### O que a categoria NÃO decide

**Vozes** é "religiosa/universitária" e publica **Hegel, Kant e Nietzsche** — é a editora
de filosofia do Brasil. **Paz e Terra** e **Cortez** são a casa do **Paulo Freire**.
**Loyola** publica Ricoeur. **Ática** é didática *e* é a Série Vaga-Lume, que metade do
Brasil leu na infância.

Um corte automático por categoria mataria as quatro. **Categoria é pista, não veredito.**

### Duas armadilhas que a conferência pegou, e que teriam sido caras

**O padrão `ltr` pegava "CULTRIX".** C-u-**l-t-r**-i-x. A Cultrix publica Jung, Tao,
poesia e filosofia. E pegava "U**ltr**amar" também. Sem conferir *quais editoras cada
regra casa* antes de apagar, a Cultrix inteira teria ido embora por um acidente de
substring.

**"Imprensa Nacional" são duas editoras.** A do Brasil é o Diário Oficial. A
**Imprensa Nacional-Casa da Moeda** (Portugal) é uma editora literária de verdade. As
duas foram cortadas por decisão explícita — mas a diferença precisava estar na mesa.

### Depois disto, tudo é AQUISIÇÃO, não poda

O acervo tem **~1.650 obras** de todas as editoras que o público do Gume lê, somadas. A
**Revista dos Tribunais sozinha tinha 1.548**.

> **A poda é economia; o buraco é o produto.**

1. **Google Books no fallback da busca** — é o que fecha o buraco.
2. **Seed das editoras do BookTok** (Intrínseca, Galera, Arqueiro, Suma, DarkSide,
   Sextante, Planeta, Verus, Seguinte, Gutenberg, HarperCollins BR, Antofágica, Todavia,
   Fósforo, Ubu).
3. **AniList** — o mangá deu ZERO.

---

## A coleção mostra a LACUNA, não celebra o fechamento

**13 de julho de 2026.** Mangá, e o que ele obrigou a decidir.

### Cada volume é um LIVRO. Padrão, sem exceção.

Nota, resenha, estante e leitura moram no **volume**, como em qualquer livro. **Não
existe "nota da série", e não vai existir.**

Foram consideradas três formas (a nota no volume, a nota na série, a série como obra com
os volumes de "edições"). A segunda obrigaria `ratings` e `reviews` a apontarem para dois
tipos de coisa; a terceira mentiria sobre o que é uma edição — o volume 12 de Berserk não
é "outra impressão" do volume 1, é outro livro, e isso quebraria `owned_copies` e a
linhagem da cópia.

**Simplicidade ganha.** A série não é uma obra nem uma edição: é uma **vista**.

### A série é uma COLEÇÃO: uma prateleira, não um objeto que se avalia

Todos os volumes que **existem**, em ordem. Os que você **tem**, em cor, com a capa. Os
que **faltam**, em cinza — um vazio na prateleira. Um alternador **TENHO / LI**, porque
ter e ler são coisas diferentes, e o Gume é o único app que já sabe disso.

É a resposta para a pergunta que todo leitor de mangá faz: **qual volume falta comprar.**

### ⚠️ A linha que não se cruza

O cinza do LoL e a platina do PS5 são mecânicas de **completismo**: existem para dar
coceira. **Aqui o cinza existe para MOSTRAR A LACUNA, e nada mais.**

**PODE:** o volume que falta aparecer em cinza. É um fato sobre a sua estante, igual a
olhar a prateleira de casa e ver o buraco.

**NÃO PODE — e feche o PR se alguém propuser:**

- barra de progresso da série · porcentagem ("87% da coleção")
- "faltam 3 para completar" · contagem regressiva
- notificação ("você está perto de terminar Berserk!")
- confete · troféu · medalha · selo · badge no perfil
- "Coleção completa!" · celebração de fechamento
- comparação com outra pessoa · ranking de quem terminou mais séries

**Tudo isso é ALVO.** Alvo faz alguém terminar uma série de que já não está gostando só
para fechar — e é exatamente o que este app existe para não fazer.

Por isso o schema **não tem** coluna de progresso, de percentual nem de "completa".
Progresso se **computa** (volumes lidos ÷ volumes que existem), nunca se guarda: uma
coluna guardada é uma coluna que alguém vai querer ordenar, comparar e pôr num ranking.

### A memória, e a regra dura que a permite

> **Comemore o que ACONTECEU. Nunca acene com o que PODERIA acontecer.**

Quando o **último** volume é marcado como lido, a página da coleção ganha **uma linha**:

> *Você leu Berserk inteiro. Do volume 1, em março de 2022, ao volume 41, em julho de
> 2026. Quatro anos.*

Tipografia de **memória**: serifada, quieta, no corpo da página. Não é um selo, não é um
banner, não é um card colorido.

Isso só é possível porque **as datas de leitura foram consertadas hoje** (ver a entrada
sobre `lib/datas.ts`). É uma frase sobre a **vida da pessoa**, e não um placar — e nenhum
outro app de leitura consegue dizer isso, porque nenhum guarda a data de verdade.

> **Antes: nada. Depois: uma frase. O Gume não te dá uma meta; ele te devolve uma
> memória.**

### A parede de capas continua colapsando

**Um tile por série**, a partir de **dois** volumes, e ele abre na coleção. Quarenta e uma
lombadas quase idênticas de Berserk em fila destroem a tela que carrega o produto inteiro.

Com **um** volume só, não colapsa: é um livro.

### E conte separado

**"12 livros, 30 volumes, 4 séries."** Ler trinta volumes de Vagabond não é ler trinta
livros, e uma estatística que finge o contrário é uma estatística em que ninguém confia —
a começar pelo próprio dono.

---

## O volume brasileiro: a condição 4 do PRD foi acionada, e ela foi PROVADA

**13 de julho de 2026.**

O mangá entrou no acervo (417 séries, 2.797 volumes, via AniList). Mas **as séries em
publicação entraram com UM volume** — porque a AniList devolve `volumes: null` para elas.

E as séries em publicação **são as que as pessoas leem**: One Piece, Jujutsu Kaisen,
Chainsaw Man, Dandadan, Blue Lock. **Berserk com um volume significa que o dono do app
não consegue registrar o Berserk** — que é o motivo de tudo isto existir.

### Não inventar o total está certo. Não IR BUSCAR o total, não.

A `Política de catálogo` do ai/PRD.md manda tentar as fontes **nesta ordem**, e o
scraping de metadado factual **só quando as três primeiras falharem**. Elas falharam, e
está medido:

| fonte | resultado |
|---|---|
| **dump da Open Library** | não tem mangá. Zero. |
| **AniList** (API oficial) | sabe a série, **não sabe o volume brasileiro** |
| **Google Books** | **0 ISBN brasileiro** em 80 resultados de Berserk e 100 de Chainsaw Man. Onde tem, tem migalha: **9 volumes de One Piece de ~110** |
| **CBL** (agência nacional de ISBN) | `isbn.cbl.org.br` **não resolve DNS**. O portal é PowerApps autenticado, sem API pública de consulta |
| **Biblioteca Nacional** | **HTTP 403**. Cloudflare bloqueia robô, inclusive no SRU |

Um 403 é o site dizendo **não**. Contornar seria pior que raspar: seria raspar sabendo
que pediram para não.

### O que sobrou, e por que é legítimo

A Panini e a JBC. E **não é uma exceção ao PRD — é o item 4 dele**, funcionando como foi
desenhado.

> **O Gume não raspa para GUARDAR. Raspa para DEVOLVER.**

Título, volume, ISBN e data são **fato público**: o ISBN foi atribuído pela CBL, que é o
registro nacional. A Panini não é dona dele — ela é só o **único lugar onde ele está
visível**, e isso é uma falha da infraestrutura do livro no Brasil, não um direito dela.

Esses fatos entram no **dataset CC0** que o Gume já promete publicar, e que a própria
Panini pode usar de volta. **Um projeto que acrescenta fato público a um bem comum aberto
não é hipócrita. Hipócrita seria raspar e fechar.**

### O limite, fechado a chave

**PODE:** título · número de volume · ISBN · data · **URL** da capa (referência, nunca
cópia do arquivo).

**NUNCA:** sinopse · texto de orelha · resenha · **preço** · dado de usuário · imagem
baixada.

**A sinopse ficou de fora mesmo tendo sido autorizada**, e a razão é o item 3 do próprio
PRD: ela **não é fato, é obra** — texto autoral, com direito. E o Gume promete um dataset
**CC0**: pôr texto protegido de terceiro num dataset CC0 é relicenciar o que não é meu, e
é exatamente a hipocrisia que esta política existe para evitar.

Se o livro precisa de um texto na tela, ele tem o que os **leitores** escreverem — que é
o produto do Gume, e não o da Panini.

**COMO:**

- só pelo **sitemap**, respeitando o `robots.txt`
- **uma requisição por segundo**, no máximo. Ninguém está com pressa.
- **User-Agent identificado, com contato:**
  `Gume/1.0 (registro de leitura aberto; gume.club; contato@gume.club)`
  Um raspador que diz quem é e onde mora **não está se escondendo**. Se a Panini não
  quiser, ela escreve e a gente para.
- **link de volta** para a loja deles na página do livro. O Gume é canal, não parasita.

`lib/lojas.test.ts` **quebra o build** se alguém guardar sinopse, preço ou baixar imagem.

### E o cabeçalho do lib/catalog.ts estava mentindo

Ele dizia *"We do not scrape anybody"* — uma frase que **nunca foi a regra**, e que passou
a contradizer o PRD sem ninguém notar.

Uma frase que sobrevive à decisão que ela descrevia não é um descuido: **é uma mentira
educada, e ela mina tudo o que o arquivo diz depois.** Foi corrigida.

---

## A sinopse e o rosto do autor: de onde vêm, e o que a licença muda

**A dor:** a página de um livro mostrava título, autor e capa, e mais nada. Quem não
conhecia a obra não tinha como decidir se queria lê-la. E os 126.695 autores do acervo
tinham **zero fotos e zero biografias** — as colunas existiam desde a migration 0025 e
nunca haviam sido preenchidas.

**A tentação** era raspar a sinopse da loja da Panini, que já estava autorizada a raspar.
Foi recusada, pela mesma razão de sempre: sinopse **não é fato, é obra**.

**As três fontes, e por que cada uma:**

- **Open Library** (dump, já no disco): 6.749 sinopses. **CC0.**
- **Wikidata** (API, sem cota, sem chave): foto, descrição em português e — o que
  ninguém mais tinha — a **nacionalidade**, nula em 100% das linhas. **CC0.**
- **Wikipédia em português**: a sinopse dos autores brasileiros. **CC-BY-SA.**

### O viés que obrigou a terceira fonte

A Open Library é um acervo anglófono, e a cobertura dela mostra isso na cara:

    Jane Austen          7 de 9 obras com sinopse
    Fiódor Dostoiévski   7 de 11
    Jorge Amado          0 de 25
    Graciliano Ramos     0 de 8
    Machado de Assis     12 de 212

Um acervo brasileiro em que Jorge Amado não tem uma linha e Jane Austen tem sete não é
um acervo: é a tradução malfeita de outro.

### DECISÃO: CC-BY-SA aparece na TELA e fica FORA do dataset

A Wikipédia exige atribuição e obriga quem reusar a manter a mesma licença. Então:

- na tela ela aparece, **com crédito** — é o que a licença exige;
- no dataset CC0 ela **não entra**. Republicar CC-BY-SA como CC0 seria relicenciar o
  trabalho de outra pessoa.

Isso é uma **coluna** (`description_source`), e não uma boa intenção num arquivo de
texto: `lib/licenca.ts` decide, e `lib/licenca.test.ts` **quebra a build** se alguém
apontar a Wikipédia para dentro do dataset ou abrir uma fonte sem decidir a licença. O
teste também confere que o enum do banco e a lista do código não divergiram.

Fonte desconhecida **fica de fora**, por padrão. Publicar por engano é irreversível;
deixar um buraco é só um buraco.

### Casar pelo AUTOR, nunca pelo título

Buscar "Capitães da Areia" no Wikidata devolve cinco coisas: o livro, **o filme**, a
minissérie e a página de desambiguação. Casar pelo título gravaria a sinopse do filme na
página do livro.

O que escolhe é a propriedade P50 (autor), que tem que bater com o QID do autor que já
está no nosso banco. **Sem QID de autor, a obra é pulada** — a gente não adivinha.

Perguntar **por autor** em vez de por livro subiu o acerto de 10% para 24%, porque uma
consulta devolve a bibliografia inteira dele, com todos os nomes de cada obra — e é
assim que "Livro do desassossêgo: páginas escolhidas" acha "Livro do Desassossego".

### A foto é por referência, e ela tem dono

O retrato de um autor é obra de um fotógrafo. O Gume guarda o **endereço** e mostra da
origem: mostrar não é republicar, baixar o arquivo seria. E o crédito embaixo não é
gentileza — a foto do Wikimedia Commons quase nunca é CC0, e a licença exige atribuição.

### O markdown é limpo na TELA, e não no banco

A sinopse da Open Library vem em markdown (264 obras com asterisco, 86 com link, 39 com
HTML). O banco guarda **o que a fonte publicou** — um dataset é uma cópia fiel, e o
markdown é o formato original do texto lá. Reescrevê-lo no banco seria publicar a nossa
versão dele e chamar de fonte.

Quem limpa é a tela: `lib/texto.ts`, com teste. E a saída é **texto**, nunca
`dangerouslySetInnerHTML` — dado que entrou por um dump de terceiro não vira marcação
executável.

---

## O acervo não tinha livros em inglês. Tinha fichas de catálogo.

**O pedido:** "exclua livros em inglês da nossa base (menos os Berserk Deluxe). A galera
ler livro em inglês é exceção, e não regra."

**A medição disse outra coisa:** 302.453 das 302.508 edições **já estavam marcadas como
portuguesas**. O import filtrou por idioma da edição lá atrás. Livro em inglês, a base
não tem.

O que existia eram **1.146 obras com o TÍTULO em inglês**, e elas não eram livros:

    Portuguese and Brazilian books in the John Carter Brown Library
    Password: K dictionaries: English dictionary for speakers of Portuguese
    Political and administrative statute of the province of Macau
    Proceedings of the Ninth Congress of the Union européenne

Ficha de catálogo acadêmico. Não é uma poda de tamanho — são 0,4% do acervo, e o ganho
em disco é zero. É uma poda de **qualidade**: essas fichas apareciam na busca e
empurravam o livro certo para baixo.

### O detector se recusa a chutar, e isso salvou o acervo duas vezes

`lib/idioma.ts` responde `pt`, `en` ou **`null`**. E `null` nunca vira `en`.

**34.875 obras caíram em "não sei"**, e nenhuma foi tocada: é onde estão **Berserk**,
Frankenstein, Iracema, **Ubirajara**, Hamlet — títulos sem uma palavra-esqueleto de
língua nenhuma. Um detector que chutasse teria apagado José de Alencar.

E a rede de segurança pegou **87 volumes de coleção** com título em inglês. Sem ela,
seriam 87 buracos falsos nas prateleiras de mangá: a tela passaria a dizer "falta o
volume 14" sobre um volume que existe e que a pessoa até tem. **Uma poda que faz a tela
mentir é pior do que não podar.**

### A ordem das quatro regras é o detector inteiro

O acervo tem centenas de catálogos de museu com o título nas duas línguas — "O burro e o
boi no presépio = The ass and the ox in the Nativity scene". Esse título tem MAIS
palavras inglesas do que portuguesas, e é um livro brasileiro. Contar palavras, sozinho,
o apagaria. O que o salva é o **acento**, que não existe em inglês.

Mas o acento não pode vir primeiro: um artigo acadêmico em inglês escreve "São Paulo" no
título. Então: inglês decisivo → acento → inglês sem português nenhum → português.

---

## A sinopse em inglês não vai para a tela

**DECISÃO DO DONO:** fonte em português primeiro. Nada de tradução automática — ela
encostaria na promessa pública de "nada de IA generativa", e poria texto escrito por uma
máquina num dataset que promete ser CC0.

**O custo, medido depois:** **dois terços das sinopses da Open Library estão em inglês**
(4.294 de 6.659). Elas continuam no banco e no dataset — são dado válido — mas não vão
para a tela. Sobraram 2.228.

Isso promoveu a **Wikipédia em português** de complemento a **fonte principal**.

Um livro sem sinopse é honesto. Uma sinopse que a pessoa não entende ocupa o lugar onde a
sinopse certa apareceria, e faz o livro parecer estrangeiro.

---

## A busca lia metade da frase

**"memorias postumas bras cubas antofagica" não trazia a edição da Antofágica.** Trazia
um estudo crítico, e depois duas fichas sem autor.

Uma pessoa lê aquela frase como DUAS coisas: o livro, e a editora. A busca lia uma só.
"antofagica" entrava na comparação do TÍTULO e derrubava a nota do livro certo.

Agora a editora é reconhecida (índice de trigrama, migration 0040), **tirada da busca do
título**, e usada para escolher qual edição aparece. O limiar é alto (0.8): tirar da
busca uma palavra que a pessoa quis dizer é pior do que não ter reconhecido editora
nenhuma.

### E o conserto expôs um bug pior

**"dom casmurro" devolvia "Ciumento de carteirinha: uma aventura com Dom Casmurro".**

Não era erro de nota. O título do livro SOBRE o livro **contém** "Dom Casmurro" inteiro,
então marca 1.00 — empatado com o original. E o desempate caía na capa.

Todo clássico brasileiro tem uma prateleira de estudos críticos com o nome dele no
título, e essa prateleira estava enterrando o original. **SER o que a pessoa digitou é
mais forte do que CONTER**, e isso vem antes da nota.

`lib/busca.sql.test.ts` prende os três casos, contra o acervo cheio.

---

## Quatro "Esaú e Jacó" são um livro só

A página do Machado dizia **212 obras**. Ele escreveu umas trinta.

    Esaú e Jacó   ·   Esau e Jacó   ·   Esaú e Jaco   ·   Esaú e Jacó

3.096 grupos, 3.213 fichas fundidas. Machado foi de 212 para 190 — o resto são antologias
e obras completas de verdade, e forçar fusão por semelhança é onde se apaga livro.

### O título INTEIRO, e nunca o título "esperto"

Cortar no subtítulo parece mais inteligente e apagaria metade da obra do Machado: "Obras
completas: volume 3" e "volume 5" virariam a mesma chave. **O que parece esperto numa
amostra de dez é o que estraga o acervo de trezentos mil.**

### Uma ficha que é de alguém não se funde

Nove tabelas apontam para `works`, **todas com ON DELETE CASCADE**. Apagar uma ficha
duplicada apagaria junto a nota, a resenha e a estante de quem a tivesse.

E repontar não resolve: as tabelas de usuário são únicas por (pessoa, obra). Se alguém
resenhou as duas fichas, uma das resenhas teria que morrer — e **o Gume não escolhe qual
resenha de alguém morre para arrumar o próprio catálogo.**

Catálogo torto é feio. Resenha apagada não volta.

---

## A página do livro parecia um sistema de biblioteca

**A dor:** "dentro do livro está vertical demais, tem muuuita opção descendo. Tá
parecendo um sistema de biblioteca, e a gente tem que deixar a UX o mais amigável
possível pras pessoas irem preenchendo sem nem sentir."

Eram **doze cartões empilhados**: prateleira, nota, de onde veio, resenha, suas
leituras, recomendações, autor, sua cópia, quem tem cópia, linhagem, correções, edições
e ferramentas. Cada um é útil. Juntos, são um formulário de cadastro — e ninguém entra
num app de leitura com vontade de preencher um cadastro.

**A GAVETA** (`components/gaveta.tsx`). Fica aberto o que a pessoa faz TODA VEZ:
prateleira, nota, resenha, e quem escreveu. O que ela faz uma vez na vida — a linhagem
da cópia, o registro de correções, a lista das quarenta edições — abre com um toque.

**A gaveta DIZ o que tem dentro antes de abrir.** Sem o resumo, ela obriga a pessoa a
abrir para descobrir se valia a pena abrir — e abrir para descobrir é fazer ela pagar
para ver. "3 edições desta obra", "um leitor que você segue tem uma cópia".

E não é aba: aba é navegação, e navegação obriga a escolher antes de ver.

---

## "Quando você leu?" pergunta na hora de marcar, e só em lido/abandonado

A data era um campo perdido no fim da página, e o app carimbava HOJE toda vez.

Agora "lido" e "abandonado" abrem o campo, já com a data de hoje: quem aceita hoje não
paga nada, quem terminou em março de 2019 troca e o Gume acredita.

**"Lendo" não pergunta**, e a razão é uma recusa de produto: o Gume **não calcula quanto
tempo você levou** para terminar um livro. Não existe "você leu isso em 12 dias", e não
vai existir — isso é velocidade, e velocidade vira ranking de velocidade. Então a data
em que você começou não muda nada, e perguntar por ela seria cobrar um pedágio à toa.

(O servidor já aceitava a data desde o conserto do bug de fuso. Estava pronto, e a tela
nunca perguntava.)

---

## A praça: um feed público, e a frase que ela obrigou a apagar

**A dor:** "no explorar, pode ter um feed de todas as atividades do app, assim as pessoas
conhecem pessoas novas."

O `components/explore.tsx` dizia, escrito: *"não é um feed geral de 'todo mundo terminou
tal livro': isso é ruído de estranho, e é onde nasce a vontade de performar."*

A frase foi **apagada**, e não deixada de pé mentindo. Uma frase que sobrevive à decisão
que ela descrevia é uma mentira educada.

Mas o medo continua certo, e a praça nasce com trava:

- **cronológica.** Sem "em alta", sem popularidade, sem sugerido para você.
- **sem contador.** Não existe "12 pessoas leram isso" — número na frente de gente é
  placar, e placar é o que faz alguém performar.
- **só o que é público**, e nunca "quem me segue": mostrar isso a estranhos seria
  transformar a escolha de privacidade de alguém numa pegadinha.
- **só de quem você ainda não segue.** A mesma linha em duas telas não é descoberta.
- **e ela fica por último.** As seções de cima dizem quem VALE A PENA seguir; a praça diz
  o que está acontecendo.

O motivo de existir é concreto: quem chega não segue ninguém, e o feed de amigos era um
vazio educado dizendo "siga alguém" — como, e a partir de onde?

---


## O accent: a lâmina (#7DD3C0)

**DECISÃO DO DONO**, entre três direções desenhadas: a brasa (o terracota que já
estava no código), a lâmina (verde-água) e a tinta (violeta).

Ela sai do **nome do produto**, e não de uma tendência. Gume é fio de faca; verde-água é
aço. E é a que **menos briga com a capa** — que é exatamente o que a regra antiga estava
protegendo.

### A regra que caiu

O `docs/design.md` dizia: *"Preto e branco, sempre: a única cor deste produto é arte de
capa."*

Ela foi **apagada**, e não deixada de pé mentindo. Mas o que ela protegia continua de
pé, e virou a regra nova: **nenhum livro tem capa verde-água.** O olho aprende, em um
dia, que essa cor quer dizer "o app está falando com você" — e a parede de capas continua
sendo só capa. Nada colorido é desenhado por cima de uma.

### O acidente que a troca revelou: o accent era TAMBÉM a cor de perigo

Uma cor, dois trabalhos, e ninguém tinha notado — porque funcionava por acidente: o
accent antigo era vermelho-tijolo, e vermelho passa por perigo.

Trocar o hex, e só isso, teria produzido:

    "apagar a estante? os livros ficam."   →  em VERDE-MENTA
    "tirar 12 livros da estante?"          →  idem
    "banir"                                →  idem

Verde diz "pode ir, está tudo bem". **Um botão que se lê ao contrário do que faz é o
pior botão que existe.**

Foram sete gatilhos destrutivos e dez mensagens de erro usando a cor da marca. Agora são
três tokens:

- `--color-accent` — a **marca**: link, selecionado, foco, moldura.
- `--color-perigo` — a **semântica**: deu errado, ou não tem volta.
- `--color-on-accent` — o que se escreve **em cima** do accent. Ele é claro, e
  `bg-accent text-white` era legível com o vermelho e é **ilegível** com a lâmina.

`lib/cor.test.ts` quebra a build se um botão de apagar usar a cor da marca, ou se alguém
escrever em branco por cima do accent.

### E a insígnia que virou a cor da marca

A insígnia de **zelador** era verde-água (matiz 175°). O accent novo é 167°. **Oito
graus** — são a mesma cor.

E aí a cor para de dizer qualquer coisa: o accent quer dizer "o app está falando com
você", e a insígnia quer dizer "esta pessoa cuida do acervo". O olho não aprende duas
coisas com a mesma cor; ele desiste das duas.

Ela virou **rosa-carmim (340°)** — o único vão grande que sobrava, a 40° do violeta e 45°
do terracota. E `lib/badges.test.ts` agora mede a distância de cada insígnia até o
accent, e não só entre elas.

### O que NÃO veio junto

A moldura de apoiador está **desenhada e não construída** — é outra decisão, e ela
depende de existir um jeito de alguém apoiar. Quando existir, a regra é dura: **ela marca
quem paga, e nunca quem lê mais.** No dia em que houver moldura por "cem livros lidos", o
Gume virou um jogo de ler.

---

## O Gume vai ter ELO. E as políticas que isso contradiz foram reescritas, não escondidas.

**DECISÃO DO DONO:** *"eu vou gamificar o app… vamos ter que mudar nossas políticas,
mas é em nome da diversão entre amigos."*

É legítima, e é dele. O Gume deixa de ser um app que se recusa a contar e passa a ser um
lugar onde um grupo de amigos que joga, programa e lê fantasia vê a própria vida de
leitor virar uma escada.

**Ferro → Bronze → Prata → Ouro → Platina → Esmeralda → Diamante → Mestre → Grão-Mestre →
Desafiante.** Mil livros no topo.

### DUAS escadas, e essa é a decisão que segura tudo

"Cada volume é um livro" já era regra, e está certa. Só que ela colide com o elo:

    Bleach ........ 74 volumes  =  74 livros
    Naruto ........ 72 volumes  =  72 livros
    Guerra e Paz .............  =   1 livro

Numa escada só, quem lê mangá chega a Diamante enquanto quem lê Dostoiévski fica no
Ferro. **Não é filosofia: é aritmética.**

Então são duas — literatura e quadrinhos — e ninguém compara uma com a outra, do mesmo
jeito que ninguém compara solo com flex. A forma da obra virou COLUNA (`works.forma`,
migration 0041), e não um join de três tabelas: fato sobre uma obra mora na linha dela.

### As quatro recusas, e agora elas têm teste

`lib/honras.regras.test.ts`. Elas são a diferença entre **uma escada** e **uma esteira**:

1. **O elo não olha para o relógio.** Sem ofensiva, sem meta do ano, sem temporada, e
   **ele nunca cai**. Um app que faz o número descer quando você para de ler pune quem
   está de luto, doente ou com um filho recém-nascido — e faz a pessoa abrir um livro
   fino de que não gosta só para não perder o que já era dela. Vida não tem temporada.

2. **Não existe placar.** O elo mora no perfil e na moldura. Nenhuma lista ordena gente
   por quanto leu — isso é uma máquina de fazer gente mentir que leu.

3. **A nota não vale elo.** Ler e odiar conta igual a ler e adorar. Se "adorei" valesse
   mais, o app estaria comprando elogio, e a resenha honesta morreria no dia seguinte.

4. **Abandonar não pune.** Se abandonar custasse elo, ninguém mais largaria um livro
   ruim — e terminar um livro de que você já não gosta é a coisa mais triste que um app
   de leitura pode fazer alguém fazer.

### O que a virada obrigou a consertar, e não era o elo

**A home tinha um placar, e ninguém tinha visto.** Ela mostrava três estantes públicas
`order by n desc` — as três pessoas com MAIS livros públicos, na primeira página do site.
Sem rótulo de ranking, sem número na tela, e um placar do mesmo jeito. Com elo, vira o
pior tipo de incentivo: dá para chegar na home inflando a estante. Agora são três
estantes **ao acaso**.

**A home e o /sobre prometiam "sem nota média, sem placar, sem competição".** Virou
mentira no minuto em que o elo entrou. A frase foi trocada pela verdade — que continua
sendo uma recusa forte: *"existe um elo, e não existe lista dos maiores."*

**O `docs/design.md` mentia sobre um teste.** Ele dizia que barra de progresso em leitura
era "proibida, para sempre, **e há teste**". Não havia: o teste que ele citava olhava um
arquivo só (`app/insignias/page.tsx`). Eu pus uma barra de leitura no perfil de todo mundo
e **a suíte inteira passou verde**. Um documento que promete uma trava que não existe é
pior do que um que não promete nada — ele faz todo mundo parar de olhar.

### E o bug que só apareceu porque o elo precisou contar

**Nenhum volume de mangá podia ser lido.** Os 2.797 volumes do acervo tinham **zero
edições** — e a estante guarda a EDIÇÃO, não a obra. A tela de coleção existia, a
prateleira desenhava os 41 volumes de Berserk, o botão de adicionar volume funcionava, e
**a coleção inteira era decorativa**.

Passou porque o AniList sabe a série e não sabe quem publica no Brasil; a edição ficou
para a raspagem da Panini, que ficou parada. O buraco só apareceu quando o elo perguntou
"quantos volumes essa pessoa leu" e a resposta foi **zero, para todo mundo, para sempre**.

Migration 0043 cria uma edição por volume — com a editora da coleção quando ela existe, e
**sem ISBN inventado**. Campo vazio é um buraco; campo errado é uma mentira, e um ISBN
falso contamina toda importação daqui para a frente.

### A moldura

Um **anel**, e não um brasão. A referência do LoL é o anel; a gema, o louro e a asa ficam
para trás — uma moldura barroca de 300 px encolhida para 40 px vira uma bolota dourada, e
o Gume mostra cara de gente em lista, em feed e em busca.

Quem apoia tem duas (a do elo e a verde-água de apoiador) e **escolhe**. A de apoiador não
é "melhor" que Desafiante: ela é outra coisa. Não diz quanto você leu — diz que você paga
a conta do servidor.

E `users.moldura` só aceita `null` ou `'apoiador'`. Nunca um elo: **o que é conquistado
não se digita.**

---

## Os elos deixam de ser um decalque do League of Legends

> **SUPERADA** por "'Elo' vira HONRA" (o renome) e pelos limiares revistos depois. Mantida pela metáfora que ficou de pé: o topo da escada é o fio, e você não desafia ninguém, você vira o fio.

**"Desafiante" desafia quem?** Os três últimos elos eram Mestre, Grão-Mestre e
Desafiante: LoL copiado palavra por palavra, e sem dizer **nada** sobre ler.

Os sete primeiros ficam (metal e pedra são universais, ninguém é dono deles, e o público
reconhece de graça). Os três últimos passam a ser o **fio ficando mais fino**, que é a
única metáfora que este app tem, e ela já estava no README: *"livro é pedra de amolar"*.

    Lâmina  →  Navalha  →  GUME

O topo da escada é o nome do produto. **Você não desafia ninguém: você vira o fio.**

| elo | literatura | quadrinhos |
|---|---|---|
| Ferro | 0 | 0 |
| Bronze | 5 | 12 |
| Prata | 15 | 40 |
| Ouro | 30 | 75 |
| Platina | 60 | 150 |
| Esmeralda | 100 | 250 |
| Diamante | 175 | 440 |
| Lâmina | 300 | 750 |
| Navalha | 550 | 1.375 |
| Gume | 1.000 | 2.500 |

`lib/honras.test.ts` quebra a build se "Mestre", "Grão-Mestre" ou "Desafiante" voltarem.

---

## O degrau pega carona no livro, e não vira uma linha de feed

O caminho óbvio era uma atividade nova: *"o Rui subiu para Prata."*

E ela seria uma **linha vazia**: não diz o que ele leu, não dá em que clicar, e no dia
em que três amigos subirem de elo o feed vira um mural de parabéns.

Então o elo é uma **coluna da atividade que já existe** (migration 0044), e não um verbo:

    "o Rui terminou Dom Casmurro · virou Prata"

Uma linha só, e o livro que o levou até lá fica com o crédito.

**E ele é gravado no instante em que acontece.** Se o feed recalculasse o elo na hora de
desenhar, mostraria o elo de HOJE ao lado de um livro de março, e diria que Dom Casmurro
te fez Diamante. Um fato sobre um instante se grava naquele instante.

**O "antes" é uma subtração, e não uma segunda consulta.** Duas consultas teriam um
buraco no meio: duas abas marcando dois livros ao mesmo tempo leriam o mesmo "antes", e
as duas anunciariam a subida. Aqui o antes é o depois **menos este livro**.

---

## A moldura no feed sim, a barra não

A moldura aparece no feed, na praça e no explorar — porque ela é a **identidade** da
pessoa. Se ela só existisse no perfil, ninguém veria a de ninguém, e ela seria um enfeite
que a pessoa põe para si mesma.

A **barra** não vai junto. *"Faltam 3 livros para o Rui virar Prata"* num feed é um app
cutucando você a cutucar o Rui. Isso é ansiedade embalada como comunidade.

Uma consulta para o feed inteiro (`getCoroasDe`), e não uma por linha.

---

## "Mais premium" não pode significar "mais hierarquia"

**"Os badges não estão tão premium quanto o acabamento das molduras."** Estava certo.

E a saída **não** podia ser dar mais brilho a uma que a outra: ouro contra prata é pódio,
todo mundo lê pódio, e no instante em que uma placa parecer mais rica que a outra, a
pessoa passa a querer aquela e o sistema inteiro cai.

Então o piso sobe para as nove **ao mesmo tempo**, e as três coisas são de MATERIAL:

- o **bisel** (uma luz fina em cima, uma sombra fina embaixo) — três pixels de sombra que
  separam um retângulo pintado de uma peça com espessura;
- o **verniz** (degradê do mesmo matiz, de 13% a 4%) — cor chapada é adesivo, cor com
  queda é objeto;
- o **glow** um pouco maior e mais fundo (12→16px, 0.22→0.26).

A luz do bisel é **branca**, e não colorida: se ela puxasse o matiz da insígnia, a placa
mais clara pareceria mais iluminada, e o matiz teria virado hierarquia pela porta dos
fundos.

### E o teste que isso obrigou a consertar

`lib/badges.test.ts` proibia a palavra **"gradient"**. Ele existia para barrar glow
holográfico e arco-íris, e barrava junto um degradê do mesmo matiz, igual nas nove.

**Um teste que proíbe a ferramenta em vez do estrago** obriga a próxima pessoa a fazer a
coisa certa por um caminho pior, ou a apagar o teste. Agora ele proíbe o que importa:
degradê **bicolor**, cônico, radial, animado, ou um segundo degradê no arquivo.

---


## "Elo" vira HONRA, e o topo passa a ser alcançável

**Elo é League of Legends.** Honra é uma palavra portuguesa, e diz o que a coisa é: um
reconhecimento pelo que você leu na vida, e não uma posição numa fila.

### Dois vocabulários, e não dois números

Antes as duas escadas tinham os MESMOS nomes: "Ouro" na literatura eram 30 livros e
"Ouro" nos quadrinhos eram 75 volumes. Lado a lado no perfil, isso é **duas palavras
iguais com dois números diferentes**, e ninguém sabe qual é qual.

    LITERATURA   Ferro · Bronze · Prata · Ouro · Platina · Esmeralda · Diamante · Lâmina · Navalha · GUME
    QUADRINHOS   Aprendiz · Discípulo · Ronin · Samurai · Kenshi · Sensei · Shogun · Oni · Tengu · KATANA

A de livro é metal e pedra, e termina no fio. A de quadrinho é o dojô, e termina na
lâmina inteira. **As duas terminam numa lâmina, e é de propósito: é o mesmo app.**

Um teste quebra a build se um nome aparecer nas duas escadas.

### O topo tem que ser alcançável, e depois dele a escada não acaba

Mil livros é um número que quase ninguém alcança numa vida. **Uma escada cujo último
degrau é inatingível não é uma escada: é um pôster.**

O topo são **500 livros** (doze por ano, por quarenta anos). E depois dele vem o
**Paragon**: uma estrela a cada 25 livros, para sempre. **Gume +1, Gume +2.**

E no topo a barra passa a medir a distância até a próxima estrela. Uma barra cheia e
parada para sempre é uma barra que zomba de quem chegou.

---

## Doar, trocar e emprestar saem do Gume

**"Tire a função de doar, trocar e emprestar do app, acho que tá demais."** Está certo.

Aquilo empurrava o Gume para ser um lugar de **transação entre pessoas** — com contato
pessoal, combinado, encontro, e tudo o que vem junto quando estranhos precisam se acertar
sobre um objeto. Isso traz um peso de moderação e de responsabilidade que nada no app
estava pronto para carregar, e **traz esse peso mesmo quando dá certo**.

Saem (migration 0046): `available_for`, `came_from`, a linhagem do exemplar, e o **canal
de contato** (`contact_kind`, `contact_value`). Este último existia SÓ para isto — e um
campo de contato guardado sem motivo não protege ninguém: é um telefone e um Instagram
parados num banco, esperando um vazamento. **Guardar dado pessoal que não serve para
nada é o oposto de cuidado.**

### O que fica

`owned_copies.acquired_note`: *"tenho este livro em papel, ganhei da minha irmã em 2019"*.
Isso não é um anúncio, é a **história de um exemplar**, e nunca dependeu de o livro estar
à disposição de ninguém.

### E a insígnia que morreu junto

**Semeador.** Ela era dada a quem passava um exemplar adiante, e era linda: quem dava a
insígnia não era quem doou, era a estante de quem RECEBEU, dizendo de onde o livro veio.
Ninguém se declarava semeador.

Ninguém mais recebe um livro de ninguém, então ninguém mais pode ser semeador. **Uma
insígnia que não tem mais como ser conquistada não fica de enfeite no catálogo:** ela sai,
ou vira uma promessa que o app não cumpre. São sete.

**E a remoção quase criou uma hierarquia por acidente:** com o semeador fora, o
IDEALIZADOR caiu na última posição da lista — e a última é lida como consolo, exatamente
o que a ordem fixa existe para impedir. Ele voltou para o meio, e a ponta virou o
fundador. Uma remoção que reordena a lista sem ninguém olhar é como uma hierarquia nasce
sozinha.

---

## Cinquenta fundadores, e cada um com o número de chegada

Cem pessoas não são um começo: são um público. **Cinquenta** é um número que dá para
segurar na cabeça — dá para imaginar a sala.

E a insígnia carrega o número: **"membro fundador #7"**.

É o único número que uma insígnia tem, e ele é a exceção honesta: **não mede o que a
pessoa fez, mede quando ela chegou.** Ninguém pode fazer mais, ninguém pode fazer menos, e
ele não ordena ninguém contra ninguém. É um endereço, e não um placar.

---

## A casa de quem faz

**"As páginas Quem faz, O que falta e As insígnias devem ser as mais lindas do app, porque
é pra receber quem contribui."**

Eram três telas estranhas uma à outra: cada uma com o seu cabeçalho, a sua largura, o seu
ritmo. Quem chegava numa não sabia que as outras duas eram do mesmo assunto — e o assunto
é o coração do projeto.

Agora as três compartilham o **eixo rosa** (`--color-colaborar`, #E8709F), um cabeçalho, e
**portas uma para a outra** no rodapé: quem termina de ler uma tem uma próxima pergunta, e
ela é sempre uma das outras duas.

**O rosa é um filete, e não um fundo.** A tentação era pintar a tela. Uma tela inteira
colorida grita, e o que grita cansa — e estas são as telas em que a gente MAIS quer que
alguém fique. Dois pixels ao lado do título fazem o mesmo trabalho. É a diferença entre um
cartaz e uma casa.

Ele é a **terceira cor** do app, e a única que não é nem marca (verde-água: "o app está
falando") nem semântica (vermelho: "isto não tem volta"). Ela diz "isto aqui é o coração
do projeto", e vive só na casa de quem faz.

---

## A moldura mostra a honra MAIS ALTA. Sempre.

Uma pessoa tem duas honras (uma por escada) e **uma cara só**. Alguma das duas tem que ir
para o anel, e a regra é: a mais alta.

### Por que a mais alta, e não a escolha da pessoa

Deixar escolher parece mais gentil, e é pior. Quem leu 300 livros e 12 mangás escolheria
mostrar o Aprendiz num dia de modéstia — e aí o anel deixa de dizer alguma coisa sobre a
pessoa e passa a dizer alguma coisa sobre o **humor** dela.

**Um sinal que depende de escolha não é um sinal: é um enfeite.** E a moldura só vale a
pena existir porque, olhando uma cara no feed, dá para saber o que aquela pessoa é.

### E "mais alta" é por DEGRAU, nunca pelo número

146 volumes de mangá (Samurai, o 4º degrau) não podem ganhar de 150 livros (Diamante, o
7º) só por serem quase o mesmo número. As duas escadas existem exatamente para isso não
acontecer, e **comparar pelo número cru desfaria as duas de uma vez**.

### A única coisa que passa na frente

A moldura de **apoiador**, e só se a pessoa escolher usá-la. Ela não é um degrau: não diz
quanto você leu, diz que você paga a conta do servidor. Ela não compete com a honra —
**substitui**.

E ela só vale se a pessoa apoia HOJE. A coluna guarda a **escolha**, e não o direito: quem
para de apoiar perde a moldura sozinho, e ninguém precisa passar limpando escolha de quem
cancelou.

### A regra estava escrita duas vezes

Uma vez para o perfil, outra para o feed, soltas, sem teste. **Uma regra de produto
duplicada é uma regra que vai divergir** — e o dia em que divergisse, a mesma pessoa
apareceria com um anel no perfil e outro no feed.

Agora ela é uma função só (`coroaDe`, em lib/honras.ts), pura, com sete testes. E o tipo
`Coroa`, que também existia em dois lugares, virou um só: **dois tipos com o mesmo nome
sobre a mesma coisa é como duas verdades começam a divergir.**

---

## O rosa é do apoiador, e a moldura dele deixa de ser verde-água

**"Platina e esmeralda podem se confundir com a cor do apoiador."** Estava certo, e o
problema era um empate de três:

    platina    #4FA39A   verde-água escuro
    esmeralda  #2E9E63   verde
    apoiador   #7DD3C0   verde-água claro  ← a cor da MARCA

Três anéis verdes na mesma cara. E aí a moldura para de dizer alguma coisa: a pessoa vê um
anel esverdeado e não sabe se aquilo é uma **honra** ou um **apoio** — que são as duas
únicas coisas que a moldura existe para distinguir.

A moldura de apoiador virou **rosa** (#E8709F), a mesma cor de "Quem faz". E a
coincidência não é coincidência: **apoiar é contribuir.**

### Nenhum teste avisou, e nenhum podia

As cores estavam soltas dentro de um componente, e **ninguém mede a distância entre duas
cores olhando um `.tsx`**. Só apareceu porque uma pessoa olhou para a tela.

Agora a paleta é DADO (`lib/paleta.ts`) e `lib/paleta.test.ts` mede: distância mínima de
30° entre o apoiador e todo degrau, 25° entre degraus vizinhos, e o brilho tem que ser do
mesmo matiz do anel.

**E ele achou, na primeira execução, uma segunda colisão que eu tinha acabado de criar:**
a navalha (#C0392B, vermelho) ficava a **29°** do rosa. Num anel de dois pixels numa cara
de quarenta, vermelho e rosa são a mesma cor. Ela virou escarlate (#D14A1E).

### E o zelador saiu do rosa

Ele era rosa-carmim (340°). Virou verde (133°).

Duas insígnias rosas seriam "quem cuida do catálogo" e "quem paga a conta" com a mesma
cara — e essas duas são exatamente as que o Gume mais precisa que ninguém confunda.

---

## Quem apoia tem INSÍGNIA. E ela diz que se paga.

**Isto contradiz uma regra escrita, e ela era boa.** O `docs/design.md` dizia:

> *"Quem apoia **comprou** um selo; quem tem uma insígnia **doou** trabalho. Se os dois se
> parecerem, a mensagem que sobra é 'dá para comprar mérito', e isso mata a página de
> contribuidores inteira: a partir daí ninguém mais sabe, olhando, quem trabalhou e quem
> pagou."*

E havia dois testes travando exatamente isso.

### Por que a regra caiu, e o que ficou no lugar dela

**O selo nunca foi desenhado.** Era um componente, dois testes, uma regra e um parágrafo —
e **zero pixels na tela**. Uma proteção que não é desenhada não protege nada.

O medo continua certo, então o que a regra protegia **mudou de lugar**:

| | antes | agora |
|---|---|---|
| como ela se parece | feia de propósito | igual às outras |
| como ela se explica | não se explicava | **"esta não se conquista: ela se paga"** |

Um selo cinza que ninguém entende protege **menos** do que uma insígnia que conta, na
cara, "esta pessoa paga a conta do servidor". **A honestidade sobre o que a coisa é vale
mais do que escondê-la.**

### A trava de verdade, que continua de pé

**Pagar não põe ninguém na página de quem faz.** Aquela lista é sobre TRABALHO, e é a
única tela do app com número. Se `lib/contributors.ts` um dia olhar para `is_supporter`, a
build quebra.

Proibir a insígnia era proteger a coisa errada. O perigo nunca foi ela existir: foi
**dinheiro comprar um lugar na lista de quem trabalhou**.

### E ela é viva

Sai sozinha no dia em que a pessoa para de apoiar, porque é lida de `is_supporter` — e não
concedida numa tabela que alguém teria que lembrar de limpar. Uma insígnia de apoiador que
fica depois do cancelamento é uma mentira que o app conta todo dia.

### O teste que passava por acidente

Ao apagar o `SeloApoiador`, um teste continuou verde:

```ts
const selo = CODIGO.slice(CODIGO.indexOf("export function SeloApoiador"));
```

`indexOf` passou a devolver **-1**, `slice(-1)` pega o último caractere do arquivo, e nada
casa com nada. **O teste ficou verde para sempre, sem olhar para coisa nenhuma.**

É a mesma família do bug que já apareceu quatro vezes neste repo: **o que passa porque não
achou nada.** Um `indexOf` sem checar o -1 é uma mentira esperando para acontecer.


---

## O teste da paleta media a coisa errada, e o Gume virou o branco do fio

**"Navalha e Tengu estão da mesma cor do Bronze, e Gume e Katana da mesma cor do Ouro."**

Estava certo, e havia uma terceira que ninguém tinha visto:

    bronze (22°)   x  navalha  (15°)  =  7°   ← a mesma cor
    ouro   (46°)   x  gume     (43°)  =  3°   ← a mesma cor
    prata  (208°)  x  diamante (214°) =  6°   ← a mesma cor

### O teste existia, e passava sorrindo

Ele comparava só degraus **vizinhos**. E as três colisões estavam entre os DISTANTES: ele
nunca comparou o 2º com o 9º.

**Uma escada de dez degraus tem 45 pares, e não 9.** Um teste que olha só para o vizinho
não está medindo uma paleta: está medindo uma fila.

E o estrago é o pior possível: a moldura existe para dizer, de relance, o que uma pessoa
é. Se o 2º e o 9º degrau têm a mesma cara, ela deixa de dizer qualquer coisa — e o Bronze
e a Navalha viram a mesma pessoa.

Agora ele compara os **55 pares** (dez degraus mais o apoiador), e eu provei que ele pega
o bug: repus as cores velhas e ele acusou as três.

### O GUME é o branco do fio

Ele era dourado, e o ouro já era dourado. O último degrau da escada parecia o quarto.

Agora ele é **o brilho de uma lâmina afiada contra a luz**, que é literalmente o que a
palavra quer dizer. E isso faz dele o topo **sem precisar de brilho a mais nem de moldura
diferente**: ele só é mais claro que todo o resto, e é o mais claro de tudo.

### Três cinzas são o esqueleto da escada, e na primeira vez dois eram iguais

Ferro (grafite, **32%** de luz), Prata (cinza, **61%**) e Gume (branco do fio, **96%**).

**Eles nasceram em 39%, 76% e 95%** — dezenove pontos entre a Prata e o Gume. Numa
planilha são dezenove pontos; num anel de dois pixels sobre um fundo preto são a mesma
cor, e a pessoa que olhou disse isso na hora.

O teste aprovou porque o limiar dele era 18. **Um limiar que aprova o que a pessoa vê como
igual não é um limiar: é uma desculpa.** Subiu para 25, e as distâncias viraram 29 e 35.

Cinza não tem matiz: ele é ausência de cor, e não colide com cor nenhuma. O que distingue
dois cinzas é a **luz** — e é a única família da paleta onde a régua é outra. O teste sabe
disso, e exige 18 pontos de luz entre dois cinzas.

### A paleta inteira

| degrau | literatura · quadrinhos | cor | matiz |
|---|---|---|---|
| 1 | Ferro · Aprendiz | `#4F5256` | grafite |
| 2 | Bronze · Discípulo | `#8D503A` | 16° |
| 3 | Prata · Ronin | `#979BA0` | cinza |
| 4 | Ouro · Samurai | `#C9A926` | 48° |
| 5 | Platina · Kenshi | `#4EA9BC` | 190° |
| 6 | Esmeralda · Sensei | `#2E9E5D` | 145° |
| 7 | Diamante · Shogun | `#5050D7` | 240° |
| 8 | Lâmina · Oni | `#9D5ED4` | 272° |
| 9 | Navalha · Tengu | `#D345CA` | 304° |
| 10 | **Gume · Katana** | `#F2F4F6` | **o branco do fio** |
| — | apoiador | `#E8709F` | 336° |

---

## A placa virou medalha, e ela cala a boca

**"Os badges não estão tão premium e chamam atenção no perfil. Talvez fazer eles como
ícones mesmo, redondinhos, e quando passa o mouse a pessoa sabe o que é."**

A insígnia era um retângulo chanfrado com o glifo E A PALAVRA ao lado: "BIBLIOTECÁRIO",
"MODERADOR", "ZELADOR". Sete dessas embaixo do nome de alguém eram sete blocos de texto em
versalete — e eles **competiam com o nome da pessoa**, que é a única coisa que aquele lugar
existe para dizer.

Um perfil não é um crachá de congresso.

### Agora é um círculo de 34 px, e ele não fala até você perguntar

Sete medalhas são uma fileira de sete pontinhos discretos: dá para ver que a pessoa tem
coisas, e não dá para ler nada.

**A palavra não sumiu: ela ficou guardada.** Quem quer saber, passa o mouse e a insígnia
se explica em duas linhas. Quem não quer, vê sete pontinhos bonitos.

### O balão é nosso, e não o do navegador

`title` não serve: demora um segundo, some sozinho, e não cabe duas linhas. **Uma insígnia
que a pessoa não consegue entender é uma insígnia que não reconhece ninguém.**

E ele **não aparece na tela que explica as insígnias**: ali o texto já está escrito ao
lado, e um balão que repete o texto vizinho não é ajuda, é ruído.

### O que a mudança quase apagou

O nome e o "o que ela é" **moravam dentro da placa**. Quando ela virou uma medalha muda,
os dois sumiram — inclusive da `/insignias`, que é justamente a tela que existe para
explicar. Ela ficou só com o "como se ganha".

**Uma insígnia descrita só pelo como, sem dizer o que ela é, é uma tarefa sem motivo.** Os
dois voltaram para a tela, e agora moram lá, e não dentro da peça.

### E a regra de ferro continua

Mesma geometria, mesmo bisel, mesmo glow, mesmo L e mesmo C para as oito. **Só o matiz
gira.** O que faz um jogo virar farm não é a medalha: é a medalha DIFERENTE.

O número do fundador ("#7") mora **dentro do balão**, e não em cima da medalha: um número
desenhado na cara de uma insígnia é a primeira coisa que o olho procura, e aí ele vira
placar.

---

## AUTH: o GitHub sai, o Google entra, e a tomada de conta não nasce

### 1. O GitHub sai da porta de entrada

**Ele não funcionava.** O log dizia, a cada carga: *"Social provider github is missing
clientId or clientSecret"*. O botão estava na tela e não abria — a pessoa clicava, nada
acontecia, e ela concluía que o app estava quebrado **antes de ter uma conta**.

**Uma porta que aparece e não funciona é pior do que porta nenhuma.**

E ele traz três problemas de graça:

- *"Entrar com GitHub"* num app de LEITURA confunde leitor. O público do Gume não sabe o
  que é GitHub, e não deveria precisar saber.
- O GitHub pode entregar e-mail **não verificado**, e e-mail não verificado é o vetor
  clássico de tomada de conta. O Google sempre verifica.
- Com Google + senha, **essa vulnerabilidade não nasce.**

**O GitHub nunca foi sobre LOGIN: é sobre IDENTIDADE.** A insígnia de Construtor precisa
do handle do GitHub para casar com quem tem PR mesclado — e isso é uma ação de
CONFIGURAÇÕES ("conectar o GitHub"), feita por quem já está dentro, depois do lançamento.

`lib/auth.codigo.test.ts` quebra a build se ele voltar para `socialProviders`.

### 2. ⚠️ A tomada de conta pelo vínculo automático

**O ataque:** o atacante se cadastra com senha usando `victima@gmail.com` e **nunca
verifica** o e-mail. Meses depois, a vítima entra com o Google dela. Se o app vincular
automaticamente, **ela cai dentro da conta do atacante** — e ele sabe a senha.

Ela não vai perceber: o e-mail é o dela, o nome é o dela, e a estante está vazia. Ela vai
achar que é um bug e vai ficar. E o atacante entra quando quiser.

**A defesa:** `requireLocalEmailVerified: true`. Uma conta de senha com e-mail não
verificado **nunca** recebe vínculo automático de OAuth nenhum. Sem exceção.

Este é o **padrão** do Better Auth 1.6 — e está escrito no nosso código **mesmo assim**,
porque depender de um padrão é depender de ninguém mudá-lo. Um `?? true` numa dependência
é uma promessa que a próxima versão menor pode desfazer em silêncio.

**A verificação foi feita LENDO o código da biblioteca**, e não a documentação dela:
`oauth2/link-account.mjs`. Segurança que se confirma lendo documentação é segurança que
ninguém confirmou.

#### O teste roda o ataque de verdade

`lib/auth.vinculo.test.ts`. Não é `expect(config.x).toBe(true)` — isso provaria que a
gente escreveu uma linha, e não que ela funciona.

O ataque acontece inteiro: uma conta de senha não verificada, e um login do Google com o
mesmo e-mail, executado **pelo Better Auth de verdade**. (O Better Auth aceita login por
`idToken` e deixa sobrescrever `verifyIdToken` — então o Google entra sem o Google, pelo
mesmo caminho de código.)

**E há um segundo teste que DESLIGA a defesa e prova que o ataque funciona.** Um teste de
segurança que passaria mesmo com a defesa desligada não está testando a defesa: está
testando outra coisa, e ninguém sabe o quê.

**E um canário na dependência:** ele lê `link-account.mjs` e quebra a build se a trava
sumir num `pnpm update`.

### 3. O invited_by, que já sumiu em silêncio uma vez

O Better Auth **descarta, sem avisar, qualquer campo que não esteja em
`additionalFields`** — e responde 200. **Acrescentar um provedor de login é exatamente
onde ele volta.**

Os três cenários estão testados (`lib/auth.convite.test.ts`), e os dois elos que um teste
de unidade não alcança também:

- **o cookie do convite é `sameSite: lax`, e não `strict`.** O cadastro pelo Google é uma
  viagem: o navegador sai do Gume, vai ao Google, e VOLTA. Um cookie `strict` **não é
  enviado** nessa volta. Trocar `lax` por `strict` parece "mais seguro" e apagaria a
  linhagem de **todo mundo que entrar pelo Google**, em silêncio, para sempre.
- **`invitedBy` está em `additionalFields`**, com `input: false`.

### 4. 2FA: um código no e-mail, e não um app autenticador

**Um 2FA que a pessoa não liga não protege ninguém.** O app autenticador é um degrau que
quase ninguém sobe: instalar um aplicativo, escanear um QR code, entender o que é um
"segredo TOTP" — tudo isso ANTES de ganhar qualquer proteção. O Gume é um app de leitura,
e não um banco: o público dele não vai instalar o Authy para guardar uma estante.

O código no e-mail é **mais fraco** que o TOTP, e a tela diz isso, na cara. Mas ele é um
segundo fator de verdade para quem entra com senha, e ele é ligado com dois cliques.

**O que ele NÃO protege, e está escrito na tela:** quem entra pelo Google já tem o e-mail
como fator. Um código enviado para o mesmo Gmail que acabou de autenticar a pessoa não
acrescenta nada. Por isso ele é **oferecido, e nunca imposto**.

- **Nunca SMS.** Um chip se clona convencendo um atendente de loja.
- **O código é CIFRADO no banco.** O padrão do plugin é `storeOTP: "plain"` — texto puro.
  Um dump de banco vazado passaria a valer um segundo fator.
- **Ele só liga depois de funcionar uma vez** (`skipVerificationOnEnable: false`). Sem
  isso, alguém cujo e-mail não chega tranca a própria conta com um fator que nunca
  funcionou, e descobre no dia seguinte.
- **Os dez códigos de recuperação são obrigatórios.** Alguém diria que com o e-mail eles
  perdem o sentido. Não perdem: **quem perde o acesso ao e-mail perde tudo** — não recebe
  o código, não recupera a senha, e não tem a quem recorrer, porque o suporte do Gume é
  uma pessoa só, num domingo.
- **Força bruta:** o middleware limita `/api/auth/*` a 10 tentativas por 5 minutos por IP,
  e o código expira em 5 minutos. Dez palpites em um milhão, por janela.

### 5. A CSP bloqueava a foto de quem entra pelo Google

`img-src` não tinha `lh3.googleusercontent.com`. **Todo mundo que entrasse pelo Google
ficaria sem foto** — e o app não quebraria: ele só ficaria cheio de gente sem cara, e o
console cheio de erro que ninguém lê.

É o tipo de bug que passa no code review e aparece na semana do lançamento.

---

## Isto NÃO é 2FA. É "código por e-mail", e o nome importa.

> **Código por e-mail não é um segundo fator se o reset de senha também vai por e-mail:
> é o mesmo fator, duas vezes. Ele protege contra senha vazada e reusada — que é o ataque
> real num app deste tamanho — e não protege contra invasão do e-mail. Chamar de 2FA seria
> prometer uma segurança que não existe.**

Na tela ele se chama **"código por e-mail"**, e em lugar nenhum "autenticação de dois
fatores" nem "verificação em duas etapas". `lib/auth.codigo.test.ts` quebra a build se uma
tela voltar a prometer o que o app não entrega.

E a tela **diz o que ele não protege**, com todas as letras: quem invade o e-mail entra do
mesmo jeito, porque o "esqueci a senha" também vai por e-mail. Um app que esconde o próprio
limite de segurança é um app que mente sobre segurança.

### O que muda, e é sério

    ANTES   e-mail caído  →  ninguém se cadastra
    AGORA   e-mail caído  →  NINGUÉM ENTRA

O e-mail passou a estar no **caminho crítico do login**.

- **Dez minutos, e uso único.** É um teto, e não um convite: um código que vale uma hora
  fica numa caixa de entrada invadida esperando alguém passar. O
  `consumeVerificationValue` do plugin garante que um código usado não serve de novo.
- **Cinco erros e o código morre** (`allowedAttempts: 5`). São seis dígitos — um milhão de
  combinações, e um script com dez minutos e um código vivo faria força bruta com folga.
- **O limite de pedidos é por PESSOA**, e não só por IP. O middleware limita `/api/auth/*`
  por IP; um atacante com mil IPs pediria mil códigos para o e-mail da vítima, e a caixa de
  entrada dela viraria o ataque. Cinco pedidos em dez minutos por conta.
- **O reenvio tem contador.** Um botão que se aperta dez vezes seguidas é um ataque — e
  cada código novo mata o anterior, então apertar dez vezes é a melhor maneira de nunca
  conseguir entrar.

### ⚠️ A BIBLIOTECA MENTE SOBRE O ENVIO, e isso era o pior bug desta rodada

O `/two-factor/send-otp` do Better Auth faz isto (lido em
`plugins/two-factor/otp/index.mjs`):

```js
const sendOTPResult = options.sendOTP({ user, otp: code });
if (sendOTPResult instanceof Promise)
  await runInBackgroundOrAwait(sendOTPResult.catch(e => logger.error(...)));
return ctx.json({ status: true });        // ← SEMPRE true
```

**Ele engole o erro do envio e responde "enviado".** Com o e-mail no caminho crítico do
login, esse é o pior erro possível: o Resend cai, a tela diz "mandamos um código", a pessoa
espera, olha o spam, espera mais, e conclui que perdeu a conta. **E o app diz que está tudo
bem.**

É a lei do AGENTS.md quebrada **dentro da dependência**: *nunca traduza falha de
comunicação em outra coisa.*

**O conserto:** o envio passa por `lib/codigo-por-email.ts`, que abre uma caixa por
requisição (`AsyncLocalStorage`), manda o e-mail de verdade, e escreve na caixa o que
aconteceu. A ação de servidor lê a caixa e a tela diz a verdade — **inclusive "o código NÃO
foi enviado, e o problema é nosso"**.

Não é uma variável de módulo: com duas pessoas pedindo código ao mesmo tempo, uma variável
de módulo entregaria o resultado de uma para a outra.

### ⚠️ E O DOMÍNIO NÃO TEM SPF, NEM DKIM, NEM DMARC

**Isto é o que decide se alguém consegue entrar no app, e não está em código nenhum.**

    SPF     ✗ não existe
    DKIM    ✗ não existe
    DMARC   ✗ não existe
    MX      ✗ gume.club não recebe e-mail
    RESEND_API_KEY  ✗ não está no ambiente

Desde fevereiro de 2024, o Gmail e o Outlook **exigem** os três. Sem eles, e-mail novo de
domínio novo vai para o spam por padrão — e **código de login no spam quer dizer que ninguém
entra, e ninguém reclama.** O e-mail sai com status 200, o filtro o esconde, e a pessoa
desiste em silêncio. Nada aparece em log nenhum.

`scripts/entregabilidade.mjs` confere os cinco e imprime exatamente o que falta. Ele também
manda um e-mail de verdade para os endereços que você passar — mas **não consegue olhar na
sua caixa de entrada**, e fingir que consegue seria a pior mentira desta rodada.

---

**2026-07-14: A IA sai da lista de recusas do README, e o "sem IA" fica sendo sobre as FEATURES.**

O README listava "sem IA generativa escrevendo sobre a sua leitura" ao lado de "sem ofensiva" e "sem placar", como um valor de marca. E o dono apontou a incoerência: o app é construído com IA, do primeiro commit a esta linha. Disavowar a ferramenta que a gente usa todo dia, na porta de entrada, é pose, e pose é a única coisa que este README não pode ter, porque a tese do projeto é confiança.

A recusa então some da vitrine, e o que fica é a verdade dividida em duas:

1. **O produto não põe IA para falar no lugar do leitor.** Sem resumo do gosto dele, sem resenha gerada, sem recomendação de máquina. A resenha é o produto deste app justamente porque é de gente, e uma resenha escrita por IA não é uma resenha, é um preenchimento. Isso continua valendo, e continua em teste e no AGENTS.md (regra 11).

2. **O app é construído com IA, e o README diz isso, no Stack.** Construir com a ferramenta e não fingir o contrário é o oposto de hipocrisia. A régua que segura a qualidade não é "nenhuma IA tocou aqui": é que o repositório se defende sozinho com testes que varrem o próprio código, e uma pessoa decide o que entra.

A distinção que fica: **IA como ferramenta de quem constrói, sim, e dito na cara. IA como voz do produto, falando pelo leitor, não.** Não é o mesmo assunto, e tratar como se fosse era o erro.

---

**2026-07-14: A praça saiu do explorar. Feed de estranhos não mora na aba de ESCOLHER quem seguir.**

A praça (um feed cronológico de quem você ainda não segue) foi adicionada ao fim do explorar numa reversão anterior, para resolver a tela vazia de quem chega. O dono a removeu, e a razão é boa: o explorar é a aba de ESCOLHER quem seguir, e um feed de estranhos pendurado no fim dela puxava a tela de volta para o ruído que ela existe para evitar. As seções que ficam (estantes para descobrir, quem lê o que você lê, resenhas recentes, o que estão lendo agora) todas ajudam a decidir em QUEM prestar atenção; a praça só mostrava movimento.

O medo original, registrado quando a praça nem existia, estava certo o tempo todo: "um feed geral de todo mundo terminou tal livro é ruído de estranho, e é onde nasce a vontade de performar". A praça foi uma tentativa de domar esse feed com travas (cronológica, sem contador, só público). A conclusão de hoje é mais simples: o lugar dela não era aqui.

O código de `getPraca()` fica em lib/social.ts por enquanto, sem tela que o chame. Se a tela vazia do recém-chegado voltar a doer, a praça volta, e volta num lugar pensado para ela, não pendurada no fim do explorar.

---

**2026-07-20: As conexões viram tela, e ficam privadas. Sem contador, sempre.**

A aba de amigos passou a mostrar duas listas, quem você segue e quem segue você, com rosto e nome, e o nome leva ao perfil. Faltava o básico: dava para seguir e não dava para ver quem.

Duas travas, e as duas são o ponto:

1. **A lista de conexões é privada, e a recusa é `assertOwner()`.** Só você vê a sua. `/@fulano` não mostra as conexões do fulano, e `getConexoes` recusa qualquer id que não seja o de quem pediu, ANTES de qualquer consulta. A razão não é pudor: a lista de quem alguém segue é um mapa social, e a soma de gestos privados é um retrato que não é de ninguém publicar. É tratada como uma linha com dono, porque é o que ela é. O red team prova que o usuário errado, inclusive quem SEGUE a vítima, leva Forbidden.

2. **Sem contador, em lugar nenhum.** `lib/conexoes.ts` devolve gente, e nunca um total, nem no tipo de retorno. Não é esquecimento: "128 seguidores" é a linha do README, e ela não se cruza de uma vez, ela se cruza no dia em que uma função devolve `{ pessoas, quantas }` porque uma tela achou conveniente. Um teste trava o formato do retorno e proíbe o `.length` de virar texto na tela. A lista rola dentro de um teto; rolar não conta, paginar com número contaria.

---

**2026-07-20: O convite já existia, e o que faltava era deixá-lo achável e dar crédito a quem chegou.**

O formato do convite NÃO mudou, e não se discutiu de novo: o handle é o convite, `/entrar?convite=<handle>`, sem tabela de códigos, sem expirar, como já estava decidido. A régua de segurança que o pedido trazia ("o código não pode ser enumerável para mapear usuários") já estava satisfeita por outro caminho: o handle é público de qualquer forma, e enumerar `/entrar?convite=fulano` não revela nada que `/@fulano` não revele. Não havia o que proteger, então não se construiu proteção nenhuma.

O que faltava, e entrou:

- **A porta saúda quem foi chamado.** `/entrar?convite=fulano` agora diz "fulano te chamou pro Gume", porque a recomendação de uma pessoa é o produto. Sem pressão, sem contagem regressiva, sem "seu amigo está esperando". Para dizer o nome, `app/entrar/invite.ts` passou a LER o banco (handle para nome de exibição), uma leitura só de dado público, e essa leitura virou o portão de sanidade do convite: handle de ninguém, ou de banido ou apagado, não saúda e não é lembrado. A razão dele na lista PUBLICO de lib/surface.test.ts foi atualizada, porque a antiga dizia "não toca no banco".
- **Compartilhar pelo sistema.** O botão de convite ganhou a Web Share API quando o navegador suporta (no celular é a diferença entre mandar no WhatsApp e desistir). Copiar continua em todo lugar.
- **O convite mora também na aba de amigos**, não só no perfil. A sidebar tem filosofia de uma porta e não se mexeu nela; a aba de amigos é o segundo lar óbvio, porque é onde você pensa em quem conhece.
- **Quem entrou pelo seu link aparece no perfil.** Rostos, nunca número, e privado igual às conexões (`getConvidados`, mesma `assertOwner()`). É a procedência da conexão, e não o placar dela.

**E o arauto tinha DUAS definições, que discordavam.** `lib/invite.ts` tinha uma `isHerald()` (um convidado, um livro) e `lib/badges.ts` tinha a régua de verdade (cinco leitores que ficaram, cada um com dez livros). O perfil lia a primeira e mostrava o selo; a página de insígnias lia a segunda e não reconhecia a pessoa. O mesmo leitor era arauto numa tela e não na outra. `isHerald()` foi apagada, o perfil passou a derivar o selo de `getBadges`, e um teste trava a régua única: uma honra, uma régua, um lugar.

---

**2026-07-20: O painel privado. Uma pessoa, os números de verdade, e a linha entre saúde e vigilância.**

Uma página que só o idealizador abre, com os dados do projeto: gente (contas, crescimento, ativos, retenção, log de cadastro), uso (mediana e média de livros, contas vazias, resenhas, notas em palavra), contribuição (correções que sobreviveram, capas, obras de leitor, código, e a fatia que contribui ao menos uma vez), convite (quem veio por convite, quem já convidou, convites que vingaram) e catálogo (obras, edições sem capa, sem ano, sem editora, sem autor, e as buscas que não acharam nada).

As decisões duras:

- **Acesso é o idealizador, e a checagem passa por lib/authz.ts.** Não se inventou papel novo (coluna de role, lista de e-mails em env): o idealizador já existe, único no mundo por índice do banco. O que mudou é que a checagem (`ehIdealizador`, `souIdealizador`, `assertIdealizador`) MUDOU de lib/moderacao.ts para lib/authz.ts, que é onde toda autorização mora. Ela decide dois poderes (promover moderador, ver o painel), e uma pergunta de autorização respondida em dois lugares um dia diverge. authz.ts ganhou um import de db para isso, o que é novo para esse arquivo, e é aceito: a autorização mora lá, mesmo quando precisa do banco.

- **404, e não 403.** A página responde "não existe" para quem não é o idealizador, porque um 403 confessa que a página existe. `souIdealizador` vira o notFound. E `getPainel` chama `assertIdealizador` por dentro: a defesa não depende de a página lembrar de checar. O red team prova as duas recusas (lib/painel.redteam.sql.test.ts).

- **Retenção custou uma coluna, e ela é a única coisa do painel na fronteira da vigilância.** `users.last_seen_on`, uma DATA (não um relógio), preenchida no máximo uma vez por dia no funil por onde tudo passa (getViewer), no fuso de São Paulo. Ela responde "a pessoa voltou?" e nada mais: não guarda hora, nem página, nem o que a pessoa fez. Um histórico de presença por dia por pessoa (coorte de verdade, semana 1/2/4) foi recusado: já seria vigilância pela régua do próprio projeto. A retenção nasce subestimada (contas velhas não têm passado registrado), e o painel diz isso em vez de fingir.

- **Buscas sem resultado NÃO precisaram de tabela nova.** `buscas_vazias` (a torneira, migration 0031) já registra o termo e quantas vezes, sem user_id de propósito. O painel reusa. É a lista mais valiosa da página, e ela já existia.

- **Média E mediana, sempre as duas.** Se um leitor tem 142 livros e os outros têm 3, a média mente e a mediana não. E a taxa período-contra-período diz "poucos dados ainda" abaixo de um piso, em vez de mostrar "+300%" porque saiu de 1 para 4. Nada de placar: distribuição e mediana, nunca uma lista de gente ordenada por quanto leu, mesmo que só o dono veja.

- **Importação e exportação ainda não são contadas**, porque não há log delas, e o painel diz isso na cara em vez de inventar um número. Medir a exportação (a promessa central) é a próxima coisa a fazer ali.

- **Duas exceções nos testes estruturais, explícitas e comentadas, para a rota do painel só.** (1) lib/voice.test.ts: o painel fala com o dono e usa palavras que o resto do app não pode (retenção, coorte, mediana). `EXCECAO` virou um conjunto com a página e o componente do painel; a regra global continua valendo para todo o resto. (2) lib/contributors.sql.test.ts: o painel mostra a contagem de quem escreveu código, reusando lib/contributors.getCodigo. lib/painel.ts entrou no `permitido`. A garantia original continua: o número não viaja para tela de leitor, ele fica preso a uma página que só o idealizador abre. Se o painel um dia virar público, as duas exceções saem.

---

**2026-07-20: O painel virou um dashboard de dono, e ganhou uma porta para o agente ler.**

O primeiro painel seguia a estética austera do app de leitor (monocromático, sem cor). O dono pediu o contrário, e tem razão: essa tela é só dele, e a régua ali é ler rápido, não ser discreto. Então o painel deixou de obedecer a identidade do app de leitor. Ele tem cor (com parcimônia, o accent verde-água do próprio app), gráfico (área com linha, SVG puro, sem biblioteca, com ponto que segue o mouse), e filtro (dia/semana/mês no crescimento, instantâneo, sem ida ao servidor). A exceção no lib/voice.test.ts continua cobrindo a tela; a regra global do app não mudou.

Métricas de dono que entraram, além das anteriores: **DAU/WAU/MAU** (ativos hoje/7/30, de last_seen_on), **aderência** (DAU/MAU), **ativação** (fatia de contas com ao menos um livro), e a divisão de como as contas chegaram (convite contra sozinho). Continua sem placar: nenhuma lista de gente ordenada por quanto leu.

**A saída para agente, e o e-mail que não viaja.** O dono pediu um jeito do Claude dele ler os números. Duas saídas, pela rota `/api/painel/export`:

- Baixar o `.md` e copiar o `.md` para colar no Claude (botões na tela).
- Um agente headless lê sozinho com `Authorization: Bearer $PAINEL_TOKEN`, um segredo opcional no ambiente. Sem o env, a porta do token nem existe, e só a sessão do idealizador entra. A checagem do token mora em lib/authz.ts (onde toda autorização mora), com comparação de tempo constante e piso de tamanho. A rota responde 404 (não 403) para quem não passa, igual à página.

A trava que importa: **o arquivo que sai NUNCA leva e-mail**, em nenhum formato (md ou json). O e-mail existe só no log da tela, que só o dono abre. Um arquivo viaja (é anexado, colado num chat de agente, fica em disco), e e-mail é dado pessoal. O que sai leva handle, dia, método e procedência, que é o que um agente precisa e nada do que dói se vazar. Um teste prova que nenhum e-mail entra no markdown.

E o link do painel passou a aparecer na barra lateral **só para o idealizador**, pela mesma lógica dos links de papel (moderação, fila): esconder não é a defesa (a defesa é o 404 no servidor), é não desenhar uma porta que dá 404 para todo mundo menos uma pessoa.

---

**2026-07-20: O painel ganhou backup do banco, filtros completos, metas que sobem e insights.**

Cinco pedidos do dono, e as decisões que saíram deles:

**Backup do banco inteiro, e por que ele é a porta mais estreita.** `/api/painel/backup` baixa TUDO: toda linha de toda tabela, inclusive e-mail e estante privada de todo mundo. Por isso ele é gated na SESSÃO do idealizador e NUNCA no token do painel. A separação é o ponto: o token abre os NÚMEROS (sem e-mail, para um agente ler); o backup abre o BANCO, e um segredo estático que baixa o banco inteiro é perigoso demais para existir. Duas formas, as duas por streaming (a tabela de edições tem 400 mil linhas, e um `json_agg` dela num tiro só derrubou a conexão, de verdade, no primeiro teste): `.ndjson` por cursor (roda em qualquer lugar, memória baixa) e `.sql` pelo pg_dump com o stdout direto na resposta (restaurável, quando o binário existe). Um teste trava que a rota de backup não conhece o token.

**Filtros completos, na URL.** Período (7d/30d/90d/12m/tudo/personalizado com duas datas), granularidade (dia/semana/mês), e recorte do log (método, origem). Eles moram nos parâmetros da URL: a barra só reescreve a URL e a página busca de novo, então o estado filtrado é um link compartilhável e recarregável, e há uma fonte da verdade. O filtro vale para o gráfico, o log e o "novos no período", E para o export (o agente pode filtrar). Os KPIs de saúde (7/30/90, ativos, retenção) são janelas FIXAS de propósito: uma régua que muda de tamanho não compara nada. O catálogo é ponto no tempo e não filtra.

**Metas que sobem sozinhas.** Começam onde o dono pediu (100 usuários, 5 contribuidores) e sobem em degraus redondos quando são batidas (100 vira 250; 5 vira 10). Uma meta parada depois de batida deixa de puxar; uma que sobe continua sendo horizonte. A barra enche até o alvo, e conta quantas já foram batidas.

**Mais indicadores.** DAU/WAU/MAU e aderência (DAU/MAU), ativação, adormecidos (sem aparecer há 30+ dias), split de método (google contra e-mail), velocidade (resenhas e notas nos últimos 30 dias), cobertura de capa do catálogo, distribuição do tamanho das estantes (histograma), e média de convidados que vingaram por convidante (um proxy de viralidade).

**Insights.** Uma seção de frases que o dono leria pensando alto, geradas por aritmética com limiar (não é IA): ativação baixa, retenção que dói, o buraco mais pedido do catálogo, quanto falta para cada meta. Cada uma aponta uma coisa que talvez mereça ação.

E o painel deixou de ser monocromático: é dashboard de dono, com cor (parcimoniosa), gráfico de área, e a exceção de voz continua cobrindo a tela e o resto do app segue protegido.

---

**2026-07-21: O ano basta. A data de leitura para de exigir um dia que ninguém lembra.**

O campo de "quando você terminou/largou" pedia dia, mês e ano. Mas a pergunta quase sempre se responde com um número ("li em 2019"), e quem não lembrava o dia era obrigado a **inventar um**. O banco passava a guardar uma precisão que nunca existiu.

Agora o campo **abre pedindo o ano**, já preenchido com o ano corrente, e quem lembra o dia abre "quero pôr o dia" e ganha o calendário. Vale nos dois lugares: no `Quando` (ao marcar lido/abandonado) e no editor de leituras.

**A decisão dura foi como GUARDAR isso**, e ela não é óbvia:

- Guardar "2019" como `2019-01-01` e mais nada faria o app perder a diferença entre **quem leu em 2019** e **quem terminou no dia 1º de janeiro**. A segunda é uma afirmação que o leitor nunca fez, e o app estaria inventando um dia, exatamente o que a entrada das datas de leitura existe para impedir.
- Trocar a coluna para só o ano jogaria fora o dia e o mês que o importador traz do Goodreads e do StoryGraph, e o README promete importar **sem perdas**.

Então entraram **duas colunas de precisão** (`started_precision`, `ended_precision`, migration 0051), com `check` no banco aceitando só `day` ou `year`. O ano vira `2019-01-01` mais a precisão dizendo que aquele 1º de janeiro é **um lugar de pousar, e não uma afirmação**. Duas colunas porque as pontas são independentes (dá para saber o dia em que começou e só o ano em que terminou); o fim é um só, garantido pelo check `readings_one_ending`.

**A conta que isso salvou:** "a paciência" (lib/stats.ts) mede quantos dias um livro esperou na estante antes de ser lido, e é a **única** estatística que faz conta com dia. Com um 1º de janeiro inventado ela contaria uma espera de meses que ninguém viveu, e erraria **em silêncio**. Agora ela ignora as leituras marcadas só com o ano, em vez de mentir.

**O formato diz a precisão, e nada mais viaja.** A tela manda `"2019"` ou `"2019-03-14"`; `dataOuAno()` (lib/datas.ts) lê o formato e devolve a data mais a precisão. Na volta, `getLeituras` devolve `"2019"` para quem marcou só o ano, e nunca `"2019-01-01"` — mostrar o 1º de janeiro seria o app dizendo ao leitor um dia que ele não disse. Sem terceiro estado para sincronizar, e a precisão faz o round-trip inteiro (provado contra o Postgres em lib/leituras.sql.test.ts).

**Uma regra que precisou afrouxar, e está certo:** "o fim não vem antes do começo" agora compara por ANO quando qualquer das pontas é ano. Começar em março de 2019 e marcar "terminei em 2019" não é contradição — o ano contém o mês —, e comparar março contra o 1º de janeiro que pousamos recusaria uma história perfeitamente possível.

---

**2026-07-21: "Quando você leu" desce para uma gaveta, e a regra que decidiu isso já estava escrita na página.**

O dono olhou a página do livro e disse que estava com coisa demais, apontando o campo "quando você leu". A resposta não precisou de opinião nova: a própria página do livro carrega, num comentário, a regra que resolve o caso. Fica **aberto** o que a pessoa faz toda vez (prateleira, nota, resenha, quem escreveu o livro); vai para **gaveta** o que ela faz uma vez na vida (a linhagem da cópia, o registro de correções, as quarenta edições).

Corrigir a data de uma leitura é uma vez na vida — e passou a ser ainda mais raro no mesmo dia em que marcar "lido" começou a perguntar o ano ali mesmo. Aberta o tempo todo, a seção era um formulário de manutenção no meio de uma página de leitura. Ela agora é uma `Gaveta`, como as outras coisas dessa natureza.

**O resumo é o que faz a gaveta valer.** A `Gaveta` exige um resumo pelo motivo que está escrito nela: sem ele, a pessoa precisa abrir para descobrir se valia a pena abrir. Aqui o resumo é a própria resposta que ela buscaria dentro — "terminei em 2019", "larguei em 2021", ou "2 leituras" para quem releu. Com isso a gaveta **informa fechada**, e só se abre para corrigir.

Duas decisões pequenas que vieram junto:

- **O resumo mora em `lib/leituras-view.ts`, e não dentro do componente.** É texto de tela, e o texto de tela deste projeto é varrido por lib/voice.test.ts (entrou na lista `PROSA_FORA_DAS_TELAS`). Um resumo que falasse como desenvolvedor quebraria o build, que é exatamente o serviço que a varredura presta. É o mesmo padrão de `shelf-view`, `badges-view` e `corrections-view`.
- **O resumo fala sempre em ANO, mesmo quando o dia é conhecido**, porque ele é uma etiqueta e não a ficha. E um teste trava que ele nunca deixa vazar o 1º de janeiro que a gente pousa quando a pessoa marcou só o ano: aquele dia é um lugar de pousar, e mostrá-lo seria o app dizendo ao leitor um dia que ele nunca disse.

---

**2026-07-21: O GitHub volta, como vínculo, e o teste que o proibia fica mais apertado em vez de mais frouxo.**

O dono pediu a insígnia de construtor, e ela não tinha como existir: se calcula cruzando a conta do GitHub ligada por OAuth com quem tem PR mesclado (nunca autodeclarada, por decisão registrada), e o app não tinha NENHUM jeito de ligar o GitHub — o provider foi removido do login e a tela de vínculo nunca nasceu. A insígnia era impossível até para quem escreveu o app inteiro.

A saída considerada e recusada: conceder construtor à mão. Resolveria hoje e quebraria a regra "nunca autodeclarado" para sempre; o próximo que pedisse teria precedente. O dono escolheu construir o vínculo de verdade.

**O que entrou:**
- O provider do GitHub volta a `lib/auth.ts` com DUAS travas de cadastro (`disableSignUp` + `disableImplicitSignUp`, porque o Better Auth lê uma no sign-in e outra no callback): ele NUNCA cria conta, só se liga a uma que já existe. O motivo de ele ter saído do login continua válido e continua defendido: GitHub pode entregar e-mail não verificado, o vetor clássico de tomada de conta.
- E ele SÓ é registrado quando as credenciais existem no ambiente. Sem elas, nem o provider nem a seção do perfil aparecem: uma porta que aparece e não abre é pior que porta nenhuma, que foi o bug que o tirou daqui da primeira vez.
- "Conectar o GitHub" mora no PERFIL (components/conectar-github.tsx), para quem já está dentro. A tela de entrar continua sem GitHub, e o teste que garante isso não mudou.
- O ícone é o `Code` genérico, não a marca do GitHub: o Google segue sendo a única marca de terceiro que o app desenha.

**O teste estrutural virou, e virou para mais apertado.** `lib/auth.codigo.test.ts` proibia a palavra "github" em `socialProviders` — e o próprio comentário do teste previa este dia ("ele volta um dia como VÍNCULO... e a pessoa tem que explicar por quê"). A intenção nunca foi "a string não existe"; era "o GitHub não cria conta". O teste agora exige a coisa de verdade: se o GitHub estiver lá, tem que estar com as duas travas, senão a build cai. Antes bastava apagar a palavra; agora a garantia é sobre o comportamento.

Falta do lado do dono: criar o OAuth app no GitHub (callback `<APP_URL>/api/auth/callback/github`) e pôr `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` no ambiente. Aí ele conecta pelo perfil e a insígnia aparece sozinha — para ele e para todo contribuidor futuro.

---

**2026-07-21: A estante inventada vira curadoria inteira: cards com capas, ordem numerada, e o gesto de guardar. E o rosto de quem indicou aparece na capa.**

O dono pediu listas como as do Letterboxd (que ele ama): bonitas, ranqueadas, salváveis, no perfil e no explorar. E pediu sem o site virar movido a curtida, com curadoria valendo. As quatro decisões, tomadas com ele:

1. **Lista E estante inventada são a MESMA coisa.** `collections` já tinha nome, descrição e visibilidade, e `collection_items` tinha `position` que nenhuma tela usava. Um conceito, um nome: o repo já se queimou com dois nomes para a mesma coisa (elo/honra). O que faltava entrou nela, em vez de nascer uma segunda coleção.

2. **Numerada é escolha POR estante** (`collections.ranked`, migration 0052). "Meus dez favoritos" tem 1º e 2º; "terror brasileiro" é um conjunto. Obrigar toda estante a ter números faria de toda coleção um pódio. Reordenar é por setas (components/organizar-estante.tsx), não arrasto: funciona no celular, sem biblioteca, e grava a cada toque.

3. **Guardar existe, e NUNCA conta** (`collection_saves`). Guardar é endosso; endosso contado é curtida com outro nome, a linha que o README não cruza. A estante guardada aparece no perfil de quem guardou COM o crédito de quem montou (nome e rosto no card), e "quantas pessoas guardaram" não existe em tela nenhuma, nem para o dono. A trava é estrutural: um teste varre lib/listas.ts e quebra o build se alguma consulta contar collection_saves. O insert de guardar carrega a visibilidade DENTRO (guardar estante privada não insere nada), e uma estante que ficou privada depois some da tela de quem guardou, porque o filtro roda de novo a cada leitura.

4. **No explorar, sorteio rotativo**, como as estantes de gente e pelo motivo já escrito lá: dar vez a todo mundo sem inventar critério de mérito. "As mais guardadas" seria ranking de popularidade com outro chapéu.

**O card** (components/lista-card.tsx) é a cara do Letterboxd traduzida para a casa: leque de capas sobrepostas, nome em serifa, descrição em duas linhas, e quem fez com rosto. Dois links irmãos (card → estante, rodapé → pessoa), nunca aninhados. A descrição e a numeração se editam em "ajustar esta estante".

**E a procedência da recomendação apareceu na estante** (a fatia anterior desta leva): o rosto de quem indicou fica no canto da capa, visível também para quem visita, porque a recomendação já nasce pública no feed. Red team prova que o banido some da capa sem confiscar o livro de quem recebeu.

**O carrossel dos "adorei" ganhou profundidade** (components/carrossel.tsx): cover-flow com perspectiva, reflexo das capas num balcão de vidro, movido pelo scroll nativo (o 3D é maquiagem por cima do scroll, então trackpad, teclado e dedo já funcionam). Sem biblioteca. `prefers-reduced-motion` devolve a fila reta: profundidade é tempero, não enjoo. Não briga com o design: a única cor continua vindo das capas, o efeito só lhes dá palco.

---

**2026-07-21: A rodada de dez retornos do dono, e a fronteira do ranking dita em voz alta.**

O dono usou o app de verdade e voltou com dez pontos. Os que renderam decisão:

- **O ranking de LIVRO é permitido; o de GENTE continua proibido.** Nasceu `/queridinhos`: os cem livros que a comunidade mais adorou, ranking automático refeito a cada visita, com pódio estilizado no top 3. A fronteira, escrita em lib/queridinhos.ts: estatística de curadoria ordena LIVROS pelo amor recebido (fala de gosto); placar ordenaria GENTE pelo esforço (fala de produção), e esse segue proibido. Só nota PÚBLICA entra: a nota privada de alguém não vira estatística nem anônima, nem agregada. Pela mesma régua, a página do livro diz "N pessoas adoraram este livro".
- **O pódio se diz com tamanho e tinta, nunca com metal.** Top 3 das listas numeradas e dos queridinhos: número grande na serifa da voz, tinta cheia. Ouro/prata/bronze continuam proibidos pelo design (todo mundo lê troféu); tamanho diz "primeiro" sem dizer "prêmio".
- **As tags de uma estante são DERIVADAS, nunca digitadas**: os gêneros que mais aparecem nos próprios livros. Campo de tag livre é máquina de duplicata (o nome de estante já ensinou isso); a curadoria se descreve pelo que carrega.
- **O perfil deixou de ser um pergaminho**: lidos/esperando/largados moravam em containers empilhados e viraram UMA parede com recortes em pílula (abre nos lidos). "Lendo agora" continua tira própria: é o presente, e o presente merece a primeira dobra.
- **Indicar subiu do porão**: a gaveta de recomendar estava no fim da página do livro e o próprio dono não a achava. Um gesto que ninguém encontra não existe. Subiu para junto das ações de toda hora.
- **O carrossel aprendeu com o uso real**: foco a 28% da esquerda (o foco no centro exigia meia tela vazia), SEM scroll-snap (o snap obrigatório segurava a rolagem vertical da página, um pedágio), e o reflexo mora numa janela baixa com overflow escondido (o reflexo inteiro no fluxo dobrava a altura da seção). A aura da capa virou máscara RADIAL: gradiente reto morre numa linha visível e vira bloco; a elipse morre em toda direção, névoa e não faixa.
- **A estante inventada é um espaço de alguém**: aura da primeira capa, "montada por" com rosto, tags derivadas, descrição e o guardar no cabeçalho.

---

**2026-07-21: O Explorar volta à barra (reversão registrada), a capa da estante é um livro dela, e o foco do carrossel deixou de ser adivinhação.**

Quatro retornos do dono, e uma reversão feita de olhos abertos:

- **Amigos e Explorar viraram dois lugares na barra.** A decisão de 2026-07-14 tinha fundido Amigos + Explorar + Recomendações em /pessoas com três abas, e ela fazia sentido quando o Explorar era um recorte. Ele cresceu: estantes de gente, estantes montadas à mão, os queridinhos, afinidade, resenhas. Virou uma galeria de curadores, e galeria é destino, não aba. A divisão é a frase que sempre esteve no código: **amigos é quem você já escolheu; explorar é como você escolhe**. /pessoas ficou com duas abas (Amigos, Recomendações) e o título "Amigos"; /explorar é página própria, aberta inclusive para quem não entrou (tudo ali já é público por construção, e é a melhor vitrine para quem chega por link). O link antigo (?aba=explorar) redireciona. É também onde os queridinhos ficam visíveis: barra → Explorar → o card da curadoria da casa.

- **A capa da estante é um livro DELA, escolhido por quem montou** (collections.cover_work_id, migration 0053). Nunca upload solto: uma imagem livre na vitrine do explorar seria a única superfície onde qualquer um põe qualquer coisa na tela de todo mundo sem passar por bibliotecário. A capa de catálogo já foi curada; apontar para ela é seguro. A escolhida lidera o leque do card e vira a aura da página; clicar de novo desfaz e volta ao primeiro da ordem.

- **O foco do carrossel era tímido demais, e virou inconfundível**: escala de 0,78 a 1,12 (era 0,92 a 1,06), opacidade de 0,30 a 1,00 (era 0,55), e uma LEGENDA embaixo dizendo o título do livro aceso. Foco que precisa de adivinhação não é foco.

- **A capa que morreu vira a capa tipográfica.** URLs de capa apontam para servidor de terceiro, e servidor de terceiro some: a imagem 404 mostrava o ícone quebrado do navegador com texto vazando. O Cover virou client component por UM motivo: o onError é do navegador, e só ele sabe que a imagem morreu. O fallback é a mesma capa desenhada de quem nunca teve imagem.

---

**2026-07-21: O carrossel vira anel, a estante ganha foto de verdade (reversão da 0053, pedida pelo dono), e o livro mostra a comunidade em ícones.**

- **O carrossel dos "adorei" é um ANEL, terceira forma e a que ficou.** A 1ª (foco no centro) abria com meia tela vazia; a 2ª (foco à esquerda) matou o vazio mas deixou o foco ilegível e as pontas desordenadas. A 3ª volta o foco ao CENTRO e mata o vazio por outro caminho: o conteúdo se repete três vezes, a rolagem nasce no terço do meio, e perto de uma borda o carrossel se reancora um terço adiante sem ninguém ver. Não há começo vazio porque não há começo. As capas se dispõem num arco (o centro no trono, as pontas descem), e a legenda diz o título do foco. Anel só com 5+ capas e sem prefers-reduced-motion; senão, fila reta.

- **A foto da estante: o dono reverteu a decisão da 0053 de olhos abertos.** A 0053 tinha recusado upload solto ("seria a única superfície sem curadoria na vitrine") e dado a capa por referência a um livro. O dono pediu foto de verdade, como as listas do Letterboxd, e o argumento de risco era mais fraco do que parecia: o retrato de perfil JÁ é upload livre que aparece em toda parte, pelo mesmo funil (/api/upload: logado, tipo pelos primeiros bytes, nome do servidor, teto de tamanho). Entrou `collections.cover_url` (migration 0054): a foto vira o pano de fundo da página da estante (máscara suave, clima e não conteúdo). O setter só aceita endereço com cara do nosso funil (/uploads/ ou https), nunca http puro, data: ou javascript:. A capa-por-referência da 0053 continua existindo para o leque do card.

- **O livro mostra a comunidade numa fila de ícones**: quantos leram, em quantas estantes montadas mora, quantos gostaram ou adoraram, e a COROA com a posição quando está no top 100 dos queridinhos. A posição usa o MESMO desempate de lib/queridinhos.ts, senão a coroa da ficha discordaria da lista. Tudo contagem sobre LIVRO e só do que é público, como sempre. O que é zero não aparece: lápide não é ficha.

- **A curadoria do Gume em destaque no explorar**: o cartão da casa cresceu, com o pódio de verdade dentro (as cinco capas mais adoradas, a 1ª no trono). É a lista da instituição, montada pela comunidade inteira, e agora parece isso.

---

**2026-07-21: A cor entrou nos ícones da comunidade, por decisão do dono, e a fronteira dela é o ícone.**

O design da casa era monocromático com a cor vindo só das capas, e o dono já tinha rejeitado laranja uma vez (na página de estatísticas). Desta vez ele PEDIU cor, apontando o Letterboxd: os ícones da fila da comunidade na ficha do livro (verde para leram, azul para estantes, laranja para o coração de gostaram ou adoraram) e a coroa DOURADA da curadoria da casa, que assina também o cartão do explorar e o cabeçalho do /queridinhos.

A fronteira registrada: **a cor mora no ÍCONE, nunca no texto nem no número.** O texto continua tinta, e a paleta é fixa e pequena (quatro tons, escolhidos para funcionar no claro e no escuro). Se um dia a cor escorrer do ícone para rótulo, fundo ou número, passou da fronteira.

Mais três da mesma rodada: a fila de ícones aparece SEMPRE (zero incluso), porque uma fila que some e volta conforme os números parece bug; o carrossel ganhou o giro SATURADO (flanco esquerdo inteiro num ângulo, direito noutro, só o trono de frente, como o expositor da referência que o dono mandou), sem translateY, com a escala desenhando o arco sozinha; e a lista da casa se chama "Top 100: os queridinhos do Gume", com página editorial: aura do 1º colocado, coroa dourada e título grande na serifa.

---

**2026-07-21: "Estar na estante" é estar na estante, a luz que não pode ser serrada, e a página do livro emagrece.**

- **"Em N estantes" conta GENTE, e qualquer status conta.** A primeira versão contava só as estantes montadas; o dono corrigiu: lido, lendo, esperando e largado são todos "está na estante de alguém". A conta virou pessoas distintas com o livro na própria estante (qualquer status, público) ou numa estante montada pública. A mesma definição vale na ficha do livro e nos cards do Top 100, que ganharam a fila de ícones coloridos (leram, gostaram ou adoraram, estantes).

- **A luz termina sozinha, nunca serrada.** A aura tinha a máscara ainda viva na borda da caixa, e o overflow serrava o brilho num fio reto: o "bloco" que o dono apontou. A elipse da máscara agora morre bem antes das bordas (fade completo a ~37% do centro): não existe borda para cortá-la. Luz que termina sozinha é névoa; luz serrada é caixa.

- **A página do livro emagreceu quatro móveis, cada um para o lugar onde já era usado:**
  1. A gaveta "edições" e o seletor "qual edição é a minha" eram duas moradas do mesmo assunto; viraram uma: com o livro na sua estante, a gaveta É o seletor. O cartão de ferramentas ficou só com "tirar da estante".
  2. "Arrumar este livro" saiu do porão e virou um LÁPIS no canto do cartão de informações: erro de ficha se vê na ficha, e é nela que se conserta. O histórico continua público.
  3. "Quando você leu" virou uma linha em itálico encostada no painel ("terminei em 2019 · ajustar"), com o editor abrindo ali mesmo. Já foi cartão, já foi gaveta; a resposta cabe em meia frase, e meia frase com moldura própria ocupava uma seção.
  4. A caixa de resenha nasce FECHADA, com um convite de uma linha ("escrever uma resenha"). A maioria das visitas a um livro não é para escrever, e a caixa aberta era um formulário cobrando texto de quem só veio olhar. Quem já escreveu segue vendo o texto como texto.

- **"De onde veio" já conta nas estatísticas** (o card "de onde vieram os seus livros" existia). O filtro por procedência na estante ficou em aberto de propósito: o campo é texto livre por decisão antiga (a procedência é história, não formulário), e filtrar texto livre exige escolher entre busca ou normalização. Vai ao dono como pergunta, não como surpresa.

---

**2026-07-21: O 3D perdeu para o livro, a estante inventada vira COLEÇÃO, e as editoriais ganham morada fixa.**

- **O carrossel dos "adorei" voltou à fila reta.** Três formas de 3D (palco central, foco à esquerda, anel infinito com arco), e o dono julgou no uso real: nenhuma funcionou. A capa girada esconde a própria arte, e o efeito virava o assunto quando o assunto são os livros. A fila reta mostra as capas inteiras, de frente, que é como capa se mostra. Ficou da era 3D: setas que só aparecem quando há para onde rolar.

- **"Estantes personalizadas" viraram COLEÇÕES**, em toda tela. Dois conceitos, dois nomes: a ESTANTE é a biblioteca da pessoa (lidos, lendo, esperando); a COLEÇÃO é o que ela montou à mão. O nome antigo usava a mesma palavra para as duas coisas e obrigava o qualificador "personalizadas". A tabela no banco sempre se chamou collections; a tela agora concorda com ela.

- **/colecoes: a galeria de todas as coleções públicas**, cronológica (a mais nova primeiro, sem algoritmo, o costume do feed), com a CURADORIA DA CASA fixada no topo, fora da ordem: destaque editorial é decidido pela casa, não conquistado por métrica. O cartão da curadoria virou um componente só (components/curadoria-card.tsx) porque agora aparece em três vitrines (explorar, /colecoes, perfil da casa), e três cópias divergiriam na primeira semana.

- **As editoriais moram fixas no perfil do idealizador**, no topo de "minhas coleções": as listas da casa ficam com quem é a casa.

- **Voltar ao topo**: o elevador aparece depois de duas telas de rolagem (antes disso é um botão para ir aonde a pessoa já está), em vidro, acima da barra do celular.

- **E a operação mais capas entrou no repertório**: scripts/operacao-mais-capas.mjs lê a planilha de pesquisa do dono (H1, Clube de Literatura Clássica, Bravo, Jabuti e afins) e aplica no catálogo REUSANDO as funções do app (findOrCreateWork casa por ISBN e título sem duplicar e passa pelo portão de autores; enriquecer completa ficha com a desconfiança da casa). Para isso nasceu o scripts/alias/ (resolvedor de "@/" e de import sem extensão fora do Next). A CDN da H1 entrou nas origens de imagem aceitas: capa POR REFERÊNCIA, como a política manda. Rodar duas vezes não duplica nada.

---

**2026-07-21: O Explorar ganhou corredores, o card da casa se encheu de capas, e a operação mais capas fechou a primeira volta.**

- **O Explorar virou seis vitrines com um menu de pílulas**: tudo, pessoas, coleções, autores, gêneros e editoras. As três últimas são CATÁLOGO puro (a vitrine da livraria, sem linha de leitor, então sem visibleTo por construção), com as obras sorteando como sempre. Gêneros e editoras são um mapa de rótulos com contagem de LIVRO; escolhido um, a vitrine de obras dele. Ver lib/explorar-catalogo.ts.

- **O card da curadoria encheu**: a faixa de capas virou contígua e cheia (oito capas sobrepostas um dedo), como as listas em destaque do Letterboxd que o dono mandou de referência. O pódio decrescente anterior deixava um terço do card vazio.

- **"Os nomes, pelo rosto" morreu**: o resumo das gavetas de conexões virou "abra para ver as pessoas". Resumo de gaveta diz o que acontece ao abrir, não poesia.

- **A operação mais capas, primeira volta**: 405 linhas, 0 falhas, nenhuma duplicata criada (o catálogo já tinha as 405 obras, e o casamento provou seu valor), 290 fichas enriquecidas pela máquina, 27 da H1 com capa em alta por referência, e 94 sem ISBN nem capa mesmo depois da busca (lista para conferência à mão). O material bruto (imagens, rascunhos) saiu do disco; ficou o que é terminantemente útil: a planilha em seed/operacao-mais-capas.csv (dado de catálogo, reaplicável em produção) e os marks da 4/RL em public/logo/ (o README agora dá o crédito com a marca). E um teste de exportação foi CONSERTADO no processo: ele fatiava CSV com split ingênuo e quebrou quando a obra sorteada veio com vírgula no título; o CSV sempre esteve certo, e agora a conferência fatia com as mesmas regras de quem escreve.

---

**2026-07-21: "O que mudou": a casa de quem faz ganhou a porta do passado.**

O dono pediu uma página de novidades ("patch notes") dentro de quem faz. A casa tinha o futuro (/o-que-falta), as pessoas (/contribuidores) e o reconhecimento (/insignias); faltava o passado. Nasceu /o-que-mudou, quarta tela da casa, com o mesmo cabeçalho de filete rosa e as portas entre elas.

As decisões: **só coisa grande entra** (a régua, escrita em lib/mudancas.ts: um leitor que voltou depois de duas semanas notaria sozinho? entra; detalhe por baixo do capim, não), a mais nova em cima, agrupada por dia numa linha do tempo. E o conteúdo mora num ARQUIVO varrido por lib/voice.test.ts, pelo mesmo motivo do o-que-falta: "patch notes" é o formato mais fácil do mundo para escorregar em jargão, e aqui a voz de leitor é obrigatória por teste. Nada de gerar do histórico do código: mudança grande se escreve à mão, uma vez, com cuidado.

---

**2026-07-22: As imagens passam pelo otimizador da casa, e a origem estranha cai para a capa tipográfica.**

A demora das capas incomodava o dono, e a medição confirmou: dois terços da estante dele vêm de covers.openlibrary.org, que serve a imagem GRANDE (60 KB, quase um segundo) para um espaço de 112 px, direto do servidor de terceiro, sem cache nenhum do nosso lado.

- **Toda imagem de tela passa pelo otimizador do Next** (`next/image`): o servidor busca uma vez, corta para o tamanho do espaço, converte para WebP e guarda por 31 dias. Medido: a mesma capa caiu de 62 KB para 22 KB, e a segunda visita responde em 0,02 s (170 vezes mais rápido). A capa do topo da página do livro carrega com prioridade.

- **A lista de fontes continua sendo UMA**: `FONTES_DE_IMAGEM` em lib/imagens.ts agora alimenta a CSP E os `remotePatterns` do otimizador. Fonte nova entra num lugar só. Continua sendo capa POR REFERÊNCIA: cache é cache, expira e se refaz; cópia é cópia, e a gente não copia.

- **Origem fora da lista cai para a capa tipográfica, por `origemAceita()`**: o otimizador ESTOURA no servidor (derrubando a renderização) ao receber um host desconhecido, em vez de recusar com educação; e o catálogo tem capas de hosts que nunca entraram na lista. A guarda roda antes de desenhar. É coerente: a CSP já bloqueava esses hosts no navegador, então essas capas já apareciam quebradas; agora quebram BONITO.

- **Prévia de formulário fica crua de propósito**: os campos de colar URL (correção, autor, livro manual, moderação) mostram `<img>` direto, porque ali a URL é arbitrária por natureza e quem olha é quem está conferindo.

E a tira "lendo agora" saiu do perfil, a pedido do dono: a estante com recortes no fim da página já responde isso num clique, e duas moradas para a mesma resposta era o pergaminho voltando.

---

**2026-07-22: O degrau 1 virou julgamento: "detestei". E a importação parou de achatar a uma estrela.**

"Não terminei" estava errado de dois jeitos, e os dois apareceram no uso real: gente marcava enquanto ainda estava LENDO (o nome parecia um status, e status é outra coluna: "larguei" existe para isso), e o degrau era para ser pior que "não gostei", o que o nome não dizia. Virou "detestei", em primeira pessoa, "detestou" na terceira. **"Odiei" foi considerado e recusado** pelo dono: forte demais para um app que fala baixo, e o teste de lib/veredito.ts garante que ele nunca entra. O glifo virou o Ban (nunca mais), no lugar da meia-volta.

Consequência que paga a mudança: **a importação ficou inteira.** Uma estrela caía em "não gostei" junto com duas (mandar alguém para "não terminei" seria mentir sobre a leitura), e a perda era declarada num aviso. Com o degrau 1 sendo julgamento, cada estrela tem a sua palavra, e o aviso de achatamento saiu do fluxo de importar (app/importar/actions.ts e lib/import/aplicar.ts).

---

**2026-07-22: Os gráficos da estatística ganharam cor, uma por assunto, e o card "o que você achou".**

O dono vetou o monocromático da página de estatísticas: desinteressante, difícil de ler, "tudo da mesma cor é ruim". A regra antiga ("a única cor é a capa") protegia a capa, e a página de estatísticas é a única tela do app sem capa nenhuma; lá o gráfico é o conteúdo. A regra sobrevive onde importa: fora dessa página, nada ganhou cor.

- **A cor segue o ASSUNTO, nunca o valor**: tempo azul, países verde, editoras ocre, procedência vinho, formato verde-água, veredito roxo (tokens `--grafico-*` em globals.css, com um degrau próprio no tema escuro). Dentro de um gráfico, todas as barras são iguais: quem compara é o comprimento, e cor por valor seria ranking pintado. As duas paletas passaram no validador de dataviz (banda de luminância, croma, separação para daltonismo, contraste sobre `#fbf9f4` e `#111111`).
- **O material continua o da casa**: volume translúcido com a aresta superior acesa em 1px na cor cheia. O fio é onde a luz bate, agora na cor do assunto.
- **"O que você achou"**: card novo com a contagem por palavra, do "adorei" ao "detestei", com o glifo de cada uma, os cinco degraus sempre visíveis (zero aparece como filete). As cinco barras têm a MESMA cor de propósito: verde no "adorei" e vermelho no "detestei" seria um semáforo, semáforo é escala, e escala vira média. Sem mínimo de livros: contagem é fato, não retrato; a frase-resumo continua calada abaixo de 5.

---

**2026-07-22: A semeadura das listas do Goodreads: 901 obras conferidas, zero duplicata, e a proveniência limpa.**

O dono quis o conteúdo de nove listas do Goodreads (Clube de Literatura Clássica, Best Literature in Portuguese, Fantasia/Sci-Fi traduzida, Leitura Escolar, Jabuti Romance 1959-2012, Martin Claret, e três de negócios/investimentos) dentro do catálogo, com ficha completa e capa. Scraping do Goodreads continua rejeitado; o desenho que respeita a decisão: **o dono salvou as páginas à mão** (seed/listas-goodreads/, fora do git), e delas só saem **título e autor** — fato bibliográfico. Todo o resto (ISBN, editora, ano, capa) veio das fontes abertas de sempre, pelo `enriquecer()` da casa.

- **Os números**: 994 linhas parseadas (batendo exato com o total declarado de cada lista), 976 obras únicas, 901 no CSV final (seed/listas-goodreads.csv, versionado e reaplicável). As 901 **casaram todas com obras que o acervo já tinha** (o dump PT-BR cobre bem o cânone brasileiro): zero criada, zero duplicada, zero falha, **642 fichas enriquecidas**.
- **O passe de tradução**: 129 títulos estavam em inglês (metade era obra LUSÓFONA catalogada pela edição americana: "Esau and Jacob", "Rebellion in the Backlands"). Caminho: edições `por` da mesma obra na Open Library → palpite do cânone confirmado no Google Books restrito a pt → chute do Google por último, com revisão à mão por cima (o chute errou 2 de 4: série errada, livro errado do autor — desconfiança justificada). 97 traduzidos; 32 sem edição BR encontrada ficaram FORA do catálogo (não se semeia obra em inglês num catálogo PT-BR), listados com os 5 volumes 3-em-1 em seed/listas-goodreads/relatorio-semeadura.md para decisão à mão.
- **Capas**: das 901, 377 obras estavam sem capa em qualquer edição. O backfill ganhou o escopo `--obras <arquivo.json>` (irmão do --canone: a lista vem de medição, não de busca). A cota diária do Google acabou no meio: 7 capas novas, 9 sem capa em fonte nenhuma (tipográfica), **359 aguardando a cota de amanhã** — retomar com `node scripts/backfill-covers.mjs --obras seed/listas-goodreads/obras-sem-capa.json` depois das 5h.
- **De quebra**: o script da operação aceita caminho de CSV como argumento, e a amostragem achou duplicatas ANTIGAS de grafia no acervo ("Euclides"/"Euclydes" separam Os Sertões em três fichas) — assunto para o fundir-duplicatas, fora desta operação.

---

**2026-07-22: A auditoria de véspera de LinkedIn, e o que ela mudou.**

Quatro auditorias paralelas (segurança, testes, UX/UI, vitrine do repo) antes de abrir aos primeiros contribuidores. Nenhuma quebra de autorização, IDOR ou vazamento; os achados eram de borda, e os de código foram aplicados no mesmo dia:

- **Segurança**: `/api/upload` era a única escrita fora do balde de rate limit e justamente a paga; ganhou balde próprio (20/min por pessoa, `RATES.upload`). O `quem()` passou a preferir `x-real-ip` (o header que a borda escreve e o cliente não forja) ao primeiro `x-forwarded-for`. O pôster OG de perfil passou a sumir com banido, como a página. `fotografarLista` trocou "qualquer https" pela régua do avatar (host do Blob ou /uploads/).
- **Verde que mentia**: os canários do acervo (busca, países, autores) davam `return` silencioso com banco vazio e o CI os reportava PASSADOS; viraram `ctx.skip()`, e o relatório diz a verdade. `mutuals()` saiu do lib/authz.ts: morta desde a migration 0046, sem teste, parecia tão provada quanto `visibleTo()`.
- **UX**: /buscar ganhou os estados de falha do ⌘K (429 não é mais "não achamos nada"); a frase de apagar conta parou de prometer botão que não existe (virou "em breve", até a fatia nascer); Estatísticas não imprime mais o zero de 132px no recorte do ano (vira frase, com a lente da vida inteira); nasceu o app/error.tsx na voz da casa (a única tela em inglês era a de erro); os realces `bg-white/3%` (invisíveis no tema claro) viraram tinta rebaixada em 21 arquivos; **o item Perfil do celular virou menu** com Sair, Sobre, Tema e Cuidar do acervo, que só existiam na coluna do desktop; "prateleirar" saiu do convite da página do livro; "procure um livro" da estante vazia virou link.
- **Vitrine**: clone por HTTPS, `db:seed` aponta para o exemplo versionado (o pessoal virou `db:seed:olegas`), contagem de testes alinhada em "mais de 800" nos três documentos, README.en sincronizado com o PT (coleções, Top 100, bloco da 4/RL), setup-mac parou de rodar `db:generate` (migration é à mão). docs/design.md e docs/schema.md atualizados para "detestei".

O que ficou por fazer, decidido e não esquecido: **apagar a conta de verdade** (fatia própria: migration de cascata, confirmação, teste); a trava estrutural de migrations append-only; teste para o `sniff()` do upload; `DATABASE_URL_TEST`; e os cliques de GitHub que só o dono dá (abrir as good first issues prontas em .github/ISSUE_DRAFTS/, descrição/topics/homepage/release/social preview).

---

**2026-07-23: A medição entra, desligada de fábrica, e o Clarity com os olhos vendados.**

O dono quis medir o uso da instância hospedada: Cloudflare Web Analytics (contagem agregada, sem cookie) e Microsoft Clarity (mapa de calor e replay de sessão). Num produto cujo pitch é "ninguém vende o seu histórico de leitura", isso pede regras, e elas ficaram assim:

- **Desligada de fábrica**: os dois medidores só existem se a variável de ambiente existir (`NEXT_PUBLIC_CF_ANALYTICS_TOKEN`, `NEXT_PUBLIC_CLARITY_ID`). Token cravado no código faria toda instância auto-hospedada mandar os leitores dos outros para o painel do dono desta — um rastreador de fábrica, no app que promete o contrário.
- **A CSP anda junto**: os hosts de medição só entram no `script-src`/`connect-src` quando a variável está ligada (middleware.ts). Instância sem medição continua com "não fala com ninguém".
- **O Clarity é o poderoso, e usa cookie**: replay de sessão numa tela de estante mostra o que a pessoa lê. Regras de uso: ligar as máscaras de conteúdo no painel do Clarity (Settings → Masking → Strict), e a página de estatísticas e o painel continuam sendo o que sempre foram: privados; o replay serve para ver onde a interface trava, nunca para ler estante. O aviso de cookies/LGPD da instância hospedada é decisão em aberto do dono.
- O Cloudflare é o inofensivo: agregado, sem cookie, sem perfil.

---

**2026-07-23: O alarme de erro (Sentry), só erro, e desligado de fábrica.**

O primeiro bug real de produção chegou por mensagem no WhatsApp: a tela de erro existia e ninguém do nosso lado ficava sabendo que ela apareceu. Entrou o Sentry, nas mesmas regras da medição: **desligado sem `NEXT_PUBLIC_SENTRY_DSN`** (instância auto-hospedada não manda nada), CSP abrindo o host de ingestão só com a variável ligada, e **só erro** — `tracesSampleRate: 0`, sem replay de sessão (replay é papel do Clarity, e coletar duas vezes é coletar demais). O upload de source maps (rastro legível em produção minificada) ficou de fora por ora: exige token secreto no build, e é a primeira melhoria a fazer quando os rastros começarem a chegar embaralhados.

---

**2026-07-26: Os três primeiros alarmes de produção. Um era bug nosso, dois eram barulho, e as três respostas são diferentes.**

O alarme começou a tocar quatro dias depois de entrar, e o primeiro lote já mostrou por que a régua de "o que merece alarme" precisa ser escrita: dos três, só um tinha conserto do nosso lado.

- **O bug de verdade: o botão do Google em /entrar.** A chamada era `onClick={() => signIn.social(...)}`, solta, sem espera e sem `catch`. No navegador de dentro de outro aplicativo, no iPhone, ela falhou, a promessa morreu sozinha e virou "TypeError: Load failed" sem dono. O rastro mostra a pessoa clicando DUAS vezes: era o botão do GitHub de novo ("a pessoa clicava, nada acontecia"), com outra causa. O botão ganhou os três estados ("parado", "indo", "falhou"), tranca no primeiro clique e diz em voz alta quando não deu. Os outros dois botões da casa que tinham a mesma promessa solta foram junto: `signOut()` (que estava escrito duas vezes na barra, e virou um `sair()` só) e a saudação de convite. **Quando sair falha, a barra RECARREGA e não manda para a home**: a sessão continua de pé, e levar a pessoa embora fingindo que ela saiu seria a pior mentira do app.
- **O robô: "Failed to find Server Action".** POST para a home com corpo de varredura de WordPress (`rest_route`, `/wp/v2/posts`, `/batch/v1`). O Next procura no corpo a marca da ação e não acha, porque não há ação nenhuma. Sai do alarme por `ignoreErrors`, **sabendo o que se perde**: o mesmo erro acontece com gente real que deixou a aba aberta durante uma atualização. Sai mesmo assim porque para esse caso não existe conserto do nosso lado (a ação antiga não existe mais), a tela de erro já oferece o "tentar de novo" que resolve, e alarme que toca todo dia é alarme desligado.
- **O que nem era nosso: "Cannot read properties of undefined (reading 'toObject')".** A palavra `toObject` não existe neste repositório, a pilha inteira dizia `<script>` e o último quadro era `ext:core/01_core.js`, entranha do Deno, num visitante que se anunciava como Chrome no Windows: extensão de navegador ou robô rodando a página em outro motor. **A régua ficou sendo a PILHA, e não a mensagem**: se nenhum quadro veio de um arquivo que nós servimos (`/_next/`), não há o que consertar deste lado. Filtrar por texto seria uma lista crescendo uma linha por extensão que alguém instalar. Erro SEM pilha nenhuma passa de propósito: é o formato do que a tela de erro reporta quando a falha foi do servidor, e é justamente o que se quer ver.

O que ficou de pé como pendência, e agora com pressa: **o upload de source maps.** As três pilhas chegaram embaralhadas (`Object.95930`, `r`, `xm`), exatamente o que a decisão de 2026-07-23 previu como "a primeira melhoria quando os rastros começarem a chegar embaralhados". A do Google só foi diagnosticada pelo rastro de cliques, e não pela pilha.

---

**2026-07-26: O Google Analytics entra, pela mesma porta dos outros dois, e o teste que faltava nasce com ele.**

O dono pediu GA4 na instância hospedada. Ele entra com as MESMAS regras da medição de 23/07, e não com o snippet colado no `<head>`: atrás de `NEXT_PUBLIC_GA_ID`, com a CSP abrindo junto, e desligado de fábrica. Um identificador cravado no código faria toda instância auto-hospedada mandar os leitores dos outros para o painel do dono desta.

- **Três portas na CSP, e não uma.** O erro clássico é liberar só `www.google-analytics.com`, ver funcionar na própria máquina, e descobrir semanas depois que faltava metade: o GA4 manda evento para host REGIONAL (`region1.`, `region12.`), fala com o googletagmanager e com o analytics.google.com em depuração. Faltando qualquer um, o navegador bloqueia CALADO e o relatório vem menor que a verdade. É "não traduza falha em ausência de dado" na forma mais escorregadia, porque número menor não parece erro: parece pouco tráfego.
- **O `img-src` da medição é uma lista SEPARADA da de capas**, e de propósito. `lib/imagens.ts` alimenta o otimizador de imagem e o formulário que valida endereço colado; um host de medição lá dentro faria o formulário aceitar `google-analytics.com/...` como capa de livro. São duas perguntas diferentes, e não uma lista que alguém esqueceu de juntar.
- **E ele NÃO usa `next/script`, ao contrário dos outros dois.** A primeira versão usava, e a verificação do Google respondeu "sua tag não foi detectada em gume.club". O motivo, medido no HTML gerado: com `next/script` o script não sai na resposta do servidor, sai um `<link rel="preload">` e uma instrução dentro do pacote do React, e a tag de verdade só nasce depois que a página hidrata. **Testadas as duas estratégias, e nenhuma resolve**: nem `afterInteractive` nem `beforeInteractive` põem uma `<script src>` literal no HTML quando o componente vive no corpo da página. Para gente de verdade o `next/script` funcionava (e era até melhor, o script de terceiro não disputava a primeira pintura), mas um painel que diz "não instalado" é um painel em que ninguém confia. Então é o snippet do Google como ele é, com tag literal: a verificação passa, e a medição pega quem abre e desiste antes de hidratar. O preço é um script de terceiro na conta do carregamento, segurado pelo `async`.
- **As duas tags caem em lugares diferentes, e está certo.** O React 19 iça a do `async src` para o `<head>` sozinho (e de quebra garante que ela não duplica); o bloco embutido fica no fim do corpo, onde o componente mora. Os dois conversam pela fila `dataLayer`, e quem chega primeiro cria a fila para o outro. Não é para "consertar" a ordem.
- **Nasceu o `lib/medicao.test.ts`, que a decisão de 23/07 já exigia sem ter.** Ela afirmava em texto que "as duas listas ligam e desligam JUNTAS, pela mesma variável", e isso era verdade por SORTE: alguém lembrou, duas vezes. Agora toda variável lida por `components/medicao.tsx` tem que aparecer no `middleware.ts` e no `.env.example`, e nenhum host de medição pode entrar na CSP sem a variável dele ao lado.

**E o teste quase nasceu mentindo, o que vale mais que o teste.** A primeira versão removia comentários por regex, do jeito que o resto do repo faz. Só que `"https://*.googletagmanager.com"` contém `/*`, que é uma abertura de comentário: o removedor engolia dali até o próximo fechamento, junto com as linhas que o teste precisava ler, e ele passava sem examinar nada. Foi pego mutando o middleware de propósito (host cravado, sem variável) e vendo o verde continuar. A régua nova olha só para URL entre aspas, sem remover comentário, e ganhou um contador: se um dia ela não reconhecer host nenhum, fica VERMELHA em vez de verde por vazio. O guarda antigo do `img-src` (`lib/imagens.test.ts`) foi mutado também para conferir que os curingas novos não o cegaram: continua pegando.

Duas coisas ficam em aberto, e são do dono:

- **O GA4 e o Cloudflare medem quase a mesma coisa** (audiência e origem de tráfego). O Cloudflare é agregado e sem cookie; o GA4 tem cookie e mais recorte. Manter os dois é escolha, não descuido, mas um dia vale escolher um.
- **O aviso de cookies continua aberto**, e agora com mais peso: eram Clarity e Cloudflare, e agora é Clarity, Cloudflare e Google, sendo que dois usam cookie. A página `/privacidade` (que mora na branch `arquivo/android-twa`, ainda não no main) diz "três serviços de terceiros" e vira quatro quando aquela branch voltar.

---

**2026-07-28: Pôr um livro numa estante inventada ganha duas portas, e a trava que escondia a primeira cai.**

Um leitor escreveu: *"tava tentando criar uma coleção aqui, mas não entendi como é a dinâmica de colar um livro ali"*. A investigação achou um recurso inteiro escondido, e um bug de ordem que ninguém tinha visto.

- **A causa raiz era uma trava de uma linha.** O controle de estantes na página do livro vivia dentro de um `mine.status &&`: **só era desenhado se o livro já estivesse na prateleira da pessoa**. Quem seguia a instrução da estante vazia ("abra um livro e coloque ele aqui"), abria um livro ainda não marcado, e não encontrava nada. A instrução virava mentira. É a SEGUNDA vez que esse mesmo relato chega, com causa diferente: na primeira o controle estava no rodapé, na gaveta de curadoria, e foi movido para o cartão principal.
- **Tirar a trava é uma decisão sobre o que uma estante é**, e o dono a tomou: um livro pode estar numa estante inventada **sem** estar na prateleira. Estante inventada é CURADORIA, prateleira é o HISTÓRICO de leitura, e são perguntas diferentes. É o que destrava "quero comprar", "presentes para dar" e "o cânone que ainda não li". A alternativa (guardar numa estante marca o livro como "esperando") foi recusada: transformaria toda curadoria em lista de leitura.
- **Nasceu a segunda porta**: um campo de busca DENTRO da estante (components/por-na-estante.tsx). Quem abre uma estante vazia quer encher AQUELA estante, e mandar procurar a porta em outra tela foi o que gerou a reclamação. A busca é só do NOSSO acervo, de propósito: trazer livro de fora é operação de catálogo, e mora na busca principal. Ela distingue os três estados (não achei / limite estourado / a busca caiu), porque lista vazia com 429 lida como "não temos" é a lei mais cara deste projeto quebrada dentro da nossa tela.
- **O que já existia e nunca aparecia:** ordenar (setas) e numerar já estavam prontos. O organizar só aparece com dois livros ou mais, então quem nunca conseguiu pôr o primeiro via a tela mais vazia possível. **Era um problema só, e não quatro.**

**E o teste achou um bug que a reclamação não mencionava.** `collection_items.position` nasce ZERO por padrão, e a estante é lida em `position asc`. Quem ordena a mão fica com 1, 2, 3. Então **todo insert que aceitava o padrão punha o livro novo em ZERO, e ele pulava para o primeiro lugar**, por cima da curadoria, em silêncio. Estava em TRÊS lugares (`toggleInCollection`, `setShelvesByName` e `addManyToCollection`, este último importando cinquenta livros de uma vez, todos empilhados no topo). A regra do "entra no fim" passou a morar em `porNaLista` (lib/listas.ts), e `lib/colecoes.test.ts` quebra o build se alguém voltar a inserir por conta própria. O bug só era visível numa estante numerada com três livros ou mais, que é exatamente a estante de quem mais se importa com ela.

Os testes novos foram mutados para provar que pegam: com a posição forçada em zero, o teste de ordem fica vermelho.

---

**2026-07-28: Guardar uma coleção passa a ser contado, e a regra "nunca conte" vira uma linha mais fina.**

Reversão de uma decisão anterior, pedida pelo dono, e o argumento é dele: **guardar não é curtir.** Curtir custa um toque e não compromete ninguém. Guardar é pôr a curadoria de outra pessoa dentro do seu perfil, assinada com o nome dela, do lado das suas. É um gesto com preço, e gesto com preço contado não vira vaidade: vira sinal. E a curadoria é o que o Gume quer que aconteça mais: quem monta uma estante boa gastava horas e não recebia nada de volta, nem a notícia de que alguém achou útil.

O que existia antes, e caiu: `lib/listas.ts` dizia "guardar nunca vira número", um teste quebrava o build se qualquer consulta contasse `collection_saves`, e o README prometia isso em duas linhas de venda.

- **A linha não sumiu, ficou mais fina.** Contar QUEM GUARDOU uma estante: pode. Contar gente em volta de LEITURA (curtida em resenha, contador de seguidores, "12 pessoas leram este livro", placar de quem leu mais): continua proibido, e agora com teste próprio, que varre `lib/listas.ts` atrás de `count()` sobre `reviews`, `ratings`, `follows`, `library_entries` e `readings`. **O teste antigo não foi apagado: ele mudou de alvo.** Uma trava que some numa reversão deixa a regra nova sem defesa, e a regra nova é mais difícil de acertar que a antiga, porque tem uma linha no meio em vez de um "não" inteiro.
- **O número é público; a LISTA de quem guardou é só de quem montou.** A diferença não é capricho: guardar já é público do lado de quem guarda (a estante aparece no perfil dele, com crédito). Virar linha numa lista de "quem endossa a curadoria de fulano", na tela de fulano, é outra coisa, e ninguém consentiu com ela ao clicar em guardar. É o mesmo desenho de "quem entrou pelo seu link": rostos, e só para você. A autorização é no SQL e devolve VAZIO, nunca erro, porque erro contaria que a estante existe e tem gente dentro.
- **O sino ganhou "fulano guardou a sua estante"**, e ele diz QUAL estante: quem montou cinco não deveria abrir as cinco para descobrir. Aviso que dá trabalho é aviso que se ignora.
- **O zero não aparece.** Estante nova não mostra "0 guardaram". Quem acabou de montar a primeira estante da vida não precisa de um zero na cara: zero aqui não é informação, é um comentário.
- **O explorar continua sorteando**, e um teste garante que ele nunca ordene por quantos guardaram. Contar é uma coisa; RANQUEAR gente por popularidade é a corrida que o produto recusa.
- **A migration 0052 não foi tocada**, e ela diz o contrário disto. Migration é história e não se edita: o que valia quando ela rodou está escrito ali, e o que vale agora está no cabeçalho de `lib/listas.ts`.
- **Os dois READMEs foram atualizados** (PT e EN), nas duas linhas que prometiam o contrário. Tela nova prometendo uma coisa e README prometendo outra é o pior dos dois mundos.

A trava de IDOR foi mutada para provar que pega: sem a checagem de dono no SQL, o teste fica vermelho.

---

**2026-07-29: O Top 100 passa a contar o "adorei" privado. Veredito conta sempre; estante, só se for pública.**

O dono viu a lista errada e relatou: um livro com dois "adorei" aparecendo atrás de vários com um. Era a **Saga de Njáll**, na 22ª posição.

A investigação confirmou pelos números da produção: **da 5ª posição em diante a lista estava em ordem alfabética**, ou seja, todos empatados em um voto. O Njáll estava no meio desse bloco, contando UM. A consulta estava certa (ordena por contagem, desempata por título); o que estava errado era o que ela contava: só `visibility = 'public'`, e um dos dois "adorei" do livro era privado.

- **A regra nova tem uma linha no meio.** VEREDITO (adorei, gostei) conta pública ou privada: é opinião sobre o LIVRO, agregada sobre a comunidade inteira, e uma lista de gosto que ignora metade dos votos não é o retrato do gosto, é o retrato de quem deixou a nota aberta. ESTANTE (quantos leram, em quantas estantes mora) continua só pública: estante é um LUGAR que pertence a uma pessoa, e não uma opinião sobre o livro.
- **`adoraram` e `gostaram` andam juntas por ARITMÉTICA, e não por gosto.** `gostaram` é `value >= 4`, que inclui os adorei. Se uma contasse privado e a outra não, a tela mostraria "3 adoraram" ao lado de "2 gostaram ou adoraram", que é impossível, e o leitor concluiria que o app não sabe contar.
- **As duas telas foram mudadas juntas.** A mesma conta existe em `lib/queridinhos.ts` (a lista) e em `app/livro/[slug]/page.tsx` (a coroa e a posição). São consultas de formatos diferentes e não dá para unificar sem piorar as duas, então nasceu `lib/queridinhos.sql.test.ts`, que LÊ o código da página e quebra o build se a régua de visibilidade divergir. Sem isso, a lista põe o livro em quinto, a página dele diz outra coisa, e o app discorda de si mesmo em silêncio.
- **A frase da tela foi corrigida junto.** `/queridinhos` dizia "cada 'adorei' público conta um voto". Virou "cada 'adorei' conta um voto".

**O que isso custa, e está escrito no código:** um livro com UM veredito no Gume inteiro, e ele privado, passa a aparecer com "1". Ninguém sabe quem, mas alguém que soubesse que só uma pessoa tem aquele livro poderia deduzir a nota dela. O app permite estante pública com nota privada, então essa combinação existe. É estreito e é real; foi apresentado ao dono e ele decidiu assim, porque a alternativa é uma lista que mente sobre o gosto da comunidade. A volta atrás é uma linha.

---

**2026-07-31: O apoio passa a existir, pelo Stripe. E `is_supporter` deixa de ser uma coluna.**

A insígnia de apoiador estava de pé desde a 0012: componente, cor, moldura rosa, lugar na ordem, e um texto explicando que ela não se conquista, se paga. **O que nunca existiu foi o jeito de alguém apoiar.** `users.is_supporter` era um booleano que só o seed escrevia.

A AbacatePay foi descartada. Ela nunca chegou a existir em código: eram um bloco de `.env.example` e um comentário no `scripts/audit-security.mjs`, e os dois saíram.

- **A coluna morreu, e esse é o ponto da fatia.** A decisão que criou a insígnia prometeu que ela é **viva**: "sai sozinha no dia em que a pessoa para de apoiar, e não é concedida numa tabela que alguém teria que lembrar de limpar". Um booleano gravado por webhook **não consegue cumprir isso**, e o buraco tem data marcada: o apoio avulso vale 30 dias, e **no dia 31 o Stripe não manda evento nenhum, porque não aconteceu nada, o tempo só passou**. A coluna ficaria `true` para sempre. A alternativa seria uma faxina noturna, que é a "tabela que alguém teria que lembrar de limpar" com outro nome.
- **Agora é uma pergunta:** `ehApoiador()`, em `lib/apoio.ts`, devolve o SQL de "existe assinatura ativa ou em teste, OU `avulso_badge_until > now()`". Não há instante em que o banco discorde da verdade, porque não há nada guardado para discordar. `lib/apoio.sql.test.ts` prova o caso que justifica tudo: avulso vencido não apoia, e **ninguém precisou limpar nada**.
- **Uma regra, e não três.** A mesma função serve a insígnia (`lib/badges.ts`), a moldura (`lib/escada.ts`) e a lista (`lib/contributors.ts`). Uma regra de produto escrita três vezes é uma regra que vai divergir, e no dia em que divergisse a mesma pessoa apareceria com insígnia numa tela e sem insígnia na outra.
- **Dois testes estruturais mudaram de alvo, e ficaram mais duros, não mais frouxos.** O de `lib/badges.test.ts` exigia `is_supporter` (um booleano que não cumpria a promessa que o próprio teste defende) e passou a exigir `ehApoiador()` **e** a proibir a volta de qualquer booleano guardado. O de `lib/contributors.sql.test.ts` reconhecia a consulta de apoio pela coluna antiga, e reconheceria coisa nenhuma depois da mudança: uma trava que não enxerga nada aprova tudo em silêncio. Ele ganhou um teste irmão que **prova que ele ainda enxerga alguma coisa**.
- **Aparecer na lista é opt-in, e o padrão é não aparecer.** O prompt pedia opt-out. **Pagar não é consentir em ser publicado**, o resto do app já trata assim (resenha nasce privada), e uma lista pública que nasce cheia põe o nome de alguém numa página que ele não pediu, por ter apoiado. A caixa mora em `/perfil` e só aparece para quem apoia: perguntar a quem não apoia se ele quer aparecer numa lista da qual não faz parte não é uma opção, é uma cobrança educada.
- **A seção de apoio em `/contribuidores` parou de depender de a lista ter gente.** Com opt-in, ela nasce vazia, e a condição antiga levaria embora também o convite para apoiar: a porta sumiria justamente enquanto ninguém tivesse entrado por ela.
- **Não existe chave publicável do Stripe.** O navegador nunca fala com o Stripe: o servidor cria a sessão e manda a pessoa para a URL devolvida. Como nenhum código de cliente monta formulário de cartão, a publishable key não tem o que fazer, e **uma variável de ambiente que ninguém lê é uma variável que confunde quem for configurar**.
- **O valor livre é montado pelo app, com `price_data`.** O painel do Stripe não cria pagamento de valor aberto. A alternativa (uma Price com `custom_unit_amount`, criada por script) daria no mesmo e cobraria um passo de instalação que alguém precisa lembrar de rodar antes de o botão funcionar. Mínimo de R$ 5,00 (abaixo disso a taxa come quase tudo) e teto de R$ 5.000,00 (o campo é em reais, e o erro clássico é digitar pensando em centavos).
- **O `pnpm audit:security` não pegaria uma chave do Stripe, e agora pega.** O padrão era `sk-`, com hífen, que é o formato da OpenAI. O Stripe usa `sk_live_` e `sk_test_`, com underline, e passava batido: a varredura **parecia** proteger a chave de pagamento e não protegia nenhuma. `whsec_` entrou junto, porque vazá-lo é deixar qualquer um forjar "fulano pagou". A regra nova reprovou o próprio teste do webhook na primeira execução, que é o sinal de que ela funciona.
- **O rate limit das rotas de checkout usa o `limitar()` do banco.** O prompt sugeria um `Map` em memória, por o deploy ser em container persistente. Isso desfaria a migration 0048: um balde em memória vira um balde por instância, e com mais de uma réplica o limite não afrouxa, ele **para de existir e continua parecendo que existe**.

**O webhook é campainha, e não prova**, e é a única superfície do app em que uma requisição sem sessão muda dado de leitor. Ele está na lista de rotas públicas de `lib/surface.test.ts` com o motivo escrito, e o que faz o papel da sessão são três travas: o HMAC sobre o corpo **cru** (por isso `req.text()`, e nunca `req.json()`), a idempotência por id de evento gravada **junto** com o efeito e nunca antes, e a reconfirmação do estado na API do Stripe antes de gravar assinatura, porque um evento assinado ainda pode estar descrevendo um estado que já mudou. `lib/stripe.webhook.sql.test.ts` prova as quatro recusas (sem assinatura, forjada, segredo errado, corpo trocado depois de assinado) e que o mesmo evento duas vezes paga uma vez só.

---

**2026-07-31: A lista de apoiadores passa a nascer marcada. Eu recomendei o contrário, e o dono decidiu.**

A entrada de hoje mais acima diz "aparecer na lista é opt-in, e o padrão é não aparecer", com o argumento de que pagar não é consentir em ser publicado. **Ela está errada a partir de agora, e fica aqui porque decisão revogada também é história.** O que vale é esta.

O apoio subiu, o dono apoiou a si mesmo para testar, a insígnia apareceu, e ele não apareceu na lista. Não era bug: era exatamente o opt-in funcionando. E foi aí que ficou claro o que o opt-in custava.

- **Uma lista que existe para AGRADECER não agradece ninguém se estiver sempre vazia.** Com opt-in, o caso comum não era alguém escolhendo privacidade: era a pessoa pagar, ganhar a insígnia, e nunca descobrir que existia uma caixa em outra tela. O efeito prático não era proteção, era uma seção permanentemente vazia numa página que fala sobre reconhecimento. A primeira pessoa a passar por isso foi o próprio dono, no primeiro pagamento real.
- **O risco não sumiu, mudou de forma.** Publicar o nome de alguém numa página que ele não pediu continua sendo o perigo. Só que agora ele é uma escolha reversível, num lugar que a pessoa vê no mesmo dia em que apoia (a seção do `/perfil` só aparece para quem apoia), e desmarcar tira o nome na hora.
- **O que a lista mostra é nome e arroba**, que já são públicos no perfil de quem apoia. Ela continua sem mostrar valor, sem ordenar por nada que se leia como "este apoia mais" (a ordem é de chegada), e sem manter quem parou de apoiar, porque ela lê `ehApoiador()`, que é calculado.
- **O teste mudou de lado, e não afrouxou.** Ele exigia que quem não pedisse ficasse fora; agora exige que quem apoia entre sem pedir E que quem desmarca saia. O que ele protege é o mesmo: que a escolha da pessoa mande. Só que a escolha que precisa funcionar agora é a de SAIR, e **um opt-out cujo botão de sair não funciona é pior que um opt-in**. Os dois lados foram mutados para provar que quebram.
- **A migration 0055 não foi editada.** Ela diz o contrário disto, e continua dizendo: migration é história. A 0056 é o que vale.
- **As linhas existentes viraram `true`, e isso só é aceitável hoje.** O apoio subiu hoje, e ninguém tinha feito uma escolha explícita nessa caixa: não há consentimento sendo sobrescrito porque não havia consentimento registrado. Se esta regra mudar de novo, mude só o DEFAULT e deixe as linhas em paz, ou o `update` apaga a decisão de quem desmarcou de propósito. Está escrito dentro da própria migration, para quem for mexer não precisar achar esta entrada.

---

**2026-08-01: Nenhum painel deste app mora dentro do vidro.**

O dono abriu o Gume no celular — instalado pela tela de início, sem barra de endereço — e não achou o perfil, o sobre, o "quem faz", nem o apoiar. O menu que leva a todos eles **abria e não aparecia.**

A causa não é navegação, é material. O menu era desenhado DENTRO da barra de vidro e subia para fora dela (`absolute bottom-full`). No WebKit — o Safari, e portanto todo app instalado num iPhone — um elemento com `backdrop-filter` **recorta os filhos que passam das bordas dele**. No Chrome do computador ele aparece inteiro.

- **É o segundo bug sem rastro do celular, e é pior que o primeiro.** O da busca (ver `lib/celular.test.ts`) era um botão que não existia. Este é um botão que existe, responde ao toque e abre o nada — e quem toca não conclui "isto está quebrado", conclui "este app não tem perfil". A pessoa não reclama, ela fecha o app.
- **O bug era invisível de dentro.** Ele não existe no navegador em que o código é escrito. Só existe para quem está no telefone, que foi quem o encontrou. De novo, e pelo mesmo caminho.
- **A regra que sai daqui é de material, e não deste menu:** um painel que precisa passar da borda de uma caixa de vidro é **irmão** dela, nunca filho. O menu agora é `fixed`, desenhado fora da `<GlassBar>`, e não se pendura em ninguém. `position: fixed` não salva quem é filho: o `backdrop-filter` também cria bloco de contenção, então mudar a classe sem mudar o lugar não teria consertado nada.
- **Ganhou um apanhador de toque.** Solto na tela, o menu precisava de "tocar fora fecha" — antes ele só fechava pelo próprio botão, que agora está debaixo dele. O apanhador é invisível: ele não escurece nada, só devolve o gesto.
- **Três portas que nunca existiram no celular entraram junto:** "Quem faz", "Apoiar o Gume" e o "Painel" do idealizador. A `/apoiar` só era alcançável de DENTRO da `/contribuidores`, que por sua vez só existia na coluna do desktop: uma porta atrás de uma porta que não existe no aparelho.
- **A trava é `lib/celular.test.ts`**, que já era a casa dos buracos de celular. Ele agora exige que o painel seja desenhado depois do fim da `<GlassBar>`, que se posicione sozinho, que leve a `/eu`, `/sobre`, `/contribuidores` e `/apoiar`, e que dê para fechar tocando fora. **As duas travas foram mutadas para provar que quebram** — o menu voltou para dentro do vidro e virou `absolute`, e o teste acusou as duas. É o mesmo cuidado que o próprio arquivo documenta: a primeira versão dele já passou verde lendo um comentário no lugar do código.

---

**2026-08-01: A barra sabe quem entrou pelo servidor. `useSession()` sai.**

Na mesma sessão em que o menu do celular foi consertado, o dono relatou a outra metade: **entrando logado, na primeira página o perfil não aparecia.** É outro bug, com outra raiz.

A barra descobria quem estava logado com `useSession()`, um hook que vai ao servidor **depois** que a tela já apareceu. Até a resposta voltar, ela desenhava a versão de visitante: sem Perfil (no lugar dele, "Entrar"), sem sino, sem as estantes inventadas. Um instante depois consertava sozinha — e é por isso que o bug parece impressão de quem viu.

- **O servidor já sabia, com certeza.** O layout nem renderiza esta barra para quem não entrou: quem está deslogado leva o `PublicHeader`. Se o componente está na tela, a pessoa está logada. A tela perguntava de novo ao navegador e **acreditava mais na resposta que ainda não tinha chegado** do que no fato que o servidor tinha em mãos.
- **Não é lentidão, é mentira.** Oferecer "Entrar" a quem está dentro é a mesma mentira que o `sair` se recusa a contar quando a rede cai ("levar a pessoa embora fingindo que ela saiu"). Uma barra que erra sobre quem está dentro está errada, não devagar.
- **O celular é onde isso vira produto ruim.** O app instalado abre **frio toda vez**, numa rede de celular, e a primeira tela é justamente onde a pessoa procura o próprio perfil. No computador o intervalo passa rápido demais para alguém notar — mais um bug que só existe para quem está no telefone.
- **A identidade chega pronta**, do `getUser()` que já estava no `lib/viewer.ts`, no mesmo `Promise.all` do resto do layout. Não há estado de carregando porque não há nada a carregar, e `useSession` deixou de ser importado no app inteiro.
- **De quebra, a inicial do avatar ficou certa.** Ela era `handle={name ?? "eu"}`, porque o hook não trazia handle nenhum: quem não tinha nome nem foto ganhava a inicial de "eu", um "E" que não era dele. `getUser()` já devolvia o handle; passou a devolver a `image` também.
- **A trava é `lib/celular.test.ts`**: nada de `useSession` na barra, a identidade tem que chegar por prop, e o layout tem que passá-la. As três foram mutadas para provar que quebram. A primeira sozinha não bastava — não ter `useSession` é fácil se a barra não souber de ninguém; um teste que só proíbe não garante que sobrou o certo no lugar.

---

**2026-08-01: A barra de baixo reparte a largura. Nenhum item pede mais do que lhe cabe.**

Terceiro relato do dono no mesmo dia, e o mais simples dos três: **o PERFIL ficava depois da borda direita da tela.** Ele aparecia dando zoom para trás, porque aí a barra inteira cabe no olho. Um item que só existe com zoom não existe.

Os seis itens tinham largura própria (`px-3` mais o rótulo inteiro) e a barra distribuía o que sobrasse, com `justify-around`. Numa tela de 390pt não sobrava: medindo pela foto, os centros iam de ~50pt a ~345pt com passo de ~74pt, então o sexto cairia em ~424pt — 34pt fora da tela.

- **A causa não é o zoom nem o `viewport`.** O `width=device-width` está lá (padrão do Next). O que estourava era a soma: seis itens pediam cerca de 460pt numa barra de 358pt.
- **`flex-1 min-w-0`, e não uma letra menor.** Encolher o rótulo até caber conserta o telefone que está na mão hoje e quebra no telefone menor de amanhã, **em silêncio, exatamente como este quebrou**. Repartindo, cada item ganha um sexto EXATO do que existe: não há sobra a transbordar porque não há item que peça mais do que lhe cabe. Numa tela estreita demais o rótulo corta com reticências — o pior caso vira "EXPLORA…" em vez de um item sumido.
- **Uma medida só, para itens que são três coisas no código.** Um link de lugar, o botão da busca, o do perfil ou o de entrar: escritos separados, divergem, e bastou um `px` a mais para a conta estourar sem ninguém somar.
- **A trava não mede pixel, de propósito.** Medir largura de texto exigiria fonte, motor de layout e um aparelho concreto — e amarraria o teste ao telefone de hoje, que é o erro que produziu o bug. `lib/celular.test.ts` garante o que vale em qualquer largura: que nenhum item peça mais do que lhe cabe, que todos usem a mesma medida, e que o rótulo corte em vez de vazar.
- **A primeira versão do teste contou a tela em vez do código** e quebrou na barra que estava certa: são quatro usos da medida para seis itens, porque os quatro lugares saem de um `.map` e o perfil e o entrar são o mesmo lugar visto por duas pessoas. Está escrito lá, para não custar a mesma meia hora de novo.

**Fica em aberto, e é do dono:** seis itens numa barra de celular é muito. Eles cabem agora, mas o rótulo desceu para 9px para caber. A alternativa é tirar um — e a candidata óbvia, a busca, é a que menos pode sair, porque `lib/celular.test.ts` existe justamente porque ela já foi inalcançável no telefone uma vez.

---

**2026-08-01: A barra do celular perde o rótulo. Eu recomendei o contrário, e o dono decidiu.**

A entrada logo acima deixou uma pergunta em aberto: seis itens cabiam, mas ao custo de a letra descer para 9px. Foram postas três saídas — deixar como estava, tirar a palavra, ou tirar um item. **O dono escolheu tirar a palavra**, e eu tinha recomendado a primeira.

- **O que isso custa está escrito no código, e é real.** Uma bússola e duas pessoas não dizem "explorar" e "amigos" sozinhas. Quem chega pela primeira vez vai tocar para descobrir, e é um custo que a palavra pagava. **A volta atrás é devolver o `<span>`: duas linhas.**
- **O `aria-label` mudou de papel, e é a parte que não podia passar batida.** Ele era reforço; virou **o único nome** de cada item. Sem ele, quem usa leitor de tela ouve "link" seis vezes e o app deixa de ter navegação — e ninguém que enxerga a tela perceberia, porque para o olho continua tudo no lugar. É o mesmo feitio dos outros bugs deste dia: o que não deixa rastro.
- **"Onde estou" não pode mais ser só a cor.** Um traço de 1.5px trocando de cinza para branco era um sinal fraco quando havia palavra embaixo confirmando; sozinho é fraco demais. O item aceso ganhou a MESMA superfície que o app inteiro usa para controles (`surface-2`), o traço engrossou (1.5 → 1.75) e o ícone cresceu (20 → 22). **Nada inventado:** é o vocabulário que já existia, e a alternativa seria desenhar um elemento novo para um problema que o sistema já resolve.
- **A repartição de largura FICA**, mesmo sem a pressão que a justificava. Ela é o que garante que o sexto item exista em qualquer tela, e o dia em que a barra ganhar um sétimo item — ou o rótulo de volta — é justamente o dia em que ninguém vai lembrar de somar.
- **A trava trocou de alvo em vez de ser apagada.** "O rótulo corta em vez de vazar" protegia uma palavra que não existe mais. No lugar dela, `lib/celular.test.ts` passou a exigir que todo item tenha `aria-label` e que rótulo nenhum volte à tela sem alguém mudar a trava e dizer por quê. É mais duro que a anterior, e não menos. As duas metades foram mutadas para provar que quebram.

---

**2026-08-01: O Top 100 ordena pelo número que ele mostra. O voto passa a ser "gostei ou adorei".**

O dono viu livros com o coração marcando DOIS embaixo de livros com o coração marcando UM, e relatou como erro de ordenação. Não era: **a lista ordenava por um número que ela nunca mostrava.**

A ordem contava só "adorei" (veredito 5). O card imprimia "gostaram ou adoraram" (veredito 4 ou 5). A Saga de Njáll, com um "adorei" e um "gostei", valia UM voto e mostrava DOIS corações.

- **Estava certo pela régua velha, e era ilegível para qualquer pessoa.** Inclusive para quem escreveu a régua: o dono leu a própria tela como todo mundo leria — o coração é o voto. Ninguém abre o código para entender uma lista. A pessoa conclui que o app não sabe contar.
- **A saída escolhida pelo dono foi ordenar pelo número exibido**, e não exibir o número que ordenava. O voto agora é "gostei (4) ou adorei (5)", em um número só. **O custo: "gostei" pesa igual a "adorei", e um livro muito gostado passa um livro pouco adorado.** Aceito em troca de uma lista que se lê sem nota de rodapé.
- **Dois números viraram um, e isso é a correção de verdade.** `adoraram` sumiu do código: ele só existia para ordenar, nunca era impresso em tela nenhuma (na página do livro ele era selecionado e descartado). Um número invisível que decide a ordem é uma armadilha esperando o próximo leitor — e o próximo leitor foi o dono.
- **As duas telas mudaram juntas**, porque a mesma conta vive em `lib/queridinhos.ts` (a lista) e em `app/livro/[slug]/page.tsx` (a coroa e a posição). Os textos mudaram junto: "cada 'adorei' conta um voto" virou "cada 'gostei' e cada 'adorei' conta um voto", e o vazio deixou de dizer "quando alguém adorar".
- **A trava trocou de alvo em vez de ser apagada.** Ela exigia que `adoraram` e `gostaram` não divergissem em visibilidade; eles deixaram de ser dois. Agora exige que as duas telas usem o MESMO limiar e que nenhuma volte a ordenar por "adorei" sozinho. Ganhou também o caso exato da tela: um livro com um "adorei" e um "gostei" vale dois e passa na frente de quem tem um. Mutada para provar que quebra.

---

**2026-08-01: A capa de uma resenha é o exemplar de quem escreveu.**

O dono abriu o próprio perfil e viu o Frankenstein com **duas capas na mesma página**: a verde da Antofágica em "o que eu adorei", e outra em "o que eu escrevi".

Não era capa errada. Era a mesma pergunta — "qual edição é este livro?" — respondida de dois jeitos na mesma tela. A estante sabe qual edição é a sua e desenha ela. A resenha usava `capaDaObra`, que é "a edição mais antiga que alguém importou" e não tem relação nenhuma com o livro que a pessoa leu.

- **A resposta certa é a que a pessoa já deu.** Uma resenha não é sobre a obra em abstrato: é sobre o exemplar que ela teve na mão, com aquela tradução e aquela capa. Ela escolheu a edição ao pôr na estante. Não existe regra global que acerte mais do que essa escolha — procurar uma "regra melhor" seria inventar critério para uma pergunta que já tinha dono.
- **A regra da comunidade continua existindo, e continua sendo a mais antiga com capa.** Ela vale onde não há uma pessoa em particular olhando (explorar, quem está lendo). É arbitrária, e é ESTÁVEL — que é o que importa ali: uma capa que muda a cada visita faz a pessoa achar que abriu o livro errado.
- **O fallback não é zelo.** A escolha pode faltar: quem resenhou sem pôr na estante, ou entrada antiga sem edição gravada — **eram 41 em produção**. Sem o `coalesce`, essas resenhas ficariam sem capa nenhuma, trocando um bug visível por um pior.
- **Conferido contra produção, não contra o raciocínio.** Das quatro resenhas do dono, só o Frankenstein mudou de capa; as outras três já batiam e continuaram idênticas. Uma correção que muda o que estava certo não é correção, é troca de bug.

**O que isso NÃO conserta, e está aqui para não ser esquecido:** as ~10 outras telas continuam usando a edição mais antiga importada. Para as telas da comunidade isso é certo. Para as telas de uma pessoa (a parede dela, o feed dela) é o mesmo erro do Frankenstein esperando para ser relatado.

---

**2026-08-01: Pôr na estante grava QUAL edição. Ela vinha sendo descartada.**

O dono buscou pelo ISBN da Metamorfose da Antofágica, achou, pôs na estante — e a página do livro mostrou uma edição da Leya de 2013, com a capa de uma terceira. Ele não errou nada.

`shelve()` gravava só (usuário, obra, status). **A edição que o leitor acabou de identificar era descartada na última linha do caminho** — o `editionId` estava em mãos na função que chama, e nem era passado adiante.

- **O estrago não aparece onde nasce.** Nasce ao prateleirar e aparece noutra tela, outro dia, como "este app mostra o livro errado". Sem edição gravada, a página do livro cai na "primeira edição que tiver capa", e uma obra empacota edições de editoras diferentes — há obra no acervo com 36 editoras juntas.
- **A importação sempre gravou** (`lib/import/aplicar.ts`), e é por isso que o buraco era pequeno em produção — 41 de 793 — e passou despercebido: quem importa a estante inteira fica bem; quem cadastra um livro à mão fica com o registro cego. Um bug que só atinge o caminho manual é um bug que o dono encontra sozinho, tarde.
- **O `coalesce` é quem manda, e é a parte que quase não existiu.** O conserto óbvio — gravar a edição no conflito — traz um bug pior de brinde: quem escolheu a edição a dedo no "qual é a sua" perderia a escolha ao clicar em "lido", porque reprateleirar reescreveria a linha com o palpite da busca. Trocar "o app esqueceu a sua edição" por "o app desfez a sua escolha" é andar para trás. O palpite preenche o branco e nunca sobrescreve uma decisão.
- **A trava mora em `lib/prateleirar.sql.test.ts`**, contra o Postgres de verdade, porque é lá que o conflito acontece. Quatro casos: a edição entra; reprateleirar não desfaz a escolha; o status muda mesmo assim (proteger a edição não pode congelar outra coisa); e prateleirar SEM edição não apaga a que já existia. Mutado: trocar o `coalesce` por `excluded.edition_id` derruba dois dos quatro.

---

**2026-08-01: O endereço antigo de uma obra continua chegando nela. Migration 0057.**

O endereço de uma obra carrega o nome do autor. Quando o autor está errado — e estava, a importação gravou a TRADUTORA da Metamorfose como autora —, corrigir a ficha **não conserta o endereço**: `metamorfose-sheila-koerich` continuava na barra do navegador, com o nome de quem não escreveu o livro.

O dono pediu para trocar. Trocar e pronto seria substituir uma verruga visível por uma perda silenciosa.

- **Um link quebrado é pior que um link feio.** O feio ainda leva ao livro. Todo link já compartilhado — num grupo, num favorito, num buscador — passaria a dar "não encontrado", e quem clicou não teria como saber por quê. O ganho seria estético e o custo, de outra pessoa.
- **É TABELA, e não uma coluna `slug_antigo`.** Uma obra pode ser renomeada mais de uma vez, e cada endereço que ela já teve precisa continuar chegando. Uma coluna guardaria só o penúltimo, e o antepenúltimo — que também está no histórico de alguém — morreria em silêncio.
- **A chave primária é o slug**, então dois endereços iguais não podem apontar para obras diferentes. O banco recusa antes de a gente ter chance de errar, e o redirecionamento nunca vira sorteio.
- **`renomearObra()` faz as duas coisas numa transação só**, porque são uma coisa. Gravar o novo sem registrar o velho deixa links órfãos; registrar o velho sem trocar o novo deixa uma obra redirecionando para si mesma. Separadas, uma delas falha sozinha um dia e o sintoma aparece no navegador de outra pessoa, meses depois.
- **O caso que transforma o conserto num bug pior: renomear A→B→A.** Sem cuidado, "A" fica registrado como endereço antigo de uma obra que agora se chama "A", e a página redireciona A para A — laço. O navegador desiste e mostra erro no lugar de um livro que existe: pior que o original, porque antes o link ao menos abria alguma coisa. Por isso o `delete` do endereço novo dentro da transação.
- **É 308 e não 307.** A mudança é definitiva: buscador e navegador passam a guardar o endereço novo em vez de bater aqui para sempre. O código de status é uma afirmação sobre o mundo, e essa é a verdadeira.
- **A trava (`lib/enderecos.sql.test.ts`) cobre os dois lados**: o banco (o antigo chega, o laço não nasce) e a TELA — que a página realmente pergunte antes de desistir. Sem essa última, a tabela existiria, os testes passariam, e o leitor continuaria vendo "não encontrado": a trava inteira viraria enfeite. As duas foram mutadas.

**Aplicado em produção:** três obras renomeadas, com os endereços antigos guardados e redirecionando.

---

**2026-08-01: A estante também prova que tem gente aqui. E quem está invisível passa a saber.**

O dono relatou que "tem várias pessoas com estante que não aparecem no explorar". A causa era um campo: `email_verified`.

Quem entra por Google ou GitHub ganha a verificação de graça — o provedor confirma. Quem entra por e-mail e senha precisa clicar num link, e **em produção quatro dos sete nunca clicaram**. Um deles tinha montado a **maior estante do site: 503 livros**, 278 públicos e com capa.

Ele estava fora do explorar, fora das listas, fora do "pessoas" e fora dos buscadores. **Nenhuma tela do app dizia isso a ele.** Não havia erro nem aviso: ele simplesmente não existia para os outros, e o único sintoma era ninguém nunca segui-lo. Uma cidadania de segunda invisível, que só dá para enxergar de fora — e foi de fora que o dono viu.

Foram apresentadas três saídas (avisar; aceitar a estante como prova; exigir verificação para usar o app). O dono escolheu **as duas primeiras juntas**, e é a combinação certa: avisar sozinho deixaria a melhor estante do site esperando um clique que não acontece há meses; aceitar a estante sozinho consertaria em silêncio, e silêncio foi o que criou o problema.

- **O portão continua existindo.** A resposta preguiçosa seria remover o filtro. A nota original tem razão: com cadastro aberto, o explorar é a vitrine, e uma vitrine sem portão vira fazenda de spam. Remover resolve hoje e apodrece a tela no dia em que o cadastro abrir.
- **A estante é uma prova mais cara que o clique.** O e-mail verificado prova que existe uma caixa de entrada. Vinte livros públicos com capa provam que alguém sentou e montou. Exigir só o primeiro era confundir o MEIO com o FIM. Contra os dados reais o corte separa bem: o leitor dos 503 entra, e os dois cadastros com dois livros cada continuam fora — dois livros não distinguem uma pessoa de um ruído.
- **A regra estava escrita à mão em QUATRO consultas**, e é por isso que ninguém mediu o buraco: consertar uma não consertava as outras três. Agora mora em `lib/descoberta.ts`, uma vez.
- **O aviso fala de gente, não de cadastro.** Não é "verifique sua conta", é "a sua estante não está aparecendo para quem ainda não te conhece" — a primeira é burocracia, a segunda é o que está acontecendo de fato. Ele não se fecha (fechar não conserta nada), aparece só para a própria pessoa (contar a um visitante que o dono da página tem pendência seria expor a pendência dele), e diz **quantos livros faltam** pelo outro caminho.
- **O reenvio não aceita endereço como parâmetro.** Ele reenvia para o e-mail da SESSÃO. Uma ação que aceitasse um endereço seria um cano para mandar e-mail em nome do Gume para qualquer pessoa: máquina de spam gratuita, assinada por nós.
- **Uma trava foi corrigida por reprovar o código certo.** A primeira versão procurava `users u` nos 1200 caracteres antes de cada uso, e reprovava `lib/listas.ts`, onde o join mora dentro de um helper. Fingir que uma busca de texto entende SQL montado por funções é uma trava que reprova o certo e acaba afrouxada por irritação — que é como travas morrem. Ela passou a verificar o que enxerga de verdade, e quem prova que a regra roda são os três testes contra o banco.

---

**2026-08-01: O painel ganha a base pessoa a pessoa. E o cartão passa a dizer o que conta.**

Duas coisas do painel, no mesmo dia.

**1. "Contribuidores: 2" estava certo, e o nome estava errado.** O dono estranhou o número porque no GitHub só ele tinha contribuído. Os 2 são ele e o `lucas`, que consertaram fichas de livro DENTRO do app. O painel já mostra os do GitHub num indicador separado ("escreveram código"), então a mesma tela usava o termo guarda-chuva ao lado do termo específico — e num projeto cuja tese é "um app que se constrói", "contribuidor" é justamente a palavra que significa as duas coisas. **Um número certo com nome ambíguo é pior que um número errado: no errado a pessoa desconfia; no ambíguo ela acredita na leitura que fez.** O cartão virou "consertaram o acervo", com uma linha dizendo o que entra na conta.

**2. A base, pessoa a pessoa,** pedida pelo dono: quem está aqui, e-mail, tamanho da estante, última vez, e se está engajado.

- **O engajamento é uma DESCRIÇÃO, e não uma nota.** Quatro estados — `sumiu`, `espiando`, `lendo`, `construindo` — que dizem o que a pessoa está fazendo, porque é isso que responde "o que eu construo agora". Uma nota de 0 a 100 diria quem é "melhor leitor", e não existe leitor melhor que outro. `espiando` não é pior que `lendo`: é outro momento.
- **Sumido vem primeiro na classificação**, de propósito: quem não volta há um mês não é "construindo" por causa de uma resenha de abril. O estado é sobre agora.
- **A regra vive no SQL, e não na tela**, porque a mesma classificação vai para o relatório em markdown que o painel exporta. Duas definições de "engajado" divergiriam no primeiro dia.
- **Isto é a sala privada, e tem que continuar sendo.** Mostra e-mail, e o Gume se recusa a ordenar gente por esforço em qualquer superfície do produto (`lib/queridinhos.ts`). Está atrás de `assertIdealizador()`. O que aqui é diagnóstico vira, em qualquer outra tela, ranking de leitor: está escrito no código para quem for reaproveitar a consulta.
- **A coluna "invisível" quase nasceu mentindo.** Ela ia olhar só `email_verified` — e depois da mudança de hoje o leitor dos 503 livros aparece SEM ter confirmado, porque a estante prova. Uma coluna assim chamaria de invisível quem está visível: o painel mentindo na cara do dono, que é exatamente o erro que este dia inteiro passou consertando. Ela usa a mesma régua de `lib/descoberta.ts`, e foi conferida contra produção.

---

**2026-08-01: O autor-lixo foi apagado, e não adivinhado. Autor nenhum é honesto; autor errado é mentira.**

"Jonathan C. Young" tinha **53 obras** no acervo, sem relação nenhuma entre si: *Antifrágil* (Taleb), *A Torre Negra* (King), *Cartas de um Diabo a seu Aprendiz* (C.S. Lewis), *As armas da persuasão* (Cialdini). É um registro genérico da Open Library que a importação trouxe e espalhou.

Duas dessas obras estavam em estante e foram corrigidas com autor de verdade (Cathy O'Neil, Stephen Hawking), porque para elas havia resposta confiável. As outras 51, não.

- **A opção óbvia era buscar o autor certo de cada uma, e ela foi recusada.** A auditoria do mesmo dia mostrou o que a fonte externa devolve: tradutor no lugar do autor, editora ("Random House Mondadori" como autor de *Orientalismo*), fotógrafo, e `[author not identified]`. Em 28 divergências de autor, **~22 eram erro da fonte, não do Gume**. Trocar 51 autores por palpites dessa qualidade seria substituir uma mentira conhecida por 51 mentiras novas, mais difíceis de achar porque parecem plausíveis.
- **Autor nenhum é um estado honesto.** A ficha fica incompleta e diz que está incompleta; alguém pode consertar depois, e o app já tem correção de ficha por leitor. Autor errado é uma afirmação falsa que o leitor acredita — e ninguém confere o que não parece suspeito.
- **Nenhuma das 51 estava em estante, coleção ou resenha.** Foi verificado ANTES de tocar: zero, zero, zero. Elas só sujavam a busca. Se alguma estivesse na estante de alguém, a decisão teria sido outra — mexer no livro que alguém diz ter lido é mexer na memória dele.
- **22 endereços carregavam o nome errado e foram limpos**, com o antigo guardado e redirecionando (migration 0057). **Dois não foram**: o endereço limpo já estava ocupado por outra obra, e o guarda de colisão preferiu manter a verruga a derrubar a transação inteira por causa de dois casos.
- **O registro do autor foi apagado**, senão ele continuaria aparecendo na busca de autores sem obra nenhuma.

**Fica registrado, e é maior que isto:** o acervo tem **5.699 obras sem autor**. A varredura por outros registros-lixo com o mesmo padrão não achou nenhum (os nomes com muitas obras são Machado de Assis, Camilo Castelo Branco, Fernando Pessoa — legítimos). O buraco de autores é de cobertura, e não de contaminação.

---

**2026-08-01: A busca passa a olhar a tabela de identificadores. O ISBN-10 existia e era ignorado.**

A fila de pedidos — "cada linha é alguém que procurou um livro e não achou" — tinha 33 entradas. **Treze eram livros que o acervo JÁ TEM.**

A fila não estava contando o que falta no acervo: estava contando o que a busca não acha.

- **A causa: `editions.isbn13`, e só ele.** Quem digitasse o número de dez dígitos impresso na contracapa não achava nada. O app respondia "não temos" e ainda registrava um pedido — a lista do que trazer para o acervo enchia de livro que já está no acervo.
- **A tabela certa já existia, cheia, e não era consultada.** `identifiers` guarda todo nome externo que uma edição atende, e o comentário dela no schema já dizia o porquê: *"an ISBN is the only identifier a reader can hold in their hand"*. A IMPORTAÇÃO a lia. A BUSCA, nunca. São **471.354 linhas em produção, 90.298 delas ISBN-10**, sem uso nenhum. Não faltava dado — faltava perguntar.
- **`in (subconsulta)` e não `exists` com `or`:** a chave primária de `identifiers` é (kind, value), então a subconsulta cai direto no índice. Um `or` atravessando duas tabelas unidas não usaria índice nenhum, e a busca roda a cada tecla digitada.
- **Os 15 pedidos já atendidos foram MARCADOS, e não apagados.** O histórico do que as pessoas procuraram é o dado mais útil que elas dão de graça, e apagá-lo para deixar a lista bonita seria queimar a única evidência de que a busca falhava. `atendida_por` fica nulo de propósito: ninguém trouxe esses livros — eles já estavam aqui.

**Sobraram 20 pedidos de verdade.** E eles contam outra coisa: metade é digitação parcial ("ux ressea", "veias abrrta", "negocie como sua vida") ou busca por pessoa ("gabistec", "gabisteca"). A fila registra tentativa interrompida como demanda não atendida, e isso ainda infla a lista — assunto próprio, e menor que este.

---

**2026-08-01: "Desconhecido" é o que a TELA escreve. O banco continua dizendo `null`.**

Obra sem autor desenhava nada — o espaço do nome ficava vazio, e vazio lê como "faltou preencher". Para a *Saga de Njáll*, a *Vida de Esopo* ou a *Saga de Gunnlaug* isso é falso: elas são anônimas, e a ficha está completa. O dono pediu "Desconhecido".

- **A saída óbvia era criar um autor com esse nome, e ela foi recusada.** Uma linha em `authors` chamada "Desconhecido" recriaria exatamente o registro-lixo que este mesmo dia apagou: "Jonathan C. Young" tinha 53 obras sem relação nenhuma, com página de perfil, nome clicável e lugar na busca de autores. Um "Desconhecido" com centenas de obras seria a mesma coisa — só que de propósito.
- **A distinção importa para consertar.** Com `null` dá para listar o que ainda falta atribuir; com um autor de mentira, tudo ficaria pendurado nele e o buraco sumiria de vista. Foi assim que se descobriu que das 5.699 obras sem autor, só **10** estão em estante de alguém.
- **A palavra nunca é link.** Não há para onde ir, e um nome sublinhado que não leva a lugar nenhum é a promessa quebrada que a página do autor já tinha consertado uma vez.

---

**2026-08-01: Autores duplicados fundidos pela função do app, e não por um script paralelo.**

O acervo tinha **7.917 nomes de autor duplicados, gerando 9.062 registros a mais** de 123.878 — cerca de 7%. A causa é dano de codificação na importação: "Se rgio Buarque de Holanda", "Aure lio", "Jose  Eduardo Agualusa" com espaço duplo, "Maura Lopes Canc̃ado". Sérgio Buarque de Holanda existia **seis vezes**.

- **A fusão em massa dos 7.917 foi recusada.** Nomes que normalizam igual nem sempre são a mesma pessoa, e fundir errado junta a obra de duas pessoas diferentes — estrago pior que a duplicata e mais difícil de desfazer. Foram feitos só os **25 grupos que têm obra em estante de alguém**: é o que aparece na tela hoje, e é revisável a olho.
- **Rodou pela `fundirAutores()` do app**, e não por um script que replicasse a lógica. Ela recusa quando os dois autores têm o mesmo livro, move as obras ANTES de apagar a linha (`author_id` é `on delete set null`: apagar primeiro deixaria os livros órfãos em silêncio), e guarda o nome que sai como APELIDO buscável do sobrevivente — quem procurar pela grafia velha continua achando. Reescrever isso num script seria criar uma segunda definição de "fundir", que divergiria da primeira: o erro que este dia inteiro passou consertando.
- **27 fusões, todas no log de correções**, assinadas pelo dono e reversíveis.
- **Dez grupos foram RECUSADOS pela própria função**, e a recusa está certa: os dois autores têm o mesmo livro, então fundir exige fundir as OBRAS antes. Isso mexe na estante de gente, e é decisão caso a caso — não de varredura.

**A primeira execução estourou o tempo pela metade.** Como cada fusão é uma transação própria, 14 grupos ficaram feitos e 11 não. Foi conferido o estado real antes de repetir, em vez de assumir que nada havia sido aplicado — a segunda passada encontrou 11 grupos, não 25.

---

**2026-08-01: Os 16 livros de 2016-2017 entraram. Viraram 15, e a data é um ANO.**

O dono passou uma lista com 16 livros que leu entre 2016 e 2017 e nunca cadastrou.

- **Passou pelo `aplicar()` do app**, o mesmo caminho do Goodreads e do StoryGraph, e não por `insert` à mão. Ele acha ou cria a obra, grava a EDIÇÃO, abre a leitura e devolve relatório do que perdeu. Escrever isso à parte seria uma segunda definição de "importar". Resultado: **15 entraram, nenhuma ficha nova** — o acervo já tinha todos os 15.
- **Dezesseis viraram quinze, e está certo.** Os itens 4 e 7 eram *Aleph* e *O Aleph*: a MESMA edição da Sextante, mesmo ISBN, com duas artes de capa. `editions.isbn13` é único, e deve ser: duas artes não são duas edições.
- **A data é 2017 com precisão de ANO**, e o caminho para lá importa. Passar "2017-01-01" pelo importador gravaria precisão `day`, e o app passaria a acreditar que os quinze foram terminados em 1º de janeiro — a estatística de paciência contaria um dia inventado, que é exatamente o que a migration 0051 criou a coluna de precisão para impedir. Então a leitura entrou SEM data e o ano foi gravado depois, com `ended_precision = 'year'`.
- **O parser de CSV do app faz a mesma recusa, e está certo:** ele devolve `null` para "2019" em vez de inventar um dia. Meio ano de erro possível, declarado, contra a alternativa de o livro não existir na estante.
- **O `update` só tocou leitura sem data nenhuma.** Uma leitura antiga do dono, de 2022 e já com precisão de ano, ficou intacta — foi conferido depois de rodar. Um `update` largo teria trocado um fato por um palpite.
- **As capas da lista foram IGNORADAS de propósito.** Elas vinham da Amazon e do Skoob, e nenhum dos dois está na lista de origens aceitas de `lib/imagens.ts`: a CSP bloquearia, a capa entraria no banco e não apareceria na tela. **Pior que capa nenhuma, porque parece que funcionou.** Buscadas nas fontes permitidas pelo ISBN, só 1 das 10 tinha capa — as outras 9 são edição brasileira que nem Google nem Open Library cobrem, o mesmo muro dos outros 231.

---

**2026-08-01: Dá para guardar a curadoria da casa. Migration 0058.**

Guardar a lista de outra pessoa já existia; a curadoria do Gume não tinha o gesto. O dono pediu "igual já fizemos com as listas das pessoas".

- **Não deu para usar `collection_saves`, e o motivo é o que a curadoria É.** A chave estrangeira dela aponta para `collections`, e o Top 100 **não é uma coleção**: ele é calculado a cada visita, sem linha em tabela nenhuma — e é exatamente isso que garante que ninguém o edita e que ele se refaz quando a comunidade muda de gosto. Materializá-lo numa coleção para caber no mecanismo antigo seria **mudar o que a coisa é para caber no jeito de guardar**. A lista continua calculada; o que se guarda é o ponteiro.
- **A chave é o NOME da lista, e não um booleano no usuário.** `guardou_os_queridinhos boolean` resolveria hoje e travaria amanhã: a segunda lista editorial exigiria outra coluna. Com a chave, uma lista nova é uma linha em `CURADORIAS`, e não uma migration.
- **Sem chave estrangeira, a validação tem que ter DUAS pontas.** O banco aceitaria `chave = 'qualquer-coisa'`, e uma linha órfã não é abstração: é um item guardado que aparece no perfil de alguém e não abre. Então a ESCRITA recusa chave desconhecida **e** a LEITURA filtra o que não reconhece — porque o dado sobrevive ao código, e uma lista editorial aposentada amanhã deixa linhas para trás. A linha continua no banco (o dado é da pessoa; apagar em silêncio seria pior), só não vira card quebrado. As duas pontas foram mutadas.
- **No perfil ela é uma LINHA, e não um card.** Ela não tem dono para creditar (é da casa) nem capas próprias — as capas dela são as do momento e mudam sozinhas, e um card com capas que trocam sem ninguém mexer parece defeito.
- **A trava do repo pegou um buraco meu.** As duas ações de servidor nasceram com `getViewer()`, que só diz quem está olhando. `lib/acoes.test.ts` reprovou com a frase certa: *uma escrita sem teto é um formulário de spam*. Viraram `getActor()`, que conta a escrita por dentro. **Quem percebeu foi o teste, e não eu.**

---

**2026-08-01: As obras duplicadas fundidas — só as que não estão na estante de ninguém.**

Dez fusões de autor estavam travadas pela própria `fundirAutores()`, que recusa quando os dois autores têm o mesmo livro. Destravar exigia fundir as OBRAS antes.

**A regra veio do dono: fundir obra que alguém tem na estante mexe no livro dele, e isso não se faz por varredura.** Das 24 obras que travavam, **21 não estavam na estante de ninguém** e foram fundidas; as 3 restantes (*O cortiço*, *80 anos de poesia*, *Raízes do Brasil*) ficaram intocadas.

- **A obra absorvida é sempre a do autor não-canônico, e é a que está livre**, então nenhuma linha de estante muda de lugar. A trava é uma cláusula na consulta, e não uma boa intenção.
- **Com as obras fora do caminho, mais 10 autores foram fundidos.** O total do dia é **61 correções no log**, todas assinadas e reversíveis. Sobram 3 grupos, travados pelas 3 obras que estão em estante — e eles ficam assim até alguém decidir caso a caso.

---

**2026-08-01: Livro sem capa PEDE uma, em voz alta.**

Sobraram 231 livros que estão na estante de alguém e não têm capa em fonte pública nenhuma. Foram tentados três caminhos: o ISBN na Open Library, o ISBN no Google Books, e a busca por título e autor nas duas. São edições brasileiras pequenas que essas bases não cobrem. **Não existe API que resolva** — existe gente com o livro na mão.

- **O formulário já existia, e o convite também. Num lugar onde ninguém lê.** O lápis de "arrumar este livro" tinha a dica certa (`title="faltou capa, ou tem algum dado errado? você mesmo ajeita"`), e `title` **não aparece no celular** e ninguém lê no computador. Pedir num lugar invisível é não pedir.
- **Quem abre a página de um livro sem capa costuma ser exatamente quem o tem.** O pedido vai onde a falta aparece, e abre o formulário que sempre esteve ali. Nenhum mecanismo novo: só uma porta visível para o que já existia.
- **O convite é CONDICIONAL.** Um pedido permanente em toda página vira ruído, e ruído é o que faz a pessoa parar de ler os avisos do app — aí o próximo, o que importa, também não é lido.
- **A trava tem três partes**, e a terceira é a que salva: o convite existe, é condicional, **e a página avisa o componente quando a capa falta**. Sem essa última, o convite existiria no código e não apareceria para ninguém.
- **A trava de VOZ do repo reprovou meu texto**, e com razão: eu usei travessão, que a casa proíbe em texto de tela. Trocado por dois-pontos. É a segunda vez no dia que um teste estrutural pega uma coisa que eu não veria.

**E uma inconsistência minha foi corrigida junto:** o cartão da curadoria ainda dizia "os cem livros que a comunidade mais adorou", texto de antes de o voto virar "gostei ou adorei". Mudar a regra e esquecer a legenda é como o app passa a discordar de si mesmo.

---

**2026-08-01: Amazon e Skoob entram nas origens de imagem. E as 3 fusões que tocam estante foram feitas.**

Duas autorizações do dono, no fim do dia.

**1. A lista de origens de imagem cresceu, e o preço está escrito nela.** 231 livros em estante de gente de verdade não tinham capa em fonte nenhuma das permitidas: são edições brasileiras pequenas que a Open Library e o Google Books não cobrem. A Amazon e o Skoob cobrem.

- **Cada host aqui é um endereço que o navegador passa a aceitar como origem de imagem.** A lista é curta de propósito: quanto mais larga, mais lugares de onde uma imagem pode vir sem ninguém ter olhado. Foi por isso que ela não foi mexida antes de o dono decidir.
- **`skoob.s3.amazonaws.com` é o host EXATO, e nunca `*.amazonaws.com`.** O S3 é aluguel: o curinga abriria a porta para qualquer pessoa que alugue um balde lá, que é o mundo inteiro. Um curinga ali não seria conveniência — seria a lista deixando de existir.
- **11 capas da lista original do dono entraram** assim que a porta abriu. Elas tinham sido deliberadamente ignoradas na importação, porque uma capa que o navegador bloqueia é pior que capa nenhuma: parece que funcionou.

**2. As 3 obras duplicadas que estavam em estante foram fundidas** — *O cortiço* (brunoanken), *80 anos de poesia* (alexssander), *Raízes do Brasil* (o dono).

- **A conferência foi feita ANTES, e é a que importava:** nenhuma das três pessoas tinha as DUAS fichas. `fundirObras()` recusaria nesse caso, e com razão — seria um livro colidindo com ele mesmo na estante de alguém.
- **A contagem de livros de cada pessoa foi medida antes e depois de cada fusão, uma a uma.** 503, 126 e 157: iguais dos dois lados. Fundir não pode custar um livro a ninguém, e "não pode" só vale se alguém conferir.
- **Com elas fora do caminho, os últimos 3 autores duplicados foram fundidos.** Não sobra nenhum grupo duplicado entre os autores que têm obra em estante. O *Raízes do Brasil* do dono agora aponta para o Sérgio Buarque de Holanda de verdade, com 29 obras, em vez do registro de 2 obras com o nome sem acento.

**67 correções no log hoje**, todas assinadas e reversíveis.

---

**2026-08-01: O limite de login volta a ser por pessoa. `x-real-ip`, medido e não chutado.**

Um aviso nos logs do Railway dizia que o Better Auth não conseguia descobrir o IP de quem chega e caía num balde único por rota. Traduzido: **quem martelasse o login derrubaria o login de todos os leitores.** Uma negação de serviço na porta de entrada, ao alcance de qualquer um, e invisível — nada na tela diz que o limite é compartilhado.

- **A causa está no código do Better Auth**, e não numa suposição: sem `trustedProxies`, uma cadeia de `x-forwarded-for` com mais de um salto é DESCARTADA, porque o primeiro IP é escrito por quem manda a requisição. Aqui a cadeia tem dois saltos.
- **Este conserto ficou pendente o dia inteiro por recusa em chutar**, e a recusa estava certa: errar o valor para mais é PIOR que não fazer nada — qualquer um forjaria o cabeçalho, ganharia um balde só seu, e o limite deixaria de existir com cara de configurado.
- **Então foi medido**, com um log temporário em produção:

  ```
  x-forwarded-for : "187.35.254.151, 152.233.23.194"   (dois saltos)
  x-real-ip       : "187.35.254.151"                    (um valor só)
  ```

- **E a medição que decidiu foi a segunda:** valor único só serve se não puder ser forjado. Uma requisição enviada com `x-real-ip: 1.2.3.4` e `x-forwarded-for: 9.9.9.9` chegou ao app com o IP REAL nos dois. **O Railway sobrescreve os dois cabeçalhos e joga fora o que o cliente escreveu.** Sem esse segundo teste, a configuração seria uma porta aberta com aparência de fechadura.
- **`trustedProxies` com o IP do proxy foi descartado:** os endereços de borda do Railway são vários e mudam, e uma lista desatualizada falha fechado — voltando ao balde compartilhado sem ninguém notar.
- **Degradação segura para quem hospeda o próprio Gume:** atrás de outro proxy o cabeçalho pode não chegar, e aí o Better Auth volta ao balde compartilhado — o mesmo comportamento de antes, e nunca um limite falsificável. Degradar para o que já existia é seguro; degradar para "cada um escolhe o próprio balde" não seria.
- **A trava existe porque é uma linha que não faz nada de visível.** Se ela sumir, o app continua abrindo, o login continua funcionando, e a proteção evapora em silêncio. `lib/limite-de-login.test.ts` também proíbe `x-forwarded-for` ali (seria pior que nada) e verifica que o log temporário da medição saiu.

---

**2026-08-01: A vitrine de gente sobe a régua, e quem chega abre na curadoria.**

O dono relatou: *"quando a pessoa loga e não segue ninguém, primeira vez, aparecem um monte de estante/perfil de gente aleatória, sem foto."*

Medido em produção: três estantes de verdade (316, 142 e 99 livros) misturadas com **seis quase vazias**, de 2 a 5 livros, a maioria sem foto e sem bio. Uma delas era de alguém que **nunca voltou** depois de se cadastrar.

- **O corte era DOIS livros com capa.** Ele foi feito para barrar o vazio absoluto, e não para curar uma vitrine. Agora são **dez livros com capa e visto nos últimos 90 dias**.
- **O sinal de vida é a metade que importa.** Convidar alguém a seguir uma conta morta é o pior que esta tela pode fazer: a pessoa segue, o feed não enche nunca, e ela conclui que o app é vazio. O livro na estante diz que houve alguém; a última visita diz que ainda há.
- **O dono sugeriu duas saídas, e as duas eram necessárias — mas a primeira sozinha seria uma troca ruim.** Apertar a régua faz a vitrine mostrar TRÊS pessoas, e uma vitrine com três caras parece site abandonado. Trocar "fantasma" por "vazio" não é ganho. Por isso a segunda: **quem ainda não segue ninguém abre na CURADORIA**, que é a coisa mais cheia que o Gume tem — cem capas, uma lista que se refaz sozinha. Ele quer livro, e não uma lista de estranhos; gente vem depois, quando ele já tem motivo.
- **Muda só a ORDEM, e nunca o conteúdo.** As estantes continuam na mesma tela, logo abaixo, e quem sai da vitrine continua achável pela busca e pelo link direto. Some da vitrine ≠ deixa de existir.

**E o teste pegou um erro que a minha conferência não pegava.** A régua foi verificada com `psql`, escrevendo o 90 à mão, e passou. Na consulta de verdade o número vai como PARÂMETRO, e o Postgres recusou com `date >= integer`: **o Explorar daria erro 500 em produção**. Um `psql` com literal inline não reproduz o caminho real, porque lá o valor já chega tipado. A correção é um `::int`, e o comentário ao lado dele existe para ninguém "limpar" isso depois.

**E uma condição minha era enfeite.** O `u.last_seen_on is not null` ao lado da comparação não filtrava nada — `null >= data` já é falso. Descobri mutando: tirar aquela linha não quebrava teste nenhum. Saiu.

---

**2026-08-06: A coleção vira um LUGAR. Ter não é ler, e agora dá para dizer isso.**

O dono coleciona livros, e disse a frase que faltava: *"tem livros que eu li e não tenho na estante"*. O contrário também — livros que ele tem e talvez nunca leia.

**O modelo já separava as duas coisas desde sempre.** `owned_copies` é uma tabela própria, com estado, procedência e a EDIÇÃO específica (o exemplar, não a obra), e "ter não é ler" está escrito no schema. O que não existia era **um jeito de dizer "eu tenho"**: a única forma de nascer uma linha ali era como efeito colateral de escrever a nota "de onde veio". Quem não contasse a história do exemplar nunca registrava a posse. Em produção eram **29 exemplares, de 4 pessoas** — não por falta de interesse, mas por falta de porta.

- **Foram apresentadas duas saídas, e o dono escolheu LUGAR.** A regra da casa diz que recorte não é lugar (foi por isso que "lendo" e "lidos" saíram da navegação), e ela vale para recortes de LEITURA. Coleção não é um deles: a estante responde "o que eu li", a coleção responde "o que eu tenho", e as duas se cruzam sem se conter. Forçar a segunda a ser filtro da primeira é o que já produzia o **"esperando" mentiroso** — um livro comprado e nunca aberto virava uma intenção de ler que ninguém teve.
- **Os dois eixos são independentes, e a trava prova nos dois sentidos.** Marcar "tenho" não mexe na prateleira; prateleirar não cria exemplar. O segundo é o mais importante: **inventar posse é inventar patrimônio** — o app afirmaria que a pessoa tem um livro que ela leu emprestado.
- **"Quero ter" não é "quero ler".** A prateleira já tem "esperando", que é querer ler. Este é o desejo pelo OBJETO: a edição bonita de um livro já lido em pdf, o volume que falta na coleção. Um colecionador sabe a diferença melhor que ninguém.
- **Desmarcar APAGA a linha**, em vez de gravar um estado "não tenho". A ausência já significa isso, e um terceiro estado seria uma linha por livro que ninguém tem, no acervo inteiro.
- **A coleção é sua, e de mais ninguém.** O cabeçalho de `lib/copies.ts` já dizia que nada ali é lido por outra pessoa; agora isso vale de propósito e não por acaso. A coluna `visibility` tem `public` como padrão e **nenhuma consulta a lê** — se a coleção virasse pública porque um padrão de coluna dizia isso, o app publicaria o que as pessoas têm em casa sem ninguém ter escolhido. "O que eu tenho guardado" não é "o que eu li". Quando alguém quiser mostrar, vai ser um botão que ela aperta. A trava foi mutada: tirar o filtro por dono derruba o teste.
- **A única contagem da tela é "tenho e ainda não li"**, que é a pergunta de quem coleciona. Não há placar de quantos livros você tem: isso seria medir a pessoa pela pilha, e este app se recusa a ordenar gente por esforço.

**Não precisou de migration.** A tabela existia, com os quatro estados. Foram usados dois; `lent_out` e `gone` ficam para quando alguém pedir — construir tela para estado que ninguém usou ainda é inventar necessidade.

---

**2026-08-06: A coleção conta CONJUNTOS. É isso que separa colecionar de possuir.**

A primeira versão listava livros, e o dono leu como inventário: *"queria que fosse pra colecionador mesmo, tipo edição deluxe, colecionador etc (meio vibe quem gosta de carta pokemon tcg)"*.

**A diferença não está num rótulo — está no que a tela CONTA.** A estante conta livros lidos; uma lista de "coisas que eu tenho" também conta livros, e por isso lia como estoque. Uma coleção conta conjuntos: "4 de 14". Ninguém que coleciona pensa "tenho 340 cartas"; pensa **"falta uma"**.

- **O que eu NÃO fiz: uma caixinha "isto é item de colecionador?".** Seria um formulário pedindo à pessoa para classificar, e este repo já tem a frase contra isso — *"um formulário fingindo ser memória"*. A pessoa põe o livro na coleção; se ele for volume de algo, a tela sabe.
- **O conjunto é da EDIÇÃO, e nunca da série.** A frase já estava no schema desde a migration 0038: a Panini publica Berserk em duas edições, e o "volume 25" de uma não é o "volume 25" da outra. Para quem coleciona isso não é detalhe — juntar a Deluxe com a normal estraga exatamente a coisa que a pessoa cuida. A trava tem um teste só para isso.
- **O que falta CONTINUA na tela, apagado.** Escondê-lo deixaria só o que você tem, que é inventário de novo. **A lacuna é o assunto**: o volume 7 em cinza no meio dos coloridos é a própria vontade de completar. É a gramática que o dono trouxe da referência (item bloqueado fica em preto e branco, a cor é a recompensa).
- **Isso obriga os volumes que faltam a EXISTIREM no acervo.** Sem as fichas dos onze que faltam, "3 de 14" não teria o que desenhar. Por isso os conjuntos entram inteiros, e não só o que a pessoa marcou.
- **O selo só aparece completo**, e é a única coisa dourada da tela. Selo pela metade é enfeite, não conquista. Mutado: fazer o selo aparecer com um volume derruba dois testes.
- **A tela não compara ninguém com ninguém.** Não há "você é o 3º que mais completou" nem quantas pessoas têm o conjunto. Placar transforma colecionar em competição, e é o que este app recusa em toda superfície.
- **Livro avulso não ganha barra nem cobrança.** Inventar um conjunto de um volume só para toda obra encheria a tela de barras completas, que não dizem nada.

**O dado já existia e estava dormindo.** `colecoes` tem 415 conjuntos (Naruto com 72 volumes, Bleach com 74), vindos da AniList, e **nenhuma tela os lia**. Faltava ligar os livros de quem usa: `0` obras em estante de alguém tinham série ou conjunto.

Foram ligados os dois casos do dono — Vagabond Definitive Edition (6 volumes) e Berserk Deluxe Edition (14) —, com os ISBN conferidos um a um na Open Library. **Nenhum ISBN foi deduzido em sequência a partir do primeiro:** numerar ISBN é uma boa forma de inventar livro que não existe.

**E o resultado expôs o problema original:** o dono tem 4 volumes de Berserk Deluxe na estante e o app só sabia de 3 — porque a posse só era registrada como efeito colateral da nota "de onde veio".

---

**2026-08-06: Só o botão põe o livro na coleção. A procedência deixa de criar exemplar.**

O dono foi direto: *"não quero que seja pego de onde veio e sim clicando em algum botão de colocar na coleção"*.

Escrever "ganhei da minha irmã" fazia o livro entrar na coleção sozinho, com `state: 'owned'`. Era a **única porta que existia** quando o campo nasceu, e por isso foi construída assim. Com um botão na tela, ela virou uma porta lateral que faz a mesma coisa **sem pedir** — e produz uma coleção que a pessoa não montou.

- **`insert` virou `update`.** A nota agora se agarra a um exemplar que já é seu. Sem exemplar, não há o que ter história.
- **O campo mudou de casa junto.** Ele morava no painel de LEITURA, e "de onde veio esse livro" é sobre o EXEMPLAR. Foi para o cartão da coleção, e só aparece com "tenho" marcado: perguntar a procedência de um livro que não é seu é uma pergunta sem dono.
- **Sem o campo mudar de lugar, o conserto seria uma armadilha.** O campo continuaria visível para todo mundo, e escrever nele passaria a não fazer nada — trocando "faz demais em silêncio" por "não faz nada em silêncio", que é pior.
- **Duas travas, e as duas mutadas:** a nota não cria exemplar; e ela guarda a história de um exemplar que existe. A segunda importa tanto quanto a primeira — um conserto que só proíbe pode ter quebrado o caso legítimo, e ninguém notaria.

**E a trava dos limites do repo pegou um descuido meu:** escrevi `maxLength={140}` cravado no campo novo, e `nenhum teto é um número digitado à mão` reprovou. Passou a usar `LIMITS.provenance`. É a terceira vez nesta sessão que um teste estrutural vê o que eu não vi.

---

**2026-08-06: Trazer um livro é contribuir. Migration 0059, e três números em vez de um.**

O dono perguntou se quem cria livro, manda capa ou preenche informação que faltava conta como contribuição. **Não contava.** A página somava CORREÇÕES, e mais nada.

E o buraco era maior que a tela: **`works` não guardava quem criou a ficha.** Em produção, **3.307 obras foram criadas por leitores e nenhuma tem dono**. Não é a página que esquecia de mostrar — o dado nunca existiu.

Isso contradizia a tese escrita no próprio arquivo: *"quem conserta uma capa vale o que vale quem faz um commit"*. Só conserto valia.

- **A consulta partia de `revisions`, e por isso quem só traz livro não existia na página** — nem com zero. Alguém que trouxesse cinquenta livros e nunca corrigisse um campo não aparecia. Agora ela parte de `users` e entra quem fez qualquer uma das três coisas.
- **As 3.307 ficam órfãs, de propósito.** Não dá para recuperar quem as criou. Atribuir por palpite (o primeiro que pôs na estante, digamos) daria crédito errado a uma pessoa de verdade, numa página cujo assunto é justamente reconhecer quem fez. A contagem começa em zero e honesta.
- **Três números, e não um.** Somar tudo seria simples e esconderia a natureza do trabalho — que é exatamente o que esta página existe para dar a ver. Trazer um livro, mandar uma capa e consertar um campo são esforços diferentes; a tela mostra os três e não decide qual vale mais. A SOMA ordena, porque uma lista precisa de ordem. Continua sem posição ordinal, sem pódio e sem medalha.
- **Cada número só aparece se houver.** Uma linha de zeros não informa nada.
- **Importar uma estante também conta.** As fichas que nascem ali servem todo mundo depois, igual ao cadastro à mão.
- **`on delete set null`, e nunca cascade.** Quem apaga a conta leva os próprios dados, e não o livro que trouxe: a ficha serve todo mundo, e apagá-la tiraria o livro da estante de terceiros. O nome sai; o livro fica.
- **As três contagens são subconsultas, e não `join`.** Um join entre elas multiplicaria as linhas umas pelas outras — trinta correções virariam trezentas por causa de dez livros, e ninguém desconfia de um número grande numa página de reconhecimento. Tem teste só para isso.

---

**2026-08-06: A coleção mostrava uma grade vazia para quem coleciona.**

A tela decidia se desenhava a lista de baixo olhando `itens` (tudo que você tem) e renderizava `avulsos` (o que não está em conjunto). Com todos os volumes dentro de conjuntos — **o caso de quem coleciona, que é para quem a tela existe** — sobrava uma grade vazia embaixo do cartão, e o "nenhum livro ainda" nunca aparecia.

Uma condição que pergunta de uma lista e desenha outra é um bug esperando o dado certo para aparecer. Achado ao conferir se o botão realmente levava o livro para a tela — e a resposta era sim, com uma grade vazia de brinde.

---

**2026-08-06: Quem monta um conjunto de edição. E ele é CATÁLOGO, não preferência.**

O dono tinha três volumes de Hellsing Deluxe fora de conjunto e disse: *"acho que tem que ser possível a pessoa criar seus próprios conjuntos"*. Os conjuntos vinham todos da AniList, e só cobriam mangá conhecido.

- **Ele não é "próprio", e a distinção é o desenho inteiro.** *"Hellsing Deluxe tem 3 volumes"* é um FATO SOBRE O MUNDO, como o autor ou a editora — não é opinião de ninguém. Se o conjunto fosse pessoal, cada colecionador recadastraria os mesmos volumes por conta própria, e o app teria N versões da mesma verdade: exatamente a duplicata que este acervo passou o dia consertando.
- **Agrupamento pessoal já existe e continua valendo:** são as estantes que a pessoa monta ("meus livros de capa dura"). Aquilo é gosto; isto é ficha.
- **Sendo catálogo, vai para o LOG de revisões**, com nome e reversível. Ligar um volume ao conjunto errado estraga a coleção de quem coleciona, e a defesa contra isso é o histórico público — a mesma que protege a ficha do livro. Uma permissão faria do dono um porteiro. Mutado: tirar o registro do log derruba o teste.
- **Procurar vem antes de criar, e é isso que impede a duplicata.** O campo busca o que já existe e só oferece "criar" depois. Sem isso, o segundo colecionador de Hellsing cadastra o mesmo conjunto de novo.
- **O número do volume não é opcional.** Um conjunto sem número é uma pilha: a tela não sabe ordenar nem dizer qual falta, e "3 de 10" apareceria em ordem aleatória.
- **Soltar é tão fácil quanto ligar.** Erra-se ao ligar, e desfazer não pode custar mais que fazer.

**Achado no caminho: `lib/db/schema.ts` não descreve a coluna `slug` de `series`, e a produção tem ela** — com o índice único que o `on conflict` precisa acertar. O arquivo derivou do banco. Escrever pelo construtor daria erro de tipo por uma coluna que existe de verdade, e "consertar" removendo o slug faria o conflito bater no lugar errado. Ficou SQL cru, com o motivo escrito ao lado.

---

**2026-08-06: A coleção ganhou a cara que ela merecia.**

O dono pediu *"uma tela um pouco glamurosa"*, com as edições pendentes em preto e branco e selo para as completas.

- **Nada foi inventado:** a aura da capa no topo é o mesmo material da tela de queridinhos, e o dourado é o mesmo da curadoria da casa. Uma tela nova com vocabulário novo seria um segundo sistema visual dentro do mesmo app.
- **A capa que banha o topo é a do conjunto MAIS ADIANTADO**, e não a primeira que veio. É esse que a pessoa está montando; uma capa qualquer ali seria enfeite, e essa é a coleção olhando de volta para quem a montou.
- **O que falta volta a ter cor no hover.** A lacuna é o assunto, e espiar o que falta é metade do prazer de colecionar.
- **O conjunto completo ganha um fio dourado na borda**, além do selo. É a única cor da tela.

**E o primeiro conjunto completo é real:** Hellsing Deluxe Edition, 3 de 3.

---

**2026-08-06: A coleção aparece no perfil, e a tela para de se explicar.**

Dois recados do dono, e o primeiro é sobre a minha escrita.

**1. "Ter não é ler: isto é sobre o exemplar" saiu da tela.** Ele cortou com a razão certa: *"pra quê ficar sempre descrevendo assim? a pessoa sabe que isso é coleção"*.

Uma frase que explica a própria tela é a tela desconfiando de quem a olha — e num lugar que existe para dar orgulho, isso soa a manual. **O erro é recorrente meu:** legendar o óbvio, e chamar isso de clareza. O que ficou foi o FATO ("uma coleção completa"), que informa sem ensinar.

**2. A coleção passou a aparecer no perfil**, e o dono chamou isso de "a graça". Ele está certo, e isso **reverte uma decisão que eu tinha tomado sozinho**: eu fiz a coleção privada, argumentando que "o que eu tenho guardado em casa" não é "o que eu li". O argumento continua verdadeiro; ele só não é o único. Colecionar é para mostrar, e uma coleção que só o dono vê é um armário trancado.

- **A coluna `visibility` finalmente significa alguma coisa.** Ela existia com `public` no padrão e **nenhuma consulta a lia**. Publicar sem filtrar seria transformar um padrão de coluna na decisão de quem nunca foi perguntado. Agora quem olha o próprio perfil vê tudo; quem visita vê só o público. Mutado: tirar o filtro derruba o teste.
- **Fica registrado que as 27 posses que já existem, de 5 pessoas, herdaram esse padrão** — ninguém escolheu publicá-las, e o comentário do código dizia o contrário. Elas continuam públicas porque a coluna diz isso; se isso incomodar, a volta é um `update` e um botão.
- **A coleção vem ANTES da estante no perfil.** Uma estante diz o que a pessoa leu; uma coleção completa diz o que ela persegue, e é a coisa mais difícil de conseguir naquela página. Quem chega vê primeiro o que foi caro.

**E um pedido ficou parado, por um motivo que não é técnico:** o dono quer o símbolo de cada coleção (o estigma do Berserk, a cruz da Hellsing, uma katana no Vagabond). **São arte protegida**, identidade visual de obras registradas, e este repositório é público — desenhar e versionar esses SVG seria copiar arte de terceiros, para sempre. Foram propostas duas saídas que dão o mesmo efeito sem o risco: um emblema gerado da própria capa (cor dominante + inicial numa moldura), ou um conjunto neutro de símbolos que a gente desenhe e o leitor escolha.

---

**2026-08-06: Cada coleção ganha o emblema da obra. Por REFERÊNCIA, e não no repositório.**

Levantei que o estigma do Berserk, a cruz da Hellsing e a katana do Vagabond são arte protegida, e que este repositório é público. O dono decidiu seguir: *"pode pegar da internet os símbolos, não tem problema, a galera faz com games, faça"*.

**Feito — e feito do jeito que o app já resolve isso.** O emblema é guardado como ENDEREÇO, e nunca como arquivo: é literalmente o que `lib/imagens.ts` já faz com as capas, com o motivo escrito lá.

- **A diferença não é só jurídica.** Um repositório público é para sempre: arte de terceiro versionada aqui fica no histórico mesmo depois de removida, e sai do controle de quem a fez. Um endereço, não — se a fonte tirar do ar, some daqui junto.
- **E o endereço passa pela mesma lista de origens aceitas das capas**, então nenhuma imagem entra de um host que ninguém olhou.
- **Os três vieram do Wikimedia Commons, e os três estão em DOMÍNIO PÚBLICO** — logotipo abaixo do limiar de originalidade, com a licença conferida arquivo por arquivo antes de gravar. O Commons já estava na lista de origens aceitas. A preocupação que eu havia levantado acabou não se aplicando a estes três, e isso só se soube porque foi verificado em vez de suposto.
- **Desconfiei do "Vagabond logo.svg" e conferi**: podia ser outro Vagabond qualquer. Era o mangá. Um emblema errado é pior que emblema nenhum — a coleção passa a exibir o símbolo de outra obra, e quem coleciona percebe na hora.
- **O emblema acende junto com a coleção:** apagado enquanto falta volume, com anel dourado quando completa. É a mesma gramática dos volumes em preto e branco, e a mesma da referência que o dono trouxe.
- **Nulo é o estado normal.** São 415 conjuntos no acervo, e a tela precisa ficar bonita sem emblema — um campo obrigatório viraria cobrança em 412 deles.

---

**2026-08-06: Os emblemas, e o erro de substring que foi para produção.**

O emblema passou a poder ser posto por qualquer leitor (vai para o log, com nome, reversível — como corrigir ficha), e uma varredura tentou preencher os 415 conjuntos do acervo a partir do Wikimedia Commons.

**A primeira varredura gravou três emblemas ERRADOS em produção:**

| conjunto | recebeu | o que é |
|---|---|---|
| Bleach | `Bleacher-report-logo.png` | um site de esportes |
| Black Jack | `Young Black Jack logo` | um spin-off |
| Dragon Ball | `Dragon Ball Z Logo` | a sequência |

A regra exigia que o nome do arquivo **contivesse** o nome da obra. "bleach" está dentro de "bleacher". É o erro de substring mais clássico que existe — **e eu tinha escrito, no commit anterior, que "emblema errado é pior que emblema nenhum"** antes de cometê-lo.

A regra passou a exigir IGUALDADE: o nome do arquivo, tirando "logo", a extensão e os separadores, tem que ser idêntico ao da obra. Nada de sobra à esquerda ("Young") nem à direita ("Z", "er Report"). Refeita, ela achou 13 emblemas, todos conferidos.

- **Só licença livre entra**, conferida arquivo por arquivo e nunca presumida por estar no Commons.
- **A taxa de acerto é baixa de propósito** (13 de 120). Logotipo de obra raramente está em domínio público, e o que não vem automático fica para o mutirão — que é o que este app faz melhor.
- **O endereço passa por `origemAceita` na ESCRITA**, e não na tela: uma ação de servidor recebe o que o cliente mandar, e sem isso qualquer um apontaria a imagem para um host que ninguém olhou.

---

## /colecoes virou /listas. A palavra "coleção" já tinha dono.

O mesmo perfil dizia "a minha coleção" (os conjuntos/troféus — o que você TEM) e,
duas seções abaixo, "minhas coleções" (as estantes que você monta com as próprias
mãos, estilo Letterboxd). Singular contra plural era a única diferença, e ela é
sutil demais para carregar dois conceitos: quem lia não sabia qual coleção era
qual, e o dono percebeu isso usando o próprio app.

**"Coleção" ficou com o colecionismo** (`/colecao`, os conjuntos, "4 de 14
volumes") — é o uso mais antigo e o mais próximo do sentido comum da palavra.
**As estantes montadas à mão viraram "lista"**: `/colecoes` → `/listas`, "minhas
coleções" → "minhas listas", "coleções que fulano montou/guardou" → "listas que
fulano montou/guardou". O nome já existia por baixo — `lib/listas.ts`,
`components/lista-card.tsx`, `ListaGrid` — só a palavra na tela é que ainda dizia
"coleção".

- **`/colecoes` redireciona (301) para `/listas`** em `next.config.ts`: quem tem
  o link velho salvo chega no lugar certo, e não num 404.
- **`/colecao` (singular, os conjuntos) não mudou** — continua correto e não
  colide mais com nada, porque o plural saiu do caminho.
- **A curadoria da casa (Top 100) não é uma lista nem uma coleção** — é
  calculada a cada visita, vem de outra tabela (`lib/curadoria-guardada.ts`), e
  os comentários que a confundiam com "coleção" foram corrigidos para "lista".

---

## O emblema nunca gravou. E /contribuidores ganhou um quarto trabalho.

Ao dar rótulo próprio à contribuição de quem monta conjuntos de edição em
`/contribuidores`, escrevi o primeiro teste que chama `porEmblema()` contra um
banco de verdade — e ele quebrou. **`porEmblema()` nunca funcionou em produção.**

A migration 0011 travou `revisions.target_type` em `('work','edition','author')`,
antes de coleção existir. A 0060 deu à coleção um emblema e uma função para
pô-lo, e essa função grava em `revisions` com `target_type = 'colecao'` — um
valor que a trava nunca aceitou. Toda chamada quebrava com violação de
constraint, sempre, desde que a função nasceu (2026-08-06). `ligarAoConjunto()`
grava com `target_type = 'work'` e por isso sempre funcionou, o que escondia o
problema: as duas ações moram no mesmo formulário (`ConjuntoDoLivro`), e "ligar
o volume" mascarava "pôr o emblema" quebrado ao lado dele.

**Corrigido na migration 0061**: a trava agora aceita `'colecao'` também. Ver
`lib/contribuicao.sql.test.ts`, que passou a chamar `porEmblema()` de verdade.

Enquanto consertava isso, dei a `/contribuidores` um QUARTO balde, separado de
`correções`: montar um conjunto (ligar um volume, pôr um emblema) tinha o mesmo
peso de uma correção de ficha, mas caía no mesmo rótulo genérico. Agora aparece
como "N coleções", e `lib/contributors.ts` divide a mesma tabela `revisions` em
dois recortes (`jsonb_exists(patch, 'colecao_id')` ou `target_type = 'colecao'`
vira `conjuntos`; o resto continua `correcoes`) para não contar a mesma linha
duas vezes.

---

## O selo de colecionador não é insígnia, e não sai de /colecao.

O pedido era "insígnia de colecionador para quem fechou pelo menos uma coleção".
Isso colide de frente com a regra mais central do sistema de honras, travada em
teste em dois lugares (`lib/badges.test.ts`, `lib/contributors.sql.test.ts`):
**insígnia nunca é ganha por ler, avaliar ou colecionar — só por trabalho doado
à comunidade.** Reabrir essa regra para uma exceção pessoal desfaria a única
linha que separa "o que você FEZ pelos outros" de "o que você TEM para si".

**Virou selo, não insígnia.** Mora só no cabeçalho de `/colecao`, aparece
quando `completas > 0`, usa o mesmo dourado que já é a única cor da tela (o
selo "completa" de cada `ConjuntoCard`). Não mora em `lib/badges-view.ts`, não
entra no painel de honras, não viaja para o perfil nem para o feed — exatamente
o oposto de uma insígnia, que existe para viajar. Ninguém mais vê o selo de
ninguém: colecionar é para quem coleciona.

---

## A página de dentro da coleção. Só abre pra quem completou.

Sobre o autor, a obra, as edições — desbloqueada só com a coleção completa.
Tudo o que ela mostra já existia no catálogo: `authors.bio` (escrita por
leitor, nunca por IA — é recusa, está no README), `series`, `editions`. Não
houve pesquisa nova nem pipeline de dado novo, só uma consulta
(`lib/conjunto-detalhe.ts`) juntando o que já estava espalhado em quatro
tabelas.

- **O desbloqueio é computado na hora, como tudo no resto da coleção.** Não
  existe coluna de "completo" (migration 0036 proíbe, de propósito). A rota
  `/colecao/[slug]` chama a mesma lógica de sempre a cada visita.
- **Quem quase chegou não vê uma porta fechada.** Um leitor que tocou o
  conjunto mas não completou vê exatamente quantos faltam — nunca um 404
  fingindo que a coleção não existe. Só quem NUNCA tocou o conjunto (zero
  linhas na consulta) recebe 404 de verdade.
- **Bio vazia continua vazia.** A tela nunca inventa "quem foi essa pessoa":
  quando `authors.bio` é nula, ela diz que ninguém escreveu ainda — a mesma
  frase de `/autor/[slug]`, e o mesmo link para lá.
- **O selo dourado "completa" virou a porta.** Ele saiu de dentro do botão
  que expande/recolhe o conjunto (link dentro de botão é HTML inválido) e
  virou um `Link` irmão, ao lado.

---

## A imagem da coleção: mais fontes aceitas, e uma porta que nunca existiu.

Dois problemas, achados juntos. O primeiro: o pedido era imagem de personagem
"de qualquer fonte", e a lista de origens aceitas (`lib/imagens.ts`) só cobria
acervo de proveniência limpa (Commons, Open Library, editora) — abrir para
`img-src https:` quebraria a defesa contra hotlink que o próprio arquivo
documenta. A escolha foi ampliar a lista com hosts grandes e estáveis de
conteúdo de fã: `static.wikia.nocookie.net` (Fandom, a maior fonte real de
personagem de anime/mangá/jogo), `image.tmdb.org` e `images.igdb.com`. Fandom é
a MESMA classe de risco que o Commons já é (as duas são wikis abertas); a
diferença é que o Commons filtra por licença e o Fandom não, e essa diferença é
exatamente o que o dono decidiu aceitar — a mesma autorização já dada para os
emblemas de logotipo ("pode pegar da internet os símbolos... a galera faz com
games, faça").

O segundo: `porEmblema()` (lib/conjuntos.ts) existia desde 2026-08-06 e nunca
teve formulário nenhum — nem botão, nem input, em lugar nenhum do app. Um
recurso sem UI não é um recurso incompleto: é um recurso que não existe para
quem lê a tela. Agora `components/conjunto.tsx` tem um editor dentro do
conjunto aberto ("pôr uma imagem desta coleção"), com a mesma regra de sempre:
por endereço, nunca uma cópia; contribuição de catálogo (qualquer leitor
logado, não só o dono); vai para o log com nome, reversível. Só aparece para
quem está logado (`podeEditar`) — quem olha o perfil de outra pessoa sem ter
entrado não vê um convite que ia falhar ao salvar.

---

## Cada conjunto virou uma linha, e a grade só abre se você pedir.

Pesquisei como Backloggd, sites de troféu (PSN/Xbox) e apps de manga
(Manga Vault) resolvem "muitas coleções na mesma tela", e a referência que o
dono trouxe (troféus estilo PlayStation) já mostrava a resposta: cada jogo é
uma LINHA compacta, recolhida por padrão, e a grade de conquistas só abre com
um clique.

Antes, cada `ConjuntoCard` era um cartão inteiro sempre aberto — no perfil, ao
lado de tudo mais que a pessoa é, uma coleção de dez conjuntos virava dez
cartões grandes empilhados. Agora `components/conjunto.tsx` é um componente de
cliente: a linha fechada já carrega o emblema, o título, "X de Y", a barra fina
de progresso e o selo dourado de completo — responde "estou perto?" sem abrir
nada — e só a grade de volumes (a lacuna, volume por volume) espera o clique.

- **O que falta continua aparecendo em cinza dentro da grade.** Esconder a
  lacuna transformaria a tela num inventário do que você já tem, e a lacuna
  continua sendo o assunto de quem coleciona (migration 0036).
- **O dourado continua a única cor da tela**, e só quando `c.completo`.
- **Recolhido por padrão em toda parte** (perfil e `/colecao`), sem exceção
  para a página dedicada: é o mesmo comportamento da referência, e uma regra
  só é mais fácil de não esquecer que duas.

---

## Guia: por que não há uma nona cor de insígnia, e o que virou no lugar.

O pedido era uma insígnia "curador" para quem montou uma lista e teve pelo
menos um guardado — e "curador" já colide com "curadoria da casa" (termo
reservado ao idealizador), então o nome virou **guia**.

Diferente de "colecionador", isto não esbarra no princípio de "insígnia é
doação, nunca posse": alguém guardar a sua lista é exatamente o tipo de sinal
que `lib/listas.ts` já trata como curadoria pública, não como curtida — a
mesma linha que permitiu o contador de "guardadas" no card da lista
(2026-07-28). O que bloqueou foi outra coisa, e é geométrica: `lib/badges.test.ts`
trava 30° de distância mínima entre matizes de insígnia, e mais 30° do
verde-água da marca (167°). Com as oito cores atuais o círculo já está cheio —
o único vão largo (entre zelador e moderador) é exatamente o espaço reservado
para a marca não colidir com ninguém, e não sobra ângulo nenhum dentro dele.

Apresentado o problema, a escolha foi não afrouxar a trava (ela já evitou uma
colisão de cor de verdade, com o zelador). **Guia virou selo, como
colecionador**: não mora em `lib/badges-view.ts`, não tem matiz, não entra no
painel de honras. Mora no perfil, ao lado de "minhas listas"/"listas que X
montou" — visível a QUALQUER visitante, diferente do colecionador (que é só
para o próprio dono): guiar alguém é um fato sobre a comunidade, não sobre
gosto pessoal. Calculado sem consulta nova, reaproveitando `guardadas` que
`getListasDe` já trazia.

---

## Cem fundadores de novo. A sala virou a meta pública.

Isto reabre "Cinquenta fundadores, e cada um com o número de chegada" (acima). Não porque o
argumento de lá estivesse errado — **"cem pessoas não são um começo, são um lançamento"
continua verdade** — mas porque ele media a insígnia contra o tamanho de uma sala, e o Gume
passou a se medir contra outra coisa: a própria meta pública de cem contas, que já vive em
`app/painel`. Com cinquenta vagas, "fundador" fechava a meio caminho da meta e sobravam
cinquenta pessoas que chegaram cedo — antes de qualquer prova de que ia dar certo — sem
insígnia nenhuma. As cem primeiras SÃO o lançamento inteiro, não uma fração dele.

O dono pediu a reabertura sabendo do argumento anterior e da meta do painel.

- **O número de chegada continua**: "membro fundador #73" é tão honesto quanto "#7" era —
  a insígnia não mede o que a pessoa fez, mede quando ela chegou.
- **O corte segue fixo em `lib/regras.ts`** (`CORTE_FUNDADOR`), e o texto da insígnia
  (`lib/badges-view.ts`) e o teste estrutural (`lib/regras.test.ts`, que lê o número por
  extenso e compara com o texto exibido) continuam travando os dois números juntos — o bug
  original (código dizia cinquenta, tela dizia cem) não pode voltar por este caminho.
- **Não é a mesma coisa que "meta de cem contas"**: são dois números que hoje coincidem
  (100 e 100) mas medem coisas diferentes — um é corte de chegada, o outro é meta de
  crescimento. Se um dia divergirem de novo, cada um muda no seu lugar.

**E fica registrado que a coleção NÃO é de mangá.** Nada no mecanismo é específico: criar "Coleção Companhia de Bolso" ou "Harry Potter capa dura" funciona pelo mesmo botão. Os 415 conjuntos são de mangá porque a AniList foi a única fonte importada — é limitação do DADO, e não da funcionalidade.

---

## /contribuidores contava capa como 'accepted', e o banco nunca grava esse estado.

O dono perguntou "não dá pra colocar quem cria livros, adiciona infos, só quem
corrige?" — e a resposta certa não era explicar de novo que o mecanismo já
existe (item anterior). Era ir olhar o banco de produção. Achei dois bugs
reais, os dois silenciosos desde que nasceram.

**Capas: `cp.state = 'accepted'` nunca bateu com nada.** O check constraint de
`cover_proposals` só permite `'pending' | 'applied' | 'refused'` — `'accepted'`
não é, e nunca foi, um valor que o banco aceita gravar. `getCatalogo()`
comparava com uma palavra errada desde que a coluna "capas" foi escrita, e
NENHUM teste jamais chamou essa consulta contra uma proposta de capa de
verdade — o buraco não tinha como ser visto de dentro do código, só olhando o
dado. Corrigido para `'applied'`, com teste novo em `lib/contribuicao.sql.test.ts`
que insere uma proposta `applied` e uma `pending` lado a lado, provando que só
a usada conta.

**Livros: `addByHand()` não creditava ninguém.** `findOrCreateWork()` só grava
`works.created_by` quando quem chama manda `criadoPor` (migration 0059) — e o
formulário de "não achei este livro, vou cadastrar" (o trabalho mais
deliberado que existe para trazer um livro ao acervo) tinha `actor` na mão e
nunca passava adiante. As outras chamadas (busca por ISBN, import em massa)
já passavam `criadoPor` certo; só esta ficou pra trás. Em produção: **zero**
obras com `created_by` preenchido, de um total onde 3.307 estão marcadas
`needs_review` (o que o painel chama de "obras de leitor" — uma métrica
diferente, que não depende de `created_by`). Corrigido com um teste de fonte
em `app/buscar/actions.test.ts` (a ação depende de sessão, não dá pra chamar
direto num teste — o que trava é a FORMA da chamada).

**A lição, escrita para não repetir**: os três baldes de `/contribuidores`
(livros, capas, conjuntos) foram construídos com cuidado e testados — e dois
dos três estavam matematicamente incapazes de mostrar qualquer coisa em
produção, porque o defeito morava numa costura que nenhum teste olhava (um
valor de estado, um parâmetro esquecido numa chamada). Consultar o banco de
verdade achou em minutos o que a leitura do código não achava.

---

## A cara da coleção: personagem pra mangá, autor pra livro, e o círculo preenchido.

O dono achou os logotipos "feios" e pediu foto de alta qualidade — personagem
mais importante pra mangá, retrato do autor pra livro, "não precisa ser de
fonte aberta". Três mudanças:

- **`lib/anilist.ts` ganhou `personagensDasSeries()`**: para cada série com
  `anilist_id`, busca o personagem MAIN mais favoritado
  (`sort: [ROLE, FAVOURITES_DESC]`, testado à mão — Vagabond devolve Musashi
  Miyamoto, 9.840 favoritos, não um coadjuvante). `scripts/personagens-da-colecao.mjs`
  roda isso em lote (90 req/min é o teto da AniList, o mesmo de sempre) e
  GRAVA o endereço em `colecoes.emblema_url`, substituindo o logo — nunca uma
  chamada na hora, o mesmo motivo de `autoriaDasSeries` já ser um backfill.
  Rodado contra produção: **314 de 417 coleções de mangá trocaram de imagem**
  (as 103 restantes não têm personagem principal indexado na AniList — em
  maioria one-shot e antologia). `s4.anilist.co` já estava na lista de
  origens aceitas; não precisou mexer em `lib/imagens.ts`.

- **Coleção de livro (sem `anilist_id`) usa o retrato do autor.** Ao vivo,
  por `coalesce(c.emblema_url, authors.image_url)` em `getConjuntos()` e
  `getConjuntoDetalhe()` — sem gravar nada, porque `authors.image_url` já é
  um dado mantido (a mesma foto de `/autor/[slug]`). O manual sempre ganha.

- **A foto PREENCHE o círculo.** "Não precisa ser grande, tá bom estando
  dentro do círculo se ficar bem visível" — então o pedido não era aumentar,
  era parar de desperdiçar espaço: a imagem media 28px boiando dentro de um
  círculo de 44px (o desenho certo pra um ícone, errado pra um rosto).
  `object-cover` + mesmo tamanho do círculo, em `components/conjunto.tsx` e
  em `/colecao/[slug]`.

Um achado no caminho, registrado e não perseguido esta noite: `Hellsing
Deluxe Edition` tem uma linha de `series` própria sem `anilist_id`
preenchido — por isso continua com o logo antigo. É lacuna de DADO (a mesma
classe de coisa que `scripts/backfill-authors.mjs` existe para consertar),
não bug de mecanismo.

---

## O perfil modelo. Um leitor de mentira, fundo, e em produção.

"Mantenha um usuário mockado... pra eu poder visualizar um perfil completo
que não seja o meu." `seed-demo.mjs` já existia, e é RASO de propósito
(cinco leitores, seis livros cada, pra alimentar feed e recomendação) — e se
recusa a rodar em produção porque cria contas que seguem a sua.

`scripts/seed-perfil-modelo.mjs` é outra coisa: UMA conta (`@perfil-modelo`,
e-mail `@perfil.gume.demo`, bio dizendo o que é), e ela é FUNDA — estante
grande, notas espalhadas, resenhas escritas à mão (não geradas, a mesma
régua de `seed-demo.mjs`), duas listas montadas, uma coleção completa e uma
pela metade. Ela RODA em produção, de propósito: o pedido era ver isto na
tela de verdade, e não segue ninguém nem toca em nenhuma conta que já existe.
Idempotente — rodar de novo só completa o que falta.

As duas coleções (uma completa, uma incompleta) são escolhidas por TAMANHO
numa consulta, nunca por um id fixo no script: um id fixo quebraria em
silêncio no dia em que aquele conjunto sumisse do catálogo. Rodado contra
produção esta noite: 78 livros, 55 notas (14 "adorei"), 5 resenhas, "Sayonara
Piano Sonata" completa (3 de 3), "Boruto" pela metade (10 de 20).

**E um problema de infraestrutura, achado no caminho**: `lib/db/index.ts`
importa `./schema` sem extensão, e o Node com `--experimental-strip-types`
não resolve isso fora do bundler do Next (webpack resolve; o Node cru, não).
Os dois scripts novos falam com o banco por `postgres` cru, como
`seed-demo.mjs` e `backfill-authors.mjs` já faziam — só `lib/anilist.ts`
(puro, sem import de banco) é reaproveitado da casa. `scripts/operacao-mais-capas.mjs`
importa `lib/db/index.ts` direto e pode já estar quebrado pelo mesmo motivo;
não investigado esta noite.

---

## O painel virou quatro abas. Nenhum dado novo, um lugar melhor pra cada um.

"Melhore o painel, pode colocar abas." Era uma página rolando: metas, gente,
insights, filtros, uso, contribuição, convite, catálogo, export — nove
blocos empilhados, sem hierarquia entre "o que crescer" e "o que consertar".

**Crescimento**: metas, a base (pessoa a pessoa), filtros, o gráfico de
cadastro + o log de quem chegou, convite. **Saúde**: uso (leitura, estante),
contribuição, catálogo (completude + buscas sem resultado — exatamente o
"pesquisas que a pessoa fez e não achou livro" do pedido). **Moderação**:
nova — log de alterações, banidos, e as portas pra /cuidar e /pedidos (a
ação continua lá; o painel só passou a ser onde se VÊ o que já aconteceu).
**Agentic**: a "leitura rápida" (que já era aritmética com limiar, nunca
IA — só mudou de endereço) e o bloco "exportar e ler por agente", que já
existia e é exatamente o que esse nome pedia.

Estado da aba fica em `useState`, não na URL — trocar de aba não pode
recarregar a página do servidor, e os filtros de verdade (período, método,
origem) continuam na URL porque esses sim mudam o que é buscado.

**"Totalmente agentic" foi interpretado com cuidado.** README promete "nada
de IA generativa no produto" — e o painel também é produto, mesmo privado.
Não nasceu um chat, nem uma chamada de LLM em tempo real: "agentic" aqui
significa a mesma coisa que já significava no bloco de export — dar a um
agente (este, ou outro) o material pra ler e sintetizar por fora, nunca
embutir a síntese como feature ao vivo. Se a intenção era outra (um chat
dentro do painel), fica registrado que não foi isso que se construiu, e por
quê — quem decide se abre exceção pro painel é o dono, e não em silêncio.

**O log de alterações não é tabela nova**: `revisions` já é append-only
(nunca apaga; reverter é uma linha nova apontando pra que desfez). A consulta
só lê o que já existe, junto com `cover_proposals`, resolvendo o nome do alvo
por um CASE (work/colecao apontam pra tabelas diferentes, sem FK única).

**Banidos usa uma consulta PRÓPRIA, não `getBanidos()`.** Aquela função exige
`ehModerador` (moderator_at), e o idealizador pode não ter o cargo — as duas
portas (`assertIdealizador`, `assertModerador`) são independentes de
propósito. Emprestar a autorização errada quebraria o painel pra quem só tem
uma das duas.

**Um bug real, achado pelo teste antes de chegar a produção**: `db.execute()`
nem sempre devolve um `Date` de verdade pra coluna timestamp (às vezes é a
string crua do driver) — `.sort((a,b) => a.quando.getTime() - ...)` quebrava
na hora. `new Date(x).getTime()` é seguro nos dois casos, e ficou assim.

**Não fiz** (escopo cortado de propósito, não esquecido): tirar "Cuidar do
acervo" do menu lateral do idealizador. O pedido era "eu fico com item a
menos", não obrigação — e mexer em visibilidade de menu por papel, sem
alguém pra checar o resultado antes do deploy, é exatamente o tipo de
mudança pequena com jeito fácil de acertar a condição errada e esconder a
fila de quem não é o idealizador. A porta nova (aba Moderação → link) já
existe; a antiga continua, e sai quando alguém puder olhar o resultado.

---

## Amazon (os outros dois hosts) e Pinterest entram na lista de origens.

"As melhores capas são lá" (Amazon) e "pra fotos de avatar de coleção etc"
(Pinterest, com URL de exemplo). Dois hosts a mais de Amazon —
`images-eu.ssl-images-amazon.com` e `ecx.images-amazon.com`, as outras
formas que a própria Amazon já usou pra imagem de produto — e `i.pinimg.com`.

O Pinterest é de uma classe diferente dos outros hosts desta lista. Fandom,
TMDB, IGDB, Commons: cada imagem está ligada a uma ficha, um personagem, uma
obra — dá pra checar se bate. O Pinterest é um mural: serve qualquer coisa
que qualquer pessoa salvou lá, sem proveniência nenhuma pra conferir do
outro lado. Entrou porque o dono pediu sabendo disso — a mesma autorização
de sempre, e não uma trava frouxa por descuido.

Testado com a URL exata que o dono mandou como exemplo, em
`lib/imagens.test.ts`.

---

## A pill virou medalha, e ela vaza o card.

"Seria legal ser tipo um badge na coleção completa, uma medalha, sabe? meio
overflow com o container, não só escrito." O selo "completa" era uma pill de
texto — borda, palavra, ícone `Trophy` — sentada ao lado do resto. Virou um
objeto de verdade: um círculo dourado que morde o canto do card
(`components/conjunto.tsx`) ou o anel do emblema grande
(`app/colecao/[slug]/page.tsx`), com sombra própria, como se estivesse
pendurado por cima, não desenhado dentro.

O acabamento (`components/selo-colecionador.tsx`) reaproveita a TÉCNICA de
`components/badges.tsx` — verniz, bisel, glow — mas não importa nada de lá.
Continua NÃO SENDO insígnia: não entra em `lib/badges-view.ts`, não mora no
sistema OKLCH que `lib/paleta.test.ts` já trava cheio, não aparece no painel
de honras. Completar uma coleção é para o próprio colecionador, não uma
doação à comunidade — a distinção que `app/colecao/page.tsx` já registrava
continua valendo. Duas diferenças propositais de uma insígnia: ela GIRA (6 a
10°, "pendurada", nunca alinhada ao grid) e tem sombra fora do círculo (paira
sobre o card; uma insígnia é nivelada com a superfície que a contém).

O dourado (`#d9a520`) virou uma constante — `lib/dourado.ts`, `DOURADO` — em
vez de continuar escrito à mão em onze pontos de oito arquivos. O nome não é
`ouro-colecao`: essa mesma cor também é a coroa da curadoria da casa
("queridinhos"), e um nome preso à coleção mentiria sobre a coroa. As duas
coisas só compartilham o hex por coincidência de gosto, nunca de
significado — o arquivo diz isso.

A pill de texto ao lado do emblema grande, em `/colecao/[slug]`, perdeu cor,
borda e ícone: virou legenda neutra, porque a medalha grande já carrega o
símbolo sozinha. E como a medalha (32px, rotacionada, num canto) é um alvo
de toque menor que a pill antiga, o card compacto ganhou um link de texto
simples — "ver a página desta coleção" — dentro do estado aberto, pra
navegação em celular não depender só do círculo pequeno.

---

## Geist saiu, Inter voltou. Pedido do dono, duas vezes.

A entrada que trocou Inter por Geist continua algumas páginas atrás, intacta —
esta não a apaga, só registra que o dono mudou de ideia depois de ver o
oku.club de perto (mandou prints e o site salvo). Perguntei explicitamente se
"a fonte harmoniza bem" era sobre a família ou só tamanho/peso, avisando que
isto reverteria uma decisão já documentada. Ele respondeu **"quero as fontes
e ícones estilo oku"** — direto, pela segunda vez.

`--font-chrome` volta a ser Inter (`app/layout.tsx`, `app/globals.css`).
Newsreader (a voz, nos títulos) e Fraunces (a marca, só a palavra "Gume")
ficam como estavam — o pedido era sobre o chrome da interface, não sobre o
que fala com o leitor.

Sobre "ícones estilo oku": os ícones do Oku são traço fino, geométrico,
arredondado — a mesma linguagem que o lucide-react já fala aqui (é a única
lib de ícone do app, 52+ arquivos). A leitura deste registro é que a diferença
real é TAMANHO, não família — por isso o que mudou foi escala (ver a entrada
seguinte, sobre a barra lateral), não uma troca de biblioteca. Se um dia isso
se provar errado, é a interpretação mais barata de reverter.

---

## O escuro deixa de ser void, e a regra de "nunca frio" é revista.

Outra herança do oku.club: o canvas escuro era `#060606` — quase-absoluto de
propósito, documentado como "reduzido, nunca invertido, nunca um `#111827`
frio". O dono mandou um print da barra lateral do Oku (claramente não-preta) e
citou "o tema catppuccino, não tudo pretão".

Primeiro passe: subi a escala de luz mantendo o mesmo matiz QUENTE de sempre
(`#161310` de canvas) — respeitando a regra "nunca frio" ao pé da letra, sem
perguntar se ela ainda fazia sentido. O dono olhou ao vivo e disse: **"a cor,
eu acho que mais puxado pro cinza roxinho fica melhor"** — direto, pedindo
exatamente o que a régua antiga proibia.

Então a régua foi revista, não a decisão de subir a escala: o canvas escuro
vira cinza-roxinho (`#17151d`), na linha real do catppuccin (que TEM azul por
baixo — foi por isso que a primeira tentativa evitou essa direção, até o dono
confirmar que era exatamente o que queria). `--color-accent`, `--color-perigo`,
`--color-colaborar` e as insígnias não mudam: cor dirigida por significado,
fora do pedido. `docs/design.md` atualizado pra não divergir do código — a
frase antiga ("nunca invertido, nunca frio") virou a frase que conta essa
história, em vez de uma regra que o próprio código já não segue.

---

## O fio do item ativo saiu. Ficou só a pílula.

Perguntei explicitamente, na rodada da barra lateral maior: mantém o fio (o
traço verde-água que vaza na borda do item ativo, a "lâmina" da marca virando
comportamento de interface) ou tira, e vira pílula neutra igual ao Oku? O
dono respondeu **manter**. Depois de ver ao vivo, com o resto da barra já
maior e mais respirada, voltou: "quando um botão/label está selecionado fica
uma linha branca que me parece meio off, eu acho melhor tirar de tudo e
deixar só esse círculo mostrando o que tá ativo."

`.afiado::after` (o fio + o halo de brilho) saiu. `.afiado`/`.pill.afiado`
perdeu o canto reto à direita (que só existia pra dar ao fio uma aresta pra
encostar) e virou pílula inteira (`--radius-pill`), como o resto do app já
usa pra filtro/estado. `--fio`/`--fio-halo-*` continuam definidos nos dois
temas (a paridade que `lib/tema.test.ts` trava), só que sem nenhuma regra
consumindo mais — não removi os tokens porque o teste depende da presença
deles, e um token sem uso não custa nada em tempo de execução.

A marca (`components/mark.tsx`, o símbolo "Gume") não muda: o fio saiu só do
comportamento da interface, não do símbolo em si.

---

## Adicionar um volume, da própria página da coleção. Continua sendo fato.

A coleção de Dostoiévski/Martin Claret (a que provou que "coleção" não é só
mangá) estava faltando livro — Martin Claret publicou mais Dostoiévski do que
os quatro que entraram no catálogo. O dono pediu: "deixe que o usuário
personalize sua coleção, isso é até legal, pq aí a pessoa controla o que
coleciona".

Perguntei antes de escrever código: "personalizar" queria dizer destravar a
busca (o mecanismo de `lib/conjuntos.ts`, `ligarAoConjunto`, já existe — só
tinha uma porta, `components/conjunto-do-livro.tsx`, na página do LIVRO) ou
deixar qualquer pessoa grudar qualquer livro em qualquer conjunto, virando
coleção pessoal solta? O dono escolheu a primeira — **o conjunto continua
sendo fato de edição, não opinião**, a mesma régua que `lib/conjuntos.ts` já
escreve. Só a PORTA era o problema: faltava dar pra adicionar de dentro da
própria coleção, sem precisar navegar até cada livro.

`app/colecao/actions.ts` ganhou `adicionarVolume()`: recebe o slug do livro
(o que a busca do catálogo devolve — `Hit` não carrega workId, só o
endereço), resolve o id por dentro, e chama o mesmo `ligarAoConjunto()` de
sempre. `components/adicionar-volume.tsx` é a busca — só sobre livros JÁ no
catálogo (`source === "gume"`); um resultado vindo de fora ainda precisa
ganhar ficha primeiro, do jeito que o Cmd+K já exige em duas etapas.

A porta entra nos DOIS estados de `app/colecao/[slug]/page.tsx`: a coleção
completa (pode voltar a ficar incompleta, se uma edição nova entrar — e é
assim que deve ser, a coleção completa é o fato de HOJE, nunca um teto
guardado) e a "ainda não" (onde a porta importa mais: é exatamente ali que
completar faz sentido).

---

## A porta pra dentro da coleção não podia depender de já estar completa.

Bug que sobrou da fatia anterior: a página da coleção (`/colecao/[slug]`) já
tratava os dois estados — completa e "ainda não" — e o widget de adicionar
volume já estava nos dois. Mas o CARD compacto (`components/conjunto.tsx`,
o que aparece no perfil e em `/colecao`) só oferecia dois jeitos de chegar
lá — a medalha e o link "ver a página desta coleção" — e os dois estavam
atrás de `c.completo`. Uma coleção incompleta não tinha link nenhum pra sua
própria página, então o widget de adicionar volume existia e era
inalcançável.

O dono: "eu devo ter o poder de editar uma coleção mesmo ela não estando
completa, porque às vezes tá errada, faltando edição etc" — exatamente o
caso que mais precisa da porta: colecionar errado (edição faltando, volume
ligado ao conjunto errado) é tão real quanto colecionar tudo, e conta a
mesma história do widget em si (a coleção completa é o fato de HOJE, nunca
um teto guardado).

O link "ver a página desta coleção" perdeu o `c.completo &&` — fica sempre
visível. A medalha continua só na coleção completa: ela significa "isto
está completo", e mostrá-la numa incompleta mentiria.

---

## O botão de adicionar volume mora no próprio card, não só na página.

Seguida direta da entrada anterior. Depois de a porta pra dentro da coleção
deixar de depender de estar completa, o dono perguntou: "o que acha de ter
um botão de ver página e outro de adicionar volume? pra pessoa não ter que
entrar na página pra add volume, pq até entrar ela não sabe que é
possível". Concordei e implementei: sem o segundo botão, "adicionar volume"
era um recurso invisível atrás de uma navegação — quem nunca abriu a página
de uma coleção específica não tinha como descobrir que dava pra completá-la
por ali.

`components/conjunto.tsx` (o card compacto, o que aparece no perfil e em
`/colecao`) ganhou o mesmo `<AdicionarVolume>` que já vivia em
`app/colecao/[slug]/page.tsx`, ao lado do link "ver a página desta
coleção" — os dois agora convivem no card, cada um resolvendo um problema
diferente (ver vs. editar), e nenhum depende do outro. Continua atrás de
`podeEditar`: quem não é dono do conjunto não vê o botão, do jeito que já
não via a busca dentro da página.

---

## Relatar um problema não pede conta, porque o bug pode ser o motivo de não ter uma.

O dono: "também tem que ter um botão visível em todo o site para reportar
um problema, aí a pessoa consegue mandar um email pra [a caixa de quem
cuida do Gume]". A ação foi pensada do lado de fora: `components/report.tsx`
já existia para denunciar uma PESSOA, mas exige estar logado, porque faz
sentido perguntar quem está denunciando. Um bug no app é o caso oposto —
quem esbarra nele pode não ter conta ainda, e é bem capaz de ser justo essa
a razão de não conseguir criar uma. Fechar a porta atrás de um login teria
calado exatamente quem mais precisava de um jeito de avisar.

Por isso `relatarProblemaAction` (`app/relatar/actions.ts`) não chama
`getActor()`, de propósito — entrou em `SEM_PORTEIRO`
(`lib/acoes.test.ts`) e em `PUBLICO` (`lib/surface.test.ts`) com o motivo
escrito, os dois lugares que este repo usa pra marcar uma exceção como
deliberada, não esquecida. Quem autoriza no lugar de uma sessão é o limite
por IP (`RATES.relatarProblema`, três por hora — ver `lib/rate-limit.ts`),
igual à busca de código por e-mail no meio do login.

O e-mail vai para `CAIXA_DA_MODERACAO()` (`lib/email.ts`), a mesma caixa
que já recebe denúncia e correção — nenhum endereço novo hardcoded, porque
`EMAIL_MODERACAO` já é a variável que existe pra isto, e o Gume não trava
um endereço de dono no código-fonte de quem hospeda a própria instância.

O botão fica no canto inferior DIREITO, sempre visível, em toda tela — o
mesmo canto de `components/voltar-ao-topo.tsx` (o elevador), um degrau
acima de onde ele nasce. Primeira versão pôs os dois em cantos opostos
("pra não disputar lugar"), mas à esquerda mora a coluna do site inteira, e
o rodapé dela é a foto de quem está logado: o botão sentava em cima da
própria foto. O dono, ao ver ao vivo: "acho melhor ficar no lado direito
igual todo site faz e ser um pouco menor" — os dois cantos direitos
convivem porque o elevador só aparece depois de duas telas de rolagem, e
este fica visível o tempo todo; empilhados, nunca ao mesmo tempo colidem
com o mesmo espaço vazio. O botão também encolheu (de 44px pra 36px).

---

## O ISBN de dez dígitos também é um ISBN.

O dono, direto do celular: "fui adicionar um ISBN num livro... quando
coloquei o ISBN13 aparece que deu um erro ao salvar e isso é um problema
nosso. E quando coloco o ISBN10, ele aparece que salvou, mas o campo do
ISBN continua em branco". Dois bugs, uma causa: `editions.isbn13`
(`lib/db/schema.ts`) é a única coluna que o catálogo guarda, e é `UNIQUE`.

O de treze dígitos que dava erro: colidia com o `isbn13` de OUTRA edição
já cadastrada, e a ação de servidor não tratava esse erro — ele escapava
cru, o Next apaga a mensagem real em produção, e a pessoa via um "erro
nosso" sem saber o quê. `saveBookEdit` (`app/livro/[slug]/curation-actions.ts`)
agora pega o código 23505 do Postgres (a mesma lição que `app/perfil/actions.ts`
já tinha aprendido, embrulhado em `err.cause.code`) e devolve "esse ISBN
já pertence a outra edição no catálogo" — a verdade, em vez do genérico.

O de dez dígitos que sumia: o código só aceitava treze dígitos, e qualquer
outra coisa — inclusive um ISBN-10 real, o que está impresso em toda
edição de antes de 2007 — virava `null` em silêncio. A tela dizia "salvo"
porque tecnicamente salvou: salvou um branco.

Um ISBN-10 e o ISBN-13 do mesmo livro não são "dois números parecidos":
são o MESMO número, um com "978" na frente e o dígito verificador
recalculado — conversão aritmética, documentada, sem perda. `lib/isbn.ts`
faz essa conta (`paraIsbn13`), com um teste que confere contra um par
publicamente conhecido (`0-306-40615-2` ↔ `978-0-306-40615-7`), não só
contra a própria implementação. Um texto que não bate em dez nem treze
dígitos agora volta como erro explícito — "isso não parece um ISBN" — em
vez de outro branco calado.

---

## Um ISBN colidido não é um beco: é a mesma edição, e agora dá para juntar.

O dono, direto: "se pertence a outra edição, quer dizer que é o mesmo
livro, certo? Não tem como ter uma opção de dar merge?" Sim — um ISBN é o
número de UMA edição publicada, e colidir com ele não é "parecido", é a
MESMA edição cadastrada duas vezes. O Gume já tinha fusão de OBRA
(`fundirObras`/`fundirLivros`, o caso do Frankenstein com o tradutor
gravado como autor). Faltava o equivalente mais estreito, de EDIÇÃO.

Duas formas de a colisão acontecer, e a tela distingue:

- A edição dona do ISBN já é desta MESMA obra: duas linhas de edição para
  um livro só. `fundirEdicoes` (`lib/corrections.ts`) junta — quem tem a
  cópia, quem está lendo, a proposta de capa pendente passam para a que
  sobrevive — e `saveBookEdit` oferece isso na hora, sem exigir nova
  tentativa. Sem checagem de conflito: diferente de obra, uma edição não
  guarda nota nem resenha (isso vive na obra), só logística que migra sem
  perder nada.
- A edição dona é de OUTRA obra: as duas obras provavelmente são a mesma
  ficha duplicada, só achada pelo ISBN em vez do autor. `saveBookEdit`
  devolve pelo MESMO campo `gemea` que o choque de autor já usa —
  reaproveita a tela "é o mesmo livro?" que já existia, em vez de duplicar.

Cheguei a "consertar" um suposto ponto cego em `fundirObras` — a ideia de
que duas obras fundidas poderiam cada uma já ter uma edição com o mesmo
ISBN, e o `UPDATE` em bloco estouraria o UNIQUE. Escrevi o remendo, escrevi
o teste, e o próprio Postgres recusou montar o cenário: `editions.isbn13`
é único GLOBALMENTE, sempre foi, e reatribuir `work_id` não toca `isbn13`
— duas linhas com o mesmo ISBN nunca chegam a coexistir no banco para
começo de conversa. O remendo defendia contra um estado impossível.
Revertido antes de virar código morto. `lib/fundir-edicoes.sql.test.ts`
guarda a explicação, para não reaparecer.

---

## O ícone ganhou o vidro roxo, e o app ganhou um manifesto de verdade.

O dono trouxe um logo novo ("pra você alterar quando alguém for usar o
site como app") — a mesma marca (livro + fio), mas na pele nova do
`cinza-roxinho`: fundo roxo-escuro com textura e um brilho na borda, em vez
do grafite chapado que `assets/logoiconpreto.png` guardava desde antes da
troca de paleta. Substitui a arte-fonte e rodei `pnpm brand` — o script já
existente que recorta e gera tudo a partir dela; nada foi redimensionado à
mão. `app/apple-icon.png`, `public/favicon.ico` e
`public/logo/icone-grafite-1024.png` saíram atualizados de lá.

`assets/logoiconbranco.png` (a pele clara, "para fundo claro e para
papel") **não** foi trocada — só ganhei um arquivo novo, o escuro. Ela
continua no estilo antigo, chapado, e agora destoa do grafite: um problema
pequeno, porque a própria `docs/design.md` já dizia que a pele clara "não é
o padrão em lugar nenhum". Registrado aqui para não ser esquecido, não
para ser resolvido calado.

Faltava, além disso, o manifesto do app (`app/manifest.ts`) — sem ele, só
o Safari/iOS tinha um "Adicionar à Tela de Início" de verdade (mecanismo
próprio da Apple, não depende de manifesto). No Chrome/Android, "usar como
app" era um atalho pobre: sem ícone redondo do sistema, sem tela cheia, sem
nome no app switcher. `scripts/brand.mjs` ganhou dois exports a mais
(`public/icon-192.png`, `public/icon-512.png`, do mesmo recorte do
grafite — nunca uma terceira cópia da arte), e `app/manifest.ts` os
referencia com `display: "standalone"` e as cores do canvas escuro
(`#17151d`, o mesmo de `app/globals.css`).

De brinde, `app/layout.tsx` ganhou `viewport.themeColor` (claro e escuro,
via `prefers-color-scheme`) — a barra de endereço do celular passa a ser a
cor do canvas em qualquer visita, não só no app instalado.

`docs/design.md` — "o ícone vive em exatamente três lugares" virou cinco,
com os dois novos do manifesto.

---

## Página lida volta — não como ritmo, como o segundo caminho de uma escada que já existia.

Em 2026-07-12, `lib/stats.ts` passou a dizer, com essas palavras: "FORA, e
não volta: página lida, meta, velocidade, ritmo, e qualquer número que
meça produção." O dono pediu agora um contador de páginas nas
estatísticas e na home, e honra por página lida — e a resposta não foi
implementar calado por cima de uma frase que dizia "não volta". Foi
mostrar a frase, mostrar as outras duas (`app/page.tsx`, `lib/honras.ts`)
que diziam a mesma coisa, e perguntar se ele queria reverter sabendo
disso. Ele quis: "sim, sabendo que isso reverte, reverter tudo."

O argumento dele: "imagina que eu estou lendo o Conde de Monte Cristo,
levo meses pra terminar e não sinto que avancei — número de livros só
beneficia volume de livros; se eu quiser ler um livro longo, eu não sinto
[que valeu a pena]." E um furo real na recusa de 07-12: ela juntou RITMO
(quão rápido, quão seguido — isso É cobrança, e continua banido) com
VOLUME (quanto, na vida inteira — que "livros lidos" já media, do lado,
sem que ninguém achasse isso opressivo). Um livro de 1200 páginas contar
"1", igual a uma novela de 150, é a mesma injustiça que a escada de honra
já tinha resolvido para mangá-vs-romance (uma escada só, e não duas) —
só que ao contrário: lá a HQ curta não valia menos; aqui o livro longo
não valia mais.

## O que mudou

**As estatísticas e a home.** `Stats.pages` (`lib/stats.ts`) soma
`page_count` das edições dos livros TERMINADOS — nunca progresso dentro
de uma leitura em curso, que segue banido (ver `lib/db/schema.ts`, "Do not
add this table back"). `null`, e não zero, quando nenhuma edição do que
a pessoa terminou tem página cadastrada: "sem contagem" não é "zero", e
um zero aqui se leria como fato — mesmo princípio que já regia paciência
e idade mediana nesta tela. Aparece em `/estatisticas` e no bloco "o ano"
da home (`app/page.tsx`), do lado do número de livros. A proibição de
comparar ESFORÇO entre pessoas continua de pé, inteira — página lida é
uma estatística SUA, nunca da comunidade, e `lib/stats.test.ts` prova que
nenhum termo de ranking/média/percentil entrou junto.

**A honra.** "Eu quero que tenha 2 possibilidades de subir: quantidade de
livros e de página — isso premia quem lê muitos livros pequenos e quem
lê alguns livros grandes." Continua UM anel, UMA barra no perfil — não
uma segunda escada, não um segundo selo. `melhorPosicao(livros, paginas)`
(`lib/honras.ts`) calcula os dois caminhos e usa o que levar mais longe,
degrau por degrau. A régua de páginas é a de leituras multiplicada por
300 — a estimativa comum de "um livro médio", escolhida porque ninguém
sobe mais fácil de um lado só por um número ter sido chutado maior ou
menor no outro; o paragon do topo (25 leituras por estrela) escala junto
(7.500 páginas).

`degrauNovo` (`lib/escada.ts`) ganhou um segundo parâmetro (`workId`)
porque agora precisa saber quantas páginas TEM o livro que acabou de ser
marcado como lido, para calcular o "antes" nas duas réguas ao mesmo tempo
— sem isso, terminar um livro gigante que sozinho cruza um piso de
página não anunciaria a subida.

## O que não voltou, e continua banido

Meta, ofensiva, velocidade, ritmo, streak, comparação de esforço entre
pessoas, e qualquer progresso DENTRO de uma leitura em curso. Nenhuma
dessas frases mudou; só "página lida", sozinha, saiu da lista.
`lib/honras.regras.test.ts` prova que a honra continua sem relógio, sem
placar, sem nota e sem punição por abandono — nenhuma dessas quatro
regras precisou mudar uma linha para acomodar o segundo caminho, e isso
é o teste de que a reversão é sobre UNIDADE, não sobre os princípios que
protegiam a página lida da forma errada de existir.

---

## O livro médio caiu de 300 para 250 páginas.

O dono, olhando a própria estante: "eu reduziria a quantidade de
páginas, estou vendo que está em média 300, eu colocaria 250". Um ajuste
de calibragem, não de princípio — `PAGINAS_POR_LIVRO` (`lib/honras.ts`)
é só o número que converte a régua de leituras na régua de páginas
mantendo os dois caminhos igualmente difíceis (ver a entrada anterior),
e não há um jeito "certo" de medir isso: é uma estimativa, e o dono
mediu a própria estante contra o número que eu tinha chutado.

A régua toda desceu junto (Bronze: 1.500 → 1.250 páginas; Gume: 150.000
→ 125.000; o paragon: 7.500 → 6.250 por estrela) — `pisoEmPaginas()` e
`paragonEmPaginas()` continuam sendo os únicos lugares que sabem o
número, então nada mais no código precisou mudar.

---

## Livro e página no mesmo card, e por que os dois números não batiam.

Duas coisas do mesmo pedido de tela.

**O card.** Livro e página entraram como dois cards separados no bloco
"o ano" da home. Com nacionalidade e editora, viravam quatro — e o
quarto sobrava sozinho numa segunda linha, quebrando a grade de três
colunas. O dono: "não gosto de cards assimétricos/sobrando, talvez a
qt de livros e de páginas podem ficar no mesmo card." `Numero`
(`app/page.tsx`) ganhou um `extra` opcional — um segundo número, menor,
dentro do MESMO cartão — porque livro e página já andam juntos (você lê
UM livro, não duas coisas), e voltam a caber três cartões cheios na
grade de sempre.

**Os números não batiam.** "A quantidade de páginas no meu perfil e
ranking não está batendo com a quantidade de páginas nas minhas
estatísticas." Investigado contra o banco de produção, não suposto:
`lib/escada.ts` sempre contou "lido" por `library_entries.status`;
`lib/stats.ts` sempre contou só por uma `readings` com `finished_on`.
Um lote de import (Goodreads) gravou 22 livros com o status "lido" vindo
da prateleira de origem, no mesmo dia — sem data de término no arquivo
importado, e o importador grava uma `readings` com as três datas nulas
em vez de nenhuma linha (`lib/import/aplicar.ts`). `status = 'read'`
sabia que o livro tinha sido lido; `readings.finished_on` não sabia
quando, e `lib/stats.ts` só perguntava a ela.

As duas contas sempre foram fatos diferentes com o mesmo nome, e ficaram
invisíveis até página virar um número comparável lado a lado.
`finished()` (`lib/stats.ts`) agora aceita `status = 'read'` também, mas
SÓ na vida inteira (`ano = sempre`): por ANO continua exigindo uma data
real, porque inventar uma seria mentir ("terminado em 2019" quando
ninguém sabe se foi). Um livro sem data nunca aparece num ano específico
— só na vida inteira, exatamente como a honra sempre tratou. Nenhum dado
foi alterado no banco: nenhuma data foi inventada para preencher os 22
livros, porque isso seria a mesma mentira, só que gravada.
`lib/stats.sql.test.ts` prova os quatro casos contra o Postgres de
verdade: lido com data, lido sem data (o bug), lendo, abandonado.

---

## Uma sugestão exige estante, e um bug de anos ficava escondido atrás dela.

Três pedidos, uma manhã.

**1. Ninguém deveria ser sugerido com zero livros.** "Quando alguém entra
no Gume, aparece um monte de gente aleatória pra seguir. Aqui tem que
aparecer quem tem pelo menos 10 livros na estante." O piso de
`getShelvesToFollow` (`lib/invite.ts`) era "pelo menos UM livro
público" — uma conta recém-criada com um livro solto já bastava para
virar sugestão pra todo mundo que chegasse sozinho. Trocado para
`LIVROS_DO_AMIGO` (`lib/regras.ts`, hoje 10) — a MESMA régua do selo de
arauto, e pela mesma razão escrita lá: "o ponto em que alguém parou de
experimentar e passou a usar."

**E um bug de verdade, achado no caminho.** O print que motivou o pedido
mostrava SEIS pessoas, todas com "0 LIVROS" — inclusive uma com 126
livros públicos de verdade. Não era o piso; era a coluna `books` do
`SELECT`, e o Drizzle tem uma pegadinha real: `${users.id}` interpolado
numa cláusula WHERE vira `"users"."id"` (qualificado), mas o MESMO
`${users.id}` interpolado dentro de uma subconsulta do SELECT vira só
`"id"` (sem tabela) — e ali dentro, `"id"` cru resolve para a tabela
mais próxima que também tem uma coluna `id`, que é `library_entries`, e
não `users`. A condição virava `le.user_id = le.id` — dois UUIDs que
nunca coincidem — e a contagem dava zero, sempre, para todo mundo.
Confirmado comparando `.toSQL()` dos dois casos antes de mexer, e
consertado trocando `${users.id}` por `users.id` cru (seguro aqui: é um
nome de tabela fixo no próprio código, não dado de fora). Bug
pré-existente, sem relação com o piso — só ficou visível porque os dois
foram investigados juntos.

**2. A resenha no perfil não dava pra ler, e tinha um retângulo estranho
embaixo da capa.** components/perfil-abas.tsx cortava a resenha em
quatro linhas (`line-clamp-4`, de propósito: "a lista onde cada item tem
seis parágrafos deixa de ser uma lista") mas nunca dizia como ler o
resto — ganhou um link "ler resenha inteira" explícito, em vez de
depender de a pessoa adivinhar que clicar na capa ou no título levava
para lá.

O retrato fantasma: o `<li className="flex gap-5">` esticava (o
`align-items: stretch` padrão do flex) o `<Link className="cover-lift">`
até a altura da COLUNA DE TEXTO — título + quatro linhas + data, bem
mais alta que a capa. A capa em si ficava do tamanho certo
(`aspect-2/3`), mas a sombra e o brilho de `.cover-lift` (que cobrem
`inset: 0`, 100% do PRÓPRIO elemento) cobriam o Link inteiro, esticado —
sobrava um retângulo com sombra e gradiente embaixo da capa de verdade.
`items-start` no `<li>` resolve. O mesmo padrão (capa + texto alto)
existia em components/explore.tsx ("resenhas recentes") e foi corrigido
junto, mesma causa.

**3. A página do livro não mostrava resenha de mais ninguém.** "Quando
alguém faz uma resenha pública de um livro, a resenha das pessoas devem
aparecer na página do livro." Não existia NENHUMA consulta buscando
"resenhas deste livro, de outras pessoas" — só a SUA, no editor de
"arrumar". `getResenhasDoLivro()` (`lib/explore.ts`) é a mesma régua de
visibilidade de sempre (`visibleTo()`, no SQL), com uma exclusão a mais:
a resenha de quem está olhando NUNCA aparece na lista — ela já está
aberta, em cima, no editor. `components/resenhas-do-livro.tsx` expande
no lugar ("ler resenha inteira" / "ler menos"), porque aqui não existe
"a página do livro" para onde linkar — a gente já está nela.

`lib/redteam.sql.test.ts` ganhou os três casos (pública aparece,
privada não aparece, a própria não duplica) na mesma bateria de ataque
que já existia para o resto do explorar — mesmas vítima/atacante, e uma
obra nova só para não colidir com um teste de IDOR que já assumia zero
resenhas na obra original.

Verificado: tsc --noEmit, next lint, vitest run (1120 testes — 3 novos
em lib/invite.sql.test.ts, 3 novos em lib/redteam.sql.test.ts), next
build completo.

---

## Calhamaços Martin Claret é uma lista, não um conjunto — e destravou um autor quebrado.

O dono: "estou pensando em criar a coleção calhamaços martin claret...
crie e já coloque os que eu tenho: guerra e paz, ana kariênina, conde de
monte cristo, dom quixote, os miseráveis, divina comédia."

Seis autores diferentes (Tolstói, Dumas, Cervantes, Hugo, Dante) não são
um conjunto editorial — não formam UMA obra em volumes, como a
Dostoiévski da Martin Claret (ver a entrada "Adicionar um volume..."
mais acima). É um agrupamento por gosto, e é isso que `collections`
(lista) já existe para fazer. Perguntei antes de criar; o dono confirmou
lista.

Anna Kariênina ficou de fora: não existe na estante dele. Os outros
cinco pedidos já estavam lá, como "quero ler" — nenhum possuído ou lido
ainda. Perguntei se "os que eu tenho" queria dizer "os já catalogados,
do jeito que estão" ou "só depois de marcar como possuído primeiro"; o
dono escolheu a primeira. `scripts/calhamacos-martin-claret.mjs` cria a
lista e liga os cinco, na ordem pedida.

**E um bug de catálogo, achado no caminho.** "Os miseráveis" existia
DUAS vezes: uma com Victor Hugo (o autor certo), outra com um autor
chamado, literalmente, "invalid author ID" — resíduo de um import que
falhou e gravou a própria mensagem de erro como se fosse um nome. A
ficha quebrada era a que estava na estante do dono, e era a única leitora
dela. Fundida na ficha certa com a mesma operação que o catálogo já usa
para duas fichas do mesmo livro (`fundirObras`, `lib/corrections.ts`,
reescrita em SQL cru no script pelo mesmo motivo do script anterior:
bootstrap, não uma correção simulada de leitor). A ficha de autor órfã
saiu do catálogo depois — confirmado que nenhuma outra obra a usava.

O script é idempotente (rodar de novo não duplica nada) e foi rodado
direto em produção, com verificação por SQL antes e depois de cada
passo.

---

## Dostoiévski existia como dois autores — e nenhuma edição desapareceu ao virar um.

O dono pediu pra ligar o "Crime e Castigo" dele ao conjunto "Dostoiévski
— Martin Claret" (ver a entrada "Adicionar um volume..."). O livro dele
estava numa ficha duplicada: o catálogo tinha "Fyodor Dostoyevsky" (10
obras — é quem já estava no conjunto) e "Fiódor Dostoiévski" (5 obras)
como duas PESSOAS diferentes. A mesma pessoa, grafada duas vezes — o
mesmo bug do "Frankenstein" que `lib/corrections.ts` já documenta, só
que em quatro títulos ao mesmo tempo: Crime e Castigo, O Idiota, Noites
Brancas, Os Irmãos Karamázov. Um outro leitor (@alexssander-affonso-da-silva)
também tinha dois desses (O Idiota, lendo; Noites Brancas, lido) na
metade errada.

O dono, antes de eu tocar em qualquer coisa: "pode fazer conserto desde
que esteja correto. Por exemplo, dostoievski da martin claret e do clube
de literatura clássica são edições diferentes de editora diferente, não
pode sumir." Confirmado ANTES de rodar, e não depois: `fundirObras()`
nunca apaga edição — ela MOVE todas as edições da ficha que sai para a
que fica. As sete edições das quatro obras (Martin Claret em três
variantes, Todavia, Clube de Literatura Clássica) sobreviveram inteiras,
só reagrupadas — conferido edição por edição depois de rodar.

`scripts/dostoievski-desduplicado.mjs`: funde as quatro obras primeiro
(`fundirObras`), e só depois os dois autores (`fundirAutores`) — na
mesma ordem que `fundirAutores()` já exige sozinha (ela recusa fundir
dois autores que ainda compartilham um título). "Fyodor Dostoyevsky"
sobrevive — mais obras já ligadas, e é quem já estava no conjunto —
"Fiódor Dostoiévski" vira apelido buscável dele. Por fim, o "Crime e
Castigo" do dono virou "tenho" (`owned_copies`): ele disse "eu já tenho
crime e castigo", e um conjunto conta posse, não intenção — sem isso o
conjunto mostraria "0 de 4" mesmo depois do conserto.

Idempotente (cada passo confere o estado atual antes de agir, provado
rodando duas vezes), rodado direto em produção, verificado por SQL antes
e depois: as edições, as duas estantes (a do dono e a de
@alexssander-affonso-da-silva) e o "1 de 4" do conjunto, todos
conferidos depois de rodar.

---

## A capa certa na estante, não só na ficha do livro.

O dono, direto de um print: "na lista Os Miseráveis aparece com essa
capa (não é a minha), e quando eu clico aparece com a capa correta,
como corrigir isso?"

`app/estante/[slug]/page.tsx` escolhia a capa de cada item pegando a
edição mais ANTIGA por `created_at` — crua, sem checar se ela TINHA
capa. A página do livro (`app/livro/[slug]/page.tsx`) e o leque de
`/listas` (`lib/listas.ts`) já pulavam edição sem capa; só a grade da
estante não.

A causa de aparecer AGORA, e não sempre: um lote de import grava várias
edições com o MESMO `created_at`, até o microssegundo — e sem critério
de capa, o desempate virava a ordem (arbitrária) do UUID. Podia cair
numa edição sem capa, ou de outra editora, em vez da que a ficha do
livro mostrava. Confirmado contra produção: as 6 edições de "Os
Miseráveis" tinham todas o mesmo `created_at` de um import em lote, e a
edição escolhida pela ordem crua era da Cosac Naify — não a Martin
Claret que aparece na ficha.

`edicaoPreferida()` (`lib/shelf.ts`) extrai a escolha para um lugar só —
havia uma cópia idêntica em `lib/shelf.ts` (usada por `getShelf()`, já
certa) e uma cópia SOLTA, errada, em `app/estante/[slug]/page.tsx`. As
duas agora chamam a mesma função. A regra: `(cover_url is null)` na
FRENTE do `order by` — não um filtro `where cover_url is not null` — pra
nunca ficar sem edição nenhuma quando existe ao menos uma (quem chama
também quer editora e páginas, não só a capa).

Varri o resto do catálogo por essa mesma cópia solta antes de corrigir
só esta: todo outro lugar que escolhe capa (página do livro, `/listas`,
os pôsteres do WhatsApp, o feed, `/explorar`) já filtrava `cover_url is
not null` direito. Era o único lugar quebrado.

`lib/shelf.sql.test.ts` (novo): prova o empate exato que causava o bug —
quatro edições com o mesmo `created_at`, só uma com capa — contra o
Postgres de verdade, e prova que uma obra sem capa nenhuma continua
mostrando o resto da ficha (editora, ano), não sumindo.

## A capa certa, de novo: faltava a edição que o dono ESCOLHEU, não só a que tem capa.

Depois de mergear o conserto acima, o mesmo print voltou: "aqui
continua com a capa errada". `edicaoPreferida()` desempatava certo
quando só UMA edição tinha capa — mas "Os Miseráveis" tem CINCO
edições com capa (não uma), todas do mesmo lote de import. Entre cinco,
o desempate por `created_at`/`id` ainda é arbitrário, e caiu de novo na
edição errada (Cosac Naify).

A causa real é outra: o dono já tinha ESCOLHIDO a edição Martin Claret
na própria estante (`library_entries.edition_id`) — é por isso que a
ficha do livro mostrava ela certo (via `minha`, a edição que ELE tem,
não um desempate). `getShelf()` (`lib/shelf.ts`) já respeitava essa
escolha (`coalesce(edição escolhida, edição possuída,
edicaoPreferida())`); `app/estante/[slug]/page.tsx`, a página de LISTA,
já fazia `leftJoin` com `libraryEntries` e `ownedCopies` do dono da
lista para status e nota de posse — só não usava a edição que eles
guardam ali, e chamava `edicaoPreferida()` crua.

`edicaoDoLeitor()` (`lib/shelf.ts`) extrai esse `coalesce` para uma
função só, ao lado de `edicaoPreferida()`; `getShelf()` e a página de
lista chamam a mesma agora — a mesma deduplicação de novo, um passo
adiante. Confirmado contra produção antes de escrever código, rodando a
query nova à mão: as 5 obras da lista Calhamaços Martin Claret voltaram
todas com editora "Martin Claret" e a capa certa.

Lição: o primeiro conserto testou o cenário certo (empate por capa) mas
não o cenário REAL (múltiplas edições com capa, e uma escolha explícita
do dono sendo ignorada) — confirmar a causa raiz contra os dados de
produção ANTES de assumir que o sintoma sumiu evita declarar vitória
cedo demais.

## Tirar um livro da lista, de dentro da própria lista.

O dono: "e como eu faço pra editar a coleção tipo, excluir um livro,
adicionar outro, eu não achei como tirar um livro da minha lista por
dentro da página da lista." Dava para adicionar (`PorNaEstante`) e
reordenar (`OrganizarEstante`), mas remover só existia num lugar: a
ficha do próprio livro, desmarcando a lista lá (`toggleInCollection`,
em `lib/curation.ts`) — uma porta que ninguém acha procurando na lista.

`tirarDaLista()` (`lib/listas.ts`) segue o mesmo padrão de dono checado
DENTRO do próprio `delete` que todo o resto do arquivo já usa
(`porNaLista`, `moverNaLista`): se a lista não for do ator, o delete não
acha linha nenhuma. Não mexe em `library_entries`/`owned_copies`/nota/
resenha — sair de uma lista que você montou não é sair da sua estante de
leitura, e as duas já eram conceitos independentes.

`OrganizarEstante` virou o lugar dos dois gestos (renomeado na tela para
"editar a lista", já que só reordenar não descreve mais o que ela faz):
remover pede um clique de confirmação por item, porque, ao contrário de
subir/descer, não tem como desfazer sozinho. O componente também passou
a aparecer com UM livro só (antes exigia dois, por causa do reordenar) —
uma lista de um item ainda precisa de como sair dela.

`lib/listas.sql.test.ts`: os dois casos de sempre contra Postgres de
verdade — o atacante tenta tirar da lista da vítima e não tira nada, o
dono tira e o livro some.

## A Dostoiévski — Martin Claret completa: 11 volumes, não 4, e um terceiro autor duplicado.

O dono levantou os 11 títulos da edição gráfica tipográfica (capa dura) da
Martin Claret direto na Amazon — título, tradutor, ISBN-10 e 13, páginas,
capa — numa planilha e 11 fotos, e pediu para criar/corrigir os livros e
atualizar a coleção para mostrar os pendentes, com a capa certa. Só "Crime
e castigo" é dele.

Investigando, o catálogo tinha um TERCEIRO Dostoiévski duplicado: além de
"Fyodor Dostoyevsky" (o sobrevivente da fusão anterior, ver a entrada
"Dostoiévski existia como dois autores") havia um "Fyodor Dostoevsky" (sem
o Y), com 14 obras — 7 delas duplicando um título que o outro autor já
tinha, incluindo um grupo de QUATRO fichas diferentes para "Diário do
subsolo" (duas chamadas "Cadernos do Subterrâneo", uma "Memórias do
Subsolo") e "O sósia" com um título literalmente quebrado por scraping
("O sósia Capa dura – 3 outubro 2022"). `scripts/dostoievski-colecao-completa.mjs`
funde cada par pelo padrão de sempre (fundirObras em SQL cru — nenhuma
edição apagada, só reagrupada) antes de fundir os dois autores, e só então
cria as 11 edições Martin Claret (`on conflict (isbn13)`, cobrindo tanto
"a edição já existia, só faltava a capa" quanto "a edição não existia
ainda" com o mesmo código) e sobe as 11 capas para o Blob.

O volume virou cronologia de verdade pela primeira vez: com 4 volumes a
convenção ("não é sequência narrativa, é o ano da obra original") não
tinha como aparecer torta; com os 11, Crime e Castigo deixa de ser o
volume 1 (a Martin Claret não começa a coleção nele) e vira o volume 7.

## Duas capas erradas A MAIS, e as duas eram a mesma causa da lista.

Depois do script, a página da coleção ainda mostrava a capa errada para
"Os Irmãos Karamázov" e "O idiota" — a MESMA causa raiz de "A capa certa
na estante, não só na ficha do livro", só que numa TERCEIRA e QUARTA
consulta que ninguém tinha varrido: `lib/conjunto-detalhe.ts` (a página de
dentro da coleção) e `lib/copies.ts` (o card recolhido do conjunto no
perfil). As duas escolhiam a capa por `order by created_at asc`, cru — e
uma edição Martin Claret ANTIGA (import em lote, sem tradutor, capa
emprestada da OpenLibrary) vencia a edição NOVA (tradutor preenchido,
ISBN de verdade, capa de verdade) só por ser mais velha.

A diferença desta vez: um conjunto tem editora DECLARADA
(`colecoes.publisher`), e as duas consultas passaram a preferir, nesta
ordem: (1) edição da editora do conjunto com capa e tradutor preenchido,
(2) edição da editora do conjunto com capa, (3) qualquer uma com capa. Ter
tradutor é o sinal de que alguém catalogou aquela ficha à mão, e não só
herdou o que veio pronto de um import em lote — sem esse terceiro degrau,
duas edições Martin Claret com capa (uma velha, uma nova) ainda empatavam
errado.

A ficha do livro (`app/livro/[slug]/page.tsx`) tinha o mesmo problema, por
um caminho diferente: `comCapa` era `book.editions.find(e => e.coverUrl)`,
sem nenhum desempate — a primeira com capa, na ordem que o Postgres
decidisse devolver. Ganhou o mesmo critério (prefere a que tem tradutor),
e `lib/book.ts` passou a trazer `translator` só para isso (não aparece na
tela). E a cópia do dono de "Crime e castigo" (`owned_copies`) ganhou a
edição certa (`edition_id`), porque sem ela nem esse critério ajudava: sem
edição escolhida, a página cai no mesmo desempate genérico, um livro à
frente.

`lib/conjunto-detalhe.sql.test.ts` e `lib/conjuntos.sql.test.ts`: o mesmo
teste nos dois lugares — duas edições da mesma editora, só uma com
tradutor, a mais nova — provado contra Postgres de verdade.

## O colecionador sai. "Acho que vai tirar muito o foco do app que é pra leitura."

O dono, direto: "eu quero tirar a funcionalidade de coleções (a parte de
colecionador, não de listas) acho que vai tirar muito o foco do app que
é pra leitura." O colecionismo nasceu de uma vibe explícita de card de
colecionador — "meio vibe quem gosta de carta pokemon tcg" (6 de
agosto) — e o app é sobre ler, não sobre completar uma prateleira.

**"Lista" não é isto, e continua intacta.** `collections`/`collection_items`
(a estante que a pessoa monta com as próprias mãos) é curadoria
subjetiva; o colecionador (`series`+`colecoes`, "4 de 14", selo dourado,
"adicionar volume") era catálogo objetivo — a distinção que este projeto
já tinha documentado antes, e que continua valendo mesmo com um dos dois
lados saindo.

### O que saiu, e o que ficou

- `colecoes` (tabela inteira) e `works.colecao_id` saíram (migration
  0062). `lib/conjuntos.ts`, `lib/conjunto-detalhe.ts`, `components/
  conjunto.tsx`, `conjunto-do-livro.tsx`, `selo-colecionador.tsx`,
  `adicionar-volume.tsx`, `comecar-colecao.tsx`, `app/colecao/[slug]/`
  e `app/colecao/actions.ts` saíram inteiros. A aba "coleções" do perfil
  (`components/perfil-abas.tsx`) saiu.
- `series` e `works.seriesId` **ficaram** — não são do colecionador, são
  da LEITURA: `lib/stats.ts` conta "12 livros, 30 volumes, 4 séries"
  separado (ler trinta volumes de Vagabond não é ler trinta livros), e
  essa é uma decisão de antes do colecionador existir (13 de julho).
- `works.volume` **ficou**, apesar de ter nascido preso à coleção (a
  migration 0038 dizia "é da EDIÇÃO, e não da série"). Na prática o
  campo virou mais genérico: `lib/corrections.ts` usa `(title, author,
  volume)` como parte da identidade de uma obra ao fundir duplicatas, e
  há um `unique(title, author_id, volume)` no schema. Dois scripts de
  manutenção (`autor-desconhecido.mjs`, `poda-ingles.mjs`) que
  checavam `colecao_id` para não mexer num volume de coleção passaram a
  checar `volume` — a proteção real sempre foi "isto tem identidade de
  número", não "isto pertence a uma coleção editorial".
- `owned_copies` (tenho/quero) **ficou inteira** — nunca foi do
  colecionador, só era AGRUPADA por `colecao_id` numa tela à parte.
  `/colecao` continua existindo, só que agora mostra só "o que você
  tem" avulso, sem os conjuntos por cima.
- O cliente da AniList (`lib/anilist.ts`) e o raspador de lojas
  (`lib/lojas.ts`) ficam no repo, sem uso — decisão do dono: "mantém,
  só desliga a tela". Os scripts de bootstrap que já rodaram em
  produção (`perfil-modelo-colecao-livro.mjs`, `dostoievski-colecao-
  completa.mjs`, `personagens-da-colecao.mjs`, `seed/lojas.ts`) ficam
  como registro histórico do que já foi feito — não foram reescritos
  para uma tabela que não existe mais, e não deveriam rodar de novo.
- `revisions.target_type = 'colecao'` (histórico de quem montou
  conjunto) continua válido — a constraint da migration 0061 não muda.
  `lib/contributors.ts` continua contando essas linhas antigas na
  página de contribuidores: o trabalho que alguém já doou ao catálogo
  não vira menos trabalho porque a função que o registrou saiu do ar.
  O número só para de crescer.

### Um efeito colateral: o próximo passo já está pedido

Com o colecionador saindo, a pergunta "onde entra 'tenho todos os
volumes de uma série, sem estar numa coleção editorial'" ficou em
aberto — o dono já pediu o começo da resposta: uma aba "coleção" dentro
da própria estante (`/estante`), ao lado de "esperando"/"lendo"/"lido",
mostrando tudo que a pessoa tem posse, "como o Skoob faz". Fica para
uma fatia própria, separada desta.

E os favoritos: o carrossel "o que eu adorei" (todos os 5 estrelas, sem
limite) vai virar uma seção de 5 livros escolhidos à mão, com um
coroado — inspirado no yourgamerprofile.com. Também fica para a fatia
seguinte.

## Os favoritos: até cinco, e o primeiro é o coroado.

Inspirado no destaque do yourgamerprofile.com — o dono mandou um print e
pediu: "ter seção de livros favoritos (onde a pessoa seleciona 5 e coroa
1) em vez de todos os livros que ela amou". Substitui o carrossel "o que
eu adorei" (rating 5, sem limite, automático) por uma escolha manual e
pequena.

`favorite_books` (migration 0063): `(user_id, work_id)` como chave,
`position` 1 a 5. A posição 1 É a coroa — nunca um booleano `crowned` à
parte, que pudesse discordar da posição algum dia. Coroar é mover para
a posição 1; quem estava entre a coroa e a posição antiga do favorito
desliza uma casa.

**Sem CHECK travando o intervalo, de propósito.** Reordenar dentro de
`unique(user_id, position)` sem colidir precisa de um offset negativo
temporário dentro da transação (todo mundo recua pro negativo, onde
não há como colidir, e só depois cada um grava a posição final) — e um
CHECK nunca pode ser DEFERRABLE no Postgres, só UNIQUE pode. Descoberto
escrevendo o teste: a primeira versão tinha o CHECK e a própria
transação de coroar() quebrava contra o próprio banco.

**Só quem leu favorita.** A trava é no INSERT, como toda escrita deste
app: sem uma `library_entries` com `status='read'` para aquele livro,
o select da fonte não devolve linha, e nada grava. Favoritar um livro
nunca lido não é favorito, é lista de desejo — que já tem lugar.

Onde mora: marcar/desmarcar é na ficha do livro (`components/
book-panel.tsx`, ao lado do veredito, só quando `status='read'`) — um
botão, um livro de cada vez. Coroar entre os cinco só faz sentido
vendo os cinco juntos, e mora em `/perfil`
(`components/gerenciar-favoritos.tsx`). No perfil público, os
favoritos substituem o carrossel antigo (`components/
favoritos-vitrine.tsx`, dentro de `perfil-abas.tsx`).

`lib/favoritos.sql.test.ts`: os três empates que só o Postgres decide —
coroar o último sem colidir, tirar do meio sem colidir, e o teto de
cinco recusando o sexto mesmo lido.

## O upvote entra. Comentário livre, não ainda.

"eu acho que deve ter upvote e comentário no gume, eu sei que isso vai
contra várias coisas, mas eu acho que vai funcionar como uma
ferramenta de socialização/conhecer novas pessoas" — o dono, sabendo
que reabre duas decisões antigas: o README prometia "sem curtida"; e
"sem comentários, nunca" (11 de julho), com duas razões — produto (o
feed fica quieto) e operacional (uma pessoa só modera isto, e
comentário é onde a moderação morre).

Escolha, apresentada e confirmada: **upvote agora, comentário fica
para quando houver um plano de moderação** (fila de denúncia, quem
modera o quê). A razão operacional da decisão antiga é sobre TEXTO
NOVO de estranho para alguém ler e julgar — um upvote não escreve
nada, não tem o que denunciar, não tem o que possa ferir. É a metade
barata da ideia, sem herdar o custo caro da outra metade.

`review_upvotes` (migration 0064): `(user_id, review_id)`, sem coluna
a mais. Vota em RESENHA, nunca em pessoa — o mesmo limite que
"queridinhos" já desenha (lib/queridinhos.ts): ordenar LIVROS pelo
carinho que receberam é permitido, ordenar GENTE pelo voto que recebeu
não é. Não existe, em lugar nenhum do app, um número de "quantos votos
esta pessoa já recebeu" — só o total de UMA resenha, na própria
resenha.

Três travas, checadas em Postgres de verdade
(`lib/upvotes.sql.test.ts`): ninguém vota na própria resenha; ninguém
vota numa que não pode ver (mesma `visibleTo()` de sempre, dentro do
próprio INSERT — não uma checagem separada que um refactor esquece de
chamar); votar duas vezes não conta duas.

Onde mora: o botão é em `components/resenhas-do-livro.tsx` (a única
tela que já lista resenhas de outras pessoas). A contagem sai junto de
`getResenhasDoLivro()` (`lib/explore.ts`), uma subconsulta por
resenha — sem `join` que multiplicasse linha.

**A copy mudou** onde prometia "sem curtida": README ("O que não vai
ser") e `ai/PRD.md` (item 7, "sem comentários"), os dois reescritos
para dizer a verdade nova sem prometer mais do que existe — comentário
continua fora, só o voto entrou.

## O upvote chega nas listas, "quem votou" fica visível pro dono, e os links do perfil.

Três pedidos seguidos do dono, no mesmo fôlego:

**"onde é possível dar upvotes? já que upvote é ferramenta de amizade, tem
que ser possível ver quem deu upvote. E quero que dê pra dar upvote em
resenhas e listas."** — `list_upvotes` (migration 0066), mesma forma de
`review_upvotes`: tabela própria, não uma FK polimórfica (este repo não usa
esse padrão em lugar nenhum). Upvote em lista NÃO é o mesmo gesto de
guardar (`collection_saves`) — guardar é comprometer, pôr a curadoria de
alguém dentro do próprio perfil; upvote é mais leve, "gostei", sem levar
para casa. Os dois convivem.

"Quem votou" segue exatamente o padrão que `quemGuardou()` já usava em
`lib/listas.ts`: o NÚMERO é público, a LISTA de rostos só para o dono — a
checagem mora dentro da própria consulta SQL (`c.user_id = viewer.id`),
nunca uma checagem separada que um refactor esqueceria de chamar. Diferença
deliberada de `quemGuardou()`: ali os rostos vêm prontos (uma revelação por
tela); aqui são buscados sob demanda, por uma ação de servidor, porque uma
lista de resenhas tem UMA revelação por resenha, e buscar todas de uma vez
seria trabalho pro banco que a tela não usa.

`lib/acoes.test.ts` pegou um real: as duas ações novas de "quem votou" são
endpoints públicos que devolvem rosto de gente, e não tinham teto de uso.
Corrigido com `limitarEscrita()`, mesmo em sendo leitura — um endpoint sem
limite é convite para raspar identidade em massa.

**"não achei onde colocar rede social."** — `users.social_links` (migration
0065), `text[]`, até 5. Sem "qual plataforma?": um enum fixo seria um
formulário fingindo saber toda rede que existe, a mesma lição de
`owned_copies.acquired_note`. Só a URL entra; o rótulo (Instagram, GitHub,
ou o domínio nu quando ninguém aqui conhece) se decide olhando o domínio,
em `lib/links-sociais.ts` — puro, sem banco, fácil de testar.

E o perfil modelo mockado (`@perfil-modelo`) saiu, pedido direto do dono —
`scripts/seed-perfil-modelo.mjs --undo`.

## O resumo do perfil, e os favoritos centralizados.

Continuação da tradução do yourgamerprofile.com. Três cartões novos no
perfil (`components/resumo-do-perfil.tsx`), reaproveitando os mesmos
gráficos de `/estatisticas` (extraídos para `components/graficos-leitura.tsx`
— um lugar só, e não duas cópias que um dia divergem): distribuição de
veredito (sem média, sem dígito de nota), gêneros mais lidos (a versão
comportada do gráfico radar do print) e o ano corrente (livros e páginas,
reaproveitando a régua que a honra já usa).

`lib/stats.ts` ganhou `getResumoDoPerfil()` — deliberadamente LEVE:
`getStats()` já calcula tudo isso e mais uma dúzia de coisas, pesado demais
pra rodar (duas vezes, vida inteira + ano) numa página vista bem mais que
`/estatisticas`.

**Fora, de propósito**: contador de seguidores/curtida (README: "sem
contador de seguidores") e o mapa de atividade estilo GitHub — perto demais
de "ofensiva" (streak), que o README também recusa. O print tem os dois; a
tradução para cá parou antes deles.

E os favoritos ganharam centralização e um anel dourado no coroado — "os
favoritos tem que estar centralizados e de forma mais bonita".

## A sinopse, escrita por quem edita o livro

**A dor:** só 185 de 1.132 livros nas estantes (16%) tinham sinopse — o
resto veio do dump da Open Library sem cobertura, e ficção brasileira é
onde ela falha mais (ver "O viés que obrigou a terceira fonte", acima:
Jorge Amado, zero de 25). "Se um usuário quiser colocar uma sinopse ele tem
que conseguir, ao clicar pra editar o livro" — o dono, direto.

**A tensão com "sinopse não é fato, é obra":** essa regra (a mesma que
recusou raspar a sinopse autorizada da Panini) nunca foi sobre proibir
sinopse — foi sobre **de onde ela pode vir**. Texto de terceiro com direito
autoral não entra num dataset CC0; texto que a PESSOA escreve, com as
próprias palavras, é o mesmo princípio que já sustenta a resenha, que é "o
produto do Gume, e não o da Panini". O campo (`components/correction.tsx`,
dentro de "Arrumar este livro") pede isso explicitamente no rótulo: "com
suas palavras, não copiada de outro lugar" — não é uma trava técnica (nada
impede colar), é a mesma aposta que já sustenta todo o resto da correção
livre: expor com nome quem editou é o que encarece fazer errado.

**A implementação, em `lib/curation.ts` (`editBook`):** a sinopse é mais um
campo da OBRA, ao lado de título e ano. A novidade é `descriptionSource`:
quando o texto muda por aqui, a fonte vira `'gume'` (mesmo valor que
`scripts/importar-biblioteca.mjs` já grava para sinopse trazida na
importação — não é um valor novo, é o mesmo caminho). Limpar o campo limpa
a fonte junto: um `null` não tem de onde ter vindo. E `descriptionSource`
grava no banco mas **não vira uma segunda linha no histórico** — ninguém
"corrigiu a fonte", corrigiu a sinopse, e ela já é uma linha; duas linhas
pra uma ação só, com o nome cru da coluna na segunda, é o tipo de vazamento
de jargão que este app promete nunca mostrar na tela.

Testado contra Postgres de verdade em `lib/curation.sql.test.ts`: a fonte
vira `gume`, a linha do histórico existe e é rotulada "sinopse", a fonte
não aparece como campo próprio, e limpar o texto limpa a fonte.

## O diário

Comparando com o Letterboxd — o dono trouxe um print do Diary dele. "é legal
também ter uma linha do tempo tipo um diario de livros terminados, isso vai
ajudar o usuario e tb quem quer ver o perfil da pessoa".

`lib/diario.ts`, aba nova em `components/perfil-abas.tsx`, ao lado de
estante/resenhas/listas: cada LEITURA, mais recente primeiro — inclusive as
releituras, que viram linha própria em vez de sobrescrever a primeira,
exatamente como `lib/leituras.ts` já promete na ficha de um livro. O
veredito mostrado é o do LIVRO (`ratings`, uma nota por pessoa por livro,
nunca por leitura — reavaliar a cada releitura não é o que a palavra-
veredito promete), e se repete em toda linha do mesmo título. "Tem resenha"
só acende na leitura que a resenha de fato referencia (`reviews.reading_id`
— já existia essa coluna, subaproveitada). Visível pra quem visita, filtrado
por `visibility` no SQL como sempre. Sem paginação nesta primeira versão
(teto de 120 leituras, mesmo padrão do histórico de correções).

Isto só foi possível construir de um jeito simples porque releitura já era
de primeira classe no banco — ver a entrada seguinte, sobre `book-panel.tsx`
ter ganhado o rótulo "reler" pro mesmo mecanismo que já existia.

Testado contra Postgres de verdade em `lib/diario.sql.test.ts`: a releitura
vira linha nova sem apagar a primeira, a visibilidade filtra igual a
`getLeituras`, e "tem resenha" só acende na leitura certa.

## Reler já existia, e ninguém sabia

"tem que ter uma maneira de reler um livro, se eu li uma vez ele fica como
lido, e se eu ler dnv?" — o dono. Investigando: `shelveAndRead`
(`lib/library.ts`) já tratava releitura como primeira classe desde antes —
"lendo" num livro "lido" abre uma segunda leitura; "lido" de novo a fecha,
sem apagar a primeira. `lib/leituras.ts`, o card "o que você releu" em
`/estatisticas` e `lib/escada.ts` já tratavam isso como conceito central.

O gap era descobribilidade, não função. `components/book-panel.tsx` agora
troca o rótulo do pill "lendo" para "reler" quando o livro já está "lido", e
um toast confirma o que aconteceu ("Nova leitura aberta. Quando terminar,
marque 'lido' de novo."). Sem migration, sem endpoint novo.

## O recorte público das estatísticas

"acho que dá pra gente pegar algumas coisas do your gamer profile... os
stats da pessoa podem ser vistos no perfil por outras pessoas" — mais o
print da janela de Stats do Letterboxd.

`/estatisticas` continua estritamente sua — segunda pessoa, números íntimos
(quantos livros esperam, a paciência) não são pra estranho ver, e "não
existe 'ver as estatísticas de um estranho'" continua valendo ao pé da
letra. Mas `getResumoDoPerfil()` (a versão leve que já alimentava o perfil
com veredito/gêneros/ano corrente) ganhou nacionalidade e formato — o mesmo
recorte que já separa "e a comunidade" (gosto) do resto da página (números):
GOSTO é público, POSSE não é. Cinco cartões agora em
`components/resumo-do-perfil.tsx`, todos vida inteira exceto o ano corrente.

Testado contra Postgres de verdade em `lib/resumo-do-perfil.sql.test.ts`:
nacionalidade e formato são o MESMO recorte pro dono e pro estranho, e uma
estante privada não vaza pra ninguém.


## A barra mais rica

"eu não gosto muito dos estilos de gráfico do gume, acho que tem q ficar
mais modernos e menos rústicos" — o dono, com um print do Letterboxd.

A barra continua sendo a única forma (pizza/donut escondem comparação de
tamanho atrás de ângulo, que o olho lê pior que comprimento — essa razão não
mudou, e o Letterboxd do próprio print também é tudo barra/medidor). O que
mudou foi a execução: mais grossa, pontas arredondadas (`rounded-full`, era
retângulo de aresta viva), mais saturada (opacidade de 30%/44% para
46%/62%), número maior e com peso, em vez de pequeno e cinza. Ainda cor por
ASSUNTO, nunca por valor — ninguém pintou o dado, só a barra que já existia.
Ver `components/graficos-leitura.tsx`.

## O ícone de cada rede social, e por que a cor da marca fica de fora

"não achei nenhum ícone bonitinho" — o dono, sobre os links do perfil. O
lucide-react (o único pacote de ícone que o Gume tinha) não desenha marca
nenhuma — Instagram, X, GitHub, todos vêm `undefined` na versão instalada.

Entrou `simple-icons` como dependência nova: um desenho por marca, licença
livre, exports nomeados (`sideEffects: false`), então importar só os ~16 que
o Gume usa não traz as milhares de marcas do pacote pro bundle. `lib/links-
sociais.ts` ganhou `slugDoLink()` ao lado de `rotuloDoLink()` — o mesmo mapa
de domínio, agora também dizendo qual desenho usar (`null` quando o Gume
reconhece o NOME mas não tem o desenho: Mastodon é federado, e o LinkedIn
saiu do simple-icons por pedido da própria empresa).

**A cor da marca fica de fora, de propósito.** simple-icons dá o hex oficial
de cada logo, e ele nunca chega na tela: "a ÚNICA coisa colorida no Gume é a
capa de um livro" (`components/veredito.tsx`) — um perfil com o rosa do
Instagram do lado do azul do Bluesky vira confete, e rouba a atenção que é
da capa. O DESENHO de cada marca entra (`components/icone-rede-social.tsx`);
a cor de cada marca não — `currentColor`, a mesma tinta neutra de todo ícone
do app.

## As estatísticas do perfil ganham gaveta, autor, editora e século

"no perfil os stats tem que ser um lugar que tu clica e vê, se não o perfil
vai ficar gigante novamente, além disso, ainda falta coisa: autores mais
lidos, editoras, século/decada" — o dono.

`getResumoDoPerfil()` ganhou três campos a mais (`authors`, `publishers`,
`centuries`), reaproveitando as MESMAS consultas de `getStats()`, lifetime,
mesma régua de `genres`/`nationalities`/`formats` já públicos. Oito cartões
agora, todos gosto (nunca posse) — a mesma linha que já separa esse resumo
de `/estatisticas`.

E o bloco inteiro entrou na `Gaveta` (`components/gaveta.tsx`, a mesma que já
esconde o que é raro na página de um livro): fechada por padrão, com o
número que mais importa (o ano corrente) já escrito no resumo de fora — abre
só quem quer o resto. `Seculos` (o gráfico de coluna por século) saiu de
`app/estatisticas/page.tsx` pra `components/graficos-leitura.tsx`, mesmo
motivo de sempre: um lugar só, as duas telas usam a mesma barra.

Cor nova: `--grafico-autores` (oliva), no maior vão livre entre os hues que
já existiam.

Testado contra Postgres de verdade em `lib/resumo-do-perfil.sql.test.ts`:
autor, editora e século são o mesmo recorte pro dono e pro estranho, e não
vazam de uma estante privada.

## O diário ganha o selo do mês, um filtro, e três fontes crescem

Três pedidos pequenos, na mesma rodada.

**"os posicionamentos devem ser mais criativos, olha que bonito o diário do
letterboxd"** — o print mostrava o selo de calendário (mês + ano) só na
primeira leitura de cada mês; as seguintes do mesmo mês mostram só o dia
solto, alinhado embaixo. `components/diario.tsx` ganhou esse agrupamento.
Data com só o ano (sem dia) fica fora do agrupamento — não tem mês pra
mostrar.

**"no diario dá pra ter os livros terminados e resenhas feitas também"** — um
filtro simples (`livros terminados` / `resenhas`) sobre a mesma lista,
usando o `temResenha` que já existia por linha; só aparece quando existe
pelo menos uma resenha, pra não oferecer um filtro vazio.

**"alguns containers, fontes etc são muito pequenos... tela do diario,
resenhas, titulos dos livros nas estantes"** — três ajustes: o título do
livro em `components/book-card.tsx` (a estante) de 15px pra 16px, o autor de
12px pra 13px; o nome de quem escreveu a resenha em
`components/resenhas-do-livro.tsx` de 13px pra 14px, o avatar de 36px pra
40px; e o próprio diário nasceu com capa maior (w-12, era w-10 nas versões
anteriores de listas parecidas) e título em 16px.

## O mapa múndi, calculado uma vez, nunca em produção

"em países, pq não fazemos um mapa mundi com um heatmap?" — o dono. A barra
de "de onde vêm os autores" virou um mapa, em `/estatisticas` e no resumo
público do perfil.

**A geometria nasce OFFLINE, e fica.** `scripts/gerar-mapa-mundi.mjs` usa
`world-atlas` (fronteiras do Natural Earth, domínio público) +
`topojson-client` + `d3-geo` pra projetar o mundo (geoEqualEarth, sem
Antártida — nenhum autor tem essa nacionalidade, e ela come espaço vertical
à toa) e escreve o resultado — 175 países, cada um já com o caminho SVG
pronto — em `lib/mapa-mundi-formas.ts`, commitado. Mesmo espírito dos
`scripts/backfill-*.mjs`: um enriquecimento que roda uma vez, não uma
dependência que viaja pra produção. `components/mapa-mundi.tsx` só LÊ essa
lista: nem `d3-geo` nem `topojson-client` entram no bundle do cliente, e o
build confirma — `/estatisticas` e `/perfil` não mudaram de tamanho com o
mapa, porque o componente é servidor puro, sem `"use client"`.

**A ponte do nome pro desenho**: `lib/pais-iso.ts`, uma tabela numérico-ISO
→ `{ iso2, nome em português }`, na MESMA grafia que `lib/paises.ts` já usa
como canônica onde as duas se cruzam. `paisPorNome()` casa pelo nome
normalizado (a mesma régua de `lib/paises.ts`) e devolve `null` pro que não
reconhece — o país correspondente fica cinza no mapa, nunca inventado. Três
territórios sem código ISO no Natural Earth (Kosovo, Chipre do Norte,
Somalilândia) ficam sempre cinza, por desenho.

**A cor por intensidade não é "cor por valor" proibida**: a regra de
`components/graficos-leitura.tsx` ("toda barra de um gráfico tem a MESMA
cor — quem compara é o comprimento") é sobre BARRA, onde a forma já tem um
eixo pra comparar. Um mapa de calor não tem comprimento, só geografia — a
intensidade da MESMA cor (`--grafico-paises`, o mesmo verde da barra
antiga) é a única linguagem que sobra, e ela mede quantos livros vieram
daquele país, nunca a qualidade de quem escreveu lá.

Testado: `lib/pais-iso.test.ts` (o nome e o apelido casam com o país certo,
o que não bate devolve `null`, sem iso2 nem nome duplicado na tabela).

## "Cuidar do acervo" sai do menu do avatar, fica só no painel

Continuação da rodada anterior. Perguntei se "no perfil" queria dizer o menu
do avatar (onde o link sempre morou, nunca em `/perfil`) — porque tirá-lo de
lá sem outro caminho deixaria bibliotecários e moderadores que não são o
idealizador sem nenhuma porta pra `/cuidar`. "eu quero que esteja no painel
e não no meu menu do avatar, tendeu?" — o dono confirmou, revendo a própria
decisão anterior (documentada como "é um PAPEL e não um lugar").

O link saiu de `components/sidebar.tsx` (desktop e celular) — o atalho pra
`/cuidar` já existia dentro de `/painel` (aba moderação, `components/painel.tsx`),
então nada precisou nascer, só a porta velha fechou.

De quebra: `souModerador()`/`podeVerAFila()` saíram de `app/layout.tsx`. Elas
só existiam ali para acender esse link — rodavam em TODA página de TODA
visita, para decidir se um botão aparecia, e o botão não existe mais. As duas
funções continuam de pé (usadas em `/cuidar`, `/pedidos`, `/moderacao`), só
pararam de rodar de graça em cada carregamento do app inteiro.

Hoje só o dono é idealizador e bibliotecário ao mesmo tempo, então não há
ninguém realmente sem porta agora — mas é a troca real: quando houver um
segundo bibliotecário, ele só chega em `/cuidar` sabendo a URL de cor, até
`/painel` ganhar um jeito de abrir pra além do idealizador (não hoje).

## A bola virou coluna, o mapa ganhou um escape, e o leque abre no hover

Três achados olhando a tela ao vivo, todos pequenos.

**"isso aqui parece uma bola"**: `material()` (`components/graficos-leitura.tsx`)
arredonda em 999 (pílula) — perfeito numa barra deitada, larga e baixa, onde o
raio nunca chega perto de fechar um círculo. Numa COLUNA de século curta e
estreita, largura e altura ficam perto uma da outra, e 999 vira bola de
verdade. Colunas agora arredondam só o topo, raio fixo pequeno — base reta,
encostada no eixo, como todo gráfico de coluna.

**"o mapa nao apareceu nas estatisticas"**: não era bug do mapa. `/estatisticas`
sem `?ano=` na URL filtra pro ano corrente, e a consulta de nacionalidades
sempre respeitou esse filtro — um ano sem livro com nacionalidade cadastrada
apagava o cartão inteiro, sem dizer por quê. Mesma armadilha que o "Nada
terminado" no topo da página já resolve pro total de livros; o cartão do mapa
ganhou o mesmo escape ("Ver a vida inteira").

**"quando coloca o mouse o leque abre um pouquinho igual nas listas"**: o
leque de `components/lista-card.tsx` já respirava no hover
(`.leque > *` em globals.css, animado no `:hover` do card ancestral) — os
cards de PESSOA (`components/amigos-lendo.tsx`, `components/explore.tsx`)
tinham a MESMA classe `leque` só de nome; o giro estático de cada capa ia
direto num `transform` inline, que sempre vence CSS externo, então a regra de
hover nunca tinha chance. `estiloDoLeque()` (`components/leque-capas.tsx`)
agora escreve o giro numa custom property (`--giro`), e o CSS soma o giro do
hover por cima — os dois nunca mais competem pelo mesmo `transform`. De
quebra, capas maiores nesses dois lugares, e o Top 100 (`/explorar`) ganhou
o mesmo lift de capa que o resto do app já tem (o `.card` só erguia o
CARTÃO inteiro 2px; a capa ficava parada).

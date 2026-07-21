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

**Está revertido, a pedido do Gabriel, e o motivo dele é bom:** ordem de chegada **não é neutra**, é só outra ordem. Com cem pessoas na lista, ela **enterra quem mais cuidou do catálogo** embaixo de quem simplesmente se cadastrou antes. Este projeto promete, em voz alta, que **quem conserta uma capa vale o que vale quem faz um commit** — e reconhecimento que ninguém consegue **ver** não é reconhecimento, é uma frase bonita num arquivo que a gente escreveu para si mesmo.

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

**Está revertido, a pedido do Gabriel, e a distinção dele é a coisa boa desta entrada:**

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

A moderação nasceu presa ao bibliotecário, e isso estava errado. O Gabriel pegou: *"eles já têm muito poder"*.

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

**DECISÃO DO GABRIEL:** fonte em português primeiro. Nada de tradução automática — ela
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

**DECISÃO DO GABRIEL**, entre três direções desenhadas: a brasa (o terracota que já
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

**DECISÃO DO GABRIEL:** *"eu vou gamificar o app… vamos ter que mudar nossas políticas,
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

O README listava "sem IA generativa escrevendo sobre a sua leitura" ao lado de "sem ofensiva" e "sem placar", como um valor de marca. E o Gabriel apontou a incoerência: o app é construído com IA, do primeiro commit a esta linha. Disavowar a ferramenta que a gente usa todo dia, na porta de entrada, é pose, e pose é a única coisa que este README não pode ter, porque a tese do projeto é confiança.

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

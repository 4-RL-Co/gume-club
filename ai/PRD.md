# PRD: Gume v1

## Para quem é

**Leitores brasileiros.** Este é um projeto brasileiro de código aberto: o produto é em português, o catálogo é português primeiro, e a comunidade que ele serve é a que ninguém serviu direito desde que o Skoob começou a cair aos pedaços.

Concretamente: leitores de clássicos (Antofágica, Martin Claret, Editora 34, Companhia das Letras), leitores de filosofia e leitores de mangá. Na maioria, livros físicos. Um ou dois livros por mês. Pessoas que querem um registro bonito do que leram e um pequeno círculo em cujo gosto confiam.

**Este é um projeto de fim de semana**, e o escopo é implacável por causa disso. Os primeiros dez usuários são amigos do Gabriel, pelo nome, convidados na mão. Sucesso em seis meses é **200 leitores fiéis**, não crescimento. Se uma feature só faz sentido com 100 mil usuários, ela não pertence aqui.

O nicho é um presente. Clássicos são o problema de catálogo mais fácil da categoria (domínio público, bem catalogados, sem a cauda longa do BookTok), e mangá tem uma excelente API oficial. A parte difícil de um tracker de livros quase desaparece.

## A única tela

Se só uma tela existisse, é esta: **o seu ano de leitura, feito bonito.** Capas, páginas lidas, autores, as nacionalidades que você leu neste ano, o que você está lendo agora, e o que está na estante ainda não lido.

Todo o resto existe para alimentar essa tela ou para torná-la social.

## Como é uma estante de verdade

A planilha do usuário fundador, mantida na mão antes de tudo isso existir, é o PRD mais verdadeiro que temos. 44 livros. **16 lidos, 15 não lidos, 13 sem marcação.** Dois terços da estante de um colecionador de verdade não foram lidos, e isso não é vergonha, é só o que uma biblioteca é.

As colunas dela, inventadas por um leitor sem nenhum software em mente, são o schema:

- *"Ano em que a obra foi escrita"* e *"Ano de publicação da edição"*, em duas colunas separadas. Isso é `works` e `editions`, chegado por dor e não por teoria.
- *"Obtenção"*: Amazon, sebo, feira do livro, presente, troca, financiamento coletivo, **herança**, caixa do Clube de Literatura Clássica. **De onde o livro veio.** Nenhum tracker no mundo registra isso, e é a alma de uma estante física. Um livro que você herdou não é o mesmo objeto que um livro da Amazon.
- *"Nacionalidade ou Etnia"* do autor. 13 brasileiros, 9 britânicos, 1 martinicano. Leitores já curam ao longo desse eixo, deliberadamente. Isso pertence à tela do ano, como um fato que o leitor escolheu, não como a opinião de uma IA sobre o gosto dele.
- *"Formato"*: 29 capas duras de 44. Essa pessoa coleciona objetos, não arquivos.

Qualquer feature que não sobreviva ao contato com essa planilha é uma feature de que a gente não precisa.

## A mecânica central: o grafo de convites

É isso que torna o Gume diferente, e é uma feature de v1, não de v2.

- Qualquer um pode se cadastrar. A porta está aberta.
- Mas **você está conectado a quem te convidou**, e ao círculo dessa pessoa. A sua vida de leitura tem uma linhagem.
- **Embaixadores**: leitores que trazem um círculo e o mantêm unido. Visíveis, honrados, não gamificados com pontos.
- Você pode **recomendar um livro direto para um amigo**. Ele cai na estante da pessoa como uma recomendação, de uma pessoa, não de um algoritmo.
- Você pode **começar um clube de leitura** dentro do seu círculo.

O feed fica quieto, como o Oku: cronológico, quem você segue, sem barulho.

## Escopo do v1

1. **Auth**: e-mail + OAuth, com convites. Deleção de conta que apaga de verdade, nas configurações, sem trâmites por e-mail.
2. **Catálogo**: Open Library primária, Google Books como fallback, busca por ISBN, cacheado nas nossas próprias `works`/`editions`.
3. **Biblioteca**: quero ler / lendo / lido / DNF. Status em um toque. Releituras. A nota é uma palavra (adorei, gostei, achei ok, não gostei, não terminei), nunca um número. Físico primeiro: contagem de páginas, edições, o objeto importa.
4. **Sem barra de progresso**: três estados (quero ler / lendo / lido / DNF), e nunca página atual ou porcentagem. Barra de progresso é cobrança diária — vira placar, vira streak. A contagem de páginas do ano soma as edições terminadas, então nada de valor se perde. Ver ai/DECISIONS.md.
5. **A tela do ano**: parede de capas, páginas, autores, lendo agora. A coisa que as pessoas dão print.
6. **Resenhas**: longas, flag de spoiler, **e resenhas privadas** (visíveis só para você). Muitos leitores escrevem para si mesmos e nunca publicariam.
7. **Sem comentários.** Resenhas e follows são os únicos canais. Isso é uma escolha de produto, e também significa que a moderação continua suportável para uma pessoa só.
8. **Feed de amigos**: cronológico, só quem você segue.
9. **Perfis públicos**: indexáveis. A sua estante é uma página que você teria orgulho de linkar.
10. **Recomendar para um amigo**: um livro, uma pessoa, uma linha de porquê.
11. **Clubes, tocados pelos seus criadores.** Um clube tem um dono que o toca: um livro compartilhado, um cronograma, uma estante compartilhada. Booktubers e bookstagrammers podem tocar os seus próprios. Clubes nunca são pagos, e um criador nunca paga para ter um.
12. **Uma notificação, e só uma:** um amigo terminou um livro que você leu. Esse é o momento em que uma conversa de fato quer acontecer.
13. **Importação sem perdas**: Fable e Goodreads CSV primeiro: datas, notas, texto de resenha, prateleiras, ISBN. Tudo.
14. **Exportação sem perdas**: JSON e CSV, num clique. O CSV usa as colunas do export do Goodreads, que é o formato que Skoob, StoryGraph, Oku e Fable importam — uma exportação que outro app não lê não é uma saída.
15. **Programa de bibliotecários**: uma página explicando como o catálogo funciona, um curso curto, depois a capacidade de aprovar livros novos e corrigir metadados.

## Política de catálogo

A linha é entre **fato** e **obra de terceiro**, não entre "raspar" e "não raspar". A Open Library cobriu 2 de 44 livros brasileiros reais: uma proibição ampla deixaria o app sem catálogo, e um app de leitura sem catálogo não é nada.

**1. Metadado factual: pode, de qualquer fonte.** ISBN, título, autor, editora, ano da obra, ano da edição, páginas, formato, idioma, série, volume. Não existe propriedade sobre "este livro tem 320 páginas". É o miolo do catálogo e é o que faz a busca funcionar.

**2. Capa: por referência, nunca por cópia.** A capa é obra gráfica, com autor e direitos da editora. A gente guarda a **URL** em `editions.cover_url` e serve da origem (Open Library, Google Books, AniList). Nunca baixamos, nunca re-hospedamos, nunca redistribuímos o arquivo. Mostrar não é republicar. Sem URL: capa tipográfica gerada.

**3. Nunca: resenha, nota, comentário ou qualquer dado de usuário de outra plataforma.** Não é fato, é texto de uma pessoa, e não pertence nem a nós nem ao site de onde veio.

**4. A exceção que sempre valeu: a importação do próprio usuário.** A exportação do Goodreads, do Skoob ou do Fable é dado *dele*, resenhas dele incluídas. Ele traz o que quiser, e isso enriquece o catálogo de todo mundo. Cem leitores brasileiros importando trazem mais edições brasileiras reais do que qualquer scraper.

**Ordem de preferência das fontes, sempre:**

1. **Dumps e APIs oficiais e abertas.** Open Library (dump em domínio público, filtrado por `language = por`) e AniList (GraphQL público e oficial: séries, volumes, capas, status de publicação, a maior vitória de catálogo disponível para mangá).
2. **APIs públicas.** Google Books por ISBN, e por título mais autor.
3. **Importações de usuários** e **bibliotecários** (livro novo e correção passam por aprovação).
4. **Scraping de metadado factual**, só quando 1 a 3 falharem, e só dentro dos limites acima.

Correções voltam para a Open Library onde a gente conseguir. O dataset CC0 do Gume publica **só o que é nosso ou factual**: nunca capas, nunca texto de terceiro.

## Idioma

O produto é em **português**. Cópia, estados vazios, e-mails, o curso de bibliotecário: tudo PT-BR primeiro.

O código, os commits, o schema e os docs técnicos ficam em **inglês**, porque é isso que mantém o público de contribuidores aberto e é o que todo desenvolvedor já lê. O README é bilíngue, português primeiro.

## Fora do v1

Trechos (highlights) e importação do Kindle (schema pronto). Sync com Obsidian. Climas, ritmo, avisos de conteúdo (schema pronto, dataset depois). ActivityPub. Apps nativos.

## Nunca

- Sem contador de curtidas, sem contador de seguidores, sem ofensivas (streaks).
- Sem feed algorítmico. Sem recomendações que não venham de pessoas.
- Sem IA generativa escrevendo sobre a leitura de ninguém.
- Sem links de afiliado da Amazon. Sem anúncios. Histórico de leitura nunca está à venda.
- **Sem privacidade paga.** Estantes privadas, resenhas privadas e exportação são grátis, para sempre. Cobrar por privacidade transformaria o manifesto inteiro num discurso de venda.

## Dinheiro

Servidores para 200 a 2.000 leitores custam por volta de US$ 0 a 40 por mês. Não há urgência para monetizar, o que em si é uma vantagem estratégica.

O apoio é **cosmético apenas**, no espírito do Backloggd: um badge de apoiador, uma capa de perfil personalizada, um nome colorido. Coisas que deixam alguém dizer "eu ajudei a pagar por isto" e ser visto fazendo isso.

Nunca compra privacidade. Nunca compra features. Nunca tranca o núcleo: registrar, avaliar, resenhar, seguir, clubes, exportar. Tudo grátis, tudo para sempre.

## Roadmap e a armadilha do upvote

Vai existir um roadmap público onde leitores podem propor e votar em melhorias. Uma regra, escrita antes do primeiro voto:

**Votos informam. Eles não decidem.**

Uma contagem de votos é um concurso de popularidade, e a primeira coisa que um concurso de popularidade devora é a lista das coisas que a gente se recusa a construir. A lista de "nunca" acima não está sujeita a voto. Todo o resto é conversa.

Isso mora no **GitHub Discussions**, com 👍 como o upvote. Zero código, funciona no primeiro dia, e mantém a conversa perto de quem pode implementar. Uma página de roadmap dedicada é construída só quando houver propostas suficientes para fazê-la parecer viva.

## Critérios de sucesso do v1

1. A tela do ano faz alguém dar print e postar.
2. Um usuário do Fable importa o histórico dele **com datas e notas intactas** em menos de dois minutos.
3. Buscar um clássico, adicionar, marcar como lido: menos de 10 segundos, no celular.
4. Dez amigos usam por um mês sem serem cobrados duas vezes.
5. Zero bugs de autorização no lançamento. Ver SECURITY.md.

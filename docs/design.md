# Sistema de design

## A marca: o livro é a lâmina

**Um livro aberto, de páginas em asa, e o miolo sobe, afina e desce até uma ponta.**

O vinco que corta o miolo ao meio é a dobra do livro **e** o fio da lâmina, ao mesmo tempo. É a mesma linha lendo as duas coisas, e é por isso que o símbolo fecha: não é um livro *com* uma espada em cima, é um livro **que é** a lâmina. Livro é pedra de amolar; o gume é o que sai dela.

*A marca anterior era a régua de 1px vista de perfil: um corpo reto afinando até virar fio. Era honesta e era abstrata demais para carregar um produto sozinha, porque fora de contexto ela era um traço. A nova diz a mesma coisa, e diz mais.*

A marca é preta e branca, sempre: ela é `currentColor`, e nunca uma cor própria. Desenhada **à mão**, em quatro subpaths de quatro pontos, com o lado direito espelhando o esquerdo por construção. Nunca vetorizada por trace: um trace cospe trezentos pontos, não tem simetria, e não dá para engrossar quando a marca encolhe. Ver `components/mark.tsx`.

### Duas versões, e não é opcional

| | quando | o que muda |
|---|---|---|
| **`Mark`** | **≥ 32px** | o fio fino, fiel ao ícone |
| **`Mark` sólida** | **< 32px** | miolo mais grosso, vinco mais largo, páginas mais afastadas |

**A 16px o fio fino mede menos de meio pixel: ele some, e a marca vira duas manchas brancas sem leitura nenhuma.** Isso foi medido, e não suposto. A versão sólida tem a mesma silhueta e a mesma alma, com carne suficiente para sobreviver ao pixel.

**O componente escolhe sozinho, pelo `size`.** Ninguém precisa lembrar disso, e é de propósito: uma regra que depende de alguém lembrar dela é uma regra que a quarta pessoa esquece.

### O ícone (com grão) NUNCA entra na interface

O ícone é o quadrado arredondado, com grão: grafite com a marca em branco (`assets/logoiconpreto.png`, **o principal**, e é a pedra de amolar) e osso com a marca em preto (`assets/logoiconbranco.png`, para fundo claro e para papel).

**Ele vive em exatamente três lugares, e em nenhum outro:**

- `app/apple-icon.png` (180×180)
- `public/favicon.ico`
- a loja (`public/logo/icone-*-1024.png`)

**Na interface, a marca é sempre chapada e `currentColor`.** Um ícone com grão e fundo próprio dentro de uma tela é um adesivo colado na tela: ele não herda a cor do texto, não inverte no tema claro, e vira uma caixinha cinza no meio de um cabeçalho. Se você se pegar importando um `.png` de marca dentro de `app/` ou `components/`, pare.

Os assets são gerados de uma fonte só: `pnpm brand` lê a geometria de `components/mark.tsx` e escreve tudo. Um `d=` copiado à mão para outro arquivo é uma segunda cópia da marca, e no dia em que alguém ajustar uma, a outra fica para trás em silêncio.

### Respiro e tamanho mínimo

- **Área de respiro:** a altura do miolo da marca (metade da altura dela) em volta, livre, dos quatro lados. Nada encosta.
- **Tamanho mínimo:** **16px** na tela, **8mm** no impresso. Abaixo disso a marca não é uma marca, é um borrão, e um borrão com o nome do produto do lado é pior que só o nome.

### O lockup: a marca e o nome são UM objeto

A palavra é **`Gume`**, em **Fraunces 400**, Caixa e Baixa, entreletra apertada. A classe é `.mark-word`, e ela serve a **uma palavra só**: usá-la num título faria o título competir com a marca. Existe deitado e existe empilhado.

**`Gume`, e não `GUME`.** Em caixa alta a palavra vira monumento. Em Caixa e Baixa ela vira **nome**, que é o que uma marca quer ser.

#### O alinhamento é pelo PESO, e nunca pela caixa

**A marca ocupa y 6..58, então o centro da caixa dela é 32. Mas o centro de TINTA é 35,4.** A cauda da lâmina desce fina até 58 e quase não carrega peso, enquanto a massa (as asas) fica mais em cima. Medido varrendo o pixel, e não estimado no olho.

Centrada em 32, a palavra **flutuava acima da marca**. Ela desce 3,4 unidades (5,3% da altura da marca) e assenta.

É a armadilha clássica do alinhamento óptico: **a caixa mente sempre que a forma não é simétrica no eixo**, e quase nenhuma forma boa é. A constante mora em `components/mark.tsx` (`CENTRO_DE_PESO`) e em `scripts/brand.mjs`. Se você recentralizar pela caixa, a palavra sobe de novo.

#### Por que não a serifada da voz

A Newsreader é uma serifada de *texto*. Ao lado deste ícone, que é **massa** (sólido, denso, geométrico), ela lia como um **fio**. Isso não era contraste, era **descasamento**.

A Fraunces é moderna, tem serifa desenhada e traço de verdade, sem cair na didone (grossa-fininha), cujo **hairline morre no tamanho pequeno**, exatamente como morreria o fio central do ícone. Ela lê como projetada, e não como fonte de sistema, e é contemporânea como a Newsreader: não destoa das telas.

> **O PESO ERA 700, E VIROU 400. A regra que isto contradiz está reescrita, e não deixada de pé mentindo.**
>
> Esta seção dizia que **"conceito não sobrevive ao pixel; peso sobrevive"** — e usava isso para recusar qualquer tipo fino ao lado do ícone.
>
> A recusa continua **certa para o que ela julgava**: a Cinzel e a Newsreader liam como um **fio** contra a **massa** do símbolo, e caíam. O erro era generalizar de duas fontes para *todas* as fontes finas.
>
> A Fraunces em 400 não é um fio: ela tem serifa desenhada e traço que sobrevive ao pixel. E na barra ela lê como um **nome** em vez de um **monumento**, que é o que uma marca quer ser — a mesma razão pela qual a palavra é `Gume` e não `GUME`.
>
> **E foi decidido olhando, e não argumentando.** Cinco pesos, nos três tamanhos que existem, sobre o fundo de verdade, ao lado do ícone de verdade. É a única forma honesta de decidir peso de tipo, e é a própria lei desta seção: **conceito não sobrevive ao pixel.**

**A Cinzel foi testada e recusada, e vale saber por quê.** Ela é a romana inscricional, linhagem da Trajan: no conceito, ela *é* "talhada em pedra", e era a resposta óbvia. No teste, mesmo em 900, era a **mais leve** das candidatas, e tem serifa fina. Caiu na própria regra. **Conceito não sobrevive ao pixel; peso sobrevive.**

**A entreletra é apertada (≈0), e isso não é gosto.** Espaçamento largo espalha a palavra e empurra o símbolo para longe dela: o ícone vira um estranho ao lado do nome, e os dois param de ler como uma coisa só.

**A tensão entre símbolo geométrico e tipo clássico é deliberada, e está certa.** O que estava errado era o peso, e depois o alinhamento.

#### Nos assets, a palavra vai em CONTORNO, nunca em `<text>`

Um `<text>` depende de a máquina que abrir o arquivo ter a fonte, e ela não tem: o lockup vai parar num slide, numa camiseta, num crachá, e ali renderiza em Times, que é a marca errada. Convertida em contorno, a palavra é geometria, como o símbolo ao lado dela. Ver `assets/wordmark.json`.

**Cuidado com o `upm`.** As unidades por em **não** são sempre 1000: a Fraunces usa 2000. O `wordmark.json` carrega o número, e `scripts/brand.mjs` lê de lá. Isso já quebrou uma vez, com um `1000` escrito na mão: a escala saiu pela metade e o lockup foi gerado com a palavra **cortada** ("Gu"). Um número mágico que funciona por coincidência é pior que um bug, porque ele espera.

**E o contorno é GERADO, e não desenhado.** `scripts/wordmark.py` instancia a Fraunces variável nos eixos da marca (`opsz 144, SOFT 30, WONK 0`), extrai a palavra e escreve o `wordmark.json`.

Ele existe porque o arquivo era **órfão**: alguém o extraiu uma vez, e não havia como refazê-lo. No dia em que o peso mudou — e mudou —, o app teria passado a mostrar um peso e os assets exportados, outro. **Duas marcas, e ninguém saberia qual é a verdadeira.**

Antes de escrever qualquer coisa, o script **reproduz o `Fraunces-700.ttf` que está no repositório, glifo por glifo**, e aborta se não conseguir. Gerar com eixos errados daria uma palavra *parecida* — que é o pior resultado possível, porque ninguém percebe.

### O que não fazer

- **Não recolorir.** Nem o acento, nem gradiente, nem "só nesta campanha". Preto, branco, e o `currentColor` que herda do texto.
- **Não girar, não inclinar, não espelhar.** O fio aponta para baixo porque a ponta da lâmina aponta para baixo.
- **Não contornar.** A marca é sólida, e um contorno em volta dela é uma segunda marca, mais fraca, colada na primeira.
- **Não esticar.** Ela é mais alta que larga (0,78), e é assim que ela é.
- **Não usar o ícone dentro da interface.** Ver acima. É o erro mais fácil de cometer e o mais feio de todos.
- **Não redesenhar a versão sólida "no olho".** Ela é geometria, ela mora em `components/mark.tsx`, e o motivo de cada número está escrito ali.

## A direção: editorial de galeria, não dashboard

Registrada em [ai/DECISIONS.md](../ai/DECISIONS.md). Referências de **espírito, nunca de pixel**: a grade de pôsteres do Milk & Bone, o Voyager2, o Atelier, o Country Books.

- **Preto quase absoluto, morno.** O conteúdo — a capa — é a única cor grande da tela.

### O accent: a lâmina

**#7DD3C0.** Verde-água frio: aço, fio de faca, terminal.

> **Esta regra dizia o contrário, e foi trocada de propósito.**
>
> Ela dizia: *"Preto e branco, sempre: a única cor deste produto é arte de capa."* A
> frase foi apagada, e não deixada de pé mentindo — uma frase que sobrevive à decisão
> que ela descrevia é uma mentira educada, e ela mina tudo o que o arquivo diz depois.

O accent sai do **nome do produto**, e não de uma tendência. Gume é fio de faca; um
accent que se explica em quatro palavras é um accent que sobrevive a uma reunião.

E ele foi escolhido, entre três, justamente por ser **o que menos briga com a capa** —
que é o que a regra antiga estava protegendo o tempo todo. **Nenhum livro tem capa
verde-água.** O olho aprende, em um dia, que essa cor quer dizer "o app está falando com
você", e todo o resto da tela continua sendo do livro.

**Onde ele vive:** link, estado ligado, foco, a moldura de apoiador. **E em mais nada.**
A parede de capas continua sendo só capa, e nada colorido é desenhado por cima de uma.

**A cor nunca é a informação.** A nota continua sendo palavra + glifo; se a cor sumir da
tela, nada se perde. É o que também faz o app funcionar para quem não enxerga cor.

### E o vermelho não é o accent

Eram a mesma cor, e funcionava por **acidente**: o accent antigo era vermelho-tijolo, e
vermelho passa por perigo.

No dia em que o accent virou verde-água, o acidente viraria um bug feio — *"apagar a
estante?"* em verde-menta, dizendo "pode ir, está tudo bem" sobre um botão que faz o
contrário. **Um botão que se lê ao contrário do que faz é o pior botão que existe.**

São quatro tokens, e cada um faz um trabalho:

| token | o que é | onde |
|---|---|---|
| `--color-accent` | a **marca** (verde-água) | link, selecionado, foco, moldura |
| `--color-colaborar` | **quem faz** (rosa) | contribuição, "quem faz", o que se conserta |
| `--color-perigo` | a **semântica** | deu errado, ou não tem volta |
| `--color-on-accent` | o que se escreve **em cima** do accent | o accent é claro; branco nele não se lê |

`lib/cor.test.ts` quebra a build se um botão de apagar usar a cor da marca, ou se alguém
escrever em branco por cima do accent.

### E nenhuma insígnia pode ter a cor da marca

A insígnia de **zelador** era verde-água (175°), a oito graus do accent (167°). São a
mesma cor — e aí a cor para de dizer qualquer coisa: o accent quer dizer "o app está
falando com você", e a insígnia quer dizer "esta pessoa cuida do acervo". O olho não
aprende duas coisas com a mesma cor; ele desiste das duas.

Ela virou **rosa-carmim (340°)**, e `lib/badges.test.ts` agora mede a distância de cada
insígnia até o accent.
- **Serifa de display grande**, de alto contraste, no cabeçalho de cada tela, com muito espaço em volta.
- **Metadado em versalete pequeno e espaçado**, no lugar de label de UI. `44 LIVROS · 16 LIDOS`, não um chip cinza escrito "Total".
- **Composição de pôster:** assimetria e respiro. Nada de grade uniforme de dashboard.
- **A regra que o Milk & Bone ensina:** numa grade mista, a peça que é só tipografia é a mais **quieta**, nunca a mais gritante. É exatamente assim que a capa gerada tem que se comportar diante de uma capa real.
- **Autor é entidade visual**, com painel próprio na página do livro, não uma linha de texto cinza.

O que isso rejeita: as referências de app de livro do Dribbble, com ponto de recompensa, estrela em toda capa e ilustração de startup. Aquilo é a lista do "nunca" do README, desenhada.

## O sistema de superfícies

**Harmonia vem de repetição, não de bom gosto pontual.** Este é o problema central, e não a fonte: um app com elementos soltos numa página preta parece cru; um app onde tudo vive num container, com o mesmo raio, o mesmo respiro e a mesma superfície, parece resolvido.

**Quatro níveis, e nada flutua solto no nível 0.** Se um bloco de conteúdo não está dentro de um container, ele está errado.

| Nível | O que é | Como se constrói |
|---|---|---|
| **0** | O fundo da página. Preto quase absoluto, **com grão de 2% e vinheta**. | `--surface-0: #060606` |
| **1** | O card. Todo bloco de conteúdo, em toda tela. Raio 16. | `.surface`, `#111111` |
| **2** | Card dentro de card, ou controle. Raio 12. | `.surface-2`, `#171717` |
| **pílula** | Filtro, etiqueta, estado, item ativo. Raio total. | `.pill` |

Borda de card: **branco a 6%**, nunca uma cor cinza. **A distância entre o nível 0 e o nível 1 é o que FAZ o card.** O `#0E0E0D` de antes era um carvão herdado de quando o tema era "papel", e contra ele um card a `#171716` ficava a dois tons de distância: nada se destacava, e nada lia como objeto.

**Superfície tem CORPO, e não cor chapada.** O que faz uma tela parecer cara não é a cor: é o volume. Três coisas, e as três são quase invisíveis de propósito:

1. **Gradiente vertical de ~2,5%** no card e na barra: o topo é mais claro que o pé, porque a luz cai de cima. Se dá para APONTAR o gradiente, ele virou decoração.
2. **Borda de luz de 1px só no TOPO** (branco a 8%). Uma borda clara em volta inteira é um contorno, e contorno é desenho de ícone, não objeto sob uma lâmpada.
3. **Sombra difusa embaixo**, para o elemento pousar em cima de alguma coisa.

## O FIO: o item ativo é o que está afiado

O item ativo da navegação não é uma pílula chapada: é uma **superfície elevada**, com fundo um degrau acima do resto da barra, borda de luz no topo, e **um fio de luz na aresta direita**, que vaza um brilho suave para fora. A classe se chama `.afiado`.

**O fio é branco-osso (`#F0EDE6`), nunca uma cor saturada.** Isso não é só gosto:

- **O Gume é o fio da lâmina.** O lugar onde você está é o que está afiado. A marca virou o **comportamento da interface**, em vez de ser um logo parado num canto.
- **A tela é uma parede de capas.** Um CRM pode ter chrome que brilha em rosa, porque a tela dele é texto e vazio. Aqui o chrome tem que **sumir para a arte aparecer**, e o único brilho da tela é a lâmina.

O item afiado tem **canto reto** (raio 12), e não pílula: numa pílula a borda direita é meia lua, e um fio reto encostado nela fica boiando **ao lado** do item em vez de ser a aresta dele. A lâmina precisa de um gume onde encostar.

No hover, um card clicável **sobe 2px**, o fio da borda acende, e a mola é de 200ms com um único overshoot. Nunca quica duas vezes, e tudo isso desliga em `prefers-reduced-motion`.

## O ar

**O que faz uma interface parecer confortável é o ar, não a cor.** Três medidas, e elas não são sugestões:

| Onde | Quanto |
|---|---|
| Dentro do card (padding) | **24 a 28px**, nunca menos |
| Entre cards | **16 a 20px** |
| Entre seções | **40px** |

Note que o ar vai **dentro** do card, não entre eles: uma calha de 24px entre cards apertados lê como grade de azulejo; o inverso lê como estante.

**Hierarquia na home.** O olho tem que saber onde pousar primeiro, sem esforço, e para isso alguma coisa tem que ser claramente maior que as outras. A ordem é: **o livro na mão** (herói: capa grande, centralizada, muito espaço em volta), depois **o ano** em números largos e espaçados, e por último **o feed dos amigos**. Uma tela onde tudo tem quase o mesmo peso é uma tela onde o olho não pousa em lugar nenhum.

**A linha de voz.** Embaixo do título da home, uma linha em cinza dizendo onde a pessoa está: *"Um livro na mão, 25 esperando na estante."* Não é decoração: é o que separa um app que fala de um app que etiqueta. Sem exclamação e sem simpatia forçada.

## Pessoa é redonda, livro é retângulo

A foto de uma pessoa é **sempre um círculo**. A capa de um livro tem **canto duro** (raio 6px). Numa tela que carrega os dois — o feed, as recomendações, a estante com as notas dos amigos — **a forma sozinha diz qual é qual antes de você ler uma palavra**, e é por isso que dá para bater o olho e entender.

Sem foto não é erro e não é uma silhueta cinza: é a inicial da pessoa sobre um bloco quieto, o mesmo material das capas sem sobrecapa.

## Nota é PALAVRA, e não estrela

Não existe estrela em lugar nenhum do produto, nem meia estrela, nem "4,5". A nota é uma de cinco frases, em versalete, discreta: **não terminei · não gostei · achei ok · gostei · adorei**.

Estrela é escala, escala vira média, média vira placar. **Palavra não soma.** Era o último número do app, e ele saiu. Ver `lib/veredito.ts` e a entrada em [ai/DECISIONS.md](../ai/DECISIONS.md).

## A insígnia: mesma luz, mesma saturação, só o matiz muda

As **oito** insígnias têm o **mesmo L** e o **mesmo C** em OKLCH (`0.74` e `0.13`), o **mesmo raio de glow** (12px) e o **mesmo alpha** (22%). Só o **matiz** gira, e os matizes estão a pelo menos 30° um do outro.

Isso torna **matematicamente impossível** uma parecer mais preciosa que a outra. **Cor aqui é identidade, nunca hierarquia:** ela diz *qual* insígnia é, e nunca *quanto ela vale*.

Não é preciosismo. "A gente vai tomar cuidado para nenhuma parecer melhor" é uma intenção, e intenção não sobrevive à quarta pessoa que mexe no CSS. Um L e um C travados sobrevivem: `lib/badges.test.ts` **quebra o build** se alguém mover o L, o C, o raio ou o alpha de uma só delas.

**Proibido, e não é gosto, é semântica:** ouro, prata e bronze (é um pódio, e todo mundo lê pódio); a paleta de raridade de jogo (cinza → verde → azul → roxo → laranja, que quem já jogou decodifica na hora, e passa a querer a laranja); glow animado, pulsante, arco-íris, holográfico; e qualquer insígnia maior, mais brilhante ou mais saturada que as outras. **Se uma brilhar mais forte, você criou um ranking sem perceber.**

### Duas formas, e a moldura é a MESMA para as oito

**No perfil e na tela que explica: a PLACA.** Retangular, canto chanfrado, glifo e nome dentro, com moldura e glow. Tem cara de insígnia mesmo, e é para ter: é a coisa que a pessoa mostra, e mostrar é o ponto.

**A estética de RPG entrou, e o veneno dela não.** O que faz um jogo virar farm **não é a moldura: é a moldura DIFERENTE.** Ouro contra prata, épico contra comum. Aqui a geometria é **uma só** (mesmo chanfro, mesma espessura, mesmo glow) e **só o matiz gira**. `lib/badges.test.ts` quebra o build se alguém criar uma segunda moldura.

**No feed: só o GLIFO**, 14px, sem moldura e sem círculo. Trinta linhas de feed com oito placas cada viram um cassino.

A **ordem é sempre a mesma**, nunca por raridade nem por data. E as **pontas** (primeira e última posição) estão travadas em teste: a primeira é lida como prêmio e a última como consolo, e uma insígnia nova numa delas criaria a escada que este sistema não tem.

### Quem apoia tem insígnia, e ela DIZ que se paga

> **Esta seção dizia o contrário, e foi reescrita.**
>
> Ela dizia: *"Quem apoia **comprou** um selo; quem tem uma insígnia **doou** trabalho. Se
> os dois se parecerem, a mensagem que sobra é 'dá para comprar mérito'."* E mandava o
> selo ser feio de propósito: retângulo cinza, sem moldura, sem glow, sem cor.
>
> **O selo nunca foi desenhado em lugar nenhum.** Era um componente, um teste, uma regra e
> um parágrafo aqui — e zero pixels na tela. Uma proteção que não é desenhada não protege
> nada.

O apoiador tem **insígnia**, com a mesma placa das outras. E o medo da regra antiga
continua certo, então o que ela protegia mudou de lugar:

| | antes | agora |
|---|---|---|
| como ela se parece | feia, para ninguém confundir | igual às outras |
| como ela se explica | não se explicava | **"esta não se conquista: ela se paga"** |

Um selo cinza que ninguém entende protege **menos** do que uma insígnia que conta, na
cara, "esta pessoa paga a conta do servidor". A honestidade sobre o que a coisa é vale
mais do que escondê-la.

**E a trava de verdade continua de pé, com teste:** pagar **não** põe ninguém na página de
quem faz. Aquela lista é sobre TRABALHO — quem escreveu código e quem consertou ficha — e
é a única tela do app com número. Se `lib/contributors.ts` um dia olhar para
`is_supporter`, a build quebra.

**E ela é viva:** sai sozinha no dia em que a pessoa para de apoiar, porque é lida de
`is_supporter` e não concedida numa tabela que alguém teria que lembrar de limpar. Uma
insígnia de apoiador que fica depois do cancelamento é uma mentira que o app conta todo
dia.

### O rosa é do apoiador, e de mais ninguém

O **zelador** era rosa-carmim (340°). Saiu para o verde (133°).

Duas insígnias rosas seriam "quem cuida do catálogo" e "quem paga a conta" com a mesma
cara — e essas duas são exatamente as que o Gume mais precisa que ninguém confunda.

### A moldura de apoiador também é rosa, e era verde-água

Ela tinha a cor da marca (#7DD3C0). Parecia bonito, e na tela dava um empate de três:

    platina    #4FA39A   verde-água escuro
    esmeralda  #2E9E63   verde
    apoiador   #7DD3C0   verde-água claro

**Três anéis verdes na mesma cara.** E aí a moldura para de dizer alguma coisa: a pessoa vê
um anel esverdeado e não sabe se aquilo é uma honra ou um apoio — que são as duas únicas
coisas que a moldura existe para distinguir.

Nenhum teste avisou, e nenhum podia: as cores estavam soltas dentro de um componente, e
ninguém mede a distância entre duas cores olhando um `.tsx`. Agora a paleta é dado
(`lib/paleta.ts`) e `lib/paleta.test.ts` mede — e ele achou, na primeira execução, uma
**segunda** colisão que eu tinha acabado de criar: a navalha (#C0392B, vermelho) a 29° do
rosa. Ela virou escarlate.

### A barra de progresso

> **Esta seção dizia que barra em LEITURA era proibida para sempre, e que um teste a
> segurava.** Não segurava: o teste que ela citava olhava para uma tela só, e nunca teria
> pego uma barra no perfil. Quem segura as regras das honras hoje é `lib/honras.regras.test.ts`,
> e ele defende as quatro que estão na tabela abaixo.
>
> Ela foi reescrita, e não deixada de pé mentindo. E a frase era pior do que errada: era
> **falsa** — o teste que ela citava olhava apenas para `app/insignias/page.tsx`, e nunca
> teria pego uma barra no perfil. Um documento que promete uma trava que não existe é
> pior do que um documento que não promete nada.

O Gume agora tem **honras** e tem barra de progresso de leitura. É uma virada deliberada,
e ela está em [ai/DECISIONS.md](../ai/DECISIONS.md).

É **uma escada só**. Já foram duas (uma de literatura, uma de quadrinhos, cada uma com a
régua dela), e a separação resolvia um problema de justiça que quase ninguém sentia e
criava um de clareza que todo mundo via. Agora livros, HQs e cada volume de mangá contam
juntos: cada volume vale uma leitura. Sobe mais fácil para quem lê mangá, e tudo bem — a
honra é um retrato de quanto você leu, não um prêmio de dificuldade. A virada está em
[ai/DECISIONS.md](../ai/DECISIONS.md).

| | os dez degraus | o topo |
|---|---|---|
| **honra** | Ferro, Bronze, Prata, Ouro, Platina, Esmeralda, Diamante, Lâmina, Navalha, **Gume** | 500 leituras |

Depois do topo não vem outro degrau: vem uma contagem discreta ao lado do nome
(**Gume +3**), no espírito do paragon do Diablo. Uma escada infinita é uma corrida
disfarçada de escada.

O que a barra **mostra**: quanto falta para o próximo degrau, com o número escrito ao
lado ("faltam 3 para Prata"). Uma barra sem número obriga a pessoa a estimar no olho, e
estimar no olho é o que faz alguém abrir o app cinco vezes por dia para ver se andou.

O que a honra **não pode virar**, e a trava é real — `lib/honras.regras.test.ts`, que lê
`lib/honras.ts` e quebra o build:

| | pode |
|---|---|
| **honra por leitura de uma vida** (não cai, não expira, sem placar) | **pode** |
| **contribuição** (correções, catálogo) | **pode** |
| **tempo** (ofensiva, meta do ano, "livros este mês", temporada) | **nunca** |
| **placar** (lista dos maiores, "você é o 3º entre seus amigos") | **nunca** |
| **nota ou abandono valendo honra** | **nunca** |

A insígnia é OUTRA COISA que a honra: insígnia reconhece **doação à comunidade**, honra
mede **leitura**. Uma insígnia é um **sim ou um não** — você tem, ou não tem —, e não
existe "Bibliotecário Sênior", nem XP, nem insígnia que se compra.

O que existe é **um** par que evolui: **zelador vira bibliotecário** aos cinquenta
consertos. São dois degraus do mesmo trabalho, e o segundo toma o lugar do primeiro em vez
de somar — duas insígnias lado a lado dizendo a mesma coisa não reconhecem o dobro, elas
enchem o perfil de quem mais trabalhou.

E barra de insígnia só existe onde existe uma **contagem**: a insígnia que é um fato
(escreveu código, trouxe alguém, chegou cedo) **não tem barra**, porque não existe "68% de
ter tido a ideia".

## Serifa é VOZ, nunca dado

A serifa de display serve para **título de livro, cabeçalho de tela e número grande**. Só.

"Companhia das Letras" e "capa dura" são **dado de interface**, e dado de interface em serifa de display é exatamente o que faz um app parecer amador. Metadado, botão, rótulo e valor são **Inter, 14 a 15px**. Números sempre `tabular-nums`.

Metade da harmonia que a gente inveja nas referências é só isso: eles não usam serifa em tudo.

## A regra única

**Vidro é chrome. Papel é conteúdo.**

Tudo que flutua acima da sua biblioteca é vidro: a **sidebar**, a doca de "lendo agora", sheets, popovers, o campo de busca, o controle de nota. Tudo que *é* a sua biblioteca é papel: capas, cards de livro, títulos, resenhas, citações, estatísticas.

**O vidro mora na sidebar.** Uma coluna fixa de 230px, com a parede de capas rolando atrás dela, é o único lugar do app onde o material funciona de verdade: ela é sticky, é de tamanho fixo (então o `backdrop-filter` repinta um retângulo pequeno por frame, e não uma lista que rola), e ela tem algo que vale a pena pairar por cima. A barra superior translúcida que existia antes refratava três centímetros de espaço em branco, que é o mesmo que não refratar nada. Isso não abandona o vidro: move ele para onde ele significa alguma coisa. No celular a sidebar colapsa numa barra inferior, que é a mesma regra (fixa, altura fixa) no único tamanho onde não cabe uma coluna.

Essa é a regra porque vidro é um material para coisas que pairam sobre outra coisa, e ele precisa de algo que valha a pena pairar por cima. Um app de livros tem a melhor coisa possível para pairar por cima: uma parede de arte de capa. Uma barra de navegação translúcida refratando as lombadas embaixo dela parece cara e *significa* algo. Um cartão translúcido contendo a resenha de um livro parece uma demo, e é ilegível a 14px.

Se você quebrar essa regra, você cai no modo de falha do iOS 7 de 2013: tudo fosco, contraste em lugar nenhum, e um produto que fotografa bem e lê mal.

---

## Materiais

Quatro superfícies, e nada mais.

| Material | Para que serve | Como é construído |
|---|---|---|
| **Canvas** | A página. Nunca branca; um off-paper quente. | `--surface-0: #F7F5F1` claro / `#060606` escuro |
| **Papel** | Cartões de conteúdo: detalhe do livro, resenha, linha de lista. Opaco. | `--surface-1: #FFFFFF` / `#111111`, fio de 1px, raio 16 |
| **Card** | O livro na estante. Um sussurro acima do canvas, nunca uma laje. | `--color-card` = `--surface-1`, fio quase invisível, raio 16 |
| **Vidro** | Chrome flutuante: **a sidebar**, doca, sheet, popover. | ver abaixo |
| **Tinta** | Arte de capa. A única cor saturada na tela. | (não se constrói) |

### O card, e a capa que flutua dentro dele

Um livro é um **card**, e a capa mora **dentro** dele: uns 58% da largura, centralizada, com ar em volta e uma sombra macia embaixo (`--shadow-cover`). A sombra não é decoração: é ela que transforma a capa de amostra de tinta em **objeto pousado numa superfície**. Antes a capa sangrava na grade com o título impresso por cima, e a estante inteira parecia uma cartela de cores.

Título embaixo da capa, centralizado, em serifa. Autor embaixo, menor, apagado. **Sem badge de status:** quarenta e quatro repetições de "esperando" é textura, não informação, e a prateleira escolhida na sidebar já respondeu isso. Sobra um ponto discreto, só no hover.

### A capa tipográfica

Quando a Open Library não tem imagem, a gente desenha a capa. Ela **nunca pode gritar mais alto que uma capa de verdade**: arte de capa é a única cor saturada da tela, e uma parede de placeholders em verde-limão e roxo neon inverte exatamente essa regra, afogando as capas reais, que são o conteúdo.

Então a paleta é **tinta de impressão, não bloco de cor**: grafite, bordô fechado, azul-carimbo, verde-garrafa, ocre queimado, sépia, tinta quase preta. Baixa cromia, escura, quente, quieta. Ela deve ler como um livro cuja foto a gente simplesmente não tem, e deve **recuar** atrás de qualquer jaqueta real ao lado.

A tipografia **é** a capa, no espírito Penguin Classics: título em serifa com presença de verdade, uma régua de 1px, e o autor em versalete embaixo. Não uma etiqueta de 11px espremida no canto. O corpo do texto escala com o container (`cqw`), então o mesmo componente serve uma miniatura de 56px na busca e uma capa de 200px na página do livro.

**O teste:** numa parede misturando capa real e capa tipográfica, as reais têm que saltar. Se as geradas saltarem, a hierarquia está invertida e a tela está errada.

### Vidro

```css
.glass {
  background: color-mix(in srgb, var(--canvas) 62%, transparent);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 0.5px solid color-mix(in srgb, white 22%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 45%, transparent),  /* specular top edge */
    0 8px 32px rgb(0 0 0 / 0.10),                              /* diffuse drop      */
    0 1px 2px rgb(0 0 0 / 0.06);                               /* contact shadow    */
  border-radius: 28px;
}
```

Três coisas fazem isso ler como vidro, e não como "uma div borrada":

1. **Boost de saturação, não só blur.** O `saturate(180%)` é o que faz a arte de capa vazar cor através da barra. Blur sozinho te dá papa cinza.
2. **A borda superior especular.** O realce branco `inset 0 1px 0` é a luz pegando o lábio do material. Sem ele não há espessura.
3. **Uma sombra de contato.** Duas sombras, não uma: uma escura e fechada para que ele assente na superfície, e uma larga e suave para que ele flutue acima dela.

**Guardrails inegociáveis.** Vidro nunca carrega texto de corpo; só rótulos, ícones e controles (≥13px, peso 500). Atrás de qualquer vidro com texto, um scrim de `color-mix` mantém o contraste ≥4.5:1 mesmo sobre uma capa preta. E:

```css
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .glass { background: var(--paper); backdrop-filter: none; }
}
```

`backdrop-filter` num elemento grande e sempre visível repinta a cada frame de scroll. Restrinja a elementos com `position: sticky` e tamanho fixo, nunca a uma lista de cartões que rola. Teste num Android de cinco anos antes de subir qualquer superfície de vidro nova.

---

## Raios

Arredondado, mas não um brinquedo. Os raios são grandes e *consistentes por material*, nunca por componente.

```css
--radius-glass: 28px   /* sidebar, dock, sheets */
--radius-1:     16px   /* card e paper: o mesmo raio */
--radius-2:     12px   /* buttons, inputs, chips */
--radius-cover:  6px   /* book covers: a real book has a hard corner */
```

Card e papel dividem o mesmo raio (`--radius-1`, 16px): os dois são conteúdo, e um só token os mantém consistentes. Controles caem para 12px (`--radius-2`).

Só a capa quebra a regra "raio por material": ela recebe 6px de propósito. Uma capa de livro com raio de 16px deixa de ser um livro.

---

## Tipografia

O premium vem da tipografia, não dos efeitos. Duas famílias:

- **Voice**: **Newsreader**, um serif de verdade com personalidade editorial, para títulos de livro, citações e números grandes. Aberta, gratuita, pronta para produção. Essa é a decisão de maior alavancagem no produto inteiro; é o que o Oku não tem. (A **Fraunces** faz um papel à parte, só na marca — ver acima.)
- **Chrome**: **Geist**. A Inter é boa e é genérica, e genérico era exatamente o que estava segurando o app no "bonitinho". A Geist tem um esqueleto mais frio e mais mecânico: lê como software sem ler como template, e senta ao lado de uma serifa de alto contraste sem competir com ela.

Números são sempre `font-variant-numeric: tabular-nums`. Sentence case em tudo. Sem CAIXA ALTA, exceto rótulos de seção minúsculos de 11px com tracking `0.12em`.

---

## Cor

O canvas é neutro quente. A tinta é a arte de capa. Essa é a paleta.

Um acento, usado para no máximo um elemento por tela (uma nota, uma ação primária). Ele é o **verde-água da lâmina** (`--color-accent: #7dd3c0`) — a cor do fio, não um azul de SaaS. Ver "O accent: a lâmina", acima, para por que ele venceu o vermelhão e o azul de carimbo que já foram candidatos.

O modo escuro não é invertido, é *reduzido*: preto quase absoluto (`#060606`), nunca um `#111827` frio. Vidro no modo escuro cai para ~48% de opacidade e a borda especular cai para ~14% de branco.

---

## Movimento

Springs, não ease-outs. Superfícies de vidro escalam a partir de 0.96 com um leve overshoot; o conteúdo faz cross-fade. Durações de 180 a 260ms. Nada quica duas vezes.

```css
--ease-spring: linear(0, 0.35, 0.78, 0.97, 1.02, 1);
```

---

## O teste

Tire um screenshot sem nenhum texto visível: capas, barra de vidro, espaço em branco. Se não parecer algo que você deixaria no seu desktop, a tela não está pronta. Essa é a régua que o Oku estabeleceu e a que a gente tem que superar.

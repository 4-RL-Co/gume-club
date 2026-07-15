# A poda

**Nada foi executado.** Este documento é a medição, e o comando está pronto para você
rodar acordado.

Medido em 12 de julho de 2026, no banco de desenvolvimento.

> **Aviso:** esta medição é anterior às migrations de deduplicação de autor 0033–0035,
> que rodaram em 13 de julho. Depois delas o acervo é outro — hoje são cerca de 123 mil
> autores, 262 mil obras e 299 mil edições. Os números crus abaixo (inclusive os 160.726
> autores e a linha 160.726 → 929) ficam como registro histórico, não como o estado atual.

---

## O comando

```
pnpm poda            # MEDE e imprime. Não escreve nada. Rode este primeiro.
pnpm podar           # apaga de verdade, em lotes, e devolve o disco
```

`pnpm podar` faz três coisas em sequência: aplica a migration `0032_poda` (que cria o
livro-caixa e derruba um índice duplicado), poda em lotes de 5.000, e roda o
`VACUUM FULL`.

**O `VACUUM FULL` tranca as tabelas.** Suba isso com o app fora do ar. Sem ele o
`DELETE` não devolve um byte de disco: o espaço vira buraco reutilizável e a Neon
continua cobrando pelos 593 MB.

**O desfazer é `pnpm db:import`.** O dump da Open Library é público e re-importa o
acervo inteiro. A gente não está queimando o dado — está tirando ele de cima da mesa.

---

## Os números

| | hoje | ficam | saem |
|---|---|---|---|
| obras | 373.435 | **9.434** | 364.001 (97%) |
| edições | 414.949 | **14.150** | 400.799 (97%) |
| autores | 160.726 | **929** | 159.797 (99%) |

**Banco: 593 MB → ~25 MB estimados.** O plano grátis da Neon é 500 MB. Não vai faltar.

### O portão

Antes de apagar qualquer coisa, o script conta quantas obras da lista de poda tocam
dado de **gente** — estante, leitura, cópia, nota, resenha, indicação, proposta de capa,
correção de bibliotecário.

**Deu zero.** Se não desse, o script abortaria — não avisaria e continuaria.

Isso não é zelo decorativo. Apagar uma obra **cascateia** no banco: `library_entries`,
`ratings`, `reviews`, `recommendations` e `collection_items` têm `on delete cascade`
para `works`. Uma obra apagada por engano leva junto a estante de alguém, em silêncio,
sem um erro no terminal.

E `readings` aponta para **edição**, não para obra: apagar a obra apagaria a edição em
cascata e deixaria a leitura da pessoa órfã. O primeiro rascunho deste script tinha
esse buraco.

---

## O que a medição descobriu, e que quase custou caro

**A primeira versão desta poda teria apagado Camões.**

O cânone original tinha 300 autores, montados a partir de best-seller, mangá e clássico
internacional. A medição mostrou que a **força do acervo é exatamente a literatura
lusófona** — e que o cânone não tinha quase nada dela.

Teriam sido apagados:

```
Luís de Camões ............. 213 obras        Miguel Torga ............... 54
Aquilino Ribeiro ........... 132              António Lobo Antunes ....... 49
Gil Vicente ................ 122              Sophia de Mello Breyner .... 47
Agustina Bessa-Luís ......... 99              Vinícius de Moraes ......... 44
Camilo Castelo Branco ....... 98              Castro Alves ............... 42
Antero de Quental ........... 94              Millôr Fernandes ........... 33
Joaquim Manuel de Macedo .... 85              Mário Quintana ............. 32
José Lins do Rego ........... 76              Olavo Bilac ................ 31
Padre António Vieira ........ 63              Cruz e Sousa ............... 30
```

…e mais uns quarenta: Florbela Espanca, Manoel de Barros, Lygia Bojunga, Ana Maria
Machado, Almeida Garrett, Alexandre Herculano, Moacyr Scliar, Luis Fernando Verissimo.

**E a pior de todas: "Jorge Leal Amado de Faria" — 111 obras.** É o nome de registro do
Jorge Amado, numa linha de autor duplicada. A poda ia apagar essas 111 e guardar as 25
que estão sob "Jorge Amado", porque o casamento por nome não reconhecia os dois como a
mesma pessoa. É o retrato da dívida dos 10.386 autores duplicados.

**Conserto:** o cânone ganhou o bloco `LUSOFONIA` (67 autores) e foi de 300 para 367.
Ver `seed/canone.ts` e [ai/DECISIONS.md](../ai/DECISIONS.md).

Isto é o que acontece quando a lista vem da cabeça e a poda vem do banco: a cabeça
lembra do que ela lê, e o banco sabe do que ele tem. **A lista só ficou boa depois de a
medição contradizê-la.**

---

## Trinta que sairiam

Sorteados ao acaso, e não os primeiros da ordem alfabética — os primeiros mentem: o
Unicode joga o lixo (livro de colorir com emoji no título, spam em cinco alfabetos)
para a frente, e a amostra fica boa demais.

```
▢ Tempestade na planície: poemas                       Silva Pontes
▢ Os carismas na igreja do terceiro milênio            J. B. Libânio
▢ Por uma democracia anticapitalista                   Mário Sottomayor Cardia
▢ Conhecendo a madeira: informações sobre 90 espécies  Francisco Tarcísio Mota
▢ Regionalização solidária e cooperativa               Luís André Prado
▢ As formas do crime                                   Tulio Kahn
▢ Livro para Colorir de Pilotos                        Nick Snels
▢ Direito e economia: uma abordagem multidisciplinar   Luiz Sávio Aguiar Lima
▢ ECONOMIA SOLIDÁRIA: Da Construção de Conceitos       Maxwel Araújo
▢ Smetak imprevisto                                    Jasmin Pinho
▢ Guia Prático de AutoCAD: Básico 2D e 3D — 2018       Rosenilda Rodrigues
▢ Liberdade, Loucura e Morte                           Péricles Alves de Oliveira
▢ Poesias: Versos de um simples                        Sebastião Guimarães
▢ As mãos no fogo: o romance graciano                  Reinaldo Santos Neves
▢ Ao redor de Cruz e Sousa                             Iaponan Soares
▢ Sou insensato                                        Cristovam Buarque
▢ Os trapalhões no campo                               Alain Grée
▢ Abril: 40 anos                                       A. do Carmo Reis
▢ Os franceses residentes no Rio de Janeiro, 1808-1820 Arquivo Nacional
▢ O melhor do conto brasileiro                         —
▢ Dos males eu sou o pior                              Ricardo Panisi
▢ Teatro II                                            Maria Clara Machado
▢ Notícias de uma terra dessemelhante                  Eduardo Diogo Tavares
▢ Quando o coração chora: poesia                       Nazaré Alves
▢ Constituição política do estado de Pernambuco        Pernambuco (Brazil)
▢ Pensamentos em R. Shany: a vida                      Thammy Lodge
▣ Manual técnico para preparação de formulações        —
▢ Código administrativo actualizado                    Armando Dias Gomes
▢ A sinagoga portuguesa "Sahaaré tikvá"                Moses Bensabat Amzalak
▢ Laudes e cantigas espirituais de Mestre André Dias   Andrés de Escobar

▣ tem capa   ▢ não tem
```

**Vinte e nove dos trinta não têm capa.** É manual técnico, tese, guia de software,
constituição estadual, poesia de vaidade e livro de colorir. É isso que ocupa os 570 MB.

A perda real, e ela existe: `Teatro II`, de Maria Clara Machado. Um ou outro nome de
verdade vai junto — e o jeito de trazer de volta é a fila de pedidos (`/pedidos`), que
registra toda busca que não achou nada.

---

## O que fica

**9.434 obras**, de 929 linhas de autor — as dos 367 do cânone, mais tudo que qualquer
pessoa já pôs na estante, leu, comprou, avaliou, resenhou, indicou ou corrigiu.

E o acervo cresce de novo por três canos, todos já construídos:

1. **`/pedidos`** — toda busca que não acha nada vira um pedido, e a fila é a lista de
   qual autor importar em seguida.
2. **"Não achei meu livro"** — dois campos, quinze segundos, e o Gume procura editora,
   ano, páginas, ISBN e capa sozinho.
3. **`pnpm db:import`** — o dump inteiro, quando fizer sentido.

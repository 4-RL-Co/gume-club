# Gume — capas e criação de livros

O que está pronto, o que travou, e o prompt pronto pro Claude Code fechar tudo.

## O que tem nesta entrega

- **`gume_livros_para_criar.csv`** — a planilha. Colunas: `categoria, ordem, isbn, titulo, autor, editora, cover_url, origem_url`.
  - **H1 Editora: 27 livros, completos.** ISBN real (do dado estruturado do site deles) + **URL da capa exata em alta** (o CDN da H1 entrega 840×1170). Dá pra criar e capear os 27 direto.
  - **Clube de Literatura Clássica: 73 livros** (dos 87 da lista; 14 ficaram de fora por corte da página). Título + autor. ISBN e capa ainda **não preenchidos** (edição colecionável, precisa busca por livro).
- **`capas/`**
  - `01_minha_estante_e_alex/` — **52 capas** que a sessão anterior já tinha baixado (sua estante + a do Alex). Nomes descritivos, não ISBN (ver ressalva abaixo).
  - `02_h1_editora/` — 1 capa baixada (Storynomics). As outras 26 saem pela `cover_url` da planilha.
  - `03_clube_literatura_classica/` e `04_top10_selos/` — vazias por ora.

## Por que as capas não vieram todas como arquivo

Dois muros técnicos nesta sessão, sem rodeio:

1. **O upload de capa no Gume travou.** O app é um SPA com conexão viva, então ele nunca fica "idle", e as ferramentas do navegador que localizam o campo "subir uma capa" expiram. Sem isso, não dá pra aplicar capa pela interface.
2. **Baixar capa em lote esbarra na proteção do Chrome.** O Chrome libera ~1 download por aba e bloqueia o resto ("múltiplos downloads automáticos"). Aba nova reseta, mas isso inviabiliza baixar ~170 capas na mão.

E o sandbox onde eu rodo download não tem saída de rede pra hosts de imagem (só mirror de pacote). Ou seja: baixar capa por aqui é frágil por natureza.

**A saída boa:** o **Claude Code** tem rede de verdade. A planilha já traz a `cover_url` exata de cada livro da H1. Um script baixa as 27 (e as que você preencher do Clube) **nomeando por ISBN**, e cria os livros. É mais robusto, é lote, e não erra edição.

## Prompt pronto pro Claude Code

> Tenho um CSV em `gume_livros_para_criar.csv` com colunas `categoria, ordem, isbn, titulo, autor, editora, cover_url, origem_url`.
>
> 1. Para cada linha que tiver `cover_url` e `isbn`, baixe a imagem e salve em `capas/<categoria>/<isbn>.jpg`. Confirme que cada arquivo é um JPEG válido (> 5 KB); logue as que falharem.
> 2. Crie no catálogo do Gume cada livro da planilha (comece pela H1 Editora, que está completa), usando a server action de criação/correção de ficha do próprio app, autenticado. Título, autor, editora e ISBN vêm do CSV; a capa é o arquivo `<isbn>.jpg`. Rode em modo idempotente: se já existe edição com aquele ISBN, não duplique.
> 3. Para o Clube de Literatura Clássica, o CSV tem título e autor mas falta ISBN e capa. Para cada um, busque a edição do selo "Clube de Literatura Clássica" (por título + editora) numa fonte confiável (Estante Virtual, Travessa, site do clube), pegue ISBN e a URL da capa exata, preencha o CSV, e então baixe a capa como `<isbn>.jpg`. **Regra de ouro do Gume: capa diferente é edição diferente — só use a capa da edição do Clube, não uma qualquer.**
> 4. Me devolva um relatório: criados, capeados, e os que não deu pra casar com confiança (pra eu conferir na mão).

## O que ainda falta (pra ficar 100%)

- **Clube de Literatura Clássica:** ISBN + capa dos 73 (e achar os 14 que faltaram da lista de 87).
- **Top 10 Antofágica, Martin Claret, Penguin:** não cheguei a levantar. São +30 livros; entram como novas linhas no CSV com o mesmo formato.
- **As 52 capas da sua estante e do Alex** estão com nome descritivo (ex.: `gume_casa_amarela.jpg`, `s2_van_gogh.jpg`), não ISBN. O Claude Code consegue casar pelo título, mas se quiser ISBN no nome, o jeito exato é ler o ISBN da ficha de cada livro no Gume (o campo ISBN aparece lá, como no A Casa Amarela = 9786555981216) e renomear.
- **5 capas falharam** no download anterior (vieram com 43 bytes): `c_arte_magia_caos`, `c_kabbalah_hermetica`, `c_liber_aba`, `s2_problemas`, `s2_cinco_estrelas`. Precisam re-baixar.

## Nota honesta

O pedaço que ficou realmente pronto e "vale a pena" é a **H1 completa** (ISBN + capa exata em alta, 27 livros) e a **espinha do CSV**. O resto é preenchimento mecânico que o Claude Code fecha melhor que eu no navegador, porque ele baixa por URL sem esbarrar no Chrome e cria em lote pela server action sem depender da tela.

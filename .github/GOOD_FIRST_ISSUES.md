# Good first issues, o cardápio

Reais, delimitadas e úteis. Não decorativas. Abra estas como issues quando o repo ficar
público, com a label `good first issue`.

Duas listas, e é de propósito: as maiores (os importadores, o campo de autor) já têm o
texto inteiro pronto para copiar em [`ISSUE_DRAFTS/`](./ISSUE_DRAFTS): o que é, por que
importa, qual arquivo, as armadilhas, como testar. As menores estão aqui, em uma linha cada.

## Com texto pronto em ISSUE_DRAFTS/

- **Importadores de StoryGraph, Skoob, LibraryThing, Kindle e Kobo.** O de Goodreads já
  existe e abriu a espinha; estes reusam. Ver drafts 02 a 06.
- **ISBN-10 vira ISBN-13, e um ISBN torto nunca entra.** O menor PR do repo: função pura,
  arquivo novo, com teste. Draft 07.
- **Leitor de código de barras de ISBN** (`BarcodeDetector`, com entrada manual de reserva
  para o Firefox). Draft 08.
- **Colar uma lista: use o autor que a pessoa escreveu, e pare de consultar em série.**
  Draft 10.
- **O campo de autor está podre** (grande, não é primeiro PR: é dívida de dado de quem já
  conhece o acervo). Draft 11.

## Menores, em uma linha

- **Exportação em Markdown.** Um arquivo por livro, frontmatter YAML, pronto pro Obsidian.
  O JSON e o CSV já existem; falta só o Markdown.
- **Geração de `blurhash` para capas cacheadas**, para a estante nunca piscar vazia.
- **Locale PT-BR**, completo, revisado por um falante nativo.
- **Estados vazios** que faltam, com ornamento tipográfico, sem ilustração de banco de
  imagem. Ver docs/design.md.
- **Vidro acessível.** Audite toda superfície de vidro por contraste sobre uma capa preta,
  e honre `prefers-reduced-transparency`.

## Já entregues (não abrir)

Ficam aqui para ninguém abrir uma issue de algo que já existe:

- ✅ **Importador de CSV do Goodreads, sem perdas.** `lib/import/`, `app/importar/`.
- ✅ **Cliente da Open Library com fallback de capa** (Google Books, depois capa
  tipográfica: nunca uma caixa cinza). `scripts/backfill-covers.mjs`, `components/cover.tsx`.
- ✅ **O teste de rota que nasce pública sem ninguém decidir.** `lib/surface.test.ts`.
- ✅ **Meta de leitura correta em fuso horário.** `lib/fuso.test.ts`.

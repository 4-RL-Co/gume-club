#!/usr/bin/env bash
# Abre como issues do GitHub os drafts que a conferência de 2026-07-22 validou
# contra o código. Precisa de `gh auth login` antes. Idempotente NÃO é: rodar
# duas vezes abre issues em dobro — confira a aba Issues antes de rodar.
#
#   bash .github/ISSUE_DRAFTS/abrir-issues.sh
#
# Fora da lista, e por quê: 01, 02 e 03 (entregues: o parser de Goodreads,
# StoryGraph e Skoob existe em lib/import/parse.ts), e a 11 entra SEM a label
# de primeiro PR, porque o próprio texto diz que não é um.
set -euo pipefail
cd "$(dirname "$0")"

REPO="olegas4real/gume-club"

# As labels primeiro. `--force` atualiza se já existir, em vez de falhar.
gh label create "good first issue" --repo "$REPO" --color 7057ff --force \
  --description "Primeiro PR de verdade: arquivo, armadilhas e régua escritos na issue"
gh label create "importador" --repo "$REPO" --color 0e8a16 --force \
  --description "Trazer a estante de outro app, sem perdas"
gh label create "dados de livro" --repo "$REPO" --color b8860e --force \
  --description "Catálogo: fichas, ISBN, autores"
gh label create "estante" --repo "$REPO" --color 2565a3 --force \
  --description "A estante e o caminho até ela"
gh label create "seus dados" --repo "$REPO" --color ab3d68 --force \
  --description "Exportação e posse do que é seu"

# O corpo é o draft sem o cabeçalho YAML (as 4 primeiras linhas).
corpo() { tail -n +5 "$1"; }

abrir() { # abrir <arquivo> <título> <labels separadas por vírgula>
  echo "→ $2"
  corpo "$1" | gh issue create --repo "$REPO" --title "$2" --label "$3" --body-file -
}

abrir 04-importador-librarything.md "Importador: LibraryThing, sem perdas" "good first issue,importador"
abrir 05-importador-kindle.md "Importador: Kindle (a biblioteca, não os grifos)" "good first issue,importador"
abrir 06-importador-kobo.md "Importador: Kobo (e a decisão do sqlite)" "good first issue,importador"
abrir 07-isbn-10-e-o-digito-verificador.md "ISBN-10 vira ISBN-13, e um ISBN torto nunca entra" "good first issue,dados de livro"
abrir 08-leitor-de-codigo-de-barras.md "Leitor de código de barras: aponte a câmera pra contracapa" "good first issue,estante"
# A 09 abre SÓ com o escopo que sobrou: JSON e CSV já existem em lib/exportar.ts.
abrir 09-exportar-tudo.md "Exportar em Markdown: um arquivo por livro, pronto pro Obsidian" "good first issue,seus dados"
abrir 10-colar-uma-lista-usa-o-autor.md "Colar uma lista: use o autor que a pessoa escreveu" "good first issue,dados de livro"
# A 11 não tem cabeçalho YAML (o arquivo inteiro é o corpo) e não é primeiro PR.
echo "→ O campo de autor está podre"
gh issue create --repo "$REPO" \
  --title "O campo de autor está podre, e ele estraga quatro coisas de uma vez" \
  --label "dados de livro" \
  --body-file 11-o-campo-de-autor-esta-podre.md

echo
echo "✓ 8 issues abertas. Confira em https://github.com/$REPO/issues"

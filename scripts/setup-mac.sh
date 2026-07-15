#!/usr/bin/env bash
# Setup local do Gume no macOS, sem Docker.
# Rode uma vez:  bash scripts/setup-mac.sh
set -euo pipefail

# o brew agora pede confirmação quando vai atualizar dependências.
# num script isso trava, então: modo não-interativo.
export NONINTERACTIVE=1
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_ENV_HINTS=1

PG=postgresql@16
say() { printf "\n\033[1m→ %s\033[0m\n" "$1"; }

# ── homebrew
if ! command -v brew >/dev/null 2>&1; then
  say "instalando o Homebrew (vai pedir sua senha)"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi
eval "$(brew shellenv)" 2>/dev/null || true

# ── node + postgres
command -v node >/dev/null 2>&1 || { say "instalando Node"; brew install node; }
brew list "$PG" >/dev/null 2>&1 || { say "instalando Postgres"; brew install "$PG"; }

PGBIN="$(brew --prefix)/opt/$PG/bin"
export PATH="$PGBIN:$PATH"

say "subindo o Postgres"
brew services start "$PG" >/dev/null
for i in {1..20}; do "$PGBIN/pg_isready" -q && break || sleep 1; done

# ── banco
say "criando o banco gume"
"$PGBIN/createuser" -s gume 2>/dev/null || echo "  (usuário gume já existe)"
"$PGBIN/createdb" -O gume gume 2>/dev/null || echo "  (banco gume já existe)"

# ── pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  say "instalando o pnpm"
  npm install -g pnpm
  hash -r
fi
command -v pnpm >/dev/null 2>&1 || { echo "✗ pnpm não entrou no PATH. abra um terminal novo e rode o script de novo."; exit 1; }

# ── env
if [ ! -f .env ]; then
  say "criando .env"
  cp .env.example .env
  SECRET="$(openssl rand -base64 32)"
  # no mac, o sed precisa do argumento vazio depois do -i
  sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=postgres://gume@localhost:5432/gume|" .env
  sed -i '' "s|^AUTH_SECRET=.*|AUTH_SECRET=$SECRET|" .env
fi

# ── app
say "instalando dependências"
pnpm install

say "rodando as migrations"
pnpm db:generate
pnpm db:migrate

say "checando"
pnpm typecheck
# O hook que barra arquivo grande é versionado em .githooks, mas core.hooksPath é
# config local: um clone novo não vem com ele ligado. Ligue aqui, ou o repo fica
# sem a rede que impede 2,7 GB de dump de virar blob outra vez.
git config core.hooksPath .githooks
echo "✓ hook de pre-commit ligado (bloqueia arquivo > 10 MB)"

pnpm test
pnpm audit:security

cat <<'DONE'

✓ pronto.

  pnpm dev     → http://localhost:3000

Postgres roda em background (brew services). Pra parar: brew services stop postgresql@16

DONE

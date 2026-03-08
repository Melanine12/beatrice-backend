#!/bin/bash
# Migration tbl_sanctions_pro via client MySQL (contourne le problème Node/macOS)
# Usage : depuis backend/ : ./scripts/migrate-sanctions-pro.sh
#         ou : bash backend/scripts/migrate-sanctions-pro.sh

set -e
# Répertoire backend/
BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# Racine projet (parent de backend)
PROJECT_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"
SQL_FILE="$PROJECT_ROOT/database/create_tbl_sanctions_pro.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "Fichier SQL introuvable: $SQL_FILE"
  exit 1
fi

# Charger .env depuis backend/ si présent
if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  source "$BACKEND_DIR/.env" 2>/dev/null || true
  set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_NAME="${DB_NAME:-hotel_beatrice}"
# DB_PASSWORD lu depuis .env ou demandé ci‑dessous

echo "Base: $DB_NAME @ $DB_HOST:$DB_PORT (user: $DB_USER)"
echo "Exécution de la migration tbl_sanctions_pro..."

if [ -n "$DB_PASSWORD" ]; then
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE"
else
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < "$SQL_FILE"
fi

echo "Table tbl_sanctions_pro créée avec succès."

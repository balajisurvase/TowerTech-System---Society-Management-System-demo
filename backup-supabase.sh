#!/usr/bin/env bash
set -euo pipefail

read -rsp "Paste your database connection string (input hidden): " DB_URL
echo
if [[ -z "$DB_URL" ]]; then
  echo "No connection string entered."
  exit 1
fi

supabase db dump --db-url "$DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$DB_URL" -f schema.sql
supabase db dump --db-url "$DB_URL" -f data.sql --use-copy --data-only \
  -x "storage.buckets_vectors" \
  -x "storage.vector_indexes"

unset DB_URL
echo "Backup complete: roles.sql, schema.sql, data.sql"

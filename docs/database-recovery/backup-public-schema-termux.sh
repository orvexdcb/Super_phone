#!/data/data/com.termux/files/usr/bin/bash
# SUPER PHONE — Android/Termux partial database export
# Exports ONLY the application-owned public schema. This is NOT a full Supabase backup.
set -Eeuo pipefail

command -v pg_dump >/dev/null 2>&1 || { echo "pg_dump missing. Run: pkg install postgresql"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "psql missing. Run: pkg install postgresql"; exit 1; }

read -r -p "Session Pooler host (from Supabase Connect): " PGHOST
read -r -p "Session Pooler port [5432]: " PGPORT
PGPORT="${PGPORT:-5432}"
read -r -p "Database user (usually postgres.PROJECT_REF): " PGUSER
read -r -p "Database name [postgres]: " PGDATABASE
PGDATABASE="${PGDATABASE:-postgres}"
read -r -s -p "Database password (hidden): " PGPASSWORD
echo
export PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD
export PGSSLMODE=require

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out="$HOME/SUPER_PHONE_Backups/$stamp"
mkdir -p "$out"
chmod 700 "$HOME/SUPER_PHONE_Backups" "$out"

cleanup() { unset PGPASSWORD; }
trap cleanup EXIT

echo "Checking database connection..."
psql -X -v ON_ERROR_STOP=1 -Atqc "select current_database(), current_user, current_setting('server_version')" > "$out/connection-check.txt"

echo "Exporting application-owned public schema and data..."
pg_dump --format=plain --schema=public --no-owner --file="$out/public-schema-and-data.sql"

test -s "$out/public-schema-and-data.sql"
pg_dump --version > "$out/pg_dump-version.txt"
sha256sum "$out/public-schema-and-data.sql" > "$out/SHA256SUMS"
cat > "$out/NOTICE.txt" <<'NOTICE'
Partial SUPER PHONE export from Termux.
Includes only schema=public (application-owned tables, functions, triggers, policies and data where permissions allow).
Does NOT establish a complete Supabase backup. Supabase-managed auth/storage schemas, project settings, secrets,
edge functions and Storage object bytes are not covered by this file. Verify dump contents and test restore
in a separate project before relying on recovery.
NOTICE

unset PGPASSWORD
echo
echo "Export created: $out"
ls -lh "$out"
echo "IMPORTANT: Keep this folder private. Do not upload it to the public GitHub repository."

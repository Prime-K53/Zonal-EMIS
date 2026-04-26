#!/bin/bash

# Configuration
POSTGRES_URL="postgresql://neondb_owner:npg_RE0btSVdXN2i@ep-nameless-pond-am1q9eha-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
SQLITE_DB="prisma/dev.db"
DUMP_FILLE="neon_dump.sql"
CLEAN_FILE="sqlite_ready.sql"

echo "🚀 Starting Migration from Neon (Postgres) to SQLite..."

# 1. Export Neon database
echo "📥 1. Exporting Neon database via pg_dump..."
# Note: You need pg_dump installed. In many environments it is available.
pg_dump "$POSTGRES_URL" --clean --if-exists --no-owner --no-privileges --data-only --inserts > "$DUMP_FILLE"

# 2 & 3. Convert Syntax and Remove Unsupported Features
echo "🔄 2 & 3. Converting PostgreSQL syntax to SQLite compatible syntax..."
sed -e 's/SERIAL/INTEGER PRIMARY KEY AUTOINCREMENT/g' \
    -e 's/BOOLEAN/INTEGER/g' \
    -e 's/TRUE/1/g' \
    -e 's/FALSE/0/g' \
    -e 's/TIMESTAMP/DATETIME/g' \
    -e 's/NOW()/CURRENT_TIMESTAMP/g' \
    -e '/CREATE SEQUENCE/d' \
    -e '/ALTER SEQUENCE/d' \
    -e '/SELECT pg_catalog.setval/d' \
    -e '/SET /d' \
    -e 's/::[a-z ]*//g' \
    "$DUMP_FILLE" > "$CLEAN_FILE"

# 4. Produce clean SQLite-ready SQL file
echo "✨ 4. Clean SQL file produced: $CLEAN_FILE"

# 5. Import into SQLite
echo "📥 5. Importing data into $SQLITE_DB..."
sqlite3 "$SQLITE_DB" < "$CLEAN_FILE"

# 6. Verify integrity
echo "✅ 6. Verifying data integrity..."
echo ".tables" | sqlite3 "$SQLITE_DB"
echo "SELECT 'User count: ' || count(*) FROM User;" | sqlite3 "$SQLITE_DB"
echo "SELECT 'School count: ' || count(*) FROM School;" | sqlite3 "$SQLITE_DB"

echo "🎉 Migration Complete!"

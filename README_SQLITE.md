# EMIS Backend: SQLite Offline-First Migration

## 🌍 Overview
The database has been migrated from **Postgres (Neon)** to **SQLite** to support offline-first development and local staging.

## 🧱 Key Changes
- **Database**: Switched from PostgreSQL to SQLite (`prisma/dev.db`).
- **Schema**: 
  - `Json` and `String[]` types were converted to `String`.
  - `UserRole` enum converted to `String` (SQLite doesn't support native Enums in Prisma).
- **Automation**: Implemented a **Prisma Extension** in `src/modules/prisma/prisma.service.ts` that automatically:
  - `JSON.stringify` values on writes (`create`, `update`).
  - `JSON.parse` values on reads (`findMany`, `findUnique`).

## 📂 Migration Tools
`scripts/migrate_data.sh`: A shell script to export data from Neon Postgres, convert the syntax, and import it into SQLite.

## 🚀 Commands

### 1. Initialize DB & Sync Schema
```bash
npx prisma db push
```

### 2. Seed Initial Data
```bash
npx prisma db seed
```

### 3. Run Data Migration (Requires pg_dump)
```bash
chmod +x scripts/migrate_data.sh
./scripts/migrate_data.sh
```

## 📡 Offline-First Synchronization
The backend continues to support the sync strategy using timestamps, now optimized for SQLite's single-file portable nature.

## ⚠️ Notes
- Complex queries involving JSON paths (e.g. searching inside a JSON field) are handled by parsing the string after retrieval.
- Ensure the `DATABASE_URL` in `.env` points to `file:./prisma/dev.db`.

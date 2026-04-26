# EMIS Backend Migration: Firebase to NestJS + PostgreSQL

## 🌍 Overview
This project has been migrated from a Firebase-based architecture to a production-ready **NestJS** backend with a **PostgreSQL** database managed by **Prisma ORM**. This architecture provides better data integrity, scalability, and support for complex analytical queries required for a national-level EMIS.

## 🧱 New Architecture
- **Framework**: NestJS (Modular structure)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **API**: RESTful with Swagger documentation
- **Auth**: JWT-based Authentication with RBAC
- **Sync**: Timestamp-based pull/push mechanism for offline-first capabilities

## 📂 Folder Structure
- `prisma/`: Database schema and migrations
- `src/modules/`: Feature-based modular logic
  - `auth/`: Login and JWT strategies
  - `schools/`: School management (Normalization)
  - `teachers/`: Records, TPD, and transfers
  - `sync/`: Offline data synchronization
- `scripts/`: Migration and utility scripts

## 🚀 Getting Started

### 1. Prerequisites
- Docker (for PostgreSQL) or a local Postgres instance
- Node.js 18+

### 2. Environment Setup
Create a `.env` file based on `.env.example`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/emis_db?schema=public"
JWT_SECRET="your_secret"
```

### 3. Initialize Database
```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run DB migrations
npx prisma migrate dev --name init
```

### 4. Data Migration from Firebase
To pull existing data from Firestore and populate PostgreSQL:
```bash
npm run migrate
```

### 5. Start Development Server
```bash
npm run dev
```
API Documentation will be available at: `http://localhost:3000/api/docs`

## 📡 Offline-First Strategy
The backend supports a `pull/push` sync strategy:
1. **Pull**: Client requests all records updated after their `lastSyncTimestamp`.
2. **Push**: Client sends locally created/updated records.
3. **Conflict Resolution**: The server implements a "Last-Write-Wins" policy with version tracking.

## 📊 Performance Optimizations
- **Indexing**: Database indexes are applied to `emisCode`, `email`, and `nationalId`.
- **N+1 Prevention**: Prisma `include` blocks are used for efficient data fetching.
- **Filtering**: Server-side pagination and case-insensitive searching implemented for large datasets.

# Cholo-Paltai CRM Backend

Node.js + Express + PostgreSQL API for the call-center CRM.

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create PostgreSQL database and run schema:

```bash
createdb cholopaltai
psql cholopaltai < schema.sql
```

3. Copy `.env.example` to `.env` and adjust values.

4. Create an admin user by running a small Node script (example in docs) that inserts into `users` with a bcrypt hash.

5. Start dev server:

```bash
npm run dev
```

API will run on `http://localhost:4000`.

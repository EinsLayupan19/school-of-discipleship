# Installation Guide (local development)

## Prerequisites
Node.js 18+, npm, a Supabase project.

## Backend
```
cd backend
cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm install
npx prisma migrate dev
npx prisma db seed      # creates the first Super Admin account
npm run dev
```

## Frontend
```
cd frontend
cp .env.example .env   # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm install
npm run dev
```

Open `http://localhost:5173`, log in with the seeded Super Admin credentials (printed by the seed script).

See `deployment-guide.md` for production setup.

# Deployment Guide

## Backend → Railway
1. Push `backend/` to a GitHub repo.
2. Railway → New Project → Deploy from GitHub → select repo, root dir `backend`.
3. Set environment variables (copy from your local `.env`): `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN` (set to your Vercel frontend URL), `PORT` (Railway sets this automatically — don't hardcode).
4. Build command: `npm run build`. Start command: `npm start`.
5. After first deploy, run migrations from your local machine (pointed at prod `DATABASE_URL`) or via Railway's shell: `npx prisma migrate deploy`.

## Frontend → Vercel
1. Push `frontend/` to GitHub (same repo, different root dir, or separate repo).
2. Vercel → New Project → root dir `frontend`. Framework preset: Vite.
3. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL` (your Railway backend URL + `/api`).
4. Deploy.

## Database
Already on Supabase (configured since Phase 2). For production, make sure Row Level Security policies aren't blocking Prisma's service-role connection (Prisma bypasses RLS via the direct Postgres connection, so this is usually a non-issue).

## Admin accounts
Run the seed script once against production (`npx prisma db seed` with prod env vars set), then immediately change the seeded password via **Change password** in the app, or reset it directly in Supabase Auth.

## Test live system
Walk the Final Checklist below against the deployed URL, not localhost.

# School of Discipleship — Facilitator Management System

A production web application for managing MDC and CC facilitators, grading, and audit trails.

## Structure

This is a monorepo with two independently deployable apps:

```
school-of-discipleship/
├── frontend/   # React + Vite + TS + Tailwind + shadcn/ui  → deploys to Vercel
└── backend/    # Node + Express + TS + Prisma              → deploys to Railway
```

## Roles
- **Super Admin** — full access to MDC and CC, user management, grading settings, record unlocking, audit logs
- **MDC Facilitator** — MDC access only
- **CC Facilitator** — CC access only
- Students never log in to this system

## Local Setup (Phase 1 status)

### Backend
```bash
cd backend
cp .env.example .env   # fill in Supabase + DB credentials
npm install
npm run dev             # http://localhost:4000/api/health
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

## Build Phases
1. ✅ Project scaffolding
2. ✅ Database schema (Prisma) + Supabase connection
3. ✅ Authentication (Supabase Auth + role guards)
4. ✅ Application layout (sidebar, top nav, dark mode, dashboard cards, error pages)
5. ✅ User Management (Super Admin: create/edit/deactivate/reset-password + audit logs)
6. ✅ Student Management (Excel import, CRUD, archive, search/filter/pagination, profile page)
7. Grading settings + record unlocking
8. Audit logging refinements (per-module actions)
9. Deployment (Vercel + Railway)

## Phase 6 — Student Management

Schema changes require a new migration:

```bash
cd backend
npx prisma migrate dev --name add_student_fields
```

This also re-runs cleanly with the seed script, which now additionally
creates one sample Batch + Class + Group per program (MDC, CC) — facilitated
by your Super Admin account for now, since Batch/Class/Group management UI
doesn't exist yet (a later phase). Run it if you want sample data to test
against immediately:

```bash
npx prisma db seed
```

**Access rules**: Super Admin sees all students in both programs. MDC/CC
Facilitators only see students in classes they personally facilitate — not
just their program broadly. Only Super Admin can permanently delete a
student (facilitators can Archive, which is reversible and preserves all
records).

**Excel import** expects a spreadsheet with these column headers (case
insensitive): `Full Name`, `Sex`, `Category`, `Class`, and optionally
`Group` and `Batch` (Batch is only needed if two classes share the same
name). Rows with errors are skipped individually — the import doesn't
fail the whole file over one bad row.

Student data lives under **MDC** and **CC** in the sidebar — each shows
only that program's students.

## Phase 3 — Testing authentication

You need at least one real account to test login against. Seed a Super Admin:

```bash
cd backend
npx prisma db seed
```

This creates a Super Admin in both Supabase Auth and the `users` table, using
`SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` from your `.env`
(defaults to `admin@schoolofdiscipleship.local` / `ChangeMe123!` if unset).

Then start both servers (`npm run dev` in `backend/`, `npm run dev` in
`frontend/`) and log in at `http://localhost:5173/login` with those
credentials — you should land on the Dashboard placeholder.

**Forgot password** needs one manual Supabase setting: go to your Supabase
project → Authentication → URL Configuration, and add
`http://localhost:5173/reset-password` to the Redirect URLs allow list
(the actual reset-password page is built in a later phase alongside the
Dashboard).
y
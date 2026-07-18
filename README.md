# School of Discipleship — Facilitator Management System

A production web application for managing MDC and CC facilitators: students, attendance, grading, Physical Arrangement, weekly tracking, chips, notifications, reports, and full audit accountability.

## Structure

Monorepo with two independently deployable apps:

```
school-of-discipleship/
├── frontend/   # React + Vite + TS + Tailwind + shadcn/ui  → deploys to Vercel
├── backend/    # Node + Express + TS + Prisma              → deploys to Railway
└── docs/       # User/Facilitator/Super Admin/Installation/DB/API/Backup guides, changelog
```

## Roles
- **Super Admin** — full access to MDC and CC, user management, unlocking, security, backups
- **MDC Facilitator** / **CC Facilitator** — scoped to their own assigned classes only
- Students never log in

## Local Setup

### Backend
```bash
cd backend
cp .env.example .env   # DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm install
npx prisma migrate dev
npx prisma db seed      # creates the first Super Admin (prints credentials)
npm run dev             # http://localhost:4000/api/health
```

### Frontend
```bash
cd frontend
cp .env.example .env   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm install
npm run dev              # http://localhost:5173
```

Also add `http://localhost:5173/reset-password` to Supabase → Authentication → URL Configuration → Redirect URLs (needed for the forgot-password flow).

## API routes
`/auth` `/users` `/audit-logs` `/students` `/academic` `/weeks` `/attendance` `/activities` `/pa` `/chips` `/notifications` `/announcements` `/dashboard` `/reports` `/security` — full detail in `docs/api-documentation.md`.

## Documentation
See `docs/`: User Manual, Facilitator Guide, Super Admin Guide, Installation Guide, Database Documentation, API Documentation, Backup & Recovery Guide, Change Log, Deployment Guide.

## Build Phases
1. ✅ Project scaffolding
2. ✅ Database schema + Supabase connection
3. ✅ Authentication (Supabase Auth, JWKS verification, role guards)
4. ✅ Application layout (sidebar, top nav, dark mode, error pages)
5. ✅ User Management
6. ✅ Student Management (Excel import, CRUD, archive)
7. ✅ Week Manager
8. ✅ Attendance Module
9. ✅ Activity Module (Quiz/Assignment/Performance/Recitation)
10. ✅ Physical Arrangement Module (per-group rubric grading)
11. ✅ Notifications & Announcements
12. ✅ Dashboard & Analytics
13. ✅ Reports & Exporting (CSV/Excel/PDF)
14. ✅ Chips module + inactivity notifications
15. ✅ Security (login history, password change, session timeout, unlock logs, backup export)
16. ✅ Optimization (code-splitting, error boundary)
17. ✅ Deployment & documentation

## Deploying
See `docs/deployment-guide.md` — frontend to Vercel, backend to Railway, database on Supabase.

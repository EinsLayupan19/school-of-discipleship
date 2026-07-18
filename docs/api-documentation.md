# API Documentation

Base URL: `{VITE_API_BASE_URL}` (e.g. `http://localhost:4000/api`). All routes except `/health` require `Authorization: Bearer <supabase-access-token>`.

| Base path | Purpose | Access |
|---|---|---|
| `/health` | Liveness check | Public |
| `/auth` | `/me`, `/login-event`, `/change-password` | Any logged-in user |
| `/users` | Facilitator/admin account CRUD | Super Admin |
| `/audit-logs` | Audit trail | Super Admin |
| `/students` | Student CRUD, Excel import, archive | Super Admin + facilitators (own classes) |
| `/academic` | Read-only Batches/Classes/Groups | Super Admin + facilitators |
| `/weeks` | Weekly checklist, lock/unlock | Super Admin + facilitators (own batches) |
| `/attendance` | Sessions, records, dashboard, lock/unlock | Super Admin + facilitators (own classes) |
| `/activities` | Quiz/Assignment/Performance/Recitation scoring | Super Admin + facilitators (own classes) |
| `/pa` | Physical Arrangement rubric scoring | Super Admin + facilitators (own classes) |
| `/chips` | Group chip awards/deductions | Super Admin + facilitators (own classes) |
| `/notifications` | Persisted notifications + computed reminders | Any logged-in user |
| `/announcements` | Dashboard announcements | Any logged-in user (post + read) |
| `/dashboard` | Analytics aggregation | Super Admin + facilitators |
| `/reports` | CSV/Excel/PDF exports, printable attendance sheet | Super Admin + facilitators (own classes) |
| `/security` | Unlock logs, JSON backup | Super Admin |

Every list endpoint returns `{ success, data, meta: { page, pageSize, total, totalPages } }`. Every mutation writes to `AuditLog`; locking actions additionally write to `UnlockLog` on unlock.

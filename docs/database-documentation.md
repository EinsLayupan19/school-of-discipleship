# Database Documentation

Full schema: `backend/src/prisma/schema.prisma` (21 models). Key structure:

## Core hierarchy
`Batch` → `Class` → `Group` → `Student` (normalized; Student doesn't duplicate batch, it's derived through Class → Batch).

## Users & access
`User` (role: SUPER_ADMIN / MDC_FACILITATOR / CC_FACILITATOR) — students never log in and have no User row.

## Record-keeping (all follow the same lock pattern: `isLocked`, unlockable by Super Admin only, logged to `UnlockLog` + `AuditLog`)
- `Attendance` / `AttendanceRecord` — Sunday sessions, per-student status
- `Week` — per-batch weekly checklist
- `Activity` / `ActivityScore` — Quiz/Assignment/Performance/Recitation, per-student
- `PAActivity` / `PAScore` — Physical Arrangement, per-group rubric scoring
- `GroupChip` — append-only award/deduct log (never a running total column)

## Accountability
- `AuditLog` — every important action, system-wide
- `UnlockLog` — every unlock specifically, with required reason
- `Notification` — per-user (unlocks); reminders (drop warnings, upcoming sessions, pending drafts) are computed on read, not stored
- `Announcement` — dashboard posts

## Running migrations
```
npx prisma migrate dev --name <description>   # dev
npx prisma migrate deploy                       # production
```

# Super Admin Guide

You have full access across MDC and CC.

## User management
Users → New user (generates a one-time temp password, shown once — relay it to the facilitator). Deactivate bans the account in Supabase Auth too (they genuinely can't log in). Reset password generates a new one-time temp password.

## Unlocking records
Any locked Week / Attendance / Activity / PA session shows an Unlock button to you specifically. You must give a reason — it's saved to both the Unlock Logs (Security page) and the general Audit Logs.

## Security page
- **Unlock Request Logs** — every unlock, who did it, and why.
- **User Permissions** — quick reference table of what each role can do.
- **Backup** — downloads a JSON export of all core data. This is export-only; restoring is intentionally not exposed here (see Backup & Recovery Guide) — use Supabase's point-in-time recovery instead.

## Audit Logs
Filterable by entity type. Every create/edit/delete/lock/unlock across the whole system lands here with actor, timestamp, and (where relevant) a before/after diff.

## Announcements
Dashboard → Post — visible to everyone on their Dashboard.

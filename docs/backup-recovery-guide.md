# Backup & Recovery Guide

## Automatic backups
Supabase provides automatic daily backups (and point-in-time recovery on paid plans) at the infrastructure level — this is your primary safety net and requires no action from the app.

## Manual export (Super Admin)
Security page → Download backup. Produces a timestamped JSON file of all core tables (users, batches, classes, groups, students, attendance, activities, PA, chips, demerits, weeks, announcements). Use this for offline record-keeping or manual inspection — not as a restore mechanism.

## Why there's no "Restore" button
Blindly re-importing a JSON snapshot risks breaking foreign-key relationships, unique constraints, and cascading deletes — silently corrupting data is worse than no restore feature at all. For an actual restore:
1. Go to Supabase → Database → Backups.
2. Restore to a point in time before the incident.
3. This restores the whole database consistently, including everything the JSON export can't (relations, indexes, sequences).

## Before risky operations
Take a manual JSON export first if you're about to do something destructive (bulk delete, mass unlock, etc.) so you have an offline reference even though it's not directly restorable.

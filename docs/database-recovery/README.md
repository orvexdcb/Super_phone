# SUPER PHONE — Database recovery baseline

Captured: 2026-11-24
Supabase project: `Super_phone`
Project ref: `eqlenftagozvjezswbaf`
Region: `ap-northeast-1`
PostgreSQL: `17.12.0.000`
Supabase organization plan at capture: `Free`

## Purpose
This folder is a version-controlled, repeatable baseline for reviewing the production database before schema changes and for preparing a tested recovery plan.

## What has been verified
- 14 tables in `public`; RLS is enabled on all 14.
- 18 foreign-key relationships; all are validated.
- Read-only orphan checks on all 18 relationships returned zero rows.
- 12 distinct triggers (17 trigger-event rows) and 9 public routines were present at capture.
- Storage bucket `listing-images`: public, 5 MiB limit, JPEG/PNG/WebP.
- 14 migrations were recorded in Supabase; latest recorded version: `20261124155337`.
- Health advisor returned no findings.
- Security advisor reported leaked-password protection disabled.
- Performance advisor reported 16 unused-index notices. No indexes were removed.
- Current row-count snapshot: `auth.users = 1`, `storage.objects = 0`, `storage.buckets = 1`, migration records = 14. Counts are a point-in-time snapshot and may change.

## Files
- `01-schema-inventory.sql`: read-only catalog export query for tables, columns, keys, policies, triggers, routines, enums, indexes and storage bucket settings.
- `02-integrity-checks.sql`: repeatable read-only orphan checks for all captured FK relationships.
- `backup-database.ps1`: local PowerShell export script for roles, schema and data; it writes outside the repository and uses the current Supabase CLI v4 `--remote=<connection-string>` syntax.
- `03-auth-storage-recovery-checklist.md`: Auth/provider and Storage recovery checklist.

## Backup status and plan
This folder is a schema/security baseline, **not a complete database backup**.
- The organization is currently on the Supabase Free plan. Supabase documentation states that daily managed backups are automatically provided for Pro, Team and Enterprise projects; Free projects should regularly export data using the Supabase CLI `db dump` workflow and keep off-site copies. No downloadable daily backup or PITR restore point has been verified for this project.
- The available Supabase connector does not expose a database dump download or a bulk Storage-object export operation. No dump files have been generated in this repository or verified in a secure backup destination.
- Supabase's supported CLI workflow requires the project database connection string/password and local Supabase CLI + Docker. It exports roles, schema and data separately. Credentials must be entered locally and must never be committed to Git.
- The Supabase documentation is not fully consistent on Auth dump coverage: the CLI command reference says managed schemas including `auth` and `storage` are excluded, while the platform-to-self-hosted restore guide says `auth.users` is included. Because of this discrepancy, inspect the generated dump for Auth table data and perform a restore test before relying on it; do not assume `auth.users` is protected by these files. Storage object bytes must be copied separately; at this snapshot there are zero rows in `storage.objects`, so there are currently no object bytes to copy, but re-check before every backup. Auth provider settings and secrets always require separate secure configuration.
- Current Auth count is one user. Because Supabase's own documentation differs on whether `auth.users` is included in this dump workflow, verify the resulting `data.sql` and a test restore before treating user records as backed up. Project-level Auth/provider settings, OAuth secrets, SMTP settings, JWT/API secrets and redirect configuration require separate handling.
- No full database dump, Storage archive, or restore test has been completed yet.

## Required completion steps
1. On Windows, install Supabase CLI and Docker; use `backup-database.ps1` for the documented CLI dump workflow. On Android, `backup-public-schema-termux.sh` can export only `public` as a partial fallback; it does not replace the complete CLI backup.
2. Use the Supabase Dashboard Connect panel to obtain the session-pooler host, port, username and database name. Enter the database password locally; do not paste it into chat, GitHub, or this README.
3. Verify each generated file is non-empty and store backups in a private, encrypted/off-site location. Never upload database dumps to this public repository.
4. Re-check `storage.objects`. If objects exist, export their bytes separately using a supported Supabase Storage method and preserve paths/metadata.
5. Verify Auth user coverage rather than assuming it: current Supabase documentation differs on whether `auth.users` is included in the CLI dump. Record Auth settings and external provider configuration without exporting secrets into Git.
6. Restore the export into a separate test project. Verify table counts, Auth user count, FK integrity, RLS, triggers, Storage reads, and application sign-in/listing/order workflows before any cutover.
7. Only after a successful full restore test and explicit approval, prepare a final data synchronization and cutover plan.

## Safety rules
- Do not run destructive DDL or data changes on production for testing.
- Do not delete indexes based only on the unused-index advisor snapshot.
- Never commit service-role keys, database passwords, JWT secrets, access tokens, or production environment files.
- Do not point load tests at production. A Vercel Preview deployment may still use production Supabase credentials unless explicitly configured otherwise.
- Do not create a paid Supabase branch/project or enable paid PITR without explaining the quoted cost and obtaining explicit approval.
- Any database cutover must be preceded by a tested restore and a final data synchronization plan.

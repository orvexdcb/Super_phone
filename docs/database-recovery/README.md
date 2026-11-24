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

## Backup status and plan
This folder is a schema/security baseline, **not a complete database backup**.
- The organization is currently on the Supabase Free plan. Supabase documentation states that daily managed backups are automatically provided for Pro, Team and Enterprise projects; Free projects should regularly export data using the Supabase CLI `db dump` workflow and keep off-site copies. No downloadable daily backup or PITR restore point has been verified for this project.
- The available Supabase connector does not expose a database dump download or a bulk Storage-object export operation. No dump files have been generated in this repository or verified in a secure backup destination.
- Supabase's supported CLI workflow requires the project database connection string/password and local Supabase CLI + Docker. It exports roles, schema and data separately. Credentials must be entered locally and must never be committed to Git.
- Database dumps include database data such as `auth.users`, but Storage object bytes are not included. Storage files must be copied separately. At this snapshot there are zero rows in `storage.objects`, so there are currently no Storage objects to copy; re-check before every backup.
- Current Auth count is one user. The Auth database rows are part of the database dump, but project-level Auth/provider settings, OAuth secrets, SMTP settings, JWT/API secrets and redirect configuration must be documented separately and restored/configured securely.
- No full database dump, Storage archive, or restore test has been completed yet.

## Required completion steps
1. On a trusted local machine, install Supabase CLI and Docker; create a secure private backup directory outside this repository.
2. Use the Supabase Dashboard Connect panel to obtain the session-pooler connection string. Enter the database password locally; do not paste it into chat, GitHub, or this README.
3. Run the official `supabase db dump` commands to export roles, schema and data to separate files. Verify the files exist, are non-empty, and are stored securely off-site.
4. Re-check `storage.objects`. If objects exist, export their bytes separately using Supabase Storage CLI or an S3-compatible client and preserve paths/metadata.
5. Record Auth settings and external provider configuration without exporting secrets into Git.
6. Restore the dump and Storage objects into a separate test project. Verify table counts, Auth user count, FK integrity, RLS, triggers, Storage reads, and application sign-in/listing/order workflows before any cutover.
7. Only after a successful restore test and explicit approval, prepare a final data synchronization and cutover plan.

## Safety rules
- Do not run destructive DDL or data changes on production for testing.
- Do not delete indexes based only on the unused-index advisor snapshot.
- Never commit service-role keys, database passwords, JWT secrets, access tokens, or production environment files.
- Do not point load tests at production. A Vercel Preview deployment may still use production Supabase credentials unless explicitly configured otherwise.
- Do not create a paid Supabase branch/project or enable paid PITR without explaining the quoted cost and obtaining explicit approval.
- Any database cutover must be preceded by a tested restore and a final data synchronization plan.

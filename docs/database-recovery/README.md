# SUPER PHONE — Database recovery baseline

Captured: 2026-11-24
Supabase project: `Super_phone`
Project ref: `eqlenftagozvjezswbaf`
Region: `ap-northeast-1`
PostgreSQL: `17.12.0.000`

## Purpose
This folder is a version-controlled, repeatable baseline for reviewing the production database before schema changes and for preparing a tested recovery plan.

## What has been verified
- 14 tables in `public`; RLS is enabled on all 14.
- 18 foreign-key relationships; all are validated.
- Read-only orphan checks on all 18 relationships returned zero rows.
- 17 triggers and 9 public routines were present at capture.
- Storage bucket `listing-images`: public, 5 MiB limit, JPEG/PNG/WebP.
- 14 migrations were recorded in Supabase; latest recorded version: `20261124155337`.
- Health advisor returned no findings.
- Security advisor reported leaked-password protection disabled.
- Performance advisor reported 16 unused-index notices. No indexes were removed.

## Files
- `01-schema-inventory.sql`: read-only catalog export query for tables, columns, keys, policies, triggers, routines, enums, indexes and storage bucket settings.
- `02-integrity-checks.sql`: repeatable read-only orphan checks for all captured FK relationships.

## Important limitations
This is a schema/security baseline, **not a complete database backup**. It does not contain customer rows, Auth identities, password hashes, Storage object bytes, project secrets, OAuth/provider settings, SMTP settings, or all dashboard-level Auth configuration.

A complete recovery strategy still requires:
1. Enable/verify Supabase managed backups and point-in-time recovery (PITR) appropriate to the plan.
2. Export a provider-supported database dump, including data, roles/grants and schema, and store it in a secure private backup location.
3. Separately back up Storage object contents and verify object metadata/paths.
4. Record Auth settings and external provider configuration without exporting secrets into Git.
5. Restore the dump and Storage objects into a separate Supabase project/branch, then run the integrity checks and application smoke tests before any cutover.

## Safety rules
- Do not run destructive DDL or data changes on production for testing.
- Do not delete indexes based only on the unused-index advisor snapshot.
- Never commit service-role keys, database passwords, JWT secrets, access tokens, or production environment files.
- Do not point load tests at production. A Vercel Preview deployment may still use production Supabase credentials unless explicitly configured otherwise.
- Any database cutover must be preceded by a tested restore and a final data synchronization plan.

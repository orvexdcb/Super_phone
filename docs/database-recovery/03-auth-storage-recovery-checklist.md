# SUPER PHONE — Auth and Storage recovery checklist

Project ref: `eqlenftagozvjezswbaf`
Last verified snapshot: 2026-11-24

## Current observed state
- Supabase organization plan: Free.
- Auth user count: 1 at the snapshot. This is a count only, not an export of credentials.
- Storage buckets: 1.
- Storage objects: 0 at the snapshot. Re-check immediately before every backup; do not assume this remains true.
- Bucket observed earlier: `listing-images`, public, 5 MiB file limit, JPEG/PNG/WebP.

## Authentication configuration to document securely
Open Supabase Dashboard > Authentication and record the following in a private password manager or encrypted operations document (not in this Git repository):
- Enabled sign-in methods (email, phone, OAuth providers).
- Email confirmation and password recovery settings.
- Phone OTP settings and SMS provider configuration, if enabled.
- Site URL and all redirect/allow-list URLs.
- Session lifetime, refresh-token and security settings.
- CAPTCHA settings and provider configuration, if enabled.
- SMTP sender details and delivery provider configuration.
- Any custom Auth hooks, templates, and webhook destinations.
- Any OAuth client IDs and provider console redirect URIs.

Never place passwords, SMTP credentials, OAuth client secrets, JWT signing secrets, service-role keys, access tokens, or recovery codes in GitHub, issue trackers, chat, or this checklist.

The database dump includes database-managed Auth records such as `auth.users` and identities. It does not make project-level provider secrets or dashboard settings portable by itself. After restoring to another project, users may need to sign in again because project JWT signing configuration differs.

## Storage backup procedure
1. Re-run the read-only count:
   `select bucket_id, count(*) from storage.objects group by bucket_id order by bucket_id;`
2. Confirm every bucket and its visibility, size limit, MIME restrictions and policies.
3. If object count is zero, record the timestamp and result; there are no file bytes to export at that moment.
4. If objects exist, use Supabase CLI `supabase storage ls` to enumerate paths and `supabase storage cp` to copy object bytes to a local backup folder, or use a verified S3-compatible bulk export. Follow the current CLI reference for the exact copy flags and path syntax.
5. Preserve each bucket name and object path exactly. Save a manifest with bucket, path, byte size, MIME type, last modified time and a SHA-256 checksum where available.
6. Compare exported file count and total bytes with the source listing. Investigate any mismatch before calling it a valid backup.
7. Keep Storage object bytes outside GitHub in encrypted/off-site storage. The database dump contains object metadata but not the actual file bytes.
8. During restore, recreate bucket settings and policies, upload objects to their original paths, then verify representative downloads and public/private access behavior.

## Completion gate
Do not mark the project backup as complete until all are true:
- Roles, schema and data dump files exist, are non-empty and have been securely stored.
- Auth user and identity counts in the dump match the source snapshot.
- Every Storage bucket has been inventoried and all objects (if any) have been exported and checksummed.
- Auth/provider configuration has been recorded securely without secrets in Git.
- A separate target environment has been restored successfully.
- Table counts, foreign-key integrity, RLS, triggers, sign-in, listing images, listing creation and order workflows have been tested.
- The restore test did not write to or interrupt production.

## Current status
This checklist is preparation only. No database dump has been produced by the connector, no Storage archive has been exported, and no restore test has been run. Do not use this document as proof of a completed backup.

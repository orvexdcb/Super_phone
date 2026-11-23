# Floorplan scan workflow

The Founder Architecture Center uses the upstream Floorplan scanner in a GitHub Actions runner.

## Run

- Workflow: `.github/workflows/floorplan-scan.yml`
- Branch: `feature/founder-architecture-center`
- Pinned upstream revision: `94f81b463b7617e06d873ac71323ce71644c8399`
- Output artifact: `super-phone-floorplan-scan` (7-day retention)

The workflow scans the checked-out repository without invoking an AI provider and validates the scanner's JSON summary against the generated `floorplan/.cache/scan.json` file before uploading either artifact.

## Boundaries

This scan is static repository analysis only. It does not connect to Supabase, read production records, access deployment secrets, modify database schema, or deploy the application. The local Floorplan map server is not exposed on Vercel.

The generated scan is an input for a later architecture-map build; it is not itself the finished interactive map.

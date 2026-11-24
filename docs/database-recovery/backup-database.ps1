# SUPER PHONE — Local Supabase backup (PowerShell)
# This script writes backups under %USERPROFILE%\SUPER_PHONE_Backups, not into this Git repository.
# It does not print or save the database connection string.

$ErrorActionPreference = "Stop"

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    throw "Supabase CLI is not installed. Install it first, then reopen PowerShell."
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is not installed or not available in PATH. Start Docker Desktop and retry."
}
if ([string]::IsNullOrWhiteSpace($env:SUPERPHONE_DB_URL)) {
    throw "Set SUPERPHONE_DB_URL in this PowerShell session to the Session Pooler connection string from Supabase Dashboard > Connect."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $env:USERPROFILE "SUPER_PHONE_Backups"
$backupDir = Join-Path $backupRoot $timestamp
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

function Invoke-Dump {
    param([string[]]$Arguments)
    & supabase @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Supabase CLI dump failed (exit code $LASTEXITCODE). Keep any partial files for diagnosis, and do not treat this run as a valid backup."
    }
}

Write-Host "Exporting database roles..."
Invoke-Dump @("db", "dump", ("--remote=" + $env:SUPERPHONE_DB_URL), "-f", (Join-Path $backupDir "roles.sql"), "--role-only")

Write-Host "Exporting database schema..."
Invoke-Dump @("db", "dump", ("--remote=" + $env:SUPERPHONE_DB_URL), "-f", (Join-Path $backupDir "schema.sql"))

Write-Host "Exporting database data..."
Invoke-Dump @("db", "dump", ("--remote=" + $env:SUPERPHONE_DB_URL), "-f", (Join-Path $backupDir "data.sql"), "--use-copy", "--data-only", "-x", "storage.buckets_vectors", "-x", "storage.vector_indexes")

$files = @("roles.sql", "schema.sql", "data.sql") | ForEach-Object {
    $path = Join-Path $backupDir $_
    if (-not (Test-Path $path) -or (Get-Item $path).Length -le 0) {
        throw "Backup validation failed: $_ is missing or empty."
    }
    [PSCustomObject]@{ File = $_; Bytes = (Get-Item $path).Length }
}

$manifest = [PSCustomObject]@{
    Project = "Super_phone"
    ProjectRef = "eqlenftagozvjezswbaf"
    CreatedAtLocal = (Get-Date).ToString("o")
    PostgreSQL = "17"
    Files = $files
    Note = "Database dump only. Storage object bytes, project secrets, and dashboard Auth provider settings are handled separately."
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 (Join-Path $backupDir "manifest.json")

Write-Host ""
Write-Host "Database export files created and checked:"
$files | Format-Table -AutoSize
Write-Host "Backup folder: $backupDir"
Write-Warning "This is not a complete project backup until Storage objects and project-level Auth/provider settings are handled and a restore test succeeds."

#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Run after a new version of the Budget Tracker backend is on the server (deploy.ps1 calls it).

.DESCRIPTION
    1. Applies new database migrations.
    2. Creates public\storage (the link that serves uploaded account screenshots) if it's missing.
    3. Caches config, routes, views and events (php artisan optimize), so Laravel doesn't
       re-read them on every request.
    4. Checks the scheduler task exists (database backups, login-token cleanup).
    5. Warns if .env still has development settings.
    6. Checks that OPcache is on in the PHP that Apache uses (often 2-3x faster when on).

    After editing .env on the server, run this script again: the cached config doesn't see .env changes.

.PARAMETER Php
    Full path to php.exe. Defaults to the `php` on PATH, else the newest Laragon PHP with a php.ini.

.EXAMPLE
    # In PowerShell opened with "Run as administrator", from the backend folder:
    powershell -ExecutionPolicy Bypass -File deploy\windows\after-deploy.ps1
#>
param([string]$Php)

if (-not $Php) { $Php = (Get-Command php.exe -ErrorAction SilentlyContinue).Source }
if (-not $Php) {
    $Php = (Get-ChildItem 'C:\laragon\bin\php\php-*\php.exe' -ErrorAction SilentlyContinue |
            Where-Object { Test-Path (Join-Path $_.DirectoryName 'php.ini') } |
            Sort-Object FullName -Descending | Select-Object -First 1).FullName
}
if (-not $Php -or -not (Test-Path $Php)) { throw "php.exe not found. Pass it with -Php." }

$ErrorActionPreference = 'Stop'
$Backend = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Write-Host "Backend: $Backend"
Write-Host "PHP:     $Php"

function Invoke-Artisan([string[]]$ArtisanArgs) {
    Write-Host "`n> php artisan $($ArtisanArgs -join ' ')" -ForegroundColor Cyan
    & $Php artisan @ArtisanArgs
    if ($LASTEXITCODE -ne 0) { throw "php artisan $($ArtisanArgs -join ' ') failed." }
}

Push-Location $Backend
try {
    Invoke-Artisan @('migrate', '--force')

    # Uploaded screenshots are served through public\storage. It isn't in git, so a fresh
    # checkout (or a copied folder) won't have it and the images show as broken.
    if (-not (Test-Path (Join-Path $Backend 'public\storage'))) {
        Invoke-Artisan @('storage:link')
    } else {
        Write-Host "`npublic\storage link: already there."
    }

    Invoke-Artisan @('optimize')
} finally { Pop-Location }

# -- Scheduler: database backups (db:export) and expired login-token cleanup ---------
if (-not (Get-ScheduledTask 'Budget Scheduler' -ErrorAction SilentlyContinue)) {
    Write-Warning "No 'Budget Scheduler' task, so automatic database backups don't run. Run deploy\windows\install-background-tasks.ps1 once."
}

# -- .env: production settings -------------------------------------------------------
$envFile = Join-Path $Backend '.env'
if (Test-Path $envFile) {
    $envText = Get-Content $envFile -Raw
    if ($envText -match '(?m)^\s*APP_DEBUG\s*=\s*"?true') {
        Write-Warning "APP_DEBUG=true in .env: errors show code and settings to anyone. Set APP_DEBUG=false, then run this script again."
    }
    if ($envText -notmatch '(?m)^\s*APP_ENV\s*=\s*"?production') {
        Write-Warning "APP_ENV isn't 'production' in .env. Set APP_ENV=production, then run this script again."
    }
}

# -- OPcache: in the php.ini that Laragon's Apache also uses --------------------------
$ini = Join-Path (Split-Path $Php) 'php.ini'
if (Test-Path $ini) {
    $text = Get-Content $ini -Raw
    $loaded  = $text -match '(?m)^\s*zend_extension\s*=\s*"?(php_)?opcache'
    $enabled = $text -notmatch '(?m)^\s*opcache\.enable\s*=\s*(0|off|false)'
    if ($loaded -and $enabled) {
        Write-Host "`nOK: OPcache is on in $ini." -ForegroundColor Green
    } else {
        Write-Warning @"
OPcache is off in $ini. Turning it on usually makes every page 2-3x faster:
  1. Open $ini
  2. Make sure these lines exist without a ';' in front:
       zend_extension=opcache
       opcache.enable=1
       opcache.memory_consumption=128
       opcache.max_accelerated_files=20000
  3. Restart Apache from Laragon (Stop, then Start All).
"@
    }
} else {
    Write-Warning "Couldn't find $ini to check OPcache."
}

Write-Host "`nDone." -ForegroundColor Green

#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Deploys the latest Budget Tracker code on the server in one step.

.DESCRIPTION
    Run from the repo folder (e.g. C:\laragon\www\Budget) in PowerShell opened "as administrator":

        powershell -ExecutionPolicy Bypass -File .\deploy.ps1

    It stops at the first error. Steps:
      1. git pull (refuses if files were edited on the server: fix on your PC and push instead).
      2. composer install, only if composer.json/.lock changed (or vendor\ is missing);
         otherwise composer dump-autoload if backend PHP files changed.
      3. npm ci, only if package.json/package-lock.json changed (or node_modules\ is missing).
      4. npm run build, only if something under frontend\ changed. The build copies itself
         into backend\public (frontend\deploy-to-laravel.mjs).
      5. backend\deploy\windows\after-deploy.ps1: migrations, storage link, Laravel caches,
         scheduler and OPcache checks.

    Tests are not run here: the server installs without dev packages (no PHPUnit).
    Run them on your PC before you push (php artisan test, npm test).

.PARAMETER Php
    php.exe to use. By default the first PHP (on PATH, then Laragon's) that has the extensions
    Laravel needs, so a PHP without mbstring is skipped.

.PARAMETER SkipPull
    Deploy what is already in the folder (e.g. after fixing a failed step).

.PARAMETER Full
    Install dependencies and build the frontend even if nothing changed.
#>
param(
    [string]$Php,
    [switch]$SkipPull,
    [switch]$Full
)

$ErrorActionPreference = 'Stop'
$Root     = $PSScriptRoot
$Backend  = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'

function Step([string]$Text) { Write-Host "`n=== $Text ===" -ForegroundColor Cyan }

# Runs an external command and stops the deploy if it fails.
function Run([string]$Exe, [string[]]$Arguments, [string]$Where) {
    Write-Host "> $Exe $($Arguments -join ' ')" -ForegroundColor DarkGray
    Push-Location $Where
    try {
        & $Exe @Arguments
        if ($LASTEXITCODE -ne 0) { throw "Failed: $Exe $($Arguments -join ' ') (exit code $LASTEXITCODE). Nothing after this step was run." }
    } finally { Pop-Location }
}

# -- PHP: the first one that can run Laravel -------------------------------------
function Test-Php([string]$Path) {
    if (-not $Path -or -not (Test-Path $Path)) { return $false }
    $missing = & $Path -r "echo implode(',', array_filter(['mbstring','openssl','pdo_mysql','fileinfo'], fn (`$e) => !extension_loaded(`$e)));" 2>$null
    return ($LASTEXITCODE -eq 0 -and -not $missing)
}
if (-not $Php) {
    $candidates = @((Get-Command php.exe -ErrorAction SilentlyContinue).Source) +
        @(Get-ChildItem 'C:\laragon\bin\php\php-*\php.exe' -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | ForEach-Object FullName)
    $Php = $candidates | Where-Object { Test-Php $_ } | Select-Object -First 1
}
if (-not (Test-Php $Php)) { throw "No PHP with mbstring, openssl, pdo_mysql and fileinfo found. Pass one with -Php." }

foreach ($dir in @($Backend, $Frontend)) {
    if (-not (Test-Path $dir)) { throw "$dir not found. Put deploy.ps1 in the repo folder (next to backend and frontend)." }
}
Write-Host "Repo: $Root"
Write-Host "PHP:  $Php"

# -- 1. git pull --------------------------------------------------------------------
# Compare against the commit this script last deployed (not just what this pull fetched),
# so a manual `git pull` beforehand can't make it skip a needed build or install.
$deployedFile = Join-Path $Root '.deployed-commit'
$head = (git -C $Root rev-parse HEAD).Trim()
$before = $head
if (Test-Path $deployedFile) {
    $recorded = (Get-Content $deployedFile -Raw).Trim()
    git -C $Root cat-file -e "$recorded^{commit}" 2>$null
    if ($LASTEXITCODE -eq 0) { $before = $recorded }
} elseif (-not $Full) {
    Write-Host "No record of a previous deploy: installing and building everything this time." -ForegroundColor Yellow
    $Full = $true
}
if (-not $SkipPull) {
    Step 'Getting the latest code'
    $local = git -C $Root status --porcelain --untracked-files=no
    if ($local) {
        Write-Host $local
        throw "Files were changed on the server (listed above). Fix them on your PC and push, then on the server run: git checkout -- . (this discards the server's edits)"
    }
    Run 'git' @('pull', '--ff-only') $Root
}
$after = (git -C $Root rev-parse HEAD).Trim()

if ($before -eq $after -and -not $Full) {
    Write-Host 'Nothing new since the last deploy.' -ForegroundColor Yellow
}
$changed = if ($before -ne $after) { @(git -C $Root diff --name-only $before $after) } else { @() }
$changedUnder = { param([string]$Pattern) [bool]($changed | Where-Object { $_ -like $Pattern }) }
if ($changed.Count) { Write-Host "$($changed.Count) file(s) changed since the last deploy." }

# -- 2. Backend packages ---------------------------------------------------------
$needComposer = $Full -or -not (Test-Path (Join-Path $Backend 'vendor')) -or
    (& $changedUnder 'backend/composer.json') -or (& $changedUnder 'backend/composer.lock')
# The optimized class map lists every PHP file by path, so an added, renamed or deleted class
# needs it rebuilt even when no package changed.
$needAutoload = (& $changedUnder 'backend/app/*.php') -or (& $changedUnder 'backend/database/*.php')

# Runs Composer with the chosen PHP: the `composer` command would use whichever PHP is on PATH.
function Invoke-Composer([string[]]$Arguments) {
    $composer = (Get-Command composer -ErrorAction SilentlyContinue).Source
    $phar = if ($composer) { Join-Path (Split-Path $composer) 'composer.phar' }
    if ($phar -and (Test-Path $phar)) {
        Run $Php (@($phar) + $Arguments) $Backend
    } elseif ($composer) {
        Run 'composer' $Arguments $Backend
    } else {
        throw 'Composer not found. Install it (Laragon includes it) or add it to PATH.'
    }
}

if ($needComposer) {
    Step 'Installing backend packages (composer)'
    Invoke-Composer @('install', '--no-dev', '--optimize-autoloader', '--no-interaction')
} elseif ($needAutoload) {
    Step 'Rebuilding the class map (backend PHP files changed)'
    Invoke-Composer @('dump-autoload', '--optimize', '--no-dev', '--no-interaction')
} else {
    Write-Host "`nBackend packages: unchanged, skipped."
}

# -- 3 & 4. Frontend packages and build ----------------------------------------------
$needNpmCi = $Full -or -not (Test-Path (Join-Path $Frontend 'node_modules')) -or
    (& $changedUnder 'frontend/package.json') -or (& $changedUnder 'frontend/package-lock.json')
# The build also needs re-running if backend\public lost the built app (it's not in git).
$needBuild = $Full -or $needNpmCi -or (& $changedUnder 'frontend/*') -or
    -not (Test-Path (Join-Path $Backend 'public\index.html'))

if ($needNpmCi) {
    Step 'Installing frontend packages (npm ci)'
    Run 'npm.cmd' @('ci', '--no-audit', '--no-fund') $Frontend
} else {
    Write-Host "Frontend packages: unchanged, skipped."
}
if ($needBuild) {
    Step 'Building the frontend (copies into backend\public)'
    Run 'npm.cmd' @('run', 'build') $Frontend
} else {
    Write-Host "Frontend build: no frontend changes, skipped."
}

# -- 5. Migrations, storage link, caches, checks ------------------------------------
Step 'Migrations, caches and checks (after-deploy.ps1)'
& (Join-Path $Backend 'deploy\windows\after-deploy.ps1') -Php $Php

# Only reached when every step succeeded, so a failed deploy is retried in full next time.
Set-Content -Path $deployedFile -Value $after -Encoding ascii

$short = $after.Substring(0, 7)
Write-Host "`nDeployed $short. Open the app and check it works." -ForegroundColor Green

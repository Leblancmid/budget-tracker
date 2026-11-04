#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Keeps Budget Tracker's scheduled jobs running on the Windows server, permanently.

.DESCRIPTION
    Registers one Windows Task Scheduler task (runs as SYSTEM, so no one needs to be logged in):

      "Budget Scheduler"  Laravel's scheduler (php artisan schedule:run) every minute. It runs the
                          database backup twice a day (db:export, keeps the 2 newest in
                          storage\app\backups) and clears expired login tokens daily.

    Budget has no queue jobs or WebSocket server, so unlike Lamoiyan there's nothing else to keep running.
    Safe to run again (e.g. after moving the folder or upgrading PHP): it replaces the task.

.PARAMETER Php
    Full path to php.exe. Defaults to the `php` on PATH (the one your terminal uses), else the
    newest Laragon PHP that has a php.ini. The script checks it can run Laravel before going on.

.EXAMPLE
    # In PowerShell opened with "Run as administrator", from the backend folder:
    powershell -ExecutionPolicy Bypass -File deploy\windows\install-background-tasks.ps1

.EXAMPLE
    # Remove what this script set up:
    Unregister-ScheduledTask 'Budget Scheduler' -Confirm:$false
#>
param([string]$Php)

# The PHP your terminal uses is the configured one. A PHP folder Laragon isn't set to often has
# no php.ini, so extensions Laravel needs (mbstring, openssl, pdo_mysql) are missing.
if (-not $Php) {
    $Php = (Get-Command php.exe -ErrorAction SilentlyContinue).Source
}
if (-not $Php) {
    $Php = (Get-ChildItem 'C:\laragon\bin\php\php-*\php.exe' -ErrorAction SilentlyContinue |
            Where-Object { Test-Path (Join-Path $_.DirectoryName 'php.ini') } |
            Sort-Object FullName -Descending | Select-Object -First 1).FullName
}

$ErrorActionPreference = 'Stop'

# The backend folder is two levels up from this script (backend\deploy\windows).
$Backend = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

if (-not $Php -or -not (Test-Path $Php)) {
    throw "php.exe not found. Pass it explicitly, e.g. -Php 'C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe'"
}
if (-not (Test-Path (Join-Path $Backend 'artisan'))) {
    throw "No artisan file in $Backend. Run this script from the Budget backend's deploy\windows folder."
}

Write-Host "Backend: $Backend"
Write-Host "PHP:     $Php"

# Make sure this PHP can actually run the app before handing it to Task Scheduler.
$missing = & $Php -r "echo implode(',', array_filter(['mbstring','openssl','pdo_mysql','fileinfo'], fn (`$e) => !extension_loaded(`$e)));"
if ($LASTEXITCODE -ne 0) { throw "$Php could not run. Pass a working PHP with -Php." }
if ($missing) {
    throw "$Php is missing PHP extensions: $missing. Use the PHP Laragon is set to, e.g. -Php 'C:\laragon\bin\php\<version>\php.exe'"
}
Push-Location $Backend
try {
    $version = & $Php artisan --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Laravel won't start with this PHP:`n$version" }
    Write-Host "Laravel: $version"
} finally { Pop-Location }

# Backups need mysqldump: check the path in .env (MYSQLDUMP_PATH) points at a real file.
$envFile = Join-Path $Backend '.env'
if (Test-Path $envFile) {
    $dumpLine = Select-String -Path $envFile -Pattern '^\s*MYSQLDUMP_PATH\s*=\s*"?([^"\r\n]+)' | Select-Object -First 1
    if (-not $dumpLine) {
        Write-Warning "MYSQLDUMP_PATH isn't set in .env, so backups rely on 'mysqldump' being on PATH. Set it to Laragon's, e.g. C:\laragon\bin\mysql\<version>\bin\mysqldump.exe"
    } elseif (-not (Test-Path $dumpLine.Matches[0].Groups[1].Value.Trim())) {
        Write-Warning "MYSQLDUMP_PATH in .env points to a file that doesn't exist: $($dumpLine.Matches[0].Groups[1].Value.Trim())"
    }
}

# Runs as SYSTEM so it works without anyone logged in.
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest

# -- Laravel scheduler: every minute ---------------------------------------------------
$scheduleAction = New-ScheduledTaskAction -Execute $Php -Argument 'artisan schedule:run' -WorkingDirectory $Backend
$everyMinute = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes 1)
$scheduleSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName 'Budget Scheduler' -Force `
    -Description 'Budget Tracker: php artisan schedule:run every minute (database backups, login-token cleanup).' `
    -Action $scheduleAction -Trigger $everyMinute -Settings $scheduleSettings -Principal $principal | Out-Null
Write-Host "Task 'Budget Scheduler' registered (runs every minute)." -ForegroundColor Green

Push-Location $Backend
try {
    Write-Host "`nScheduled jobs:"
    & $Php artisan schedule:list
} finally { Pop-Location }

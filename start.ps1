<#
.SYNOPSIS
    Start SAM - Software Asset Management
.DESCRIPTION
    Starts the SAM application in production or development mode.
    Working directory: C:\SAM
#>

[CmdletBinding()]
param(
    [switch]$Dev,
    [string]$Port = "3000"
)

$ErrorActionPreference = "Stop"

# Find SAM installation
$samDir = $null
if (Test-Path "C:\SAM\package.json") {
    $samDir = "C:\SAM"
} elseif (Test-Path "$PWD\package.json") {
    $samDir = $PWD.Path
} else {
    Write-Host "ERROR: Cannot find SAM installation." -ForegroundColor Red
    Write-Host "Expected at C:\SAM or current directory." -ForegroundColor Gray
    exit 1
}

Set-Location $samDir

Write-Host ""
Write-Host "=== Starting SAM - Software Asset Management ===" -ForegroundColor Cyan
Write-Host "Directory: $samDir" -ForegroundColor Gray
Write-Host ""

# Ensure data directory
$dataDir = Join-Path $samDir "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}
try {
    icacls $dataDir /grant "*S-1-5-11:(OI)(CI)M" /T /Q 2>$null | Out-Null
    Get-ChildItem $dataDir -Filter "sam.db*" -Force -ErrorAction SilentlyContinue | ForEach-Object {
        $_.Attributes = $_.Attributes -band (-bnot [IO.FileAttributes]::ReadOnly)
        icacls $_.FullName /grant "*S-1-5-11:M" /Q 2>$null | Out-Null
    }
} catch {
    Write-Host "WARN: Could not verify SQLite write permissions: $_" -ForegroundColor Yellow
}

# Ensure .env exists
if (-not (Test-Path ".env")) {
    Write-Host ".env not found. Running install.ps1 first..." -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File "$samDir\install.ps1" -InstallDir $samDir
}

# Normalize older relative SQLite URLs before starting. Otherwise the app can
# write to C:\SAM\prisma\data\sam.db or another fallback instead of C:\SAM\data\sam.db.
$envText = Get-Content -Path ".env" -Raw
if ($envText -match 'DATABASE_URL\s*=\s*"file:(\.\/|\.\\|data\/|data\\)') {
    $absoluteDbUrl = "file:$($samDir -replace '\\', '/')/data/sam.db"
    $envText = $envText -replace 'DATABASE_URL\s*=\s*"file:[^"]+"', "DATABASE_URL=`"$absoluteDbUrl`""
    Set-Content -Path ".env" -Value $envText -Encoding UTF8
    Write-Host "Normalized DATABASE_URL to $absoluteDbUrl" -ForegroundColor Yellow
}

# Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        exit 1
    }
}

# Check .next build (production only)
if ((-not $Dev) -and (-not (Test-Path ".next"))) {
    Write-Host "Building application..." -ForegroundColor Yellow
    if (Test-Path ".\build.cmd") {
        & cmd.exe /c ".\build.cmd"
    } else {
        & npm run build
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Build failed" -ForegroundColor Red
        exit 1
    }
}

if ($Dev) {
    Write-Host "Mode:      Development (hot-reload)" -ForegroundColor Yellow
    Write-Host "URL:       http://localhost:$Port" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    Write-Host ""
    & npx next dev -p $Port
} else {
    Write-Host "Mode:      Production" -ForegroundColor Yellow
    Write-Host "URL:       http://localhost:$Port" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    Write-Host ""
    & npm start
}

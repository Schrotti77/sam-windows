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

# Ensure .env exists
if (-not (Test-Path ".env")) {
    Write-Host ".env not found. Running install.ps1 first..." -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File "$samDir\install.ps1" -InstallDir $samDir
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
    & npm run build
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

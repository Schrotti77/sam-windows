<#
.SYNOPSIS
    Start SAM - Software Asset Management
.DESCRIPTION
    Starts the SAM application. In production mode by default.
    Use -Dev for development mode with hot-reload.
#>

[CmdletBinding()]
param(
    [switch]$Dev,
    [string]$Port = "3000"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Starting SAM - Software Asset Management ===" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Running npm install..." -ForegroundColor Yellow
    & npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        exit 1
    }
}

# Check if .next build output exists (for production)
if ((-not $Dev) -and (-not (Test-Path ".next"))) {
    Write-Host "Build output not found. Running npm run build..." -ForegroundColor Yellow
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Build failed. Run 'npm run build' manually." -ForegroundColor Red
        exit 1
    }
}

# Ensure data directory exists
$dataDir = Join-Path $PWD.Path "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

if ($Dev) {
    Write-Host "Mode: Development (hot-reload enabled)" -ForegroundColor Yellow
    Write-Host "URL:  http://localhost:$Port" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    Write-Host ""
    & npx next dev -p $Port
} else {
    Write-Host "Mode: Production" -ForegroundColor Yellow
    Write-Host "URL:  http://localhost:$Port" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    Write-Host ""
    & npx next start -p $Port
}

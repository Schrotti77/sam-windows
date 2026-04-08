<#
.SYNOPSIS
    Stop SAM - Software Asset Management
.DESCRIPTION
    Stops all Node.js processes running SAM on the specified port.
    Also handles NSSM Windows Service if configured.
#>

[CmdletBinding()]
param(
    [string]$Port = "3000"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Stopping SAM - Software Asset Management ===" -ForegroundColor Cyan
Write-Host ""

# Try to stop NSSM service first
$serviceName = "SAM"
$nssmCmd = Get-Command nssm -ErrorAction SilentlyContinue
if ($nssmCmd) {
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        Write-Host "Stopping Windows Service '$serviceName'..." -ForegroundColor Yellow
        & nssm stop $serviceName
        Write-Host "Service stopped." -ForegroundColor Green
        Write-Host ""
        exit 0
    }
}

# Find and kill Node.js processes listening on the port
Write-Host "Checking port $Port..." -ForegroundColor Yellow

$portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
    Where-Object { $_.State -eq 'Listen' }

if ($portInUse) {
    foreach ($conn in $portInUse) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Stopping process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force
            Write-Host "  Stopped." -ForegroundColor Green
        }
    }
    Write-Host ""
    Write-Host "SAM stopped successfully." -ForegroundColor Green
} else {
    Write-Host "No process found on port $Port." -ForegroundColor Gray
    Write-Host "SAM is not running." -ForegroundColor Green
}

Write-Host ""

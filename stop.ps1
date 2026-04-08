<#
.SYNOPSIS
    Stop SAM - Software Asset Management
.DESCRIPTION
    Stops all Node.js processes running SAM on the specified port.
    Also stops the NSSM Windows Service if configured.
#>

[CmdletBinding()]
param(
    [string]$Port = "3000"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Stopping SAM - Software Asset Management ===" -ForegroundColor Cyan
Write-Host ""

# Try NSSM service first
$serviceName = "SAM"
$nssmExe = "C:\Windows\nssm.exe"
if (Test-Path $nssmExe) {
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        Write-Host "Stopping Windows Service '$serviceName'..." -ForegroundColor Yellow
        & $nssmExe stop $serviceName
        Write-Host "Service stopped." -ForegroundColor Green
        Write-Host ""
        exit 0
    }
}

# Find and kill Node.js on port
$portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Where-Object { $_.State -eq 'Listen' }

if ($portInUse) {
    foreach ($conn in $portInUse) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Stopping $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force
            Write-Host "  Stopped." -ForegroundColor Green
        }
    }
    Write-Host ""
    Write-Host "SAM stopped." -ForegroundColor Green
} else {
    Write-Host "No SAM process found on port $Port." -ForegroundColor Gray
}
Write-Host ""

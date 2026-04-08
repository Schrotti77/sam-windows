<#
.SYNOPSIS
    SAM - Software Asset Management - Windows Server 2019 Installation Script
.DESCRIPTION
    Complete installation routine for SAM on Windows Server 2019.
    Installs Node.js (if needed), npm dependencies, creates SQLite database,
    seeds test data, builds the app, configures firewall, and optionally
    registers as a Windows Service via NSSM.
.NOTES
    Version: 4.5.0
    Requires: PowerShell 5.1+ (Windows Server 2019 default)
    Author: SAM Team
#>

[CmdletBinding()]
param(
    [switch]$SkipNodeCheck,
    [switch]$SkipFirewall,
    [switch]$SetupService,
    [string]$InstallDir = $null,
    [string]$Port = "3000"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  SAM v4.5 - Software Asset Management" -ForegroundColor Cyan
Write-Host "  Windows Server 2019 Installation" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ─── Determine installation directory ───────────────────────────────
if ($InstallDir) {
    $scriptDir = $InstallDir
    if (-not (Test-Path $scriptDir)) {
        New-Item -ItemType Directory -Path $scriptDir -Force | Out-Null
    }
    Set-Location $scriptDir
} else {
    $scriptDir = $PWD.Path
}

Write-Host "[INFO] Installation directory: $scriptDir" -ForegroundColor Gray
Write-Host ""

# ─── Step 1: Check PowerShell version ───────────────────────────────
Write-Host "[1/10] Checking PowerShell version..." -ForegroundColor Yellow
$psVersion = $PSVersionTable.PSVersion
if ($psVersion.Major -lt 5) {
    Write-Host "  ERROR: PowerShell 5.0+ required. Current: $($psVersion)" -ForegroundColor Red
    exit 1
}
Write-Host "  OK - PowerShell $($psVersion)" -ForegroundColor Green

# ─── Step 2: Check / Install Node.js ────────────────────────────────
Write-Host ""
Write-Host "[2/10] Checking Node.js..." -ForegroundColor Yellow
if (-not $SkipNodeCheck) {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        $nodeVersion = & node --version 2>$null
        $nodeMajor = [int]($nodeVersion -replace '^v(\d+).*', '$1')
        
        if ($nodeMajor -ge 18) {
            Write-Host "  OK - Node.js $nodeVersion" -ForegroundColor Green
        } else {
            Write-Host "  WARN - Node.js $nodeVersion found, but 18+ is recommended." -ForegroundColor Yellow
            Write-Host "  Continuing with current version. Upgrade recommended for best compatibility." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Node.js not found. Downloading Node.js 20 LTS..." -ForegroundColor Yellow
        
        # Download Node.js LTS
        $nodeUrl = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi"
        $nodeMsi = Join-Path $env:TEMP "node-installer.msi"
        
        try {
            Write-Host "  Downloading from $nodeUrl ..." -ForegroundColor Gray
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
            
            Write-Host "  Installing Node.js..." -ForegroundColor Gray
            Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /qn /norestart" -Wait -NoNewWindow
            
            # Refresh PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            
            Remove-Item $nodeMsi -Force -ErrorAction SilentlyContinue
            
            $nodeVersion = & node --version 2>$null
            Write-Host "  OK - Node.js $nodeVersion installed" -ForegroundColor Green
        } catch {
            Write-Host "  ERROR: Failed to install Node.js: $_" -ForegroundColor Red
            Write-Host "  Please install Node.js 18+ manually from https://nodejs.org" -ForegroundColor Red
            exit 1
        }
    }
    
    # Check npm
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmCmd) {
        $npmVersion = & npm --version 2>$null
        Write-Host "  OK - npm $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: npm not found even though Node.js is installed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  SKIPPED (SkipNodeCheck flag)" -ForegroundColor Gray
}

# ─── Step 3: Create data directory ──────────────────────────────────
Write-Host ""
Write-Host "[3/10] Setting up data directory..." -ForegroundColor Yellow
$dataDir = Join-Path $scriptDir "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    Write-Host "  Created: $dataDir" -ForegroundColor Gray
}
Write-Host "  OK - Data directory: $dataDir" -ForegroundColor Green

# ─── Step 4: Create .env file ──────────────────────────────────────
Write-Host ""
Write-Host "[4/10] Creating environment configuration..." -ForegroundColor Yellow

# Generate a secure NEXTAUTH_SECRET
$secretBytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($secretBytes)
$authSecret = [BitConverter]::ToString($secretBytes).Replace("-", "").ToLower()

# Resolve DATABASE_URL with absolute forward-slash path (Prisma SQLite format)
$installDirForward = $scriptDir -replace '\\', '/'
$dbPath = "$installDirForward/data/sam.db"

$envContent = @"
# SAM - Software Asset Management v4.5
# Generated by install.ps1 on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# SQLite Database - absolute path for reliable resolution
DATABASE_URL="file:$dbPath"

# NextAuth - auto-generated secure secret
NEXTAUTH_SECRET="$authSecret"

# Application URL - change if using a different port or hostname
NEXTAUTH_URL="http://localhost:$Port"
"@

$envFile = Join-Path $scriptDir ".env"
Set-Content -Path $envFile -Value $envContent -Encoding UTF8
Write-Host "  OK - .env created with secure NEXTAUTH_SECRET" -ForegroundColor Green
Write-Host "  Database path: $dbPath" -ForegroundColor Gray

# ─── Step 5: Install npm dependencies ───────────────────────────────
Write-Host ""
Write-Host "[5/10] Installing npm dependencies..." -ForegroundColor Yellow
try {
    & npm install --legacy-peer-deps 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  OK - Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: npm install failed: $_" -ForegroundColor Red
    exit 1
}

# Run React cache patch explicitly (Windows compatibility)
Write-Host "  Patching React for Next.js compatibility..." -ForegroundColor Gray
& node scripts/patch-react.js 2>&1 | Out-Null

# ─── Step 6: Generate Prisma client ─────────────────────────────────
Write-Host ""
Write-Host "[6/10] Generating Prisma client..." -ForegroundColor Yellow
try {
    & npx prisma generate 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Prisma generate failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  OK - Prisma client generated" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Prisma generate failed: $_" -ForegroundColor Red
    exit 1
}

# ─── Step 7: Create SQLite database ────────────────────────────────
Write-Host ""
Write-Host "[7/10] Creating SQLite database..." -ForegroundColor Yellow
try {
    & npx prisma db push 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Database creation failed" -ForegroundColor Red
        exit 1
    }
    
    # Set permissions on database files
    $dbFile = Join-Path $dataDir "sam.db"
    if (Test-Path $dbFile) {
        icacls $dbFile /grant "Everyone:(OI)(CI)F" /T /Q 2>$null
    }
    
    Write-Host "  OK - Database created and permissions set" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Database creation failed: $_" -ForegroundColor Red
    exit 1
}

# ─── Step 8: Seed database ─────────────────────────────────────────
Write-Host ""
Write-Host "[8/10] Seeding database with test data..." -ForegroundColor Yellow
if (Test-Path "scripts/seed.js") {
    try {
        & node scripts/seed.js 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  WARN - Seeding had issues, but continuing..." -ForegroundColor Yellow
        } else {
            Write-Host "  OK - Database seeded with test data" -ForegroundColor Green
            Write-Host "  Default login: john@doe.com / johndoe123" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "  WARN - Seeding failed: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  SKIP - scripts/seed.js not found" -ForegroundColor Gray
}

# ─── Step 9: Build application ─────────────────────────────────────
Write-Host ""
Write-Host "[9/10] Building application..." -ForegroundColor Yellow
try {
    & npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Build failed" -ForegroundColor Red
        Write-Host "  Run 'npm run build' manually to see error details." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  OK - Build complete" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Build failed: $_" -ForegroundColor Red
    exit 1
}

# ─── Step 10: Firewall rule ────────────────────────────────────────
Write-Host ""
Write-Host "[10/10] Configuring Windows Firewall..." -ForegroundColor Yellow
if (-not $SkipFirewall) {
    try {
        $ruleName = "SAM - Software Asset Management (Port $Port)"
        # Remove existing rule if present
        Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        # Add new rule
        New-NetFirewallRule -DisplayName $ruleName `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort $Port `
            -Action Allow `
            -Profile Domain,Private `
            -Description "Allow HTTP access to SAM on port $Port" | Out-Null
        Write-Host "  OK - Firewall rule created for port $Port" -ForegroundColor Green
    } catch {
        Write-Host "  WARN - Could not set firewall rule: $_" -ForegroundColor Yellow
        Write-Host "  Set it manually: New-NetFirewallRule -DisplayName 'SAM' -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow" -ForegroundColor Gray
    }
} else {
    Write-Host "  SKIPPED (SkipFirewall flag)" -ForegroundColor Gray
}

# ─── Optional: Windows Service via NSSM ────────────────────────────
if ($SetupService) {
    Write-Host ""
    Write-Host "[OPTIONAL] Setting up Windows Service via NSSM..." -ForegroundColor Yellow
    
    $nssmCmd = Get-Command nssm -ErrorAction SilentlyContinue
    if (-not $nssmCmd) {
        Write-Host "  NSSM not found. Downloading NSSM..." -ForegroundColor Gray
        
        $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
        $nssmZip = Join-Path $env:TEMP "nssm.zip"
        $nssmDir = Join-Path $env:ProgramFiles "NSSM"
        
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip -UseBasicParsing
            
            Expand-Archive -Path $nssmZip -DestinationPath $nssmDir -Force
            
            # Find the win64 binary
            $nssmExe = Get-ChildItem $nssmDir -Recurse -Filter "nssm.exe" | 
                Where-Object { $_.FullName -match "win64" } | 
                Select-Object -First 1
            
            if ($nssmExe) {
                # Copy to a location in PATH
                Copy-Item $nssmExe.FullName -Destination "C:\Windows\nssm.exe" -Force
                $env:Path += ";C:\Windows"
                Write-Host "  OK - NSSM installed" -ForegroundColor Green
            } else {
                Write-Host "  ERROR: Could not find nssm.exe in archive" -ForegroundColor Red
            }
            
            Remove-Item $nssmZip -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Host "  ERROR: NSSM download/install failed: $_" -ForegroundColor Red
            Write-Host "  Install NSSM manually: https://nssm.cc/download" -ForegroundColor Gray
        }
    }
    
    $nssmCmd = Get-Command nssm -ErrorAction SilentlyContinue
    if ($nssmCmd) {
        $serviceName = "SAM"
        $nodeExe = (Get-Command node).Source
        $appDir = $scriptDir
        
        # Remove existing service if present
        & nssm stop $serviceName 2>$null
        & nssm remove $serviceName confirm 2>$null
        
        # Install service
        & nssm install $serviceName $nodeExe "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" "start" "--prefix" $appDir
        & nssm set $serviceName AppDirectory $appDir
        & nssm set $serviceName AppEnvironmentExtra DATABASE_URL=$dbPath NEXTAUTH_SECRET=$authSecret NEXTAUTH_URL="http://localhost:$Port"
        & nssm set $serviceName DisplayName "SAM - Software Asset Management"
        & nssm set $serviceName Description "Software Asset Management web application"
        & nssm set $serviceName Start SERVICE_AUTO_START
        & nssm set $serviceName AppStdout "$appDir\logs\service-stdout.log"
        & nssm set $serviceName AppStderr "$appDir\logs\service-stderr.log"
        
        # Create logs directory
        $logsDir = Join-Path $appDir "logs"
        if (-not (Test-Path $logsDir)) {
            New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
        }
        
        Write-Host "  OK - Windows Service '$serviceName' registered" -ForegroundColor Green
        Write-Host "  Start service: net start $serviceName" -ForegroundColor Gray
        Write-Host "  Stop service:  net stop $serviceName" -ForegroundColor Gray
        Write-Host "  Or use:        nssm start $serviceName" -ForegroundColor Gray
    }
}

# ─── Done ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Quick Start:" -ForegroundColor White
Write-Host "    cd $scriptDir" -ForegroundColor Gray
Write-Host "    npm run start          (production)" -ForegroundColor Gray
Write-Host "    npm run dev            (development)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Access:     http://localhost:$Port" -ForegroundColor Cyan
Write-Host "  Login:      john@doe.com / johndoe123" -ForegroundColor Cyan
Write-Host ""
if (-not $SetupService) {
    Write-Host "  To install as Windows Service, re-run with -SetupService" -ForegroundColor Yellow
    Write-Host "    .\install.ps1 -SetupService" -ForegroundColor Yellow
    Write-Host ""
}
Write-Host "  PowerShell Scripts:" -ForegroundColor White
Write-Host "    .\start.ps1           Start the app" -ForegroundColor Gray
Write-Host "    .\stop.ps1            Stop all Node processes on port $Port" -ForegroundColor Gray
Write-Host ""
